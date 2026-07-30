/**
 * CSV Export Utility
 * 
 * Joins serial numbers with ", " (comma-space) and triggers a browser download.
 */

/**
 * Downloads an array of serial numbers as a .csv file.
 * Format: SN1, SN2, SN3, ...
 * 
 * @param {string[]} serialNumbers - array of SN strings
 * @param {string} filename - download filename (without extension)
 */
export function downloadCSV(serialNumbers, filename = 'serial_numbers') {
  const content = serialNumbers.join(', ')
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.csv`
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()

  // Cleanup
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
