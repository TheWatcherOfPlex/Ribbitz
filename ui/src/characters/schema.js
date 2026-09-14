// Data model for the dashboard rebuild. See /srv/docker/ribbitz/docs/REBUILD_PLAN.md
// (§3.1, §3.2) for the design rationale — this file is the single source of
// truth for the *shape*, that doc is the single source of truth for *why*.
//
// Plain JSDoc typedefs, not TypeScript — this project is a JS/Vite app, no
// build-step change needed to get editor intellisense from these.

/**
 * @typedef {'stat-display'|'roll-topic'|'tracker'|'toggle'|'counter'|'expandable-topic'|'list'} ElementType
 */

// Single source of truth for valid element types — import this rather than
// re-typing the string union anywhere else. Add to both this array AND the
// JSDoc union above when a new type is introduced (keep them in sync), and
// update the type catalog table in REBUILD_PLAN.md §3.2 in the same commit.
export const ELEMENT_TYPES = [
  'stat-display',
  'roll-topic',
  'tracker',
  'toggle',
  'counter',
  'expandable-topic',
  'list',
]

/**
 * @typedef {Object} GridPosition
 * @property {number} x
 * @property {number} y
 * @property {number} w
 * @property {number} h
 */

/**
 * @typedef {Object} DicePart
 * @property {string} label - e.g. "Dexterity Modifier", "Proficiency Bonus"
 * @property {number} value
 */

/**
 * @typedef {Object} Element
 * @property {string} id - stable, unique within the character (e.g. "skill-stealth")
 * @property {string} category - must match a Category.id on the same Character
 * @property {string} [subcategory]
 * @property {string} title
 * @property {ElementType} type
 * @property {boolean} dashboardVisible - the owner's "show on dashboard" toggle
 * @property {GridPosition} layout - react-grid-layout item shape
 * @property {Object} data - shape depends on `type`, see REBUILD_PLAN.md §3.2
 * @property {string} [sourceDoc] - which long-form .md page this was authored from
 * @property {string} [sourceAnchor] - slug to deep-link to on that page
 */

/**
 * @typedef {Object} Category
 * @property {string} id
 * @property {string} label
 * @property {string} [icon]
 */

/**
 * @typedef {Object} LevelPreset
 * @property {Object.<string, string|number>} statOverrides - statKey -> value, layered on top of base data
 */

/**
 * @typedef {Object} Character
 * @property {string} id
 * @property {string} name
 * @property {string} theme - theme id, see themes/ once Phase 4 builds it
 * @property {number} currentLevel
 * @property {Object.<string, LevelPreset>} levelPresets - keyed by level number as a string
 * @property {Category[]} categories
 * @property {Element[]} elements
 */

// Nothing else in this file yet — Phase 1 stops at "shape is defined and
// installable," not "loader/renderer exists." See REBUILD_PLAN.md §4 Phase 2
// for DashboardCanvas.jsx and the element renderers that will consume this.
