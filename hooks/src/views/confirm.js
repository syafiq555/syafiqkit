import { DESKTOP_TONE } from '../core/constants.js'
import { state } from '../core/state.js'
import { closePane, loadDoc, submitPrompt } from '../docs/reader.js'
import { CHANGE_VIEWS, watchChanges } from '../git/controller.js'
import { isDesktop } from './ui.js'

async function cancelConfirm($, c, confirm) {
  if (confirm.back === 'close') return closePane($)
  if (confirm.backDoc) {
    await loadDoc($, confirm.backDoc)
    state.docBack = confirm.docBack || null
    if (confirm.back === 'decision' && confirm.decisionOpen) {
      state.decisionOpen = confirm.decisionOpen
      state.view = 'decision'
    }
    return c.redraw()
  }
  c.goto(confirm.back || 'list')
  if (CHANGE_VIEWS.has(confirm.back)) watchChanges($)
}

export function confirmView($, c) {
  const { Box, Text, Button } = c
  const confirm = state.confirm
  const desktop = isDesktop(c.e)
  return Box({
    flexDirection: 'column',
    ...(desktop ? { rowGap: 1 } : {}),
    children: [
      Text({ bold: true, children: 'Confirm: ' + confirm.title }),
      ...(confirm.effect && desktop
        ? [
            Box({
              key: 'confirm-effect',
              paddingX: 1,
              backgroundColor: DESKTOP_TONE.warnStrip,
              children: [Text({ color: 'warning', children: 'Effect: ' + confirm.effect })],
            }),
          ]
        : []),
      ...(confirm.effect && !desktop ? [Text({ color: 'yellow', children: 'Effect: ' + confirm.effect })] : []),
      Text({ dimColor: true, children: 'This goes to Claude, which will act on it:' }),
      Box({
        key: 'confirm-box',
        flexDirection: 'column',
        borderStyle: 'round',
        ...(desktop ? { borderColor: DESKTOP_TONE.border } : {}),
        paddingX: 1,
        children: confirm.text.split('\n').map((line, index) => Text({ key: 'c' + index, children: line || ' ' })),
      }),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Button({
            key: 'confirm-send',
            label: 'Send',
            hotkey: 's',
            ...(desktop ? { variant: 'primary' } : {}),
            onPress: () => submitPrompt($, confirm.text, 'Sent: ' + confirm.title.toLowerCase()),
          }),
          Button({
            key: 'confirm-cancel',
            label: 'Cancel',
            hotkey: 'x',
            autoFocus: true,
            ...(desktop ? { role: 'dismiss' } : {}),
            onPress: () => cancelConfirm($, c, confirm),
          }),
        ],
      }),
    ],
  })
}
