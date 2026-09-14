import { Link } from 'react-router-dom'
import { slugifyHeading } from '../utils/slugifyHeading.js'

// Extracted from App.jsx's Dashboard route during the rebuild (Phase 3) —
// exact original content (Potions & Poisons, Exhaustion track, Conditions
// checklist, Ranger Features quick links), just moved into its own file.
// See docs/REBUILD_PLAN.md §3.6/Phase 3.

const conditionsList = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
]

const conditionDetails = {
  Blinded:
    "Can't see; automatically fails sight-based ability checks. Attacks against it have advantage, and its attacks have disadvantage.",
  Charmed:
    "Can't attack the charmer or target the charmer with harmful abilities. The charmer has advantage on social checks against it.",
  Deafened: "Can't hear and automatically fails hearing-based ability checks.",
  Frightened:
    "Disadvantage on ability checks and attacks while the source is in sight; can't willingly move closer to the source.",
  Grappled: "Speed becomes 0. Ends if the grappler is incapacitated or the target is moved out of reach.",
  Incapacitated: "Can't take actions or reactions.",
  Invisible:
    "Can't be seen without special senses or magic. Attacks against it have disadvantage, and its attacks have advantage.",
  Paralyzed:
    'Incapacitated, cannot move or speak, fails STR/DEX saves. Attacks against it have advantage; hits within 5 ft are critical hits.',
  Petrified:
    'Transformed into solid material, incapacitated, unaware, resistant to all damage, immune to poison/disease, and fails STR/DEX saves.',
  Poisoned: 'Disadvantage on attack rolls and ability checks.',
  Prone:
    'Can crawl or stand by spending half movement. Attacks within 5 ft have advantage; ranged attacks against it have disadvantage.',
  Restrained:
    "Speed becomes 0. Attacks against it have advantage, its attacks have disadvantage, and it has disadvantage on DEX saves.",
  Stunned:
    "Incapacitated, can't move, can speak only falteringly, fails STR/DEX saves, and attacks against it have advantage.",
  Unconscious:
    'Incapacitated, prone, unaware, drops held items, fails STR/DEX saves. Attacks within 5 ft are critical hits.',
}

const exhaustionEffects = [
  { level: 1, effect: 'Disadvantage on ability checks' },
  { level: 2, effect: 'Speed halved' },
  { level: 3, effect: 'Disadvantage on attack rolls and saving throws' },
  { level: 4, effect: 'Hit point maximum halved' },
  { level: 5, effect: 'Speed reduced to 0' },
  { level: 6, effect: 'Death' },
]

export default function ExhaustionPanel({
  potionPoisonItems,
  inventoryOnline,
  stepInventoryItem,
  setInventoryItemValue,
  exhaustionLevel,
  setExhaustionFromSlot,
  conditions,
  toggleCondition,
  expandedConditionKey,
  setExpandedConditionKey,
}) {
  return (
    <div className="panel__content exhaustion">
      <div className="consumables-panel">
        <div className="consumables-panel__title">Potions &amp; Poisons</div>
        <div className="consumables-panel__list">
          {potionPoisonItems.length ? (
            potionPoisonItems.map((item) => (
              <div key={item.name} className="consumable-item">
                <Link className="consumable-item__name" to={`/inventory#${slugifyHeading(item.name)}`}>
                  {item.name}
                </Link>
                <div className="consumable-item__controls">
                  <button
                    className="counter-row__btn"
                    type="button"
                    onClick={() => stepInventoryItem(item.name, -1)}
                    disabled={!inventoryOnline}
                    aria-label={`Decrease ${item.name}`}
                  >
                    −
                  </button>
                  <input
                    className="consumable-item__input"
                    value={item.quantity ?? ''}
                    onChange={(event) => setInventoryItemValue(item.name, event.target.value)}
                    onBlur={(event) => setInventoryItemValue(item.name, event.target.value)}
                    aria-label={`${item.name} quantity`}
                  />
                  <button
                    className="counter-row__btn"
                    type="button"
                    onClick={() => stepInventoryItem(item.name, 1)}
                    disabled={!inventoryOnline}
                    aria-label={`Increase ${item.name}`}
                  >
                    +
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="consumables-panel__empty">No combat potions or poisons loaded.</div>
          )}
        </div>
      </div>
      <div className="exhaustion-panel">
        <div className="exhaustion-panel__title">Exhaustion</div>
        <div className="exhaustion__slots" aria-label="Exhaustion level">
          {Array.from({ length: 6 }).map((_, index) => (
            <button
              key={`exhaustion-${index}`}
              type="button"
              className={`exhaustion__slot${exhaustionLevel > index ? ' exhaustion__slot--active' : ''}`}
              onClick={() => setExhaustionFromSlot(index)}
              aria-label={`Set exhaustion to ${index + 1}`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        <div className="exhaustion__effects" aria-label="Exhaustion effects">
          <div className="exhaustion__effects-title">Effects</div>
          <div className="exhaustion__effects-list">
            {exhaustionEffects.map((entry) => (
              <div
                key={entry.level}
                className={`exhaustion-effect${exhaustionLevel >= entry.level ? ' exhaustion-effect--active' : ''}`}
              >
                <span className="exhaustion-effect__level">{entry.level}</span>
                <span className="exhaustion-effect__text">{entry.effect}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="conditions">
        <div className="conditions__title">Conditions</div>
        <div className="conditions__list">
          {conditionsList.map((condition) => {
            const slug = slugifyHeading(condition)
            return (
              <div key={condition} className={`conditions__item${conditions?.[slug] ? ' conditions__item--active' : ''}`}>
                <input
                  type="checkbox"
                  checked={Boolean(conditions?.[slug])}
                  onChange={() => toggleCondition(condition)}
                  aria-label={`Toggle ${condition}`}
                />
                <button
                  className="conditions__link"
                  type="button"
                  onClick={() => setExpandedConditionKey(expandedConditionKey === slug ? '' : slug)}
                >
                  {condition}
                </button>
                {expandedConditionKey === slug ? (
                  <div className="conditions__detail">{conditionDetails[condition]}</div>
                ) : null}
              </div>
            )
          })}
        </div>
      </div>
      <div className="ranger-panel">
        <div className="ranger-panel__title">Ranger Features</div>
        <div className="feature-row">
          <strong>
            <Link className="feature-link" to="/features#favored-enemy">
              Favored Enemy
            </Link>
          </strong>
          <span>
            <Link className="feature-link" to="/features#favored-enemy">
              Snakes/Yuan-ti, Orcs
            </Link>
          </span>
        </div>
        <div className="feature-row">
          <strong>
            <Link className="feature-link" to="/features#natural-explorer">
              Natural Explorer
            </Link>
          </strong>
          <span>
            <Link className="feature-link" to="/features#natural-explorer">
              Swamp &amp; Forest
            </Link>
          </span>
        </div>
        <div className="feature-row">
          <strong>
            <Link className="feature-link" to="/features#ranger-6-gloom-stalker">
              Gloom Stalker
            </Link>
          </strong>
          <span>
            <Link className="feature-link" to="/features#dread-ambusher-gloom-stalker-3rd-level">
              Dread Ambusher
            </Link>
            {', '}
            <Link className="feature-link" to="/features#umbral-sight-gloom-stalker-3rd-level">
              Umbral Sight
            </Link>
          </span>
        </div>
      </div>
    </div>
  )
}
