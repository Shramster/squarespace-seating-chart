export default function DayTabs({ shows, activeSku, onSelect }) {
  const index = shows.findIndex((show) => show.sku === activeSku)

  function go(delta) {
    const next = shows[index + delta]
    if (next) onSelect(next)
  }

  function handleSelectChange(e) {
    const show = shows.find((s) => s.sku === e.target.value)
    if (show) onSelect(show)
  }

  return (
    <div className="sc-tabs">
      <button
        type="button"
        className="sc-tab-arrow"
        onClick={() => go(-1)}
        disabled={index <= 0}
        aria-label="Previous date"
      >
        &#8249;
      </button>

      <select
        className="sc-tab-select"
        value={index === -1 ? '' : activeSku}
        onChange={handleSelectChange}
        aria-label="Select performance date"
      >
        {shows.map((show) => (
          <option key={show.sku} value={show.sku}>
            {show.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        className="sc-tab-arrow"
        onClick={() => go(1)}
        disabled={index === -1 || index >= shows.length - 1}
        aria-label="Next date"
      >
        &#8250;
      </button>
    </div>
  )
}
