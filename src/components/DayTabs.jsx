export default function DayTabs({ shows, activeSku, onSelect }) {
  return (
    <div className="sc-tabs">
      {shows.map((show) => (
        <button
          key={show.sku}
          type="button"
          className={'sc-tab' + (show.sku === activeSku ? ' active' : '')}
          onClick={() => onSelect(show)}
        >
          {show.label}
        </button>
      ))}
    </div>
  )
}
