import { describe, it, expect } from 'vitest';
import { maxPeriodOffConstraint } from '../maxPeriodOff';
import type { ConstraintContext } from '../types';
import type { Schedule, Staff, ConstraintConfig, ShiftAssignment } from '@/types';

function createTestContext(
  assignments: ShiftAssignment[],
  maxOff: number = 9,
  enabled: boolean = true
): ConstraintContext {
  const schedule: Schedule = {
    id: 'test-schedule',
    name: 'Test Schedule',
    startDate: '2025-01-06', // Monday
    assignments,
  };

  const staff: Staff[] = [{ id: 'staff-1', name: '홍길동' }];

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
      maxConsecutiveWork: { enabled: true, maxDays: 5 },
      nightBlockPolicy: { enabled: true, minBlockSize: 2 },
      maxPeriodOff: { enabled, maxOff },
      maxConsecutiveOff: { enabled: true, maxDays: 2 },
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

describe('maxPeriodOffConstraint', () => {
  it('should pass when OFF count is within limit', () => {
    // Create 8 OFF days (within default 9 limit)
    const assignments: ShiftAssignment[] = [];
    for (let i = 0; i < 8; i++) {
      const day = String(6 + i).padStart(2, '0');
      assignments.push({
        staffId: 'staff-1',
        date: `2025-01-${day}`,
        shift: 'OFF',
      });
    }
    // Fill remaining days with work
    for (let i = 8; i < 28; i++) {
      const totalDay = 6 + i;
      const month = totalDay > 31 ? '02' : '01';
      const actualDay = totalDay > 31 ? totalDay - 31 : totalDay;
      assignments.push({
        staffId: 'staff-1',
        date: `2025-${month}-${String(actualDay).padStart(2, '0')}`,
        shift: 'D',
      });
    }

    const context = createTestContext(assignments, 9);
    const result = maxPeriodOffConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should detect when OFF count exceeds limit', () => {
    // Create 10 OFF days (exceeds default 9 limit)
    const assignments: ShiftAssignment[] = [];
    for (let i = 0; i < 10; i++) {
      const day = String(6 + i).padStart(2, '0');
      assignments.push({
        staffId: 'staff-1',
        date: `2025-01-${day}`,
        shift: 'OFF',
      });
    }

    const context = createTestContext(assignments, 9);
    const result = maxPeriodOffConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('OFF 10일');
    expect(result.violations[0].message).toContain('권장 9일');
    expect(result.violations[0].severity).toBe('warning');
  });

  it('should respect custom maxOff parameter', () => {
    // Create 8 OFF days with maxOff=7 limit
    const assignments: ShiftAssignment[] = [];
    for (let i = 0; i < 8; i++) {
      const day = String(6 + i).padStart(2, '0');
      assignments.push({
        staffId: 'staff-1',
        date: `2025-01-${day}`,
        shift: 'OFF',
      });
    }

    const context = createTestContext(assignments, 7);
    const result = maxPeriodOffConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].message).toContain('권장 7일');
  });

  it('should skip check when disabled', () => {
    // Create 20 OFF days but constraint is disabled
    const assignments: ShiftAssignment[] = [];
    for (let i = 0; i < 20; i++) {
      const totalDay = 6 + i;
      const month = totalDay > 31 ? '02' : '01';
      const day = totalDay > 31 ? totalDay - 31 : totalDay;
      assignments.push({
        staffId: 'staff-1',
        date: `2025-${month}-${String(day).padStart(2, '0')}`,
        shift: 'OFF',
      });
    }

    const context = createTestContext(assignments, 9, false);
    const result = maxPeriodOffConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('should not count unassigned days as OFF', () => {
    // Only 2 explicitly assigned OFF days, rest unassigned
    const assignments: ShiftAssignment[] = [
      { staffId: 'staff-1', date: '2025-01-06', shift: 'OFF' },
      { staffId: 'staff-1', date: '2025-01-07', shift: 'OFF' },
    ];

    const context = createTestContext(assignments, 9);
    const result = maxPeriodOffConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
