import { hostClockEvery, hostClockNow, hostFsRead, hostPromptSubmit, hostUiClose, hostUiToast } from '../core/api.js'
import { PANE, POLL_MS } from '../core/constants.js'
import { messageOf, statusLineOf } from '../core/format.js'
import { modLog } from '../core/log.js'
import { invalidatePane, redrawBandAfterClose, state } from '../core/state.js'
import { noteSubmit, noteSubmitFailed } from '../git/wrapup.js'
import { wantDiagrams } from './diagrams.js'
import { segments, shape } from './markdown.js'

export async function readDecision($, file) {
  try {
    return shape(await hostFsRead($, file.path))
  } catch {
    return '_Could not read this file._'
  }
}

export function stopWatch() {
  const timer = state.stop
  state.stop = null
  if (timer && typeof timer.cancel === 'function') timer.cancel()
}

export async function refresh($) {
  if (state.view !== 'doc' || !state.current) return
  const path = state.current.path
  try {
    const raw = await hostFsRead($, path)
    if (!state.current || state.current.path !== path) return
    const recovered = state.error !== ''
    if (raw === state.raw && !recovered) return
    state.error = ''
    if (raw !== state.raw) {
      state.raw = raw
      state.text = shape(raw)
      state.status = statusLineOf(raw)
      const stamp = new Date(await hostClockNow($)).toLocaleTimeString()
      if (!state.current || state.current.path !== path) return
      state.changedAt = stamp
      const stillOpen = segments(state.text)
        .filter((part) => part.kind === 'item' && !part.done)
        .map((part) => part.text)
      state.selected = state.selected.filter((item) => stillOpen.includes(item))
      wantDiagrams($, state.text)
    }
    invalidatePane($)
  } catch {
    if (state.current && state.current.path === path) {
      state.error = 'Could not re-read ' + path
      invalidatePane($)
    }
  }
}

export function watch($) {
  stopWatch()
  state.stop = hostClockEvery($, POLL_MS, () => refresh($))
}

export function requestFor(path, selected) {
  const first = 'Run /syafiqkit:read-summary on ' + path + ' first (the read-summary skill), '
  if (!selected.length) {
    return first + 'then tell me which items in it are buildable now and which are blocked.'
  }
  if (selected.length === 1) {
    return first + 'then proceed with this item from it: "' + selected[0] + '"'
  }
  const list = selected.map((item, index) => index + 1 + '. ' + item).join('\n')
  return first + 'then proceed with these ' + selected.length + ' items from it, in this order:\n' + list
}

export function resetPane() {
  stopWatch()
  state.view = 'list'
  state.selected = []
  state.confirm = null
  state.diffGen += 1
  state.allScroll = { view: '', offset: 0, body: state.allScroll.body }
}

export async function closePane($) {
  try {
    await hostUiClose($, { id: PANE })
  } catch (error) {
    modLog($, 'close: ' + messageOf(error).slice(0, 200))
  }
  state.isOpen = false
  resetPane()
  redrawBandAfterClose($)
}

export async function submitPrompt($, text, note) {
  await closePane($)
  hostUiToast($, note)
  noteSubmit($, text)
  const request = hostPromptSubmit($, { text })
  request.catch((error) => {
    hostUiToast($, 'Send failed: ' + messageOf(error).slice(0, 100))
    noteSubmitFailed($, text)
  })
}

export async function loadDoc($, doc) {
  try {
    state.raw = await hostFsRead($, doc.path)
    state.text = shape(state.raw)
    state.status = statusLineOf(state.raw)
    state.error = ''
  } catch {
    state.raw = ''
    state.text = ''
    state.status = ''
    state.error = 'Could not read ' + doc.path
  }
  state.current = doc
  state.lastDoc = doc
  state.view = 'doc'
  state.selected = []
  state.showDone = false
  state.showDecisions = false
  state.decisionOpen = ''
  state.decisionTexts = {}
  state.changedAt = ''
  wantDiagrams($, state.text)
  watch($)
}

export async function send($) {
  if (!state.current || state.current.group !== 'Task docs') return
  state.reopen = state.current
  const count = state.selected.length
  const text = requestFor(state.current.path, state.selected)
  await submitPrompt(
    $,
    text,
    count ? 'Sent ' + count + (count === 1 ? ' item' : ' items') + ' to Claude' : 'Sent the read-summary request to Claude',
  )
}
