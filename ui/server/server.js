import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import cron from 'node-cron'
import fs from 'fs/promises'
import path from 'path'

dotenv.config()

const app = express()
const port = process.env.PORT || 5174
const appsScriptUrl = process.env.APPS_SCRIPT_WEBAPP_URL
const snapshotPath = process.env.OFFLINE_SNAPSHOT_PATH || './snapshot.json'

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

cron.schedule('*/10 * * * *', async () => {
  try {
    const rows = await fetchSheetValues()
    const stats = parseRows(rows)
    await writeSnapshot(stats)
  } catch (error) {
    console.error('[snapshot] Failed to refresh snapshot:', error.message)
  }
})

app.listen(port, () => {
  console.log(`Ribbitz UI server listening on http://localhost:${port}`)
})