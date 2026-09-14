// Extracted from App.jsx during the dashboard rebuild (Phase 3) — logic
// unchanged. Shared by multiple panels (Vitality/Healing, Combat
// Consumables, Ammo, etc.), so it lives in components/ rather than inside
// any one panel file.
export default function CounterRow({ label, value, detail, onStep, disabled }) {
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
