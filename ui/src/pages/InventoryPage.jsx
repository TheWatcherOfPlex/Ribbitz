import { useEffect, useState } from 'react'

const defaultRow = {
  name: '',
  quantity: '',
  category: '',
  weight: '',
  notes: '',
  imageUrl: '',
}

function InventoryPage() {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')

  const loadSeedInventory = async () => {
    const seedResponse = await fetch('/content/seed-inventory.csv')
    if (!seedResponse.ok) {
      throw new Error('Seed load failed')
    }
    const csvText = await seedResponse.text()
    const [, ...lines] = csvText.split('\n')
    const seeded = lines
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, quantity, category, weight, notes, imageUrl] = line.split(',')
        return {
          name: name || '',
          quantity: quantity || '',
          category: category || '',
          weight: weight || '',
          notes: notes || '',
          imageUrl: imageUrl || '',
        }
      })
    if (seeded.length) {
      console.info('Loaded seed inventory', seeded.length)
      setRows(seeded)
      return true
    }
    return false
  }

  const fetchInventory = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/inventory')
      if (!response.ok) {
        throw new Error('Inventory API unavailable')
      }
      const payload = await response.json()
      const items = payload.items || []
      if (items.length === 0) {
        const loaded = await loadSeedInventory()
        if (loaded) {
          setIsLoading(false)
          return
        }
      }
      setRows(items)
    } catch (err) {
      try {
        const loaded = await loadSeedInventory()
        if (!loaded) {
          setError('Unable to load inventory from sheet or seed CSV.')
        }
      } catch (seedError) {
        setError('Unable to load inventory from sheet or seed CSV.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [])

  const updateRow = (index, field, value) => {
    setRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    )
  }

  const addRow = () => {
    setRows((prev) => [...prev, { ...defaultRow }])
  }

  const saveChanges = async () => {
    setIsSaving(true)
    setError('')
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows }),
      })
      if (!response.ok) {
        throw new Error('Save failed')
      }
    } catch (err) {
      setError('Unable to save inventory changes.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className="page-panel">
      <header className="page-panel__header page-panel__header--with-actions">
        <div>
          <h2>Inventory</h2>
          <p>Manage items, quantities, and notes. Stored in the Inventory sheet.</p>
        </div>
        <div className="page-panel__actions">
          <button className="ghost" onClick={fetchInventory}>
            Refresh
          </button>
          <button className="ghost" onClick={addRow}>
            Add Item
          </button>
          <button className="primary" onClick={saveChanges} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </header>

      {error && <div className="offline-banner">{error}</div>}

      <div className="inventory-table">
        <div className="inventory-table__row inventory-table__row--header">
          <span>Name</span>
          <span>Qty</span>
          <span>Category</span>
          <span>Weight</span>
          <span>Notes</span>
          <span>Image URL</span>
        </div>
        {isLoading ? (
          <div className="inventory-table__loading">Loading inventory...</div>
        ) : (
          rows.map((row, index) => (
            <div key={`${row.name}-${index}`} className="inventory-table__row">
              <input
                value={row.name}
                onChange={(event) => updateRow(index, 'name', event.target.value)}
              />
              <input
                value={row.quantity}
                onChange={(event) => updateRow(index, 'quantity', event.target.value)}
              />
              <input
                value={row.category}
                onChange={(event) => updateRow(index, 'category', event.target.value)}
              />
              <input
                value={row.weight}
                onChange={(event) => updateRow(index, 'weight', event.target.value)}
              />
              <input
                value={row.notes}
                onChange={(event) => updateRow(index, 'notes', event.target.value)}
              />
              <input
                value={row.imageUrl}
                onChange={(event) => updateRow(index, 'imageUrl', event.target.value)}
              />
            </div>
          ))
        )}
      </div>
    </section>
  )
}

export default InventoryPage