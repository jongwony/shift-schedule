---
description: Start frontend and backend servers for local development
---

# Local Development Environment

Start both frontend (Vite) and backend (Chalice) servers for local testing.

## Instructions

1. Start the **backend server** in background:
   - Directory: `../api`
   - Command: `source .venv/bin/activate && chalice local`
   - Run in background with `run_in_background: true`

2. Start the **frontend server** in background:
   - Directory: current (shift-schedule)
   - Command: `npm run dev`
   - Run in background with `run_in_background: true`

3. Report the URLs:
   - Frontend: http://localhost:5173
   - Backend: http://localhost:8000

4. Remind user:
   - Use `/tasks` to check running servers
   - Use `KillShell` tool to stop servers when done

## Environment

Ensure `.env` contains:
```
VITE_SOLVER_API_URL=http://localhost:8000
```
