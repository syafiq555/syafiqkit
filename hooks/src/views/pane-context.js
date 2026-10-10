const paneContext = ($, e) => {
  const atoms = $.ui.resolve(e)
  const redraw = () => $.ui.invalidate('ui.render')

  const goto = (view) => {
    state.view = view
    redraw()
  }

  const open = async (doc) => {
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

  const askFirst = (title, text, effect, offerHandoff, reopen) => {
    state.confirm = { title, text, effect, offerHandoff: Boolean(offerHandoff), back: state.view, reopen: reopen || null }
    state.alsoHandoff = false
    state.handoffNext = ''
    goto('confirm')
  }

  const pickAction = (doc) => {
    if (state.pick === 'refresh') return askFirst('Refresh ' + doc.label, refreshRequest(doc), REFRESH_EFFECT)
    if (state.pick === 'shrink') return askFirst('Shrink ' + doc.label, shrinkRequest(doc), SHRINK_EFFECT)
    return open(doc)
  }

  const openHandoff = () => {
    state.handoffNext = ''
    goto('handoff')
  }

  const saveFromForm = async (message) => {
    await runHandoff($, message.trim())
    if (state.handoffFromBand) return closePane($)
    return goto('menu')
  }

  const bindField = (field) => (value) => {
    state[field] = value
    redraw()
  }

  return { e, ...atoms, redraw, goto, open, openDecision, askFirst, pickAction, openHandoff, saveFromForm, bindField }
}
