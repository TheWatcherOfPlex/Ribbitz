import { Link } from 'react-router-dom'
import StatControl from '../components/StatControl.jsx'
import CounterRow from '../components/CounterRow.jsx'
import { triStateClass } from '../lib/triState.js'
import { slugifyHeading } from '../utils/slugifyHeading.js'

// Extracted from App.jsx's Dashboard route during the rebuild (Phase 3) —
// exact original content (Currency, Quick Stats, Vitality/HP/Symbiotic HP,
// Healing, Hit Dice, Death Saves), just moved into its own file and taking
// its dependencies as props instead of closing over App()'s local state
// directly. See docs/REBUILD_PLAN.md.

const currencyItems = [
  { label: 'Gold', inventoryName: 'Gold Pieces: 252 gp', fallback: 7223, suffix: 'gp' },
  { label: 'Golden Beetles', inventoryName: '100 Golden Beetles', fallback: 100, suffix: 'beetles' },
]

const quickStats = [
  { label: 'AC', key: 'ac', fallback: '19' },
  { label: 'Initiative', key: 'initiative', fallback: '+5' },
  { label: 'Speed', key: 'speed', fallback: '25 ft' },
  { label: 'Proficiency', key: 'proficiency', fallback: '+6' },
  { label: 'Darkvision', key: 'darkvision', fallback: '90 ft' },
  { label: 'Passive Perception', key: 'passive-perception', fallback: '20' },
  { label: 'Spell Save DC', key: 'spell-dc', fallback: '18' },
  { label: 'Spell Attack', key: 'spell-attack', fallback: '+10' },
  { label: 'Size', key: 'size', fallback: `Small (4' 0", 55 lbs)` },
]

const potionDefinitions = [
  { name: 'Healing Potion (Common/Standard)', label: 'Common', detail: '2d4+2' },
  { name: 'Healing Potion (Greater)', label: 'Greater', detail: '4d4+4' },
  { name: 'Healing Potion (Superior)', label: 'Superior', detail: '8d4+8' },
  { name: 'Healing Potion (Supreme)', label: 'Supreme', detail: '10d4+20' },
  { name: 'Golden Elixir', label: 'Golden', detail: 'Full +10 temp' },
  { name: 'Frog Salve Meds', label: 'Frog Salve', detail: 'Grung heal' },
]

export default function PrimaryPanel({
  statMap,
  vitals,
  symbioticActive,
  symbioticTempHp,
  inspirationValue,
  inventoryOnline,
  inventoryError,
  healingQuickLinks,
  deathSaves,
  getInventoryQuantity,
  setInventoryItemValue,
  stepInventoryItem,
  updateStat,
  updateVital,
  stepSymbioticTempHp,
  handleRest,
  toggleDeathSave,
}) {
  return (
    <div className="panel__stack">
      <div className="panel__box currency-box">
        <div className="panel__section-title">Currency</div>
        <div className="panel__content currency-list">
          {currencyItems.map((item) => (
            <StatControl
              key={item.label}
              label={item.label}
              value={getInventoryQuantity(item.inventoryName, item.fallback)}
              helper={item.suffix}
              onChange={(nextValue) => setInventoryItemValue(item.inventoryName, nextValue)}
              accent="gold"
            />
          ))}
        </div>
      </div>

      <div className="panel__box">
        <div className="panel__section-title">Quick Stats</div>
        <div className="panel__content quick-stats">
          <StatControl
            label="Inspiration"
            value={inspirationValue}
            helper="Points"
            onChange={updateStat('inspiration')}
            accent="gold"
          />
          {quickStats.map((stat) => (
            <div key={stat.label} className="quick-stat">
              <div className="quick-stat__value">{statMap?.[stat.key] ?? stat.fallback}</div>
              <div className="quick-stat__label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="panel__box">
        <div className="panel__section-title">Vitality</div>
        <div className="panel__content panel__content--vitals">
          <StatControl label="HP" value={vitals.hp} helper={`Max ${statMap?.['hp-max'] ?? 112}`} onChange={updateVital('hp')} />
          <StatControl label="Temp HP" value={vitals.tempHp} onChange={updateVital('tempHp')} />
          <div className="symbiotic-hp-control">
            <div className="symbiotic-hp-control__topline">
              <span>Symbiotic HP</span>
              <span>{symbioticActive ? 'Active' : 'Inactive'}</span>
            </div>
            <div className="symbiotic-hp-control__field">
              <button
                className="stat-control__btn"
                type="button"
                onClick={() => stepSymbioticTempHp(-1)}
                disabled={!symbioticActive}
                aria-label="Decrease Symbiotic HP"
              >
                −
              </button>
              <div className="symbiotic-hp-control__value">{symbioticTempHp}</div>
              <button
                className="stat-control__btn"
                type="button"
                onClick={() => stepSymbioticTempHp(1)}
                disabled={!symbioticActive}
                aria-label="Increase Symbiotic HP"
              >
                +
              </button>
            </div>
          </div>

          <div className="vitals-actions">
            <button className="ghost" type="button" onClick={() => handleRest('shortRest')}>
              Short Rest
            </button>
            <button className="primary" type="button" onClick={() => handleRest('longRest')}>
              Long Rest
            </button>
          </div>
        </div>

        <div className="panel__content vitality-healing">
          <div className="vitality-healing__header">
            <div className="vitality-healing__title">Healing</div>
            {!inventoryOnline && <div className="vitality-healing__badge">Offline</div>}
          </div>
          {inventoryError && <div className="combat-kit__notice">{inventoryError}</div>}
          <div className="combat-kit__potions">
            {potionDefinitions.map((potion) => (
              <CounterRow
                key={potion.name}
                label={potion.label}
                detail={potion.detail}
                value={getInventoryQuantity(potion.name, 0)}
                disabled={!inventoryOnline}
                onStep={(delta) => stepInventoryItem(potion.name, delta)}
              />
            ))}
          </div>
          <div className="healing-spells">
            {healingQuickLinks.map((entry) => (
              <div key={entry.name} className="healing-spell-row">
                <Link className="healing-spell-row__name" to={entry.href || `/spells#${slugifyHeading(entry.name)}`}>
                  {entry.name}
                </Link>
                <div className="healing-spell-row__detail">{entry.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel__content vitality-survival">
          <div className="vitality-survival__grid">
            <div className="hit-dice">
              <div className="hit-dice__title">Hit Dice</div>
              <div className="hit-dice__detail">Ranger 6d10 • Druid 11d8</div>
            </div>

            <div className="death-saves">
              <div className="death-saves__title">Death Saves</div>
              <div className="death-saves__rows">
                <div className="death-saves__row">
                  <div className="death-saves__label">Success</div>
                  <div className="death-saves__slots">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <button
                        key={`death-success-${index}`}
                        type="button"
                        className={`death-save-slot ${triStateClass(deathSaves[index])}`}
                        onClick={() => toggleDeathSave(index)}
                        aria-label={`Toggle death save success slot ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="death-saves__row">
                  <div className="death-saves__label">Failure</div>
                  <div className="death-saves__slots">
                    {Array.from({ length: 3 }).map((_, index) => (
                      <button
                        key={`death-fail-${index}`}
                        type="button"
                        className={`death-save-slot ${triStateClass(deathSaves[index + 3])}`}
                        onClick={() => toggleDeathSave(index + 3)}
                        aria-label={`Toggle death save failure slot ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
