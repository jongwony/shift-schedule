export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type EligibleShift = 'D' | 'E' | 'N';

export interface Staff {
  id: string;
  name: string;
  eligibleShifts?: EligibleShift[];
}
