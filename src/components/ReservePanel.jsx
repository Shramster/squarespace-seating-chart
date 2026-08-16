export default function ReservePanel({ selected, meta, buyLink }) {
  if (!selected) {
    return (
      <div className="sc-panel">
        <div className="sc-panel-empty">Pick a seat above, then reserve it on the ticket page.</div>
      </div>
    )
  }

  return (
    <div className="sc-panel">
      <div className="sc-panel-text">
        Seat <strong>{selected}</strong> · ${meta.price}
        {meta.character && (
          <>
            <br />
            <span className="sc-panel-character">Playing: {meta.character}</span>
          </>
        )}
        <br />
        Select <strong>{selected}</strong> at checkout on the next page.
      </div>
      <a className="sc-reserve-btn" href={buyLink} target="_blank" rel="noopener noreferrer">
        Reserve this seat
      </a>
    </div>
  )
}
