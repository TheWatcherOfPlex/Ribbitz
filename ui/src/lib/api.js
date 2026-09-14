// Small shared API helpers — extracted from App.jsx during the rebuild
// (Phase 3) so other entry points (e.g. CanvasPreviewPage) can fetch live
// stats without duplicating the base-URL logic. Logic unchanged.

export const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '')
export const CONTENT_BASE = import.meta.env.BASE_URL || '/'

export const apiFetch = (path, init) => fetch(`${API_BASE}${path}`, init)
export const contentPath = (file) => `${CONTENT_BASE}content/${file}`
export const contentImagePath = (file) => `${CONTENT_BASE}content-images/${file}`

// Fetches /api/stats and returns the flat { statKey: value } map — the
// subset of App.jsx's fetchStats() that other pages actually need (no
// vitals/trackers/inspiration side effects).
export async function fetchStatMap() {
  const response = await apiFetch('/stats')
  const payload = await response.json()
  const mapped = payload.stats?.reduce((acc, stat) => {
    if (stat.key) acc[stat.key] = stat.value
    return acc
  }, {})
  return mapped || {}
}
