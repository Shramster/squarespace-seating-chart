// One-off generator for test data: Fri/Sat shows Oct 3 - Nov 3 2026.
// Produces a Squarespace product-import CSV (one product per show, one
// variant per sellable seat). Import it into Django directly with
// `manage.py import_squarespace_csv test_data/product_import-shows.csv`.
// Run with: node generate_show_test_data.mjs
import { writeFileSync } from 'node:fs'
import { SEAT_INDEX } from '../../src/config.js'

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
  const productUrl = `swing-night-${show.date.toISOString().slice(0, 10)}`

  sellableSeats.forEach((seat, i) => {
    const sku = `${show.sku}-${seat.code}`
    const price = seat.type === 'delegate' ? DELEGATE_PRICE : GA_PRICE
    const typeLabel = seat.type === 'delegate' ? 'Delegate' : 'General Admission'

    const isFirstRow = i === 0
    csvRows.push(
      [
        '', // Product ID
        '', // Variant ID
        isFirstRow ? 'PHYSICAL' : '',
        '', // Product Page
        isFirstRow ? productUrl : '',
        isFirstRow ? `Swing Night — ${show.label}` : '',
        isFirstRow
          ? `<p>Reserved seating for the ${show.label} performance. Select your seat below.</p>`
          : '',
        sku,
        '', // GTIN
        '', // MPN
        'Seat',
        seat.label,
        'Type',
        typeLabel,
        '', // Option 3 name
        '', // Option 3 value
        price,
        '', // Sale Price
        'No',
        1,
        isFirstRow ? 'Tickets' : '',
        isFirstRow ? 'Swing Night' : '',
        1,
        0,
        0,
        0,
        isFirstRow ? 'Yes' : '',
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
console.log(`${sellableSeats.length} sellable seats/show -> ${csvRows.length - 1} variant rows total`)
