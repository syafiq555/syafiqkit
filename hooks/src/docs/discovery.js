const safeList = async ($, dir) => {
  try {
    return await $.fs.list(dir)
  } catch {
    return []
  }
}

const safeExists = async ($, path) => {
  try {
    return await $.fs.exists(path)
  } catch {
    return false
  }
}

const findTaskDocs = async ($, root) => {
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

const scopeOfInstruction = (path, cwd, home) => {
  const folder = parentOf(path)
  const base = folder.endsWith('/.claude') ? parentOf(folder) : folder
  if (folder === home + '/.claude') return 'your global'
  if (base === cwd) return folder === base ? 'this project' : 'this project (.claude/)'
  return 'parent: ' + (base.split('/').pop() || '/')
}

const instructionDoc = (path, cwd, home) => {
  const name = path.split('/').pop()
  const scope = scopeOfInstruction(path, cwd, home)
  return { group: 'CLAUDE.md chain', label: name + ' · ' + scope, name, scope, path }
}

const findInstructionFiles = async ($, cwd, home) => {
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
        const stat = await $.fs.stat(doc.path)
        return { ...doc, size: stat.size, mtime: stat.mtimeMs }
      } catch {
        return doc
      }
    }),
  )
}

const findMarkdownIn = async ($, group, dir) => {
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

const discover = async ($) => {
  const cwd = await $.session.cwd()
  state.cwd = cwd
  const home = await homeOf($)
  const groups = await Promise.all([
    findTaskDocs($, cwd),
    findInstructionFiles($, cwd, home),
    findMarkdownIn($, 'Rules', cwd + '/.claude/rules'),
    findMarkdownIn($, 'Project docs', cwd + '/docs'),
  ])
  return groups.flat()
}

const measureHeavy = async ($) => {
  await Promise.all(
    state.docs
      .filter((doc) => (doc.size || 0) >= MEASURE_FROM_BYTES)
      .map(async (doc) => {
        try {
          doc.lines = (await $.fs.read(doc.path)).split('\n').length
        } catch {
          doc.lines = undefined
        }
      }),
  )
}

const heavyDocs = () => state.docs.filter(isHeavy).sort((a, b) => heaviness(b) - heaviness(a))

const recentDocs = () =>
  state.docs
    .filter((doc) => doc.group === 'Task docs' && typeof doc.mtime === 'number')
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, RECENT_COUNT)

const readRecentStatuses = async ($) => {
  await Promise.all(
    recentDocs().map(async (doc) => {
      try {
        doc.status = summaryOf(statusLineOf(await $.fs.read(doc.path)))
      } catch {
        doc.status = ''
      }
    }),
  )
}
