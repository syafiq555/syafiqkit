const CHANGE_VIEWS = new Set(['changes', 'change-file', 'change-all', 'discard'])

const redrawPane = ($) => $.ui.invalidate('ui.render')

const loadChanges = async ($) => {
  if (!state.cwd) state.cwd = await $.session.cwd()
  const next = await readStatus($, state.cwd, true)
  const same = state.changes.loaded && next.raw === state.changes.raw && next.error === state.changes.error
  state.changes = { ...next, loaded: true }
  state.changeCount = next.entries.filter((entry) => entry.x !== '?').length
  return !same
}

const countChanges = async ($) => {
  if (state.disabled || state.isOpen) return
  if (!state.cwd) state.cwd = await $.session.cwd()
  const next = await readStatus($, state.cwd, false)
  if (next.entries.length === state.changeCount) return
  state.changeCount = next.entries.length
  redrawPane($)
}

const fileTargets = (entry) => (entry.orig ? [entry.orig, entry.path] : [entry.path])

const stageTargets = (entry) => [entry.path]

const orderedFiles = (plane) =>
  treeRows(sectionEntries(state.changes.entries, plane), plane, {})
    .filter((row) => row.kind === 'file')
    .map((row) => row.entry)

const loadAllDiffs = async ($) => {
  state.diffGen += 1
  const generation = state.diffGen
  const targets = []
  for (const plane of ['staged', 'worktree']) {
    for (const entry of sectionEntries(state.changes.entries, plane)) targets.push({ plane, entry })
  }
  state.allTotal = targets.length
  state.allTooMany = targets.length > MAX_STACKED_FILES
  targets.length = Math.min(targets.length, MAX_STACKED_FILES)
  const done = []
  for (let at = 0; at < targets.length; at += DIFF_BATCH) {
    const batch = targets.slice(at, at + DIFF_BATCH).map((target) =>
      readDiff($, state.changes.repo, fileTargets(target.entry), target.plane).then((diff) => ({
        key: target.plane + ':' + target.entry.path,
        diff,
      })),
    )
    done.push(...(await Promise.all(batch)))
    if (generation !== state.diffGen) return
  }
  state.allDiffs = {}
  for (const item of done) state.allDiffs[item.key] = item.diff
  state.allLoaded = true
}

const showsAllDiffs = () => state.view === 'change-all' || state.view === 'changes'

const openChangeAll = async ($) => {
  state.view = 'change-all'
  state.allDiffs = {}
  state.allOpen = {}
  state.allLoaded = false
  redrawPane($)
  await loadAllDiffs($)
  redrawPane($)
}

const refreshChanges = async ($) => {
  if (!CHANGE_VIEWS.has(state.view)) return
  try {
    const changed = await loadChanges($)
    let redraw = changed
    const file = state.changeFile
    if (state.view === 'change-file' && file && file.entry && state.changeDiff) {
      const fresh = await readDiff($, file.cwd, file.paths, file.plane)
      if (state.changeFile === file && JSON.stringify(fresh.lines) !== JSON.stringify(state.changeDiff.lines)) {
        state.changeDiff = fresh
        redraw = true
      }
    }
    if (showsAllDiffs() && changed) await loadAllDiffs($)
    if (redraw) redrawPane($)
  } catch {
    return
  }
}

const enterChanges = async ($) => {
  stopWatch()
  state.view = 'changes'
  state.current = null
  state.error = ''
  state.selected = []
  state.confirm = null
  state.discard = null
  state.changeFile = null
  state.changes = { ...state.changes, loaded: false }
  state.changeFocus = ''
  state.diffSectionClosed = {}
  state.allLoaded = false
  state.isOpen = true
  redrawPane($)
  await loadChanges($)
  state.changeFocus = sectionEntries(state.changes.entries, 'worktree').length ? 'worktree:' : ''
  redrawPane($)
  if (showsAllDiffs()) {
    await loadAllDiffs($)
    redrawPane($)
  }
  if (!state.isOpen || !CHANGE_VIEWS.has(state.view)) return
  stopWatch()
  state.stop = $.clock.every(POLL_MS, () => refreshChanges($))
}

const openChanges = async ($) => {
  try {
    await $.ui.open({ id: PANE, title: 'syafiqkit', focus: true, closeOnEscape: true, columns: 110 })
  } catch (error) {
    state.isOpen = false
    redrawPane($)
    throw error
  }
  await enterChanges($)
}

const showFileDiff = async ($, file, back) => {
  state.changeFile = file
  state.changeDiff = null
  state.diffBack = back
  state.view = 'change-file'
  redrawPane($)
  const diff = await readDiff($, file.cwd, file.paths, file.plane)
  if (state.changeFile !== file) return
  state.changeDiff = diff
  redrawPane($)
}

const openChangeFile = ($, entry, plane, back) =>
  showFileDiff($, { entry, plane, path: entry.path, paths: fileTargets(entry), cwd: state.changes.repo }, back)

const openDocDiff = ($, path, back) =>
  showFileDiff($, { entry: null, plane: 'head', path, paths: [path], cwd: parentOf(path) }, back)

const afterGit = async ($) => {
  await loadChanges($)
  if (showsAllDiffs()) await loadAllDiffs($)
  redrawPane($)
}

const stageThese = async ($, paths) => {
  await stagePaths($, paths)
  await afterGit($)
}

const unstageThese = async ($, paths) => {
  await unstagePaths($, paths)
  await afterGit($)
}

const stageEverything = async ($) => {
  await stageAll($)
  await afterGit($)
}

const unstageEverything = async ($) => {
  await unstageAll($)
  await afterGit($)
}

const toggleStageOpenFile = async ($) => {
  const file = state.changeFile
  if (!file || !file.entry) return
  const staging = file.plane === 'worktree'
  if (staging) await stagePaths($, stageTargets(file.entry))
  else await unstagePaths($, fileTargets(file.entry))
  await loadChanges($)
  if (!CHANGE_VIEWS.has(state.view)) return
  const other = staging ? 'staged' : 'worktree'
  const fresh = state.changes.entries.find((entry) => entry.path === file.path)
  if (fresh && sectionEntries([fresh], other).length) return openChangeFile($, fresh, other, state.diffBack)
  state.view = 'changes'
  redrawPane($)
}

const toggleStageFocused = async ($) => {
  const focus = splitFocus(state.changeFocus)
  if (!focus) return
  const { plane, path } = focus
  const isFolder = path.endsWith('/')
  const covers = (entry) => (isFolder ? entry.path.startsWith(path) : entry.path === path)
  const paths = sectionEntries(state.changes.entries, plane).filter(covers).flatMap(plane === 'staged' ? fileTargets : stageTargets)
  if (!paths.length) return
  if (plane === 'staged') await unstageThese($, paths)
  else await stageThese($, paths)
  const other = plane === 'staged' ? 'worktree' : 'staged'
  state.changeFocus = sectionEntries(state.changes.entries, other).some(covers) ? other + ':' + path : ''
  redrawPane($)
}

const askDiscard = ($, entry) => {
  state.discard = { entry, back: state.view }
  state.view = 'discard'
  redrawPane($)
}

const confirmDiscard = async ($) => {
  const pending = state.discard
  state.discard = null
  if (!pending) return
  if (await discardPath($, pending.entry)) $.ui.toast('Discarded ' + pending.entry.path)
  await loadChanges($)
  if (!CHANGE_VIEWS.has(state.view)) return
  state.view = 'changes'
  redrawPane($)
}
