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

const CONSECUTIVE_THRESHOLD = 5;
const WORK_SHIFT_TYPES = ['D', 'E', 'N'] as const;

export const maxSameShiftConsecutiveConstraint: Constraint = {
  id: 'max-same-shift-consecutive',
  name: '동일근무연속상한',
  description: '동일 근무(D/E/N) 5일 이상 연속 배치 방지',
  severityType: 'soft',

  check(context: ConstraintContext) {
    const { schedule, staff, config, previousPeriodEnd } = context;
    const violations: Violation[] = [];

    const softConfig = config.softConstraints?.maxSameShiftConsecutive;
    if (!softConfig?.enabled) {
      return { satisfied: true, violations: [] };
    }

    const startDate = parseISO(schedule.startDate);
    const periodDays = 28;

    // Combine assignments for continuity check
    const allAssignments = [...previousPeriodEnd, ...schedule.assignments];

    for (const staffMember of staff) {
      for (const shiftType of WORK_SHIFT_TYPES) {
        // Build array of consecutive same-shift sequences
        let consecutiveCount = 0;

        // Check previous period end for continuity
        if (previousPeriodEnd.length > 0) {
          const prevAssignments = previousPeriodEnd
            .filter((a) => a.staffId === staffMember.id)
            .sort((a, b) => a.date.localeCompare(b.date));

          // Count trailing consecutive same shifts from previous period
          for (let i = prevAssignments.length - 1; i >= 0; i--) {
            if (prevAssignments[i].shift === shiftType) {
              consecutiveCount++;
            } else {
              break;
            }
          }
        }

        // Check current period
        for (let i = 0; i < periodDays; i++) {
          const currentDate = format(addDays(startDate, i), 'yyyy-MM-dd');
          const currentShift = getShiftForStaffOnDate(
            allAssignments,
            staffMember.id,
            currentDate
          );

          if (currentShift === shiftType) {
            consecutiveCount++;

            // Check if we hit the threshold
            if (consecutiveCount === CONSECUTIVE_THRESHOLD) {
              const shiftLabel =
                shiftType === 'D' ? '주간(D)' : shiftType === 'E' ? '저녁(E)' : '야간(N)';
              violations.push({
                constraintId: 'max-same-shift-consecutive',
                constraintName: '동일근무연속상한',
                severity: 'warning',
                message: `${staffMember.name}: ${currentDate.slice(5).replace('-', '/')}에 ${shiftLabel} ${CONSECUTIVE_THRESHOLD}일 연속 (다양한 근무 권장)`,
                context: {
                  staffId: staffMember.id,
                  staffName: staffMember.name,
                  date: currentDate,
                },
              });
            }
          } else {
            consecutiveCount = 0;
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
