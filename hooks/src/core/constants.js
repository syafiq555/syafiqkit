const MOD_VERSION = '__MOD_VERSION__'
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
const NAME_WIDTH = 26
const SCOPE_WIDTH = 24
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
