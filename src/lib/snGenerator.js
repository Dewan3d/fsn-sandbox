/**
 * Serial Number Generator — Core Algorithm
 * 
 * Format: [Precursor]-[PermaNo][Random3Digits][FlowNumber]
 * Example: LCD-20260728569001
 */

/**
 * Returns today's date as YYYYMMDD string.
 */
export function getPermaNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

/**
 * Generates a valid 3-digit random sequence.
 * Rules:
 *   - Three random digits, each between 5 and 9 (inclusive)
 *   - Their product must be between 100 and 500 (inclusive)
 *   - Return the three digits concatenated as a string
 */
export function generateRandomSequence() {
  let attempts = 0
  const maxAttempts = 10000

  while (attempts < maxAttempts) {
    const d1 = Math.floor(Math.random() * 5) + 5 // 5-9
    const d2 = Math.floor(Math.random() * 5) + 5 // 5-9
    const d3 = Math.floor(Math.random() * 5) + 5 // 5-9

    const product = d1 * d2 * d3

    if (product >= 100 && product <= 500) {
      return `${d1}${d2}${d3}`
    }

    attempts++
  }

  // Fallback — should never reach here given the math
  // (5*5*5=125, many combos under 500)
  return '555'
}

/**
 * Pads the flow number to at least 3 digits.
 * e.g., 1 → "001", 25 → "025", 999 → "999", 1000 → "1000"
 */
export function padFlowNumber(num) {
  return String(num).padStart(3, '0')
}

/**
 * Generates an array of serial number strings for a batch.
 * 
 * @param {string} precursor  - e.g., "LCD"
 * @param {string} permaNo    - e.g., "20260728"
 * @param {string} randomSeq  - e.g., "569"
 * @param {number} startFlow  - starting flow number (inclusive)
 * @param {number} endFlow    - ending flow number (inclusive)
 * @returns {string[]} array of serial numbers
 */
export function generateSerialNumbers(precursor, permaNo, randomSeq, startFlow, endFlow) {
  const serialNumbers = []

  for (let flow = startFlow; flow <= endFlow; flow++) {
    const paddedFlow = padFlowNumber(flow)
    const sn = `${precursor}-${permaNo}${randomSeq}${paddedFlow}`
    serialNumbers.push(sn)
  }

  return serialNumbers
}
