// Extracted from App.jsx during the dashboard rebuild (Phase 2) — logic
// unchanged, just relocated per REBUILD_PLAN.md §3.6 file-splitting plan.
// See docs/REBUILD_PLAN.md §5 ("Reusable pieces") before modifying this.

// Stream Commander's self-hosted 3D dice overlay — a different service/origin
// entirely (LAN, CORS-enabled just for these endpoints). Best-effort: if it's
// unreachable, rolling from here silently no-ops rather than breaking the UI.
export const DICE_API_BASE = (
  import.meta.env.VITE_DICE_API_BASE || 'http://10.0.0.54:4035'
).replace(/\/+$/, '')

// For abilities that just roll a flat damage die (e.g. Halo of Spores'
// "1d8") — no d20/component breakdown to build, just roll what's given.
export const rollFlatDice = (notation, label) => {
  if (!notation || notation.includes('—')) return
  fetch(`${DICE_API_BASE}/api/dice/roll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notation, label, parts: [] }),
  }).catch(() => {})
}

// `parts` is the labeled breakdown of everything besides the die itself —
// e.g. [{ label: 'Dexterity Modifier', value: 5 }, { label: 'Proficiency Bonus', value: 6 }] —
// so the on-stream overlay can spell out exactly what went into the roll
// instead of just showing a flat modifier.
export const rollDice = (label, parts = []) => {
  // If any expected component is unavailable ('—' / not yet loaded), don't
  // roll with silently-wrong math — the whole point here is transparency.
  if (parts.some((p) => !Number.isFinite(p.value))) return
  const total = parts.reduce((sum, p) => sum + p.value, 0)
  const notation = `1d20${total >= 0 ? '+' : ''}${total}`
  fetch(`${DICE_API_BASE}/api/dice/roll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notation, label, parts }),
  }).catch(() => {})
}

// Same idea as rollDice, but for a damage roll — any die (not just d20),
// with a labeled flat-bonus breakdown (e.g. [{ label: 'Sharpshooter Bonus',
// value: 10 }]) baked into the notation so the overlay shows exactly what
// made up the total, same as an attack roll does. `dieNotation` is just the
// dice part, e.g. '1d8' or '1d10' — this appends the summed parts itself.
export const rollDamage = (label, dieNotation, parts = []) => {
  if (!dieNotation) return
  if (parts.some((p) => !Number.isFinite(p.value))) return
  const flatTotal = parts.reduce((sum, p) => sum + p.value, 0)
  const notation = `${dieNotation}${flatTotal !== 0 ? (flatTotal >= 0 ? '+' : '') + flatTotal : ''}`
  fetch(`${DICE_API_BASE}/api/dice/roll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notation, label, parts }),
  }).catch(() => {})
}

// For a damage roll made of DIFFERENT-sided dice that each need their own
// visible, labeled result — e.g. a weapon's own damage die plus a separate
// elemental bonus die ("6 (Piercing) + 4 (Fire)"), not just one combined
// total. dice-box's notation parser only understands ONE die type per
// string — a bare '1d8+1d6' silently mis-parses as '1d8' with a flat "+1"
// modifier and drops the second die entirely (found 2026-09-23, when the
// ammo-type selector's "+ Fire" damage only ever showed one die). The fix
// is sending each die type as its own array entry, with a parallel
// `diceLabels` array the overlay uses to label each group's result
// instead of a generic "(Rolled)". `diceGroups`: [{ notation: '1d8',
// label: 'Piercing' }, { notation: '1d6', label: 'Fire' }]. Any flat
// modifier from `parts` is appended to the FIRST group only.
export const rollCompoundDamage = (label, diceGroups, parts = []) => {
  if (!diceGroups?.length) return
  if (parts.some((p) => !Number.isFinite(p.value))) return
  const flatTotal = parts.reduce((sum, p) => sum + p.value, 0)
  const notation = diceGroups.map((group, index) =>
    index === 0 && flatTotal !== 0 ? `${group.notation}${flatTotal >= 0 ? '+' : ''}${flatTotal}` : group.notation,
  )
  const diceLabels = diceGroups.map((group) => group.label)
  fetch(`${DICE_API_BASE}/api/dice/roll`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notation, label, parts, diceLabels }),
  }).catch(() => {})
}

// Parses a signed stat-sheet string like "+5" or "-1" into a number, or
// null if it's not available yet ('—').
export const parseStatNumber = (value) => {
  const n = parseInt(String(value ?? '').replace(/\s+/g, ''), 10)
  return Number.isFinite(n) ? n : null
}
