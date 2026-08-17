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

A `Makefile` wraps the same commands (`make install|dev|build|preview|clean`).

There is no test suite or linter configured in this repo.

## Architecture

- Entry point `src/main.jsx` mounts `<App />` into `#seat-chart-root` — this
  div is provided by the Squarespace page in production, and by
  `index.html` locally. If the element isn't found, mounting silently
  no-ops (logs an error) rather than throwing.
- `src/config.js` is the single source of *display* data: API base URL, the
  list of shows (`sku` + `buyLink` per performance day), and
  `CONFIG.venue` — the real room modeled as discrete seating `blocks` (each
  with position/rotation, since several blocks are rotated to follow the
  venue's angled walls) plus non-seat `furniture` (piano, stage/podium,
  wheelchair ramp). This file must be kept in sync with the
  `SeatDefinition` rows in the Django app by hand — Django/Squarespace
  remain the actual source of truth for what's charged; this file only
  drives what's shown.
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
- `src/hooks/useSeatStatus.js` fetches sold-seat codes from
  `{apiBase}/api/shows/{sku}/seats/` and re-fetches whenever `sku`
  changes (e.g. switching day tabs in `DayTabs`). Exposes
  `status: 'loading' | 'ready' | 'error'`; on fetch failure the UI shows
  a "verify seats before confirming a sale" warning rather than blocking
  interaction.
- State lives in `App.jsx` only: `activeShow` and `selected` seat code.
  Everything else is derived/passed down as props. `VenueMap.jsx` renders
  `CONFIG.venue` as one SVG (`viewBox`-scaled, so it stays responsive
  without the old grid's manual mobile breakpoint): a wall outline,
  `Furniture.jsx` pieces, and one rotated `<g>` per block containing a
  `<circle>`+`<text>` per seat cell (`null` cells are gaps/walkways, not
  seats). `Legend.jsx` and `ReservePanel.jsx` are otherwise presentational.
- Selecting a seat doesn't purchase anything — `ReservePanel` shows the
  seat's price/label (state code for delegate seats) and links out to
  that show's Squarespace `buyLink` for actual checkout. Purchasing is
  entirely out of this app's scope.
- `vite.config.js` pins output filenames (`seat-chart.js` /
  `seat-chart.css`, no content hash, `cssCodeSplit: false`) so the
  Squarespace embed snippet never needs to change between deploys —
  ship a change by rebuilding and re-uploading the two `dist/` files to
  wherever Django serves static assets from.

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
