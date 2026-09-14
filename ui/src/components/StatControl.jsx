import { useEffect, useState } from 'react'

// Extracted from App.jsx during the dashboard rebuild (Phase 3) — logic
// unchanged. Shared by multiple panels (Currency, Quick Stats, Vitality),
// so it lives in components/ rather than inside any one panel file.
export default function StatControl({ label, value, helper, onChange, accent }) {
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

  const accentClass = accent ? (accent === true ? 'stat-control--accent' : `stat-control--${accent}`) : ''

  return (
    <div className={`stat-control${accentClass ? ` ${accentClass}` : ''}`}>
      <div className="stat-control__label">{label}</div>
      <div className="stat-control__field">
        <button className="stat-control__btn" aria-label={`Decrease ${label}`} onClick={() => handleStep(-1)}>
          −
        </button>
        <input
          className="stat-control__input"
          value={localValue}
          onChange={(event) => setLocalValue(event.target.value)}
          onBlur={handleBlur}
          aria-label={`${label} value`}
        />
        <button className="stat-control__btn" aria-label={`Increase ${label}`} onClick={() => handleStep(1)}>
          +
        </button>
      </div>
      {helper && <div className="stat-control__helper">{helper}</div>}
    </div>
  )
}
