const bandView = ($, e, next) => {
  if (state.disabled) return next(e)
  const { Box, Text, Button } = $.ui.resolve(e)
  if (state.isOpen) {
    if (state.view !== 'doc' || !state.selected.length || !state.current || state.current.group !== 'Task docs') return next(e)
    return Box({
      flexDirection: 'row',
      columnGap: 2,
      paddingX: 1,
      children: [
        Text({ color: 'cyan', bold: true, children: '▶ ' + state.selected.length + ' selected' }),
        Button({ key: 'send-band', label: 'Send to Claude', onPress: () => send($) }),
        Text({ dimColor: true, children: 'c clears, in the pane' }),
      ],
    })
  }
  const rows = [
    Box({
      key: 'launch-row',
      flexDirection: 'row',
      columnGap: 2,
      paddingX: 1,
      children: [
        Text({ color: 'cyan', bold: true, children: '▤ syafiqkit' }),
        Button({ key: 'open-menu', label: 'Menu', hotkey: 'm', onPress: () => openPane($, 'menu') }),
        Button({
          key: 'open-docs',
          label: state.reopen ? 'Docs ↩' : 'Docs',
          hotkey: 'd',
          onPress: () => openPane($, 'list'),
        }),
        Button({
          key: 'open-changes',
          label: state.changeCount ? 'Changes (' + state.changeCount + ')' : 'Changes',
          hotkey: 'g',
          onPress: () => openChanges($),
        }),
        ...(state.images.length
          ? [
              Button({
                key: 'open-images',
                label: 'Images (' + state.images.length + ')',
                hotkey: 'i',
                onPress: () => openImages($),
              }),
            ]
          : []),
        Text({ dimColor: true, children: '│' }),
        Button({ key: 'band-commit', label: 'Commit', hotkey: 'c', onPress: () => sendVerb($, 'Commit') }),
        Button({ key: 'band-wrap', label: 'Done', hotkey: 'w', onPress: () => confirmVerb($, 'Done') }),
        state.saving
          ? Text({ color: 'cyan', children: 'Summarising…' })
          : Button({ key: 'band-handoff', label: 'Hand off', hotkey: 'h', onPress: () => openPane($, 'handoff') }),
      ],
    }),
  ]
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
            onPress: async () => {
              const text = resumeText(record, await gitState($))
              if (RISKY.test(text)) {
                state.confirm = {
                  title: 'Resume handoff',
                  text,
                  effect: 'Starts work from a saved handoff and claims it, so other sessions are not offered it.',
                  record,
                }
                return openPane($, 'confirm')
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
