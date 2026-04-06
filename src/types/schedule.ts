import type { DayOfWeek } from './staff';

export type ShiftType = 'D' | 'E' | 'N' | 'OFF';

export interface ShiftAssignment {
  staffId: string;
  date: string;
  shift: ShiftType;
  isLocked?: boolean;
}

export interface Schedule {
  id: string;
  name: string;
  startDate: string;
  assignments: ShiftAssignment[];
  staffJuhuDays?: Array<{ staffId: string; juhuDay: DayOfWeek }>;
  /** Cell-level shift exclusions. Key: getCellKey(staffId, date), Value: excluded ShiftTypes */
  cellExclusions?: Record<string, ShiftType[]>;
}

export interface PreviousPeriodData {
  assignments: ShiftAssignment[];
}
