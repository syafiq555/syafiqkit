export const PANE = 'doc-pane'
export const COMMAND = 'task-docs'
export const MENU_COMMAND = 'sk'
export const CHANGES_COMMAND = 'changes'
export const MAX_ENTRIES = 60
export const MAX_CHARS = 90000
export const POLL_MS = 2000
export const GIT_TIMEOUT_MS = 15000
export const HANDOFF_POLL_MS = 4000
export const MAX_HANDOFF_DEFERRALS = 3
export const HANDOFF_EXPIRES_MS = 24 * 60 * 60 * 1000
export const RECENT_COUNT = 5
export const ITEM_CAP_ROWS = 3
export const NAME_WIDTH = 26
export const SCOPE_WIDTH = 24
export const NARROW_COLUMNS = 60
export const MEASURE_FROM_BYTES = 8000
export const TASK_DOC_MAX_LINES = 300
export const DECISION_MAX_BYTES = 40 * 1024
export const CLAUDE_MD_MAX_LINES = 200
export const CLAUDE_MD_MAX_BYTES = 40000
export const NESTED_SCAN_DEPTH = 4
export const NESTED_SCAN_FOLDERS = 400
export const NESTED_SCAN_SKIP = ['node_modules', 'vendor', 'dist', 'build', 'storage', 'tasks']
export const DIFF_CONTEXT = 3
export const DIFF_MAX_LINES = 400
export const DESKTOP_STRIP_ROWS = 2
export const DESKTOP_PAGE_BAR_ROWS = 4
export const WINDOW_ROWS = 60
export const TOP_BUTTON_AFTER = 3
export const CLOSE_REDRAW_MS = 400
export const TOP_BUTTON_ROWS = 3
export const STICKY_AFTER = 1
export const STICKY_COVER_ROWS = 3
export const STICKY_PREFIX = 'stk-'
export const LIST_FOLD_FROM = 40
export const LIST_TOP_ROWS = 3
export const DESKTOP_WRAP_CHARS = 140
export const DESKTOP_MAP_ROWS = 3
export const CHANGES_POLL_MS = 5000
export const SHOW_IMAGE_TOOL = 'mcp__syafiqkit__show_image'
export const MAX_GALLERY = 12
export const MAX_GALLERY_BYTES = 12 * 1024 * 1024
export const MAX_GALLERY_BASE64 = 16 * 1024 * 1024
export const PNG_PREFIX = 'iVBORw0KGgo'
export const SPLIT_MIN_COLUMNS = 100
export const TREE_COLUMNS = 42
export const COUNTS_WIDTH = 11
export const DESKTOP_DIFF = { added: '#1b3a2a', removed: '#40232a', addedWord: '#2e6b49', removedWord: '#7c3340' }
export const SYNTAX_MAX_CHARS = 400
export const SYNTAX_TONE = {
  keyword: '#c678dd',
  string: '#e5a56b',
  number: '#d19a66',
  call: '#61afef',
  type: '#e5c07b',
  comment: '#7f848e',
}
export const DESKTOP_TONE = {
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
export const DESKTOP_MAP_CELLS = 64
export const LITERAL_PATHS = { GIT_LITERAL_PATHSPECS: '1' }
export const REPO_COUNT_EVERY = 5
export const DIFF_BATCH = 8
export const MAX_UNTRACKED_BYTES = 256 * 1024
export const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit'])
export const ITEM = /^\s*[-*]\s+\[( |x|X)\]\s+(.+)$/
export const FENCE = /^\s*```(\S*)\s*$/
export const HEADING = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/
export const RISKY = /\b(ship|push|merge|delete|deploy|drop|reset)\b/i
export const MERMAID_PACKAGE = '@mermaid-js/mermaid-cli@12.0.0'
export const MERMAID_TIMEOUT_MS = 240000
export const MAX_IMAGE_ROWS = 60
export const MAX_BASE64 = Math.floor((2 * 1024 * 1024 * 4) / 3)
export const TYPST_CANDIDATES = ['typst', '/opt/homebrew/bin/typst', '/usr/local/bin/typst']
export const TYPESET_CHUNK_LINES = 40
export const TYPESET_PT_PER_COLUMN = 7
export const TYPESET_TIMEOUT_MS = 30000
export const DESKTOP_DRAW_CHARS = 90000
export const DESKTOP_DRAW_LIMIT = 95000
export const MAX_HOVER_SCOPE = 64
export const SPACER_MAX_ROWS = 10000
export const MOD_LOG_FILE = 'mod.log'
export const MOD_LOG_LINES = 300
export const PREVIEW_STEPS = [[1080, 60], [900, 50], [720, 45], [600, 40]]
export const PREVIEW_TIMEOUT_MS = 20000
export const PICTURE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'tiff', 'heic'])
export const MEDIA_PAIR_CHARS = 30000
export const MEDIA_PAIR_WIDTH = 360
export const MEDIA_ROW_PX = 20
export const SLICE_WIDTH = 1000
export const SLICE_HEIGHT = 520
export const SLICE_CHARS = 85000
export const SLICE_QUALITIES = [60, 45, 35]
export const PDF_PAGE_SIDE = 1100
export const DESKTOP_PICTURE_WIDTH = 720
export const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
export const GROUPS = ['Task docs', 'CLAUDE.md chain', 'Rules', 'Project docs', 'Skills']

export const VERBS = [
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
export const ANSWER_IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i
export const ANSWER_VIDEO_EXT = /\.(mp4|mov|webm|mkv|m4v)$/i
export const ANSWER_MATH_COLUMNS = 80
export const PICTURE_TIMEOUT_MS = 30000
export const ANSWER_FILE_CAP = 4
export const ANSWER_PICTURES_PROMPT =
  'Pictures in answers (syafiqkit): in this terminal, a ```mermaid block, a $$ ... $$ display equation, a Markdown image of a local file (![alt](/full/path.png)) and the full path of a local video file are each drawn as a picture after your answer text. Use them when a picture explains more than prose: flows and architecture as mermaid, formulas as $$ blocks, full paths for screenshots or recordings you made. Pictures come after all of the text, not inline, so refer to them as "below". Inline $x$ stays plain text.'
export const TYPESET_RENDER_VERSION = '2'
export const ANSWER_MISSING_RETRY_MS = 10000
export const TYPESET_WIDTH_STEP = 4
