import { hostClockNow, hostClockSleep, hostCommandRegister, hostUiInvalidate, hostUiToast } from '../core/api.js'
import { META_REDRAW_EVERY, VERBS } from '../core/constants.js'
import { messageOf } from '../core/format.js'
import { modLog } from '../core/log.js'
import { invalidatePane, openPaneWindow, state } from '../core/state.js'
import { applyCachedMeta, discover, fillDocMeta } from '../docs/discovery.js'
import { loadDoc, stopWatch, submitPrompt } from '../docs/reader.js'

export async function openPane($, view, fromBand = false) {
  const wasOpen = fromBand && state.isOpen
  if (wasOpen && state.view === view && view !== 'confirm') return
  stopWatch()
  state.view = view
  state.current = null
  state.docBack = null
  state.error = ''
  state.selected = []
  state.filter = ''
  state.heavyOnly = false
  if (view !== 'confirm') state.confirm = null
  state.isOpen = true
  const run = (state.docsRun || 0) + 1
  state.docsRun = run
  state.docsLoading = { done: 0, total: 0, listing: true }
  try {
    hostUiInvalidate($, 'ui.render')
    await hostClockSleep($, 200)
    if (!wasOpen) await openPaneWindow($, view)
    await loadDocs($, view, run)
  } finally {
    if (state.docsRun === run && state.docsLoading) {
      state.docsLoading = null
      invalidatePane($)
    }
  }
}

export async function loadDocs($, view, run) {
  const stale = () => state.docsRun !== run
  const started = await hostClockNow($)
  let docs = null
  try {
    docs = await discover($)
  } catch (error) {
    if (stale()) return
    state.docs = []
    state.error = 'Could not list docs: ' + messageOf(error)
    return
  }
  if (stale()) return
  state.docs = docs
  state.docsFrom = docs.from
  state.now = await hostClockNow($)
  if (stale()) return
  const listedAt = state.now
  applyCachedMeta(docs)
  state.docsLoading = { done: 0, total: 0, listing: false }
  if (view === 'list' && state.reopen) {
    const fresh = docs.find((doc) => doc.path === state.reopen.path)
    state.reopen = null
    if (fresh) await loadDoc($, fresh)
    if (stale()) return
  }
  invalidatePane($)
  let drawnAt = 0
  const tally = await fillDocMeta($, docs, state.now, stale, (done, total) => {
    if (stale()) return
    state.docsLoading = { done, total, listing: false }
    if (done - drawnAt >= META_REDRAW_EVERY) {
      drawnAt = done
      invalidatePane($)
    }
  })
  if (stale()) return
  state.docsLoading = null
  invalidatePane($)
  const finished = await hostClockNow($)
  modLog($, 'docs listed: ' + docs.length + ' docs, discover ' + (listedAt - started) + 'ms, meta ' + (finished - listedAt) + 'ms (' + tally.read + ' read, ' + tally.cached + ' cached)')
}

export function verbOf(label) {
  return VERBS.find((item) => item.label === label)
}

export function sendVerb($, label) {
  const verb = verbOf(label)
  return submitPrompt($, verb.text, verb.toast)
}

const BACKABLE_VIEWS = ['changes', 'change-file', 'change-all', 'images']

function confirmBack() {
  if (!state.isOpen) return { back: 'close' }
  if ((state.view === 'doc' || state.view === 'decision') && state.current) return { back: state.view, backDoc: state.current, docBack: state.docBack, decisionOpen: state.decisionOpen }
  return { back: BACKABLE_VIEWS.includes(state.view) ? state.view : 'list' }
}

export function confirmVerb($, label) {
  const verb = verbOf(label)
  state.confirm = { title: verb.label, text: verb.text, effect: verb.effect, ...confirmBack() }
  return openPane($, 'confirm', true)
}

export async function registerCommand($, name, description) {
  try {
    await hostCommandRegister($, { name, description, immediate: true })
  } catch {
    hostUiToast($, '/' + name + ' is taken; use the band button instead')
  }
}
