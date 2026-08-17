// One-off generator for test data: Fri/Sat shows Oct 3 - Nov 3 2026.
// Produces a Squarespace product-import CSV (one product per seat per
// show, grouped into a per-show-day Category — see seatProductSlug() in
// src/config.js for why this is per-seat rather than per-show-with-
// variants). Import it into Django directly with
// `manage.py import_squarespace_csv test_data/product_import-shows.csv`.
// Run with: node generate_show_test_data.mjs
import { writeFileSync } from 'node:fs'
import { SEAT_INDEX, seatProductSlug } from '../../src/config.js'

const GA_PRICE = 25
const DELEGATE_PRICE = 45

const START = new Date('2026-10-03T00:00:00')
const END = new Date('2026-11-03T00:00:00')

function fridaysAndSaturdays(start, end) {
  const dates = []
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const day = d.getDay() // 5 = Friday, 6 = Saturday
    if (day === 5 || day === 6) dates.push(new Date(d))
  }
  return dates
}

function showSku(date) {
  const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase()
  return `${month}${String(date.getDate()).padStart(2, '0')}`
}

function showLabel(date) {
  const weekday = date.toLocaleString('en-US', { weekday: 'short' })
  const month = date.toLocaleString('en-US', { month: 'long' })
  return `${weekday}, ${month} ${date.getDate()}, ${date.getFullYear()}`
}

const shows = fridaysAndSaturdays(START, END).map((date) => ({
  date,
  sku: showSku(date),
  label: showLabel(date)
}))

// Only ga/delegate seats are individually sellable — actor seats are
// always reserved for cast and never get a product variant.
const sellableSeats = [...SEAT_INDEX.entries()]
  .filter(([, seat]) => seat.type === 'ga' || seat.type === 'delegate')
  .map(([code, seat]) => ({ code, ...seat }))

const csvRows = []
csvRows.push(
  [
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
)

function csvField(value) {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

for (const show of shows) {
  sellableSeats.forEach((seat) => {
    const sku = `${show.sku}-${seat.code}`
    const price = seat.type === 'delegate' ? DELEGATE_PRICE : GA_PRICE
    const typeLabel = seat.type === 'delegate' ? 'Delegate' : 'General Admission'

    csvRows.push(
      [
        '', // Product ID
        '', // Variant ID
        'PHYSICAL',
        '', // Product Page
        seatProductSlug(show.sku, seat.code),
        `Swing Night — ${show.label} — Seat ${seat.label}`,
        `<p>Reserved seating for the ${show.label} performance — Seat ${seat.label} (${typeLabel}).</p>`,
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
        'Swing Night',
        1,
        0,
        0,
        0,
        'Yes',
        '' // Hosted Image URLs
      ]
        .map(csvField)
        .join(',')
    )
  })
}

writeFileSync(
  new URL('./product_import-shows.csv', import.meta.url),
  csvRows.join('\n') + '\n'
)

// Django imports this same CSV directly (see ticketing's
// import_squarespace_csv management command) — SKUs are
// "<show_sku>-<seat_code>", so no separate seed file is needed.

console.log(`${shows.length} shows: ${shows.map((s) => s.sku).join(', ')}`)
console.log(`${sellableSeats.length} sellable seats/show -> ${csvRows.length - 1} product rows total`)
