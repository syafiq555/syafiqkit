import { hostConfigList, hostFsRead, hostFsWrite, hostPluginRoot, hostProcessRun } from '../core/api.js'
import { TYPESET_CHUNK_LINES, TYPESET_RENDER_VERSION, TYPESET_PT_PER_COLUMN, TYPESET_TIMEOUT_MS, TYPST_CANDIDATES } from '../core/constants.js'
import { homeOf, lockDown, messageOf, parentOf } from '../core/format.js'
import { bumpPictures, invalidatePane, state } from '../core/state.js'
import { safeExists } from './discovery.js'
import { hashOf, pngSize } from './images.js'

const CELL_SH = `perl -e 'open(T, "</dev/tty") or exit 1; my $w = " " x 8; ioctl(T, ($^O eq "darwin" ? 0x40087468 : 0x5413), $w) or exit 1; print join(" ", unpack("S4", $w))'`

const typesetQueue = newQueue()

export function newQueue() {
  return { jobs: [], busy: false }
}

export function enqueue(queue, entries, key, job) {
  if (entries[key]) return
  entries[key] = { status: 'rendering' }
  queue.jobs.push(typeof job === 'function' ? job() : job)
}

let typstLookup = null

function findTypst($) {
  if (state.typst !== null) return Promise.resolve(state.typst)
  if (!typstLookup) typstLookup = lookUpTypst($)
  return typstLookup
}

async function lookUpTypst($) {
  for (const candidate of TYPST_CANDIDATES) {
    try {
      const ran = await hostProcessRun($, [candidate, '--version'], { timeoutMs: 5000 })
      if (ran.exitCode === 0) {
        state.typst = candidate
        return candidate
      }
    } catch {}
  }
  state.typst = ''
  invalidatePane($)
  return ''
}

export async function readLook($) {
  if (state.look) return state.look
  let mode = 'dark'
  try {
    const rows = await hostConfigList($)
    const theme = rows.find((row) => row.key === 'theme')
    if (theme && typeof theme.value === 'string' && theme.value.startsWith('light')) mode = 'light'
  } catch {}
  let cell = { width: 14, height: 28 }
  try {
    const ran = await hostProcessRun($, ['sh', '-c', CELL_SH], { timeoutMs: 3000 })
    const [rows, columns, xpixel, ypixel] = String(ran.stdout || '').trim().split(/\s+/).map(Number)
    if (ran.exitCode === 0 && rows && columns && xpixel && ypixel) cell = { width: xpixel / columns, height: ypixel / rows }
  } catch {}
  state.look = { mode, cell }
  return state.look
}

function hasContent(rows) {
  return rows.some((row) => row.trim() !== '' && !/^\s*([-*_]\s*){3,}$/.test(row))
}

function typesetChunks(text) {
  const lines = text.split('\n')
  const chunks = []
  let current = []
  let fenced = false
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced
    const atBreak = !fenced && line.trim() === '' && current.length >= TYPESET_CHUNK_LINES
    const atHeading = !fenced && /^#{1,3} /.test(line) && hasContent(current)
    if (atBreak || atHeading) {
      if (hasContent(current)) chunks.push(current.join('\n'))
      current = atBreak ? [] : [line]
      continue
    }
    current.push(line)
  }
  if (hasContent(current)) chunks.push(current.join('\n'))
  return chunks
}

export function typesetKeyOf(text, columns, look) {
  return hashOf([TYPESET_RENDER_VERSION, text, columns, look.mode, look.cell.width, look.cell.height].join('\u0000'))
}

export function typesetSize(page, columns, cell) {
  if (!page.size || !page.size.width || !page.size.height) return { columns, rows: 10 }
  const rows = Math.ceil((page.size.height * columns * cell.width) / (page.size.width * cell.height))
  if (rows <= 255) return { columns, rows: Math.max(1, rows) }
  return { columns: Math.max(10, Math.floor((columns * 255) / rows)), rows: 255 }
}

async function compileTypeset($, job) {
  try {
    const home = await homeOf($)
    if (!home) throw new Error('no home folder for the picture cache')
    const dir = home + '/.claude/doc-pane-cache/typeset'
    const done = dir + '/' + job.key + '.ok'
    const outOf = (page) => dir + '/' + job.key + '-' + page + '.png'
    if (!(await safeExists($, done))) {
      const render = hostPluginRoot($) + '/hooks/render'
      const docJson = dir + '/' + job.key + '.json'
      await hostFsWrite($, docJson, JSON.stringify({ base: job.base, segments: job.chunks }))
      await lockDown($, dir, '700')
      const compile = (safe) =>
        hostProcessRun(
          $,
          [
            job.typst, 'compile',
            '--root', '/',
            '--package-path', render + '/packages',
            '--format', 'png',
            '--ppi', String(Math.round((72 * job.cell.width) / TYPESET_PT_PER_COLUMN)),
            '--input', 'theme=' + job.mode,
            '--input', 'theme-dir=' + render + '/themes/claude-code',
            '--input', 'doc=' + docJson,
            '--input', 'width=' + String(job.columns * TYPESET_PT_PER_COLUMN),
            ...(safe ? ['--input', 'safe=1'] : []),
            render + '/md.typ',
            dir + '/' + job.key + '-{p}.png',
          ],
          { cwd: dir, timeoutMs: TYPESET_TIMEOUT_MS },
        )
      let ran = await compile(false)
      if (ran.exitCode !== 0) ran = await compile(true)
      if (ran.exitCode !== 0) throw new Error(String(ran.stderr || ran.stdout || 'typst failed').replace(/warning: unknown font[^\n]*\n/g, '').slice(0, 300))
      await hostFsWrite($, done, String(job.chunks.length))
    }
    const pages = []
    for (let page = 1; page <= job.chunks.length; page += 1) {
      const { base64 } = await hostFsRead($, outOf(page), { as: 'bytes' })
      if (!base64) throw new Error('could not read page ' + page)
      pages.push({ file: outOf(page), size: pngSize(base64) })
    }
    state.typeset[job.key] = { status: 'ready', pages }
  } catch (error) {
    state.typeset[job.key] = { status: 'error', message: messageOf(error).slice(0, 300) }
  }
}

async function pumpTypeset($) {
  if (typesetQueue.busy) return
  typesetQueue.busy = true
  try {
    while (typesetQueue.jobs.length) {
      await compileTypeset($, typesetQueue.jobs.shift())
      invalidatePane($)
      bumpPictures($)
    }
  } finally {
    typesetQueue.busy = false
  }
}

export async function wantTypeset($, texts, columns, docPath) {
  const typst = await findTypst($)
  if (!typst) return
  const look = await readLook($)
  for (const text of texts) {
    const key = typesetKeyOf(text, columns, look)
    enqueue(typesetQueue, state.typeset, key, () => ({ key, typst, chunks: typesetChunks(text), columns, mode: look.mode, cell: look.cell, base: parentOf(docPath) }))
  }
  pumpTypeset($)
}
