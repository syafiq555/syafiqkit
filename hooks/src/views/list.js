import { DESKTOP_STRIP_ROWS, GROUPS, LIST_FOLD_FROM, LIST_TOP_ROWS, NAME_WIDTH, NARROW_COLUMNS, SCOPE_WIDTH } from '../core/constants.js'
import { agoOf, clip, clipStart, heavyNote, isHeavy } from '../core/format.js'
import { state } from '../core/state.js'
import { heavyDocs, recentDocs } from '../docs/discovery.js'
import { paneColumns } from './changes.js'
import { desktopDocRow, docGauge, windowedRows } from './desktop.js'
import { chip, isDesktop, liveOnly, strip, textMeter } from './ui.js'

export function docRow(c, doc, key, withScope, indent) {
  if (isDesktop(c.e)) return desktopDocRow(c, doc, key, withScope, indent)
  const { Box, Text, Button, pickAction } = c
  const heavy = isHeavy(doc)
  const pad = indent ? '  ' : ''
  const columns = paneColumns(c.e)
  const narrow = columns < NARROW_COLUMNS
  const nameWidth = Math.max(8, (narrow ? Math.min(NAME_WIDTH, Math.floor(columns * 0.45)) : NAME_WIDTH) - pad.length)
  const head = (withScope ? clip(doc.scope || '', SCOPE_WIDTH - 1).padEnd(SCOPE_WIDTH) : '') + agoOf(state.now, doc.mtime).padEnd(11)
  const gauge = docGauge(doc)
  const tail = [narrow && withScope ? doc.scope : '', doc.hub ? 'main doc' : '', heavy ? heavyNote(doc) : '', doc.status].filter(Boolean).join('  ')
  return Box({
    key,
    flexDirection: 'row',
    columnGap: 2,
    children: [
      Button({
        key: key + 'b',
        label: pad + (doc.listName ? clipStart(doc.listName, nameWidth) : clip(doc.name || doc.label, nameWidth)).padEnd(nameWidth),
        plain: true,
        onPress: () => pickAction(doc),
      }),
      ...(narrow
        ? []
        : [
            Text({ key: key + 'a', dimColor: true, wrap: 'truncate-end', children: head }),
            Text({
              key: key + 'g',
              dimColor: !heavy,
              color: heavy ? 'yellow' : undefined,
              children: textMeter(gauge.value, gauge.max, 6) + ' ' + gauge.label.padEnd(8),
            }),
          ]),
      Text({ key: key + 'm', dimColor: !heavy, color: heavy ? 'yellow' : undefined, wrap: 'truncate-end', children: tail }),
    ],
  })
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
    folder.docs.sort((a, b) => (b.hub ? 1 : 0) - (a.hub ? 1 : 0))
    folder.main = folder.docs[0].hub ? folder.docs[0].name : ''
  })
  return folders
}

export const CHAIN_SECTIONS = [
  { name: 'Loaded every session', showScope: true, has: (doc) => !doc.scope.startsWith('nested:') && !doc.scope.startsWith('companion') },
  { name: 'Nested · load when touched', has: (doc) => doc.scope.startsWith('nested:') },
  { name: 'Global companions · on demand', has: (doc) => doc.scope === 'companion' },
  { name: 'Project companions · on demand', has: (doc) => doc.scope === 'companion (this project)' },
]

export function chainSections(docs) {
  return CHAIN_SECTIONS.map((section) => ({ ...section, docs: docs.filter((doc) => section.has(doc)) })).filter((section) => section.docs.length)
}

export function listView(c) {
  const { Box, Text, Button, Input, goto, redraw, bindField } = c
  const gap = (key) => Text({ key: 'gap-' + key, children: ' ' })
  const desktop = isDesktop(c.e)
  const header = (key, title) =>
    desktop
      ? Box({ key: 'sec-' + key, flexDirection: 'column', marginTop: 1, children: [strip(c, { key, title })] })
      : Box({ key: 'sec-' + key, flexDirection: 'column', children: [gap(key), Text({ key, bold: true, children: title })] })
  const needle = state.filter.trim().toLowerCase()
  const topRow = (prefix) =>
    Box({
      key: prefix + 'list-top',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 2,
      children: [
        Button({
          key: prefix + 'to-menu',
          label: '< Menu',
          ...liveOnly(prefix, { hotkey: 'm' }),
          onPress: () => {
            state.pick = null
            state.heavyOnly = false
            goto('menu')
          },
        }),
        state.pick
          ? Text({ color: 'cyan', children: 'Pick a doc to ' + state.pick })
          : Text({ dimColor: true, children: 'Pick a doc to read' }),
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
    matches.forEach((doc) => rows.push(docRow(c, doc, 'f' + state.docs.indexOf(doc), true)))
    if (!matches.length) rows.push(Text({ dimColor: true, children: 'No doc matches that.' }))
    return Box({ flexDirection: 'column', children: rows })
  }
  const heavy = heavyDocs()
  if (state.heavyOnly) {
    rows.push(header('h-heavy', 'DOCS OVER THE SIZE LIMIT (' + heavy.length + ')'))
    heavy.forEach((doc) => rows.push(docRow(c, doc, 'y' + state.docs.indexOf(doc), true)))
    if (!heavy.length) rows.push(Text({ dimColor: true, children: 'Nothing is over the limit.' }))
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
    recent.forEach((doc) => push(docRow(c, doc, 'r' + state.docs.indexOf(doc), true)))
  }
  if (heavy.length) {
    push(gap('heavy'))
    push(
      Button({
        key: 'show-heavy',
        label: '⚠ ' + heavy.length + ' over the size limit · show',
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
            (flagged ? '  ⚠ ' + flagged : ''),
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
  if (!state.docs.length) push(Text({ dimColor: true, children: state.error || 'No docs found from here.' }))
  return Box({ flexDirection: 'column', children: [...rows, ...windowedRows(c, items, LIST_TOP_ROWS)] })
}
