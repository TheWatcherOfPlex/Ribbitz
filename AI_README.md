# AI README – Ribbitz Project (For AI/Codex Integration)

This file is written for another AI agent that needs to understand, extend, or integrate this repo into a larger D&D website.

---

## 1) What this project is

Ribbitz is a hybrid **content + web app + sync tooling** project:

- **Markdown content repo** for character sheets/reference (`*.md` at repo root).
- **React/Vite app** in `ui/` for an in-session dashboard and content browsing.
- **Local Express sync server** in `ui/server/` that proxies Google Apps Script data.
- **OBS Auto Sync tooling** in `OBS Auto Sync/` that writes stat `.txt` files for OBS overlays.

---

## 2) Runtime architecture

### Frontend
- Path: `ui/`
- Stack: React + Vite + React Router + React Markdown
- Default URL: `http://127.0.0.1:5174`
- Main entry: `ui/src/main.jsx`
- Main app: `ui/src/App.jsx`

### Backend (local proxy)
- Path: `ui/server/`
- Stack: Express
- Default URL: `http://127.0.0.1:5175`
- Health route: `GET /api/health`
- Stats route: `GET /api/stats`, `POST /api/stats`
- Inventory route: `GET /api/inventory`, `POST /api/inventory`
- Uses `.env` variables:
  - `APPS_SCRIPT_WEBAPP_URL`
  - `OFFLINE_SNAPSHOT_PATH` (default `./snapshot.json`)
  - `PORT` (expected `5175`)

### Proxy relationship
- Vite proxy (`ui/vite.config.js`) forwards `/api/*` to `http://localhost:5175`.

---

## 3) Launch model (important)

Canonical launcher is:

- `Launch Ribbitz Program.bat`

It starts:
1. Sync server (`ui/server`)
2. UI (`ui`, pinned to `127.0.0.1:5174`)
3. OBS stat watcher (`OBS Auto Sync/Engine/RibbitsStatAssistant.ps1`)

The dashboard is expected at:
- `http://127.0.0.1:5174`

API health at:
- `http://127.0.0.1:5175/api/health`

---

## 4) Data/content sources

### UI markdown content
- Served from `ui/public/content/*.md`
- Routed by React pages in `App.jsx`

### Root markdown content
- Repo-root files like `Basic Stats.md`, `Actions.md`, etc.
- Acts as canonical/source content for GitHub-facing docs and references.

### Google Apps Script data
- Server pulls stats and inventory via `APPS_SCRIPT_WEBAPP_URL` endpoints.

### Offline fallback
- Server writes and serves `ui/server/snapshot.json` when sheet access fails.

---

## 5) High-value frontend components

- `ui/src/App.jsx`
  - Dashboard layout + trackers + combat kit + quick stats + routing.
  - Contains spell parsing and many in-session controls.
- `ui/src/components/MarkdownPage.jsx`
  - Markdown renderer, heading slug IDs, hash scrolling/open-`<details>` logic.
- `ui/src/pages/InventoryPage.jsx`
  - Inventory CRUD against API with seed CSV fallback.
- `ui/src/components/TrackerGroup.jsx`
  - Reusable tracker chip groups.
- `ui/src/utils/slugifyHeading.js`
  - Slugger utility used for stable anchor links.

---

## 6) Integration guidance for external website

If embedding/integrating this app into another website:

1. **Keep the React app self-contained** under a route/sub-app (e.g. `/ribbitz`).
2. **Preserve API routing**:
   - Either run existing Express server and proxy from host app,
   - Or port the endpoints to your host backend.
3. **Preserve markdown anchor behavior**:
   - `MarkdownPage.jsx` slug logic + `<details>` opening is relied on by many internal links.
4. **Keep port/env semantics** in development:
   - UI: 5174, API: 5175.
5. **Treat `ui/public/content` as content bundle** for UI pages.

---

## 7) Files that are operational vs generated

Operational:
- `ui/src/**`
- `ui/server/server.js`
- `ui/vite.config.js`
- `Launch Ribbitz Program.bat`
- `ui/public/content/**`

Generated/runtime-ish (handle carefully):
- `ui/server/snapshot.json`
- `OBS Auto Sync/Stats/**/*.txt`
- `OBS Auto Sync/Engine/mapping.generated.json`

---

## 8) Recommended commit policy for future work

When editing UI/feature behavior, prioritize committing:
- `ui/src/**`
- `ui/server/server.js`
- `ui/public/content/**`
- launch scripts/docs

Avoid unnecessary noise commits from runtime outputs unless intentionally updated.

---

## 9) Quick bring-up checklist

1. Ensure dependencies installed in:
   - `ui/`
   - `ui/server/`
2. Ensure `ui/server/.env` has valid Apps Script URL and `PORT=5175`.
3. Run `Launch Ribbitz Program.bat`.
4. Verify:
   - `http://127.0.0.1:5174` (UI)
   - `http://127.0.0.1:5175/api/health` (API)
