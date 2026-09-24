import { Link } from 'react-router-dom'
import TrackerGroup from '../components/TrackerGroup.jsx'

// Extracted from KitPanel.jsx (Grung Abilities half only) — split out per
// owner request 2026-09-23: "Grung Abilities should be its own panel. We
// may try to add it to something later if it makes sense." No attack
// buttons added here yet — that's explicitly a possible future step, not
// part of this split.
//
// Known pre-existing issue, NOT introduced or fixed by this extraction:
// Tongue Slap / Bite below still show a stale "+7 hit" — the 2026-09-12
// math audit found this should be +8 (PB+5 -> PB+6 leftover). Preserved
// verbatim per the extraction principle; fix it as its own change if/when
// the owner wants that audit's fixes applied.

function GrungDcBlock({ label, value, formula, linkTo }) {
  return (
    <div className="grung-dc">
      <Link className="feature-link" to={linkTo}>
        <strong>{label}</strong>
      </Link>
      <div className="grung-dc__value">{value}</div>
      <div className="grung-dc__formula">{formula}</div>
    </div>
  )
}

export default function GrungPanel({ statMap, parseTracker, handleToggle }) {
  return (
    <div className="panel__content grung-abilities">
      <div className="grung-abilities__pane">
        <div className="grung-abilities__dc-grid">
          <GrungDcBlock
            label={
              <>
                Poison
                <br />
                Skin
                <br />
                DC
              </>
            }
            value={statMap?.['poison-skin-dc'] ?? '18'}
            formula="12 + PB (6)"
            linkTo="/stats#dcs-saves-and-passives"
          />
          <GrungDcBlock
            label="Poison Weapon DC"
            value={statMap?.['poison-weapon-dc'] ?? '18'}
            formula="9 + PB (6) + CON mod (3)"
            linkTo="/stats#dcs-saves-and-passives"
          />
        </div>

        <div className="feature-row">
          <strong>Effect</strong>
          <span>
            CON save
            <br />
            1 min
            <br />
            Repeat save end of each turn.
          </span>
        </div>
        <TrackerGroup
          title="Uses"
          items={parseTracker('poison-skin', 'Poison', { compact: true, fallback: '6/6' })}
          onToggle={handleToggle}
        />
      </div>

      <div className="grung-abilities__pane">
        <div className="grung-jumping">
          <div className="grung-jumping__row">
            <strong>Long Jump - Running Start</strong>
            <span>D20 + (Str. or Dex.) + Proficiency</span>
          </div>

          <div className="grung-jumping__row">
            <strong>Standing Jump</strong>
            <span>(D20 + (Str. or Dex.) + Proficiency) / 2</span>
          </div>
          <div className="grung-jumping__row">
            <strong>Tongue Slap</strong>
            <span>+7 hit • 1d6+2 pierce</span>
          </div>
          <div className="grung-jumping__row">
            <strong>Bite</strong>
            <span>+7 hit • 1d6+2 pierce</span>
          </div>
          <div className="grung-jumping__row">
            <strong>Tongue Grapple</strong>
            <span>10/15 ft • Dex save vs STR (Athletics)</span>
          </div>
        </div>
      </div>
    </div>
  )
}
