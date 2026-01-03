export type ShiftType = 'D' | 'E' | 'N' | 'OFF';

export interface ShiftAssignment {
  staffId: string;
  date: string;
  shift: ShiftType;
}

export interface Schedule {
  id: string;
  name: string;
  startDate: string;
  assignments: ShiftAssignment[];
}

export interface PreviousPeriodData {
  assignments: ShiftAssignment[];
}
