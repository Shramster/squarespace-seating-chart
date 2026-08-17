# Backlog

## Styling

- [x] VenueMap background is too bright/low-contrast on plain white — switch it to `#f1f8fd`. (Fixed via `background: var(--venue-bg)` on `.sc-venue`.)
- [x] Seat map elements (seats, labels, furniture) are small and hard to read, especially at mobile breakpoints. Consider making the venue map scrollable/zoomable instead of scaling everything down to fit. (Fixed: below 760px the map renders at native size in a scrollable `.sc-venue-wrap` instead of shrinking to fit.)

## Backend / Integrations

- [ ] Investigate Squarespace webhooks further — adding seats to the cart from the frontend will need OAuth set up (Squarespace's cart/commerce APIs require it). Scope out what's needed before building the "add to cart" flow.
