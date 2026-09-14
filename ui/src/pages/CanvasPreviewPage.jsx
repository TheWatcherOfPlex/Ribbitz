import { useEffect, useState } from 'react'
import DashboardCanvas from '../dashboard/DashboardCanvas.jsx'
import SkillsPanel from '../panels/SkillsPanel.jsx'
import { fetchStatMap } from '../lib/api.js'

// Phase 2/3 proof-of-concept page — see docs/REBUILD_PLAN.md §4.
// Deliberately a separate route from "/" so the existing hand-coded
// Dashboard keeps working untouched while this is built out and verified.
//
// Owner correction (2026-09-14): drag/resize happens per whole panel
// (Skills, Spells, Features, ...), not per individual skill/spell — see
// DashboardCanvas.jsx's top comment. Each panel here is a real, full
// component (SkillsPanel is the exact same one the regular Dashboard
// uses, extracted so there's one copy, not two to keep in sync).
export default function CanvasPreviewPage() {
  const [statMap, setStatMap] = useState({})

  useEffect(() => {
    let cancelled = false
    fetchStatMap()
      .then((mapped) => {
        if (!cancelled) setStatMap(mapped)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const panels = [
    {
      id: 'skills',
      title: 'Skills',
      layout: { x: 0, y: 0, w: 6, h: 20 },
      component: <SkillsPanel statMap={statMap} />,
    },
  ]

  return (
    <section className="page-panel canvas-preview-page">
      <header className="page-panel__header">
        <div>
          <h2>🧩 Canvas Preview</h2>
          <p>
            Phase 2/3 proof-of-concept for the dashboard rebuild — drag a panel by its ⠿ handle to
            reposition, resize from the bottom-right corner. Layout is saved per-browser. Only the
            Skills panel is wired up so far; everything else still lives on the regular Dashboard.
            See <code>docs/REBUILD_PLAN.md</code> in the repo for the full plan.
          </p>
        </div>
      </header>
      <DashboardCanvas characterId="ribbitz" panels={panels} />
    </section>
  )
}
