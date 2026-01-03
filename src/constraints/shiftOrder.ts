import { parseISO, addDays, format } from 'date-fns';
import type { ShiftType, Violation, ShiftAssignment } from '@/types';
import type { Constraint, ConstraintContext } from './types';
import { getSeverityFromConfig } from './types';

/**
 * Forbidden transitions (reverse order):
 * N→D, N→E, E→D
 */
const FORBIDDEN_TRANSITIONS: [ShiftType, ShiftType][] = [
  ['N', 'D'],
  ['N', 'E'],
  ['E', 'D'],
];

function isForbiddenTransition(from: ShiftType, to: ShiftType): boolean {
  return FORBIDDEN_TRANSITIONS.some(([f, t]) => f === from && t === to);
}

function getShiftForStaffOnDate(
  assignments: ShiftAssignment[],
  staffId: string,
  date: string
): ShiftType | null {
  const assignment = assignments.find(
    (a) => a.staffId === staffId && a.date === date
  );
  return assignment?.shift ?? null;
}

export const shiftOrderConstraint: Constraint = {
  id: 'shift-order',
  name: '역순금지',
  description: 'N→D, N→E, E→D 전이 금지',
  severityType: 'hard',

  check(context: ConstraintContext) {
    const { schedule, staff, config, previousPeriodEnd } = context;
    const violations: Violation[] = [];
    const severity = getSeverityFromConfig(config, 'shiftOrder');

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    for (const staffMember of staff) {
      // Check transition from last day of previous period to first day of current period
      if (previousPeriodEnd.length > 0) {
        const prevAssignments = previousPeriodEnd
          .filter((a) => a.staffId === staffMember.id)
          .sort((a, b) => a.date.localeCompare(b.date));

        if (prevAssignments.length > 0) {
          const lastPrev = prevAssignments[prevAssignments.length - 1];
          const firstCurrentDate = format(startDate, 'yyyy-MM-dd');
          const firstCurrentShift = getShiftForStaffOnDate(
            schedule.assignments,
            staffMember.id,
            firstCurrentDate
          );

          if (firstCurrentShift && isForbiddenTransition(lastPrev.shift, firstCurrentShift)) {
            violations.push({
              constraintId: 'shift-order',
              constraintName: '역순금지',
              severity,
              message: `${staffMember.name}: ${firstCurrentDate.slice(5).replace('-', '/')}에 ${lastPrev.shift}→${firstCurrentShift} 역순 전이`,
              context: {
                staffId: staffMember.id,
                staffName: staffMember.name,
                date: firstCurrentDate,
              },
            });
          }
        }
      }

      // Check transitions within the current period
      for (let i = 0; i < periodDays - 1; i++) {
        const currentDate = format(addDays(startDate, i), 'yyyy-MM-dd');
        const nextDate = format(addDays(startDate, i + 1), 'yyyy-MM-dd');

        const currentShift = getShiftForStaffOnDate(
          schedule.assignments,
          staffMember.id,
          currentDate
        );
        const nextShift = getShiftForStaffOnDate(
          schedule.assignments,
          staffMember.id,
          nextDate
        );

        if (currentShift && nextShift && isForbiddenTransition(currentShift, nextShift)) {
          violations.push({
            constraintId: 'shift-order',
            constraintName: '역순금지',
            severity,
            message: `${staffMember.name}: ${nextDate.slice(5).replace('-', '/')}에 ${currentShift}→${nextShift} 역순 전이`,
            context: {
              staffId: staffMember.id,
              staffName: staffMember.name,
              date: nextDate,
            },
          });
        }
      }
    }

    return {
      satisfied: violations.length === 0,
      violations,
    };
  },
};
