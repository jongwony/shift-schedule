import { parseISO, addDays, format } from 'date-fns';
import type { Violation, ShiftAssignment } from '@/types';
import type { Constraint, ConstraintContext } from './types';
import { getSeverityFromConfig } from './types';

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

export const consecutiveNightConstraint: Constraint = {
  id: 'consecutive-night',
  name: '연속나이트',
  description: '최대 연속 나이트 근무 제한',
  severityType: 'hard',

  check(context: ConstraintContext) {
    const { schedule, staff, config, previousPeriodEnd } = context;
    const violations: Violation[] = [];
    const severity = getSeverityFromConfig(config, 'consecutiveNight');

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;
    const maxConsecutive = config.maxConsecutiveNights;

    // Combine assignments for continuity check
    const allAssignments = [...previousPeriodEnd, ...schedule.assignments];

    for (const staffMember of staff) {
      // Sort previous period assignments to find how many consecutive nights before period start
      const prevNightCount = countTrailingNights(previousPeriodEnd, staffMember.id, schedule.startDate);

      let consecutiveCount = prevNightCount;
      let consecutiveStartDate: string | null = null;

      // If we already have consecutive nights from previous period, find the start
      if (prevNightCount > 0) {
        consecutiveStartDate = findConsecutiveNightStart(previousPeriodEnd, staffMember.id, schedule.startDate);
      }

      for (let i = 0; i < periodDays; i++) {
        const currentDate = format(addDays(startDate, i), 'yyyy-MM-dd');
        const currentShift = getShiftForStaffOnDate(allAssignments, staffMember.id, currentDate);

        if (currentShift === 'N') {
          if (consecutiveCount === 0) {
            consecutiveStartDate = currentDate;
          }
          consecutiveCount++;

          // Check if exceeded max AFTER incrementing (violation is on the day that exceeds)
          if (consecutiveCount > maxConsecutive) {
            violations.push({
              constraintId: 'consecutive-night',
              constraintName: '연속나이트',
              severity,
              message: `${staffMember.name}: 연속 ${consecutiveCount}일 나이트 근무 (최대 ${maxConsecutive}일)`,
              context: {
                staffId: staffMember.id,
                staffName: staffMember.name,
                date: currentDate,
                dates: consecutiveStartDate ? [consecutiveStartDate, currentDate] : [currentDate],
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
 * Count how many consecutive night shifts end at the day before periodStartDate
 */
function countTrailingNights(
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
    if (assignment.date === assignmentDate && assignment.shift === 'N') {
      count++;
      expectedDate = addDays(expectedDate, -1);
    } else if (assignment.date === assignmentDate) {
      break; // Found a non-night shift
    }
    // If date doesn't match, continue looking (assignments might not be dense)
  }

  return count;
}

/**
 * Find the start date of consecutive nights ending at periodStartDate
 */
function findConsecutiveNightStart(
  previousAssignments: ShiftAssignment[],
  staffId: string,
  periodStartDate: string
): string | null {
  const startDate = parseISO(periodStartDate);
  const staffAssignments = previousAssignments
    .filter((a) => a.staffId === staffId)
    .sort((a, b) => b.date.localeCompare(a.date)); // Sort descending

  let lastNightDate: string | null = null;
  let expectedDate = addDays(startDate, -1);

  for (const assignment of staffAssignments) {
    const assignmentDate = format(expectedDate, 'yyyy-MM-dd');
    if (assignment.date === assignmentDate && assignment.shift === 'N') {
      lastNightDate = assignmentDate;
      expectedDate = addDays(expectedDate, -1);
    } else if (assignment.date === assignmentDate) {
      break;
    }
  }

  return lastNightDate;
}
