---
description: Stop all running development servers
---

# Stop Development Servers

Stop all background development servers (frontend and backend).

## Instructions

1. List all running background tasks using `/tasks`

2. For each running server (npm, chalice), use `KillShell` tool with the task ID

3. Confirm all servers are stopped

## Expected Output

Report which servers were stopped:
- Frontend (npm run dev) - stopped
- Backend (chalice local) - stopped
