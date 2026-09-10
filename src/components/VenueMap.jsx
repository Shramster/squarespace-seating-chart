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

// 1 -> start, 2 -> next letter after start, ... for previewSwapRowCol
// below. `start` defaults to 'A'; a block's previewLetterStart overrides
// it (e.g. 'B' when a neighboring satellite block already owns 'A').
function numToLetter(n, start = 'A') {
  return String.fromCharCode(start.charCodeAt(0) - 1 + n)
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

      {block.grid.map((row, r) => {
        // Preview-only row/column label (previewGroup/previewRowLetters in
        // config.js) — sequential 1-indexed count of real seats in this
        // row, skipping gaps. Purely additive/visual: `code` below (which
        // drives selection, holds, and sold-seat matching) is completely
        // unaffected by this. Always renders as "<LETTER><NUMBER>" (same
        // order as the real seat codes elsewhere), but WHICH grid axis
        // supplies the letter vs. the number can differ per block:
        // by default the grid ROW is the letter and position-within-row
        // is the number (e.g. "C3" — row C, 3rd seat); a block with
        // previewSwapRowCol: true flips that — position-within-row
        // becomes the letter and the grid ROW becomes the number instead
        // (e.g. "C3" now means column C, row 3) — because for some blocks
        // (e.g. Back Bleachers) the axis the user thinks of as "row" is
        // actually stored as the grid's column axis. previewReverseLetters
        // additionally reverses the letter sequence along whichever axis
        // is currently supplying it (A-D becomes D-A), and previewLetterStart
        // shifts where that sequence begins (e.g. 'B' instead of 'A', when
        // a neighboring satellite block already owns 'A'). previewReverseNumbers
        // is the equivalent flip for the NUMBER axis — 1..N becomes N..1 —
        // and previewNumbersStart is the equivalent shift-of-origin for
        // numbers (e.g. starting at 2 instead of 1, when a neighboring
        // satellite block already owns number 1). Both work in either mode:
        // they apply to the grid-row axis when previewSwapRowCol is set, or
        // the position-within-row axis otherwise (whichever axis is
        // currently supplying the number). None of this touches the grid
        // itself or seatCode().
        const rowSeatCount = row.filter(Boolean).length
        const numberStart = block.previewNumbersStart || 1
        let previewNum = 0
        return row.map((cell, c) => {
          if (!cell) return null
          previewNum += 1
          let previewLabel = null
          if (block.previewSwapRowCol) {
            const letterPos = block.previewReverseLetters ? rowSeatCount - previewNum + 1 : previewNum
            const numberPos = (block.previewReverseNumbers ? block.grid.length - r : r + 1) + numberStart - 1
            previewLabel = `${numToLetter(letterPos, block.previewLetterStart || 'A')}${numberPos}`
          } else if (block.previewRowLetters) {
            const numberPos = (block.previewReverseNumbers ? rowSeatCount - previewNum + 1 : previewNum) + numberStart - 1
            previewLabel = `${block.previewRowLetters[r]}${numberPos}`
          }
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
              {previewLabel && (
                <text
                  className="sc-seat-preview-label"
                  x={seatX}
                  y={seatY}
                  transform={block.rotation ? `rotate(${-block.rotation} ${seatX} ${seatY})` : undefined}
                >
                  {previewLabel}
                </text>
              )}
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
      })}
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
