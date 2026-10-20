import { COUNTS_WIDTH, DESKTOP_WRAP_CHARS, DIFF_MAX_LINES, SPLIT_MIN_COLUMNS, TREE_COLUMNS } from '../core/constants.js'
import { clip } from '../core/format.js'
import { state } from '../core/state.js'
import { openInViewer } from '../docs/gallery.js'
import { shape } from '../docs/markdown.js'
import { closePane } from '../docs/reader.js'
import { addRepo, askDiscard, fileTargets, focusOn, isDocPath, openChangeAll, openChangeFile, openDocFromChanges, orderedFiles, refreshChanges, refreshRepoList, removeRepo, selectRepo, showHiddenRepos, stageEverything, stageTargets, stageThese, toggleStageFocused, toggleStageFolder, toggleStageOpenFile, unstageEverything, unstageThese } from '../git/controller.js'
import { extOf, mediaCaption } from '../git/media.js'
import { repoNameOf, visibleRepos } from '../git/repos.js'
import { STATUS_COLOR, entryInFocus, letterOf, nameOf, sectionEntries, splitFocus, treeRows } from '../git/status.js'
import { diffPalette, highlightLines, syntaxSegmentStyle, syntaxSegments } from '../git/syntax.js'
import { desktopMediaItems, loadOneDiff, windowedRows } from './desktop.js'

export const PLANE_LABEL = { staged: 'staged', worktree: 'working tree', head: 'since the last commit' }

export const SECTION_TITLE = { staged: 'Staged Changes', worktree: 'Changes' }

export function clipMiddle(text, width) {
  if (text.length <= width) return text
  if (width <= 5) return text.slice(0, Math.max(1, width))
  const keep = width - 1
  const tail = Math.ceil(keep * 0.6)
  return text.slice(0, keep - tail) + '…' + text.slice(text.length - tail)
}

export function clipPathTail(text, width) {
  return (text.length <= width ? text : '…' + text.slice(text.length - Math.max(1, width - 1)))
}

export function clipPath(path, width) {
  if (path.length <= width) return path
  const cut = path.lastIndexOf('/')
  if (cut < 0) return clipMiddle(path, width)
  const name = path.slice(cut + 1)
  if (name.length + 2 > width) return clipMiddle(name, width)
  return clipPathTail(path.slice(0, cut), width - name.length - 1) + '/' + name
}

export function countsText(diff) {
  return (diff ? '+' + diff.added + ' −' + diff.removed : '')
}

export function activeFocus() {
  return (coversFocus(state.changeFocus) ? state.changeFocus : '')
}

export function diffIsOpen(key) {
  return state.allOpen[key] !== false
}

export function noDiffsText() {
  return (state.allLoaded ? 'Nothing changed.' : 'Reading diffs…')
}

export function lineNumberWidth(lines) {
  return String(Math.max(1, ...lines.map((line) => Math.max(line.oldNo, line.newNo)))).length
}

export function shownLines(key, diff) {
  return (state.allFull[key] === true ? diff.lines : diff.lines.slice(0, DIFF_MAX_LINES))
}

export function diffNoteItems(c, key, diff) {
  return diff.note ? [{ height: 1, make: () => c.Text({ key, dimColor: true, wrap: 'truncate', children: diff.note }) }] : []
}

export const mdRaw = {}

export function isNewMarkdown(path, diff) {
  return extOf(path) === 'md' && diff.lines.length > 0 && diff.removed === 0 && diff.lines.every((line) => line.kind === 'add')
}

export function markdownItems(c, key, diff) {
  const text = shape(diff.lines.map((line) => line.text).join('\n'))
  const rendered = mdRaw[key] !== true
  const choose = (raw) => () => {
    mdRaw[key] = raw
    c.redraw()
  }
  const toggle = {
    height: 1,
    make: () =>
      c.Box({
        key: key + '#t',
        flexDirection: 'row',
        columnGap: 1,
        children: [
          c.Button({ key: key + '#t-md', label: 'Rendered', variant: rendered ? 'primary' : 'secondary', onPress: choose(false) }),
          c.Button({ key: key + '#t-raw', label: 'Raw', variant: rendered ? 'secondary' : 'primary', onPress: choose(true) }),
        ],
      }),
  }
  const body = {
    height: text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / DESKTOP_WRAP_CHARS)), 0),
    make: () => c.Markdown({ key: key + '#md', text }),
  }
  return { toggle, body, rendered }
}

export function terminalMediaItems($, c, key, diff) {
  return [
  { height: 1, make: () => c.Text({ key: key + '-cap', dimColor: true, wrap: 'truncate', children: mediaCaption(diff.media) }) },
  {
    height: 1,
    make: () => c.Button({ key: key + '-open', label: 'Open in viewer', plain: true, onPress: () => openInViewer($, diff.media.abs) }),
  },
]
}

export function diffBodyItems($, c, key, path, diff, drawLines, desktop) {
  if (diff.media) {
    const media = desktop ? desktopMediaItems($, c, key + '#m', diff) : terminalMediaItems($, c, key + '#m', diff)
    return { items: media, plain: false }
  }
  const note = diffNoteItems(c, key + '#n', diff)
  if (!isNewMarkdown(path, diff)) return { items: [...note, ...drawLines()], plain: true }
  const md = markdownItems(c, key, diff)
  if (md.rendered) return { items: [...note, md.toggle, md.body], plain: false }
  return { items: [...note, md.toggle, ...drawLines()], plain: true }
}

export function moreLinesItem(c, key, hidden, onPress) {
  return ({
  height: 1,
  make: () => c.Button({ key, label: '… ' + hidden + ' more lines · show', plain: true, onPress }),
})
}

export function changesView($, c) {
  const { Box, Text, Button, Input, redraw, bindField } = c
  const ch = state.changes
  const wide = paneColumns(c.e) >= SPLIT_MIN_COLUMNS
  state.wide = wide
  const treeWidth = wide ? TREE_COLUMNS : Math.max(24, paneColumns(c.e) - 2)
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
        const room = Math.max(8, treeWidth - indent.length - 11 - count.length)
        return Box({
          key,
          flexDirection: 'row',
          columnGap: 1,
          children: [
            Button({
              key: key + 'b',
              plain: true,
              label: indent + (row.open ? '▾ ' : '▸ ') + clipPathTail(row.label + '/', room) + count,
              onPress: collapse,
            }),
            Button({ key: key + 'v', plain: true, label: 'view', onPress: () => openChangeAll($, plane + ':' + row.dirPath) }),
            Button({
              key: key + 's',
              label: plane === 'staged' ? '−' : '+',
              onPress: () => toggleStageFolder($, plane, row.dirPath),
            }),
          ],
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
            onPress: () => focusOn($, state.changeFocus === folderKey ? '' : folderKey),
          }),
        ],
      })
    }
    const entry = row.entry
    const letter = letterOf(entry, plane)
    const focusKey = plane + ':' + entry.path
    const room = Math.max(8, treeWidth - indent.length - 4)
    const name = clipMiddle(nameOf(entry.path) + (entry.orig ? ' ← ' + nameOf(entry.orig) : ''), room)
    return Box({
      key,
      flexDirection: 'row',
      children: [
        Button({
          key: key + 'b',
          plain: true,
          label: indent + (state.changeFocus === focusKey ? '▶ ' : '  ') + name.padEnd(room) + ' ',
          onPress: () => {
            if (!wide) return openChangeFile($, entry, plane, 'changes')
            focusOn($, state.changeFocus === focusKey ? '' : focusKey)
          },
        }),
        Text({ key: key + 's', color: STATUS_COLOR[letter], bold: true, children: letter }),
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
                  onPress: () => focusOn($, state.changeFocus === plane + ':' ? '' : plane + ':'),
                }),
              ]
            : [
                Button({ key: plane + '-toggle', label: clip((closed ? '▸ ' : '▾ ') + caption, Math.min(26, treeWidth - 18)).padEnd(Math.min(26, treeWidth - 18)), plain: true, onPress: toggle }),
              ]),
          ...(entries.length && !wide
            ? [Button({ key: plane + '-view', label: 'view', onPress: () => openChangeAll($, plane + ':') })]
            : []),
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

  const roots = visibleRepos()
  const stacked = roots.length > 1
  const hiddenCount = Object.keys(state.repoHidden).length

  const repoHeader = (root) => {
    const active = root === state.repoRoot
    const open = active && !state.changesCollapsed['repo:' + root]
    const count = active ? ch.entries.length : state.repoCounts[root]
    const caption = (open ? '▾ ' : '▸ ') + clipMiddle(repoNameOf(root), Math.max(8, treeWidth - 12)) + (count === undefined ? '' : ' (' + count + ')')
    return Box({
      key: 'repo-' + root,
      flexDirection: 'row',
      columnGap: 1,
      children: [
        Button({ key: 'repo-b-' + root, label: caption, plain: true, onPress: () => selectRepo($, root) }),
        Button({ key: 'repo-x-' + root, label: '✕', plain: true, onPress: () => removeRepo($, root) }),
      ],
    })
  }

  const treeBody = () => {
    const body = wide
      ? [toolbar(), ...sections.flatMap(section)]
      : [Text({ key: 'tb-hint', dimColor: true, wrap: 'truncate-end', children: 'Press a file or "view" to see diffs' }), ...sections.flatMap(section)]
    if (!stacked) return body
    return roots.flatMap((root) => [
      repoHeader(root),
      ...(root === state.repoRoot && !state.changesCollapsed['repo:' + root] ? body : []),
    ])
  }

  return Box({
    flexDirection: 'column',
    children: [
      Box({
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 2,
        children: [
          Button({ key: 'ch-close', label: '< Close', hotkey: 'b', autoFocus: true, onPress: () => closePane($) }),
          ...(wide ? [] : [Button({ key: 'ch-all', label: 'All changes', hotkey: 'v', onPress: () => openChangeAll($) })]),
          Button({ key: 'ch-refresh', label: 'Refresh', hotkey: 'r', onPress: () => refreshRepoList($).then(() => refreshChanges($)) }),
          Button({
            key: 'ch-add',
            label: 'Add repo',
            hotkey: 'g',
            onPress: () => {
              state.repoForm = !state.repoForm
              state.repoNote = ''
              redraw()
            },
          }),
          ...(hiddenCount ? [Button({ key: 'ch-unhide', label: hiddenCount + ' hidden · show', onPress: () => showHiddenRepos($) })] : []),
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
      ...(state.repoNote ? [Text({ key: 'repo-note', color: 'red', children: state.repoNote })] : []),
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
                    children: treeBody(),
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
            : Box({ flexDirection: 'column', children: treeBody() }),
    ],
  })
}

export function paneColumns(e) {
  return (e.props && e.props.bodyColumns) || e.bodyColumns || 100
}

export function coversFocus(focus) {
  const parts = splitFocus(focus)
  if (!parts) return true
  const entries = sectionEntries(state.changes.entries, parts.plane)
  if (!parts.path) return entries.length > 0
  if (parts.path.endsWith('/')) return entries.some((entry) => entry.path.startsWith(parts.path))
  return entries.some((entry) => entry.path === parts.path)
}

export function focusTitle(focus) {
  if (!focus) return 'All changes'
  const cut = focus.indexOf(':')
  if (cut === focus.length - 1) return SECTION_TITLE[focus.slice(0, cut)] + ' only'
  return focus.endsWith('/') ? focus.slice(cut + 1) + ' · ' + SECTION_TITLE[focus.slice(0, cut)] : focus.slice(cut + 1)
}

export function showAllDiffSections($) {
  state.diffSectionClosed = {}
  focusOn($, '')
}

export function hiddenSectionHint($, c, focus) {
  const parts = splitFocus(focus)
  if (!parts) return []
  const other = parts.plane === 'staged' ? 'worktree' : 'staged'
  const target = other + ':' + parts.path
  const count = sectionEntries(state.changes.entries, other).filter((entry) => entryInFocus(target, other, entry)).length
  if (!count) return []
  const scope = !parts.path ? '' : parts.path.endsWith('/') ? ' in this folder' : ' for this file'
  return [
    c.Button({
      key: 'dc-hidden',
      label: SECTION_TITLE[other] + ' (' + count + ')' + scope + ' hidden · show',
      plain: true,
      onPress: () => (parts.path ? focusOn($, target) : showAllDiffSections($)),
    }),
  ]
}

export function diffColumn($, c) {
  const { Box, Text, Button } = c
  const focus = activeFocus()
  const shown = allDiffItems($, c, focus, true)
  const hints = hiddenSectionHint($, c, focus)
  const top = 3 + (state.repoForm ? 1 : 0) + (state.repoNote ? 1 : 0) + hints.length
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
                onPress: () => showAllDiffSections($),
              }),
            ]
          : []),
      ],
    }),
    ...hints,
    ...(shown.any
      ? windowedRows(c, shown.items, top)
      : [Text({ key: 'dc-empty', dimColor: true, children: noDiffsText() })]),
  ]
}

export function fileHeader($, c, entry, plane, open, pathWidth) {
  const { Box, Text, Button, redraw } = c
  const key = plane + ':' + entry.path
  const staged = plane === 'staged'
  const letter = letterOf(entry, plane)
  return Box({
    key: key + '#hd',
    flexDirection: 'row',
    columnGap: 1,
    backgroundColor: diffPalette(state.look).header,
    children: [
      Button({
        key: key + '#h',
        label: (open ? '▾ ' : '▸ ') + clipPath(entry.path, pathWidth).padEnd(pathWidth),
        plain: true,
        onPress: () => {
          state.allOpen[key] = !open
          redraw()
          if (!open && !state.allDiffs[key]) loadOneDiff($, entry, plane)
        },
      }),
      Text({ key: key + '#l', color: STATUS_COLOR[letter], bold: true, children: letter }),
      Text({ key: key + '#c', dimColor: true, children: countsText(state.allDiffs[key]).padEnd(pathWidth >= 16 ? COUNTS_WIDTH : 0) }),
      Button({
        key: key + '#m',
        label: staged ? '−' : '+',
        onPress: () => (staged ? unstageThese($, fileTargets(entry)) : stageThese($, stageTargets(entry))),
      }),
      ...(staged ? [] : [Button({ key: key + '#d', label: '↶', onPress: () => askDiscard($, entry) })]),
      ...(isDocPath(entry.path)
        ? [Button({ key: key + '#o', label: 'Doc', onPress: () => openDocFromChanges($, entry.path, state.view) })]
        : []),
    ],
  })
}

export function expandTabs(text) {
  return text.replace(/\t/g, '    ')
}

export function expandSpan(line) {
  return line.span ? [expandTabs(line.text.slice(0, line.span[0])).length, expandTabs(line.text.slice(0, line.span[1])).length] : undefined
}

export function terminalLineItems(c, line, key, numWidth, bodyWidth, tokens) {
  const { Box, Text } = c
  if (line.kind === 'gap') {
    return [{ height: 1, make: () => Text({ key, dimColor: true, wrap: 'truncate', children: '⋯ ' + line.hidden + ' hidden lines' }) }]
  }
  const isAdd = line.kind === 'add'
  const isDel = line.kind === 'del'
  const text = line.text
  const width = Math.max(10, bodyWidth)
  const gutter = String(isDel ? line.oldNo : line.newNo).padStart(numWidth) + ' ' + (isAdd ? '+' : isDel ? '−' : ' ') + ' '
  const palette = diffPalette(state.look)
  const background = isAdd || isDel ? { backgroundColor: isAdd ? palette.added : palette.removed } : {}
  const segments = syntaxSegments(text.length, tokens, line.span)
  const pieces = (from, to) =>
    segments
      .filter((segment) => segment.to > from && segment.from < to)
      .map((segment, index) =>
        Text({
          key: 'p' + index,
          ...syntaxSegmentStyle(segment, isAdd ? palette.addedWord : palette.removedWord),
          children: text.slice(Math.max(segment.from, from), Math.min(segment.to, to)),
        }),
      )
  const count = Math.max(1, Math.ceil(text.length / width))
  return Array.from({ length: count }, (_, part) => ({
    height: 1,
    make: () =>
      Box({
        key: part ? key + '.' + part : key,
        height: 1,
        flexShrink: 0,
        flexDirection: 'row',
        ...background,
        children: [
          Text({ key: 'g', dimColor: true, children: part ? ' '.repeat(gutter.length) : gutter }),
          Text({ key: 't', wrap: 'truncate', children: text.length ? pieces(part * width, (part + 1) * width) : ' ' }),
        ],
      }),
  }))
}

export function terminalDiffItems(c, lines, prefix, columnWidth, path) {
  const numWidth = lineNumberWidth(lines)
  const expanded = lines.map((line) => (line.kind === 'gap' ? line : { ...line, text: expandTabs(line.text), span: expandSpan(line) }))
  const tokens = highlightLines(expanded, path)
  return expanded.flatMap((line, index) => terminalLineItems(c, line, prefix + index, numWidth, columnWidth - numWidth - 3, tokens[index]))
}

export function allDiffItems($, c, only, beside) {
  const { Text, Button, redraw } = c
  const items = []
  const add = (make) => items.push({ height: 1, make })
  let any = false
  const columnWidth = beside ? paneColumns(c.e) - TREE_COLUMNS - 2 : paneColumns(c.e) - 2
  const pathWidth = Math.max(8, columnWidth - COUNTS_WIDTH - 26)
  for (const plane of ['worktree', 'staged']) {
    const files = orderedFiles(plane).filter((entry) => entryInFocus(only, plane, entry))
    if (!files.length) continue
    any = true
    const closed = !only && state.diffSectionClosed[plane] === true
    if (!only) {
      add(() =>
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
    for (const [index, entry] of (closed ? [] : files).entries()) {
      const key = plane + ':' + entry.path
      const diff = state.allDiffs[key]
      const open = diffIsOpen(key)
      if (index > 0) add(() => c.Box({ key: key + '#gap', height: 1, flexShrink: 0 }))
      add(() => fileHeader($, c, entry, plane, open, pathWidth))
      if (!open) continue
      if (!diff) {
        add(() => Text({ key: key + '#r', dimColor: true, children: '   Reading diff…' }))
        continue
      }
      const lines = shownLines(key, diff)
      const body = diffBodyItems($, c, key, entry.path, diff, () => terminalDiffItems(c, lines, key + '#', columnWidth, entry.path), false)
      items.push(...body.items)
      const hidden = diff.lines.length - lines.length
      if (body.plain && hidden > 0) {
        items.push(
          moreLinesItem(c, key + '#more', hidden, () => {
            state.allFull[key] = true
            redraw()
          }),
        )
      }
    }
    add(() => Text({ key: 'dg-' + plane, children: ' ' }))
  }
  return { items, any }
}

export function changeFileView($, c) {
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
        flexWrap: 'wrap',
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
          ...(file.entry && isDocPath(file.path)
            ? [Button({ key: 'cf-doc', label: 'Open doc', hotkey: 'o', onPress: () => openDocFromChanges($, file.path, 'change-file') })]
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
            children: windowedRows(
              c,
              diffBodyItems($, c, 'cf', file.path, diff, () => terminalDiffItems(c, diff.lines, 'l', paneColumns(c.e) - 2, file.path), false).items,
              3,
            ),
          }),
    ],
  })
}

export function changeAllView($, c) {
  const { Box, Text, Button, goto } = c
  const focus = activeFocus()
  const shown = allDiffItems($, c, focus, false)
  const status = state.allLoaded || !state.allStatus ? [] : [Text({ key: 'ca-status', dimColor: true, children: 'Diffs: ' + state.allStatus })]
  return Box({
    flexDirection: 'column',
    children: [
      Button({ key: 'ca-back', label: '< Back', hotkey: 'b', autoFocus: true, onPress: () => goto('changes') }),
      Text({ bold: true, children: focusTitle(focus) }),
      ...status,
      shown.any
        ? Box({ key: 'ca-list', flexDirection: 'column', children: windowedRows(c, shown.items, 2 + status.length) })
        : Text({ dimColor: true, children: noDiffsText() }),
    ],
  })
}
