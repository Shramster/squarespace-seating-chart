# Backlog

## Styling

- [x] VenueMap background is too bright/low-contrast on plain white — switch it to `#f1f8fd`. (Fixed via `background: var(--venue-bg)` on `.sc-venue`.)
- [x] Seat map elements (seats, labels, furniture) are small and hard to read, especially at mobile breakpoints. Consider making the venue map scrollable/zoomable instead of scaling everything down to fit. (Fixed: below 760px the map renders at native size in a scrollable `.sc-venue-wrap` instead of shrinking to fit.)

## Backend / Integrations

- [x] Seat hold + precise per-seat checkout link — clicking Reserve now creates a short-lived `SeatHold` (10 min TTL) via `POST /api/shows/<sku>/seats/<code>/hold/`, the seat map shows held seats as unavailable to other browsers, and `ReservePanel` shows the exact seat SKU and opens checkout for the buyer to select it. Squarespace's own per-seat `Stock: 1` (set by the CSV generator) remains the real backstop against overselling if a hold expires mid-checkout.
- [ ] Spike: same-origin Squarespace cart injection — since the embed's bundle runs on the Squarespace page itself (Code Block), invoking Squarespace's own client-side commerce JS/DOM to add the exact seat to cart may be possible without OAuth (unlike their server-side Commerce REST API, which does require it). Undocumented behavior — validate live against the real site, with a rollback plan, before committing to it as a buyLink replacement.
- [ ] Document Squarespace webhook registration steps (admin → Advanced → Webhooks, `SQUARESPACE_WEBHOOK_SECRET`) as a runbook, and note there's currently no reconciliation path if a webhook delivery is missed.
