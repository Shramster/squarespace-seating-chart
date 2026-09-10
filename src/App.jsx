import { useState } from 'react'
import { CONFIG, SEAT_INDEX, seatBuyLink } from './config.js'
import { useSeatStatus } from './hooks/useSeatStatus.js'
import DayTabs from './components/DayTabs.jsx'
import VenueMap from './components/VenueMap.jsx'
import Legend from './components/Legend.jsx'
import ReservePanel from './components/ReservePanel.jsx'

export default function App() {
  const [activeShow, setActiveShow] = useState(() => {
    const requested = new URLSearchParams(window.location.search).get('show')
    return (
      CONFIG.shows.find((s) => s.sku.toLowerCase() === requested?.toLowerCase()) ??
      CONFIG.shows[0]
    )
  })
  const [selected, setSelected] = useState(null)
  const { soldSeats, status } = useSeatStatus(CONFIG.apiBase, activeShow.sku)

  function handleSelectShow(show) {
    setActiveShow(show)
    setSelected(null)
  }

  const seat = selected ? SEAT_INDEX.get(selected) : null
  const selectedMeta = seat
    ? { ...seat, price: CONFIG.pricesByType[seat.type] ?? seat.price ?? CONFIG.defaultPrice }
    : null
  const seatSku = selected ? `${activeShow.sku}-${selected}` : null

  return (
    <div className="seat-chart">
      <div className="sc-header">
        <p className="sc-eyebrow">Reserved Seating</p>
        <h3 className="sc-title">Choose Your Seat</h3>
      </div>

      <DayTabs shows={CONFIG.shows} activeSku={activeShow.sku} onSelect={handleSelectShow} />

      {status === 'loading' && <p className="sc-status-note">Loading seat availability…</p>}
      {status === 'error' && (
        <p className="sc-status-note">
          Couldn&rsquo;t load live availability — verify seats before confirming a sale.
        </p>
      )}

      <VenueMap
        venue={CONFIG.venue}
        soldSeats={soldSeats}
        selected={selected}
        onSelectSeat={setSelected}
      />
      <ReservePanel
        selected={selected}
        meta={selectedMeta}
        seatSku={seatSku}
        buyLink={selected ? seatBuyLink(activeShow.sku, selected) : null}
      />
      <Legend />
    <div style={{overflowX: "scroll"}}>
      <img
        className="sc-price-table"
        src={`${CONFIG.apiBase}/static/seating-table.jpg`}
        alt="Ticket price tiers: Gallery $44, Delegate $68, Chairperson $76, Candidate $100 — comparing assigned seat, proximity to actors, ballot vote, commemorative button, Act 2 lines, Convention tee-shirt and photo, and meal ticket benefits per tier."
      />
    </div>
    </div>
  )
}
