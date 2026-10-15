const MOD_VERSION = '1.399.0'
const PANE = 'doc-pane'
const COMMAND = 'task-docs'
const MENU_COMMAND = 'sk'
const CHANGES_COMMAND = 'changes'
const MAX_ENTRIES = 60
const MAX_CHARS = 90000
const POLL_MS = 2000
const GIT_TIMEOUT_MS = 15000
const HANDOFF_POLL_MS = 4000
const MAX_HANDOFF_DEFERRALS = 3
const HANDOFF_EXPIRES_MS = 24 * 60 * 60 * 1000
const RECENT_COUNT = 5
const ITEM_CAP_ROWS = 3
const NAME_WIDTH = 26
const SCOPE_WIDTH = 24
const NARROW_COLUMNS = 60
const MEASURE_FROM_BYTES = 8000
const TASK_DOC_MAX_LINES = 300
const DECISION_MAX_BYTES = 40 * 1024
const CLAUDE_MD_MAX_LINES = 200
const CLAUDE_MD_MAX_BYTES = 40000
const NESTED_SCAN_DEPTH = 4
const NESTED_SCAN_FOLDERS = 400
const NESTED_SCAN_SKIP = ['node_modules', 'vendor', 'dist', 'build', 'storage', 'tasks']
const DIFF_CONTEXT = 3
const DIFF_MAX_LINES = 400
const DESKTOP_STRIP_ROWS = 2
const DESKTOP_PAGE_BAR_ROWS = 4
const WINDOW_ROWS = 60
const TOP_BUTTON_AFTER = 3
const CLOSE_REDRAW_MS = 400
const TOP_BUTTON_ROWS = 3
const STICKY_AFTER = 1
const STICKY_COVER_ROWS = 3
const STICKY_PREFIX = 'stk-'
const LIST_FOLD_FROM = 40
const LIST_TOP_ROWS = 3
const DESKTOP_WRAP_CHARS = 140
const DESKTOP_MAP_ROWS = 3
const CHANGES_POLL_MS = 5000
const SHOW_IMAGE_TOOL = 'mcp__syafiqkit__show_image'
const MAX_GALLERY = 12
const MAX_GALLERY_BYTES = 12 * 1024 * 1024
const MAX_GALLERY_BASE64 = 16 * 1024 * 1024
const PNG_PREFIX = 'iVBORw0KGgo'
const SPLIT_MIN_COLUMNS = 100
const TREE_COLUMNS = 42
const COUNTS_WIDTH = 11
const DESKTOP_DIFF = { added: '#1b3a2a', removed: '#40232a', addedWord: '#2e6b49', removedWord: '#7c3340' }
const SYNTAX_MAX_CHARS = 400
const SYNTAX_TONE = {
  keyword: '#c678dd',
  string: '#e5a56b',
  number: '#d19a66',
  call: '#61afef',
  type: '#e5c07b',
  comment: '#7f848e',
}
const DESKTOP_TONE = {
  strip: '#1f2633',
  stripHot: '#24324a',
  warnStrip: '#3a2f14',
  mutedChip: '#2c2f36',
  addChip: '#1e5b3a',
  delChip: '#6b2330',
  warnChip: '#6b5a1e',
  modChip: '#5a4a1a',
  renChip: '#1f4a5a',
  addBlock: '#2e6b49',
  addBlockHot: '#3fa86b',
  delBlock: '#7c3340',
  delBlockHot: '#c0505e',
  mixBlock: '#5b6a3a',
  mixBlockHot: '#8aa055',
  meter: '#5b8ad0',
  warnMeter: '#d0a03a',
  meterTrack: '#2c2f36',
  border: '#3a3f4a',
  gapRow: '#1a1d23',
  page: '#1e1e1e',
}
const DESKTOP_MAP_CELLS = 64
const LITERAL_PATHS = { GIT_LITERAL_PATHSPECS: '1' }
const REPO_COUNT_EVERY = 5
const DIFF_BATCH = 8
const MAX_UNTRACKED_BYTES = 256 * 1024
const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit'])
const ITEM = /^\s*[-*]\s+\[( |x|X)\]\s+(.+)$/
const FENCE = /^\s*```(\S*)\s*$/
const HEADING = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/
const RISKY = /\b(ship|push|merge|delete|deploy|drop|reset)\b/i
const MERMAID_PACKAGE = '@mermaid-js/mermaid-cli@12.0.0'
const MERMAID_TIMEOUT_MS = 240000
const MAX_IMAGE_ROWS = 60
const MAX_BASE64 = Math.floor((2 * 1024 * 1024 * 4) / 3)
const DESKTOP_DRAW_CHARS = 90000
const DESKTOP_DRAW_LIMIT = 95000
const MAX_HOVER_SCOPE = 64
const SPACER_MAX_ROWS = 10000
const MOD_LOG_FILE = 'mod.log'
const MOD_LOG_LINES = 300
const PREVIEW_STEPS = [[1080, 60], [900, 50], [720, 45], [600, 40]]
const PREVIEW_TIMEOUT_MS = 20000
const PICTURE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'heic'])
const MEDIA_PAIR_CHARS = 30000
const MEDIA_PAIR_WIDTH = 360
const MEDIA_ROW_PX = 20
const SLICE_WIDTH = 1000
const SLICE_HEIGHT = 520
const SLICE_CHARS = 85000
const SLICE_QUALITIES = [60, 45, 35]
const PDF_PAGE_SIDE = 1100
const DESKTOP_PICTURE_WIDTH = 720
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
  { label: 'Changes', hint: 'review diffs, stage, unstage, discard', go: 'changes' },
  { label: 'Images', hint: 'screenshots Claude showed you', go: 'images' },
]

const parentOf = (path) => {
  const cut = path.lastIndexOf('/')
  return cut > 0 ? path.slice(0, cut) : ''
}

const isDirectory = (entry) => entry.kind !== 'file' && !entry.isLink && !entry.name.startsWith('.')

const kb = (bytes) => (typeof bytes === 'number' ? (bytes / 1024).toFixed(1) + ' KB' : '')

const clip = (text, width) => (text.length > width ? text.slice(0, width - 1) + '…' : text)

const clipStart = (text, width) => (text.length > width ? '…' + text.slice(text.length - width + 1) : text)

const cellWidth = (char) => (/\p{Extended_Pictographic}/u.test(char) ? 2 : 1)

const cellsOf = (chars) => chars.reduce((sum, char) => sum + cellWidth(char), 0)

const wrapWords = (text, width) => {
  const lines = []
  let line = ''
  let used = 0
  const flush = () => {
    if (used) lines.push(line)
    line = ''
    used = 0
  }
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let rest = [...word]
    while (cellsOf(rest) > width) {
      flush()
      let take = 0
      while (cellsOf(rest.slice(0, take + 1)) <= width) take += 1
      lines.push(rest.slice(0, take).join(''))
      rest = rest.slice(take)
    }
    const need = cellsOf(rest)
    if (used && used + 1 + need > width) flush()
    line += (used ? ' ' : '') + rest.join('')
    used += (used ? 1 : 0) + need
  }
  flush()
  return lines.length ? lines : ['']
}

const docLabel = (doc, width) => (doc.listName ? clipStart(doc.listName, width) : doc.name || doc.label)

const messageOf =(error) => String(error && error.message ? error.message : error)

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

const isHubText = (text) => {
  const hit = text.match(/^\W*Domain\s*:.*$/im)
  return Boolean(hit && /\(\s*hub\s*[:;,)]/i.test(hit[0]))
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
  if (big.length) parts.push(big.length > 1 ? big.length + ' decisions, max ' + kb(big[0].size) : 'decisions ' + kb(big[0].size))
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

const MOD_INSTANCE = Math.random().toString(36).slice(2, 6)
let modLogPath = ''
let modLogLast = ''
let modLogQueue = Promise.resolve()

const appendModLog = async ($, entry) => {
  if (!modLogPath) {
    const home = await homeOf($)
    if (!home) return
    modLogPath = home + '/.claude/doc-pane-cache/' + MOD_LOG_FILE
  }
  let previous = ''
  try {
    previous = String((await $.fs.read(modLogPath)) || '')
  } catch {
    previous = ''
  }
  const lines = [...previous.split('\n').filter(Boolean), entry].slice(-MOD_LOG_LINES)
  await $.fs.write(modLogPath, lines.join('\n') + '\n')
}

const modLog = ($, line) => {
  if (line === modLogLast) return modLogQueue
  modLogLast = line
  const entry = new Date().toISOString() + ' [' + MOD_INSTANCE + '] ' + line
  modLogQueue = modLogQueue.then(() => appendModLog($, entry)).catch(() => {})
  return modLogQueue
}

const childrenOf = (node) => {
  if (!node || typeof node !== 'object') return []
  const kids = Array.isArray(node.children) ? node.children : node.props && Array.isArray(node.props.children) ? node.props.children : []
  return kids.filter((kid) => kid && typeof kid === 'object')
}

const keyOf = (node) => (node.props && node.props.key !== undefined ? node.props.key : node.key)

const treeProblem = (node) => {
  const kids = childrenOf(node)
  const seen = new Set()
  for (const kid of kids) {
    const key = keyOf(kid)
    if (key !== undefined && key !== null) {
      if (seen.has(key)) return 'two elements share the key "' + String(key).slice(0, 60) + '"'
      seen.add(key)
    }
    const scope = kid.props && kid.props.hover && kid.props.hover.scope
    if (typeof scope === 'string' && scope.length > MAX_HOVER_SCOPE) return 'a hover scope is ' + scope.length + ' characters (limit ' + MAX_HOVER_SCOPE + ')'
    const inner = treeProblem(kid)
    if (inner) return inner
  }
  return ''
}

const drawingSize = (tree) => {
  try {
    return JSON.stringify(tree).length
  } catch {
    return 0
  }
}

let gitQueue = Promise.resolve()

const gitRun = ($, argv, init) => {
  const ran = gitQueue.then(() => $.process.run(argv, { timeoutMs: GIT_TIMEOUT_MS, ...(init || {}) }))
  gitQueue = ran.catch((error) => modLog($, 'git ' + argv.slice(1, 5).join(' ') + ' failed: ' + messageOf(error).slice(0, 200)))
  return ran
}

const state = {
  view: 'list',
  docs: [],
  cwd: '',
  home: '',
  now: 0,
  filter: '',
  heavyOnly: false,
  collapsed: {},
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
  changes: { repo: '', entries: [], hasHead: false, error: '', raw: '', loaded: false },
  changeCount: 0,
  changesCollapsed: {},
  changeFile: null,
  changeDiff: null,
  diffBack: 'changes',
  docBack: null,
  allDiffs: {},
  allSig: {},
  allOpen: {},
  desktop: false,
  allScroll: { view: '', offset: 0, body: 0 },
  expandItems: false,
  windowAt: 0,
  topShown: false,
  stickyShown: false,
  stickyTop: null,
  stickySection: null,
  windowed: false,
  repoFound: [],
  repoManual: [],
  repoHidden: {},
  repoCounts: {},
  repoRoot: '',
  repoForm: false,
  repoPath: '',
  repoNote: '',
  pollTick: 0,
  polling: false,
  allLoaded: false,
  allStatus: '',
  diffGen: 0,
  allFull: {},
  diffSectionClosed: {},
  images: [],
  galleryRestore: null,
  changeFocus: '',
  wide: false,
  discard: null,
}

let queue = []
let busy = false

const invalidatePane = ($) => {
  if (state.isOpen) $.ui.invalidate('ui.render')
}

const openPaneWindow = async ($, label) => {
  try {
    const opened = await $.ui.open({ id: PANE, title: 'syafiqkit', focus: true, closeOnEscape: true, columns: 110 })
    if (!opened || !opened.isPlaced) modLog($, 'open ' + label + ': not placed')
  } catch (error) {
    modLog($, 'open ' + label + ' failed: ' + messageOf(error).slice(0, 200))
    state.isOpen = false
    $.ui.invalidate('ui.render')
    throw error
  }
}

const redrawBandAfterClose = async ($) => {
  try {
    await $.clock.sleep(CLOSE_REDRAW_MS)
    if (!state.isOpen) $.ui.invalidate('ui.render')
  } catch (error) {
    modLog($, 'close redraw failed: ' + messageOf(error).slice(0, 200))
  }
}

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
    invalidatePane($)
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

const systemOf = async ($) => {
  try {
    return ((await $.process.run(['uname'])).stdout || '').trim()
  } catch {
    return ''
  }
}

const clipboardCommand = async ($) => {
  const system = await systemOf($)
  if (system === 'Darwin') return ['pbcopy']
  if (system === 'Linux') return ['xclip', '-selection', 'clipboard']
  return ['clip']
}

const copyDocFile = async ($, path, name, surface) => {
  let text = ''
  try {
    text = await $.fs.read(path)
  } catch (error) {
    return $.ui.toast('Could not read ' + name + ': ' + messageOf(error).slice(0, 80))
  }
  try {
    const copied = await $.ui.copy({ text, ...(surface ? { surface } : {}) })
    if (copied && copied.isCopied) return $.ui.toast('Copied ' + name + ' to the clipboard.')
    if (copied && copied.reason === 'refused') return $.ui.toast('Copy was refused.')
  } catch {}
  try {
    const ran = await $.process.run(await clipboardCommand($), { stdin: text })
    if (ran.exitCode === 0) return $.ui.toast('Copied ' + name + ' to the clipboard.')
    $.ui.toast('Could not copy: ' + (ran.stderr || 'clipboard tool failed').trim().slice(0, 80))
  } catch (error) {
    $.ui.toast('Could not copy: ' + messageOf(error).slice(0, 80))
  }
}

const openInEditor = async ($, path) => {
  try {
    const ran = await $.process.run(await viewerCommand($, path))
    if (ran.exitCode !== 0) $.ui.toast('Could not open the doc: ' + (ran.stderr || 'no app opened it').trim().slice(0, 80))
  } catch (error) {
    $.ui.toast('Could not open the doc: ' + messageOf(error).slice(0, 80))
  }
}

const registerImageTool = async ($) => {
  try {
    await $.tool.register({
      name: 'show_image',
      isDeferred: false,
      description:
        "Show PNG images to the user in the syafiqkit side pane instead of reporting a file path. Use it for e2e or Playwright screenshots saved under /tmp, rendered charts, and any picture the user should look at. Paths must be absolute and PNG; pass several to open them as a gallery. On Desktop a picture over about 65 KB is shown as a smaller copy on macOS (full size in the system viewer); a picture that still cannot be drawn, or one over 2 MiB in a terminal, shows a button that opens it in the system viewer instead; nothing draws in the VS Code panel, so report the file path there.",
      inputSchema: {
        type: 'object',
        properties: {
          paths: { type: 'array', items: { type: 'string' }, description: 'Absolute paths of PNG files' },
          caption: { type: 'string', description: 'Optional one-line note shown with the images' },
        },
        required: ['paths'],
      },
    })
  } catch {
    return
  }
}

const ABSOLUTE_PATH = /^(\/|[A-Za-z]:[\\/])/

const readGalleryImage = async ($, path, caption) => {
  if (!ABSOLUTE_PATH.test(path)) return { refused: path + ' (not an absolute path)' }
  try {
    const stat = await $.fs.stat(path)
    if (stat.size > MAX_GALLERY_BYTES) return { refused: path + ' (over 12 MiB)' }
    const { base64 } = await $.fs.read(path, { as: 'bytes' })
    if (!base64 || !base64.startsWith(PNG_PREFIX)) return { refused: path + ' (not a PNG; only PNG files can be drawn)' }
    if (base64.length > MAX_GALLERY_BASE64) return { refused: path + ' (over 16 MiB)' }
    const inline = base64.length <= MAX_BASE64
    return { image: { path, name: nameOf(path), size: pngSize(base64), caption, png: inline ? base64 : '' } }
  } catch {
    return { refused: path + ' (could not be read)' }
  }
}

const shrinkForDesktop = async ($, image) => {
  if (!state.desktop || !image.size || svgPicture(image)) return image
  try {
    const home = await homeOf($)
    if (!home) return image
    const dir = home + '/.claude/doc-pane-cache'
    await $.fs.write(dir + '/.previews', 'ok')
    for (const [side, quality] of PREVIEW_STEPS) {
      const out = dir + '/' + hoverScope(image.path) + '-' + side + '.jpg'
      const ran = await $.process.run(
        ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality), '-Z', String(side), image.path, '--out', out],
        { timeoutMs: PREVIEW_TIMEOUT_MS },
      )
      if (ran.exitCode !== 0) {
        modLog($, 'picture ' + image.path + ': sips could not shrink it: ' + (ran.stderr || '').trim().slice(0, 200))
        return image
      }
      const { base64 } = await $.fs.read(out, { as: 'bytes' })
      const shrunk = { ...image, preview: base64 }
      if (svgPicture(shrunk)) return shrunk
    }
  } catch (error) {
    modLog($, 'picture ' + image.path + ': no smaller copy: ' + messageOf(error).slice(0, 200))
    return image
  }
  modLog($, 'picture ' + image.path + ': still too big after shrinking')
  return image
}

const galleryIndexPath = async ($) => {
  const [home, id] = await Promise.all([homeOf($), $.session.id().catch(() => '')])
  if (!home || !id) return ''
  return home + '/.claude/doc-pane-cache/gallery-' + id + '.json'
}

const saveGallery = async ($) => {
  try {
    const path = await galleryIndexPath($)
    if (path) await $.fs.write(path, JSON.stringify(state.images.map((image) => ({ path: image.path, caption: image.caption || '' }))))
  } catch (error) {
    modLog($, 'gallery: could not save the list: ' + messageOf(error).slice(0, 200))
  }
}

const restoreGallery = ($) => {
  if (state.galleryRestore) return state.galleryRestore
  state.galleryRestore = (async () => {
    try {
      const path = await galleryIndexPath($)
      if (!path || state.images.length) return
      const saved = JSON.parse(await $.fs.read(path))
      if (!Array.isArray(saved)) return
      const entries = saved.filter((item) => item && typeof item.path === 'string').slice(-MAX_GALLERY)
      const read = await Promise.all(entries.map((item) => readGalleryImage($, item.path, typeof item.caption === 'string' ? item.caption : '')))
      const restored = []
      for (const item of read) if (item.image) restored.push(await shrinkForDesktop($, item.image))
      if (restored.length && !state.images.length) {
        state.images = restored
        redrawPane($)
      }
    } catch {}
  })()
  return state.galleryRestore
}

const showImages = async ($, e) => {
  await restoreGallery($)
  const raw = Array.isArray(e.paths) ? e.paths : typeof e.path === 'string' ? [e.path] : []
  const wanted = [...new Set(raw.filter((path) => typeof path === 'string' && path))]
  const paths = wanted.slice(0, MAX_GALLERY)
  if (!paths.length) return 'Nothing shown: pass paths, an array of absolute PNG file paths.'
  const caption = typeof e.caption === 'string' ? e.caption.slice(0, 200) : ''
  const read = await Promise.all(paths.map((path) => readGalleryImage($, path, caption)))
  const added = []
  for (const item of read) if (item.image) added.push(await shrinkForDesktop($, item.image))
  const refused = read.filter((item) => item.refused).map((item) => item.refused)
  const lines = []
  if (added.length) {
    const kept = state.images.filter((image) => !added.some((fresh) => fresh.path === image.path))
    state.images = [...kept, ...added].slice(-MAX_GALLERY)
    await saveGallery($)
    const noun = added.length + (added.length === 1 ? ' image' : ' images')
    $.ui.toast(noun + ' ready: press Images in the band')
    redrawPane($)
    lines.push(
      'Added ' + noun + ' to the syafiqkit gallery. ' +
        'The pane does not open by itself; the user opens it with the Images button in the band.',
    )
    const undrawn = added.filter((image) => (state.desktop ? !svgPicture(image) : !image.png)).length
    if (undrawn) lines.push(undrawn + ' of them are too large to draw in the pane; the user opens them with Open in viewer')
  }
  if (wanted.length > paths.length) lines.push(wanted.length - paths.length + ' more paths were not added (limit ' + MAX_GALLERY + ' per call)')
  if (refused.length) lines.push('Not shown: ' + refused.join('; '))
  return lines.join('\n')
}

const viewerCommand = async ($, path) => {
  const system = await systemOf($)
  if (system === 'Darwin') return ['open', path]
  if (system === 'Linux') return ['xdg-open', path]
  return ['cmd', '/c', 'start', '', path]
}

const openInViewer = async ($, path) => {
  try {
    const ran = await $.process.run(await viewerCommand($, path))
    if (ran.exitCode !== 0) $.ui.toast('Could not open the image: ' + (ran.stderr || 'viewer failed').trim().slice(0, 80))
  } catch (error) {
    $.ui.toast('Could not open the image: ' + messageOf(error).slice(0, 80))
  }
}

const openImages = async ($) => {
  try {
    stopWatch()
    state.view = 'images'
    state.current = null
    state.isOpen = true
    redrawPane($)
    await $.ui.open({ id: PANE, title: 'syafiqkit', focus: true, closeOnEscape: true, columns: 110 })
  } catch {
    state.isOpen = false
    redrawPane($)
  }
}

const sliceGeometry = (size) => {
  const width = Math.min(size.width, SLICE_WIDTH)
  const height = Math.round((size.height * width) / size.width)
  return { width, height, count: Math.max(1, Math.ceil(height / SLICE_HEIGHT)) }
}

const slicesWanted = (image) => Boolean(image.size) && (sliceGeometry(image.size).count > 1 || image.size.width > DESKTOP_PICTURE_WIDTH)

const ensureSlice = async ($, image, index) => {
  if (!state.desktop || !image.size) return
  image.slices = image.slices || {}
  if (index in image.slices || image.slicing) return
  image.slicing = true
  try {
    const geo = sliceGeometry(image.size)
    const dir = await mediaDir($)
    if (!dir) {
      image.slices[index] = null
      return
    }
    const stem = dir + '/' + hoverScope(image.path) + '-z'
    let source = image.path
    if (image.size.width > SLICE_WIDTH) {
      source = stem + '-wide.png'
      if (!image.scaled) {
        await sipsRun($, ['--resampleWidth', String(SLICE_WIDTH), image.path, '--out', source])
        image.scaled = true
      }
    }
    const top = index * SLICE_HEIGHT
    const high = Math.min(SLICE_HEIGHT, geo.height - top)
    let drawn = null
    for (const quality of SLICE_QUALITIES) {
      const out = stem + '-' + index + '.jpg'
      await sipsRun($, ['-c', String(high), String(geo.width), '--cropOffset', String(top), '0', ...jpegArgs(quality), source, '--out', out])
      const { base64 } = await $.fs.read(out, { as: 'bytes' })
      drawn = svgOf(base64, 'jpeg', { width: geo.width, height: high }, SLICE_CHARS, SLICE_WIDTH)
      if (drawn) break
    }
    image.slices[index] = drawn
  } catch (error) {
    modLog($, 'picture ' + image.path + ': slice ' + index + ' failed: ' + messageOf(error).slice(0, 200))
    image.slices[index] = null
  } finally {
    image.slicing = false
  }
  const wanted = image.slice || 0
  if (!(wanted in image.slices)) await ensureSlice($, image, wanted)
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

const svgOf = (data, mime, size, limit = DESKTOP_DRAW_CHARS, widest = DESKTOP_PICTURE_WIDTH) => {
  const { width, height } = size || {}
  if (!data || !width || !height) return null
  const wide = Math.min(width, widest)
  const high = Math.round((wide * height) / width)
  const source =
    '<svg xmlns="http://www.w3.org/2000/svg" width="' + wide + '" height="' + high + '" viewBox="0 0 ' + wide + ' ' + high + '">' +
    '<image href="data:image/' + mime + ';base64,' + data + '" width="' + wide + '" height="' + high + '"/></svg>'
  if (source.length > limit) return null
  return { source, width: wide, height: high }
}

const svgPicture = (image) => svgOf(image.png, 'png', image.size) || (image.preview ? svgOf(image.preview, 'jpeg', image.size) : null)

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
    invalidatePane($)
  } catch {
    if (state.current && state.current.path === path) {
      state.error = 'Could not re-read ' + path
      invalidatePane($)
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
  state.diffGen += 1
  state.allScroll = { view: '', offset: 0, body: state.allScroll.body }
}

const closePane = async ($) => {
  try {
    await $.ui.close({ id: PANE })
  } catch (error) {
    modLog($, 'close: ' + messageOf(error).slice(0, 200))
  }
  state.isOpen = false
  resetPane()
  redrawBandAfterClose($)
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

const runGit = async ($, args) => {
  try {
    const ran = await gitRun($, ['git', ...args], { cwd: state.changes.repo, env: LITERAL_PATHS })
    if (ran.exitCode !== 0) {
      $.ui.toast('git ' + args[0] + ' failed: ' + (ran.stderr || ran.stdout).trim().slice(0, 100))
      return false
    }
    return true
  } catch (error) {
    $.ui.toast('git ' + args[0] + ' failed: ' + messageOf(error).slice(0, 100))
    return false
  }
}

const stagePaths = ($, paths) => runGit($, ['add', '--', ...paths])

const unstagePaths = ($, paths) =>
  state.changes.hasHead ? runGit($, ['restore', '--staged', '--', ...paths]) : runGit($, ['rm', '-r', '--cached', '-q', '--', ...paths])

const stageAll = ($) => runGit($, ['add', '-A'])

const unstageAll = ($) =>
  state.changes.hasHead ? runGit($, ['restore', '--staged', '.']) : runGit($, ['rm', '-r', '--cached', '-q', '.'])

const discardPath = ($, entry) =>
  entry.y === '?' ? runGit($, ['clean', '-f', '--', entry.path]) : runGit($, ['restore', '--', entry.path])

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

const defaultFocus = () => (sectionEntries(state.changes.entries, 'worktree').length ? 'worktree:' : '')

const focusOn = ($, focus) => {
  state.changeFocus = focus
  redrawPane($)
  if (showsAllDiffs()) loadAllDiffs($, true).then(() => invalidatePane($), () => {})
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

const openChangeAll = ($, focus = '') => {
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

const watchChanges = ($) => {
  stopWatch()
  state.stop = $.clock.every(POLL_MS, () => refreshChanges($))
}

const enterChanges = async ($) => {
  stopWatch()
  state.view = 'changes'
  state.allScroll = { view: '', offset: 0, body: state.allScroll.body }
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
  state.isOpen = true
  await openPaneWindow($, 'changes')
  await enterChanges($)
}

const showFileDiff = async ($, file, back) => {
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

const toggleStageFolder = async ($, plane, path) => {
  const paths = sectionEntries(state.changes.entries, plane)
    .filter((entry) => entry.path.startsWith(path))
    .flatMap(plane === 'staged' ? fileTargets : stageTargets)
  if (!paths.length) return
  if (plane === 'staged') await unstageThese($, paths)
  else await stageThese($, paths)
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

const wordSpan = (before, after) => {
  let head = 0
  const most = Math.min(before.length, after.length)
  while (head < most && before[head] === after[head]) head++
  let tail = 0
  while (tail < most - head && before[before.length - 1 - tail] === after[after.length - 1 - tail]) tail++
  if (head + tail === 0) return null
  return { before: [head, before.length - tail], after: [head, after.length - tail] }
}

const markWordChanges = (lines) => {
  let at = 0
  while (at < lines.length) {
    if (lines[at].kind !== 'del') {
      at++
      continue
    }
    const delStart = at
    while (at < lines.length && lines[at].kind === 'del') at++
    const addStart = at
    while (at < lines.length && lines[at].kind === 'add') at++
    const pairs = Math.min(addStart - delStart, at - addStart)
    for (let i = 0; i < pairs; i++) {
      const span = wordSpan(lines[delStart + i].text, lines[addStart + i].text)
      if (!span) continue
      lines[delStart + i].span = span.before
      lines[addStart + i].span = span.after
    }
  }
}

const parseDiff = (text) => {
  const lines = []
  let oldNo = 1
  let newNo = 1
  let inHunk = false
  for (const row of text.split('\n')) {
    const hunk = row.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunk) {
      const hidden = Number(hunk[2]) - newNo
      oldNo = Number(hunk[1])
      newNo = Number(hunk[2])
      inHunk = true
      if (hidden > 0) lines.push({ kind: 'gap', oldNo: 0, newNo: 0, text: '', hidden })
      continue
    }
    if (!inHunk || row.startsWith('\\')) continue
    const sign = row[0]
    if (sign === '+') lines.push({ kind: 'add', oldNo: 0, newNo: newNo++, text: row.slice(1) })
    else if (sign === '-') lines.push({ kind: 'del', oldNo: oldNo++, newNo: 0, text: row.slice(1) })
    else if (sign === ' ') lines.push({ kind: 'ctx', oldNo: oldNo++, newNo: newNo++, text: row.slice(1) })
  }
  markWordChanges(lines)
  return lines
}

const tally = (lines, note) => ({
  lines,
  note,
  added: lines.filter((line) => line.kind === 'add').length,
  removed: lines.filter((line) => line.kind === 'del').length,
})

const diffArgs = (plane, path) => [
  'git',
  '--no-optional-locks',
  'diff',
  ...(plane === 'staged' ? ['--cached'] : plane === 'head' ? ['HEAD'] : []),
  '--no-color',
  '-U' + DIFF_CONTEXT,
  '--',
  ...path,
]

const EMPTY_DIFF_NOTE = {
  staged: 'Nothing staged for this file.',
  worktree: 'No unstaged changes in this file.',
  head: 'No changes since the last commit.',
}

const readDiff = async ($, cwd, paths, plane) => {
  const first = paths[0]
  try {
    const ran = await gitRun($, diffArgs(plane, paths), { cwd, env: LITERAL_PATHS })
    if (ran.exitCode !== 0) {
      return tally([], 'Git could not diff this file: it is not in a repository, or the repository has no commit yet.')
    }
    const absolute = first.startsWith('/') ? first : cwd + '/' + first
    if (ran.stdout.trim()) {
      const lines = parseDiff(ran.stdout)
      if (lines.length) return tally(lines, '')
      return attachMedia($, cwd, tally([], 'Binary file or a change with no text lines.'), absolute, plane, false)
    }
    const tracked = await gitRun($, ['git', '--no-optional-locks', 'ls-files', '--error-unmatch', '--', first], {
      cwd,
      env: LITERAL_PATHS,
    })
    if (tracked.exitCode !== 0) {
      const stat = await $.fs.stat(absolute).catch(() => null)
      if (stat && stat.size > MAX_UNTRACKED_BYTES) return attachMedia($, cwd, tally([], 'New file, ' + kb(stat.size) + '.'), absolute, plane, true)
      const added = await gitRun($,
        ['git', '--no-optional-locks', 'diff', '--no-index', '--no-color', '-U' + DIFF_CONTEXT, '--', '/dev/null', absolute],
        { cwd },
      )
      if (!added.stdout.trim()) {
        return tally([], added.exitCode === 0 ? 'New empty file, not yet added to git.' : 'This file cannot be read: it may have been removed, or it is a folder.')
      }
      if (added.stdout.length > MAX_UNTRACKED_BYTES) return attachMedia($, cwd, tally([], 'New file, ' + kb(added.stdout.length) + '.'), absolute, plane, true)
      const lines = parseDiff(added.stdout)
      if (lines.length) return tally(lines, 'New file, not yet added to git.')
      return attachMedia($, cwd, tally([], 'Binary file or a change with no text lines.'), absolute, plane, true)
    }
    return tally([], EMPTY_DIFF_NOTE[plane])
  } catch {
    return tally([], 'Git could not be run here.')
  }
}

const mediaMemo = new Map()

const extOf = (path) => {
  const dot = path.lastIndexOf('.')
  return dot < 0 ? '' : path.slice(dot + 1).toLowerCase()
}

const mediaKind = (path) => {
  const ext = extOf(path)
  if (ext === 'pdf') return 'pdf'
  return PICTURE_EXTS.has(ext) ? 'picture' : 'file'
}

const mediaDir = async ($) => {
  const home = await homeOf($)
  if (!home) return ''
  const dir = home + '/.claude/doc-pane-cache'
  await $.fs.write(dir + '/.previews', 'ok')
  return dir
}

const pixelSize = async ($, path) => {
  const ran = await $.process.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path], { timeoutMs: PREVIEW_TIMEOUT_MS })
  if (ran.exitCode !== 0) return null
  const width = Number((ran.stdout.match(/pixelWidth:\s*(\d+)/) || [])[1])
  const height = Number((ran.stdout.match(/pixelHeight:\s*(\d+)/) || [])[1])
  return width && height ? { width, height } : null
}

const sipsRun = async ($, args) => {
  const ran = await $.process.run(['sips', ...args], { timeoutMs: PREVIEW_TIMEOUT_MS })
  if (ran.exitCode !== 0) throw new Error((ran.stderr || 'sips failed').trim().slice(0, 200))
}

const jpegArgs = (quality) => ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality)]

const fitPreview = async ($, source, outBase, budget, widest) => {
  const size = await pixelSize($, source)
  if (!size) return null
  const original = await $.fs.read(source, { as: 'bytes' })
  const whole = original.base64 && original.base64.startsWith(PNG_PREFIX) ? svgOf(original.base64, 'png', size, budget, widest) : null
  if (whole) return { svg: whole, size }
  for (const [side, quality] of PREVIEW_STEPS) {
    const out = outBase + '-' + side + '.jpg'
    await sipsRun($, [...jpegArgs(quality), '-Z', String(side), source, '--out', out])
    const { base64 } = await $.fs.read(out, { as: 'bytes' })
    const svg = svgOf(base64, 'jpeg', size, budget, widest)
    if (svg) return { svg, size }
  }
  return null
}

const blobPath = async ($, cwd, spec, out) => {
  const ran = await gitRun($, ['sh', '-c', 'git --no-optional-locks cat-file blob "$1" > "$2"', 'sh', spec, out], { cwd })
  return ran.exitCode === 0
}

const relativeTo = (cwd, path) => (path.startsWith(cwd + '/') ? path.slice(cwd.length + 1) : path)

const pictureSide = async ($, source, outBase, budget, widest) => {
  try {
    return await fitPreview($, source, outBase, budget, widest)
  } catch (error) {
    modLog($, 'picture ' + source + ': ' + messageOf(error).slice(0, 200))
    return null
  }
}

const pdfFirstPage = async ($, source, stem) => {
  const folder = stem + '-ql'
  try {
    await $.fs.write(folder + '/.q', 'ok')
    const ran = await $.process.run(['qlmanage', '-t', '-s', String(PDF_PAGE_SIDE), '-o', folder, source], { timeoutMs: PREVIEW_TIMEOUT_MS })
    if (ran.exitCode === 0) return folder + '/' + source.slice(source.lastIndexOf('/') + 1) + '.png'
  } catch (error) {
    modLog($, 'pdf ' + source + ': qlmanage failed: ' + messageOf(error).slice(0, 200))
  }
  try {
    const out = stem + '-page.png'
    await sipsRun($, ['-s', 'format', 'png', source, '--out', out])
    return out
  } catch (error) {
    modLog($, 'pdf ' + source + ': first page could not be made: ' + messageOf(error).slice(0, 200))
    return ''
  }
}

const mediaStamp = (diff) => (diff.media ? diff.media.mtime + ':' + diff.media.bytes : '')

const mediaPreview = async ($, cwd, media, plane) => {
  const stat = await $.fs.stat(media.abs).catch(() => null)
  const memoKey = [media.kind, cwd, media.abs, plane, media.isNew, stat ? stat.mtimeMs + ':' + stat.size : 'gone'].join('|')
  if (!mediaMemo.has(memoKey)) {
    const pending = buildPreview($, cwd, media, plane, stat, memoKey)
    mediaMemo.set(memoKey, pending)
    pending.catch(() => mediaMemo.delete(memoKey))
    if (mediaMemo.size > 60) mediaMemo.delete(mediaMemo.keys().next().value)
  }
  return mediaMemo.get(memoKey)
}

const buildPreview = async ($, cwd, media, plane, stat, memoKey) => {
  const dir = await mediaDir($)
  if (!dir) return {}
  const rel = relativeTo(cwd, media.abs)
  const stem = dir + '/m-' + hashOf(memoKey)
  const pair = !media.isNew && stat && media.kind === 'picture'
  const budget = pair ? MEDIA_PAIR_CHARS : DESKTOP_DRAW_CHARS - 20000
  const widest = pair ? MEDIA_PAIR_WIDTH : DESKTOP_PICTURE_WIDTH
  const side = (source, name) => pictureSide($, source, stem + '-' + name, budget, widest)
  const result = {}
  if (media.kind === 'pdf') {
    const page = stat ? await pdfFirstPage($, media.abs, stem) : ''
    if (page) result.after = await side(page, 'after')
  } else if (media.kind === 'picture') {
    if (stat && plane !== 'staged') result.after = await side(media.abs, 'after')
    if (plane === 'staged' && (await blobPath($, cwd, ':./' + rel, stem + '-staged'))) result.after = await side(stem + '-staged', 'after')
    if (!media.isNew) {
      const spec = (plane === 'worktree' ? ':./' : 'HEAD:./') + rel
      if (await blobPath($, cwd, spec, stem + '-was')) result.before = await side(stem + '-was', 'before')
    }
  }
  if (stat) {
    result.bytes = stat.size
    result.mtime = stat.mtimeMs
  }
  return result
}

const attachMedia = async ($, cwd, diff, abs, plane, isNew) => {
  const media = { kind: mediaKind(abs), abs, isNew }
  if (state.desktop && media.kind !== 'file') {
    try {
      Object.assign(media, await mediaPreview($, cwd, media, plane))
    } catch (error) {
      modLog($, 'preview ' + abs + ': ' + messageOf(error).slice(0, 200))
    }
  }
  return { ...diff, media }
}

const mediaCaption = (media) => {
  const kind = media.kind === 'pdf' ? 'PDF' : media.kind === 'picture' ? 'Picture' : 'File'
  const where = media.isNew ? 'New ' : 'Changed '
  const dims = media.after && media.after.size ? media.after.size.width + ' x ' + media.after.size.height : ''
  return [where + kind.toLowerCase(), dims, media.bytes ? kb(media.bytes) : ''].filter(Boolean).join(' · ')
}

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

const parseStatus = (stdout) => {
  const parts = stdout.split('\0')
  const entries = []
  for (let at = 0; at < parts.length; at++) {
    const row = parts[at]
    if (row.length < 4 || row[2] !== ' ') continue
    const x = row[0]
    const y = row[1]
    const entry = { x, y, path: row.slice(3), orig: '' }
    if (x === 'R' || x === 'C' || y === 'R' || y === 'C') {
      entry.orig = parts[at + 1] || ''
      at++
    }
    entries.push(entry)
  }
  return entries
}

const isConflict = (entry) =>
  entry.x === 'U' || entry.y === 'U' || (entry.x === 'A' && entry.y === 'A') || (entry.x === 'D' && entry.y === 'D')

const letterOf = (entry, section) => {
  if (isConflict(entry)) return 'C'
  const letter = section === 'staged' ? entry.x : entry.y
  return letter === '?' ? 'U' : letter
}

const sectionEntries = (entries, section) =>
  entries.filter((entry) => {
    if (section === 'staged') return !isConflict(entry) && entry.x !== ' ' && entry.x !== '?'
    return isConflict(entry) || entry.y !== ' '
  })

const STATUS_COLOR = { M: 'yellow', A: 'green', U: 'green', D: 'red', R: 'cyan', C: 'red' }

const splitFocus = (focus) => {
  const cut = focus.indexOf(':')
  return cut < 0 ? null : { plane: focus.slice(0, cut), path: focus.slice(cut + 1) }
}

const entryInFocus = (focus, plane, entry) => {
  if (!focus) return true
  if (focus === plane + ':' || focus === plane + ':' + entry.path) return true
  return focus.endsWith('/') && focus.startsWith(plane + ':') && entry.path.startsWith(focus.slice(plane.length + 1))
}

const numstatOf = (raw) => {
  const sizes = {}
  const at = raw.indexOf('\n')
  for (const row of (at < 0 ? '' : raw.slice(at + 1)).split('\0')) {
    const cut = row.split('\t')
    if (cut.length >= 3) sizes[cut.slice(2).join('\t')] = cut[0] + '/' + cut[1]
  }
  return sizes
}

const signatureOf = (entry, sizes) => (sizes[entry.path] ? entry.x + entry.y + '|' + entry.orig + '|' + sizes[entry.path] : '')

const nameOf = (path) => path.slice(path.lastIndexOf('/') + 1)

const treeRows = (entries, section, collapsed) => {
  const root = { dirs: new Map(), files: [] }
  for (const entry of entries) {
    const parts = entry.path.split('/')
    let node = root
    for (const part of parts.slice(0, -1)) {
      if (!node.dirs.has(part)) node.dirs.set(part, { dirs: new Map(), files: [] })
      node = node.dirs.get(part)
    }
    node.files.push(entry)
  }
  const rows = []
  const countFiles = (node) => node.files.length + [...node.dirs.values()].reduce((sum, child) => sum + countFiles(child), 0)
  const walk = (node, prefix, depth) => {
    const names = [...node.dirs.keys()].sort()
    for (const name of names) {
      let child = node.dirs.get(name)
      let label = name
      let path = prefix ? prefix + '/' + name : name
      while (child.files.length === 0 && child.dirs.size === 1) {
        const [only] = [...child.dirs.keys()]
        label += '/' + only
        path += '/' + only
        child = child.dirs.get(only)
      }
      const key = 'dir:' + section + ':' + path
      rows.push({ kind: 'dir', key, label, depth, count: countFiles(child), open: !collapsed[key], dirPath: path + '/' })
      if (!collapsed[key]) walk(child, path, depth + 1)
    }
    for (const entry of [...node.files].sort((a, b) => a.path.localeCompare(b.path))) {
      rows.push({ kind: 'file', key: 'file:' + section + ':' + entry.path, entry, depth })
    }
  }
  walk(root, '', 0)
  return rows
}

const readStatus = async ($, cwd, untracked) => {
  try {
    const top = await gitRun($, ['git', 'rev-parse', '--show-toplevel'], { cwd })
    if (top.exitCode !== 0) return { repo: '', entries: [], hasHead: false, error: 'This folder is not a git repository.', raw: '' }
    const repo = top.stdout.trim()
    const status = await gitRun($,
      ['git', '--no-optional-locks', 'status', '--porcelain=v1', '-z', untracked ? '-uall' : '-uno'],
      { cwd: repo },
    )
    if (status.exitCode !== 0) return { repo, entries: [], hasHead: false, error: 'git status failed: ' + status.stderr.slice(0, 120), raw: '' }
    if (!untracked) return { repo, entries: parseStatus(status.stdout), hasHead: false, error: '', raw: status.stdout }
    const head = await gitRun($, ['git', 'rev-parse', '--verify', '-q', 'HEAD'], { cwd: repo })
    const hasHead = head.exitCode === 0
    const sizes = hasHead ? await gitRun($, ['git', '--no-optional-locks', 'diff', 'HEAD', '--numstat', '--no-renames', '-z'], { cwd: repo }) : null
    return {
      repo,
      entries: parseStatus(status.stdout),
      hasHead,
      error: '',
      raw: status.stdout + '\n' + (sizes && sizes.exitCode === 0 ? sizes.stdout : ''),
    }
  } catch (error) {
    return { repo: '', entries: [], hasHead: false, error: 'Could not run git: ' + messageOf(error).slice(0, 100), raw: '' }
  }
}

const SYNTAX_LANGS = {
  php: 'php',
  js: 'c',
  jsx: 'c',
  mjs: 'c',
  cjs: 'c',
  ts: 'c',
  tsx: 'c',
  vue: 'c',
  dart: 'c',
  java: 'c',
  kt: 'c',
  swift: 'c',
  go: 'c',
  rs: 'c',
  c: 'c',
  h: 'c',
  cpp: 'c',
  cs: 'c',
  json: 'c',
  css: 'css',
  scss: 'c',
  py: 'hash',
  rb: 'hash',
  sh: 'hash',
  bash: 'hash',
  zsh: 'hash',
  yml: 'hash',
  yaml: 'hash',
  md: 'md',
  mdx: 'md',
}

const SYNTAX_KEYWORDS = new Set(
  (
    'abstract and as async await break case catch class const continue def default do echo elif else elseif enum export extends ' +
    'false final finally fn for foreach from function global if implements import in instanceof interface is lambda let match ' +
    'namespace new not null of or parent pass private protected public readonly return self static switch this throw trait true ' +
    'try type typeof use var void while with yield None True False undefined'
  ).split(' '),
)

const syntaxLang = (path) => {
  if (/\.blade\.php$/i.test(path || '')) return null
  const found = /\.([A-Za-z0-9]+)$/.exec(path || '')
  return found ? SYNTAX_LANGS[found[1].toLowerCase()] || null : null
}

const markdownTokens = (text) => {
  if (/^\s{0,3}#{1,6}\s/.test(text)) return [{ from: 0, to: text.length, tone: 'keyword' }]
  if (/^\s*(```|~~~)/.test(text)) return [{ from: 0, to: text.length, tone: 'comment' }]
  const tokens = []
  const marker = /^(\s*)([-*+]|\d+[.)])\s+(\[[ xX]\]\s)?/.exec(text)
  if (marker) tokens.push({ from: marker[1].length, to: marker[0].length, tone: 'number' })
  const inline = /`[^`]+`|\]\(([^)\s]+)\)/g
  let found
  while ((found = inline.exec(text))) {
    if (found.index < (marker ? marker[0].length : 0)) continue
    if (found[0][0] === '`') tokens.push({ from: found.index, to: found.index + found[0].length, tone: 'string' })
    else tokens.push({ from: found.index + 2, to: found.index + 2 + found[1].length, tone: 'call' })
  }
  return tokens
}

const syntaxTokens = (text, lang, inComment) => {
  const tokens = []
  if (!lang || text.length > SYNTAX_MAX_CHARS) return { tokens, inComment: Boolean(inComment) }
  if (lang === 'md') return { tokens: markdownTokens(text), inComment: false }
  const push = (from, to, tone) => {
    if (to > from) tokens.push({ from, to, tone })
  }
  const slash = lang !== 'hash'
  let at = 0
  const openComment = inComment || (slash && lang !== 'css' && /^\s*\*(\/|$|\s+[^\s\d{(=*+\-/])/.test(text))
  if (openComment) {
    const end = text.indexOf('*/')
    if (end < 0) {
      push(0, text.length, 'comment')
      return { tokens, inComment: Boolean(inComment) }
    }
    push(0, end + 2, 'comment')
    at = end + 2
  }
  while (at < text.length) {
    const ch = text[at]
    if (slash && text.startsWith('/*', at)) {
      const end = text.indexOf('*/', at + 2)
      if (end < 0) {
        push(at, text.length, 'comment')
        return { tokens, inComment: true }
      }
      push(at, end + 2, 'comment')
      at = end + 2
      continue
    }
    const lineComment =
      (slash && lang !== 'css' && text.startsWith('//', at) && text[at - 1] !== ':') ||
      ((lang === 'hash' || lang === 'php') && ch === '#' && text[at + 1] !== '[')
    if (lineComment) {
      push(at, text.length, 'comment')
      break
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      let end = at + 1
      while (end < text.length && text[end] !== ch) end += text[end] === '\\' ? 2 : 1
      end = Math.min(end + 1, text.length)
      push(at, end, 'string')
      at = end
      continue
    }
    if (lang === 'php' && ch === '$' && /[A-Za-z_]/.test(text[at + 1] || '')) {
      at += /^\$\w+/.exec(text.slice(at))[0].length
      continue
    }
    if (/[0-9]/.test(ch) && !/[\w$]/.test(text[at - 1] || '')) {
      const number = /^[0-9][0-9a-fA-FxX_.]*/.exec(text.slice(at))[0]
      push(at, at + number.length, 'number')
      at += number.length
      continue
    }
    if (/[A-Za-z_]/.test(ch) && !/[\w$]/.test(text[at - 1] || '')) {
      const word = /^[A-Za-z_]\w*/.exec(text.slice(at))[0]
      const end = at + word.length
      const tone = SYNTAX_KEYWORDS.has(word) ? 'keyword' : /^\s*\(/.test(text.slice(end)) ? 'call' : /^[A-Z]/.test(word) ? 'type' : null
      if (tone) push(at, end, tone)
      at = end
      continue
    }
    at++
  }
  return { tokens, inComment: false }
}

const syntaxSegments = (length, tokens, span) => {
  const cuts = new Set([0, length])
  for (const token of tokens) {
    cuts.add(token.from)
    cuts.add(token.to)
  }
  if (span) {
    cuts.add(Math.min(span[0], length))
    cuts.add(Math.min(span[1], length))
  }
  const points = [...cuts].sort((a, b) => a - b)
  const segments = []
  let next = 0
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]
    while (next < tokens.length && tokens[next].to <= from) next++
    const token = next < tokens.length && tokens[next].from <= from && tokens[next].to >= to ? tokens[next] : null
    const tone = token ? token.tone : null
    const mark = Boolean(span) && from >= span[0] && to <= span[1]
    const last = segments[segments.length - 1]
    if (last && last.tone === tone && last.mark === mark) last.to = to
    else segments.push({ from, to, tone, mark })
  }
  return segments
}

const syntaxSegmentStyle = (segment, wordColor) => ({
  ...(segment.tone ? { color: SYNTAX_TONE[segment.tone] } : {}),
  ...(segment.mark ? { backgroundColor: wordColor } : {}),
})

const highlightLines = (lines, path) => {
  const lang = syntaxLang(path)
  const side = { old: false, now: false }
  return lines.map((line) => {
    if (line.kind === 'gap') {
      side.old = false
      side.now = false
      return []
    }
    const result = syntaxTokens(line.text, lang, line.kind === 'del' ? side.old : side.now)
    if (line.kind !== 'add') side.old = result.inComment
    if (line.kind !== 'del') side.now = result.inComment
    return result.tokens
  })
}

const gitState = async ($) => {
  try {
    const status = await gitRun($, ['git', '--no-optional-locks', 'status', '--porcelain'])
    const head = await gitRun($, ['git', 'rev-parse', '--short', 'HEAD'])
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
  'Write a handoff for a fresh session that has none of this conversation. Plain text, under 220 words, with these headings: Goal (one line), Done (bullets: exact file paths, decisions, numbers), In flight (anything half-edited; background agents and tasks stop when this session ends, so name any still running as lost and the work that has to be redone, never as results to collect), Next (the first thing to do), Open decisions (questions I have not answered; write none if there are none). Use only what is in the conversation and invent nothing. Do not repeat these instructions.'

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
    return (await gitRun($, ['git', 'branch', '--show-current'])).stdout.trim()
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
  const readFirst =
    docs.length && !record.next
      ? 'Before anything else, run /syafiqkit:read-summary on ' + docs[0] + ' (the read-summary skill).'
      : 'Before anything else, run /syafiqkit:read-summary on ' +
        (record.next ? 'this topic: ' + record.next : goalOf(record) ? 'the Goal below' : 'the previous session') +
        ' (the read-summary skill; it finds the task docs by content).'
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
  state.docBack = null
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
    await Promise.all([readDocMeta($), measureHeavy($)])
  } catch (error) {
    state.docs = []
    state.error = 'Could not list docs: ' + messageOf(error)
  }
  if (view === 'list' && state.reopen) {
    const fresh = state.docs.find((doc) => doc.path === state.reopen.path)
    state.reopen = null
    if (fresh) await loadDoc($, fresh)
  }
  await openPaneWindow($, view)
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
  if (state.disabled || (e.props && e.props.hasSurvey)) return next(e)
  const { Box, Text, Button } = $.ui.resolve(e)
  const desktop = isDesktop(e)
  state.desktop = desktop
  restoreGallery($)
  if (state.isOpen) {
    if (state.view !== 'doc' || !state.selected.length || !state.current || state.current.group !== 'Task docs') return next(e)
    return Box({
      flexDirection: 'row',
      flexWrap: 'wrap',
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
      flexWrap: 'wrap',
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
        Button({
          key: 'open-changes',
          label: state.changeCount ? 'Changes (' + state.changeCount + ')' : 'Changes',
          hotkey: 'g',
          onPress: () => openChanges($),
        }),
        ...(state.images.length
          ? [
              Button({
                key: 'open-images',
                label: 'Images (' + state.images.length + ')',
                hotkey: 'i',
                onPress: () => openImages($),
              }),
            ]
          : []),
        Text({ dimColor: true, children: '│' }),
        Button({ key: 'band-commit', label: 'Commit', hotkey: 'c', ...(desktop ? { variant: 'primary' } : {}), onPress: () => sendVerb($, 'Commit') }),
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
        ...(desktop ? { backgroundColor: DESKTOP_TONE.warnStrip, alignItems: 'center' } : {}),
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
            ...(desktop ? { variant: 'primary' } : {}),
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

const PLANE_LABEL = { staged: 'staged', worktree: 'working tree', head: 'since the last commit' }

const SECTION_TITLE = { staged: 'Staged Changes', worktree: 'Changes' }

const clipMiddle = (text, width) => {
  if (text.length <= width) return text
  if (width <= 5) return text.slice(0, Math.max(1, width))
  const keep = width - 1
  const tail = Math.ceil(keep * 0.6)
  return text.slice(0, keep - tail) + '…' + text.slice(text.length - tail)
}

const clipPathTail = (text, width) => (text.length <= width ? text : '…' + text.slice(text.length - Math.max(1, width - 1)))

const clipPath = (path, width) => {
  if (path.length <= width) return path
  const cut = path.lastIndexOf('/')
  if (cut < 0) return clipMiddle(path, width)
  const name = path.slice(cut + 1)
  if (name.length + 2 > width) return clipMiddle(name, width)
  return clipPathTail(path.slice(0, cut), width - name.length - 1) + '/' + name
}

const countsText = (diff) => (diff ? '+' + diff.added + ' −' + diff.removed : '')

const activeFocus = () => (coversFocus(state.changeFocus) ? state.changeFocus : '')

const diffIsOpen = (key) => state.allOpen[key] !== false

const noDiffsText = () => (state.allLoaded ? 'Nothing changed.' : 'Reading diffs…')

const lineNumberWidth = (lines) => String(Math.max(1, ...lines.map((line) => Math.max(line.oldNo, line.newNo)))).length

const shownLines = (key, diff) => (state.allFull[key] === true ? diff.lines : diff.lines.slice(0, DIFF_MAX_LINES))

const diffNoteItems = (c, key, diff) =>
  diff.note ? [{ height: 1, make: () => c.Text({ key, dimColor: true, wrap: 'truncate', children: diff.note }) }] : []

const mdRaw = {}

const isNewMarkdown = (path, diff) =>
  extOf(path) === 'md' && diff.lines.length > 0 && diff.removed === 0 && diff.lines.every((line) => line.kind === 'add')

const markdownItems = (c, key, diff) => {
  const text = shape(diff.lines.map((line) => line.text).join('\n'))
  const rendered = mdRaw[key] !== true
  const choose = (raw) => () => {
    mdRaw[key] = raw
    c.redraw()
  }
  const toggle = {
    height: 1,
    make: () =>
      c.Box({
        key: key + '#t',
        flexDirection: 'row',
        columnGap: 1,
        children: [
          c.Button({ key: key + '#t-md', label: 'Rendered', variant: rendered ? 'primary' : 'secondary', onPress: choose(false) }),
          c.Button({ key: key + '#t-raw', label: 'Raw', variant: rendered ? 'secondary' : 'primary', onPress: choose(true) }),
        ],
      }),
  }
  const body = {
    height: text.split('\n').reduce((sum, line) => sum + Math.max(1, Math.ceil(line.length / DESKTOP_WRAP_CHARS)), 0),
    make: () => c.Markdown({ key: key + '#md', text }),
  }
  return { toggle, body, rendered }
}

const terminalMediaItems = ($, c, key, diff) => [
  { height: 1, make: () => c.Text({ key: key + '-cap', dimColor: true, wrap: 'truncate', children: mediaCaption(diff.media) }) },
  {
    height: 1,
    make: () => c.Button({ key: key + '-open', label: 'Open in viewer', plain: true, onPress: () => openInViewer($, diff.media.abs) }),
  },
]

const diffBodyItems = ($, c, key, path, diff, drawLines, desktop) => {
  if (diff.media) {
    const media = desktop ? desktopMediaItems($, c, key + '#m', diff) : terminalMediaItems($, c, key + '#m', diff)
    return { items: media, plain: false }
  }
  const note = diffNoteItems(c, key + '#n', diff)
  if (!isNewMarkdown(path, diff)) return { items: [...note, ...drawLines()], plain: true }
  const md = markdownItems(c, key, diff)
  if (md.rendered) return { items: [...note, md.toggle, md.body], plain: false }
  return { items: [...note, md.toggle, ...drawLines()], plain: true }
}

const moreLinesItem = (c, key, hidden, onPress) => ({
  height: 1,
  make: () => c.Button({ key, label: '… ' + hidden + ' more lines · show', plain: true, onPress }),
})

const changesView = ($, c) => {
  const { Box, Text, Button, Input, redraw, bindField } = c
  const ch = state.changes
  const wide = paneColumns(c.e) >= SPLIT_MIN_COLUMNS
  state.wide = wide
  const treeWidth = wide ? TREE_COLUMNS : Math.max(24, paneColumns(c.e) - 2)
  const sections = ['staged', 'worktree']

  const treeRow = (row, plane, index) => {
    const key = plane + '-' + index
    const indent = ' '.repeat(row.depth * 2 + 1)
    if (row.kind === 'dir') {
      const count = ' (' + row.count + ')'
      const collapse = () => {
        state.changesCollapsed[row.key] = row.open
        redraw()
      }
      if (!wide) {
        const room = Math.max(8, treeWidth - indent.length - 11 - count.length)
        return Box({
          key,
          flexDirection: 'row',
          columnGap: 1,
          children: [
            Button({
              key: key + 'b',
              plain: true,
              label: indent + (row.open ? '▾ ' : '▸ ') + clipPathTail(row.label + '/', room) + count,
              onPress: collapse,
            }),
            Button({ key: key + 'v', plain: true, label: 'view', onPress: () => openChangeAll($, plane + ':' + row.dirPath) }),
            Button({
              key: key + 's',
              label: plane === 'staged' ? '−' : '+',
              onPress: () => toggleStageFolder($, plane, row.dirPath),
            }),
          ],
        })
      }
      const folderKey = plane + ':' + row.dirPath
      const room = Math.max(8, treeWidth - indent.length - 4 - count.length)
      return Box({
        key,
        flexDirection: 'row',
        columnGap: 1,
        children: [
          Button({ key: key + 'c', plain: true, label: indent + (row.open ? '▾' : '▸'), onPress: collapse }),
          Button({
            key: key + 'b',
            plain: true,
            label: (state.changeFocus === folderKey ? '▶ ' : '') + clipPathTail(row.label + '/', room) + count,
            onPress: () => focusOn($, state.changeFocus === folderKey ? '' : folderKey),
          }),
        ],
      })
    }
    const entry = row.entry
    const letter = letterOf(entry, plane)
    const focusKey = plane + ':' + entry.path
    const room = Math.max(8, treeWidth - indent.length - 4)
    const name = clipMiddle(nameOf(entry.path) + (entry.orig ? ' ← ' + nameOf(entry.orig) : ''), room)
    return Box({
      key,
      flexDirection: 'row',
      children: [
        Button({
          key: key + 'b',
          plain: true,
          label: indent + (state.changeFocus === focusKey ? '▶ ' : '  ') + name.padEnd(room) + ' ',
          onPress: () => {
            if (!wide) return openChangeFile($, entry, plane, 'changes')
            focusOn($, state.changeFocus === focusKey ? '' : focusKey)
          },
        }),
        Text({ key: key + 's', color: STATUS_COLOR[letter], bold: true, children: letter }),
      ],
    })
  }

  const focusedEntry = () => {
    const focus = splitFocus(state.changeFocus)
    if (!focus) return null
    const entry = sectionEntries(ch.entries, focus.plane).find((item) => item.path === focus.path)
    return entry ? { plane: focus.plane, entry } : null
  }

  const focusedFolder = () => {
    const focus = splitFocus(state.changeFocus)
    if (!focus || !focus.path.endsWith('/')) return null
    const covered = sectionEntries(ch.entries, focus.plane).filter((item) => item.path.startsWith(focus.path))
    return covered.length ? { plane: focus.plane, path: focus.path, count: covered.length } : null
  }

  const toolbar = () => {
    const folder = focusedFolder()
    if (folder) {
      return Box({
        key: 'tb',
        flexDirection: 'row',
        columnGap: 1,
        children: [
          Button({
            key: 'tb-stage',
            label: folder.plane === 'staged' ? '− Unstage folder' : '+ Stage folder',
            hotkey: 's',
            onPress: () => toggleStageFocused($),
          }),
          Text({ key: 'tb-name', dimColor: true, wrap: 'truncate-end', children: folder.count + ' files' }),
        ],
      })
    }
    const picked = focusedEntry()
    if (!picked) {
      return Text({ key: 'tb-hint', dimColor: true, wrap: 'truncate-end', children: 'Pick a file or folder to stage or discard' })
    }
    const staged = picked.plane === 'staged'
    return Box({
      key: 'tb',
      flexDirection: 'row',
      columnGap: 1,
      children: [
        Button({ key: 'tb-stage', label: staged ? '− Unstage' : '+ Stage', hotkey: 's', onPress: () => toggleStageFocused($) }),
        ...(staged
          ? []
          : [Button({ key: 'tb-discard', label: '↶ Discard', hotkey: 'd', onPress: () => askDiscard($, picked.entry) })]),
        Text({
          key: 'tb-name',
          dimColor: true,
          wrap: 'truncate-end',
          children: staged ? 'Unstage first to discard' : nameOf(picked.entry.path),
        }),
      ],
    })
  }

  const section = (plane) => {
    const entries = sectionEntries(ch.entries, plane)
    const closed = Boolean(state.changesCollapsed['sec:' + plane])
    const staged = plane === 'staged'
    const caption = SECTION_TITLE[plane] + ' (' + entries.length + ')'
    const toggle = () => {
      state.changesCollapsed['sec:' + plane] = !closed
      redraw()
    }
    const rows = [
      Box({
        key: plane + '-head',
        flexDirection: 'row',
        columnGap: 1,
        children: [
          ...(wide
            ? [
                Button({ key: plane + '-toggle', label: closed ? '▸' : '▾', plain: true, onPress: toggle }),
                Button({
                  key: plane + '-focus',
                  label: ((state.changeFocus === plane + ':' ? '▶ ' : '  ') + caption).padEnd(24),
                  plain: true,
                  onPress: () => focusOn($, state.changeFocus === plane + ':' ? '' : plane + ':'),
                }),
              ]
            : [
                Button({ key: plane + '-toggle', label: clip((closed ? '▸ ' : '▾ ') + caption, Math.min(26, treeWidth - 18)).padEnd(Math.min(26, treeWidth - 18)), plain: true, onPress: toggle }),
              ]),
          ...(entries.length && !wide
            ? [Button({ key: plane + '-view', label: 'view', onPress: () => openChangeAll($, plane + ':') })]
            : []),
          ...(entries.length
            ? [
                Button({
                  key: plane + '-all',
                  label: staged ? '− all' : '+ all',
                  hotkey: staged ? 'u' : 'a',
                  onPress: () => (staged ? unstageEverything($) : stageEverything($)),
                }),
              ]
            : []),
        ],
      }),
    ]
    if (closed) return rows
    if (!entries.length) rows.push(Text({ key: plane + '-none', dimColor: true, children: '   nothing here' }))
    treeRows(entries, plane, state.changesCollapsed).forEach((row, index) => rows.push(treeRow(row, plane, index)))
    rows.push(Text({ key: plane + '-gap', children: ' ' }))
    return rows
  }

  const roots = visibleRepos()
  const stacked = roots.length > 1
  const hiddenCount = Object.keys(state.repoHidden).length

  const repoHeader = (root) => {
    const active = root === state.repoRoot
    const open = active && !state.changesCollapsed['repo:' + root]
    const count = active ? ch.entries.length : state.repoCounts[root]
    const caption = (open ? '▾ ' : '▸ ') + clipMiddle(repoNameOf(root), Math.max(8, treeWidth - 12)) + (count === undefined ? '' : ' (' + count + ')')
    return Box({
      key: 'repo-' + root,
      flexDirection: 'row',
      columnGap: 1,
      children: [
        Button({ key: 'repo-b-' + root, label: caption, plain: true, onPress: () => selectRepo($, root) }),
        Button({ key: 'repo-x-' + root, label: '✕', plain: true, onPress: () => removeRepo($, root) }),
      ],
    })
  }

  const treeBody = () => {
    const body = wide
      ? [toolbar(), ...sections.flatMap(section)]
      : [Text({ key: 'tb-hint', dimColor: true, wrap: 'truncate-end', children: 'Press a file or "view" to see diffs' }), ...sections.flatMap(section)]
    if (!stacked) return body
    return roots.flatMap((root) => [
      repoHeader(root),
      ...(root === state.repoRoot && !state.changesCollapsed['repo:' + root] ? body : []),
    ])
  }

  return Box({
    flexDirection: 'column',
    children: [
      Box({
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 2,
        children: [
          Button({ key: 'ch-close', label: '< Close', hotkey: 'b', autoFocus: true, onPress: () => closePane($) }),
          ...(wide ? [] : [Button({ key: 'ch-all', label: 'All changes', hotkey: 'v', onPress: () => openChangeAll($) })]),
          Button({ key: 'ch-refresh', label: 'Refresh', hotkey: 'r', onPress: () => refreshRepoList($).then(() => refreshChanges($)) }),
          Button({
            key: 'ch-add',
            label: 'Add repo',
            hotkey: 'g',
            onPress: () => {
              state.repoForm = !state.repoForm
              state.repoNote = ''
              redraw()
            },
          }),
          ...(hiddenCount ? [Button({ key: 'ch-unhide', label: hiddenCount + ' hidden · show', onPress: () => showHiddenRepos($) })] : []),
        ],
      }),
      ...(state.repoForm
        ? [
            Input({
              key: 'repo-path',
              label: 'Repo',
              placeholder: 'folder of a git repo, e.g. ~/code/app (Remove only forgets it)',
              value: state.repoPath,
              autoFocus: true,
              onInput: bindField('repoPath'),
              onSubmit: (value) => addRepo($, typeof value === 'string' && value.trim() ? value : state.repoPath),
            }),
          ]
        : []),
      ...(state.repoNote ? [Text({ key: 'repo-note', color: 'red', children: state.repoNote })] : []),
      Text({
        bold: true,
        wrap: 'truncate-start',
        children: ch.repo ? 'Changes · ' + nameOf(ch.repo) : 'Changes',
      }),
      ch.error
        ? Text({ color: 'red', children: ch.error })
        : !ch.loaded
          ? Text({ dimColor: true, children: 'Reading git status…' })
          : wide
            ? Box({
                flexDirection: 'row',
                columnGap: 2,
                children: [
                  Box({
                    key: 'ch-tree',
                    flexDirection: 'column',
                    width: TREE_COLUMNS,
                    flexShrink: 0,
                    children: treeBody(),
                  }),
                  Box({
                    key: 'ch-diffs',
                    flexDirection: 'column',
                    width: Math.max(30, paneColumns(c.e) - TREE_COLUMNS - 2),
                    flexShrink: 0,
                    overflow: 'hidden',
                    children: diffColumn($, c),
                  }),
                ],
              })
            : Box({ flexDirection: 'column', children: treeBody() }),
    ],
  })
}

const paneColumns = (e) => (e.props && e.props.bodyColumns) || e.bodyColumns || 100

const coversFocus = (focus) => {
  const parts = splitFocus(focus)
  if (!parts) return true
  const entries = sectionEntries(state.changes.entries, parts.plane)
  if (!parts.path) return entries.length > 0
  if (parts.path.endsWith('/')) return entries.some((entry) => entry.path.startsWith(parts.path))
  return entries.some((entry) => entry.path === parts.path)
}

const focusTitle = (focus) => {
  if (!focus) return 'All changes'
  const cut = focus.indexOf(':')
  if (cut === focus.length - 1) return SECTION_TITLE[focus.slice(0, cut)] + ' only'
  return focus.endsWith('/') ? focus.slice(cut + 1) + ' · ' + SECTION_TITLE[focus.slice(0, cut)] : focus.slice(cut + 1)
}

const showAllDiffSections = ($) => {
  state.diffSectionClosed = {}
  focusOn($, '')
}

const hiddenSectionHint = ($, c, focus) => {
  const parts = splitFocus(focus)
  if (!parts) return []
  const other = parts.plane === 'staged' ? 'worktree' : 'staged'
  const target = other + ':' + parts.path
  const count = sectionEntries(state.changes.entries, other).filter((entry) => entryInFocus(target, other, entry)).length
  if (!count) return []
  const scope = !parts.path ? '' : parts.path.endsWith('/') ? ' in this folder' : ' for this file'
  return [
    c.Button({
      key: 'dc-hidden',
      label: SECTION_TITLE[other] + ' (' + count + ')' + scope + ' hidden · show',
      plain: true,
      onPress: () => (parts.path ? focusOn($, target) : showAllDiffSections($)),
    }),
  ]
}

const diffColumn = ($, c) => {
  const { Box, Text, Button } = c
  const focus = activeFocus()
  const shown = allDiffItems($, c, focus, true)
  const hints = hiddenSectionHint($, c, focus)
  const top = 3 + (state.repoForm ? 1 : 0) + (state.repoNote ? 1 : 0) + hints.length
  return [
    Box({
      key: 'dc-head',
      flexDirection: 'row',
      columnGap: 2,
      children: [
        Text({ bold: true, children: focusTitle(focus) }),
        ...(focus
          ? [
              Button({
                key: 'dc-all',
                label: 'Show all',
                hotkey: 'v',
                onPress: () => showAllDiffSections($),
              }),
            ]
          : []),
      ],
    }),
    ...hints,
    ...(shown.any
      ? windowedRows(c, shown.items, top)
      : [Text({ key: 'dc-empty', dimColor: true, children: noDiffsText() })]),
  ]
}

const fileHeader = ($, c, entry, plane, open, pathWidth) => {
  const { Box, Text, Button, redraw } = c
  const key = plane + ':' + entry.path
  const staged = plane === 'staged'
  const letter = letterOf(entry, plane)
  return Box({
    key: key + '#hd',
    flexDirection: 'row',
    columnGap: 1,
    children: [
      Button({
        key: key + '#h',
        label: (open ? '▾ ' : '▸ ') + clipPath(entry.path, pathWidth).padEnd(pathWidth),
        plain: true,
        onPress: () => {
          state.allOpen[key] = !open
          redraw()
          if (!open && !state.allDiffs[key]) loadOneDiff($, entry, plane)
        },
      }),
      Text({ key: key + '#l', color: STATUS_COLOR[letter], bold: true, children: letter }),
      Text({ key: key + '#c', dimColor: true, children: countsText(state.allDiffs[key]).padEnd(pathWidth >= 16 ? COUNTS_WIDTH : 0) }),
      Button({
        key: key + '#m',
        label: staged ? '−' : '+',
        onPress: () => (staged ? unstageThese($, fileTargets(entry)) : stageThese($, stageTargets(entry))),
      }),
      ...(staged ? [] : [Button({ key: key + '#d', label: '↶', onPress: () => askDiscard($, entry) })]),
      ...(isDocPath(entry.path)
        ? [Button({ key: key + '#o', label: 'Doc', onPress: () => openDocFromChanges($, entry.path, state.view) })]
        : []),
    ],
  })
}

const expandTabs = (text) => text.replace(/\t/g, '    ')

const expandSpan = (line) =>
  line.span ? [expandTabs(line.text.slice(0, line.span[0])).length, expandTabs(line.text.slice(0, line.span[1])).length] : undefined

const terminalLineItems = (c, line, key, numWidth, bodyWidth, tokens) => {
  const { Box, Text } = c
  if (line.kind === 'gap') {
    return [{ height: 1, make: () => Text({ key, dimColor: true, wrap: 'truncate', children: '⋯ ' + line.hidden + ' hidden lines' }) }]
  }
  const isAdd = line.kind === 'add'
  const isDel = line.kind === 'del'
  const text = line.text
  const width = Math.max(10, bodyWidth)
  const gutter = String(isDel ? line.oldNo : line.newNo).padStart(numWidth) + ' ' + (isAdd ? '+' : isDel ? '−' : ' ') + ' '
  const background = isAdd || isDel ? { backgroundColor: isAdd ? 'diffAdded' : 'diffRemoved' } : {}
  const segments = syntaxSegments(text.length, tokens, line.span)
  const pieces = (from, to) =>
    segments
      .filter((segment) => segment.to > from && segment.from < to)
      .map((segment, index) =>
        Text({
          key: 'p' + index,
          ...syntaxSegmentStyle(segment, isAdd ? 'diffAddedWord' : 'diffRemovedWord'),
          children: text.slice(Math.max(segment.from, from), Math.min(segment.to, to)),
        }),
      )
  const count = Math.max(1, Math.ceil(text.length / width))
  return Array.from({ length: count }, (_, part) => ({
    height: 1,
    make: () =>
      Box({
        key: part ? key + '.' + part : key,
        height: 1,
        flexShrink: 0,
        flexDirection: 'row',
        ...background,
        children: [
          Text({ key: 'g', dimColor: true, children: part ? ' '.repeat(gutter.length) : gutter }),
          Text({ key: 't', wrap: 'truncate', children: text.length ? pieces(part * width, (part + 1) * width) : ' ' }),
        ],
      }),
  }))
}

const terminalDiffItems = (c, lines, prefix, columnWidth, path) => {
  const numWidth = lineNumberWidth(lines)
  const expanded = lines.map((line) => (line.kind === 'gap' ? line : { ...line, text: expandTabs(line.text), span: expandSpan(line) }))
  const tokens = highlightLines(expanded, path)
  return expanded.flatMap((line, index) => terminalLineItems(c, line, prefix + index, numWidth, columnWidth - numWidth - 3, tokens[index]))
}

const allDiffItems = ($, c, only, beside) => {
  const { Text, Button, redraw } = c
  const items = []
  const add = (make) => items.push({ height: 1, make })
  let any = false
  const columnWidth = beside ? paneColumns(c.e) - TREE_COLUMNS - 2 : paneColumns(c.e) - 2
  const pathWidth = Math.max(8, columnWidth - COUNTS_WIDTH - 26)
  for (const plane of ['worktree', 'staged']) {
    const files = orderedFiles(plane).filter((entry) => entryInFocus(only, plane, entry))
    if (!files.length) continue
    any = true
    const closed = !only && state.diffSectionClosed[plane] === true
    if (!only) {
      add(() =>
        Button({
          key: 'dt-' + plane,
          label: (closed ? '▸ ' : '▾ ') + SECTION_TITLE[plane] + ' (' + files.length + ')',
          plain: true,
          onPress: () => {
            state.diffSectionClosed[plane] = !closed
            redraw()
          },
        }),
      )
    }
    for (const entry of closed ? [] : files) {
      const key = plane + ':' + entry.path
      const diff = state.allDiffs[key]
      const open = diffIsOpen(key)
      add(() => fileHeader($, c, entry, plane, open, pathWidth))
      if (!open) continue
      if (!diff) {
        add(() => Text({ key: key + '#r', dimColor: true, children: '   Reading diff…' }))
        continue
      }
      const lines = shownLines(key, diff)
      const body = diffBodyItems($, c, key, entry.path, diff, () => terminalDiffItems(c, lines, key + '#', columnWidth, entry.path), false)
      items.push(...body.items)
      const hidden = diff.lines.length - lines.length
      if (body.plain && hidden > 0) {
        items.push(
          moreLinesItem(c, key + '#more', hidden, () => {
            state.allFull[key] = true
            redraw()
          }),
        )
      }
    }
    add(() => Text({ key: 'dg-' + plane, children: ' ' }))
  }
  return { items, any }
}

const changeFileView = ($, c) => {
  const { Box, Text, Button, goto } = c
  const file = state.changeFile
  if (!file) return changesView($, c)
  const diff = state.changeDiff
  const files = file.entry && state.diffBack === 'changes' ? orderedFiles(file.plane) : []
  const at = files.findIndex((entry) => entry.path === file.path)
  const staged = file.plane === 'staged'
  const step = (key, label, hotkey, target) =>
    Button({ key, label, hotkey, onPress: () => openChangeFile($, target, file.plane, state.diffBack) })
  return Box({
    flexDirection: 'column',
    children: [
      Box({
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 2,
        children: [
          Button({ key: 'cf-back', label: '< Back', hotkey: 'b', autoFocus: true, onPress: () => goto(state.diffBack) }),
          ...(at > 0 ? [step('cf-prev', '‹ Prev', 'p', files[at - 1])] : []),
          ...(at >= 0 && at < files.length - 1 ? [step('cf-next', 'Next ›', 'n', files[at + 1])] : []),
          ...(file.entry
            ? [
                Button({
                  key: 'cf-stage',
                  label: staged ? 'Unstage' : 'Stage',
                  hotkey: 's',
                  onPress: () => toggleStageOpenFile($),
                }),
              ]
            : []),
          ...(file.entry && !staged
            ? [Button({ key: 'cf-discard', label: 'Discard ⚠', hotkey: 'd', onPress: () => askDiscard($, file.entry) })]
            : []),
          ...(file.entry && isDocPath(file.path)
            ? [Button({ key: 'cf-doc', label: 'Open doc', hotkey: 'o', onPress: () => openDocFromChanges($, file.path, 'change-file') })]
            : []),
        ],
      }),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Text({ bold: true, wrap: 'truncate-start', children: file.path }),
          Text({ dimColor: true, children: [countsText(diff), PLANE_LABEL[file.plane]].filter(Boolean).join(' · ') }),
        ],
      }),
      Text({ children: ' ' }),
      !diff
        ? Text({ dimColor: true, children: 'Reading diff…' })
        : Box({
            flexDirection: 'column',
            children: windowedRows(
              c,
              diffBodyItems($, c, 'cf', file.path, diff, () => terminalDiffItems(c, diff.lines, 'l', paneColumns(c.e) - 2, file.path), false).items,
              3,
            ),
          }),
    ],
  })
}

const changeAllView = ($, c) => {
  const { Box, Text, Button, goto } = c
  const focus = activeFocus()
  const shown = allDiffItems($, c, focus, false)
  const status = state.allLoaded || !state.allStatus ? [] : [Text({ key: 'ca-status', dimColor: true, children: 'Diffs: ' + state.allStatus })]
  return Box({
    flexDirection: 'column',
    children: [
      Button({ key: 'ca-back', label: '< Back', hotkey: 'b', autoFocus: true, onPress: () => goto('changes') }),
      Text({ bold: true, children: focusTitle(focus) }),
      ...status,
      shown.any
        ? Box({ key: 'ca-list', flexDirection: 'column', children: windowedRows(c, shown.items, 2 + status.length) })
        : Text({ dimColor: true, children: noDiffsText() }),
    ],
  })
}

const discardView = ($, c) => {
  const { Box, Text, Button, goto } = c
  const pending = state.discard
  if (!pending) return changesView($, c)
  const entry = pending.entry
  const effect =
    entry.y === '?'
      ? 'Deletes this new file. It is not in git, so it cannot be recovered.'
      : "Throws away this file's uncommitted edits in the working tree. This cannot be undone." +
        (entry.x !== ' ' ? ' Edits already staged stay.' : '')
  return Box({
    flexDirection: 'column',
    children: [
      Text({
        bold: true,
        children: 'Discard changes: ' + (visibleRepos().length > 1 ? repoNameOf(state.changes.repo) + ' · ' : '') + entry.path,
      }),
      Text({ color: 'yellow', children: 'Effect: ' + effect }),
      Text({ children: ' ' }),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Button({ key: 'discard-yes', label: 'Discard ⚠', hotkey: 'y', onPress: () => confirmDiscard($) }),
          Button({
            key: 'discard-cancel',
            label: 'Cancel',
            hotkey: 'x',
            autoFocus: true,
            onPress: () => {
              state.discard = null
              goto(pending.back)
            },
          }),
        ],
      }),
    ],
  })
}

const STATUS_TONE = { M: 'mod', A: 'add', U: 'add', D: 'del', R: 'ren', C: 'del' }

const lineCountOf = (sizes, entry, key) => {
  const diff = state.allDiffs[key]
  if (diff) return { added: diff.added, removed: diff.removed }
  const size = sizes[entry.path]
  if (!size || size.startsWith('-')) return { added: 0, removed: 0 }
  const [added, removed] = size.split('/').map(Number)
  return { added: added || 0, removed: removed || 0 }
}

const statusChip = (c, key, letter) =>
  c.Box({ key, width: 3, flexShrink: 0, children: [chip(c, key + 't', letter, STATUS_TONE[letter] || 'muted')] })

const shortFolder = (path) => {
  const parts = folderOfPath(path).split('/').filter(Boolean)
  return parts.length > 2 ? '…/' + parts.slice(-2).join('/') : parts.join('/')
}

const folderOfPath = (path) => {
  const cut = path.lastIndexOf('/')
  return cut < 0 ? '' : path.slice(0, cut)
}

const changeMap = ($, c, sizes) => {
  const { Box, Text } = c
  const files = []
  for (const plane of ['staged', 'worktree']) {
    for (const entry of orderedFiles(plane)) {
      const key = plane + ':' + entry.path
      const lines = lineCountOf(sizes, entry, key)
      files.push({ plane, entry, key, ...lines, weight: Math.max(1, Math.round(Math.log2(lines.added + lines.removed + 2))) })
    }
  }
  if (!files.length) return []
  let shown = files
  let total = shown.reduce((sum, file) => sum + file.weight, 0)
  while (total > DESKTOP_MAP_CELLS && shown.some((file) => file.weight > 1)) {
    shown = shown.map((file) => ({ ...file, weight: Math.max(1, file.weight - 1) }))
    total = shown.reduce((sum, file) => sum + file.weight, 0)
  }
  const extra = Math.max(0, shown.length - DESKTOP_MAP_CELLS)
  if (extra) shown = shown.slice(0, DESKTOP_MAP_CELLS)
  return [
    Box({
      key: 'map',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 0,
      children: [
        ...shown.map((file) =>
          mapBlock(c, {
            key: 'map-' + file.key,
            scope: hoverScope(file.key),
            added: file.added,
            removed: file.removed,
            cells: file.weight,
            onPress: () => openChangeFile($, file.entry, file.plane, 'changes'),
          }),
        ),
        ...(extra ? [Text({ key: 'map-more', dimColor: true, children: ' +' + extra })] : []),
      ],
    }),
  ]
}

const desktopChangesView = ($, c) => {
  const { Box, Text, Button, Input, redraw, bindField } = c
  const ch = state.changes
  state.wide = false
  const sizes = numstatOf(ch.raw || '')
  const roots = visibleRepos()
  const stacked = roots.length > 1
  const hiddenCount = Object.keys(state.repoHidden).length
  let totalAdded = 0
  let totalRemoved = 0
  for (const plane of ['staged', 'worktree']) {
    for (const entry of sectionEntries(ch.entries, plane)) {
      const lines = lineCountOf(sizes, entry, plane + ':' + entry.path)
      totalAdded += lines.added
      totalRemoved += lines.removed
    }
  }

  const fileRow = (row, plane, index) => {
    const entry = row.entry
    const letter = letterOf(entry, plane)
    const key = plane + ':' + entry.path
    const lines = lineCountOf(sizes, entry, key)
    const indent = row.depth * 2
    return Box({
      key: 'r-' + plane + '-' + index,
      height: 1,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 1,
      paddingLeft: 1 + indent,
      paddingRight: 1,
      hover: { scope: hoverScope(key), backgroundColor: DESKTOP_TONE.stripHot },
      children: [
        statusChip(c, 'r-' + plane + '-' + index + 's', letter),
        Box({
          key: 'r-' + plane + '-' + index + 'n',
          flexGrow: 1,
          flexShrink: 1,
          children: [
            Button({
              key: 'r-' + plane + '-' + index + 'b',
              plain: true,
              label: nameOf(entry.path) + (entry.orig ? ' ← ' + nameOf(entry.orig) : ''),
              onPress: () => openChangeFile($, entry, plane, 'changes'),
            }),
          ],
        }),
        counts(c, 'r-' + plane + '-' + index + 'c', lines.added, lines.removed),
      ],
    })
  }

  const folderRow = (row, plane, index) => {
    const collapse = () => {
      state.changesCollapsed[row.key] = row.open
      redraw()
    }
    const key = 'd-' + plane + '-' + index
    return Box({
      key,
      height: 1,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 1,
      paddingLeft: 1 + row.depth * 2,
      paddingRight: 1,
      children: [
        Box({
          key: key + 'n',
          flexGrow: 1,
          flexShrink: 1,
          children: [Button({ key: key + 'b', plain: true, label: (row.open ? '▾ ' : '▸ ') + row.label + '/', onPress: collapse })],
        }),
        Text({ key: key + 'c', dimColor: true, children: String(row.count) }),
        Button({ key: key + 'v', label: 'view ›', plain: true, onPress: () => openChangeAll($, plane + ':' + row.dirPath) }),
        Button({ key: key + 's', label: plane === 'staged' ? 'unstage' : 'stage', plain: true, onPress: () => toggleStageFolder($, plane, row.dirPath) }),
      ],
    })
  }

  const section = (plane) => {
    const entries = sectionEntries(ch.entries, plane)
    const closed = Boolean(state.changesCollapsed['sec:' + plane])
    const staged = plane === 'staged'
    const header = (prefix = '') =>
      strip(c, {
        key: prefix + 'sec-' + plane,
        title: (closed ? '▸ ' : '▾ ') + (staged ? 'STAGED' : 'CHANGES'),
        count: entries.length,
        onPress: () => {
          state.changesCollapsed['sec:' + plane] = !closed
          redraw()
        },
        right: entries.length
          ? [
              Button({ key: prefix + 'sec-' + plane + '-view', label: 'view ›', onPress: () => openChangeAll($, plane + ':') }),
              Button({
                key: prefix + 'sec-' + plane + '-all',
                label: staged ? 'Unstage all' : 'Stage all',
                ...liveOnly(prefix, { hotkey: staged ? 'u' : 'a' }),
                ...(staged ? {} : { variant: 'primary' }),
                onPress: () => (staged ? unstageEverything($) : stageEverything($)),
              }),
            ]
          : [],
      })
    const items = [
      {
        height: DESKTOP_STRIP_ROWS,
        make: () => Box({ key: 'sec-' + plane + '-w', height: DESKTOP_STRIP_ROWS, flexShrink: 0, flexDirection: 'column', justifyContent: 'center', children: [header()] }),
        sticky: (prefix) => header(prefix),
      },
    ]
    if (closed) return items
    if (!entries.length) {
      items.push({ height: 1, make: () => Text({ key: plane + '-none', dimColor: true, children: '  Nothing ' + (staged ? 'staged' : 'unstaged') + '.' }) })
    }
    treeRows(entries, plane, state.changesCollapsed).forEach((row, index) =>
      items.push({ height: 1, make: () => (row.kind === 'dir' ? folderRow(row, plane, index) : fileRow(row, plane, index)) }),
    )
    return items
  }

  const body = () => {
    if (ch.error) return [Text({ key: 'ch-err', color: 'error', children: ch.error })]
    if (!ch.loaded) return [Text({ key: 'ch-loading', dimColor: true, children: 'Reading git status…' })]
    if (!ch.entries.length) return [Text({ key: 'ch-clean', dimColor: true, children: 'Nothing changed. Edits Claude makes appear here.' })]
    const top = DESKTOP_PAGE_BAR_ROWS + DESKTOP_STRIP_ROWS + DESKTOP_MAP_ROWS + (stacked ? roots.length * DESKTOP_STRIP_ROWS : 0)
    return [
      ...changeMap($, c, sizes),
      Box({ key: 'ch-rows', flexDirection: 'column', children: windowedRows(c, [...section('staged'), ...section('worktree')], top) }),
    ]
  }

  const repoStrip = (root) => {
    const active = root === state.repoRoot
    const count = active ? ch.entries.length : state.repoCounts[root]
    return strip(c, {
      key: 'repo-' + root,
      title: (active ? '● ' : '○ ') + repoNameOf(root),
      count,
      hot: active,
      onPress: () => selectRepo($, root),
      right: [Button({ key: 'repo-x-' + root, label: '✕', plain: true, onPress: () => removeRepo($, root) })],
    })
  }

  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [
      pageBar(c, {
        back: { key: 'ch-close', label: '< Close', hotkey: 'b', onPress: () => closePane($) },
        actions: [
          { key: 'ch-all', label: 'All diffs', hotkey: 'v', primary: true, onPress: () => openChangeAll($) },
          { key: 'ch-refresh', label: 'Refresh', hotkey: 'r', onPress: () => refreshRepoList($).then(() => refreshChanges($)) },
          {
            key: 'ch-add',
            label: 'Add repo',
            hotkey: 'g',
            unpinned: true,
            onPress: () => {
              state.repoForm = !state.repoForm
              state.repoNote = ''
              redraw()
            },
          },
          ...(hiddenCount ? [{ key: 'ch-unhide', label: hiddenCount + ' hidden · show', onPress: () => showHiddenRepos($) }] : []),
        ],
      }),
      ...(state.repoForm
        ? [
            Input({
              key: 'repo-path',
              label: 'Repo',
              placeholder: 'folder of a git repo, e.g. ~/code/app (Remove only forgets it)',
              value: state.repoPath,
              autoFocus: true,
              onInput: bindField('repoPath'),
              onSubmit: (value) => addRepo($, typeof value === 'string' && value.trim() ? value : state.repoPath),
            }),
          ]
        : []),
      ...(state.repoNote ? [Text({ key: 'repo-note', color: 'error', children: state.repoNote })] : []),
      Box({
        key: 'ch-head',
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 2,
        children: [
          Text({ key: 'ch-title', bold: true, wrap: 'truncate-start', children: ch.repo ? repoNameOf(ch.repo) : 'Changes' }),
          Text({ key: 'ch-files', dimColor: true, children: ch.entries.length + (ch.entries.length === 1 ? ' file' : ' files') }),
          counts(c, 'ch-counts', totalAdded, totalRemoved),
        ],
      }),
      Box({
        key: 'ch-body',
        flexDirection: 'column',
        children: stacked
          ? roots.flatMap((root) => [repoStrip(root), ...(root === state.repoRoot ? body() : [])])
          : body(),
      }),
    ],
  })
}

const desktopGapRow = (c, line, key, width) => {
  const { Box, Text } = c
  return Box({
    key,
    height: 1,
    flexShrink: 0,
    paddingLeft: width + 3,
    backgroundColor: DESKTOP_TONE.gapRow,
    children: [Text({ dimColor: true, wrap: 'truncate', children: '⋯ ' + line.hidden + ' unchanged lines' })],
  })
}

const desktopDiffRow = (c, line, key, width, tokens) => {
  const { Box, Text } = c
  const isAdd = line.kind === 'add'
  const isDel = line.kind === 'del'
  const word = isAdd ? DESKTOP_DIFF.addedWord : DESKTOP_DIFF.removedWord
  const segments = syntaxSegments(line.text.length, tokens, line.span)
  const body = line.text
    ? Text({
        children: segments.map((segment, index) =>
          segment.tone || segment.mark
            ? Text({ key: 'w' + index, ...syntaxSegmentStyle(segment, word), children: line.text.slice(segment.from, segment.to) })
            : line.text.slice(segment.from, segment.to),
        ),
      })
    : Text({ children: ' ' })
  return Box({
    key,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...(isAdd || isDel ? { backgroundColor: isAdd ? DESKTOP_DIFF.added : DESKTOP_DIFF.removed } : {}),
    children: [
      Text({
        key: key + 'g',
        children: [
          Text({ key: key + 'n', dimColor: true, children: String(isDel ? line.oldNo : line.newNo).padStart(width) + ' ' }),
          Text({ key: key + 's', color: isAdd ? 'success' : isDel ? 'error' : undefined, children: (isAdd ? '+' : isDel ? '−' : ' ') + ' ' }),
        ],
      }),
      body,
    ],
  })
}

const loadOneDiff = async ($, entry, plane) => {
  const key = plane + ':' + entry.path
  const root = state.repoRoot
  const diff = await readDiff($, state.changes.repo, fileTargets(entry), plane)
  if (root !== state.repoRoot) return
  state.allDiffs[key] = diff
  invalidatePane($)
}

const windowedRows = (c, items, topRows) => {
  const pageChanged = state.allScroll.view !== state.view
  const live = !pageChanged && c.e.props && c.e.props.scroll
  const view = live ? { view: state.view, offset: live.offset, body: live.bodyRows || state.allScroll.body } : state.allScroll
  if (pageChanged) state.allScroll = { view: state.view, offset: 0, body: state.allScroll.body }
  const bodyRows = view.body || WINDOW_ROWS
  const total = items.reduce((sum, item) => sum + item.height, 0)
  const offset = view.view === state.view ? Math.min(view.offset, Math.max(0, topRows + total - bodyRows)) : 0
  state.windowAt = offset
  state.windowed = true
  const from = offset - topRows - Math.ceil(bodyRows / 2)
  const to = offset - topRows + Math.ceil(bodyRows * 1.5)
  let y = 0
  let above = 0
  let below = 0
  const drawn = []
  for (const item of items) {
    const end = y + item.height
    if ('sticky' in item && y < offset - topRows + STICKY_COVER_ROWS) state.stickySection = item.sticky
    if (end <= from) above += item.height
    else if (y >= to) below += item.height
    else drawn.push(item.make())
    y = end
  }
  const spacer = (key, height) =>
    Array.from({ length: Math.ceil(height / SPACER_MAX_ROWS) }, (_, part) =>
      c.Box({ key: part ? key + part : key, height: Math.min(SPACER_MAX_ROWS, height - part * SPACER_MAX_ROWS), flexShrink: 0 }),
    )
  return [...spacer('w-above', above), ...drawn, ...spacer('w-below', below)]
}

const desktopGroups = (focus) =>
  ['worktree', 'staged']
    .map((plane) => ({ plane, files: orderedFiles(plane).filter((entry) => entryInFocus(focus, plane, entry)) }))
    .filter((group) => group.files.length)

const desktopFileStrip = ($, c, entry, plane, diff, toggle, prefix = '') => {
  const { Button } = c
  const key = prefix + plane + ':' + entry.path
  const staged = plane === 'staged'
  return c.Box({
    key: key + '#hd',
    height: DESKTOP_STRIP_ROWS,
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 1,
    paddingX: 1,
    backgroundColor: DESKTOP_TONE.strip,
    hover: { scope: hoverScope(key), backgroundColor: DESKTOP_TONE.stripHot },
    children: [
      statusChip(c, key + '#l', letterOf(entry, plane)),
      c.Box({
        key: key + '#p',
        flexGrow: 1,
        flexShrink: 1,
        flexDirection: 'row',
        columnGap: 1,
        children: [
          Button({ key: key + '#h', plain: true, label: nameOf(entry.path), onPress: () => openChangeFile($, entry, plane, state.view) }),
          c.Text({ key: key + '#f', dimColor: true, wrap: 'truncate-start', children: shortFolder(entry.path) }),
        ],
      }),
      ...(diff ? [counts(c, key + '#c', diff.added, diff.removed)] : []),
      ...(toggle ? [Button({ key: key + '#t', label: toggle.open ? 'Hide' : 'Show diff ›', onPress: toggle.onPress })] : []),
      Button({
        key: key + '#m',
        label: staged ? 'Unstage' : 'Stage',
        onPress: () => (staged ? unstageThese($, fileTargets(entry)) : stageThese($, stageTargets(entry))),
      }),
      ...(staged ? [] : [Button({ key: key + '#d', label: 'Discard', onPress: () => askDiscard($, entry) })]),
      ...(isDocPath(entry.path) ? [Button({ key: key + '#o', label: 'Doc', onPress: () => openDocFromChanges($, entry.path, state.view) })] : []),
    ],
  })
}

const stageAllActions = ($, focus, groups) => {
  const parts = splitFocus(focus)
  if (parts && parts.path && !parts.path.endsWith('/')) return []
  return groups.map((group) => {
    const staged = group.plane === 'staged'
    const press = parts ? () => toggleStageFocused($) : () => (staged ? unstageEverything($) : stageEverything($))
    return { key: 'ca-' + group.plane + '-all', label: (staged ? 'Unstage all ' : 'Stage all ') + group.files.length, hotkey: staged ? 'u' : 'a', primary: !staged, onPress: press }
  })
}

const desktopChangeAllView = ($, c) => {
  const { Box, Text, goto, redraw } = c
  const focus = activeFocus()
  const groups = desktopGroups(focus)
  const fileCount = groups.reduce((sum, group) => sum + group.files.length, 0)
  const items = []
  const add = (height, make) => items.push({ height, make })
  for (const group of groups) {
    if (!focus || groups.length > 1) {
      const title = (group.plane === 'staged' ? 'STAGED' : 'CHANGES') + '  ' + group.files.length
      items.push({
        height: 2,
        make: () => Box({ key: 'dg-' + group.plane, height: 2, flexShrink: 0, alignItems: 'flex-end', children: [Text({ bold: true, children: title })] }),
        sticky: (prefix) => Text({ key: prefix + 'dg-' + group.plane, bold: true, children: title }),
      })
    }
    for (const entry of group.files) {
      const key = group.plane + ':' + entry.path
      const diff = state.allDiffs[key]
      const open = diffIsOpen(key)
      const toggle = {
        open,
        onPress: () => {
          state.allOpen[key] = !open
          redraw()
          if (!open && !diff) loadOneDiff($, entry, group.plane)
        },
      }
      items.push({
        height: DESKTOP_STRIP_ROWS,
        make: () => desktopFileStrip($, c, entry, group.plane, diff, toggle),
        sticky: (prefix) => desktopFileStrip($, c, entry, group.plane, diff, toggle, prefix),
      })
      if (!open) continue
      if (!diff) {
        add(1, () => Text({ key: key + '#r', dimColor: true, wrap: 'truncate', children: state.allLoaded ? 'Diff not read' : 'Reading diff…' }))
        continue
      }
      const shown = shownLines(key, diff)
      const body = diffBodyItems($, c, key, entry.path, diff, () => desktopDiffItems(c, shown, key + '#', entry.path), true)
      items.push(...body.items)
      const hidden = diff.lines.length - shown.length
      if (body.plain && hidden > 0) {
        items.push(
          moreLinesItem(c, key + '#more', hidden, () => {
            state.allFull[key] = true
            redraw()
          }),
        )
      }
    }
  }
  const reading = state.allLoaded || !state.allStatus ? '' : 'Reading diffs · ' + state.allStatus
  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [
      pageBar(c, {
        back: { key: 'ca-back', label: '< Back', hotkey: 'b', onPress: () => goto('changes') },
        actions: [...(focus ? [{ key: 'ca-all', label: 'Show all', hotkey: 'v', onPress: () => openChangeAll($) }] : []), ...stageAllActions($, focus, groups)],
        title: focusTitle(focus) + ' · ' + fileCount + (fileCount === 1 ? ' file' : ' files'),
        sub: reading,
      }),
      items.length
        ? Box({ key: 'ca-list', flexDirection: 'column', children: windowedRows(c, items, DESKTOP_PAGE_BAR_ROWS) })
        : Text({ key: 'ca-empty', dimColor: true, children: noDiffsText() }),
    ],
  })
}

const desktopDiffItems = (c, lines, prefix, path) => {
  const width = lineNumberWidth(lines)
  const tokens = highlightLines(lines, path)
  return lines.map((line, index) =>
    line.kind === 'gap'
      ? { height: 1, make: () => desktopGapRow(c, line, prefix + index, width) }
      : {
          height: Math.max(1, Math.ceil(line.text.length / DESKTOP_WRAP_CHARS)),
          make: () => desktopDiffRow(c, line, prefix + index, width, tokens[index]),
        },
  )
}

const mediaSides = (media) => {
  const pair = Boolean(media.before && media.after)
  if (pair) return [['Before', media.before], ['After', media.after]]
  if (media.after) return [[media.kind === 'pdf' ? 'Page 1' : media.isNew ? 'New' : 'Now', media.after]]
  if (media.before) return [['Removed', media.before]]
  return []
}

const desktopMediaItems = ($, c, key, diff) => {
  const { Box, Text, Button, Svg } = c
  const media = diff.media
  const sides = mediaSides(media)
  const caption = {
    height: 2,
    make: () =>
      Box({
        key: key + '-cap',
        flexDirection: 'row',
        alignItems: 'center',
        columnGap: 2,
        children: [
          Text({ dimColor: true, children: mediaCaption(media) }),
          Button({ key: key + '-open', label: 'Open in viewer', onPress: () => openInViewer($, media.abs) }),
        ],
      }),
  }
  if (!sides.length) {
    const why = media.kind === 'file' ? '' : 'No preview could be made here (needs macOS sips). Press Open in viewer.'
    return why ? [caption, { height: 1, make: () => Text({ key: key + '-none', dimColor: true, wrap: 'truncate', children: why }) }] : [caption]
  }
  const tallest = Math.max(...sides.map(([, side]) => side.svg.height))
  return [
    caption,
    {
      height: Math.ceil(tallest / MEDIA_ROW_PX) + 2,
      make: () =>
        Box({
          key: key + '-pics',
          flexDirection: 'row',
          columnGap: 2,
          children: sides.map(([label, side]) =>
            Box({
              key: key + '-side-' + label,
              flexDirection: 'column',
              children: [
                Text({ dimColor: true, children: label }),
                Svg({ source: side.svg.source, alt: label, width: side.svg.width, height: side.svg.height }),
              ],
            }),
          ),
        }),
    },
  ]
}

const desktopChangeFileView = ($, c) => {
  const { Box, Text, goto } = c
  const file = state.changeFile
  if (!file) return desktopChangesView($, c)
  const diff = state.changeDiff
  const files = file.entry && state.diffBack === 'changes' ? orderedFiles(file.plane) : []
  const at = files.findIndex((entry) => entry.path === file.path)
  const staged = file.plane === 'staged'
  const step = (key, label, hotkey, target) => ({ key, label, hotkey, onPress: () => openChangeFile($, target, file.plane, state.diffBack) })
  const head = (prefix) =>
    Box({
      key: prefix + 'cf-head',
      height: DESKTOP_STRIP_ROWS,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      columnGap: 1,
      paddingX: 1,
      backgroundColor: DESKTOP_TONE.strip,
      children: [
        ...(file.entry ? [statusChip(c, prefix + 'cf-l', letterOf(file.entry, file.plane))] : []),
        Text({ key: prefix + 'cf-name', bold: true, wrap: 'truncate-start', children: nameOf(file.path) }),
        Box({ key: prefix + 'cf-fold', flexGrow: 1, flexShrink: 1, children: [Text({ dimColor: true, wrap: 'truncate-start', children: folderOfPath(file.path) })] }),
        ...(diff ? [counts(c, prefix + 'cf-c', diff.added, diff.removed)] : []),
        Text({ key: prefix + 'cf-plane', dimColor: true, children: PLANE_LABEL[file.plane] + (at >= 0 ? ' · ' + (at + 1) + ' of ' + files.length : '') }),
      ],
    })
  state.stickySection = head
  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [
      pageBar(c, {
        back: { key: 'cf-back', label: '< Back', hotkey: 'b', onPress: () => goto(state.diffBack) },
        actions: [
          ...(at > 0 ? [step('cf-prev', '‹ Prev', 'p', files[at - 1])] : []),
          ...(at >= 0 && at < files.length - 1 ? [step('cf-next', 'Next ›', 'n', files[at + 1])] : []),
          ...(file.entry ? [{ key: 'cf-stage', label: staged ? 'Unstage' : 'Stage', hotkey: 's', primary: !staged, onPress: () => toggleStageOpenFile($) }] : []),
          ...(file.entry && !staged ? [{ key: 'cf-discard', label: 'Discard', hotkey: 'd', onPress: () => askDiscard($, file.entry) }] : []),
          ...(file.entry && isDocPath(file.path)
            ? [{ key: 'cf-doc', label: 'Open doc', hotkey: 'o', onPress: () => openDocFromChanges($, file.path, 'change-file') }]
            : []),
        ],
      }),
      head(''),
      !diff
        ? Text({ key: 'cf-reading', dimColor: true, children: 'Reading diff…' })
        : Box({
            key: 'cf-rows',
            flexDirection: 'column',
            children: windowedRows(
              c,
              diffBodyItems($, c, 'cf', file.path, diff, () => desktopDiffItems(c, diff.lines, 'l', file.path), true).items,
              DESKTOP_PAGE_BAR_ROWS + DESKTOP_STRIP_ROWS + 1,
            ),
          }),
    ],
  })
}

const docGauge = (doc) => {
  if (typeof doc.lines === 'number') {
    const max = isInstructionFile(doc) ? CLAUDE_MD_MAX_LINES : TASK_DOC_MAX_LINES
    return { value: doc.lines, max, label: doc.lines + '/' + max }
  }
  return { value: doc.size || 0, max: CLAUDE_MD_MAX_BYTES, label: kb(doc.size || 0) }
}

const desktopDocRow = (c, doc, key, withScope, indent) => {
  const { Box, Text, Button, pickAction } = c
  const heavy = isHeavy(doc)
  const gauge = docGauge(doc)
  const decisionsHeavy = oversizedDecisions(doc).length
  return Box({
    key,
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 1,
    paddingLeft: indent ? 3 : 1,
    paddingRight: 1,
    hover: { backgroundColor: DESKTOP_TONE.stripHot },
    children: [
      Box({
        key: key + 'n',
        width: indent ? 22 : 24,
        flexShrink: 1,
        minWidth: 10,
        overflow: 'hidden',
        children: [Button({ key: key + 'b', label: docLabel(doc, indent ? 22 : 24), plain: true, onPress: () => pickAction(doc) })],
      }),
      Box({ key: key + 'g', width: 9, flexShrink: 4, minWidth: 0, overflow: 'hidden', children: [meter(c, key + 'm', gauge.value, gauge.max, 8)] }),
      Box({
        key: key + 'l',
        width: 10,
        flexShrink: 4,
        minWidth: 0,
        overflow: 'hidden',
        paddingLeft: 1,
        children: [Text({ key: key + 'lt', color: heavy ? 'warning' : undefined, dimColor: !heavy, children: gauge.label })],
      }),
      Box({ key: key + 'a', width: 9, flexShrink: 2, minWidth: 0, overflow: 'hidden', children: [Text({ dimColor: true, children: agoOf(state.now, doc.mtime) })] }),
      Box({
        key: key + 't',
        flexGrow: 1,
        flexShrink: 1,
        minWidth: 20,
        overflow: 'hidden',
        flexDirection: 'row',
        columnGap: 1,
        children: [
          ...(doc.hub ? [chip(c, key + 'hub', 'main doc', 'muted')] : []),
          ...(decisionsHeavy ? [chip(c, key + 'dc', '⚠ decisions', 'warn')] : []),
          ...(withScope && doc.scope ? [Text({ key: key + 's', dimColor: true, wrap: 'truncate-end', children: doc.scope })] : []),
          ...(doc.status ? [Text({ key: key + 'st', wrap: 'truncate-end', children: doc.status })] : []),
        ],
      }),
    ],
  })
}

const MENU_GROUPS = [
  { title: 'SHIP WORK', labels: ['Commit', 'Commit and push', 'Done', 'Ship'] },
  { title: 'DOCS', labels: ['Read a task doc', 'Shrink a doc', 'Refresh a doc', 'Merge docs'] },
  { title: 'SESSION', labels: ['Hand off', 'Changes', 'Images'] },
]

const desktopMenuView = ($, c) => {
  const { Box, Text, Button } = c
  const rows = []
  MENU_GROUPS.forEach((group) => {
    rows.push(Box({ key: 'mg-' + group.title, marginTop: rows.length ? 1 : 0, children: [strip(c, { key: 'mgs-' + group.title, title: group.title })] }))
    group.labels.forEach((label) => {
      const index = VERBS.findIndex((verb) => verb.label === label)
      if (index < 0) return
      const verb = VERBS[index]
      rows.push(
        Box({
          key: 'v' + index,
          flexDirection: 'row',
          alignItems: 'center',
          columnGap: 1,
          paddingX: 1,
          hover: { backgroundColor: DESKTOP_TONE.stripHot },
          children: [
            Box({
              key: 'vn' + index,
              width: 22,
              flexShrink: 0,
              children: [
                Button({
                  key: 'vb' + index,
                  label: verb.label,
                  ...(index < 9 ? { hotkey: String(index + 1) } : {}),
                  plain: true,
                  ...(index === 0 ? { autoFocus: true } : {}),
                  onPress: () => runVerb($, c, verb),
                }),
              ],
            }),
            Box({ key: 'vh' + index, flexGrow: 1, flexShrink: 1, children: [Text({ dimColor: true, wrap: 'truncate-end', children: verb.hint })] }),
            ...(verb.danger ? [chip(c, 'vd' + index, 'asks first', 'warn')] : []),
          ],
        }),
      )
    })
  })
  return Box({ flexDirection: 'column', children: [Text({ key: 'menu-title', bold: true, children: 'What do you want to do?' }), ...rows, Box({ key: 'menu-version', marginTop: 1, children: [Text({ dimColor: true, children: 'syafiqkit mod v' + MOD_VERSION })] })] })
}

let galleryPick = ''

const pngBytes = (image) => (image.png ? Math.floor((image.png.length * 3) / 4) : 0)

const desktopImagesView = ($, c) => {
  const { Box, Text, Button, Svg, redraw } = c
  const list = [...state.images].reverse()
  const close = { key: 'img-close', label: '< Close', hotkey: 'b', onPress: () => closePane($) }
  if (!list.length) {
    return Box({
      flexDirection: 'column',
      rowGap: 1,
      children: [pageBar(c, { back: close }), Text({ key: 'img-none', dimColor: true, children: 'No images yet. Ask Claude to show a screenshot and it appears here.' })],
    })
  }
  if (galleryPick && !list.some((image) => image.path === galleryPick)) galleryPick = ''
  const pick = (path) => {
    galleryPick = path
    redraw()
    const image = list.find((item) => item.path === path)
    if (image && slicesWanted(image)) ensureSlice($, image, image.slice || 0).then(redraw)
  }
  const stepSlice = (image, delta) => {
    image.slice = Math.max(0, Math.min(sliceGeometry(image.size).count - 1, (image.slice || 0) + delta))
    redraw()
    ensureSlice($, image, image.slice).then(redraw)
  }
  const zoomed = (image) => galleryPick === image.path && slicesWanted(image)
  const slicePicture = (image) => {
    const drawn = image.slices && image.slices[image.slice || 0]
    if (drawn) return Svg({ key: 'img-slice-' + image.path + '-' + (image.slice || 0), source: drawn.source, alt: image.name, width: drawn.width, height: drawn.height })
    if (image.slices && (image.slice || 0) in image.slices) return galleryPicture(c, image, true, 0)
    return Text({ key: 'img-cutting-' + image.path, dimColor: true, children: 'Cutting this part of the picture…' })
  }
  const chips = list.map((image, index) => {
    const drawable = Boolean(svgPicture(image))
    return Button({
      key: 'img-pick-' + image.path,
      label: String(index + 1) + ' · ' + (drawable ? kb(pngBytes(image)) : 'too big'),
      variant: galleryPick === image.path ? 'primary' : 'secondary',
      onPress: () => pick(galleryPick === image.path ? '' : image.path),
    })
  })
  const shown = galleryPick ? list.filter((image) => image.path === galleryPick) : list
  let room = DESKTOP_DRAW_CHARS
  const fits = (image) => {
    const picture = svgPicture(image)
    const size = picture ? picture.source.length : 0
    if (size > room) return false
    room -= size
    return true
  }
  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [
      pageBar(c, {
        back: close,
        actions: [
          {
            key: 'img-clear',
            label: 'Clear',
            hotkey: 'c',
            onPress: () => {
              state.images = []
              saveGallery($)
              galleryPick = ''
              redraw()
            },
          },
        ],
      }),
      Box({
        key: 'img-strip',
        flexDirection: 'row',
        flexWrap: 'wrap',
        columnGap: 1,
        rowGap: 1,
        children: [Button({ key: 'img-pick-all', label: 'All ' + list.length, variant: galleryPick ? 'secondary' : 'primary', onPress: () => pick('') }), ...chips],
      }),
      ...shown.map((image) =>
        Box({
          key: 'img-' + image.path,
          flexDirection: 'column',
          children: [
            strip(c, {
              key: 'img-h-' + image.path,
              title: (list.indexOf(image) + 1) + '  ' + image.name,
              right: [
                ...(zoomed(image) && sliceGeometry(image.size).count > 1
                  ? [
                      Button({ key: 'img-up-' + image.path, label: '‹ Up', hotkey: 'p', onPress: () => stepSlice(image, -1) }),
                      Button({ key: 'img-down-' + image.path, label: 'Down ›', hotkey: 'n', onPress: () => stepSlice(image, 1) }),
                    ]
                  : []),
                Button({ key: 'img-open-' + image.path, label: 'Open in viewer', onPress: () => openInViewer($, image.path) }),
              ],
            }),
            Text({
              key: 'img-meta-' + image.path,
              dimColor: true,
              wrap: 'truncate-start',
              children: [
                image.size ? image.size.width + ' x ' + image.size.height : '',
                zoomed(image) && sliceGeometry(image.size).count > 1 ? 'part ' + ((image.slice || 0) + 1) + ' of ' + sliceGeometry(image.size).count : '',
                image.preview && !zoomed(image) ? 'smaller copy, full size in the viewer' : '',
                image.caption,
                image.path,
              ]
                .filter(Boolean)
                .join(' · '),
            }),
            zoomed(image)
              ? slicePicture(image)
              : fits(image)
              ? galleryPicture(c, image, true, 0)
              : Button({
                  key: 'img-room-' + image.path,
                  plain: true,
                  label: 'Not drawn with the others · press to show it alone',
                  onPress: () => pick(image.path),
                }),
          ],
        }),
      ),
    ],
  })
}

const docView = ($, c) => {
  const { e, Box, Text, Button, Markdown, Image, goto, redraw, askFirst, openHandoff, openDecision } = c
  const parts = segments(state.text)
  const openItems = parts.filter((part) => part.kind === 'item' && !part.done)
  const doneItems = parts.filter((part) => part.kind === 'item' && part.done)
  const sourceOf = (source, key) => Markdown({ key, text: '```mermaid\n' + source + '\n```' })

  const columns = paneColumns(e)
  const itemWidth = Math.max(20, columns - 10)
  const cappedCount = isDesktop(e) || state.current.group !== 'Task docs' ? 0 : openItems.filter((part) => wrapWords(part.text, itemWidth).length > ITEM_CAP_ROWS).length

  const pickable = (part, key) => {
    const rank = state.selected.indexOf(part.text) + 1
    const picked = rank > 0
    const lead = (picked ? '▶' + rank + ' ' : '   ') + '[ ] '
    const toggle = () => {
      state.selected = picked
        ? state.selected.filter((item) => item !== part.text)
        : [...state.selected, part.text]
      redraw()
    }
    const dim = !picked && state.selected.length > 0
    if (isDesktop(e)) return Button({ key, plain: true, onPress: toggle, children: [Text({ dimColor: dim, children: lead + part.text })] })
    const all = wrapWords(part.text, itemWidth)
    const capped = !state.expandItems && all.length > ITEM_CAP_ROWS
    const shown = capped ? all.slice(0, ITEM_CAP_ROWS) : all
    const lit = { hover: { scope: hoverScope('item:' + part.text), inverse: true } }
    const first = Button({ key, plain: true, onPress: toggle, ...(all.length > 1 ? lit : {}), children: [Text({ dimColor: dim, children: lead + shown[0] })] })
    if (all.length === 1) return first
    const tail = shown.slice(1)
    if (capped) {
      const hidden = all.length - shown.length
      tail.push('… ' + hidden + (hidden === 1 ? ' more line' : ' more lines') + (picked ? ' (included)' : ''))
    }
    const bodyWidth = columns - 8
    const expandAll = () => {
      state.expandItems = true
      redraw()
    }
    return Box({
      key: key + '-rows',
      flexDirection: 'column',
      children: [
        first,
        ...tail.map((row, at) => {
          const isMore = capped && at === tail.length - 1
          return Button({
            key: key + '.' + (at + 1),
            plain: true,
            onPress: isMore ? expandAll : toggle,
            ...lit,
            children: [
              Text({ children: '    ' }),
              Text({ color: picked ? 'cyan' : undefined, children: picked ? (at === tail.length - 1 ? '╹' : '┃') : ' ' }),
              Text({ dimColor: dim || isMore, children: '  ' + row.padEnd(bodyWidth) }),
            ],
          })
        }),
        Text({ key: key + '-gap', children: ' ' }),
      ],
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
    const svgDiagram = isDesktop(e) && Boolean(c.Svg)
    if (!Image && !svgDiagram) return sourceOf(part.source, 's' + index)
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
    if (svgDiagram) {
      const drawn = svgPicture(diagram)
      if (!drawn) {
        return Box({
          key: 'e' + index,
          flexDirection: 'column',
          children: [Text({ dimColor: true, children: 'Diagram too large for Desktop to draw; source below.' }), sourceOf(part.source, 's' + index)],
        })
      }
      return Box({ key: 'g' + index, children: [c.Svg({ source: drawn.source, alt: 'Mermaid diagram', width: drawn.width, height: drawn.height })] })
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

  const actions = (isTop, prefix = '') => {
    const action = (id, label, topProps, onPress) =>
      Button({ key: prefix + (isTop ? id : id + '-end'), label, ...(isTop ? liveOnly(prefix, topProps) : {}), onPress })
    return Box({
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 2,
      children: [
        action('back', state.docBack ? '< Back to changes' : '< Back', { hotkey: 'b', autoFocus: true }, () => {
          if (state.docBack) return returnFromDoc($)
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
        action('changes', state.docBack ? 'Doc diff' : 'Changes', { hotkey: 'd' }, () => openDocDiff($, state.current.path, 'doc')),
        action('copy', 'Copy', { hotkey: 'y' }, (press) => copyDocFile($, state.current.path, 'the doc', press && press.surface)),
        action('open', 'Open in editor', { hotkey: 'o' }, () => openInEditor($, state.current.path)),
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
        ...(cappedCount
          ? [
              action('expand', state.expandItems ? 'Collapse long' : 'Expand ' + cappedCount + ' long', { hotkey: 'e' }, () => {
                state.expandItems = !state.expandItems
                redraw()
              }),
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
      stickyTop((prefix) => actions(true, prefix)),
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
  const topRow = (prefix) => {
    return Box({
      key: prefix + 'dec-top',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 2,
      children: [
        toDoc(prefix + 'dec-back', prefix ? '' : 'b'),
        ...(index > 0 ? [Button({ key: prefix + 'dec-prev', label: '‹ Prev', ...liveOnly(prefix, { hotkey: 'p' }), onPress: () => openDecision(index - 1) })] : []),
        ...(index < files.length - 1
          ? [Button({ key: prefix + 'dec-next', label: 'Next ›', ...liveOnly(prefix, { hotkey: 'n' }), onPress: () => openDecision(index + 1) })]
          : []),
        Button({
          key: prefix + 'dec-changes',
          label: 'Changes',
          ...liveOnly(prefix, { hotkey: 'd' }),
          onPress: () => openDocDiff($, file.path, 'decision'),
        }),
        Button({
          key: prefix + 'dec-copy',
          label: 'Copy',
          ...liveOnly(prefix, { hotkey: 'y' }),
          onPress: (press) => copyDocFile($, file.path, file.name, press && press.surface),
        }),
        Button({
          key: prefix + 'dec-open',
          label: 'Open in editor',
          ...liveOnly(prefix, { hotkey: 'o' }),
          onPress: () => openInEditor($, file.path),
        }),
        Button({
          key: prefix + 'dec-condense',
          label: 'Condense ⚠',
          ...liveOnly(prefix, { hotkey: 'k' }),
          onPress: () =>
            askFirst('Condense ' + file.name, condenseFileRequest(state.current, file), CONDENSE_FILE_EFFECT, false, state.current),
        }),
        Button({
          key: prefix + 'dec-split',
          label: 'Split ⚠',
          ...liveOnly(prefix, { hotkey: 't' }),
          onPress: () => askFirst('Split ' + file.name, splitRequest(state.current, file), SPLIT_EFFECT, false, state.current),
        }),
      ],
    })
  }
  return Box({
    flexDirection: 'column',
    children: [
      stickyTop(topRow),
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

const galleryPicture = (c, image, desktop, columns) => {
  const { Box, Text, Image, Svg } = c
  const note = (message) => Text({ dimColor: true, children: message })
  const tooLarge = desktop
    ? 'Too large for Desktop to draw here, and no smaller copy could be made: press Open in viewer.'
    : 'Too large to draw here (over 2 MiB): press Open in viewer.'
  if (desktop) {
    const drawn = svgPicture(image)
    if (!drawn) return note(tooLarge)
    return Box({ key: 'gallery-svg-' + image.path, children: [Svg({ source: drawn.source, alt: image.name, width: drawn.width, height: drawn.height })] })
  }
  if (!image.png) return note(tooLarge)
  if (!Image) return note('This screen cannot draw pictures.')
  const size = fitImage(image.size, columns)
  return Image({
    key: 'gallery-img-' + image.path,
    source: { png: image.png },
    columns: size.columns,
    rows: size.rows,
    alt: 'Image not drawn here: start Claude Code with CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1',
  })
}

const imagesView = ($, c) => {
  if (isDesktop(c.e) && c.Svg) return desktopImagesView($, c)
  const { e, Box, Text, Button, redraw } = c
  const list = state.images
  const close = Button({ key: 'img-close', label: '< Close', hotkey: 'b', autoFocus: true, onPress: () => closePane($) })
  if (!list.length) {
    return Box({
      flexDirection: 'column',
      children: [
        close,
        Text({ dimColor: true, children: 'No images yet. Ask Claude to show a screenshot and it appears here.' }),
      ],
    })
  }
  const columns = Math.max(20, paneColumns(e) - 2)
  const clear = Button({
    key: 'img-clear',
    label: 'Clear',
    hotkey: 'c',
    onPress: () => {
      state.images = []
      saveGallery($)
      redraw()
    },
  })
  const shown = [...list].reverse().map((image, index) =>
    Box({
      key: 'img-' + image.path,
      flexDirection: 'column',
      children: [
        Box({
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 2,
          children: [
            Text({ bold: true, children: image.name }),
            Text({ dimColor: true, children: list.length - index + ' of ' + list.length }),
            Button({ key: 'img-open-' + image.path, label: 'Open in viewer', onPress: () => openInViewer($, image.path) }),
          ],
        }),
        ...(image.caption ? [Text({ dimColor: true, wrap: 'truncate-end', children: image.caption })] : []),
        Text({ dimColor: true, wrap: 'truncate-start', children: image.path }),
        galleryPicture(c, image, false, columns),
      ],
    }),
  )
  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [Box({ flexDirection: 'row', columnGap: 2, children: [close, clear] }), ...shown],
  })
}

const docRow = (c, doc, key, withScope, indent) => {
  if (isDesktop(c.e)) return desktopDocRow(c, doc, key, withScope, indent)
  const { Box, Text, Button, pickAction } = c
  const heavy = isHeavy(doc)
  const pad = indent ? '  ' : ''
  const columns = paneColumns(c.e)
  const narrow = columns < NARROW_COLUMNS
  const nameWidth = Math.max(8, (narrow ? Math.min(NAME_WIDTH, Math.floor(columns * 0.45)) : NAME_WIDTH) - pad.length)
  const head = (withScope ? clip(doc.scope || '', SCOPE_WIDTH - 1).padEnd(SCOPE_WIDTH) : '') + agoOf(state.now, doc.mtime).padEnd(11)
  const gauge = docGauge(doc)
  const tail = [narrow && withScope ? doc.scope : '', doc.hub ? 'main doc' : '', heavy ? heavyNote(doc) : '', doc.status].filter(Boolean).join('  ')
  return Box({
    key,
    flexDirection: 'row',
    columnGap: 2,
    children: [
      Button({
        key: key + 'b',
        label: pad + (doc.listName ? clipStart(doc.listName, nameWidth) : clip(doc.name || doc.label, nameWidth)).padEnd(nameWidth),
        plain: true,
        onPress: () => pickAction(doc),
      }),
      ...(narrow
        ? []
        : [
            Text({ key: key + 'a', dimColor: true, wrap: 'truncate-end', children: head }),
            Text({
              key: key + 'g',
              dimColor: !heavy,
              color: heavy ? 'yellow' : undefined,
              children: textMeter(gauge.value, gauge.max, 6) + ' ' + gauge.label.padEnd(8),
            }),
          ]),
      Text({ key: key + 'm', dimColor: !heavy, color: heavy ? 'yellow' : undefined, wrap: 'truncate-end', children: tail }),
    ],
  })
}

const folderOf = (doc) => doc.scope || 'tasks'

const taskFolders = (docs) => {
  const folders = []
  docs.forEach((doc) => {
    const name = folderOf(doc)
    const folder = folders.find((entry) => entry.name === name) || folders[folders.push({ name, docs: [] }) - 1]
    folder.docs.push(doc)
  })
  folders.forEach((folder) => {
    folder.docs.sort((a, b) => (b.hub ? 1 : 0) - (a.hub ? 1 : 0))
    folder.main = folder.docs[0].hub ? folder.docs[0].name : ''
  })
  return folders
}

const CHAIN_SECTIONS = [
  { name: 'Loaded every session', showScope: true, has: (doc) => !doc.scope.startsWith('nested:') && !doc.scope.startsWith('companion') },
  { name: 'Nested · load when touched', has: (doc) => doc.scope.startsWith('nested:') },
  { name: 'Global companions · on demand', has: (doc) => doc.scope === 'companion' },
  { name: 'Project companions · on demand', has: (doc) => doc.scope === 'companion (this project)' },
]

const chainSections = (docs) =>
  CHAIN_SECTIONS.map((section) => ({ ...section, docs: docs.filter((doc) => section.has(doc)) })).filter((section) => section.docs.length)

const listView = (c) => {
  const { Box, Text, Button, Input, goto, redraw, bindField } = c
  const gap = (key) => Text({ key: 'gap-' + key, children: ' ' })
  const desktop = isDesktop(c.e)
  const header = (key, title) =>
    desktop
      ? Box({ key: 'sec-' + key, flexDirection: 'column', marginTop: 1, children: [strip(c, { key, title })] })
      : Box({ key: 'sec-' + key, flexDirection: 'column', children: [gap(key), Text({ key, bold: true, children: title })] })
  const needle = state.filter.trim().toLowerCase()
  const topRow = (prefix) =>
    Box({
      key: prefix + 'list-top',
      flexDirection: 'row',
      flexWrap: 'wrap',
      columnGap: 2,
      children: [
        Button({
          key: prefix + 'to-menu',
          label: '< Menu',
          ...liveOnly(prefix, { hotkey: 'm' }),
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
    })
  const filterField = (prefix) =>
    Input({
      key: prefix + 'filter',
      label: 'Filter',
      placeholder: 'type to filter docs',
      value: state.filter,
      ...liveOnly(prefix, { autoFocus: true }),
      onInput: bindField('filter'),
      onSubmit: bindField('filter'),
    })
  state.stickyTop = (prefix) => Box({ key: prefix + 'list-pin', flexDirection: 'column', children: [topRow(prefix), filterField(prefix)] })
  const rows = [topRow(''), filterField('')]
  if (needle) {
    const matches = state.docs
      .filter((doc) => (doc.label + ' ' + doc.group + ' ' + (doc.scope || '')).toLowerCase().includes(needle))
      .slice(0, 40)
    rows.push(header('h-match', 'MATCHES (' + matches.length + ')'))
    matches.forEach((doc) => rows.push(docRow(c, doc, 'f' + state.docs.indexOf(doc), true)))
    if (!matches.length) rows.push(Text({ dimColor: true, children: 'No doc matches that.' }))
    return Box({ flexDirection: 'column', children: rows })
  }
  const heavy = heavyDocs()
  if (state.heavyOnly) {
    rows.push(header('h-heavy', 'DOCS OVER THE SIZE LIMIT (' + heavy.length + ')'))
    heavy.forEach((doc) => rows.push(docRow(c, doc, 'y' + state.docs.indexOf(doc), true)))
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
  const items = []
  const push = (element, height = 1) => items.push({ height, make: () => element })
  const pushHeader = (element) => items.push({ height: headerRows, make: () => element, sticky: null })
  const headerRows = desktop ? DESKTOP_STRIP_ROWS + 1 : 2
  const taskCount = state.docs.filter((doc) => doc.group === 'Task docs').length
  const foldByDefault = desktop && taskCount > LIST_FOLD_FROM
  const isOpen = (key, closedByDefault) => (key in state.collapsed ? !state.collapsed[key] : !closedByDefault)
  const recent = recentDocs()
  if (recent.length) {
    pushHeader(header('h-recent', 'CHANGED LATELY'))
    recent.forEach((doc) => push(docRow(c, doc, 'r' + state.docs.indexOf(doc), true)))
  }
  if (heavy.length) {
    push(gap('heavy'))
    push(
      Button({
        key: 'show-heavy',
        label: '⚠ ' + heavy.length + ' over the size limit · show',
        plain: true,
        onPress: () => {
          state.heavyOnly = true
          redraw()
        },
      }),
    )
  }
  GROUPS.forEach((group) => {
    const inGroup = state.docs.filter((doc) => doc.group === group)
    if (!inGroup.length) return
    const rest = group === 'Task docs' ? inGroup : inGroup.filter((doc) => !recent.includes(doc))
    if (!rest.length) return
    const title =
      group === 'Task docs'
        ? 'TASK DOCS (' + inGroup.length + ')'
        : group === 'Skills'
          ? 'SYAFIQKIT SKILLS (' + inGroup.length + ')'
          : group.toUpperCase()
    if (desktop && group === 'Skills') {
      const open = isOpen('grp:Skills', true)
      const fold = () => {
        state.collapsed['grp:Skills'] = open
        redraw()
      }
      pushHeader(Box({ key: 'sec-h-' + group, flexDirection: 'column', marginTop: 1, children: [strip(c, { key: 'h-' + group, title: (open ? '▾ ' : '▸ ') + title, onPress: fold })] }))
      if (open) rest.forEach((doc) => push(docRow(c, doc, 'd' + state.docs.indexOf(doc), false)))
      return
    }
    pushHeader(header('h-' + group, title))
    if (group !== 'Task docs' && group !== 'CLAUDE.md chain') {
      rest.forEach((doc) => push(docRow(c, doc, 'd' + state.docs.indexOf(doc), false)))
      return
    }
    const folders = group === 'Task docs' ? taskFolders(rest) : chainSections(rest)
    folders.forEach((folder) => {
      const open = isOpen('dir:' + folder.name, group === 'Task docs' && foldByDefault)
      const flagged = folder.docs.filter(isHeavy).length
      const fold = () => {
        state.collapsed['dir:' + folder.name] = open
        redraw()
      }
      if (desktop) {
        const folderHead = (prefix) =>
          Box({
            key: prefix + 'fold-' + folder.name,
            flexDirection: 'row',
            alignItems: 'center',
            columnGap: 1,
            paddingX: 1,
            children: [
              Button({ key: prefix + 'fold-' + folder.name + 'b', plain: true, label: (open ? '▾ ' : '▸ ') + folder.name, onPress: fold }),
              Text({
                key: prefix + 'fold-' + folder.name + 'c',
                dimColor: true,
                children: String(folder.docs.length) + (folder.main ? ' · main: ' + folder.main : ''),
              }),
              ...(flagged ? [chip(c, prefix + 'fold-' + folder.name + 'w', '⚠ ' + flagged, 'warn')] : []),
            ],
          })
        items.push({ height: 1, make: () => folderHead(''), sticky: open ? folderHead : null })
        if (open) folder.docs.forEach((doc) => push(docRow(c, doc, 'd' + state.docs.indexOf(doc), Boolean(folder.showScope), true)))
        return
      }
      push(
        Button({
          key: 'fold-' + folder.name,
          label:
            (open ? '▾ ' : '▸ ') +
            folder.name +
            ' (' +
            folder.docs.length +
            (folder.main ? ' · main: ' + folder.main : '') +
            ')' +
            (flagged ? '  ⚠ ' + flagged : ''),
          plain: true,
          onPress: () => {
            state.collapsed['dir:' + folder.name] = open
            redraw()
          },
        }),
      )
      if (open) folder.docs.forEach((doc) => push(docRow(c, doc, 'd' + state.docs.indexOf(doc), Boolean(folder.showScope), true)))
    })
  })
  if (!state.docs.length) push(Text({ dimColor: true, children: state.error || 'No docs found from here.' }))
  return Box({ flexDirection: 'column', children: [...rows, ...windowedRows(c, items, LIST_TOP_ROWS)] })
}

const runVerb = ($, c, verb) => {
  const { goto, openHandoff, askFirst } = c
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
  if (verb.go === 'changes') return enterChanges($)
  if (verb.go === 'images') return goto('images')
  if (verb.danger) return askFirst(verb.label, verb.text, verb.effect, true)
  return submitPrompt($, verb.text, verb.toast)
}

const menuView = ($, c) => {
  if (isDesktop(c.e)) return desktopMenuView($, c)
  const { Box, Text, Button } = c
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
            ...(index < 9 ? { hotkey: String(index + 1) } : {}),
            plain: true,
            ...(index === 0 ? { autoFocus: true } : {}),
            onPress: () => runVerb($, c, verb),
          }),
          Text({ key: 'vh' + index, dimColor: true, wrap: 'truncate-end', children: verb.hint }),
        ],
      }),
    )
  })
  rows.push(Text({ key: 'menu-note', dimColor: true, children: '⚠ shows exactly what will be sent, then asks again' }))
  rows.push(Text({ key: 'menu-version', dimColor: true, children: 'syafiqkit mod v' + MOD_VERSION }))
  return Box({ flexDirection: 'column', children: rows })
}

const confirmView = ($, c) => {
  const { Box, Text, Button, Input, redraw, goto, bindField } = c
  const confirm = state.confirm
  if (!confirm) return menuView($, c)
  const kept = state.handoffNext.trim()
  const desktop = isDesktop(c.e)
  return Box({
    flexDirection: 'column',
    ...(desktop ? { rowGap: 1 } : {}),
    children: [
      Text({ bold: true, children: 'Confirm: ' + confirm.title }),
      ...(confirm.effect && desktop
        ? [
            Box({
              key: 'confirm-effect',
              paddingX: 1,
              backgroundColor: DESKTOP_TONE.warnStrip,
              children: [Text({ color: 'warning', children: 'Effect: ' + confirm.effect })],
            }),
          ]
        : []),
      ...(confirm.effect && !desktop ? [Text({ color: 'yellow', children: 'Effect: ' + confirm.effect })] : []),
      Text({ dimColor: true, children: 'This goes to Claude, which will act on it:' }),
      Box({
        key: 'confirm-box',
        flexDirection: 'column',
        borderStyle: 'round',
        ...(desktop ? { borderColor: DESKTOP_TONE.border } : {}),
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
              onSubmit: (value) => {
                if (typeof value === 'string' && value.trim()) state.handoffNext = value
                redraw()
              },
            }),
            Text({
              key: 'handoff-message-kept',
              dimColor: true,
              children: kept ? 'Next session starts with: ' + kept : 'No message: the next session starts from the summary.',
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
            ...(desktop ? { variant: 'primary' } : {}),
            onPress: () => {
              if (confirm.record) return claimAndSend($, confirm.record, confirm.text)
              if (confirm.reopen) state.reopen = confirm.reopen
              const later = confirm.offerHandoff && state.alsoHandoff ? { next: kept, armed: false } : null
              return submitPrompt($, confirm.text, 'Sent: ' + confirm.title.toLowerCase() + (later ? '. Handoff saves when it finishes' : ''), undefined, later)
            },
          }),
          Button({
            key: 'confirm-cancel',
            label: 'Cancel',
            hotkey: 'x',
            autoFocus: true,
            ...(desktop ? { role: 'dismiss' } : {}),
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
  const desktop = isDesktop(c.e)
  const saves = Text({ key: 'handoff-saves', dimColor: true, children: (desktop ? 'Also saves: ' : 'Saves: ') + carries.join(', ') + '.' })
  return Box({
    flexDirection: 'column',
    children: [
      Text({ bold: true, children: 'Hand off this session' }),
      ...(desktop ? [Text({ key: 'handoff-next-label', children: 'First thing for the next session (optional)' })] : [saves]),
      Input({
        key: 'handoff-next',
        ...(desktop ? {} : { label: 'Next' }),
        placeholder: desktop ? 'e.g. finish the failing tests first' : 'optional: what the next session should do first',
        value: state.handoffNext,
        autoFocus: true,
        onInput: bindField('handoffNext'),
        onSubmit: (value) => {
          if (typeof value === 'string' && value.trim()) state.handoffNext = value
          return saveFromForm(state.handoffNext)
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
                ...(isDesktop(c.e) ? { variant: 'primary' } : {}),
                onPress: () => saveFromForm(state.handoffNext),
              }),
              Button({
                key: 'handoff-cancel',
                label: 'Cancel',
                hotkey: 'x',
                ...(isDesktop(c.e) ? { role: 'dismiss' } : {}),
                onPress: () => (state.handoffFromBand ? closePane($) : goto(state.current ? 'doc' : 'menu')),
              }),
            ],
          }),
      ...(desktop ? [saves] : []),
    ],
  })
}

const paneContext = ($, e) => {
  const atoms = $.ui.resolve(e)
  const redraw = () => invalidatePane($)

  const goto = (view) => {
    state.view = view
    state.allScroll = { view: '', offset: 0, body: state.allScroll.body }
    redraw()
  }

  const open = async (doc) => {
    state.docBack = null
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
  if (e.requestId === PANE && !state.isOpen) modLog($, 'pane drawn while closed (' + e.surface + ')')
  if (e.requestId !== PANE || !state.isOpen) return next(e)
  const c = paneContext($, e)
  state.desktop = isDesktop(e)
  state.stickyTop = null
  state.stickySection = null
  state.windowed = false
  const tree = withFloats($, c, await paneTree($, c))
  const size = drawingSize(tree)
  if (state.desktop && size > DESKTOP_DRAW_LIMIT) {
    modLog($, 'pane ' + state.view + ' (desktop): about ' + Math.round(size / 10000) * 10 + 'k characters, may be too big for Desktop to draw')
  }
  const problem = treeProblem(tree)
  if (!problem) return tree
  modLog($, 'pane ' + state.view + ' (' + e.surface + '): ' + problem)
  return state.desktop ? refusedView($, c, problem) : tree
}

const withFloats = ($, c, tree) => {
  const scroll = c.e.props && c.e.props.scroll
  const offset = state.windowed ? state.windowAt : scroll ? scroll.offset : 0
  state.topShown = offset > TOP_BUTTON_AFTER
  const pinned = state.desktop && offset >= STICKY_AFTER ? [state.stickyTop, state.stickySection].filter(Boolean) : []
  state.stickyShown = pinned.length > 0
  return c.Box({
    flexDirection: 'column',
    children: [
      tree,
      ...(state.stickyShown
        ? [
            c.Box({
              key: 'pane-sticky',
              position: 'absolute',
              top: offset,
              left: 0,
              right: 0,
              flexDirection: 'column',
              rowGap: 1,
              paddingBottom: 1,
              backgroundColor: DESKTOP_TONE.page,
              children: pinned.map((make) => make(STICKY_PREFIX)),
            }),
          ]
        : []),
      ...(state.topShown
        ? [
            c.Box({
              key: 'pane-top-float',
              position: 'absolute',
              top: offset + Math.max(0, ((scroll && scroll.bodyRows) || state.allScroll.body || WINDOW_ROWS) - TOP_BUTTON_ROWS),
              right: 1,
              children: [
                c.Button({
                  key: 'pane-top',
                  label: '↑ Top',
                  onPress: () => $.ui.scroll({ in: PANE, to: 'start', block: 'start' }).then(() => $.ui.invalidate('ui.render')),
                }),
              ],
            }),
          ]
        : []),
    ],
  })
}

const refusedView = ($, c, problem) =>
  c.Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [
      pageBar(c, {
        back: { key: 'draw-close', label: '< Close', hotkey: 'b', onPress: () => closePane($) },
        actions: CHANGE_VIEWS.has(state.view) && state.view !== 'changes' ? [{ key: 'draw-changes', label: 'Changes', onPress: () => c.goto('changes') }] : [],
      }),
      c.Text({ key: 'draw-refused', bold: true, children: 'This page could not be drawn here' }),
      c.Text({ key: 'draw-why', dimColor: true, children: 'Why: ' + problem + '.' }),
      c.Text({ key: 'draw-log', dimColor: true, children: 'Written to ~/.claude/doc-pane-cache/' + MOD_LOG_FILE + ' for debugging.' }),
    ],
  })

const paneTree = async ($, c) => {
  const e = c.e
  if (state.view === 'menu') return menuView($, c)
  if (state.view === 'confirm') return confirmView($, c)
  if (state.view === 'handoff') return handoffView($, c)
  if (state.view === 'images') return imagesView($, c)
  if (state.view === 'changes' && isDesktop(e)) return desktopChangesView($, c)
  if (state.view === 'change-file' && isDesktop(e)) return desktopChangeFileView($, c)
  if (state.view === 'change-all' && isDesktop(e)) return desktopChangeAllView($, c)
  if (state.view === 'changes') return changesView($, c)
  if (state.view === 'change-file') return changeFileView($, c)
  if (state.view === 'change-all') return changeAllView($, c)
  if (state.view === 'discard') return discardView($, c)
  if (state.view === 'decision' && state.current) return decisionView($, c)
  if (state.view === 'doc' && state.current) return docView($, c)
  return listView(c)
}

const isDesktop = (e) => Boolean(e) && e.surface === 'desktop'

const hoverScope = (text) => {
  let hash = 0
  for (let at = 0; at < text.length; at++) hash = (Math.imul(hash, 31) + text.charCodeAt(at)) | 0
  return 'f' + (hash >>> 0).toString(36)
}

const chip = (c, key, text, tone) =>
  c.Text({ key, backgroundColor: DESKTOP_TONE[tone + 'Chip'] || DESKTOP_TONE.mutedChip, children: ' ' + text + ' ' })

const counts = (c, key, added, removed) =>
  c.Box({
    key,
    flexDirection: 'row',
    columnGap: 1,
    flexShrink: 0,
    children: [
      ...(added ? [c.Text({ key: key + '+', color: 'success', children: '+' + added })] : []),
      ...(removed ? [c.Text({ key: key + '-', color: 'error', children: '−' + removed })] : []),
    ],
  })

const strip = (c, { key, title, count, tone, right, onPress, hot }) => {
  const { Box, Text, Button } = c
  const label = [title, count === undefined ? '' : String(count)].filter(Boolean).join('  ')
  return Box({
    key,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 1,
    paddingX: 1,
    backgroundColor: hot ? DESKTOP_TONE.stripHot : DESKTOP_TONE[(tone || '') + 'Strip'] || DESKTOP_TONE.strip,
    children: [
      onPress
        ? Button({ key: key + '-t', plain: true, onPress, children: [Text({ bold: true, children: label })] })
        : Text({ key: key + '-t', bold: true, wrap: 'truncate-end', children: label }),
      Box({ key: key + '-r', flexDirection: 'row', columnGap: 1, flexShrink: 0, children: right || [] }),
    ],
  })
}

const meter = (c, key, value, max, width = 10) => {
  const over = value > max
  const filled = Math.max(value > 0 ? 1 : 0, Math.min(width, Math.round((value / Math.max(1, max)) * width)))
  const bar = (part, cells, color) =>
    c.Box({ key: key + part, width: cells, flexShrink: 0, backgroundColor: color, children: [c.Text({ children: ' ' })] })
  return c.Box({
    key,
    width,
    flexShrink: 0,
    flexDirection: 'row',
    children: [
      ...(filled ? [bar('f', filled, over ? DESKTOP_TONE.warnMeter : DESKTOP_TONE.meter)] : []),
      ...(width - filled ? [bar('t', width - filled, DESKTOP_TONE.meterTrack)] : []),
    ],
  })
}

const textMeter = (value, max, width) => {
  const filled = value > 0 ? Math.max(1, Math.min(width, Math.round((value / Math.max(1, max)) * width))) : 0
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

const stickyTop = (make) => {
  state.stickyTop = make
  return make('')
}

const liveOnly = (prefix, props) => (prefix ? {} : props)

const pageBar = (c, opts) => stickyTop((prefix) => pageBarRow(c, opts, prefix))

const pageBarRow = (c, { back, actions, title, sub }, prefix) => {
  const { Box, Text, Button } = c
  const own = (hotkey, autoFocus) => liveOnly(prefix, { hotkey, ...(autoFocus ? { autoFocus: true } : {}) })
  return Box({
    key: prefix + 'page-bar',
    flexDirection: 'column',
    rowGap: 0,
    children: [
      Box({
        key: prefix + 'page-bar-row',
        flexDirection: 'row',
        columnGap: 1,
        flexWrap: 'wrap',
        children: [
          ...(back ? [Button({ key: prefix + back.key, label: back.label, role: 'dismiss', ...own(back.hotkey, true), onPress: back.onPress })] : []),
          ...(actions || []).filter((action) => !(prefix && action.unpinned)).map((action) =>
            Button({
              key: prefix + action.key,
              label: action.label,
              variant: action.primary ? 'primary' : 'secondary',
              ...own(action.hotkey, action.autoFocus),
              onPress: action.onPress,
            }),
          ),
        ],
      }),
      ...(title ? [Text({ key: prefix + 'page-bar-title', bold: true, wrap: 'truncate-start', children: title })] : []),
      ...(sub ? [Text({ key: prefix + 'page-bar-sub', dimColor: true, wrap: 'truncate-end', children: sub })] : []),
    ],
  })
}

const mapBlock = (c, { key, scope, added, removed, cells, onPress }) => {
  const { Box, Button } = c
  const tone = added && removed ? 'mix' : removed ? 'del' : 'add'
  return Box({
    key,
    width: cells,
    flexShrink: 0,
    backgroundColor: DESKTOP_TONE[tone + 'Block'],
    hover: { scope, backgroundColor: DESKTOP_TONE[tone + 'BlockHot'] },
    children: [Button({ key: key + '-b', plain: true, label: ' '.repeat(cells), onPress })],
  })
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
    await registerCommand($, CHANGES_COMMAND, 'Review changed files, stage, unstage or discard them')
    await registerImageTool($)
    await loadHandoff($)
    $.clock.every(HANDOFF_POLL_MS, () => loadHandoff($))
    $.clock.every(CHANGES_POLL_MS, () => countChanges($).catch(() => {}))
    countChanges($).catch(() => {})
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

  on('command.run', { command: CHANGES_COMMAND }, async ($) => {
    await openChanges($)
    return {}
  })

  on('tool.call', { tool: SHOW_IMAGE_TOOL }, async ($, e) => ({ result: await showImages($, e) }))

  on('ui.render', { component: 'AbovePrompt' }, bandView)

  on('turn.start', (_$, e, next) => {
    if (state.pendingHandoff && !e.agentId) state.pendingHandoff.armed = true
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const ran = await next(e)
    if (state.pendingHandoff && state.pendingHandoff.armed && !e.agentId) {
      const answer = typeof e.answer === 'string' ? e.answer.trim() : ''
      const asking = !e.isAborted && (!answer || answer.endsWith('?'))
      if (asking && (state.pendingHandoff.deferred || 0) < MAX_HANDOFF_DEFERRALS) {
        state.pendingHandoff.armed = false
        state.pendingHandoff.deferred = (state.pendingHandoff.deferred || 0) + 1
        $.ui.toast('Handoff saves after your reply')
        return ran
      }
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

  on('ui.close', async ($, e, next) => {
    const mine = e.id === PANE || e.requestId === PANE
    if (mine) modLog($, 'close (' + e.surface + '): ' + (e.origin && e.origin.kind) + ' asked to close')
    let closed
    try {
      closed = await next(e)
    } catch (error) {
      if (mine) modLog($, 'close (' + e.surface + '): host refused: ' + messageOf(error).slice(0, 200))
      throw error
    }
    if (mine) {
      state.isOpen = false
      resetPane()
      redrawBandAfterClose($)
    }
    return closed
  })

  on('ui.render', { component: 'Pane' }, paneView)

  on('ui.fault', ($, e, next) => {
    modLog($, 'fault ' + e.component + ' ' + e.phase + ' (' + e.surface + '): ' + String(e.reason).slice(0, 300))
    return next(e)
  })

  on('ui.scroll', { component: 'Pane' }, ($, e, next) => {
    if (e.requestId !== PANE || !state.isOpen) return next(e)
    state.allScroll = { view: state.view, offset: e.offset, body: e.bodyRows }
    const ran = next(e)
    if (state.topShown || state.stickyShown || e.offset > TOP_BUTTON_AFTER || (state.desktop && e.offset >= STICKY_AFTER) || Math.abs(e.offset - state.windowAt) > e.bodyRows / 3) $.ui.invalidate('ui.render')
    return ran
  })
}
