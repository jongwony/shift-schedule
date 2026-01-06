import type { Schedule, Staff } from '@/types';

export type ImpactReason = 'staffing' | 'sequence';

export interface CellImpact {
  staffId: string;
  date: string;
  reason: ImpactReason;
}

/**
 * Calculate which cells are affected when a specific cell changes.
 *
 * Impact rules:
 * - staffing: All other staff on the same date (staffing count changes)
 * - sequence: Same staff ±2 days (shiftOrder, consecutiveNight constraints)
 */
export function calculateCellImpact(
  schedule: Schedule,
  staff: Staff[],
  targetCell: { staffId: string; date: string }
): CellImpact[] {
  const impacts: CellImpact[] = [];
  const startDate = new Date(schedule.startDate);
  const targetDate = new Date(targetCell.date);

  // 1. Staffing impact: all other staff on same date
  staff.forEach((s) => {
    if (s.id !== targetCell.staffId) {
      impacts.push({ staffId: s.id, date: targetCell.date, reason: 'staffing' });
    }
  });

  // 2. Sequence impact: same staff ±2 days (for shiftOrder, consecutiveNight)
  for (let offset = -2; offset <= 2; offset++) {
    if (offset === 0) continue;
    const impactDate = new Date(targetDate);
    impactDate.setDate(impactDate.getDate() + offset);
    const dateStr = impactDate.toISOString().split('T')[0];

    // Only include dates within the schedule period (28 days)
    const scheduleEnd = new Date(startDate);
    scheduleEnd.setDate(scheduleEnd.getDate() + 27);
    if (impactDate >= startDate && impactDate <= scheduleEnd) {
      impacts.push({ staffId: targetCell.staffId, date: dateStr, reason: 'sequence' });
    }
  }

  return impacts;
}

/**
 * Create a lookup key for cell impact map.
 */
export function getCellKey(staffId: string, date: string): string {
  return `${staffId}-${date}`;
}

/**
 * Build a map for O(1) lookup of affected cells.
 */
export function buildImpactMap(
  impacts: CellImpact[]
): Map<string, ImpactReason> {
  const map = new Map<string, ImpactReason>();
  for (const impact of impacts) {
    const key = getCellKey(impact.staffId, impact.date);
    // If already has an entry, keep the first reason (priority: sequence > staffing)
    if (!map.has(key)) {
      map.set(key, impact.reason);
    }
  }
  return map;
}
