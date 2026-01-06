import type {
  Schedule,
  ShiftAssignment,
  Staff,
  ConstraintConfig,
  FeasibilityResult,
  Violation,
} from '@/types';
import { constraintRegistry } from '@/constraints';
import type { ConstraintContext } from '@/constraints';
import { calculateScheduleCompleteness } from '@/utils/shiftUtils';

type ConstraintId = keyof ConstraintConfig['enabledConstraints'];

/**
 * Check the feasibility of a schedule against all enabled constraints.
 */
export function checkFeasibility(
  schedule: Schedule,
  staff: Staff[],
  config: ConstraintConfig,
  previousPeriodEnd: ShiftAssignment[] = []
): FeasibilityResult {
  const violations: Violation[] = [];

  const scheduleCompleteness = calculateScheduleCompleteness(
    schedule.assignments,
    staff.length,
    28
  );

  const context: ConstraintContext = {
    schedule,
    staff,
    config,
    previousPeriodEnd,
    scheduleCompleteness,
  };

  for (const constraint of constraintRegistry) {
    // Check if this constraint is enabled
    const constraintKey = constraintIdToConfigKey(constraint.id);
    if (constraintKey && !config.enabledConstraints[constraintKey]) {
      continue;
    }

    const result = constraint.check(context);
    violations.push(...result.violations);
  }

  // Feasible if no 'error' severity violations
  const feasible = !violations.some((v) => v.severity === 'error');

  return {
    feasible,
    violations,
    checkedAt: new Date().toISOString(),
  };
}

/**
 * Map constraint ID to config key.
 */
function constraintIdToConfigKey(id: string): ConstraintId | null {
  const mapping: Record<string, ConstraintId> = {
    'shift-order': 'shiftOrder',
    'night-off-day': 'nightOffDay',
    'consecutive-night': 'consecutiveNight',
    'monthly-night': 'monthlyNight',
    staffing: 'staffing',
    'weekly-off': 'weeklyOff',
  };
  return mapping[id] ?? null;
}

/**
 * Pre-validation: Check if the configuration is consistent with the staff count.
 * Returns an array of warning messages if there are issues.
 */
export function validateConfigConsistency(
  config: ConstraintConfig,
  staffCount: number
): string[] {
  const warnings: string[] = [];

  if (staffCount === 0) {
    warnings.push('직원이 등록되지 않았습니다.');
    return warnings;
  }

  // Check if staffing requirements are achievable
  const { weekdayStaffing, weekendStaffing } = config;

  // Minimum total staff needed per day (sum of minimums for all shifts)
  const minWeekdayTotal =
    weekdayStaffing.day.min +
    weekdayStaffing.evening.min +
    weekdayStaffing.night.min;
  const minWeekendTotal =
    weekendStaffing.day.min +
    weekendStaffing.evening.min +
    weekendStaffing.night.min;

  // Each staff member can only work one shift per day
  if (minWeekdayTotal > staffCount) {
    warnings.push(
      `평일 최소 인원 합계(${minWeekdayTotal}명)가 총 직원 수(${staffCount}명)를 초과합니다.`
    );
  }

  if (minWeekendTotal > staffCount) {
    warnings.push(
      `주말 최소 인원 합계(${minWeekendTotal}명)가 총 직원 수(${staffCount}명)를 초과합니다.`
    );
  }

  // Check if monthly night requirement is feasible
  // 28 days * nightsPerDay should be distributable among staff
  const { monthlyNightsRequired, maxConsecutiveNights } = config;
  const minNightStaffPerDay = Math.min(
    weekdayStaffing.night.min,
    weekendStaffing.night.min
  );

  // Total night shifts needed over 28 days (minimum)
  // Assuming 20 weekdays and 8 weekend days as rough estimate
  const totalNightShiftsNeeded = minNightStaffPerDay * 28;

  // Total night shifts available from all staff
  const totalNightShiftsAvailable = staffCount * monthlyNightsRequired;

  if (totalNightShiftsNeeded > totalNightShiftsAvailable) {
    warnings.push(
      `필요한 나이트 근무 총합(${totalNightShiftsNeeded}회)이 ` +
        `가용 인력(${staffCount}명 × ${monthlyNightsRequired}회 = ${totalNightShiftsAvailable}회)을 초과합니다.`
    );
  }

  // Check if consecutive night limit allows monthly requirement
  // With max 4 consecutive nights, staff needs at least ceil(7/4) = 2 "runs" of night shifts
  // This is just a basic sanity check
  if (maxConsecutiveNights < 1) {
    warnings.push('연속 나이트 최대 일수는 최소 1일 이상이어야 합니다.');
  }

  return warnings;
}

/**
 * Get the default constraint configuration.
 */
export function getDefaultConfig(): ConstraintConfig {
  return {
    maxConsecutiveNights: 4,
    monthlyNightsRequired: 7,
    weeklyWorkHours: 40,
    weekdayStaffing: {
      day: { min: 1, max: 2 },
      evening: { min: 2, max: 2 },
      night: { min: 1, max: 2 },
    },
    weekendStaffing: {
      day: { min: 2, max: 2 },
      evening: { min: 2, max: 2 },
      night: { min: 2, max: 2 },
    },
    enabledConstraints: {
      shiftOrder: true,
      nightOffDay: true,
      consecutiveNight: true,
      monthlyNight: true,
      staffing: true,
      weeklyOff: true,
    },
    constraintSeverity: {
      shiftOrder: 'hard',
      nightOffDay: 'hard',
      consecutiveNight: 'hard',
      monthlyNight: 'soft',
      staffing: 'hard',
      weeklyOff: 'hard',
    },
    softConstraints: {
      // Tier 1 - Worker perspective
      maxConsecutiveWork: { enabled: true, maxDays: 5 },
      nightBlockPolicy: { enabled: true, minBlockSize: 2 },
      // Tier 1 - Manager perspective
      maxPeriodOff: { enabled: false, maxOff: 9 },
      maxConsecutiveOff: { enabled: false, maxDays: 2 },
      // Tier 2 - Recovery
      gradualShiftProgression: { enabled: true },
      maxSameShiftConsecutive: { enabled: true },
      restClustering: { enabled: true },
      postRestDayShift: { enabled: true },
      // Tier 3 - Quality of life
      weekendFairness: { enabled: true },
      shiftContinuity: { enabled: true },
    },
  };
}
