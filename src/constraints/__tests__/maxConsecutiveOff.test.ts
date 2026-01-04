import { describe, it, expect } from 'vitest';
import { maxConsecutiveOffConstraint } from '../maxConsecutiveOff';
import type { ConstraintContext } from '../types';
import type { Schedule, Staff, ConstraintConfig, ShiftAssignment } from '@/types';

function createTestContext(
  assignments: ShiftAssignment[],
  maxDays: number = 2,
  enabled: boolean = true,
  previousPeriodEnd: ShiftAssignment[] = []
): ConstraintContext {
  const schedule: Schedule = {
    id: 'test-schedule',
    name: 'Test Schedule',
    startDate: '2025-01-06', // Monday
    assignments,
  };

  const staff: Staff[] = [{ id: 'staff-1', name: '홍길동', juhuDay: 0 }];

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
      juhu: true,
      weeklyOff: true,
    },
    constraintSeverity: {
      shiftOrder: 'hard',
      nightOffDay: 'hard',
      consecutiveNight: 'hard',
      monthlyNight: 'soft',
      staffing: 'hard',
      juhu: 'hard',
      weeklyOff: 'hard',
    },
    softConstraints: {
      maxConsecutiveWork: { enabled: true, maxDays: 5 },
      nightBlockPolicy: { enabled: true, minBlockSize: 2 },
      maxPeriodOff: { enabled: true, maxOff: 9 },
      maxConsecutiveOff: { enabled, maxDays },
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

describe('maxConsecutiveOffConstraint', () => {
  it('should pass when consecutive OFF is within limit', () => {
    // 2 consecutive OFF days (within default 2 limit)
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'D' },
    ];

    const context = createTestContext(assignments, 2);
    const result = maxConsecutiveOffConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect when consecutive OFF exceeds limit', () => {
    // 3 consecutive OFF days (exceeds default 2 limit)
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'D' },
    ];

    const context = createTestContext(assignments, 2);
    const result = maxConsecutiveOffConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations[0].message).toContain('연속 3일 OFF');
    expect(result.violations[0].message).toContain('권장 2일');
    expect(result.violations[0].severity).toBe('warning');
  });

  it('should respect custom maxDays parameter', () => {
    // 4 consecutive OFF days with maxDays=3 limit
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'D' },
    ];

    const context = createTestContext(assignments, 3);
    const result = maxConsecutiveOffConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations[0].message).toContain('권장 3일');
  });

  it('should skip check when disabled', () => {
    // 5 consecutive OFF days but constraint is disabled
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'OFF' },
    ];

    const context = createTestContext(assignments, 2, false);
    const result = maxConsecutiveOffConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should consider previous period end for continuity', () => {
    // 2 OFF days in previous period + 2 OFF days in current = 4 consecutive
    const previousPeriodEnd: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-04', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-05', shift: 'OFF' },
    ];
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'D' },
    ];

    const context = createTestContext(assignments, 2, true, previousPeriodEnd);
    const result = maxConsecutiveOffConstraint.check(context);

    expect(result.satisfied).toBe(false);
    // Should detect 3, 4 consecutive OFF (from previous period continuation)
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should handle non-consecutive OFF days correctly', () => {
    // OFF days with work days in between
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'OFF' },
    ];

    const context = createTestContext(assignments, 2);
    const result = maxConsecutiveOffConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should report violations progressively as OFF streak grows', () => {
    // 5 consecutive OFF days should report violations at 3rd, 4th, and 5th day
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-11', shift: 'D' },
    ];

    const context = createTestContext(assignments, 2);
    const result = maxConsecutiveOffConstraint.check(context);

    expect(result.satisfied).toBe(false);
    // Should have violations for days 3, 4, and 5
    expect(result.violations.length).toBe(3);
  });
});
