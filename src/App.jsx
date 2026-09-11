import { useEffect, useState } from 'react'
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
  const [holdState, setHoldState] = useState('idle') // 'idle' | 'holding' | 'held' | 'error'
  const [holdError, setHoldError] = useState(null)
  // Seats this browser has successfully held, applied on top of the
  // polled heldSeats so a just-reserved seat shows as unavailable to a
  // reselect/switch-seat in this same session immediately — the poll can
  // take up to 15s to catch up, and buyers won't reload to see it.
  const [localHolds, setLocalHolds] = useState([])
  const { soldSeats, heldSeats: polledHeldSeats, status } = useSeatStatus(CONFIG.apiBase, activeShow.sku)
  const heldSeats = [...new Set([...polledHeldSeats, ...localHolds])]

  // A fresh seat/show pick always starts from a clean hold state.
  useEffect(() => {
    setHoldState('idle')
    setHoldError(null)
  }, [selected, activeShow.sku])

  function handleSelectShow(show) {
    setActiveShow(show)
    setSelected(null)
    setLocalHolds([])
  }

  async function handleReserve() {
    if (!selected) return
    setHoldState('holding')
    setHoldError(null)
    try {
      const res = await fetch(
        `${CONFIG.apiBase}/api/shows/${activeShow.sku}/seats/${selected}/hold/`,
        { method: 'POST' }
      )
      if (res.status === 409) {
        setHoldState('error')
        setHoldError('That seat was just taken — pick another seat.')
        return
      }
      if (!res.ok) throw new Error(`bad response: ${res.status}`)
      setHoldState('held')
      setLocalHolds((prev) => [...prev, selected])
      window.open(seatBuyLink(activeShow.sku, selected), '_blank', 'noopener,noreferrer')
    } catch {
      setHoldState('error')
      setHoldError("Couldn't reserve that seat — check your connection and try again.")
    }
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
        heldSeats={heldSeats}
        selected={selected}
        onSelectSeat={setSelected}
      />
      <ReservePanel
        selected={selected}
        meta={selectedMeta}
        seatSku={seatSku}
        buyLink={selected ? seatBuyLink(activeShow.sku, selected) : null}
        holdState={holdState}
        holdError={holdError}
        onReserve={handleReserve}
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
