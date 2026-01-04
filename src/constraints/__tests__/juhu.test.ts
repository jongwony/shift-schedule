import { describe, it, expect } from 'vitest';
import { juhuConstraint } from '../juhu';
import type { ConstraintContext } from '../types';
import type { Schedule, Staff, ConstraintConfig, ShiftAssignment, DayOfWeek } from '@/types';

function createTestContext(
  assignments: ShiftAssignment[],
  juhuDay: DayOfWeek = 0 // Sunday
): ConstraintContext {
  const schedule: Schedule = {
    id: 'test-schedule',
    name: 'Test Schedule',
    startDate: '2025-01-06', // Monday
    assignments,
  };

  const staff: Staff[] = [{ id: 'staff-1', name: '홍길동', juhuDay }];

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
      maxPeriodOff: { enabled: false, maxOff: 9 },
      maxConsecutiveOff: { enabled: false, maxDays: 2 },
      gradualShiftProgression: { enabled: true },
      maxSameShiftConsecutive: { enabled: true },
      restClustering: { enabled: true },
      postRestDayShift: { enabled: true },
      weekendFairness: { enabled: true },
      shiftContinuity: { enabled: true },
    },
  };

  return { schedule, staff, config, previousPeriodEnd: [], scheduleCompleteness: 1 };
}

describe('juhuConstraint', () => {
  it('should pass when all juhu days have OFF assignment', () => {
    // Start: 2025-01-06 (Monday), Sunday=0 juhuDay
    // Sundays in 4 weeks: 1/12, 1/19, 1/26, 2/2
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-12', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-19', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-26', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-02-02', shift: 'OFF' },
    ]);

    const result = juhuConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect work assigned on juhu day', () => {
    // Sunday juhuDay, but working on 1/12 (Sunday)
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-12', shift: 'D' }, // Violation!
      { staffId: 'staff-1', date: '2025-01-19', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-26', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-02-02', shift: 'OFF' },
    ]);

    const result = juhuConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('홍길동');
    expect(result.violations[0].message).toContain('주휴일 위반');
    expect(result.violations[0].severity).toBe('error'); // default severity is hard
  });

  it('should work with different juhu days', () => {
    // Wednesday juhuDay (3)
    // Wednesdays in 4 weeks from 1/6: 1/8, 1/15, 1/22, 1/29
    const context = createTestContext(
      [
        { staffId: 'staff-1', date: '2025-01-08', shift: 'E' }, // Violation!
        { staffId: 'staff-1', date: '2025-01-15', shift: 'OFF' },
        { staffId: 'staff-1', date: '2025-01-22', shift: 'OFF' },
        { staffId: 'staff-1', date: '2025-01-29', shift: 'OFF' },
      ],
      3 // Wednesday
    );

    const result = juhuConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].context.date).toBe('2025-01-08');
  });

  it('should detect multiple juhu day violations', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-12', shift: 'D' }, // Violation 1
      { staffId: 'staff-1', date: '2025-01-19', shift: 'N' }, // Violation 2
      { staffId: 'staff-1', date: '2025-01-26', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-02-02', shift: 'E' }, // Violation 3
    ]);

    const result = juhuConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(3);
  });

  it('should not report violation if no assignment on juhu day', () => {
    // No assignment at all on Sundays - this is OK (unassigned != work)
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'E' },
    ]);

    const result = juhuConstraint.check(context);

    // No violation because juhu days have no assignment (treated as not-yet-assigned)
    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
