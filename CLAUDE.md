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
- `src/config.js` is the single source of *display* data: API base URL,
  `squarespaceBase` (the Squarespace site domain) and
  `squarespaceProductPage` (the slug of that site's existing Store page —
  both feed `seatBuyLink()`, see below), the list of shows
  (`sku` + `label` per performance day — each seat's buy link is computed,
  not stored per show; see below), and `CONFIG.venue` — the real room
  modeled as discrete seating `blocks` (each
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
  block id + grid position (`buildSeatIndex` / `seatCode` in `config.js`,
  format `<blockId><row+1>-<col+1>`, e.g. `L1-1`), *not* its type — so
  reassigning which physical seats are "Actor" seats between runs is a
  one-line edit of that grid cell, with no effect on identity or
  sold-seat tracking. `buildSeatIndex` throws at module load if two cells
  ever produce the same `code` (only possible with a poorly-chosen block
  id). For non-delegate seats this `code` doubles as the buyer-facing
  `label` (e.g. seat `L1-1` displays as "L1-1"); delegate seats keep a
  separate `label` (their assigned state) while `code` stays
  position-based underneath, so two delegates assigned the same state
  never collide in identity. `SEAT_INDEX` (a `Map<code, seat>` built once
  at module load) is the lookup used by `App.jsx` to resolve the selected
  seat's price/label.
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
  short-lived hold (see backend section below), then opens
  `seatBuyLink(showSku, seatCode)` (`config.js`) in a new tab — a
  permalink straight to that seat's own Squarespace product, computed as
  `squarespaceBase` + `squarespaceProductPage` + `/p/` + `seatProductSlug()`
  (the `/p/` segment matches how this Squarespace site's Store page
  actually renders individual product URLs — confirm this against your
  own site's product URL shape before reusing this pattern elsewhere).
  Every seat is its own
  Squarespace product (not a variant of a per-show product), so there's no
  dropdown for the buyer to hunt through; see `RUNBOOK.md` for the
  catalog/CSV shape this depends on. A 409 from the hold endpoint (already
  sold/already held) surfaces as an inline error and the buyer has to pick
  a different seat. Purchasing itself is entirely out of this app's scope.
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
    `(squarespace_order_id, squarespace_line_item_id)` so both the webhook
    and the order poller (see below) can upsert idempotently, plus a
    partial unique constraint on `(show, seat_code)`
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
    missing/invalid signature → `403`), then hands the order payload to
    `sync_order()` (see below). **Currently unused in practice**:
    Squarespace's Webhook Subscriptions API is OAuth-only — a plain
    site-level Commerce API key (Settings → Advanced → API Keys) cannot
    create a subscription, regardless of the permissions selected on it.
    Standing up real push webhooks means registering a Developer Platform
    OAuth app and completing its authorization flow first; nobody has
    done that yet, so this endpoint is dead code until someone does. The
    live path today is the poller below.
  - **Order sync — `backend/ticketing/order_sync.py`'s `sync_order(order)`**:
    shared by the webhook view above and the poller. Takes one Squarespace
    order dict (`{id, fulfillmentStatus, lineItems: [{id, sku}]}`), maps
    each line item's SKU to a seat via `SeatSkuMap` (unknown SKUs are
    logged and skipped, not fatal), and either upserts a `SeatSale`
    (idempotent on order/line-item id) and clears the matching `SeatHold`,
    or — if `fulfillmentStatus == "CANCELED"` — voids the matching
    `SeatSale` instead.
  - **`manage.py poll_squarespace_orders`** (`backend/ticketing/management/commands/poll_squarespace_orders.py`):
    the actual live order-sync mechanism, since webhooks aren't wired up
    (see above). Polls `GET https://api.squarespace.com/1.0/commerce/orders`
    with a plain `SQUARESPACE_API_KEY` (Orders: Read Only is enough) as a
    Bearer token, and calls `sync_order()` on each result. Re-scans a
    rolling `--lookback-hours` window (default 24) every poll rather than
    tracking a cursor between runs — `sync_order()` is idempotent, so
    this is simpler than persisting poll state and safe across restarts.
    Loops forever on `--interval` seconds (default 60) unless `--once` is
    passed. Runs as the `poller` service in `docker-compose.yml`, gated
    behind the `poller` Compose profile (`docker compose --profile poller
    up -d poller`) so it doesn't start for everyone running `make dev` —
    most local dev doesn't have `SQUARESPACE_API_KEY` set, and the poller
    hits the real live Squarespace site (there's no separate sandbox/test
    site), so only start it when that's actually intended. There's still
    no reconciliation path if the poller itself is down for a stretch
    longer than `--lookback-hours` — see BACKLOG.md.
- **Catalog import — `backend/ticketing/management/commands/import_squarespace_csv.py`**:
  `manage.py import_squarespace_csv <csv_path>`. Reads a Squarespace
  product-import CSV's `SKU` column, expecting the format
  `<show_sku>-<seat_code>` (e.g. `OCT03-L1-1`) — rows without a `-` are
  skipped. Upserts one `Show` per distinct `show_sku` (label defaults to
  the sku string; rename in the admin for something friendlier) and a
  `SeatSkuMap` row per seat, keyed on `(show, seat_code)` so re-running
  the import after an updated export updates mappings instead of
  duplicating them.
- **Test-data / catalog generator — `backend/test_data/generate_show_test_data.mjs`**
  (run with `node generate_show_test_data.mjs`): reads `SEAT_INDEX` from
  `src/config.js` and writes a full Squarespace product-import CSV
  (`product_import-shows.csv`) — **one product per sellable seat per show**
  (`ga`/`delegate` only; `actor` seats are excluded, never sold), not a
  variant, so every seat gets its own real Squarespace product page/
  permalink (see `seatProductSlug()`/`seatBuyLink()` in `config.js`).
  Each row's `Product URL` is `seatProductSlug(show.sku, seat.code)`,
  `Product Page` is `CONFIG.squarespaceProductPage` (must match an
  existing Store page's slug on the target site — an empty/wrong value
  here fails the whole bulk import with "Product page not found"), and
  `Categories` is the show's `label`, so Squarespace groups all of a
  day's seats under one category page (bulk-importing a *new* category
  value for a `SERVICE` product doesn't reliably auto-create/assign it —
  create the category in the admin first if you need it, then re-import).
  `Product Type` is `SERVICE`, not `PHYSICAL` — these are ticket/seat
  reservations, not shippable goods — so the shipping fields
  (Weight/Length/Width/Height) are left blank rather than populated.
  SKU is `<show.sku>-<seat.code>`, matching what `import_squarespace_csv`
  expects (it only reads the `SKU` column — the per-seat-product vs.
  per-show-with-variants shape is invisible to Django). **`Stock` is
  hardcoded to `1` per product** — confirmed to still block a second sale
  of an already-sold `SERVICE` product, same as it does for `PHYSICAL`.
  Price is per-tier from `CONFIG.pricesByType`. The Django import command
  reads this *same* CSV directly — no separate JSON seed format, so the
  two systems can't drift apart, but Django's own `SeatSkuMap` rows don't
  update themselves when the CSV changes — re-run `import_squarespace_csv`
  by hand after any catalog/venue change, or Django's seat codes silently
  go stale against what's actually live on Squarespace (bit us once: seat
  codes changed in a venue redesign, and a previously-imported deployment
  kept the old pre-redesign codes until manually re-imported). See
  `RUNBOOK.md` for the full generate → import → test workflow.
- **Settings** (`backend/ticketing_dev/settings.py`): `SECRET_KEY` and
  `SQUARESPACE_WEBHOOK_SECRET` are required env vars with no default (by
  design — fails loudly rather than signing with a predictable value).
  `SQUARESPACE_API_KEY` is read directly via `decouple.config()` inside
  `poll_squarespace_orders` (not a global Django setting) so only running
  the poller requires it — other commands/services work fine without it.
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
