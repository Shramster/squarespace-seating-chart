// Per-ticket-type descriptive copy and display names, transcribed verbatim
// from "ConventionExcel.xlsx" (TICKET TYPE / NAME-QUANTITY /
// DESCRIPTION columns). Single source of truth shared by the frontend
// (ReservePanel.jsx, for the description shown when a seat is selected)
// and the Squarespace CSV generator
// (backend/test_data/generate_show_test_data.mjs, for each product's
// Description column) — keep them importing this same file so they can't
// drift apart, the same pattern config.js already uses for seat data.
//
// Keyed by seat type, then by the seat's `label` (state/territory code for
// delegate/chair, candidate initials for candidate) — these keys match the
// A()/D()/C()/N() labels used in config.js's venue grid. `ga` has no
// per-seat label, so it's a single shared description.
//
export const TICKET_DESCRIPTIONS = {
  ga: "Witness in real time this bound-to-be-historic moment '44 DNC. FDR will be nominated for his 4th term to lead us to Victory. Party favorite Henry A. Wallace is the likely VP candidate alongside him.",

  delegate: {
    PA: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Pennsylvania and one meal ticket ($5 value).",
    DC: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of the District of Columbia and one meal ticket ($5 value).",
    IL: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Illinois and one meal ticket ($5 value).",
    OK: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Oklahoma and one meal ticket ($5 value).",
    TN: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Tennessee and one meal ticket ($5 value).",
    KY: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Kentucky and one meal ticket ($5 value).",
    MO: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Missouri and one meal ticket ($5 value).",
    VA: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Virginia and one meal ticket ($5 value). This is an ADA accessible seat.",
    MS: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Mississippi and one meal ticket ($5 value). This is an ADA accessible seat.",
    SC: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of South Carolina and one meal ticket ($5 value). This is an ADA accessible seat.",
    UT: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Utah and one meal ticket ($5 value). This is an ADA accessible seat.",
    MI: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Michigan and one meal ticket ($5 value).",
    ND: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of North Dakota and one meal ticket ($5 value).",
    IA: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Iowa and one meal ticket ($5 value).",
    MN: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Minnesota and one meal ticket ($5 value).",
    NY: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of New York and one meal ticket ($5 value). This is an ADA accessible seat.",
    SEC: "You are a key player in the decision of the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button as Assistant to the Secretary and one meal ticket ($5 value). This is an ADA accessible seat.",
    MA: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Massachusetts and one meal ticket ($5 value). This is an ADA accessible seat.",
    CA: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of California and one meal ticket ($5 value).",
    FL: "You are a key player in the decision of your territory at the '44 DNC. You will be sat next to an actor, cast a vote by paper ballot, receive a commemorative button of Florida and one meal ticket ($5 value)."
  },

  chair: {
    DC: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of DC, two meal tickets ($10 value), and speaking lines in Act 2.",
    AK: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Alaska, two meal tickets ($10 value), and speaking lines in Act 2.",
    PH: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of the Philippines, two meal tickets ($10 value), and speaking lines in Act 2.",
    VIR: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of the Virgin Islands, two meal tickets ($10 value), and speaking lines in Act 2.",
    HI: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Hawaii, two meal tickets ($10 value), and speaking lines in Act 2.",
    WV: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of West Virginia, two meal tickets ($10 value), and speaking lines in Act 2. This is an ADA accessible seat.",
    TX: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Texas, two meal tickets ($10 value), and speaking lines in Act 2. This is an ADA accessible seat.",
    CZ: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of the Canal Zone, two meal tickets ($10 value), and speaking lines in Act 2. This is an ADA accessible seat.",
    NV: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Nevada, two meal tickets ($10 value), and speaking lines in Act 2.",
    NM: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of New Mexico, two meal tickets ($10 value), and speaking lines in Act 2.",
    MT: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Montana, two meal tickets ($10 value), and speaking lines in Act 2.",
    WI: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Wisconsin, two meal tickets ($10 value), and speaking lines in Act 2.",
    MD: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Maryland, two meal tickets ($10 value), and speaking lines in both Act 1 and 2. This is an ADA accessible seat.",
    MN: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Minnesota, two meal tickets ($10 value), and speaking lines in Act 2.",
    NJ: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of New Jersey, two meal tickets ($10 value), and speaking lines in Act 2. This is an ADA accessible seat.",
    VT: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Vermont, two meal tickets ($10 value), and speaking lines in Act 2. This is an ADA accessible seat.",
    NH: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of New Hampshire, two meal tickets ($10 value), and speaking lines in Act 2. This is an ADA accessible seat.",
    OR: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Oregon, two meal tickets ($10 value), and speaking lines in Act 2.",
    RI: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Rhode Island, two meal tickets ($10 value), and speaking lines in Act 2.",
    WA: "You will be called to speak on behalf of your delegation. You'll also cast your own vote by paper ballot, receive a commemorative button of Washington, two meal tickets ($10 value), and speaking lines in Act 2."
  },

  candidate: {
    MUR: "You are the talk of the moment! You are Frank Murphy (Supreme Court Justice), one of the delegates vying for the VP Nomination at the '44 DNC. Accompanied by an esteemed member of the Convention cast, you will be guided through a personalized journey toward your bid against the Democratic hopeful Henry A. Wallace. You will not be required to speak to the Convention at large, but will be encouraged to speak to members of the cast swirling around you. You will cast a vote by paper ballot, receive two meal tickets ($10 value), a Convention tee-shirt, and a commemorative photo.",
    BR: "You are the talk of the moment! You are Melville Broughton (North Carolina Governor), one of the delegates vying for the VP Nomination at the '44 DNC. Accompanied by an esteemed member of the Convention cast, you will be guided through a personalized journey toward your bid against the Democratic hopeful Henry A. Wallace. You will not be required to speak to the Convention at large, but will be encouraged to speak to members of the cast swirling around you. You will cast a vote by paper ballot, receive two meal tickets ($10 value), a Convention tee-shirt, and a commemorative photo. This is an ADA accessible seat.",
    MC: "You are the talk of the moment! You are Paul Voris McNutt (High Commissioner of the Philippines), one of the delegates vying for the VP Nomination at the '44 DNC. Accompanied by an esteemed member of the Convention cast, you will be guided through a personalized journey toward your bid against the Democratic hopeful Henry A. Wallace. You will not be required to speak to the Convention at large, but will be encouraged to speak to members of the cast swirling around you. You will cast a vote by paper ballot, receive two meal tickets ($10 value), a Convention tee-shirt, and a commemorative photo.",
    RAY: "You are the talk of the moment! You are Sam Rayburn (Speaker of the House), one of the delegates vying for the VP Nomination at the '44 DNC. Accompanied by an esteemed member of the Convention cast, you will be guided through a personalized journey toward your bid against the Democratic hopeful Henry A. Wallace. You will not be required to speak to the Convention at large, but will be encouraged to speak to members of the cast swirling around you. You will cast a vote by paper ballot, receive two meal tickets ($10 value), a Convention tee-shirt, and a commemorative photo. This is an ADA accessible seat.",
    LU: "You are the talk of the moment! You are Scott Lucas (Senator of Illinois), one of the delegates vying for the VP Nomination at the '44 DNC. Accompanied by an esteemed member of the Convention cast, you will be guided through a personalized journey toward your bid against the Democratic hopeful Henry A. Wallace. You will not be required to speak to the Convention at large, but will be encouraged to speak to members of the cast swirling around you. You will cast a vote by paper ballot, receive two meal tickets ($10 value), a Convention tee-shirt, and a commemorative photo."
  }
}

// Full state/territory names for delegate & chair seat labels — used to
// build the buyer-facing "Delegate: Pennsylvania" / "Chair Person:
// Washington D.C." display strings. Both seat types draw from this same
// map since a code always refers to the same place regardless of which
// role holds it (e.g. delegate.DC and chair.DC are both Washington D.C.).
const PLACE_NAMES = {
  PA: 'Pennsylvania',
  DC: 'District of Columbia',
  IL: 'Illinois',
  OK: 'Oklahoma',
  TN: 'Tennessee',
  KY: 'Kentucky',
  MO: 'Missouri',
  VA: 'Virginia',
  MS: 'Mississippi',
  SC: 'South Carolina',
  UT: 'Utah',
  MI: 'Michigan',
  ND: 'North Dakota',
  IA: 'Iowa',
  MN: 'Minnesota',
  NY: 'New York',
  SEC: "Secretary's Assistant",
  MA: 'Massachusetts',
  CA: 'California',
  FL: 'Florida',
  AK: 'Alaska',
  PH: 'Philippines',
  VIR: 'Virgin Islands',
  HI: 'Hawaii',
  WV: 'West Virginia',
  TX: 'Texas',
  CZ: 'Canal Zone',
  NV: 'Nevada',
  NM: 'New Mexico',
  MT: 'Montana',
  WI: 'Wisconsin',
  MD: 'Maryland',
  NJ: 'New Jersey',
  VT: 'Vermont',
  NH: 'New Hampshire',
  OR: 'Oregon',
  RI: 'Rhode Island',
  WA: 'Washington'
}

// Full candidate names for the "Candidate: Scott Lucas" display string.
const CANDIDATE_NAMES = {
  MUR: 'Frank Murphy',
  BR: 'Melville Broughton',
  MC: 'Paul Voris McNutt',
  RAY: 'Sam Rayburn',
  LU: 'Scott Lucas'
}

// Looks up the description for a sellable seat, falling back to a generic
// line (rather than throwing) if a future venue change adds a label this
// table doesn't yet have an entry for.
export function ticketDescription(seat) {
  if (seat.type === 'ga') return TICKET_DESCRIPTIONS.ga
  const byLabel = TICKET_DESCRIPTIONS[seat.type]
  const desc = byLabel?.[seat.label]
  if (desc) return desc
  console.warn(`No ticket description for ${seat.type} seat ${seat.code} (label "${seat.label}") — using generic fallback.`)
  return `Reserved seating — Seat ${seat.label}.`
}

// Buyer-facing display name for a seat, e.g. "Gallery Seat",
// "Delegate: Pennsylvania", "Chair Person: Washington D.C.",
// "Candidate: Scott Lucas". Falls back to the raw label/code for any type
// (actor seats, or a future label not yet in the name maps above) rather
// than throwing.
export function seatDisplayName(seat) {
  switch (seat.type) {
    case 'ga':
      return 'Gallery Seat'
    case 'delegate':
      return `Delegate: ${PLACE_NAMES[seat.label] ?? seat.label}`
    case 'chair':
      return `Chairperson: ${PLACE_NAMES[seat.label] ?? seat.label}`
    case 'candidate':
      return `Candidate: ${CANDIDATE_NAMES[seat.label] ?? seat.label}`
    default:
      return seat.label ?? seat.code
  }
}
