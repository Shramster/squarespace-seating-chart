export default function Legend() {
  return (
    <div className="sc-legend">
      <span className="sc-legend-item"><span className="sc-legend-swatch"></span>Available</span>
      <span className="sc-legend-item"><span className="sc-legend-swatch delegate"></span>Delegate</span>
      <span className="sc-legend-item"><span className="sc-legend-swatch gold"></span>Selected</span>
      <span className="sc-legend-item"><span className="sc-legend-swatch sold"></span>Sold</span>
      <span className="sc-legend-item"><span className="sc-legend-swatch held"></span>Reserved</span>
      <span className="sc-legend-item"><span className="sc-legend-swatch actor"></span>Reserved (cast)</span>
    </div>
  )
}
