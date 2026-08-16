export const CONFIG = {
  apiBase: 'https://yourdjangoapp.com', // your Django domain, no trailing slash
  defaultPrice: 25,

  // One entry per performance day. sku must match a Show.sku_prefix in
  // Django; buyLink is that day's Squarespace product page.
  shows: [
    { sku: 'SEPT12', label: 'Sat, Sept 12', buyLink: 'https://yoursite.squarespace.com/sept-12-tickets' },
    { sku: 'SEPT13', label: 'Sun, Sept 13', buyLink: 'https://yoursite.squarespace.com/sept-13-tickets' }
  ],

  // Shared across every show — same seating config each night.
  rowLabels: ['A', 'B', 'C', 'D', 'E'],
  seatsPerRow: 8,
  aisleAfterSeat: 4,

  // Per-seat price / character / GA flag. Seats not listed here fall
  // back to defaultPrice with no character. Keep this in sync with the
  // SeatDefinition rows in Django — this copy only drives display.
  seatMeta: {
    D3: { price: 45, character: 'Ophelia' },
    E5: { price: 20, ga: true },
    E6: { price: 20, ga: true }
  }
}
