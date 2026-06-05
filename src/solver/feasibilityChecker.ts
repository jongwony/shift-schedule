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

  // Check if staffing requirements are achievable (per week)
  const { weeklyStaffing } = config;

  for (let week = 0; week < weeklyStaffing.length; week++) {
    const { weekday, friday, weekend } = weeklyStaffing[week];
    const weekLabel = `${week + 1}주차`;

    const minWeekdayTotal =
      weekday.day.min + weekday.evening.min + weekday.night.min;
    const minFridayTotal =
      friday.day.min + friday.evening.min + friday.night.min;
    const minWeekendTotal =
      weekend.day.min + weekend.evening.min + weekend.night.min;

    if (minWeekdayTotal > staffCount) {
      warnings.push(
        `${weekLabel} 평일 최소 인원 합계(${minWeekdayTotal}명)가 총 직원 수(${staffCount}명)를 초과합니다.`
      );
    }

    if (minFridayTotal > staffCount) {
      warnings.push(
        `${weekLabel} 금요일 최소 인원 합계(${minFridayTotal}명)가 총 직원 수(${staffCount}명)를 초과합니다.`
      );
    }

    if (minWeekendTotal > staffCount) {
      warnings.push(
        `${weekLabel} 주말 최소 인원 합계(${minWeekendTotal}명)가 총 직원 수(${staffCount}명)를 초과합니다.`
      );
    }
  }

  // Basic sanity check: consecutive night limit
  if (config.maxConsecutiveNights < 1) {
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
    weeklyWorkHours: 40,
    weeklyStaffing: Array.from({ length: 4 }, () => ({
      weekday: {
        day: { min: 1, max: 2 },
        evening: { min: 2, max: 2 },
        night: { min: 1, max: 2 },
      },
      friday: {
        day: { min: 1, max: 2 },
        evening: { min: 2, max: 2 },
        night: { min: 1, max: 2 },
      },
      weekend: {
        day: { min: 2, max: 2 },
        evening: { min: 2, max: 2 },
        night: { min: 2, max: 2 },
      },
    })),
    enabledConstraints: {
      shiftOrder: true,
      nightOffDay: true,
      consecutiveNight: true,
      staffing: true,
      weeklyOff: true,
      juhu: true,
    },
    constraintSeverity: {
      shiftOrder: 'hard',
      nightOffDay: 'hard',
      consecutiveNight: 'hard',
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
      dayShiftFairness: { enabled: true },
      shiftContinuity: { enabled: true },
    },
  };
}
