import { seatCode } from '../config.js'
import Furniture from './Furniture.jsx'

function SeatBlock({ block, soldSeats, heldSeats, selected, onSelectSeat }) {
  const pitch = block.cellSize + block.gap
  const cols = Math.max(...block.grid.map((row) => row.length))
  const width = cols * pitch - block.gap
  const height = block.grid.length * pitch - block.gap
  const cx = block.x + width / 2
  const cy = block.y + height / 2
  const transform = block.rotation
    ? `rotate(${block.rotation} ${cx} ${cy})`
    : undefined

  const pad = block.cellSize / 2 + 10
  const boxX = block.x - pad
  const boxY = block.y - pad
  const boxWidth = width + pad * 2
  const boxHeight = height + pad * 2

  return (
    <g transform={transform}>
      <rect
        className="sc-block-box"
        x={boxX}
        y={boxY}
        width={boxWidth}
        height={boxHeight}
        rx={6}
      />
      <text className="sc-block-label" x={boxX + boxWidth} y={boxY - 6}>
        {block.name || block.id}
      </text>

      {block.grid.map((row, r) =>
        row.map((cell, c) => {
          if (!cell) return null
          const code = seatCode(block.id, r, c)
          const isSelected = selected === code
          const sold = soldSeats.includes(code)
          const held = !isSelected && heldSeats.includes(code)
          const disabled = sold || held || cell.type === 'actor'
          const seatX = block.x + c * pitch + block.cellSize / 2
          const seatY = block.y + r * pitch + block.cellSize / 2
          const radius = block.cellSize / 2

          const classes = [
            'sc-seat',
            `sc-${cell.type}`,
            sold && 'sc-sold',
            held && 'sc-held',
            isSelected && 'sc-selected'
          ]
            .filter(Boolean)
            .join(' ')

          const statusLabel =
            cell.type === 'actor'
              ? 'reserved for cast'
              : sold
                ? 'sold'
                : held
                  ? 'reserved by another buyer'
                  : 'available'

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

export default function VenueMap({ venue, soldSeats, heldSeats, selected, onSelectSeat }) {
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
            heldSeats={heldSeats}
            selected={selected}
            onSelectSeat={onSelectSeat}
          />
        ))}
      </svg>
    </div>
  )
}
