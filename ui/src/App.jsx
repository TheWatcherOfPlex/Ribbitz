import { NavLink, Route, Routes } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import ribbitzPortrait from './assets/ribbitz-flying.png'
import MarkdownPage from './components/MarkdownPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import TrackerGroup from './components/TrackerGroup.jsx'

const sheetUrl =
  'https://docs.google.com/spreadsheets/d/1Vn1Xaq04AWDrrdz-RGO8m6V7SzuFyHrW31e47fnH2v0'

const navLinks = [
  { label: 'Dashboard', href: '/' },
  { label: 'Basic Stats', href: '/stats' },
  { label: 'Actions', href: '/actions' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Spells', href: '/spells' },
  { label: 'Features', href: '/features' },
  { label: 'Racial Traits', href: '/racial-traits' },
  { label: 'Backstory', href: '/backstory' },
  { label: 'Images', href: '/images' },
]

const quickStats = [
  { label: 'AC', key: 'ac', fallback: '19' },
  { label: 'Initiative', key: 'initiative', fallback: '+5' },
  { label: 'Speed', key: 'speed', fallback: '25 ft' },
  { label: 'Proficiency', key: 'proficiency', fallback: '+5' },
  { label: 'Darkvision', key: 'darkvision', fallback: '90 ft' },
  { label: 'Spell Save DC', key: 'spell-dc', fallback: '17' },
  { label: 'Spell Attack', key: 'spell-attack', fallback: '+9' },
]

const abilities = [
  { label: 'STR', score: 14, mod: '+2', proficient: false },
  { label: 'DEX', score: 20, mod: '+5', proficient: true },
  { label: 'CON', score: 16, mod: '+3', proficient: false },
  { label: 'INT', score: 9, mod: '-1', proficient: false },
  { label: 'WIS', score: 18, mod: '+4', proficient: true },
  { label: 'CHA', score: 8, mod: '-1', proficient: false },
]

const skillGroups = [
  {
    label: 'Strength',
    skills: [
      { label: 'Athletics', key: 'skill-athletics', proficient: false },
      { label: 'Athletics (Swim/Climb)', key: 'skill-athletics-gloves', proficient: true },
    ],
  },
  {
    label: 'Dexterity',
    skills: [
      { label: 'Acrobatics', key: 'skill-acrobatics', proficient: true },
      { label: 'Sleight of Hand', key: 'skill-sleight', proficient: false },
      { label: 'Stealth', key: 'skill-stealth', proficient: true },
    ],
  },
  {
    label: 'Intelligence',
    skills: [
      { label: 'Arcana', key: 'skill-arcana', proficient: true },
      { label: 'History', key: 'skill-history', proficient: false },
      { label: 'Investigation', key: 'skill-investigation', proficient: false },
      { label: 'Nature', key: 'skill-nature', proficient: true },
      { label: 'Nature (Terrain)', key: 'skill-nature-terrain', proficient: true },
      { label: 'Religion', key: 'skill-religion', proficient: false },
    ],
  },
  {
    label: 'Wisdom',
    skills: [
      { label: 'Animal Handling', key: 'skill-animal-handling', proficient: false },
      { label: 'Insight', key: 'skill-insight', proficient: false },
      { label: 'Medicine', key: 'skill-medicine', proficient: true },
      { label: 'Medicine (Terrain)', key: 'skill-medicine-terrain', proficient: true },
      { label: 'Perception', key: 'skill-perception', proficient: true },
      { label: 'Perception (Terrain)', key: 'skill-perception-terrain', proficient: true },
      { label: 'Survival', key: 'skill-survival', proficient: true },
      { label: 'Survival (Terrain)', key: 'skill-survival-terrain', proficient: true },
    ],
  },
  {
    label: 'Charisma',
    skills: [
      { label: 'Deception', key: 'skill-deception', proficient: false },
      { label: 'Intimidation', key: 'skill-intimidation', proficient: false },
      { label: 'Performance', key: 'skill-performance', proficient: false },
      { label: 'Persuasion', key: 'skill-persuasion', proficient: false },
    ],
  },
]

const restDefinitions = {
  shortRest: {
    label: 'Short Rest',
    updates: [{ key: 'wild-shape', value: '2/2' }],
  },
  longRest: {
    label: 'Long Rest',
    updates: [
      { key: 'slots-1st', value: '4/4' },
      { key: 'slots-2nd', value: '3/3' },
      { key: 'slots-3rd', value: '3/3' },
      { key: 'slots-4th', value: '3/3' },
      { key: 'slots-5th', value: '2/2' },
      { key: 'slots-6th', value: '1/1' },
      { key: 'wild-shape', value: '2/2' },
      { key: 'active-camo', value: '5/5' },
      { key: 'fungal-infestation', value: '4/4' },
      { key: 'song-grung', value: '1/1' },
      { key: 'fey-misty-step', value: '1/1' },
      { key: 'fey-hunters-mark', value: '1/1' },
      { key: 'poison-weapon', value: '5/5' },
      { key: 'tongue-grapple', value: '5/5' },
      { key: 'dart-sleep', value: '1/1' },
      { key: 'dart-paralyze', value: '1/1' },
      { key: 'dart-purple', value: '5/5' },
      { key: 'skywarden-pierce', value: '1/1' },
    ],
  },
}

const timeOfDayOptions = ['Morning', 'Noon', 'Afternoon', 'Night', 'Midnight', 'Twilight']

const timeOfDayMap = {
  songGrung: 'song-grung',
  poisonSkin: 'poison-skin',
}

const vitalKeyMap = {
  hp: 'hp-current',
  tempHp: 'temp-hp',
  dartStandard: 'dart-standard',
  dartFire: 'dart-fire',
  dartWater: 'dart-water',
  dartLava: 'dart-lava',
  arrowStandard: 'arrow-standard',
  arrowFire: 'arrow-fire',
  arrowWater: 'arrow-water',
  arrowLava: 'arrow-lava',
}

function StatControl({ label, value, helper, onChange, accent }) {
  const [localValue, setLocalValue] = useState(value)

  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleBlur = () => {
    onChange?.(localValue)
  }

  const handleStep = (delta) => {
    const numericValue = Number(localValue)
    if (Number.isNaN(numericValue)) {
      return
    }
    const nextValue = numericValue + delta
    setLocalValue(nextValue)
    onChange?.(nextValue)
  }

  return (
    <div className={`stat-control${accent ? ' stat-control--accent' : ''}`}>
      <div className="stat-control__label">{label}</div>
      <div className="stat-control__field">
        <button
          className="stat-control__btn"
          aria-label={`Decrease ${label}`}
          onClick={() => handleStep(-1)}
        >
          −
        </button>
        <input
          className="stat-control__input"
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          onBlur={handleBlur}
          aria-label={`${label} value`}
        />
        <button
          className="stat-control__btn"
          aria-label={`Increase ${label}`}
          onClick={() => handleStep(1)}
        >
          +
        </button>
      </div>
      {helper && <div className="stat-control__helper">{helper}</div>}
    </div>
  )
}

function App() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [trackers, setTrackers] = useState({})
  const [vitals, setVitals] = useState({
    hp: 61,
    tempHp: 0,
    dartStandard: 59,
    dartFire: 11,
    dartWater: 17,
    dartLava: 5,
    arrowStandard: 20,
    arrowFire: 0,
    arrowWater: 0,
    arrowLava: 0,
  })
  const [statMap, setStatMap] = useState({})

  const statusLabel = useMemo(
    () => (isOnline ? 'ONLINE • Synced' : 'OFFLINE • Changes not saved'),
    [isOnline],
  )

  const syncLabel = useMemo(() => {
    if (!lastSync && isOnline) {
      return 'Waiting for sheet data...'
    }
    if (!lastSync && !isOnline) {
      return 'Backend offline • Start the sync server'
    }
    if (!isOnline) {
      return `Offline • Snapshot from ${new Date(lastSync).toLocaleTimeString()}`
    }
    return `Last sync: ${new Date(lastSync).toLocaleTimeString()}`
  }, [isOnline, lastSync])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats')
      const payload = await response.json()
      const mapped = payload.stats?.reduce((acc, stat) => {
        if (stat.key) {
          acc[stat.key] = stat.value
        }
        return acc
      }, {})
      setStatMap(mapped || {})
      setTrackers(mapped || {})
      const online = payload.source === 'sheet'
      setIsOnline(online)
      setLastSync(payload.updatedAt || new Date().toISOString())
      setVitals((prev) => ({
        hp: Number(mapped?.[vitalKeyMap.hp]) || prev.hp,
        tempHp: Number(mapped?.[vitalKeyMap.tempHp]) || prev.tempHp,
        dartStandard: Number(mapped?.[vitalKeyMap.dartStandard]) || prev.dartStandard,
        dartFire: Number(mapped?.[vitalKeyMap.dartFire]) || prev.dartFire,
        dartWater: Number(mapped?.[vitalKeyMap.dartWater]) || prev.dartWater,
        dartLava: Number(mapped?.[vitalKeyMap.dartLava]) || prev.dartLava,
        arrowStandard: Number(mapped?.[vitalKeyMap.arrowStandard]) || prev.arrowStandard,
        arrowFire: Number(mapped?.[vitalKeyMap.arrowFire]) || prev.arrowFire,
        arrowWater: Number(mapped?.[vitalKeyMap.arrowWater]) || prev.arrowWater,
        arrowLava: Number(mapped?.[vitalKeyMap.arrowLava]) || prev.arrowLava,
      }))
    } catch (error) {
      setIsOnline(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const updateVital = (key) => (nextValue) => {
    setVitals((prev) => ({
      ...prev,
      [key]: nextValue,
    }))
    if (!isOnline) {
      return
    }
    const sheetKey = vitalKeyMap[key]
    if (!sheetKey) {
      return
    }
    fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: sheetKey, value: nextValue }),
    }).catch(() => {
      setIsOnline(false)
    })
  }

  const parseTracker = (key, label, options = {}) => {
    const { compact = false } = options
    const raw = String(trackers?.[key] ?? '')
    const [current, total] = raw.split('/').map((value) => Number(value))
    if (!total) {
      return []
    }
    return Array.from({ length: total }).map((_, index) => ({
      key,
      label: compact ? String(index + 1) : `${label} ${index + 1}`,
      active: current > index,
      current,
      total,
    }))
  }

  const updateTracker = async (key, nextCurrent, total) => {
    if (!isOnline) {
      return
    }
    const value = `${nextCurrent}/${total}`
    setTrackers((prev) => ({ ...prev, [key]: value }))
    await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
  }

  const applyBulkUpdates = async (updates) => {
    if (!isOnline || !updates.length) {
      return
    }
    const nextMap = updates.reduce((acc, update) => {
      acc[update.key] = update.value
      return acc
    }, {})
    setTrackers((prev) => ({ ...prev, ...nextMap }))
    await fetch('/api/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates }),
    })
  }

  const handleRest = async (restKey) => {
    const definition = restDefinitions[restKey]
    if (!definition) {
      return
    }
    await applyBulkUpdates(definition.updates)
  }

  const updateTimeOfDay = async (resourceKey, nextValue) => {
    const sheetKey = `${resourceKey}-last-used`
    await applyBulkUpdates([{ key: sheetKey, value: nextValue }])
  }

  const getSkillValue = (skillKey) => statMap?.[skillKey] || '—'

  const handleToggle = (item) => {
    const nextCurrent = item.active ? item.current - 1 : item.current + 1
    const clamped = Math.max(0, Math.min(item.total, nextCurrent))
    updateTracker(item.key, clamped, item.total)
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__header">
          <div className="portrait">
            <img src={ribbitzPortrait} alt="Ribbitz flying" />
          </div>
          <div>
            <div className="title">Vanguard Ribbitz</div>
            <div className="subtitle">Ranger 6 / Druid 9 • Level 15</div>
          </div>
        </div>
        <nav className="sidebar__nav">
          {navLinks.map((link) => (
            <NavLink
              key={link.label}
              to={link.href}
              className={({ isActive }) =>
                `sidebar__link${isActive ? ' sidebar__link--active' : ''}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <span className={`status-pill ${isOnline ? 'online' : 'offline'}`}>
            {statusLabel}
          </span>
        </div>
      </aside>

      <main className="main-panel">
        <header className="topbar">
          <div>
            <div className="topbar__eyebrow">Campaign HUD</div>
            <div className="topbar__title">Ribbitz Battle Console</div>
            <div className="topbar__meta">{syncLabel}</div>
          </div>
          <div className="topbar__actions">
            <button className="ghost" onClick={fetchStats}>
              Sync Now
            </button>
            <a className="primary" href={sheetUrl} target="_blank" rel="noreferrer">
              Open Sheet
            </a>
          </div>
        </header>

        {!isOnline && (
          <div className="offline-banner">
            OFFLINE: Changes will NOT be saved. Reconnect to sync with Google Sheets.
          </div>
        )}

        <Routes>
          <Route
            path="/"
            element={
              <section className="grid">
                <div className="panel panel--primary panel--tight">
                  <div className="panel__header">
                    <h2>Vitality</h2>
                    <span className="panel__tag">Combat Core</span>
                  </div>
                  <div className="panel__content panel__content--vitals">
                    <StatControl
                      label="HP"
                      value={vitals.hp}
                      helper="Max 102"
                      onChange={updateVital('hp')}
                    />
                    <StatControl
                      label="Temp HP"
                      value={vitals.tempHp}
                      helper="Spore Shield"
                      onChange={updateVital('tempHp')}
                    />
                  </div>
                  <div className="panel__footer">
                    <button className="ghost" type="button" onClick={() => handleRest('shortRest')}>
                      Short Rest
                    </button>
                    <button className="primary" type="button" onClick={() => handleRest('longRest')}>
                      Long Rest
                    </button>
                  </div>
                </div>

                <div className="panel panel--compact panel--tight">
                  <div className="panel__header">
                    <h2>Quick Stats</h2>
                    <span className="panel__tag">At-a-glance</span>
                  </div>
                  <div className="panel__content quick-stats">
                    {quickStats.map((stat) => (
                      <div key={stat.label} className="quick-stat">
                        <div className="quick-stat__value">
                          {statMap?.[stat.key] ?? stat.fallback}
                        </div>
                        <div className="quick-stat__label">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel panel--tight">
                  <div className="panel__header">
                    <h2>Ability Scores</h2>
                    <span className="panel__tag">Core</span>
                  </div>
                  <div className="panel__content ability-grid">
                    {abilities.map((ability) => (
                      <div
                        key={ability.label}
                        className={`ability-card${ability.proficient ? ' ability-card--proficient' : ''}`}
                      >
                        <div className="ability-card__label">{ability.label}</div>
                        <div className="ability-card__score">{ability.score}</div>
                        <div className="ability-card__mod">{ability.mod}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel panel--ammo panel--tight">
                  <div className="panel__header">
                    <h2>Ammo</h2>
                    <span className="panel__tag">Darts & Arrows</span>
                  </div>
                  <div className="panel__content panel__content--ammo">
                    <div className="ammo-group">
                      <div className="ammo-group__title">
                        Blowgun Darts
                        <a className="ammo-link" href="/actions#vanguard-blowgun-1-broken---single-shot">
                          Blowgun Stats
                        </a>
                      </div>
                      <StatControl
                        label="Standard"
                        value={vitals.dartStandard}
                        onChange={updateVital('dartStandard')}
                      />
                      <StatControl
                        label="Fire"
                        value={vitals.dartFire}
                        onChange={updateVital('dartFire')}
                      />
                      <StatControl
                        label="Water"
                        value={vitals.dartWater}
                        onChange={updateVital('dartWater')}
                      />
                      <StatControl
                        label="Lava"
                        value={vitals.dartLava}
                        onChange={updateVital('dartLava')}
                      />
                    </div>
                    <div className="ammo-group">
                      <div className="ammo-group__title">
                        Arrows
                        <a className="ammo-link" href="/actions#skywardens-longbow-2">
                          Longbow Stats
                        </a>
                      </div>
                      <StatControl
                        label="Standard"
                        value={vitals.arrowStandard}
                        onChange={updateVital('arrowStandard')}
                      />
                      <StatControl
                        label="Fire"
                        value={vitals.arrowFire}
                        onChange={updateVital('arrowFire')}
                      />
                      <StatControl
                        label="Water"
                        value={vitals.arrowWater}
                        onChange={updateVital('arrowWater')}
                      />
                      <StatControl
                        label="Lava"
                        value={vitals.arrowLava}
                        onChange={updateVital('arrowLava')}
                      />
                    </div>
                  </div>
                </div>

                <div className="panel panel--resources panel--tight">
                  <div className="panel__header">
                    <h2>Wild Shape</h2>
                    <span className="panel__tag">Resource</span>
                  </div>
                  <div className="panel__content">
                    <TrackerGroup
                      title="Wild Shape"
                      items={parseTracker('wild-shape', 'Wild Shape')}
                      onToggle={handleToggle}
                    />
                  </div>
                </div>

                <div className="panel panel--slots panel--tight">
                  <div className="panel__header">
                    <h2>Spell Slots</h2>
                    <span className="panel__tag">Prepared Magic</span>
                  </div>
                  <div className="panel__content">
                    <div className="tracker-grid tracker-grid--compact">
                      <TrackerGroup
                        title="1st Level Slots"
                        items={parseTracker('slots-1st', '1st')}
                        onToggle={handleToggle}
                      />
                      <TrackerGroup
                        title="2nd Level Slots"
                        items={parseTracker('slots-2nd', '2nd')}
                        onToggle={handleToggle}
                      />
                      <TrackerGroup
                        title="3rd Level Slots"
                        items={parseTracker('slots-3rd', '3rd')}
                        onToggle={handleToggle}
                      />
                      <TrackerGroup
                        title="4th Level Slots"
                        items={parseTracker('slots-4th', '4th')}
                        onToggle={handleToggle}
                      />
                      <TrackerGroup
                        title="5th Level Slots"
                        items={parseTracker('slots-5th', '5th')}
                        onToggle={handleToggle}
                      />
                      <TrackerGroup
                        title="6th Level Slots"
                        items={parseTracker('slots-6th', '6th')}
                        onToggle={handleToggle}
                      />
                    </div>
                  </div>
                </div>

                <div className="panel panel--resources panel--tight">
                  <div className="panel__header">
                    <h2>Limited Uses</h2>
                    <span className="panel__tag">Long Rest</span>
                  </div>
                  <div className="panel__content">
                    <div className="tracker-grid tracker-grid--compact">
                      <TrackerGroup
                        title="Active Camo"
                        items={parseTracker('active-camo', 'Active Camo')}
                        onToggle={handleToggle}
                      />
                      <TrackerGroup
                        title="Fungal Infestation"
                        items={parseTracker('fungal-infestation', 'Fungal Infestation')}
                        onToggle={handleToggle}
                      />
                      <TrackerGroup
                        title="Song of the Grung"
                        items={parseTracker('song-grung', 'Song of the Grung')}
                        onToggle={handleToggle}
                      />
                      <div className="tracker-meta">
                        <label>
                          Song of the Grung last used
                          <select
                            value={trackers?.[`${timeOfDayMap.songGrung}-last-used`] || ''}
                            onChange={(event) =>
                              updateTimeOfDay(timeOfDayMap.songGrung, event.target.value)
                            }
                          >
                            <option value="">Select time</option>
                            {timeOfDayOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                      <TrackerGroup
                        title="Misty Step (Free)"
                        items={parseTracker('fey-misty-step', 'Misty Step')}
                        onToggle={handleToggle}
                      />
                      <TrackerGroup
                        title="Hunter's Mark (Free)"
                        items={parseTracker('fey-hunters-mark', "Hunter's Mark")}
                        onToggle={handleToggle}
                      />
                    </div>
                  </div>
                </div>

                <div className="panel panel--skills panel--tight">
                  <div className="panel__header">
                    <h2>Skills</h2>
                    <span className="panel__tag">Proficiency</span>
                  </div>
                  <div className="panel__content skills-grid">
                    {skillGroups.map((group) => (
                      <div key={group.label} className="skill-group">
                        <div className="skill-group__title">{group.label}</div>
                        {group.skills.map((skill) => (
                          <div
                            key={skill.key}
                            className={`skill-row${skill.proficient ? ' skill-row--pro' : ''}`}
                          >
                            <span>{skill.label}</span>
                            <span>{getSkillValue(skill.key)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="panel panel--features panel--tight">
                  <div className="panel__header">
                    <h2>Ranger Features</h2>
                    <span className="panel__tag">Class</span>
                  </div>
                  <div className="panel__content">
                    <div className="feature-row">
                      <strong>Favored Enemy</strong>
                      <span>Snakes/Yuan-ti, Orcs</span>
                    </div>
                    <div className="feature-row">
                      <strong>Natural Explorer</strong>
                      <span>Swamp & Forest</span>
                    </div>
                    <div className="feature-row">
                      <strong>Gloom Stalker</strong>
                      <span>Dread Ambusher, Umbral Sight</span>
                    </div>
                  </div>
                </div>

                <div className="panel panel--features panel--tight">
                  <div className="panel__header">
                    <h2>Poison Skin</h2>
                    <span className="panel__tag">Passive</span>
                  </div>
                  <div className="panel__content">
                    <div className="feature-row">
                      <strong>Save DC</strong>
                      <span>{statMap?.['poison-skin-dc'] ?? '17'}</span>
                    </div>
                    <div className="feature-row">
                      <strong>Effect</strong>
                      <span>Poisoned for 1 min on contact</span>
                    </div>
                    <div className="feature-row">
                      <strong>Last Triggered</strong>
                      <select
                        value={trackers?.[`${timeOfDayMap.poisonSkin}-last-used`] || ''}
                        onChange={(event) =>
                          updateTimeOfDay(timeOfDayMap.poisonSkin, event.target.value)
                        }
                      >
                        <option value="">Select time</option>
                        {timeOfDayOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </section>
            }
          />
          <Route
            path="/stats"
            element={<MarkdownPage title="Basic Stats" source="/content/Basic Stats.md" />}
          />
          <Route
            path="/actions"
            element={<MarkdownPage title="Actions" source="/content/Actions.md" />}
          />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route
            path="/spells"
            element={
              <section className="page-panel">
                <header className="page-panel__header">
                  <div>
                    <h2>Spells & Magic Abilities</h2>
                    <p>Track spell slots and limited-use abilities.</p>
                  </div>
                </header>
                <div className="page-panel__content">
                  <MarkdownPage
                    title=""
                    source="/content/Spells and Magic Abilities.md"
                    variant="embedded"
                  />
                </div>
              </section>
            }
          />
          <Route
            path="/features"
            element={<MarkdownPage title="Class Features" source="/content/Class Features.md" />}
          />
          <Route
            path="/racial-traits"
            element={<MarkdownPage title="Racial Traits" source="/content/Racial Traits.md" />}
          />
          <Route
            path="/backstory"
            element={<MarkdownPage title="Backstory" source="/content/Backstory.md" />}
          />
          <Route
            path="/images"
            element={
              <section className="page-panel">
                <header className="page-panel__header">
                  <h2>Images</h2>
                </header>
                <div className="image-grid">
                  {[
                    { src: '/content-images/1-Front.png', label: 'Front' },
                    { src: '/content-images/2-Side.png', label: 'Side' },
                    { src: '/content-images/3-Back.png', label: 'Back' },
                    { src: '/content-images/4-Flying.png', label: 'Flying' },
                  ].map((image) => (
                    <button
                      key={image.src}
                      className="image-tile"
                      onClick={() => window.open(image.src, '_blank')}
                      type="button"
                    >
                      <img src={image.src} alt={image.label} />
                      <span>{image.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App