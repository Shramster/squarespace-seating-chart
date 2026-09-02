export default function Furniture({ piece }) {
  if (piece.type === 'piano') {
    // Grand piano silhouette supplied by the designer, authored in a
    // 114x124 viewBox — scaled/translated via the wrapping <g> to fit
    // piece.x/y/w/h rather than baking piece-specific coordinates into
    // the path itself.
    const { x, y, w, h } = piece
    const words = piece.label.toUpperCase().split(' ')
    const cx = x + w / 2
    const cy = y + h / 2
    const lineHeight = 18
    const firstLineY = cy - ((words.length - 1) * lineHeight)
    return (
      <g className="sc-furniture sc-piano">
        <g transform={`translate(${x} ${y})`}>
          <path d="M 94,27 C 89,24 86,22 83,20 C 78,18 75,16 71,15 L 35,4 L 3,104 C 10,107 17,109 23,111 C 30,113 36,111 40,110 C 46,108 48,106 51,103 C 58,97 64,90 70,85 C 77,82 83,82 89,81 C 96,79 101,74 102,72 C 106,67 108,61 108,57 C 109,50 108,44 105,39 C 102,34 98,30 94,27 Z" />
        </g>
        <text x={cx} y={firstLineY - 10}>
          {words.map((word, i) => (
            <tspan key={word} x={cx + 10} dy={i === 0 ? 0 : lineHeight}>
              {word}
            </tspan>
          ))}
        </text>
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
