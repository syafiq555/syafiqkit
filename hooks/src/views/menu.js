import { toggleAnswerPictures } from '../answers/pictures.js'
import { DESKTOP_TONE, VERBS } from '../core/constants.js'
import { state } from '../core/state.js'
import { submitPrompt } from '../docs/reader.js'
import { enterChanges } from '../git/controller.js'
import { claimAndSend } from '../handoff/store.js'
import { desktopMenuView } from './desktop.js'
import { isDesktop } from './ui.js'

export function runVerb($, c, verb) {
  const { goto, openHandoff, askFirst } = c
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
  const { Box, Text, Button, Input, redraw, goto, bindField } = c
  const confirm = state.confirm
  if (!confirm) return menuView($, c)
  const kept = state.handoffNext.trim()
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
              onSubmit: (value) => {
                if (typeof value === 'string' && value.trim()) state.handoffNext = value
                redraw()
              },
            }),
            Text({
              key: 'handoff-message-kept',
              dimColor: true,
              children: kept ? 'Next session starts with: ' + kept : 'No message: the next session starts from the summary.',
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
            ...(desktop ? { variant: 'primary' } : {}),
            onPress: () => {
              if (confirm.record) return claimAndSend($, confirm.record, confirm.text)
              if (confirm.reopen) state.reopen = confirm.reopen
              const later = confirm.offerHandoff && state.alsoHandoff ? { next: kept, armed: false } : null
              return submitPrompt($, confirm.text, 'Sent: ' + confirm.title.toLowerCase() + (later ? '. Handoff saves when it finishes' : ''), undefined, later)
            },
          }),
          Button({
            key: 'confirm-cancel',
            label: 'Cancel',
            hotkey: 'x',
            autoFocus: true,
            ...(desktop ? { role: 'dismiss' } : {}),
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

export function handoffView($, c) {
  const { Box, Text, Button, Input, goto, bindField, saveFromForm } = c
  const doc = state.current || state.lastDoc
  const carries = [
    'a summary of this conversation (one quick model call)',
    'the files touched',
    'git state',
    ...(doc && doc.group === 'Task docs' ? [doc.label] : []),
    ...(state.selected.length ? [state.selected.length + ' picked items'] : []),
  ]
  const desktop = isDesktop(c.e)
  const saves = Text({ key: 'handoff-saves', dimColor: true, children: (desktop ? 'Also saves: ' : 'Saves: ') + carries.join(', ') + '.' })
  return Box({
    flexDirection: 'column',
    children: [
      Text({ bold: true, children: 'Hand off this session' }),
      ...(desktop ? [Text({ key: 'handoff-next-label', children: 'First thing for the next session (optional)' })] : [saves]),
      Input({
        key: 'handoff-next',
        ...(desktop ? {} : { label: 'Next' }),
        placeholder: desktop ? 'e.g. finish the failing tests first' : 'optional: what the next session should do first',
        value: state.handoffNext,
        autoFocus: true,
        onInput: bindField('handoffNext'),
        onSubmit: (value) => {
          if (typeof value === 'string' && value.trim()) state.handoffNext = value
          return saveFromForm(state.handoffNext)
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
                ...(isDesktop(c.e) ? { variant: 'primary' } : {}),
                onPress: () => saveFromForm(state.handoffNext),
              }),
              Button({
                key: 'handoff-cancel',
                label: 'Cancel',
                hotkey: 'x',
                ...(isDesktop(c.e) ? { role: 'dismiss' } : {}),
                onPress: () => goto(state.current ? 'doc' : 'menu'),
              }),
            ],
          }),
      ...(desktop ? [saves] : []),
    ],
  })
}
