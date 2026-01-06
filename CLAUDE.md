# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Generic shift scheduling feasibility checker - validates 28-day (4-week) schedules against 18 constraints (8 hard + 10 soft) in real-time. Shift types: D (Day), E (Evening), N (Night), OFF.

## Commands

```bash
npm run dev          # Development server (localhost:5173)
npm run build        # TypeScript + Vite production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm test             # Run all tests once
npm run test:watch   # Watch mode
npx vitest run src/constraints/__tests__/staffing.test.ts  # Single test file
```

## Testing

**Config:** `vitest.config.ts` - jsdom environment, globals enabled, setup in `src/test/setup.ts`.

**Pattern:** Tests use `createTestContext()` factory:
```typescript
function createTestContext(assignments: ShiftAssignment[], staffList?: Staff[]): ConstraintContext
```

**Standard test date:** `2025-01-06` (Monday) for predictable weekday/weekend patterns.

## Architecture

```
App.tsx
    └── useSchedule hook (central state, localStorage persistence)
              ├── checkFeasibility (solver/feasibilityChecker.ts)
              │         └── constraintRegistry (src/constraints/index.ts)
              ├── generateAutoSchedule → solverApi.ts → Backend API
              └── affectedCells → impactCalculator.ts (cascading visualization)
```

**Constraint System**: Each constraint implements `Constraint` interface with `check(context) => {satisfied, violations[]}`. Severity is user-configurable via `config.constraintSeverity` (hard → error, soft → warning). Registry pattern in `src/constraints/index.ts`.

**8 Hard Constraints** (법정 규제 - 위반 시 INFEASIBLE):
| Constraint | Description |
|------------|-------------|
| `locked` | User-locked cell assignments (must be honored) |
| `staffing` | Min/max staff per shift type |
| `shiftOrder` | Forbidden transitions (N→D, N→E, E→D) |
| `consecutiveNight` | Max consecutive night shifts |
| `nightOffDay` | N-OFF-D pattern forbidden |
| `weeklyOff` | Min OFF days per week (based on weeklyWorkHours) |
| `juhu` | Weekly off-day must match staff's juhuDay (**LEGAL/IMMUTABLE**) |
| `monthlyNight` | Required night shifts per month (configurable hard/soft) |
| `prevPeriodWork` | Previous period trailing work + current must not exceed maxDays |

**10 Soft Constraints** (위반 시 페널티):

*근무자 관점 (Worker Perspective):*
| Constraint | Tier | Weight | Description |
|------------|------|--------|-------------|
| `maxConsecutiveWork` | T1 | 100 | Max consecutive work days (default: 5) |
| `nightBlockPolicy` | T1 | 90 | Prevent isolated night shifts (min block: 2) |
| `gradualShiftProgression` | T2 | 70 | Prevent D→N direct transition |
| `maxSameShiftConsecutive` | T2 | 65 | Prevent same shift 5+ consecutive days |
| `restClustering` | T2 | 60 | Prevent isolated OFF days |
| `postRestDayShift` | T2 | 50 | Prevent OFF→N transition |
| `weekendFairness` | T3 | 30 | Fair weekend work distribution |
| `shiftContinuity` | T3 | 20 | Prevent excessive shift type changes |

*관리자 관점 (Manager Perspective):*
| Constraint | Tier | Weight | Description |
|------------|------|--------|-------------|
| `maxPeriodOff` | T1 | 85 | Max OFF days per period (default: 9) |
| `maxConsecutiveOff` | T1 | 80 | Max consecutive OFF days (default: 2) |

**Tier System**: T1×1000 > T2×100 > T3×10 - Higher tier always dominates in optimization.
- T1 근무자: 건강 (maxConsecutiveWork, nightBlockPolicy)
- T1 관리자: 운영 효율 (maxPeriodOff, maxConsecutiveOff)
- T2: 회복 (gradualShiftProgression, restClustering, etc.)
- T3: 삶의 질 (weekendFairness, shiftContinuity)

**Compromise Point**: `restClustering` (T2, promotes 2+ consecutive OFF) + `maxConsecutiveOff` (T1, penalizes 3+ consecutive OFF) converge on **2-day consecutive OFF** as optimal.

**UX Features**:
- Completeness threshold (50%): Staffing errors suppressed until schedule is half-filled
- Hard/Soft distinction: Soft violations shown with toggle after auto-generation, filtered by cell during manual editing
- Cascading visualization: Hover shows affected cells (staffing/sequence/juhu)
- Auto-generation: Backend API integration (`VITE_SOLVER_API_URL`)
- Cell Lock (고정): Right-click (desktop) or long-press 500ms (mobile) to lock cells; locked cells preserved during auto-generation
- Previous Period Input: 7-day input window for boundary constraint checking

**Core Types** (`src/types/`):
- `Staff`: {id, name, juhuDay (0-6, JS convention: 0=Sunday)}
- `ShiftAssignment`: {staffId, date, shift, isLocked?}
- `Schedule`: {id, name, startDate, assignments[]}
- `SoftConstraintConfig`: Per-constraint `{enabled, maxDays?, minBlockSize?, maxOff?}`

**API Types** (`src/types/api.ts`):
- `GenerateRequest`: {staff, startDate, constraints, previousPeriodEnd?, lockedAssignments?}
- `GenerateResponse`: {success, schedule?, error?}
- `FeasibilityCheckRequest/Response`: Pre-generation feasibility check
- `ApiError`: {code: `INFEASIBLE` | `TIMEOUT` | `INVALID_INPUT`, message}

**Services** (`src/services/solverApi.ts`):
- `generateSchedule()`, `checkFeasibilityApi()`, `isApiConfigured()`

**Day-of-Week Convention**:
Frontend uses JavaScript `getDay()` (0=Sunday), Backend uses Python `weekday()` (0=Monday). Backend converts: `python_weekday = (js_day - 1) % 7`

**localStorage Schema Migration**:
`useLocalStorage` hook deep-merges `initialValue` with stored data, ensuring new config fields (e.g., `constraintSeverity.juhu`) are added to existing user data.

## Utilities

**Date** (`src/utils/dateUtils.ts`): `formatDateKorean()`, `getWeekBoundaries()`, `forEachDateInRange()`, `isWeekend()`

**Day** (`src/utils/dayUtils.ts`): `DAY_NAMES` - Korean day-of-week names (일/월/화/수/목/금/토) keyed by DayOfWeek (0=Sunday)

**Shift** (`src/utils/shiftUtils.ts`): `calculateScheduleCompleteness()`, `getShiftSequence()`, `countShiftsByType()`, `countStaffByShiftPerDate()`

**Impact** (`src/utils/impactCalculator.ts`): Cascading visualization rules:
- `staffing`: All other staff on same date
- `sequence`: Same staff ±2 days (for shiftOrder, consecutiveNight)
- `juhu`: Same staff's juhuDay dates across the 4-week period

## State Management

**useSchedule hook** (`src/hooks/useSchedule.ts`):
- `showAllViolations` toggle (auto-enabled after auto-generation)
- `editingCell` state for soft violation cell-based filtering
- Session recovery toast on mount (shows once per session)
- `beforeunload` warning when unsaved data exists

**Storage keys**: `shift-schedule-staff`, `shift-schedule-current`, `shift-schedule-config`, `shift-schedule-previous`

## Backend Integration

**Production**:
- Frontend: https://shift-schedule.connects.im (GitHub Pages)
- Backend: https://4jyos1w157.execute-api.ap-northeast-2.amazonaws.com (Lambda Container + HTTP API)

**Endpoints**:
- `POST /generate` - Auto-generate schedule using OR-Tools CP-SAT solver
- `POST /check-feasibility` - Pre-check mathematical feasibility before generation

**Solver**: `../api/chalicelib/schedule_generator.py` (OR-Tools CP-SAT)
- Request: `{staff, startDate, constraints, previousPeriodEnd?}` (constraints includes `softConstraints`)
- Response: `{success, schedule?, error?}` or `{feasible, reasons[], analysis?}`

**Backend Soft Constraints** (`../api/chalicelib/soft_constraints/`):
- `types.py`: `PenaltyTerm` dataclass, `SoftConstraint` protocol
- `objective_builder.py`: `ObjectiveBuilder` with `TIER_SCALES = {1: 1000, 2: 100, 3: 10}`
- `__init__.py`: `SOFT_CONSTRAINT_CLASSES` registry, `create_constraint(id, config)` factory
- **Boundary Pattern**: All soft constraints support 7-day previous period via `context["previous_period_end"]`

**Backend Soft Constraint Context** (passed to `build(model, context)`):
- `shifts`: CP-SAT decision variables `{(s, d, sh): BoolVar}`
- `indices`: `{D: 0, E: 1, N: 2, OFF: 3}`
- `num_staff`, `num_days`, `start_date`, `config`
- `staff_list`: `[{id, name, juhuDay}]`
- `previous_period_end`: `[{staffId, date, shift}]` (up to 7 days)

**Local development**:
```bash
/dev          # Start both frontend and backend (background)
/dev-stop     # Stop all dev servers
/tasks        # Check running servers
```

Manual start:
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend (from ../api/)
source .venv/bin/activate && chalice local
```

**Environment**:
- `.env`: `VITE_SOLVER_API_URL=http://localhost:8000` (local, uses `export` for direnv compatibility)
- `.env.production`: Production API URL (auto-loaded by Vite build)

**constraintSeverity flow**: Frontend config → API → CP-SAT solver. When `juhu: 'hard'`, solver enforces `model.Add(OFF == 1)` on juhu days (INFEASIBLE if understaffed). When `juhu: 'soft'`, violations are penalized but allowed.

**Backend deployment**: Lambda Container Image (ARM64) due to ortools binary size. See `../api/Dockerfile.lambda`.

## Deployment

**GitHub Actions** (`.github/workflows/deploy.yml`): Pushes to `main` auto-deploy to GitHub Pages.
- Custom domain via `public/CNAME`
- Vite builds with `.env.production` values

## Conventions

- Path alias: `@/*` → `./src/*`
- UI: Radix UI + shadcn/ui pattern (components.json)
- State: localStorage keys prefixed `shift-schedule-`
- Tests: `src/constraints/__tests__/*.test.ts`
- Commands: `.claude/commands/*.md` (e.g., `/dev`, `/dev-stop`)
- Insights: `.claude/.insights/*.md`:
  - `constraint-architecture-evolution.md`: 3D constraint model (Authority/Mutability/Strength), juhu as LEGAL/IMMUTABLE
  - `infeasible-diagnosis-strategy.md`: Two-phase solve + UNSAT core extraction via `SufficientAssumptionsForInfeasibility()`
  - `soft-constraint-scaling.md`: Tier-based objective function, PenaltyTerm abstraction for future soft constraints
- When adding a **hard** constraint:
  1. Create constraint file with `check()` using `getSeverityFromConfig(config, 'constraintId')`
  2. Add to `enabledConstraints` and `constraintSeverity` in `ConstraintConfig` type
  3. Add default values in `getDefaultConfig()`
  4. Register in `src/constraints/index.ts`
  5. Add CP-SAT constraint in `../api/chalicelib/schedule_generator.py`
- When adding a **soft** constraint:
  1. Frontend: Create `src/constraints/{id}.ts` with `severityType: 'soft'`, check `config.softConstraints?.{id}?.enabled`
  2. Add type to `SoftConstraintConfig` in `src/types/constraint.ts`
  3. Add default in `getDefaultConfig()` under `softConstraints`
  4. Register in `src/constraints/index.ts`
  5. Backend: Create `../api/chalicelib/soft_constraints/{snake_case}.py` implementing `SoftConstraint` protocol
  6. Register in `soft_constraints/__init__.py`
- When adding **boundary-aware** soft constraint (considers previous period):
  1. Frontend: Use Map-based lookup with `_count_trailing_*` or similar helper
  2. Backend: Extract `previous_period_end` from context, build `shift_by_date` Map
  3. Handle two boundary cases:
     - Case A: Day 0 triggered by previous period (e.g., prev trailing work + day 0 exceeds limit)
     - Case B: Prev day -1 was isolated (confirm at day 0 whether pattern completes)
  4. Use `_get_prev_boundary_shifts()` or `_get_prev_day_shift()` helper pattern
