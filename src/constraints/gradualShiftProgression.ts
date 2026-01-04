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

export const gradualShiftProgressionConstraint: Constraint = {
  id: 'gradual-shift-progression',
  name: '점진적전환',
  description: 'D(주간)에서 N(야간)으로 직접 전환 방지',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config, previousPeriodEnd } = context;
    const violations: Violation[] = [];

    const softConfig = config.softConstraints?.gradualShiftProgression;
    if (!softConfig?.enabled) {
      return { satisfied: true, violations: [] };
    }

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    // Combine assignments for continuity check
    const allAssignments = [...previousPeriodEnd, ...schedule.assignments];

    for (const staffMember of staff) {
      // Check transition from last day of previous period to first day
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

          if (lastPrev.shift === 'D' && firstCurrentShift === 'N') {
            violations.push({
              constraintId: 'gradual-shift-progression',
              constraintName: '점진적전환',
              severity: 'warning',
              message: `${staffMember.name}: ${firstCurrentDate.slice(5).replace('-', '/')}에 D->N 직접 전환 (E를 거쳐 전환 권장)`,
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
          allAssignments,
          staffMember.id,
          currentDate
        );
        const nextShift = getShiftForStaffOnDate(
          allAssignments,
          staffMember.id,
          nextDate
        );

        // Check for D -> N direct transition
        if (currentShift === 'D' && nextShift === 'N') {
          violations.push({
            constraintId: 'gradual-shift-progression',
            constraintName: '점진적전환',
            severity: 'warning',
            message: `${staffMember.name}: ${nextDate.slice(5).replace('-', '/')}에 D->N 직접 전환 (E를 거쳐 전환 권장)`,
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
