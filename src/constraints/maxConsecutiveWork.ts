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
 */
function countTrailingWorkDays(
  previousAssignments: ShiftAssignment[],
  staffId: string,
  periodStartDate: string
): number {
  const startDate = parseISO(periodStartDate);
  const staffAssignments = previousAssignments
    .filter((a) => a.staffId === staffId)
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending

  let count = 0;
  let expectedDate = addDays(startDate, -1);

  for (const assignment of staffAssignments) {
    const assignmentDate = format(expectedDate, 'yyyy-MM-dd');
    if (assignment.date === assignmentDate && assignment.shift !== 'OFF') {
      count++;
      expectedDate = addDays(expectedDate, -1);
    } else if (assignment.date === assignmentDate) {
      break; // Found an OFF day
    }
  }

  return count;
}

/**
 * Find the start date of consecutive work days ending at periodStartDate
 */
function findConsecutiveWorkStart(
  previousAssignments: ShiftAssignment[],
  staffId: string,
  periodStartDate: string
): string | null {
  const startDate = parseISO(periodStartDate);
  const staffAssignments = previousAssignments
    .filter((a) => a.staffId === staffId)
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending

  let lastWorkDate: string | null = null;
  let expectedDate = addDays(startDate, -1);

  for (const assignment of staffAssignments) {
    const assignmentDate = format(expectedDate, 'yyyy-MM-dd');
    if (assignment.date === assignmentDate && assignment.shift !== 'OFF') {
      lastWorkDate = assignmentDate;
      expectedDate = addDays(expectedDate, -1);
    } else if (assignment.date === assignmentDate) {
      break;
    }
  }

  return lastWorkDate;
}
