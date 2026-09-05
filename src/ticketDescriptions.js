// Per-ticket-type descriptive copy and display names, transcribed verbatim
// from "Convention CSV Rough.xlsx" (TICKET TYPE / NAME-QUANTITY /
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
// Note: two entries reproduce apparent typos in the source spreadsheet
// rather than silently correcting them — chair.AK says "button of Arkansas"
// (should presumably be Alaska), and delegate.SEC says "button of New York"
// (SEC is otherwise described as part of the Iowa delegation). Fix at the
// source (re-export the xlsx) if these should read differently.
export const TICKET_DESCRIPTIONS = {
  ga: "As an attendee of the '44 DNC, you'll have a front row seat to this bound-to-be-historic moment. FDR will be nominated for his 4th term to lead us to Victory. Party favorite Henry A. Wallace is the likely VP candidate alongside him.",

  delegate: {
    PA: "As a member of the Pennsylvania delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Pennsylvania as well as one meal ticket ($5 value).",
    DC: "As a member of the Washington DC delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Washington DC as well as one meal ticket ($5 value).",
    IL: "As a member of the Illinois delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Illinois as well as one meal ticket ($5 value).",
    OK: "As a member of the Oklahoma delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Oklahoma as well as one meal ticket ($5 value).",
    TN: "As a member of the Tennessee delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Tennessee as well as one meal ticket ($5 value).",
    KY: "As a member of the Kentucky delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Kentucky as well as one meal ticket ($5 value).",
    MO: "As a member of the Missouri delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Missouri as well as one meal ticket ($5 value).",
    VA: "As a member of the Virginia delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Virginia as well as one meal ticket ($5 value).",
    MS: "As a member of the Mississippi delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Mississippi as well as one meal ticket ($5 value).",
    SC: "As a member of the South Carolina delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of South Carolina as well as one meal ticket ($5 value).",
    UT: "As a member of the Utah delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Utah as well as one meal ticket ($5 value).",
    MI: "As a member of the Michigan delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Michigan as well as one meal ticket ($5 value).",
    ND: "As a member of the North Dakota delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of North Dakota as well as one meal ticket ($5 value).",
    IA: "As a member of the Iowa delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Iowa as well as one meal ticket ($5 value).",
    MN: "As a member of the Minnesota delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Minnesota as well as one meal ticket ($5 value).",
    NY: "As a member of the New York delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of New York as well as one meal ticket ($5 value).",
    SEC: "As the Assistant to the Convention Secretary Dorothy Vrendenburg and a member of the Iowa Delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Iowa as well as one meal ticket ($5 value). Please be on call to help Dorothy as needed.",
    MA: "As a member of the Massachusetts delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Massachusetts as well as one meal ticket ($5 value).",
    CA: "As a member of the California delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of California as well as one meal ticket ($5 value).",
    FL: "As a member of the Florida delegation, you are a key player in the decision of your territory at the '44 DNC. You will cast a vote by paper ballot, and receive a commemorative button of Florida as well as one meal ticket ($5 value)."
  },

  chair: {
    DC: "As the Chairperson of the District of Columbia delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of DC, two meal tickets ($10 value), and speaking lines in Act 2.",
    AK: "As the Chairperson of the Alaska delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Alaska, two meal tickets ($10 value), and speaking lines in Act 2.",
    PH: "As the Chairperson of the Philippines delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Philippines, two meal tickets ($10 value), and speaking lines in Act 2.",
    VIR: "As the Chairperson of the Virgin Islands delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Virgin Islands, two meal tickets ($10 value), and speaking lines in Act 2.",
    HI: "As the Chairperson of the Hawaii delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Hawaii, two meal tickets ($10 value), and speaking lines in Act 2.",
    WV: "As the Chairperson of the West Virginia delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of West Virginia, two meal tickets ($10 value), and speaking lines in Act 2.",
    TX: "As the Chairperson of the Texas delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Texas, two meal tickets ($10 value), and speaking lines in Act 2.",
    CZ: "As the Chairperson of the Canal Zone delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Canal Zone, two meal tickets ($10 value), and speaking lines in Act 2.",
    NV: "As the Chairperson of the Nevada delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Nevada, two meal tickets ($10 value), and speaking lines in Act 2.",
    NM: "As the Chairperson of the New Mexico delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of New Mexico, two meal tickets ($10 value), and speaking lines in Act 2.",
    MT: "As the Chairperson of the Montana delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Montana, two meal tickets ($10 value), and speaking lines in Act 2.",
    WI: "As the Chairperson of the Wisconsin delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Wisconsin, two meal tickets ($10 value), and speaking lines in Act 2.",
    MD: "As the Chairperson of the Maryland delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Maryland, two meal tickets ($10 value), and speaking lines in both Act 1 and Act 2.",
    MN: "As the Chairperson of the Minnesota delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Minnesota, two meal tickets ($10 value), and speaking lines in Act 2.",
    NJ: "As the Chairperson of the New Jersey delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of New Jersey, two meal tickets ($10 value), and speaking lines in Act 2.",
    VT: "As the Chairperson of the Vermont delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Vermont, two meal tickets ($10 value), and speaking lines in Act 2.",
    NH: "As the Chairperson of the New Hampshire delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of New Hampshire, two meal tickets ($10 value), and speaking lines in Act 2.",
    OR: "As the Chairperson of the Oregon delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Oregon, two meal tickets ($10 value), and speaking lines in Act 2.",
    RI: "As the Chairperson of the Rhode Island delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Rhode Island, two meal tickets ($10 value), and speaking lines in Act 2.",
    WA: "As the Chairperson of the Washington delegation, you will be called to speak on behalf of your delegation by the '44 DNC's Chairperson. You'll also cast your own vote by paper ballot, and receive a commemorative button of Washington, two meal tickets ($10 value), and speaking lines in Act 2."
  },

  candidate: {
    MUR: "You are the talk of the moment! You are Frank Murphy (Supreme Court Justice), one of the delegates vying for the Vice Presidential Nomination at the '44 DNC. Accompanied by an esteemed member of the Convention cast, you will be guided through a personalized journey toward your bid against the Democratic hopeful Henry A. Wallace. You will not be required to speak to the Convention at large, but will be encouraged to speak to those around you - including members of the cast. You will cast a vote by paper ballot (hopefully for yourself!), and receive two meal tickets ($10 value), a Convention tee-shirt, and a commemorative photo.",
    BR: "You are the talk of the moment! You are Melville Broughton (North Carolina Governor), one of the delegates vying for the Vice Presidential Nomination at the '44 DNC. Accompanied by an esteemed member of the Convention cast, you will be guided through a personalized journey toward your bid against the Democratic hopeful Henry A. Wallace. You will not be required to speak to the Convention at large, but will be encouraged to speak to those around you - including members of the cast. You will cast a vote by paper ballot (hopefully for yourself!), and receive two meal tickets ($10 value), a Convention tee-shirt, and a commemorative photo.",
    MC: "You are the talk of the moment! You are Paul Voris McNutt (High Commissioner of the Philippines), one of the delegates vying for the Vice Presidential Nomination at the '44 DNC. Accompanied by an esteemed member of the Convention cast, you will be guided through a personalized journey toward your bid against the Democratic hopeful Henry A. Wallace. You will not be required to speak to the Convention at large, but will be encouraged to speak to those around you - including members of the cast. You will cast a vote by paper ballot (hopefully for yourself!), and receive two meal tickets ($10 value), a Convention tee-shirt, and a commemorative photo.",
    RAY: "You are the talk of the moment! You are Sam Rayburn (Speaker of the House), one of the delegates vying for the Vice Presidential Nomination at the '44 DNC. Accompanied by an esteemed member of the Convention cast, you will be guided through a personalized journey toward your bid against the Democratic hopeful Henry A. Wallace. You will not be required to speak to the Convention at large, but will be encouraged to speak to those around you - including members of the cast. You will cast a vote by paper ballot (hopefully for yourself!), and receive two meal tickets ($10 value), a Convention tee-shirt, and a commemorative photo.",
    LU: "You are the talk of the moment! You are Scott Lucas (Senator of Illinois), one of the delegates vying for the Vice Presidential Nomination at the '44 DNC. Accompanied by an esteemed member of the Convention cast, you will be guided through a personalized journey toward your bid against the Democratic hopeful Henry A. Wallace. You will not be required to speak to the Convention at large, but will be encouraged to speak to those around you - including members of the cast. You will cast a vote by paper ballot (hopefully for yourself!), and receive two meal tickets ($10 value), a Convention tee-shirt, and a commemorative photo."
  }
}

// Full state/territory names for delegate & chair seat labels — used to
// build the buyer-facing "Delegate: Pennsylvania" / "Chair Person:
// Washington D.C." display strings. Both seat types draw from this same
// map since a code always refers to the same place regardless of which
// role holds it (e.g. delegate.DC and chair.DC are both Washington D.C.).
const PLACE_NAMES = {
  PA: 'Pennsylvania',
  DC: 'Washington D.C.',
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
      return `Chair Person: ${PLACE_NAMES[seat.label] ?? seat.label}`
    case 'candidate':
      return `Candidate: ${CANDIDATE_NAMES[seat.label] ?? seat.label}`
    default:
      return seat.label ?? seat.code
  }
}
