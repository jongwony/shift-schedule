# Demo/editor UX verification — 2026-09-09

## Problem and change

Production used a click-cycling ScheduleGrid/ShiftCell while the public sample used an unrelated select-based table with different colors, controls and result presentation. The first-visit guide also omitted the long-press menu.

Both routes now use ScheduleWorkspace and useSchedule for employee management, period and boundary inputs, shift cells, eligibility, locks/exclusions/reset, configuration and validation. The sample starts on the schedule tab with fictional data; the real editor retains its employee-first entry. A sample banner explains that login, server generation, copy and import are available in the real editor. The sample is not an optimized output.

Sample state bypasses localStorage reads, writes, migration, cross-tab subscriptions, session-recovery notifications and beforeunload warnings. Server generation is guarded off. Reset remounts the entire sample workspace, including configuration and interaction state.

The first-visit modal and persistent inline grid instructions explain click/tap cycling and the 500 ms long-press/right-click menu. Existing dismissal behavior is preserved. Shared menu handling anchors touch menus to the pressed cell, cancels interrupted gestures, supports keyboard opening/navigation and restores focus on Escape. Actual menu bounds are measured to keep exclusion controls inside the viewport.

## Browser observations

The existing production editor and the changed checkout were inspected through the browser. Production was not redeployed.

- Production editor: employee-first entry and button-based grid were confirmed against the previous select-based demo inspected in the preceding audit.
- Changed demo: same employee/schedule/settings tabs, period inputs, cell colors, counts and result components as the real editor.
- Changed demo: D cell clicked to E; right-click opened lock/exclusion/reset; locking retained E after another click; whole-sample reset restored D and removed the lock.
- Changed demo: Shift+F10 focused the first menu item; Escape closed the menu. Browser inspection found a StrictMode focus-restoration defect; corrected capture then restored focus to the originating D cell.
- Changed editor: inline long-press instructions visible above the grid; empty cell clicked to D; the same menu is used.
- First-visit modal: click cycling, 0.5-second long press, right-click, lock semantics and settings instructions visible on the changed checkout. Demo link reached the shared workspace.

## Automated checks and limits

Regression tests cover sample storage/API isolation, click editing, lock protection, exclusion/reset, guided conflict behavior, staff/settings tabs and reset/remount. Shared interaction tests cover touch threshold, movement/multitouch cancellation, unmount cleanup, own-cell menu anchoring and keyboard focus under StrictMode. Existing onboarding tests remain.

Browser QA used desktop Chromium. Physical iPhone/Safari long-press, native touch click suppression, mobile viewport layout and production Google-login/server-generation flows were not executed. Touch event regressions run in jsdom and are not a substitute for device QA. No Cloudflare or production deployment is claimed.
