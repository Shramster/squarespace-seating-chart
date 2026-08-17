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
        Seat <strong>{meta.label}</strong> · ${meta.price}
        {meta.type === 'delegate' && (
          <>
            <br />
            <span className="sc-panel-character">Delegation: {meta.label}</span>
          </>
        )}
        <br />
        Select <strong>{meta.label}</strong> at checkout on the next page.
      </div>
      <a className="sc-reserve-btn" href={buyLink} target="_blank" rel="noopener noreferrer">
        Reserve this seat
      </a>
    </div>
  )
}
