# Constraint Architecture Evolution

> Session: 2026-01-04 | Topic: OR-Tools Hard/Soft Constraint Strategy

## Context

This insight emerged from a 4-perspective Prothesis analysis (OR Theory, Industry Practice, Codebase, Worker Experience) examining how to handle hard/soft constraints in the OR-Tools CP-SAT solver.

## Key Insight: 3-Dimensional Constraint Model

### Problem with Binary Hard/Soft

The current binary Hard/Soft distinction is insufficient because:
- `juhu` (주휴) is legally required but was previously considered configurable
- Multiple soft constraints with different priorities cannot be expressed
- Worker trust requires semantic understanding, not just severity

### Solution: Authority + Mutability + Strength

```typescript
type ConstraintAuthority = 'LEGAL' | 'SAFETY' | 'COVERAGE' | 'POLICY' | 'PREFERENCE';
type ConstraintMutability = 'IMMUTABLE' | 'CONFIGURABLE';
type ConstraintStrength = 'HARD' | 'SOFT';

interface ConstraintDefinition {
  id: string;
  authority: ConstraintAuthority;
  mutability: ConstraintMutability;
  strength: ConstraintStrength;
}
```

### Constraint Classification

| Constraint | Authority | Mutability | Strength | Notes |
|------------|-----------|------------|----------|-------|
| juhu | LEGAL | IMMUTABLE | HARD | Korean Labor Law (주휴일) |
| nightOffDay | LEGAL | IMMUTABLE | HARD | Fatigue safety |
| consecutiveNight | SAFETY | CONFIGURABLE | HARD | Default max 4 |
| weeklyOff | LEGAL | CONFIGURABLE | HARD | Parameter adjustable within legal bounds |
| shiftOrder | SAFETY | CONFIGURABLE | HARD | Physiological recovery |
| staffing | COVERAGE | CONFIGURABLE | HARD | Min/max adjustable |
| monthlyNight | PREFERENCE | CONFIGURABLE | SOFT | Fairness distribution |

### UI Implications

- `LEGAL + IMMUTABLE`: Hide strength toggle, show legal basis explanation
- `CONFIGURABLE`: Show toggle, but parameters may have legal bounds
- Future: `JurisdictionProfile` for multi-country support

## Application

When adding new constraints:
1. Classify by Authority first (determines legal immutability)
2. Set Mutability based on business needs
3. Default Strength follows Authority (LEGAL → HARD, PREFERENCE → SOFT)
