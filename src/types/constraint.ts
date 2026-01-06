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

// Soft Constraint Configuration Types
export interface SoftConstraintItemConfig {
  enabled: boolean;
}

export interface MaxConsecutiveWorkConfig extends SoftConstraintItemConfig {
  maxDays: number;
}

export interface NightBlockPolicyConfig extends SoftConstraintItemConfig {
  minBlockSize: number;
}

export interface MaxPeriodOffConfig extends SoftConstraintItemConfig {
  maxOff: number;
}

export interface MaxConsecutiveOffConfig extends SoftConstraintItemConfig {
  maxDays: number;
}

export interface SoftConstraintConfig {
  // Tier 1 - Worker perspective
  maxConsecutiveWork: MaxConsecutiveWorkConfig;
  nightBlockPolicy: NightBlockPolicyConfig;
  // Tier 1 - Manager perspective
  maxPeriodOff: MaxPeriodOffConfig;
  maxConsecutiveOff: MaxConsecutiveOffConfig;
  // Tier 2 - Recovery
  gradualShiftProgression: SoftConstraintItemConfig;
  maxSameShiftConsecutive: SoftConstraintItemConfig;
  restClustering: SoftConstraintItemConfig;
  postRestDayShift: SoftConstraintItemConfig;
  // Tier 3 - Quality of life
  weekendFairness: SoftConstraintItemConfig;
  shiftContinuity: SoftConstraintItemConfig;
}

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
    weeklyOff: boolean;
  };
  /** User-configurable severity per constraint (hard = error, soft = warning) */
  constraintSeverity: {
    shiftOrder: ConstraintSeverity;
    nightOffDay: ConstraintSeverity;
    consecutiveNight: ConstraintSeverity;
    monthlyNight: ConstraintSeverity;
    staffing: ConstraintSeverity;
    weeklyOff: ConstraintSeverity;
  };
  /** Soft constraint configuration for worker preference-based constraints */
  softConstraints: SoftConstraintConfig;
}
