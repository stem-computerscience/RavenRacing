# Python Quest — RPG redesign plan

## Product direction
- Two story worlds: Space Quest and Dungeon Quest.
- Isometric 2.5D browser gameplay; identical Python skills and challenge geometry across worlds.
- Students control their hero through real Python commands, not arrow keys.
- Story chapters, objectives, visual feedback, hints, and XP.
- Keep existing Cloudflare Worker, D1 accounts, teacher dashboard, and direct URL at `https://ravenracing.net/pythonquest/`. Do not add a Raven Racing navigation link.

## Phase 1 — Implemented initial playable slice
- Responsive dark RPG interface with world selector and story chapter panel.
- SVG-rendered isometric 6×6 world with walls, goal markers, player direction, and path highlights.
- Python-controlled movement: `move_forward()`, `turn_left()`, `turn_right()`; loops and conditionals execute via existing Pyodide Web Worker.
- Six chapters covering sequencing, navigation, loops, conditionals, combined patterns, and independent code.
- Story text and scene palette change between Space and Dungeon.
- Client-side collision, boundary checks, goal validation, hint and reset controls.
- Existing D1 progress persistence, teacher student management, and logout retained.

## Phase 2 — Gameplay depth
- Animated movement and directional sprites; isometric terrain and environment assets.
- NPC conversations, branching story beats, interactive objects and inventory.
- Mission-specific Python API such as `inspect()`, `collect()`, `use_item()`.
- Chapter checkpoints, better editor (line numbers, syntax highlighting, error locations), accessible keyboard interaction.
- Save both world campaigns independently and support restart/replay without losing earned achievements.

## Phase 3 — Security and classroom readiness
- Server-validated mission progression and XP (current API accepts client-submitted values).
- Login throttling, session hardening, password-hashing upgrade compatible with Cloudflare limits.
- Teacher dashboard: per-skill progress, student code submissions, export, password reset audit.
- Student privacy review and load/performance testing before real student rollout.

## Phase 4 — Content expansion
- More story chapters and regions, combat/puzzle mechanics tied to Python learning outcomes.
- Difficulty options and scaffolded hints for grades 6–8.
- Progression tests and teacher playtesting.

## Deployment / testing
- Frontend: `RavenRacing/pythonquest/` on GitHub Pages.
- API: separate `PythonQuest/worker/` Cloudflare Worker.
- After frontend changes publish, hard-refresh the game page.
- Test teacher login/logout, test student login, both world themes, each starter program, save/reload.
- Do not use real student accounts until security phase is complete.
