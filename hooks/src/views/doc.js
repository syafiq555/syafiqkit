const docView = ($, c) => {
  const { e, Box, Text, Button, Markdown, Image, goto, redraw, askFirst, openHandoff, openDecision } = c
  const parts = segments(state.text)
  const openItems = parts.filter((part) => part.kind === 'item' && !part.done)
  const doneItems = parts.filter((part) => part.kind === 'item' && part.done)
  const sourceOf = (source, key) => Markdown({ key, text: '```mermaid\n' + source + '\n```' })

  const pickable = (part, key) => {
    const rank = state.selected.indexOf(part.text) + 1
    const picked = rank > 0
    return Button({
      key,
      label: (picked ? '▶' + rank + ' ' : '   ') + '[ ] ' + part.text,
      plain: true,
      dimColor: !picked && state.selected.length > 0,
      onPress: () => {
        state.selected = picked
          ? state.selected.filter((item) => item !== part.text)
          : [...state.selected, part.text]
        redraw()
      },
    })
  }

  const openBlock = []
  let lastSection = null
  const pickableItems = state.current.group === 'Task docs' ? openItems : []
  pickableItems.forEach((part, index) => {
    if (part.section !== lastSection) {
      if (part.section) openBlock.push(Text({ key: 's' + index, bold: true, dimColor: true, children: part.section }))
      lastSection = part.section
    }
    openBlock.push(pickable(part, 'o' + index))
  })

  const doneBlock = doneItems.length
    ? [
        Button({
          key: 'done-toggle',
          label: (state.showDone ? '▾' : '▸') + ' DONE (' + doneItems.length + ')',
          plain: true,
          onPress: () => {
            state.showDone = !state.showDone
            redraw()
          },
        }),
        ...(state.showDone
          ? doneItems.map((part, index) => Text({ key: 'x' + index, dimColor: true, children: '   [x] ' + part.text }))
          : []),
      ]
    : []

  const decisionFiles = state.current.decisions || []
  const decisionBytes = decisionFiles.reduce((sum, file) => sum + (file.size || 0), 0)
  const decisionsBlock = decisionFiles.length
    ? [
        Button({
          key: 'decisions-toggle',
          label:
            (state.showDecisions ? '▾' : '▸') +
            ' DECISIONS (' +
            decisionFiles.length +
            (decisionFiles.length === 1 ? ' file, ' : ' files, ') +
            kb(decisionBytes) +
            ')',
          plain: true,
          onPress: () => {
            state.showDecisions = !state.showDecisions
            redraw()
          },
        }),
        ...(state.showDecisions
          ? decisionFiles.map((file, index) =>
              Button({
                key: 'dec' + index,
                label:
                  (isOversizedDecision(file) ? '   ⚠ ' : '     ') +
                  file.name.replace(/\.md$/, '') +
                  '  ' +
                  kb(file.size) +
                  (isOversizedDecision(file) ? ' (over 40 KB)' : '') +
                  '  ›',
                plain: true,
                onPress: () => openDecision(index),
              }),
            )
          : []),
      ]
    : []

  const body = parts.map((part, index) => {
    if (part.kind === 'md') return Markdown({ key: 'm' + index, text: part.text })
    if (part.kind === 'item') {
      return Text({ key: 't' + index, dimColor: true, children: '   ' + (part.done ? '[x] ' : '[ ] ') + part.text })
    }
    const diagram = state.diagrams[hashOf(part.source)]
    if (!Image) return sourceOf(part.source, 's' + index)
    if (!diagram || diagram.status === 'rendering') {
      return Text({ key: 'w' + index, dimColor: true, children: '… rendering diagram (the first run can take a minute)' })
    }
    if (diagram.status === 'error') {
      return Box({
        key: 'e' + index,
        flexDirection: 'column',
        children: [
          Text({ color: 'red', wrap: 'truncate-end', children: 'Diagram failed: ' + diagram.message }),
          sourceOf(part.source, 's' + index),
        ],
      })
    }
    const size = fitImage(diagram.size, Math.max(20, (e.bodyColumns || 100) - 2))
    return Image({
      key: 'g' + index,
      source: { png: diagram.png },
      columns: size.columns,
      rows: size.rows,
      alt: 'Diagram not drawn here: start Claude Code with CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1',
    })
  })

  const actions = (isTop) => {
    const action = (id, label, topProps, onPress) =>
      Button({ key: isTop ? id : id + '-end', label, ...(isTop ? topProps : {}), onPress })
    return Box({
      flexDirection: 'row',
      columnGap: 2,
      children: [
        action('back', '< Back', { hotkey: 'b', autoFocus: true }, () => {
          stopWatch()
          state.selected = []
          goto('list')
        }),
        ...(state.current.group === 'Task docs'
          ? [
              action(
                'send',
                state.selected.length ? 'Read-summary, then do ' + state.selected.length + ' selected' : 'Read-summary this doc',
                { hotkey: 'g' },
                () => send($),
              ),
              action('handoff', 'Hand off', { hotkey: 'h' }, openHandoff),
            ]
          : []),
        action('changes', 'Changes', { hotkey: 'd' }, () => openDocDiff($, state.current.path, 'doc')),
        action('refresh', 'Refresh ⚠', { hotkey: 'r' }, () =>
          askFirst('Refresh ' + state.current.label, refreshRequest(state.current), REFRESH_EFFECT),
        ),
        ...(state.current.group === 'Task docs' || isInstructionFile(state.current)
          ? [
              action('shrink', 'Shrink ⚠', { hotkey: 'k' }, () =>
                askFirst('Shrink ' + state.current.label, shrinkRequest(state.current), SHRINK_EFFECT),
              ),
            ]
          : []),
        ...(state.selected.length
          ? [
              action('clear', 'Clear', { hotkey: 'c' }, () => {
                state.selected = []
                redraw()
              }),
            ]
          : []),
      ],
    })
  }

  return Box({
    flexDirection: 'column',
    children: [
      actions(true),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Text({ bold: true, wrap: 'truncate-start', children: state.current.label }),
          Text({ dimColor: true, children: kb(state.current.size) }),
          Text({ dimColor: true, children: state.changedAt ? 'changed ' + state.changedAt : 'live' }),
        ],
      }),
      state.status ? Text({ dimColor: true, wrap: 'truncate-end', children: state.status }) : Text({ children: ' ' }),
      state.error
        ? Text({ color: 'red', children: state.error })
        : Box({
            flexDirection: 'column',
            children: [
              ...(state.current.group === 'Task docs'
                ? [
                    Text({
                      bold: true,
                      children: openItems.length
                        ? 'OPEN (' + openItems.length + ')  press items to select'
                        : 'No open items in this doc',
                    }),
                  ]
                : []),
              ...openBlock,
              ...doneBlock,
              ...decisionsBlock,
              Text({ dimColor: true, children: '─── the doc, for reading ───' }),
              ...body,
            ],
          }),
      Text({ children: ' ' }),
      actions(false),
    ],
  })
}

const decisionView = ($, c) => {
  const { Box, Text, Button, Markdown, goto, openDecision, askFirst } = c
  const files = state.current.decisions || []
  const index = files.findIndex((file) => file.path === state.decisionOpen)
  if (index < 0) return docView($, c)
  const file = files[index]
  const toDoc = (key, hotkey) =>
    Button({
      key,
      label: '< Back to doc',
      ...(hotkey ? { hotkey, autoFocus: true } : {}),
      onPress: () => goto('doc'),
    })
  return Box({
    flexDirection: 'column',
    children: [
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          toDoc('dec-back', 'b'),
          ...(index > 0 ? [Button({ key: 'dec-prev', label: '‹ Prev', hotkey: 'p', onPress: () => openDecision(index - 1) })] : []),
          ...(index < files.length - 1
            ? [Button({ key: 'dec-next', label: 'Next ›', hotkey: 'n', onPress: () => openDecision(index + 1) })]
            : []),
          Button({
            key: 'dec-changes',
            label: 'Changes',
            hotkey: 'd',
            onPress: () => openDocDiff($, file.path, 'decision'),
          }),
          Button({
            key: 'dec-condense',
            label: 'Condense ⚠',
            hotkey: 'k',
            onPress: () =>
              askFirst('Condense ' + file.name, condenseFileRequest(state.current, file), CONDENSE_FILE_EFFECT, false, state.current),
          }),
          Button({
            key: 'dec-split',
            label: 'Split ⚠',
            hotkey: 't',
            onPress: () => askFirst('Split ' + file.name, splitRequest(state.current, file), SPLIT_EFFECT, false, state.current),
          }),
        ],
      }),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Text({ bold: true, wrap: 'truncate-start', children: state.current.label + ' › ' + file.name.replace(/\.md$/, '') }),
          Text({ dimColor: true, children: kb(file.size) + ' · ' + (index + 1) + ' of ' + files.length }),
          ...(isOversizedDecision(file)
            ? [Text({ key: 'dec-over', color: 'yellow', children: '⚠ over 40 KB' })]
            : []),
        ],
      }),
      Text({ children: ' ' }),
      Markdown({ key: 'dec-md', text: state.decisionTexts[file.path] || '_Loading…_' }),
      Text({ children: ' ' }),
      toDoc('dec-back-end'),
    ],
  })
}
