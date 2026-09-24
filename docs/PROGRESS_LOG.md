# Ribbitz Dashboard Rebuild — Progress Log

Dated, factual entries only — this is a log for AI-to-AI handoff, not a
report. See `REBUILD_PLAN.md` §6 for the required format and protocol.
Newest entries at the top.

---

## 2026-09-24 (30) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — Lava die fix, 2-line damage, grey-out-if-empty
- Owner corrections/asks on (29)'s row layout:
  1. "The lava blowgun darts are also 1d6" — `AMMO_TYPES`'s lava entry had
     `elementalDie: null` (the old assumption that "Lava effects" meant no
     clean die existed). Fixed to `'1d6'`, same as Fire/Water. Side effect
     worth noting: this also fixes the actual DAMAGE ROLL for Lava, not
     just its row label — previously choosing Lava silently rolled base
     weapon damage only, since `RangedWeapon`'s compound-roll logic keys
     off `ammoType.elementalDie` being truthy.
  2. "put the 1d# piercing on them as well... say the piercing damage,
     then under it the elemental damage" — every non-Standard row's
     Damage column now shows two stacked lines (`.ammo-row__damage-line`):
     the weapon's own Piercing die on top, that type's elemental die
     underneath. Standard still shows just the one Piercing line (no
     elemental to add). Header column count dropped from 4 to 3 (Name /
     Damage / Amount) since damage type is now inline with each line
     instead of its own column.
  3. "grey out any options that are not available... Dont disable them...
     I could find one on the battlefield... or create one as a bonus
     action... makes it a bit more obvious [what's in inventory]" — added
     `.ammo-row--empty` (opacity 0.45) applied whenever that row's
     quantity is 0, purely visual — `onClick`/`onSelect` are completely
     unaffected, still fully selectable/clickable at 0 quantity. Verified
     this is genuinely non-disabling (no `disabled` attribute, no
     `pointer-events: none`, no early-return in the click handler).
- `npm run lint` passed (0 errors). `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed `ammo-row--empty` and
  `ammo-row__damage-line` present in both the deployed JS and CSS.
- **Not yet done**: owner hasn't tested live yet. Ask them to confirm (a)
  Lava now correctly rolls its 1d6 alongside Piercing (not just labeled
  right), (b) the two-line Piercing/elemental damage display reads
  clearly at actual panel width, and (c) rows at 0 quantity are
  noticeably dimmed but still clickable/selectable exactly as before.

## 2026-09-24 (29) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — ammo row layout + poison quantity
- Owner: add a poison dart/arrow inventory slot, and redo the ammo layout
  as one clickable row per type — Name / Damage / Damage Type / Amount —
  where clicking a row equips it (3px white border on the selected row,
  Standard selected by default).
- **New quantity tracking**: added `dartPoison`/`arrowPoison` to
  `App.jsx`'s `vitals` state, `vitalKeyMap` (sheet keys `dart-poison`/
  `arrow-poison`), and the stat-sync effect — exact same pattern as the
  existing `dartFire`/`arrowFire` etc. entries, so it persists/syncs the
  same way. **Note for next session**: while reading this code I noticed
  `vitals.dartStandard`/`arrowStandard` (sheet keys `dart-standard`/
  `arrow-standard`) are defined and synced but never actually read
  anywhere — the real "Standard" quantity in the UI comes from a
  different mechanism entirely (`getInventoryQuantity` matched by item
  name via the Inventory page's item list, not `vitals`). This is
  pre-existing dead state from before this session, not something I
  introduced or fixed — flagging it since it's easy to assume
  `vitals.dartStandard` is live when it isn't.
- **New UI**: replaced the old 4-StatControl-grid-plus-separate-selector-
  buttons layout with `AmmoRowList` in `panels/AttackPanel.jsx` — one row
  per `AMMO_TYPES` entry (now 5: Standard/Fire/Water/Lava/Poison), each
  showing Name, Damage (the type's own bonus die, or the weapon's base
  die for the Standard row), Damage Type, and an editable Amount input.
  Clicking anywhere on a row equips that ammo type (`onSelect`); clicking
  the amount input stops propagation so editing quantity doesn't also
  re-select the row. Selected row gets a 3px solid white border
  (`.ammo-row--selected`), unselected rows have a 3px *transparent*
  border (kept in the CSS at the same width, not just 0, so the row
  doesn't visually shift size when selection changes).
  Old `AmmoSelector` (the standalone button row) is fully removed for
  ranged weapons — the row list replaces it entirely. The melee daggers'
  separate Poison ON/OFF toggle button is untouched (daggers have no
  ammo type to select between, just the one on/off toggle from (28)).
- `npm run lint` passed (0 errors). `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed `ammo-row--selected` and
  `ammo-row-list__header` present in both the deployed JS and CSS.
- **Not yet done**: owner hasn't tested live yet — ask them to confirm
  (a) all 5 rows appear correctly for both Blowgun Darts and Arrows, (b)
  clicking a row selects it (3px white border) without the amount field
  interfering, (c) editing the Poison amount actually persists/syncs
  like the other ammo counts do, and (d) the row layout (column
  alignment between the header and the rows) looks right at actual panel
  widths — this was built without a live browser to check against.

## 2026-09-23 (28) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — poisoned dart/arrow/dagger options
- Owner: "Ribbits has the ability to poison weapon, we need a poisoned
  dart, poisoned arrow, poisoned dagger options all added."
- Researched real 2014 5e rules for the Grung "Poison Weapon" trait before
  building anything (WebSearch, Volo's Guide RAW) — this matters because
  the local docs (`Racial Traits.md`/`Actions.md`) only documented the
  save DC, never what actually happens on a fail. Confirmed: applies to
  any PIERCING weapon, target makes a CON save (Ribbitz's scaled DC 18,
  `statMap['poison-weapon-dc']`) or takes **2d4 poison damage** — it's a
  save-NEGATES bonus damage die, not a flat always-on bonus like Fire/
  Water, and not a "poisoned condition" effect (that's a different Grung
  trait, Poisonous Skin, which doesn't apply here). Limited to
  Proficiency Bonus uses/day (`statMap['poison-weapon']`, currently 6/6).
  All three requested weapons (Darts, Arrows, both Daggers) are piercing-
  capable, so no RAW conflict with the request.
- This turned out to be a clean fit for the compound-damage system built
  for Fire/Water (25)-(27) — same mechanism, added Poison as a 5th
  `AMMO_TYPES` entry (`elementalDie: '2d4'`, plus a `requiresSave: true`
  flag) for the ranged weapons' existing selector.
- Daggers (melee) had NO ammo/elemental system at all before this — added
  a simple on/off "Poison ON/OFF" toggle button per dagger instance
  (`MeleeWeapon` gained `poisoned`/`onTogglePoison`/`poisonDc` props;
  state lives in `AttackPanel` as `daggerFeyPoisoned`/
  `daggerPlainPoisoned`), since there's nothing else to pick between for
  a melee weapon the way there is for ranged ammo types.
- Added a visible `PoisonSaveNote` reminder (shown only when Poison is
  active) on both ranged and melee weapons: "Poison Weapon: target CON DC
  {dc} save or take the poison damage below (uses = Proficiency Bonus/day)"
  — since this is fundamentally different from Fire/Water (which just
  always apply), it seemed important not to let it look like an automatic
  bonus. No interactive use-tracking wired up (would need `handleToggle`/
  `parseTracker` threaded into `AttackPanel`, which doesn't have them
  currently) — this is purely a static reminder of the DC and daily cap,
  not a decrementing counter. Flag to the owner if they want real
  use-tracking added later.
- `npm run lint` passed (0 errors). `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed "Poison Weapon" string present in the
  deployed bundle.
- **Not yet done**: owner hasn't tested live yet. Ask them to confirm (a)
  the Poison option appears in the dart/arrow selector and does what's
  expected (2d4 poison die alongside Piercing, correctly labeled per the
  (27) totals-per-type display), (b) the new Poison ON/OFF toggle appears
  under both daggers and works the same way, and (c) the DC shown in the
  reminder note matches what they expect (currently pulled live from
  `statMap['poison-weapon-dc']`, falling back to 18 if unavailable).

## 2026-09-23 (27) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — separate totals per damage type
- Owner tested (26): 2 dice now show and are labeled, but "each dice needs
  to be labeled and show 2 different totals. 1d8 piercing damage and 1d6
  fire damage. My DM will need to know the different damage types and
  amounts" — the overlay was still summing both dice into ONE combined
  grand total underneath, which isn't how 5e damage typing actually works
  (piercing and fire resistance/vulnerability are tracked separately —
  adding them into one number loses information the DM needs).
- Stream Commander overlay (`templates/dice_overlay.html`) changes:
  - Split `buildBreakdown` into two functions: the original (unchanged,
    used for every normal single-damage-type roll) and a new
    `buildCompoundBreakdown(roll, groups)` used only when `diceLabels` is
    present and matches `groups.length`. The compound version shows each
    die's raw roll, any flat modifier attached to just the FIRST group
    (e.g. Sharpshooter Bonus only ever applies to the weapon's own damage
    type, never the elemental one), and that group's own labeled total —
    e.g. "6 (Rolled) + 10 (Sharpshooter Bonus) → 16 Piercing · 4 (Rolled)
    → 4 Fire". No trailing "=" since there's no single sum following.
  - Added `buildTotalsHtml(groups, diceLabels)` + a new `.compound` state
    on `#dice-total`: instead of one giant number, renders one labeled
    total per damage type ("PIERCING 16" / "FIRE 4" side by side, smaller
    font since it's more text than a single number).
  - `isCompoundRoll(roll, groups)` gates which path runs — non-compound
    rolls (every attack roll, every plain damage roll with no elemental
    ammo) are completely unaffected, byte-for-byte the same behavior as
    before this change.
- No Ribbitz UI changes needed this round — `rollCompoundDamage` from
  (26) already sends everything the overlay needs (`diceLabels`,
  per-group `parts` semantics); this was purely a Stream Commander
  rendering fix.
- Rebuilt + redeployed `jukebox`
  (`docker compose -f /srv/compose/stack.yml build/up jukebox`); confirmed
  `buildCompoundBreakdown`/`dice-total-item` present in the served
  `/dice-overlay` page.
- **Not yet done**: owner hasn't tested live yet. Ask them to confirm (a)
  two clearly separate, correctly-labeled totals appear (not one combined
  number), (b) the Sharpshooter Bonus (when using Heavy+Fire etc.) shows
  up folded into the Piercing total only, not the elemental one, and (c)
  the still-unverified group-ordering assumption from (26) — Piercing
  should always be first/left, matching the weapon's own damage die.

## 2026-09-23 (26) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — fix: compound damage rolls only showed 1 die
- Owner tested (25)'s ammo selector: "I click fire, then shoot a standard +
  fire dice. Only 1 dice is showing up on the screen, it should be 2 dice
  each owing their own damage. It should show the piercing damage from the
  blowgun dart, then show separate damage that's the fire damage."
- Root cause, found by reading dice-box's own minified source
  (`static/vendor/dice-box/dice-box.es.js`, `parse()` function): its
  notation parser only understands ONE die type per string. Given
  `"1d8+1d6"` (what `AttackPanel.jsx` was sending for Standard+Fire), the
  regex matches `1d8` as the die, then tries to parse the REMAINDER
  `"+1d6"` as a plain numeric modifier via `/([+-])(\d+)/` — which matches
  the `+1` inside `+1d6` and silently discards the `d6` entirely. So the
  roll was actually being sent as "1d8 with a flat +1 modifier" — one die,
  wrong number — never two dice. dice-box DOES support multiple different
  dice types, but only via an ARRAY of notation strings (e.g. `["1d8",
  "1d6"]`), which nothing in this codebase had ever exercised before
  (every prior roll used one die type).
- Three-layer fix, all needed together:
  1. **Stream Commander backend** (`app/main.py` `/api/dice/roll`): was
     force-casting `notation` to a string (`str(data.get("notation"))`),
     which would have mangled a real JS array into a Python list's string
     repr — completely broken. Now accepts `notation` as either a string
     or a list of up to 4 strings (kept as real JSON, not stringified),
     plus a new optional `diceLabels` array (parallel to a list notation,
     e.g. `["Piercing", "Fire"]`) for per-die labeling.
  2. **Stream Commander overlay** (`templates/dice_overlay.html`):
     `buildBreakdown()` now takes the raw `groups` array from dice-box's
     `onRollComplete` and, when the roll included `diceLabels` matching
     `groups.length`, labels each group's own value (e.g. "6 (Piercing) +
     4 (Fire)") instead of flattening every individual die into a
     generic "(Rolled)" list. Falls back to the old generic behavior
     whenever `diceLabels` isn't supplied — zero behavior change for
     every existing simple (single die type) roll in the app.
  3. **Ribbitz UI** (`lib/diceRoller.js`): added
     `rollCompoundDamage(label, diceGroups, parts)` —
     `diceGroups: [{ notation, label }, ...]` — builds the array
     notation + parallel diceLabels, appends any flat modifier (parts)
     to the FIRST group only. `panels/AttackPanel.jsx`'s `RangedWeapon`
     now calls this instead of the plain `rollDamage` whenever
     `ammoType.elementalDie` is set, sending `[{notation: dmgDie,
     label:'Piercing'}, {notation: elementalDie, label: ammoType.label}]`.
     Plain `rollDamage` (single string) is untouched and still used for
     every damage roll with no elemental ammo equipped.
- **Caveat, not fully verified**: group ordering in dice-box's
  `onRollComplete` is assumed to match the input notation array's order
  (read from source, not confirmed live in a browser — no browser access
  this session). If the Piercing/Fire labels ever come back swapped on
  the overlay, that assumption is the first thing to check.
- Verified via direct `curl -X POST .../api/dice/roll` with a test array
  notation + diceLabels — backend correctly stored and echoed both fields
  intact (previously this would have been mangled to a stringified
  Python list). Rebuilt + redeployed both containers: `ribbitz` (`docker
  compose build/up ribbitz`) and `jukebox` (`docker compose -f
  /srv/compose/stack.yml build/up jukebox`); confirmed `diceLabels`
  string present in both the deployed Ribbitz JS bundle and the served
  `/dice-overlay` page.
- `npm run lint` passed (0 errors, same 4 pre-existing warnings).
- **Not yet done**: owner hasn't tested live yet — ask them to equip Fire
  or Water again and confirm (a) 2 physical dice actually appear on the
  overlay, (b) the breakdown text reads "Piercing"/"Fire" (or "Water")
  rather than generic numbers, and (c) the total is correct (weapon die +
  elemental die + any flat bonus, e.g. Heavy+Fire Blowgun should be
  1d8+10+1d6). If Piercing/Fire ever show up swapped, revisit the group-
  ordering assumption above.

## 2026-09-23 (25) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — dice overlay crash fix + equipped ammo selector
- Owner tested (24)'s attack buttons: "that works quite well" but reported
  "sometimes when I roll, it gets where the dice is about to land and it
  just fades to black. Its like its maybe erroring or something."
- **This is a Stream Commander (`jukebox` container) bug, not a Ribbitz UI
  bug** — found and fixed in
  `/srv/docker/stream-commander/templates/dice_overlay.html`. Root cause:
  the overlay's `poll()` loop called `box.roll(notation)` immediately every
  time it saw a new pending roll id, with NO guard against a previous
  roll's physics animation still being in progress. The backend
  (`/api/dice/roll` in `stream-commander/app/main.py`) stores only a
  single `dice_pending_roll` setting — so firing several attacks quickly
  (exactly the owner's real workflow: heavy bow, then standard, then Dread
  Ambusher in the same few seconds) reliably produced overlapping
  `box.roll()` calls on the same DiceBox/WebGL instance, which is
  consistent with a corrupted render going black mid-animation.
- Fix: added a client-side roll queue (`rollQueue`/`isRolling` in
  `dice_overlay.html`) — `poll()` now pushes new roll ids onto a queue
  instead of rolling immediately; `processQueue()` only starts the next
  roll once `onRollComplete` has fired for the current one (and calls
  `box.clear()` before every new roll to reset the tray cleanly). Rebuilt
  and redeployed the `jukebox` container (`docker compose -f
  /srv/compose/stack.yml build/up jukebox`); confirmed `rollQueue` present
  in the served `/dice-overlay` page.
- **Known remaining limitation, not fixed**: the backend's single-slot
  `dice_pending_roll` setting means if two rolls happen within the same
  ~400ms poll window (very fast double-click), the first could be
  silently overwritten before the overlay ever sees it — a true multi-item
  server-side queue would fix this but wasn't required to address the
  reported symptom (visual corruption, not missed rolls) and would be a
  bigger change. Revisit if the owner reports rolls actually going
  missing (not just glitching).
- **Ammo selector**: owner ask — "add equipped buttons to each ammo type
  for darts and arrows. By default standard is selected, but if we switch
  to a different type of ammo it adds that ammo type to our roll... roll
  damage with a fire dart equipped." Added `AmmoSelector` (Standard/Fire/
  Water/Lava toggle buttons) under each ammo group in
  `panels/AttackPanel.jsx`, session-local state (`blowgunAmmoId`/
  `longbowAmmoId`, default `'standard'`, not persisted to the sheet — this
  is "what's loaded for this attack," not inventory state). When a
  non-standard type is equipped, the weapon's Standard/Heavy damage
  buttons automatically append that ammo's bonus die and relabel
  themselves (e.g. "Standard + Fire (1d8+1d6)").
- Elemental damage dice sourced from `ui/public/content/Inventory.md`'s
  "Ammunition & Weapons" section: Fire Darts = 1d8 Piercing + 1d6 Fire,
  Water Darts = 1d8 Piercing + 1d6 Water, Lava Darts = 1d8 Piercing +
  "Lava effects" (no die given — Lava equips fine but rolls no bonus die,
  labeled plainly rather than inventing a number). **Important caveat
  documented in code**: only Darts are explicitly documented with these
  values — Arrows have the identical Fire/Water/Lava tracking structure
  in `vitals` but no separate documented table, so the same rule was
  applied to Arrows BY ANALOGY, not because it's separately confirmed.
  Flag this to the owner if Arrows turn out to work differently.
- `npm run lint` passed (0 errors). `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed `attack-panel__ammo-select` present in
  both the deployed JS and CSS.
- **Not yet done**: owner hasn't tested either fix live yet. Ask them to
  (a) fire several attacks in quick succession again and confirm the dice
  overlay no longer goes black, and (b) try equipping Fire/Water on the
  Blowgun or Longbow and confirm the damage button label and resulting
  roll actually include the extra 1d6 — and separately confirm whether
  the Arrows-by-analogy assumption above is actually correct for this
  character.

## 2026-09-23 (24) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — split Kit panel + weapon attack buttons
- Owner: "we now want to start working through other stuff on the UI...
  weapons ammo drugs herbs and grung abilities all combined into one big
  panel. Let's split this up." Explicit split: Attack Panel (Weapons +
  Ammo), Drugs & Herbs -> its own Inventory panel, Grung Abilities -> its
  own panel (no attack buttons on it yet — owner: "we may try to add it
  to something later if it makes sense", explicitly deferred, not done
  this entry).
- Deleted `panels/KitPanel.jsx`, split its content into three new files:
  `panels/AttackPanel.jsx` (Weapons + Ammo), `panels/InventoryPanel.jsx`
  (Drugs & Herbs), `panels/GrungPanel.jsx` (Grung Abilities, unchanged
  including the still-deferred stale "+7 hit" bug). Updated
  `App.jsx`'s `DashboardCanvas` panels array: 1 panel -> 3
  (`attack`/`inventory-panel`/`grung`). Ran the standard §5.1
  declaration-diff safety check — clean, no new removed names (only
  imports/JSX changed, not top-level App.jsx declarations).
- **Attack buttons** (the main ask): owner's exact requirement — "for my
  ranged weapons we have to have a standard attack, then a heavy, then a
  Dread Ambusher attack... need buttons for each possible attack with
  each weapon... dice show out the math and how we get to the total, be
  detailed." Researched what "Dread Ambusher" actually means for THIS
  character by reading `ui/public/content/Actions.md` (already
  DM-verified content, not re-derived from scratch) — it's not a separate
  damage formula, it's Ribbitz's Gloom Stalker feature granting a 3rd
  attack on the first round of combat ("First round (Dread Ambusher): 3
  attacks = 3 shots"). So each ranged weapon (Blowgun, Longbow) got 3
  to-hit buttons — Standard, Heavy (Sharpshooter), Dread Ambusher — where
  Dread Ambusher uses the SAME math as Standard, just labeled separately
  so the owner has a distinct button to click for that bonus 3rd attack
  during round 1. Melee weapons (both Daggers) got Standard-only per the
  owner's explicit scoping to ranged weapons for the heavy/Dread Ambusher
  modes.
- **Math breakdown**: added `rollDamage(label, dieNotation, parts)` to
  `lib/diceRoller.js` (new — mirrors the existing `rollDice` but for
  non-d20 damage dice with a labeled flat-bonus breakdown, e.g. "1d8
  (Rolled) + 10 (Sharpshooter Bonus) ="). To-hit and damage flat bonuses
  are broken into real labeled parts: Dexterity Modifier and Proficiency
  Bonus pulled LIVE from `statMap` (`dex-mod`, `proficiency`), plus each
  weapon's own fixed bonus (Archery Fighting Style + Magic Weapon,
  Fey Blessing, Sharpshooter Penalty) hardcoded per weapon since those
  are static weapon/feat properties, not sheet-tracked stats. Every
  number was cross-verified against `Actions.md`'s own documented
  per-weapon breakdown AND the live sheet's combined `blowgun-hit` /
  `longbow-hit` / etc. values before shipping — they reconcile exactly
  (e.g. Blowgun Standard: DEX 5 + PB 6 + Archery+Magic 3 = 14, matches
  `statMap['blowgun-hit']`).
- **Real bug caught and fixed before shipping** (not owner-reported —
  found during implementation): my first draft reused the SAME
  "weaponBonus" value for both the to-hit breakdown AND the damage flat
  bonus. That's wrong for the Longbow specifically — Archery Fighting
  Style (+2) adds to the ATTACK roll only, never to damage, so damage
  should only include DEX + the Magic Weapon bonus (+2), not DEX +
  (Archery + Magic) (+4). Fixed by adding a separate explicit `dmgBonus`
  prop so to-hit and damage bonuses are never silently conflated again —
  a component that reuses one derived value for two conceptually
  different quantities is worth double-checking on sight in any future
  weapon addition here.
- `npm run lint` passed (0 errors, same 4 pre-existing warnings). `npm
  run build` passed. Deployed via `docker compose build ribbitz &&
  docker compose up -d ribbitz`; `curl /` returns 200; grepped the
  deployed bundle for "Dread Ambusher", "Sharpshooter Penalty", "Drugs",
  "Grung Abilities", and the new `attack-panel__roll-btn` CSS class — all
  present.
- **Not yet done**: owner has not yet tested the new attack buttons live
  — ask them to fire a few and confirm the dice overlay shows the
  breakdown as expected (each labeled part + the rolled die), and that
  the totals match what they'd expect from the sheet. Damage buttons
  were added alongside the requested attack (to-hit) buttons since they're
  a natural pairing and reuse the same "detailed math" ask — flag if the
  owner wanted attack-only for now. Ammo/elemental bonus damage (Blowgun's
  `blowgun-elemental` stat, Longbow's undocumented "Gloom" fallback that
  was never real sheet data) were intentionally left out of scope this
  round — not requested, and the "Gloom" one was fabricated placeholder
  text in the old KitPanel that was never backed by a real stat anyway.

## 2026-09-22 (23) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — character content audit (not part of canvas rebuild)
- Owner asked to circle back to "the actual character, math, and OBS
  workflows" now that Phases 4-6 are done. This entry covers the
  character/math half; workflow (OBS/dice) work is a separate future
  step, not started this entry.
- **7th-level spell slot**: owner confirmed (after last session's
  research) he should have one. Attempted a live write via
  `POST /api/stats` with `slots-7th` — response claimed `notFound:1` but
  `rowsCreated:0` (inconsistent), and a re-fetch confirmed no row was
  actually created. The deployed Apps Script web app likely differs from
  the `.gs` file in this repo (`OBS Auto Sync/Engine/Google Apps Script
  Framework.gs`) — do not trust that write path without re-verifying
  first. Owner was given the exact row to add manually (Label "7th Level
  Slots", Value "1/1", Type "slots", Key "slots-7th", OutputFile
  "slots-7th.txt") — **not yet confirmed done on the actual sheet**.
- **Does he need a 7th-level spell?** No — researched and confirmed:
  multiclass spell SLOTS come from the combined-level table, but which
  spells you can know/prepare is based on each class's OWN level
  separately (verified via WebSearch, PHB multiclassing text). Druid 11
  caps at 6th-level spell access, Ranger 6 caps at 2nd — neither reaches
  7th yet, so the 7th-level slot exists purely for upcasting a
  lower-level spell. Confirmed with the owner as the answer.
- **Full spell audit** (owner: "look at the ones given as perks... then
  the ones I just get as druid/ranger, make sure I have the right
  amount"). Researched every relevant table via WebSearch/WebFetch
  (2014 5e rules only, per owner's explicit edition constraint from last
  session):
  - Gloom Stalker Magic (Ranger 3rd/5th, always prepared, free):
    Disguise Self, Rope Trick. Both already present, now explicitly
    tagged.
  - Circle of Spores Circle Spells (Druid 2/3/5/7/9, always prepared,
    free): Chill Touch, Blindness/Deafness, Gentle Repose, Animate Dead,
    Gaseous Form, Blight, Confusion, Cloudkill, Contagion — verified the
    REAL table via WebFetch (dnd5e.wikidot.com/druid:spores), which
    corrected an earlier wrong assumption from last session (I'd
    initially guessed Revivify/Bestow Curse were on this list — they are
    NOT; the real table is exactly the 9 above). All 9 present, now
    tagged.
  - Fey Touched feat (always prepared, free): Misty Step + Hunter's Mark.
    Present, tagged.
  - Owner corrected me on **Toll the Dead**: I'd flagged it as a likely
    error (not on Druid/Ranger list) — owner confirmed it's a real DM
    grant, reward for reading a necromancy spell. Updated its Source
    line to document this instead of removing it.
  - Owner also revealed **Summon Undead** (Tasha's Cauldron, 3rd-level
    necromancy) — a DM grant, 1 free casting per long rest OR cast
    normally with a real 3rd-level+ slot, doesn't count against
    anything. This spell did NOT exist anywhere in the content file —
    added it as a new entry in the 3rd Level Spells section (verified
    real spell text/stats via WebSearch) plus a tracker line in the
    Reset/Usage Trackers section at the top of the doc.
  - Owner confirmed his 4 Ranger-known spells (Ranger 6, fixed per the
    2014 Ranger table, chosen by the player not derivable from rules
    alone): **Goodberry, Detect Magic, Jump, Wild Cunning**. This let me
    finish the accounting: of 19 total non-bonus spells across 1st-6th
    level, exactly 4 are these Ranger picks and the remaining 15 are
    Druid-prepared — which matches Druid's own formula (Wis mod +4 +
    Druid level 11 = 15) exactly. Nothing needed to change numerically;
    only the missing tags.
  - Added an explicit **`**Prep Source:**`** line to all 38
    spells/abilities in the file (one Python script pass, not 38 manual
    edits — see scratchpad `tag_prep_source.py`, not committed) tagging
    each as one of: Druid (prepared) / Ranger (known) / Druid (free
    cantrip choice) / Circle of Spores Circle Spell / Gloom Stalker
    Magic / Fey Touched feat / DM Homebrew Grant. This is the
    `prep_source` tagging system referenced from an earlier session as
    a planned-but-never-built feature — it's now actually in the content
    file itself (as a Prep Source line per entry), not yet as a
    UI-visible filter/badge anywhere in the dashboard — that would be a
    separate future UI task if wanted.
  - Verified counts after tagging: 15 "Druid (prepared)", 4 "Ranger
    (known)", 4 "Druid (free cantrip choice)", 9 Circle of Spores
    entries (1+2+2+2+2 across the 5 threshold levels), 2 Gloom Stalker
    Magic, 2 Fey Touched feat, 2 DM Homebrew Grant (Toll the Dead +
    Summon Undead). All match expected totals exactly.
- **Important repo gotcha rediscovered**: there are TWO copies of this
  file — `Spells and Magic Abilities.md` at the repo root, and
  `ui/public/content/Spells and Magic Abilities.md` (the one actually
  served/built into the app). No automated sync exists between them.
  I edited the served copy first, then diffed and copied it over the
  root copy to keep them in sync — do this every time, in this order
  (edit the served one, verify content renders, THEN sync to root),
  since the root copy isn't what a rebuild actually picks up.
- Deployed via `docker compose build ribbitz && docker compose up -d
  ribbitz` after each content change; verified via `curl .../content/...`
  that the served markdown actually contains the new content each time
  (not just a successful build — content is static, so this is a
  simpler check than the JS-bundle grep used for code changes).
- Committed to git (see commit for exact message).
- **Not yet done**: owner still needs to manually add the `slots-7th`
  row to the actual Google Sheet (the app couldn't do it reliably — see
  above). The `prep_source` tags are in the markdown content only, not
  surfaced anywhere in the dashboard UI yet — that's a reasonable future
  ask if the owner wants a visual filter/badge for it. OBS/dice-roll
  workflow work (the other half of what the owner asked to circle back
  to) has not been started this session.

## 2026-09-22 (22) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — Phase 6 DONE (scoped)
- Scoped Phase 6 down deliberately: the plan's Phase 6 bullet list
  included "full pass on advantage/disadvantage roll coverage" — that
  item predates this whole canvas rebuild and is part of the SAME older
  backlog (math-audit fixes, adv/dis buttons, toggle-onto-dashboard) the
  owner explicitly said to leave for when they can focus in. Did NOT
  touch it. Only did the two objective, mechanical cleanup items:
- **Dead code removal**: `npm run lint` found one real issue —
  `rollFlatDice` imported in `App.jsx` but never used (leftover from the
  MagicPanel extraction weeks ago; the actual usage moved to
  `MagicPanel.jsx`/`lib/diceRoller.js` but the now-dead import in
  `App.jsx` was never cleaned up). Removed it. Also manually checked for
  leftover duplicate sub-components/consts from past extractions
  (`AbilityTopicRow`, `SpellInlineDetails`, `GrungDcBlock`,
  `conditionsList`, `exhaustionEffects`, `currencyItems`, `quickStats`,
  `abilities`, `skillGroups`) — none found still sitting in `App.jsx`,
  all cleanly relocated in past sessions. Remaining 4 lint warnings are
  pre-existing `react-hooks/exhaustive-deps` patterns unrelated to the
  rebuild — left alone, out of scope.
- **File-splitting audit**: confirmed `App.jsx` actually shrank as
  intended — was 2470 lines before the rebuild (tag
  `pre-rebuild-2026-09-14`), now 1085 (56% reduction) after this
  session's extractions. Found one more good candidate flagged since
  Phase 3 but never done (`REBUILD_PLAN.md` §5 "Reusable pieces" called
  it out explicitly): the markdown-parsing helpers (`stripHtml`,
  `extractField`, `extractSection`, `summarizeMarkdownBlock`,
  `extractBulletNotes`, `parsePreparedSpellsIndex`,
  `parseMagicAbilitiesIndex`) were still sitting in `App.jsx`. Verified
  via grep that all internal calls were self-contained within that block
  (only `parsePreparedSpellsIndex`/`parseMagicAbilitiesIndex` were called
  from elsewhere in `App()`), extracted the whole block verbatim into
  `ui/src/lib/markdownParsers.js`, left the two entry points imported.
  Ran the full §5.1 safety process (declaration-diff against
  `pre-rebuild-2026-09-14` — all 7 new relocated names accounted for,
  nothing unexpected).
- `npm run lint` now passes with 0 errors (down from 1). `npm run build`
  passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; spot-checked the deployed bundle for content
  strings from 3 different panels/pages, all present.
- **Not yet done**: nothing outstanding for the *scoped* Phase 6 — the
  file-splitting audit and dead-code sweep are both complete. `App.jsx`
  is still ~1085 lines (mostly the single `App()` function's state/
  handlers/routing shell) and could be split further in a future pass if
  the owner wants that, but that's new scope, not part of what was asked
  this session — don't start it unprompted.
- **All of Phases 4-6 (as scoped by the owner 2026-09-22) are now DONE.**
  The canvas dashboard rebuild's active work is complete pending owner
  review of: the theme switcher, the Level Up page's rules content, and
  a general look-over of tonight's changes. The remaining known backlog
  is entirely the older, explicitly-deferred items — see
  `REBUILD_PLAN.md`'s "Pending Tasks" / deferred-backlog notes for the
  full list (math-audit fixes, advantage/disadvantage roll buttons,
  toggle-item-onto-dashboard, further `App.jsx` splitting, multi-character
  support). Don't start any of those without the owner asking.

## 2026-09-22 (21) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — Phase 5 DONE (scoped)
- Mid-implementation, owner sent two important corrections that shaped
  the data:
  1. "dont roll my health level ups for each of those, my DM likes us to
     do that live" — HP is intentionally NOT computed/pre-filled anywhere
     in `levelPresets.js`. Every level has an `hpNote` reminder string
     instead. **Do not add a numeric HP value to any preset without being
     asked again** — this was explicit and specific.
  2. "We are still using old version of 5E not the new 5.5 / D&D One
     version" — confirmed after research was already using 2014-ruleset
     sources (5thsrd.org SRD mirror, Tasha's-era Circle of Spores text),
     so no rework needed, but this is now a hard constraint for any
     future rules research on this character: **2014 5e only, never
     2024/5.5e**, even if a source doesn't say which edition it is.
- Also asked (AskUserQuestion) which class should get the 3 remaining
  levels to reach 20, since that's a build/roleplay decision only the
  owner knows, not something researchable — genuinely blocking, not a
  judgment call to make unilaterally. Answer: **all 3 into Druid**
  (Ranger stays at 6; Druid goes 11 -> 12 -> 13 -> 14 across levels
  18/19/20).
- Researched real 2014 5e rules via WebFetch (not guessed): PHB
  Multiclass Spellcaster spell-slot table (5thsrd.org mirror) and Circle
  of Spores' level-14 "Fungal Body" feature text (dnd5e.wikidot.com,
  cross-checked wording matches across two fetches). Also caught and
  flagged (did NOT silently fix) a real discrepancy: RAW says caster
  level 14 (current: Ranger6/2=3 + Druid11=14 combined) should have a
  7th-level spell slot, but Ribbitz's live sheet has none — this is the
  exact same "7th-level spell slot" issue already flagged and
  deliberately left unfixed by the 2026-09-12 math audit (still deferred
  per owner's "return to older issues later" instruction). Each preset
  from 17 onward carries a `sheetDiscrepancyNote` surfacing this rather
  than silently reconciling it either direction.
- Built:
  - `ui/src/characters/ribbitz/levelPresets.js` — `RIBBITZ_LEVEL_PRESETS`
    array, levels 17 (current, reference/baseline) through 20. Each entry:
    class-level split, proficiency bonus, RAW spell slots, the
    discrepancy note, `newFeatures` (ASI reminder at 12, prepared-spell
    note at 13, Fungal Body at 14 — ASI and spell *choices* are left to
    the player, never pre-selected), and the HP reminder.
  - `ui/src/pages/LevelUpPage.jsx` — reads the character's CURRENT level
    live from `/api/stats` via the existing `fetchStatMap()` (never
    hardcoded), offers a level selector limited to
    `currentLevel..20` only (never below), and renders the matching
    preset as a read-only checklist. Explicitly a preview/reference, not
    a live-sheet mutator — matches the Phase 5 plan's UI spec.
  - Nav link "⬆️ Level Up" + `/level-up` route wired into `App.jsx`.
    CSS added to `App.css` using the Phase 4 theme variables (so it
    already respects the theme switcher with no extra work).
- `npm run build` passed. Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /level-up` returns 200; confirmed "Fungal Body" text present in
  the deployed bundle.
- Multi-character support (character switcher) was explicitly NOT built —
  owner deferred that to "a whole new character" later, not Ribbitz, not
  now. Don't add it unprompted.
- **Not yet done**: owner has not yet reviewed the Level Up page content
  for accuracy — this is real 5e rules content researched and written by
  an AI; ask them (and ideally their DM) to sanity-check it before
  relying on it at the table, especially the flagged 7th-level-slot
  discrepancy which needs an actual decision, not just a note.
- Phase 5 marked DONE (scoped) in `REBUILD_PLAN.md`. Moving on to Phase 6
  (polish/cleanup) next in this same session.

## 2026-09-22 (20) — Claude (session_01HxUfGH7xyRjP9JoeBgPrJH) — Phase 4 DONE
- Implemented all of Phase 4 (theming) in one pass:
  1. Audited every hardcoded color in `App.css` (grep for hex + rgba
     literals) — found 11 distinct RGB triples and 11 distinct hex
     colors in use across ~2400 lines.
  2. Wrote a one-off Python script
     (`/tmp/.../scratchpad/theme_tokenize.py`, not committed — scratch
     only) that mechanically replaced every occurrence of each literal
     color with a `var(--name)` reference, preserving the exact same
     rendered values (a pure find/replace, not a redesign — zero visual
     risk). Verified after: `grep -cE "#[0-9a-fA-F]{3,8}"` and the rgba
     literal-triple grep both return 0 matches in `App.css` now — no
     hardcoded colors slipped through.
  3. Created `ui/src/themes.css`: `:root` holds the default theme
     ("Twilight Violet" — Ribbitz's original look, same values as
     before, just parameterized) and a `[data-theme="grung"]` block
     overrides the accent/background vars for a second theme ("Grung
     Green", named for his race). Semantic state colors (danger/gold/
     success) are deliberately NOT themed — they stay constant so
     "danger=red"/"success=green" doesn't flip per theme.
  4. Created `ui/src/dashboard/themes.js`: the `THEMES` registry (id +
     label pairs) plus `loadThemeId`/`saveThemeId` (localStorage,
     `ribbitz.theme.<characterId>`) and `applyThemeId` (sets/removes
     `data-theme` on `<html>`).
  5. Created `ui/src/components/ThemeSwitcher.jsx` (a `<select>`) and
     wired it into the sidebar footer in `App.jsx`, right under the Sync
     toggle. Imported `themes.css` in `App.jsx` before `App.css`.
- To add a future theme: add a `[data-theme="id"]` block in themes.css
  overriding whichever vars should differ, then add `{id, label}` to the
  `THEMES` array in `dashboard/themes.js`. No other code changes needed —
  this was a deliberate design goal, confirmed by how small the Grung
  Green addition ended up being.
- `npm run build` passed (41.4KB CSS, up from 35.9KB — the var()
  indirection costs a little size, expected and fine). Deployed via
  `docker compose build ribbitz && docker compose up -d ribbitz`;
  `curl /` returns 200; confirmed `data-theme=grung` present in the built
  CSS and `theme-switcher` present in the built JS.
- **Not yet done**: owner has not yet tried the theme switcher live —
  ask them to confirm (a) the dropdown appears in the sidebar and
  actually swaps the look, (b) the choice survives a refresh
  (localStorage persistence), (c) nothing regressed visually from the
  tokenization pass (the mechanical find/replace should be zero-risk but
  hasn't been eyeballed in a real browser yet).
- Phase 4 marked DONE in `REBUILD_PLAN.md`. Moving on to Phase 5 (level
  presets, scoped to Ribbitz current-level-through-20 per the 2026-09-22
  owner decision) next in this same session.

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
