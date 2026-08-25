# Backlog

## Styling

- [x] VenueMap background is too bright/low-contrast on plain white — switch it to `#f1f8fd`. (Fixed via `background: var(--venue-bg)` on `.sc-venue`.)
- [x] Seat map elements (seats, labels, furniture) are small and hard to read, especially at mobile breakpoints. Consider making the venue map scrollable/zoomable instead of scaling everything down to fit. (Fixed: below 760px the map now scales down — `min(75% of full width, 700px)`, `min(60%, 520px)` under 480px — inside a scrollable `.sc-venue-wrap`, rather than staying pinned at full size. Full-size-with-scroll felt "way too big" in practice; the current tradeoff keeps seat circles tappable while cutting most of the scroll distance.)

## Backend / Integrations

- [x] Seat hold + precise per-seat checkout link — clicking Reserve now creates a short-lived `SeatHold` (10 min TTL) via `POST /api/shows/<sku>/seats/<code>/hold/`, the seat map shows held seats as unavailable to other browsers, and `ReservePanel` opens checkout for the buyer's exact seat. Squarespace's own per-seat `Stock: 1` (set by the CSV generator) remains the real backstop against overselling if a hold expires mid-checkout.
- [x] Per-seat Squarespace permalinks — catalog restructured from one product per show (with a seat-picker variant) to one product per seat, grouped by show day via `Categories`. Reserve now opens `seatBuyLink()` — a direct permalink to that seat's own product page, no dropdown. Squarespace has no native URL parameter for preselecting a variant, so this made the deferred cart-injection spike below unnecessary: same UX win (no manual seat hunting at checkout) without touching Squarespace's undocumented internal cart JS. See `RUNBOOK.md`.
- [x] ~~Spike: same-origin Squarespace cart injection~~ — superseded by the per-seat-permalink catalog restructure above; no longer needed.
- [x] Document Squarespace webhook registration steps (admin → Advanced → Webhooks, `SQUARESPACE_WEBHOOK_SECRET`) as a runbook — see `RUNBOOK.md`. Still no reconciliation path if a webhook delivery is missed; that gap remains open.

## Content

- [ ] Per-seat-type description text in `ReservePanel` — stakeholders want a short blurb (e.g. what a Delegate/State Chairperson/Candidate seat means, any perks/expectations) to show in the reserve panel for `delegate`, `chair`, and `candidate` seats specifically (not plain `ga` seats). Today `ReservePanel.jsx` only shows seat label, price, and — for `delegate`/`chair` only — a `Delegation: <state>` line; there's no free-text field anywhere in the seat data model (`config.js`'s `seat()`/`D()`/`C()`/`N()` helpers have no `description` option) or in the Squarespace product CSV (`generate_show_test_data.mjs`'s `Description` column is fixed boilerplate: `Reserved seating for the {show} performance — Seat {label} ({type}).`). Needs: (1) a `description` field on the relevant seat-builder helpers in `config.js`, surfaced by `SEAT_INDEX`/`buildSeatIndex`, (2) `ReservePanel.jsx` rendering it when present, (3) decide whether it's also worth folding into the CSV's `Description` column for the Squarespace product page itself, or kept reserve-panel-only.
