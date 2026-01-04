import { describe, it, expect } from 'vitest';
import { consecutiveNightConstraint } from '../consecutiveNight';
import type { ConstraintContext } from '../types';
import type { Schedule, Staff, ConstraintConfig, ShiftAssignment } from '@/types';

function createTestContext(
  assignments: ShiftAssignment[],
  previousPeriodEnd: ShiftAssignment[] = [],
  maxConsecutiveNights = 4
): ConstraintContext {
  const schedule: Schedule = {
    id: 'test-schedule',
    name: 'Test Schedule',
    startDate: '2025-01-06', // Monday
    assignments,
  };

  const staff: Staff[] = [{ id: 'staff-1', name: '홍길동', juhuDay: 0 }];

  const config: ConstraintConfig = {
    maxConsecutiveNights,
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

  return { schedule, staff, config, previousPeriodEnd, scheduleCompleteness: 1 };
}

describe('consecutiveNightConstraint', () => {
  it('should pass when consecutive nights <= max', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'OFF' },
    ]);

    const result = consecutiveNightConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect 5 consecutive nights (exceeds max 4)', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'N' },
    ]);

    const result = consecutiveNightConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('연속 5일 나이트 근무');
    expect(result.violations[0].message).toContain('최대 4일');
  });

  it('should detect boundary violation: 2 nights in prev + 3 in current = 5', () => {
    const previousPeriodEnd: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-04', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-05', shift: 'N' },
    ];

    const context = createTestContext(
      [
        { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
        { staffId: 'staff-1', date: '2025-01-07', shift: 'N' },
        { staffId: 'staff-1', date: '2025-01-08', shift: 'N' },
      ],
      previousPeriodEnd
    );

    const result = consecutiveNightConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('연속 5일 나이트 근무');
  });

  it('should respect custom maxConsecutiveNights config', () => {
    const context = createTestContext(
      [
        { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
        { staffId: 'staff-1', date: '2025-01-07', shift: 'N' },
        { staffId: 'staff-1', date: '2025-01-08', shift: 'N' },
      ],
      [],
      2 // max 2 consecutive nights
    );

    const result = consecutiveNightConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('최대 2일');
  });

  it('should reset counter after non-night shift', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-10', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-11', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-12', shift: 'N' },
    ]);

    const result = consecutiveNightConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
