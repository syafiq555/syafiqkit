import { hostClockEvery, hostSessionCwd, hostUiAsk, hostUiInvalidate, hostUiToast } from '../core/api.js'
import { DIFF_BATCH, POLL_MS, REPO_COUNT_EVERY } from '../core/constants.js'
import { messageOf, parentOf } from '../core/format.js'
import { modLog } from '../core/log.js'
import { invalidatePane, openPaneWindow, state } from '../core/state.js'
import { discover, safeList } from '../docs/discovery.js'
import { loadDoc, readDecision, stopWatch } from '../docs/reader.js'
import { readLook } from '../docs/typeset.js'
import { discardPath, stageAll, stagePaths, unstageAll, unstagePaths } from './actions.js'
import { readDiff } from './diff.js'
import { mediaStamp } from './media.js'
import { countRepoChanges, discoverRepos, repoNameOf, resolveRepoPath, topLevelOf, visibleRepos } from './repos.js'
import { entryInFocus, nameOf, numstatOf, readStatus, sectionEntries, signatureOf, splitFocus, treeRows } from './status.js'
import { activeFocus, diffIsOpen } from '../views/changes.js'

export const CHANGE_VIEWS = new Set(['changes', 'change-file', 'change-all'])
export const DISCARD_YES = 'Discard'

export function redrawPane($) {
  return hostUiInvalidate($, 'ui.render')
}

export async function loadChanges($) {
  if (!state.cwd) state.cwd = await hostSessionCwd($)
  if (!state.look) await readLook($)
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

export async function countChanges($) {
  if (state.disabled || (state.isOpen && CHANGE_VIEWS.has(state.view))) return
  if (!state.cwd) state.cwd = await hostSessionCwd($)
  const next = await readStatus($, state.cwd, false)
  if (next.entries.length === state.changeCount) return
  state.changeCount = next.entries.length
  redrawPane($)
}

export function fileTargets(entry) {
  return (entry.orig ? [entry.orig, entry.path] : [entry.path])
}

export function stageTargets(entry) {
  return [entry.path]
}

export function orderedFiles(plane) {
  return treeRows(sectionEntries(state.changes.entries, plane), plane, {})
    .filter((row) => row.kind === 'file')
    .map((row) => row.entry)
}

export async function loadAllDiffs($, force = false) {
  state.diffGen += 1
  const generation = state.diffGen
  const root = state.repoRoot
  const repo = state.changes.repo
  const sizes = numstatOf(state.changes.raw)
  const focus = activeFocus()
  const wanted = []
  for (const plane of ['worktree', 'staged']) {
    for (const entry of sectionEntries(state.changes.entries, plane)) {
      const key = plane + ':' + entry.path
      if (!entryInFocus(focus, plane, entry) || !diffIsOpen(key)) continue
      wanted.push({ plane, entry, key, sig: signatureOf(entry, sizes) })
    }
  }
  const stale = wanted.filter((target) => force || !target.sig || !state.allDiffs[target.key] || state.allSig[target.key] !== target.sig)
  const untrackedLast = [...stale.filter((target) => target.entry.y !== '?'), ...stale.filter((target) => target.entry.y === '?')]
  for (const [index, target] of untrackedLast.entries()) {
    if (generation !== state.diffGen) return
    if (!force && target.sig && state.allDiffs[target.key] && state.allSig[target.key] === target.sig) continue
    state.allStatus = 'reading ' + (index + 1) + ' of ' + untrackedLast.length + ': ' + nameOf(target.entry.path)
    if (index === 0) redrawPane($)
    const diff = await readDiff($, repo, fileTargets(target.entry), target.plane)
    if (root !== state.repoRoot) return
    state.allDiffs[target.key] = diff
    state.allSig[target.key] = target.sig
    if (generation !== state.diffGen) {
      invalidatePane($)
      return
    }
    state.allStatus = wanted.filter((item) => state.allDiffs[item.key]).length + ' of ' + wanted.length + ' read'
    if ((index + 1) % DIFF_BATCH === 0 || index < 3) invalidatePane($)
  }
  state.allLoaded = true
}

export function defaultFocus() {
  return (sectionEntries(state.changes.entries, 'worktree').length ? 'worktree:' : '')
}

export function focusOn($, focus) {
  state.changeFocus = focus
  redrawPane($)
  if (showsAllDiffs()) loadAllDiffs($, true).then(() => invalidatePane($), () => {})
}

export function resetRepoView() {
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

export async function refreshRepoList($) {
  if (!state.cwd) state.cwd = await hostSessionCwd($)
  state.repoFound = await discoverRepos($, state.cwd)
  const roots = visibleRepos()
  if (!state.repoRoot || !roots.includes(state.repoRoot)) {
    state.repoRoot = roots[0] || ''
    resetRepoView()
  }
  await countOtherRepos($)
}

export async function countOtherRepos($) {
  const roots = visibleRepos().filter((root) => root !== state.repoRoot)
  const counts = await Promise.all(roots.map((root) => countRepoChanges($, root)))
  roots.forEach((root, index) => {
    state.repoCounts[root] = counts[index]
  })
}

export async function selectRepo($, root) {
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

export async function addRepo($, typed) {
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

export async function removeRepo($, root) {
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

export async function showHiddenRepos($) {
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

export function showsAllDiffs() {
  return state.view === 'change-all' || state.view === 'changes'
}

export function openChangeAll($, focus = '') {
  state.view = 'change-all'
  state.changeFocus = focus
  state.allDiffs = {}
  state.allOpen = {}
  state.allScroll = { view: '', offset: 0, body: state.allScroll.body }
  state.allLoaded = false
  state.allStatus = 'starting'
  redrawPane($)
  loadAllDiffs($).then(
    () => redrawPane($),
    (error) => {
      state.allStatus = 'failed: ' + String((error && error.message) || error)
      modLog($, 'all diffs: ' + state.allStatus.slice(0, 200))
      redrawPane($)
    },
  )
}

export async function refreshChanges($) {
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
      if (state.changeFile === file && (JSON.stringify(fresh.lines) !== JSON.stringify(state.changeDiff.lines) || mediaStamp(fresh) !== mediaStamp(state.changeDiff))) {
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

export function watchChanges($) {
  stopWatch()
  state.stop = hostClockEvery($, POLL_MS, () => refreshChanges($))
}

export async function enterChanges($) {
  stopWatch()
  state.view = 'changes'
  state.allScroll = { view: '', offset: 0, body: state.allScroll.body }
  state.current = null
  state.error = ''
  state.selected = []
  state.confirm = null
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

export async function openChanges($, fromBand = false) {
  const wasOpen = fromBand && state.isOpen
  if (wasOpen && CHANGE_VIEWS.has(state.view)) return
  state.isOpen = true
  if (!wasOpen) await openPaneWindow($, 'changes')
  await enterChanges($)
}

export async function showFileDiff($, file, back) {
  state.changeFile = file
  state.changeDiff = null
  state.diffBack = back
  state.view = 'change-file'
  state.allScroll = { view: '', offset: 0, body: state.allScroll.body }
  redrawPane($)
  const diff = await readDiff($, file.cwd, file.paths, file.plane)
  if (state.changeFile !== file) return
  state.changeDiff = diff
  redrawPane($)
}

export function openChangeFile($, entry, plane, back) {
  return showFileDiff($, { entry, plane, path: entry.path, paths: fileTargets(entry), cwd: state.changes.repo }, back)
}

export function openDocDiff($, path, back) {
  return showFileDiff($, { entry: null, plane: 'head', path, paths: [path], cwd: parentOf(path) }, back)
}

export const DOC_PATH = /(^|\/)(CLAUDE(\.local)?\.md|tasks\/(.+\/)?(current\.md|decisions\/[^/]+\.md)|docs\/[^/]+\.md|\.claude\/rules\/[^/]+\.md)$/

export function isDocPath(path) {
  return DOC_PATH.test(path)
}

export function docGroupOf(path) {
  if (/(^|\/)tasks\//.test(path)) return 'Task docs'
  if (/CLAUDE(\.local)?\.md$/.test(path)) return 'CLAUDE.md chain'
  return /\.claude\/rules\//.test(path) ? 'Rules' : 'Project docs'
}

export async function docAt($, owner, path) {
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

export async function openDocFromChanges($, path, back) {
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

export async function returnFromDoc($) {
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

export async function afterGit($) {
  await loadChanges($)
  if (showsAllDiffs()) await loadAllDiffs($)
  redrawPane($)
}

export async function stageThese($, paths) {
  await stagePaths($, paths)
  await afterGit($)
}

export async function unstageThese($, paths) {
  await unstagePaths($, paths)
  await afterGit($)
}

export async function stageEverything($) {
  await stageAll($)
  await afterGit($)
}

export async function unstageEverything($) {
  await unstageAll($)
  await afterGit($)
}

export async function toggleStageOpenFile($) {
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

export async function toggleStageFocused($) {
  const focus = splitFocus(state.changeFocus)
  if (!focus) return
  const { plane, path } = focus
  const isFolder = !path || path.endsWith('/')
  const covers = (entry) => (isFolder ? entry.path.startsWith(path) : entry.path === path)
  const paths = sectionEntries(state.changes.entries, plane).filter(covers).flatMap(plane === 'staged' ? fileTargets : stageTargets)
  if (!paths.length) return
  if (!path) await (plane === 'staged' ? unstageEverything($) : stageEverything($))
  else if (plane === 'staged') await unstageThese($, paths)
  else await stageThese($, paths)
  const other = plane === 'staged' ? 'worktree' : 'staged'
  focusOn($, sectionEntries(state.changes.entries, other).some(covers) ? other + ':' + path : '')
}

export async function toggleStageFolder($, plane, path) {
  const paths = sectionEntries(state.changes.entries, plane)
    .filter((entry) => entry.path.startsWith(path))
    .flatMap(plane === 'staged' ? fileTargets : stageTargets)
  if (!paths.length) return
  if (plane === 'staged') await unstageThese($, paths)
  else await stageThese($, paths)
}

export function discardQuestion(entry) {
  const effect =
    entry.y === '?'
      ? 'This deletes a new file that is not in git, so it cannot be recovered.'
      : "This throws away the file's uncommitted edits in the working tree and cannot be undone." +
        (entry.x !== ' ' ? ' Edits already staged stay.' : '')
  const where = visibleRepos().length > 1 ? repoNameOf(state.changes.repo) + ' · ' : ''
  return effect + ' Discard ' + where + entry.path + '?'
}

export async function askDiscard($, entry) {
  let answer = ''
  try {
    answer = await hostUiAsk($, discardQuestion(entry), { header: 'Discard', options: [DISCARD_YES, 'Cancel'] })
  } catch (error) {
    modLog($, 'discard question closed: ' + messageOf(error).slice(0, 200))
    return
  }
  if (answer !== DISCARD_YES) return
  if (await discardPath($, entry)) hostUiToast($, 'Discarded ' + entry.path)
  await loadChanges($)
  if (!CHANGE_VIEWS.has(state.view)) return
  state.view = 'changes'
  redrawPane($)
}
