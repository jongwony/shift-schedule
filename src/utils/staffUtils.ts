import type { EligibleShift, Staff, ShiftType } from '@/types';

const ALL_SHIFTS: EligibleShift[] = ['D', 'E', 'N'];

/** Returns the eligible work shifts for a staff member, defaulting to all if unset. */
export function getEligibleShifts(staff: Staff): EligibleShift[] {
  return staff.eligibleShifts ?? ALL_SHIFTS;
}

/** Checks if a shift type is eligible for a staff member. OFF is always eligible. */
export function isShiftEligible(staff: Staff, shift: ShiftType): boolean {
  if (shift === 'OFF') return true;
  return getEligibleShifts(staff).includes(shift as EligibleShift);
}
