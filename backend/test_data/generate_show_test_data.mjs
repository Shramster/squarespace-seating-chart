// Generator for Squarespace product-import CSVs: one full-price catalog
// covering every sellable seat, plus a small $0 test subset (one per tier)
// that's safe to import into a real Squarespace test site. Produces
// Squarespace product-import CSVs (one product per seat per show, grouped
// into a per-show-day Category — see seatProductSlug() in src/config.js
// for why this is per-seat rather than per-show-with-variants). Import
// either directly into Django with
// `manage.py import_squarespace_csv test_data/<file>.csv`.
// Run with: node generate_show_test_data.mjs
import { writeFileSync } from 'node:fs'
import { CONFIG, SEAT_INDEX, seatProductSlug } from '../../src/config.js'
import { ticketDescription } from '../../src/ticketDescriptions.js'

// Real tier pricing (src/config.js's CONFIG.pricesByType is the source of
// truth the frontend uses — mirrored here for the full-price catalog).
const REAL_PRICE = CONFIG.pricesByType

const TYPE_LABEL = {
  ga: 'Gallery',
  delegate: 'Delegate',
  chair: 'State Chairperson',
  candidate: 'Candidate'
}

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

const HEADER = [
  'Product ID [Non Editable]',
  'Variant ID [Non Editable]',
  'Product Type [Non Editable]',
  'Product Page',
  'Product URL',
  'Title',
  'Description',
  'SKU',
  'GTIN',
  'MPN',
  'Option Name 1',
  'Option Value 1',
  'Option Name 2',
  'Option Value 2',
  'Option Name 3',
  'Option Value 3',
  'Price',
  'Sale Price',
  'On Sale',
  'Stock',
  'Categories',
  'Tags',
  'Weight',
  'Length',
  'Width',
  'Height',
  'Visible',
  'Hosted Image URLs'
].join(',')

function csvField(value) {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function buildRows(seats, priceByType) {
  const rows = [HEADER]
  for (const show of shows) {
    seats.forEach((seat) => {
      const sku = `${show.sku}-${seat.code}`
      const price = priceByType[seat.type]

      rows.push(
        [
          '', // Product ID
          '', // Variant ID
          'SERVICE',
          CONFIG.squarespaceProductPage,
          seatProductSlug(show.sku, seat.code),
          `Convention — ${show.label} — Seat ${seat.label}`,
          `<p>${ticketDescription(seat)}</p>`,
          sku,
          '', // GTIN
          '', // MPN
          '', // Option Name 1
          '', // Option Value 1
          '', // Option Name 2
          '', // Option Value 2
          '', // Option Name 3
          '', // Option Value 3
          price,
          '', // Sale Price
          'No',
          1,
          show.label,
          'Convention',
          '', // Weight (physical-shipping only, not applicable to SERVICE)
          '', // Length
          '', // Width
          '', // Height
          'Yes',
          '' // Hosted Image URLs
        ]
          .map(csvField)
          .join(',')
      )
    })
  }
  return rows
}

const zeroPrice = Object.fromEntries(Object.keys(TYPE_LABEL).map((type) => [type, 0]))

const fullRows = buildRows(sellableSeats, REAL_PRICE)
const subsetRows = buildRows(subsetSeats, zeroPrice)

writeFileSync(new URL('./product_import-shows.csv', import.meta.url), fullRows.join('\n') + '\n')
writeFileSync(new URL('./product_import-test-subset.csv', import.meta.url), subsetRows.join('\n') + '\n')

// Django imports these same CSVs directly (see ticketing's
// import_squarespace_csv management command) — SKUs are
// "<show_sku>-<seat_code>", so no separate seed file is needed.

console.log(`${shows.length} shows: ${shows.map((s) => s.sku).join(', ')}`)
console.log(`${sellableSeats.length} sellable seats/show -> ${fullRows.length - 1} rows in product_import-shows.csv`)
console.log(`${subsetSeats.length} seats/show -> ${subsetRows.length - 1} rows in product_import-test-subset.csv`)
