// Generator for Squarespace product-import CSVs: one full-price catalog
// covering every sellable seat, one per-show slice of that same catalog
// (for importing a single performance date at a time — e.g. while
// waiting on stakeholder sign-off for the rest), plus a small $0 test
// subset (one per tier) that's safe to import into a real Squarespace
// test site. Produces Squarespace product-import CSVs (one product per
// seat per show, grouped into a per-show-day Category — see
// seatProductSlug() in src/config.js for why this is per-seat rather
// than per-show-with-variants). Import either directly into Django with
// `manage.py import_squarespace_csv test_data/<file>.csv`.
// Run with: node generate_show_test_data.mjs
import { writeFileSync } from 'node:fs'
import { CONFIG, SEAT_INDEX, TYPE_LABEL } from '../../src/config.js'
import { HEADER, buildRow } from './csv_common.mjs'

const SELLABLE_TYPES = new Set(Object.keys(TYPE_LABEL))

// Shows come straight from config.js — currently just the one placeholder
// show left in CONFIG.shows; swap in real performance dates there when
// they're finalized, no change needed here.
const shows = CONFIG.shows

const sellableSeats = [...SEAT_INDEX.entries()]
  .filter(([, seat]) => SELLABLE_TYPES.has(seat.type))
  .map(([code, seat]) => ({ code, ...seat }))

// Small subset for safe test imports: one seat per tier, capped at 10.
const subsetSeats = Object.keys(TYPE_LABEL).flatMap((type) =>
  sellableSeats.filter((seat) => seat.type === type).slice(0, Math.ceil(10 / Object.keys(TYPE_LABEL).length))
).slice(0, 10)

function buildRows(showsToInclude, seats, priceByType) {
  const rows = [HEADER]
  for (const show of showsToInclude) {
    seats.forEach((seat) => {
      rows.push(buildRow(show, seat, priceByType[seat.type]))
    })
  }
  return rows
}

const zeroPrice = Object.fromEntries(Object.keys(TYPE_LABEL).map((type) => [type, 0]))

const fullRows = buildRows(shows, sellableSeats, CONFIG.pricesByType)
const subsetRows = buildRows(shows, subsetSeats, zeroPrice)

writeFileSync(new URL('./product_import-shows.csv', import.meta.url), fullRows.join('\n') + '\n')
writeFileSync(new URL('./product_import-test-subset.csv', import.meta.url), subsetRows.join('\n') + '\n')

console.log(`${shows.length} shows: ${shows.map((s) => s.sku).join(', ')}`)
console.log(`${sellableSeats.length} sellable seats/show -> ${fullRows.length - 1} rows in product_import-shows.csv`)
console.log(`${subsetSeats.length} seats/show -> ${subsetRows.length - 1} rows in product_import-test-subset.csv`)

// Per-show slices of the same full-price catalog — for importing one
// performance date at a time (e.g. OCT03 now, OCT04 once it's approved)
// without needing a separate hand-maintained file per show.
for (const show of shows) {
  const rows = buildRows([show], sellableSeats, CONFIG.pricesByType)
  const filename = `product_import-${show.sku.toLowerCase()}.csv`
  writeFileSync(new URL(`./${filename}`, import.meta.url), rows.join('\n') + '\n')
  console.log(`${sellableSeats.length} seats -> ${rows.length - 1} rows in ${filename}`)
}

// Django imports these same CSVs directly (see ticketing's
// import_squarespace_csv management command) — SKUs are
// "<show_sku>-<seat_code>", so no separate seed file is needed.
