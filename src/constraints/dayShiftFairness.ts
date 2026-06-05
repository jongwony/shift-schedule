import { parseISO, addDays, format } from 'date-fns';
import type { Violation, ShiftAssignment } from '@/types';
import type { Constraint, ConstraintContext } from './types';

function getShiftForStaffOnDate(
  assignments: ShiftAssignment[],
  staffId: string,
  date: string
): string | null {
  const a = assignments.find((x) => x.staffId === staffId && x.date === date);
  return a?.shift ?? null;
}

export const dayShiftFairnessConstraint: Constraint = {
  id: 'day-shift-fairness',
  name: '데이공정성',
  description: '데이(D) 근무 공정 분배',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config } = context;
    const violations: Violation[] = [];

    const softConfig = config.softConstraints?.dayShiftFairness;
    if (!softConfig?.enabled) {
      return { satisfied: true, violations: [] };
    }

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    const counts = new Map<string, number>();
    for (const m of staff) {
      let c = 0;
      for (let i = 0; i < periodDays; i++) {
        const d = format(addDays(startDate, i), 'yyyy-MM-dd');
        const shift = getShiftForStaffOnDate(schedule.assignments, m.id, d);
        if (shift === 'D') c++;
      }
      counts.set(m.id, c);
    }

    const vals = Array.from(counts.values());
    if (vals.length === 0) {
      return { satisfied: true, violations: [] };
    }

    const average = vals.reduce((a, b) => a + b, 0) / vals.length;
    const DEVIATION_THRESHOLD = 1; // symmetric display threshold; metric itself is L1

    for (const m of staff) {
      const count = counts.get(m.id) ?? 0;
      const deviation = count - average;
      if (Math.abs(deviation) > DEVIATION_THRESHOLD) {
        const dir =
          deviation > 0
            ? `+${deviation.toFixed(1)}일 많음`
            : `${deviation.toFixed(1)}일 적음`;
        violations.push({
          constraintId: 'day-shift-fairness',
          constraintName: '데이공정성',
          severity: 'warning',
          message: `${m.name}: 데이 ${count}일 (평균 ${average.toFixed(
            1
          )}일 대비 ${dir})`,
          context: { staffId: m.id, staffName: m.name },
        });
      }
    }

    return { satisfied: violations.length === 0, violations };
  },
};
