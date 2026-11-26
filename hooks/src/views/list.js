import { hostUiInvalidate, hostUiScroll } from '../core/api.js'
import { DESKTOP_STRIP_ROWS, GROUPS, LIST_FOLD_FROM, LIST_TOP_ROWS, NAME_WIDTH, NARROW_COLUMNS, PANE } from '../core/constants.js'
import { clip, clipMiddle, docAgeOf, docLabel, heavyNote, isHeavy, shortName } from '../core/format.js'
import { state } from '../core/state.js'
import { heavyDocs, recentDocs } from '../docs/discovery.js'
import { paneColumns } from './changes.js'
import { desktopDocRow, docGauge, windowedRows } from './desktop.js'
import { chip, isDesktop, liveOnly, strip, textMeter } from './ui.js'

const AGE_WIDTH = 4
const FIGURE_WIDTH = 8
const MARK_WIDTH = 1
const GAUGE_WIDTH = 6
const COLUMN_GAP = 2
const MIN_TAIL_WIDTH = 8
const MIN_NAME_WIDTH = 8

export function docRow(c, doc, key, withScope, indent, fullAge) {
  if (isDesktop(c.e)) return desktopDocRow(c, doc, key, withScope, indent, fullAge)
  const { Box, Text, Button, open } = c
  const heavy = isHeavy(doc)
  const pad = indent ? '  ' : ''
  const columns = paneColumns(c.e)
  const narrow = columns < NARROW_COLUMNS
  const fitted = Math.min(NAME_WIDTH, state.listNameWidth || NAME_WIDTH)
  const nameWidth = Math.max(MIN_NAME_WIDTH, (narrow ? Math.min(fitted, Math.floor(columns * 0.45)) : fitted) - pad.length)
  const gauge = docGauge(doc)
  const tint = heavy ? 'yellow' : undefined
  const over = gauge.over ? 'yellow' : undefined
  const folded = Boolean(withScope && doc.group === 'Task docs' && doc.scope)
  const label = folded ? clipMiddle(doc.scope + '/' + shortName(doc), nameWidth) : docLabel(doc, nameWidth)
  const figure = clip(gauge.label, FIGURE_WIDTH).padStart(FIGURE_WIDTH)
  const bar = !gauge.near ? ' '.repeat(GAUGE_WIDTH) : gauge.over ? textMeter(1, 1, GAUGE_WIDTH - 1) + '▲' : textMeter(gauge.value, gauge.max, GAUGE_WIDTH)
  const age = shortAge(docAgeOf(state.now, doc.mtime, fullAge))
  const mark = statusMark(doc.status)
  const fixedWidth = pad.length + nameWidth + MARK_WIDTH + (narrow ? 0 : FIGURE_WIDTH + GAUGE_WIDTH + AGE_WIDTH)
  const tailRoom = columns - fixedWidth - (narrow ? 2 : 5) * COLUMN_GAP
  const tail =
    tailRoom < MIN_TAIL_WIDTH
      ? ''
      : [withScope && !folded ? doc.scope : '', doc.hub && !indent ? 'main doc' : '', heavy ? heavyNote(doc) : '', plainStatus(doc.status)].filter(Boolean).join('  ')
  const cell = (suffix, width, child) => Box({ key: key + suffix + 'c', width, flexShrink: 0, children: [child] })
  return Box({
    key,
    flexDirection: 'row',
    columnGap: COLUMN_GAP,
    children: [
      cell('b', pad.length + nameWidth, Button({ key: key + 'b', label: pad + label.padEnd(nameWidth), plain: true, onPress: () => open(doc) })),
      ...(narrow
        ? []
        : [
            cell('a', FIGURE_WIDTH, Text({ key: key + 'a', dimColor: !gauge.near, color: over, wrap: 'truncate-end', children: figure })),
            cell('g', GAUGE_WIDTH, Text({ key: key + 'g', color: over, wrap: 'truncate-end', children: bar })),
            cell('w', AGE_WIDTH, Text({ key: key + 'w', dimColor: true, wrap: 'truncate-end', children: age.padStart(AGE_WIDTH) })),
          ]),
      cell('s', MARK_WIDTH, Text({ key: key + 's', color: mark.color, dimColor: !mark.color, children: mark.glyph })),
      Box({
        key: key + 'mc',
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 0,
        children: [Text({ key: key + 'm', dimColor: !heavy, color: tint, wrap: 'truncate-end', children: tail })],
      }),
    ],
  })
}

function docRowsFor(c, docs, prefix) {
  return docs.map((doc) => docRow(c, doc, prefix + state.docs.indexOf(doc), true, false, true))
}

const STATUS_MARKS = [
  { glyph: '✗', color: 'red', rank: 1, icons: '❌🚫⛔🛑🔴🐛' },
  { glyph: '○', color: 'yellow', rank: 2, icons: '⏳⌛⏸🕐💤🟡⏰🅿' },
  { glyph: '●', color: 'cyan', rank: 4, icons: '🔨🚧🏗🔄⚙🛠👷🧪📝' },
  { glyph: '✓', color: 'green', rank: 6, icons: '✅✔☑🟢🎉🚀' },
]

export function statusMark(status) {
  const icon = ((status || '').match(/^\p{Extended_Pictographic}/u) || [])[0]
  const found = icon && STATUS_MARKS.find((entry) => entry.icons.includes(icon))
  return found || { glyph: status ? '·' : ' ', color: undefined, rank: 5 }
}

export function shortAge(age) {
  if (age === 'just now') return 'now'
  if (age === 'yesterday') return '1d'
  return age.replace(/^(\d+) (min|h|d) ago$/, (_, count, unit) => count + (unit === 'min' ? 'm' : unit))
}

export function nameWidthOf(docs, folded) {
  const widths = docs.map((doc) => (doc.listName || shortName(doc)).length + 2)
  const foldedWidths = folded.map((doc) => (doc.scope || '').length + 1 + shortName(doc).length)
  return Math.max(MIN_NAME_WIDTH, ...widths, ...foldedWidths)
}

export function plainStatus(status) {
  return (status || '').replace(/^(\p{Extended_Pictographic}️?|·)\s*/u, '')
}

export function folderOf(doc) {
  return doc.scope || 'tasks'
}

export function taskFolders(docs) {
  const folders = []
  docs.forEach((doc) => {
    const name = folderOf(doc)
    const folder = folders.find((entry) => entry.name === name) || folders[folders.push({ name, docs: [] }) - 1]
    folder.docs.push(doc)
  })
  folders.forEach((folder) => {
    folder.docs.sort((a, b) => (b.hub ? 1 : 0) - (a.hub ? 1 : 0) || attentionRank(a) - attentionRank(b))
    folder.main = folder.docs[0].hub ? folder.docs[0].name : ''
  })
  return folders
}

export const CHAIN_SECTIONS = [
  { name: 'Loaded every session', showScope: true, has: (doc) => !doc.scope.startsWith('nested:') && !doc.companion },
  { name: 'Nested · load when touched', has: (doc) => doc.scope.startsWith('nested:') },
  { name: 'Global companions · on demand', ranked: true, has: (doc) => doc.scope === 'companion' },
  { name: 'Project companions · on demand', ranked: true, has: (doc) => doc.scope === 'project companion' },
  { name: 'Global local companions · this machine only', ranked: true, has: (doc) => doc.scope === 'local companion' },
  { name: 'Project local companions · this machine only', ranked: true, has: (doc) => doc.scope === 'local project companion' },
]

export function attentionRank(doc) {
  if (isHeavy(doc)) return 0
  const rank = statusMark(doc.status).rank
  return rank > 3 && docGauge(doc).near ? 3 : rank
}

export function chainSections(docs) {
  return CHAIN_SECTIONS.map((section) => {
    const own = docs.filter((doc) => section.has(doc))
    return { ...section, docs: section.ranked ? own.sort((a, b) => attentionRank(a) - attentionRank(b)) : own }
  }).filter((section) => section.docs.length)
}

export function loadingNote() {
  const loading = state.docsLoading
  if (!loading) return ''
  if (loading.listing) return state.docs.length ? 'Refreshing…' : ''
  return loading.total && loading.done < loading.total ? 'Reading ' + loading.done + ' of ' + loading.total : ''
}

export function listView($, c) {
  const { Box, Text, Button, Input, redraw, bindField } = c
  const gap = (key) => Text({ key: 'gap-' + key, children: ' ' })
  const desktop = isDesktop(c.e)
  if (!desktop) {
    state.noTopFloat = true
    state.redrawEveryScroll = true
  }
  state.listNameWidth = nameWidthOf(state.docs, recentDocs())
  const header = (key, title) =>
    desktop
      ? Box({ key: 'sec-' + key, flexDirection: 'column', marginTop: 1, children: [strip(c, { key, title })] })
      : Box({ key: 'sec-' + key, flexDirection: 'column', children: [gap(key), Text({ key, bold: true, children: title })] })
  const needle = state.filter.trim().toLowerCase()
  const note = loadingNote()
  const topRow = (prefix) =>
    Box({
      key: prefix + 'list-top',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 2,
      children: [
        Text({ dimColor: true, children: 'Pick a doc to read' }),
        ...(note ? [Text({ key: prefix + 'list-loading', dimColor: true, children: note })] : []),
        ...(state.version ? [Text({ key: prefix + 'list-version', dimColor: true, children: 'mod v' + state.version })] : []),
        ...(!desktop && !prefix
          ? [Button({ key: 'list-top-u', label: '↑ Top', plain: true, hotkey: 'u', onPress: () => hostUiScroll($, { in: PANE, to: 'start', block: 'start' }).then(() => hostUiInvalidate($, 'ui.render')) })]
          : []),
      ],
    })
  const filterField = (prefix) =>
    Input({
      key: prefix + 'filter',
      label: 'Filter',
      placeholder: 'type to filter docs',
      value: state.filter,
      ...liveOnly(prefix, { autoFocus: true }),
      onInput: bindField('filter'),
      onSubmit: bindField('filter'),
    })
  state.stickyTop = (prefix) => Box({ key: prefix + 'list-pin', flexDirection: 'column', children: [topRow(prefix), filterField(prefix)] })
  const rows = [topRow(''), filterField('')]
  if (needle) {
    const matches = state.docs
      .filter((doc) => (doc.label + ' ' + doc.group + ' ' + (doc.scope || '')).toLowerCase().includes(needle))
      .slice(0, 40)
    rows.push(header('h-match', 'MATCHES (' + matches.length + ')'))
    rows.push(...docRowsFor(c, matches, 'f'))
    if (!matches.length) rows.push(Text({ dimColor: true, children: 'No doc matches that.' }))
    return Box({ flexDirection: 'column', children: rows })
  }
  const heavy = heavyDocs()
  const counting = Boolean(state.docsLoading)
  const heavyCount = heavy.length + (counting ? '…' : '')
  if (state.heavyOnly) {
    rows.push(header('h-heavy', 'DOCS OVER THE SIZE LIMIT (' + heavyCount + ')'))
    rows.push(...docRowsFor(c, heavy, 'y'))
    if (!heavy.length) rows.push(Text({ dimColor: true, children: counting ? 'Still reading docs…' : 'Nothing is over the limit.' }))
    rows.push(
      Button({
        key: 'show-all',
        label: 'Show all docs',
        plain: true,
        onPress: () => {
          state.heavyOnly = false
          redraw()
        },
      }),
    )
    return Box({ flexDirection: 'column', children: rows })
  }
  const items = []
  const push = (element, height = 1) => items.push({ height, make: () => element })
  const pushHeader = (element) => items.push({ height: headerRows, make: () => element, sticky: null })
  const headerRows = desktop ? DESKTOP_STRIP_ROWS + 1 : 2
  const taskCount = state.docs.filter((doc) => doc.group === 'Task docs').length
  const foldByDefault = desktop && taskCount > LIST_FOLD_FROM
  const isOpen = (key, closedByDefault) => (key in state.collapsed ? !state.collapsed[key] : !closedByDefault)
  const recent = recentDocs()
  if (recent.length) {
    pushHeader(header('h-recent', 'CHANGED LATELY'))
    docRowsFor(c, recent, 'r').forEach((row) => push(row))
  }
  if (heavy.length) {
    push(gap('heavy'))
    push(
      Button({
        key: 'show-heavy',
        label: '⚠ ' + heavyCount + ' over the size limit · show',
        plain: true,
        onPress: () => {
          state.heavyOnly = true
          redraw()
        },
      }),
    )
  }
  GROUPS.forEach((group) => {
    const inGroup = state.docs.filter((doc) => doc.group === group)
    if (!inGroup.length) return
    const rest = group === 'Task docs' ? inGroup : inGroup.filter((doc) => !recent.includes(doc))
    if (!rest.length) return
    const title =
      group === 'Task docs'
        ? 'TASK DOCS (' + inGroup.length + ')'
        : group === 'Skills'
          ? 'SYAFIQKIT SKILLS (' + inGroup.length + ')'
          : group.toUpperCase()
    if (desktop && group === 'Skills') {
      const open = isOpen('grp:Skills', true)
      const fold = () => {
        state.collapsed['grp:Skills'] = open
        redraw()
      }
      pushHeader(Box({ key: 'sec-h-' + group, flexDirection: 'column', marginTop: 1, children: [strip(c, { key: 'h-' + group, title: (open ? '▾ ' : '▸ ') + title, onPress: fold })] }))
      if (open) rest.forEach((doc) => push(docRow(c, doc, 'd' + state.docs.indexOf(doc), false)))
      return
    }
    pushHeader(header('h-' + group, title))
    if (group !== 'Task docs' && group !== 'CLAUDE.md chain') {
      rest.forEach((doc) => push(docRow(c, doc, 'd' + state.docs.indexOf(doc), false)))
      return
    }
    const folders = group === 'Task docs' ? taskFolders(rest) : chainSections(rest)
    folders.forEach((folder) => {
      const open = isOpen('dir:' + folder.name, group === 'Task docs' && foldByDefault)
      const flagged = folder.docs.filter(isHeavy).length
      const fold = () => {
        state.collapsed['dir:' + folder.name] = open
        redraw()
      }
      if (desktop) {
        const folderHead = (prefix) =>
          Box({
            key: prefix + 'fold-' + folder.name,
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 1,
            paddingX: 1,
            children: [
              Button({ key: prefix + 'fold-' + folder.name + 'b', plain: true, label: (open ? '▾ ' : '▸ ') + folder.name, onPress: fold }),
              Text({
                key: prefix + 'fold-' + folder.name + 'c',
                dimColor: true,
                children: String(folder.docs.length) + (folder.main ? ' · main: ' + folder.main : ''),
              }),
              ...(flagged ? [chip(c, prefix + 'fold-' + folder.name + 'w', '⚠ ' + flagged, 'warn')] : []),
            ],
          })
        items.push({ height: 1, make: () => folderHead(''), sticky: open ? folderHead : null })
        if (open) folder.docs.forEach((doc) => push(docRow(c, doc, 'd' + state.docs.indexOf(doc), Boolean(folder.showScope), true)))
        return
      }
      push(
        Button({
          key: 'fold-' + folder.name,
          label:
            (open ? '▾ ' : '▸ ') +
            folder.name +
            ' (' +
            folder.docs.length +
            (folder.main ? ' · main: ' + folder.main : '') +
            ')' +
            (flagged ? '  ⚠ ' + flagged + ' over limit' : ''),
          plain: true,
          onPress: () => {
            state.collapsed['dir:' + folder.name] = open
            redraw()
          },
        }),
      )
      if (open) folder.docs.forEach((doc) => push(docRow(c, doc, 'd' + state.docs.indexOf(doc), Boolean(folder.showScope), true)))
    })
  })
  if (!state.docs.length) push(Text({ dimColor: true, children: state.error || (state.docsLoading ? 'Listing docs…' : 'No docs found from here.') }))
  return Box({ flexDirection: 'column', children: [...rows, ...windowedRows(c, items, LIST_TOP_ROWS)] })
}
