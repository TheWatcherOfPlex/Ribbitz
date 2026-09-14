// Extracted from App.jsx during the dashboard rebuild (Phase 3) — logic
// unchanged. Used by death-save slots and similar 3-state toggles.
export function triStateClass(value) {
  if (value === 1) return 'is-green'
  if (value === 2) return 'is-red'
  return 'is-neutral'
}

export function cycleTriState(value) {
  const numeric = Number(value) || 0
  return (numeric + 1) % 3
}
