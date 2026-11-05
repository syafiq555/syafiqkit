export interface Rgb {
  red?: number
  green?: number
  blue?: number
}

export interface TextRun {
  startIndex?: number
  format?: Record<string, any>
}

export interface CellData {
  formattedValue?: string
  userEnteredValue?: Record<string, any>
  userEnteredFormat?: { textFormat?: Record<string, any> }
  textFormatRuns?: TextRun[]
  chipRuns?: unknown[]
  dataValidation?: unknown
}

export function hexToRgb(hex: string): Rgb {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim())
  if (!m) throw new Error(`"${hex}" is not a colour like #000000`)
  const n = parseInt(m[1]!, 16)
  return { red: ((n >> 16) & 255) / 255, green: ((n >> 8) & 255) / 255, blue: (n & 255) / 255 }
}

export function rgbToHex(rgb: Rgb | undefined): string | undefined {
  if (!rgb) return undefined
  const part = (v: number | undefined) => Math.round((v ?? 0) * 255).toString(16).padStart(2, '0')
  return `#${part(rgb.red)}${part(rgb.green)}${part(rgb.blue)}`
}

const rgbOf = (format: Record<string, any> | undefined): Rgb | undefined =>
  format?.foregroundColorStyle?.rgbColor ?? format?.foregroundColor

export function colourOf(textFormat: Record<string, any> | undefined): string | undefined {
  return rgbToHex(rgbOf(textFormat))
}

export function textOf(cell: CellData): string {
  return cell.userEnteredValue?.stringValue ?? cell.formattedValue ?? ''
}

export function describeCell(cell: CellData) {
  const text = textOf(cell)
  const base = colourOf(cell.userEnteredFormat?.textFormat)
  const runs = (cell.textFormatRuns ?? []).map((run, i, all) => {
    const start = run.startIndex ?? 0
    const end = all[i + 1]?.startIndex ?? text.length
    return {
      start,
      colour: colourOf(run.format) ?? base ?? 'default',
      bold: run.format?.bold || undefined,
      text: text.slice(start, end),
    }
  })
  return {
    text,
    baseColour: base ?? 'default',
    runs,
    hasDriveChip: Boolean(cell.chipRuns?.length),
    validation: cell.dataValidation ?? undefined,
    isFormula: Boolean(cell.userEnteredValue?.formulaValue),
  }
}

export interface AppendPlan {
  text: string
  runs: TextRun[]
  newRunStart: number
}

export function planAppend(cell: CellData, line: string, colour: Rgb): AppendPlan {
  if (cell.userEnteredValue?.formulaValue) throw new Error('The cell holds a formula; appending text would replace it.')
  const userValue = cell.userEnteredValue
  if (userValue && userValue.stringValue === undefined) {
    throw new Error('The cell holds a number or true/false, not text; write it with values_update instead.')
  }
  const old = textOf(cell)
  const text = old ? `${old}\n${line}` : line
  const newRunStart = old.length
  const runs: TextRun[] = [...(cell.textFormatRuns ?? [])]
  runs.push({ startIndex: newRunStart, format: { foregroundColorStyle: { rgbColor: colour } } })
  return { text, runs, newRunStart }
}

const near = (a: number | undefined, b: number | undefined) => Math.abs((a ?? 0) - (b ?? 0)) < 0.01

export function sameRgb(a: Rgb | undefined, b: Rgb | undefined): boolean {
  return near(a?.red, b?.red) && near(a?.green, b?.green) && near(a?.blue, b?.blue)
}

export function colourAt(cell: CellData, index: number): Rgb {
  let run: TextRun | undefined
  for (const r of cell.textFormatRuns ?? []) if ((r.startIndex ?? 0) <= index) run = r
  return rgbOf(run?.format) ?? rgbOf(cell.userEnteredFormat?.textFormat) ?? {}
}

export function checkAppend(before: CellData, plan: AppendPlan, after: CellData, colour: Rgb): string[] {
  const problems: string[] = []
  if (textOf(after) !== plan.text) problems.push('The cell text read back differs from what was written.')
  if (!sameRgb(colourAt(after, plan.newRunStart), colour)) problems.push('The new line did not read back in the requested colour.')
  const oldLength = plan.newRunStart
  const starts = new Set([0, ...(before.textFormatRuns ?? []).map((r) => r.startIndex ?? 0)])
  for (const start of starts) {
    if (start >= oldLength) continue
    if (!sameRgb(colourAt(before, start), colourAt(after, start))) {
      problems.push(`The colour of the existing text starting at character ${start} changed.`)
    }
  }
  return problems
}
