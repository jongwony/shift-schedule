import { describe, it, expect } from 'vitest';
import { dayShiftFairnessConstraint } from '../dayShiftFairness';
import type { ConstraintContext } from '../types';
import type { Schedule, Staff, ConstraintConfig, ShiftAssignment } from '@/types';

function createTestContext(
  assignments: ShiftAssignment[],
  staffList?: Staff[],
  enabled: boolean = true
): ConstraintContext {
  const schedule: Schedule = {
    id: 'test-schedule',
    name: 'Test Schedule',
    startDate: '2025-01-06', // Monday
    assignments,
  };

  const staff: Staff[] = staffList ?? [
    { id: 'staff-1', name: '연혜경' },
    { id: 'staff-2', name: '김지원' },
  ];

  const config: ConstraintConfig = {
    maxConsecutiveNights: 4,
    weeklyWorkHours: 40,
    weeklyStaffing: Array.from({ length: 4 }, () => ({
      weekday: {
        day: { min: 1, max: 2 },
        evening: { min: 1, max: 2 },
        night: { min: 1, max: 2 },
      },
      friday: {
        day: { min: 1, max: 2 },
        evening: { min: 1, max: 2 },
        night: { min: 1, max: 2 },
      },
      weekend: {
        day: { min: 1, max: 2 },
        evening: { min: 1, max: 2 },
        night: { min: 1, max: 2 },
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
      maxConsecutiveWork: { enabled: true, maxDays: 5 },
      nightBlockPolicy: { enabled: true, minBlockSize: 2 },
      maxPeriodOff: { enabled: true, maxOff: 9 },
      maxConsecutiveOff: { enabled: true, maxDays: 2 },
      gradualShiftProgression: { enabled: true },
      maxSameShiftConsecutive: { enabled: true },
      restClustering: { enabled: true },
      postRestDayShift: { enabled: true },
      weekendFairness: { enabled: true },
      dayShiftFairness: { enabled },
      shiftContinuity: { enabled: true },
    },
  };

  return { schedule, staff, config, previousPeriodEnd: [], scheduleCompleteness: 1 };
}

// Helper: build N day-shift assignments for a staff starting at the period start
function buildDayShifts(staffId: string, count: number): ShiftAssignment[] {
  const dates = [
    '2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09', '2025-01-10',
    '2025-01-11', '2025-01-12', '2025-01-13', '2025-01-14', '2025-01-15',
    '2025-01-16', '2025-01-17', '2025-01-18', '2025-01-19', '2025-01-20',
  ];
  return dates.slice(0, count).map((date) => ({ staffId, date, shift: 'D' as const }));
}

describe('dayShiftFairnessConstraint', () => {
  it('should pass when day shift distribution is balanced', () => {
    // Both staff have the same number of D shifts (4 each)
    const assignments: ShiftAssignment[] = [
      ...buildDayShifts('staff-1', 4),
      ...buildDayShifts('staff-2', 4),
    ];

    const context = createTestContext(assignments);
    const result = dayShiftFairnessConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect when one staff has many more day shifts than others', () => {
    // staff-1 has 10 D shifts, staff-2 has 0 → average 5, deviation 5 > 2
    const assignments: ShiftAssignment[] = [
      ...buildDayShifts('staff-1', 10),
    ];

    const context = createTestContext(assignments);
    const result = dayShiftFairnessConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].constraintId).toBe('day-shift-fairness');
    expect(result.violations[0].context?.staffId).toBe('staff-1');
  });

  it('should not run when disabled', () => {
    const assignments: ShiftAssignment[] = [
      ...buildDayShifts('staff-1', 10),
    ];

    const context = createTestContext(assignments, undefined, false);
    const result = dayShiftFairnessConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should only count D shifts, not E/N', () => {
    // staff-1 works many E/N but few D; staff-2 also few D → no D fairness violation
    const eveningNights: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'D' },
      { staffId: 'staff-2', date: '2025-01-06', shift: 'D' },
    ];

    const context = createTestContext(eveningNights);
    const result = dayShiftFairnessConstraint.check(context);

    // staff-1: 1 D, staff-2: 1 D → balanced, no violation despite heavy E/N load
    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
