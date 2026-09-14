import TrackerGroup from '../components/TrackerGroup.jsx'
import { rollFlatDice } from '../lib/diceRoller.js'

// Extracted from App.jsx's Dashboard route during the rebuild (Phase 3) —
// exact original content (Spell Slots, Prepared Spells click-to-expand
// list, Other Magical Abilities incl. Circle of Spores rolls), just moved
// into its own file. See docs/REBUILD_PLAN.md §3.6/Phase 3.

const spellLevelOrder = ['Cantrips', '1st', '2nd', '3rd', '4th', '5th', '6th']
const haloDamage = '1d8'
const haloSymbioticDamage = '2d8'

function AbilityTopicRow({ ability, expanded, onToggle, onRoll, rollLabel }) {
  if (!ability) return null
  return (
    <div className="ability-topic">
      <div className="ability-topic__row">
        <button type="button" className="ability-topic__name" onClick={onToggle}>
          {expanded ? '▾' : '▸'} {ability.name}
        </button>
        {onRoll ? (
          <button type="button" className="skill-row__roll-btn" onClick={onRoll}>
            {rollLabel || 'Roll'}
          </button>
        ) : null}
      </div>
      {expanded ? (
        <div className="inline-detail">
          {ability.subtitle ? (
            <div className="inline-detail__summary">
              <strong>{ability.subtitle}</strong>
            </div>
          ) : null}
          {ability.summary ? <div className="inline-detail__summary">{ability.summary}</div> : null}
          {ability.notes?.length ? (
            <ul className="inline-detail__notes">
              {ability.notes.map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

function SpellInlineDetails({ spell }) {
  if (!spell) return null
  const facts = [
    ['Level', spell.level],
    ['Cast', spell.castingTime],
    ['Range', spell.range],
    ['Duration', spell.duration],
    ['Components', spell.components],
  ].filter(([, value]) => value)

  return (
    <div className="inline-detail spell-inline-detail">
      {facts.length ? (
        <div className="inline-detail__facts">
          {facts.map(([label, value]) => (
            <div key={label} className="inline-detail__fact">
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      ) : null}
      {spell.summary ? <div className="inline-detail__summary">{spell.summary}</div> : null}
      {spell.notes?.length ? (
        <ul className="inline-detail__notes">
          {spell.notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default function MagicPanel({
  statMap,
  trackers,
  parseTracker,
  handleToggle,
  preparedSpells,
  expandedSpellKey,
  setExpandedSpellKey,
  magicAbilities,
  expandedAbilityKey,
  toggleAbility,
  symbioticActive,
  symbioticTempHp,
  updateSymbioticEntity,
  timeOfDayMap,
  timeOfDayOptions,
  updateTimeOfDay,
}) {
  return (
    <div className="panel__content magic-grid">
      <div className="magic-section">
        <div className="magic-section__title">Spell Slots</div>
        <div className="tracker-grid tracker-grid--compact magic-slots">
          <TrackerGroup title="1st" items={parseTracker('slots-1st', '1st', { compact: true })} onToggle={handleToggle} />
          <TrackerGroup title="2nd" items={parseTracker('slots-2nd', '2nd', { compact: true })} onToggle={handleToggle} />
          <TrackerGroup title="3rd" items={parseTracker('slots-3rd', '3rd', { compact: true })} onToggle={handleToggle} />
          <TrackerGroup title="4th" items={parseTracker('slots-4th', '4th', { compact: true })} onToggle={handleToggle} />
          <TrackerGroup title="5th" items={parseTracker('slots-5th', '5th', { compact: true })} onToggle={handleToggle} />
          <TrackerGroup title="6th" items={parseTracker('slots-6th', '6th', { compact: true })} onToggle={handleToggle} />
        </div>
      </div>

      <div className="magic-section prepared-spells">
        <div className="magic-section__title">Prepared Spells</div>
        <div className="prepared-spells__grid">
          {spellLevelOrder.map((level) => {
            const spellsForLevel = preparedSpells?.[level] ?? []
            return (
              <div key={level} className="prepared-spells__group">
                <div className="prepared-spells__level">{level}</div>
                <div className="prepared-spells__list">
                  {spellsForLevel.length ? (
                    spellsForLevel.map((spell) => {
                      const spellKey = `${level}-${spell.slug}`
                      const expanded = expandedSpellKey === spellKey
                      return (
                        <div key={spellKey} className={`prepared-spells__item${expanded ? ' prepared-spells__item--expanded' : ''}`}>
                          <button
                            className="prepared-spells__link"
                            type="button"
                            onClick={() => setExpandedSpellKey(expanded ? '' : spellKey)}
                          >
                            {spell.name}
                          </button>
                          {expanded ? <SpellInlineDetails spell={spell} /> : null}
                        </div>
                      )
                    })
                  ) : (
                    <span className="prepared-spells__empty">None prepared</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="magic-section">
        <div className="magic-section__title">Other Magical Abilities</div>
        <div className="tracker-grid tracker-grid--compact magic-resources">
          <TrackerGroup title="Wild Shape" items={parseTracker('wild-shape', 'Wild Shape', { compact: true })} onToggle={handleToggle} />
          <TrackerGroup
            title="Fungal Infestation"
            items={parseTracker('fungal-infestation', 'Fungal', { compact: true })}
            onToggle={handleToggle}
          />
          <AbilityTopicRow
            ability={magicAbilities['fungal-infestation']}
            expanded={expandedAbilityKey === 'fungal-infestation'}
            onToggle={() => toggleAbility('fungal-infestation')}
          />

          <div className="spores-panel">
            <div className="spores-panel__title">Circle of Spores</div>
            <button
              className={`spores-panel__entity-btn${symbioticActive ? ' spores-panel__entity-btn--active' : ''}`}
              type="button"
              onClick={() => updateSymbioticEntity(!symbioticActive)}
            >
              {symbioticActive ? `End Symbiotic Entity (${symbioticTempHp} HP)` : 'Activate Symbiotic Entity (+44 HP)'}
            </button>
            <div className="spores-panel__grid">
              <button
                type="button"
                className="spores-panel__roll spores-panel__roll--btn"
                onClick={() => rollFlatDice(statMap?.['halo-damage'] ?? haloDamage, 'Halo of Spores')}
              >
                Halo {statMap?.['halo-damage'] ?? haloDamage}
              </button>
              <button
                type="button"
                className="spores-panel__roll spores-panel__roll--btn"
                onClick={() =>
                  rollFlatDice(statMap?.['halo-damage-symbiotic'] ?? haloSymbioticDamage, 'Halo of Spores (Symbiotic Entity)')
                }
              >
                Symbiotic {statMap?.['halo-damage-symbiotic'] ?? haloSymbioticDamage}
              </button>
              <div className="spores-panel__roll spores-panel__roll--wide">Spreading Spores</div>
            </div>
            <div className="spores-panel__note">
              DC {statMap?.['spell-dc'] ?? '18'} CON save. Spreading Spores is a bonus action while Symbiotic Entity is
              active; while the cube persists, Halo cannot be used as a reaction.
            </div>
            <AbilityTopicRow
              ability={magicAbilities['symbiotic-entity']}
              expanded={expandedAbilityKey === 'symbiotic-entity'}
              onToggle={() => toggleAbility('symbiotic-entity')}
            />
            <AbilityTopicRow
              ability={magicAbilities['halo-of-spores-reaction']}
              expanded={expandedAbilityKey === 'halo-of-spores-reaction'}
              onToggle={() => toggleAbility('halo-of-spores-reaction')}
            />
            <AbilityTopicRow
              ability={magicAbilities['spreading-spores']}
              expanded={expandedAbilityKey === 'spreading-spores'}
              onToggle={() => toggleAbility('spreading-spores')}
            />
          </div>

          <TrackerGroup
            title="Song of the Grung"
            items={parseTracker('song-grung', 'Song', { compact: true })}
            onToggle={handleToggle}
            headerAddon={
              <label className="tracker-inline">
                <span>Last used</span>
                <select
                  value={trackers?.[`${timeOfDayMap.songGrung}-last-used`] || ''}
                  onChange={(event) => updateTimeOfDay(timeOfDayMap.songGrung, event.target.value)}
                >
                  <option value="">Select</option>
                  {timeOfDayOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            }
          />
          <AbilityTopicRow
            ability={magicAbilities['song-of-the-grung']}
            expanded={expandedAbilityKey === 'song-of-the-grung'}
            onToggle={() => toggleAbility('song-of-the-grung')}
          />

          <TrackerGroup title="Active Camo" items={parseTracker('active-camo', 'Active Camo', { compact: true })} onToggle={handleToggle} />

          <TrackerGroup title="Misty Step" items={parseTracker('fey-misty-step', 'Misty', { compact: true })} onToggle={handleToggle} />
          <TrackerGroup
            title="Hunter's Mark"
            items={parseTracker('fey-hunters-mark', 'Mark', { compact: true })}
            onToggle={handleToggle}
          />
        </div>
      </div>
    </div>
  )
}
