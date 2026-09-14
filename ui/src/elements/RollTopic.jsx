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
// The number shown on the card face — sum of `data.parts` if present
// (e.g. "+11" for a skill check), else the modifier parsed out of a plain
// `data.notation` (e.g. "+8"), else the raw notation itself for flat damage
// dice with no modifier (e.g. "1d8").
function computeDisplayValue(data) {
  if (Array.isArray(data?.parts) && data.parts.length) {
    const total = data.parts.reduce((sum, p) => sum + (Number(p.value) || 0), 0)
    return total >= 0 ? `+${total}` : `${total}`
  }
  if (data?.notation) {
    const match = String(data.notation).match(/^\d*d\d+\s*([+-]\s*\d+)?$/i)
    if (match?.[1]) return match[1].replace(/\s+/g, '')
    return data.notation
  }
  return null
}

export default function RollTopic({ element }) {
  const [expanded, setExpanded] = useState(false)
  const { title, data } = element
  const hasDetail = Boolean(data?.summary || data?.notes?.length || data?.officialText)
  const displayValue = computeDisplayValue(data)

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
          <button
            type="button"
            className="rt-element__title"
            title={title}
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? '▾' : '▸'} {title}
          </button>
        ) : (
          <span className="rt-element__title rt-element__title--static" title={title}>
            {title}
          </span>
        )}
        <button type="button" className="rt-element__roll-btn" onClick={handleRoll}>
          🎲 Roll
        </button>
      </div>
      {displayValue ? <div className="rt-element__value">{displayValue}</div> : null}
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
