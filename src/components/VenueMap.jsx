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

// Point string for a 5-point star centered at (cx, cy). `tipAngle` (radians,
// 0 = pointing right, increasing clockwise to match rotatePoint/SVG's
// y-down convention) sets the direction of the first point — defaults to
// straight up.
function starPoints(cx, cy, outerR, innerR, tipAngle = -Math.PI / 2) {
  const points = []
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = tipAngle + (Math.PI / 5) * i
    points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`)
  }
  return points.join(' ')
}

// Local (pre-rotation) tip angle for a seat's star so that, once the
// block's own rotate(...) transform is applied, the star renders point-up
// on screen — matching the logo's fixed, always-upright star — regardless
// of that block's own rotation.
function starTipAngle(rotationDeg) {
  return -Math.PI / 2 - (rotationDeg * Math.PI) / 180
}

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

  const pad = block.cellSize / 2 
  const boxX = block.x - pad
  const boxY = block.y - pad
  const boxWidth = width + pad * 2
  const boxHeight = height + pad * 2
  // showFrame: false suppresses both the border and the section-name
  // label — for small satellite blocks (isolated seats in front of a
  // stage) that shouldn't read as their own labeled section.
  const showFrame = block.showFrame !== false

  // labelPos: 'top' | 'bottom' | 'left' | 'right' keeps the section label
  // screen-upright and anchored to that side of the block regardless of
  // rotation, by computing the rotated box's screen bounding box up front
  // and rendering the label outside the rotated <g> (so it isn't rotated
  // along with the seats/box). labelOffsetX/labelOffsetY nudge the
  // computed position further, for cases where the default anchor still
  // reads awkwardly next to a neighboring block. Omitting labelPos keeps
  // the legacy behavior: a label inside the rotated <g>, anchored to the
  // block's top-right corner pre-rotation (so it rotates along with it).
  let sideLabel = null
  if (showFrame && ['top', 'bottom', 'left', 'right'].includes(block.labelPos)) {
    const corners = [
      { x: boxX, y: boxY },
      { x: boxX + boxWidth, y: boxY },
      { x: boxX, y: boxY + boxHeight },
      { x: boxX + boxWidth, y: boxY + boxHeight }
    ].map((p) => rotatePoint(p.x, p.y, cx, cy, block.rotation || 0))
    const minX = Math.min(...corners.map((p) => p.x))
    const maxX = Math.max(...corners.map((p) => p.x))
    const minY = Math.min(...corners.map((p) => p.y))
    const maxY = Math.max(...corners.map((p) => p.y))
    const offsetX = block.labelOffsetX || 0
    const offsetY = block.labelOffsetY || 0
    const bySide = {
      top: { x: (minX + maxX) / 2, y: minY - 6, anchor: 'middle' },
      bottom: { x: (minX + maxX) / 2, y: maxY + 16, anchor: 'middle' },
      left: { x: minX - 6, y: (minY + maxY) / 2, anchor: 'end' },
      right: { x: maxX + 6, y: (minY + maxY) / 2, anchor: 'start' }
    }
    const pos = bySide[block.labelPos]
    sideLabel = { x: pos.x + offsetX, y: pos.y + offsetY, anchor: pos.anchor }
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
              rx={16}
            />
            {!sideLabel && (
              <text className="sc-block-label" x={boxX + boxWidth} y={boxY - 6} textAnchor="end">
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
          const disabled = sold || cell.type === 'actor'
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
            cell.type === 'actor'
              ? 'reserved for cast'
              : sold
                ? 'sold'
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
              {isSelected && (
                <polygon
                  className="sc-seat-star"
                  points={starPoints(
                    seatX,
                    seatY,
                    radius * 0.92,
                    radius * 0.92 * 0.5,
                    starTipAngle(block.rotation || 0)
                  )}
                />
              )}
            </g>
          )
        })
      )}
      </g>
      {sideLabel && (
        <text
          className="sc-block-label"
          x={sideLabel.x}
          y={sideLabel.y}
          textAnchor={sideLabel.anchor}
          transform={
            block.labelRotation
              ? `rotate(${block.labelRotation} ${sideLabel.x} ${sideLabel.y})`
              : undefined
          }
        >
          {block.name || block.id}
        </text>
      )}
    </>
  )
}

export default function VenueMap({ venue, soldSeats, selected, onSelectSeat }) {
  return (
    <div className="sc-venue-wrap" style={{ '--venue-w': venue.width, '--venue-h': venue.height }}>
      <svg
        className="sc-venue"
        viewBox={`0 0 ${venue.width} ${venue.height}`}
        role="img"
        aria-label="Venue seat map"
      >

        <g transform={`translate(${venue.contentOffsetX ?? 0} ${venue.contentOffsetY ?? 0})`}>
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
        </g>
      </svg>
    </div>
  )
}
