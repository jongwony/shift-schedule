import { describe, it, expect } from 'vitest';
import { monthlyNightConstraint } from '../monthlyNight';
import type { ConstraintContext } from '../types';
import type { Schedule, Staff, ConstraintConfig, ShiftAssignment } from '@/types';

function createTestContext(
  assignments: ShiftAssignment[],
  monthlyNightsRequired = 7
): ConstraintContext {
  const schedule: Schedule = {
    id: 'test-schedule',
    name: 'Test Schedule',
    startDate: '2025-01-06',
    assignments,
  };

  const staff: Staff[] = [{ id: 'staff-1', name: '홍길동' }];

  const config: ConstraintConfig = {
    maxConsecutiveNights: 4,
    monthlyNightsRequired,
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

describe('monthlyNightConstraint', () => {
  it('should pass when night count equals required', () => {
    const assignments: ShiftAssignment[] = [];
    for (let i = 0; i < 7; i++) {
      assignments.push({
        staffId: 'staff-1',
        date: `2025-01-${String(6 + i).padStart(2, '0')}`,
        shift: 'N',
      });
    }

    const context = createTestContext(assignments);
    const result = monthlyNightConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect when night count is less than required', () => {
    const assignments: ShiftAssignment[] = [];
    for (let i = 0; i < 6; i++) {
      assignments.push({
        staffId: 'staff-1',
        date: `2025-01-${String(6 + i).padStart(2, '0')}`,
        shift: 'N',
      });
    }

    const context = createTestContext(assignments);
    const result = monthlyNightConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('월간 나이트 6회');
    expect(result.violations[0].message).toContain('필요: 7회');
    expect(result.violations[0].severity).toBe('warning');
  });

  it('should detect when night count is more than required', () => {
    const assignments: ShiftAssignment[] = [];
    for (let i = 0; i < 8; i++) {
      assignments.push({
        staffId: 'staff-1',
        date: `2025-01-${String(6 + i).padStart(2, '0')}`,
        shift: 'N',
      });
    }

    const context = createTestContext(assignments);
    const result = monthlyNightConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('월간 나이트 8회');
  });

  it('should respect custom monthlyNightsRequired config', () => {
    const assignments: ShiftAssignment[] = [];
    for (let i = 0; i < 5; i++) {
      assignments.push({
        staffId: 'staff-1',
        date: `2025-01-${String(6 + i).padStart(2, '0')}`,
        shift: 'N',
      });
    }

    const context = createTestContext(assignments, 5);
    const result = monthlyNightConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should have warning severity (soft constraint)', () => {
    const context = createTestContext([]);
    const result = monthlyNightConstraint.check(context);

    expect(result.violations[0].severity).toBe('warning');
  });
});
