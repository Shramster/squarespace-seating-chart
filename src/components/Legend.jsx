import { CONFIG } from '../config.js'

export default function Legend() {
  const { ga, delegate, chair, candidate } = CONFIG.pricesByType
  return (
    <div className="sc-legend">
      <span className="sc-legend-item"><span className="sc-legend-swatch"></span>Gallery (${ga})</span>
      <span className="sc-legend-item"><span className="sc-legend-swatch delegate"></span>Delegate (${delegate})</span>
      <span className="sc-legend-item"><span className="sc-legend-swatch chair"></span>Chairperson (${chair})</span>
      <span className="sc-legend-item"><span className="sc-legend-swatch candidate"></span>Candidate (${candidate})</span>
      <span className="sc-legend-item">
        <span className="sc-legend-swatch gold">
          <svg viewBox="0 0 14 14" className="sc-legend-star">
            <polygon points="7,0.5 8.7,4.3 12.8,4.7 9.7,7.3 10.7,11.4 7,9.2 3.3,11.4 4.3,7.3 1.2,4.7 5.3,4.3" />
          </svg>
        </span>
        Selection
      </span>
      <span className="sc-legend-item"><span className="sc-legend-swatch actor"></span>Unavailable</span>
    </div>
  )
}
