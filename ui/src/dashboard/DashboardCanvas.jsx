import { useMemo, useState } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import RollTopic from '../elements/RollTopic.jsx'

// Renderer-by-type lookup — add to this when a new element type (see
// characters/schema.js ELEMENT_TYPES) gets its own component.
const RENDERERS = {
  'roll-topic': RollTopic,
}

const COLS = 12
const ROW_HEIGHT = 90
const GRID_WIDTH = 1180 // matches the app-shell content width closely enough for Phase 2; revisit with WidthProvider in Phase 3 if this needs to be truly responsive

function layoutStorageKey(characterId) {
  return `ribbitz.canvasLayout.${characterId}`
}

function loadStoredLayout(characterId) {
  try {
    const raw = localStorage.getItem(layoutStorageKey(characterId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveStoredLayout(characterId, layout) {
  try {
    localStorage.setItem(layoutStorageKey(characterId), JSON.stringify(layout))
  } catch {
    // best-effort only — a private window or full storage shouldn't break the canvas
  }
}

/**
 * @param {{ character: import('../characters/schema.js').Character, elements: import('../characters/schema.js').Element[] }} props
 */
export default function DashboardCanvas({ character, elements }) {
  const visibleElements = useMemo(
    () => elements.filter((el) => el.dashboardVisible !== false),
    [elements],
  )

  const [layout, setLayout] = useState(() => {
    const stored = loadStoredLayout(character.id)
    if (stored) return stored
    return visibleElements.map((el) => ({ i: el.id, ...el.layout }))
  })

  const byId = useMemo(() => Object.fromEntries(visibleElements.map((el) => [el.id, el])), [visibleElements])

  const handleLayoutChange = (nextLayout) => {
    setLayout(nextLayout)
    saveStoredLayout(character.id, nextLayout)
  }

  return (
    <div className="dashboard-canvas">
      <GridLayout
        className="dashboard-canvas__grid"
        layout={layout}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={GRID_WIDTH}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".rt-element__title"
        compactType="vertical"
      >
        {layout
          .filter((item) => byId[item.i])
          .map((item) => {
            const element = byId[item.i]
            const Renderer = RENDERERS[element.type]
            return (
              <div key={item.i} className="dashboard-canvas__item">
                {Renderer ? (
                  <Renderer element={element} />
                ) : (
                  <div className="dashboard-canvas__unknown-type">
                    Unknown element type "{element.type}" ({element.title})
                  </div>
                )}
              </div>
            )
          })}
      </GridLayout>
    </div>
  )
}
