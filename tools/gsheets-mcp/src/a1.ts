export interface A1Range {
  sheet: string
  startRow: number
  startCol: number
  endRow?: number
  endCol?: number
}

export function columnIndex(letters: string): number {
  let n = 0
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64)
  return n - 1
}

export function columnLetters(index: number): string {
  let s = ''
  let n = index + 1
  while (n > 0) {
    const r = (n - 1) % 26
    s = String.fromCharCode(65 + r) + s
    n = Math.floor((n - 1) / 26)
  }
  return s
}

export function cellAddress(col: number, row: number): string {
  return `${columnLetters(col)}${row + 1}`
}

export function splitSheet(a1: string): { sheet: string; cells: string } {
  const bang = a1.lastIndexOf('!')
  if (bang < 0) throw new Error(`Range "${a1}" needs a sheet name, e.g. Sheet1!A1`)
  let sheet = a1.slice(0, bang)
  if (sheet.startsWith("'") && sheet.endsWith("'")) sheet = sheet.slice(1, -1).replace(/''/g, "'")
  return { sheet, cells: a1.slice(bang + 1) }
}

export function parseRange(a1: string): A1Range {
  const { sheet, cells } = splitSheet(a1)
  const parts = cells.split(':')
  const cell = (s: string) => {
    const m = /^([A-Za-z]*)(\d*)$/.exec(s.trim())
    if (!m || (!m[1] && !m[2]) || m[2] === '0' || /^0\d/.test(m[2]!)) {
      throw new Error(`"${s}" in "${a1}" is not a cell like F34, a column like F or a row like 34`)
    }
    return { col: m[1] ? columnIndex(m[1]) : undefined, row: m[2] ? Number(m[2]) - 1 : undefined }
  }
  const a = cell(parts[0]!)
  const b = parts[1] ? cell(parts[1]) : a
  const low = (x?: number, y?: number) => Math.min(x ?? y ?? 0, y ?? x ?? 0)
  const high = (x?: number, y?: number) => (x === undefined || y === undefined ? undefined : Math.max(x, y) + 1)
  return {
    sheet,
    startRow: low(a.row, b.row),
    startCol: low(a.col, b.col),
    endRow: high(a.row, b.row),
    endCol: high(a.col, b.col),
  }
}

export interface Merge {
  startRowIndex?: number
  endRowIndex?: number
  startColumnIndex?: number
  endColumnIndex?: number
}

export function mergeHolding(merges: Merge[], row: number, col: number): Merge | undefined {
  return merges.find(
    (m) =>
      row >= (m.startRowIndex ?? 0) &&
      row < (m.endRowIndex ?? Infinity) &&
      col >= (m.startColumnIndex ?? 0) &&
      col < (m.endColumnIndex ?? Infinity),
  )
}

export function mergeLabel(m: Merge): string {
  const top = cellAddress(m.startColumnIndex ?? 0, m.startRowIndex ?? 0)
  const bottom = cellAddress((m.endColumnIndex ?? 1) - 1, (m.endRowIndex ?? 1) - 1)
  return `${top}:${bottom}`
}

export function gridRange(r: A1Range, sheetId: number) {
  return {
    sheetId,
    startRowIndex: r.startRow,
    endRowIndex: r.endRow,
    startColumnIndex: r.startCol,
    endColumnIndex: r.endCol,
  }
}
