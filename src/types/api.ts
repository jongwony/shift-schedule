import type { ShiftAssignment, DailyStaffing, DayOfWeek, ConstraintSeverity } from './index';

export type GenerationStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ApiError {
  code: 'INFEASIBLE' | 'TIMEOUT' | 'INVALID_INPUT';
  message: string;
}

/** Constraint severity configuration for API requests */
export interface ApiConstraintSeverity {
  shiftOrder?: ConstraintSeverity;
  nightOffDay?: ConstraintSeverity;
  consecutiveNight?: ConstraintSeverity;
  monthlyNight?: ConstraintSeverity;
  staffing?: ConstraintSeverity;
  juhu?: ConstraintSeverity;
  weeklyOff?: ConstraintSeverity;
}

export interface GenerateRequest {
  staff: Array<{ id: string; name: string; juhuDay: DayOfWeek }>;
  startDate: string;
  constraints: {
    maxConsecutiveNights: number;
    monthlyNightsRequired: number;
    weeklyWorkHours: number;
    weekdayStaffing: DailyStaffing;
    weekendStaffing: DailyStaffing;
    constraintSeverity?: ApiConstraintSeverity;
  };
  previousPeriodEnd?: ShiftAssignment[];
}

export interface GenerateResponse {
  success: boolean;
  schedule?: { assignments: ShiftAssignment[] };
  error?: ApiError;
}

export interface FeasibilityCheckRequest {
  staff: Array<{ id: string; name: string; juhuDay: DayOfWeek }>;
  startDate: string;
  constraints: {
    maxConsecutiveNights: number;
    monthlyNightsRequired: number;
    weeklyWorkHours: number;
    weekdayStaffing: DailyStaffing;
    weekendStaffing: DailyStaffing;
    constraintSeverity?: ApiConstraintSeverity;
  };
}

export interface FeasibilityCheckResponse {
  feasible: boolean;
  reasons: string[];
  analysis?: {
    staffCount: number;
    weekdayMinStaff: number;
    weekendMinStaff: number;
    offDaysRequired: number;
    weeklyWorkHours: number;
  };
}
