import DashboardCanvas from '../dashboard/DashboardCanvas.jsx'
import character from '../characters/ribbitz/character.json'
import skillsElements from '../characters/ribbitz/elements/skills.json'

// Phase 2 proof-of-concept page — see docs/REBUILD_PLAN.md §4 Phase 2.
// Deliberately a separate route from "/" so the existing hand-coded
// Dashboard keeps working untouched while this is built out and verified.
// Only the Skills category is wired up so far (Phase 3 migrates the rest).
const allElements = [...skillsElements]

export default function CanvasPreviewPage() {
  return (
    <section className="page-panel canvas-preview-page">
      <header className="page-panel__header">
        <div>
          <h2>🧩 Canvas Preview</h2>
          <p>
            Phase 2 proof-of-concept for the dashboard rebuild — drag cards by their title to
            reposition, resize from the bottom-right corner. Layout is saved per-browser. Only
            Skills is wired up so far; everything else still lives on the regular Dashboard.
            See <code>docs/REBUILD_PLAN.md</code> in the repo for the full plan.
          </p>
        </div>
      </header>
      <DashboardCanvas character={character} elements={allElements} />
    </section>
  )
}
