import type { ShiftAssignment, DayOfWeek, ConstraintSeverity, SoftConstraintConfig, WeeklyStaffing } from './index';
import type { EligibleShift } from './staff';

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
  staffing?: ConstraintSeverity;
  weeklyOff?: ConstraintSeverity;
}

export interface GenerateRequest {
  staff: Array<{ id: string; name: string; eligibleShifts?: EligibleShift[] }>;
  startDate: string;
  constraints: {
    maxConsecutiveNights: number;
    weeklyWorkHours: number;
    weeklyStaffing: WeeklyStaffing[];
    constraintSeverity?: ApiConstraintSeverity;
    softConstraints?: SoftConstraintConfig;
    /**
     * Required nights per staff in the window's front portion (= start-month tail).
     * Solver adds hard constraint: sum(N in front portion) == count (when count > 0).
     * Absent or 0 value means unconstrained.
     */
    requiredNights?: Record<string, number>;
  };
  previousPeriodEnd?: ShiftAssignment[];
  lockedAssignments?: ShiftAssignment[];
  cellExclusions?: Array<{ staffId: string; date: string; excludedShifts: string[] }>;
}

export interface GenerateResponse {
  success: boolean;
  schedule?: { assignments: ShiftAssignment[] };
  error?: ApiError;
  staffJuhuDays?: Array<{ staffId: string; juhuDay: DayOfWeek }>;
}

export interface FeasibilityCheckRequest {
  staff: Array<{ id: string; name: string; eligibleShifts?: EligibleShift[] }>;
  startDate: string;
  constraints: {
    maxConsecutiveNights: number;
    weeklyWorkHours: number;
    weeklyStaffing: WeeklyStaffing[];
    constraintSeverity?: ApiConstraintSeverity;
  };
}

export interface FeasibilityCheckResponse {
  feasible: boolean;
  reasons: string[];
  analysis?: {
    staffCount: number;
    offDaysRequired: number;
    weeklyWorkHours: number;
    totalRequired: number;
    totalAvailable: number;
  };
}
