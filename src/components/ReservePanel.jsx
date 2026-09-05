import { seatDisplayName, ticketDescription } from '../ticketDescriptions.js'

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
    <div style={{ display: "flex", justifyContent: 'space-between'}}>
        <strong>{seatDisplayName(meta)}</strong>  <strong>
    ${meta.price}
    </strong>
    </div>
        <span className="sc-panel-character">Seat: {meta.code}</span>
        <br />
        <span className="sc-panel-description">{ticketDescription(meta)}</span>
        <br />
        <br />
        Reserving opens checkout for this exact seat in a new tab.
      </div>
    <div style={{ display: "flex", justifyContent: 'flex-end', width: "100%"}}>

      <a className="sc-reserve-btn" href={buyLink} target="_blank" rel="noopener noreferrer">
        Reserve this seat
      </a>
      </div>
    </div>
  )
}
