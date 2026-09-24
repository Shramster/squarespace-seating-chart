// Shared Squarespace product-import CSV format — used by
// generate_show_test_data.mjs and any smaller one-off slices (e.g. a
// smoke-test subset for a real site) so they can't drift out of sync
// with the real catalog's column layout/content.
import { CONFIG, seatProductSlug, showLink, ticketTitle } from '../../src/config.js'
import { ticketDescription } from '../../src/ticketDescriptions.js'

export const HEADER = [
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

export function csvField(value) {
  const s = String(value ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// One CSV row for a single seat/show/price combination.
export function buildRow(show, seat, price) {
  const sku = `${show.sku}-${seat.code}`
  return [
    '', // Product ID
    '', // Variant ID
    'SERVICE',
    CONFIG.squarespaceProductPage,
    seatProductSlug(show.sku, seat.code),
    ticketTitle(show, seat),
    // Seat code (without the show-date prefix) as its own bolded first
    // line, so a buyer/admin can immediately confirm which exact seat
    // this product is for.
    `<p><strong>Seat: ${seat.code}</strong></p><p>${ticketDescription(seat)}</p><p><a href="${showLink(show.sku)}">&larr; Back to ${show.label}</a></p>`,
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
    // Preview shows get a second, shared category so a single Squarespace
    // discount code scoped to "Preview Shows" covers all four preview
    // performances at once (see SHOW_DATES in src/config.js).
    show.preview ? `${show.label}, Preview Shows` : show.label,
    'Convention',
    '', // Weight (physical-shipping only, not applicable to SERVICE)
    '', // Length
    '', // Width
    '', // Height
    'Yes',
    // Same static image for every product — served by the same
    // whitenoise/STATICFILES_DIRS mechanism as seat-chart.js/.css (see
    // backend/ticketing_dev/settings.py), copied verbatim from
    // public/ticket_product_image.jpg by Vite's build (not bundled
    // through the JS-asset pipeline, which would collide with other
    // bundled assets — see vite.config.js's assetFileNames). Tried
    // pointing this at Squarespace's own CDN URL for the same image to
    // speed up bulk import, but that broke image loading on import — back
    // to this URL; upload products individually instead.
    `${CONFIG.apiBase}/static/ticket_product_image.jpg`
  ]
    .map(csvField)
    .join(',')
}
