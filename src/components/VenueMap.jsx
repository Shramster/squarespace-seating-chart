import { seatCode } from '../config.js'
import Furniture from './Furniture.jsx'

// Rotates a point around (cx, cy) by `angleDeg`, matching SVG's
// rotate(angle, cx, cy) convention (clockwise for positive angle, since
// SVG's y-axis points down).
function rotatePoint(x, y, cx, cy, angleDeg) {
  const rad = (angleDeg * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const dx = x - cx
  const dy = y - cy
  return { x: cx + dx * cos - dy * sin, y: cy + dx * sin + dy * cos }
}

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
  // showFrame: false suppresses both the border and the section-name
  // label — for small satellite blocks (isolated seats in front of a
  // stage) that shouldn't read as their own labeled section.
  const showFrame = block.showFrame !== false

  // labelPos: 'top' keeps the section label screen-upright and above the
  // block regardless of rotation, by computing the rotated box's screen
  // bounding box up front and rendering the label outside the rotated
  // <g> (so it isn't rotated along with the seats/box).
  let topLabel = null
  if (showFrame && block.labelPos === 'top') {
    const corners = [
      { x: boxX, y: boxY },
      { x: boxX + boxWidth, y: boxY },
      { x: boxX, y: boxY + boxHeight },
      { x: boxX + boxWidth, y: boxY + boxHeight }
    ].map((p) => rotatePoint(p.x, p.y, cx, cy, block.rotation || 0))
    const minX = Math.min(...corners.map((p) => p.x))
    const maxX = Math.max(...corners.map((p) => p.x))
    const minY = Math.min(...corners.map((p) => p.y))
    topLabel = {
      x: (minX + maxX) / 2 + (block.labelOffsetX || 0),
      y: minY - 6
    }
  }

  return (
    <>
      <g transform={transform}>
        {showFrame && (
          <>
            <rect
              className="sc-block-box"
              x={boxX}
              y={boxY}
              width={boxWidth}
              height={boxHeight}
              rx={6}
            />
            {block.labelPos !== 'top' && (
              <text className="sc-block-label" x={boxX + boxWidth} y={boxY - 6}>
                {block.name || block.id}
              </text>
            )}
          </>
        )}

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
      {topLabel && (
        <text
          className="sc-block-label"
          x={topLabel.x}
          y={topLabel.y}
          textAnchor="middle"
        >
          {block.name || block.id}
        </text>
      )}
    </>
  )
}

export default function VenueMap({ venue, soldSeats, heldSeats, selected, onSelectSeat }) {
  return (
    <div className="sc-venue-wrap" style={{ '--venue-w': venue.width, '--venue-h': venue.height }}>
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
