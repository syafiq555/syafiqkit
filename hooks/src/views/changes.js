const PLANE_LABEL = { staged: 'staged', worktree: 'working tree', head: 'since the last commit' }

const SECTION_TITLE = { staged: 'Staged Changes', worktree: 'Changes' }

const clipMiddle = (text, width) => {
  if (text.length <= width) return text
  if (width <= 5) return text.slice(0, Math.max(1, width))
  const keep = width - 1
  const tail = Math.ceil(keep * 0.6)
  return text.slice(0, keep - tail) + '…' + text.slice(text.length - tail)
}

const clipPathTail = (text, width) => (text.length <= width ? text : '…' + text.slice(text.length - Math.max(1, width - 1)))

const clipPath = (path, width) => {
  if (path.length <= width) return path
  const cut = path.lastIndexOf('/')
  if (cut < 0) return clipMiddle(path, width)
  const name = path.slice(cut + 1)
  if (name.length + 2 > width) return clipMiddle(name, width)
  return clipPathTail(path.slice(0, cut), width - name.length - 1) + '/' + name
}

const diffRows = (c, diff, prefix, cap = DIFF_MAX_LINES, onMore = null) => {
  const { Box, Text, Button } = c
  const shown = diff.lines.slice(0, cap)
  const width = String(Math.max(1, ...shown.map((line) => Math.max(line.oldNo, line.newNo)))).length
  const num = (line) => String(line.kind === 'del' ? line.oldNo : line.newNo).padStart(width)
  const rows = shown.map((line, index) => {
    const key = prefix + index
    if (line.kind === 'gap') return Text({ key, dimColor: true, children: '⋯ ' + line.hidden + ' hidden lines' })
    const isAdd = line.kind === 'add'
    const isDel = line.kind === 'del'
    const sign = isAdd ? '+' : isDel ? '−' : ' '
    const wordColor = isAdd ? 'diffAddedWord' : 'diffRemovedWord'
    const body = line.span
      ? Text({
          children: [
            ...(line.span[0] > 0 ? [Text({ key: 'a', children: line.text.slice(0, line.span[0]) })] : []),
            Text({ key: 'b', backgroundColor: wordColor, children: line.text.slice(line.span[0], line.span[1]) || ' ' }),
            ...(line.span[1] < line.text.length ? [Text({ key: 'c', children: line.text.slice(line.span[1]) })] : []),
          ],
        })
      : Text({ children: line.text || ' ' })
    return Box({
      key,
      flexDirection: 'row',
      alignItems: 'flex-start',
      ...(isAdd ? { backgroundColor: 'diffAdded' } : isDel ? { backgroundColor: 'diffRemoved' } : {}),
      children: [
        Box({ flexShrink: 0, children: [Text({ dimColor: true, children: num(line) + ' ' + sign + ' ' })] }),
        Box({ flexGrow: 1, flexShrink: 1, children: [body] }),
      ],
    })
  })
  const hidden = diff.lines.length - shown.length
  if (hidden > 0) {
    const label = '… ' + hidden + ' more lines' + (onMore ? ' · show' : ' not shown')
    rows.push(
      onMore
        ? Button({ key: prefix + 'more', label, plain: true, onPress: onMore })
        : Text({ key: prefix + 'more', dimColor: true, children: label }),
    )
  }
  return rows
}

const countsText = (diff) => (diff ? '+' + diff.added + ' −' + diff.removed : '')

const changesView = ($, c) => {
  const { Box, Text, Button, redraw } = c
  const ch = state.changes
  const wide = paneColumns(c.e) >= SPLIT_MIN_COLUMNS
  state.wide = wide
  const treeWidth = wide ? TREE_COLUMNS : Math.max(40, paneColumns(c.e) - 2)
  const sections = ['staged', 'worktree']

  const treeRow = (row, plane, index) => {
    const key = plane + '-' + index
    const indent = ' '.repeat(row.depth * 2 + 1)
    if (row.kind === 'dir') {
      const count = ' (' + row.count + ')'
      const collapse = () => {
        state.changesCollapsed[row.key] = row.open
        redraw()
      }
      if (!wide) {
        const room = Math.max(8, treeWidth - indent.length - 2 - count.length)
        return Button({
          key: key + 'b',
          plain: true,
          label: indent + (row.open ? '▾ ' : '▸ ') + clipPathTail(row.label + '/', room) + count,
          onPress: collapse,
        })
      }
      const folderKey = plane + ':' + row.dirPath
      const room = Math.max(8, treeWidth - indent.length - 4 - count.length)
      return Box({
        key,
        flexDirection: 'row',
        columnGap: 1,
        children: [
          Button({ key: key + 'c', plain: true, label: indent + (row.open ? '▾' : '▸'), onPress: collapse }),
          Button({
            key: key + 'b',
            plain: true,
            label: (state.changeFocus === folderKey ? '▶ ' : '') + clipPathTail(row.label + '/', room) + count,
            onPress: () => {
              state.changeFocus = state.changeFocus === folderKey ? '' : folderKey
              redraw()
            },
          }),
        ],
      })
    }
    const entry = row.entry
    const letter = letterOf(entry, plane)
    const focusKey = plane + ':' + entry.path
    const room = Math.max(8, treeWidth - indent.length - 4)
    const name = clipMiddle(nameOf(entry.path) + (entry.orig ? ' ← ' + nameOf(entry.orig) : ''), room)
    return Button({
      key: key + 'b',
      plain: true,
      onPress: () => {
        if (!wide) return openChangeFile($, entry, plane, 'changes')
        state.changeFocus = state.changeFocus === focusKey ? '' : focusKey
        redraw()
      },
      children: [
        indent + (state.changeFocus === focusKey ? '▶ ' : '  ') + name.padEnd(room) + ' ',
        Text({ key: 's', color: STATUS_COLOR[letter], bold: true, children: letter }),
      ],
    })
  }

  const focusedEntry = () => {
    const focus = splitFocus(state.changeFocus)
    if (!focus) return null
    const entry = sectionEntries(ch.entries, focus.plane).find((item) => item.path === focus.path)
    return entry ? { plane: focus.plane, entry } : null
  }

  const focusedFolder = () => {
    const focus = splitFocus(state.changeFocus)
    if (!focus || !focus.path.endsWith('/')) return null
    const covered = sectionEntries(ch.entries, focus.plane).filter((item) => item.path.startsWith(focus.path))
    return covered.length ? { plane: focus.plane, path: focus.path, count: covered.length } : null
  }

  const toolbar = () => {
    const folder = focusedFolder()
    if (folder) {
      return Box({
        key: 'tb',
        flexDirection: 'row',
        columnGap: 1,
        children: [
          Button({
            key: 'tb-stage',
            label: folder.plane === 'staged' ? '− Unstage folder' : '+ Stage folder',
            hotkey: 's',
            onPress: () => toggleStageFocused($),
          }),
          Text({ key: 'tb-name', dimColor: true, wrap: 'truncate-end', children: folder.count + ' files' }),
        ],
      })
    }
    const picked = focusedEntry()
    if (!picked) {
      return Text({ key: 'tb-hint', dimColor: true, wrap: 'truncate-end', children: 'Pick a file or folder to stage or discard' })
    }
    const staged = picked.plane === 'staged'
    return Box({
      key: 'tb',
      flexDirection: 'row',
      columnGap: 1,
      children: [
        Button({ key: 'tb-stage', label: staged ? '− Unstage' : '+ Stage', hotkey: 's', onPress: () => toggleStageFocused($) }),
        ...(staged
          ? []
          : [Button({ key: 'tb-discard', label: '↶ Discard', hotkey: 'd', onPress: () => askDiscard($, picked.entry) })]),
        Text({
          key: 'tb-name',
          dimColor: true,
          wrap: 'truncate-end',
          children: staged ? 'Unstage first to discard' : nameOf(picked.entry.path),
        }),
      ],
    })
  }

  const section = (plane) => {
    const entries = sectionEntries(ch.entries, plane)
    const closed = Boolean(state.changesCollapsed['sec:' + plane])
    const staged = plane === 'staged'
    const caption = SECTION_TITLE[plane] + ' (' + entries.length + ')'
    const toggle = () => {
      state.changesCollapsed['sec:' + plane] = !closed
      redraw()
    }
    const rows = [
      Box({
        key: plane + '-head',
        flexDirection: 'row',
        columnGap: 1,
        children: [
          ...(wide
            ? [
                Button({ key: plane + '-toggle', label: closed ? '▸' : '▾', plain: true, onPress: toggle }),
                Button({
                  key: plane + '-focus',
                  label: ((state.changeFocus === plane + ':' ? '▶ ' : '  ') + caption).padEnd(24),
                  plain: true,
                  onPress: () => {
                    state.changeFocus = state.changeFocus === plane + ':' ? '' : plane + ':'
                    redraw()
                  },
                }),
              ]
            : [
                Button({ key: plane + '-toggle', label: ((closed ? '▸ ' : '▾ ') + caption).padEnd(26), plain: true, onPress: toggle }),
              ]),
          ...(entries.length
            ? [
                Button({
                  key: plane + '-all',
                  label: staged ? '− all' : '+ all',
                  hotkey: staged ? 'u' : 'a',
                  onPress: () => (staged ? unstageEverything($) : stageEverything($)),
                }),
              ]
            : []),
        ],
      }),
    ]
    if (closed) return rows
    if (!entries.length) rows.push(Text({ key: plane + '-none', dimColor: true, children: '   nothing here' }))
    treeRows(entries, plane, state.changesCollapsed).forEach((row, index) => rows.push(treeRow(row, plane, index)))
    rows.push(Text({ key: plane + '-gap', children: ' ' }))
    return rows
  }

  return Box({
    flexDirection: 'column',
    children: [
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Button({ key: 'ch-close', label: '< Close', hotkey: 'b', autoFocus: true, onPress: () => closePane($) }),
          ...(wide ? [] : [Button({ key: 'ch-all', label: 'All changes', hotkey: 'v', onPress: () => openChangeAll($) })]),
          Button({ key: 'ch-refresh', label: 'Refresh', hotkey: 'r', onPress: () => refreshChanges($) }),
        ],
      }),
      Text({
        bold: true,
        wrap: 'truncate-start',
        children: ch.repo ? 'Changes · ' + nameOf(ch.repo) : 'Changes',
      }),
      ch.error
        ? Text({ color: 'red', children: ch.error })
        : !ch.loaded
          ? Text({ dimColor: true, children: 'Reading git status…' })
          : wide
            ? Box({
                flexDirection: 'row',
                columnGap: 2,
                children: [
                  Box({
                    key: 'ch-tree',
                    flexDirection: 'column',
                    width: TREE_COLUMNS,
                    flexShrink: 0,
                    children: [toolbar(), ...sections.flatMap(section)],
                  }),
                  Box({
                    key: 'ch-diffs',
                    flexDirection: 'column',
                    width: Math.max(30, paneColumns(c.e) - TREE_COLUMNS - 2),
                    flexShrink: 0,
                    overflow: 'hidden',
                    children: diffColumn($, c),
                  }),
                ],
              })
            : Box({ flexDirection: 'column', children: sections.flatMap(section) }),
    ],
  })
}

const paneColumns = (e) => (e.props && e.props.bodyColumns) || e.bodyColumns || 100

const coversFocus = (focus) => {
  const parts = splitFocus(focus)
  if (!parts) return true
  const entries = sectionEntries(state.changes.entries, parts.plane)
  if (!parts.path) return entries.length > 0
  if (parts.path.endsWith('/')) return entries.some((entry) => entry.path.startsWith(parts.path))
  return entries.some((entry) => entry.path === parts.path)
}

const focusTitle = (focus) => {
  if (!focus) return 'All changes'
  const cut = focus.indexOf(':')
  if (cut === focus.length - 1) return SECTION_TITLE[focus.slice(0, cut)] + ' only'
  return focus.endsWith('/') ? focus.slice(cut + 1) + ' · ' + SECTION_TITLE[focus.slice(0, cut)] : focus.slice(cut + 1)
}

const diffColumn = ($, c) => {
  const { Box, Text, Button, redraw } = c
  const focus = coversFocus(state.changeFocus) ? state.changeFocus : ''
  const shown = allDiffBody($, c, focus)
  return [
    Box({
      key: 'dc-head',
      flexDirection: 'row',
      columnGap: 2,
      children: [
        Text({ bold: true, children: focusTitle(focus) }),
        ...(focus
          ? [
              Button({
                key: 'dc-all',
                label: 'Show all',
                hotkey: 'v',
                onPress: () => {
                  state.changeFocus = ''
                  state.diffSectionClosed = {}
                  redraw()
                },
              }),
            ]
          : []),
      ],
    }),
    ...(state.allTooMany
      ? [
          Text({
            key: 'dc-toomany',
            dimColor: true,
            wrap: 'truncate-end',
            children: 'Diffs shown for the first ' + MAX_STACKED_FILES + ' of ' + state.allTotal + ' files',
          }),
        ]
      : []),
    ...(shown.any
      ? shown.body
      : [
          Text({
            key: 'dc-empty',
            dimColor: true,
            children: state.allLoaded ? 'Nothing changed.' : 'Reading diffs…',
          }),
        ]),
  ]
}

const fileHeader = ($, c, entry, plane, open, pathWidth) => {
  const { Box, Text, Button, redraw } = c
  const key = plane + ':' + entry.path
  const staged = plane === 'staged'
  const letter = letterOf(entry, plane)
  return Box({
    key: key + '#hd',
    flexDirection: 'row',
    columnGap: 1,
    children: [
      Button({
        key: key + '#h',
        label: (open ? '▾ ' : '▸ ') + clipPath(entry.path, pathWidth).padEnd(pathWidth),
        plain: true,
        onPress: () => {
          state.allOpen[key] = !open
          redraw()
        },
      }),
      Text({ key: key + '#l', color: STATUS_COLOR[letter], bold: true, children: letter }),
      Text({ key: key + '#c', dimColor: true, children: countsText(state.allDiffs[key]).padEnd(COUNTS_WIDTH) }),
      Button({
        key: key + '#m',
        label: staged ? '−' : '+',
        onPress: () => (staged ? unstageThese($, fileTargets(entry)) : stageThese($, stageTargets(entry))),
      }),
      ...(staged ? [] : [Button({ key: key + '#d', label: '↶', onPress: () => askDiscard($, entry) })]),
    ],
  })
}

const allDiffBody = ($, c, only) => {
  const { Text, Button, redraw } = c
  const body = []
  let any = false
  let budget = DIFF_TOTAL_ROWS
  let collapsedForRoom = 0
  const columnWidth = state.wide ? paneColumns(c.e) - TREE_COLUMNS - 2 : paneColumns(c.e) - 2
  const pathWidth = Math.max(16, columnWidth - COUNTS_WIDTH - 20)
  for (const plane of ['worktree', 'staged']) {
    const files = orderedFiles(plane).filter((entry) => {
      if (!only || only === plane + ':' || only === plane + ':' + entry.path) return true
      return only.endsWith('/') && only.startsWith(plane + ':') && entry.path.startsWith(only.slice(plane.length + 1))
    })
    if (!files.length) continue
    any = true
    const closed = !only && state.diffSectionClosed[plane] === true
    if (!only) {
      body.push(
        Button({
          key: 'dt-' + plane,
          label: (closed ? '▸ ' : '▾ ') + SECTION_TITLE[plane] + ' (' + files.length + ')',
          plain: true,
          onPress: () => {
            state.diffSectionClosed[plane] = !closed
            redraw()
          },
        }),
      )
    }
    for (const entry of closed ? [] : files) {
      const key = plane + ':' + entry.path
      const diff = state.allDiffs[key]
      const explicit = state.allOpen[key]
      const fileFocus = Boolean(only) && !only.endsWith(':') && !only.endsWith('/')
      const open = explicit === undefined ? budget > 0 || fileFocus : explicit
      if (!open && explicit === undefined) collapsedForRoom += 1
      const full = fileFocus || state.allFull[key] === true
      const cap = full ? DIFF_MAX_LINES : explicit === true ? DIFF_AUTO_ROWS : Math.max(0, Math.min(DIFF_AUTO_ROWS, budget))
      body.push(fileHeader($, c, entry, plane, open, pathWidth))
      if (open && diff) {
        if (diff.note) body.push(Text({ key: key + '#n', dimColor: true, children: diff.note }))
        const rowCap = Math.max(cap, 20)
        body.push(
          ...diffRows(
            c,
            diff,
            key + '#',
            rowCap,
            full
              ? null
              : () => {
                  state.allFull[key] = true
                  redraw()
                },
          ),
        )
        if (!full) budget -= Math.min(diff.lines.length, rowCap)
      }
    }
    body.push(Text({ key: 'dg-' + plane, children: ' ' }))
  }
  if (collapsedForRoom && !only) {
    body.unshift(
      Text({
        key: 'dc-collapsed',
        dimColor: true,
        wrap: 'truncate-end',
        children: collapsedForRoom + ' files collapsed to save room · press a name to open',
      }),
    )
  }
  return { body, any }
}

const changeFileView = ($, c) => {
  const { Box, Text, Button, goto } = c
  const file = state.changeFile
  if (!file) return changesView($, c)
  const diff = state.changeDiff
  const files = file.entry && state.diffBack === 'changes' ? orderedFiles(file.plane) : []
  const at = files.findIndex((entry) => entry.path === file.path)
  const staged = file.plane === 'staged'
  const step = (key, label, hotkey, target) =>
    Button({ key, label, hotkey, onPress: () => openChangeFile($, target, file.plane, state.diffBack) })
  return Box({
    flexDirection: 'column',
    children: [
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Button({ key: 'cf-back', label: '< Back', hotkey: 'b', autoFocus: true, onPress: () => goto(state.diffBack) }),
          ...(at > 0 ? [step('cf-prev', '‹ Prev', 'p', files[at - 1])] : []),
          ...(at >= 0 && at < files.length - 1 ? [step('cf-next', 'Next ›', 'n', files[at + 1])] : []),
          ...(file.entry
            ? [
                Button({
                  key: 'cf-stage',
                  label: staged ? 'Unstage' : 'Stage',
                  hotkey: 's',
                  onPress: () => toggleStageOpenFile($),
                }),
              ]
            : []),
          ...(file.entry && !staged
            ? [Button({ key: 'cf-discard', label: 'Discard ⚠', hotkey: 'd', onPress: () => askDiscard($, file.entry) })]
            : []),
        ],
      }),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Text({ bold: true, wrap: 'truncate-start', children: file.path }),
          Text({ dimColor: true, children: [countsText(diff), PLANE_LABEL[file.plane]].filter(Boolean).join(' · ') }),
        ],
      }),
      Text({ children: ' ' }),
      !diff
        ? Text({ dimColor: true, children: 'Reading diff…' })
        : Box({
            flexDirection: 'column',
            children: [...(diff.note ? [Text({ key: 'cf-note', dimColor: true, children: diff.note })] : []), ...diffRows(c, diff, 'l')],
          }),
    ],
  })
}

const changeAllView = ($, c) => {
  const { Box, Text, Button, goto } = c
  const shown = allDiffBody($, c, '')
  return Box({
    flexDirection: 'column',
    children: [
      Button({ key: 'ca-back', label: '< Back', hotkey: 'b', autoFocus: true, onPress: () => goto('changes') }),
      Text({ bold: true, children: 'All changes' }),
      ...(state.allTooMany
        ? [
            Text({
              key: 'ca-toomany',
              dimColor: true,
              wrap: 'truncate-end',
              children: 'Diffs shown for the first ' + MAX_STACKED_FILES + ' of ' + state.allTotal + ' files',
            }),
          ]
        : []),
      shown.any
        ? Box({ flexDirection: 'column', children: shown.body })
        : Text({ dimColor: true, children: state.allLoaded ? 'Nothing changed.' : 'Reading diffs…' }),
    ],
  })
}

const discardView = ($, c) => {
  const { Box, Text, Button, goto } = c
  const pending = state.discard
  if (!pending) return changesView($, c)
  const entry = pending.entry
  const effect =
    entry.y === '?'
      ? 'Deletes this new file. It is not in git, so it cannot be recovered.'
      : "Throws away this file's uncommitted edits in the working tree. This cannot be undone." +
        (entry.x !== ' ' ? ' Edits already staged stay.' : '')
  return Box({
    flexDirection: 'column',
    children: [
      Text({ bold: true, children: 'Discard changes: ' + entry.path }),
      Text({ color: 'yellow', children: 'Effect: ' + effect }),
      Text({ children: ' ' }),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Button({ key: 'discard-yes', label: 'Discard ⚠', hotkey: 'y', onPress: () => confirmDiscard($) }),
          Button({
            key: 'discard-cancel',
            label: 'Cancel',
            hotkey: 'x',
            autoFocus: true,
            onPress: () => {
              state.discard = null
              goto(pending.back)
            },
          }),
        ],
      }),
    ],
  })
}
