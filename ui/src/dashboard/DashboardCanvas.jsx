import { useState } from 'react'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// Owner correction (2026-09-14, see docs/PROGRESS_LOG.md): dragging happens
// at the whole-category/panel level ("drag my spell list up, move my
// skills next to it"), NOT per individual skill/spell/item. Each grid item
// here is one whole panel component (e.g. the full Skills panel with every
// row's Check/Save buttons intact) — panels are NOT atomized into their
// contents. The per-element Element/schema.js model from Phase 1/2 is still
// useful for a *different* future ask (toggling individual long-form items
// onto the dashboard), but it is not what drives drag/resize placement.
//
// `panels` prop: [{ id, title, component: <ReactNode>, layout: {x,y,w,h} }]

const COLS = 12
const ROW_HEIGHT = 30
const GRID_WIDTH = 1180 // TODO Phase 3: swap for react-grid-layout's WidthProvider for real responsiveness

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

export default function DashboardCanvas({ characterId, panels }) {
  const [layout, setLayout] = useState(() => {
    const stored = loadStoredLayout(characterId)
    if (stored && stored.length === panels.length) return stored
    return panels.map((p) => ({ i: p.id, ...p.layout }))
  })

  const byId = Object.fromEntries(panels.map((p) => [p.id, p]))

  const handleLayoutChange = (nextLayout) => {
    setLayout(nextLayout)
    saveStoredLayout(characterId, nextLayout)
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
        draggableHandle=".dashboard-canvas__drag-handle"
        compactType="vertical"
      >
        {layout
          .filter((item) => byId[item.i])
          .map((item) => {
            const panel = byId[item.i]
            return (
              <div key={item.i} className="dashboard-canvas__item">
                <div className="dashboard-canvas__drag-handle">⠿ {panel.title}</div>
                <div className="dashboard-canvas__item-body">{panel.component}</div>
              </div>
            )
          })}
      </GridLayout>
    </div>
  )
}
