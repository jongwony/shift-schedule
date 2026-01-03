import { parseISO, addDays, format } from 'date-fns';
import type { Violation } from '@/types';
import type { Constraint, ConstraintContext } from './types';
import { getSeverityFromConfig } from './types';

/**
 * Per-week completeness threshold.
 * Suppress violations until the week is at least 50% filled.
 */
const WEEKLY_COMPLETENESS_THRESHOLD = 0.5;

/**
 * Calculate minimum required OFF days per week based on weekly work hours.
 * Formula: minOffDays = 7 - ceil(weeklyWorkHours / 8)
 * Example: 40h = 5 work days = 2 OFF days
 */
function calculateMinOffDays(weeklyWorkHours: number): number {
  const workDaysPerWeek = Math.ceil(weeklyWorkHours / 8);
  return 7 - workDaysPerWeek;
}

export const weeklyOffConstraint: Constraint = {
  id: 'weekly-off',
  name: '주간휴무',
  description: '주간 근무시간 기준 최소 휴무일 확인',
  severityType: 'hard',

  check(context: ConstraintContext) {
    const { schedule, staff, config } = context;
    const violations: Violation[] = [];
    const severity = getSeverityFromConfig(config, 'weeklyOff');

    const startDate = parseISO(schedule.startDate);
    const numWeeks = 4; // 28-day period = 4 weeks
    const minOffDays = calculateMinOffDays(config.weeklyWorkHours);

    for (const staffMember of staff) {
      for (let week = 0; week < numWeeks; week++) {
        const weekStart = week * 7;
        const weekDates: string[] = [];

        // Collect all dates in this week
        for (let d = 0; d < 7; d++) {
          weekDates.push(format(addDays(startDate, weekStart + d), 'yyyy-MM-dd'));
        }

        // Get assignments for this staff member in this week
        const weekAssignments = schedule.assignments.filter(
          (a) => a.staffId === staffMember.id && weekDates.includes(a.date)
        );

        // Calculate week-specific completeness
        const weekCompleteness = weekAssignments.length / 7;

        // Suppress violations if week is not substantially filled
        if (weekCompleteness < WEEKLY_COMPLETENESS_THRESHOLD) {
          continue;
        }

        // Count OFF days in this week
        const offCount = weekAssignments.filter((a) => a.shift === 'OFF').length;

        if (offCount < minOffDays) {
          const weekLabel = `${week + 1}주차`;
          const weekRange = `${weekDates[0].slice(5).replace('-', '/')}~${weekDates[6].slice(5).replace('-', '/')}`;

          violations.push({
            constraintId: 'weekly-off',
            constraintName: '주간휴무',
            severity,
            message: `${staffMember.name}: ${weekLabel} (${weekRange}) 휴무 ${offCount}일, 최소 ${minOffDays}일 필요`,
            context: {
              staffId: staffMember.id,
              staffName: staffMember.name,
              dates: weekDates,
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
