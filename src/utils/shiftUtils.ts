import type { ShiftAssignment, ShiftType } from '@/types';

/**
 * Calculate schedule completeness as a ratio (0.0 - 1.0).
 * Used to determine when to show staffing violations.
 */
export function calculateScheduleCompleteness(
  assignments: ShiftAssignment[],
  staffCount: number,
  periodDays: number = 28
): number {
  const totalSlots = staffCount * periodDays;
  if (totalSlots === 0) return 0;
  return assignments.length / totalSlots;
}

/**
 * Get all shift assignments for a specific staff member, sorted by date.
 */
export function getShiftSequence(
  assignments: ShiftAssignment[],
  staffId: string
): ShiftAssignment[] {
  return assignments
    .filter((a) => a.staffId === staffId)
    .sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Count shifts by type for a specific staff member.
 */
export function countShiftsByType(
  assignments: ShiftAssignment[],
  staffId: string
): Record<ShiftType, number> {
  const counts: Record<ShiftType, number> = {
    D: 0,
    E: 0,
    N: 0,
    OFF: 0,
  };

  for (const assignment of assignments) {
    if (assignment.staffId === staffId) {
      counts[assignment.shift]++;
    }
  }

  return counts;
}
