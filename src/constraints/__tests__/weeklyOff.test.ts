import { describe, it, expect } from 'vitest';
import { weeklyOffConstraint } from '../weeklyOff';
import type { ConstraintContext } from '../types';
import type { Schedule, Staff, ConstraintConfig, ShiftAssignment } from '@/types';

function createTestContext(
  assignments: ShiftAssignment[],
  weeklyWorkHours = 40,
  scheduleCompleteness = 1
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
    weeklyWorkHours,
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

  return { schedule, staff, config, previousPeriodEnd: [], scheduleCompleteness };
}

/**
 * Helper to create a full week of assignments with specified OFF days.
 */
function createWeekAssignments(
  weekIndex: number,
  offDayIndices: number[] // 0-6 for Mon-Sun
): ShiftAssignment[] {
  const assignments: ShiftAssignment[] = [];
  const baseDate = new Date('2025-01-06'); // Monday

  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(baseDate);
    dayDate.setDate(baseDate.getDate() + weekIndex * 7 + d);
    const dateStr = dayDate.toISOString().split('T')[0];

    assignments.push({
      staffId: 'staff-1',
      date: dateStr,
      shift: offDayIndices.includes(d) ? 'OFF' : 'D',
    });
  }
  return assignments;
}

describe('weeklyOffConstraint', () => {
  it('should pass when all weeks have >= 2 OFF days (40h = 2 OFF)', () => {
    const assignments = [
      ...createWeekAssignments(0, [5, 6]), // Week 1: Sat, Sun OFF
      ...createWeekAssignments(1, [5, 6]), // Week 2: Sat, Sun OFF
      ...createWeekAssignments(2, [5, 6]), // Week 3: Sat, Sun OFF
      ...createWeekAssignments(3, [5, 6]), // Week 4: Sat, Sun OFF
    ];

    const context = createTestContext(assignments, 40);
    const result = weeklyOffConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should fail when a week has only 1 OFF day', () => {
    const assignments = [
      ...createWeekAssignments(0, [5, 6]), // Week 1: 2 OFF ✓
      ...createWeekAssignments(1, [6]),    // Week 2: 1 OFF ✗
      ...createWeekAssignments(2, [5, 6]), // Week 3: 2 OFF ✓
      ...createWeekAssignments(3, [5, 6]), // Week 4: 2 OFF ✓
    ];

    const context = createTestContext(assignments, 40);
    const result = weeklyOffConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].constraintId).toBe('weekly-off');
    expect(result.violations[0].severity).toBe('error');
    expect(result.violations[0].message).toContain('2주차');
    expect(result.violations[0].message).toContain('휴무 1일');
  });

  it('should require 3 OFF days when weeklyWorkHours is 32', () => {
    // 32h = 4 work days = 3 OFF days required
    const assignments = [
      ...createWeekAssignments(0, [4, 5, 6]), // Week 1: 3 OFF ✓
      ...createWeekAssignments(1, [5, 6]),    // Week 2: 2 OFF ✗ (need 3)
      ...createWeekAssignments(2, [4, 5, 6]), // Week 3: 3 OFF ✓
      ...createWeekAssignments(3, [4, 5, 6]), // Week 4: 3 OFF ✓
    ];

    const context = createTestContext(assignments, 32);
    const result = weeklyOffConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('최소 3일 필요');
  });

  it('should suppress violations when week completeness < 50%', () => {
    // Only 3 assignments in week 1 (< 50% of 7)
    const assignments = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' as const },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'D' as const },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'D' as const },
      // Week 1: 3 days filled, 0 OFF -> should be violation
      // But week completeness is 3/7 = 43% < 50%, so suppressed
    ];

    const context = createTestContext(assignments, 40);
    const result = weeklyOffConstraint.check(context);

    // Should be satisfied because violations are suppressed for incomplete weeks
    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect violations when week completeness >= 50%', () => {
    // 4 assignments in week 1 (>= 50% of 7)
    const assignments = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'D' as const },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'D' as const },
      { staffId: 'staff-1', date: '2025-01-08', shift: 'D' as const },
      { staffId: 'staff-1', date: '2025-01-09', shift: 'D' as const },
      // Week 1: 4 days filled (57%), 0 OFF -> should trigger violation
    ];

    const context = createTestContext(assignments, 40);
    const result = weeklyOffConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('1주차');
  });

  it('should allow more than required OFF days', () => {
    // 40h = 2 OFF required, but staff has 3 OFF per week -> should pass
    const assignments = [
      ...createWeekAssignments(0, [4, 5, 6]), // 3 OFF
      ...createWeekAssignments(1, [4, 5, 6]), // 3 OFF
      ...createWeekAssignments(2, [4, 5, 6]), // 3 OFF
      ...createWeekAssignments(3, [4, 5, 6]), // 3 OFF
    ];

    const context = createTestContext(assignments, 40);
    const result = weeklyOffConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should include dates in violation context for navigation', () => {
    const assignments = [
      ...createWeekAssignments(0, [6]), // Week 1: 1 OFF only
    ];

    const context = createTestContext(assignments, 40);
    const result = weeklyOffConstraint.check(context);

    expect(result.violations[0].context.dates).toHaveLength(7);
    expect(result.violations[0].context.dates).toContain('2025-01-06');
    expect(result.violations[0].context.dates).toContain('2025-01-12');
  });

  it('should check all 4 weeks independently', () => {
    // Fail weeks 1 and 3
    const assignments = [
      ...createWeekAssignments(0, [6]),    // Week 1: 1 OFF ✗
      ...createWeekAssignments(1, [5, 6]), // Week 2: 2 OFF ✓
      ...createWeekAssignments(2, [6]),    // Week 3: 1 OFF ✗
      ...createWeekAssignments(3, [5, 6]), // Week 4: 2 OFF ✓
    ];

    const context = createTestContext(assignments, 40);
    const result = weeklyOffConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(2);
    expect(result.violations[0].message).toContain('1주차');
    expect(result.violations[1].message).toContain('3주차');
  });
});
