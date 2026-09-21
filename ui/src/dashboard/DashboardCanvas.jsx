import { useEffect, useRef, useState } from 'react'
import RGL, { WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

// WidthProvider measures the grid's actual container width (and re-measures
// on window resize) instead of the old hardcoded 1180px — that hardcode was
// why panels couldn't be dragged past a fixed point regardless of real
// screen size (owner: 1440p monitor, still stuck at ~2 columns' worth of
// width). See docs/PROGRESS_LOG.md 2026-09-21.
const GridLayout = WidthProvider(RGL)

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
const MARGIN = [10, 10]

// Converts a pixel height (drag-handle + item-body content, both measured
// via scrollHeight/getBoundingClientRect so it reflects real content even
// while the box is visually clipped) into the number of grid rows needed,
// inverting react-grid-layout's own px-per-row formula. +4px slack avoids
// a 1-row-short clip from rounding.
function pxToRows(px) {
  return Math.ceil((px + 4 + MARGIN[1]) / (ROW_HEIGHT + MARGIN[1]))
}

// v2: bumped 2026-09-14 when the default layout moved from single-column
// full-width panels to a 2-column arrangement + real resizing — bumping
// the key means owners with an old saved single-column layout get the new
// defaults once, instead of the old layout silently overriding them.
function layoutStorageKey(characterId) {
  return `ribbitz.canvasLayout.v2.${characterId}`
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

// Tracked separately from the layout itself: react-grid-layout fires
// onLayoutChange (which we persist above) on mount too, not just on a real
// drag/resize — so "a layout is saved" does NOT mean "the owner chose this
// panel's height." Only onResizeStop marks a panel here, so only an actual
// manual resize opts a panel out of auto-fit-to-content below.
function manualSizedStorageKey(characterId) {
  return `ribbitz.canvasManualSized.v2.${characterId}`
}

function loadManualSizedIds(characterId) {
  try {
    const raw = localStorage.getItem(manualSizedStorageKey(characterId))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveManualSizedIds(characterId, ids) {
  try {
    localStorage.setItem(manualSizedStorageKey(characterId), JSON.stringify(ids))
  } catch {
    // best-effort only
  }
}

export default function DashboardCanvas({ characterId, panels }) {
  const [layout, setLayout] = useState(() => {
    const stored = loadStoredLayout(characterId)
    if (stored && stored.length === panels.length) return stored
    return panels.map((p) => ({ i: p.id, ...p.layout }))
  })

  // Panel ids the owner has explicitly resized (by dragging a corner) or
  // that came back from a previously saved layout — those keep whatever
  // height they were given. Everything else auto-fits to its own content's
  // real height below, which is what actually fixes "huge blank space at
  // the bottom of a panel" / "content clipped at the bottom of a panel":
  // the fixed `h` estimates baked into the default layout were only ever
  // guesses, and real content height doesn't match a guess reliably once
  // panel widths change (e.g. the 2-column default).
  const manualSizedRef = useRef(new Set(loadManualSizedIds(characterId)))
  const bodyRefs = useRef({})
  const handleRefs = useRef({})

  const byId = Object.fromEntries(panels.map((p) => [p.id, p]))
  const panelIds = panels.map((p) => p.id).join('|')

  useEffect(() => {
    const observers = []
    panels.forEach((panel) => {
      if (manualSizedRef.current.has(panel.id)) return
      // Measure the inner content wrapper, NOT the flex:1 item-body — the
      // body stretches to fill whatever height the grid box currently is,
      // and scrollHeight is always >= an element's own box height, so
      // observing the body creates a feedback loop: grow h -> box grows ->
      // body's scrollHeight grows to match -> observer fires -> grow h
      // again, forever (this is what "blank spot slowly grows the longer
      // the window is open" was). The inner wrapper below has no flex
      // stretching applied, so its height reflects only its own content.
      const contentEl = bodyRefs.current[panel.id]
      if (!contentEl) return
      const measureAndApply = () => {
        const handleEl = handleRefs.current[panel.id]
        const handleHeight = handleEl ? handleEl.getBoundingClientRect().height : 30
        const neededRows = pxToRows(contentEl.scrollHeight + handleHeight)
        setLayout((prev) => {
          const idx = prev.findIndex((item) => item.i === panel.id)
          if (idx === -1 || prev[idx].h === neededRows) return prev
          const next = [...prev]
          next[idx] = { ...next[idx], h: neededRows }
          return next
        })
      }
      const observer = new ResizeObserver(measureAndApply)
      observer.observe(contentEl)
      measureAndApply()
      observers.push(observer)
    })
    return () => observers.forEach((observer) => observer.disconnect())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelIds])

  const handleLayoutChange = (nextLayout) => {
    setLayout(nextLayout)
    saveStoredLayout(characterId, nextLayout)
  }

  const handleResizeStop = (_layout, oldItem, newItem) => {
    // Only a HEIGHT change opts a panel out of auto-fit — a pure width
    // drag (the 'e' handle) shouldn't freeze the panel's height at
    // whatever it happened to be, since the owner never touched that.
    if (oldItem.h === newItem.h) return
    manualSizedRef.current.add(newItem.i)
    saveManualSizedIds(characterId, [...manualSizedRef.current])
  }

  return (
    <div className="dashboard-canvas">
      <GridLayout
        className="dashboard-canvas__grid"
        layout={layout}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        margin={MARGIN}
        onLayoutChange={handleLayoutChange}
        onResizeStop={handleResizeStop}
        draggableHandle=".dashboard-canvas__drag-handle"
        compactType="vertical"
        resizeHandles={['e', 'se']}
      >
        {layout
          .filter((item) => byId[item.i])
          .map((item) => {
            const panel = byId[item.i]
            return (
              <div key={item.i} className="dashboard-canvas__item">
                <div
                  className="dashboard-canvas__drag-handle"
                  ref={(node) => {
                    handleRefs.current[panel.id] = node
                  }}
                >
                  ⠿ {panel.title}
                </div>
                <div className="dashboard-canvas__item-body">
                  <div
                    className="dashboard-canvas__item-content"
                    ref={(node) => {
                      bodyRefs.current[panel.id] = node
                    }}
                  >
                    {panel.component}
                  </div>
                </div>
              </div>
            )
          })}
      </GridLayout>
    </div>
  )
}
