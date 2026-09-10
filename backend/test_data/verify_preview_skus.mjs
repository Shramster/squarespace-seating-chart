// One-time verification: does the preview label ("<previewGroup>-<Letter><Number>")
// produce a unique code for every seat in the venue, with no collisions and
// no seat silently missing a code? Mirrors VenueMap.jsx's label logic
// exactly (same numToLetter, same swap/reverse/start handling) so this is a
// faithful dry run of what the SKU would look like if wired in for real.
import { CONFIG } from '../../src/config.js'

function numToLetter(n, start = 'A') {
  return String.fromCharCode(start.charCodeAt(0) - 1 + n)
}

const seen = new Map()
const collisions = []
const missingGroup = []
let totalSeats = 0

for (const block of CONFIG.venue.blocks) {
  block.grid.forEach((row, r) => {
    const rowSeatCount = row.filter(Boolean).length
    const numberStart = block.previewNumbersStart || 1
    let previewNum = 0
    row.forEach((cell, c) => {
      if (!cell) return
      totalSeats++
      previewNum += 1
      let previewLabel = null
      if (block.previewSwapRowCol) {
        const letterPos = block.previewReverseLetters ? rowSeatCount - previewNum + 1 : previewNum
        const numberPos = (block.previewReverseNumbers ? block.grid.length - r : r + 1) + numberStart - 1
        previewLabel = `${numToLetter(letterPos, block.previewLetterStart || 'A')}${numberPos}`
      } else if (block.previewRowLetters) {
        const numberPos = (block.previewReverseNumbers ? rowSeatCount - previewNum + 1 : previewNum) + numberStart - 1
        previewLabel = `${block.previewRowLetters[r]}${numberPos}`
      }

      const positionCode = `${block.id}${r + 1}-${c + 1}`

      if (!block.previewGroup || !previewLabel) {
        missingGroup.push({ positionCode, blockId: block.id, type: cell.type, label: cell.label })
        return
      }

      const sku = `${block.previewGroup}-${previewLabel}`
      if (seen.has(sku)) {
        collisions.push({ sku, a: seen.get(sku), b: { positionCode, type: cell.type, label: cell.label } })
      } else {
        seen.set(sku, { positionCode, type: cell.type, label: cell.label })
      }
    })
  })
}

console.log(`Total seats in venue: ${totalSeats}`)
console.log(`Seats with a computed preview SKU: ${seen.size}`)
console.log(`Seats with NO preview SKU (missing previewGroup/label config): ${missingGroup.length}`)
if (missingGroup.length) {
  console.log(missingGroup.map((m) => `  ${m.positionCode} (block ${m.blockId}, ${m.type}${m.label ? '/' + m.label : ''})`).join('\n'))
}
console.log(`Collisions: ${collisions.length}`)
if (collisions.length) {
  for (const c of collisions) {
    console.log(`  SKU "${c.sku}" claimed by both:`)
    console.log(`    - ${c.a.positionCode} (${c.a.type}${c.a.label ? '/' + c.a.label : ''})`)
    console.log(`    - ${c.b.positionCode} (${c.b.type}${c.b.label ? '/' + c.b.label : ''})`)
  }
}

if (collisions.length === 0 && missingGroup.length === 0 && seen.size === totalSeats) {
  console.log('\n✅ VERIFIED: every seat gets a unique preview SKU, no collisions, no gaps.')
} else {
  console.log('\n❌ NOT CLEAN — see above before wiring this into the real seatCode().')
}
