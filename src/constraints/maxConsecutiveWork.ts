import { parseISO, addDays, format } from 'date-fns';
import type { Violation, ShiftAssignment } from '@/types';
import type { Constraint, ConstraintContext } from './types';

function getShiftForStaffOnDate(
  assignments: ShiftAssignment[],
  staffId: string,
  date: string
): string | null {
  const assignment = assignments.find(
    (a) => a.staffId === staffId && a.date === date
  );
  return assignment?.shift ?? null;
}

export const maxConsecutiveWorkConstraint: Constraint = {
  id: 'max-consecutive-work',
  name: '연속근무상한',
  description: '연속 근무일 수 확인',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config, previousPeriodEnd } = context;
    const violations: Violation[] = [];

    const softConfig = config.softConstraints?.maxConsecutiveWork;
    if (!softConfig?.enabled) {
      return { satisfied: true, violations: [] };
    }

    const maxDays = softConfig.maxDays ?? 5;
    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    // Combine assignments for continuity check
    const allAssignments = [...previousPeriodEnd, ...schedule.assignments];

    for (const staffMember of staff) {
      // Count trailing work days from previous period
      const prevWorkCount = countTrailingWorkDays(
        previousPeriodEnd,
        staffMember.id,
        schedule.startDate
      );

      let consecutiveCount = prevWorkCount;
      let consecutiveStartDate: string | null = null;

      if (prevWorkCount > 0) {
        consecutiveStartDate = findConsecutiveWorkStart(
          previousPeriodEnd,
          staffMember.id,
          schedule.startDate
        );
      }

      for (let i = 0; i < periodDays; i++) {
        const currentDate = format(addDays(startDate, i), 'yyyy-MM-dd');
        const currentShift = getShiftForStaffOnDate(
          allAssignments,
          staffMember.id,
          currentDate
        );

        // Work day = D, E, or N (not OFF and not unassigned)
        const isWorkDay = currentShift && currentShift !== 'OFF';

        if (isWorkDay) {
          if (consecutiveCount === 0) {
            consecutiveStartDate = currentDate;
          }
          consecutiveCount++;

          // Check if exceeded max
          if (consecutiveCount > maxDays) {
            violations.push({
              constraintId: 'max-consecutive-work',
              constraintName: '연속근무상한',
              severity: 'warning',
              message: `${staffMember.name}: 연속 ${consecutiveCount}일 근무 (권장 ${maxDays}일 이하)`,
              context: {
                staffId: staffMember.id,
                staffName: staffMember.name,
                date: currentDate,
                dates: consecutiveStartDate
                  ? [consecutiveStartDate, currentDate]
                  : [currentDate],
              },
            });
          }
        } else {
          consecutiveCount = 0;
          consecutiveStartDate = null;
        }
      }
    }

    return {
      satisfied: violations.length === 0,
      violations,
    };
  },
};

/**
 * Count how many consecutive work days end at the day before periodStartDate
 * Uses Map for O(1) lookup - more robust than array iteration
 */
function countTrailingWorkDays(
  previousAssignments: ShiftAssignment[],
  staffId: string,
  periodStartDate: string
): number {
  const startDate = parseISO(periodStartDate);

  // Build a Map for O(1) lookup by date
  const shiftByDate = new Map<string, string>();
  for (const a of previousAssignments) {
    if (a.staffId === staffId) {
      shiftByDate.set(a.date, a.shift);
    }
  }

  let count = 0;
  let checkDate = addDays(startDate, -1);

  // Check up to 7 days back (max previous period length)
  for (let i = 0; i < 7; i++) {
    const dateString = format(checkDate, 'yyyy-MM-dd');
    const shift = shiftByDate.get(dateString);

    if (shift && shift !== 'OFF') {
      count++;
      checkDate = addDays(checkDate, -1);
    } else {
      // Either OFF, unassigned, or no data - stop counting
      break;
    }
  }

  return count;
}

/**
 * Find the start date of consecutive work days ending at periodStartDate
 * Uses Map for O(1) lookup - more robust than array iteration
 */
function findConsecutiveWorkStart(
  previousAssignments: ShiftAssignment[],
  staffId: string,
  periodStartDate: string
): string | null {
  const startDate = parseISO(periodStartDate);

  // Build a Map for O(1) lookup by date
  const shiftByDate = new Map<string, string>();
  for (const a of previousAssignments) {
    if (a.staffId === staffId) {
      shiftByDate.set(a.date, a.shift);
    }
  }

  let lastWorkDate: string | null = null;
  let checkDate = addDays(startDate, -1);

  // Check up to 7 days back (max previous period length)
  for (let i = 0; i < 7; i++) {
    const dateString = format(checkDate, 'yyyy-MM-dd');
    const shift = shiftByDate.get(dateString);

    if (shift && shift !== 'OFF') {
      lastWorkDate = dateString;
      checkDate = addDays(checkDate, -1);
    } else {
      break;
    }
  }

  return lastWorkDate;
}
