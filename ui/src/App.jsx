import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { useEffect, useMemo, useRef, useState } from 'react'
import './themes.css'
import './App.css'
import ribbitzPortrait from './assets/ribbitz-flying.png'
import MarkdownPage from './components/MarkdownPage.jsx'
import InventoryPage from './pages/InventoryPage.jsx'
import LevelUpPage from './pages/LevelUpPage.jsx'
import DashboardCanvas from './dashboard/DashboardCanvas.jsx'
import SkillsPanel from './panels/SkillsPanel.jsx'
import PrimaryPanel from './panels/PrimaryPanel.jsx'
import ExhaustionPanel from './panels/ExhaustionPanel.jsx'
import MagicPanel from './panels/MagicPanel.jsx'
import AttackPanel from './panels/AttackPanel.jsx'
import InventoryPanel from './panels/InventoryPanel.jsx'
import GrungPanel from './panels/GrungPanel.jsx'
import TrackerGroup from './components/TrackerGroup.jsx'
import StatControl from './components/StatControl.jsx'
import ThemeSwitcher from './components/ThemeSwitcher.jsx'
import { slugifyHeading } from './utils/slugifyHeading.js'
import { cycleTriState } from './lib/triState.js'
import { parsePreparedSpellsIndex, parseMagicAbilitiesIndex } from './lib/markdownParsers.js'

const sheetUrl =
  'https://docs.google.com/spreadsheets/d/1Vn1Xaq04AWDrrdz-RGO8m6V7SzuFyHrW31e47fnH2v0'
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '')
const CONTENT_BASE = import.meta.env.BASE_URL || '/'
const apiFetch = (path, init) => fetch(`${API_BASE}${path}`, init)
const contentPath = (file) => `${CONTENT_BASE}content/${file}`
const contentImagePath = (file) => `${CONTENT_BASE}content-images/${file}`

const inventoryCacheKey = 'ribbitz.inventoryCache'
const pendingInventoryKey = 'ribbitz.inventoryPending'
const syncModeKey = 'ribbitz.syncMode'
const syncOnDurationMs = 6 * 60 * 60 * 1000
const syncOffIntervalMs = 6 * 60 * 60 * 1000
const syncOnIntervalMs = 30 * 1000
const inventorySaveDebounceMs = 300

function readJsonStorage(key, fallback) {
  try {
    const saved = window.localStorage.getItem(key)
    if (!saved) return fallback
    return JSON.parse(saved) ?? fallback
  } catch {
    return fallback
  }
}

function writeJsonStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore
  }
}

function readSyncMode() {
  const saved = readJsonStorage(syncModeKey, {})
  const expiresAt = Number(saved?.expiresAt) || 0
  return {
    enabled: expiresAt > Date.now(),
    expiresAt,
  }
}

const navLinks = [
  { label: 'Dashboard', href: '/' },
  { label: 'Basic Stats', href: '/stats' },
  { label: 'Actions', href: '/actions' },
  { label: 'Inventory', href: '/inventory' },
  { label: 'Spells', href: '/spells' },
  { label: 'Features', href: '/features' },
  { label: 'Racial Traits', href: '/racial-traits' },
  { label: 'Backstory', href: '/backstory' },
  { label: 'Notes', href: '/notes' },
  { label: 'Misc', href: '/misc' },
  { label: 'Images', href: '/images' },
  { label: '⬆️ Level Up', href: '/level-up' },
]

const restDefinitions = {
  shortRest: {
    label: 'Short Rest',
    updates: [{ key: 'wild-shape', value: '2/2' }],
  },
  longRest: {
    label: 'Long Rest',
    updates: [
      { key: 'hp-current', value: '112' },
      { key: 'temp-hp', value: '0' },
      { key: 'symbiotic-active', value: 'No' },
      { key: 'symbiotic-temp-hp', value: '0' },
      { key: 'slots-1st', value: '4/4' },
      { key: 'slots-2nd', value: '3/3' },
      { key: 'slots-3rd', value: '3/3' },
      { key: 'slots-4th', value: '3/3' },
      { key: 'slots-5th', value: '2/2' },
      { key: 'slots-6th', value: '1/1' },
      { key: 'wild-shape', value: '2/2' },
      { key: 'active-camo', value: '6/6' },
      { key: 'fungal-infestation', value: '4/4' },
      { key: 'song-grung', value: '1/1' },
      { key: 'fey-misty-step', value: '1/1' },
      { key: 'fey-hunters-mark', value: '1/1' },
      { key: 'poison-weapon', value: '6/6' },
      { key: 'tongue-grapple', value: '6/6' },
      { key: 'dart-sleep', value: '1/1' },
      { key: 'dart-paralyze', value: '1/1' },
      { key: 'dart-purple', value: '6/6' },
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
  dartPoison: 'dart-poison',
  arrowStandard: 'arrow-standard',
  arrowFire: 'arrow-fire',
  arrowWater: 'arrow-water',
  arrowLava: 'arrow-lava',
  arrowPoison: 'arrow-poison',
}

const statUpdateMetadata = {
  inspiration: {
    label: 'Inspiration',
    type: 'resource',
    outputFile: 'inspiration.txt',
  },
  'symbiotic-active': {
    label: 'Symbiotic Entity Active',
    type: 'features',
    outputFile: 'symbiotic-active.txt',
  },
  'symbiotic-temp-hp': {
    label: 'Symbiotic Entity Temp HP',
    type: 'features',
    outputFile: 'symbiotic-temp-hp.txt',
  },
}

const potionPoisonPattern = /(potion|poison|venom)/i
const extraPotionPoisonNames = new Set(['Frog Oil (Jar)'])
const combatConsumablesCategory = 'Combat Consumables'
const drugsHerbsCategory = 'Drugs & Herbs'
const healingConsumables = new Set([
  'Healing Potion (Common/Standard)',
  'Healing Potion (Greater)',
  'Healing Potion (Superior)',
  'Healing Potion (Supreme)',
  'Golden Elixir',
  'Frog Salve Meds',
])
const pondPoppersName = 'Pond Poppers (x5)'
const standardBlowgunDartsName = 'Blowgun Darts'
const standardArrowsName = 'Arrows'

function parseSignedInt(value, fallback = 0) {
  if (value == null) return fallback
  const cleaned = String(value).trim().replace(/[^0-9-]+/g, '')
  const parsed = Number.parseInt(cleaned, 10)
  return Number.isNaN(parsed) ? fallback : parsed
}

// Compact "topic" row: name + optional roll button, click to expand full
// text/notes inline below — same interaction as the Prepared Spells list.
function App() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastSync, setLastSync] = useState(null)
  const [trackers, setTrackers] = useState({})
  const [syncMode, setSyncMode] = useState(() => readSyncMode())
  const [inventoryItems, setInventoryItems] = useState(() => {
    const cached = readJsonStorage(inventoryCacheKey, {})
    return Array.isArray(cached?.items) ? cached.items : []
  })
  const [inventoryOnline, setInventoryOnline] = useState(true)
  const [inventoryError, setInventoryError] = useState('')
  const inventorySaveTimers = useRef({})
  const [vitals, setVitals] = useState({
    hp: 61,
    tempHp: 0,
    dartStandard: 60,
    dartFire: 11,
    dartWater: 17,
    dartLava: 5,
    dartPoison: 0,
    arrowStandard: 60,
    arrowFire: 0,
    arrowWater: 0,
    arrowLava: 0,
    arrowPoison: 0,
  })
  const [statMap, setStatMap] = useState({})
  const [expandedSpellKey, setExpandedSpellKey] = useState('')
  const [expandedDrugKey, setExpandedDrugKey] = useState('')
  const [expandedConditionKey, setExpandedConditionKey] = useState('')
  const [localInspiration, setLocalInspiration] = useState(() => {
    try {
      const saved = window.localStorage.getItem('ribbitz.inspiration')
      const parsed = Number(saved)
      return Number.isFinite(parsed) ? parsed : 1
    } catch {
      return 1
    }
  })
  const [preparedSpells, setPreparedSpells] = useState({})
  const [magicAbilities, setMagicAbilities] = useState({})
  const [expandedAbilityKey, setExpandedAbilityKey] = useState('')
  const toggleAbility = (slug) =>
    setExpandedAbilityKey((current) => (current === slug ? '' : slug))

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
    const symbioticTemp = statMap?.['symbiotic-temp-hp'] || '44'
    const spongeMushrooms =
      Number(inventoryItems.find((item) => item.name === 'Sponge Mushrooms')?.quantity) || 0

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
        name: 'Mass Cure Wounds',
        detail: '3d8 + 4 to up to 6 creatures in a 30-ft sphere',
      },
      {
        name: 'Revivify',
        detail: 'Return to life with 1 HP (300gp diamonds)',
      },
      {
        name: 'Sponge Mushrooms',
        detail: `${spongeMushrooms} carried • advantage on Medicine checks`,
        href: '/inventory#sponge-mushrooms',
      },
      {
        name: 'Symbiotic Entity',
        detail: `${symbioticTemp} temp HP (4 × druid level)`,
      },
    ]
  }, [inventoryItems, statMap])

  const statusLabel = useMemo(
    () =>
      isOnline
        ? `ONLINE • Sync ${syncMode.enabled ? 'ON' : 'OFF'}`
        : 'OFFLINE • Changes not saved',
    [isOnline, syncMode.enabled],
  )

  const syncLabel = useMemo(() => {
    if (syncMode.enabled) {
      return `Game sync on until ${new Date(syncMode.expiresAt).toLocaleTimeString()}`
    }
    if (!lastSync && isOnline) {
      return 'Waiting for sheet data...'
    }
    if (!lastSync && !isOnline) {
      return 'Backend offline • Start the sync server'
    }
    if (!isOnline) {
      return `Offline • Snapshot from ${new Date(lastSync).toLocaleTimeString()}`
    }
    return `Last sync: ${new Date(lastSync).toLocaleTimeString()} • auto every 6h`
  }, [isOnline, lastSync, syncMode])

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
      const nextInspiration =
        mapped?.inspiration == null || mapped.inspiration === ''
          ? 1
          : Number(mapped.inspiration) || 0
      if (mapped) {
        mapped.inspiration = nextInspiration
      }
      setLocalInspiration(nextInspiration)
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
        dartPoison: Number(mapped?.[vitalKeyMap.dartPoison]) || prev.dartPoison,
        arrowStandard: Number(mapped?.[vitalKeyMap.arrowStandard]) || prev.arrowStandard,
        arrowFire: Number(mapped?.[vitalKeyMap.arrowFire]) || prev.arrowFire,
        arrowWater: Number(mapped?.[vitalKeyMap.arrowWater]) || prev.arrowWater,
        arrowLava: Number(mapped?.[vitalKeyMap.arrowLava]) || prev.arrowLava,
        arrowPoison: Number(mapped?.[vitalKeyMap.arrowPoison]) || prev.arrowPoison,
      }))
    } catch {
      setIsOnline(false)
    }
  }

  const loadSeedInventory = async () => {
    const seedResponse = await fetch(contentPath('seed-inventory.csv'))
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
      const pending = readJsonStorage(pendingInventoryKey, {})
      const pendingByName = pending && typeof pending === 'object' ? pending : {}
      const remoteItems = payload.items || []
      const items = remoteItems.map((item) => pendingByName[item.name] || item)
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

  const saveInventoryItem = async (item) => {
    if (!inventoryOnline || !item?.name) {
      return
    }
    try {
      await apiFetch('/inventory/item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item }),
      })
      const pending = readJsonStorage(pendingInventoryKey, {})
      if (pending?.[item.name]) {
        delete pending[item.name]
        writeJsonStorage(pendingInventoryKey, pending)
      }
    } catch {
      setInventoryOnline(false)
      setInventoryError('Inventory update failed: saved locally and will retry on next sync.')
    }
  }

  const queueInventoryItemSave = (item) => {
    if (!item?.name) return
    const pending = readJsonStorage(pendingInventoryKey, {})
    pending[item.name] = item
    writeJsonStorage(pendingInventoryKey, pending)
    window.clearTimeout(inventorySaveTimers.current[item.name])
    inventorySaveTimers.current[item.name] = window.setTimeout(() => {
      saveInventoryItem(item)
    }, inventorySaveDebounceMs)
  }

  const flushPendingInventorySaves = async () => {
    const pending = readJsonStorage(pendingInventoryKey, {})
    const items = Object.values(pending || {})
    if (!items.length) return
    await Promise.all(items.map((item) => saveInventoryItem(item)))
  }

  useEffect(() => {
    fetchStats()
    flushPendingInventorySaves().finally(fetchInventory)
  }, [])

  useEffect(() => {
    if (inventoryItems.length) {
      writeJsonStorage(inventoryCacheKey, {
        items: inventoryItems,
        updatedAt: new Date().toISOString(),
      })
    }
  }, [inventoryItems])

  useEffect(() => {
    const nextMode = readSyncMode()
    if (nextMode.enabled !== syncMode.enabled || nextMode.expiresAt !== syncMode.expiresAt) {
      setSyncMode(nextMode)
    }

    const interval = window.setInterval(() => {
      const currentMode = readSyncMode()
      setSyncMode(currentMode)
      fetchStats()
      flushPendingInventorySaves().finally(fetchInventory)
    }, syncMode.enabled ? syncOnIntervalMs : syncOffIntervalMs)

    let expiryTimer
    if (syncMode.enabled) {
      expiryTimer = window.setTimeout(() => {
        writeJsonStorage(syncModeKey, { expiresAt: 0 })
        setSyncMode({ enabled: false, expiresAt: 0 })
      }, Math.max(0, syncMode.expiresAt - Date.now()))
    }

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(expiryTimer)
    }
  }, [syncMode.enabled, syncMode.expiresAt])

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
    try {
      window.localStorage.setItem('ribbitz.inspiration', String(localInspiration))
    } catch {
      // ignore
    }
  }, [localInspiration])

  useEffect(() => {
    let cancelled = false
    fetch(contentPath('Spells and Magic Abilities.md'))
      .then((response) => response.text())
      .then((text) => {
        if (cancelled) return
        setPreparedSpells(parsePreparedSpellsIndex(text))
        setMagicAbilities(parseMagicAbilitiesIndex(text))
      })
      .catch(() => {
        if (cancelled) return
        setPreparedSpells({})
        setMagicAbilities({})
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
    setStatMap((prev) => ({
      ...(prev || {}),
      [key]: nextValue,
    }))
    if (key === 'inspiration') {
      setLocalInspiration(Number(nextValue) || 0)
    }
    if (!isOnline) {
      return
    }
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
    setStatMap((prev) => ({ ...(prev || {}), ...nextMap }))
    await apiFetch('/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        updates: updates.map((update) => ({
          ...update,
          ...(statUpdateMetadata[update.key] || {}),
        })),
      }),
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
        hp: 112,
        tempHp: 0,
      }))
    }
    await applyBulkUpdates(definition.updates)
  }

  const symbioticActive = String(statMap?.['symbiotic-active'] || 'No').toLowerCase() === 'yes'
  const symbioticTempHp = Number(statMap?.['symbiotic-temp-hp']) || 0

  const updateSymbioticEntity = async (active, tempHp = active ? 44 : 0) => {
    await applyBulkUpdates([
      { key: 'symbiotic-active', value: active ? 'Yes' : 'No' },
      { key: 'symbiotic-temp-hp', value: String(Math.max(0, tempHp)) },
    ])
  }

  const stepSymbioticTempHp = async (delta) => {
    if (!symbioticActive) {
      return
    }
    const nextTempHp = Math.max(0, symbioticTempHp + delta)
    await updateSymbioticEntity(nextTempHp > 0, nextTempHp)
  }

  const updateTimeOfDay = async (resourceKey, nextValue) => {
    const sheetKey = `${resourceKey}-last-used`
    await applyBulkUpdates([{ key: sheetKey, value: nextValue }])
  }

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
      queueInventoryItemSave(next[index])
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
      queueInventoryItemSave(next[index])
      return next
    })
  }

  const handleToggle = (item) => {
    const nextCurrent = item.active ? item.current - 1 : item.current + 1
    const clamped = Math.max(0, Math.min(item.total, nextCurrent))
    updateTracker(item.key, clamped, item.total)
  }

  const inspirationValue = useMemo(
    () => Number(statMap?.inspiration ?? localInspiration ?? 0) || 0,
    [localInspiration, statMap],
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
    const itemsByName = new Map()
    inventoryItems
      .filter((item) => item.category === drugsHerbsCategory)
      .forEach((item) => {
        if (item.name && !itemsByName.has(item.name)) {
          itemsByName.set(item.name, item)
        }
      })
    return Array.from(itemsByName.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [inventoryItems])

  const pondPoppersQuantity = getInventoryQuantity(pondPoppersName, 0)
  const standardBlowgunDartsQuantity = getInventoryQuantity(standardBlowgunDartsName, 60)
  const standardArrowsQuantity = getInventoryQuantity(standardArrowsName, 60)

  const toggleSyncMode = () => {
    if (syncMode.enabled) {
      const nextMode = { enabled: false, expiresAt: 0 }
      writeJsonStorage(syncModeKey, { expiresAt: 0 })
      setSyncMode(nextMode)
      return
    }
    const expiresAt = Date.now() + syncOnDurationMs
    const nextMode = { enabled: true, expiresAt }
    writeJsonStorage(syncModeKey, { expiresAt })
    setSyncMode(nextMode)
    fetchStats()
    flushPendingInventorySaves().finally(fetchInventory)
  }

  const syncNow = () => {
    fetchStats()
    flushPendingInventorySaves().finally(fetchInventory)
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
            <div className="subtitle">Ranger 6 / Druid 11 • Level 17</div>
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
            <button className="ghost" onClick={syncNow}>
              Sync Now
            </button>
            <a className="primary" href={sheetUrl} target="_blank" rel="noreferrer">
              Open Sheet
            </a>
          </div>
          <button
            className={`sync-toggle ${syncMode.enabled ? 'sync-toggle--on' : ''}`}
            type="button"
            onClick={toggleSyncMode}
          >
            Sync {syncMode.enabled ? 'ON' : 'OFF'}
          </button>
          <ThemeSwitcher characterId="ribbitz" />
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
              <DashboardCanvas
                characterId="ribbitz"
                panels={[
                  {
                    id: 'primary',
                    title: 'Currency / Quick Stats / Vitality',
                    layout: { x: 0, y: 0, w: 6, h: 52 },
                    component: (
                      <PrimaryPanel
                        statMap={statMap}
                        vitals={vitals}
                        symbioticActive={symbioticActive}
                        symbioticTempHp={symbioticTempHp}
                        inspirationValue={inspirationValue}
                        inventoryOnline={inventoryOnline}
                        inventoryError={inventoryError}
                        healingQuickLinks={healingQuickLinks}
                        deathSaves={deathSaves}
                        getInventoryQuantity={getInventoryQuantity}
                        setInventoryItemValue={setInventoryItemValue}
                        stepInventoryItem={stepInventoryItem}
                        updateStat={updateStat}
                        updateVital={updateVital}
                        stepSymbioticTempHp={stepSymbioticTempHp}
                        handleRest={handleRest}
                        toggleDeathSave={toggleDeathSave}
                      />
                    ),
                  },
                  {
                    id: 'skills',
                    title: 'Skills',
                    layout: { x: 6, y: 0, w: 6, h: 46 },
                    component: <SkillsPanel statMap={statMap} />,
                  },
                  {
                    id: 'exhaustion',
                    title: 'Potions & Poisons / Exhaustion / Conditions / Ranger Features',
                    layout: { x: 0, y: 52, w: 6, h: 46 },
                    component: (
                      <ExhaustionPanel
                        potionPoisonItems={potionPoisonItems}
                        inventoryOnline={inventoryOnline}
                        stepInventoryItem={stepInventoryItem}
                        setInventoryItemValue={setInventoryItemValue}
                        exhaustionLevel={exhaustionLevel}
                        setExhaustionFromSlot={setExhaustionFromSlot}
                        conditions={conditions}
                        toggleCondition={toggleCondition}
                        expandedConditionKey={expandedConditionKey}
                        setExpandedConditionKey={setExpandedConditionKey}
                      />
                    ),
                  },
                  {
                    id: 'magic',
                    title: 'Spell Slots / Prepared Spells / Other Magical Abilities',
                    layout: { x: 6, y: 46, w: 6, h: 80 },
                    component: (
                      <MagicPanel
                        statMap={statMap}
                        trackers={trackers}
                        parseTracker={parseTracker}
                        handleToggle={handleToggle}
                        preparedSpells={preparedSpells}
                        expandedSpellKey={expandedSpellKey}
                        setExpandedSpellKey={setExpandedSpellKey}
                        magicAbilities={magicAbilities}
                        expandedAbilityKey={expandedAbilityKey}
                        toggleAbility={toggleAbility}
                        symbioticActive={symbioticActive}
                        symbioticTempHp={symbioticTempHp}
                        updateSymbioticEntity={updateSymbioticEntity}
                        timeOfDayMap={timeOfDayMap}
                        timeOfDayOptions={timeOfDayOptions}
                        updateTimeOfDay={updateTimeOfDay}
                      />
                    ),
                  },
                  {
                    id: 'attack',
                    title: 'Weapons / Ammo',
                    layout: { x: 0, y: 98, w: 6, h: 46 },
                    component: (
                      <AttackPanel
                        statMap={statMap}
                        vitals={vitals}
                        updateVital={updateVital}
                        setInventoryItemValue={setInventoryItemValue}
                        standardBlowgunDartsQuantity={standardBlowgunDartsQuantity}
                        standardArrowsQuantity={standardArrowsQuantity}
                        pondPoppersQuantity={pondPoppersQuantity}
                      />
                    ),
                  },
                  {
                    id: 'inventory-panel',
                    title: 'Drugs & Herbs',
                    layout: { x: 6, y: 98, w: 6, h: 30 },
                    component: (
                      <InventoryPanel
                        drugsHerbsList={drugsHerbsList}
                        expandedDrugKey={expandedDrugKey}
                        setExpandedDrugKey={setExpandedDrugKey}
                        drugStatuses={drugStatuses}
                        toggleDrugHerb={toggleDrugHerb}
                      />
                    ),
                  },
                  {
                    id: 'grung',
                    title: 'Grung Abilities',
                    layout: { x: 6, y: 128, w: 6, h: 30 },
                    component: <GrungPanel statMap={statMap} parseTracker={parseTracker} handleToggle={handleToggle} />,
                  },
                ]}
              />
            }
          />
          <Route
            path="/stats"
            element={<MarkdownPage title="Basic Stats" source={contentPath('Basic Stats.md')} />}
          />
          <Route
            path="/actions"
            element={<MarkdownPage title="Actions" source={contentPath('Actions.md')} />}
          />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/level-up" element={<LevelUpPage />} />
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
                    source={contentPath('Spells and Magic Abilities.md')}
                    variant="embedded"
                  />
                </div>
              </section>
            }
          />
          <Route
            path="/features"
            element={<MarkdownPage title="Class Features" source={contentPath('Class Features.md')} />}
          />
          <Route
            path="/racial-traits"
            element={<MarkdownPage title="Racial Traits" source={contentPath('Racial Traits.md')} />}
          />
          <Route
            path="/backstory"
            element={<MarkdownPage title="Backstory" source={contentPath('Backstory.md')} />}
          />
          <Route
            path="/notes"
            element={<MarkdownPage title="Notes" source={contentPath('Notes.md')} />}
          />
          <Route
            path="/misc"
            element={<MarkdownPage title="Misc" source={contentPath('Misc.md')} />}
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
                    { src: contentImagePath('1-Front.png'), label: 'Front' },
                    { src: contentImagePath('2-Side.png'), label: 'Side' },
                    { src: contentImagePath('3-Back.png'), label: 'Back' },
                    { src: contentImagePath('4-Flying.png'), label: 'Flying' },
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
