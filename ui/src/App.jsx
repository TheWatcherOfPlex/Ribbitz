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
]

const abilities = [
  { label: 'STR', score: 14, mod: '+2' },
  { label: 'DEX', score: 20, mod: '+5' },
  { label: 'CON', score: 16, mod: '+3' },
  { label: 'INT', score: 9, mod: '-1' },
  { label: 'WIS', score: 18, mod: '+4' },
  { label: 'CHA', score: 8, mod: '-1' },
]

const vitalKeyMap = {
  hp: 'hp-current',
  tempHp: 'temp-hp',
  ammo: 'dart-purple',
  arrows: 'longbow-dmg',
  wildShape: 'wild-shape',
}

function StatControl({ label, value, helper, onChange }) {
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
    <div className="stat-control">
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
    ammo: 24,
    arrows: 20,
    wildShape: 2,
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
        ammo: Number(mapped?.[vitalKeyMap.ammo]) || prev.ammo,
        arrows: Number(mapped?.[vitalKeyMap.arrows]) || prev.arrows,
        wildShape: Number(mapped?.[vitalKeyMap.wildShape]) || prev.wildShape,
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

  const parseTracker = (key, label) => {
    const raw = String(trackers?.[key] ?? '')
    const [current, total] = raw.split('/').map((value) => Number(value))
    if (!total) {
      return []
    }
    return Array.from({ length: total }).map((_, index) => ({
      key,
      label: `${label} ${index + 1}`,
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
                <div className="panel panel--primary">
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
                    <StatControl
                      label="Ammo"
                      value={vitals.ammo}
                      helper="Blowgun Darts"
                      onChange={updateVital('ammo')}
                    />
                    <StatControl
                      label="Arrows"
                      value={vitals.arrows}
                      helper="Longbow"
                      onChange={updateVital('arrows')}
                    />
                    <StatControl
                      label="Wild Shape"
                      value={vitals.wildShape}
                      helper="Uses"
                      onChange={updateVital('wildShape')}
                    />
                  </div>
                </div>

                <div className="panel panel--compact">
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

                <div className="panel">
                  <div className="panel__header">
                    <h2>Ability Scores</h2>
                    <span className="panel__tag">Core</span>
                  </div>
                  <div className="panel__content ability-grid">
                    {abilities.map((ability) => (
                      <div key={ability.label} className="ability-card">
                        <div className="ability-card__label">{ability.label}</div>
                        <div className="ability-card__score">{ability.score}</div>
                        <div className="ability-card__mod">{ability.mod}</div>
                      </div>
                    ))}
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
                  <div className="tracker-grid">
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
                    <TrackerGroup
                      title="Wild Shape"
                      items={parseTracker('wild-shape', 'Wild Shape')}
                      onToggle={handleToggle}
                    />
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
                    <TrackerGroup
                      title="Misty Step"
                      items={parseTracker('fey-misty-step', 'Misty Step')}
                      onToggle={handleToggle}
                    />
                    <TrackerGroup
                      title="Hunter's Mark"
                      items={parseTracker('fey-hunters-mark', "Hunter's Mark")}
                      onToggle={handleToggle}
                    />
                  </div>
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