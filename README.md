# Seat chart (React + Vite)

## Structure

```
src/
  main.jsx            mounts <App /> into #seat-chart-root
  App.jsx              top-level state: active show, selected seat
  config.js             ← edit this for real venue/pricing data
  styles.css             visual design, scoped under .seat-chart
  hooks/
    useSeatStatus.js     fetches sold seats from Django, per show
  components/
    DayTabs.jsx
    VenueMap.jsx          SVG render of config.js's venue.blocks/furniture
    Furniture.jsx         piano / stage+podium / wheelchair pieces
    Legend.jsx
    ReservePanel.jsx
```

The venue isn't a uniform grid — it's several distinct seating blocks (some
rotated) laid out to match the real room, defined in `config.js` as
`CONFIG.venue.blocks`. Each seat is one of three types: `actor` (cast, never
for public sale), `ga` (general admission, individually selectable), or
`delegate` (assigned to a state, labeled with that state's code, e.g. `TX`).
A seat's identity (`code`) is derived from its block + grid position, not its
type — so reassigning which physical seats are "Actor" seats is just editing
that cell's helper (`A()`/`G()`/`D()`) in `config.js`, with no effect on
sold-seat tracking.

## Develop

```
npm install
npm run dev
```

Opens a local dev server. `useSeatStatus` will try to hit whatever
`apiBase` is set to in `config.js` — point that at your local Django
dev server (or a deployed one) while you work, and make sure CORS
allows `http://localhost:5173`.

## Build

```
npm run build
```

Produces `dist/seat-chart.js` and `dist/seat-chart.css` — filenames are
pinned (no content hash), so the embed snippet below never has to
change between deploys.

## Deploy

Serve the two files in `dist/` from your Django app (e.g. via
whitenoise, or however you're already serving static assets), then the
entire Squarespace Code Block becomes a small, permanent stub:

```html
<div id="seat-chart-root"></div>
<link rel="stylesheet" href="https://yourdjangoapp.com/static/seat-chart/seat-chart.css">
<script src="https://yourdjangoapp.com/static/seat-chart/seat-chart.js"></script>
```

From then on, shipping a change is: edit → `npm run build` → upload the
two files to Django's static dir → done. Squarespace itself never needs
to be touched again.

Note: loading the bundle via `<script src>` is a cross-origin script
load, which doesn't require CORS. CORS only applies to the `fetch()`
calls `useSeatStatus` makes back to `/api/shows/<sku>/seats/` — that's
already covered by the `CORS_ALLOWED_ORIGINS` setup in the `ticketing`
Django app.

## Before going live

- Fill in real values in `src/config.js`: `apiBase`, each show's `sku` and
  `buyLink`, and `CONFIG.venue` — block positions/rotation and every seat's
  type/label — to match the real venue. Keep this in sync with the
  `SeatDefinition` rows in Django — this file only drives what's *displayed*,
  Django/Squarespace remain the source of truth for what's actually charged.
- Squarespace only executes JS in a **Code Block** (Business/Commerce
  plan) — Markdown/Text blocks strip `<script>` tags.
