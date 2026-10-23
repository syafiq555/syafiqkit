import { hostClockNow, hostClockSleep, hostCommandRegister, hostUiInvalidate, hostUiToast } from '../core/api.js'
import { VERBS } from '../core/constants.js'
import { messageOf } from '../core/format.js'
import { openPaneWindow, state } from '../core/state.js'
import { discover, measureHeavy, readDocMeta } from '../docs/discovery.js'
import { loadDoc, stopWatch, submitPrompt } from '../docs/reader.js'
import { saveHandoff } from '../handoff/store.js'

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
  state.pick = null
  if (view === 'handoff') state.handoffNext = ''
  if (view !== 'confirm') state.confirm = null
  state.isOpen = true
  hostUiInvalidate($, 'ui.render')
  await hostClockSleep($, 200)
  try {
    state.docs = await discover($)
    state.now = await hostClockNow($)
    await Promise.all([readDocMeta($), measureHeavy($)])
  } catch (error) {
    state.docs = []
    state.error = 'Could not list docs: ' + messageOf(error)
  }
  if (view === 'list' && state.reopen) {
    const fresh = state.docs.find((doc) => doc.path === state.reopen.path)
    state.reopen = null
    if (fresh) await loadDoc($, fresh)
  }
  if (wasOpen) hostUiInvalidate($, 'ui.render')
  else await openPaneWindow($, view)
}

export function verbOf(label) {
  return VERBS.find((item) => item.label === label)
}

export function sendVerb($, label) {
  const verb = verbOf(label)
  return submitPrompt($, verb.text, verb.toast)
}

export function confirmVerb($, label) {
  const verb = verbOf(label)
  state.confirm = { title: verb.label, text: verb.text, effect: verb.effect, offerHandoff: true }
  state.alsoHandoff = false
  state.handoffNext = ''
  return openPane($, 'confirm', true)
}

export async function runHandoff($, next) {
  if (state.saving) {
    hostUiToast($, 'A handoff is already being saved')
    return
  }
  state.saving = true
  hostUiInvalidate($, 'ui.render')
  try {
    const record = await saveHandoff($, next)
    hostUiToast($, 
      'Handoff saved (' + (record.how === 'summary' ? 'summary' : 'digest only') + '). The next session offers it on start or /clear',
    )
  } catch (error) {
    hostUiToast($, 'Handoff failed: ' + messageOf(error).slice(0, 120))
  }
  state.saving = false
  hostUiInvalidate($, 'ui.render')
}

export async function registerCommand($, name, description) {
  try {
    await hostCommandRegister($, { name, description, immediate: true })
  } catch {
    hostUiToast($, '/' + name + ' is taken; use the band button instead')
  }
}
