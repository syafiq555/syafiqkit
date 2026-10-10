const docRow = (c, doc, key, withScope, indent) => {
  const { Box, Text, Button, pickAction } = c
  const heavy = isHeavy(doc)
  const pad = indent ? '  ' : ''
  const nameWidth = NAME_WIDTH - pad.length
  const head = (withScope ? clip(doc.scope || '', SCOPE_WIDTH - 1).padEnd(SCOPE_WIDTH) : '') + agoOf(state.now, doc.mtime).padEnd(11)
  const tail = [heavy ? heavyNote(doc) : '', doc.status || (heavy ? '' : kb(doc.size))].filter(Boolean).join('  ')
  return Box({
    key,
    flexDirection: 'row',
    columnGap: 2,
    children: [
      Button({
        key: key + 'b',
        label: pad + clip(doc.name || doc.label, nameWidth).padEnd(nameWidth),
        plain: true,
        onPress: () => pickAction(doc),
      }),
      Text({ key: key + 'a', dimColor: true, wrap: 'truncate-end', children: head }),
      Text({ key: key + 'm', dimColor: !heavy, color: heavy ? 'yellow' : undefined, wrap: 'truncate-end', children: tail }),
    ],
  })
}

const folderOf = (doc) => doc.scope || 'tasks'

const taskFolders = (docs) => {
  const folders = []
  docs.forEach((doc) => {
    const name = folderOf(doc)
    const folder = folders.find((entry) => entry.name === name) || folders[folders.push({ name, docs: [] }) - 1]
    folder.docs.push(doc)
  })
  return folders
}

const listView = (c) => {
  const { Box, Text, Button, Input, goto, redraw, bindField } = c
  const gap = (key) => Text({ key: 'gap-' + key, children: ' ' })
  const header = (key, title) => Box({ key: 'sec-' + key, flexDirection: 'column', children: [gap(key), Text({ key, bold: true, children: title })] })
  const needle = state.filter.trim().toLowerCase()
  const rows = [
    Box({
      key: 'list-top',
      flexDirection: 'row',
      columnGap: 2,
      children: [
        Button({
          key: 'to-menu',
          label: '< Menu',
          hotkey: 'm',
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
    }),
    Input({
      key: 'filter',
      label: 'Filter',
      placeholder: 'type to filter docs',
      value: state.filter,
      autoFocus: true,
      onInput: bindField('filter'),
      onSubmit: bindField('filter'),
    }),
  ]
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
  const recent = recentDocs()
  if (recent.length) {
    rows.push(header('h-recent', 'CHANGED LATELY'))
    recent.forEach((doc) => rows.push(docRow(c, doc, 'r' + state.docs.indexOf(doc), true)))
  }
  if (heavy.length) {
    rows.push(gap('heavy'))
    rows.push(
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
    const rest = inGroup.filter((doc) => !recent.includes(doc))
    if (!rest.length) return
    const title =
      group === 'Task docs'
        ? 'TASK DOCS (' + inGroup.length + ')' + (rest.length < inGroup.length ? ' · ' + recent.length + ' listed above' : '')
        : group === 'Skills'
          ? 'SYAFIQKIT SKILLS (' + inGroup.length + ')'
          : group.toUpperCase()
    rows.push(header('h-' + group, title))
    if (group !== 'Task docs') {
      rest.forEach((doc) => rows.push(docRow(c, doc, 'd' + state.docs.indexOf(doc), group === 'CLAUDE.md chain')))
      return
    }
    taskFolders(rest).forEach((folder) => {
      const open = !state.collapsed['dir:' + folder.name]
      const flagged = folder.docs.filter(isHeavy).length
      rows.push(
        Button({
          key: 'fold-' + folder.name,
          label: (open ? '▾ ' : '▸ ') + folder.name + ' (' + folder.docs.length + ')' + (flagged ? '  ⚠ ' + flagged : ''),
          plain: true,
          onPress: () => {
            state.collapsed['dir:' + folder.name] = open
            redraw()
          },
        }),
      )
      if (open) folder.docs.forEach((doc) => rows.push(docRow(c, doc, 'd' + state.docs.indexOf(doc), false, true)))
    })
  })
  if (!state.docs.length) rows.push(Text({ dimColor: true, children: state.error || 'No docs found from here.' }))
  return Box({ flexDirection: 'column', children: rows })
}
