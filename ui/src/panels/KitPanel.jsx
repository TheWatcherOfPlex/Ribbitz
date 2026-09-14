import { Link } from 'react-router-dom'
import StatControl from '../components/StatControl.jsx'
import TrackerGroup from '../components/TrackerGroup.jsx'
import { slugifyHeading } from '../utils/slugifyHeading.js'

// Extracted from App.jsx's Dashboard route during the rebuild (Phase 3) —
// exact original content (Weapons, Ammo, Drugs & Herbs, Grung Abilities),
// just moved into its own file. This is the last of the 5 panels — see
// docs/REBUILD_PLAN.md §3.6/Phase 3 for what happens next (the canvas
// swap) once this is verified.
//
// Known pre-existing issue, NOT introduced or fixed by this extraction:
// Tongue Slap / Bite below still show a stale "+7 hit" — the 2026-09-12
// math audit found this should be +8 (PB+5 -> PB+6 leftover). Preserved
// verbatim per the extraction principle (exact original content); fix it
// as its own change if/when the owner wants that audit's fixes applied.

const pondPoppersName = 'Pond Poppers (x5)'
const standardBlowgunDartsName = 'Blowgun Darts'
const standardArrowsName = 'Arrows'

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

export default function KitPanel({
  statMap,
  vitals,
  updateVital,
  setInventoryItemValue,
  standardBlowgunDartsQuantity,
  standardArrowsQuantity,
  pondPoppersQuantity,
  drugsHerbsList,
  expandedDrugKey,
  setExpandedDrugKey,
  drugStatuses,
  toggleDrugHerb,
  parseTracker,
  handleToggle,
}) {
  return (
    <div className="panel__content combat-kit">
      <div className="combat-kit__section">
        <div className="combat-kit__title">Weapons</div>

        <div className="combat-kit__weapon">
          <Link className="combat-kit__weapon-name" to="/actions#vanguard-blowgun-1-broken---single-shot">
            Blowgun +1
          </Link>
          <div className="combat-kit__weapon-meta">
            Hit {statMap?.['blowgun-hit'] ?? '+14'} (Std) • {statMap?.['blowgun-hit-ss'] ?? '+9'} (Pwr)
          </div>
          <div className="combat-kit__weapon-meta">Std {statMap?.['blowgun-dmg'] ?? '1d8'}</div>
          <div className="combat-kit__weapon-meta">Pwr {statMap?.['blowgun-dmg-ss'] ?? '1d8+10'}</div>
          <div className="combat-kit__weapon-meta">Elem + {statMap?.['blowgun-elem-dmg'] ?? '1d6'}</div>
          <div className="combat-kit__weapon-meta">Gloom + {statMap?.['blowgun-gloom-dmg'] ?? '1d8'}</div>
        </div>

        <div className="combat-kit__weapon">
          <Link className="combat-kit__weapon-name" to="/actions#skywardens-longbow-2">
            Longbow +2
          </Link>
          <div className="combat-kit__weapon-meta">
            Hit {statMap?.['longbow-hit'] ?? '+15'} (Std) • {statMap?.['longbow-hit-ss'] ?? '+10'} (Pwr)
          </div>
          <div className="combat-kit__weapon-meta">Std {statMap?.['longbow-dmg'] ?? '1d10+7'}</div>
          <div className="combat-kit__weapon-meta">Pwr {statMap?.['longbow-dmg-ss'] ?? '1d10+17'}</div>
          <div className="combat-kit__weapon-meta">Elem + {statMap?.['longbow-elem-dmg'] ?? '1d6'}</div>
          <div className="combat-kit__weapon-meta">Gloom + {statMap?.['longbow-gloom-dmg'] ?? '1d8'}</div>
        </div>

        <div className="combat-kit__weapon">
          <Link className="combat-kit__weapon-name" to="/actions#dagger-1-fey-blessing">
            Dagger +1 - Fey Blessed
          </Link>
          <div className="combat-kit__weapon-meta">Hit {statMap?.['dagger-hit'] ?? '+12'}</div>
          <div className="combat-kit__weapon-meta">Std {statMap?.['dagger-dmg'] ?? '1d4+6'}</div>
          <div className="combat-kit__weapon-meta">Gloom {statMap?.['dagger-gloom-dmg'] ?? '1d4+6+1d8'}</div>
        </div>

        <div className="combat-kit__weapon">
          <Link className="combat-kit__weapon-name" to="/actions#dagger-non-magical-poison-dipped">
            Dagger - Poison Dipped
          </Link>
          <div className="combat-kit__weapon-meta">
            Hit {statMap?.['dagger-poison-hit'] ?? statMap?.['poison-dagger-hit'] ?? '+11'}
          </div>
          <div className="combat-kit__weapon-meta">Std {statMap?.['poison-dagger-dmg'] ?? '1d4+5'}</div>
          <div className="combat-kit__weapon-meta">Gloom {statMap?.['poison-dagger-gloom-dmg'] ?? '1d4+5+1d8'}</div>
        </div>
      </div>

      <div className="combat-kit__section">
        <div className="combat-kit__title">Ammo</div>
        <div className="panel__content--ammo combat-kit__ammo">
          <div className="ammo-group">
            <div className="ammo-group__title">Blowgun Darts</div>
            <StatControl
              label="Standard"
              value={standardBlowgunDartsQuantity}
              onChange={(nextValue) => setInventoryItemValue(standardBlowgunDartsName, nextValue)}
            />
            <StatControl label="Fire" value={vitals.dartFire} onChange={updateVital('dartFire')} />
            <StatControl label="Water" value={vitals.dartWater} onChange={updateVital('dartWater')} />
            <StatControl label="Lava" value={vitals.dartLava} onChange={updateVital('dartLava')} />
          </div>
          <div className="ammo-group">
            <div className="ammo-group__title">Arrows</div>
            <StatControl
              label="Standard"
              value={standardArrowsQuantity}
              onChange={(nextValue) => setInventoryItemValue(standardArrowsName, nextValue)}
            />
            <StatControl label="Fire" value={vitals.arrowFire} onChange={updateVital('arrowFire')} />
            <StatControl label="Water" value={vitals.arrowWater} onChange={updateVital('arrowWater')} />
            <StatControl label="Lava" value={vitals.arrowLava} onChange={updateVital('arrowLava')} />
          </div>
          <div className="ammo-group ammo-group--single">
            <StatControl
              label="Pond Poppers"
              value={pondPoppersQuantity}
              onChange={(nextValue) => setInventoryItemValue(pondPoppersName, nextValue)}
            />
          </div>
        </div>
      </div>

      <div className="combat-kit__section combat-kit__section--wide">
        <div className="combat-kit__title">Drugs &amp; Herbs</div>
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

      <div className="combat-kit__section combat-kit__section--grung">
        <div className="combat-kit__title">Grung Abilities</div>
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
      </div>
    </div>
  )
}
