const SKIP_REPO_FOLDERS = new Set(['node_modules', 'vendor'])
const MAX_REPO_FOLDERS = 200

const repoNameOf = (root) => root.slice(root.lastIndexOf('/') + 1) || root

const topLevelOf = async ($, cwd) => {
  try {
    const ran = await gitRun($, ['git', 'rev-parse', '--show-toplevel'], { cwd })
    return ran.exitCode === 0 ? ran.stdout.trim() : ''
  } catch {
    return ''
  }
}

const discoverRepos = async ($, cwd) => {
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

const visibleRepos = () =>
  [...state.repoFound, ...state.repoManual.filter((root) => !state.repoFound.includes(root))].filter((root) => !state.repoHidden[root])

const countRepoChanges = async ($, root) => {
  try {
    const ran = await gitRun($, ['git', '--no-optional-locks', 'status', '--porcelain=v1', '-z', '-unormal'], { cwd: root })
    return ran.exitCode === 0 ? parseStatus(ran.stdout).length : 0
  } catch {
    return 0
  }
}

const resolveRepoPath = async ($, typed) => {
  const path = typed.trim().replace(/\/+$/, '')
  if (path === '~' || path.startsWith('~/')) {
    if (!state.home) state.home = await homeOf($)
    return state.home + path.slice(1)
  }
  return path.startsWith('/') ? path : state.cwd + '/' + path
}
