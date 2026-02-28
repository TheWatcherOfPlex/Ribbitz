import { useEffect, useState } from 'react'
import { slugifyHeading } from '../utils/slugifyHeading.js'

const defaultRow = {
  name: '',
  quantity: '1',
  category: '',
  weight: '',
  notes: '',
  imageUrl: '',
}

const formatCategoryLabel = (category) => (category ? category : 'Uncategorized')

function InventoryPage() {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [newItem, setNewItem] = useState({ ...defaultRow })
  const [newCategory, setNewCategory] = useState('')
  const [editCategory, setEditCategory] = useState({})
  const [editNewCategory, setEditNewCategory] = useState({})

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
    } catch {
      try {
        const loaded = await loadSeedInventory()
        if (!loaded) {
          setError('Unable to load inventory from sheet or seed CSV.')
        }
      } catch {
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

  const saveChanges = async (nextRows = rows) => {
    setIsSaving(true)
    setError('')
    try {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: nextRows }),
      })
      if (!response.ok) {
        throw new Error('Save failed')
      }
    } catch {
      setError('Unable to save inventory changes.')
    } finally {
      setIsSaving(false)
    }
  }

  const categories = Array.from(
    new Set(rows.map((row) => row.category || '')),
  )
    .map((category) => category || 'Uncategorized')
    .sort((a, b) => a.localeCompare(b))

  const groupedRows = categories.reduce((acc, category) => {
    acc[category] = rows.filter(
      (row) => formatCategoryLabel(row.category) === category,
    )
    return acc
  }, {})

  const handleNewItemChange = (field, value) => {
    setNewItem((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmitNewItem = async () => {
    const finalCategory = newCategory.trim() || newItem.category
    if (!newItem.name.trim()) {
      setError('Item name is required.')
      return
    }
    if (!finalCategory) {
      setError('Category is required (select or add a new one).')
      return
    }
    const payload = {
      ...newItem,
      category: finalCategory,
      quantity: newItem.quantity || '1',
    }
    const nextRows = [...rows, payload]
    setRows(nextRows)
    setNewItem({ ...defaultRow, category: '' })
    setNewCategory('')
    await saveChanges(nextRows)
  }

  const handleCategoryEdit = (index, value) => {
    setEditCategory((prev) => ({ ...prev, [index]: value }))
    if (value !== '__new__') {
      setEditNewCategory((prev) => {
        const next = { ...prev }
        delete next[index]
        return next
      })
    }
  }

  const handleApplyCategory = async (index) => {
    const selected = editCategory[index]
    if (!selected) {
      return
    }
    const nextCategory =
      selected === '__new__' ? editNewCategory[index]?.trim() : selected
    if (!nextCategory) {
      setError('New category name is required.')
      return
    }
    const nextRows = rows.map((row, rowIndex) =>
      rowIndex === index ? { ...row, category: nextCategory } : row,
    )
    setRows(nextRows)
    setEditCategory((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    setEditNewCategory((prev) => {
      const next = { ...prev }
      delete next[index]
      return next
    })
    await saveChanges(nextRows)
  }

  return (
    <section className="page-panel">
      <header className="page-panel__header page-panel__header--with-actions">
        <div>
          <h2>Inventory</h2>
          <p>Manage items by category. Stored in the Inventory sheet.</p>
        </div>
        <div className="page-panel__actions">
          <button className="ghost" onClick={fetchInventory}>
            Refresh
          </button>
          <button className="primary" onClick={() => saveChanges()} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </header>

      {error && <div className="offline-banner">{error}</div>}

      <div className="inventory-add">
        <h3>Add New Item</h3>
        <div className="inventory-add__grid">
          <input
            placeholder="Item name"
            value={newItem.name}
            onChange={(event) => handleNewItemChange('name', event.target.value)}
          />
          <input
            placeholder="Quantity"
            value={newItem.quantity}
            onChange={(event) => handleNewItemChange('quantity', event.target.value)}
          />
          <input
            placeholder="Weight"
            value={newItem.weight}
            onChange={(event) => handleNewItemChange('weight', event.target.value)}
          />
          <input
            placeholder="Notes"
            value={newItem.notes}
            onChange={(event) => handleNewItemChange('notes', event.target.value)}
          />
          <input
            placeholder="Image URL"
            value={newItem.imageUrl}
            onChange={(event) => handleNewItemChange('imageUrl', event.target.value)}
          />
          <select
            value={newItem.category || ''}
            onChange={(event) => handleNewItemChange('category', event.target.value)}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category} value={category === 'Uncategorized' ? '' : category}>
                {category}
              </option>
            ))}
          </select>
          <input
            placeholder="New category (optional)"
            value={newCategory}
            onChange={(event) => setNewCategory(event.target.value)}
          />
          <button className="primary" type="button" onClick={handleSubmitNewItem}>
            Add Item
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="inventory-table__loading">Loading inventory...</div>
      ) : (
        <div className="inventory-groups">
          {categories.map((category) => (
            <section key={category} className="inventory-group">
              <header className="inventory-group__header">
                <h3>{category}</h3>
              </header>
              <div className="inventory-table">
                <div className="inventory-table__row inventory-table__row--header">
                  <span>Name</span>
                  <span>Qty</span>
                  <span>Weight</span>
                  <span>Notes</span>
                  <span>Image URL</span>
                  <span>Actions</span>
                </div>
                {(groupedRows[category] || []).map((row) => {
                  const index = rows.indexOf(row)
                  const rowSlug = slugifyHeading(row.name)
                  return (
                    <div
                      key={`${row.name}-${index}`}
                      id={rowSlug}
                      className="inventory-table__row"
                    >
                      <input
                        value={row.name}
                        onChange={(event) => updateRow(index, 'name', event.target.value)}
                      />
                      <input
                        value={row.quantity}
                        onChange={(event) => updateRow(index, 'quantity', event.target.value)}
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
                      <div className="inventory-actions">
                        <select
                          value={editCategory[index] || ''}
                          onChange={(event) => handleCategoryEdit(index, event.target.value)}
                        >
                          <option value="">Change category</option>
                          {categories.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                          <option value="__new__">Add another category</option>
                        </select>
                        {editCategory[index] === '__new__' && (
                          <input
                            placeholder="New category"
                            value={editNewCategory[index] || ''}
                            onChange={(event) =>
                              setEditNewCategory((prev) => ({
                                ...prev,
                                [index]: event.target.value,
                              }))
                            }
                          />
                        )}
                        <button className="ghost" type="button" onClick={() => handleApplyCategory(index)}>
                          Apply
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </section>
  )
}

export default InventoryPage