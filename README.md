<!--
Ribbitz repository README
Designed for GitHub viewing.
-->

---

# 🐸 Vanguard Ribbitz Character "Sheet"
- This is a repository of everything to do with Ribbitz; organized, sources cited, and up to date.
- This is a living repo; sections may change as the campaign evolves.
- If you’re the DM: feel free to browse and reference during sessions.
- These pages are updated during sessions; you may want to refresh often during gameplay as things will get edited live.

<img src="./Images/4-Flying.png" alt="Ribbitz flying" width="320" />

---

## 🧭 Dashboard

**Nav:**
[Home](./README.md) | [Stats](./Basic%20Stats.md) | [Actions](./Actions.md) | [Inventory](./Inventory.md) | [Features](./Class%20Features.md) | [Racial Traits](./Racial%20Traits.md) | [Spells/Magic](./Spells%20and%20Magic%20Abilities.md) | [Backstory](./Backstory.md) | [Notes](./Notes.md) | [Images](./Images.md) | [Refs](./Reference%20Materials/)

### ⚡ In-Session

- 📄 **Basic Stats (Main):** [Basic Stats.md](./Basic%20Stats.md)
- ⚔️ **Actions (Combat):** [Actions.md](./Actions.md)
- 🎒 **Inventory:** [Inventory.md](./Inventory.md)
- ✨ **Spells & Magic Abilities:** [Spells and Magic Abilities.md](./Spells%20and%20Magic%20Abilities.md)

### 🖥️ UI Launcher & Dashboard Layout

- Use `Launch Ribbitz Program.bat` in the repo root to start the full local stack:
  - Express sync server (`http://127.0.0.1:5175`)
  - React/Vite UI (`http://127.0.0.1:5174`)
  - OBS stat watcher script
- The UI dashboard layout is tuned for wide screens: the Combat Kit grid uses two columns, and full-width sections (Grung Abilities + Drugs & Herbs) span across both columns.
- Combat Kit weapon blocks follow the same format: **Hit** (Std/Pwr), **Std**, **Pwr**, **Elem**, **Gloom** lines for quick in-session reading.

### 🐳 Docker + Subpath Hosting

- This repo now includes a production Dockerfile that builds the Vite UI and serves it through the Express server.
- For DiceKnights integration under a subpath, set build args:
  - `VITE_BASE_PATH=/ribbits-app/`
  - `VITE_API_BASE=/ribbits-app/api`
- The React router uses the Vite base path as `BrowserRouter` basename, so `/stats`, `/spells`, etc work correctly under `/ribbits-app/*`.
- Markdown/content fetches and image paths are resolved through the same base path for subpath-safe loading.
- Runtime API + offline settings remain controlled by server env:
  - `APPS_SCRIPT_WEBAPP_URL`
  - `OFFLINE_SNAPSHOT_PATH`
  - `FILE_STORAGE_DIR`

### 📚 Reference

- ✨ **Class Features:** [Class Features.md](./Class%20Features.md)
- 🐸 **Racial Traits:** [Racial Traits.md](./Racial%20Traits.md)
- 📚 **Reference Materials:** [Reference Materials/](./Reference%20Materials/)

### 📜 Story

- 📜 **Backstory:** [Backstory.md](./Backstory.md)
- 📝 **Notes:** [Notes.md](./Notes.md)

### 🖼️ Images

- 🖼️ **Images page:** [Images.md](./Images.md)
- 📁 **Images folder:** [Images/](./Images/)

---

### ✅ Tracker Key

For any trackers in this repo:
- 🟩 = available
- 🟥 = spent

---
