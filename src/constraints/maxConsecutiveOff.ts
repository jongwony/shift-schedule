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

export const maxConsecutiveOffConstraint: Constraint = {
  id: 'max-consecutive-off',
  name: '연속 OFF 상한',
  description: '연속 OFF 일수 확인',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config, previousPeriodEnd } = context;
    const violations: Violation[] = [];

    const softConfig = config.softConstraints?.maxConsecutiveOff;
    if (!softConfig?.enabled) {
      return { satisfied: true, violations: [] };
    }

    const maxDays = softConfig.maxDays ?? 2;
    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    // Combine assignments for continuity check
    const allAssignments = [...previousPeriodEnd, ...schedule.assignments];

    for (const staffMember of staff) {
      // Count trailing OFF days from previous period
      const prevOffCount = countTrailingOffDays(
        previousPeriodEnd,
        staffMember.id,
        schedule.startDate
      );

      let consecutiveCount = prevOffCount;
      let consecutiveStartDate: string | null = null;

      if (prevOffCount > 0) {
        consecutiveStartDate = findConsecutiveOffStart(
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

        // OFF day check
        const isOffDay = currentShift === 'OFF';

        if (isOffDay) {
          if (consecutiveCount === 0) {
            consecutiveStartDate = currentDate;
          }
          consecutiveCount++;

          // Check if exceeded max
          if (consecutiveCount > maxDays) {
            violations.push({
              constraintId: 'max-consecutive-off',
              constraintName: '연속 OFF 상한',
              severity: 'warning',
              message: `${staffMember.name}: 연속 ${consecutiveCount}일 OFF (권장 ${maxDays}일 이하)`,
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
        } else if (currentShift !== null) {
          // Reset only if there's an actual work assignment (not unassigned)
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
 * Count how many consecutive OFF days end at the day before periodStartDate
 */
function countTrailingOffDays(
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
    if (assignment.date === assignmentDate && assignment.shift === 'OFF') {
      count++;
      expectedDate = addDays(expectedDate, -1);
    } else if (assignment.date === assignmentDate) {
      break; // Found a work day
    }
  }

  return count;
}

/**
 * Find the start date of consecutive OFF days ending at periodStartDate
 */
function findConsecutiveOffStart(
  previousAssignments: ShiftAssignment[],
  staffId: string,
  periodStartDate: string
): string | null {
  const startDate = parseISO(periodStartDate);
  const staffAssignments = previousAssignments
    .filter((a) => a.staffId === staffId)
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending

  let lastOffDate: string | null = null;
  let expectedDate = addDays(startDate, -1);

  for (const assignment of staffAssignments) {
    const assignmentDate = format(expectedDate, 'yyyy-MM-dd');
    if (assignment.date === assignmentDate && assignment.shift === 'OFF') {
      lastOffDate = assignmentDate;
      expectedDate = addDays(expectedDate, -1);
    } else if (assignment.date === assignmentDate) {
      break;
    }
  }

  return lastOffDate;
}
