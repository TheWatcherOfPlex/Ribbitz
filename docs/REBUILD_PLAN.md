# Ribbitz Dashboard Rebuild — Master Plan

**Status:** 🚧 IN PROGRESS — Phase 2 corrected + re-verified, ready to continue Phase 3.
**Last updated:** 2026-09-14 by Claude (session `session_01HxUfGH7xyRjP9JoeBgPrJH`).
**Current phase:** Phase 2's *first* version (28 individually-draggable
skill cards) was wrong — see the correction below and in
`docs/PROGRESS_LOG.md`. Rebuilt at **whole-panel granularity** instead
(drag the whole Skills panel as one block, its internal content unchanged
from the original rich layout). Live at `/canvas-preview`. Next: Phase 3,
extract + wrap the remaining panels (Combat Kit, Magic/Spell Slots,
Exhaustion/Potions, etc.) the same way.

> ⚠️ **Important correction (2026-09-14), read before continuing Phase 3:**
> §3.1–§3.2 below describe an atomized "one Element per skill/spell/item"
> data model. **That is not what drag/resize granularity should be.** The
> owner clarified: dragging happens at the **category/panel level**
> ("drag my spell list up, move my skills next to it, drag all my features
> around") — panels keep their full existing rich internal content (e.g.
> Skills still shows every row with both Check *and* Save buttons and the
> ability-score grid, exactly like the original hand-coded version), they
> just become draggable/resizable *as whole blocks*. The per-element
> Element/schema.js model isn't dead — it's still the right shape for the
> separate "toggle an individual long-form item onto the dashboard" ask —
> but it is **not** what drives drag placement. See the corrected §3.3 and
> the Phase 2 section in §4 for what was actually built.

> **If you are an AI picking this up:** read this whole file before touching
> code. Read the "Handoff & Notes Protocol" section (near the bottom) *first*
> — it tells you exactly how to update this doc and where to log what you did.
> This project is being worked by multiple AI instances (Claude + GPT) across
> many sessions over a long period. The owner cannot re-explain context every
> time — this file is the shared memory. Leave it better than you found it.

---

## 1. Why this rebuild

The owner's own words (2026-09-14), verbatim intent preserved:

> "The dashboard is meant to be a window focused on all the info I could
> need during a game. The other side tabs are meant to be the long form
> version of all that information... Everything to do with this character
> should be on this page... each stat/thing/object etc to be its own
> element. These need to be able to be drug around, regrouped, resized,
> etc... that dashboard section to work like a big blank canvas... The end
> goal is that I can then feed AI character sheets and we are able to make
> a UI for any of them... categories, sub categories, title etc so that we
> can easily plug in the info for any character... add functionality to
> each of those things. Things where we track inventory need the plus and
> minus buttons... skills or things that involve rolling dice need buttons
> to trigger rolling... as well as rolling at disadvantage or advantage...
> If I find anything in the non dashboard tabs, there should be a button to
> toggle if it appears on the dashboard or not."

Plus, separately stated as part of the same ask:
- **Themes**: swappable color themes per character, changeable from a settings menu.
- **Level presets**: pick a character's current level (e.g. one-shot characters played anywhere from level 3–17), and have stats/proficiency/spell slots/etc. auto-swap to a pre-configured snapshot for that level.
- **File-splitting**: break the (currently ~2,300-line) `App.jsx` and its ~2,300-line `App.css` into many small files, since this project will be worked on by AI for years and huge files slow every edit down. The owner explicitly authorized **any** structural change in service of this, including significant rework.
- **Multi-character**: Ribbitz is the first, but the owner plans several more characters, each needing this same system with their own data/theme.

This is not a small feature add. It is a rebuild of the dashboard into a
**generic, data-driven, drag/drop character-sheet engine** that Ribbitz's
content happens to populate first.

---

## 2. What already exists (as of this doc)

Read these before assuming anything about current state — they may have
changed since this doc was written.

- **Ribbitz repo**: `/srv/docker/ribbitz` — git repo, remote `origin` =
  `https://github.com/TheWatcherOfPlex/Ribbitz.git`. Tag
  `pre-rebuild-2026-09-14` marks the exact commit before this rebuild started
  — **if anything goes badly wrong, `git checkout pre-rebuild-2026-09-14` is
  the safe fallback**, and it's pushed to GitHub, not just local.
- **Runtime**: container `diceknights-ribbitz`, built from
  `/srv/docker/dice-knights/docker-compose.yml`'s `ribbitz` service (context
  `../ribbitz`). Deploy = `docker compose build ribbitz && docker compose up
  -d ribbitz` from `/srv/docker/dice-knights`. **Not** live-bind-mounted —
  every code change needs a rebuild+redeploy to see it.
- **Dashboard**: `ui/src/App.jsx` (~2,300 lines) + `ui/src/App.css`
  (~2,300 lines). Single giant component, hand-coded JSX per section
  (Ability Scores, Skills, Spell Slots, Combat Kit, Exhaustion, etc.), each
  wired individually to Google-Sheets-backed stat keys via `statMap`.
- **Long-form content**: root `.md` files (`Basic Stats.md`, `Actions.md`,
  `Spells and Magic Abilities.md`, `Class Features.md`, `Racial Traits.md`,
  `Inventory.md`, `Backstory.md`, `Notes.md`, `Misc.md`) — rendered via
  `MarkdownPage.jsx` on their own routes (`/stats`, `/actions`, etc.), using
  `<details><summary><h3>Name</h3></summary>...</details>` blocks as a
  click-to-expand convention already. **This convention is the model for
  what the new dashboard elements should feel like**, just generalized and
  made drag/droppable.
- **Data source**: `ui/server/server.js` (Express) proxies a Google Apps
  Script Web App backed by a Google Sheet for live numeric stats
  (`GET/POST /api/stats`, `/api/inventory`), with `snapshot.json` offline
  fallback. As of this session it also has `/api/export/spells`,
  `/api/export/actions`, `/api/export/catalog` — server-side Markdown
  parsers that return structured JSON (built for Stream Commander's OBS
  integration, but directly reusable as the seed for the new element data
  model — see §5).
- **Dice roller**: Stream Commander (`/srv/docker/stream-commander`,
  container `jukebox`/`stream-commander`, service defined in
  `/srv/compose/stack.yml`) now self-hosts `@3d-dice/dice-box` and exposes
  `POST /api/dice/roll` (CORS-enabled for `/api/dice/*` specifically) —
  `{notation, label, parts: [{label, value}, ...]}`. The dashboard's Skills
  panel already calls this (see `rollDice`/`rollFlatDice` in `App.jsx`).
  This is the **only existing roll-trigger mechanism** — the rebuild should
  keep using it, not reinvent it. **Advantage/disadvantage is not yet
  implemented anywhere** — the dice overlay just rolls whatever notation
  it's given once; "roll twice, take higher/lower" needs new work either in
  the overlay (roll 2 sets, pick one) or by sending two notations. Design
  this in Phase 3, don't guess now.
  - **Stream Commander is NOT a git repo.** Recommend running `git init` +
    an initial commit there too before heavy further changes — flagging,
    not yet done, since this plan is scoped to the Ribbitz dashboard.
- **5e rules lookup tool**: `/srv/docker/dnd-ai-library` +
  `/srv/docker/dice-knights-git/web/lib/dnd-ai-library.ts`, surfaced at
  `/ai-assistant` on the Dice Knights website. Indexes 75+ included 5e
  sourcebooks (PHB, DMG, MM, Xanathar's, Tasha's, MotM, Fizban's, Bigby's,
  Planescape, etc.) with a Hermes-backed Q&A layer that returns quoted,
  page-cited answers. **Use this (or plain web search) for any 5e rules
  question during this rebuild — 5th edition only, per owner instruction.**
  Read `/srv/docker/dnd-ai-library/AI_HANDOFF.md` before relying on it.
  Additional book scans also live in the Grimmory-DnD instance
  (`/srv/docker/Grimmory-DnD/AI_HANDOFF.md`) if the AI library is missing
  something — 5e content only, ignore other editions there.
- **Related, already-completed work this session** (context, not part of
  this rebuild): a Stream Commander "Ribbits" admin panel creates one OBS
  scene per spell/attack with the owner's own Photoshopped card art
  (fit-to-screen) plus a small dynamic "Notes" text overlay. That system
  reads Ribbitz's `/api/export/*` endpoints already — **don't break those
  endpoints' response shape during this rebuild** without checking
  `/srv/docker/stream-commander/app/ribbits_sync.py` and updating both
  sides together.

---

## 3. Target architecture

### 3.1 Data model

Every "thing" on the dashboard is an **Element**. Elements belong to a
**Category** (optionally a **Subcategory**). This is the schema the owner
asked for explicitly ("categories, sub categories, title etc so that we can
easily plug in the info for any character").

```jsonc
// One Element — the atomic unit that gets dragged/resized/toggled.
{
  "id": "skill-stealth",              // stable, unique within the character
  "category": "Skills",
  "subcategory": "Dexterity",         // optional
  "title": "Stealth",
  "type": "roll-topic",               // see §3.2 for the type catalog
  "dashboardVisible": true,           // the ask: toggle per-element from the long-form page
  "layout": {                         // react-grid-layout shape, per breakpoint if needed
    "x": 0, "y": 0, "w": 2, "h": 1
  },
  "data": {
    // shape depends on "type" — see §3.2
  },
  "sourceDoc": "Basic Stats.md",      // which long-form page this was authored from
  "sourceAnchor": "stealth"           // slug to deep-link/scroll to on that page
}
```

```jsonc
// A Character wraps everything, including theme + level presets.
{
  "id": "ribbitz",
  "name": "Vanguard Ribbitz",
  "theme": "ribbitz-purple",          // see §3.4
  "currentLevel": 17,
  "levelPresets": {                   // see §3.5
    "3": { "statOverrides": { "proficiency": "+2", "slots-1st": 4, ... } },
    "17": { "statOverrides": { "proficiency": "+6", ... } }
  },
  "elements": [ /* array of Element, per §3.1 */ ],
  "categories": [
    { "id": "skills", "label": "Skills", "icon": "🎯" },
    { "id": "spells", "label": "Spells", "icon": "✨" }
    // ...
  ]
}
```

**Open design question, resolve in Phase 1 before writing code:** where does
this JSON live? Options, roughly in order of recommendation:
1. A new file per character under a `characters/` directory (e.g.
   `ui/src/characters/ribbitz/character.json` + `elements/*.json` split by
   category — keeps individual files small per the owner's file-splitting
   ask), loaded at build/runtime by the React app. Simple, git-diffable,
   no new backend/DB needed.
2. A new SQLite/lowdb store served by `ui/server/server.js` alongside the
   existing `/api/stats` proxy, if the owner wants to *edit* the dashboard
   layout from a UI (not just hand/AI-edit JSON files) and have it persist
   without a redeploy.
Given the "feed AI a character sheet, it builds the UI" workflow described,
**option 1 (file-based, AI-editable JSON) is very likely the better fit** —
an AI (this one or GPT) authoring a new character's dashboard is essentially
"write these JSON files," which is exactly the kind of task an AI is good
at, and it stays diffable/reviewable in git. Confirm with the owner in
Phase 1 rather than assuming.

### 3.2 Element type catalog

Each `type` maps to one renderer component (own file, per the file-splitting
ask — see §3.6). Minimum viable set, derived directly from what's already on
the dashboard today plus the owner's explicit asks:

| type | renders | key `data` fields | notes |
|---|---|---|---|
| `stat-display` | a label + value, no interaction | `statKey` or `value` | e.g. AC, Passive Perception |
| `roll-topic` | title button that rolls on click, expands for full text on a separate (or long-press/secondary) click | `notation` or `parts`, `rollLabel`, `summary`, `officialText`, `notes[]` | needs advantage/disadvantage variant buttons — **design this mechanism in Phase 3**, don't bolt it on ad hoc per element |
| `tracker` | pip/counter row with +/− | `statKey`, `max`, `resetOn` (`shortRest`/`longRest`) | already exists as `TrackerGroup.jsx` — reuse, don't rebuild |
| `toggle` | on/off switch/button | `statKey`, `onLabel`, `offLabel` | e.g. Symbiotic Entity active/inactive |
| `counter` | plain +/− numeric (no dice) | `statKey`, `min`, `max` | e.g. inventory item quantity, HP |
| `expandable-topic` | title, click to expand full text, no roll | `summary`, `officialText`, `notes[]` | e.g. a racial trait with no roll attached |
| `list` | small table/list, e.g. inventory | `items[]`, each with its own counter | may itself contain nested counters |

Don't treat this table as final — it's the starting set. Add types as real
content demands them, but **update this table when you do**, and keep each
renderer in its own file.

### 3.3 Canvas / drag / resize / reflow library

> ⚠️ **Pin `react-grid-layout` to the `1.x` line explicitly
> (`"react-grid-layout": "^1.5.4"` in `ui/package.json`), not `latest`.**
> `npm install react-grid-layout` installs **2.x** by default, which is a
> complete API rewrite (hooks-based; `cols`/`rowHeight`/`draggableHandle`
> top-level props don't exist any more, replaced by nested `gridConfig`/
> `dragConfig` objects) — none of the widely-documented v1 examples/API
> (including everything in this plan and `DashboardCanvas.jsx`) work
> against it, and the app **fails to load entirely** if it's installed.
> This actually happened once (2026-09-14) — checking "still
> maintained/popular" (weekly downloads, recent release) is **not enough**
> to catch a breaking major-version rewrite; check the changelog/major
> version specifically before trusting a library recommendation, including
> ones in this very document. The maintainers publish the old API under
> the `legacy` dist-tag too (`npm install react-grid-layout@legacy`) if
> `1.5.4` ever stops resolving.

**Grid item = one whole panel/category (Skills, Combat Kit, Spells, Magic
Abilities, Features, ...), not one item per skill/spell/inventory row.**
Each panel is a real React component with its full original content and
behavior (extracted from the old monolithic `App.jsx` into
`ui/src/panels/<Name>Panel.jsx` — see `panels/SkillsPanel.jsx` as the
built example), rendered inside a `DashboardCanvas` grid item. The panel's
*internal* layout (e.g. Skills' ability-score grid + per-row Check/Save
buttons) is unchanged from the original design — only whether the whole
panel can be dragged/resized/repositioned is new.


Recommendation: **[react-grid-layout](https://github.com/react-grid-layout/react-grid-layout)**.

Why (evaluated, not guessed):
- Purpose-built for exactly this ask: draggable + resizable widgets in a
  grid, with auto-compaction (fills gaps when something's moved/removed) —
  matches "drug around, regrouped, resized."
- Layout persists as a plain array of `{i, x, y, w, h}` — trivial to store
  per-character, per-breakpoint, and per-level-preset if a preset ever needs
  a different layout (unlikely, but the shape supports it for free).
- Has built-in responsive breakpoints (`WidthProvider`/`Responsive`), which
  is relevant given the *other*, already-fixed complaint this session about
  panels squishing on a non-maximized window — react-grid-layout reflows
  properly instead of shrinking content.
- Mature, widely used (Grafana-style dashboards), MIT license, no CDN
  restriction concerns since this is a real npm/Vite build, not an Artifact.

Do not start Phase 2 without validating this recommendation still holds —
check current npm weekly downloads / maintenance status before installing,
since "well-maintained" can change. If it's been abandoned, the fallback
candidates evaluated and rejected this session (documented so nobody
re-litigates them from scratch) were:
- **Muuri**: good drag/reorder + reflow, but resize handling is weaker and
  it's vanilla JS (needs a React wrapper either way).
- **GoldenLayout**: IDE-style docking panels — heavier than needed, wrong
  metaphor (this is a dashboard of small cards, not dockable panes).
- **react-rnd**: low-level drag+resize primitive only, no grid/collision
  logic — would mean building react-grid-layout ourselves. Only reach for
  this if react-grid-layout turns out to be a genuinely bad fit.

### 3.4 Theming

**Correction (Phase 1 audit, 2026-09-14):** `App.css` has **zero** CSS
custom properties today — every color is a hardcoded `rgba()`/hex literal
(79 distinct values counted). The plan below still holds, but "extract
existing tokens" is wrong — this is a from-scratch token system, not an
extraction. Scope this fully in Phase 4, not before; don't let it creep
into earlier phases.

Once Phase 4 starts:
- Formalize a fixed set of theme tokens (accent, background layers, text,
  success/warning/danger, proficient-glow color, etc.).
- Each theme = one small JSON/CSS-vars file. Ribbitz's current dark-purple
  look becomes the first theme, extracted rather than hand-copied per new
  character.
- A settings panel (new small component, own file) lets the owner pick a
  theme per character, persisted alongside that character's data.
- Do **not** hardcode colors anywhere in new element-renderer components —
  every color must come through a CSS var so swapping themes actually works
  everywhere at once. Audit old code for hardcoded hex values as each
  section gets migrated (Phase 3) and fix them then; don't do a giant
  separate sweep.

### 3.5 Level presets

- A `levelPresets` map on the Character (see §3.1), keyed by level number.
- Selecting a level = look up that preset, apply its `statOverrides` on top
  of the character's base data, re-render. No magic recomputation of D&D
  math required for v1 — the owner explicitly said "I take the time to set
  up the character once," i.e. presets are **authored**, not derived. A
  later phase could add a "compute the obvious stuff" helper (proficiency
  bonus by level, spell slots by class/level from the SRD tables) to reduce
  authoring effort, but that's an enhancement, not a blocker for v1.
- UI: a level selector (dropdown or slider) near the character switcher.
  Changing it swaps `currentLevel` and re-applies overrides — should feel
  instant, no page reload.

### 3.6 File-splitting plan for the codebase itself

Concrete target structure (adjust as reality demands, but keep the
*principle*: no file should be doing five unrelated things):

```
ui/src/
  characters/
    ribbitz/
      character.json          # id, name, theme, currentLevel, levelPresets, categories
      elements/
        skills.json
        spells.json
        actions.json
        magic-abilities.json
        inventory.json
        ...one file per category, not one giant elements.json
  elements/                    # renderer components, one file per type
    RollTopic.jsx
    Tracker.jsx
    Toggle.jsx
    Counter.jsx
    StatDisplay.jsx
    ExpandableTopic.jsx
    List.jsx
  dashboard/
    DashboardCanvas.jsx        # react-grid-layout wrapper, loads a character's elements
    CategoryPicker.jsx
    ThemeSettings.jsx
    LevelSelector.jsx
  lib/
    diceRoller.js              # rollDice/rollFlatDice, extracted from App.jsx as-is
    markdownParsers.js         # extractSection/extractField/slugify/etc, extracted as-is
    statMap.js                 # existing Google-Sheet stat fetch/sync logic, extracted
  pages/                       # existing long-form Markdown routes, mostly unchanged
    ...
  App.jsx                      # should shrink drastically — routing + layout shell only
```

This is a big move-things-around refactor. Do it incrementally (Phase 3,
one category at a time), verifying `npm run build` after every extraction,
**not** as one giant flag-day rewrite — there is no live browser available
to this AI to catch runtime-only breakage, so small verifiable steps are
the only safety net.

---

## 4. Phased plan

Each phase should end with a working, deployed, owner-verified state before
the next one starts. Don't batch phases together even if it feels faster —
the owner has no way to catch a regression except by looking at the live
site, so ship small.

### Phase 0 — Foundations (in progress / mostly done as of this doc)
- [x] Git backup: commit + tag `pre-rebuild-2026-09-14`, pushed to GitHub.
- [x] This plan doc written.
- [ ] Link this doc from `/Data/AI-Handoffs/FullScopeHandoff.md` (do this
      right after writing this doc — see §6).
- [ ] Owner approval to proceed past Phase 0.
- [ ] Optional but recommended: `git init` for `/srv/docker/stream-commander`
      too, since it's also under active multi-session AI development and
      currently has zero version control.

### Phase 1 — Data model + conventions (no visible behavior change) ✅ DONE 2026-09-14
- [x] Resolved storage question: proceeded with file-based per-character
      JSON (§3.1 recommendation) — owner said "proceed" without objecting
      to the default, no pushback received.
- [x] `react-grid-layout` confirmed still active/maintained (v2.2.4,
      2.8M weekly downloads, MIT, checked 2026-09-14) and installed in
      `ui/package.json`. **Not yet imported/used anywhere** — that's Phase 2.
- [x] Schema formalized as JSDoc typedefs (not TS — project is plain JS):
      `ui/src/characters/schema.js`. Exports `ELEMENT_TYPES` (single source
      of truth for valid type strings) and typedefs for `Character`,
      `Category`, `Element`, `LevelPreset`, `GridPosition`, `DicePart`.
- [x] File convention scaffolded: `ui/src/characters/README.md` documents
      the `characters/<id>/character.json` + `characters/<id>/elements/
      <category>.json` layout. `characters/ribbitz/character.json` +
      `characters/ribbitz/elements/skills.json` are a small **hand-written
      example** (2 real Skills elements — Athletics, Stealth, with correct
      current math) proving the shape holds up, **not** a real migration
      and **not yet loaded by the app**.
- [x] Theming audit done — see the correction now in §3.4: there were no
      existing CSS variables to extract, contrary to this doc's original
      draft. Corrected in place, theming work itself still scoped to Phase 4.
- [x] Verified `npm run build` still passes, same output shape as before
      (328 modules) — confirms zero behavior change to the live dashboard,
      as required for this phase.

### Phase 2 — Proof of concept: empty canvas + a handful of real elements ✅ DONE 2026-09-14
- [x] `ui/src/dashboard/DashboardCanvas.jsx` — wraps `react-grid-layout`,
      loads a character + its elements, persists layout to
      `localStorage` (`ribbitz.canvasLayout.<characterId>`), drag handle is
      the title text specifically (not the whole card) so the Roll button
      stays reliably clickable without fighting drag gesture detection.
  - **Known limitation, not yet solved**: `GRID_WIDTH` is a hardcoded
    `1180` constant, not responsive. React-grid-layout's `WidthProvider`
    HOC is the standard fix — do that in Phase 3 once there's more real
    content to test reflow against, don't guess at it now.
- [x] `ui/src/elements/RollTopic.jsx` — the only renderer built so far
      (`roll-topic` type). Title click rolls immediately for elements with
      no detail text (bare skill checks); for elements that *do* carry
      `data.summary`/`data.notes` (future Magic Abilities/Spells
      migration), title click instead toggles an inline expand and rolling
      gets its own explicit 🎲 button — mirrors the
      `AbilityTopicRow`/`SpellInlineDetails` pattern already on the old
      dashboard, not a new interaction to learn.
  - **Advantage/disadvantage is a documented TODO in this file's own
    comments, not yet built.** Don't add it piecemeal per-element when it
    comes up in Phase 3 — design the mechanism once and update this plan.
- [x] `ui/src/lib/diceRoller.js` — `rollDice`/`rollFlatDice`/
      `parseStatNumber`/`DICE_API_BASE` extracted from `App.jsx` verbatim
      (logic unchanged), `App.jsx` now imports from here. First real step
      of the §3.6 file-splitting plan.
- [x] Migrated Skills **as a parallel preview, not a replacement**: new
      route `/canvas-preview` (`ui/src/pages/CanvasPreviewPage.jsx`), linked
      from the sidebar nav. The **real** `/` Dashboard route and its
      hardcoded Skills UI are completely untouched — both exist side by
      side right now. `characters/ribbitz/elements/skills.json` was
      regenerated (Phase 1's file only had 2 example elements) to cover
      **all 28** real Skills elements (22 skill checks + 6 ability saves),
      generated programmatically from the live `skillGroups`/`abilities`
      data already in `App.jsx` (script, not hand-typed, to avoid
      transcription error) — verify the math still matches if
      `skillGroups` changes before this script's source is deleted.
- [x] Deployed and verified: `npm run build` passes (367 modules, up from
      328 — confirms the new code actually compiled in, not silently
      dead), confirmed `canvas-preview`/`dashboard-canvas` strings present
      in the deployed JS bundle. **Not yet owner-verified in an actual
      browser** — the next session (or the owner directly) should open
      `/canvas-preview` and confirm drag/resize/roll all actually work
      before Phase 3 builds more on top of this foundation.
- **Deliverable (superseded, see revision immediately below — kept for
  history, not current state)**: `/canvas-preview` existed with all 28
  Skills elements individually draggable/resizable.

#### Phase 2 REVISION — owner correction, same day (2026-09-14)

The above (28 individually-draggable skill cards, each showing only a
single Roll button and a bare modifier) was **wrong**. Owner feedback,
verbatim: *"We dont want to have everything be individual on the layout,
we still want to group things by type. I just wanted to be able to drag
the types around a bit... I want all of the skills grouped back up like
they were in our first version."*

What changed:
- [x] `DashboardCanvas.jsx` rewritten: takes a `panels` prop (`[{id, title,
      component, layout}]`), one grid item per **whole panel**, not per
      element. Drag handle is now a dedicated `⠿ <Panel Title>` bar at the
      top of each panel card, not the content itself — content stays fully
      interactive/clickable.
- [x] `ui/src/panels/SkillsPanel.jsx` created — the **exact original**
      Ability Scores + Skills JSX (every row has both a Check *and* a Save
      button, ability score grid included) extracted verbatim out of
      `App.jsx` into its own component, taking `statMap` as a prop. The
      real `/` Dashboard route now renders `<SkillsPanel statMap={statMap}
      />` instead of ~90 lines of inline JSX — this is a real net
      reduction in `App.jsx` size (file-splitting win), not just a
      refactor for its own sake.
- [x] `characters/ribbitz/elements/skills.json` / `character.json` (the
      per-skill atomized JSON from the original Phase 1/2) are **no longer
      used by the canvas** — `CanvasPreviewPage.jsx` now builds its
      `panels` array directly from `<SkillsPanel />`. Those JSON files are
      left in place, not deleted — the Element/schema.js shape is still
      the planned approach for the separate "toggle an individual
      long-form item onto the dashboard" feature, just not for drag
      placement. Revisit whether they need updating when that feature is
      actually built.
- [x] `ui/src/elements/RollTopic.jsx` (the per-skill card renderer) is
      **no longer wired into anything** — DashboardCanvas no longer
      imports it. Left in place rather than deleted; it may still be
      useful for the "individual item toggle" feature later, and it does
      still work standalone if something needs a single expandable
      roll-button card. Don't treat its presence as meaning it's in use.
- [x] `ui/src/lib/api.js` created (`apiFetch`/`contentPath`/`fetchStatMap`
      extracted from `App.jsx`) so `CanvasPreviewPage.jsx` can fetch live
      stats independently without duplicating `App.jsx`'s full
      `fetchStats()` (which has vitals/trackers/inspiration side effects
      the canvas page doesn't need). **`App.jsx` still has its own
      separate, larger `fetchStats()`/`apiFetch` — this is duplication,
      not yet cleaned up.** Low priority, but note it for a future
      cleanup pass rather than being surprised two copies exist.
- [x] `npm run build` verified passing (366 modules), deployed.
- **Deliverable (current, correct)**: `/canvas-preview` has ONE draggable/
  resizable panel — the full Skills panel, byte-identical in content/
  behavior to what's on the real Dashboard — proving the whole-panel
  drag pattern. **Not yet owner-verified in a real browser after this
  revision.** Next real step (start of Phase 3 proper): extract the
  remaining panels (`panels/AbilityScoresPanel.jsx` is actually already
  *inside* `SkillsPanel.jsx` — consider whether it should be its own
  separately-draggable panel or stay bundled with Skills; ask the owner
  rather than assuming) — then Combat Kit, Magic/Spell Slots, Exhaustion,
  the same extract-and-wrap way.

### Phase 3 — Content migration, category by category
Order (roughly easiest/highest-value first, adjust based on what Phase 2
teaches you):
1. Skills (if not already done as the Phase 2 proof of concept)
2. Ability Scores
3. Actions/Attacks (Blowgun, Longbow, Daggers, Unarmed, Bite, Tongue Slap —
   already have roll math worked out from the skill-button work)
4. Magic Abilities (Halo of Spores, Symbiotic Entity, Fungal Infestation,
   Spreading Spores, Song of the Grung — click-to-expand already built this
   session, needs converting to draggable elements + roll buttons added
   where missing)
5. Spells (Cantrips through 6th level — highest element count, do this once
   the pattern is proven on smaller categories)
6. Inventory (needs the `counter`/`list` element types — +/− quantity)
7. Racial Traits + Class Features (currently long-form-only; pull the
   overlay-worthy ones identified this session — Active Camo, Poison
   Contact/Immunity, Amphibious, Favored Enemy, Natural Explorer, Dread
   Ambusher, Umbral Sight, Sharpshooter, Fey Touched — into dashboard
   elements; **watch for the duplicate-content collision flagged this
   session**: Bite/Tongue Slap/Tongue Grapple/Poison Weapon/Halo of
   Spores/Symbiotic Entity/Fungal Infestation/Spreading Spores/both
   Daggers/Vanguard Blowgun/Skywarden's Longbow all exist in more than one
   source file — pick one authoritative source per item before creating a
   dashboard element for it, don't create duplicates)
8. Magic items from Inventory.md with real mechanical text (Dragon Scale
   Shoulder Pads' Poisonous Rebuke, Flight Suit, Amulet, Gloves of Swimming
   and Climbing, Ring of Cold Resistance, Tongue Ring of Taunting)
9. Combat consumables (Potion of Haste, specialty potions, Frog Oil, Pond
   Poppers, Cherry Bomb Fireworks)
10. Notes/Backstory import — owner said they plan to feed these in too;
    ask at the time whether these become dashboard elements or stay purely
    long-form-only (they're less obviously "quick reference during play").

For **every** category migrated:
- Add the "show on dashboard" toggle to that category's long-form page
  (the owner's explicit ask) — flips `dashboardVisible` on the
  corresponding element.
- Wire roll buttons with advantage/disadvantage variants for anything
  rollable (design the actual mechanism once, in step 1 or 2, then reuse).
- Verify against the real 5e rules (dnd-ai-library or web search, 5e only)
  for anything you're computing/labeling, not just copying existing text —
  this project has a documented history of stat drift (see the math audit
  done 2026-09-12/13, referenced in git log) and the owner has explicitly
  said accuracy matters.
- Deploy and get owner confirmation before moving to the next category.

### Phase 4 — Theming
- Extract Ribbitz's current look into a named theme file.
- Build the settings panel + theme switcher.
- Confirm no hardcoded colors slipped through during Phase 3 migrations.

### Phase 5 — Multi-character + level presets
- Character switcher UI.
- Level preset authoring workflow (likely: owner + AI go through the
  long-form pages together at each level and fill in `levelPresets`).
- This is also the natural point to onboard the owner's other planned
  characters, if they're ready.

### Phase 6 — Polish / cleanup
- Remove now-dead old hardcoded JSX from `App.jsx` once everything is
  migrated (don't delete early — keep old and new running in parallel
  until a category is *fully* migrated and confirmed).
- Re-run the file-splitting audit (§3.6) — confirm `App.jsx` actually
  shrank the way it was supposed to.
- Full pass on advantage/disadvantage roll coverage, tracker completeness,
  toggle coverage.

---

## 5. Reusable pieces — don't rebuild these

- `ui/server/server.js`'s `/api/export/spells`, `/api/export/actions`,
  `/api/export/catalog` — already parse the canonical Markdown into
  structured JSON server-side. These are a strong candidate for the
  **seed data** when authoring `elements/spells.json` etc. in Phase 3 —
  either run them once and hand-tune the output into the new JSON files, or
  have the dashboard fetch them live and layer the layout/type metadata on
  top. Decide which in Phase 3 when you get there; don't decide now.
- `TrackerGroup.jsx` — already exactly the `tracker` element type's
  behavior. Reuse directly, don't reimplement.
- `rollDice`/`rollFlatDice` in `App.jsx` — extract as-is into
  `lib/diceRoller.js` in Phase 1/2, don't rewrite the logic.
- `extractSection`/`extractField`/`extractBulletNotes`/`slugifyHeading`/
  `stripHtml`/`summarizeMarkdownBlock` — the Markdown-parsing helpers
  already in `App.jsx`. Extract into `lib/markdownParsers.js`, reuse for
  any new category's Phase 3 migration rather than re-deriving parsing
  logic per category.
- The Prepared Spells click-to-expand pattern (`SpellInlineDetails`) and
  the Magic Abilities click-to-expand pattern (`AbilityTopicRow`) built
  this session are the direct behavioral model for the `roll-topic` /
  `expandable-topic` element types — read them before designing the new
  renderers, don't design from scratch.

---

## 5.1 Extraction/deletion safety rule (added after a real incident, 2026-09-14)

When extracting a chunk of `App.jsx` into its own file (or deleting a range
for any reason), **read the entire range being deleted first, not just its
start and end.** A quick skim of the boundaries is not enough — something
unrelated can be sitting in the middle. This happened for real: deleting
what looked like just `abilities`+`skillGroups` also silently deleted
`conditionsList`/`conditionDetails`/`exhaustionEffects`, which sat between
them. `npm run build` did **not** catch it — referencing an undefined
variable is a runtime `ReferenceError` in JS, not a build-time error.

**Before considering any extraction/deletion done, run this check:**
```bash
cd /srv/docker/ribbitz
git show pre-rebuild-2026-09-14:ui/src/App.jsx | grep -oE "^(const|function) [A-Za-z_][A-Za-z0-9_]*" | sort -u > /tmp/before.txt
grep -oE "^(const|function) [A-Za-z_][A-Za-z0-9_]*" ui/src/App.jsx | sort -u > /tmp/after.txt
comm -23 /tmp/before.txt /tmp/after.txt   # anything listed here must be an INTENTIONAL relocation — verify each one
```
If the app ever fails to load and the cause isn't obvious, run this check
**first**, before investigating anything else (library versions, caching,
infra) — it takes under a minute and would have caught the real incident
immediately instead of several rounds of guessing.

## 6. Handoff & Notes Protocol — READ THIS EVERY SESSION

This project is being worked across **multiple AI instances and sessions**
over a long period (the owner's words: "I plan to juggle this overhaul
between 3 AI instances until we get it done"). This section is not
optional reading.

### On every session, in this order:

1. **Read this whole file first.** Check "Current phase" at the top and
   the phase checklists in §4 to see what's actually done vs. still open —
   trust the checkboxes here over any assumption.
2. **Read `docs/PROGRESS_LOG.md`** (create it if it doesn't exist yet — see
   format below) for the dated log of what happened in each prior session,
   including anything that went wrong or was deliberately deferred.
3. **Verify live state before trusting either doc.** Both can go stale.
   Check `git log --oneline -10` in `/srv/docker/ribbitz`, and if unsure
   whether a deployed change matches the repo, rebuild+redeploy before
   assuming. Docs describe intent; git and the running container are truth.
4. Do the work for the current phase/step.
5. **Before ending the session** (or when context is running low — don't
   wait until you're forced to stop):
   - Update the "Current phase" line at the top of this file.
   - Check/uncheck items in the §4 phase checklists to match reality.
   - If you made a design decision not already captured here (e.g. resolved
     the "where does element JSON live" question, picked a different
     library than react-grid-layout, added a new element type), **write it
     into the relevant section of this doc**, don't just log it in the
     progress log — this doc should always reflect current reality, the
     progress log is the history of how it got there.
   - Append an entry to `docs/PROGRESS_LOG.md` (format below).
   - Commit and push. Every meaningful unit of work should be its own
     commit with a real message — the git history is a big part of how the
     next AI (or the owner) understands what happened. Don't let
     uncommitted work sit at session end.

### `docs/PROGRESS_LOG.md` format

```markdown
## 2026-09-14 — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Did: wrote this plan, backed up to git tag pre-rebuild-2026-09-14
- Decided: react-grid-layout recommended for canvas (see §3.3), file-based
  JSON recommended for element storage (see §3.1) — owner has not yet
  confirmed either, both need approval before Phase 1 starts
- Blocked on: owner approval to begin Phase 1
- Next AI should: wait for approval, then start Phase 1 per §4
```

Keep entries short and factual. This is a log, not a report — optimize for
"what do I need to know to continue," not completeness.

### Rules for AI-to-AI handoff specifically

- **Never assume the previous AI's stated plan is still the plan** — always
  check this doc's "Current phase" line and the checkboxes, since the owner
  may have redirected a prior session verbally in a way that only shows up
  in the progress log, not in code.
- **If you disagree with a prior decision recorded here**, don't silently
  override it — flag it to the owner and get explicit confirmation before
  changing course, then update this doc to reflect the new decision *and*
  briefly note in the progress log why it changed.
- **If you get significantly through a phase and run low on context**,
  finish the current small step (don't leave a half-edited file), then do
  the "before ending the session" checklist above even if the phase itself
  isn't complete. A clean handoff mid-phase is much better than a rushed
  attempt to finish the whole phase.
- **5e rules questions**: use `/srv/docker/dnd-ai-library` (via the Dice
  Knights `/ai-assistant` page) or plain web search — 5th edition only, per
  owner instruction. Grimmory-DnD (`/srv/docker/Grimmory-DnD/AI_HANDOFF.md`)
  has additional book scans if the AI library is missing something.
- **Never trust a stat/formula already on the sheet as correct just because
  it's already there** — this project has a real history of values drifting
  out of sync when the character leveled up (see the 2026-09-12/13 math
  audit in git log around commit `7ba7559` and earlier). When migrating a
  category in Phase 3, recompute from first principles (ability
  score/proficiency bonus/level) rather than trusting the existing display
  value, and flag anything that doesn't match rather than silently
  preserving a possible error.
