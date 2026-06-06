import { describe, it, expect } from 'vitest';
import { totalWorkFairnessConstraint } from '../totalWorkFairness';
import { dayShiftFairnessConstraint } from '../dayShiftFairness';
import type { ConstraintContext } from '../types';
import type {
  Schedule,
  Staff,
  ConstraintConfig,
  ShiftAssignment,
  ShiftType,
} from '@/types';

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
        { id: 'staff-1', name: '홍길동' },
        { id: 'staff-2', name: '김철수' },
      ];

  const config: ConstraintConfig = {
    maxConsecutiveNights: 4,
    weeklyWorkHours: 40,
    weeklyStaffing: Array.from({ length: 4 }, () => ({
      weekday: {
        day: { min: 1, max: 2 },
        evening: { min: 2, max: 2 },
        night: { min: 1, max: 2 },
      },
      friday: {
        day: { min: 1, max: 2 },
        evening: { min: 2, max: 2 },
        night: { min: 1, max: 2 },
      },
      weekend: {
        day: { min: 2, max: 2 },
        evening: { min: 2, max: 2 },
        night: { min: 2, max: 2 },
      },
    })),
    enabledConstraints: {
      shiftOrder: true,
      nightOffDay: true,
      consecutiveNight: true,
      staffing: true,
      weeklyOff: true,
      juhu: true,
    },
    constraintSeverity: {
      shiftOrder: 'hard',
      nightOffDay: 'hard',
      consecutiveNight: 'hard',
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
      totalWorkFairness: { enabled: true },
      dayShiftFairness: { enabled: true },
      shiftContinuity: { enabled: true },
    },
  };

  return { schedule, staff, config, previousPeriodEnd: [], scheduleCompleteness: 1 };
}

/** Build 28-day assignments for one staff member, all set to a single shift. */
function buildPeriod(staffId: string, shift: ShiftType): ShiftAssignment[] {
  const out: ShiftAssignment[] = [];
  const start = new Date('2025-01-06T00:00:00');
  for (let i = 0; i < 28; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const date = d.toISOString().slice(0, 10);
    out.push({ staffId, date, shift });
  }
  return out;
}

describe('totalWorkFairnessConstraint', () => {
  it('flags both above-average and below-average staff (symmetric)', () => {
    // staff-1 works all 28 days; staff-2 is OFF all 28 days. Average = 14.
    const context = createTestContext([
      ...buildPeriod('staff-1', 'D'),
      ...buildPeriod('staff-2', 'OFF'),
    ]);

    const result = totalWorkFairnessConstraint.check(context);

    expect(result.satisfied).toBe(false);
    // Both staff deviate from the 14-day average → two violations.
    expect(result.violations).toHaveLength(2);

    const messages = result.violations.map((v) => v.message).join('\n');
    // Symmetry: one direction reports "많음" (more), the other "적음" (less).
    expect(messages).toContain('많음');
    expect(messages).toContain('적음');
  });

  it('is satisfied when all staff have equal total work counts (balanced)', () => {
    // Both staff work all 28 days → identical counts → zero deviation.
    const context = createTestContext([
      ...buildPeriod('staff-1', 'D'),
      ...buildPeriod('staff-2', 'D'),
    ]);

    const result = totalWorkFairnessConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('returns satisfied without violations when disabled', () => {
    const context = createTestContext([
      ...buildPeriod('staff-1', 'D'),
      ...buildPeriod('staff-2', 'OFF'),
    ]);
    context.config.softConstraints.totalWorkFairness.enabled = false;

    const result = totalWorkFairnessConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});

describe('dayShiftFairnessConstraint', () => {
  it('flags both above-average and below-average staff on D counts (symmetric)', () => {
    // staff-1 works D all 28 days; staff-2 works N all 28 days (zero D). Average D = 14.
    const context = createTestContext([
      ...buildPeriod('staff-1', 'D'),
      ...buildPeriod('staff-2', 'N'),
    ]);

    const result = dayShiftFairnessConstraint.check(context);

    expect(result.satisfied).toBe(false);
    expect(result.violations).toHaveLength(2);

    const messages = result.violations.map((v) => v.message).join('\n');
    expect(messages).toContain('많음');
    expect(messages).toContain('적음');
  });

  it('is satisfied when D counts are balanced across staff', () => {
    const context = createTestContext([
      ...buildPeriod('staff-1', 'D'),
      ...buildPeriod('staff-2', 'D'),
    ]);

    const result = dayShiftFairnessConstraint.check(context);

    expect(result.satisfied).toBe(true);
    expect(result.violations).toHaveLength(0);
  });
});
