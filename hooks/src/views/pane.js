import { hostUiInvalidate, hostUiScroll } from '../core/api.js'
import { DESKTOP_DRAW_LIMIT, DESKTOP_TONE, MOD_LOG_FILE, PANE, STICKY_AFTER, STICKY_PREFIX, TOP_BUTTON_AFTER, TOP_BUTTON_ROWS, WINDOW_ROWS } from '../core/constants.js'
import { drawingSize, modLog, treeProblem } from '../core/log.js'
import { state } from '../core/state.js'
import { closePane } from '../docs/reader.js'
import { CHANGE_VIEWS } from '../git/controller.js'
import { changeAllView, changeFileView, changesView } from './changes.js'
import { desktopChangeAllView, desktopChangeFileView, desktopChangesView } from './desktop.js'
import { decisionView, docView } from './doc.js'
import { imagesView } from './images.js'
import { listView } from './list.js'
import { confirmView, handoffView, menuView } from './menu.js'
import { paneContext } from './pane-context.js'
import { isDesktop, pageBar } from './ui.js'

export async function paneView($, e, next) {
  if (e.requestId === PANE && !state.isOpen) modLog($, 'pane drawn while closed (' + e.surface + ')')
  if (e.requestId !== PANE || !state.isOpen) return next(e)
  const c = paneContext($, e)
  state.desktop = isDesktop(e)
  state.stickyTop = null
  state.stickySection = null
  state.windowed = false
  state.noTopFloat = false
  const tree = withFloats($, c, await paneTree($, c))
  const size = drawingSize(tree)
  if (state.desktop && size > DESKTOP_DRAW_LIMIT) {
    modLog($, 'pane ' + state.view + ' (desktop): about ' + Math.round(size / 10000) * 10 + 'k characters, may be too big for Desktop to draw')
  }
  const problem = treeProblem(tree)
  if (!problem) return tree
  modLog($, 'pane ' + state.view + ' (' + e.surface + '): ' + problem)
  return state.desktop ? refusedView($, c, problem) : tree
}

export function withFloats($, c, tree) {
  const scroll = c.e.props && c.e.props.scroll
  const offset = state.windowed ? state.windowAt : scroll ? scroll.offset : 0
  state.topShown = !state.noTopFloat && offset > TOP_BUTTON_AFTER
  const pinned = state.desktop && offset >= STICKY_AFTER ? [state.stickyTop, state.stickySection].filter(Boolean) : []
  state.stickyShown = pinned.length > 0
  return c.Box({
    flexDirection: 'column',
    children: [
      tree,
      ...(state.stickyShown
        ? [
            c.Box({
              key: 'pane-sticky',
              position: 'absolute',
              top: offset,
              left: 0,
              right: 0,
              flexDirection: 'column',
              rowGap: 1,
              paddingBottom: 1,
              backgroundColor: DESKTOP_TONE.page,
              children: pinned.map((make) => make(STICKY_PREFIX)),
            }),
          ]
        : []),
      ...(state.topShown
        ? [
            c.Box({
              key: 'pane-top-float',
              position: 'absolute',
              top: offset + Math.max(0, ((scroll && scroll.bodyRows) || state.allScroll.body || WINDOW_ROWS) - TOP_BUTTON_ROWS),
              right: 1,
              children: [
                c.Button({
                  key: 'pane-top',
                  label: '↑ Top',
                  onPress: () => hostUiScroll($, { in: PANE, to: 'start', block: 'start' }).then(() => hostUiInvalidate($, 'ui.render')),
                }),
              ],
            }),
          ]
        : []),
    ],
  })
}

export function refusedView($, c, problem) {
  return c.Box({
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
}

export async function paneTree($, c) {
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
  if (state.view === 'decision' && state.current) return decisionView($, c)
  if (state.view === 'doc' && state.current) return docView($, c)
  return listView(c)
}
