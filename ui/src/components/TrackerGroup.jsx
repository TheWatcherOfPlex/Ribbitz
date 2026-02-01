function TrackerGroup({ title, items, onToggle, showCount = true }) {
  const current = items?.[0]?.current
  const total = items?.[0]?.total
  const countLabel =
    showCount && typeof current === 'number' && typeof total === 'number'
      ? `${current}/${total}`
      : null

  return (
    <div className="tracker-group">
      <div className="tracker-group__title">
        <span>{title}</span>
        {countLabel && <span className="tracker-group__count">{countLabel}</span>}
      </div>
      <div className="tracker-group__items">
        {items.map((item, index) => (
          <button
            key={`${item.key}-${index}`}
            className={`tracker-chip ${item.active ? 'tracker-chip--active' : ''}`}
            onClick={() => onToggle(item)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default TrackerGroup