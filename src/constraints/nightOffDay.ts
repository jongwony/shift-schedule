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

export const nightOffDayConstraint: Constraint = {
  id: 'night-off-day',
  name: 'N→Off→D 금지',
  description: 'N→OFF→D 3일 패턴 법적 불가',
  severityType: 'hard',

  check(context: ConstraintContext) {
    const { schedule, staff, config, previousPeriodEnd } = context;
    const violations: Violation[] = [];
    const severity = getSeverityFromConfig(config, 'nightOffDay');

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    // Combine previous period end with current period for sliding window
    const allAssignments = [...previousPeriodEnd, ...schedule.assignments];

    for (const staffMember of staff) {
      // Check 3-day windows starting from 2 days before period start
      // (to catch patterns where D is on day 0 or 1 of current period)
      for (let offset = -2; offset < periodDays; offset++) {
        const day1Date = format(addDays(startDate, offset), 'yyyy-MM-dd');
        const day2Date = format(addDays(startDate, offset + 1), 'yyyy-MM-dd');
        const day3Date = format(addDays(startDate, offset + 2), 'yyyy-MM-dd');

        const day1Shift = getShiftForStaffOnDate(allAssignments, staffMember.id, day1Date);
        const day2Shift = getShiftForStaffOnDate(allAssignments, staffMember.id, day2Date);
        const day3Shift = getShiftForStaffOnDate(allAssignments, staffMember.id, day3Date);

        // Check N→OFF→D pattern
        if (day1Shift === 'N' && day2Shift === 'OFF' && day3Shift === 'D') {
          // Only report if the final day (D) is within current period
          const day3DateObj = addDays(startDate, offset + 2);
          const periodEndDate = addDays(startDate, periodDays);

          if (day3DateObj >= startDate && day3DateObj < periodEndDate) {
            const formattedDates = `${day1Date.slice(5).replace('-', '/')}~${day3Date.slice(5).replace('-', '/')}`;
            violations.push({
              constraintId: 'night-off-day',
              constraintName: 'N→Off→D 금지',
              severity,
              message: `${staffMember.name}: ${formattedDates} N→Off→D 패턴 (법적 불가)`,
              context: {
                staffId: staffMember.id,
                staffName: staffMember.name,
                dates: [day1Date, day2Date, day3Date],
              },
            });
          }
        }
      }
    }

    return {
      satisfied: violations.length === 0,
      violations,
    };
  },
};
