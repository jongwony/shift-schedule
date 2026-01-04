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

export const maxPeriodOffConstraint: Constraint = {
  id: 'max-period-off',
  name: '주기당 OFF 상한',
  description: '28일 주기 내 OFF 일수 확인',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config } = context;
    const violations: Violation[] = [];

    const softConfig = config.softConstraints?.maxPeriodOff;
    if (!softConfig?.enabled) {
      return { satisfied: true, violations: [] };
    }

    const maxOff = softConfig.maxOff ?? 9;
    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    for (const staffMember of staff) {
      let offCount = 0;
      const offDates: string[] = [];

      for (let i = 0; i < periodDays; i++) {
        const currentDate = format(addDays(startDate, i), 'yyyy-MM-dd');
        const currentShift = getShiftForStaffOnDate(
          schedule.assignments,
          staffMember.id,
          currentDate
        );

        if (currentShift === 'OFF') {
          offCount++;
          offDates.push(currentDate);
        }
      }

      // Check if exceeded max OFF
      if (offCount > maxOff) {
        violations.push({
          constraintId: 'max-period-off',
          constraintName: '주기당 OFF 상한',
          severity: 'warning',
          message: `${staffMember.name}: 주기 내 OFF ${offCount}일 (권장 ${maxOff}일 이하)`,
          context: {
            staffId: staffMember.id,
            staffName: staffMember.name,
            // Report the last OFF date that caused the violation
            date: offDates[offDates.length - 1],
            dates: offDates,
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
