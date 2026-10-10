export function register(on) {
  on('session.start', async ($, e, next) => {
    let off = ''
    try {
      off = (await $.env.get('SYAFIQKIT_MOD')) || ''
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
    await loadHandoff($)
    $.clock.every(HANDOFF_POLL_MS, () => loadHandoff($))
    $.clock.every(CHANGES_POLL_MS, () => countChanges($).catch(() => {}))
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

  on('turn.start', (_$, e, next) => {
    if (state.pendingHandoff && !e.agentId) state.pendingHandoff.armed = true
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const ran = await next(e)
    if (state.pendingHandoff && state.pendingHandoff.armed && !e.agentId) {
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

  on('ui.close', ($, e, next) => {
    if (e.id === PANE || e.requestId === PANE) {
      resetPane()
      state.isOpen = false
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane' }, paneView)
}
