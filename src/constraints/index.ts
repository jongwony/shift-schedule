import { shiftOrderConstraint } from './shiftOrder';
import { nightOffDayConstraint } from './nightOffDay';
import { consecutiveNightConstraint } from './consecutiveNight';
import { monthlyNightConstraint } from './monthlyNight';
import { staffingConstraint } from './staffing';
import { juhuConstraint } from './juhu';
import { weeklyOffConstraint } from './weeklyOff';
import type { Constraint } from './types';

export const constraintRegistry: Constraint[] = [
  shiftOrderConstraint,
  nightOffDayConstraint,
  consecutiveNightConstraint,
  monthlyNightConstraint,
  staffingConstraint,
  juhuConstraint,
  weeklyOffConstraint,
];

export { shiftOrderConstraint } from './shiftOrder';
export { nightOffDayConstraint } from './nightOffDay';
export { consecutiveNightConstraint } from './consecutiveNight';
export { monthlyNightConstraint } from './monthlyNight';
export { staffingConstraint } from './staffing';
export { juhuConstraint } from './juhu';
export { weeklyOffConstraint } from './weeklyOff';

export type { Constraint, ConstraintContext, ConstraintResult, ConstraintSeverityType } from './types';
