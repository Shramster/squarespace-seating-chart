import { seatCode } from '../config.js'
import Furniture from './Furniture.jsx'

function SeatBlock({ block, soldSeats, selected, onSelectSeat }) {
  const pitch = block.cellSize + block.gap
  const cols = Math.max(...block.grid.map((row) => row.length))
  const width = cols * pitch - block.gap
  const height = block.grid.length * pitch - block.gap
  const cx = block.x + width / 2
  const cy = block.y + height / 2
  const transform = block.rotation
    ? `rotate(${block.rotation} ${cx} ${cy})`
    : undefined

  return (
    <g transform={transform}>
      {block.grid.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) return null
          const code = seatCode(block.id, r, c)
          const sold = soldSeats.includes(code)
          const disabled = sold || cell.type === 'actor'
          const isSelected = selected === code
          const seatX = block.x + c * pitch + block.cellSize / 2
          const seatY = block.y + r * pitch + block.cellSize / 2
          const radius = block.cellSize / 2

          const classes = [
            'sc-seat',
            `sc-${cell.type}`,
            sold && 'sc-sold',
            isSelected && 'sc-selected'
          ]
            .filter(Boolean)
            .join(' ')

          const statusLabel =
            cell.type === 'actor' ? 'reserved for cast' : sold ? 'sold' : 'available'

          function activate() {
            if (disabled) return
            onSelectSeat(code)
          }

          return (
            <g
              key={code}
              className={classes}
              role="button"
              tabIndex={disabled ? -1 : 0}
              aria-disabled={disabled}
              aria-label={`Seat ${cell.label || code}, ${statusLabel}`}
              onClick={activate}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  activate()
                }
              }}
            >
              <circle cx={seatX} cy={seatY} r={radius} />
              {cell.label && (
                <text x={seatX} y={seatY}>{cell.label}</text>
              )}
            </g>
          )
        })
      )}
    </g>
  )
}

export default function VenueMap({ venue, soldSeats, selected, onSelectSeat }) {
  return (
    <div className="sc-venue-wrap" style={{ '--venue-w': `${venue.width}px` }}>
      <svg
        className="sc-venue"
        viewBox={`0 0 ${venue.width} ${venue.height}`}
        role="img"
        aria-label="Venue seat map"
      >
        <rect
          className="sc-wall"
          x={venue.walls.x}
          y={venue.walls.y}
          width={venue.walls.w}
          height={venue.walls.h}
          rx={venue.walls.rx}
        />

        {venue.furniture.map((piece, i) => (
          <Furniture key={i} piece={piece} />
        ))}

        {venue.blocks.map((block) => (
          <SeatBlock
            key={block.id}
            block={block}
            soldSeats={soldSeats}
            selected={selected}
            onSelectSeat={onSelectSeat}
          />
        ))}
      </svg>
    </div>
  )
}
