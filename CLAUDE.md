# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Generic shift scheduling feasibility checker - validates 28-day (4-week) schedules against 7 constraints in real-time. Shift types: D (Day), E (Evening), N (Night), OFF.

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

**7 Constraints** (default severity in parentheses):
| Constraint | Default | Description |
|------------|---------|-------------|
| `staffing` | Hard | Min/max staff per shift type |
| `shiftOrder` | Hard | Forbidden transitions (N→D, N→E, E→D) |
| `consecutiveNight` | Hard | Max consecutive night shifts |
| `nightOffDay` | Hard | N-OFF-D pattern forbidden |
| `weeklyOff` | Hard | Min OFF days per week (based on weeklyWorkHours) |
| `juhu` | Hard | Weekly off-day must match staff's juhuDay (**LEGAL/IMMUTABLE**) |
| `monthlyNight` | Soft | Required night shifts per month |

**UX Features**:
- Completeness threshold (50%): Staffing errors suppressed until schedule is half-filled
- Hard/Soft distinction: Soft violations shown with toggle after auto-generation, filtered by cell during manual editing
- Cascading visualization: Hover shows affected cells (staffing/sequence/juhu)
- Auto-generation: Backend API integration (`VITE_SOLVER_API_URL`)

**Core Types** (`src/types/`):
- `Staff`: {id, name, juhuDay (0-6, JS convention: 0=Sunday)}
- `ShiftAssignment`: {staffId, date, shift}
- `Schedule`: {id, name, startDate, assignments[]}

**API Types** (`src/types/api.ts`):
- `GenerateRequest/Response`: Schedule generation API
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

**Shift** (`src/utils/shiftUtils.ts`): `calculateScheduleCompleteness()`, `getShiftSequence()`, `countShiftsByType()`

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
- Request: `{staff, startDate, constraints, previousPeriodEnd?}`
- Response: `{success, schedule?, error?}` or `{feasible, reasons[], analysis?}`

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
- When adding a constraint:
  1. Create constraint file with `check()` using `getSeverityFromConfig(config, 'constraintId')`
  2. Add to `enabledConstraints` and `constraintSeverity` in `ConstraintConfig` type
  3. Add default values in `getDefaultConfig()`
  4. Register in `src/constraints/index.ts`
