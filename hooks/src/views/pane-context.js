import { hostUiResolve } from '../core/api.js'
import { refreshRequest, shrinkRequest } from '../core/format.js'
import { invalidatePane, state } from '../core/state.js'
import { loadDoc, readDecision, submitPrompt } from '../docs/reader.js'

export function paneContext($, e) {
  const atoms = hostUiResolve($, e)
  const redraw = () => invalidatePane($)

  const goto = (view) => {
    state.view = view
    state.allScroll = { view: '', offset: 0, body: state.allScroll.body }
    redraw()
  }

  const open = async (doc) => {
    state.docBack = null
    await loadDoc($, doc)
    redraw()
  }

  const openDecision = async (index) => {
    const file = state.current ? (state.current.decisions || [])[index] : null
    if (!file) return
    state.decisionOpen = file.path
    state.view = 'decision'
    redraw()
    if (state.decisionTexts[file.path] === undefined) {
      state.decisionTexts[file.path] = await readDecision($, file)
      redraw()
    }
  }

  const askFirst = (title, text, effect) => {
    state.confirm = { title, text, effect }
    goto('confirm')
  }

  const sendNow = (title, text, reopen) => {
    if (reopen) state.reopen = reopen
    return submitPrompt($, text, 'Sent: ' + title.toLowerCase())
  }

  const pickAction = (doc) => {
    if (state.pick === 'refresh') return sendNow('Refresh ' + doc.label, refreshRequest(doc))
    if (state.pick === 'shrink') return sendNow('Shrink ' + doc.label, shrinkRequest(doc))
    return open(doc)
  }

  const bindField = (field) => (value) => {
    state[field] = value
    redraw()
  }

  return { e, ...atoms, redraw, goto, open, openDecision, askFirst, sendNow, pickAction, bindField }
}
