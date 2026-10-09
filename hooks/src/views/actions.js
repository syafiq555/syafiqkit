const openPane = async ($, view) => {
  stopWatch()
  state.view = view
  state.current = null
  state.error = ''
  state.selected = []
  state.filter = ''
  state.heavyOnly = false
  state.pick = null
  state.handoffFromBand = view === 'handoff'
  if (view === 'handoff') state.handoffNext = ''
  if (view !== 'confirm') state.confirm = null
  state.isOpen = true
  $.ui.invalidate('ui.render')
  await $.clock.sleep(200)
  try {
    state.docs = await discover($)
    state.now = await $.clock.now()
    await Promise.all([readRecentStatuses($), measureHeavy($)])
  } catch (error) {
    state.docs = []
    state.error = 'Could not list docs: ' + messageOf(error)
  }
  if (view === 'list' && state.reopen) {
    const fresh = state.docs.find((doc) => doc.path === state.reopen.path)
    state.reopen = null
    if (fresh) await loadDoc($, fresh)
  }
  try {
    await $.ui.open({ id: PANE, title: 'syafiqkit', focus: true, closeOnEscape: true, columns: 110 })
  } catch (error) {
    state.isOpen = false
    $.ui.invalidate('ui.render')
    throw error
  }
}

const verbOf = (label) => VERBS.find((item) => item.label === label)

const sendVerb = ($, label) => {
  const verb = verbOf(label)
  return submitPrompt($, verb.text, verb.toast)
}

const confirmVerb = ($, label) => {
  const verb = verbOf(label)
  state.confirm = { title: verb.label, text: verb.text, effect: verb.effect, offerHandoff: true }
  state.alsoHandoff = false
  state.handoffNext = ''
  return openPane($, 'confirm')
}

const runHandoff = async ($, next) => {
  if (state.saving) {
    $.ui.toast('A handoff is already being saved')
    return
  }
  state.saving = true
  $.ui.invalidate('ui.render')
  try {
    const record = await saveHandoff($, next)
    $.ui.toast(
      'Handoff saved (' + (record.how === 'summary' ? 'summary' : 'digest only') + '). The next session offers it on start or /clear',
    )
  } catch (error) {
    $.ui.toast('Handoff failed: ' + messageOf(error).slice(0, 120))
  }
  state.saving = false
  $.ui.invalidate('ui.render')
}

const registerCommand = async ($, name, description) => {
  try {
    await $.command.register({ name, description, immediate: true })
  } catch {
    $.ui.toast('/' + name + ' is taken; use the band button instead')
  }
}
