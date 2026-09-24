import { slugifyHeading } from '../utils/slugifyHeading.js'

// Extracted from KitPanel.jsx (Drugs & Herbs half only) — split out per
// owner request 2026-09-23: "Drugs & herbs would be better in an inventory
// Panel." Content/logic unchanged, just relocated + renamed.

export default function InventoryPanel({ drugsHerbsList, expandedDrugKey, setExpandedDrugKey, drugStatuses, toggleDrugHerb }) {
  return (
    <div className="panel__content inventory-panel">
      <div className="inventory-panel__title">Drugs &amp; Herbs</div>
      <div className="panel__content drugs-panel">
        {drugsHerbsList.length ? (
          drugsHerbsList.map((item) => {
            const slug = slugifyHeading(item.name)
            const expanded = expandedDrugKey === slug
            return (
              <div
                key={item.name}
                className={`drugs-panel__item${drugStatuses?.[slug] ? ' drugs-panel__item--active' : ''}${
                  expanded ? ' drugs-panel__item--expanded' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={Boolean(drugStatuses?.[slug])}
                  onChange={() => toggleDrugHerb(item.name)}
                  aria-label={`Toggle ${item.name}`}
                />
                <button className="drugs-panel__name" type="button" onClick={() => setExpandedDrugKey(expanded ? '' : slug)}>
                  <span>{item.name}</span>
                  <span className="drugs-panel__count">x{item.quantity || 0}</span>
                </button>
                {expanded ? <div className="drugs-panel__detail">{item.notes || 'No effect notes loaded.'}</div> : null}
              </div>
            )
          })
        ) : (
          <div className="drugs-panel__empty">No drugs or herbs loaded.</div>
        )}
      </div>
    </div>
  )
}
