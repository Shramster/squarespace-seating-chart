// A tiny, real-priced slice of OCT03 for a live-site smoke test before
// bulk-importing the full catalog: one seat per sellable type, plus one
// extra ADA-flagged seat so the ADA sentence/badge can be checked too.
// Uses the exact same row format as generate_show_test_data.mjs (via
// csv_common.mjs) so what you see here matches the real import exactly —
// only the row count differs.
import { writeFileSync } from 'node:fs'
import { CONFIG, SEAT_INDEX, TYPE_LABEL } from '../../src/config.js'
import { HEADER, buildRow } from './csv_common.mjs'

const show = CONFIG.shows.find((s) => s.sku === 'OCT03')
if (!show) throw new Error('OCT03 not found in CONFIG.shows')

const sellableSeats = [...SEAT_INDEX.values()].filter((seat) => TYPE_LABEL[seat.type])

// One of each type — first match per type, in a fixed, stable order.
const oneOfEachType = Object.keys(TYPE_LABEL)
  .map((type) => sellableSeats.find((seat) => seat.type === type))
  .filter(Boolean)

// Plus one more ADA-flagged seat, distinct from the above, to check the
// ADA sentence/badge render correctly too.
const adaExtra = sellableSeats.find(
  (seat) => seat.ada && !oneOfEachType.some((s) => s.code === seat.code)
)

const seats = adaExtra ? [...oneOfEachType, adaExtra] : oneOfEachType

const rows = [HEADER, ...seats.map((seat) => buildRow(show, seat, CONFIG.pricesByType[seat.type]))]

writeFileSync(new URL('./product_import-smoke-test.csv', import.meta.url), rows.join('\n') + '\n')

console.log(`${seats.length} seats -> product_import-smoke-test.csv (show ${show.sku})`)
console.log(seats.map((s) => `${s.code} (${s.type}${s.label && s.label !== s.code ? '/' + s.label : ''}${s.ada ? ', ADA' : ''})`).join('\n'))
