import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'

dotenv.config()

const appsScriptUrl = process.env.APPS_SCRIPT_WEBAPP_URL

if (!appsScriptUrl) {
  console.error('APPS_SCRIPT_WEBAPP_URL is not configured in ui/server/.env')
  process.exit(1)
}

const projectRoot = path.resolve(process.cwd(), '..')
const inventoryPath = path.join(projectRoot, 'public', 'content', 'seed-inventory.csv')

const csvHeaders = ['Name', 'Quantity', 'Category', 'Weight', 'Notes', 'Image URL']

const escapeCsvValue = (value = '') => {
  const stringValue = String(value)
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`
  }
  return stringValue
}

const parseCsvLine = (line) => {
  const values = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]

    if (char === '"') {
      const nextChar = line[i + 1]
      if (inQuotes && nextChar === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
      continue
    }

    if (char === ',' && !inQuotes) {
      values.push(current)
      current = ''
      continue
    }

    current += char
  }

  values.push(current)
  return values
}

const fetchInventory = async () => {
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

const writeInventoryCsv = async (items) => {
  const lines = [csvHeaders.join(',')]
  items.forEach((item) => {
    lines.push(
      [
        escapeCsvValue(item.name),
        escapeCsvValue(item.quantity || '1'),
        escapeCsvValue(item.category),
        escapeCsvValue(item.weight),
        escapeCsvValue(item.notes),
        escapeCsvValue(item.imageUrl),
      ].join(','),
    )
  })
  await fs.writeFile(inventoryPath, `${lines.join('\n')}\n`)
}

const loadInventoryCsv = async () => {
  const csvText = await fs.readFile(inventoryPath, 'utf-8')
  const [, ...lines] = csvText.split('\n')
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, quantity, category, weight, notes, imageUrl] = parseCsvLine(line)
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
}

const pushInventory = async (items) => {
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
    throw new Error(`Failed to update inventory sheet (${response.status})`)
  }
  return response.json()
}

const run = async () => {
  const command = process.argv[2]

  if (command === 'pull') {
    const rows = await fetchInventory()
    const items = parseInventoryRows(rows)
    await writeInventoryCsv(items)
    console.log(`Inventory pulled to ${inventoryPath} (${items.length} items).`)
    return
  }

  if (command === 'push') {
    const items = await loadInventoryCsv()
    const payload = await pushInventory(items)
    console.log('Inventory pushed to Google Sheet.', payload)
    return
  }

  console.log('Usage: node scripts/inventory-sync.js <pull|push>')
}

run().catch((error) => {
  console.error(error.message)
  process.exit(1)
})