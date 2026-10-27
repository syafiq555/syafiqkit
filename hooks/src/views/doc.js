import { hostUiInvalidate, hostUiScroll } from '../core/api.js'
import { ITEM_CAP_ROWS, PANE, TYPESET_WIDTH_STEP } from '../core/constants.js'
import { condenseFileRequest, isInstructionFile, isOversizedDecision, kb, refreshRequest, shrinkRequest, splitRequest, wrapWords } from '../core/format.js'
import { state } from '../core/state.js'
import { copyDocFile, openInEditor } from '../docs/export.js'
import { fitImage, hashOf, svgPicture } from '../docs/images.js'
import { segments } from '../docs/markdown.js'
import { typesetKeyOf, typesetSize, wantTypeset } from '../docs/typeset.js'
import { send, stopWatch } from '../docs/reader.js'
import { openDocDiff, returnFromDoc } from '../git/controller.js'
import { paneColumns } from './changes.js'
import { windowedRows } from './desktop.js'
import { hoverScope, isDesktop, liveOnly, stickyTop } from './ui.js'

const DOC_TOP_ROWS = 4

function parsedDoc(text) {
  if (!state.docParse || state.docParse.text !== text) state.docParse = { text, parts: segments(text), keys: {} }
  return state.docParse
}

function typesetKeyAt(parsed, index, columns, look) {
  const id = index + ':' + columns + ':' + look.mode + ':' + look.cell.width + 'x' + look.cell.height
  if (!(id in parsed.keys)) parsed.keys[id] = typesetKeyOf(parsed.parts[index].text, columns, look)
  return parsed.keys[id]
}

function wrappedRows(text, columns) {
  return text.split('\n').reduce((sum, line) => sum + wrapWords(line, columns).length, 0)
}

export function docView($, c) {
  const { e, Box, Text, Button, Markdown, Image, goto, redraw, sendNow, openDecision } = c
  const parsed = parsedDoc(state.text)
  const parts = parsed.parts
  const openItems = parts.filter((part) => part.kind === 'item' && !part.done)
  const doneItems = parts.filter((part) => part.kind === 'item' && part.done)
  const sourceOf = (source, key) => Markdown({ key, text: '```mermaid\n' + source + '\n```' })

  const columns = paneColumns(e)
  const itemWidth = Math.max(20, columns - 10)
  const cappedCount = isDesktop(e) || state.current.group !== 'Task docs' ? 0 : openItems.filter((part) => wrapWords(part.text, itemWidth).length > ITEM_CAP_ROWS).length

  const pickable = (part, key) => {
    const rank = state.selected.indexOf(part.text) + 1
    const picked = rank > 0
    const lead = (picked ? '▶' + rank + ' ' : '   ') + '[ ] '
    const toggle = () => {
      state.selected = picked
        ? state.selected.filter((item) => item !== part.text)
        : [...state.selected, part.text]
      redraw()
    }
    const dim = !picked && state.selected.length > 0
    if (isDesktop(e)) return Button({ key, plain: true, onPress: toggle, children: [Text({ dimColor: dim, children: lead + part.text })] })
    const all = wrapWords(part.text, itemWidth)
    const capped = !state.expandItems && all.length > ITEM_CAP_ROWS
    const shown = capped ? all.slice(0, ITEM_CAP_ROWS) : all
    const lit = { hover: { scope: hoverScope('item:' + part.text), inverse: true } }
    const first = Button({ key, plain: true, onPress: toggle, ...(all.length > 1 ? lit : {}), children: [Text({ dimColor: dim, children: lead + shown[0] })] })
    if (all.length === 1) return first
    const tail = shown.slice(1)
    if (capped) {
      const hidden = all.length - shown.length
      tail.push('… ' + hidden + (hidden === 1 ? ' more line' : ' more lines') + (picked ? ' (included)' : ''))
    }
    const bodyWidth = columns - 8
    const expandAll = () => {
      state.expandItems = true
      redraw()
    }
    return Box({
      key: key + '-rows',
      flexDirection: 'column',
      children: [
        first,
        ...tail.map((row, at) => {
          const isMore = capped && at === tail.length - 1
          return Button({
            key: key + '.' + (at + 1),
            plain: true,
            onPress: isMore ? expandAll : toggle,
            ...lit,
            children: [
              Text({ children: '    ' }),
              Text({ color: picked ? 'cyan' : undefined, children: picked ? (at === tail.length - 1 ? '╹' : '┃') : ' ' }),
              Text({ dimColor: dim || isMore, children: '  ' + row.padEnd(bodyWidth) }),
            ],
          })
        }),
        Text({ key: key + '-gap', children: ' ' }),
      ],
    })
  }

  const entry = (height, node) => ({ height, node })

  const pickableRows = (part) => {
    const all = wrapWords(part.text, itemWidth)
    if (all.length === 1) return 1
    const capped = !state.expandItems && all.length > ITEM_CAP_ROWS
    return (capped ? ITEM_CAP_ROWS + 1 : all.length) + 1
  }

  const openBlock = []
  let lastSection = null
  const pickableItems = state.current.group === 'Task docs' ? openItems : []
  pickableItems.forEach((part, index) => {
    if (part.section !== lastSection) {
      if (part.section) openBlock.push(entry(1, Text({ key: 's' + index, bold: true, dimColor: true, children: part.section })))
      lastSection = part.section
    }
    openBlock.push(entry(pickableRows(part), pickable(part, 'o' + index)))
  })

  const doneBlock = doneItems.length
    ? [
        entry(
          1,
          Button({
            key: 'done-toggle',
            label: (state.showDone ? '▾' : '▸') + ' DONE (' + doneItems.length + ')',
            plain: true,
            onPress: () => {
              state.showDone = !state.showDone
              redraw()
            },
          }),
        ),
        ...(state.showDone
          ? doneItems.map((part, index) => {
              const text = '   [x] ' + part.text
              return entry(wrappedRows(text, columns), Text({ key: 'x' + index, dimColor: true, children: text }))
            })
          : []),
      ]
    : []

  const decisionFiles = state.current.decisions || []
  const decisionBytes = decisionFiles.reduce((sum, file) => sum + (file.size || 0), 0)
  const decisionsBlock = decisionFiles.length
    ? [
        entry(
          1,
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
        ),
        ...(state.showDecisions
          ? decisionFiles.map((file, index) =>
              entry(
                1,
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
              ),
            )
          : []),
      ]
    : []

  const pictureColumns = Math.max(20, Math.floor((columns - 2) / TYPESET_WIDTH_STEP) * TYPESET_WIDTH_STEP)
  const canTypeset = !isDesktop(e) && Boolean(Image) && state.typst !== ''
  const typesetting = canTypeset && !state.textView
  const keyAt = (index) => typesetKeyAt(parsed, index, pictureColumns, state.look)
  if (typesetting && (!state.look || parts.some((part, index) => part.kind === 'md' && !state.typeset[keyAt(index)]))) {
    wantTypeset($, parts.filter((part) => part.kind === 'md').map((part) => part.text), pictureColumns, state.current.path).catch(() => {})
  }
  const renderedAt = (index) => (typesetting && state.look ? state.typeset[keyAt(index)] : undefined)
  const allPictures = typesetting && parts.every((part, index) => part.kind !== 'md' || (renderedAt(index) || {}).status === 'ready')
  const mdPart = (part, index) => {
    const rendered = renderedAt(index)
    const plainRows = () => wrappedRows(part.text, columns)
    if (!rendered || rendered.status === 'rendering') return [entry(plainRows(), Markdown({ key: 'm' + index, text: part.text }))]
    if (rendered.status === 'error') {
      return [
        entry(
          1 + plainRows(),
          Box({
            key: 'm' + index,
            flexDirection: 'column',
            children: [Text({ dimColor: true, wrap: 'truncate-end', children: 'Rendered view failed: ' + rendered.message }), Markdown({ key: 'mt' + index, text: part.text })],
          }),
        ),
      ]
    }
    return rendered.pages.map((page, at) => {
      const size = typesetSize(page, pictureColumns, state.look.cell)
      return entry(
        size.rows,
        Image({
          key: 'm' + index + 'p' + at,
          source: { file: page.file, format: 'png' },
          ...size,
          alt: 'Rendered page not drawn here: press t for Text view',
        }),
      )
    })
  }

  const diagramPart = (part, index) => {
    const diagram = state.diagrams[hashOf(part.source)]
    const svgDiagram = isDesktop(e) && Boolean(c.Svg)
    const sourceRows = wrappedRows(part.source, columns) + 2
    const withSource = (key, note) =>
      entry(1 + sourceRows, Box({ key, flexDirection: 'column', children: [note, sourceOf(part.source, 's' + index)] }))
    if (!Image && !svgDiagram) return entry(sourceRows, sourceOf(part.source, 's' + index))
    if (!diagram || diagram.status === 'rendering') {
      return entry(1, Text({ key: 'w' + index, dimColor: true, children: '… rendering diagram (the first run can take a minute)' }))
    }
    if (diagram.status === 'error') {
      return withSource('e' + index, Text({ color: 'red', wrap: 'truncate-end', children: 'Diagram failed: ' + diagram.message }))
    }
    if (svgDiagram) {
      const drawn = svgPicture(diagram)
      if (!drawn) {
        return withSource('e' + index, Text({ dimColor: true, children: 'Diagram too large for Desktop to draw; source below.' }))
      }
      return entry(1, Box({ key: 'g' + index, children: [c.Svg({ source: drawn.source, alt: 'Mermaid diagram', width: drawn.width, height: drawn.height })] }))
    }
    const size = fitImage(diagram.size, Math.max(20, (e.bodyColumns || 100) - 2))
    return entry(
      size.rows,
      Image({
        key: 'g' + index,
        source: { png: diagram.png },
        columns: size.columns,
        rows: size.rows,
        alt: 'Diagram not drawn here: start Claude Code with CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1',
      }),
    )
  }

  const body = parts.flatMap((part, index) => {
    if (part.kind === 'md') return mdPart(part, index)
    if (part.kind !== 'item') return [diagramPart(part, index)]
    const text = '   ' + (part.done ? '[x] ' : '[ ] ') + part.text
    return [entry(wrappedRows(text, columns), Text({ key: 't' + index, dimColor: true, children: text }))]
  })

  const actions = (isTop, prefix = '') => {
    const action = (id, label, topProps, onPress) =>
      Button({ key: prefix + (isTop ? id : id + '-end'), label, ...(isTop ? liveOnly(prefix, topProps) : {}), onPress })
    return Box({
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 2,
      children: [
        action('back', state.docBack ? '< Back to changes' : '< Back', { hotkey: 'b', autoFocus: true }, () => {
          if (state.docBack) return returnFromDoc($)
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
            ]
          : []),
        action('changes', state.docBack ? 'Doc diff' : 'Changes', { hotkey: 'd' }, () => openDocDiff($, state.current.path, 'doc')),
        action('copy', 'Copy', { hotkey: 'y' }, (press) => copyDocFile($, state.current.path, 'the doc', press && press.surface)),
        action('open', 'Open in editor', { hotkey: 'o' }, () => openInEditor($, state.current.path)),
        ...(canTypeset
          ? [
              action('view', state.textView ? 'Rendered view' : 'Text view', { hotkey: 't' }, () => {
                state.textView = !state.textView
                redraw()
              }),
            ]
          : []),
        action('refresh', 'Refresh', { hotkey: 'r' }, () =>
          sendNow('Refresh ' + state.current.label, refreshRequest(state.current)),
        ),
        ...(state.current.group === 'Task docs' || isInstructionFile(state.current)
          ? [
              action('shrink', 'Shrink', { hotkey: 'k' }, () =>
                sendNow('Shrink ' + state.current.label, shrinkRequest(state.current)),
              ),
            ]
          : []),
        ...(cappedCount
          ? [
              action('expand', state.expandItems ? 'Collapse long' : 'Expand ' + cappedCount + ' long', { hotkey: 'e' }, () => {
                state.expandItems = !state.expandItems
                redraw()
              }),
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
        ...(!isTop && allPictures
          ? [Button({ key: 'top-end', label: '↑ Top (u)', hotkey: 'u', onPress: () => hostUiScroll($, { in: PANE, to: 'start', block: 'start' }).then(() => hostUiInvalidate($, 'ui.render')) })]
          : []),
      ],
    })
  }

  const content = [
    ...(state.current.group === 'Task docs'
      ? [entry(1, Text({ bold: true, children: openItems.length ? 'OPEN (' + openItems.length + ')  press items to select' : 'No open items in this doc' }))]
      : []),
    ...openBlock,
    ...doneBlock,
    ...decisionsBlock,
    entry(1, Text({ dimColor: true, children: '─── the doc, for reading ───' })),
    ...(!isDesktop(e) && Image && state.typst === ''
      ? [entry(1, Text({ key: 'typst-hint', dimColor: true, children: 'Rendered docs need Typst: brew install typst' }))]
      : []),
    ...body,
  ]
  if (allPictures) state.noTopFloat = true

  return Box({
    flexDirection: 'column',
    children: [
      stickyTop((prefix) => actions(true, prefix)),
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
            children: allPictures
              ? windowedRows(c, content.map(({ height, node }) => ({ height, make: () => node })), DOC_TOP_ROWS)
              : content.map(({ node }) => node),
          }),
      Text({ children: ' ' }),
      actions(false),
    ],
  })
}

export function decisionView($, c) {
  const { Box, Text, Button, Markdown, goto, openDecision, sendNow } = c
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
  const topRow = (prefix) => {
    return Box({
      key: prefix + 'dec-top',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 2,
      children: [
        toDoc(prefix + 'dec-back', prefix ? '' : 'b'),
        ...(index > 0 ? [Button({ key: prefix + 'dec-prev', label: '‹ Prev', ...liveOnly(prefix, { hotkey: 'p' }), onPress: () => openDecision(index - 1) })] : []),
        ...(index < files.length - 1
          ? [Button({ key: prefix + 'dec-next', label: 'Next ›', ...liveOnly(prefix, { hotkey: 'n' }), onPress: () => openDecision(index + 1) })]
          : []),
        Button({
          key: prefix + 'dec-changes',
          label: 'Changes',
          ...liveOnly(prefix, { hotkey: 'd' }),
          onPress: () => openDocDiff($, file.path, 'decision'),
        }),
        Button({
          key: prefix + 'dec-copy',
          label: 'Copy',
          ...liveOnly(prefix, { hotkey: 'y' }),
          onPress: (press) => copyDocFile($, file.path, file.name, press && press.surface),
        }),
        Button({
          key: prefix + 'dec-open',
          label: 'Open in editor',
          ...liveOnly(prefix, { hotkey: 'o' }),
          onPress: () => openInEditor($, file.path),
        }),
        Button({
          key: prefix + 'dec-condense',
          label: 'Condense',
          ...liveOnly(prefix, { hotkey: 'k' }),
          onPress: () =>
            sendNow('Condense ' + file.name, condenseFileRequest(state.current, file), state.current),
        }),
        Button({
          key: prefix + 'dec-split',
          label: 'Split',
          ...liveOnly(prefix, { hotkey: 't' }),
          onPress: () => sendNow('Split ' + file.name, splitRequest(state.current, file), state.current),
        }),
      ],
    })
  }
  return Box({
    flexDirection: 'column',
    children: [
      stickyTop(topRow),
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
