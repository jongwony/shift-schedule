import type { Schedule, ShiftAssignment } from '@/types/schedule';
import type { Staff } from '@/types/staff';
import type { ConstraintConfig, Violation, Severity } from '@/types/constraint';

export type ConstraintSeverityType = 'hard' | 'soft';

/**
 * Get the actual severity for a constraint based on user config.
 * hard → 'error', soft → 'warning'
 */
export function getSeverityFromConfig(
  config: ConstraintConfig,
  constraintId: keyof ConstraintConfig['constraintSeverity']
): Severity {
  const severityType = config.constraintSeverity?.[constraintId] ?? 'hard';
  return severityType === 'hard' ? 'error' : 'warning';
}

export interface ConstraintContext {
  schedule: Schedule;
  staff: Staff[];
  config: ConstraintConfig;
  previousPeriodEnd: ShiftAssignment[];
  /** Schedule completeness ratio (0.0 - 1.0) for threshold-based constraint evaluation */
  scheduleCompleteness: number;
}

export interface ConstraintResult {
  satisfied: boolean;
  violations: Violation[];
}

export interface Constraint {
  id: string;
  name: string;
  description: string;
  severityType: ConstraintSeverityType;
  check: (context: ConstraintContext) => ConstraintResult;
}
