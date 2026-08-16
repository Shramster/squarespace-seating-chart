import { useState } from 'react'
import { CONFIG } from './config.js'
import { useSeatStatus } from './hooks/useSeatStatus.js'
import DayTabs from './components/DayTabs.jsx'
import Stage from './components/Stage.jsx'
import SeatGrid from './components/SeatGrid.jsx'
import Legend from './components/Legend.jsx'
import ReservePanel from './components/ReservePanel.jsx'

export default function App() {
  const [activeShow, setActiveShow] = useState(CONFIG.shows[0])
  const [selected, setSelected] = useState(null)
  const { soldSeats, status } = useSeatStatus(CONFIG.apiBase, activeShow.sku)

  function handleSelectShow(show) {
    setActiveShow(show)
    setSelected(null)
  }

  const selectedMeta = selected ? CONFIG.seatMeta[selected] || { price: CONFIG.defaultPrice } : null

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

      <Stage />

      <SeatGrid
        rowLabels={CONFIG.rowLabels}
        seatsPerRow={CONFIG.seatsPerRow}
        aisleAfterSeat={CONFIG.aisleAfterSeat}
        seatMeta={CONFIG.seatMeta}
        defaultPrice={CONFIG.defaultPrice}
        soldSeats={soldSeats}
        selected={selected}
        onSelectSeat={setSelected}
      />

      <Legend />

      <ReservePanel selected={selected} meta={selectedMeta} buyLink={activeShow.buyLink} />
    </div>
  )
}
