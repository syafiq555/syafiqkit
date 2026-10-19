import { homeOf, isDirectory } from '../core/format.js'
import { gitRun } from '../core/run.js'
import { state } from '../core/state.js'
import { safeList } from '../docs/discovery.js'
import { parseStatus } from './status.js'

export const SKIP_REPO_FOLDERS = new Set(['node_modules', 'vendor'])
export const MAX_REPO_FOLDERS = 200

export function repoNameOf(root) {
  return root.slice(root.lastIndexOf('/') + 1) || root
}

export async function topLevelOf($, cwd) {
  try {
    const ran = await gitRun($, ['git', 'rev-parse', '--show-toplevel'], { cwd })
    return ran.exitCode === 0 ? ran.stdout.trim() : ''
  } catch {
    return ''
  }
}

export async function discoverRepos($, cwd) {
  const roots = []
  const top = await topLevelOf($, cwd)
  if (top) roots.push(top)
  const entries = (await safeList($, cwd)).filter((entry) => isDirectory(entry) && !SKIP_REPO_FOLDERS.has(entry.name))
  for (const entry of entries.slice(0, MAX_REPO_FOLDERS)) {
    const folder = cwd + '/' + entry.name
    if (!(await safeList($, folder)).some((child) => child.name === '.git')) continue
    const root = (await topLevelOf($, folder)) || folder
    if (!roots.includes(root)) roots.push(root)
  }
  return roots
}

export function visibleRepos() {
  return [...state.repoFound, ...state.repoManual.filter((root) => !state.repoFound.includes(root))].filter((root) => !state.repoHidden[root])
}

export async function countRepoChanges($, root) {
  try {
    const ran = await gitRun($, ['git', '--no-optional-locks', 'status', '--porcelain=v1', '-z', '-unormal'], { cwd: root })
    return ran.exitCode === 0 ? parseStatus(ran.stdout).length : 0
  } catch {
    return 0
  }
}

export async function resolveRepoPath($, typed) {
  const path = typed.trim().replace(/\/+$/, '')
  if (path === '~' || path.startsWith('~/')) {
    if (!state.home) state.home = await homeOf($)
    return state.home + path.slice(1)
  }
  return path.startsWith('/') ? path : state.cwd + '/' + path
}
