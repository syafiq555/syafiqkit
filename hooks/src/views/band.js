import { hostUiResolve } from '../core/api.js'
import { DESKTOP_TONE, RISKY } from '../core/constants.js'
import { agoOf, clip } from '../core/format.js'
import { state } from '../core/state.js'
import { openImages, restoreGallery } from '../docs/gallery.js'
import { send } from '../docs/reader.js'
import { openChanges } from '../git/controller.js'
import { wrapupStates } from '../git/wrapup.js'
import { gitState } from '../handoff/capture.js'
import { claimAndSend, dismissHandoff, goalOf, resumeText } from '../handoff/store.js'
import { enhanceRow, startEnhance } from '../prompt/enhance.js'
import { confirmVerb, openPane, sendVerb } from './actions.js'
import { isDesktop, pipeStrip, toolStrip } from './ui.js'

export async function bandView($, e, next) {
  if (state.disabled || (e.props && e.props.hasSurvey)) return next(e)
  const { Box, Text, Button } = hostUiResolve($, e)
  const desktop = isDesktop(e)
  state.desktop = desktop
  restoreGallery($)
  const paneOpen = state.isOpen
  const key = (letter) => (paneOpen ? {} : { hotkey: letter })
  const phases = wrapupStates()
  const rows = [
    Box({
      key: 'launch-row',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 2,
      paddingX: 1,
      children: [
        Text({ key: 'mark', color: 'cyan', bold: true, children: '▤' }),
        toolStrip({ Box, Text, Button }, [
          {
            key: 'band-enhance',
            label: state.enhance.phase === 'running' ? 'enhance…' : 'enhance',
            ...key('e'),
            onPress: () => startEnhance($),
          },
          { key: 'open-docs', label: state.reopen ? 'docs ↩' : 'docs', ...key('d'), onPress: () => openPane($, 'list', true) },
          { key: 'open-changes', label: 'changes', count: state.changeCount, ...key('g'), onPress: () => openChanges($, true) },
          ...(state.images.length
            ? [{ key: 'open-images', label: 'images', count: state.images.length, ...key('i'), onPress: () => openImages($, true) }]
            : []),
        ]),
        Text({ key: 'divider', dimColor: true, children: '│' }),
        pipeStrip({ Box, Text, Button }, [
          { key: 'band-done', label: 'done', phase: phases.done, ...key('w'), onPress: () => confirmVerb($, 'Done') },
          { key: 'band-commit', label: 'commit', phase: phases.commit, ...key('c'), onPress: () => sendVerb($, 'Commit') },
          { key: 'band-push', label: 'push', phase: phases.push, ...key('p'), onPress: () => confirmVerb($, 'Push') },
          { key: 'band-ship', label: 'ship', phase: phases.ship, ...key('s'), onPress: () => confirmVerb($, 'Ship') },
        ]),
        ...(state.saving ? [Text({ key: 'saving', color: 'cyan', children: 'Summarising…' })] : []),
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
  const enhancing = await enhanceRow($, e)
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
