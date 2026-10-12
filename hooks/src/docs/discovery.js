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
  if (base.startsWith(cwd + '/')) return 'nested: ' + base.slice(cwd.length + 1)
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

const findNestedInstructionFiles = async ($, cwd, home) => {
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

const findCompanionFiles = async ($, cwd, home) => {
  const folders = [
    { dir: home + '/.claude/.claude-companions/shared', scope: 'companion' },
    { dir: cwd + '/.claude-companions/shared', scope: 'companion (this project)' },
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
          path: dir + '/' + entry.name,
          size: entry.size,
          mtime: entry.mtimeMs,
        })),
    ),
  )
  return lists.flat()
}

const uniqueByPath = (docs) => docs.filter((doc, index) => docs.findIndex((other) => other.path === doc.path) === index)

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

const findSkills = async ($) => {
  const root = $.plugin.root
  if (!root) return []
  const folders = (await safeList($, root + '/skills')).filter((entry) => isDirectory(entry) && !entry.name.startsWith('_'))
  const found = await Promise.all(
    folders.map(async (folder) => {
      const path = root + '/skills/' + folder.name + '/SKILL.md'
      try {
        const stat = await $.fs.stat(path)
        return { group: 'Skills', label: folder.name, name: folder.name, scope: 'skill', path, size: stat.size, mtime: stat.mtimeMs }
      } catch {
        return null
      }
    }),
  )
  return found.filter(Boolean).sort((a, b) => a.name.localeCompare(b.name))
}

const discover = async ($) => {
  const cwd = await $.session.cwd()
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

const measureHeavy = async ($) => {
  await Promise.all(
    state.docs
      .filter((doc) => (doc.size || 0) >= MEASURE_FROM_BYTES || isInstructionFile(doc))
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

const readDocMeta = async ($) => {
  const recent = recentDocs()
  await Promise.all(
    state.docs
      .filter((doc) => doc.group === 'Task docs')
      .map(async (doc) => {
        try {
          const text = await $.fs.read(doc.path)
          doc.hub = isHubText(text)
          if (recent.includes(doc)) doc.status = summaryOf(statusLineOf(text))
        } catch {
          doc.status = ''
        }
      }),
  )
}
