import { existsSync, lstatSync, mkdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, dirname, extname, join, relative } from 'node:path'
import { configDir } from './auth.ts'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { cellAddress, gridRange, mergeHolding, mergeLabel, parseRange, type Merge } from './a1.ts'
import { DRIVE, DRIVE_UPLOAD, Google, SHEETS, SLIDES, query } from './google.ts'
import { awaitingReply, checkAppend, checkReplace, chipLinks, collapseChips, describeCell, hexToRgb, planAppend, planReplace, type CellData, type ChipRun, type TextRun } from './rich.ts'

const id = z.string().describe('Spreadsheet id (the long part of the sheet URL between /d/ and /edit)')
const range = z.string().describe('A1 range with its sheet name, e.g. Tracker!A1:F20. Tabs can be renamed by their owner, so list them with sheets_list if a name stops working')
const rows = z.array(z.array(z.any())).describe('Rows of cell values; strings starting with = are formulas when valueInputOption is USER_ENTERED')
const inputOption = z.enum(['USER_ENTERED', 'RAW']).default('USER_ENTERED')
const render = z.enum(['FORMATTED_VALUE', 'UNFORMATTED_VALUE', 'FORMULA']).default('FORMATTED_VALUE')

const READ = { readOnlyHint: true, openWorldHint: true }
const WRITE = { readOnlyHint: false, destructiveHint: false, openWorldHint: true }
const DESTROY = { readOnlyHint: false, destructiveHint: true, openWorldHint: true }

const WIPES_COLOURS =
  'It replaces each whole cell, so per-line text colours (someone else\'s coloured comments) turn plain. To add a line to a cell that holds coloured text, use cell_append_line.'

const RICH_FIELDS =
  'sheets(properties(title,sheetId),merges,data(startRow,startColumn,rowData.values(formattedValue,userEnteredValue,userEnteredFormat.textFormat,textFormatRuns,chipRuns,dataValidation)))'

function result(data: unknown) {
  return { content: [{ type: 'text' as const, text: typeof data === 'string' ? data : JSON.stringify(data, null, 2) }] }
}

function failure(err: unknown) {
  return { content: [{ type: 'text' as const, text: err instanceof Error ? err.message : String(err) }], isError: true }
}

function guarded<A>(fn: (args: A) => Promise<unknown>) {
  return async (args: A) => {
    try {
      return result(await fn(args))
    } catch (err) {
      return failure(err)
    }
  }
}

async function sheetMeta(g: Google, spreadsheetId: string, title: string): Promise<{ sheetId: number; merges: Merge[] }> {
  const meta = await g.call('GET', `${SHEETS}/${encodeURIComponent(spreadsheetId)}${query({ fields: 'sheets(properties(sheetId,title),merges)' })}`)
  const sheet = (meta.sheets ?? []).find((s: any) => s.properties?.title === title)
  if (!sheet) {
    const names = (meta.sheets ?? []).map((s: any) => s.properties?.title).join(', ')
    throw new Error(`No sheet named "${title}" (it may have been renamed). Sheets here: ${names}`)
  }
  return { sheetId: sheet.properties.sheetId ?? 0, merges: sheet.merges ?? [] }
}

async function batchUpdate(g: Google, spreadsheetId: string, requests: unknown[]) {
  return g.call('POST', `${SHEETS}/${encodeURIComponent(spreadsheetId)}:batchUpdate`, { body: { requests } })
}

async function readRich(g: Google, spreadsheetId: string, a1: string): Promise<{ block: any; merges: Merge[] }> {
  const data = await g.call('GET', `${SHEETS}/${encodeURIComponent(spreadsheetId)}${query({ ranges: a1, fields: RICH_FIELDS })}`)
  const sheet = data.sheets?.[0]
  return { block: sheet?.data?.[0] ?? {}, merges: sheet?.merges ?? [] }
}

async function readCell(g: Google, spreadsheetId: string, a1: string): Promise<CellData> {
  const { block } = await readRich(g, spreadsheetId, a1)
  return block.rowData?.[0]?.values?.[0] ?? {}
}

async function openRichCell(g: Google, spreadsheetId: string, cell: string) {
  const r = parseRange(cell)
  if (r.endRow !== r.startRow + 1 || r.endCol !== r.startCol + 1) throw new Error('cell must be a single cell, e.g. Tracker!F34')
  const before = collapseChips(await readCell(g, spreadsheetId, cell))
  const { sheetId, merges } = await sheetMeta(g, spreadsheetId, r.sheet)
  const merge = mergeHolding(merges, r.startRow, r.startCol)
  if (merge && (merge.startRowIndex !== r.startRow || merge.startColumnIndex !== r.startCol)) {
    const topLeft = cellAddress(merge.startColumnIndex ?? 0, merge.startRowIndex ?? 0)
    throw new Error(`${cell} is a hidden part of the merged block ${mergeLabel(merge)}, so text written there never shows. Nothing was written: use ${r.sheet}!${topLeft} instead.`)
  }
  const write = async (text: string, runs: TextRun[], chipRuns: ChipRun[]): Promise<CellData> => {
    const value = chipRuns.length
      ? { userEnteredValue: { stringValue: text }, textFormatRuns: runs, chipRuns }
      : { userEnteredValue: { stringValue: text }, textFormatRuns: runs }
    try {
      await batchUpdate(g, spreadsheetId, [
        {
          updateCells: {
            range: gridRange(r, sheetId),
            rows: [{ values: [value] }],
            fields: chipRuns.length ? 'userEnteredValue,textFormatRuns,chipRuns' : 'userEnteredValue,textFormatRuns',
          },
        },
      ])
    } catch (err) {
      if (chipRuns.length && /chip data: Permission denied/i.test(String(err))) {
        throw new Error(
          `This cell links a Drive file (${chipLinks({ chipRuns }).join(', ')}) that this sign-in cannot open, and Google refuses a rewrite of the cell unless it can. Nothing was written. Ask the file's owner to share it with the signed-in account and try again, or paste the line into the sheet by hand. If the account can open the file in a browser, the sign-in predates the drive.readonly scope: run gsheets-mcp auth.`,
        )
      }
      throw err
    }
    return readCell(g, spreadsheetId, cell)
  }
  return { before, write }
}

const MIME: Record<string, string> = {
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.pdf': 'application/pdf',
  '.csv': 'text/csv',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.html': 'text/html',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.zip': 'application/zip',
}

const GOOGLE_TYPE: Record<string, string> = {
  doc: 'application/vnd.google-apps.document',
  sheet: 'application/vnd.google-apps.spreadsheet',
  slides: 'application/vnd.google-apps.presentation',
}

const realOrSelf = (p: string) => {
  let existing = p
  while (!existsSync(existing)) existing = dirname(existing)
  return join(realpathSync(existing), relative(existing, p))
}

const PRIVATE_DIRS = [
  configDir(),
  join(homedir(), '.ssh'),
  join(homedir(), '.aws'),
  join(homedir(), '.gnupg'),
  join(homedir(), '.claude'),
  join(homedir(), '.config', 'gh'),
  join(homedir(), '.config', 'remote-cli'),
  join(homedir(), 'mcps', 'gsheets-config'),
].map(realOrSelf)

const CREDENTIAL_FILE = /(^|\/)(\.env(\..*)?|[^/]*\.env|\.netrc)$/

function localFile(path: string) {
  if (!path.startsWith('/')) throw new Error('path must be absolute')
  let real: string
  try {
    real = realpathSync(path)
  } catch {
    throw new Error(`${path} does not exist`)
  }
  if (PRIVATE_DIRS.some((dir) => real === dir || real.startsWith(`${dir}/`)) || CREDENTIAL_FILE.test(real)) {
    throw new Error(`${path} holds credentials; it is never uploaded`)
  }
  if (!statSync(path).isFile()) throw new Error(`${path} is not a file`)
  return { bytes: readFileSync(path), mime: MIME[extname(path).toLowerCase()] ?? 'application/octet-stream' }
}

function multipart(metadata: object, bytes: Uint8Array, mime: string) {
  const boundary = `gsheets${crypto.randomUUID().replace(/-/g, '')}`
  const head = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`
  const tail = `\r\n--${boundary}--`
  const body = new Blob([head, bytes, tail])
  return { body, contentType: `multipart/related; boundary=${boundary}` }
}

export function outputPath(path: string): string {
  if (!path.startsWith('/')) throw new Error('path must be absolute')
  const real = join(realOrSelf(dirname(path)), basename(path))
  if (PRIVATE_DIRS.some((dir) => real === dir || real.startsWith(`${dir}/`)) || CREDENTIAL_FILE.test(real)) {
    throw new Error(`${path} is inside a credentials folder or names a credentials file; choose another place`)
  }
  if (basename(real).startsWith('.') || /\/Library\/(LaunchAgents|LaunchDaemons)(\/|$)/.test(real)) {
    throw new Error(`${path} is a hidden file or a launch folder, where a replaced file can run code; choose another place`)
  }
  if (lstatSync(real, { throwIfNoEntry: false })?.isSymbolicLink()) throw new Error(`${path} is a symlink; choose a plain file path`)
  mkdirSync(dirname(real), { recursive: true })
  return real
}

const EXPORT_TYPE = {
  pdf: 'application/pdf',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  csv: 'text/csv',
  txt: 'text/plain',
  png: 'image/png',
}

const DRIVE_FIELDS = 'id,name,mimeType,webViewLink,modifiedTime,parents'

export function registerTools(server: McpServer, g: Google): void {
  server.registerTool(
    'values_get',
    {
      description: 'Read cell values from one range. Use valueRenderOption FORMULA to see formulas (check before overwriting a KPI or total cell, since a written value replaces its formula).',
      inputSchema: { spreadsheetId: id, range, valueRenderOption: render },
      annotations: READ,
    },
    guarded(async ({ spreadsheetId, range, valueRenderOption }) =>
      g.call('GET', `${SHEETS}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}${query({ valueRenderOption })}`),
    ),
  )

  server.registerTool(
    'values_batch_get',
    {
      description: 'Read cell values from several ranges in one call.',
      inputSchema: { spreadsheetId: id, ranges: z.array(z.string()), valueRenderOption: render },
      annotations: READ,
    },
    guarded(async ({ spreadsheetId, ranges, valueRenderOption }) =>
      g.call('GET', `${SHEETS}/${encodeURIComponent(spreadsheetId)}/values:batchGet${query({ ranges, valueRenderOption })}`),
    ),
  )

  server.registerTool(
    'values_update',
    {
      description: `Write values into a range. ${WIPES_COLOURS}`,
      inputSchema: { spreadsheetId: id, range, values: rows, valueInputOption: inputOption },
      annotations: WRITE,
    },
    guarded(async ({ spreadsheetId, range, values, valueInputOption }) =>
      g.call('PUT', `${SHEETS}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}${query({ valueInputOption })}`, {
        body: { range, values },
      }),
    ),
  )

  server.registerTool(
    'values_batch_update',
    {
      description: `Write values into several ranges in one call. ${WIPES_COLOURS}`,
      inputSchema: {
        spreadsheetId: id,
        data: z.array(z.object({ range: z.string(), values: rows })),
        valueInputOption: inputOption,
      },
      annotations: WRITE,
    },
    guarded(async ({ spreadsheetId, data, valueInputOption }) =>
      g.call('POST', `${SHEETS}/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`, { body: { valueInputOption, data } }),
    ),
  )

  server.registerTool(
    'values_append',
    {
      description: 'Append rows after the last row of data in a range (a new item at the bottom of a table). Writes only cells it adds.',
      inputSchema: { spreadsheetId: id, range, values: rows, valueInputOption: inputOption },
      annotations: WRITE,
    },
    guarded(async ({ spreadsheetId, range, values, valueInputOption }) =>
      g.call(
        'POST',
        `${SHEETS}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:append${query({ valueInputOption, insertDataOption: 'INSERT_ROWS' })}`,
        { body: { range, values } },
      ),
    ),
  )

  server.registerTool(
    'values_clear',
    {
      description: 'Clear the values in a range (formatting stays).',
      inputSchema: { spreadsheetId: id, range },
      annotations: DESTROY,
    },
    guarded(async ({ spreadsheetId, range }) =>
      g.call('POST', `${SHEETS}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}:clear`, { body: {} }),
    ),
  )

  server.registerTool(
    'cells_read_rich',
    {
      description:
        'Read cells with who-wrote-what detail: the text, the cell\'s own text colour, each coloured run with its text, whether the cell holds a Drive file chip, its dropdown or validation rule, whether it is a formula, and the merged block it belongs to (a cell marked hiddenByMerge never shows on screen; reply in its block\'s top-left cell). Use it before replying in a shared tracker where people write in different colours.',
      inputSchema: { spreadsheetId: id, range },
      annotations: READ,
    },
    guarded(async ({ spreadsheetId, range }) => {
      const { block, merges } = await readRich(g, spreadsheetId, range)
      const parsed = parseRange(range)
      const startRow = block.startRow ?? parsed.startRow
      const startCol = block.startColumn ?? parsed.startCol
      const cells: unknown[] = []
      ;(block.rowData ?? []).forEach((row: any, r: number) => {
        ;(row.values ?? []).forEach((cell: CellData, c: number) => {
          const d = describeCell(cell)
          const rowIndex = startRow + r
          const colIndex = startCol + c
          const merge = mergeHolding(merges, rowIndex, colIndex)
          const topLeft = merge && merge.startRowIndex === rowIndex && merge.startColumnIndex === colIndex
          if (!d.text && !d.validation && !d.hasDriveChip && !topLeft) return
          const mergeInfo = merge ? (topLeft ? { mergedBlock: mergeLabel(merge) } : { hiddenByMerge: mergeLabel(merge) }) : {}
          cells.push({ cell: cellAddress(colIndex, rowIndex), ...mergeInfo, ...d })
        })
      })
      return cells
    }),
  )

  server.registerTool(
    'cells_awaiting_reply',
    {
      description:
        'Find which tracker rows wait for your reply, without reading every cell. Give the reply column (e.g. Tracker!F2:F200) and the colours you write in; it returns only the cells where text in another colour comes after your last line, with that text, its colours and your last line. Who wrote what is read from the text colour, never from a name at the start of a line, so a client line with no name and a client question in the middle of a cell are both caught. Pass alsoRead (e.g. Tracker!A2:E200, the same rows) to get each row\'s other columns beside it, and statusColumn (e.g. E) to leave out rows whose status is in skipStatuses (Closed by default). Cells with no text in another colour after yours are left out, so a row you still owe something on without the client writing again (your own stale promise, a status to move) is not listed: read those rows yourself.',
      inputSchema: {
        spreadsheetId: id,
        range: range.describe('One column of reply cells with its sheet name, e.g. Tracker!F2:F200'),
        mine: z.array(z.string().regex(/^\s*(default|#?[0-9a-f]{6})\s*$/i)).default(['default', '#000000']).describe('Colours your side writes in, as #rrggbb; "default" is text with no colour set'),
        alsoRead: z.string().optional().describe('Optional range over the same rows (e.g. Tracker!A2:E200) whose values are returned beside each listed cell'),
        statusColumn: z.string().regex(/^[A-Za-z]{1,3}$/).optional().describe('Column letter holding each row\'s status, e.g. E; rows whose status is in skipStatuses are left out'),
        skipStatuses: z.array(z.string()).default(['Closed']).describe('Statuses to leave out when statusColumn is given (exact text, case ignored)'),
      },
      annotations: READ,
    },
    guarded(async ({ spreadsheetId, range: replyRange, mine, alsoRead, statusColumn, skipStatuses }) => {
      const parsed = parseRange(replyRange)
      if (parsed.endCol === undefined || parsed.endCol - parsed.startCol !== 1) throw new Error('Give one column of reply cells, e.g. Tracker!F2:F200.')
      const { block } = await readRich(g, spreadsheetId, replyRange)
      const replyRows: any[] = block.rowData ?? []
      const startRow = block.startRow ?? parsed.startRow
      const colIndex = block.startColumn ?? parsed.startCol
      const valuesByRow = async (a1: string, firstRow: number) => {
        const res = await g.call('GET', `${SHEETS}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(a1)}`)
        return new Map(((res.values ?? []) as unknown[][]).map((row, i) => [firstRow + i, row] as const))
      }
      const extra = alsoRead ? await valuesByRow(alsoRead, parseRange(alsoRead).startRow) : new Map<number, unknown[]>()
      const sheetPrefix = replyRange.slice(0, replyRange.lastIndexOf('!'))
      const col = statusColumn?.toUpperCase()
      const status = col && replyRows.length ? await valuesByRow(`${sheetPrefix}!${col}${startRow + 1}:${col}${parsed.endRow ?? startRow + replyRows.length}`, startRow) : new Map<number, unknown[]>()
      const skip = new Set(skipStatuses.map((s) => s.trim().toLowerCase()))
      const rows: unknown[] = []
      let skipped = 0
      replyRows.forEach((row, r) => {
        const cell: CellData | undefined = row.values?.[0]
        const waiting = cell && awaitingReply(cell, mine)
        if (!waiting) return
        const rowIndex = startRow + r
        const rowStatus = col ? String(status.get(rowIndex)?.[0] ?? '') : undefined
        if (rowStatus !== undefined && skip.has(rowStatus.trim().toLowerCase())) {
          skipped++
          return
        }
        rows.push({ cell: cellAddress(colIndex, rowIndex), status: rowStatus, row: extra.get(rowIndex), ...waiting })
      })
      return { awaiting: rows.length, skippedByStatus: col ? skipped : undefined, rows }
    }),
  )

  server.registerTool(
    'cell_append_line',
    {
      description:
        'Add a line to the end of one cell without touching anyone else\'s text colours (the safe way to reply in a shared tracker). The new line gets an explicit colour, black by default, so it does not inherit a cell-wide colour such as a client\'s blue. Refuses a hidden cell inside a merged block (naming the block\'s top-left cell to use). A Drive file chip in the cell is kept, which Google allows only when this sign-in can open the linked file; otherwise nothing is written and the error says so. Reads the cell back and reports the result; a mismatch is reported as an error.',
      inputSchema: {
        spreadsheetId: id,
        cell: z.string().describe('One cell with its sheet name, e.g. Tracker!F34'),
        line: z.string().describe('The text to add as a new line'),
        colour: z.string().default('#000000').describe('Colour of the new line as #rrggbb'),
      },
      annotations: WRITE,
    },
    guarded(async ({ spreadsheetId, cell, line, colour }) => {
      const rgb = hexToRgb(colour)
      const { before, write } = await openRichCell(g, spreadsheetId, cell)
      const plan = planAppend(before, line, rgb)
      const after = await write(plan.text, plan.runs, plan.chipRuns)
      const problems = checkAppend(before, plan, collapseChips(after), rgb)
      const readBack = describeCell(after)
      if (problems.length) throw new Error(`Written, but the read-back is wrong (do not retry, or the line is added twice):\n- ${problems.join('\n- ')}\n${JSON.stringify(readBack, null, 2)}`)
      return { ok: true, cell, readBack }
    }),
  )

  server.registerTool(
    'cell_replace_text',
    {
      description:
        'Replace one exact piece of text inside a cell (for example your own earlier reply in a shared tracker) without touching anyone else\'s text colours. find must occur exactly once in the cell, so copy it from cells_read_rich; the replacement gets an explicit colour, black by default, and the text after it keeps the colour it had. Same refusals as cell_append_line (hidden merged cell, a Drive file chip this sign-in cannot open, formula or number); find may not cover a chip. Reads the cell back and reports the result.',
      inputSchema: {
        spreadsheetId: id,
        cell: z.string().describe('One cell with its sheet name, e.g. Tracker!F34'),
        find: z.string().describe('The exact text to replace, occurring once in the cell; it may span several lines'),
        replace: z.string().describe('The new text; may contain line breaks, or be empty to delete find'),
        colour: z.string().default('#000000').describe('Colour of the replacement text as #rrggbb'),
      },
      annotations: WRITE,
    },
    guarded(async ({ spreadsheetId, cell, find, replace, colour }) => {
      const rgb = hexToRgb(colour)
      const { before, write } = await openRichCell(g, spreadsheetId, cell)
      const plan = planReplace(before, find, replace, rgb)
      const after = await write(plan.text, plan.runs, plan.chipRuns)
      const problems = checkReplace(before, plan, collapseChips(after), rgb)
      const readBack = describeCell(after)
      if (problems.length) throw new Error(`Written, but the read-back is wrong (read the cell before trying again):\n- ${problems.join('\n- ')}\n${JSON.stringify(readBack, null, 2)}`)
      return { ok: true, cell, readBack }
    }),
  )

  server.registerTool(
    'validation_clear',
    {
      description: 'Remove any dropdown or data validation rule from a range, so text written there is not shown as an invalid chip and picking from a dropdown cannot overwrite the cell.',
      inputSchema: { spreadsheetId: id, range },
      annotations: WRITE,
    },
    guarded(async ({ spreadsheetId, range }) => {
      const r = parseRange(range)
      const { sheetId } = await sheetMeta(g, spreadsheetId, r.sheet)
      await batchUpdate(g, spreadsheetId, [{ setDataValidation: { range: gridRange(r, sheetId) } }])
      return { ok: true, cleared: range }
    }),
  )

  server.registerTool(
    'spreadsheet_get',
    {
      description:
        'Read spreadsheet metadata or any part of its grid, returned as Google sends it. Pass `fields` (a Sheets API field mask) to choose what comes back, and `ranges` with includeGridData for cell formats. Default returns the title and each sheet\'s properties.',
      inputSchema: {
        spreadsheetId: id,
        ranges: z.array(z.string()).optional(),
        includeGridData: z.boolean().default(false),
        fields: z.string().optional().describe('Field mask, e.g. sheets(properties.title,conditionalFormats)'),
      },
      annotations: READ,
    },
    guarded(async ({ spreadsheetId, ranges, includeGridData, fields }) =>
      g.call(
        'GET',
        `${SHEETS}/${encodeURIComponent(spreadsheetId)}${query({
          ranges,
          includeGridData: includeGridData || undefined,
          fields: fields ?? (includeGridData ? undefined : 'spreadsheetId,properties(title,locale,timeZone),sheets.properties,spreadsheetUrl'),
        })}`,
      ),
    ),
  )

  server.registerTool(
    'sheets_list',
    {
      description: 'List the tabs in a spreadsheet with their ids and sizes.',
      inputSchema: { spreadsheetId: id },
      annotations: READ,
    },
    guarded(async ({ spreadsheetId }) => {
      const meta = await g.call('GET', `${SHEETS}/${encodeURIComponent(spreadsheetId)}${query({ fields: 'sheets.properties(sheetId,title,index,gridProperties)' })}`)
      return (meta.sheets ?? []).map((s: any) => s.properties)
    }),
  )

  server.registerTool(
    'sheet_add',
    {
      description: 'Add a tab to a spreadsheet.',
      inputSchema: { spreadsheetId: id, title: z.string() },
      annotations: WRITE,
    },
    guarded(async ({ spreadsheetId, title }) => batchUpdate(g, spreadsheetId, [{ addSheet: { properties: { title } } }])),
  )

  server.registerTool(
    'sheet_delete',
    {
      description: 'Delete a tab and everything on it. Cannot be undone through the API.',
      inputSchema: { spreadsheetId: id, sheetId: z.number().int().describe('Numeric sheet id from sheets_list') },
      annotations: DESTROY,
    },
    guarded(async ({ spreadsheetId, sheetId }) => batchUpdate(g, spreadsheetId, [{ deleteSheet: { sheetId } }])),
  )

  server.registerTool(
    'spreadsheet_create',
    {
      description: 'Create a new spreadsheet in the signed-in account\'s Drive.',
      inputSchema: { title: z.string(), sheetTitles: z.array(z.string()).optional() },
      annotations: WRITE,
    },
    guarded(async ({ title, sheetTitles }) =>
      g.call('POST', SHEETS, {
        body: {
          properties: { title },
          sheets: sheetTitles?.map((t) => ({ properties: { title: t } })),
        },
      }),
    ),
  )

  server.registerTool(
    'batch_update',
    {
      description:
        'Send raw Sheets API batchUpdate requests (formatting, merges, conditional formats, sorting, protected ranges, anything without its own tool). See developers.google.com/sheets/api/reference/rest/v4/spreadsheets/request.',
      inputSchema: { spreadsheetId: id, requests: z.array(z.record(z.string(), z.any())) },
      annotations: DESTROY,
    },
    guarded(async ({ spreadsheetId, requests }) => batchUpdate(g, spreadsheetId, requests)),
  )

  server.registerTool(
    'drive_file_get',
    {
      description: 'Read a Drive file\'s name, type, link, parents and last change. The sign-in reaches only files it created or was handed, so other files answer 404.',
      inputSchema: { fileId: z.string() },
      annotations: READ,
    },
    guarded(async ({ fileId }) => g.call('GET', `${DRIVE}/${encodeURIComponent(fileId)}${query({ fields: DRIVE_FIELDS, supportsAllDrives: true })}`)),
  )

  server.registerTool(
    'drive_file_upload',
    {
      description:
        'Upload a local file to Drive as a new file, optionally into a folder and optionally converted to a Google Doc, Sheet or Slides. The folder may be one shared with the signed-in account; the sign-in cannot list that folder\'s other files.',
      inputSchema: {
        path: z.string().describe('Absolute path of the local file'),
        folderId: z.string().optional(),
        name: z.string().optional().describe('Name in Drive; defaults to the file name'),
        convertTo: z.enum(['doc', 'sheet', 'slides']).optional(),
      },
      annotations: WRITE,
    },
    guarded(async ({ path, folderId, name, convertTo }) => {
      const { bytes, mime } = localFile(path)
      const metadata: Record<string, unknown> = { name: name ?? basename(path) }
      if (folderId) metadata.parents = [folderId]
      if (convertTo) metadata.mimeType = GOOGLE_TYPE[convertTo]
      const { body, contentType } = multipart(metadata, bytes, mime)
      return g.call('POST', `${DRIVE_UPLOAD}${query({ uploadType: 'multipart', supportsAllDrives: true, fields: DRIVE_FIELDS })}`, {
        rawBody: body,
        contentType,
      })
    }),
  )

  server.registerTool(
    'drive_file_update',
    {
      description:
        'Replace the content of a Drive file this sign-in created, keeping its id and link. A Google Doc, Sheet or Slides file stays a Google file when given a .docx, .xlsx or .pptx. A file locked against edits answers 403 until it is unlocked in Drive.',
      inputSchema: { fileId: z.string(), path: z.string().describe('Absolute path of the local file') },
      annotations: DESTROY,
    },
    guarded(async ({ fileId, path }) => {
      const { bytes, mime } = localFile(path)
      return g.call('PATCH', `${DRIVE_UPLOAD}/${encodeURIComponent(fileId)}${query({ uploadType: 'media', supportsAllDrives: true, fields: DRIVE_FIELDS })}`, {
        rawBody: bytes,
        contentType: mime,
      })
    }),
  )

  server.registerTool(
    'drive_file_export',
    {
      description:
        'Export a Google Doc, Sheet or Slides file this sign-in can reach to a local file, as Google itself renders it (pdf, pptx, docx, xlsx, csv, txt; png gives only the first slide or page). Use the pdf to check how Google laid out a deck or document after upload.',
      inputSchema: {
        fileId: z.string(),
        format: z.enum(['pdf', 'pptx', 'docx', 'xlsx', 'csv', 'txt', 'png']).default('pdf'),
        path: z.string().describe('Absolute path to write; its folder is created if missing. An existing file is replaced'),
      },
      annotations: DESTROY,
    },
    guarded(async ({ fileId, format, path }) => {
      const out = outputPath(path)
      const bytes = await g.bytes(`${DRIVE}/${encodeURIComponent(fileId)}/export${query({ mimeType: EXPORT_TYPE[format] })}`)
      writeFileSync(out, bytes)
      return { path: out, bytes: bytes.length }
    }),
  )

  server.registerTool(
    'slides_thumbnails',
    {
      description:
        'Save one PNG per slide of a Google Slides file, drawn by Google, into a local folder as slide-01.png, slide-02.png… Use after uploading a deck to see each slide as the audience will. Google counts each image as an expensive read (about 60 a minute per user), so pass slides to fetch only the ones that changed. Needs the Google Slides API enabled in the sign-in\'s Cloud project.',
      inputSchema: {
        presentationId: z.string(),
        dir: z.string().describe('Absolute folder to write into; created if missing'),
        slides: z.array(z.number().int().min(1)).optional().describe('1-based slide numbers; all slides when omitted'),
        size: z.enum(['SMALL', 'MEDIUM', 'LARGE']).default('LARGE').describe('Width 200, 800 or 1600 px'),
      },
      annotations: DESTROY,
    },
    guarded(async ({ presentationId, dir, slides, size }) => {
      const pid = encodeURIComponent(presentationId)
      const deck = await g.call('GET', `${SLIDES}/${pid}${query({ fields: 'slides.objectId' })}`)
      const ids: string[] = (deck.slides ?? []).map((s: any) => s.objectId)
      const wanted = slides ?? ids.map((_, i) => i + 1)
      const missing = wanted.filter((n) => n > ids.length)
      if (missing.length) throw new Error(`The deck has ${ids.length} slides; no slide ${missing.join(', ')}`)
      const width = Math.max(2, String(ids.length).length)
      const written: string[] = []
      for (const n of wanted) {
        const thumb = await g.call(
          'GET',
          `${SLIDES}/${pid}/pages/${encodeURIComponent(ids[n - 1]!)}/thumbnail${query({ 'thumbnailProperties.mimeType': 'PNG', 'thumbnailProperties.thumbnailSize': size })}`,
        )
        const out = outputPath(join(dir, `slide-${String(n).padStart(width, '0')}.png`))
        writeFileSync(out, await g.download(thumb.contentUrl))
        written.push(out)
      }
      return { slides: ids.length, written }
    }),
  )
}
