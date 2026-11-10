import { describe, expect, test } from 'bun:test'
import { columnIndex, columnLetters, mergeHolding, mergeLabel, parseRange } from '../src/a1.ts'
import { checkAppend, checkReplace, describeCell, hexToRgb, planAppend, planReplace, rgbToHex, type CellData } from '../src/rich.ts'

const BLUE = { blue: 1 }
const BLACK = hexToRgb('#000000')

describe('a1', () => {
  test('columns round-trip', () => {
    for (const n of [0, 5, 25, 26, 27, 701, 702]) expect(columnIndex(columnLetters(n))).toBe(n)
    expect(columnLetters(5)).toBe('F')
  })

  test('parses a single cell and a quoted sheet', () => {
    expect(parseRange("'Client''s Tracker'!F34")).toEqual({ sheet: "Client's Tracker", startRow: 33, startCol: 5, endRow: 34, endCol: 6 })
    expect(parseRange('Tracker!F43:F60')).toMatchObject({ startRow: 42, endRow: 60, startCol: 5, endCol: 6 })
  })

  test('refuses a range with no sheet', () => {
    expect(() => parseRange('F34')).toThrow('sheet name')
  })
})

describe('append', () => {
  test('keeps existing runs and adds an explicit black run at the old length', () => {
    const cell: CellData = {
      userEnteredValue: { stringValue: 'YY: hello' },
      textFormatRuns: [{ format: { foregroundColorStyle: { rgbColor: BLUE } } }],
    }
    const plan = planAppend(cell, 'Syafiq: reply', BLACK)
    expect(plan.text).toBe('YY: hello\nSyafiq: reply')
    expect(plan.runs).toHaveLength(2)
    expect(plan.runs[0]).toEqual(cell.textFormatRuns![0]!)
    expect(plan.runs[1]).toEqual({ startIndex: 9, format: { foregroundColorStyle: { rgbColor: BLACK } } })
  })

  test('counts an emoji as two UTF-16 units', () => {
    const plan = planAppend({ userEnteredValue: { stringValue: 'ok 👍' } }, 'next', BLACK)
    expect(plan.newRunStart).toBe(5)
  })

  test('an empty cell starts the run at 0', () => {
    const plan = planAppend({}, 'first', BLACK)
    expect(plan.text).toBe('first')
    expect(plan.newRunStart).toBe(0)
  })

  test('refuses formulas and numbers', () => {
    expect(() => planAppend({ userEnteredValue: { formulaValue: '=A1+1' } }, 'x', BLACK)).toThrow('formula')
    expect(() => planAppend({ userEnteredValue: { numberValue: 3 } }, 'x', BLACK)).toThrow('number')
  })

  test('read-back check passes when Google omits zero channels for black', () => {
    const before: CellData = { userEnteredValue: { stringValue: 'a' }, textFormatRuns: [{ format: { foregroundColorStyle: { rgbColor: BLUE } } }] }
    const plan = planAppend(before, 'b', BLACK)
    const after: CellData = {
      userEnteredValue: { stringValue: 'a\nb' },
      textFormatRuns: [
        { format: { foregroundColorStyle: { rgbColor: { blue: 1 } } } },
        { startIndex: 1, format: { foregroundColorStyle: { rgbColor: {} } } },
      ],
    }
    expect(checkAppend(before, plan, after, BLACK)).toEqual([])
  })

  test('read-back check accepts Google dropping a default-black run at 0 in an empty cell', () => {
    const plan = planAppend({}, 'first', BLACK)
    expect(checkAppend({}, plan, { userEnteredValue: { stringValue: 'first' } }, BLACK)).toEqual([])
  })

  test('read-back check accepts a run at 0 folded into the cell colour', () => {
    const before: CellData = { userEnteredValue: { stringValue: 'a' }, userEnteredFormat: { textFormat: { foregroundColorStyle: { rgbColor: BLUE } } } }
    const plan = planAppend(before, 'b', BLACK)
    const after: CellData = { ...before, userEnteredValue: { stringValue: 'a\nb' }, textFormatRuns: [{ startIndex: 1, format: { foregroundColorStyle: { rgbColor: {} } } }] }
    expect(checkAppend(before, plan, after, BLACK)).toEqual([])
  })

  test('read-back check names a lost colour', () => {
    const before: CellData = { userEnteredValue: { stringValue: 'a' }, textFormatRuns: [{ format: { foregroundColorStyle: { rgbColor: BLUE } } }] }
    const plan = planAppend(before, 'b', BLACK)
    const after: CellData = { userEnteredValue: { stringValue: 'a\nb' }, textFormatRuns: [{ startIndex: 1, format: { foregroundColorStyle: { rgbColor: {} } } }] }
    expect(checkAppend(before, plan, after, BLACK)).toEqual(['The colour of the existing text starting at character 0 changed.'])
  })
})

describe('replace', () => {
  const blue = { foregroundColorStyle: { rgbColor: BLUE } }
  const trackerCell = (): CellData => ({
    userEnteredValue: { stringValue: 'YY: who gets it?\nSyafiq: (1) staff (2) extras\nYY: thanks' },
    textFormatRuns: [{ format: blue }, { startIndex: 16, format: {} }, { startIndex: 46, format: blue }],
  })

  test('replaces once, colours the new text and shifts the runs after it', () => {
    const plan = planReplace(trackerCell(), 'Syafiq: (1) staff (2) extras', 'Syafiq:\n(a) staff\n(b) the extras', BLACK)
    expect(plan.text).toBe('YY: who gets it?\nSyafiq:\n(a) staff\n(b) the extras\nYY: thanks')
    expect(plan.runs.map((r) => r.startIndex ?? 0)).toEqual([0, 16, 17, 49, 50])
    expect(plan.runs[2]).toEqual({ startIndex: 17, format: { foregroundColorStyle: { rgbColor: BLACK } } })
    expect(plan.runs[3]).toEqual({ startIndex: 49, format: {} })
    expect(plan.runs[4]).toEqual({ startIndex: 50, format: blue })
  })

  test('replacing the tail of the cell adds no resume run', () => {
    const cell: CellData = { userEnteredValue: { stringValue: 'YY: q\nSyafiq: old' }, textFormatRuns: [{ format: blue }, { startIndex: 5, format: {} }] }
    const plan = planReplace(cell, 'Syafiq: old', 'Syafiq: new and longer', BLACK)
    expect(plan.text).toBe('YY: q\nSyafiq: new and longer')
    expect(plan.runs.map((r) => r.startIndex ?? 0)).toEqual([0, 5, 6])
  })

  test('an empty replacement deletes and keeps the following colour', () => {
    const plan = planReplace(trackerCell(), '\nSyafiq: (1) staff (2) extras', '', BLACK)
    expect(plan.text).toBe('YY: who gets it?\nYY: thanks')
    expect(plan.runs.map((r) => r.startIndex ?? 0)).toEqual([0, 16, 17])
    expect(plan.runs[2]!.format).toEqual(blue)
  })

  test('refuses text that is missing, repeated or empty, and non-text cells', () => {
    expect(() => planReplace(trackerCell(), 'nope', 'x', BLACK)).toThrow('not found')
    expect(() => planReplace(trackerCell(), 'YY:', 'x', BLACK)).toThrow('more than once')
    expect(() => planReplace(trackerCell(), '', 'x', BLACK)).toThrow('empty')
    expect(() => planReplace({ userEnteredValue: { numberValue: 3 } }, '3', 'x', BLACK)).toThrow('number')
  })

  test('read-back check passes on a faithful write and names a lost colour after the edit', () => {
    const before = trackerCell()
    const plan = planReplace(before, 'Syafiq: (1) staff (2) extras', 'Syafiq:\n(a) staff\n(b) the extras', BLACK)
    const good: CellData = { userEnteredValue: { stringValue: plan.text }, textFormatRuns: plan.runs }
    expect(checkReplace(before, plan, good, BLACK)).toEqual([])
    const lost: CellData = { userEnteredValue: { stringValue: plan.text }, textFormatRuns: plan.runs.slice(0, 4) }
    expect(checkReplace(before, plan, lost, BLACK)).toEqual(['The colour of the text kept around the replacement (character 46 before the edit) changed.'])
  })
})

describe('describe', () => {
  test('falls back to the cell colour for runs with no colour of their own', () => {
    const d = describeCell({
      userEnteredValue: { stringValue: 'YY line\nours' },
      userEnteredFormat: { textFormat: { foregroundColorStyle: { rgbColor: BLUE } } },
      textFormatRuns: [{ format: {} }, { startIndex: 7, format: { foregroundColorStyle: { rgbColor: {} } } }],
    })
    expect(d.baseColour).toBe('#0000ff')
    expect(d.runs.map((r) => [r.colour, r.text])).toEqual([
      ['#0000ff', 'YY line'],
      ['#000000', '\nours'],
    ])
  })

  test('hex helpers', () => {
    expect(rgbToHex(hexToRgb('#a02b93'))).toBe('#a02b93')
    expect(() => hexToRgb('blue')).toThrow()
  })
})

describe('ranges and merges', () => {
  test('whole columns and rows are open-ended', () => {
    expect(parseRange('Tracker!F:F')).toEqual({ sheet: 'Tracker', startRow: 0, startCol: 5, endRow: undefined, endCol: 6 })
    expect(parseRange('Tracker!3:5')).toEqual({ sheet: 'Tracker', startRow: 2, startCol: 0, endRow: 5, endCol: undefined })
  })

  test('a half-open range keeps its start', () => {
    expect(parseRange('Tracker!F3:F')).toMatchObject({ startRow: 2, startCol: 5, endRow: undefined, endCol: 6 })
    expect(parseRange('Tracker!A5:C')).toMatchObject({ startRow: 4, startCol: 0, endRow: undefined, endCol: 3 })
  })

  test('row 0 is refused', () => {
    expect(() => parseRange('Tracker!F0')).toThrow('not a cell')
  })

  test('finds the merge holding a cell and labels it', () => {
    const merges = [{ startRowIndex: 5, endRowIndex: 11, startColumnIndex: 5, endColumnIndex: 6 }]
    expect(mergeHolding(merges, 7, 5)).toBe(merges[0])
    expect(mergeHolding(merges, 11, 5)).toBeUndefined()
    expect(mergeLabel(merges[0]!)).toBe('F6:F11')
  })
})
