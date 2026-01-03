import { describe, it, expect } from 'vitest';
import { shiftOrderConstraint } from '../shiftOrder';
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
  };

  return { schedule, staff, config, previousPeriodEnd, scheduleCompleteness: 1 };
}

describe('shiftOrderConstraint', () => {
  it('should pass when no forbidden transitions exist', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'OFF' },
    ]);

    const result = shiftOrderConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect N→D forbidden transition', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'D' },
    ]);

    const result = shiftOrderConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('N→D 역순 전이');
  });

  it('should detect N→E forbidden transition', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'E' },
    ]);

    const result = shiftOrderConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('N→E 역순 전이');
  });

  it('should detect E→D forbidden transition', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'E' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'D' },
    ]);

    const result = shiftOrderConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('E→D 역순 전이');
  });

  it('should detect boundary violation from previous period', () => {
    const previousPeriodEnd: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-05', shift: 'N' },
    ];

    const context = createTestContext(
      [{ staffId: 'staff-1', date: '2025-01-06', shift: 'D' }],
      previousPeriodEnd
    );

    const result = shiftOrderConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('N→D 역순 전이');
  });

  it('should allow OFF transitions', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'N' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'D' },
    ]);

    const result = shiftOrderConstraint.check(context);

    // N→OFF is allowed, OFF→D is allowed
    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
