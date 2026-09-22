import { useEffect, useState } from 'react'
import { fetchStatMap } from '../lib/api.js'
import { RIBBITZ_LEVEL_PRESETS } from '../characters/ribbitz/levelPresets.js'

const SLOT_ORDER = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th']

export default function LevelUpPage() {
  const [currentLevel, setCurrentLevel] = useState(null)
  const [loadError, setLoadError] = useState('')
  const [selectedLevel, setSelectedLevel] = useState(null)

  useEffect(() => {
    let cancelled = false
    fetchStatMap()
      .then((statMap) => {
        if (cancelled) return
        const parsed = Number.parseInt(statMap?.level, 10)
        if (Number.isFinite(parsed)) {
          setCurrentLevel(parsed)
          setSelectedLevel(parsed)
        } else {
          setLoadError('Could not read a current level from the live sheet.')
        }
      })
      .catch(() => {
        if (!cancelled) setLoadError('Could not reach the live sheet to read the current level.')
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Only offer current-level-and-up — Ribbitz never goes backward. See
  // docs/REBUILD_PLAN.md Phase 5 for why (owner decision, 2026-09-22).
  const availablePresets =
    currentLevel == null ? [] : RIBBITZ_LEVEL_PRESETS.filter((preset) => preset.level >= currentLevel)

  const selectedPreset = availablePresets.find((preset) => preset.level === selectedLevel)

  return (
    <div className="level-up-page">
      <h1>Level Up Planning</h1>
      <p className="level-up-page__intro">
        A reference/checklist for leveling Ribbitz up — nothing here changes your live character sheet. It's a
        preview for what changes at each level so you and your DM can go through it together at the table.
      </p>

      {loadError ? <div className="level-up-page__error">{loadError}</div> : null}

      {currentLevel != null && (
        <div className="level-up-page__current">Current level (live sheet): {currentLevel}</div>
      )}

      {availablePresets.length > 0 && (
        <label className="level-up-page__selector">
          <span>Preview level</span>
          <select
            value={selectedLevel ?? ''}
            onChange={(event) => setSelectedLevel(Number.parseInt(event.target.value, 10))}
          >
            {availablePresets.map((preset) => (
              <option key={preset.level} value={preset.level}>
                Level {preset.level}
                {preset.isCurrent ? ' (current)' : ''}
              </option>
            ))}
          </select>
        </label>
      )}

      {selectedPreset && (
        <div className="level-up-page__detail">
          <div className="level-up-page__row">
            <strong>Classes</strong>
            <span>
              Ranger {selectedPreset.rangerLevel} / Druid {selectedPreset.druidLevel}
            </span>
          </div>
          <div className="level-up-page__row">
            <strong>Proficiency Bonus</strong>
            <span>{selectedPreset.proficiencyBonus}</span>
          </div>

          <div className="level-up-page__row level-up-page__row--slots">
            <strong>Spell Slots (RAW multiclass table, combined caster level {selectedPreset.combinedCasterLevel})</strong>
            <div className="level-up-page__slots">
              {SLOT_ORDER.map((slotKey) => {
                const value = selectedPreset.spellSlotsRAW?.[slotKey] ?? 0
                if (value === 0) return null
                return (
                  <span key={slotKey} className="level-up-page__slot-pill">
                    {slotKey}: {value}
                  </span>
                )
              })}
            </div>
          </div>

          {selectedPreset.sheetDiscrepancyNote ? (
            <div className="level-up-page__discrepancy">⚠ {selectedPreset.sheetDiscrepancyNote}</div>
          ) : null}

          <div className="level-up-page__row">
            <strong>HP</strong>
            <span>{selectedPreset.hpNote}</span>
          </div>

          {selectedPreset.newFeatures?.length ? (
            <div className="level-up-page__features">
              <strong>New at this level</strong>
              {selectedPreset.newFeatures.map((feature) => (
                <div key={feature.name} className="level-up-page__feature">
                  <div className="level-up-page__feature-name">
                    {feature.name} <span className="level-up-page__feature-source">({feature.source})</span>
                  </div>
                  <div className="level-up-page__feature-summary">{feature.summary}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="level-up-page__row">
              <span>No new class or subclass features at this level.</span>
            </div>
          )}

          {selectedPreset.notes ? <div className="level-up-page__notes">{selectedPreset.notes}</div> : null}
        </div>
      )}
    </div>
  )
}
