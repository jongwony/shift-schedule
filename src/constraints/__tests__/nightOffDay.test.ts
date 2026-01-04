import { describe, it, expect } from 'vitest';
import { nightOffDayConstraint } from '../nightOffDay';
import type { ConstraintContext } from '../types';
import type { Schedule, Staff, ConstraintConfig, ShiftAssignment } from '@/types';

function createTestContext(
  assignments: ShiftAssignment[],
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

describe('nightOffDayConstraint', () => {
  it('should pass when no N→OFF→D pattern exists', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'OFF' }, // Two OFFs, not N→OFF→D
      { staffId: 'staff-1', date: '2025-01-09', shift: 'D' },
    ]);

    const result = nightOffDayConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect N→OFF→D pattern within current period', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'D' },
    ]);

    const result = nightOffDayConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('N→Off→D 패턴 (법적 불가)');
    expect(result.violations[0].severity).toBe('error');
  });

  it('should detect boundary case: N in prev period, OFF→D in current', () => {
    const previousPeriodEnd: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-05', shift: 'N' },
    ];

    const context = createTestContext(
      [
        { staffId: 'staff-1', date: '2025-01-06', shift: 'OFF' },
        { staffId: 'staff-1', date: '2025-01-07', shift: 'D' },
      ],
      previousPeriodEnd
    );

    const result = nightOffDayConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].context.dates).toContain('2025-01-05');
    expect(result.violations[0].context.dates).toContain('2025-01-07');
  });

  it('should detect boundary case: N→OFF in prev period, D in current', () => {
    const previousPeriodEnd: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-04', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-05', shift: 'OFF' },
    ];

    const context = createTestContext(
      [{ staffId: 'staff-1', date: '2025-01-06', shift: 'D' }],
      previousPeriodEnd
    );

    const result = nightOffDayConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
  });

  it('should allow N→OFF→E pattern', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'E' },
    ]);

    const result = nightOffDayConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
