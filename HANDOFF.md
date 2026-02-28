# HANDOFF.md — Ribbitz Project Complete Technical Handoff

> **For AI agents or engineers taking over this project.**
> **Last updated: 2026-02-28**

---

## 1. Project Overview

**Ribbitz** is a D&D character operations system built from:

| Component | Purpose | Location |
|---|---|---|
| **Source Content** | Canonical Markdown character docs | Repo root (`*.md`) |
| **Interactive UI** | React/Vite dashboard for in-session use | `ui/` |
| **Live Sync Proxy** | Express server that proxies Google Apps Script | `ui/server/` |
| **OBS Stat Output** | PowerShell scripts generating `.txt` files for OBS overlays | `OBS Auto Sync/` |

The system is designed for **in-session use**: quick stat checks, tracker toggles, consumable updates, inventory editing, and fast navigation to rules/details via internal hash links.

---

## 2. Repository Layout

### Root Content Files
| File | Description |
|---|---|
| `README.md` | GitHub-facing index/navigation |
| `Basic Stats.md` | Core stats, ability scores, skills, DCs |
| `Actions.md` | Combat reference, weapon stats, damage formulas |
| `Inventory.md` | Item list |
| `Class Features.md` | Ranger/Druid class features, feats |
| `Racial Traits.md` | Grung racial traits |
| `Spells and Magic Abilities.md` | Full spell list, trackers |
| `Backstory.md` | Character backstory |
| `Misc.md` | Conditions, misc rules |
| `Images.md` | Image gallery |

### UI Application (`ui/`)

| Path | Purpose |
|---|---|
| `ui/src/main.jsx` | React entry point with `BrowserRouter` |
| `ui/src/App.jsx` | **Main dashboard**: routes, trackers, combat kit, spell parsing |
| `ui/src/App.css` | Dashboard layout/styling |
| `ui/src/index.css` | Global styles |
| `ui/src/components/MarkdownPage.jsx` | Markdown renderer with anchor/scroll behavior |
| `ui/src/components/TrackerGroup.jsx` | Reusable tracker chip component |
| `ui/src/pages/InventoryPage.jsx` | Inventory CRUD UI |
| `ui/src/utils/slugifyHeading.js` | Slug utility for anchor links |
| `ui/public/content/*.md` | Content consumed by UI markdown routes |
| `ui/public/content-images/*` | Images for the UI image page |
| `ui/vite.config.js` | Vite config with `/api` proxy to port 5175 |

### Backend (`ui/server/`)

| Path | Purpose |
|---|---|
| `ui/server/server.js` | Express API proxy, snapshot logic, cron |
| `ui/server/.env` | **Runtime config (NOT committed)** |
| `ui/server/.env.example` | Template for `.env` |
| `ui/server/snapshot.json` | Offline fallback snapshot |

### OBS Auto Sync (`OBS Auto Sync/`)

| Path | Purpose |
|---|---|
| `OBS Auto Sync/Engine/*` | PowerShell scripts for stat sync |
| `OBS Auto Sync/Stats/*` | Generated `.txt` files for OBS text sources |
| `OBS Auto Sync/Config/*` | Mapping/config JSON and CSV files |

### Launchers

| File | Platform | Notes |
|---|---|---|
| `Launch Ribbitz Program.bat` | Windows | Starts server + UI + OBS script |
| `launch.sh` | Linux/macOS | Starts server + UI (OBS script won't run) |

---

## 3. Runtime Architecture

### Normal Flow (Online)

```
User opens UI in browser (127.0.0.1:5174)
    → UI calls /api/* routes
    → Vite proxy forwards /api/* to Express server (localhost:5175)
    → Express server calls Google Apps Script Web App
    → Data returns to UI
```

### Offline Behavior

- If Apps Script read fails, server serves `snapshot.json` when present.
- UI indicates offline state and warns when changes won't sync.
- Inventory falls back to `ui/public/content/seed-inventory.csv`.

### Data Flow Summary

| Operation | Endpoint | Notes |
|---|---|---|
| Read stats | `GET /api/stats` | Returns parsed stat rows or snapshot |
| Write stat | `POST /api/stats` | Single `{ key, value }` or batch `{ updates: [...] }` |
| Read inventory | `GET /api/inventory` | Returns items array |
| Write inventory | `POST /api/inventory` | `{ items: [...] }` |
| Health check | `GET /api/health` | Returns `{ status: 'ok' }` |

---

## 4. Linux Server Deployment

### Prerequisites
- Node.js 18+ 
- npm

### Step-by-Step

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd Ribbitz
   ```

2. **Install dependencies**
   ```bash
   cd ui && npm install
   cd ../ui/server && npm install
   cd ../..
   ```

3. **Configure environment**
   ```bash
   cp ui/server/.env.example ui/server/.env
   # Edit .env and set:
   #   APPS_SCRIPT_WEBAPP_URL=<your deployed Google Apps Script Web App URL>
   #   OFFLINE_SNAPSHOT_PATH=./snapshot.json
   #   PORT=5175
   ```

4. **Make launcher executable**
   ```bash
   chmod +x launch.sh
   ```

5. **Start the application**
   ```bash
   ./launch.sh
   ```

6. **Verify**
   - UI: http://127.0.0.1:5174
   - API Health: http://127.0.0.1:5175/api/health

### IMPORTANT: OBS Auto Sync on Linux

The `OBS Auto Sync/` tooling is **Windows-only** (PowerShell scripts). On Linux:
- The UI and API will work fine
- OBS overlays won't auto-update
- If you need OBS overlays on Linux, you'll need to reimplement the stat-watcher logic in Python or shell

---

## 5. UI Routes → Content Mapping

| Route | Loads File | Notes |
|---|---|---|
| `/` | Dashboard (App.jsx) | Main interactive dashboard |
| `/stats` | `ui/public/content/Basic Stats.md` | Core stats page |
| `/actions` | `ui/public/content/Actions.md` | Combat reference |
| `/inventory` | InventoryPage.jsx | Inventory UI (API-driven) |
| `/spells` | `ui/public/content/Spells and Magic Abilities.md` | Spell list + trackers |
| `/features` | `ui/public/content/Class Features.md` | Class features |
| `/racial-traits` | `ui/public/content/Racial Traits.md` | Racial traits |
| `/backstory` | `ui/public/content/Backstory.md` | Character backstory |
| `/misc` | `ui/public/content/Misc.md` | Conditions, misc rules |
| `/images` | Built-in image gallery | |

---

## 6. Stat Keys Reference

The UI reads/writes these keys from the Google Sheet. This is critical for debugging and integration.

### Core Stats
| Key | Description |
|---|---|
| `hp-current` | Current HP |
| `hp-max` | Max HP (102) |
| `temp-hp` | Temporary HP (spore shield) |
| `ac` | Armor Class (19) |
| `initiative` | Initiative bonus (+5) |
| `speed` | Speed (25 ft) |
| `proficiency` | Proficiency bonus (+5) |
| `darkvision` | Darkvision range (90 ft) |
| `passive-perception` | Passive Perception (19) |
| `spell-dc` | Spell Save DC (17) |
| `spell-attack` | Spell Attack bonus (+9) |
| `size` | Size (Small) |

### Ability Scores
| Key | Score Key | Mod Key | Save Key |
|---|---|---|---|
| STR | `str` | `str-mod` | `save-str` |
| DEX | `dex` | `dex-mod` | `save-dex` |
| CON | `con` | `con-mod` | `save-con` |
| INT | `int` | `int-mod` | `save-int` |
| WIS | `wis` | `wis-mod` | `save-wis` |
| CHA | `cha` | `cha-mod` | `save-cha` |

### Skills
| Key | Description |
|---|---|
| `skill-acrobatics` | Acrobatics |
| `skill-animal-handling` | Animal Handling |
| `skill-arcana` | Arcana |
| `skill-athletics` | Athletics |
| `skill-athletics-gloves` | Athletics (with Gloves of Swimming & Climbing) |
| `skill-deception` | Deception |
| `skill-history` | History |
| `skill-insight` | Insight |
| `skill-intimidation` | Intimidation |
| `skill-investigation` | Investigation |
| `skill-medicine` | Medicine |
| `skill-medicine-terrain` | Medicine (Preferred Terrain) |
| `skill-nature` | Nature |
| `skill-nature-terrain` | Nature (Preferred Terrain) |
| `skill-perception` | Perception |
| `skill-perception-terrain` | Perception (Preferred Terrain) |
| `skill-performance` | Performance |
| `skill-persuasion` | Persuasion |
| `skill-religion` | Religion |
| `skill-sleight` | Sleight of Hand |
| `skill-stealth` | Stealth |
| `skill-survival` | Survival |
| `skill-survival-terrain` | Survival (Preferred Terrain) |

### Spell Slots
| Key | Max |
|---|---|
| `slots-1st` | 4 |
| `slots-2nd` | 3 |
| `slots-3rd` | 3 |
| `slots-4th` | 3 |
| `slots-5th` | 2 |
| `slots-6th` | 1 |

### Class Resources
| Key | Max | Notes |
|---|---|---|
| `wild-shape` | 2 | Druid Wild Shape uses |
| `active-camo` | 5 | Grung Active Camouflage (PB) |
| `fungal-infestation` | 4 | Circle of Spores (WIS mod) |
| `song-grung` | 1 | Song of the Grung (1/day) |
| `fey-misty-step` | 1 | Fey Touched Misty Step |
| `fey-hunters-mark` | 1 | Fey Touched Hunter's Mark |
| `poison-weapon` | 5 | Grung Poison Weapon (PB) |
| `tongue-grapple` | 5 | Grung Tongue Grapple (PB) |

### Poison Darts
| Key | Description |
|---|---|
| `dart-sleep` | Sleep dart (1/day) |
| `dart-paralyze` | Paralyze dart (1/day) |
| `dart-purple` | Purple Grung dart (5/day) |

### Arrows (if tracking)
| Key | Description |
|---|---|
| `arrow-standard` | Standard arrows |
| `arrow-fire` | Fire arrows |
| `arrow-water` | Water arrows |
| `arrow-lava` | Lava arrows |

### Weapon Stats
| Key | Description |
|---|---|
| `blowgun-hit` | Blowgun standard attack (+13) |
| `blowgun-hit-ss` | Blowgun Sharpshooter attack (+8) |
| `blowgun-dmg` | Blowgun standard damage (1d8) |
| `blowgun-dmg-ss` | Blowgun Sharpshooter damage (1d8+10) |
| `blowgun-elem-dmg` | Blowgun elemental damage (1d6) |
| `blowgun-gloom-dmg` | Blowgun Gloom Stalker damage (1d8) |
| `longbow-hit` | Longbow attack (+14) |
| `longbow-hit-ss` | Longbow Sharpshooter attack (+9) |
| `longbow-dmg` | Longbow standard damage (1d10+7) |
| `longbow-dmg-ss` | Longbow Sharpshooter damage (1d10+17) |
| `longbow-elem-dmg` | Longbow elemental damage (1d6) |
| `longbow-gloom-dmg` | Longbow Gloom Stalker damage (1d8) |
| `dagger-hit` | Dagger attack (+11) |
| `dagger-dmg` | Dagger damage (1d4+6) |
| `dagger-gloom-dmg` | Dagger Gloom damage (1d4+6+1d8) |
| `poison-dagger-hit` | Poison dagger attack (+10) |
| `poison-dagger-dmg` | Poison dagger damage (1d4+5) |

### Grung DCs
| Key | Value |
|---|---|
| `poison-skin-dc` | 17 (12 + PB) |
| `poison-weapon-dc` | 17 (9 + PB + CON) |
| `song-grung-dc` | 17 (uses Spell Save DC) |

### Feature Flags
| Key | Description |
|---|---|
| `symbiotic-active` | Is Symbiotic Entity active? |
| `symbiotic-temp-hp` | Symbiotic temp HP (36) |
| `halo-damage` | Halo of Spores damage (1d6) |
| `halo-damage-symbiotic` | Halo damage while Symbiotic (2d6) |

---

## 7. LocalStorage Keys

The UI persists certain state locally (not synced to sheet):

| Key | Type | Description |
|---|---|---|
| `ribbitz.deathSaves` | JSON array[6] | Death saves (3 success, 3 failure) |
| `ribbitz.exhaustionLevel` | number | Exhaustion level (0-6) |
| `ribbitz.conditions` | JSON object | Active conditions (slug → bool) |
| `ribbitz.drugsHerbs` | JSON object | Active drug/herb toggles (slug → bool) |

---

## 8. Character Current State

This is the **live character state** as of the last session:

| Stat | Value |
|---|---|
| **Name** | Ribbitz |
| **Race** | Grung (Homebrew v4) |
| **Class** | Ranger 6 / Druid 9 (Level 15) |
| **Background** | Vanguard of the Great Golden Risabere |
| **Alignment** | Neutral Good |
| **Age** | 3.5 years |
| **Size** | Small (4' 0", 55 lbs) |
| **HP Max** | 102 |
| **AC** | 19 |
| **Initiative** | +5 (+8 with Dread Ambusher) |
| **Speed** | 25 ft (hop/climb/swim) |
| **Darkvision** | 90 ft |
| **Proficiency Bonus** | +5 |

### Ability Scores
| Ability | Score | Modifier |
|---|---|---|
| STR | 14 | +2 |
| DEX | 20 | +5 |
| CON | 16 | +3 |
| INT | 9 | -1 |
| WIS | 18 | +4 |
| CHA | 8 | -1 |

### Proficient Saves
- DEX (+10)
- WIS (+9)

### Proficient Skills
Acrobatics, Arcana, Medicine, Nature, Perception, Stealth, Survival

---

## 9. Google Apps Script Setup

The backend expects a Google Apps Script Web App that exposes:

### GET `?action=getValues`
Returns `{ rows: [{ A: label, B: value, C: type, D: key, E: outputFile }, ...] }`

### GET `?action=getValues&sheet=Inventory`
Returns inventory rows: `{ rows: [{ A: name, B: quantity, C: category, D: weight, E: notes, F: imageUrl }, ...] }`

### POST `?action=batchUpdate`
Body: `{ key, value, label, type, outputFile, extra }` or array of updates.

### POST `?action=batchUpdate&sheet=Inventory`
Body: `{ key, value, label, type, weight, outputFile, extra }` for inventory items.

---

## 10. Known Operational Rules

1. **Use launch script** (`launch.sh` on Linux, `.bat` on Windows) — don't manually start servers
2. **UI runs on port 5174**, API on **5175** — the proxy in `vite.config.js` forwards `/api` to 5175
3. **Don't break slug behavior** — `MarkdownPage.jsx` relies on stable anchor IDs
4. **snapshot.json is runtime** — don't commit changes to it
5. **Content in `ui/public/content/`** must match route expectations

---

## 11. Environment Variables

Create `ui/server/.env`:

```env
APPS_SCRIPT_WEBAPP_URL=https://script.google.com/.../exec
OFFLINE_SNAPSHOT_PATH=./snapshot.json
PORT=5175
```

---

## 12. Important Notes for a New AI

### Sophie’s Dice is SEPARATE
There is a **completely separate tool** called "Sophie's Dice" that lives in:
```
C:\Users\Drachen\Documents\SophiesDice\
```

This is **NOT part of this repo**. It is a Windows desktop dice-rolling app with custom dice for Ribbitz. It does **NOT** integrate with this web app. The web app doesn't use Sophie's Dice — it uses Google Sheets.

### If Something Breaks

1. **UI won't load**: Check `npm install` ran in both `ui/` and `ui/server/`
2. **Stats not loading**: Check `.env` has valid `APPS_SCRIPT_WEBAPP_URL`
3. **API errors**: Check port 5175 is running, try `http://127.0.0.1:5175/api/health`
4. **Hash links broken**: Check `slugifyHeading.js` hasn't changed

---

## 13. Commit Guidelines

When making changes, prioritize committing:
- `ui/src/**` — UI logic
- `ui/server/server.js` — Backend behavior
- `ui/public/content/**` — Markdown content
- `launch.sh` — Linux launcher
- `HANDOFF.md`, `README.md` — Documentation

Avoid committing:
- `ui/server/snapshot.json` — Runtime data
- `ui/server/.env` — Secrets
- `OBS Auto Sync/Stats/*.txt` — Generated OBS files

---

## 14. Quick Reference Card

```
# Start (Linux)
./launch.sh

# Start (Windows
.\Launch Ribbitz Program.bat

# URLs
UI:       http://127.0.0.1:5174
API:      http://127.0.0.1:5175
Health:   http://127.0.0.1:5175/api/health

# OBS on Linux?
NOT SUPPORTED - PowerShell only
```
