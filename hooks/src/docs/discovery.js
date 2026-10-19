import { hostFsExists, hostFsList, hostFsRead, hostFsStat, hostPluginRoot, hostSessionCwd } from '../core/api.js'
import { MAX_ENTRIES, MEASURE_FROM_BYTES, NESTED_SCAN_DEPTH, NESTED_SCAN_FOLDERS, NESTED_SCAN_SKIP, RECENT_COUNT } from '../core/constants.js'
import { heaviness, homeOf, isDirectory, isHeavy, isHubText, isInstructionFile, parentOf, statusLineOf, summaryOf } from '../core/format.js'
import { state } from '../core/state.js'

export async function safeList($, dir) {
  try {
    return await hostFsList($, dir)
  } catch {
    return []
  }
}

export async function safeExists($, path) {
  try {
    return await hostFsExists($, path)
  } catch {
    return false
  }
}

export async function findTaskDocs($, root) {
  const found = []
  const walk = async (dir, depth) => {
    if (depth > 3 || found.length >= MAX_ENTRIES * 3) return
    const entries = await safeList($, dir)
    const doc = entries.find((entry) => entry.name === 'current.md' && entry.kind === 'file')
    if (doc) {
      const folder = entries.find((entry) => entry.name === 'decisions' && isDirectory(entry))
      const files = folder
        ? (await safeList($, dir + '/decisions')).filter((entry) => entry.kind === 'file' && entry.name.endsWith('.md'))
        : []
      const rel = dir.slice(root.length + 1).replace(/^tasks\/?/, '')
      const parts = rel.split('/').filter(Boolean)
      found.push({
        group: 'Task docs',
        label: rel || 'tasks',
        name: parts[parts.length - 1] || 'tasks',
        scope: parts.slice(0, -1).join('/'),
        path: dir + '/current.md',
        size: doc.size,
        mtime: doc.mtimeMs,
        decisions: files.map((entry) => ({ name: entry.name, path: dir + '/decisions/' + entry.name, size: entry.size })),
      })
    }
    for (const entry of entries) {
      if (isDirectory(entry) && entry.name !== 'decisions') await walk(dir + '/' + entry.name, depth + 1)
    }
  }
  await walk(root + '/tasks', 0)
  return found
}

export function scopeOfInstruction(path, cwd, home) {
  const folder = parentOf(path)
  const base = folder.endsWith('/.claude') ? parentOf(folder) : folder
  if (folder === home + '/.claude') return 'your global'
  if (base === cwd) return folder === base ? 'this project' : 'this project (.claude/)'
  if (base.startsWith(cwd + '/')) return 'nested: ' + base.slice(cwd.length + 1)
  return 'parent: ' + (base.split('/').pop() || '/')
}

export function instructionDoc(path, cwd, home) {
  const name = path.split('/').pop()
  const scope = scopeOfInstruction(path, cwd, home)
  return { group: 'CLAUDE.md chain', label: name + ' · ' + scope, name, scope, path }
}

export async function findInstructionFiles($, cwd, home) {
  const found = []
  const names = ['CLAUDE.md', 'CLAUDE.local.md', '.claude/CLAUDE.md']
  let dir = cwd
  for (let level = 0; dir && level < 12; level += 1) {
    for (const name of names) {
      const path = dir + '/' + name
      if (!found.some((doc) => doc.path === path) && (await safeExists($, path))) {
        found.push(instructionDoc(path, cwd, home))
      }
    }
    dir = parentOf(dir)
  }
  const user = home + '/.claude/CLAUDE.md'
  if (!found.some((doc) => doc.path === user) && (await safeExists($, user))) {
    found.push(instructionDoc(user, cwd, home))
  }
  return Promise.all(
    found.map(async (doc) => {
      try {
        const stat = await hostFsStat($, doc.path)
        return { ...doc, size: stat.size, mtime: stat.mtimeMs }
      } catch {
        return doc
      }
    }),
  )
}

export async function findNestedInstructionFiles($, cwd, home) {
  const found = []
  let visited = 0
  const walk = async (dir, depth) => {
    if (depth > NESTED_SCAN_DEPTH || visited >= NESTED_SCAN_FOLDERS) return
    visited += 1
    const entries = await safeList($, dir)
    if (depth > 0) {
      for (const entry of entries) {
        if (entry.kind === 'file' && (entry.name === 'CLAUDE.md' || entry.name === 'CLAUDE.local.md')) {
          const path = dir + '/' + entry.name
          found.push({ ...instructionDoc(path, cwd, home), listName: path.slice(cwd.length + 1), size: entry.size, mtime: entry.mtimeMs })
        }
      }
    }
    const folders = entries.filter((entry) => isDirectory(entry) && !NESTED_SCAN_SKIP.includes(entry.name))
    await Promise.all(folders.map((entry) => walk(dir + '/' + entry.name, depth + 1)))
  }
  await walk(cwd, 0)
  return found.sort((a, b) => a.path.localeCompare(b.path))
}

export async function findCompanionFiles($, cwd, home) {
  const folders = [
    { dir: home + '/.claude/.claude-companions/shared', scope: 'companion' },
    { dir: cwd + '/.claude-companions/shared', scope: 'project companion' },
    { dir: home + '/.claude/.claude-companions/local', scope: 'local companion' },
    { dir: cwd + '/.claude-companions/local', scope: 'local project companion' },
  ]
  const lists = await Promise.all(
    folders.map(async ({ dir, scope }) =>
      (await safeList($, dir))
        .filter((entry) => entry.kind === 'file' && entry.name.endsWith('.md'))
        .map((entry) => ({
          group: 'CLAUDE.md chain',
          label: entry.name + ' · ' + scope,
          name: entry.name,
          scope,
          companion: true,
          path: dir + '/' + entry.name,
          size: entry.size,
          mtime: entry.mtimeMs,
        })),
    ),
  )
  return lists.flat()
}

export function uniqueByPath(docs) {
  return docs.filter((doc, index) => docs.findIndex((other) => other.path === doc.path) === index)
}

export async function findMarkdownIn($, group, dir) {
  const entries = await safeList($, dir)
  return entries
    .filter((entry) => entry.kind === 'file' && entry.name.endsWith('.md'))
    .map((entry) => ({
      group,
      label: (group === 'Rules' ? '.claude/rules/' : 'docs/') + entry.name,
      name: entry.name,
      scope: group === 'Rules' ? 'rules' : 'docs',
      path: dir + '/' + entry.name,
      size: entry.size,
      mtime: entry.mtimeMs,
    }))
}

export async function findSkills($) {
  const root = hostPluginRoot($)
  if (!root) return []
  const folders = (await safeList($, root + '/skills')).filter((entry) => isDirectory(entry) && !entry.name.startsWith('_'))
  const found = await Promise.all(
    folders.map(async (folder) => {
      const path = root + '/skills/' + folder.name + '/SKILL.md'
      try {
        const stat = await hostFsStat($, path)
        return { group: 'Skills', label: folder.name, name: folder.name, scope: 'skill', path, size: stat.size, mtime: stat.mtimeMs }
      } catch {
        return null
      }
    }),
  )
  return found.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
}

export async function discover($) {
  const cwd = await hostSessionCwd($)
  state.cwd = cwd
  const home = await homeOf($)
  const groups = await Promise.all([
    findTaskDocs($, cwd),
    Promise.all([findInstructionFiles($, cwd, home), findNestedInstructionFiles($, cwd, home), findCompanionFiles($, cwd, home)]).then(
      (parts) => uniqueByPath(parts.flat()),
    ),
    findMarkdownIn($, 'Rules', cwd + '/.claude/rules'),
    findMarkdownIn($, 'Project docs', cwd + '/docs'),
    findSkills($),
  ])
  return groups.flat()
}

export async function measureHeavy($) {
  await Promise.all(
    state.docs
      .filter((doc) => (doc.size || 0) >= MEASURE_FROM_BYTES || isInstructionFile(doc))
      .map(async (doc) => {
        try {
          doc.lines = (await hostFsRead($, doc.path)).split('\n').length
        } catch {
          doc.lines = undefined
        }
      }),
  )
}

export function heavyDocs() {
  return state.docs.filter(isHeavy).sort((a, b) => heaviness(b) - heaviness(a))
}

export function recentDocs() {
  return state.docs
    .filter((doc) => doc.group === 'Task docs' && typeof doc.mtime === 'number')
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, RECENT_COUNT)
}

export async function readDocMeta($) {
  const recent = recentDocs()
  await Promise.all(
    state.docs
      .filter((doc) => doc.group === 'Task docs')
      .map(async (doc) => {
        try {
          const text = await hostFsRead($, doc.path)
          doc.hub = isHubText(text)
          if (recent.includes(doc)) doc.status = summaryOf(statusLineOf(text))
        } catch {
          doc.status = ''
        }
      }),
  )
}
