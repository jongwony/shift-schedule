# Soft Constraint Scaling Strategy

> Session: 2026-01-04 | Topic: OR-Tools Objective Function Design

## Context

As more soft constraints are added, the current flat weighted sum approach becomes a maintenance burden. Weight tuning grows exponentially complex.

## Problem: Flat Weighted Sum Limitations

Current implementation:
```python
total_penalty = sum(night_deviation_vars) + 10 * sum(juhu_violation_vars)
model.Minimize(total_penalty)
```

Issues:
- Adding new soft constraint requires rebalancing ALL weights
- No clear priority between constraint categories
- Weight values become arbitrary magic numbers
- Difficult to explain to users why one constraint "won" over another

## Solution: Tier-Based Objective Function

### Tier Architecture

```
Tier 0: Safety-adjacent soft (if any exist)
Tier 1: Coverage soft (staffing-derived preferences)
Tier 2: Fairness soft (monthlyNight, equitable distribution)
Tier 3: Preference soft (individual worker preferences)
```

### Implementation Options

**Option A: Big-M Scaling (Single Solve)**
```python
# Calculate safe scale factor per tier
tier_scales = calculate_tier_scales(soft_constraints)

objective = 0
for tier, constraints in grouped_by_tier.items():
    tier_penalty = sum(c.penalty for c in constraints)
    objective += tier_scales[tier] * tier_penalty

model.Minimize(objective)
```

**Option B: Sequential Optimization (Multiple Solves)**
```python
for tier in sorted(tiers):
    add_tier_constraints(model, tier)
    status = solver.Solve(model)
    if status == INFEASIBLE:
        return failure_at_tier(tier)
    # Fix this tier's objective, proceed to next
    model.Add(tier_objective <= solver.ObjectiveValue())
```

### PenaltyTerm Abstraction

Each soft constraint provides structured penalty terms:

```python
@dataclass
class PenaltyTerm:
    expr: LinearExpr      # Penalty expression (e.g., deviation var)
    weight: int           # Weight within tier
    upper_bound: int      # Maximum possible penalty (for scaling)
    tier: int             # Priority tier
    explain_key: str      # For violation explanation (staffId, date, etc.)

class SoftConstraint(Protocol):
    def build(self, model, context) -> list[PenaltyTerm]:
        """Return penalty terms for this constraint."""
        ...
```

### ObjectiveBuilder Pattern

```python
class ObjectiveBuilder:
    def __init__(self):
        self.terms_by_tier: dict[int, list[PenaltyTerm]] = defaultdict(list)

    def add_constraint(self, constraint: SoftConstraint, model, context):
        for term in constraint.build(model, context):
            self.terms_by_tier[term.tier].append(term)

    def build_objective(self, model) -> LinearExpr:
        # Auto-calculate tier scales based on upper_bounds
        scales = self._calculate_safe_scales()
        return sum(
            scales[tier] * sum(t.expr * t.weight for t in terms)
            for tier, terms in self.terms_by_tier.items()
        )
```

## Migration Path

1. Wrap existing `monthlyNight` as `SoftConstraint` with `PenaltyTerm`
2. Assign to Tier 2 (Fairness)
3. New soft constraints implement same interface
4. `ObjectiveBuilder` composes final objective

## Trade-offs

| Approach | Complexity | Performance | Explainability |
|----------|------------|-------------|----------------|
| Flat weighted | Low | Best | Poor |
| Big-M tiers | Medium | Good | Good |
| Sequential solve | High | Slower | Best |

**Recommendation**: Start with Big-M tiers (2-3 tiers max), migrate to sequential only if explainability becomes critical.

## UI Implications

Instead of exposing N individual weight sliders:
- Show 2-4 tier-level priority controls
- Each tier has clear semantic meaning (Safety > Coverage > Fairness > Preference)
- Reduces tuning surface area dramatically
