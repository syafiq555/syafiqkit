const PANE = 'doc-pane'
const COMMAND = 'task-docs'
const MENU_COMMAND = 'sk'
const MAX_ENTRIES = 60
const MAX_CHARS = 90000
const POLL_MS = 2000
const HANDOFF_POLL_MS = 4000
const HANDOFF_EXPIRES_MS = 24 * 60 * 60 * 1000
const RECENT_COUNT = 5
const NAME_WIDTH = 26
const SCOPE_WIDTH = 24
const MEASURE_FROM_BYTES = 8000
const TASK_DOC_MAX_LINES = 300
const DECISION_MAX_BYTES = 40 * 1024
const CLAUDE_MD_MAX_LINES = 200
const CLAUDE_MD_MAX_BYTES = 40000
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit'])
const ITEM = /^\s*[-*]\s+\[( |x|X)\]\s+(.+)$/
const FENCE = /^\s*```(\S*)\s*$/
const HEADING = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/
const RISKY = /\b(ship|push|merge|delete|deploy|drop|reset)\b/i
const MERMAID_PACKAGE = '@mermaid-js/mermaid-cli@12.0.0'
const MERMAID_TIMEOUT_MS = 240000
const MAX_IMAGE_ROWS = 60
const MAX_BASE64 = Math.floor((2 * 1024 * 1024 * 4) / 3)
const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const GROUPS = ['Task docs', 'CLAUDE.md chain', 'Rules', 'Project docs', 'Skills']

const VERBS = [
  { label: 'Commit', hint: 'staged changes only', text: 'Use the commit skill to commit the staged changes.', toast: 'Sent: commit' },
  {
    label: 'Commit and push',
    hint: 'commits, then pushes the branch',
    text: 'Use the commit skill to commit the staged changes, and push.',
    effect: 'Commits what is staged, then pushes the branch to its remote.',
    danger: true,
    toast: 'Sent: commit and push',
  },
  {
    label: 'Done',
    hint: 'review, tidy, update docs',
    text: 'Use the done skill to wrap up this session.',
    effect: 'Runs the done skill: reviews the diff, may edit docs and start reviewer agents. It does not commit.',
    danger: true,
    toast: 'Sent: done',
  },
  { label: 'Read a task doc', hint: 'pick a doc, then act on its open items', go: 'list' },
  {
    label: 'Ship',
    hint: 'changelog, push, CI check, release note',
    text: 'Use the ship skill.',
    effect: 'Commits, writes the changelog, pushes, checks CI and writes the release note.',
    danger: true,
    toast: 'Sent: ship',
  },
  { label: 'Shrink a doc', hint: 'condense or split, docs over the limit first', go: 'heavy' },
  { label: 'Refresh a doc', hint: 'full tidy: restructure, shorten, drop over-strict rules', go: 'refresh', danger: true },
  {
    label: 'Merge docs',
    hint: 'fold related task docs into one',
    text: 'Use the merge-task-docs skill.',
    effect: 'Merges related task docs into one and deletes the source files.',
    danger: true,
    toast: 'Sent: merge docs',
  },
  { label: 'Hand off', hint: 'save where you stopped for the next session', go: 'handoff' },
]

const parentOf = (path) => {
  const cut = path.lastIndexOf('/')
  return cut > 0 ? path.slice(0, cut) : ''
}

const isDirectory = (entry) => entry.kind !== 'file' && !entry.isLink && !entry.name.startsWith('.')

const kb = (bytes) => (typeof bytes === 'number' ? (bytes / 1024).toFixed(1) + ' KB' : '')

const clip = (text, width) => (text.length > width ? text.slice(0, width - 1) + '…' : text)

const messageOf = (error) => String(error && error.message ? error.message : error)

const homeOf = async ($) => {
  let home = ''
  try {
    home = (await $.env.get('HOME')) || ''
  } catch {
    home = ''
  }
  if (home) return home
  try {
    return (await $.env.get('USERPROFILE')) || ''
  } catch {
    return ''
  }
}

const lockDown = async ($, path, mode) => {
  try {
    await $.process.run(['chmod', mode, path])
  } catch {
    return
  }
}

const agoOf = (now, ms) => {
  if (typeof ms !== 'number' || !now) return ''
  const minutes = Math.max(0, Math.round((now - ms) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return minutes + ' min ago'
  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours + ' h ago'
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : days + ' d ago'
}

const statusLineOf = (text) => {
  const hit = text.match(/^\W*Status\b.*$/im)
  return hit ? hit[0].trim() : ''
}

const summaryOf = (line) => {
  if (!line) return ''
  const body = line.replace(/^\W*Status\b[:\s*]*/i, '').trim()
  const icon = (body.match(/^(\p{Extended_Pictographic}️?)/u) || [])[1] || '·'
  const rest = body.replace(/^\p{Extended_Pictographic}️?\s*/u, '')
  const head = rest.split(/\s[—–-]\s|\(|,/)[0].trim()
  return icon + ' ' + head.slice(0, 24)
}

const isInstructionFile = (doc) => doc.group === 'CLAUDE.md chain'

const isOversizedDecision = (file) => (file.size || 0) > DECISION_MAX_BYTES

const oversizedDecisions = (doc) => (doc.decisions || []).filter(isOversizedDecision)

const isHeavy = (doc) => {
  if (doc.group === 'Task docs' && oversizedDecisions(doc).length) return true
  if (typeof doc.lines !== 'number') return false
  if (isInstructionFile(doc)) return doc.lines > CLAUDE_MD_MAX_LINES || (doc.size || 0) > CLAUDE_MD_MAX_BYTES
  return doc.group === 'Task docs' && doc.lines > TASK_DOC_MAX_LINES
}

const heavyNote = (doc) => {
  const big = oversizedDecisions(doc).sort((a, b) => (b.size || 0) - (a.size || 0))
  const parts = []
  if (big.length) parts.push('decisions/' + big[0].name + ' ' + kb(big[0].size) + (big.length > 1 ? ' +' + (big.length - 1) : ''))
  if (typeof doc.lines === 'number' && doc.group === 'Task docs' && doc.lines > TASK_DOC_MAX_LINES) parts.push(doc.lines + ' lines')
  if (!parts.length) parts.push(isInstructionFile(doc) && doc.lines <= CLAUDE_MD_MAX_LINES ? kb(doc.size) : doc.lines + ' lines')
  return '⚠ ' + parts.join(' · ')
}

const heaviness = (doc) =>
  isInstructionFile(doc)
    ? doc.size || 0
    : oversizedDecisions(doc).reduce((sum, file) => sum + (file.size || 0), 0) + (doc.lines || 0)

const REFRESH_EFFECT = 'Rewrites the doc in place with three passes (restructure, shorten, loosen over-strict rules).'
const SHRINK_EFFECT =
  'Task doc: the task-summary skill judges each file over the limit (index over 300 lines, decisions file over 40 KB) and condenses, splits, does both, or proposes a better structure first. CLAUDE.md: condensed in place on haiku and verified.'

const refreshRequest = (doc) => 'Use the refresh-instructions skill on ' + doc.path + '.'

const haikuRequest = (skill, path, ask) =>
  'Use the haiku skill to run the ' +
  skill +
  ' skill on ' +
  path +
  ask +
  ' Then verify the result, and restore any fact, figure or quote the agent dropped or changed the meaning of, rather than reverting its work.'

const decisionLabel = (file) => 'decisions/' + file.name + ' (' + kb(file.size) + ')'

const decisionFileRequest = (doc, file, verb, ask) =>
  haikuRequest(
    'condense-task-doc',
    file.path,
    ' to ' +
      verb +
      ' ' +
      decisionLabel(file) +
      ask +
      ' Only this file is in scope: leave its index ' +
      doc.path +
      ' and the other decisions files alone, except routing rows and links that must change.',
  )

const SPLIT_EFFECT =
  'A haiku agent splits one decisions file into smaller ones by topic, moving the text word for word, and makes current.md the router that says which file holds what. Links to the old file are repointed, and the result is checked before it is reported.'

const splitRequest = (doc, file) =>
  decisionFileRequest(
    doc,
    file,
    'split',
    ' by topic into smaller decisions files. Move the text word for word and count its headings and table rows before and after, make current.md the router that says which file holds what, and repoint every link to the old file.',
  )

const CONDENSE_FILE_EFFECT =
  'A haiku agent condenses one decisions file in place: drops superseded and repeated text, keeps every decision, figure, name and quote, and checks the result before it is reported.'

const condenseFileRequest = (doc, file) =>
  decisionFileRequest(
    doc,
    file,
    'condense',
    ' in place. Remove superseded and repeated text, and keep every decision, figure, name and quoted line. If the file is the only copy of an outside source (a spec, a transcript, client notes), do not cut it: only remove repeats, and split it if it is over 40 KB. If it is still over 40 KB afterwards, say so.',
  )

const taskDocShrinkRequest = (doc) => {
  const sizes = []
  if (typeof doc.lines === 'number' && doc.lines > TASK_DOC_MAX_LINES) sizes.push('current.md is ' + doc.lines + ' lines (index limit 300)')
  const big = oversizedDecisions(doc)
  if (big.length) sizes.push(big.map(decisionLabel).join(', ') + (big.length === 1 ? ' is' : ' are') + ' over the 40 KB limit for one decisions file')
  return (
    'Use the task-summary skill on ' +
    doc.path +
    '. ' +
    (sizes.length ? 'Over the limit: ' + sizes.join('; ') + '. ' : '') +
    'For each oversized file, judge what fits: condense it, split it by topic with current.md as the router, condense then split, or a better structure. If you see a better way than these, propose it before changing anything. Keep every decision, figure, name and quote, and move text between files word for word. Verify the result before reporting.'
  )
}

const shrinkRequest = (doc) =>
  isInstructionFile(doc) ? haikuRequest('condense-claude-md', doc.path, '.') : taskDocShrinkRequest(doc)

const state = {
  view: 'list',
  docs: [],
  cwd: '',
  home: '',
  now: 0,
  filter: '',
  heavyOnly: false,
  pick: null,
  current: null,
  lastDoc: null,
  raw: '',
  text: '',
  status: '',
  error: '',
  selected: [],
  showDone: false,
  showDecisions: false,
  decisionOpen: '',
  decisionTexts: {},
  isOpen: false,
  changedAt: '',
  stop: null,
  diagrams: {},
  confirm: null,
  handoffNext: '',
  saving: false,
  alsoHandoff: false,
  handoffFromBand: false,
  pendingHandoff: null,
  disabled: false,
  reopen: null,
  handoff: null,
  olderCount: 0,
  ownHandoff: '',
  dismissed: '',
}

let queue = []
let busy = false

const convert = async ($, job) => {
  try {
    const home = await homeOf($)
    if (!home) throw new Error('no home folder for the picture cache')
    const dir = home + '/.claude/doc-pane-cache'
    const mmd = dir + '/' + job.key + '.mmd'
    const png = dir + '/' + job.key + '.png'
    const rendered = dir + '/' + job.key + '.ok'
    if (!(await safeExists($, rendered))) {
      await $.fs.write(mmd, job.source)
      await lockDown($, dir, '700')
      const ran = await $.process.run(
        ['npx', '--yes', MERMAID_PACKAGE, '-i', mmd, '-o', png, '-s', '2', '-b', 'white'],
        { cwd: dir, timeoutMs: MERMAID_TIMEOUT_MS },
      )
      if (ran.exitCode !== 0) throw new Error((ran.stderr || ran.stdout || 'mermaid-cli failed').slice(-300))
      await $.fs.write(rendered, 'ok')
    }
    const { base64 } = await $.fs.read(png, { as: 'bytes' })
    if (!base64) throw new Error('could not read the rendered picture')
    if (base64.length > MAX_BASE64) throw new Error('rendered picture is over 2 MiB')
    state.diagrams[job.key] = { status: 'ready', png: base64, size: pngSize(base64) }
  } catch (error) {
    state.diagrams[job.key] = {
      status: 'error',
      message: messageOf(error).slice(0, 300),
    }
  }
}

const pump = async ($) => {
  if (busy) return
  busy = true
  while (queue.length) {
    await convert($, queue.shift())
    $.ui.invalidate('ui.render')
  }
  busy = false
}

const wantDiagrams = ($, text) => {
  for (const part of segments(text)) {
    if (part.kind !== 'mermaid') continue
    const key = hashOf(part.source)
    if (state.diagrams[key]) continue
    state.diagrams[key] = { status: 'rendering' }
    queue.push({ key, source: part.source })
  }
  pump($)
}

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
    findInstructionFiles($, cwd, home),
    findMarkdownIn($, 'Rules', cwd + '/.claude/rules'),
    findMarkdownIn($, 'Project docs', cwd + '/docs'),
    findSkills($),
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

const hashOf = (text) => {
  let hash = 5381
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash * 33) ^ text.charCodeAt(index)) >>> 0
  }
  return hash.toString(16)
}

const pngSize = (base64) => {
  const bytes = []
  let bits = 0
  let value = 0
  for (const char of base64.slice(0, 32)) {
    const index = B64.indexOf(char)
    if (index < 0) continue
    value = ((value << 6) | index) & 0xffff
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((value >> bits) & 255)
    }
  }
  if (bytes.length < 24) return null
  const read = (offset) =>
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
  return { width: read(16), height: read(20) }
}

const fitImage = (size, maxColumns) => {
  if (!size || !size.width || !size.height) return { columns: Math.min(maxColumns, 60), rows: 15 }
  const ratio = size.height / size.width
  let columns = Math.min(maxColumns, 255, Math.max(20, Math.ceil(size.width / 12)))
  let rows = Math.ceil((columns * ratio) / 2)
  if (rows > MAX_IMAGE_ROWS) {
    rows = MAX_IMAGE_ROWS
    columns = Math.max(10, Math.floor((rows * 2) / ratio))
  }
  return { columns, rows: Math.max(1, Math.min(rows, 255)) }
}

const splitCells = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'))

const isSeparator = (line) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes('|')

const tableToBullets = (header, rows) =>
  rows.map((cells) => {
    const lead = cells[0] || ' '
    const rest = cells
      .slice(1)
      .map((value, index) => {
        const label = header[index + 1]
        if (!value) return ''
        return cells.length > 2 && label ? label + ': ' + value : value
      })
      .filter(Boolean)
    return '- **' + lead + '**' + (rest.length ? ' — ' + rest.join(' · ') : '')
  })

const reshapeTables = (text) => {
  const lines = text.split('\n')
  const out = []
  let inFence = false
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^\s*```/.test(line)) inFence = !inFence
    const startsTable =
      !inFence && line.trim().startsWith('|') && index + 1 < lines.length && isSeparator(lines[index + 1])
    if (!startsTable) {
      out.push(line)
      continue
    }
    const header = splitCells(line)
    const rows = []
    index += 2
    while (index < lines.length && lines[index].trim().startsWith('|')) {
      rows.push(splitCells(lines[index]))
      index += 1
    }
    index -= 1
    out.push(...tableToBullets(header, rows))
  }
  return out.join('\n')
}

const shape = (raw) => {
  const text = reshapeTables(raw.replace(/<!--[\s\S]*?-->\n?/g, ''))
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + '\n\n_Truncated at ' + MAX_CHARS + ' characters._' : text
}

const segments = (text) => {
  const out = []
  let chunk = []
  let fence = null
  let diagram = []
  let section = ''
  const flush = () => {
    if (chunk.length) out.push({ kind: 'md', text: chunk.join('\n') })
    chunk = []
  }
  for (const line of text.split('\n')) {
    const marker = line.match(FENCE)
    if (fence === null) {
      if (marker) {
        if (marker[1] === 'mermaid') {
          flush()
          fence = 'mermaid'
          diagram = []
        } else {
          fence = 'other'
          chunk.push(line)
        }
        continue
      }
      const heading = line.match(HEADING)
      if (heading) section = heading[1].replace(/[*_`]/g, '').trim()
      const bold = line.match(/^\s*\*\*([^*]+)\*\*:?\s*$/)
      if (bold) section = bold[1].trim()
      const hit = line.match(ITEM)
      if (hit) {
        flush()
        out.push({ kind: 'item', done: hit[1] !== ' ', text: hit[2].trim(), section })
      } else {
        chunk.push(line)
      }
      continue
    }
    if (marker && marker[1] === '') {
      if (fence === 'mermaid') out.push({ kind: 'mermaid', source: diagram.join('\n') })
      else chunk.push(line)
      fence = null
      continue
    }
    if (fence === 'mermaid') diagram.push(line)
    else chunk.push(line)
  }
  if (fence === 'mermaid') chunk.push('```mermaid', ...diagram)
  flush()
  return out
}

const readDecision = async ($, file) => {
  try {
    return shape(await $.fs.read(file.path))
  } catch {
    return '_Could not read this file._'
  }
}

const stopWatch = () => {
  const timer = state.stop
  state.stop = null
  if (timer && typeof timer.cancel === 'function') timer.cancel()
}

const refresh = async ($) => {
  if (state.view !== 'doc' || !state.current) return
  const path = state.current.path
  try {
    const raw = await $.fs.read(path)
    if (!state.current || state.current.path !== path) return
    const recovered = state.error !== ''
    if (raw === state.raw && !recovered) return
    state.error = ''
    if (raw !== state.raw) {
      state.raw = raw
      state.text = shape(raw)
      state.status = statusLineOf(raw)
      const stamp = new Date(await $.clock.now()).toLocaleTimeString()
      if (!state.current || state.current.path !== path) return
      state.changedAt = stamp
      const stillOpen = segments(state.text)
        .filter((part) => part.kind === 'item' && !part.done)
        .map((part) => part.text)
      state.selected = state.selected.filter((item) => stillOpen.includes(item))
      wantDiagrams($, state.text)
    }
    $.ui.invalidate('ui.render')
  } catch {
    if (state.current && state.current.path === path) {
      state.error = 'Could not re-read ' + path
      $.ui.invalidate('ui.render')
    }
  }
}

const watch = ($) => {
  stopWatch()
  state.stop = $.clock.every(POLL_MS, () => refresh($))
}

const requestFor = (path, selected) => {
  const first = 'Run /syafiqkit:read-summary on ' + path + ' first (the read-summary skill), '
  if (!selected.length) {
    return first + 'then tell me which items in it are buildable now and which are blocked.'
  }
  if (selected.length === 1) {
    return first + 'then proceed with this item from it: "' + selected[0] + '"'
  }
  const list = selected.map((item, index) => index + 1 + '. ' + item).join('\n')
  return first + 'then proceed with these ' + selected.length + ' items from it, in this order:\n' + list
}

const resetPane = () => {
  stopWatch()
  state.view = 'list'
  state.selected = []
  state.confirm = null
  state.alsoHandoff = false
  state.handoffFromBand = false
}

const closePane = async ($) => {
  resetPane()
  try {
    await $.ui.close({ id: PANE })
  } catch {}
  state.isOpen = false
  $.ui.invalidate('ui.render')
}

const submitPrompt = async ($, text, note, onFail, handoffAfter) => {
  await closePane($)
  $.ui.toast(note)
  const request = $.prompt.submit({ text })
  if (handoffAfter) state.pendingHandoff = handoffAfter
  request.catch(async (error) => {
    $.ui.toast('Send failed: ' + messageOf(error).slice(0, 100))
    if (handoffAfter) state.pendingHandoff = null
    if (onFail) await onFail()
  })
}

const loadDoc = async ($, doc) => {
  try {
    state.raw = await $.fs.read(doc.path)
    state.text = shape(state.raw)
    state.status = statusLineOf(state.raw)
    state.error = ''
  } catch {
    state.raw = ''
    state.text = ''
    state.status = ''
    state.error = 'Could not read ' + doc.path
  }
  state.current = doc
  state.lastDoc = doc
  state.view = 'doc'
  state.selected = []
  state.showDone = false
  state.showDecisions = false
  state.decisionOpen = ''
  state.decisionTexts = {}
  state.changedAt = ''
  wantDiagrams($, state.text)
  watch($)
}

const send = async ($) => {
  if (!state.current || state.current.group !== 'Task docs') return
  state.reopen = state.current
  const count = state.selected.length
  const text = requestFor(state.current.path, state.selected)
  await submitPrompt(
    $,
    text,
    count ? 'Sent ' + count + (count === 1 ? ' item' : ' items') + ' to Claude' : 'Sent the read-summary request to Claude',
  )
}

const gitState = async ($) => {
  try {
    const status = await $.process.run(['git', '--no-optional-locks', 'status', '--porcelain'])
    const head = await $.process.run(['git', 'rev-parse', '--short', 'HEAD'])
    return { uncommitted: status.stdout.split('\n').filter(Boolean).length, sha: head.stdout.trim() || 'none' }
  } catch {
    return { uncommitted: 0, sha: 'unknown' }
  }
}

const handoffDir = () => state.home + '/.claude/handoffs/' + hashOf(state.cwd)

const ensurePaths = async ($) => {
  if (!state.cwd) state.cwd = await $.session.cwd()
  if (!state.home) state.home = await homeOf($)
  if (!state.home) throw new Error('no home folder to save handoffs under')
}

const HANDOFF_PROMPT =
  'Write a handoff for a fresh session that has none of this conversation. Plain text, under 220 words, with these headings: Goal (one line), Done (bullets: exact file paths, decisions, numbers), In flight (anything still running or half-edited), Next (the first thing to do), Open decisions (questions I have not answered; write none if there are none). Use only what is in the conversation and invent nothing. Do not repeat these instructions.'

const FILE_TOOLS = new Set([...EDIT_TOOLS, 'NotebookEdit'])
const TASK_DOC_PATH = /\/tasks\/(?:.+\/)?current\.md$/

const pathsFrom = (messages, pick) => {
  const seen = []
  for (const message of messages) {
    for (const use of message.toolUses || []) {
      const path = pick(use)
      if (typeof path === 'string' && !seen.includes(path)) seen.push(path)
    }
  }
  return seen
}

const touchedFiles = (messages) =>
  pathsFrom(messages, (use) => FILE_TOOLS.has(use.tool) && use.input && (use.input.file_path || use.input.notebook_path)).slice(-15)

const taskDocsIn = (messages) =>
  pathsFrom(messages, (use) => {
    const path = use.input && (use.input.file_path || use.input.path)
    return typeof path === 'string' && TASK_DOC_PATH.test(path) ? path : null
  })
    .slice(-3)
    .reverse()

const digestOf = (messages) => {
  const asks = messages
    .filter((message) => message.role === 'user' && message.text)
    .slice(-3)
    .map((message) => '- ' + clip(message.text.replace(/\s+/g, ' '), 200))
  const last = [...messages].reverse().find((message) => message.role === 'assistant' && message.text)
  return ['Recent requests:', ...asks, last ? 'Last reply: ' + clip(last.text.replace(/\s+/g, ' '), 500) : '']
    .filter(Boolean)
    .join('\n')
}

const SUMMARY_MODEL = 'haiku'
const TRANSCRIPT_CAP = 60000
const TURN_CAP = 1500
const NOISE = /^(<system-reminder>|Base directory for this skill|\[SYSTEM NOTIFICATION)/

const transcriptOf = (messages) => {
  const lines = messages
    .filter((message) => message.text && !NOISE.test(message.text.trimStart()))
    .map((message) => (message.role === 'user' ? 'User: ' : 'Claude: ') + clip(message.text.replace(/\s+/g, ' '), TURN_CAP))
  const kept = []
  let total = 0
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    total += lines[index].length + 1
    if (total > TRANSCRIPT_CAP) break
    kept.unshift(lines[index])
  }
  return kept.join('\n')
}

const sessionGoalOf = (messages) => {
  for (const message of messages) {
    if (message.role !== 'user' || !message.text || NOISE.test(message.text.trimStart())) continue
    const goal = message.text.match(/^Goal\b[:*\s]*([^\n]+)/im)
    const line = (goal ? goal[1] : message.text).replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim()
    if (line) return clip(line, 80)
  }
  return ''
}

const nextNotePrompt = (next) =>
  next
    ? '\n\nThe user typed this as the next session\'s task: "' +
      next +
      '". Write Goal as that task. If the conversation did not work on it, say so in one line under Done and keep only the facts that bear on it; do not present the conversation\'s own goal as the next session\'s.'
    : ''

const summariseSession = async ($, messages, next) => {
  const transcript = transcriptOf(messages)
  const fallback = () => ({ text: digestOf(messages), how: 'digest' })
  if (!transcript) return fallback()
  try {
    const reply = await $.model.complete({
      model: SUMMARY_MODEL,
      system: 'You write handoffs between coding sessions from a transcript. Use only what the transcript says.',
      prompt: 'Conversation, oldest first:\n' + transcript + '\n\n' + HANDOFF_PROMPT + nextNotePrompt(next),
      maxTokens: 700,
      timeoutMs: 60000,
    })
    if (reply.isAnswered && reply.text && reply.text.trim()) return { text: reply.text.trim(), how: 'summary' }
  } catch {}
  return fallback()
}

const branchOf = async ($) => {
  try {
    return (await $.process.run(['git', 'branch', '--show-current'])).stdout.trim()
  } catch {
    return ''
  }
}

const saveHandoff = async ($, next) => {
  await ensurePaths($)
  let messages = []
  try {
    messages = await $.session.messages()
  } catch {
    messages = []
  }
  const [git, branch, summary, sessionId] = await Promise.all([
    gitState($),
    branchOf($),
    summariseSession($, messages, next),
    $.session.id().catch(() => ''),
  ])
  const docs = taskDocsIn(messages)
  if (!docs.length && state.lastDoc && state.lastDoc.group === 'Task docs') docs.push(state.lastDoc.path)
  const createdAt = await $.clock.now()
  const id = createdAt + '-' + hashOf(summary.text + next)
  const record = {
    id,
    createdAt,
    cwd: state.cwd,
    sessionId,
    sessionGoal: sessionGoalOf(messages),
    summary: summary.text,
    how: summary.how,
    next,
    selected: state.selected,
    taskDocPath: docs[0] || '',
    taskDocs: docs,
    files: touchedFiles(messages),
    branch,
    sha: git.sha,
    uncommitted: git.uncommitted,
  }
  const dir = handoffDir()
  await $.fs.write(dir + '/' + id + '.json', JSON.stringify(record, null, 2))
  await lockDown($, dir, '700')
  await lockDown($, dir + '/' + id + '.json', '600')
  if (state.ownHandoff) await writeMark($, state.ownHandoff, 'superseded')
  state.ownHandoff = id
  return record
}

const markFile = (id) => handoffDir() + '/' + id + '.state'

const idOfFile = (name) => name.replace(/\.json$/, '')

const writeMark = ($, id, value) => $.fs.write(markFile(id), value)

const readMark = async ($, id) => {
  try {
    return String(await $.fs.read(markFile(id))).trim()
  } catch {
    return ''
  }
}

const isTaken = async ($, id) => {
  const mark = await readMark($, id)
  return mark !== '' && mark !== 'open'
}

const texts = (value) => (Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [])

const cleanRecord = (raw, name) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || (typeof raw.summary !== 'string' && typeof raw.next !== 'string')) {
    throw new Error('not a handoff')
  }
  const text = (value) => (typeof value === 'string' ? value : '')
  const count = (value) => (typeof value === 'number' ? value : 0)
  return {
    id: text(raw.id) || name.replace(/\.json$/, ''),
    createdAt: count(raw.createdAt),
    cwd: text(raw.cwd),
    sessionId: text(raw.sessionId),
    sessionGoal: text(raw.sessionGoal),
    summary: text(raw.summary),
    how: text(raw.how),
    next: text(raw.next),
    selected: texts(raw.selected),
    taskDocPath: text(raw.taskDocPath),
    taskDocs: texts(raw.taskDocs),
    files: texts(raw.files),
    branch: text(raw.branch),
    sha: text(raw.sha),
    uncommitted: count(raw.uncommitted),
    file: '',
    name,
    docExists: false,
  }
}

const loadHandoff = async ($) => {
  try {
    await ensurePaths($)
    const now = await $.clock.now()
    const listed = (await safeList($, handoffDir()))
      .filter((entry) => entry.kind === 'file' && entry.name.endsWith('.json'))
      .filter((entry) => {
        const id = idOfFile(entry.name)
        return id !== state.ownHandoff && id !== state.dismissed && now - entry.mtimeMs <= HANDOFF_EXPIRES_MS
      })
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
    const candidates = []
    for (const entry of listed) {
      if (!(await isTaken($, idOfFile(entry.name)))) candidates.push(entry)
    }
    const older = Math.max(0, candidates.length - 1)
    if (older !== state.olderCount) {
      state.olderCount = older
      $.ui.invalidate('ui.render')
    }
    for (const entry of candidates) {
      if (state.handoff && state.handoff.name === entry.name) return
      try {
        const record = cleanRecord(JSON.parse(await $.fs.read(handoffDir() + '/' + entry.name)), entry.name)
        record.file = handoffDir() + '/' + entry.name
        record.docExists = await safeExists($, record.taskDocPath)
        state.handoff = record
        $.ui.invalidate('ui.render')
        return
      } catch {
        continue
      }
    }
    if (state.handoff) {
      state.handoff = null
      $.ui.invalidate('ui.render')
    }
  } catch {
    state.handoff = null
  }
}

const resumeText = (record, now) => {
  const docs = record.taskDocs && record.taskDocs.length ? record.taskDocs : record.taskDocPath ? [record.taskDocPath] : []
  const topic = record.next || goalOf(record) || 'the previous session'
  const readFirst =
    docs.length && !record.next
      ? 'Before anything else, run /syafiqkit:read-summary on ' + docs[0] + ' (the read-summary skill).'
      : 'Before anything else, run /syafiqkit:read-summary on this topic: ' + topic + ' (the read-summary skill; it finds the task docs by content).'
  return [
    record.next ? 'My task for this session: ' + record.next : '',
    readFirst,
    'Then continue from the previous session. Its handoff, saved ' + agoOf(Date.now(), record.createdAt) + ':',
    record.summary || '',
    record.selected && record.selected.length
      ? 'Items it had picked, in order:\n' + record.selected.map((item, index) => index + 1 + '. ' + item).join('\n')
      : '',
    record.next ? 'Next, from me: ' + record.next : '',
    record.next && docs.length
      ? 'Task docs the previous session touched: ' + docs.join(', ')
      : docs.length > 1
        ? 'Other task docs it touched: ' + docs.slice(1).join(', ')
        : '',
    record.files && record.files.length ? 'Files it touched: ' + record.files.join(', ') : '',
    'State at handoff: ' + record.uncommitted + ' files uncommitted at ' + record.sha + (record.branch ? ' on ' + record.branch : '') + '. Now: ' + now.uncommitted + ' uncommitted at ' + now.sha + ". Don't commit unless asked.",
    'First ask me any open product decisions with AskUserQuestion.',
  ]
    .filter(Boolean)
    .join('\n')
}

const goalOf = (record) => {
  const hit = (record.summary || '').match(/Goal[:*\s]*([^\n]+)/i)
  return hit ? hit[1].replace(/[*_`]/g, '').trim() : ''
}

const claimHandoff = async ($, record) => {
  const id = idOfFile(record.name)
  if (await isTaken($, id)) return false
  const mine = 'claimed:' + hashOf(String(await $.clock.now()) + Math.random())
  await writeMark($, id, mine)
  return (await readMark($, id)) === mine
}

const restoreHandoff = async ($, record) => {
  await writeMark($, idOfFile(record.name), 'open')
  state.dismissed = ''
  await loadHandoff($)
}

const claimAndSend = async ($, record, text) => {
  const claimed = await claimHandoff($, record)
  state.handoff = null
  if (!claimed) {
    $.ui.toast('Another session already took this handoff')
    $.ui.invalidate('ui.render')
    return
  }
  const message = text || resumeText(record, await gitState($))
  await submitPrompt($, message, 'Resuming the handoff', () => restoreHandoff($, record))
}

const dismissHandoff = async ($, record) => {
  state.dismissed = record.id
  state.handoff = null
  await writeMark($, idOfFile(record.name), 'dismissed')
  $.ui.invalidate('ui.render')
}

const openPane = async ($, view) => {
  stopWatch()
  state.view = view
  state.current = null
  state.error = ''
  state.selected = []
  state.filter = ''
  state.heavyOnly = false
  state.pick = null
  state.handoffFromBand = view === 'handoff'
  if (view === 'handoff') state.handoffNext = ''
  if (view !== 'confirm') state.confirm = null
  state.isOpen = true
  $.ui.invalidate('ui.render')
  await $.clock.sleep(200)
  try {
    state.docs = await discover($)
    state.now = await $.clock.now()
    await Promise.all([readRecentStatuses($), measureHeavy($)])
  } catch (error) {
    state.docs = []
    state.error = 'Could not list docs: ' + messageOf(error)
  }
  if (view === 'list' && state.reopen) {
    const fresh = state.docs.find((doc) => doc.path === state.reopen.path)
    state.reopen = null
    if (fresh) await loadDoc($, fresh)
  }
  try {
    await $.ui.open({ id: PANE, title: 'syafiqkit', focus: true, closeOnEscape: true, columns: 110 })
  } catch (error) {
    state.isOpen = false
    $.ui.invalidate('ui.render')
    throw error
  }
}

const verbOf = (label) => VERBS.find((item) => item.label === label)

const sendVerb = ($, label) => {
  const verb = verbOf(label)
  return submitPrompt($, verb.text, verb.toast)
}

const confirmVerb = ($, label) => {
  const verb = verbOf(label)
  state.confirm = { title: verb.label, text: verb.text, effect: verb.effect, offerHandoff: true }
  state.alsoHandoff = false
  state.handoffNext = ''
  return openPane($, 'confirm')
}

const runHandoff = async ($, next) => {
  if (state.saving) {
    $.ui.toast('A handoff is already being saved')
    return
  }
  state.saving = true
  $.ui.invalidate('ui.render')
  try {
    const record = await saveHandoff($, next)
    $.ui.toast(
      'Handoff saved (' + (record.how === 'summary' ? 'summary' : 'digest only') + '). The next session offers it on start or /clear',
    )
  } catch (error) {
    $.ui.toast('Handoff failed: ' + messageOf(error).slice(0, 120))
  }
  state.saving = false
  $.ui.invalidate('ui.render')
}

const registerCommand = async ($, name, description) => {
  try {
    await $.command.register({ name, description, immediate: true })
  } catch {
    $.ui.toast('/' + name + ' is taken; use the band button instead')
  }
}

const bandView = ($, e, next) => {
  if (state.disabled) return next(e)
  const { Box, Text, Button } = $.ui.resolve(e)
  if (state.isOpen) {
    if (state.view !== 'doc' || !state.selected.length || !state.current || state.current.group !== 'Task docs') return next(e)
    return Box({
      flexDirection: 'row',
      columnGap: 2,
      paddingX: 1,
      children: [
        Text({ color: 'cyan', bold: true, children: '▶ ' + state.selected.length + ' selected' }),
        Button({ key: 'send-band', label: 'Send to Claude', onPress: () => send($) }),
        Text({ dimColor: true, children: 'c clears, in the pane' }),
      ],
    })
  }
  const rows = [
    Box({
      key: 'launch-row',
      flexDirection: 'row',
      columnGap: 2,
      paddingX: 1,
      children: [
        Text({ color: 'cyan', bold: true, children: '▤ syafiqkit' }),
        Button({ key: 'open-menu', label: 'Menu', hotkey: 'm', onPress: () => openPane($, 'menu') }),
        Button({
          key: 'open-docs',
          label: state.reopen ? 'Docs ↩' : 'Docs',
          hotkey: 'd',
          onPress: () => openPane($, 'list'),
        }),
        Text({ dimColor: true, children: '│' }),
        Button({ key: 'band-commit', label: 'Commit', hotkey: 'c', onPress: () => sendVerb($, 'Commit') }),
        Button({ key: 'band-wrap', label: 'Done', hotkey: 'w', onPress: () => confirmVerb($, 'Done') }),
        state.saving
          ? Text({ color: 'cyan', children: 'Summarising…' })
          : Button({ key: 'band-handoff', label: 'Hand off', hotkey: 'h', onPress: () => openPane($, 'handoff') }),
      ],
    }),
  ]
  const record = state.handoff
  if (record) {
    const when = agoOf(Date.now(), record.createdAt)
    const headline = record.next || goalOf(record) || (record.taskDocPath || '').replace(record.cwd + '/', '') || 'previous session'
    const docMoved = record.taskDocPath && !record.docExists
    rows.push(
      Box({
        key: 'handoff-row',
        flexDirection: 'row',
        columnGap: 2,
        paddingX: 1,
        children: [
          Text({ color: 'yellow', bold: true, children: '↪ Handoff ' + when }),
          Text({ wrap: 'truncate-end', children: clip(headline, 60) }),
          ...(record.sessionGoal && record.sessionGoal !== headline
            ? [Text({ dimColor: true, wrap: 'truncate-end', children: 'from: ' + clip(record.sessionGoal, 50) })]
            : []),
          ...(docMoved ? [Text({ dimColor: true, children: '(doc moved)' })] : []),
          ...(state.olderCount ? [Text({ dimColor: true, children: '+' + state.olderCount + ' older' })] : []),
          Button({
            key: 'resume',
            label: 'Resume',
            onPress: async () => {
              const text = resumeText(record, await gitState($))
              if (RISKY.test(text)) {
                state.confirm = {
                  title: 'Resume handoff',
                  text,
                  effect: 'Starts work from a saved handoff and claims it, so other sessions are not offered it.',
                  record,
                }
                return openPane($, 'confirm')
              }
              return claimAndSend($, record, text)
            },
          }),
          Button({ key: 'dismiss', label: 'Dismiss', onPress: () => dismissHandoff($, record) }),
        ],
      }),
    )
  }
  return Box({ flexDirection: 'column', children: rows })
}

const docView = ($, c) => {
  const { e, Box, Text, Button, Markdown, Image, goto, redraw, askFirst, openHandoff, openDecision } = c
  const parts = segments(state.text)
  const openItems = parts.filter((part) => part.kind === 'item' && !part.done)
  const doneItems = parts.filter((part) => part.kind === 'item' && part.done)
  const sourceOf = (source, key) => Markdown({ key, text: '```mermaid\n' + source + '\n```' })

  const pickable = (part, key) => {
    const rank = state.selected.indexOf(part.text) + 1
    const picked = rank > 0
    return Button({
      key,
      label: (picked ? '▶' + rank + ' ' : '   ') + '[ ] ' + part.text,
      plain: true,
      dimColor: !picked && state.selected.length > 0,
      onPress: () => {
        state.selected = picked
          ? state.selected.filter((item) => item !== part.text)
          : [...state.selected, part.text]
        redraw()
      },
    })
  }

  const openBlock = []
  let lastSection = null
  const pickableItems = state.current.group === 'Task docs' ? openItems : []
  pickableItems.forEach((part, index) => {
    if (part.section !== lastSection) {
      if (part.section) openBlock.push(Text({ key: 's' + index, bold: true, dimColor: true, children: part.section }))
      lastSection = part.section
    }
    openBlock.push(pickable(part, 'o' + index))
  })

  const doneBlock = doneItems.length
    ? [
        Button({
          key: 'done-toggle',
          label: (state.showDone ? '▾' : '▸') + ' DONE (' + doneItems.length + ')',
          plain: true,
          onPress: () => {
            state.showDone = !state.showDone
            redraw()
          },
        }),
        ...(state.showDone
          ? doneItems.map((part, index) => Text({ key: 'x' + index, dimColor: true, children: '   [x] ' + part.text }))
          : []),
      ]
    : []

  const decisionFiles = state.current.decisions || []
  const decisionBytes = decisionFiles.reduce((sum, file) => sum + (file.size || 0), 0)
  const decisionsBlock = decisionFiles.length
    ? [
        Button({
          key: 'decisions-toggle',
          label:
            (state.showDecisions ? '▾' : '▸') +
            ' DECISIONS (' +
            decisionFiles.length +
            (decisionFiles.length === 1 ? ' file, ' : ' files, ') +
            kb(decisionBytes) +
            ')',
          plain: true,
          onPress: () => {
            state.showDecisions = !state.showDecisions
            redraw()
          },
        }),
        ...(state.showDecisions
          ? decisionFiles.map((file, index) =>
              Button({
                key: 'dec' + index,
                label:
                  (isOversizedDecision(file) ? '   ⚠ ' : '     ') +
                  file.name.replace(/\.md$/, '') +
                  '  ' +
                  kb(file.size) +
                  (isOversizedDecision(file) ? ' (over 40 KB)' : '') +
                  '  ›',
                plain: true,
                onPress: () => openDecision(index),
              }),
            )
          : []),
      ]
    : []

  const body = parts.map((part, index) => {
    if (part.kind === 'md') return Markdown({ key: 'm' + index, text: part.text })
    if (part.kind === 'item') {
      return Text({ key: 't' + index, dimColor: true, children: '   ' + (part.done ? '[x] ' : '[ ] ') + part.text })
    }
    const diagram = state.diagrams[hashOf(part.source)]
    if (!Image) return sourceOf(part.source, 's' + index)
    if (!diagram || diagram.status === 'rendering') {
      return Text({ key: 'w' + index, dimColor: true, children: '… rendering diagram (the first run can take a minute)' })
    }
    if (diagram.status === 'error') {
      return Box({
        key: 'e' + index,
        flexDirection: 'column',
        children: [
          Text({ color: 'red', wrap: 'truncate-end', children: 'Diagram failed: ' + diagram.message }),
          sourceOf(part.source, 's' + index),
        ],
      })
    }
    const size = fitImage(diagram.size, Math.max(20, (e.bodyColumns || 100) - 2))
    return Image({
      key: 'g' + index,
      source: { png: diagram.png },
      columns: size.columns,
      rows: size.rows,
      alt: 'Diagram not drawn here: start Claude Code with CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1',
    })
  })

  const actions = (isTop) => {
    const action = (id, label, topProps, onPress) =>
      Button({ key: isTop ? id : id + '-end', label, ...(isTop ? topProps : {}), onPress })
    return Box({
      flexDirection: 'row',
      columnGap: 2,
      children: [
        action('back', '< Back', { hotkey: 'b', autoFocus: true }, () => {
          stopWatch()
          state.selected = []
          goto('list')
        }),
        ...(state.current.group === 'Task docs'
          ? [
              action(
                'send',
                state.selected.length ? 'Read-summary, then do ' + state.selected.length + ' selected' : 'Read-summary this doc',
                { hotkey: 'g' },
                () => send($),
              ),
              action('handoff', 'Hand off', { hotkey: 'h' }, openHandoff),
            ]
          : []),
        action('refresh', 'Refresh ⚠', { hotkey: 'r' }, () =>
          askFirst('Refresh ' + state.current.label, refreshRequest(state.current), REFRESH_EFFECT),
        ),
        ...(state.current.group === 'Task docs' || isInstructionFile(state.current)
          ? [
              action('shrink', 'Shrink ⚠', { hotkey: 'k' }, () =>
                askFirst('Shrink ' + state.current.label, shrinkRequest(state.current), SHRINK_EFFECT),
              ),
            ]
          : []),
        ...(state.selected.length
          ? [
              action('clear', 'Clear', { hotkey: 'c' }, () => {
                state.selected = []
                redraw()
              }),
            ]
          : []),
      ],
    })
  }

  return Box({
    flexDirection: 'column',
    children: [
      actions(true),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Text({ bold: true, wrap: 'truncate-start', children: state.current.label }),
          Text({ dimColor: true, children: kb(state.current.size) }),
          Text({ dimColor: true, children: state.changedAt ? 'changed ' + state.changedAt : 'live' }),
        ],
      }),
      state.status ? Text({ dimColor: true, wrap: 'truncate-end', children: state.status }) : Text({ children: ' ' }),
      state.error
        ? Text({ color: 'red', children: state.error })
        : Box({
            flexDirection: 'column',
            children: [
              ...(state.current.group === 'Task docs'
                ? [
                    Text({
                      bold: true,
                      children: openItems.length
                        ? 'OPEN (' + openItems.length + ')  press items to select'
                        : 'No open items in this doc',
                    }),
                  ]
                : []),
              ...openBlock,
              ...doneBlock,
              ...decisionsBlock,
              Text({ dimColor: true, children: '─── the doc, for reading ───' }),
              ...body,
            ],
          }),
      Text({ children: ' ' }),
      actions(false),
    ],
  })
}

const decisionView = ($, c) => {
  const { Box, Text, Button, Markdown, goto, openDecision, askFirst } = c
  const files = state.current.decisions || []
  const index = files.findIndex((file) => file.path === state.decisionOpen)
  if (index < 0) return docView($, c)
  const file = files[index]
  const toDoc = (key, hotkey) =>
    Button({
      key,
      label: '< Back to doc',
      ...(hotkey ? { hotkey, autoFocus: true } : {}),
      onPress: () => goto('doc'),
    })
  return Box({
    flexDirection: 'column',
    children: [
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          toDoc('dec-back', 'b'),
          ...(index > 0 ? [Button({ key: 'dec-prev', label: '‹ Prev', hotkey: 'p', onPress: () => openDecision(index - 1) })] : []),
          ...(index < files.length - 1
            ? [Button({ key: 'dec-next', label: 'Next ›', hotkey: 'n', onPress: () => openDecision(index + 1) })]
            : []),
          Button({
            key: 'dec-condense',
            label: 'Condense ⚠',
            hotkey: 'k',
            onPress: () =>
              askFirst('Condense ' + file.name, condenseFileRequest(state.current, file), CONDENSE_FILE_EFFECT, false, state.current),
          }),
          Button({
            key: 'dec-split',
            label: 'Split ⚠',
            hotkey: 't',
            onPress: () => askFirst('Split ' + file.name, splitRequest(state.current, file), SPLIT_EFFECT, false, state.current),
          }),
        ],
      }),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Text({ bold: true, wrap: 'truncate-start', children: state.current.label + ' › ' + file.name.replace(/\.md$/, '') }),
          Text({ dimColor: true, children: kb(file.size) + ' · ' + (index + 1) + ' of ' + files.length }),
          ...(isOversizedDecision(file)
            ? [Text({ key: 'dec-over', color: 'yellow', children: '⚠ over 40 KB' })]
            : []),
        ],
      }),
      Text({ children: ' ' }),
      Markdown({ key: 'dec-md', text: state.decisionTexts[file.path] || '_Loading…_' }),
      Text({ children: ' ' }),
      toDoc('dec-back-end'),
    ],
  })
}

const docRow = (c, doc, key) => {
  const { Box, Text, Button, pickAction } = c
  const when = agoOf(state.now, doc.mtime)
  const heavy = isHeavy(doc)
  const tail = heavy
    ? heavyNote(doc)
    : doc.status
      ? when.padEnd(11) + doc.status
      : when.padEnd(11) + kb(doc.size)
  const meta = clip(doc.scope || '', SCOPE_WIDTH - 1).padEnd(SCOPE_WIDTH) + tail
  return Box({
    key,
    flexDirection: 'row',
    columnGap: 2,
    children: [
      Button({
        key: key + 'b',
        label: clip(doc.name || doc.label, NAME_WIDTH).padEnd(NAME_WIDTH),
        plain: true,
        onPress: () => pickAction(doc),
      }),
      Text({ key: key + 'm', dimColor: !heavy, color: heavy ? 'yellow' : undefined, wrap: 'truncate-end', children: meta }),
    ],
  })
}

const listView = (c) => {
  const { Box, Text, Button, Input, goto, redraw, bindField } = c
  const header = (key, title) => Text({ key, bold: true, dimColor: true, children: title })
  const needle = state.filter.trim().toLowerCase()
  const rows = [
    Box({
      key: 'list-top',
      flexDirection: 'row',
      columnGap: 2,
      children: [
        Button({
          key: 'to-menu',
          label: '< Menu',
          hotkey: 'm',
          onPress: () => {
            state.pick = null
            state.heavyOnly = false
            goto('menu')
          },
        }),
        state.pick
          ? Text({ color: 'cyan', children: 'Pick a doc to ' + state.pick })
          : Text({ dimColor: true, children: 'Pick a doc to read' }),
      ],
    }),
    Input({
      key: 'filter',
      label: 'Filter',
      placeholder: 'type to filter docs',
      value: state.filter,
      autoFocus: true,
      onInput: bindField('filter'),
      onSubmit: bindField('filter'),
    }),
  ]
  if (needle) {
    const matches = state.docs
      .filter((doc) => (doc.label + ' ' + doc.group + ' ' + (doc.scope || '')).toLowerCase().includes(needle))
      .slice(0, 40)
    rows.push(header('h-match', 'MATCHES (' + matches.length + ')'))
    matches.forEach((doc) => rows.push(docRow(c, doc, 'f' + state.docs.indexOf(doc))))
    if (!matches.length) rows.push(Text({ dimColor: true, children: 'No doc matches that.' }))
    return Box({ flexDirection: 'column', children: rows })
  }
  const heavy = heavyDocs()
  if (state.heavyOnly) {
    rows.push(header('h-heavy', 'DOCS OVER THE SIZE LIMIT (' + heavy.length + ')'))
    heavy.forEach((doc) => rows.push(docRow(c, doc, 'y' + state.docs.indexOf(doc))))
    if (!heavy.length) rows.push(Text({ dimColor: true, children: 'Nothing is over the limit.' }))
    rows.push(
      Button({
        key: 'show-all',
        label: 'Show all docs',
        plain: true,
        onPress: () => {
          state.heavyOnly = false
          redraw()
        },
      }),
    )
    return Box({ flexDirection: 'column', children: rows })
  }
  const recent = recentDocs()
  if (recent.length) {
    rows.push(header('h-recent', 'CHANGED LATELY'))
    recent.forEach((doc) => rows.push(docRow(c, doc, 'r' + state.docs.indexOf(doc))))
  }
  if (heavy.length) {
    rows.push(header('h-heavy', 'NEEDS SHRINKING (' + heavy.length + ')'))
    heavy.forEach((doc) => rows.push(docRow(c, doc, 'y' + state.docs.indexOf(doc))))
  }
  GROUPS.forEach((group) => {
    const inGroup = state.docs.filter((doc) => doc.group === group)
    if (!inGroup.length) return
    const title =
      group === 'Task docs'
        ? 'ALL TASK DOCS (' + inGroup.length + ')'
        : group === 'Skills'
          ? 'SYAFIQKIT SKILLS (' + inGroup.length + ')'
          : group.toUpperCase()
    rows.push(header('h-' + group, title))
    inGroup.forEach((doc) => rows.push(docRow(c, doc, 'd' + state.docs.indexOf(doc))))
  })
  if (!state.docs.length) rows.push(Text({ dimColor: true, children: state.error || 'No docs found from here.' }))
  return Box({ flexDirection: 'column', children: rows })
}

const menuView = ($, c) => {
  const { Box, Text, Button, goto, openHandoff, askFirst } = c
  const rows = [Text({ key: 'menu-title', bold: true, children: 'What do you want to do?' })]
  VERBS.forEach((verb, index) => {
    rows.push(
      Box({
        key: 'v' + index,
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Button({
            key: 'vb' + index,
            label: (verb.label + (verb.danger ? ' ⚠' : '')).padEnd(18),
            hotkey: String(index + 1),
            plain: true,
            ...(index === 0 ? { autoFocus: true } : {}),
            onPress: () => {
              if (verb.go === 'list') return goto('list')
              if (verb.go === 'heavy') {
                state.heavyOnly = true
                state.pick = 'shrink'
                return goto('list')
              }
              if (verb.go === 'refresh') {
                state.heavyOnly = false
                state.pick = 'refresh'
                return goto('list')
              }
              if (verb.go === 'handoff') return openHandoff()
              if (verb.danger) return askFirst(verb.label, verb.text, verb.effect, true)
              return submitPrompt($, verb.text, verb.toast)
            },
          }),
          Text({ key: 'vh' + index, dimColor: true, wrap: 'truncate-end', children: verb.hint }),
        ],
      }),
    )
  })
  rows.push(Text({ key: 'menu-note', dimColor: true, children: '⚠ shows exactly what will be sent, then asks again' }))
  return Box({ flexDirection: 'column', children: rows })
}

const confirmView = ($, c) => {
  const { Box, Text, Button, Input, redraw, goto, bindField } = c
  const confirm = state.confirm
  if (!confirm) return menuView($, c)
  return Box({
    flexDirection: 'column',
    children: [
      Text({ bold: true, children: 'Confirm: ' + confirm.title }),
      ...(confirm.effect ? [Text({ color: 'yellow', wrap: 'truncate-end', children: 'Effect: ' + confirm.effect })] : []),
      Text({ dimColor: true, children: 'This goes to Claude, which will act on it:' }),
      Box({
        key: 'confirm-box',
        flexDirection: 'column',
        borderStyle: 'round',
        paddingX: 1,
        children: confirm.text.split('\n').map((line, index) => Text({ key: 'c' + index, children: line || ' ' })),
      }),
      ...(confirm.offerHandoff
        ? [
            Button({
              key: 'also-handoff',
              label: (state.alsoHandoff ? '☑' : '☐') + ' Also hand off to the next session when this finishes (optional)',
              hotkey: 'o',
              plain: true,
              onPress: () => {
                state.alsoHandoff = !state.alsoHandoff
                redraw()
              },
            }),
          ]
        : []),
      ...(confirm.offerHandoff && state.alsoHandoff
        ? [
            Input({
              key: 'handoff-message',
              label: 'Message',
              placeholder: 'optional: what the next session should do first',
              value: state.handoffNext,
              onInput: bindField('handoffNext'),
              onSubmit: bindField('handoffNext'),
            }),
          ]
        : []),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Button({
            key: 'confirm-send',
            label: 'Send',
            hotkey: 's',
            onPress: () => {
              if (confirm.record) return claimAndSend($, confirm.record, confirm.text)
              if (confirm.reopen) state.reopen = confirm.reopen
              const later = confirm.offerHandoff && state.alsoHandoff ? { next: state.handoffNext.trim(), armed: false } : null
              return submitPrompt($, confirm.text, 'Sent: ' + confirm.title.toLowerCase(), undefined, later)
            },
          }),
          Button({
            key: 'confirm-cancel',
            label: 'Cancel',
            hotkey: 'x',
            autoFocus: true,
            onPress: () => {
              const back = confirm.back && confirm.back !== 'confirm' ? confirm.back : 'menu'
              if (back !== 'list') state.pick = null
              goto(back)
            },
          }),
        ],
      }),
    ],
  })
}

const handoffView = ($, c) => {
  const { Box, Text, Button, Input, goto, bindField, saveFromForm } = c
  const doc = state.current || state.lastDoc
  const carries = [
    'a summary of this conversation (one quick model call)',
    'the files touched',
    'git state',
    ...(doc && doc.group === 'Task docs' ? [doc.label] : []),
    ...(state.selected.length ? [state.selected.length + ' picked items'] : []),
  ]
  return Box({
    flexDirection: 'column',
    children: [
      Text({ bold: true, children: 'Hand off this session' }),
      Text({ dimColor: true, children: 'Saves: ' + carries.join(', ') + '.' }),
      Input({
        key: 'handoff-next',
        label: 'Next',
        placeholder: 'optional: what the next session should do first',
        value: state.handoffNext,
        autoFocus: true,
        onInput: bindField('handoffNext'),
        onSubmit: (value) => {
          state.handoffNext = value
          return saveFromForm(value)
        },
      }),
      state.saving
        ? Text({ color: 'cyan', children: 'Summarising this session…' })
        : Box({
            flexDirection: 'row',
            columnGap: 2,
            children: [
              Button({
                key: 'handoff-save',
                label: 'Save handoff',
                hotkey: 'v',
                onPress: () => saveFromForm(state.handoffNext),
              }),
              Button({
                key: 'handoff-cancel',
                label: 'Cancel',
                hotkey: 'x',
                onPress: () => (state.handoffFromBand ? closePane($) : goto(state.current ? 'doc' : 'menu')),
              }),
            ],
          }),
    ],
  })
}

const paneContext = ($, e) => {
  const atoms = $.ui.resolve(e)
  const redraw = () => $.ui.invalidate('ui.render')

  const goto = (view) => {
    state.view = view
    redraw()
  }

  const open = async (doc) => {
    await loadDoc($, doc)
    redraw()
  }

  const openDecision = async (index) => {
    const file = state.current ? (state.current.decisions || [])[index] : null
    if (!file) return
    state.decisionOpen = file.path
    state.view = 'decision'
    redraw()
    if (state.decisionTexts[file.path] === undefined) {
      state.decisionTexts[file.path] = await readDecision($, file)
      redraw()
    }
  }

  const askFirst = (title, text, effect, offerHandoff, reopen) => {
    state.confirm = { title, text, effect, offerHandoff: Boolean(offerHandoff), back: state.view, reopen: reopen || null }
    state.alsoHandoff = false
    state.handoffNext = ''
    goto('confirm')
  }

  const pickAction = (doc) => {
    if (state.pick === 'refresh') return askFirst('Refresh ' + doc.label, refreshRequest(doc), REFRESH_EFFECT)
    if (state.pick === 'shrink') return askFirst('Shrink ' + doc.label, shrinkRequest(doc), SHRINK_EFFECT)
    return open(doc)
  }

  const openHandoff = () => {
    state.handoffNext = ''
    goto('handoff')
  }

  const saveFromForm = async (message) => {
    await runHandoff($, message.trim())
    if (state.handoffFromBand) return closePane($)
    return goto('menu')
  }

  const bindField = (field) => (value) => {
    state[field] = value
    redraw()
  }

  return { e, ...atoms, redraw, goto, open, openDecision, askFirst, pickAction, openHandoff, saveFromForm, bindField }
}

const paneView = async ($, e, next) => {
  if (e.requestId !== PANE) return next(e)
  const c = paneContext($, e)
  if (state.view === 'menu') return menuView($, c)
  if (state.view === 'confirm') return confirmView($, c)
  if (state.view === 'handoff') return handoffView($, c)
  if (state.view === 'decision' && state.current) return decisionView($, c)
  if (state.view === 'doc' && state.current) return docView($, c)
  return listView(c)
}

export function register(on) {
  on('session.start', async ($, e, next) => {
    let off = ''
    try {
      off = (await $.env.get('SYAFIQKIT_MOD')) || ''
    } catch {
      off = ''
    }
    if (off === '0') {
      state.disabled = true
      return next(e)
    }
    await registerCommand($, COMMAND, 'Browse task docs, CLAUDE.md files and project docs')
    await registerCommand($, MENU_COMMAND, 'Open the syafiqkit menu: commit, ship, done, docs, hand off')
    await loadHandoff($)
    $.clock.every(HANDOFF_POLL_MS, () => loadHandoff($))
    return next(e)
  })

  on('classic.SessionStart', async ($, e, next) => {
    if (state.disabled) return next(e)
    if (e.source === 'clear' || e.source === 'resume' || e.source === 'fork') {
      state.ownHandoff = ''
      state.dismissed = ''
      state.lastDoc = null
      state.reopen = null
      state.pendingHandoff = null
      state.confirm = null
      state.alsoHandoff = false
    }
    await loadHandoff($)
    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($) => {
    await openPane($, 'list')
    return {}
  })

  on('command.run', { command: MENU_COMMAND }, async ($) => {
    await openPane($, 'menu')
    return {}
  })

  on('ui.render', { component: 'AbovePrompt' }, bandView)

  on('turn.start', (_$, e, next) => {
    if (state.pendingHandoff && !e.agentId) state.pendingHandoff.armed = true
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const ran = await next(e)
    if (state.pendingHandoff && state.pendingHandoff.armed && !e.agentId) {
      const note = state.pendingHandoff.next
      state.pendingHandoff = null
      runHandoff($, note)
    }
    return ran
  })

  on('tool.call', async ($, e, next) => {
    const ran = await next(e)
    if (state.view === 'doc' && state.current && EDIT_TOOLS.has(e.tool) && e.file_path === state.current.path) {
      await refresh($)
    }
    return ran
  })

  on('ui.close', ($, e, next) => {
    if (e.id === PANE || e.requestId === PANE) {
      resetPane()
      state.isOpen = false
      $.ui.invalidate('ui.render')
    }
    return next(e)
  })

  on('ui.render', { component: 'Pane' }, paneView)
}
