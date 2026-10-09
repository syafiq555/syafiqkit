const paneView = async ($, e, next) => {
  if (e.requestId !== PANE) return next(e)
  const c = paneContext($, e)
  if (state.view === 'menu') return menuView($, c)
  if (state.view === 'confirm') return confirmView($, c)
  if (state.view === 'handoff') return handoffView($, c)
  if (state.view === 'decision' && state.current) return decisionView($, c)
  if (state.view === 'doc' && state.current) return docView($, c)
  return listView(c)
}
