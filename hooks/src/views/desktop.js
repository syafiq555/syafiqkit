const STATUS_TONE = { M: 'mod', A: 'add', U: 'add', D: 'del', R: 'ren', C: 'del' }

const lineCountOf = (sizes, entry, key) => {
  const diff = state.allDiffs[key]
  if (diff) return { added: diff.added, removed: diff.removed }
  const size = sizes[entry.path]
  if (!size || size.startsWith('-')) return { added: 0, removed: 0 }
  const [added, removed] = size.split('/').map(Number)
  return { added: added || 0, removed: removed || 0 }
}

const statusChip = (c, key, letter) =>
  c.Box({ key, width: 3, flexShrink: 0, children: [chip(c, key + 't', letter, STATUS_TONE[letter] || 'muted')] })

const shortFolder = (path) => {
  const parts = folderOfPath(path).split('/').filter(Boolean)
  return parts.length > 2 ? '…/' + parts.slice(-2).join('/') : parts.join('/')
}

const folderOfPath = (path) => {
  const cut = path.lastIndexOf('/')
  return cut < 0 ? '' : path.slice(0, cut)
}

const changeMap = ($, c, sizes) => {
  const { Box, Text } = c
  const files = []
  for (const plane of ['staged', 'worktree']) {
    for (const entry of orderedFiles(plane)) {
      const key = plane + ':' + entry.path
      const lines = lineCountOf(sizes, entry, key)
      files.push({ plane, entry, key, ...lines, weight: Math.max(1, Math.round(Math.log2(lines.added + lines.removed + 2))) })
    }
  }
  if (!files.length) return []
  let shown = files
  let total = shown.reduce((sum, file) => sum + file.weight, 0)
  while (total > DESKTOP_MAP_CELLS && shown.some((file) => file.weight > 1)) {
    shown = shown.map((file) => ({ ...file, weight: Math.max(1, file.weight - 1) }))
    total = shown.reduce((sum, file) => sum + file.weight, 0)
  }
  const extra = Math.max(0, shown.length - DESKTOP_MAP_CELLS)
  if (extra) shown = shown.slice(0, DESKTOP_MAP_CELLS)
  return [
    Box({
      key: 'map',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 0,
      children: [
        ...shown.map((file) =>
          mapBlock(c, {
            key: 'map-' + file.key,
            scope: hoverScope(file.key),
            added: file.added,
            removed: file.removed,
            cells: file.weight,
            onPress: () => openChangeFile($, file.entry, file.plane, 'changes'),
          }),
        ),
        ...(extra ? [Text({ key: 'map-more', dimColor: true, children: ' +' + extra })] : []),
      ],
    }),
  ]
}

const desktopChangesView = ($, c) => {
  const { Box, Text, Button, Input, redraw, bindField } = c
  const ch = state.changes
  state.wide = false
  const sizes = numstatOf(ch.raw || '')
  const roots = visibleRepos()
  const stacked = roots.length > 1
  const hiddenCount = Object.keys(state.repoHidden).length
  let totalAdded = 0
  let totalRemoved = 0
  for (const plane of ['staged', 'worktree']) {
    for (const entry of sectionEntries(ch.entries, plane)) {
      const lines = lineCountOf(sizes, entry, plane + ':' + entry.path)
      totalAdded += lines.added
      totalRemoved += lines.removed
    }
  }

  const fileRow = (row, plane, index) => {
    const entry = row.entry
    const letter = letterOf(entry, plane)
    const key = plane + ':' + entry.path
    const lines = lineCountOf(sizes, entry, key)
    const indent = row.depth * 2
    return Box({
      key: 'r-' + plane + '-' + index,
      height: 1,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 1,
      paddingLeft: 1 + indent,
      paddingRight: 1,
      hover: { scope: hoverScope(key), backgroundColor: DESKTOP_TONE.stripHot },
      children: [
        statusChip(c, 'r-' + plane + '-' + index + 's', letter),
        Box({
          key: 'r-' + plane + '-' + index + 'n',
          flexGrow: 1,
          flexShrink: 1,
          children: [
            Button({
              key: 'r-' + plane + '-' + index + 'b',
              plain: true,
              label: nameOf(entry.path) + (entry.orig ? ' ← ' + nameOf(entry.orig) : ''),
              onPress: () => openChangeFile($, entry, plane, 'changes'),
            }),
          ],
        }),
        counts(c, 'r-' + plane + '-' + index + 'c', lines.added, lines.removed),
      ],
    })
  }

  const folderRow = (row, plane, index) => {
    const collapse = () => {
      state.changesCollapsed[row.key] = row.open
      redraw()
    }
    const key = 'd-' + plane + '-' + index
    return Box({
      key,
      height: 1,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 1,
      paddingLeft: 1 + row.depth * 2,
      paddingRight: 1,
      children: [
        Box({
          key: key + 'n',
          flexGrow: 1,
          flexShrink: 1,
          children: [Button({ key: key + 'b', plain: true, label: (row.open ? '▾ ' : '▸ ') + row.label + '/', onPress: collapse })],
        }),
        Text({ key: key + 'c', dimColor: true, children: String(row.count) }),
        Button({ key: key + 'v', label: 'view ›', plain: true, onPress: () => openChangeAll($, plane + ':' + row.dirPath) }),
        Button({ key: key + 's', label: plane === 'staged' ? 'unstage' : 'stage', plain: true, onPress: () => toggleStageFolder($, plane, row.dirPath) }),
      ],
    })
  }

  const section = (plane) => {
    const entries = sectionEntries(ch.entries, plane)
    const closed = Boolean(state.changesCollapsed['sec:' + plane])
    const staged = plane === 'staged'
    const header = (prefix = '') =>
      strip(c, {
        key: prefix + 'sec-' + plane,
        title: (closed ? '▸ ' : '▾ ') + (staged ? 'STAGED' : 'CHANGES'),
        count: entries.length,
        onPress: () => {
          state.changesCollapsed['sec:' + plane] = !closed
          redraw()
        },
        right: entries.length
          ? [
              Button({ key: prefix + 'sec-' + plane + '-view', label: 'view ›', onPress: () => openChangeAll($, plane + ':') }),
              Button({
                key: prefix + 'sec-' + plane + '-all',
                label: staged ? 'Unstage all' : 'Stage all',
                ...liveOnly(prefix, { hotkey: staged ? 'u' : 'a' }),
                ...(staged ? {} : { variant: 'primary' }),
                onPress: () => (staged ? unstageEverything($) : stageEverything($)),
              }),
            ]
          : [],
      })
    const items = [
      {
        height: DESKTOP_STRIP_ROWS,
        make: () => Box({ key: 'sec-' + plane + '-w', height: DESKTOP_STRIP_ROWS, flexShrink: 0, flexDirection: 'column', justifyContent: 'center', children: [header()] }),
        sticky: (prefix) => header(prefix),
      },
    ]
    if (closed) return items
    if (!entries.length) {
      items.push({ height: 1, make: () => Text({ key: plane + '-none', dimColor: true, children: '  Nothing ' + (staged ? 'staged' : 'unstaged') + '.' }) })
    }
    treeRows(entries, plane, state.changesCollapsed).forEach((row, index) =>
      items.push({ height: 1, make: () => (row.kind === 'dir' ? folderRow(row, plane, index) : fileRow(row, plane, index)) }),
    )
    return items
  }

  const body = () => {
    if (ch.error) return [Text({ key: 'ch-err', color: 'error', children: ch.error })]
    if (!ch.loaded) return [Text({ key: 'ch-loading', dimColor: true, children: 'Reading git status…' })]
    if (!ch.entries.length) return [Text({ key: 'ch-clean', dimColor: true, children: 'Nothing changed. Edits Claude makes appear here.' })]
    const top = DESKTOP_PAGE_BAR_ROWS + DESKTOP_STRIP_ROWS + DESKTOP_MAP_ROWS + (stacked ? roots.length * DESKTOP_STRIP_ROWS : 0)
    return [
      ...changeMap($, c, sizes),
      Box({ key: 'ch-rows', flexDirection: 'column', children: windowedRows(c, [...section('staged'), ...section('worktree')], top) }),
    ]
  }

  const repoStrip = (root) => {
    const active = root === state.repoRoot
    const count = active ? ch.entries.length : state.repoCounts[root]
    return strip(c, {
      key: 'repo-' + root,
      title: (active ? '● ' : '○ ') + repoNameOf(root),
      count,
      hot: active,
      onPress: () => selectRepo($, root),
      right: [Button({ key: 'repo-x-' + root, label: '✕', plain: true, onPress: () => removeRepo($, root) })],
    })
  }

  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [
      pageBar(c, {
        back: { key: 'ch-close', label: '< Close', hotkey: 'b', onPress: () => closePane($) },
        actions: [
          { key: 'ch-all', label: 'All diffs', hotkey: 'v', primary: true, onPress: () => openChangeAll($) },
          { key: 'ch-refresh', label: 'Refresh', hotkey: 'r', onPress: () => refreshRepoList($).then(() => refreshChanges($)) },
          {
            key: 'ch-add',
            label: 'Add repo',
            hotkey: 'g',
            unpinned: true,
            onPress: () => {
              state.repoForm = !state.repoForm
              state.repoNote = ''
              redraw()
            },
          },
          ...(hiddenCount ? [{ key: 'ch-unhide', label: hiddenCount + ' hidden · show', onPress: () => showHiddenRepos($) }] : []),
        ],
      }),
      ...(state.repoForm
        ? [
            Input({
              key: 'repo-path',
              label: 'Repo',
              placeholder: 'folder of a git repo, e.g. ~/code/app (Remove only forgets it)',
              value: state.repoPath,
              autoFocus: true,
              onInput: bindField('repoPath'),
              onSubmit: (value) => addRepo($, typeof value === 'string' && value.trim() ? value : state.repoPath),
            }),
          ]
        : []),
      ...(state.repoNote ? [Text({ key: 'repo-note', color: 'error', children: state.repoNote })] : []),
      Box({
        key: 'ch-head',
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 2,
        children: [
          Text({ key: 'ch-title', bold: true, wrap: 'truncate-start', children: ch.repo ? repoNameOf(ch.repo) : 'Changes' }),
          Text({ key: 'ch-files', dimColor: true, children: ch.entries.length + (ch.entries.length === 1 ? ' file' : ' files') }),
          counts(c, 'ch-counts', totalAdded, totalRemoved),
        ],
      }),
      Box({
        key: 'ch-body',
        flexDirection: 'column',
        children: stacked
          ? roots.flatMap((root) => [repoStrip(root), ...(root === state.repoRoot ? body() : [])])
          : body(),
      }),
    ],
  })
}

const desktopGapRow = (c, line, key, width) => {
  const { Box, Text } = c
  return Box({
    key,
    height: 1,
    flexShrink: 0,
    paddingLeft: width + 3,
    backgroundColor: DESKTOP_TONE.gapRow,
    children: [Text({ dimColor: true, wrap: 'truncate', children: '⋯ ' + line.hidden + ' unchanged lines' })],
  })
}

const desktopDiffRow = (c, line, key, width, tokens) => {
  const { Box, Text } = c
  const isAdd = line.kind === 'add'
  const isDel = line.kind === 'del'
  const word = isAdd ? DESKTOP_DIFF.addedWord : DESKTOP_DIFF.removedWord
  const segments = syntaxSegments(line.text.length, tokens, line.span)
  const body = line.text
    ? Text({
        children: segments.map((segment, index) =>
          segment.tone || segment.mark
            ? Text({ key: 'w' + index, ...syntaxSegmentStyle(segment, word), children: line.text.slice(segment.from, segment.to) })
            : line.text.slice(segment.from, segment.to),
        ),
      })
    : Text({ children: ' ' })
  return Box({
    key,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...(isAdd || isDel ? { backgroundColor: isAdd ? DESKTOP_DIFF.added : DESKTOP_DIFF.removed } : {}),
    children: [
      Text({
        key: key + 'g',
        children: [
          Text({ key: key + 'n', dimColor: true, children: String(isDel ? line.oldNo : line.newNo).padStart(width) + ' ' }),
          Text({ key: key + 's', color: isAdd ? 'success' : isDel ? 'error' : undefined, children: (isAdd ? '+' : isDel ? '−' : ' ') + ' ' }),
        ],
      }),
      body,
    ],
  })
}

const loadOneDiff = async ($, entry, plane) => {
  const key = plane + ':' + entry.path
  const root = state.repoRoot
  const diff = await readDiff($, state.changes.repo, fileTargets(entry), plane)
  if (root !== state.repoRoot) return
  state.allDiffs[key] = diff
  redrawPane($)
}

const windowedRows = (c, items, topRows) => {
  const pageChanged = state.allScroll.view !== state.view
  const live = !pageChanged && c.e.props && c.e.props.scroll
  const view = live ? { view: state.view, offset: live.offset, body: live.bodyRows || state.allScroll.body } : state.allScroll
  if (pageChanged) state.allScroll = { view: state.view, offset: 0, body: state.allScroll.body }
  const bodyRows = view.body || WINDOW_ROWS
  const total = items.reduce((sum, item) => sum + item.height, 0)
  const offset = view.view === state.view ? Math.min(view.offset, Math.max(0, topRows + total - bodyRows)) : 0
  state.windowAt = offset
  state.windowed = true
  const from = offset - topRows - Math.ceil(bodyRows / 2)
  const to = offset - topRows + Math.ceil(bodyRows * 1.5)
  let y = 0
  let above = 0
  let below = 0
  const drawn = []
  for (const item of items) {
    const end = y + item.height
    if ('sticky' in item && y < offset - topRows + STICKY_COVER_ROWS) state.stickySection = item.sticky
    if (end <= from) above += item.height
    else if (y >= to) below += item.height
    else drawn.push(item.make())
    y = end
  }
  const spacer = (key, height) =>
    Array.from({ length: Math.ceil(height / SPACER_MAX_ROWS) }, (_, part) =>
      c.Box({ key: part ? key + part : key, height: Math.min(SPACER_MAX_ROWS, height - part * SPACER_MAX_ROWS), flexShrink: 0 }),
    )
  return [...spacer('w-above', above), ...drawn, ...spacer('w-below', below)]
}

const desktopGroups = (focus) =>
  ['worktree', 'staged']
    .map((plane) => ({ plane, files: orderedFiles(plane).filter((entry) => entryInFocus(focus, plane, entry)) }))
    .filter((group) => group.files.length)

const desktopFileStrip = ($, c, entry, plane, diff, toggle, prefix = '') => {
  const { Button } = c
  const key = prefix + plane + ':' + entry.path
  const staged = plane === 'staged'
  return c.Box({
    key: key + '#hd',
    height: DESKTOP_STRIP_ROWS,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 1,
    paddingX: 1,
    backgroundColor: DESKTOP_TONE.strip,
    hover: { scope: hoverScope(key), backgroundColor: DESKTOP_TONE.stripHot },
    children: [
      statusChip(c, key + '#l', letterOf(entry, plane)),
      c.Box({
        key: key + '#p',
        flexGrow: 1,
        flexShrink: 1,
        flexDirection: 'row',
        columnGap: 1,
        children: [
          Button({ key: key + '#h', plain: true, label: nameOf(entry.path), onPress: () => openChangeFile($, entry, plane, state.view) }),
          c.Text({ key: key + '#f', dimColor: true, wrap: 'truncate-start', children: shortFolder(entry.path) }),
        ],
      }),
      ...(diff ? [counts(c, key + '#c', diff.added, diff.removed)] : []),
      ...(toggle ? [Button({ key: key + '#t', label: toggle.open ? 'Hide' : 'Show diff ›', onPress: toggle.onPress })] : []),
      Button({
        key: key + '#m',
        label: staged ? 'Unstage' : 'Stage',
        onPress: () => (staged ? unstageThese($, fileTargets(entry)) : stageThese($, stageTargets(entry))),
      }),
      ...(staged ? [] : [Button({ key: key + '#d', label: 'Discard', onPress: () => askDiscard($, entry) })]),
      ...(isDocPath(entry.path) ? [Button({ key: key + '#o', label: 'Doc', onPress: () => openDocFromChanges($, entry.path, state.view) })] : []),
    ],
  })
}

const stageAllActions = ($, focus, groups) => {
  const parts = splitFocus(focus)
  if (parts && parts.path && !parts.path.endsWith('/')) return []
  return groups.map((group) => {
    const staged = group.plane === 'staged'
    const press = parts ? () => toggleStageFocused($) : () => (staged ? unstageEverything($) : stageEverything($))
    return { key: 'ca-' + group.plane + '-all', label: (staged ? 'Unstage all ' : 'Stage all ') + group.files.length, hotkey: staged ? 'u' : 'a', primary: !staged, onPress: press }
  })
}

const desktopChangeAllView = ($, c) => {
  const { Box, Text, goto, redraw } = c
  const focus = activeFocus()
  const groups = desktopGroups(focus)
  const fileCount = groups.reduce((sum, group) => sum + group.files.length, 0)
  const items = []
  const add = (height, make) => items.push({ height, make })
  for (const group of groups) {
    if (!focus || groups.length > 1) {
      const title = (group.plane === 'staged' ? 'STAGED' : 'CHANGES') + '  ' + group.files.length
      items.push({
        height: 2,
        make: () => Box({ key: 'dg-' + group.plane, height: 2, flexShrink: 0, alignItems: 'flex-end', children: [Text({ bold: true, children: title })] }),
        sticky: (prefix) => Text({ key: prefix + 'dg-' + group.plane, bold: true, children: title }),
      })
    }
    for (const entry of group.files) {
      const key = group.plane + ':' + entry.path
      const diff = state.allDiffs[key]
      const open = diffIsOpen(key)
      const toggle = {
        open,
        onPress: () => {
          state.allOpen[key] = !open
          redraw()
          if (!open && !diff) loadOneDiff($, entry, group.plane)
        },
      }
      items.push({
        height: DESKTOP_STRIP_ROWS,
        make: () => desktopFileStrip($, c, entry, group.plane, diff, toggle),
        sticky: (prefix) => desktopFileStrip($, c, entry, group.plane, diff, toggle, prefix),
      })
      if (!open) continue
      if (!diff) {
        add(1, () => Text({ key: key + '#r', dimColor: true, wrap: 'truncate', children: state.allLoaded ? 'Diff not read' : 'Reading diff…' }))
        continue
      }
      const shown = shownLines(key, diff)
      const body = diffBodyItems($, c, key, entry.path, diff, () => desktopDiffItems(c, shown, key + '#', entry.path), true)
      items.push(...body.items)
      const hidden = diff.lines.length - shown.length
      if (body.plain && hidden > 0) {
        items.push(
          moreLinesItem(c, key + '#more', hidden, () => {
            state.allFull[key] = true
            redraw()
          }),
        )
      }
    }
  }
  const reading = state.allLoaded || !state.allStatus ? '' : 'Reading diffs · ' + state.allStatus
  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [
      pageBar(c, {
        back: { key: 'ca-back', label: '< Back', hotkey: 'b', onPress: () => goto('changes') },
        actions: [...(focus ? [{ key: 'ca-all', label: 'Show all', hotkey: 'v', onPress: () => openChangeAll($) }] : []), ...stageAllActions($, focus, groups)],
        title: focusTitle(focus) + ' · ' + fileCount + (fileCount === 1 ? ' file' : ' files'),
        sub: reading,
      }),
      items.length
        ? Box({ key: 'ca-list', flexDirection: 'column', children: windowedRows(c, items, DESKTOP_PAGE_BAR_ROWS) })
        : Text({ key: 'ca-empty', dimColor: true, children: noDiffsText() }),
    ],
  })
}

const desktopDiffItems = (c, lines, prefix, path) => {
  const width = lineNumberWidth(lines)
  const tokens = highlightLines(lines, path)
  return lines.map((line, index) =>
    line.kind === 'gap'
      ? { height: 1, make: () => desktopGapRow(c, line, prefix + index, width) }
      : {
          height: Math.max(1, Math.ceil(line.text.length / DESKTOP_WRAP_CHARS)),
          make: () => desktopDiffRow(c, line, prefix + index, width, tokens[index]),
        },
  )
}

const mediaSides = (media) => {
  const pair = Boolean(media.before && media.after)
  if (pair) return [['Before', media.before], ['After', media.after]]
  if (media.after) return [[media.kind === 'pdf' ? 'Page 1' : media.isNew ? 'New' : 'Now', media.after]]
  if (media.before) return [['Removed', media.before]]
  return []
}

const desktopMediaItems = ($, c, key, diff) => {
  const { Box, Text, Button, Svg } = c
  const media = diff.media
  const sides = mediaSides(media)
  const caption = {
    height: 2,
    make: () =>
      Box({
        key: key + '-cap',
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 2,
        children: [
          Text({ dimColor: true, children: mediaCaption(media) }),
          Button({ key: key + '-open', label: 'Open in viewer', onPress: () => openInViewer($, media.abs) }),
        ],
      }),
  }
  if (!sides.length) {
    const why = media.kind === 'file' ? '' : 'No preview could be made here (needs macOS sips). Press Open in viewer.'
    return why ? [caption, { height: 1, make: () => Text({ key: key + '-none', dimColor: true, wrap: 'truncate', children: why }) }] : [caption]
  }
  const tallest = Math.max(...sides.map(([, side]) => side.svg.height))
  return [
    caption,
    {
      height: Math.ceil(tallest / MEDIA_ROW_PX) + 2,
      make: () =>
        Box({
          key: key + '-pics',
          flexDirection: 'row',
          columnGap: 2,
          children: sides.map(([label, side]) =>
            Box({
              key: key + '-side-' + label,
              flexDirection: 'column',
              children: [
                Text({ dimColor: true, children: label }),
                Svg({ source: side.svg.source, alt: label, width: side.svg.width, height: side.svg.height }),
              ],
            }),
          ),
        }),
    },
  ]
}

const desktopChangeFileView = ($, c) => {
  const { Box, Text, goto } = c
  const file = state.changeFile
  if (!file) return desktopChangesView($, c)
  const diff = state.changeDiff
  const files = file.entry && state.diffBack === 'changes' ? orderedFiles(file.plane) : []
  const at = files.findIndex((entry) => entry.path === file.path)
  const staged = file.plane === 'staged'
  const step = (key, label, hotkey, target) => ({ key, label, hotkey, onPress: () => openChangeFile($, target, file.plane, state.diffBack) })
  const head = (prefix) =>
    Box({
      key: prefix + 'cf-head',
      height: DESKTOP_STRIP_ROWS,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 1,
      paddingX: 1,
      backgroundColor: DESKTOP_TONE.strip,
      children: [
        ...(file.entry ? [statusChip(c, prefix + 'cf-l', letterOf(file.entry, file.plane))] : []),
        Text({ key: prefix + 'cf-name', bold: true, children: nameOf(file.path) }),
        Box({ key: prefix + 'cf-fold', flexGrow: 1, flexShrink: 1, children: [Text({ dimColor: true, wrap: 'truncate-start', children: folderOfPath(file.path) })] }),
        ...(diff ? [counts(c, prefix + 'cf-c', diff.added, diff.removed)] : []),
        Text({ key: prefix + 'cf-plane', dimColor: true, children: PLANE_LABEL[file.plane] + (at >= 0 ? ' · ' + (at + 1) + ' of ' + files.length : '') }),
      ],
    })
  state.stickySection = head
  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [
      pageBar(c, {
        back: { key: 'cf-back', label: '< Back', hotkey: 'b', onPress: () => goto(state.diffBack) },
        actions: [
          ...(at > 0 ? [step('cf-prev', '‹ Prev', 'p', files[at - 1])] : []),
          ...(at >= 0 && at < files.length - 1 ? [step('cf-next', 'Next ›', 'n', files[at + 1])] : []),
          ...(file.entry ? [{ key: 'cf-stage', label: staged ? 'Unstage' : 'Stage', hotkey: 's', primary: !staged, onPress: () => toggleStageOpenFile($) }] : []),
          ...(file.entry && !staged ? [{ key: 'cf-discard', label: 'Discard', hotkey: 'd', onPress: () => askDiscard($, file.entry) }] : []),
          ...(file.entry && isDocPath(file.path)
            ? [{ key: 'cf-doc', label: 'Open doc', hotkey: 'o', onPress: () => openDocFromChanges($, file.path, 'change-file') }]
            : []),
        ],
      }),
      head(''),
      !diff
        ? Text({ key: 'cf-reading', dimColor: true, children: 'Reading diff…' })
        : Box({
            key: 'cf-rows',
            flexDirection: 'column',
            children: windowedRows(
              c,
              diffBodyItems($, c, 'cf', file.path, diff, () => desktopDiffItems(c, diff.lines, 'l', file.path), true).items,
              DESKTOP_PAGE_BAR_ROWS + DESKTOP_STRIP_ROWS + 1,
            ),
          }),
    ],
  })
}

const docGauge = (doc) => {
  if (typeof doc.lines === 'number') {
    const max = isInstructionFile(doc) ? CLAUDE_MD_MAX_LINES : TASK_DOC_MAX_LINES
    return { value: doc.lines, max, label: doc.lines + '/' + max }
  }
  return { value: doc.size || 0, max: CLAUDE_MD_MAX_BYTES, label: kb(doc.size || 0) }
}

const desktopDocRow = (c, doc, key, withScope, indent) => {
  const { Box, Text, Button, pickAction } = c
  const heavy = isHeavy(doc)
  const gauge = docGauge(doc)
  const decisionsHeavy = oversizedDecisions(doc).length
  return Box({
    key,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 1,
    paddingLeft: indent ? 3 : 1,
    paddingRight: 1,
    hover: { backgroundColor: DESKTOP_TONE.stripHot },
    children: [
      Box({
        key: key + 'n',
        width: indent ? 22 : 24,
        flexShrink: 0,
        children: [Button({ key: key + 'b', label: docLabel(doc, indent ? 22 : 24), plain: true, onPress: () => pickAction(doc) })],
      }),
      Box({ key: key + 'g', width: 9, flexShrink: 0, children: [meter(c, key + 'm', gauge.value, gauge.max, 8)] }),
      Box({
        key: key + 'l',
        width: 10,
        flexShrink: 0,
        paddingLeft: 1,
        children: [Text({ key: key + 'lt', color: heavy ? 'warning' : undefined, dimColor: !heavy, children: gauge.label })],
      }),
      Box({ key: key + 'a', width: 9, flexShrink: 0, children: [Text({ dimColor: true, children: agoOf(state.now, doc.mtime) })] }),
      Box({
        key: key + 't',
        flexGrow: 1,
        flexShrink: 1,
        flexDirection: 'row',
        columnGap: 1,
        children: [
          ...(doc.hub ? [chip(c, key + 'hub', 'main doc', 'muted')] : []),
          ...(decisionsHeavy ? [chip(c, key + 'dc', '⚠ decisions', 'warn')] : []),
          ...(withScope && doc.scope ? [Text({ key: key + 's', dimColor: true, wrap: 'truncate-end', children: doc.scope })] : []),
          ...(doc.status ? [Text({ key: key + 'st', wrap: 'truncate-end', children: doc.status })] : []),
        ],
      }),
    ],
  })
}

const MENU_GROUPS = [
  { title: 'SHIP WORK', labels: ['Commit', 'Commit and push', 'Done', 'Ship'] },
  { title: 'DOCS', labels: ['Read a task doc', 'Shrink a doc', 'Refresh a doc', 'Merge docs'] },
  { title: 'SESSION', labels: ['Hand off', 'Changes', 'Images'] },
]

const desktopMenuView = ($, c) => {
  const { Box, Text, Button } = c
  const rows = []
  MENU_GROUPS.forEach((group) => {
    rows.push(Box({ key: 'mg-' + group.title, marginTop: rows.length ? 1 : 0, children: [strip(c, { key: 'mgs-' + group.title, title: group.title })] }))
    group.labels.forEach((label) => {
      const index = VERBS.findIndex((verb) => verb.label === label)
      if (index < 0) return
      const verb = VERBS[index]
      rows.push(
        Box({
          key: 'v' + index,
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 1,
          paddingX: 1,
          hover: { backgroundColor: DESKTOP_TONE.stripHot },
          children: [
            Box({
              key: 'vn' + index,
              width: 22,
              flexShrink: 0,
              children: [
                Button({
                  key: 'vb' + index,
                  label: verb.label,
                  ...(index < 9 ? { hotkey: String(index + 1) } : {}),
                  plain: true,
                  ...(index === 0 ? { autoFocus: true } : {}),
                  onPress: () => runVerb($, c, verb),
                }),
              ],
            }),
            Box({ key: 'vh' + index, flexGrow: 1, flexShrink: 1, children: [Text({ dimColor: true, wrap: 'truncate-end', children: verb.hint })] }),
            ...(verb.danger ? [chip(c, 'vd' + index, 'asks first', 'warn')] : []),
          ],
        }),
      )
    })
  })
  return Box({ flexDirection: 'column', children: [Text({ key: 'menu-title', bold: true, children: 'What do you want to do?' }), ...rows, Box({ key: 'menu-version', marginTop: 1, children: [Text({ dimColor: true, children: 'syafiqkit mod v' + MOD_VERSION })] })] })
}

let galleryPick = ''

const pngBytes = (image) => (image.png ? Math.floor((image.png.length * 3) / 4) : 0)

const desktopImagesView = ($, c) => {
  const { Box, Text, Button, Svg, redraw } = c
  const list = [...state.images].reverse()
  const close = { key: 'img-close', label: '< Close', hotkey: 'b', onPress: () => closePane($) }
  if (!list.length) {
    return Box({
      flexDirection: 'column',
      rowGap: 1,
      children: [pageBar(c, { back: close }), Text({ key: 'img-none', dimColor: true, children: 'No images yet. Ask Claude to show a screenshot and it appears here.' })],
    })
  }
  if (galleryPick && !list.some((image) => image.path === galleryPick)) galleryPick = ''
  const pick = (path) => {
    galleryPick = path
    redraw()
    const image = list.find((item) => item.path === path)
    if (image && slicesWanted(image)) ensureSlice($, image, image.slice || 0).then(redraw)
  }
  const stepSlice = (image, delta) => {
    image.slice = Math.max(0, Math.min(sliceGeometry(image.size).count - 1, (image.slice || 0) + delta))
    redraw()
    ensureSlice($, image, image.slice).then(redraw)
  }
  const zoomed = (image) => galleryPick === image.path && slicesWanted(image)
  const slicePicture = (image) => {
    const drawn = image.slices && image.slices[image.slice || 0]
    if (drawn) return Svg({ key: 'img-slice-' + image.path + '-' + (image.slice || 0), source: drawn.source, alt: image.name, width: drawn.width, height: drawn.height })
    if (image.slices && (image.slice || 0) in image.slices) return galleryPicture(c, image, true, 0)
    return Text({ key: 'img-cutting-' + image.path, dimColor: true, children: 'Cutting this part of the picture…' })
  }
  const chips = list.map((image, index) => {
    const drawable = Boolean(svgPicture(image))
    return Button({
      key: 'img-pick-' + image.path,
      label: String(index + 1) + ' · ' + (drawable ? kb(pngBytes(image)) : 'too big'),
      variant: galleryPick === image.path ? 'primary' : 'secondary',
      onPress: () => pick(galleryPick === image.path ? '' : image.path),
    })
  })
  const shown = galleryPick ? list.filter((image) => image.path === galleryPick) : list
  let room = DESKTOP_DRAW_CHARS
  const fits = (image) => {
    const picture = svgPicture(image)
    const size = picture ? picture.source.length : 0
    if (size > room) return false
    room -= size
    return true
  }
  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [
      pageBar(c, {
        back: close,
        actions: [
          {
            key: 'img-clear',
            label: 'Clear',
            hotkey: 'c',
            onPress: () => {
              state.images = []
              saveGallery($)
              galleryPick = ''
              redraw()
            },
          },
        ],
      }),
      Box({
        key: 'img-strip',
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 1,
        rowGap: 1,
        children: [Button({ key: 'img-pick-all', label: 'All ' + list.length, variant: galleryPick ? 'secondary' : 'primary', onPress: () => pick('') }), ...chips],
      }),
      ...shown.map((image) =>
        Box({
          key: 'img-' + image.path,
          flexDirection: 'column',
          children: [
            strip(c, {
              key: 'img-h-' + image.path,
              title: (list.indexOf(image) + 1) + '  ' + image.name,
              right: [
                ...(zoomed(image) && sliceGeometry(image.size).count > 1
                  ? [
                      Button({ key: 'img-up-' + image.path, label: '‹ Up', hotkey: 'p', onPress: () => stepSlice(image, -1) }),
                      Button({ key: 'img-down-' + image.path, label: 'Down ›', hotkey: 'n', onPress: () => stepSlice(image, 1) }),
                    ]
                  : []),
                Button({ key: 'img-open-' + image.path, label: 'Open in viewer', onPress: () => openInViewer($, image.path) }),
              ],
            }),
            Text({
              key: 'img-meta-' + image.path,
              dimColor: true,
              wrap: 'truncate-start',
              children: [
                image.size ? image.size.width + ' x ' + image.size.height : '',
                zoomed(image) && sliceGeometry(image.size).count > 1 ? 'part ' + ((image.slice || 0) + 1) + ' of ' + sliceGeometry(image.size).count : '',
                image.preview && !zoomed(image) ? 'smaller copy, full size in the viewer' : '',
                image.caption,
                image.path,
              ]
                .filter(Boolean)
                .join(' · '),
            }),
            zoomed(image)
              ? slicePicture(image)
              : fits(image)
              ? galleryPicture(c, image, true, 0)
              : Button({
                  key: 'img-room-' + image.path,
                  plain: true,
                  label: 'Not drawn with the others · press to show it alone',
                  onPress: () => pick(image.path),
                }),
          ],
        }),
      ),
    ],
  })
}
