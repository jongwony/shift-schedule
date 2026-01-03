import type { Violation } from '@/types';
import { countShiftsByType } from '@/utils/shiftUtils';
import type { Constraint, ConstraintContext } from './types';
import { getSeverityFromConfig } from './types';

export const monthlyNightConstraint: Constraint = {
  id: 'monthly-night',
  name: '월간나이트',
  description: '기간 내 나이트 근무 횟수 확인',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config } = context;
    const violations: Violation[] = [];
    const severity = getSeverityFromConfig(config, 'monthlyNight');

    const required = config.monthlyNightsRequired;

    for (const staffMember of staff) {
      const counts = countShiftsByType(schedule.assignments, staffMember.id);
      const nightCount = counts.N;

      if (nightCount !== required) {
        violations.push({
          constraintId: 'monthly-night',
          constraintName: '월간나이트',
          severity,
          message: `${staffMember.name}: 월간 나이트 ${nightCount}회 (필요: ${required}회)`,
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
