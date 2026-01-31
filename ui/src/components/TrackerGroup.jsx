function TrackerGroup({ title, items, onToggle }) {
  return (
    <div className="tracker-group">
      <div className="tracker-group__title">{title}</div>
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