import { useEffect, useState } from 'react'
import { slugifyHeading } from '../utils/slugifyHeading.js'
import { fetchStatMap } from '../lib/api.js'
import { SPELL_CASTS } from '../lib/spellCasts.js'
import SpellCastCard from '../components/SpellCastCard.jsx'

const defaultRow = {
  name: '',
  quantity: '1',
  category: '',
  weight: '',
  notes: '',
  imageUrl: '',
  // Added 2026-09-24 — owner ask: a Unit field ("doses", "gp", "vials",
  // etc.) alongside Quantity for items that aren't just a plain count, plus
  // an explicit Requires Attunement / Attuned pair (most items don't
  // require attunement at all — only set requiresAttunement true for ones
  // that actually do). Requires the Apps Script (OBS Auto Sync/Engine/
  // Google Apps Script Framework.gs) to be redeployed with its 2026-09-24
  // update for these to actually persist — see docs/PROGRESS_LOG.md.
  unit: '',
  requiresAttunement: false,
  attuned: false,
}
const API_BASE = (import.meta.env.VITE_API_BASE || '/api').replace(/\/+$/, '')
const apiFetch = (path, init) => fetch(`${API_BASE}${path}`, init)
const CONTENT_BASE = import.meta.env.BASE_URL || '/'

const formatCategoryLabel = (category) => (category ? category : 'Uncategorized')

// Each category gets its own background tint (owner ask, 2026-09-24) so
// they're visually distinct at a glance. Cycled by index for any category
// not explicitly named here (e.g. a new one added later), so this never
// silently stops working — it just falls back to a less-curated color.
const CATEGORY_COLORS = {
  'Armor & Clothing': '167, 139, 250',
  'Combat Consumables': '244, 114, 182',
  'Ammunition & Weapons': '251, 146, 60',
  'Kits & Tools & Bags': '96, 165, 250',
  Books: '250, 204, 21',
  'Drugs & Herbs': '134, 239, 172',
  'Currency & Valuables': '253, 224, 71',
  Uncategorized: '148, 163, 184',
}
const CATEGORY_COLOR_FALLBACK_CYCLE = [
  '167, 139, 250',
  '244, 114, 182',
  '251, 146, 60',
  '96, 165, 250',
  '134, 239, 172',
  '253, 224, 71',
]
function categoryColorRgb(category, index) {
  return CATEGORY_COLORS[category] || CATEGORY_COLOR_FALLBACK_CYCLE[index % CATEGORY_COLOR_FALLBACK_CYCLE.length]
}

function InventoryPage() {
  const [rows, setRows] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [newItem, setNewItem] = useState({ ...defaultRow })
  const [newCategory, setNewCategory] = useState('')
  const [editCategory, setEditCategory] = useState({})
  const [editNewCategory, setEditNewCategory] = useState({})
  // 2026-09-25: roll-button wiring for items with real documented mechanics
  // (Healing Potions, poisons with a save/damage die) — same SpellCastCard
  // used for weapon attacks and spells, see lib/spellCasts.js for the item
  // entries. statMap is fetched independently here since InventoryPage
  // otherwise has no reason to load it (only needed for Wisdom Modifier on
  // potions that don't have their own fixed bonus — most items here use a
  // fixedDc/flatBonus baked into the item itself, not Ribbitz's stats).
  const [statMap, setStatMap] = useState({})
  const [expandedRollKey, setExpandedRollKey] = useState('')

  const loadSeedInventory = async () => {
    const seedResponse = await fetch(`${CONTENT_BASE}content/seed-inventory.csv`)
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
      const response = await apiFetch('/inventory')
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
    fetchStatMap()
      .then(setStatMap)
      .catch(() => {})
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
      const response = await apiFetch('/inventory', {
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
            placeholder="Unit (doses, gp, vials...)"
            value={newItem.unit}
            onChange={(event) => handleNewItemChange('unit', event.target.value)}
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
          <label className="inventory-attune-check">
            <input
              type="checkbox"
              checked={newItem.requiresAttunement}
              onChange={(event) => handleNewItemChange('requiresAttunement', event.target.checked)}
            />
            Requires Attunement
          </label>
          <button className="primary" type="button" onClick={handleSubmitNewItem}>
            Add Item
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="inventory-table__loading">Loading inventory...</div>
      ) : (
        <div className="inventory-groups">
          {categories.map((category, categoryIndex) => (
            <section
              key={category}
              className="inventory-group"
              style={{ '--category-rgb': categoryColorRgb(category, categoryIndex) }}
            >
              <header className="inventory-group__header">
                <h3>{category}</h3>
              </header>
              <div className="inventory-table">
                <div className="inventory-table__row inventory-table__row--header">
                  <span>Name</span>
                  <span>Qty</span>
                  <span>Unit</span>
                  <span>Weight</span>
                  <span>Notes</span>
                  <span>Image URL</span>
                  <span>Attunement</span>
                  <span>Actions</span>
                </div>
                {(groupedRows[category] || []).map((row) => {
                  const index = rows.indexOf(row)
                  const rowSlug = slugifyHeading(row.name)
                  const castConfig = SPELL_CASTS[rowSlug]
                  const rollExpanded = expandedRollKey === rowSlug
                  return (
                    <div key={`${row.name}-${index}`} className="inventory-table__row-group">
                    <div
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
                        placeholder="doses, gp..."
                        value={row.unit || ''}
                        onChange={(event) => updateRow(index, 'unit', event.target.value)}
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
                      <div className="inventory-attune-cell">
                        <label className="inventory-attune-check">
                          <input
                            type="checkbox"
                            checked={Boolean(row.requiresAttunement)}
                            onChange={(event) => updateRow(index, 'requiresAttunement', event.target.checked)}
                          />
                          Requires
                        </label>
                        <label className="inventory-attune-check">
                          <input
                            type="checkbox"
                            checked={Boolean(row.attuned)}
                            disabled={!row.requiresAttunement}
                            onChange={(event) => updateRow(index, 'attuned', event.target.checked)}
                          />
                          Attuned
                        </label>
                      </div>
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
                        {castConfig ? (
                          <button
                            className={`ghost inventory-roll-toggle${rollExpanded ? ' inventory-roll-toggle--active' : ''}`}
                            type="button"
                            onClick={() => setExpandedRollKey(rollExpanded ? '' : rowSlug)}
                          >
                            {rollExpanded ? '▾ Roll' : '▸ Roll'}
                          </button>
                        ) : null}
                      </div>
                    </div>
                    {rollExpanded && castConfig ? (
                      <div className="inventory-roll-panel">
                        <SpellCastCard spellName={row.name} config={castConfig} statMap={statMap} />
                      </div>
                    ) : null}
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
