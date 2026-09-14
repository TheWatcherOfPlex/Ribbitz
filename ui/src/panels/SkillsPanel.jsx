import { rollDice, parseStatNumber } from '../lib/diceRoller.js'

// Extracted from App.jsx's Dashboard route during the rebuild (Phase 3) so
// the exact same rich panel (Ability Scores + full Skills list, each row
// with its own Check AND Save button) can be reused both on the regular
// Dashboard and as a single draggable/resizable block on the new canvas —
// see docs/REBUILD_PLAN.md. Per the owner's correction: dragging happens at
// the whole-panel/category level, not per individual skill — this stays one
// component, it does not get atomized into 28 separate elements.

const abilities = [
  { label: 'STR', key: 'str', modKey: 'str-mod', saveKey: 'save-str', proficient: false },
  { label: 'DEX', key: 'dex', modKey: 'dex-mod', saveKey: 'save-dex', proficient: true },
  { label: 'CON', key: 'con', modKey: 'con-mod', saveKey: 'save-con', proficient: false },
  { label: 'INT', key: 'int', modKey: 'int-mod', saveKey: 'save-int', proficient: false },
  { label: 'WIS', key: 'wis', modKey: 'wis-mod', saveKey: 'save-wis', proficient: true },
  { label: 'CHA', key: 'cha', modKey: 'cha-mod', saveKey: 'save-cha', proficient: false },
]

const skillGroups = [
  {
    label: 'Strength',
    abilityKey: 'str',
    skills: [
      { label: 'Athletics', key: 'skill-athletics', proficient: false },
      {
        label: 'Athletics (Swim/Climb)',
        key: 'skill-athletics-gloves',
        proficient: true,
        // Base Athletics isn't proficient — the glove is the only proficiency
        // source here, so don't ALSO add a separate generic proficiency term.
        extraBonusReplacesProficiency: true,
        extraBonus: { label: 'Gloves of Swimming & Climbing', statKey: 'proficiency' },
      },
    ],
  },
  {
    label: 'Dexterity',
    abilityKey: 'dex',
    skills: [
      { label: 'Acrobatics', key: 'skill-acrobatics', proficient: true },
      { label: 'Sleight of Hand', key: 'skill-sleight', proficient: false },
      { label: 'Stealth', key: 'skill-stealth', proficient: true },
    ],
  },
  {
    label: 'Intelligence',
    abilityKey: 'int',
    skills: [
      { label: 'Arcana', key: 'skill-arcana', proficient: true },
      { label: 'History', key: 'skill-history', proficient: false },
      { label: 'Investigation', key: 'skill-investigation', proficient: false },
      { label: 'Nature', key: 'skill-nature', proficient: true },
      {
        label: 'Nature (Preferred Terrain)',
        key: 'skill-nature-terrain',
        proficient: true,
        extraBonus: { label: 'Natural Explorer Bonus', statKey: 'proficiency' },
      },
      { label: 'Religion', key: 'skill-religion', proficient: false },
    ],
  },
  {
    label: 'Wisdom',
    abilityKey: 'wis',
    skills: [
      { label: 'Animal Handling', key: 'skill-animal-handling', proficient: false },
      { label: 'Insight', key: 'skill-insight', proficient: false },
      { label: 'Medicine', key: 'skill-medicine', proficient: true },
      {
        label: 'Medicine (Preferred Terrain)',
        key: 'skill-medicine-terrain',
        proficient: true,
        extraBonus: { label: 'Natural Explorer Bonus', statKey: 'proficiency' },
      },
      { label: 'Perception', key: 'skill-perception', proficient: true },
      {
        label: 'Perception (Preferred Terrain)',
        key: 'skill-perception-terrain',
        proficient: true,
        extraBonus: { label: 'Natural Explorer Bonus', statKey: 'proficiency' },
      },
      { label: 'Survival', key: 'skill-survival', proficient: true },
      {
        label: 'Survival (Preferred Terrain)',
        key: 'skill-survival-terrain',
        proficient: true,
        extraBonus: { label: 'Natural Explorer Bonus', statKey: 'proficiency' },
      },
    ],
  },
  {
    label: 'Charisma',
    abilityKey: 'cha',
    skills: [
      { label: 'Deception', key: 'skill-deception', proficient: false },
      { label: 'Intimidation', key: 'skill-intimidation', proficient: false },
      { label: 'Performance', key: 'skill-performance', proficient: false },
      { label: 'Persuasion', key: 'skill-persuasion', proficient: false },
    ],
  },
]

export default function SkillsPanel({ statMap }) {
  const getSkillValue = (skillKey) => statMap?.[skillKey] || '—'

  return (
    <div className="panel__content abilities-skills">
      <div className="abilities-skills__abilities">
        <div className="abilities-skills__subtitle abilities-skills__subtitle--split">Ability Scores</div>
        <div className="ability-grid">
          {abilities.map((ability) => (
            <div
              key={ability.label}
              className={`ability-card${ability.proficient ? ' ability-card--proficient' : ''}`}
            >
              <div className="ability-card__label">{ability.label}</div>
              <div className="ability-card__score">{statMap?.[ability.key] ?? '—'}</div>
              <div className="ability-card__actions">
                <div className="ability-card__roll-stat">Check {statMap?.[ability.modKey] ?? '—'}</div>
                <div className="ability-card__roll-stat">Save {statMap?.[ability.saveKey] ?? '—'}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="abilities-skills__skills">
        <div className="abilities-skills__subtitle">Skills</div>
        <div className="skills-grid">
          {skillGroups.map((group) => {
            const groupAbility = abilities.find((a) => a.key === group.abilityKey)
            const abilityModValue = groupAbility ? parseStatNumber(statMap?.[groupAbility.modKey]) : null
            const proficiencyValue = parseStatNumber(statMap?.['proficiency'])
            const saveValue = groupAbility ? statMap?.[groupAbility.saveKey] ?? '—' : '—'
            const saveParts = [{ label: `${group.label} Modifier`, value: abilityModValue }]
            if (groupAbility?.proficient) {
              saveParts.push({ label: 'Proficiency Bonus', value: proficiencyValue })
            }
            return (
              <div key={group.label} className="skill-group">
                <div className="skill-group__title">{group.label}</div>
                {group.skills.map((skill) => {
                  const checkValue = getSkillValue(skill.key)
                  const checkParts = [{ label: `${group.label} Modifier`, value: abilityModValue }]
                  if (skill.proficient && !skill.extraBonusReplacesProficiency) {
                    checkParts.push({ label: 'Proficiency Bonus', value: proficiencyValue })
                  }
                  if (skill.extraBonus) {
                    checkParts.push({
                      label: skill.extraBonus.label,
                      value: parseStatNumber(statMap?.[skill.extraBonus.statKey]),
                    })
                  }
                  return (
                    <div key={skill.key} className={`skill-row${skill.proficient ? ' skill-row--pro' : ''}`}>
                      <span>{skill.label}</span>
                      <span className="skill-row__controls">
                        <span>{checkValue}</span>
                        <button
                          type="button"
                          className="skill-row__roll-btn"
                          disabled={checkValue === '—'}
                          onClick={() => rollDice(`${skill.label} Check`, checkParts)}
                          title={`${skill.label} Check`}
                        >
                          Check
                        </button>
                        <button
                          type="button"
                          className="skill-row__roll-btn"
                          disabled={saveValue === '—'}
                          onClick={() => rollDice(`${group.label} Save`, saveParts)}
                          title={`${group.label} Save`}
                        >
                          Save
                        </button>
                      </span>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
