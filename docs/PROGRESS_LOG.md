# Ribbitz Dashboard Rebuild — Progress Log

Dated, factual entries only — this is a log for AI-to-AI handoff, not a
report. See `REBUILD_PLAN.md` §6 for the required format and protocol.
Newest entries at the top.

---

## 2026-09-22 (19) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Owner confirmed all Phase 3 canvas bugs are fixed ("that's working
  great") and gave direction for what's next:
  - Proceed through **Phase 4 (theming), Phase 5 (level presets), Phase 6
    (polish)** without per-step check-ins — "you should be able to
    complete those tasks without me."
  - The older deferred backlog (math-audit fixes, advantage/disadvantage
    roll buttons, toggle-item-onto-dashboard) stays OUT of scope — owner
    will return to it later when they can focus in. Don't touch it
    unprompted.
  - **Level presets are scoped down, this is a real decision not a
    guess**: Ribbitz only gets presets from his CURRENT level up through
    20 (level-up planning). No presets below current level — the owner
    doesn't want to reconstruct years of historical stats, and called it
    explicitly "not useful for Ribbitz." Multi-character support / a
    character switcher is explicitly deferred to "a whole new character"
    later, not built now. Full reasoning recorded in
    `REBUILD_PLAN.md`'s Phase 5 section — read it before writing any
    level-preset code so the scope doesn't silently creep back to a full
    multi-character system.
  - Because of the "in case we run out of tokens" framing: committing +
    updating these docs after every meaningfully-complete step this
    session, not just at phase boundaries.
- REBUILD_PLAN.md updated: Phase 3 status marked owner-verified, Phase 5
  section rewritten with the scoped-down decision above, and a new
  "2026-09-22 owner directive" note added telling future sessions to keep
  going autonomously through 4-6 and to leave the older backlog alone.
- **Not yet done**: none of Phase 4/5/6's actual implementation has
  started yet as of this entry — this entry is the checkpoint made
  immediately before starting Phase 4 (theming). If you're picking this
  up cold, check whether there's a newer entry above this one describing
  actual theming work; if this is still the newest entry, Phase 4 hasn't
  been started.

## 2026-09-21 (18) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Owner tested (17): "worked for spell slots, weapons, and potions
  panels, but not the currency and skills panels" (still showing a
  scrollbar there).
- Different cause from (17)'s phantom-gutter issue — this one is a real
  overflow. `handleResizeStop` didn't distinguish width-only from
  height-changing resizes until the (16) fix landed; any resize before
  that point (e.g. testing an early drag on Currency/Skills, which were
  likely the first two panels tried since they sit top-left in the
  default layout) would have wrongly frozen that panel's height forever
  at whatever it happened to be at the time — permanently opting it out
  of auto-fit, even though the owner never deliberately chose that
  height. Spell Slots/Weapons/Potions apparently hadn't been
  resize-tested yet at that point, so they were never wrongly frozen and
  picked up the (16)/(17) fixes cleanly.
- Fix: bumped the manual-sized storage key from
  `ribbitz.canvasManualSized.v2.<id>` to `...v3.<id>` — clears every
  owner's stale manual-sized flags (there's no way to tell a
  legitimately-chosen v2 height apart from a wrongly-frozen one after
  the fact, so the clean fix is the same "bump the key" pattern used for
  the layout key back in (11)). After this deploy, Currency and Skills
  (and anything else stale) go back to auto-fit; a real resize from here
  on uses the corrected height-vs-width logic.
- `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed `canvasManualSized.v3` string present
  in the deployed bundle.
- **Not yet done**: owner has not yet re-tested. If Currency/Skills (or
  any panel) is still wrong after this, it's no longer a stale-flag
  issue — something else is going on and needs fresh investigation.

## 2026-09-21 (17) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Owner tested (16): width handle works, but "most of the panels have
  scroll bars on the right side" — and clarified they're fine WITH real
  scrollbars on a panel they've deliberately squeezed smaller, they just
  also want a way to make a panel *taller* via the same drag controls
  (mirroring the width handle from (16)), so they can size things the
  way they want instead of scrolling by default.
- Two changes:
  1. Added an `s` (bottom-edge, height-only) resize handle alongside the
     existing `e` (width-only) and `se` (corner) ones —
     `resizeHandles={['e', 's', 'se']}`. `handleResizeStop`'s existing
     "only freeze auto-fit if `h` actually changed" check (from (16))
     already does the right thing here with no further change needed.
  2. Root cause of "most panels have scroll bars": (14)'s
     `scrollbar-gutter: stable` fix was applied to `.dashboard-canvas__item-body`
     globally (all 5 panels), to fix ONE panel's (Magic's) real
     width-reflow oscillation bug. That reserved gutter shows as a thin,
     always-present strip even on panels with zero actual overflow — so
     every ordinary, correctly-auto-fit panel looked like it had a stray
     scrollbar, when only Magic's multi-column grid actually needed the
     reservation. Scoped it down: added
     `WIDTH_SENSITIVE_PANEL_IDS = new Set(['magic'])` in
     `DashboardCanvas.jsx`, moved `scrollbar-gutter: stable` in
     `App.css` into a new `.dashboard-canvas__item-body--reserve-gutter`
     modifier class applied only to panels in that set. If a *different*
     panel starts oscillating in the future (per the (14) lesson about
     width-sensitive content), add its id to this set rather than
     re-broadening the CSS rule back to global.
- `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed `reserve-gutter` string present in the
  deployed bundle.
- **Not yet done**: owner has not yet re-tested. Confirm (a) a bottom-edge
  handle now lets height be dragged directly, (b) panels other than Magic
  no longer show a scrollbar strip when they don't need one, and (c)
  Magic still doesn't oscillate (the whole reason for the allowlist).

## 2026-09-21 (16) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Owner ask: "I need a way to change the width myself with a drag and
  drop motion." Previously only `resizeHandles`'s library default (`se`,
  bottom-right corner) was enabled — that lets you drag width+height
  together but there was no dedicated width-only handle, and no explicit
  `resizeHandles` prop had been set at all until now (relying on the
  library default).
- Fix: added `resizeHandles={['e', 'se']}` to `<GridLayout>` — `e` gives
  a vertically-centered handle on the right edge of each panel for a
  pure width-only drag, `se` keeps the corner for both at once. Both
  handle styles already ship in `react-resizable/css/styles.css` (already
  imported), no new CSS needed.
- Bug caught while wiring this up (not yet reported by the owner, fixed
  proactively): `onResizeStop` was marking a panel "manually sized"
  (opting it out of auto-fit-to-content height, see (12)) on ANY resize,
  including a pure width-only drag via the new `e` handle — so widening a
  panel would have silently frozen its height too, even though the owner
  never touched that dimension. Fixed: `handleResizeStop` now only marks
  manual-sized when `oldItem.h !== newItem.h`, i.e. only when height
  actually changed.
- `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200.
- **Not yet done**: owner has not yet re-tested. Ask them to confirm (a)
  they can now grab a handle on the right edge of a panel and drag width
  only, and (b) doing that doesn't lock the panel's height (it should
  still auto-fit if content changes later).

## 2026-09-21 (15) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Owner tested (14): sizing/oscillation is fixed ("much closer"), but on
  a 1440p monitor panels could only ever occupy ~2 columns' worth of
  width and couldn't be dragged onto the right side of the screen at all.
- Cause: `GRID_WIDTH` was hardcoded to `1180` px (a leftover placeholder
  from Phase 2, flagged with a `TODO` comment at the time it was added —
  see the Phase 3 final-swap entry). The grid's actual pixel width never
  grew past that regardless of real window/monitor size, so on anything
  wider than ~1180px the canvas just sat pinned to the left with dead
  space on the right that nothing could be dragged into.
- Fix: swapped in react-grid-layout's own `WidthProvider` HOC
  (`WidthProvider(RGL)`), which measures the grid's real container width
  (and re-measures on window resize) instead of a hardcoded number.
  Removed the `GRID_WIDTH` constant and the `width={GRID_WIDTH}` prop
  entirely — `WidthProvider` injects the real width itself. No change
  needed to `pxToRows()` (it's width-independent) or to
  `.dashboard-canvas`/`.main-panel` CSS — neither had a competing
  `max-width` that would've capped it anyway (checked).
- No layout-storage migration needed: `x`/`y`/`w`/`h` in a saved layout
  are column/row units (0-12 cols), not pixels, so existing saved
  layouts are still valid — panels just render wider per column now.
- `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200.
- **Not yet done**: owner has not yet re-tested on the 1440p monitor to
  confirm panels can now be dragged/placed across the full screen width,
  not just the old ~1180px band.

## 2026-09-21 (14) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Owner tested (13): most panels fixed, but "the spell box is glitching
  constantly changing size" — MagicPanel specifically, continuously.
- Different bug from (13)'s feedback loop (that one was confirmed fixed —
  this is a second, separate oscillation cause). Root cause: MagicPanel's
  content reflows with available width (its multi-column
  `prepared-spells__grid` and the Circle of Spores grid). `item-body` has
  `overflow-y: auto`, and during the auto-fit measure -> resize cycle the
  scrollbar was toggling in and out — each toggle changes the available
  content width by the scrollbar's width (~15-17px), which reflows
  MagicPanel's grid to a *different* height, which triggers another
  measurement, which toggles the scrollbar again... an oscillation that
  never converges. Other panels (Primary, Skills, Exhaustion, Kit) don't
  have width-sensitive multi-column content, so they never hit this even
  though the same mechanism was present for all of them.
- Fix: `scrollbar-gutter: stable` on `.dashboard-canvas__item-body` —
  reserves the scrollbar's width permanently whether or not one is
  actually showing, so the available content width never changes and
  there's nothing left for a width-sensitive panel to reflow against.
  One CSS line, no JS change.
- **Lesson**: any panel with width-dependent internal layout (multi-column
  grids, flex-wrap, etc.) combined with a conditionally-visible scrollbar
  on its container is a latent version of this same oscillation — if a
  *different* panel starts "glitching/resizing constantly" in the future,
  check for width-sensitive content first before assuming it's another
  variant of the (13) height-feedback-loop bug.
- `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed `scrollbar-gutter` present in the
  deployed CSS bundle.
- **Not yet done**: owner has not yet re-tested. Ask them to specifically
  watch the Magic/Spell panel this time, plus leave the tab open a few
  minutes per the still-open ask from (13).

## 2026-09-21 (13) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Owner tested (12) after a week and reported the bottom-of-panel blank
  gap was still there, and "even weirder, it slowly grows the longer I
  have the window open."
- Real bug, a feedback loop in the (12) auto-fit `ResizeObserver`: it
  observed `.dashboard-canvas__item-body`, which has `flex: 1` (stretches
  to fill whatever height the grid box currently is). `scrollHeight` is
  always >= an element's own rendered box height — so once the box grew
  even slightly past real content (from the `+4px` rounding slack in
  `pxToRows`), the observer read that *larger box* as "more content,"
  grew `h` again, which grew the box again, forever. Growing "the longer
  the window is open" was literally correct — every ResizeObserver tick
  fed the loop another notch.
- Fix: added an inner wrapper div (`.dashboard-canvas__item-content`,
  plain block, no flex/height rules) between `item-body` and
  `panel.component`, and moved the measurement ref to that inner div
  instead. Its height is now driven only by its own content, never by the
  outer flex box, so there's nothing left to feed back into. No CSS
  needed for the new class beyond "don't give it any sizing rules."
- **Lesson for next time a "measure and resize a container" pattern is
  built**: never `ResizeObserver.observe()` an element whose own size is
  *derived from* the thing you're about to set based on that measurement
  — that's the textbook setup for this exact loop. Always measure an
  inner, unstretched wrapper.
- No localStorage cleanup needed: the inflated h values were never
  written to `ribbitz.canvasManualSized.v2.*` (only a real owner drag
  writes there), so every affected panel re-measures correctly and
  self-corrects on the next load — confirmed this is still true, didn't
  change that part of the logic.
- `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed `item-content` string present in the
  deployed bundle.
- **Not yet done**: owner has not yet re-tested. Given the past two
  rounds both needed a correction, explicitly watch for: (a) does the
  gap stay closed on first load, (b) does it stay closed / does NOT grow
  after leaving the tab open a few minutes this time.

## 2026-09-14 (12) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Owner tested (11): "huge blank spots at the bottom of each panel." Root
  cause: the fixed `h` estimates baked into each panel's default layout
  (52/46/46/80/46 rows) were guesses made for the old single-column
  full-width layout, and (11) made the box literally `height: 100%` of
  whatever `h` says — so with real content shorter than the guess, the box
  just sat there with empty space at the bottom instead of shrinking.
- Fix: panels now **auto-fit their own height to their real rendered
  content** via a `ResizeObserver` on each panel's `item-body` (measuring
  `scrollHeight`, which reports true content height even while visually
  clipped) plus the handle's real height, converted to grid rows with
  `pxToRows()` (inverts react-grid-layout's own px-per-row formula, given
  `ROW_HEIGHT=30` and `MARGIN=[10,10]`, which is now passed explicitly to
  `<GridLayout margin={...}>` instead of relying on its default). This
  replaces guessed `h` values entirely for any panel the owner hasn't
  manually resized.
- A panel opts OUT of auto-fit only when the owner actually drags its
  resize handle (`onResizeStop` marks that panel id as "manually sized").
  That set is tracked in its own localStorage key
  (`ribbitz.canvasManualSized.v2.<id>`), separate from the layout-position
  key — **important distinction**: react-grid-layout fires
  `onLayoutChange` (which we persist as the layout) on mount too, not just
  on real drags, so "a layout got saved" does NOT mean "the owner chose
  this height." Only `onResizeStop` counts. Get this wrong and you
  reintroduce the exact bug just fixed, permanently locking in the guessed
  defaults as if they were manual choices.
- `npm run build` passed (383 modules). Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed `canvasManualSized` string present in
  the deployed bundle.
- **Not yet done**: owner has not yet re-tested. If a panel still shows a
  gap or clips content, check whether that panel id is already in
  `ribbitz.canvasManualSized.v2.ribbitz` in the browser's localStorage
  (devtools → Application → Local Storage) — if so it's intentionally
  frozen at whatever size it was dragged to and won't auto-fit; clear that
  one key (not the whole layout key) to let it resume auto-fitting.

## 2026-09-14 (11) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Owner tested the (10) canvas swap: drag works, but reported "each panel
  is so big that there's really not much room to maneuver anything" — root
  cause was two-fold: (a) `.dashboard-canvas__item` had
  `height: auto !important`, which made the CSS ignore the grid's computed
  height entirely, so the resize handle was dead — you could drag it but
  the box always snapped back to full content height; (b) every panel
  defaulted to `w: 12` (full canvas width), so panels could only ever
  stack in one column, never sit side by side, without the owner manually
  shrinking each one first (which didn't even work, per (a)).
- Fix: removed the `height: auto !important` override — `.dashboard-canvas__item`
  now just fills its grid-computed box (`height: 100%`), so drag-resize
  actually works. `.dashboard-canvas__item-body` changed from
  `overflow: visible` to `overflow-y: auto` so a panel deliberately resized
  smaller than its content gets its own internal scrollbar — this is fine
  now because it only happens on a deliberate owner resize, not as the
  default state (default `h` values are still generous enough to fit each
  panel's content with no scrollbar needed at default size).
- Changed the default layout from single-column full-width (`w:12` for
  all 5) to a 2-column arrangement (`w:6` each): Primary+Skills side by
  side on row 1, Exhaustion+Magic on row 2, Kit alone on row 3 — gives
  usable side-by-side room out of the box instead of one giant stacked
  column.
- Bumped `DashboardCanvas.jsx`'s localStorage key from
  `ribbitz.canvasLayout.<id>` to `ribbitz.canvasLayout.v2.<id>` — otherwise
  the owner's already-saved single-column layout would silently override
  the new 2-column defaults and none of this would visibly change for
  them. Precedent: bump this key again any time the *default* layout
  changes in a way that should reach owners who already have a saved
  layout.
- `npm run build` passed (383 modules). Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed the new `canvasLayout.v2` string is in
  the deployed bundle.
- **Not yet done**: owner has not yet re-tested in a live browser to
  confirm resize now actually works and the 2-column default gives enough
  room to rearrange comfortably. If panels still feel cramped, the fix is
  either smaller default `h`/`w` per panel or the still-open
  `GRID_WIDTH` → `WidthProvider` TODO (canvas width is hardcoded 1180px,
  not responsive to actual window width) — worth revisiting together if
  narrow-window use is common.

## 2026-09-14 (10) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Did: extracted `panels/KitPanel.jsx` (Weapons, Ammo, Drugs & Herbs, Grung
  Abilities) — 14 props, moved the local `GrungDcBlock` sub-component and
  the 3 ammo-name consts (`pondPoppersName`, `standardBlowgunDartsName`,
  `standardArrowsName`) that are exclusive to this panel. Note:
  `App.jsx` still keeps its own copies of those 3 name consts since it
  needs them to compute the `*Quantity` values passed down as props —
  this is intentional duplication, not a bug.
- Preserved the known pre-existing "+7 hit" bug on Tongue Slap/Bite
  verbatim (math audit says it should be +8) — out of scope for an
  extraction, left a code comment pointing at the audit.
- This was the last of the 5 panels. Then did the **Phase 3 final swap**:
  replaced the old static `<section className="grid">` Dashboard route in
  `App.jsx` with `<DashboardCanvas>` rendering all 5 panels
  (Primary/Skills/Exhaustion/Magic/Kit) as a single-column stack
  (`x:0, w:12` for every panel; `y` 0/52/98/144/224; `h` estimates
  52/46/46/80/46) — single-column chosen specifically to avoid the
  left-right overlap risk noted for `height:auto!important` panels;
  vertical overlap is still only mitigated (not eliminated) by generous
  `h` estimates, since react-grid-layout doesn't know real rendered height.
- Deleted `/canvas-preview`: removed the route, nav link, and import from
  `App.jsx`, deleted `ui/src/pages/CanvasPreviewPage.jsx` entirely, fixed
  a stale comment in `lib/api.js` that referenced it.
- Ran the §5.1 declaration-diff safety check (21 removed declarations,
  all accounted for) and a separate grep for stray `CanvasPreviewPage`
  references (found only the one comment, now fixed).
- `npm run build` passed (383 modules, 692KB bundle). Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; spot-checked the deployed bundle for 5 distinctive
  strings, one per panel ("Grung Abilities", "Prepared Spells", "Circle of
  Spores", "Death Saves", "Ability Scores") — all present.
- **Not yet done**: owner has not yet opened the live `/` dashboard to
  confirm there's no visual panel overlap and that drag/resize/scroll work
  correctly across all 5 panels together. This is the first real multi-panel
  test of the `height:auto!important` CSS — do this check before starting
  Phase 4.
- Committed (not yet pushed at log-write time — see git log for actual
  push status) and updated `REBUILD_PLAN.md` (Phase 3 marked complete,
  current phase → Phase 4 theming).

## 2026-09-14 (9) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Did: extracted `panels/MagicPanel.jsx` (Spell Slots trackers, Prepared
  Spells click-to-expand list, Other Magical Abilities incl. the Circle
  of Spores roll buttons built in an earlier session) — 16 props, plus
  moved two small sub-components (`AbilityTopicRow`, `SpellInlineDetails`)
  and 3 small consts (`spellLevelOrder`, `haloDamage`,
  `haloSymbioticDamage`) into the panel file since they're exclusively
  used there.
- Followed the same §5.1 process (full-range read, then declaration-diff
  safety check) — 20 removed declarations total now, all accounted for as
  intentional relocations (5 new ones this round).
- `npm run build` passes (384 modules), deployed, spot-checked deployed
  bundle for "Prepared Spells"/"Circle of Spores" content.
- 3 of 5 panels done: Skills, Primary, Exhaustion, Magic. **Only Combat
  Kit remains** (Weapons / Ammo / Drugs & Herbs).
- Not added to `/canvas-preview` — per the sequencing decision, that's
  the final step once Combat Kit is also done.
- Committed + pushed.
- Next AI should: extract `panels/KitPanel.jsx` (or similar name) for the
  Combat Kit panel — same exact process, one more time. It already uses
  `StatControl` (shared import, no new relocation needed for that) and
  `parseTracker`/`timeOfDayMap` (already props-ready patterns from Magic/
  Exhaustion). Once that's done and verified, all 5 panels exist as
  standalone files — that's the trigger to do the final step: swap `/`
  itself to render through `DashboardCanvas` with all 5 panels, and
  retire `/canvas-preview`. Don't do the final swap in the same sitting
  as the Kit extraction — verify Kit on the real Dashboard first, exactly
  like the previous 3.

## 2026-09-14 (8) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Owner confirmed the scroll fix and whole-panel drag pattern are exactly
  right, and wants the same treatment "for the whole character sheet."
  Presented two sequencing options; owner chose: **extract every
  remaining panel first (verified on the real Dashboard each time), only
  wire the draggable canvas to all of them at the very end** — `/` itself
  will eventually get swapped to render via `DashboardCanvas`, retiring
  `/canvas-preview` as a separate page. Full rationale recorded in
  REBUILD_PLAN.md's new "Phase 3 sequencing decision" section — read that
  before continuing, don't re-litigate the choice.
- Did: extracted `panels/PrimaryPanel.jsx` (Currency, Quick Stats,
  Vitality/HP/Symbiotic HP, Healing, Hit Dice, Death Saves) — 17 props,
  the most dependency-heavy panel so far. Real `/` Dashboard now renders
  `<PrimaryPanel .../>` instead of ~185 inline lines.
- Did: extracted `panels/ExhaustionPanel.jsx` (Potions & Poisons,
  Exhaustion track, Conditions checklist, Ranger Features quick links) —
  10 props.
- Did: also relocated shared helper components that multiple panels use —
  `components/StatControl.jsx`, `components/CounterRow.jsx`,
  `lib/triState.js` (triStateClass/cycleTriState). `StatControl` is still
  imported directly in `App.jsx` too since the not-yet-extracted Combat
  Kit panel also uses it.
- Followed the §5.1 process exactly both times: read the *entire* line
  range before deleting (not just boundaries — this is the rule added
  after tonight's real bug), then ran the declaration-diff safety check
  after each extraction. Every removed declaration both times was
  confirmed as an intentional relocation before proceeding — full list
  each time is in the commit messages. No new collateral-damage bugs.
- `npm run build` passes after each step (382 modules after Primary, 383
  after Exhaustion), deployed after each, spot-checked a distinctive
  string from each panel's content in the deployed bundle both times.
- Did **not** add Primary or Exhaustion to `/canvas-preview` — per the
  sequencing decision above, that happens all at once later, not
  incrementally per panel.
- Committed + pushed (two commits, one per panel).
- Next AI should: continue the same exact process for the two remaining
  panels — **Magic** (Spell Slots / Prepared Spells / Other Magical
  Abilities — this one's likely the largest and most complex, has the
  click-to-expand spell list and the Circle of Spores roll buttons built
  in an earlier session) then **Combat Kit** (Weapons / Ammo / Drugs &
  Herbs — uses `StatControl`, already available via the shared import).
  Follow REBUILD_PLAN.md's "Phase 3 sequencing decision" step-by-step
  process exactly, in order, both times. Once all 5 panels exist as
  standalone files, the final step is swapping `/` to render through
  `DashboardCanvas` and retiring `/canvas-preview` — don't do that until
  all 5 are done and each individually verified.

## 2026-09-14 (7) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- App confirmed working by owner. They confirmed whole-panel drag is
  exactly what they wanted. One UX complaint: the Skills panel had its own
  trapped inner scrollbar (from `.dashboard-canvas__item-body {
  overflow: auto }`) — wanted the whole page to scroll instead, with one
  scrollbar on the right edge of the screen.
- Fix: panel items no longer clip/scroll internally
  (`.dashboard-canvas__item` height forced to `auto !important` instead of
  the grid-calculated pixel height, `.dashboard-canvas__item-body` overflow
  changed to `visible`). A panel taller than its nominal grid `h` now just
  grows downward and contributes to the normal page scroll, instead of
  being clipped into its own scroll box. Bumped the Skills panel's default
  `layout.h` from 20 to 46 too, closer to its real content height (cosmetic
  only — the CSS override is what actually fixes the behavior regardless
  of this number).
- **Known limitation, not a problem yet but will be in Phase 3**: this
  `height: auto !important` approach only looks right because there's
  currently exactly one panel on the canvas. Once a second panel is added
  and both need auto-height, react-grid-layout's own collision/compaction
  math won't know a panel visually grew taller than its declared `h` —
  panels below a tall one could visually overlap it. Options when that
  comes up: either keep `h` values manually tuned close to real content
  height per panel (fragile), or look into whether a newer react-grid-layout
  version/library feature handles auto-height items properly (don't
  default back to installing "whatever's latest" per the §3.3 warning —
  check the actual API before adding it). Flag this to the owner when the
  second panel is being built rather than silently hoping it looks fine.
- `npm run build` passes, deployed. Not yet re-confirmed by the owner.
- Committed + pushed.
- Next AI should: confirm the scroll fix looks right, then continue
  Phase 3 (next panel extraction) — but read the "Known limitation" note
  above first if that's the next task, since it directly affects how to
  approach adding a second panel.

## 2026-09-14 (6) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- **Real bug #2, found via the owner's browser console (I asked, they
  provided it — this is exactly why that ask matters, see below)**:
  `Uncaught ReferenceError: exhaustionEffects is not defined`. The
  react-grid-layout v1/v2 fix (previous log entry) did NOT fix the actual
  problem the owner was hitting — it was a real, separate bug, present on
  the plain `/` Dashboard route too (blank page, not just `/canvas-preview`).
- Root cause: during the Phase 2 correction (`abilities`/`skillGroups`
  extraction into `SkillsPanel.jsx`), I deleted App.jsx lines by a line
  range (`sed -i '87,232d'`) based on having viewed the *start* of
  `abilities` and the *end* of `skillGroups`, but **never read what was in
  between them** (lines ~94–148). Three unrelated consts were sitting in
  that gap — `conditionsList`, `conditionDetails`, `exhaustionEffects` —
  and got silently deleted as collateral damage. `npm run build` did not
  catch this because referencing an undefined variable is a **runtime**
  ReferenceError in JS, not a build-time error — Vite/esbuild don't do
  full reference-checking by default. I only checked for stray references
  to the two names I *meant* to delete, not for what else might have been
  in the deleted range.
- Fix: restored all three consts verbatim from git history
  (`git show 49b2617:ui/src/App.jsx`, the commit right before the
  deletion) into their own spot near the top of `App.jsx`. Then, instead
  of trusting my own judgment again, ran a **systematic check**: diffed
  every top-level `const`/`function` declaration between the
  `pre-rebuild-2026-09-14` tag and current `HEAD` (`grep -oE
  "^(const|function) [A-Za-z_][A-Za-z0-9_]*"` on both, `comm -23`) to
  confirm nothing else was silently dropped. Only the 6 intentional
  relocations showed up (abilities/skillGroups → SkillsPanel.jsx;
  DICE_API_BASE/parseStatNumber/rollDice/rollFlatDice → diceRoller.js).
  No further collateral damage found.
- `npm run build` passes, deployed, confirmed the restored content
  (`'Disadvantage on ability checks'` etc — a string literal, survives
  minification unlike variable names) is present in the deployed bundle.
- **Process lesson, more important than the bug itself**: when
  bulk-deleting a line range from a large file to "extract" a piece of it,
  **read the entire range first**, not just its start and end. A
  quick skim of the boundaries is not enough to assume the middle only
  contains what you're looking for. This cost the owner a fully broken app
  for multiple exchanges. If this happens again, the **first** diagnostic
  step should be exactly the `comm`-based declaration diff above, not
  guessing at library versions or caching — it would have caught this
  bug in under a minute instead of several back-and-forth messages.
- Also: the owner's browser console screenshot was the thing that actually
  broke this open, after two rounds of guessing (dice overlay sizing
  confusion, then the real-but-insufficient react-grid-layout fix). Ask
  for the console error **immediately** next time the app fails to load,
  rather than trying other theories first.
- Committed + pushed.
- Next AI should: get explicit owner confirmation the app loads correctly
  again (root Dashboard AND `/canvas-preview`) before touching anything
  else. Given two real bugs shipped back-to-back in this same session, it
  would be reasonable for the owner to want a pause/breather here before
  continuing Phase 3 — don't assume "continue" without checking.

## 2026-09-14 (5) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- **Bug, found and fixed**: owner reported "the app will not seem to load
  anymore" right after the Phase 2 revision. Root cause: `npm install
  react-grid-layout` (no version pin) installed **2.2.4**, which turned
  out to be a complete API rewrite from the classic v1 API every example/
  tutorial (and this plan, and `DashboardCanvas.jsx`) was written against
  — v2 has no `cols`/`rowHeight`/`draggableHandle` top-level props, uses
  nested `gridConfig`/`dragConfig` objects instead. The app failed to
  mount at all as a result.
- Fix: pinned `react-grid-layout` to `^1.5.4` (the maintainers publish
  this under the `legacy` dist-tag too, `npm install
  react-grid-layout@legacy`, if 1.5.4 stops resolving someday) — this is
  the version the actual v1-style code in `DashboardCanvas.jsx` was always
  written against, no code changes needed, just the correct package
  version. `npm run build` passes (378 modules), deployed.
- **Lesson written into REBUILD_PLAN.md §3.3 as a permanent warning**: I
  had "confirmed react-grid-layout is still maintained" before installing
  it in Phase 1 (checked weekly downloads + recent release date) and
  considered that sufficient diligence. It wasn't — that check catches
  abandonment, not a breaking major-version rewrite. Should have checked
  the changelog/major version number specifically, or pinned a version
  from a known-good tutorial rather than taking `npm install`'s default
  `latest`. Apply this lesson to every future dependency this rebuild
  adds, not just this one.
- Not yet re-verified in a real browser after this fix (should now load —
  the previous failure was a hard mount-time crash, not a subtle one, so
  low risk, but still unconfirmed).
- Committed + pushed.
- Next AI should: confirm with the owner that the app loads again and
  `/canvas-preview` still works as expected (whole-panel drag from the
  previous session's revision) before doing anything else.

## 2026-09-14 (4) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Did: corrected Phase 2 based on direct owner feedback after they tried
  `/canvas-preview`. Two separate issues reported, both fixed:
  1. Dice overlay size — owner wanted it 2x bigger, hitbox 1920 wide ×
     ~900 tall anchored from the bottom. Set `#dice-box` in
     `stream-commander/templates/dice_overlay.html` to
     `left:0; top:180px; width:1920px; height:900px` (max possible area
     below the text block, which ends around y=460). Deployed + restarted
     `jukebox` container, test-rolled to confirm no server error.
  2. **The bigger one**: the 28-individual-skill-cards approach from the
     first Phase 2 was architecturally wrong. Owner: "We dont want to have
     everything be individual on the layout, we still want to group things
     by type... I want all of the skills grouped back up like they were in
     our first version." Full correction detail in REBUILD_PLAN.md's
     "Phase 2 REVISION" subsection — don't duplicate it here, read that.
     Short version: rebuilt `DashboardCanvas.jsx` to take whole-panel grid
     items instead of per-element ones; extracted the *exact* original
     Ability-Scores-and-Skills JSX (Check+Save per row, not the stripped-
     down version) into `panels/SkillsPanel.jsx`, reused by both the real
     Dashboard and the canvas preview.
- Verified: `npm run build` passes (366 modules), deployed both the
  Ribbitz and Stream Commander changes.
- **Not verified**: real-browser check of the corrected `/canvas-preview`
  (whole-panel drag/resize) — the previous per-element version WAS
  confirmed working by the owner before this correction, but this is a
  different enough rewrite (drag handle moved to a header bar, content
  structure changed) that it needs its own fresh confirmation. Also not
  verified: whether the new dice overlay size is actually "2x" as asked —
  I maximized the available area (can't go bigger without overlapping
  text), but dice-box's own `scale` config was already at its library-
  imposed cap (9) before this change, so box-area was the only lever left.
  If it's still not big enough after this, that's a real ceiling, not
  something to keep nudging blindly — flag it back to the owner rather
  than guessing a 4th time.
- Open question I raised in the plan doc rather than deciding myself:
  should Ability Scores be its own separately-draggable panel from Skills,
  or stay bundled together as they are now? Ask the owner before Phase 3
  extracts the next panel, since the same question will recur for
  Spells/Magic Abilities (currently also share one panel).
- Committed + pushed.
- Next AI should: get owner confirmation on `/canvas-preview` (whole-panel
  drag/resize) and the dice overlay size before extracting more panels.
  If both are good, continue Phase 3: resolve the Ability-Scores-bundling
  question above, then extract Combat Kit / Magic / Exhaustion into their
  own `panels/*.jsx` files the same way `SkillsPanel.jsx` was done —
  extract verbatim first, don't redesign content while extracting,
  keep it a mechanical move.

## 2026-09-14 (3) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Did: Phase 2 complete. Owner said "continue" after Phase 1.
- Built: `dashboard/DashboardCanvas.jsx` (react-grid-layout wrapper,
  localStorage-persisted layout), `elements/RollTopic.jsx` (first element
  renderer — roll on click, or expand-then-roll if the element carries
  detail text), `lib/diceRoller.js` (extracted from App.jsx, logic
  unchanged), `pages/CanvasPreviewPage.jsx` + new `/canvas-preview` route
  and nav link.
- Regenerated `characters/ribbitz/elements/skills.json` from 2 example
  elements (Phase 1) to all 28 real ones (22 skills + 6 saves) —
  programmatically generated from the live `skillGroups`/`abilities` data
  in `App.jsx` via a throwaway script, not hand-typed, specifically to
  avoid transcription errors across 28 entries.
- Deliberately did NOT touch the real `/` Dashboard route or its existing
  Skills UI — `/canvas-preview` is fully parallel. This was a plan
  requirement (§4 Phase 2/3), not my own caution alone.
- Verified: `npm run build` passes (367 modules, up from 328), confirmed
  new code present in the deployed bundle via grep. Deployed to the live
  container.
- **Not verified**: I have no browser access, so I could not confirm
  drag/resize/roll actually work correctly for a real person clicking
  around. This is the most important thing for the next session (AI or the
  owner) to check before Phase 3 builds more categories on this foundation
  — if the interaction model has a problem, better to find out now with 28
  elements than after Actions/Spells/Magic Abilities are also on it.
- Known gaps, intentionally deferred (see REBUILD_PLAN.md Phase 2 section
  for full detail, don't rediscover these from scratch): canvas width is a
  hardcoded 1180px constant, not actually responsive yet (needs
  react-grid-layout's `WidthProvider`); advantage/disadvantage roll
  variants are not built; RollTopic's expand-content path is untested
  since no Skills element currently has `data.summary`/`data.notes` (first
  real test of that path will be Magic Abilities or Spells in Phase 3).
- Committed + pushed.
- Blocked on: owner (or next AI) confirming `/canvas-preview` actually
  works in a real browser.
- Next AI should: **first**, if the owner hasn't already, ask them to open
  `/canvas-preview` and try dragging/resizing/rolling a couple of Skills
  cards before writing more code — don't assume Phase 2 is solid just
  because it built and deployed. Once confirmed, start Phase 3 per
  REBUILD_PLAN.md §4: Ability Scores next (smallest remaining category,
  good second data point for the pattern), then Actions/Attacks.

## 2026-09-14 (2) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Did: Phase 1 complete. Owner said "proceed" to the plan.
- Did: installed `react-grid-layout` (confirmed still active/maintained
  first — v2.2.4, 2.8M weekly downloads). Not wired up yet, that's Phase 2.
- Did: wrote `ui/src/characters/schema.js` (JSDoc typedefs +
  `ELEMENT_TYPES` catalog constant — single source of truth for the shape).
- Did: scaffolded the file-based storage convention —
  `ui/src/characters/README.md`, plus a small hand-written example
  (`characters/ribbitz/character.json` + `elements/skills.json`, 2 real
  Skills elements with correct current math) to prove the shape works
  against real content. **Not loaded by the running app yet** — nothing
  imports these files. Do not be surprised the dashboard looks unchanged.
- Corrected an error in the plan doc itself: §3.4 originally assumed
  `App.css` already had CSS custom properties to extract for theming. It
  doesn't — audited, zero found, 79 hardcoded color literals instead.
  Fixed in place in REBUILD_PLAN.md §3.4; theming is a from-scratch build
  in Phase 4, not an extraction.
- Verified: `npm run build` passes, 328 modules (same as before this
  session's changes) — confirms no visible/behavioral change yet, as
  required for Phase 1.
- Committed + pushed.
- Blocked on: nothing — ready to start Phase 2 (DashboardCanvas.jsx +
  migrate Skills as the proof-of-concept category) whenever a session picks
  this up next.
- Next AI should: start Phase 2 per REBUILD_PLAN.md §4. Build
  `DashboardCanvas.jsx` + a `roll-topic` element renderer, load
  `characters/ribbitz/character.json` + `elements/skills.json` (the Phase 1
  example — extend it to the *rest* of Skills, not just Athletics/Stealth,
  as part of this phase), get real drag/resize/persist working, and confirm
  the existing dice-roll wiring (`rollDice` in `App.jsx` — extract into
  `lib/diceRoller.js` per §3.6 while you're in there) still works end to
  end through the new canvas. Ship this alongside the old hardcoded Skills
  UI (don't remove the old one until the new one is owner-confirmed
  working) — see Phase 2/3 notes in the plan for why.

## 2026-09-14 — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH)
- Did: wrote `REBUILD_PLAN.md` (master plan for the dashboard rebuild) and
  this log, per owner's request for a detailed plan + backup before starting.
- Did: backed up current state — committed all outstanding changes in
  `/srv/docker/ribbitz` (dice-tool integration, Cloudkill/Contagion spell
  additions, skill Check/Save buttons, Magic Abilities click-to-expand,
  dashboard flex-wrap layout fix), tagged `pre-rebuild-2026-09-14`, pushed
  both `main` and the tag to `origin` (GitHub). This tag is the safe
  rollback point if the rebuild goes wrong.
- Did: linked this plan from `/Data/AI-Handoffs/FullScopeHandoff.md`.
- Decided (needs owner confirmation before Phase 1 starts): recommended
  `react-grid-layout` for the drag/resize/reflow canvas (plan §3.3);
  recommended file-based per-character JSON for element storage over a new
  DB (plan §3.1).
- Also flagged, not yet acted on: Stream Commander
  (`/srv/docker/stream-commander`) has no git repo at all despite heavy
  active development — recommend initializing one, out of scope for this
  specific plan but worth a separate ask to the owner.
- Blocked on: owner approval to begin Phase 1 (data model + conventions).
- Next AI should: read `REBUILD_PLAN.md` in full first (especially §6),
  confirm with the owner whether Phase 1 is approved to start, and if so,
  resolve the two "needs confirmation" decisions above before writing any
  code.
