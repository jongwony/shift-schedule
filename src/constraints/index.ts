import { shiftOrderConstraint } from './shiftOrder';
import { nightOffDayConstraint } from './nightOffDay';
import { consecutiveNightConstraint } from './consecutiveNight';
import { monthlyNightConstraint } from './monthlyNight';
import { staffingConstraint } from './staffing';
import { juhuConstraint } from './juhu';
import { weeklyOffConstraint } from './weeklyOff';
// Soft constraints - Worker perspective
import { maxConsecutiveWorkConstraint } from './maxConsecutiveWork';
import { nightBlockPolicyConstraint } from './nightBlockPolicy';
// Soft constraints - Manager perspective
import { maxPeriodOffConstraint } from './maxPeriodOff';
import { maxConsecutiveOffConstraint } from './maxConsecutiveOff';
// Soft constraints - Recovery
import { gradualShiftProgressionConstraint } from './gradualShiftProgression';
import { maxSameShiftConsecutiveConstraint } from './maxSameShiftConsecutive';
import { restClusteringConstraint } from './restClustering';
import { postRestDayShiftConstraint } from './postRestDayShift';
// Soft constraints - Quality of life
import { weekendFairnessConstraint } from './weekendFairness';
import { shiftContinuityConstraint } from './shiftContinuity';
import type { Constraint } from './types';

export const constraintRegistry: Constraint[] = [
  // Hard constraints (legal/regulatory)
  shiftOrderConstraint,
  nightOffDayConstraint,
  consecutiveNightConstraint,
  monthlyNightConstraint,
  staffingConstraint,
  juhuConstraint,
  weeklyOffConstraint,
  // Soft constraints - Worker perspective (T1)
  maxConsecutiveWorkConstraint,
  nightBlockPolicyConstraint,
  // Soft constraints - Manager perspective (T1)
  maxPeriodOffConstraint,
  maxConsecutiveOffConstraint,
  // Soft constraints - Recovery (T2)
  gradualShiftProgressionConstraint,
  maxSameShiftConsecutiveConstraint,
  restClusteringConstraint,
  postRestDayShiftConstraint,
  // Soft constraints - Quality of life (T3)
  weekendFairnessConstraint,
  shiftContinuityConstraint,
];

export { shiftOrderConstraint } from './shiftOrder';
export { nightOffDayConstraint } from './nightOffDay';
export { consecutiveNightConstraint } from './consecutiveNight';
export { monthlyNightConstraint } from './monthlyNight';
export { staffingConstraint } from './staffing';
export { juhuConstraint } from './juhu';
export { weeklyOffConstraint } from './weeklyOff';
// Soft constraints - Worker perspective
export { maxConsecutiveWorkConstraint } from './maxConsecutiveWork';
export { nightBlockPolicyConstraint } from './nightBlockPolicy';
// Soft constraints - Manager perspective
export { maxPeriodOffConstraint } from './maxPeriodOff';
export { maxConsecutiveOffConstraint } from './maxConsecutiveOff';
// Soft constraints - Recovery
export { gradualShiftProgressionConstraint } from './gradualShiftProgression';
export { maxSameShiftConsecutiveConstraint } from './maxSameShiftConsecutive';
export { restClusteringConstraint } from './restClustering';
export { postRestDayShiftConstraint } from './postRestDayShift';
// Soft constraints - Quality of life
export { weekendFairnessConstraint } from './weekendFairness';
export { shiftContinuityConstraint } from './shiftContinuity';

export type { Constraint, ConstraintContext, ConstraintResult, ConstraintSeverityType } from './types';
