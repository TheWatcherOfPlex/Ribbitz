import { useState } from 'react'
import { rollDice, rollFlatDice } from '../lib/diceRoller.js'

// Renders one Element of type 'roll-topic' (see characters/schema.js).
// Click the title to roll; if the element also carries summary/notes text
// (e.g. a spell or ability, not just a bare skill check), the title toggles
// an inline expand instead, and rolling gets its own explicit button — same
// interaction the Skills panel and Magic Abilities section already use,
// just generalized so any category can reuse it.
//
// TODO (Phase 3, not yet built): advantage/disadvantage roll variants.
// Don't bolt this on ad hoc per element when the need comes up — design the
// mechanism once (likely: two extra small buttons here that send the same
// `parts` but tell the dice overlay to roll 2d20 and keep high/low) and
// document it in docs/REBUILD_PLAN.md §3.2 when it's built.
export default function RollTopic({ element }) {
  const [expanded, setExpanded] = useState(false)
  const { title, data } = element
  const hasDetail = Boolean(data?.summary || data?.notes?.length || data?.officialText)

  const handleRoll = () => {
    if (Array.isArray(data?.parts) && data.parts.length) {
      rollDice(data.rollLabel || title, data.parts)
    } else if (data?.notation) {
      rollFlatDice(data.notation, data.rollLabel || title)
    }
  }

  return (
    <div className="rt-element">
      <div className="rt-element__row">
        {hasDetail ? (
          <button type="button" className="rt-element__title" onClick={() => setExpanded((v) => !v)}>
            {expanded ? '▾' : '▸'} {title}
          </button>
        ) : (
          <span className="rt-element__title rt-element__title--static">{title}</span>
        )}
        <button type="button" className="rt-element__roll-btn" onClick={handleRoll}>
          🎲 Roll
        </button>
      </div>
      {expanded && hasDetail ? (
        <div className="rt-element__detail">
          {data.summary ? <div className="rt-element__summary">{data.summary}</div> : null}
          {data.notes?.length ? (
            <ul className="rt-element__notes">
              {data.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
