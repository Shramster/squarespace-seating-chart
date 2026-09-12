import { CONFIG, TYPE_LABEL } from '../config.js'

// Row order/content transcribed from the reference seating-table image
// (backend/static's old seating-table.jpg) — kept here as data so the
// table stays a single source of truth instead of a flat image.
// `values` are given in the same order as TIERS below: [ga, delegate,
// chair, candidate]. `true` = starred, a number = shown as-is, `false`/
// `null` = blank.
const ROWS = [
  { label: 'Assigned Seat', values: [true, true, true, true] },
  { label: 'Proximity to Actors', values: [false, true, true, true] },
  { label: 'Cast Vote by Ballot', values: [false, true, true, true] },
  { label: 'Commemorative Button', values: [false, true, true, true] },
  { label: 'Scripted Lines (in Act 2)', values: [false, false, true, false] },
  {
    label: (
      <>
        <em>Convention</em> Tee-shirt
      </>
    ),
    values: [false, false, false, true]
  },
  { label: 'Commemorative Photo', values: [false, false, false, true] },
  { label: 'Meal Tickets ($5 value)', values: [null, 1, 2, 2] }
]

const TIERS = Object.keys(TYPE_LABEL) // ['ga', 'delegate', 'chair', 'candidate']

function Star() {
  return (
    <svg viewBox="0 0 14 14" className="sc-price-table-star" aria-hidden="true">
      <polygon points="7,0.5 8.7,4.3 12.8,4.7 9.7,7.3 10.7,11.4 7,9.2 3.3,11.4 4.3,7.3 1.2,4.7 5.3,4.3" />
    </svg>
  )
}

function Cell({ value }) {
  if (value === true) return <Star />
  if (typeof value === 'number') return value
  return null
}

export default function PriceTable() {
  return (
    <div className="sc-price-table-wrap">
      <table className="sc-price-table">
        <thead>
          <tr>
            <th scope="col"></th>
            {TIERS.map((tier) => (
              <th scope="col" key={tier}>
                <span className="sc-price-table-tier">{TYPE_LABEL[tier]}</span>
                <span className="sc-price-table-price">${CONFIG.pricesByType[tier]}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, rowIndex) => (
            <tr key={rowIndex}>
              <th scope="row">{row.label}</th>
              {row.values.map((value, i) => (
                <td key={TIERS[i]}>
                  <Cell value={value} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
