const menuView = ($, c) => {
  const { Box, Text, Button, goto, openHandoff, askFirst } = c
  const rows = [Text({ key: 'menu-title', bold: true, children: 'What do you want to do?' })]
  VERBS.forEach((verb, index) => {
    rows.push(
      Box({
        key: 'v' + index,
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Button({
            key: 'vb' + index,
            label: (verb.label + (verb.danger ? ' ⚠' : '')).padEnd(18),
            ...(index < 9 ? { hotkey: String(index + 1) } : {}),
            plain: true,
            ...(index === 0 ? { autoFocus: true } : {}),
            onPress: () => {
              if (verb.go === 'list') return goto('list')
              if (verb.go === 'heavy') {
                state.heavyOnly = true
                state.pick = 'shrink'
                return goto('list')
              }
              if (verb.go === 'refresh') {
                state.heavyOnly = false
                state.pick = 'refresh'
                return goto('list')
              }
              if (verb.go === 'handoff') return openHandoff()
              if (verb.go === 'changes') return enterChanges($)
              if (verb.go === 'images') return goto('images')
              if (verb.danger) return askFirst(verb.label, verb.text, verb.effect, true)
              return submitPrompt($, verb.text, verb.toast)
            },
          }),
          Text({ key: 'vh' + index, dimColor: true, wrap: 'truncate-end', children: verb.hint }),
        ],
      }),
    )
  })
  rows.push(Text({ key: 'menu-note', dimColor: true, children: '⚠ shows exactly what will be sent, then asks again' }))
  return Box({ flexDirection: 'column', children: rows })
}

const confirmView = ($, c) => {
  const { Box, Text, Button, Input, redraw, goto, bindField } = c
  const confirm = state.confirm
  if (!confirm) return menuView($, c)
  return Box({
    flexDirection: 'column',
    children: [
      Text({ bold: true, children: 'Confirm: ' + confirm.title }),
      ...(confirm.effect ? [Text({ color: 'yellow', wrap: 'truncate-end', children: 'Effect: ' + confirm.effect })] : []),
      Text({ dimColor: true, children: 'This goes to Claude, which will act on it:' }),
      Box({
        key: 'confirm-box',
        flexDirection: 'column',
        borderStyle: 'round',
        paddingX: 1,
        children: confirm.text.split('\n').map((line, index) => Text({ key: 'c' + index, children: line || ' ' })),
      }),
      ...(confirm.offerHandoff
        ? [
            Button({
              key: 'also-handoff',
              label: (state.alsoHandoff ? '☑' : '☐') + ' Also hand off to the next session when this finishes (optional)',
              hotkey: 'o',
              plain: true,
              onPress: () => {
                state.alsoHandoff = !state.alsoHandoff
                redraw()
              },
            }),
          ]
        : []),
      ...(confirm.offerHandoff && state.alsoHandoff
        ? [
            Input({
              key: 'handoff-message',
              label: 'Message',
              placeholder: 'optional: what the next session should do first',
              value: state.handoffNext,
              onInput: bindField('handoffNext'),
              onSubmit: bindField('handoffNext'),
            }),
          ]
        : []),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Button({
            key: 'confirm-send',
            label: 'Send',
            hotkey: 's',
            onPress: () => {
              if (confirm.record) return claimAndSend($, confirm.record, confirm.text)
              if (confirm.reopen) state.reopen = confirm.reopen
              const later = confirm.offerHandoff && state.alsoHandoff ? { next: state.handoffNext.trim(), armed: false } : null
              return submitPrompt($, confirm.text, 'Sent: ' + confirm.title.toLowerCase(), undefined, later)
            },
          }),
          Button({
            key: 'confirm-cancel',
            label: 'Cancel',
            hotkey: 'x',
            autoFocus: true,
            onPress: () => {
              const back = confirm.back && confirm.back !== 'confirm' ? confirm.back : 'menu'
              if (back !== 'list') state.pick = null
              goto(back)
            },
          }),
        ],
      }),
    ],
  })
}

const handoffView = ($, c) => {
  const { Box, Text, Button, Input, goto, bindField, saveFromForm } = c
  const doc = state.current || state.lastDoc
  const carries = [
    'a summary of this conversation (one quick model call)',
    'the files touched',
    'git state',
    ...(doc && doc.group === 'Task docs' ? [doc.label] : []),
    ...(state.selected.length ? [state.selected.length + ' picked items'] : []),
  ]
  return Box({
    flexDirection: 'column',
    children: [
      Text({ bold: true, children: 'Hand off this session' }),
      Text({ dimColor: true, children: 'Saves: ' + carries.join(', ') + '.' }),
      Input({
        key: 'handoff-next',
        label: 'Next',
        placeholder: 'optional: what the next session should do first',
        value: state.handoffNext,
        autoFocus: true,
        onInput: bindField('handoffNext'),
        onSubmit: (value) => {
          state.handoffNext = value
          return saveFromForm(value)
        },
      }),
      state.saving
        ? Text({ color: 'cyan', children: 'Summarising this session…' })
        : Box({
            flexDirection: 'row',
            columnGap: 2,
            children: [
              Button({
                key: 'handoff-save',
                label: 'Save handoff',
                hotkey: 'v',
                onPress: () => saveFromForm(state.handoffNext),
              }),
              Button({
                key: 'handoff-cancel',
                label: 'Cancel',
                hotkey: 'x',
                onPress: () => (state.handoffFromBand ? closePane($) : goto(state.current ? 'doc' : 'menu')),
              }),
            ],
          }),
    ],
  })
}
