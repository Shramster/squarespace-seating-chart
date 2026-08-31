export default function ReservePanel({ selected, meta, seatSku, buyLink }) {
  if (!selected) {
    return (
      <div className="sc-panel">
        <div className="sc-panel-empty">
          Pick a seat above, then reserve it on the ticket page.
          <span className="sc-panel-scroll-hint"> Scroll the seat map to see more.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="sc-panel">
      <div className="sc-panel-text">
        Seat <strong>{meta.label}</strong> · ${meta.price}
        {(meta.type === 'delegate' || meta.type === 'chair') && (
          <>
            <br />
            <span className="sc-panel-character">Delegation: {meta.label}</span>
          </>
        )}
        <br />
        <span className="sc-panel-sku">SKU: {seatSku}</span>
        <br />
        Reserving opens checkout for this exact seat in a new tab.
      </div>

      <a className="sc-reserve-btn" href={buyLink} target="_blank" rel="noopener noreferrer">
        Reserve this seat
      </a>
    </div>
  )
}
