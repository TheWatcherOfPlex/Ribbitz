import { useState } from 'react'
import { rollDice, rollDamage, parseStatNumber } from '../lib/diceRoller.js'

// Owner ask (2026-09-24): "I want you to make a button for [any spell that
// requires a roll]... walk me through casting it each time... I get a bit
// caught up trying to keep up with the rules... I'm trying to offload all
// that with this UI." This is the reusable "cast flow" card: Attack/Save
// row (labeled the same way weapons show Attack vs Damage, per the owner's
// explicit ask), an Outcome toggle (Hit/Miss or Save Succeeded/Failed) that
// reveals the right next step, then a colored Damage/Heal row. Config per
// spell lives in lib/spellCasts.js — read that file's header comment for
// the shape before adding a new spell here.
//
// Every spell here shares Ribbitz's single spell-attack/spell-dc stat
// (unlike weapons, which each have their own to-hit bonus), so there's no
// per-spell numeric override needed — just statMap.

function DmgBadge({ dmgType, children }) {
  return <span className={`dmg-badge dmg-badge--${dmgType}`}>{children}</span>
}

export default function SpellCastCard({ spellName, config, statMap }) {
  const [outcome, setOutcome] = useState(null)
  if (!config) return null

  const spellAttack = parseStatNumber(statMap?.['spell-attack'])
  const spellDc = statMap?.['spell-dc'] ?? '18'
  const wisMod = parseStatNumber(statMap?.['wis-mod'])
  const proficiency = parseStatNumber(statMap?.['proficiency'])

  const rollAttack = () => {
    if (!Number.isFinite(spellAttack)) return
    rollDice(`${spellName} — Spell Attack`, [{ label: 'Spell Attack Bonus', value: spellAttack }])
  }

  const rollDamageDie = (label, die, dmgType, halved) => {
    rollDamage(`${spellName} — ${label}${halved ? ' (halve the total, round down)' : ''} (${dmgType})`, die, [])
  }

  if (config.kind === 'spell-attack' || config.kind === 'melee-spell-attack') {
    return (
      <div className="spell-cast">
        <div className="spell-cast__row">
          <span className="spell-cast__row-label">{config.kind === 'melee-spell-attack' ? 'Melee Attack' : 'Attack'}</span>
          <button type="button" className="attack-panel__roll-btn" onClick={rollAttack}>
            Spell Attack (+{spellAttack ?? '—'})
          </button>
        </div>

        <div className="spell-cast__row">
          <span className="spell-cast__row-label">Outcome</span>
          <button
            type="button"
            className={`spell-cast__outcome-btn${outcome === 'hit' ? ' spell-cast__outcome-btn--active' : ''}`}
            onClick={() => setOutcome('hit')}
          >
            Hit
          </button>
          <button
            type="button"
            className={`spell-cast__outcome-btn${outcome === 'miss' ? ' spell-cast__outcome-btn--active' : ''}`}
            onClick={() => setOutcome('miss')}
          >
            Miss
          </button>
        </div>

        {outcome === 'hit' && config.damage ? (
          <div className="spell-cast__row">
            <span className="spell-cast__row-label">Damage</span>
            {config.damage.map((d) => (
              <button
                key={d.label}
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => rollDamageDie(d.label, d.die, d.dmgType, false)}
              >
                {d.die} <DmgBadge dmgType={d.dmgType}>{d.label}</DmgBadge>
              </button>
            ))}
          </div>
        ) : null}

        {outcome === 'hit' && config.note ? <div className="spell-cast__note">{config.note}</div> : null}
        {outcome === 'miss' ? <div className="spell-cast__note">No effect — the attack missed.</div> : null}
      </div>
    )
  }

  if (config.kind === 'save-negates' || config.kind === 'save-half') {
    const isHalf = config.kind === 'save-half'
    return (
      <div className="spell-cast">
        <div className="spell-cast__row">
          <span className="spell-cast__row-label">Save</span>
          <span className="spell-cast__save-dc">
            {config.saveAbility} Save DC <strong>{spellDc}</strong>
          </span>
        </div>

        <div className="spell-cast__row">
          <span className="spell-cast__row-label">Outcome</span>
          <button
            type="button"
            className={`spell-cast__outcome-btn spell-cast__outcome-btn--fail${
              outcome === 'fail' ? ' spell-cast__outcome-btn--active' : ''
            }`}
            onClick={() => setOutcome('fail')}
          >
            Save Failed
          </button>
          <button
            type="button"
            className={`spell-cast__outcome-btn spell-cast__outcome-btn--success${
              outcome === 'success' ? ' spell-cast__outcome-btn--active' : ''
            }`}
            onClick={() => setOutcome('success')}
          >
            Save Succeeded
          </button>
        </div>

        {outcome === 'fail' && config.damage ? (
          <div className="spell-cast__row">
            <span className="spell-cast__row-label">Damage</span>
            {config.damage.map((d) => (
              <button
                key={d.label}
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => rollDamageDie(d.label, d.die, d.dmgType, false)}
              >
                {d.die} <DmgBadge dmgType={d.dmgType}>{d.label}</DmgBadge>
              </button>
            ))}
          </div>
        ) : null}

        {outcome === 'success' && isHalf && config.damage ? (
          <div className="spell-cast__row">
            <span className="spell-cast__row-label">Half Damage</span>
            {config.damage.map((d) => (
              <button
                key={d.label}
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => rollDamageDie(d.label, d.die, d.dmgType, true)}
              >
                {d.die} <DmgBadge dmgType={d.dmgType}>{d.label}</DmgBadge> ÷2
              </button>
            ))}
            <span className="spell-cast__half-note">Roll shows the full die — halve the total, round down.</span>
          </div>
        ) : null}

        {outcome === 'success' && !isHalf ? (
          <div className="spell-cast__note">No damage — the save succeeded.</div>
        ) : null}
      </div>
    )
  }

  if (config.kind === 'heal') {
    return (
      <div className="spell-cast">
        <div className="spell-cast__row spell-cast__row--wrap">
          <span className="spell-cast__row-label">Heal</span>
          {config.heal.map((h) => (
            <button
              key={h.label}
              type="button"
              className="attack-panel__roll-btn"
              onClick={() =>
                rollDamage(
                  `${spellName} — ${h.label}`,
                  h.die,
                  h.includeWisMod && Number.isFinite(wisMod) ? [{ label: 'Wisdom Modifier', value: wisMod }] : [],
                )
              }
            >
              {h.label}: {h.die}
              {h.includeWisMod ? `+${wisMod ?? '—'}` : ''} <DmgBadge dmgType="healing">HP</DmgBadge>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (config.kind === 'ability-check') {
    const checkBonus = Number.isFinite(wisMod) && Number.isFinite(proficiency) ? wisMod + proficiency : null
    return (
      <div className="spell-cast">
        <div className="spell-cast__row">
          <span className="spell-cast__row-label">Check</span>
          <button
            type="button"
            className="attack-panel__roll-btn"
            onClick={() =>
              checkBonus != null &&
              rollDice(`${spellName} — ${config.checkLabel} Check`, [
                { label: 'Wisdom Modifier', value: wisMod },
                { label: 'Proficiency Bonus', value: proficiency },
              ])
            }
          >
            {config.checkLabel} (+{checkBonus ?? '—'})
          </button>
        </div>
      </div>
    )
  }

  return null
}
