import { hostFsExists, hostFsList, hostFsRead, hostFsStat, hostPluginRoot, hostSessionCwd } from '../core/api.js'
import { MAX_ENTRIES, MEASURE_FROM_BYTES, META_RACY_SLACK_MS, META_READ_LIMIT, NESTED_SCAN_DEPTH, NESTED_SCAN_FOLDERS, NESTED_SCAN_SKIP, RECENT_COUNT } from '../core/constants.js'
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

export async function findTaskDocs($, root, source = '') {
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
        ...(source ? { source, root } : {}),
        label: rel || 'tasks',
        name: parts[parts.length - 1] || 'tasks',
        scope: parts.slice(0, -1).join('/'),
        path: dir + '/current.md',
        size: doc.size,
        mtime: doc.mtimeMs,
        decisions: files.map((entry) => ({ name: entry.name, path: dir + '/decisions/' + entry.name, size: entry.size, mtime: entry.mtimeMs })),
      })
    }
    for (const entry of entries) {
      if (isDirectory(entry) && entry.name !== 'decisions') await walk(dir + '/' + entry.name, depth + 1)
    }
  }
  await walk(root + '/tasks', 0)
  return found
}

export function sourceOf(folder, cwd) {
  return folder === cwd ? '' : 'parent: ' + (folder.split('/').pop() || '/')
}

export async function foldersWith($, cwd, home, sub) {
  const found = []
  let dir = cwd
  for (let level = 0; dir && level < 12; level += 1) {
    if (level > 0 && dir === home) break
    if ((await safeList($, dir + '/' + sub)).length) found.push(dir)
    if (!home || dir === home) break
    dir = parentOf(dir)
  }
  return found
}

export async function findAllTaskDocs($, cwd, home) {
  const roots = await foldersWith($, cwd, home, 'tasks')
  const children = cwd === home ? [] : await childrenWith($, cwd, 'tasks')
  const lists = await Promise.all([
    ...roots.map((root) => findTaskDocs($, root, sourceOf(root, cwd))),
    ...children.map((child) => findTaskDocs($, child, 'nested: ' + child.slice(cwd.length + 1))),
  ])
  return lists.flat()
}

export async function childrenWith($, cwd, sub) {
  const folders = (await safeList($, cwd)).filter((entry) => entry.kind !== 'file' && !entry.name.startsWith('.') && !NESTED_SCAN_SKIP.includes(entry.name))
  const found = await Promise.all(folders.map(async (entry) => ((await safeList($, cwd + '/' + entry.name + '/' + sub)).length ? cwd + '/' + entry.name : '')))
  return found.filter(Boolean).sort()
}

export async function findNearestMarkdown($, group, cwd, home, sub) {
  for (const folder of await foldersWith($, cwd, home, sub)) {
    const docs = await findMarkdownIn($, group, folder + '/' + sub)
    if (!docs.length) continue
    const source = sourceOf(folder, cwd)
    return docs.map((doc) => (source ? { ...doc, source } : doc))
  }
  return []
}

export function scopeOfInstruction(path, cwd, home) {
  const folder = parentOf(path)
  const base = folder.endsWith('/.claude') ? parentOf(folder) : folder
  if (folder === home + '/.claude') return 'your global'
  if (base === cwd) return folder === base ? 'this project' : 'this project (.claude/)'
  if (base.startsWith(cwd + '/')) return 'nested: ' + base.slice(cwd.length + 1)
  return sourceOf(base, cwd)
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
  const home = (await homeOf($)).replace(/(.)\/+$/, '$1')
  const groups = await Promise.all([
    findAllTaskDocs($, cwd, home),
    Promise.all([findInstructionFiles($, cwd, home), findNestedInstructionFiles($, cwd, home), findCompanionFiles($, cwd, home)]).then(
      (parts) => uniqueByPath(parts.flat()),
    ),
    findNearestMarkdown($, 'Rules', cwd, home, '.claude/rules'),
    findNearestMarkdown($, 'Project docs', cwd, home, 'docs'),
    findSkills($),
  ])
  const docs = groups.flat()
  docs.from = { cwd, isHome: cwd === home }
  return docs
}

export const metaCache = new Map()

export function isTaskDoc(doc) {
  return doc.group === 'Task docs'
}

export function wantsLines(doc) {
  return (doc.size || 0) >= MEASURE_FROM_BYTES || isInstructionFile(doc)
}

export function wantsMeta(doc) {
  return isTaskDoc(doc) || wantsLines(doc)
}

export function metaOfText(doc, text) {
  return {
    lines: wantsLines(doc) ? text.split('\n').length : undefined,
    hub: isTaskDoc(doc) ? isHubText(text) : undefined,
    status: isTaskDoc(doc) ? summaryOf(statusLineOf(text)) : undefined,
  }
}

export function applyMeta(doc, meta) {
  if (wantsLines(doc)) doc.lines = meta.lines
  if (isTaskDoc(doc)) {
    doc.hub = meta.hub
    doc.status = meta.status
  }
}

export function cachedMetaOf(doc) {
  const hit = metaCache.get(doc.path)
  if (!hit || typeof doc.mtime !== 'number') return null
  if (hit.mtime !== doc.mtime || hit.size !== doc.size) return null
  return hit.cachedAt - hit.mtime > META_RACY_SLACK_MS ? hit : null
}

export function applyCachedMeta(docs) {
  for (const doc of docs) {
    const hit = cachedMetaOf(doc)
    if (hit) applyMeta(doc, hit)
  }
}

export async function readMetaOf($, doc, now) {
  try {
    const meta = metaOfText(doc, String((await hostFsRead($, doc.path)) || ''))
    applyMeta(doc, meta)
    if (typeof doc.mtime === 'number') metaCache.set(doc.path, { ...meta, mtime: doc.mtime, size: doc.size, cachedAt: now })
  } catch {
    if (wantsLines(doc)) doc.lines = undefined
    if (isTaskDoc(doc)) doc.status = ''
  }
}

export async function fillDocMeta($, docs, now, isStale, onProgress) {
  const wanted = docs.filter(wantsMeta)
  const toRead = []
  for (const doc of wanted) {
    const hit = cachedMetaOf(doc)
    if (hit) applyMeta(doc, hit)
    else toRead.push(doc)
  }
  const cached = wanted.length - toRead.length
  let done = cached
  onProgress(done, wanted.length)
  let next = 0
  const worker = async () => {
    while (next < toRead.length && !isStale()) {
      const doc = toRead[next]
      next += 1
      await readMetaOf($, doc, now)
      done += 1
      onProgress(done, wanted.length)
    }
  }
  await Promise.all(Array.from({ length: Math.min(META_READ_LIMIT, toRead.length) }, worker))
  return { read: toRead.length, cached }
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
