import type { Schedule, Staff } from '@/types';

export type ImpactReason = 'staffing' | 'sequence' | 'juhu';

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
 * - juhu: Same staff's juhuDay dates in the schedule period (juhu constraint)
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

  // 3. Juhu impact: same staff's juhuDay dates in the schedule period
  const staffMember = staff.find((s) => s.id === targetCell.staffId);
  if (staffMember) {
    for (let week = 0; week < 4; week++) {
      for (let day = 0; day < 7; day++) {
        const checkDate = new Date(startDate);
        checkDate.setDate(checkDate.getDate() + week * 7 + day);
        const checkDateStr = checkDate.toISOString().split('T')[0];

        // Only add if it's the staff's juhuDay and not the target cell
        if (
          checkDate.getDay() === staffMember.juhuDay &&
          checkDateStr !== targetCell.date
        ) {
          impacts.push({
            staffId: targetCell.staffId,
            date: checkDateStr,
            reason: 'juhu',
          });
        }
      }
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
    // If already has an entry, keep the first reason (priority: sequence > juhu > staffing)
    if (!map.has(key)) {
      map.set(key, impact.reason);
    }
  }
  return map;
}
