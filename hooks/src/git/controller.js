const CHANGE_VIEWS = new Set(['changes', 'change-file', 'change-all', 'discard'])

const redrawPane = ($) => $.ui.invalidate('ui.render')

const loadChanges = async ($) => {
  if (!state.cwd) state.cwd = await $.session.cwd()
  const root = state.repoRoot
  if (!root && Object.keys(state.repoHidden).length) return false
  const next = await readStatus($, root || state.cwd, true)
  if (root !== state.repoRoot) return false
  const same = state.changes.loaded && next.raw === state.changes.raw && next.error === state.changes.error
  state.changes = { ...next, loaded: true }
  if (!root || root === state.repoFound[0]) state.changeCount = next.entries.filter((entry) => entry.x !== '?').length
  if (root) state.repoCounts[root] = next.entries.length
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

const loadAllDiffs = async ($, force = false) => {
  state.diffGen += 1
  const generation = state.diffGen
  const root = state.repoRoot
  const repo = state.changes.repo
  const sizes = numstatOf(state.changes.raw)
  const wanted = []
  for (const plane of ['worktree', 'staged']) {
    for (const entry of sectionEntries(state.changes.entries, plane)) {
      if (!entryInFocus(state.changeFocus, plane, entry)) continue
      wanted.push({ plane, entry, key: plane + ':' + entry.path, sig: signatureOf(entry, sizes) })
    }
  }
  const cap = state.changeFocus ? MAX_FOCUSED_FILES : MAX_STACKED_FILES
  state.allTotal = wanted.length
  state.allCap = cap
  state.allTooMany = wanted.length > cap
  if (state.allTooMany) wanted.length = cap
  const stale = wanted.filter((target) => force || !target.sig || !state.allDiffs[target.key] || state.allSig[target.key] !== target.sig)
  for (let at = 0; at < stale.length; at += DIFF_BATCH) {
    const batch = await Promise.all(
      stale.slice(at, at + DIFF_BATCH).map(async (target) => ({
        key: target.key,
        sig: target.sig,
        diff: await readDiff($, repo, fileTargets(target.entry), target.plane),
      })),
    )
    if (root !== state.repoRoot) return
    for (const item of batch) {
      state.allDiffs[item.key] = item.diff
      state.allSig[item.key] = item.sig
    }
    redrawPane($)
    if (generation !== state.diffGen) return
  }
  state.allLoaded = true
}

const defaultFocus = () => (sectionEntries(state.changes.entries, 'worktree').length ? 'worktree:' : '')

const focusOn = ($, focus) => {
  state.changeFocus = focus
  redrawPane($)
  if (showsAllDiffs()) loadAllDiffs($, true).then(() => redrawPane($), () => {})
}

const resetRepoView = () => {
  state.diffGen += 1
  state.changeFocus = ''
  state.changeFile = null
  state.changeDiff = null
  state.allDiffs = {}
  state.allSig = {}
  state.allOpen = {}
  state.allFull = {}
  state.diffSectionClosed = {}
  state.allLoaded = false
  state.changesCollapsed = {}
  state.changes = { ...state.changes, loaded: false }
}

const refreshRepoList = async ($) => {
  if (!state.cwd) state.cwd = await $.session.cwd()
  state.repoFound = await discoverRepos($, state.cwd)
  const roots = visibleRepos()
  if (!state.repoRoot || !roots.includes(state.repoRoot)) {
    state.repoRoot = roots[0] || ''
    resetRepoView()
  }
  await countOtherRepos($)
}

const countOtherRepos = async ($) => {
  const roots = visibleRepos().filter((root) => root !== state.repoRoot)
  const counts = await Promise.all(roots.map((root) => countRepoChanges($, root)))
  roots.forEach((root, index) => {
    state.repoCounts[root] = counts[index]
  })
}

const selectRepo = async ($, root) => {
  if (root === state.repoRoot) {
    const key = 'repo:' + root
    state.changesCollapsed[key] = !state.changesCollapsed[key]
    return redrawPane($)
  }
  state.repoRoot = root
  resetRepoView()
  redrawPane($)
  await loadChanges($)
  state.changeFocus = defaultFocus()
  redrawPane($)
  if (showsAllDiffs()) await loadAllDiffs($)
  await countOtherRepos($)
  redrawPane($)
}

const addRepo = async ($, typed) => {
  const path = await resolveRepoPath($, typed)
  const root = await topLevelOf($, path)
  if (!typed.trim() || !root) {
    state.repoNote = 'Not a git repository: ' + (typed.trim() || '(empty)')
    return redrawPane($)
  }
  state.repoNote = ''
  state.repoForm = false
  state.repoPath = ''
  delete state.repoHidden[root]
  if (!state.repoManual.includes(root) && !state.repoFound.includes(root)) state.repoManual.push(root)
  state.repoCounts[root] = 0
  await selectRepo($, root)
}

const removeRepo = async ($, root) => {
  state.repoHidden[root] = true
  delete state.repoCounts[root]
  if (root !== state.repoRoot) return redrawPane($)
  const next = visibleRepos()[0] || ''
  state.repoRoot = ''
  if (next) return selectRepo($, next)
  resetRepoView()
  state.changes = { repo: '', entries: [], hasHead: false, error: '', raw: '', loaded: true }
  redrawPane($)
}

const showHiddenRepos = async ($) => {
  state.repoHidden = {}
  if (state.repoRoot) {
    await countOtherRepos($)
    return redrawPane($)
  }
  await refreshRepoList($)
  await loadChanges($)
  state.changeFocus = defaultFocus()
  redrawPane($)
  if (showsAllDiffs()) await loadAllDiffs($)
  redrawPane($)
}

const showsAllDiffs = () => state.view === 'change-all' || state.view === 'changes'

const openChangeAll = async ($) => {
  state.view = 'change-all'
  state.changeFocus = ''
  state.allDiffs = {}
  state.allOpen = {}
  state.allLoaded = false
  redrawPane($)
  await loadAllDiffs($)
  redrawPane($)
}

const refreshChanges = async ($) => {
  if (!CHANGE_VIEWS.has(state.view) || state.polling) return
  if (!state.repoRoot && Object.keys(state.repoHidden).length) return
  state.polling = true
  try {
    const changed = await loadChanges($)
    let redraw = changed
    state.pollTick += 1
    if (state.pollTick % REPO_COUNT_EVERY === 0 && visibleRepos().length > 1) {
      await countOtherRepos($)
      redraw = true
    }
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
  } finally {
    state.polling = false
  }
}

const watchChanges = ($) => {
  stopWatch()
  state.stop = $.clock.every(POLL_MS, () => refreshChanges($))
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
  state.docBack = null
  state.changes = { ...state.changes, loaded: false }
  state.changeFocus = ''
  state.diffSectionClosed = {}
  state.allLoaded = false
  state.isOpen = true
  redrawPane($)
  await refreshRepoList($)
  await loadChanges($)
  state.changeFocus = defaultFocus()
  redrawPane($)
  if (showsAllDiffs()) await loadAllDiffs($)
  redrawPane($)
  if (!state.isOpen || !CHANGE_VIEWS.has(state.view)) return
  watchChanges($)
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

const DOC_PATH = /(^|\/)(CLAUDE(\.local)?\.md|tasks\/(.+\/)?(current\.md|decisions\/[^/]+\.md)|docs\/[^/]+\.md|\.claude\/rules\/[^/]+\.md)$/

const isDocPath = (path) => DOC_PATH.test(path)

const docGroupOf = (path) => {
  if (/(^|\/)tasks\//.test(path)) return 'Task docs'
  if (/CLAUDE(\.local)?\.md$/.test(path)) return 'CLAUDE.md chain'
  return /\.claude\/rules\//.test(path) ? 'Rules' : 'Project docs'
}

const docAt = async ($, owner, path) => {
  try {
    state.docs = await discover($)
  } catch {}
  const found = state.docs.find((item) => item.path === owner)
  if (found) return found
  const folder = parentOf(owner)
  const files = docGroupOf(path) === 'Task docs' ? await safeList($, folder + '/decisions') : []
  return {
    group: docGroupOf(path),
    label: path,
    name: owner.split('/').pop(),
    scope: '',
    path: owner,
    decisions: files
      .filter((entry) => entry.kind === 'file' && entry.name.endsWith('.md'))
      .map((entry) => ({ name: entry.name, path: folder + '/decisions/' + entry.name, size: entry.size })),
  }
}

const openDocFromChanges = async ($, path, back) => {
  const absolute = state.changes.repo + '/' + path
  const decision = /\/decisions\/[^/]+\.md$/.test(absolute)
  const owner = decision ? absolute.replace(/\/decisions\/[^/]+$/, '/current.md') : absolute
  const doc = await docAt($, owner, path)
  const from = { view: back, file: state.changeFile, diffBack: state.diffBack }
  await loadDoc($, doc)
  state.docBack = from
  const file = decision && (doc.decisions || []).find((item) => item.path === absolute)
  if (file) {
    state.decisionOpen = absolute
    state.view = 'decision'
    state.decisionTexts[absolute] = await readDecision($, file)
  }
  redrawPane($)
}

const returnFromDoc = async ($) => {
  const from = state.docBack
  state.docBack = null
  stopWatch()
  state.selected = []
  state.current = null
  if (from && from.view === 'change-file' && from.file) {
    await showFileDiff($, from.file, from.diffBack)
  } else {
    state.view = from ? from.view : 'list'
    redrawPane($)
  }
  if (from) watchChanges($)
}

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
  focusOn($, sectionEntries(state.changes.entries, other).some(covers) ? other + ':' + path : '')
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
