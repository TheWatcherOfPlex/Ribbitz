# characters/

One directory per character (`characters/ribbitz/`, `characters/<next-character>/`,
...). Each character directory holds:

```
characters/<id>/
  character.json       # id, name, theme, currentLevel, levelPresets, categories
  elements/
    <category>.json    # array of Element objects for that one category
    ...one file per category, not one giant elements.json
```

See `../schema.js` for the exact shape (JSDoc typedefs + the `ELEMENT_TYPES`
catalog) and `/srv/docker/ribbitz/docs/REBUILD_PLAN.md` §3.1/§3.2 for the
design rationale.

**Status as of 2026-09-14 (Phase 1):** `characters/ribbitz/character.json`
is a small hand-written *example* — a handful of real Skills elements, to
prove the shape holds up against real content. It is **not** the full
migrated dashboard and is **not yet loaded by the running app** — that's
Phase 2 (`DashboardCanvas.jsx`) and Phase 3 (migrate every category) per the
plan. Don't be surprised that most categories/elements aren't here yet.

When you add a new category's `elements/<category>.json` in Phase 3:
- Every `Element.id` must be unique within the character across *all*
  category files, not just within its own file.
- Every `Element.category` must match a `Category.id` in `character.json`.
- Keep `layout` values reasonable placeholders (react-grid-layout will
  auto-compact) — don't spend time hand-tuning exact grid positions until
  DashboardCanvas.jsx actually exists and you can see it render.
