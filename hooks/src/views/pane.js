const paneView = async ($, e, next) => {
  if (e.requestId !== PANE) return next(e)
  const c = paneContext($, e)
  state.desktop = isDesktop(e)
  const tree = await paneTree($, c)
  const size = drawingSize(tree)
  if (state.desktop && size > DESKTOP_DRAW_LIMIT) {
    modLog($, 'pane ' + state.view + ' (desktop): about ' + Math.round(size / 10000) * 10 + 'k characters, may be too big for Desktop to draw')
  }
  const problem = treeProblem(tree)
  if (!problem) return tree
  modLog($, 'pane ' + state.view + ' (' + e.surface + '): ' + problem)
  return state.desktop ? refusedView($, c, problem) : tree
}

const refusedView = ($, c, problem) =>
  c.Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [
      pageBar(c, {
        back: { key: 'draw-close', label: '< Close', hotkey: 'b', onPress: () => closePane($) },
        actions: CHANGE_VIEWS.has(state.view) && state.view !== 'changes' ? [{ key: 'draw-changes', label: 'Changes', onPress: () => c.goto('changes') }] : [],
      }),
      c.Text({ key: 'draw-refused', bold: true, children: 'This page could not be drawn here' }),
      c.Text({ key: 'draw-why', dimColor: true, children: 'Why: ' + problem + '.' }),
      c.Text({ key: 'draw-log', dimColor: true, children: 'Written to ~/.claude/doc-pane-cache/' + MOD_LOG_FILE + ' for debugging.' }),
    ],
  })

const paneTree = async ($, c) => {
  const e = c.e
  if (state.view === 'menu') return menuView($, c)
  if (state.view === 'confirm') return confirmView($, c)
  if (state.view === 'handoff') return handoffView($, c)
  if (state.view === 'images') return imagesView($, c)
  if (state.view === 'changes' && isDesktop(e)) return desktopChangesView($, c)
  if (state.view === 'change-file' && isDesktop(e)) return desktopChangeFileView($, c)
  if (state.view === 'change-all' && isDesktop(e)) return desktopChangeAllView($, c)
  if (state.view === 'changes') return changesView($, c)
  if (state.view === 'change-file') return changeFileView($, c)
  if (state.view === 'change-all') return changeAllView($, c)
  if (state.view === 'discard') return discardView($, c)
  if (state.view === 'decision' && state.current) return decisionView($, c)
  if (state.view === 'doc' && state.current) return docView($, c)
  return listView(c)
}
