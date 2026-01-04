---
date: 2026-01-04
scope: mixed
type: mixed
project: -Users-choi-Downloads-github-private-shift-schedule
session: e635bf3c-280b-48a1-97a5-e6ab21e1f7af
source: ~/.claude/projects/-Users-choi-Downloads-github-private-shift-schedule/e635bf3c-280b-48a1-97a5-e6ab21e1f7af.jsonl
---

# Session Insights: shift-schedule (2026-01-04)

## Applied Insights

### #9 Interruption Handling
- **Location**: `~/.claude/rules/communication.md`
- **Scope**: Universal
- **Type**: Pattern
- **Frequency**: High (>20%)

```markdown
## Interruption Handling
User interruption during tool execution indicates:
- **Context provision**: User supplies value directly (URL, path) → incorporate immediately
- **Direction change**: User corrects approach → pause, re-confirm before resuming
- Don't repeat interrupted actions without verification
```

---

## Deferred Insights

### #1 Dev Server Port Conflict Handling
- **Scope**: Project
- **Type**: Pattern
- **Rationale**: Project-specific dev workflow
- **Re-evaluation**: When creating reusable `/dev` command template

```markdown
## Dev Server Startup
- Check for port conflicts before starting (lsof -ti:PORT)
- Vite auto-fallback to next port; backend needs explicit kill
- Report actual running URLs, not just expected ones
```

### #4 Lambda Container for Large Binaries
- **Scope**: Domain (AWS Lambda)
- **Type**: Decision
- **Rationale**: AWS-specific deployment knowledge

```markdown
## Lambda Binary Dependencies
- ortools/pandas/numpy → Container Image Lambda required
- Zip deployment limit: 50MB
- Container Image limit: 10GB
- Chalice value diminishes with Docker (Dockerfile replaces auto-packaging)
```

### #5 Service Separation Pattern
- **Scope**: Domain (AWS)
- **Type**: Pattern
- **Rationale**: AWS architecture pattern

```markdown
## API Separation Pattern
- Heavy compute → Lambda Container + Function URL
- Lightweight → Keep in Chalice Zip
- Lambda Function URL: No API Gateway cost, CORS manual
- Frontend: Use different VITE_*_API_URL per service type
```

### #6 Syneidesis Usage
- **Scope**: Project (epistemic-protocols plugin)
- **Type**: Pattern
- **Rationale**: Plugin-specific, already documented in skill

```markdown
## Syneidesis Usage
- Invoke at deployment/irreversible decision points
- Surfaces: DNS config, environment variables, API URLs
- Stakes assessment: High for external effects
```

### #7 Table Format for Comparisons
- **Scope**: Universal
- **Type**: Style
- **Rationale**: Already implicit in output style, low trigger frequency

```markdown
## Response Format
- Use tables for: Option comparison, status summaries
- Include cost implications in deployment tables
```

---

## Excluded Insights

### #2 GitHub Pages + CNAME
- **Reason**: Well-documented in Vite/GitHub docs, project-specific

### #3 GitHub Pages enablement: true
- **Reason**: One-time setup issue, not recurring

### #8 Vite Environment Files
- **Reason**: Standard Vite knowledge, well-documented

### #10 Chrome MCP Port Awareness
- **Reason**: Tool-specific edge case, low frequency
