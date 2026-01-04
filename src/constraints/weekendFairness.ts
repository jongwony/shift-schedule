import { parseISO, addDays, format, getDay } from 'date-fns';
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

function isWeekend(date: Date): boolean {
  const day = getDay(date);
  return day === 0 || day === 6; // Sunday or Saturday
}

export const weekendFairnessConstraint: Constraint = {
  id: 'weekend-fairness',
  name: '주말공정성',
  description: '주말 근무 분배 공정성 확인',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config } = context;
    const violations: Violation[] = [];

    const softConfig = config.softConstraints?.weekendFairness;
    if (!softConfig?.enabled) {
      return { satisfied: true, violations: [] };
    }

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    // Count weekend work days for each staff member
    const weekendWorkCounts: Map<string, number> = new Map();

    for (const staffMember of staff) {
      let weekendWorkDays = 0;

      for (let i = 0; i < periodDays; i++) {
        const currentDate = addDays(startDate, i);
        const currentDateStr = format(currentDate, 'yyyy-MM-dd');

        if (!isWeekend(currentDate)) {
          continue;
        }

        const shift = getShiftForStaffOnDate(
          schedule.assignments,
          staffMember.id,
          currentDateStr
        );

        if (shift && shift !== 'OFF') {
          weekendWorkDays++;
        }
      }

      weekendWorkCounts.set(staffMember.id, weekendWorkDays);
    }

    // Calculate average and check for significant deviation
    const counts = Array.from(weekendWorkCounts.values());
    if (counts.length === 0) {
      return { satisfied: true, violations: [] };
    }

    const average = counts.reduce((a, b) => a + b, 0) / counts.length;
    const threshold = 2; // Deviation threshold

    for (const staffMember of staff) {
      const count = weekendWorkCounts.get(staffMember.id) ?? 0;
      const deviation = count - average;

      // Only flag if significantly above average (working too many weekends)
      if (deviation > threshold) {
        violations.push({
          constraintId: 'weekend-fairness',
          constraintName: '주말공정성',
          severity: 'warning',
          message: `${staffMember.name}: 주말 근무 ${count}일 (평균 ${average.toFixed(1)}일 대비 ${deviation.toFixed(1)}일 초과)`,
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
