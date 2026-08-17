# Backlog

## Styling

- [x] VenueMap background is too bright/low-contrast on plain white — switch it to `#f1f8fd`. (Fixed via `background: var(--venue-bg)` on `.sc-venue`.)
- [x] Seat map elements (seats, labels, furniture) are small and hard to read, especially at mobile breakpoints. Consider making the venue map scrollable/zoomable instead of scaling everything down to fit. (Fixed: below 760px the map renders at native size in a scrollable `.sc-venue-wrap` instead of shrinking to fit.)

## Backend / Integrations

- [x] Seat hold + precise per-seat checkout link — clicking Reserve now creates a short-lived `SeatHold` (10 min TTL) via `POST /api/shows/<sku>/seats/<code>/hold/`, the seat map shows held seats as unavailable to other browsers, and `ReservePanel` opens checkout for the buyer's exact seat. Squarespace's own per-seat `Stock: 1` (set by the CSV generator) remains the real backstop against overselling if a hold expires mid-checkout.
- [x] Per-seat Squarespace permalinks — catalog restructured from one product per show (with a seat-picker variant) to one product per seat, grouped by show day via `Categories`. Reserve now opens `seatBuyLink()` — a direct permalink to that seat's own product page, no dropdown. Squarespace has no native URL parameter for preselecting a variant, so this made the deferred cart-injection spike below unnecessary: same UX win (no manual seat hunting at checkout) without touching Squarespace's undocumented internal cart JS. See `RUNBOOK.md`.
- [x] ~~Spike: same-origin Squarespace cart injection~~ — superseded by the per-seat-permalink catalog restructure above; no longer needed.
- [x] Document Squarespace webhook registration steps (admin → Advanced → Webhooks, `SQUARESPACE_WEBHOOK_SECRET`) as a runbook — see `RUNBOOK.md`. Still no reconciliation path if a webhook delivery is missed; that gap remains open.
