import { Fragment } from 'react'

function seatCode(row, num) {
  return `${row}${num}`
}

export default function SeatGrid({
  rowLabels,
  seatsPerRow,
  aisleAfterSeat,
  seatMeta,
  defaultPrice,
  soldSeats,
  selected,
  onSelectSeat
}) {
  const seatNumbers = Array.from({ length: seatsPerRow }, (_, i) => i + 1)

  return (
    <div className="sc-rows">
      {rowLabels.map((row) => (
        <div className="sc-row" key={row}>
          <span className="sc-row-label">{row}</span>
          <div className="sc-seats">
            {seatNumbers.map((num) => {
              const code = seatCode(row, num)
              const meta = seatMeta[code] || { price: defaultPrice }
              const sold = soldSeats.includes(code)
              const isSelected = selected === code
              const classes = [
                'sc-seat',
                sold && 'sc-sold',
                isSelected && 'sc-selected',
                meta.ga && 'sc-ga'
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <Fragment key={code}>
                  <button
                    type="button"
                    className={classes}
                    disabled={sold}
                    aria-label={`Seat ${code}, ${sold ? 'sold' : 'available'}`}
                    onClick={() => onSelectSeat(code)}
                  >
                    {code}
                  </button>
                  {aisleAfterSeat && num === aisleAfterSeat && <div className="sc-aisle" />}
                </Fragment>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
