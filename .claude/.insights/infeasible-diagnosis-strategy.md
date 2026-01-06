# INFEASIBLE Diagnosis Strategy

> Session: 2026-01-04 | Topic: OR-Tools UNSAT Core Extraction

## Context

When CP-SAT solver returns INFEASIBLE, users receive a generic error with no actionable information. This insight documents the recommended diagnostic approach.

## Key Finding: Category Error Prevention

**Critical Understanding**: INFEASIBLE means hard constraints conflict. Soft constraint adjustment CANNOT resolve INFEASIBLE - this is a category error.

- Soft constraints are in the objective function, not feasibility constraints
- Relaxing soft constraints has zero effect on feasibility
- Resolution requires: add staff, reduce requirements, or change hard→soft BEFORE solving

## Recommended Architecture: Two-Phase + Assumption Core

### Phase 1: Hard-Only Feasibility Check

```python
def check_hard_feasibility(request):
    model = build_model(hard_constraints_only=True)
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 5

    status = solver.Solve(model)
    if status == cp_model.INFEASIBLE:
        return diagnose_infeasibility(model, solver)
    return {'feasible': True}
```

### Diagnostic Solve: Assumption-Based UNSAT Core

```python
def diagnose_infeasibility(model, constraints_as_assumptions):
    # Each hard constraint guarded by assumption literal
    assumption_literals = []
    for name, constraint_var in constraints_as_assumptions.items():
        assumption_literals.append(constraint_var)

    solver = cp_model.CpSolver()
    status = solver.Solve(model, assumptions=assumption_literals)

    if status == cp_model.INFEASIBLE:
        # Get minimal conflicting subset
        core = solver.SufficientAssumptionsForInfeasibility()
        return [name for name, var in constraints_as_assumptions.items()
                if var.Index() in core]
    return []
```

### Phase 2: Full Optimization (only if Phase 1 succeeds)

```python
if feasibility_result['feasible']:
    model_full = build_model()  # Include soft constraints
    model_full.Minimize(weighted_soft_penalties)
    # ... proceed with optimization
```

## Implementation Pattern: User Input in Assumptions

**Key Enhancement**: Include user inputs (fixed assignments, leave requests) as assumptions to identify "which request caused the conflict":

```python
# User's fixed assignment as assumption
a = model.NewBoolVar("assume_fixed_kim_20260105_OFF")
model.Add(shifts[(kim_id, day5, OFF)] == 1).OnlyEnforceIf(a)
model.AddAssumption(a)

# If INFEASIBLE and 'a' in core → "Kim's 1/5 OFF request conflicts"
```

## API Response Enhancement

```python
# Current (insufficient)
{'success': False, 'error': {'code': 'INFEASIBLE', 'message': '...'}}

# Recommended
{
    'success': False,
    'error': {
        'code': 'INFEASIBLE',
        'message': '...',
        'diagnosis': {
            'conflicting_constraints': ['weeklyOff', 'staffing'],
            'conflicting_inputs': ['kim_20260105_OFF'],
            'suggestions': [
                {'action': 'add_staff', 'minimum': 1},
                {'action': 'remove_fixed', 'input': 'kim_20260105_OFF'}
            ]
        }
    }
}
```

## Caveats

- `SufficientAssumptionsForInfeasibility()` returns a sufficient (not minimal) subset
- Some constraints may be difficult to reify → use toggle-based fallback
- Diagnostic solve adds overhead → only run on INFEASIBLE
