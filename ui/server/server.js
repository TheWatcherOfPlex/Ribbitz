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
      // Added 2026-09-24 — see OBS Auto Sync/Engine/Google Apps Script
      // Framework.gs's header comment for the column layout. Requires the
      // Apps Script to be redeployed with that update before these
      // actually populate (until then G/H/I don't exist in the sheet
      // response and these stay blank/false).
      unit: row.G ?? '',
      requiresAttunement: String(row.H ?? '').toLowerCase() === 'true',
      attuned: String(row.I ?? '').toLowerCase() === 'true',
    }))
}

app.get('/api/health', (_, res) => {
  res.json({ status: 'ok' })
})

// --- Structured content export (spells/actions) for external consumers, e.g. Stream Commander ---
// Parses the same canonical Markdown the dashboard reads, so there is one source of truth.

function stripHtml(text) {
  return String(text)
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function slugifyHeading(text) {
  return String(text)
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

function extractField(block, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = block.match(new RegExp(`\\*\\*${escaped}:\\*\\*\\s*([^\\n]+)`, 'i'))
  return match ? stripHtml(match[1]) : ''
}

function extractSection(block, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = block.match(new RegExp(`#### ${escaped}\\n+([\\s\\S]*?)(?=\\n#### |\\n</details>|$)`, 'i'))
  return match ? match[1].trim() : ''
}

function extractAllSections(block) {
  const sections = {}
  const regex = /#### ([^\n]+)\n+([\s\S]*?)(?=\n#### |\n<\/details>|$)/g
  let match
  while ((match = regex.exec(block))) {
    sections[stripHtml(match[1]).trim()] = match[2].trim()
  }
  return sections
}

function summarizeMarkdownBlock(markdownText) {
  const cleaned = stripHtml(
    String(markdownText || '')
      .replace(/\*\*At Higher Levels:\*\*[\s\S]*/i, '')
      .replace(/\*\*Spell Lists:\*\*[\s\S]*/i, '')
      .replace(/\*\*/g, ''),
  )
  if (!cleaned) return ''
  return cleaned.length > 360 ? `${cleaned.slice(0, 357).trim()}...` : cleaned
}

function extractBulletNotes(markdownText) {
  return String(markdownText || '')
    .split('\n')
    .map((line) => stripHtml(line.replace(/^[-*]\s*/, '').replace(/\*\*/g, '')))
    .filter(Boolean)
}

// Walks <summary><h2>Section</h2></summary> ... <summary><h3>Item</h3></summary> ... </details>
// blocks (the format every root content .md file uses) and returns a flat list of items.
function parseMarkdownCatalog(markdownText, kind) {
  const normalized = String(markdownText || '').replace(/\r\n/g, '\n')
  const items = []

  const sectionRegex = /<summary><h2>([\s\S]*?)<\/h2><\/summary>/g
  const sections = []
  let match
  while ((match = sectionRegex.exec(normalized))) {
    sections.push({ titleHtml: match[1], start: match.index, end: sectionRegex.lastIndex })
  }

  for (let i = 0; i < sections.length; i += 1) {
    const current = sections[i]
    const next = sections[i + 1]
    const block = normalized.slice(current.end, next?.start ?? normalized.length)
    const sectionTitle = stripHtml(current.titleHtml)

    const itemRegex = /<summary><h3>([\s\S]*?)<\/h3><\/summary>/g
    let itemMatch
    while ((itemMatch = itemRegex.exec(block))) {
      const rawName = stripHtml(itemMatch[1])
      if (!rawName) continue
      const itemStart = itemRegex.lastIndex
      const nextItemMatch = block.slice(itemStart).match(/<summary><h3>[\s\S]*?<\/h3><\/summary>/)
      const itemEnd = nextItemMatch ? itemStart + nextItemMatch.index : block.length
      const itemBlock = block.slice(itemStart, itemEnd)

      const officialText = extractSection(itemBlock, 'Official Text')
      const ribbitzNotes = extractSection(itemBlock, 'Ribbitz Notes')
      const headings = extractAllSections(itemBlock)

      items.push({
        kind,
        section: sectionTitle,
        name: rawName,
        slug: slugifyHeading(rawName),
        level: extractField(itemBlock, 'Level'),
        castingTime: extractField(itemBlock, 'Casting Time'),
        range: extractField(itemBlock, 'Range'),
        components: extractField(itemBlock, 'Components'),
        duration: extractField(itemBlock, 'Duration'),
        source: extractField(itemBlock, 'Source'),
        summary: summarizeMarkdownBlock(officialText) || summarizeMarkdownBlock(itemBlock),
        notes: extractBulletNotes(ribbitzNotes),
        sections: headings,
        fullText: itemBlock.trim(),
      })
    }
  }

  return items
}

async function readContentMarkdown(filename) {
  const filePath = path.join(uiDistPath, 'content', filename)
  return fs.readFile(filePath, 'utf-8')
}

app.get('/api/export/spells', async (_req, res) => {
  try {
    const text = await readContentMarkdown('Spells and Magic Abilities.md')
    const items = parseMarkdownCatalog(text, 'spell')
    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: `Unable to read spell content: ${error.message}` })
  }
})

app.get('/api/export/actions', async (_req, res) => {
  try {
    const text = await readContentMarkdown('Actions.md')
    const items = parseMarkdownCatalog(text, 'action')
    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: `Unable to read actions content: ${error.message}` })
  }
})

app.get('/api/export/catalog', async (_req, res) => {
  try {
    const [spellsText, actionsText] = await Promise.all([
      readContentMarkdown('Spells and Magic Abilities.md'),
      readContentMarkdown('Actions.md'),
    ])
    const items = [
      ...parseMarkdownCatalog(spellsText, 'spell'),
      ...parseMarkdownCatalog(actionsText, 'action'),
    ]
    res.json({ items, updatedAt: new Date().toISOString() })
  } catch (error) {
    res.status(500).json({ message: `Unable to build catalog: ${error.message}` })
  }
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
          unit: item.unit,
          requiresAttunement: item.requiresAttunement ? 'TRUE' : 'FALSE',
          attuned: item.attuned ? 'TRUE' : 'FALSE',
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
          unit: item.unit,
          requiresAttunement: item.requiresAttunement ? 'TRUE' : 'FALSE',
          attuned: item.attuned ? 'TRUE' : 'FALSE',
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

// Added 2026-09-25 after a real incident: batchUpdate matches Inventory
// rows by exact name, so renaming an item leaves the old-named row behind
// and appends a new one instead of replacing it. This is the cleanup tool
// for that — deletes rows by exact name match. Deliberately narrow (no
// matching by anything else) to avoid deleting the wrong row.
app.post('/api/inventory/delete', async (req, res) => {
  try {
    const { names } = req.body || {}
    if (!Array.isArray(names) || !names.length) {
      return res.status(400).json({ message: 'names must be a non-empty array' })
    }
    if (!appsScriptUrl) {
      return res.status(400).json({ message: 'APPS_SCRIPT_WEBAPP_URL is not configured' })
    }
    const response = await fetch(`${appsScriptUrl}?action=deleteRows&sheet=Inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(names),
    })
    if (!response.ok) {
      return res.status(500).json({ message: 'Failed to delete inventory rows' })
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
