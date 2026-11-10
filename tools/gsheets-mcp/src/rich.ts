export interface Rgb {
  red?: number
  green?: number
  blue?: number
}

export interface TextRun {
  startIndex?: number
  format?: Record<string, any>
}

export interface ChipRun {
  startIndex?: number
  chip?: Record<string, any>
}

export interface CellData {
  formattedValue?: string
  userEnteredValue?: Record<string, any>
  userEnteredFormat?: { textFormat?: Record<string, any> }
  textFormatRuns?: TextRun[]
  chipRuns?: ChipRun[]
  dataValidation?: unknown
}

export const CHIP_PLACEHOLDER = '@'

export function collapseChips(cell: CellData): CellData {
  const raw = cell.chipRuns ?? []
  if (!raw.some((r) => r.chip)) return cell
  const text = textOf(cell)
  const spans = raw
    .map((r, i) => ({ start: r.startIndex ?? 0, end: raw[i + 1]?.startIndex ?? text.length, chip: r.chip }))
    .filter((s) => s.chip)
  const removedBefore = (i: number) => spans.filter((s) => s.end <= i).reduce((n, s) => n + s.end - s.start - 1, 0)
  const map = (i: number) => {
    const inside = spans.find((s) => i > s.start && i < s.end)
    return inside ? inside.start - removedBefore(inside.start) + 1 : i - removedBefore(i)
  }
  let collapsed = ''
  let last = 0
  const chipRuns: ChipRun[] = []
  for (const s of spans) {
    collapsed += text.slice(last, s.start)
    chipRuns.push({ startIndex: collapsed.length, chip: s.chip })
    collapsed += CHIP_PLACEHOLDER
    last = s.end
  }
  collapsed += text.slice(last)
  const byStart = new Map<number, TextRun>()
  for (const r of cell.textFormatRuns ?? []) {
    const at = map(r.startIndex ?? 0)
    if (at < collapsed.length) byStart.set(at, { ...r, startIndex: at })
  }
  return {
    ...cell,
    userEnteredValue: { ...cell.userEnteredValue, stringValue: collapsed },
    formattedValue: collapsed,
    textFormatRuns: [...byStart.values()].sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0)),
    chipRuns,
  }
}

export function chipLinks(cell: CellData): string[] {
  return (cell.chipRuns ?? []).flatMap((r) => {
    if (!r.chip) return []
    const uri = String(r.chip.richLinkProperties?.uri ?? JSON.stringify(r.chip))
    return [`${r.startIndex ?? 0}:${/\/d\/([\w-]+)/.exec(uri)?.[1] ?? uri}`]
  })
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
  chipRuns: ChipRun[]
  newRunStart: number
}

export function planAppend(cell: CellData, line: string, colour: Rgb): AppendPlan {
  if (cell.userEnteredValue?.formulaValue) throw new Error('The cell holds a formula; appending text would replace it.')
  refuseNonText(cell)
  const old = textOf(cell)
  const text = old ? `${old}\n${line}` : line
  const newRunStart = old.length
  const runs: TextRun[] = [...(cell.textFormatRuns ?? [])]
  runs.push({ startIndex: newRunStart, format: { foregroundColorStyle: { rgbColor: colour } } })
  return { text, runs, chipRuns: cell.chipRuns ?? [], newRunStart }
}

export interface ReplacePlan {
  text: string
  runs: TextRun[]
  chipRuns: ChipRun[]
  start: number
  oldEnd: number
  newEnd: number
}

function refuseNonText(cell: CellData): void {
  if (cell.userEnteredValue?.formulaValue) throw new Error('The cell holds a formula; rewriting its text would replace it.')
  const userValue = cell.userEnteredValue
  if (userValue && userValue.stringValue === undefined) {
    throw new Error('The cell holds a number or true/false, not text; write it with values_update instead.')
  }
}

export function planReplace(cell: CellData, find: string, replace: string, colour: Rgb): ReplacePlan {
  refuseNonText(cell)
  if (!find) throw new Error('find is empty; give the exact text to replace.')
  const old = textOf(cell)
  const start = old.indexOf(find)
  if (start < 0) throw new Error('find was not found in the cell; read it with cells_read_rich and copy the text exactly.')
  if (old.indexOf(find, start + 1) >= 0) throw new Error('find appears more than once in the cell; include more of the surrounding text so it matches once.')
  const oldEnd = start + find.length
  const chips = cell.chipRuns ?? []
  if (chips.some((r) => (r.startIndex ?? 0) >= start && (r.startIndex ?? 0) < oldEnd)) {
    throw new Error('find covers a Drive file chip, which this tool keeps as it is; choose text that leaves the chip out.')
  }
  const newEnd = start + replace.length
  const text = old.slice(0, start) + replace + old.slice(oldEnd)
  const shift = newEnd - oldEnd
  const original = cell.textFormatRuns ?? []
  let resume: TextRun | undefined
  for (const r of original) if ((r.startIndex ?? 0) <= oldEnd) resume = r
  const runs: TextRun[] = original.filter((r) => (r.startIndex ?? 0) < start)
  if (replace) runs.push({ startIndex: start, format: { foregroundColorStyle: { rgbColor: colour } } })
  const after = original.filter((r) => (r.startIndex ?? 0) >= oldEnd).map((r) => ({ ...r, startIndex: (r.startIndex ?? 0) + shift }))
  if (oldEnd < old.length && !after.some((r) => r.startIndex === newEnd)) {
    runs.push({ startIndex: newEnd, format: resume?.format ?? {} })
  }
  runs.push(...after)
  const byStart = new Map<number, TextRun>()
  for (const r of runs) if ((r.startIndex ?? 0) < text.length) byStart.set(r.startIndex ?? 0, r)
  const chipRuns = chips.map((r) => ((r.startIndex ?? 0) >= oldEnd ? { ...r, startIndex: (r.startIndex ?? 0) + shift } : r))
  return { text, runs: [...byStart.values()].sort((a, b) => (a.startIndex ?? 0) - (b.startIndex ?? 0)), chipRuns, start, oldEnd, newEnd }
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

export function checkReplace(before: CellData, plan: ReplacePlan, after: CellData, colour: Rgb): string[] {
  const problems: string[] = []
  if (textOf(after) !== plan.text) problems.push('The cell text read back differs from what was written.')
  if (chipLinks({ chipRuns: plan.chipRuns }).join() !== chipLinks(after).join()) problems.push('The Drive file chip did not read back where it was.')
  if (plan.newEnd > plan.start && !sameRgb(colourAt(after, plan.start), colour)) problems.push('The replacement did not read back in the requested colour.')
  const oldLength = textOf(before).length
  const starts = new Set([0, plan.oldEnd, ...(before.textFormatRuns ?? []).map((r) => r.startIndex ?? 0)])
  for (const s of starts) {
    if (s >= oldLength || (s >= plan.start && s < plan.oldEnd)) continue
    const mapped = s < plan.start ? s : s + plan.newEnd - plan.oldEnd
    if (!sameRgb(colourAt(before, s), colourAt(after, mapped))) {
      problems.push(`The colour of the text kept around the replacement (character ${s} before the edit) changed.`)
    }
  }
  return problems
}

export function checkAppend(before: CellData, plan: AppendPlan, after: CellData, colour: Rgb): string[] {
  const problems: string[] = []
  if (textOf(after) !== plan.text) problems.push('The cell text read back differs from what was written.')
  if (chipLinks({ chipRuns: plan.chipRuns }).join() !== chipLinks(after).join()) problems.push('The Drive file chip did not read back where it was.')
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

export interface AwaitingReply {
  theirs: string
  theirColours: string[]
  yourLast?: string
}

export function awaitingReply(cell: CellData, mine: string[]): AwaitingReply | null {
  const d = describeCell(cell)
  const own = new Set(mine.map((c) => (c.trim().toLowerCase() === 'default' ? 'default' : rgbToHex(hexToRgb(c.trim())))))
  const lead = { colour: d.baseColour, text: d.text.slice(0, d.runs[0]?.start ?? d.text.length) }
  const spoken = [lead, ...d.runs].filter((r) => r.text.trim())
  const lastOwn = spoken.findLastIndex((r) => own.has(r.colour))
  const after = spoken.slice(lastOwn + 1)
  if (!after.length) return null
  let ownStart = lastOwn
  while (ownStart > 0 && own.has(spoken[ownStart - 1]!.colour)) ownStart--
  const ownText = lastOwn < 0 ? '' : spoken.slice(ownStart, lastOwn + 1).map((r) => r.text).join('')
  return {
    theirs: after.map((r) => r.text).join('').trim(),
    theirColours: [...new Set(after.map((r) => r.colour))],
    yourLast: ownText.split('\n').map((l) => l.trim()).filter(Boolean).at(-1)?.slice(0, 200),
  }
}
