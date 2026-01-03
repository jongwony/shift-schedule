import { parseISO, addDays, format, isWeekend } from 'date-fns';
import type { Violation } from '@/types';
import type { Constraint, ConstraintContext } from './types';
import { getSeverityFromConfig } from './types';

const SHIFT_TYPE_NAMES: Record<'D' | 'E' | 'N', string> = {
  D: '데이',
  E: '이브닝',
  N: '나이트',
};

/** Threshold: show staffing errors only when schedule is >= 50% complete */
const STAFFING_ERROR_THRESHOLD = 0.5;

export const staffingConstraint: Constraint = {
  id: 'staffing',
  name: '최소인원',
  description: '일별 근무 최소 인원 확인',
  severityType: 'hard',

  check(context: ConstraintContext) {
    const { schedule, config, scheduleCompleteness } = context;

    // Suppress staffing errors when schedule is not yet substantively filled
    if (scheduleCompleteness < STAFFING_ERROR_THRESHOLD) {
      return { satisfied: true, violations: [] };
    }

    const violations: Violation[] = [];
    const severity = getSeverityFromConfig(config, 'staffing');

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    for (let i = 0; i < periodDays; i++) {
      const currentDateObj = addDays(startDate, i);
      const currentDate = format(currentDateObj, 'yyyy-MM-dd');
      const weekend = isWeekend(currentDateObj);

      const staffingReq = weekend ? config.weekendStaffing : config.weekdayStaffing;

      // Count staff per shift type for this date
      const shiftCounts: Record<'D' | 'E' | 'N', number> = { D: 0, E: 0, N: 0 };

      for (const assignment of schedule.assignments) {
        if (assignment.date === currentDate && assignment.shift !== 'OFF') {
          shiftCounts[assignment.shift as 'D' | 'E' | 'N']++;
        }
      }

      // Check each shift type against requirements
      const shiftTypes: Array<{ shift: 'D' | 'E' | 'N'; key: 'day' | 'evening' | 'night' }> = [
        { shift: 'D', key: 'day' },
        { shift: 'E', key: 'evening' },
        { shift: 'N', key: 'night' },
      ];

      for (const { shift, key } of shiftTypes) {
        const count = shiftCounts[shift];
        const minRequired = staffingReq[key].min;

        if (count < minRequired) {
          const formattedDate = currentDate.slice(5).replace('-', '/');
          violations.push({
            constraintId: 'staffing',
            constraintName: '최소인원',
            severity,
            message: `${formattedDate}: ${SHIFT_TYPE_NAMES[shift]} 근무 ${count}명 (최소 ${minRequired}명)`,
            context: {
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
