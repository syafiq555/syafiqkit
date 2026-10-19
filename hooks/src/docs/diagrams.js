import { hostFsRead, hostFsWrite, hostProcessRun } from '../core/api.js'
import { MAX_BASE64, MERMAID_PACKAGE, MERMAID_TIMEOUT_MS } from '../core/constants.js'
import { homeOf, lockDown, messageOf } from '../core/format.js'
import { bumpPictures, invalidatePane, state } from '../core/state.js'
import { safeExists } from './discovery.js'
import { hashOf, pngSize } from './images.js'
import { segments } from './markdown.js'
import { enqueue, newQueue, readLook } from './typeset.js'

const queue = newQueue()

async function convert($, job) {
  try {
    const home = await homeOf($)
    if (!home) throw new Error('no home folder for the picture cache')
    const dir = home + '/.claude/doc-pane-cache'
    const { mode } = await readLook($)
    const dark = mode === 'dark'
    const name = dir + '/' + job.key + (dark ? '-dark' : '')
    const mmd = name + '.mmd'
    const png = name + '.png'
    const rendered = name + '.ok'
    if (!(await safeExists($, rendered))) {
      await hostFsWrite($, mmd, job.source)
      await lockDown($, dir, '700')
      const ran = await hostProcessRun($,
        ['npx', '--yes', MERMAID_PACKAGE, '-i', mmd, '-o', png, '-s', '2', '-t', dark ? 'dark' : 'default', '-b', dark ? 'transparent' : 'white'],
        { cwd: dir, timeoutMs: MERMAID_TIMEOUT_MS },
      )
      if (ran.exitCode !== 0) throw new Error((ran.stderr || ran.stdout || 'mermaid-cli failed').slice(-300))
      await hostFsWrite($, rendered, 'ok')
    }
    const { base64 } = await hostFsRead($, png, { as: 'bytes' })
    if (!base64) throw new Error('could not read the rendered picture')
    if (base64.length > MAX_BASE64) throw new Error('rendered picture is over 2 MiB')
    state.diagrams[job.key] = { status: 'ready', png: base64, size: pngSize(base64) }
  } catch (error) {
    state.diagrams[job.key] = { status: 'error', message: messageOf(error).slice(0, 300) }
  }
}

async function pump($) {
  if (queue.busy) return
  queue.busy = true
  try {
    while (queue.jobs.length) {
      await convert($, queue.jobs.shift())
      invalidatePane($)
      bumpPictures($)
    }
  } finally {
    queue.busy = false
  }
}

export function wantDiagrams($, text) {
  for (const part of segments(text)) {
    if (part.kind !== 'mermaid') continue
    const key = hashOf(part.source)
    enqueue(queue, state.diagrams, key, { key, source: part.source })
  }
  pump($)
}
