import { hostClockEvery, hostEnvGet, hostUiInvalidate, hostUiToast } from './core/api.js'
import { CHANGES_COMMAND, CHANGES_POLL_MS, COMMAND, EDIT_TOOLS, HANDOFF_POLL_MS, MAX_HANDOFF_DEFERRALS, MENU_COMMAND, PANE, SHOW_IMAGE_TOOL, STICKY_AFTER, TOP_BUTTON_AFTER } from './core/constants.js'
import { messageOf } from './core/format.js'
import { modLog } from './core/log.js'
import { loadVersion, redrawBandAfterClose, state } from './core/state.js'
import { registerImageTool, showImages } from './docs/gallery.js'
import { refresh, resetPane } from './docs/reader.js'
import { countChanges, openChanges } from './git/controller.js'
import { loadHandoff } from './handoff/store.js'
import { dropEnhanceOnEdit, enhanceOwnsSubmit, redrawBand, resetEnhance } from './prompt/enhance.js'
import { openPane, registerCommand, runHandoff } from './views/actions.js'
import { answerPicturesPrompt, answerPicturesView, loadAnswerPictures } from './answers/pictures.js'
import { bandView } from './views/band.js'
import { paneView } from './views/pane.js'

export function register(on) {
  on('session.start', async ($, e, next) => {
    let off = ''
    try {
      off = (await hostEnvGet($, 'SYAFIQKIT_MOD')) || ''
    } catch {
      off = ''
    }
    if (off === '0') {
      state.disabled = true
      return next(e)
    }
    await registerCommand($, COMMAND, 'Browse task docs, CLAUDE.md files and project docs')
    await registerCommand($, MENU_COMMAND, 'Open the syafiqkit menu: commit, ship, done, docs, hand off')
    await registerCommand($, CHANGES_COMMAND, 'Review changed files, stage, unstage or discard them')
    await registerImageTool($)
    await loadVersion($)
    await loadAnswerPictures($)
    await loadHandoff($)
    hostClockEvery($, HANDOFF_POLL_MS, () => loadHandoff($))
    hostClockEvery($, CHANGES_POLL_MS, () => countChanges($).catch(() => {}))
    countChanges($).catch(() => {})
    return next(e)
  })

  on('classic.SessionStart', async ($, e, next) => {
    if (state.disabled) return next(e)
    if (e.source === 'clear' || e.source === 'resume' || e.source === 'fork') {
      state.ownHandoff = ''
      state.dismissed = ''
      state.lastDoc = null
      state.reopen = null
      state.pendingHandoff = null
      state.confirm = null
      state.alsoHandoff = false
    }
    await loadHandoff($)
    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($) => {
    await openPane($, 'list')
    return {}
  })

  on('command.run', { command: MENU_COMMAND }, async ($) => {
    await openPane($, 'menu')
    return {}
  })

  on('command.run', { command: CHANGES_COMMAND }, async ($) => {
    await openChanges($)
    return {}
  })

  on('tool.call', { tool: SHOW_IMAGE_TOOL }, async ($, e) => ({ result: await showImages($, e) }))

  on('ui.render', { component: 'AbovePrompt' }, bandView)

  on('ui.render', { component: 'AssistantMessage' }, answerPicturesView)

  on('prompt.compose', answerPicturesPrompt)

  on('prompt.edit', ($, e, next) => {
    dropEnhanceOnEdit($)
    return next(e)
  })

  on('prompt.submit', ($, e, next) => {
    if (enhanceOwnsSubmit(e.text)) {
      if (state.enhance.abort) state.enhance.abort.abort()
      resetEnhance()
      redrawBand($)
    }
    return next(e)
  })

  on('turn.start', (_$, e, next) => {
    if (state.pendingHandoff && !e.agentId) state.pendingHandoff.armed = true
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const ran = await next(e)
    if (state.pendingHandoff && state.pendingHandoff.armed && !e.agentId) {
      const answer = typeof e.answer === 'string' ? e.answer.trim() : ''
      const asking = !e.isAborted && (!answer || answer.endsWith('?'))
      if (asking && (state.pendingHandoff.deferred || 0) < MAX_HANDOFF_DEFERRALS) {
        state.pendingHandoff.armed = false
        state.pendingHandoff.deferred = (state.pendingHandoff.deferred || 0) + 1
        hostUiToast($, 'Handoff saves after your reply')
        return ran
      }
      const note = state.pendingHandoff.next
      state.pendingHandoff = null
      runHandoff($, note)
    }
    return ran
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (state.view === 'doc' && state.current && EDIT_TOOLS.has(e.tool) && e.file_path === state.current.path) {
      await refresh($)
    }
    return ran
  })

  on('ui.close', async ($, e, next) => {
    const mine = e.id === PANE || e.requestId === PANE
    if (mine) modLog($, 'close (' + e.surface + '): ' + (e.origin && e.origin.kind) + ' asked to close')
    let closed
    try {
      closed = await next(e)
    } catch (error) {
      if (mine) modLog($, 'close (' + e.surface + '): host refused: ' + messageOf(error).slice(0, 200))
      throw error
    }
    if (mine) {
      state.isOpen = false
      resetPane()
      redrawBandAfterClose($)
    }
    return closed
  })

  on('ui.render', { component: 'Pane' }, paneView)

  on('ui.fault', ($, e, next) => {
    modLog($, 'fault ' + e.component + ' ' + e.phase + ' (' + e.surface + '): ' + String(e.reason).slice(0, 300))
    return next(e)
  })

  on('ui.scroll', { component: 'Pane' }, ($, e, next) => {
    if (e.requestId !== PANE || !state.isOpen) return next(e)
    state.allScroll = { view: state.view, offset: e.offset, body: e.bodyRows }
    const ran = next(e)
    if (state.topShown || state.stickyShown || e.offset > TOP_BUTTON_AFTER || (state.desktop && e.offset >= STICKY_AFTER) || Math.abs(e.offset - state.windowAt) > e.bodyRows / 3) hostUiInvalidate($, 'ui.render')
    return ran
  })
}
