// Seat helpers — keep block grids readable as literals below.
// A() = actor (cast, never for public sale)
// G() = gallery (individually selectable, no state attached)
// D(label) = delegate seat, assigned to the state/territory given by `label`
// C(label) = state chairperson seat, assigned to the state/territory given
//   by `label` (has lines, unlike a plain delegate seat)
// N(label) = candidate seat, assigned to the named individual given by
//   `label` (shown as initials — the seat's tile color already
//   disambiguates from state delegate/chair labels, so collisions are fine)
function seat(type, opts = {}) {
  return { type, ...opts }
}
const A = () => seat('actor')
const G = () => seat('ga')
const D = (label) => seat('delegate', { label })
const C = (label) => seat('chair', { label })
const N = (name) => seat('candidate', { label: name })
const _ = null // no seat here (gap / walkway / non-seat space)

// ADA(seat) marks any seat (from A()/G()/D()/C()/N() above) as
// ADA-accessible — composes rather than duplicating the 5 constructors
// above, so it reads clearly in a grid literal (e.g. `ADA(D('UT'))`) and
// is trivially greppable. See also a block's `adaDefault: true` (used on
// the two Aisle blocks below, where every seat is ADA) instead of
// wrapping every single cell.
const ADA = (seatObj) => ({ ...seatObj, ada: true })

// Each seat is its own Squarespace product (see
// backend/test_data/generate_show_test_data.mjs), grouped into a
// per-show-day Category, so every seat gets a real permalink instead of
// a variant dropdown. This slug is the single source of truth shared by
// the CSV generator (which sets each product's `Product URL` to it) and
// the frontend (which links straight to it) — keep them importing this
// same function so they can't drift apart.
export function seatProductSlug(showSku, seatCode) {
  return `convention-${showSku}-${seatCode}`.toLowerCase()
}

export function seatBuyLink(showSku, seatCode) {
  return `${CONFIG.squarespaceBase}/${CONFIG.squarespaceProductPage}/p/${seatProductSlug(showSku, seatCode)}`
}

// Deep link back to the seat-chart embed, preselecting a show date — used
// on each seat's product page so buyers can return to add another seat
// without re-navigating by hand.
export function showLink(showSku) {
  return `${CONFIG.squarespaceBase}/${CONFIG.squarespaceProductPage}?show=${showSku}`
}

// Buyer-facing word for each sellable seat type — shared by the Squarespace
// product Title (below) and anywhere else in the UI that needs the plain
// type name rather than a per-seat label (contrast with
// ticketDescriptions.js's seatDisplayName(), which includes the seat's
// specific state/candidate).
export const TYPE_LABEL = {
  ga: 'Gallery',
  delegate: 'Delegate',
  chair: 'Chairperson',
  candidate: 'Candidate'
}

// "Saturday, October 3, 3:00 PM" — full day name + full month name, driven
// off `show.date` so a day-of-week can never drift out of sync with the
// actual calendar date. Hand-rolled AM/PM (rather than
// Intl.DateTimeFormat's default "3:00 PM"/"3 PM" — same content here) kept
// simple since we already need a fixed "H:MM AM/PM" shape.
export function formatShowDateTime(show) {
  const d = new Date(show.date)
  const dayMonth = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(d)
  let hours = d.getHours()
  const minutes = d.getMinutes()
  const period = hours >= 12 ? 'PM' : 'AM'
  hours = hours % 12 || 12
  const time = `${hours}:${String(minutes).padStart(2, '0')} ${period}`
  return `${dayMonth}, ${time}`
}

// Squarespace product Title for one seat: "Saturday, October 3, 3:00 PM,
// Gallery". Format: Day_of_week, Month Day, Time, Seat-Type.
export function ticketTitle(show, seat) {
  return `${formatShowDateTime(show)}, ${TYPE_LABEL[seat.type] ?? seat.type}`
}

export const CONFIG = {
  // Dev: match whatever host served this page, so it also works from a
  // phone on the LAN (see `make dev-lan`). Prod build always uses the
  // literal fallback below — set that to the real Django domain before
  // going live.
  apiBase: import.meta.env?.DEV
    ? `http://${window.location.hostname}:8100`
    : 'https://seatchart.swseng.io', // stakeholder demo backend
  defaultPrice: 25,

  // Per-tier pricing for the four sellable seat types (actor seats are
  // never sold, so have no entry here). Looked up by App.jsx when
  // computing the selected seat's price — falls back to defaultPrice
  // above for any type not listed here.
  pricesByType: {
    ga: 44,
    delegate: 68,
    chair: 76,
    candidate: 100
  },

  // Your Squarespace site's domain, no trailing slash. Per-seat buy links
  // are computed from this + seatProductSlug() above.
  squarespaceBase: 'https://www.conventionplay.com',

  // Slug of the existing Squarespace Store page products should be
  // imported under (the CSV's `Product Page` column) — this site's store
  // lives at /tickets, so new seat products land at
  // /tickets/p/<seatProductSlug()> instead of failing bulk import with
  // "Product page not found."
  squarespaceProductPage: 'tickets',

  // One entry per performance day. sku must match a Show.sku_prefix in
  // Django.
  //
  // Sign-off round: Oct 3 - 4, 2026 only — add the remaining performance
  // dates here once these two are approved.
  shows: [
    { sku: 'OCT03', label: 'Sat, October 3, 2026', date: '2026-10-03T15:00:00' },
    { sku: 'OCT04', label: 'Sun, October 4, 2026', date: '2026-10-04T15:00:00' }
  ],

  // The real room: several distinct seating blocks (some rotated) plus
  // furniture, transcribed from SeatChart8222026.png (per-seat
  // type/label). This is a best-effort transcription — verify against the
  // physical venue before going live. Block names/ids below are the ones
  // the user assigned when reviewing the chart.
  //
  // Seat identity: every seat's `code` is derived from its block id + grid
  // position (not its type/label), so reassigning a seat's role later
  // (e.g. which physical seats are "Actor" seats) is just editing that
  // cell's A()/G()/D()/C()/N() in place below — no effect on sold-seat
  // tracking.
  venue: {
    width: 926,
    height: 842,
    contentOffsetX: 0,
    contentOffsetY: 1,

    walls: { x: 10, y: 10, w: 880, h: 780, rx: 12 },

    furniture: [
      { type: 'piano', x: 780, y: 213.5, w: 100, h: 150, label: 'Grand Piano' },
      { type: 'table', x: 420, y: 171.5, w: 70, h: 130, label: 'Lectern', podium: { w: 30, h: 30 } }
    ],

    blocks: [
      // Back Bleachers — tall, 4 seats across, 11 rows, split by a
      // furniture gap (row 6) between the upper and lower halves.
      {
        id: 'BLEACHERS-BACK', name: 'Back Bleachers',
        previewGroup: 'BACK-BLEACHERS',
        // The axis the user calls "row" here is the seat-position-within-
        // a-grid-row axis (A-D), and "column" is the grid-row axis
        // (1-11) — the opposite of every other block's preview
        // convention, where letter=grid-row/number=position. The seat
        // code itself is still always "<LETTER><NUMBER>" — only which
        // grid axis supplies which symbol changes. previewReverseLetters
        // additionally reverses A-D to D-A along that letter axis.
        // previewReverseNumbers is the equivalent flip for the number
        // axis (1..11 becomes 11..1) — toggle to try either direction.
        previewSwapRowCol: true,
        previewReverseLetters: true,
        previewReverseNumbers: true,
        x: 390, y: 500, rotation: -90,
        labelPos: 'top',
        cellSize: 32, gap: 6,
        grid: [
          [A(), D('PA'), D('PA'), A()],
          [D('PA'), G(), G(), C('DC')],
          [G(), G(), G(), D('DC')],
          [G(), G(), G(), G()],
          [G(), G(), G(), G()],
          [_, _, _, A()],
          [G(), A(), N('LU'), A()],
          [G(), A(), D('IL'), G()],
          [G(), N('MC'), G(), G()],
          [G(), G(), G(), G()],
          [A(), D('OK'), D('OK'), A()]
        ]
      },

      // Left Bleachers — two pairs of columns split by a center aisle
      // (col index 2 stays empty except for one front-row seat).
      {
        id: 'BLEACHERS-LEFT', name: 'Left Bleachers',
        previewGroup: 'LEFT-BLEACHERS',
        previewRowLetters: ['D', 'C', 'B', 'A'],
        labelPos: 'top',
        x: 43, y: 486.5, rotation: -90,
        cellSize: 32, gap: 6,
        grid: [
          [C('AK'), A(), A(), D('KY'), D('KY')],
          [G(), C('PH'), _, A(), A()],
          [G(), C('VIR'), _, D('MO'), D('MO')],
          [A(), D('TN'), _, C('HI'), G()]
        ]
      },

      // Left Aisle — freestanding block below Left Bleachers. Ground-floor,
      // no stairs — every seat here is ADA-accessible (adaDefault below
      // applies to every non-null cell rather than wrapping each one).
      {
        id: 'AISLE-LEFT', name: 'Left Aisle',
        previewGroup: 'LEFT-AISLE',
        previewReverseLetters: true,
        previewSwapRowCol: true,

        previewReverseNumbers: true,
        adaDefault: true,
        labelPos: 'top',
        x: 275, y: 380, rotation: -90,
        cellSize: 32, gap: 6,
        grid: [
          [A(), D('VA'), A(), A()],
          [G(), G(), C('WV'), N('BR')],
          [C('TX'), D('MS'), G(), D('SC')],
          [A(), A(), A(), A()]
        ]
      },

      // Right Aisle — separated from Left Aisle by a walkway gap. Same
      // ADA rationale as Left Aisle above.
      {
        id: 'AISLE-RIGHT', name: 'Right Aisle',
        previewGroup: 'RIGHT-AISLE',
        previewReverseLetters: true,
        previewSwapRowCol: true,

        previewReverseNumbers: true,
        adaDefault: true,
        labelPos: 'top',
        x: 490, y: 380, rotation: -90,
        cellSize: 32, gap: 6,
        grid: [
          [C('MD'), A(), D('NY'), A()],
          [G(), G(), D('NY'), D('NY')],
          [G(), C('NJ'), C('VT'), A()],
          [C('NH'), D('MA'), A(), A()]
        ]
      },

      // Right Bleachers — mirrors Left Bleachers' aisle layout, plus one
      // isolated far-right column (col index 5, only rows 1 and 4).
      {
        id: 'BLEACHERS-RIGHT', name: 'Right Bleachers',
        previewGroup: 'RIGHT-BLEACHERS',
        previewRowLetters: ['A', 'B', 'C', 'D', 'E'],
        previewReverseNumbers: true,
        // The front-seat satellite block below already owns A1 and B1, so
        // this block's numbers start at 2 instead of 1 to avoid colliding.
        previewNumbersStart: 2,
        labelOffsetY: -42,
        labelPos: 'top',
        x: 693, y: 486.5, rotation: -90,
        cellSize: 32, gap: 6,
        grid: [
          [A(), A(), _, C('RI'), D('FL')],
          [D('CA'), A(), _, A(), G(),],
          [A(), D('CA'), _, G(), D('FL'),],
          [C('OR'), G(), A(), G(), C('WA')]
        ]
      },
      {
        id: 'BLEACHERS-RIGHT-FRONT', name: 'Right Bleacher — Floor Seats',
        previewGroup: 'RIGHT-BLEACHERS',
        previewRowLetters: ['A'],
        previewSwapRowCol: true,
        x: 711, y: 416.5, rotation: 0,
        cellSize: 32, gap: 10,
        showFrame: false, // no section border/label — just 3 loose seats
        // ga seat is ADA-accessible (front/floor row, no stairs); the
        // actor seat isn't sold, so ADA-marking it is moot.
        grid: [
          [ADA(G()), A()]
        ]
      },

      // Right-side blocks — rotated to follow the room's angled wall,
      // each paired with a small satellite block of isolated seats that
      // sit in front of its platform in the reference chart.
      {
        id: 'STAGE-LEFT', name: 'Left Stage',
        previewGroup: 'LEFT-STAGE',
        previewRowLetters: ['B', 'C', 'D', 'E'],
        previewSwapRowCol: true,
        // The front-seat satellite block below already owns letter 'A',
        // so this block's (swapped) letter axis starts at 'B' instead.
        previewLetterStart: 'B',
        labelPos: 'top',
        labelOffsetX: -25,
        labelOffsetY: 45,
        // labelRotation: readable equivalent of this block's rotation
        // (rotation mod 180, mapped into -90..90) so the label reads
        // left-to-right while staying visually aligned to the seating rows.
        labelRotation: -30,
        x: 184, y: 90.5, rotation: -120,
        cellSize: 34, gap: 6,
        grid: [
          [G(), A()],
          [A(), C('MT')],
          [C('NM'), C('NV')],
          [G(), G()]
        ]
      },
      {
        id: 'STAGE-LEFT-FRONT', name: 'Left Stage — Front Seats',
        previewGroup: 'LEFT-STAGE',
        previewRowLetters: ['A'],
        x: 203, y: 216.5, rotation: -30,
        cellSize: 32, gap: 18,
        showFrame: false, // no section border/label — just 3 loose seats
        // Front/floor row, no stairs — ADA-accessible.
        grid: [
          [ADA(C('CZ')),  ADA(G()), ADA(D('UT'))]
        ]
      },
      {
        id: 'STAGE-CENTER', name: 'Center Stage',
        previewGroup: 'CENTER-STAGE',
        previewSwapRowCol: true,
        labelPos: 'top',
        x: 419, y: 41.5, rotation: -90,
        cellSize: 34, gap: 6,
        grid: [
          [A(), A()],
          [N('MUR'), D('MI')],
          [C('WI'), D('ND')],
          [A(), A()]
        ]
      },
      // Two lone actor seats flanking the Lectern, one on each side.
      {
        id: 'LECTERNL', name: 'Lectern — Left',
        x: 380, y: 250, rotation: -90,
        cellSize: 34, gap: 6,
        showFrame: false,
        grid: [[A()]]
      },
      {
        id: 'LECTERNR', name: 'Lectern — Right',
        x: 497, y: 250, rotation: -90,
        cellSize: 34, gap: 6,
        showFrame: false,
        grid: [[A()]]
      },
      // Right Stage platform: 4 seats in the front row, 3 in the back row.
      // labelPos: 'top' centers the section label over the block's top
      // (short) edge instead of the default top-right corner — the
      // default reads awkwardly here because of this block's rotation.
      // labelRotation: readable equivalent of this block's rotation
      // (rotation mod 180, mapped into -90..90) so the label reads
      // left-to-right while staying visually aligned to the seating rows.
      {
        id: 'STAGE-RIGHT', name: 'Right \n Stage',
        previewGroup: 'RIGHT-STAGE',
        previewRowLetters: ['B', 'C'],
        previewReverseNumbers: true,
        labelPos: 'top',
        labelOffsetX: 40,
        labelOffsetY: 57,
        labelRotation: 35,
        x: 613, y: 130.5, rotation: -145,
        cellSize: 34, gap: 6,
        grid: [
          [A(), A(), D('IA'), D('IA')],
          [G(), D('MN'), C('MN'), G()]
        ]
      },
      {
        id: 'STAGE-RIGHT-FRONT', name: 'Right Stage — Front Seats',
        previewGroup: 'RIGHT-STAGE',
        previewReverseNumbers: true,
        previewRowLetters: ['A'],
        x: 567, y: 209.5, rotation: -145,
        cellSize: 32, gap: 18,
        showFrame: false, // no section border/label — just 3 loose seats
        // Front/floor row, no stairs — ADA-accessible.
        grid: [
          [ADA(G()), ADA(N('RAY')), ADA(D('SEC'))]
        ]
      }
    ]
  }
}

// Flat code -> seat lookup, built once from the static venue layout above.
// code format: "<blockId><row+1>-<col+1>" (1-indexed, e.g. "L2-3") — the
// same friendly, block-scoped string shown to buyers as the seat's label,
// so the SKU/permalink a buyer sees matches the seat identity used
// everywhere else (holds, sold-seat tracking). Still fully derived from
// block id + grid position, not type or delegate state, so reassigning a
// cell's A()/G()/D() in place doesn't affect identity or sold-seat
// tracking. Delegate seats display their assigned state as a separate
// `label` field (see below) but keep this same position-based `code` as
// their actual identity, so two delegate seats can safely share a state
// without colliding.
function buildSeatIndex(venue) {
  const index = new Map()
  const seen = new Map()
  for (const block of venue.blocks) {
    block.grid.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell) return
        const code = seatCode(block.id, r, c)
        if (seen.has(code)) {
          throw new Error(
            `Duplicate seat code "${code}" — blocks ${seen.get(code)} and ${block.id} collide. ` +
              'Adjust block ids so seatCode() output stays unique.'
          )
        }
        seen.set(code, block.id)
        // Delegate seats display their state code; every other seat's
        // display label is just its code (already friendly/unique).
        const label = cell.label || code
        // adaDefault (e.g. the Aisle blocks, where every seat is
        // ADA-accessible) applies unless a cell already opted in itself.
        const ada = cell.ada || Boolean(block.adaDefault)
        index.set(code, { ...cell, label, code, ada })
      })
    })
  }
  return index
}

export const SEAT_INDEX = buildSeatIndex(CONFIG.venue)

export function seatCode(blockId, row, col) {
  return `${blockId}${row + 1}-${col + 1}`
}
