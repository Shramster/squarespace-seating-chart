export default function Furniture({ piece }) {
  if (piece.type === 'piano') {
    return (
      <g className="sc-furniture sc-piano">
        <rect x={piece.x} y={piece.y} width={piece.w} height={piece.h} rx={6} />
        <text x={piece.x + piece.w / 2} y={piece.y + piece.h / 2}>{piece.label}</text>
      </g>
    )
  }

  if (piece.type === 'stage') {
    const podium = piece.podium || { w: 60, h: 30 }
    const podiumX = piece.x + piece.w / 2 - podium.w / 2
    const podiumY = piece.y + piece.h / 2 - podium.h / 2
    return (
      <g className="sc-furniture sc-stage">
        <rect x={piece.x} y={piece.y} width={piece.w} height={piece.h} rx={4} />
        <rect className="sc-podium" x={podiumX} y={podiumY} width={podium.w} height={podium.h} />
        <text x={piece.x + piece.w / 2} y={piece.y + 18}>{piece.label}</text>
      </g>
    )
  }

  if (piece.type === 'table') {
    const podium = piece.podium || { w: 30, h: 30 }
    const cx = piece.x + piece.w / 2
    const cy = piece.y + piece.h / 2
    return (
      <g className="sc-furniture sc-table">
        <rect x={piece.x} y={piece.y} width={piece.w} height={piece.h} rx={4} />
        <rect
          className="sc-podium"
          x={(cx + podium.w / 2)}
          y={(cy + podium.h / 2)}
          width={podium.w}
          height={podium.h}
          transform={`rotate(45 ${cx} ${cy})`}
        />
      </g>
    )
  }

  if (piece.type === 'wheelchair') {
    const cx = piece.x + piece.w / 2
    const cy = piece.y + piece.h / 2
    return (
      <g className="sc-furniture sc-wheelchair">
        <rect x={piece.x} y={piece.y} width={piece.w} height={piece.h} rx={6} />
        <text x={cx} y={cy} className="sc-wheelchair-icon">&#9855;</text>
      </g>
    )
  }

  return null
}
