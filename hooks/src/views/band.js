const bandView = ($, e, next) => {
  if (state.disabled || (e.props && e.props.hasSurvey)) return next(e)
  const { Box, Text, Button } = $.ui.resolve(e)
  const desktop = isDesktop(e)
  state.desktop = desktop
  restoreGallery($)
  const paneOpen = state.isOpen
  const key = (letter) => (paneOpen ? {} : { hotkey: letter })
  const rows = [
    Box({
      key: 'launch-row',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 2,
      paddingX: 1,
      children: [
        Text({ color: 'cyan', bold: true, children: '▤ syafiqkit' }),
        Button({ key: 'open-menu', label: 'Menu', ...key('m'), onPress: () => openPane($, 'menu', true) }),
        Button({
          key: 'band-enhance',
          label: 'Enhance',
          ...key('e'),
          ...(state.enhance.phase === 'running' ? { dimColor: true } : {}),
          onPress: () => startEnhance($),
        }),
        Button({
          key: 'open-docs',
          label: state.reopen ? 'Docs ↩' : 'Docs',
          ...key('d'),
          onPress: () => openPane($, 'list', true),
        }),
        Button({
          key: 'open-changes',
          label: state.changeCount ? 'Changes (' + state.changeCount + ')' : 'Changes',
          ...key('g'),
          onPress: () => openChanges($, true),
        }),
        ...(state.images.length
          ? [
              Button({
                key: 'open-images',
                label: 'Images (' + state.images.length + ')',
                ...key('i'),
                onPress: () => openImages($, true),
              }),
            ]
          : []),
        Text({ dimColor: true, children: '│' }),
        Button({ key: 'band-commit', label: 'Commit', ...key('c'), ...(desktop ? { variant: 'primary' } : {}), onPress: () => sendVerb($, 'Commit') }),
        Button({ key: 'band-wrap', label: 'Done', ...key('w'), onPress: () => confirmVerb($, 'Done') }),
        state.saving
          ? Text({ color: 'cyan', children: 'Summarising…' })
          : Button({ key: 'band-handoff', label: 'Hand off', ...key('h'), onPress: () => openPane($, 'handoff', true) }),
        ...(paneOpen ? [Text({ key: 'keys-paused', dimColor: true, children: 'keys go to the pane' })] : []),
      ],
    }),
  ]
  if (paneOpen && state.view === 'doc' && state.selected.length && state.current && state.current.group === 'Task docs') {
    rows.push(
      Box({
        key: 'selected-row',
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 2,
        paddingX: 1,
        children: [
          Text({ color: 'cyan', bold: true, children: '▶ ' + state.selected.length + ' selected' }),
          Button({ key: 'send-band', label: 'Send to Claude', onPress: () => send($) }),
          Text({ dimColor: true, children: 'c clears, in the pane' }),
        ],
      }),
    )
  }
  const enhancing = enhanceRow($, e)
  if (enhancing) rows.push(enhancing)
  const record = state.handoff
  if (record) {
    const when = agoOf(Date.now(), record.createdAt)
    const headline = record.next || goalOf(record) || (record.taskDocPath || '').replace(record.cwd + '/', '') || 'previous session'
    const docMoved = record.taskDocPath && !record.docExists
    rows.push(
      Box({
        key: 'handoff-row',
        flexDirection: 'row',
        columnGap: 2,
        paddingX: 1,
        ...(desktop ? { backgroundColor: DESKTOP_TONE.warnStrip, alignItems: 'center' } : {}),
        children: [
          Text({ color: 'yellow', bold: true, children: '↪ Handoff ' + when }),
          Text({ wrap: 'truncate-end', children: clip(headline, 60) }),
          ...(record.sessionGoal && record.sessionGoal !== headline
            ? [Text({ dimColor: true, wrap: 'truncate-end', children: 'from: ' + clip(record.sessionGoal, 50) })]
            : []),
          ...(docMoved ? [Text({ dimColor: true, children: '(doc moved)' })] : []),
          ...(state.olderCount ? [Text({ dimColor: true, children: '+' + state.olderCount + ' older' })] : []),
          Button({
            key: 'resume',
            label: 'Resume',
            ...(desktop ? { variant: 'primary' } : {}),
            onPress: async () => {
              const text = resumeText(record, await gitState($))
              if (RISKY.test(text)) {
                state.confirm = {
                  title: 'Resume handoff',
                  text,
                  effect: 'Starts work from a saved handoff and claims it, so other sessions are not offered it.',
                  record,
                }
                return openPane($, 'confirm', true)
              }
              return claimAndSend($, record, text)
            },
          }),
          Button({ key: 'dismiss', label: 'Dismiss', onPress: () => dismissHandoff($, record) }),
        ],
      }),
    )
  }
  return Box({ flexDirection: 'column', children: rows })
}
