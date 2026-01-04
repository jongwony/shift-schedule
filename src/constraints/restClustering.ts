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

export const restClusteringConstraint: Constraint = {
  id: 'rest-clustering',
  name: '휴식일집중',
  description: '단독 휴식일 방지 (연속 휴식 권장)',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config, previousPeriodEnd } = context;
    const violations: Violation[] = [];

    const softConfig = config.softConstraints?.restClustering;
    if (!softConfig?.enabled) {
      return { satisfied: true, violations: [] };
    }

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    // Combine assignments for continuity check
    const allAssignments = [...previousPeriodEnd, ...schedule.assignments];

    for (const staffMember of staff) {
      for (let i = 0; i < periodDays; i++) {
        const currentDate = format(addDays(startDate, i), 'yyyy-MM-dd');
        const currentShift = getShiftForStaffOnDate(
          allAssignments,
          staffMember.id,
          currentDate
        );

        if (currentShift !== 'OFF') {
          continue;
        }

        // Check if this is an isolated OFF day
        const prevDate = format(addDays(startDate, i - 1), 'yyyy-MM-dd');
        const nextDate = format(addDays(startDate, i + 1), 'yyyy-MM-dd');

        const prevShift = getShiftForStaffOnDate(
          allAssignments,
          staffMember.id,
          prevDate
        );
        const nextShift = getShiftForStaffOnDate(
          allAssignments,
          staffMember.id,
          nextDate
        );

        // Isolated if neither neighbor is an OFF day
        const isIsolated = prevShift !== 'OFF' && nextShift !== 'OFF';

        if (isIsolated) {
          violations.push({
            constraintId: 'rest-clustering',
            constraintName: '휴식일집중',
            severity: 'warning',
            message: `${staffMember.name}: ${currentDate.slice(5).replace('-', '/')} 단독 휴식일 (연속 휴식 권장)`,
            context: {
              staffId: staffMember.id,
              staffName: staffMember.name,
              date: currentDate,
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
