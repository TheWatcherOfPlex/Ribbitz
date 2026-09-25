import { Link } from 'react-router-dom'
import TrackerGroup from '../components/TrackerGroup.jsx'
import { rollDice, rollDamage, parseStatNumber } from '../lib/diceRoller.js'

// Extracted from KitPanel.jsx (Grung Abilities half only) — split out per
// owner request 2026-09-23: "Grung Abilities should be its own panel. We
// may try to add it to something later if it makes sense."
//
// 2026-09-25: added real Attack/Damage roll buttons for Bite and Tongue
// Slap, and ability-check roll buttons for the two jumps (owner: "look
// over the rest of the character sheet, are there other things we can go
// ahead and get the dice programmed for?" — sourced from
// ui/public/content/Actions.md's "Special Actions" section and Racial
// Traits.md). Bite/Tongue Slap's to-hit is now computed LIVE from
// statMap (Strength Modifier + Proficiency), the same way every weapon
// button in AttackPanel.jsx already works — this naturally resolves to
// +8 (STR +2, Proficiency +6), not the stale "+7" hardcoded in the old
// static text here and still printed in Actions.md/Racial Traits.md.
// This isn't a silent "math audit fix" (that backlog item is still
// deferred) — it's simply building this new button the same correct,
// self-updating way every other attack button already works instead of
// hardcoding a number that would go stale the next time PB changes.
// Flagged to the owner rather than assumed.

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
  const strMod = parseStatNumber(statMap?.['str-mod'])
  const dexMod = parseStatNumber(statMap?.['dex-mod'])
  const proficiency = parseStatNumber(statMap?.['proficiency'])

  const jumpParts = (abilityLabel, abilityValue) => [
    { label: abilityLabel, value: abilityValue },
    { label: 'Proficiency Bonus', value: proficiency },
  ]
  const rollJump = (jumpLabel, abilityLabel, abilityValue, half) => {
    if (!Number.isFinite(abilityValue) || !Number.isFinite(proficiency)) return
    rollDice(`${jumpLabel} (${abilityLabel})${half ? ' — halve the total, round down' : ''}`, jumpParts(abilityLabel, abilityValue))
  }

  const bite = {
    hitParts: [
      { label: 'Strength Modifier', value: strMod },
      { label: 'Proficiency Bonus', value: proficiency },
    ],
    dmgParts: [{ label: 'Strength Modifier', value: strMod }],
  }
  const hasBiteCore = Number.isFinite(strMod) && Number.isFinite(proficiency)

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
          <div className="grung-jumping__row grung-jumping__row--rollable">
            <strong>Long Jump — Running Start</strong>
            <div className="attack-panel__group">
              <button
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => rollJump('Long Jump', 'Strength Modifier', strMod, false)}
              >
                STR (+{strMod ?? '—'})
              </button>
              <button
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => rollJump('Long Jump', 'Dexterity Modifier', dexMod, false)}
              >
                DEX (+{dexMod ?? '—'})
              </button>
            </div>
          </div>

          <div className="grung-jumping__row grung-jumping__row--rollable">
            <strong>Standing Jump</strong>
            <div className="attack-panel__group">
              <button
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => rollJump('Standing Jump', 'Strength Modifier', strMod, true)}
              >
                STR (+{strMod ?? '—'}) ÷2
              </button>
              <button
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => rollJump('Standing Jump', 'Dexterity Modifier', dexMod, true)}
              >
                DEX (+{dexMod ?? '—'}) ÷2
              </button>
            </div>
            <span className="spell-cast__half-note">Roll shows the full result — halve the total, round down.</span>
          </div>

          <div className="grung-jumping__row grung-jumping__row--rollable">
            <strong>Tongue Slap</strong>
            <div className="attack-panel__group">
              <button
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => hasBiteCore && rollDice('Tongue Slap — Attack', bite.hitParts)}
              >
                Attack (+{strMod != null && proficiency != null ? strMod + proficiency : '—'})
              </button>
              <button
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => rollDamage('Tongue Slap — Damage', '1d6', bite.dmgParts)}
              >
                1d6+{strMod ?? '—'} <span className="dmg-badge dmg-badge--physical">Piercing</span>
              </button>
            </div>
          </div>

          <div className="grung-jumping__row grung-jumping__row--rollable">
            <strong>Bite</strong>
            <div className="attack-panel__group">
              <button
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => hasBiteCore && rollDice('Bite — Attack', bite.hitParts)}
              >
                Attack (+{strMod != null && proficiency != null ? strMod + proficiency : '—'})
              </button>
              <button
                type="button"
                className="attack-panel__roll-btn"
                onClick={() => rollDamage('Bite — Damage', '1d6', bite.dmgParts)}
              >
                1d6+{strMod ?? '—'} <span className="dmg-badge dmg-badge--physical">Piercing</span>
              </button>
            </div>
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
