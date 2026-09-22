// Theme registry for Phase 4 theming — see ui/src/themes.css for the
// actual CSS custom-property values each theme id switches between, and
// docs/REBUILD_PLAN.md's Phase 4 section for the original ask.
//
// To add a theme: add a `[data-theme="<id>"]` override block in
// themes.css, then add its {id, label} here so it shows up in the
// switcher. No other wiring needed.

export const THEMES = [
  { id: 'twilight', label: 'Twilight Violet' },
  { id: 'grung', label: 'Grung Green' },
]

const DEFAULT_THEME_ID = 'twilight'

function themeStorageKey(characterId) {
  return `ribbitz.theme.${characterId}`
}

export function loadThemeId(characterId) {
  try {
    return localStorage.getItem(themeStorageKey(characterId)) || DEFAULT_THEME_ID
  } catch {
    return DEFAULT_THEME_ID
  }
}

export function saveThemeId(characterId, themeId) {
  try {
    localStorage.setItem(themeStorageKey(characterId), themeId)
  } catch {
    // best-effort only — a private window or full storage shouldn't break theming
  }
}

// The default theme (twilight) is just :root with no [data-theme]
// override, so it's applied by omitting the attribute entirely rather
// than by adding a `[data-theme="twilight"]` block that would just
// duplicate :root's own values.
export function applyThemeId(themeId) {
  if (themeId && themeId !== DEFAULT_THEME_ID) {
    document.documentElement.setAttribute('data-theme', themeId)
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}
