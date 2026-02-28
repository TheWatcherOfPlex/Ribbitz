import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import './App.css'
import ribbitzPortrait from './assets/ribbitz-flying.png'
import MarkdownPage from './components/MarkdownPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import TrackerGroup from './components/TrackerGroup.jsx'
import { slugifyHeading } from './utils/slugifyHeading.js'

const sheetUrl =
  'https://docs.google.com/spreadsheets/d/1Vn1Xaq04AWDrrdz-RGO8m6V7SzuFyHrW31e47fnH2v0'
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '')
const apiFetch = (path, init) => fetch(`${API_BASE}${path}`, init)

const navLinks = [
  { label: 'Dashboard', href: '/' },
  { label: 'Basic Stats', href: '/stats' },
  { label: 'Actions', href: '/actions' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Spells', href: '/spells' },
  { label: 'Features', href: '/features' },
  { label: 'Racial Traits', href: '/racial-traits' },
  { label: 'Backstory', href: '/backstory' },
  { label: 'Misc', href: '/misc' },
  { label: 'Images', href: '/images' },
]

const quickStats = [
  { label: 'AC', key: 'ac', fallback: '19' },
  { label: 'Initiative', key: 'initiative', fallback: '+5' },
  { label: 'Speed', key: 'speed', fallback: '25 ft' },
  { label: 'Proficiency', key: 'proficiency', fallback: '+5' },
  { label: 'Darkvision', key: 'darkvision', fallback: '90 ft' },
  { label: 'Passive Perception', key: 'passive-perception', fallback: '19' },
  { label: 'Spell Save DC', key: 'spell-dc', fallback: '17' },
  { label: 'Spell Attack', key: 'spell-attack', fallback: '+9' },
  { label: 'Size', key: 'size', fallback: `Small (4' 0", 55 lbs)` },
]

const abilities = [
  { label: 'STR', key: 'str', modKey: 'str-mod', saveKey: 'save-str', proficient: false },
  { label: 'DEX', key: 'dex', modKey: 'dex-mod', saveKey: 'save-dex', proficient: true },
  { label: 'CON', key: 'con', modKey: 'con-mod', saveKey: 'save-con', proficient: false },
  { label: 'INT', key: 'int', modKey: 'int-mod', saveKey: 'save-int', proficient: false },
  { label: 'WIS', key: 'wis', modKey: 'wis-mod', saveKey: 'save-wis', proficient: true },
  { label: 'CHA', key: 'cha', modKey: 'cha-mod', saveKey: 'save-cha', proficient: false },
]

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

const exhaustionEffects = [
  { level: 1, effect: 'Disadvantage on ability checks' },
  { level: 2, effect: 'Speed halved' },
  { level: 3, effect: 'Disadvantage on attack rolls and saving throws' },
  { level: 4, effect: 'Hit point maximum halved' },
  { level: 5, effect: 'Speed reduced to 0' },
  { level: 6, effect: 'Death' },
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
      {
        label: 'Nature (Preferred Terrain)',
        key: 'skill-nature-terrain',
        proficient: true,
      },
      { label: 'Religion', key: 'skill-religion', proficient: false },
    ],
  },
  {
    label: 'Wisdom',
    skills: [
      { label: 'Animal Handling', key: 'skill-animal-handling', proficient: false },
      { label: 'Insight', key: 'skill-insight', proficient: false },
      { label: 'Medicine', key: 'skill-medicine', proficient: true },
      {
        label: 'Medicine (Preferred Terrain)',
        key: 'skill-medicine-terrain',
        proficient: true,
      },
      { label: 'Perception', key: 'skill-perception', proficient: true },
      {
        label: 'Perception (Preferred Terrain)',
        key: 'skill-perception-terrain',
        proficient: true,
      },
      { label: 'Survival', key: 'skill-survival', proficient: true },
      {
        label: 'Survival (Preferred Terrain)',
        key: 'skill-survival-terrain',
        proficient: true,
      },
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
      { key: 'hp-current', value: '102' },
      { key: 'temp-hp', value: '0' },
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

const spellLevelOrder = ['Cantrips', '1st', '2nd', '3rd', '4th', '5th', '6th']

const potionDefinitions = [
  {
    name: 'Healing Potion (Common/Standard)',
    label: 'Common',
    detail: '2d4+2',
  },
  { name: 'Healing Potion (Greater)', label: 'Greater', detail: '4d4+4' },
  { name: 'Healing Potion (Superior)', label: 'Superior', detail: '8d4+8' },
  { name: 'Healing Potion (Supreme)', label: 'Supreme', detail: '10d4+20' },
  { name: 'Golden Elixir', label: 'Golden', detail: 'Full +10 temp' },
  { name: 'Frog Salve Meds', label: 'Frog Salve', detail: 'Grung heal' },
]

const statUpdateMetadata = {
  inspiration: {
    label: 'Inspiration',
    type: 'resource',
    outputFile: 'inspiration.txt',
  },
}

const potionPoisonPattern = /(potion|poison|venom)/i
const extraPotionPoisonNames = new Set(['Frog Oil (Jar)'])
const combatConsumablesCategory = 'Combat Consumables'
const drugsHerbsCategory = 'Drugs & Herbs (16 items)'
const healingConsumables = new Set([
  'Healing Potion (Common/Standard)',
  'Healing Potion (Greater)',
  'Healing Potion (Superior)',
  'Healing Potion (Supreme)',
  'Golden Elixir',
  'Frog Salve Meds',
])
const pondPoppersName = 'Pond Poppers (x5)'
const pondPoppersSlug = slugifyHeading(pondPoppersName)

function parseSignedInt(value, fallback = 0) {
  if (value == null) return fallback
  const cleaned = String(value).trim().replace(/[^0-9-]+/g, '')
  const parsed = Number.parseInt(cleaned, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

function stripHtml(text) {
  return String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePreparedSpellsIndex(markdownText) {
  const normalized = String(markdownText || '').replace(/\r\n/g, '\n')
  const index = {}

  // Find each level section (summary/h2)
  const sectionRegex = /<summary><h2>([\s\S]*?)<\/h2><\/summary>/g
  const sections = []
  let match
  while ((match = sectionRegex.exec(normalized))) {
    sections.push({
      titleHtml: match[1],
      start: match.index,
      end: sectionRegex.lastIndex,
    })
  }

  for (let i = 0; i < sections.length; i += 1) {
    const current = sections[i]
    const next = sections[i + 1]
    const block = normalized.slice(current.end, next?.start ?? normalized.length)

    const title = stripHtml(current.titleHtml)
    const cantrip = /cantrips/i.test(title)
    const levelMatch = title.match(/(\d)(?:st|nd|rd|th)\s+level\s+spells/i)

    if (!cantrip && !levelMatch) {
      continue
    }

    const levelLabel = cantrip ? 'Cantrips' : `${levelMatch[1]}${levelMatch[1] === '1' ? 'st' : levelMatch[1] === '2' ? 'nd' : levelMatch[1] === '3' ? 'rd' : 'th'}`

    const spellRegex = /<summary><h3>([\s\S]*?)<\/h3><\/summary>/g
    const spells = []
    let spellMatch
    while ((spellMatch = spellRegex.exec(block))) {
      const spellName = stripHtml(spellMatch[1])
      if (!spellName) continue
      spells.push({
        name: spellName,
        slug: slugifyHeading(spellName),
      })
    }

    if (spells.length) {
      index[levelLabel] = spells
    }
  }

  return index
}

function CounterRow({ label, value, detail, onStep, disabled }) {
  return (
    <div className="counter-row">
      <div className="counter-row__meta">
        <div className="counter-row__label">{label}</div>
        {detail && <div className="counter-row__detail">{detail}</div>}
      </div>
      <div className="counter-row__controls">
        <button
          className="counter-row__btn"
          type="button"
          onClick={() => onStep(-1)}
          disabled={disabled}
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <div className="counter-row__value" aria-label={`${label} value`}>
          {value}
        </div>
        <button
          className="counter-row__btn"
          type="button"
          onClick={() => onStep(1)}
          disabled={disabled}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  )
}

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

  const accentClass = accent
    ? accent === true
      ? 'stat-control--accent'
      : `stat-control--${accent}`
    : ''

  return (
    <div className={`stat-control${accentClass ? ` ${accentClass}` : ''}`}>
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

function triStateClass(value) {
  if (value === 1) return 'is-green'
  if (value === 2) return 'is-red'
  return 'is-neutral'
}

function cycleTriState(value) {
  const numeric = Number(value) || 0
  return (numeric + 1) % 3
}

function App() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [trackers, setTrackers] = useState({})
  const [inventoryItems, setInventoryItems] = useState([])
  const [inventoryOnline, setInventoryOnline] = useState(true)
  const [inventoryError, setInventoryError] = useState('')
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
  const [preparedSpells, setPreparedSpells] = useState({})

  const [deathSaves, setDeathSaves] = useState(() => {
    try {
      const saved = window.localStorage.getItem('ribbitz.deathSaves')
      const parsed = JSON.parse(saved)
      if (Array.isArray(parsed) && parsed.length === 6) {
        return parsed
      }
    } catch {
      // ignore
    }
    return Array.from({ length: 6 }).map(() => 0)
  })

  const [exhaustionLevel, setExhaustionLevel] = useState(() => {
    try {
      const saved = window.localStorage.getItem('ribbitz.exhaustionLevel')
      const parsed = Number(saved)
      return Number.isFinite(parsed) ? Math.max(0, Math.min(6, parsed)) : 0
    } catch {
      return 0
    }
  })

  const [conditions, setConditions] = useState(() => {
    try {
      const saved = window.localStorage.getItem('ribbitz.conditions')
      const parsed = JSON.parse(saved)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })

  const [drugStatuses, setDrugStatuses] = useState(() => {
    try {
      const saved = window.localStorage.getItem('ribbitz.drugsHerbs')
      const parsed = JSON.parse(saved)
      return parsed && typeof parsed === 'object' ? parsed : {}
    } catch {
      return {}
    }
  })

  const healingQuickLinks = useMemo(() => {
    const wisMod = parseSignedInt(statMap?.['wis-mod'], 4)
    const symbioticTemp = statMap?.['symbiotic-temp-hp'] || '36'

    return [
      {
        name: 'Cure Wounds',
        detail: `1d8 + ${wisMod} (upcast +1d8/slot)`,
      },
      {
        name: 'Healing Spirit (Concentration)',
        detail: `1d6 per trigger • ${1 + wisMod} heals (2nd slot) • upcast +1d6/slot`,
      },
      {
        name: 'Goodberry',
        detail: '10 berries • 1 HP each',
      },
      {
        name: 'Lesser Restoration',
        detail: 'Ends 1 disease or condition (blind/deaf/paralyze/poison)',
      },
      {
        name: 'Revivify',
        detail: 'Return to life with 1 HP (300gp diamonds)',
      },
      {
        name: 'Symbiotic Entity',
        detail: `${symbioticTemp} temp HP (4 × druid level)`,
      },
    ]
  }, [statMap])

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
      const response = await apiFetch('/stats')
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
    } catch {
      setIsOnline(false)
    }
  }

  const loadSeedInventory = async () => {
    const seedResponse = await fetch('/content/seed-inventory.csv')
    if (!seedResponse.ok) {
      throw new Error('Seed inventory load failed')
    }
    const csvText = await seedResponse.text()
    const [, ...lines] = csvText.split('\n')
    const seeded = lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, quantity, category, weight, notes, imageUrl] = line.split(',')
        const normalizedQty = quantity?.trim()
        return {
          name: name || '',
          quantity: normalizedQty || '1',
          category: category || '',
          weight: weight || '',
          notes: notes || '',
          imageUrl: imageUrl || '',
        }
      })
    return seeded
  }

  const fetchInventory = async () => {
    setInventoryError('')
    try {
      const response = await apiFetch('/inventory')
      if (!response.ok) {
        throw new Error('Inventory API unavailable')
      }
      const payload = await response.json()
      const items = payload.items || []
      setInventoryItems(items)
      setInventoryOnline(true)
      return
    } catch {
      try {
        const seeded = await loadSeedInventory()
        setInventoryItems(seeded)
        setInventoryOnline(false)
        setInventoryError('Inventory offline: using local seed data (changes will not sync).')
      } catch {
        setInventoryItems([])
        setInventoryOnline(false)
        setInventoryError('Inventory offline: unable to load from sheet or seed CSV.')
      }
    }
  }

  const saveInventory = async (items) => {
    if (!inventoryOnline) {
      return
    }
    try {
      await apiFetch('/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
    } catch {
      setInventoryOnline(false)
      setInventoryError('Inventory update failed: backend offline (changes not saved).')
    }
  }

  useEffect(() => {
    fetchStats()
    fetchInventory()
  }, [])

  useEffect(() => {
    try {
      window.localStorage.setItem('ribbitz.deathSaves', JSON.stringify(deathSaves))
    } catch {
      // ignore
    }
  }, [deathSaves])

  useEffect(() => {
    try {
      window.localStorage.setItem('ribbitz.exhaustionLevel', String(exhaustionLevel))
    } catch {
      // ignore
    }
  }, [exhaustionLevel])

  useEffect(() => {
    try {
      window.localStorage.setItem('ribbitz.conditions', JSON.stringify(conditions))
    } catch {
      // ignore
    }
  }, [conditions])

  useEffect(() => {
    try {
      window.localStorage.setItem('ribbitz.drugsHerbs', JSON.stringify(drugStatuses))
    } catch {
      // ignore
    }
  }, [drugStatuses])

  useEffect(() => {
    let cancelled = false
    fetch('/content/Spells and Magic Abilities.md')
      .then((response) => response.text())
      .then((text) => {
        if (cancelled) return
        setPreparedSpells(parsePreparedSpellsIndex(text))
      })
      .catch(() => {
        if (cancelled) return
        setPreparedSpells({})
      })

    return () => {
      cancelled = true
    }
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
    apiFetch('/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: sheetKey, value: nextValue }),
    }).catch(() => {
      setIsOnline(false)
    })
  }

  const updateStat = (key) => (nextValue) => {
    if (!isOnline) {
      return
    }
    setStatMap((prev) => ({
      ...(prev || {}),
      [key]: nextValue,
    }))
    const metadata = statUpdateMetadata[key]
    apiFetch('/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key,
        value: nextValue,
        ...(metadata || {}),
      }),
    }).catch(() => {
      setIsOnline(false)
    })
  }

  const parseTracker = (key, label, options = {}) => {
    const { compact = false, fallback = '' } = options
    const raw = String(trackers?.[key] ?? fallback)
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
    await apiFetch('/stats', {
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
    await apiFetch('/stats', {
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
    if (restKey === 'longRest') {
      setVitals((prev) => ({
        ...prev,
        hp: 102,
        tempHp: 0,
      }))
    }
    await applyBulkUpdates(definition.updates)
  }

  const updateTimeOfDay = async (resourceKey, nextValue) => {
    const sheetKey = `${resourceKey}-last-used`
    await applyBulkUpdates([{ key: sheetKey, value: nextValue }])
  }

  const getSkillValue = (skillKey) => statMap?.[skillKey] || '—'

  const getInventoryQuantity = (itemName, fallback = 0) => {
    const item = inventoryItems.find((row) => row.name === itemName)
    if (!item) {
      return fallback
    }
    const value = Number(item.quantity)
    if (Number.isNaN(value)) {
      return fallback
    }
    return value
  }

  const stepInventoryItem = (itemName, delta) => {
    setInventoryItems((prev) => {
      const next = prev.map((row) => ({ ...row }))
      const index = next.findIndex((row) => row.name === itemName)
      if (index === -1) {
        return prev
      }
      const numeric = Number(next[index].quantity)
      const current = Number.isNaN(numeric) ? 0 : numeric
      const updated = Math.max(0, current + delta)
      next[index].quantity = String(updated)
      saveInventory(next)
      return next
    })
  }

  const setInventoryItemValue = (itemName, nextValue) => {
    setInventoryItems((prev) => {
      const next = prev.map((row) => ({ ...row }))
      const index = next.findIndex((row) => row.name === itemName)
      if (index === -1) {
        return prev
      }
      const numeric = Number(nextValue)
      if (!Number.isFinite(numeric)) {
        return prev
      }
      next[index].quantity = String(Math.max(0, numeric))
      saveInventory(next)
      return next
    })
  }

  const handleToggle = (item) => {
    const nextCurrent = item.active ? item.current - 1 : item.current + 1
    const clamped = Math.max(0, Math.min(item.total, nextCurrent))
    updateTracker(item.key, clamped, item.total)
  }

  const inspirationValue = useMemo(
    () => Number(statMap?.inspiration ?? statMap?.['inspiration'] ?? 0) || 0,
    [statMap],
  )

  const toggleDeathSave = (slotIndex) => {
    setDeathSaves((prev) => {
      const next = [...prev]
      next[slotIndex] = cycleTriState(next[slotIndex])
      return next
    })
  }

  const setExhaustionFromSlot = (slotIndex) => {
    setExhaustionLevel((prev) => {
      const target = slotIndex + 1
      return prev === target ? target - 1 : target
    })
  }

  const toggleCondition = (name) => {
    const slug = slugifyHeading(name)
    setConditions((prev) => ({
      ...prev,
      [slug]: !prev?.[slug],
    }))
  }

  const toggleDrugHerb = (name) => {
    const slug = slugifyHeading(name)
    setDrugStatuses((prev) => ({
      ...prev,
      [slug]: !prev?.[slug],
    }))
  }

  const potionPoisonItems = useMemo(
    () =>
      inventoryItems
        .filter(
          (item) =>
            item.category === combatConsumablesCategory &&
            (potionPoisonPattern.test(item.name) || extraPotionPoisonNames.has(item.name)),
        )
        .filter((item) => !healingConsumables.has(item.name))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [inventoryItems],
  )

  const drugsHerbsList = useMemo(() => {
    const names = inventoryItems
      .filter((item) => item.category === drugsHerbsCategory)
      .map((item) => item.name)
      .filter(Boolean)
    return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b))
  }, [inventoryItems])

  const pondPoppersQuantity = getInventoryQuantity(pondPoppersName, 0)

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
          <div className="sidebar__sync-label">{syncLabel}</div>
          <div className="sidebar__actions">
            <button className="ghost" onClick={fetchStats}>
              Sync Now
            </button>
            <a className="primary" href={sheetUrl} target="_blank" rel="noreferrer">
              Open Sheet
            </a>
          </div>
        </div>
      </aside>

      <main className="main-panel">
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
                  <div className="panel__stack">
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
                            <div className="quick-stat__value">
                              {statMap?.[stat.key] ?? stat.fallback}
                            </div>
                            <div className="quick-stat__label">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="panel__box">
                      <div className="panel__section-title">Vitality</div>
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

                        <div className="vitals-actions">
                          <button
                            className="ghost"
                            type="button"
                            onClick={() => handleRest('shortRest')}
                          >
                            Short Rest
                          </button>
                          <button
                            className="primary"
                            type="button"
                            onClick={() => handleRest('longRest')}
                          >
                            Long Rest
                          </button>
                        </div>
                      </div>

                      <div className="panel__content vitality-healing">
                        <div className="vitality-healing__header">
                          <div className="vitality-healing__title">Healing</div>
                          {!inventoryOnline && (
                            <div className="vitality-healing__badge">Offline</div>
                          )}
                        </div>
                        {inventoryError && (
                          <div className="combat-kit__notice">{inventoryError}</div>
                        )}
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
                              <Link
                                className="healing-spell-row__name"
                                to={`/spells#${slugifyHeading(entry.name)}`}
                              >
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
                            <div className="hit-dice__detail">Ranger 6d10 • Druid 9d8</div>
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
                                      className={`death-save-slot ${triStateClass(
                                        deathSaves[index + 3],
                                      )}`}
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
                </div>

                <div className="panel panel--skills panel--tight">
                  <div className="panel__content abilities-skills">
                    <div className="abilities-skills__abilities">
                      <div className="abilities-skills__subtitle abilities-skills__subtitle--split">
                        Ability Scores
                      </div>
                      <div className="ability-grid">
                        {abilities.map((ability) => (
                          <div
                            key={ability.label}
                            className={`ability-card${
                              ability.proficient ? ' ability-card--proficient' : ''
                            }`}
                          >
                            <div className="ability-card__label">{ability.label}</div>
                            <div className="ability-card__score">{statMap?.[ability.key] ?? '—'}</div>
                            <div className="ability-card__mod">{statMap?.[ability.modKey] ?? '—'}</div>
                            <div className="ability-card__save">Save {statMap?.[ability.saveKey] ?? '—'}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="abilities-skills__skills">
                      <div className="abilities-skills__subtitle">Skills</div>
                      <div className="skills-grid">
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
                  </div>
                </div>

                <div className="panel panel--exhaustion panel--tight">
                  <div className="panel__content exhaustion">
                    <div className="consumables-panel">
                      <div className="consumables-panel__title">Potions &amp; Poisons</div>
                      <div className="consumables-panel__list">
                        {potionPoisonItems.length ? (
                          potionPoisonItems.map((item) => (
                            <div key={item.name} className="consumable-item">
                              <Link
                                className="consumable-item__name"
                                to={`/inventory#${slugifyHeading(item.name)}`}
                              >
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
                                  onChange={(event) =>
                                    setInventoryItemValue(item.name, event.target.value)
                                  }
                                  onBlur={(event) =>
                                    setInventoryItemValue(item.name, event.target.value)
                                  }
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
                          <div className="consumables-panel__empty">
                            No combat potions or poisons loaded.
                          </div>
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
                            className={`exhaustion__slot${
                              exhaustionLevel > index ? ' exhaustion__slot--active' : ''
                            }`}
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
                              className={`exhaustion-effect${
                                exhaustionLevel >= entry.level
                                  ? ' exhaustion-effect--active'
                                  : ''
                              }`}
                            >
                              <span className="exhaustion-effect__level">
                                {entry.level}
                              </span>
                              <span className="exhaustion-effect__text">
                                {entry.effect}
                              </span>
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
                            <div
                              key={condition}
                              className={`conditions__item${
                                conditions?.[slug] ? ' conditions__item--active' : ''
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(conditions?.[slug])}
                                onChange={() => toggleCondition(condition)}
                                aria-label={`Toggle ${condition}`}
                              />
                              <Link className="conditions__link" to={`/misc#${slug}`}>
                                {condition}
                              </Link>
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
                          <Link
                            className="feature-link"
                            to="/features#dread-ambusher-gloom-stalker-3rd-level"
                          >
                            Dread Ambusher
                          </Link>
                          {', '}
                          <Link
                            className="feature-link"
                            to="/features#umbral-sight-gloom-stalker-3rd-level"
                          >
                            Umbral Sight
                          </Link>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel panel--magic panel--tight">
                  <div className="panel__content magic-grid">
                    <div className="magic-section">
                      <div className="magic-section__title">Spell Slots</div>
                      <div className="tracker-grid tracker-grid--compact magic-slots">
                        <TrackerGroup
                          title="1st"
                          items={parseTracker('slots-1st', '1st', { compact: true })}
                          onToggle={handleToggle}
                        />
                        <TrackerGroup
                          title="2nd"
                          items={parseTracker('slots-2nd', '2nd', { compact: true })}
                          onToggle={handleToggle}
                        />
                        <TrackerGroup
                          title="3rd"
                          items={parseTracker('slots-3rd', '3rd', { compact: true })}
                          onToggle={handleToggle}
                        />
                        <TrackerGroup
                          title="4th"
                          items={parseTracker('slots-4th', '4th', { compact: true })}
                          onToggle={handleToggle}
                        />
                        <TrackerGroup
                          title="5th"
                          items={parseTracker('slots-5th', '5th', { compact: true })}
                          onToggle={handleToggle}
                        />
                        <TrackerGroup
                          title="6th"
                          items={parseTracker('slots-6th', '6th', { compact: true })}
                          onToggle={handleToggle}
                        />
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
                                  spellsForLevel.map((spell) => (
                                    <Link
                                      key={`${level}-${spell.slug}`}
                                      className="prepared-spells__link"
                                      to={`/spells#${spell.slug}`}
                                    >
                                      {spell.name}
                                    </Link>
                                  ))
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
                        <TrackerGroup
                          title="Wild Shape"
                          items={parseTracker('wild-shape', 'Wild Shape', { compact: true })}
                          onToggle={handleToggle}
                        />
                        <TrackerGroup
                          title="Fungal Infestation"
                          items={parseTracker('fungal-infestation', 'Fungal', { compact: true })}
                          onToggle={handleToggle}
                        />

                        <TrackerGroup
                          title="Song of the Grung"
                          items={parseTracker('song-grung', 'Song', { compact: true })}
                          onToggle={handleToggle}
                          headerAddon={
                            <label className="tracker-inline">
                              <span>Last used</span>
                              <select
                                value={trackers?.[`${timeOfDayMap.songGrung}-last-used`] || ''}
                                onChange={(event) =>
                                  updateTimeOfDay(timeOfDayMap.songGrung, event.target.value)
                                }
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

                        <TrackerGroup
                          title="Active Camo"
                          items={parseTracker('active-camo', 'Active Camo', { compact: true })}
                          onToggle={handleToggle}
                        />

                        <TrackerGroup
                          title="Misty Step"
                          items={parseTracker('fey-misty-step', 'Misty', { compact: true })}
                          onToggle={handleToggle}
                        />
                        <TrackerGroup
                          title="Hunter's Mark"
                          items={parseTracker('fey-hunters-mark', 'Mark', { compact: true })}
                          onToggle={handleToggle}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel panel--kit panel--tight">
                  <div className="panel__content combat-kit">
                    <div className="combat-kit__section">
                      <div className="combat-kit__title">Weapons</div>

                      <div className="combat-kit__weapon">
                        <Link
                          className="combat-kit__weapon-name"
                          to="/actions#vanguard-blowgun-1-broken---single-shot"
                        >
                          Blowgun +1
                        </Link>
                        <div className="combat-kit__weapon-meta">
                          Hit {statMap?.['blowgun-hit'] ?? '+13'} (Std) •{' '}
                          {statMap?.['blowgun-hit-ss'] ?? '+8'} (Pwr)
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Std {statMap?.['blowgun-dmg'] ?? '1d8'}
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Pwr {statMap?.['blowgun-dmg-ss'] ?? '1d8+10'}
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Elem + {statMap?.['blowgun-elem-dmg'] ?? '1d6'}
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Gloom + {statMap?.['blowgun-gloom-dmg'] ?? '1d8'}
                        </div>
                      </div>

                      <div className="combat-kit__weapon">
                        <Link className="combat-kit__weapon-name" to="/actions#skywardens-longbow-2">
                          Longbow +2
                        </Link>
                        <div className="combat-kit__weapon-meta">
                          Hit {statMap?.['longbow-hit'] ?? '+14'} (Std) •{' '}
                          {statMap?.['longbow-hit-ss'] ?? '+9'} (Pwr)
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Std {statMap?.['longbow-dmg'] ?? '1d10+7'}
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Pwr {statMap?.['longbow-dmg-ss'] ?? '1d10+17'}
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Elem + {statMap?.['longbow-elem-dmg'] ?? '1d6'}
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Gloom + {statMap?.['longbow-gloom-dmg'] ?? '1d8'}
                        </div>
                      </div>

                      <div className="combat-kit__weapon">
                        <Link className="combat-kit__weapon-name" to="/actions#dagger-1-fey-blessing">
                          Dagger +1 - Fey Blessed
                        </Link>
                        <div className="combat-kit__weapon-meta">
                          Hit {statMap?.['dagger-hit'] ?? '+11'}
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Std {statMap?.['dagger-dmg'] ?? '1d4+6'}
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Gloom {statMap?.['dagger-gloom-dmg'] ?? '1d4+6+1d8'}
                        </div>
                      </div>

                      <div className="combat-kit__weapon">
                        <Link
                          className="combat-kit__weapon-name"
                          to="/actions#dagger-non-magical-poison-dipped"
                        >
                          Dagger - Poison Dipped
                        </Link>
                        <div className="combat-kit__weapon-meta">
                          Hit {statMap?.['poison-dagger-hit'] ?? '+10'}
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Std {statMap?.['poison-dagger-dmg'] ?? '1d4+5'}
                        </div>
                        <div className="combat-kit__weapon-meta">
                          Gloom {statMap?.['poison-dagger-gloom-dmg'] ?? '1d4+5+1d8'}
                        </div>
                      </div>
                    </div>

                    <div className="combat-kit__section">
                      <div className="combat-kit__title">Ammo</div>
                      <div className="panel__content--ammo combat-kit__ammo">
                        <div className="ammo-group">
                          <div className="ammo-group__title">Blowgun Darts</div>
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
                          <div className="ammo-group__title">Arrows</div>
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
                        <div className="ammo-group ammo-group--single">
                          <StatControl
                            label="Pond Poppers"
                            value={pondPoppersQuantity}
                            onChange={(nextValue) =>
                              setInventoryItemValue(pondPoppersName, nextValue)
                            }
                          />
                        </div>
                      </div>
                    </div>

                    <div className="combat-kit__section combat-kit__section--wide">
                      <div className="combat-kit__title">Drugs &amp; Herbs</div>
                      <div className="panel__content drugs-panel">
                        {drugsHerbsList.length ? (
                          drugsHerbsList.map((itemName) => {
                            const slug = slugifyHeading(itemName)
                            return (
                              <div
                                key={itemName}
                                className={`drugs-panel__item${
                                  drugStatuses?.[slug] ? ' drugs-panel__item--active' : ''
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={Boolean(drugStatuses?.[slug])}
                                  onChange={() => toggleDrugHerb(itemName)}
                                  aria-label={`Toggle ${itemName}`}
                                />
                                <span className="drugs-panel__name">{itemName}</span>
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
                              value={statMap?.['poison-skin-dc'] ?? '17'}
                              formula="12 + PB (5)"
                              linkTo="/stats#dcs-saves-and-passives"
                            />
                            <GrungDcBlock
                              label="Poison Weapon DC"
                              value={statMap?.['poison-weapon-dc'] ?? '17'}
                              formula="9 + PB (5) + CON mod (3)"
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
                            items={parseTracker('poison-skin', 'Poison', { compact: true, fallback: '5/5' })}
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
            path="/misc"
            element={<MarkdownPage title="Misc" source="/content/Misc.md" />}
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
