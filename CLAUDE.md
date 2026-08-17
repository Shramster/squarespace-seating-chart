# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A small React + Vite embed: an interactive theater seat chart meant to be
compiled into two static files and dropped into a Squarespace Code Block,
with a Django backend as the source of truth for what's sold/charged.

## Commands

```
npm install
npm run dev       # local dev server (vite), serves on 127.0.0.1:3000
npm run build     # produces dist/seat-chart.js and dist/seat-chart.css
npm run preview   # preview the production build
```

A `Makefile` wraps the same commands, plus backend/local-testing helpers:

```
make install         # npm install
make dev             # backend (docker compose up -d) + vite dev server; tears backend down on exit
make dev-lan         # same, but reachable from other devices on the LAN (e.g. a phone) — see docker-compose.lan.yml
make build           # npm run build
make preview         # npm run preview
make backend-up      # cd backend && docker compose up (foreground)
make backend-down    # cd backend && docker compose down
make logs            # tail the backend container's logs
make clean           # rm -rf dist node_modules
```

The frontend has no test suite or linter configured. The Django backend
(`backend/`) has a `ticketing/tests.py` suite — run it with
`docker compose exec web python manage.py test ticketing`. Always run
Django management commands through `docker compose exec web`, not a
local venv — there isn't one set up for this repo.

## Frontend architecture

- Entry point `src/main.jsx` mounts `<App />` into `#seat-chart-root` — this
  div is provided by the Squarespace page in production, and by
  `index.html` locally. If the element isn't found, mounting silently
  no-ops (logs an error) rather than throwing.
- `src/config.js` is the single source of *display* data: API base URL, the
  list of shows (`sku` + `buyLink` per performance day), and
  `CONFIG.venue` — the real room modeled as discrete seating `blocks` (each
  with position/rotation, since several blocks are rotated to follow the
  venue's angled walls) plus non-seat `furniture` (piano, stage/podium,
  wheelchair ramp). This file is the origin of the seat catalog — the
  Django backend's `SeatSkuMap` rows are generated *from* it (via
  `backend/test_data/generate_show_test_data.mjs` → the Squarespace CSV
  → `import_squarespace_csv`, see Backend architecture below) — but once
  imported, Django/Squarespace are the actual source of truth for what's
  charged; this file only drives what's shown, and must be kept in sync
  by hand if seats are added/moved after the initial import.
- Every seat is one of three types, built with the `A()`/`G()`/`D(label)`
  helpers at the top of `config.js`: `actor` (cast, always
  blocked/unsellable client-side, regardless of the sold-seats API — no
  backend change needed to reserve a cast seat), `ga` (general admission,
  individually selectable), or `delegate` (assigned to a state, labeled
  with that state's code, e.g. `TX`). A seat's `code` is derived from its
  block id + grid position (`buildSeatIndex` / `seatCode` in `config.js`),
  *not* its type — so reassigning which physical seats are "Actor" seats
  between runs is a one-line edit of that grid cell, with no effect on
  identity or sold-seat tracking. `SEAT_INDEX` (a `Map<code, seat>` built
  once at module load) is the lookup used by `App.jsx` to resolve the
  selected seat's price/label.
- `src/hooks/useSeatStatus.js` fetches seat status from
  `{apiBase}/api/shows/{sku}/seats/` — `{soldSeats, heldSeats}` — and
  re-fetches whenever `sku` changes (e.g. switching day tabs in
  `DayTabs`). Exposes `status: 'loading' | 'ready' | 'error'`; on fetch
  failure the UI shows a "verify seats before confirming a sale" warning
  rather than blocking interaction.
- State lives in `App.jsx` only: `activeShow`, `selected` seat code, and
  `holdState`/`holdError` for the in-flight reserve request (reset
  whenever `selected` or the active show changes). Everything else is
  derived/passed down as props. `VenueMap.jsx` renders `CONFIG.venue` as
  one SVG (`viewBox`-scaled, so it stays responsive without the old
  grid's manual mobile breakpoint): a wall outline, `Furniture.jsx`
  pieces, and one rotated `<g>` per block containing a `<circle>`+`<text>`
  per seat cell (`null` cells are gaps/walkways, not seats). Sold *and*
  held seats are both rendered disabled/unselectable, with distinct
  `sc-sold`/`sc-held` styling. `Legend.jsx` and `ReservePanel.jsx` are
  otherwise presentational.
- Selecting a seat doesn't purchase anything. Clicking "Reserve this
  seat" in `ReservePanel` calls `App.jsx`'s `handleReserve`, which
  `POST`s `{apiBase}/api/shows/{sku}/seats/{code}/hold/` to create a
  short-lived hold (see backend section below), then opens that show's
  Squarespace `buyLink` in a new tab. `ReservePanel` displays the exact
  seat SKU (`{showSku}-{seatCode}`) so the buyer knows what to select at
  checkout — there's no automated Squarespace cart integration (see
  BACKLOG.md for the deferred same-origin cart-injection spike). A 409
  from the hold endpoint (already sold/already held) surfaces as an
  inline error and the buyer has to pick a different seat. Purchasing
  itself is entirely out of this app's scope.
- `vite.config.js` pins output filenames (`seat-chart.js` /
  `seat-chart.css`, no content hash, `cssCodeSplit: false`) so the
  Squarespace embed snippet never needs to change between deploys —
  ship a change by rebuilding and re-uploading the two `dist/` files to
  wherever Django serves static assets from.

## Backend architecture

`backend/` is a standalone Django 4.2 + DRF `ticketing` app (SQLite,
`django-cors-headers`), run via `docker compose` (`make backend-up`, or
`make dev` which brings it up alongside the frontend). It's the source
of truth for what's sold — this repo's frontend only mirrors it for
display.

- **Models** (`backend/ticketing/models.py`):
  - `Show` — `sku` (unique, matches `CONFIG.shows[].sku` in
    `src/config.js`), `label`, `is_active`.
  - `SeatSkuMap` — maps a `(show, seat_code)` pair to a
    `squarespace_sku`, i.e. the Squarespace product variant SKU for that
    seat. Unique on both `(show, seat_code)` and `(show, squarespace_sku)`.
  - `SeatSale` — records a completed sale: `show`, `seat_code`,
    `squarespace_order_id`, `squarespace_line_item_id`, `sold_at`,
    `voided_at` (set on refund/cancellation). Unique on
    `(squarespace_order_id, squarespace_line_item_id)` for webhook
    idempotency, plus a partial unique constraint on `(show, seat_code)`
    scoped to `voided_at IS NULL` — a seat can only be actively sold
    once, but can be resold after a void.
  - `SeatHold` — a short-lived (10 min TTL) soft reservation created
    when a buyer clicks Reserve in the embed, so other browsers don't
    also try to buy that seat mid-checkout. Expiry is lazy (filtered on
    read/write, e.g. `expires_at__gt=now()`), no scheduled cleanup task.
    This is a UX nicety, not an inventory lock — the actual overselling
    backstop is Squarespace's own per-seat `Stock: 1` set at CSV import
    time (see below), which blocks a second purchase at checkout
    regardless of hold state.
- **Endpoints** (`backend/ticketing/views.py`,
  `backend/ticketing/urls.py`):
  - `GET /api/shows/<sku>/seats/` — public, no auth. Returns
    `{soldSeats: [...], heldSeats: [...]}`, both lists of seat codes.
    This is what `useSeatStatus.js` polls.
  - `POST /api/shows/<sku>/seats/<code>/hold/` — public, no auth.
    Creates a `SeatHold`; `409` if the seat is already sold or already
    held by someone else. Called by `ReservePanel`'s Reserve button.
  - `POST /api/webhooks/squarespace/orders/` — receives
    `order.create`/`order.update` notifications from Squarespace.
    Verifies the `Squarespace-Signature` header via HMAC-SHA256 against
    `SQUARESPACE_WEBHOOK_SECRET` (`backend/ticketing/webhook_auth.py`;
    missing/invalid signature → `403`). Maps each line item's SKU to a
    seat via `SeatSkuMap`, unknown SKUs are logged and skipped without
    failing the request. On a normal order, upserts a `SeatSale`
    (idempotent on order/line-item id) and clears any matching
    `SeatHold`. On a cancellation (`order.update` +
    `fulfillmentStatus == "CANCELED"`), voids the matching `SeatSale`
    instead. Squarespace's admin webhook-registration steps and the
    lack of a reconciliation path for missed deliveries aren't
    documented anywhere yet — see BACKLOG.md.
- **Catalog import — `backend/ticketing/management/commands/import_squarespace_csv.py`**:
  `manage.py import_squarespace_csv <csv_path>`. Reads a Squarespace
  product-import CSV's `SKU` column, expecting the format
  `<show_sku>-<seat_code>` (e.g. `OCT03-L-0-0`) — rows without a `-` are
  skipped. Upserts one `Show` per distinct `show_sku` (label defaults to
  the sku string; rename in the admin for something friendlier) and a
  `SeatSkuMap` row per seat, keyed on `(show, seat_code)` so re-running
  the import after an updated export updates mappings instead of
  duplicating them.
- **Test-data / catalog generator — `backend/test_data/generate_show_test_data.mjs`**
  (run with `node generate_show_test_data.mjs`): reads `SEAT_INDEX` from
  `src/config.js` and writes a full Squarespace product-import CSV
  (`product_import-shows.csv`) — one product per show, one variant per
  sellable seat (`ga`/`delegate` only; `actor` seats are excluded, never
  sold). SKU is `<show.sku>-<seat.code>`, matching what
  `import_squarespace_csv` expects. **`Stock` is hardcoded to `1` per
  variant** — this is what makes Squarespace itself refuse a second sale
  of an already-sold seat, independent of anything this app does. Price
  is `$25` for `ga` / `$45` for `delegate` (`GA_PRICE`/`DELEGATE_PRICE`
  constants). The Django import command reads this *same* CSV directly —
  no separate JSON seed format, so the two systems can't drift apart.
- **Settings** (`backend/ticketing_dev/settings.py`): `SECRET_KEY` and
  `SQUARESPACE_WEBHOOK_SECRET` are required env vars with no default (by
  design — fails loudly rather than signing with a predictable value).
  `CORS_ALLOWED_ORIGINS` (env var, default `http://127.0.0.1:3000`) must
  include whatever origin the frontend dev server runs on. `DEBUG = True`
  is hardcoded — this is dev-only config, not hardened for production.

## Deploy loop

Edit → `npm run build` → upload `dist/seat-chart.js` + `dist/seat-chart.css`
to the Django static dir → done. Squarespace itself is a permanent stub
(`<div id="seat-chart-root">` + `<link>` + `<script src>`) that never
needs to be touched again after initial setup.

Loading the bundle via `<script src>` is a cross-origin script load and
doesn't need CORS. CORS only applies to the `fetch()` calls
`useSeatStatus` makes back to `/api/shows/<sku>/seats/` — that's handled
by `CORS_ALLOWED_ORIGINS` in the Django `ticketing` app, which must allow
`http://127.0.0.1:3000` for local dev.

## Before going live

Fill in real values in `src/config.js`: `apiBase`, each show's `sku` and
`buyLink`, and `CONFIG.venue` — verify block positions/rotation and every
seat's type/label against the physical venue (the current layout is a
transcription from a reference image/diagram, not a measured floor plan).
