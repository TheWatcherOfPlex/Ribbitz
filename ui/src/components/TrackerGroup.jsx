function TrackerGroup({ title, items, onToggle, showCount = true, headerAddon = null }) {
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
        <span className="tracker-group__title-right">
          {countLabel && <span className="tracker-group__count">{countLabel}</span>}
        </span>
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
        {headerAddon && <div className="tracker-group__addon">{headerAddon}</div>}
      </div>
    </div>
  )
}

export default TrackerGroup