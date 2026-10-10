const docRow = (c, doc, key) => {
  const { Box, Text, Button, pickAction } = c
  const when = agoOf(state.now, doc.mtime)
  const heavy = isHeavy(doc)
  const tail = heavy
    ? heavyNote(doc)
    : doc.status
      ? when.padEnd(11) + doc.status
      : when.padEnd(11) + kb(doc.size)
  const meta = clip(doc.scope || '', SCOPE_WIDTH - 1).padEnd(SCOPE_WIDTH) + tail
  return Box({
    key,
    flexDirection: 'row',
    columnGap: 2,
    children: [
      Button({
        key: key + 'b',
        label: clip(doc.name || doc.label, NAME_WIDTH).padEnd(NAME_WIDTH),
        plain: true,
        onPress: () => pickAction(doc),
      }),
      Text({ key: key + 'm', dimColor: !heavy, color: heavy ? 'yellow' : undefined, wrap: 'truncate-end', children: meta }),
    ],
  })
}

const listView = (c) => {
  const { Box, Text, Button, Input, goto, redraw, bindField } = c
  const header = (key, title) => Text({ key, bold: true, dimColor: true, children: title })
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
    matches.forEach((doc) => rows.push(docRow(c, doc, 'f' + state.docs.indexOf(doc))))
    if (!matches.length) rows.push(Text({ dimColor: true, children: 'No doc matches that.' }))
    return Box({ flexDirection: 'column', children: rows })
  }
  const heavy = heavyDocs()
  if (state.heavyOnly) {
    rows.push(header('h-heavy', 'DOCS OVER THE SIZE LIMIT (' + heavy.length + ')'))
    heavy.forEach((doc) => rows.push(docRow(c, doc, 'y' + state.docs.indexOf(doc))))
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
    recent.forEach((doc) => rows.push(docRow(c, doc, 'r' + state.docs.indexOf(doc))))
  }
  if (heavy.length) {
    rows.push(header('h-heavy', 'NEEDS SHRINKING (' + heavy.length + ')'))
    heavy.forEach((doc) => rows.push(docRow(c, doc, 'y' + state.docs.indexOf(doc))))
  }
  GROUPS.forEach((group) => {
    const inGroup = state.docs.filter((doc) => doc.group === group)
    if (!inGroup.length) return
    const title = group === 'Task docs' ? 'ALL TASK DOCS (' + inGroup.length + ')' : group.toUpperCase()
    rows.push(header('h-' + group, title))
    inGroup.forEach((doc) => rows.push(docRow(c, doc, 'd' + state.docs.indexOf(doc))))
  })
  if (!state.docs.length) rows.push(Text({ dimColor: true, children: state.error || 'No docs found from here.' }))
  return Box({ flexDirection: 'column', children: rows })
}
