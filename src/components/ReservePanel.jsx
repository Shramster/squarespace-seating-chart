import { seatDisplayName, ticketDescription } from '../ticketDescriptions.js'

export default function ReservePanel({
  selected,
  meta,
  seatSku,
  buyLink,
  holdState,
  holdError,
  onReserve
}) {
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
    <div style={{ display: "flex", justifyContent: 'space-between'}}>
        <strong className="sc-panel-name">
          <span className={`sc-legend-swatch ${meta.type !== 'ga' ? meta.type : ''}`}></span>
          {seatDisplayName(meta)}
          {meta.ada && <span className="sc-ada-badge" title="ADA accessible seat">ADA</span>}
        </strong>  <strong>
    ${meta.price}
    </strong>
    </div>
        <span className="sc-panel-character">Seat: {meta.code}</span>
        <br />
        <span className="sc-panel-description">{ticketDescription(meta)}</span>
        <br />
        <br />
        {holdState === 'held' ? (
          <>Reserved for the next few minutes — finish checkout in the tab that opened.</>
        ) : (
          <>Reserving opens checkout in a new tab.</>
        )}
      </div>
    <div style={{ display: "flex", justifyContent: 'flex-end', width: "100%", alignItems: 'center'}}>
      {holdState === 'error' && <span className="sc-panel-error">{holdError}</span>}
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
    </div>
  )
}
