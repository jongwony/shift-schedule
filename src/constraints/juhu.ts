import { parseISO, addDays, format, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import type { Violation } from '@/types';
import type { DayOfWeek } from '@/types';
import type { Constraint, ConstraintContext } from './types';
import { getSeverityFromConfig } from './types';

export const juhuConstraint: Constraint = {
  id: 'juhu',
  name: '주휴',
  description: '4주간 동일 요일 OFF 확인',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config } = context;
    const violations: Violation[] = [];
    const severity = getSeverityFromConfig(config, 'juhu');

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    for (const staffMember of staff) {
      const juhuDay = staffMember.juhuDay;

      // Find all dates in the 4-week period that match the juhuDay
      for (let i = 0; i < periodDays; i++) {
        const currentDateObj = addDays(startDate, i);
        const currentDate = format(currentDateObj, 'yyyy-MM-dd');
        const dayOfWeek = getDay(currentDateObj) as DayOfWeek;

        if (dayOfWeek === juhuDay) {
          // Check if this date has OFF assignment
          const assignment = schedule.assignments.find(
            (a) => a.staffId === staffMember.id && a.date === currentDate
          );

          // Violation if assigned work (not OFF) or no assignment (treated as unassigned, not OFF)
          if (assignment && assignment.shift !== 'OFF') {
            const formattedDate = currentDate.slice(5).replace('-', '/');
            const dayName = format(currentDateObj, 'EEE', { locale: ko });

            violations.push({
              constraintId: 'juhu',
              constraintName: '주휴',
              severity,
              message: `${staffMember.name}: ${formattedDate} (${dayName})에 근무 배정 - 주휴일 위반`,
              context: {
                staffId: staffMember.id,
                staffName: staffMember.name,
                date: currentDate,
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
