import { describe, it, expect } from 'vitest';
import { staffingConstraint } from '../staffing';
import type { ConstraintContext } from '../types';
import type { Schedule, Staff, ConstraintConfig, ShiftAssignment } from '@/types';

function createTestContext(
  assignments: ShiftAssignment[],
  staffList: Staff[] = []
): ConstraintContext {
  const schedule: Schedule = {
    id: 'test-schedule',
    name: 'Test Schedule',
    startDate: '2025-01-06', // Monday
    assignments,
  };

  const staff: Staff[] = staffList.length
    ? staffList
    : [
        { id: 'staff-1', name: '홍길동', juhuDay: 0 },
        { id: 'staff-2', name: '김철수', juhuDay: 1 },
      ];

  const config: ConstraintConfig = {
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

describe('staffingConstraint', () => {
  it('should pass when staffing meets requirements', () => {
    const context = createTestContext([
      // Monday (weekday): D=1, E=2, N=1 required
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' },
      { staffId: 'staff-2', date: '2025-01-06', shift: 'E' },
      { staffId: 'staff-3', date: '2025-01-06', shift: 'E' },
      { staffId: 'staff-4', date: '2025-01-06', shift: 'N' },
    ]);

    const result = staffingConstraint.check(context);

    // Only checking for the one day we set up
    const violationsForDay = result.violations.filter(
      (v) => v.context.date === '2025-01-06'
    );
    expect(violationsForDay).toHaveLength(0);
  });

  it('should detect insufficient day shift staffing', () => {
    const context = createTestContext([
      // Monday (weekday): D=1 required, but none assigned
      { staffId: 'staff-1', date: '2025-01-06', shift: 'E' },
      { staffId: 'staff-2', date: '2025-01-06', shift: 'E' },
      { staffId: 'staff-3', date: '2025-01-06', shift: 'N' },
    ]);

    const result = staffingConstraint.check(context);

    const dayViolation = result.violations.find(
      (v) => v.context.date === '2025-01-06' && v.message.includes('데이')
    );
    expect(dayViolation).toBeDefined();
    expect(dayViolation?.message).toContain('데이 근무 0명');
    expect(dayViolation?.message).toContain('최소 1명');
  });

  it('should detect insufficient evening shift staffing', () => {
    const context = createTestContext([
      // Monday (weekday): E=2 required, only 1 assigned
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' },
      { staffId: 'staff-2', date: '2025-01-06', shift: 'E' },
      { staffId: 'staff-3', date: '2025-01-06', shift: 'N' },
    ]);

    const result = staffingConstraint.check(context);

    const eveningViolation = result.violations.find(
      (v) => v.context.date === '2025-01-06' && v.message.includes('이브닝')
    );
    expect(eveningViolation).toBeDefined();
    expect(eveningViolation?.message).toContain('이브닝 근무 1명');
    expect(eveningViolation?.message).toContain('최소 2명');
  });

  it('should apply weekend staffing requirements on weekends', () => {
    // Saturday 2025-01-11 requires D=2, E=2, N=2
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-11', shift: 'D' }, // Only 1 D
      { staffId: 'staff-2', date: '2025-01-11', shift: 'E' },
      { staffId: 'staff-3', date: '2025-01-11', shift: 'E' },
      { staffId: 'staff-4', date: '2025-01-11', shift: 'N' },
      { staffId: 'staff-5', date: '2025-01-11', shift: 'N' },
    ]);

    const result = staffingConstraint.check(context);

    const weekendDayViolation = result.violations.find(
      (v) => v.context.date === '2025-01-11' && v.message.includes('데이')
    );
    expect(weekendDayViolation).toBeDefined();
    expect(weekendDayViolation?.message).toContain('최소 2명');
  });

  it('should have error severity', () => {
    const context = createTestContext([]);
    const result = staffingConstraint.check(context);

    expect(result.violations[0].severity).toBe('error');
  });

  it('should not count OFF as staffed', () => {
    const context = createTestContext([
      { staffId: 'staff-1', date: '2025-01-06', shift: 'OFF' },
      { staffId: 'staff-2', date: '2025-01-06', shift: 'OFF' },
    ]);

    const result = staffingConstraint.check(context);

    const violations = result.violations.filter(
      (v) => v.context.date === '2025-01-06'
    );
    expect(violations.length).toBe(3); // All three shifts should be understaffed
  });
});
