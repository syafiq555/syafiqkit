import { toggleAnswerPictures } from '../answers/pictures.js'
import { DESKTOP_TONE, VERBS } from '../core/constants.js'
import { state } from '../core/state.js'
import { submitPrompt } from '../docs/reader.js'
import { enterChanges } from '../git/controller.js'
import { desktopMenuView } from './desktop.js'
import { isDesktop } from './ui.js'

export function runVerb($, c, verb) {
  const { goto, askFirst } = c
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
  if (verb.go === 'changes') return enterChanges($)
  if (verb.go === 'images') return goto('images')
  if (verb.danger) return askFirst(verb.label, verb.text, verb.effect)
  return submitPrompt($, verb.text, verb.toast)
}

export function menuView($, c) {
  if (isDesktop(c.e)) return desktopMenuView($, c)
  const { Box, Text, Button } = c
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
            onPress: () => runVerb($, c, verb),
          }),
          Text({ key: 'vh' + index, dimColor: true, wrap: 'truncate-end', children: verb.hint }),
        ],
      }),
    )
  })
  rows.push(Text({ key: 'menu-note', dimColor: true, children: '⚠ shows exactly what will be sent, then asks again' }))
  rows.push(
    Button({
      key: 'answer-pictures',
      label: 'Answer pictures: ' + (state.answerPicturesOff ? 'off' : 'on'),
      plain: true,
      onPress: async () => {
        await toggleAnswerPictures($)
        c.redraw()
      },
    }),
  )
  rows.push(Text({ key: 'menu-version', dimColor: true, children: 'syafiqkit mod v' + state.version }))
  return Box({ flexDirection: 'column', children: rows })
}

export function confirmView($, c) {
  const { Box, Text, Button, goto } = c
  const confirm = state.confirm
  if (!confirm) return menuView($, c)
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
            onPress: () => {
              state.pick = null
              goto('menu')
            },
          }),
        ],
      }),
    ],
  })
}
