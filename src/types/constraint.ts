export type Severity = 'error' | 'warning';

export interface Violation {
  constraintId: string;
  constraintName: string;
  severity: Severity;
  message: string;
  context: {
    staffId?: string;
    staffName?: string;
    date?: string;
    dates?: string[];
  };
}

export interface FeasibilityResult {
  feasible: boolean;
  violations: Violation[];
  checkedAt: string;
}

export interface StaffingRequirement {
  min: number;
  max: number;
}

export interface DailyStaffing {
  day: StaffingRequirement;
  evening: StaffingRequirement;
  night: StaffingRequirement;
}

export type ConstraintSeverity = 'hard' | 'soft';

export interface ConstraintConfig {
  maxConsecutiveNights: number;
  monthlyNightsRequired: number;
  weeklyWorkHours: number;
  weekdayStaffing: DailyStaffing;
  weekendStaffing: DailyStaffing;
  enabledConstraints: {
    shiftOrder: boolean;
    nightOffDay: boolean;
    consecutiveNight: boolean;
    monthlyNight: boolean;
    staffing: boolean;
    juhu: boolean;
    weeklyOff: boolean;
  };
  /** User-configurable severity per constraint (hard = error, soft = warning) */
  constraintSeverity: {
    shiftOrder: ConstraintSeverity;
    nightOffDay: ConstraintSeverity;
    consecutiveNight: ConstraintSeverity;
    monthlyNight: ConstraintSeverity;
    staffing: ConstraintSeverity;
    juhu: ConstraintSeverity;
    weeklyOff: ConstraintSeverity;
  };
}
