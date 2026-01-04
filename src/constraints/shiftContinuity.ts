import { parseISO, addDays, format } from 'date-fns';
import type { Violation, ShiftAssignment, ShiftType } from '@/types';
import type { Constraint, ConstraintContext } from './types';

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

export const shiftContinuityConstraint: Constraint = {
  id: 'shift-continuity',
  name: '근무연속성',
  description: '근무 타입 빈번한 변경 방지',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config } = context;
    const violations: Violation[] = [];

    const softConfig = config.softConstraints?.shiftContinuity;
    if (!softConfig?.enabled) {
      return { satisfied: true, violations: [] };
    }

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    for (const staffMember of staff) {
      let shiftChanges = 0;
      let lastWorkShift: ShiftType | null = null;

      for (let i = 0; i < periodDays; i++) {
        const currentDate = format(addDays(startDate, i), 'yyyy-MM-dd');
        const currentShift = getShiftForStaffOnDate(
          schedule.assignments,
          staffMember.id,
          currentDate
        );

        // Skip unassigned days and OFF days
        if (!currentShift || currentShift === 'OFF') {
          continue;
        }

        // Count shift type changes (D -> E, E -> N, N -> D, etc.)
        if (lastWorkShift && lastWorkShift !== currentShift) {
          shiftChanges++;
        }

        lastWorkShift = currentShift;
      }

      // Threshold: if shift changes more than 10 times in 28 days, flag it
      // This allows for reasonable rotation but discourages excessive changes
      const threshold = 10;
      if (shiftChanges > threshold) {
        violations.push({
          constraintId: 'shift-continuity',
          constraintName: '근무연속성',
          severity: 'warning',
          message: `${staffMember.name}: 근무 타입 변경 ${shiftChanges}회 (권장 ${threshold}회 이하)`,
          context: {
            staffId: staffMember.id,
            staffName: staffMember.name,
          },
        });
      }
    }

    return {
      satisfied: violations.length === 0,
      violations,
    };
  },
};
