const readDecision = async ($, file) => {
  try {
    return shape(await $.fs.read(file.path))
  } catch {
    return '_Could not read this file._'
  }
}

const stopWatch = () => {
  const timer = state.stop
  state.stop = null
  if (timer && typeof timer.cancel === 'function') timer.cancel()
}

const refresh = async ($) => {
  if (state.view !== 'doc' || !state.current) return
  const path = state.current.path
  try {
    const raw = await $.fs.read(path)
    if (!state.current || state.current.path !== path) return
    const recovered = state.error !== ''
    if (raw === state.raw && !recovered) return
    state.error = ''
    if (raw !== state.raw) {
      state.raw = raw
      state.text = shape(raw)
      state.status = statusLineOf(raw)
      const stamp = new Date(await $.clock.now()).toLocaleTimeString()
      if (!state.current || state.current.path !== path) return
      state.changedAt = stamp
      const stillOpen = segments(state.text)
        .filter((part) => part.kind === 'item' && !part.done)
        .map((part) => part.text)
      state.selected = state.selected.filter((item) => stillOpen.includes(item))
      wantDiagrams($, state.text)
    }
    $.ui.invalidate('ui.render')
  } catch {
    if (state.current && state.current.path === path) {
      state.error = 'Could not re-read ' + path
      $.ui.invalidate('ui.render')
    }
  }
}

const watch = ($) => {
  stopWatch()
  state.stop = $.clock.every(POLL_MS, () => refresh($))
}

const requestFor = (path, selected) => {
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

const resetPane = () => {
  stopWatch()
  state.view = 'list'
  state.selected = []
  state.confirm = null
  state.alsoHandoff = false
  state.handoffFromBand = false
}

const closePane = async ($) => {
  resetPane()
  try {
    await $.ui.close({ id: PANE })
  } catch {}
  state.isOpen = false
  $.ui.invalidate('ui.render')
}

const submitPrompt = async ($, text, note, onFail, handoffAfter) => {
  await closePane($)
  $.ui.toast(note)
  const request = $.prompt.submit({ text })
  if (handoffAfter) state.pendingHandoff = handoffAfter
  request.catch(async (error) => {
    $.ui.toast('Send failed: ' + messageOf(error).slice(0, 100))
    if (handoffAfter) state.pendingHandoff = null
    if (onFail) await onFail()
  })
}

const loadDoc = async ($, doc) => {
  try {
    state.raw = await $.fs.read(doc.path)
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

const send = async ($) => {
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
