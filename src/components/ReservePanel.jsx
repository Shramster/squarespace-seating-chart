export default function ReservePanel({ selected, meta, seatSku, buyLink, holdState, holdError, onReserve }) {
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
        <span className="sc-panel-sku">SKU: {seatSku}</span>
        <br />
        {holdState === 'held' ? (
          <>Reserved for the next few minutes — select SKU <strong>{seatSku}</strong> at checkout to finish.</>
        ) : (
          <>Reserving opens checkout in a new tab. Select SKU <strong>{seatSku}</strong> there to finish.</>
        )}
      </div>

      {holdState === 'error' && <div className="sc-panel-error">{holdError}</div>}

      {holdState === 'held' ? (
        <a className="sc-reserve-btn" href={buyLink} target="_blank" rel="noopener noreferrer">
          Reopen checkout
        </a>
      ) : (
        <button
          type="button"
          className="sc-reserve-btn"
          onClick={onReserve}
          disabled={holdState === 'holding'}
        >
          {holdState === 'holding' ? 'Reserving…' : 'Reserve this seat'}
        </button>
      )}
    </div>
  )
}
