import { describe, it, expect } from 'vitest';
import { maxConsecutiveWorkConstraint } from '../maxConsecutiveWork';
import type { ConstraintContext } from '../types';
import type { Schedule, Staff, ConstraintConfig, ShiftAssignment } from '@/types';

function createTestContext(
  assignments: ShiftAssignment[],
  maxDays: number = 5,
  enabled: boolean = true,
  previousPeriodEnd: ShiftAssignment[] = []
): ConstraintContext {
  const schedule: Schedule = {
    id: 'test-schedule',
    name: 'Test Schedule',
    startDate: '2025-01-06', // Monday
    assignments,
  };

  const staff: Staff[] = [{ id: 'staff-1', name: '연혜경' }];

  const config: ConstraintConfig = {
    maxConsecutiveNights: 4,
    monthlyNightsRequired: 7,
    weeklyWorkHours: 40,
    weekdayStaffing: {
      day: { min: 1, max: 2 },
      evening: { min: 1, max: 2 },
      night: { min: 1, max: 2 },
    },
    weekendStaffing: {
      day: { min: 1, max: 2 },
      evening: { min: 1, max: 2 },
      night: { min: 1, max: 2 },
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
      maxConsecutiveWork: { enabled, maxDays },
      nightBlockPolicy: { enabled: true, minBlockSize: 2 },
      maxPeriodOff: { enabled: true, maxOff: 9 },
      maxConsecutiveOff: { enabled: true, maxDays: 2 },
      gradualShiftProgression: { enabled: true },
      maxSameShiftConsecutive: { enabled: true },
      restClustering: { enabled: true },
      postRestDayShift: { enabled: true },
      weekendFairness: { enabled: true },
      shiftContinuity: { enabled: true },
    },
  };

  return { schedule, staff, config, previousPeriodEnd, scheduleCompleteness: 1 };
}

describe('maxConsecutiveWorkConstraint', () => {
  it('should pass when consecutive work days within limit', () => {
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-11', shift: 'OFF' }, // Break
    ];

    const context = createTestContext(assignments, 5);
    const result = maxConsecutiveWorkConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect when consecutive work days exceed limit', () => {
    // 6 consecutive work days (exceeds 5 limit)
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-11', shift: 'N' }, // Day 6 - exceeds limit
    ];

    const context = createTestContext(assignments, 5);
    const result = maxConsecutiveWorkConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].message).toContain('연속 6일 근무');
  });

  it('should not run when disabled', () => {
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-11', shift: 'N' },
    ];

    const context = createTestContext(assignments, 5, false); // disabled
    const result = maxConsecutiveWorkConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  // 연혜경 시나리오: 이전 기간 5일 근무 + 현재 기간 2일 근무 = 7일 연속
  it('should detect boundary violation: 5 work days in prev + 2 in current = 7', () => {
    // Previous period: OFF, OFF, D, E, E, E, N (5 consecutive work days at end)
    const previousPeriodEnd: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2024-12-30', shift: 'OFF' },
      { staffId: 'staff-1', date: '2024-12-31', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-01', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-02', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-03', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-04', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-05', shift: 'N' },
    ];

    // Current period starts 2025-01-06, first 2 days are work
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'OFF' },
    ];

    const context = createTestContext(assignments, 5, true, previousPeriodEnd);
    const result = maxConsecutiveWorkConstraint.check(context);

    // Should detect violations for day 6 and day 7
    expect(result.satisfied).toBe(false);
    expect(result.violations.length).toBeGreaterThanOrEqual(2);

    // First violation should be day 6 (2025-01-06)
    expect(result.violations[0].message).toContain('연속 6일 근무');

    // Second violation should be day 7 (2025-01-07)
    expect(result.violations[1].message).toContain('연속 7일 근무');
  });

  it('should count trailing work days correctly from previous period', () => {
    // Previous period: only last 3 days are work
    const previousPeriodEnd: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-03', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-04', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-05', shift: 'N' },
    ];

    // Current period: 3 work days = total 6 consecutive (3 prev + 3 current)
    // Violations: day 6 only (first day exceeding limit)
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' }, // Day 4
      { staffId: 'staff-1', date: '2025-01-07', shift: 'E' }, // Day 5
      { staffId: 'staff-1', date: '2025-01-08', shift: 'N' }, // Day 6 - exceeds!
      { staffId: 'staff-1', date: '2025-01-09', shift: 'OFF' },
    ];

    const context = createTestContext(assignments, 5, true, previousPeriodEnd);
    const result = maxConsecutiveWorkConstraint.check(context);

    expect(result.satisfied).toBe(false);
    // Only day 6 (01-08) should be a violation
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].context?.date).toBe('2025-01-08');
    expect(result.violations[0].message).toContain('연속 6일 근무');
  });

  it('should stop counting at OFF day in previous period', () => {
    // Previous period: OFF on day -2 breaks the chain
    const previousPeriodEnd: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-03', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-04', shift: 'OFF' }, // Break
      { staffId: 'staff-1', date: '2025-01-05', shift: 'N' },
    ];

    // Current period: 5 work days = total 6 (1 from prev + 5 current)
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-11', shift: 'OFF' },
    ];

    const context = createTestContext(assignments, 5, true, previousPeriodEnd);
    const result = maxConsecutiveWorkConstraint.check(context);

    // Only 1 day from prev (01-05) + 5 days current = 6 consecutive
    // Violation should be on day 6 (2025-01-10)
    expect(result.satisfied).toBe(false);
    expect(result.violations.length).toBe(1);
    expect(result.violations[0].context?.date).toBe('2025-01-10');
  });
});
