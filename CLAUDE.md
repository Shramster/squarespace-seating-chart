# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A small React + Vite embed: an interactive theater seat chart meant to be
compiled into two static files and dropped into a Squarespace Code Block,
with a Django backend as the source of truth for what's sold/charged.

## Commands

```
npm install
npm run dev       # local dev server (vite)
npm run build     # produces dist/seat-chart.js and dist/seat-chart.css
npm run preview   # preview the production build
```

There is no test suite or linter configured in this repo.

## Architecture

- Entry point `src/main.jsx` mounts `<App />` into `#seat-chart-root` — this
  div is provided by the Squarespace page in production, and by
  `index.html` locally. If the element isn't found, mounting silently
  no-ops (logs an error) rather than throwing.
- `src/config.js` is the single source of *display* data: API base URL,
  the list of shows (`sku` + `buyLink` per performance day), shared seat
  geometry (`rowLabels`, `seatsPerRow`, `aisleAfterSeat`), and
  `seatMeta` (per-seat price/character/GA overrides, keyed by seat code
  like `"D3"`). This file must be kept in sync with the `SeatDefinition`
  rows in the Django app by hand — Django/Squarespace remain the actual
  source of truth for what's charged; this file only drives what's shown.
- `src/hooks/useSeatStatus.js` fetches sold-seat codes from
  `{apiBase}/api/shows/{sku}/seats/` and re-fetches whenever `sku`
  changes (e.g. switching day tabs in `DayTabs`). Exposes
  `status: 'loading' | 'ready' | 'error'`; on fetch failure the UI shows
  a "verify seats before confirming a sale" warning rather than blocking
  interaction.
- State lives in `App.jsx` only: `activeShow` and `selected` seat code.
  Everything else is derived/passed down as props — components under
  `src/components/` are presentational (`DayTabs`, `Stage`, `SeatGrid`,
  `Legend`, `ReservePanel`).
- Seat codes are `${rowLabel}${seatNumber}` (e.g. `"D3"`), generated in
  `SeatGrid.jsx` and used as the key across `seatMeta`, `soldSeats`, and
  `selected`. `aisleAfterSeat` inserts a visual gap after that seat
  number in every row.
- Selecting a seat doesn't purchase anything — `ReservePanel` shows the
  seat's price/character and links out to that show's Squarespace
  `buyLink` for actual checkout. Purchasing is entirely out of this
  app's scope.
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
`http://localhost:5173` for local dev.

## Before going live

Fill in real values in `src/config.js`: `apiBase`, each show's `sku` and
`buyLink`, and `seatMeta` for every priced/cast/GA seat.
