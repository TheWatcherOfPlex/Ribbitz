import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import cron from 'node-cron'
import fs from 'fs/promises'
import path from 'path'

dotenv.config()

const app = express()
const port = process.env.PORT || 5175
const appsScriptUrl = process.env.APPS_SCRIPT_WEBAPP_URL
const snapshotPath = process.env.OFFLINE_SNAPSHOT_PATH || './snapshot.json'
const uiDistPath = process.env.UI_DIST_PATH || path.resolve(process.cwd(), '../dist')
const sophiesDiceBridgeUrl = (
  process.env.SOPHIES_DICE_BRIDGE_URL || 'http://10.0.0.42:5195'
).replace(/\/+$/, '')

const sophieRolls = {
  'skill-athletics': { label: 'Skill - Athletics (+2)', expression: 'd20 + Athletics' },
  'skill-athletics-gloves': { label: 'Skill - Athletics (Swim/Climb) with Gloves (d20 + Athl + GloveBonus = +7)', expression: 'd20 + Athletics + ProficiencyBonus' },
  'skill-acrobatics': { label: 'Skill - Acrobatics (+10)', expression: 'd20 + Acrobatics' },
  'skill-sleight': { label: 'Skill - Sleight of Hand (+5)', expression: 'd20 + Sleight' },
  'skill-stealth': { label: 'Skill - Stealth (+10)', expression: 'd20 + Stealth' },
  'skill-arcana': { label: 'Skill - Arcana (+4)', expression: 'd20 + Arcana' },
  'skill-history': { label: 'Skill - History (-1)', expression: 'd20 + History' },
  'skill-investigation': { label: 'Skill - Investigation (-1)', expression: 'd20 + Investigation' },
  'skill-nature': { label: 'Skill - Nature (+4)', expression: 'd20 + Nature' },
  'skill-nature-terrain': { label: 'Skill - Nature (Natural Explorer) (d20 + Nature + Prof = +9)', expression: 'd20 + Nature + ProficiencyBonus' },
  'skill-religion': { label: 'Skill - Religion (-1)', expression: 'd20 + Religion' },
  'skill-animal-handling': { label: 'Skill - Animal Handling (+4)', expression: 'd20 + AnimalHandling' },
  'skill-insight': { label: 'Skill - Insight (+4)', expression: 'd20 + Insight' },
  'skill-medicine': { label: 'Skill - Medicine (+9)', expression: 'd20 + Medicine' },
  'skill-medicine-terrain': { label: 'Skill - Medicine (Natural Explorer) (d20 + Medicine + Prof = +14)', expression: 'd20 + Medicine + ProficiencyBonus' },
  'skill-perception': { label: 'Skill - Perception (+9)', expression: 'd20 + Perception' },
  'skill-perception-terrain': { label: 'Skill - Perception (Natural Explorer) (d20 + Perception + Prof = +14)', expression: 'd20 + Perception + ProficiencyBonus' },
  'skill-survival': { label: 'Skill - Survival (+9)', expression: 'd20 + Survival' },
  'skill-survival-terrain': { label: 'Skill - Survival (Natural Explorer) (d20 + Surv + Prof = +14)', expression: 'd20 + Survival + ProficiencyBonus' },
  'skill-deception': { label: 'Skill - Deception (-1)', expression: 'd20 + Deception' },
  'skill-intimidation': { label: 'Skill - Intimidation (-1)', expression: 'd20 + Intimidation' },
  'skill-performance': { label: 'Skill - Performance (-1)', expression: 'd20 + Performance' },
  'skill-persuasion': { label: 'Skill - Persuasion (-1)', expression: 'd20 + Persuasion' },
  'ability-str-check': { label: 'Strength Check +2', expression: 'd20 + Strength' },
  'ability-str-save': { label: 'Str Save +2', expression: 'd20 + Strength' },
  'ability-dex-check': { label: 'Dexterity Check +5', expression: 'd20 + Dexterity' },
  'ability-dex-save': { label: 'Dex Save +10', expression: 'd20 + Dexterity + ProficiencyBonus' },
  'ability-con-check': { label: 'Constitution Check +3', expression: 'd20 + Constitution' },
  'ability-con-save': { label: 'Con Save +3', expression: 'd20 + Constitution' },
  'ability-int-check': { label: 'Intelligence Check -1', expression: 'd20 + Intelligence' },
  'ability-int-save': { label: 'Int Save -1', expression: 'd20 + Intelligence' },
  'ability-wis-check': { label: 'Wisdom Check +4', expression: 'd20 + Wisdom' },
  'ability-wis-save': { label: 'Wis Save +9', expression: 'd20 + Wisdom + ProficiencyBonus' },
  'ability-cha-check': { label: 'Charisma Check -1', expression: 'd20 + Charisma' },
  'ability-cha-save': { label: 'Cha Save -1', expression: 'd20 + Charisma' },
  'healing-potion-common': { label: 'Healing Potion - Common (2d4+2)', expression: '2d4 + 2' },
  'healing-potion-greater': { label: 'Healing Potion - Greater (4d4+4)', expression: '4d4 + 4' },
  'healing-potion-superior': { label: 'Healing Potion - Superior (8d4+8)', expression: '8d4 + 8' },
  'healing-potion-supreme': { label: 'Healing Potion - Supreme (10d4+20)', expression: '10d4 + 20' },
  'halo-spores': { label: 'Halo of Spores - DC 17 CON save or 1d8 necrotic', expression: '1d8 necrotic' },
  'halo-spores-symbiotic': { label: 'Halo of Spores - Symbiotic Entity - DC 17 CON save or 2d8 necrotic', expression: '2d8 necrotic' },
  'spreading-spores': { label: 'Spreading Spores - DC 17 CON save or 2d8 necrotic', expression: '2d8 necrotic' },
}

app.use(cors())
app.use(express.json())

const fetchSheetValues = async () => {
  if (!appsScriptUrl) {
    throw new Error('APPS_SCRIPT_WEBAPP_URL is not configured')
  }
  const url = `${appsScriptUrl}?action=getValues`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Apps Script error: ${response.status}`)
  }
  const data = await response.json()
  return data.rows || []
}

const parseRows = (rows) => {
  return rows
    .filter((row) => row.A && !String(row.A).startsWith('=='))
    .map((row) => ({
      label: row.A,
      value: row.B ?? '',
      type: row.C ?? 'custom',
      key: row.D ?? '',
      outputFile: row.E ?? '',
    }))
}

const writeSnapshot = async (stats) => {
  const payload = {
    updatedAt: new Date().toISOString(),
    stats,
  }
  await fs.writeFile(path.resolve(snapshotPath), JSON.stringify(payload, null, 2))
}

const readSnapshot = async () => {
  try {
    const snapshot = await fs.readFile(path.resolve(snapshotPath), 'utf-8')
    return JSON.parse(snapshot)
  } catch {
    return null
  }
}

const fetchInventoryValues = async () => {
  if (!appsScriptUrl) {
    throw new Error('APPS_SCRIPT_WEBAPP_URL is not configured')
  }
  const url = `${appsScriptUrl}?action=getValues&sheet=Inventory`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Apps Script error: ${response.status}`)
  }
  const data = await response.json()
  return data.rows || []
}

const parseInventoryRows = (rows) => {
  return rows
    .filter(
      (row) =>
        row.A &&
        !String(row.A).startsWith('==') &&
        String(row.A).toLowerCase() !== 'name',
    )
    .map((row) => ({
      name: row.A ?? '',
      quantity: row.B ?? '',
      category: row.C ?? '',
      weight: row.D ?? '',
      notes: row.E ?? '',
      imageUrl: row.F ?? '',
    }))
}

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

app.get('/api/sophie/rolls', (_, res) => {
  res.json({ rolls: sophieRolls })
})

app.post('/api/sophie/roll', async (req, res) => {
  try {
    const { key, dryRun = false } = req.body || {}
    const roll = sophieRolls[key]
    if (!roll) {
      return res.status(400).json({ message: 'Unknown Sophie roll key' })
    }

    const response = await fetch(`${sophiesDiceBridgeUrl}/roll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, dryRun: Boolean(dryRun), ...roll }),
      signal: AbortSignal.timeout(3500),
    })

    if (!response.ok) {
      const message = await response.text().catch(() => '')
      return res.status(502).json({
        message: message || `Sophie bridge returned ${response.status}`,
      })
    }

    const payload = await response.json().catch(() => ({ success: true }))
    res.json({ success: true, roll, bridge: payload })
  } catch (error) {
    res.status(502).json({
      message: `Unable to reach Sophie bridge at ${sophiesDiceBridgeUrl}: ${error.message}`,
    })
  }
})

app.get('/api/stats', async (_, res) => {
  try {
    const rows = await fetchSheetValues()
    const stats = parseRows(rows)
    await writeSnapshot(stats)
    res.json({ stats, source: 'sheet' })
  } catch {
    const snapshot = await readSnapshot()
    if (snapshot) {
      res.json({ ...snapshot, source: 'snapshot' })
      return
    }
    await writeSnapshot([])
    res.status(500).json({
      message: 'Unable to load stats from sheet. Snapshot created.',
    })
  }
})

app.post('/api/stats', async (req, res) => {
  try {
    const { key, value, updates, label, type, outputFile, extra } = req.body || {}
    const updateList = Array.isArray(req.body)
      ? req.body
      : Array.isArray(updates)
        ? updates
        : key
          ? [{ key, value, label, type, outputFile, extra }]
          : []

    if (!updateList.length) {
      return res.status(400).json({ message: 'key or updates are required' })
    }
    if (!appsScriptUrl) {
      return res.status(400).json({ message: 'APPS_SCRIPT_WEBAPP_URL is not configured' })
    }
    const response = await fetch(`${appsScriptUrl}?action=batchUpdate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateList),
    })
    if (!response.ok) {
      return res.status(500).json({ message: 'Failed to update sheet via Apps Script' })
    }
    const payload = await response.json()
    res.json({ success: true, payload })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.get('/api/inventory', async (_, res) => {
  try {
    const rows = await fetchInventoryValues()
    const items = parseInventoryRows(rows)
    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/inventory', async (req, res) => {
  try {
    const { items } = req.body
    if (!Array.isArray(items)) {
      return res.status(400).json({ message: 'items must be an array' })
    }
    if (!appsScriptUrl) {
      return res.status(400).json({ message: 'APPS_SCRIPT_WEBAPP_URL is not configured' })
    }
    const response = await fetch(`${appsScriptUrl}?action=batchUpdate&sheet=Inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        items.map((item) => ({
          key: item.name,
          value: item.quantity,
          label: item.name,
          type: item.category,
          weight: item.weight,
          outputFile: item.notes,
          extra: item.imageUrl,
        })),
      ),
    })
    if (!response.ok) {
      return res.status(500).json({ message: 'Failed to update inventory sheet' })
    }
    const payload = await response.json()
    res.json({ success: true, payload })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

app.post('/api/inventory/item', async (req, res) => {
  try {
    const { item } = req.body || {}
    if (!item?.name) {
      return res.status(400).json({ message: 'item.name is required' })
    }
    if (!appsScriptUrl) {
      return res.status(400).json({ message: 'APPS_SCRIPT_WEBAPP_URL is not configured' })
    }
    const response = await fetch(`${appsScriptUrl}?action=batchUpdate&sheet=Inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        {
          key: item.name,
          value: item.quantity,
          label: item.name,
          type: item.category,
          weight: item.weight,
          outputFile: item.notes,
          extra: item.imageUrl,
        },
      ]),
    })
    if (!response.ok) {
      return res.status(500).json({ message: 'Failed to update inventory item' })
    }
    const payload = await response.json()
    res.json({ success: true, payload })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

cron.schedule('*/10 * * * *', async () => {
  try {
    const rows = await fetchSheetValues()
    const stats = parseRows(rows)
    await writeSnapshot(stats)
  } catch (error) {
    console.error('[snapshot] Failed to refresh snapshot:', error.message)
  }
})

app.use(express.static(uiDistPath))
app.get(/^\/(?!api\/).*/, async (_req, res) => {
  try {
    await fs.access(path.join(uiDistPath, 'index.html'))
    res.sendFile(path.join(uiDistPath, 'index.html'))
  } catch {
    res
      .status(503)
      .send('Ribbitz UI build not found. Run the frontend build before starting the server.')
  }
})

app.listen(port, () => {
  console.log(`Ribbitz UI server listening on http://localhost:${port}`)
})
