export const PANE = 'doc-pane'
export const COMMAND = 'task-docs'
export const CHANGES_COMMAND = 'changes'
export const MAX_ENTRIES = 60
export const MAX_CHARS = 90000
export const POLL_MS = 2000
export const GIT_TIMEOUT_MS = 15000
export const RECENT_COUNT = 5
export const RECENT_AGE_DAYS = 7
export const NEAR_LIMIT_SHARE = 0.8
export const ITEM_CAP_ROWS = 3
export const NAME_WIDTH = 26
export const SCOPE_WIDTH = 24
export const NARROW_COLUMNS = 60
export const MEASURE_FROM_BYTES = 8000
export const TASK_DOC_MAX_LINES = 300
export const DECISION_MAX_BYTES = 40 * 1024
export const OUTLINE_STALE_SLACK_MS = 10 * 60 * 1000
export const CLAUDE_MD_MAX_LINES = 200
export const CLAUDE_MD_MAX_BYTES = 40000
export const NESTED_SCAN_DEPTH = 4
export const NESTED_SCAN_FOLDERS = 400
export const NESTED_SCAN_SKIP = ['node_modules', 'vendor', 'dist', 'build', 'storage', 'tasks', '.git', '.next', '.venv']
export const META_READ_LIMIT = 4
export const META_REDRAW_EVERY = 10
export const META_RACY_SLACK_MS = 2000
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
export const DIFF_PALETTE = {
  dark: { added: '#1b3a2a', removed: '#40232a', addedWord: '#215932', removedWord: '#773133', header: '#1f2633' },
  light: { added: '#d0ffd0', removed: '#ffe0e0', addedWord: '#a0efa0', removedWord: '#ffc0c0', header: '#e6eaf0' },
}
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
export const PIPE_TONE = {
  dark: {
    pending: { bg: '#2c2f36', fg: '#9aa0a6' },
    complete: { bg: '#1e4a2e', fg: '#7ee2a0' },
    stale: { bg: '#4a3a12', fg: '#f0c060' },
    running: { bg: '#1f2f45', fg: '#7fb4f0' },
  },
  light: {
    pending: { bg: '#ebedf0', fg: '#57606a' },
    complete: { bg: '#d6f5df', fg: '#1a7f37' },
    stale: { bg: '#fdeec8', fg: '#9a6700' },
    running: { bg: '#ddeafb', fg: '#0969da' },
  },
}
export const PIPE_MARK = { pending: '○', complete: '✓', stale: '↻', running: '◌' }
export const DESKTOP_MAP_CELLS = 64
export const LITERAL_PATHS = { GIT_LITERAL_PATHSPECS: '1' }
export const REPO_COUNT_EVERY = 5
export const DIFF_BATCH = 8
export const MAX_UNTRACKED_BYTES = 256 * 1024
export const EDIT_TOOLS = new Set(['Edit', 'Write', 'MultiEdit'])
export const WRAPUP_EDIT_TOOLS = new Set([...EDIT_TOOLS, 'NotebookEdit'])
export const ITEM = /^\s*[-*]\s+\[( |x|X)\]\s+(.+)$/
export const FENCE = /^\s*```(\S*)\s*$/
export const HEADING = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/
export const MERMAID_PACKAGE = '@mermaid-js/mermaid-cli@12.0.0'
export const MERMAID_TIMEOUT_MS = 240000
export const MAX_IMAGE_ROWS = 60
export const MAX_IMAGE_SIDE = 4096
export const MAX_TREE_IMAGE_SOURCE = 2 * 1024 * 1024
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
  { label: 'Commit', text: 'Use the commit skill to commit the staged changes.', toast: 'Sent: commit' },
  {
    label: 'Commit and push',
    text: 'Use the commit skill to commit the staged changes, and push.',
    effect: 'Commits what is staged, then pushes the branch to its remote.',
    toast: 'Sent: commit and push',
  },
  {
    label: 'Done',
    text: 'Use the done skill to wrap up this session. Invoke it now even if it ran earlier: this run covers everything since the last one. If the Skill tool answers that it is already loaded, open the done skill\'s SKILL.md with Read and run every step from it, not from memory.',
    toast: 'Sent: done',
  },
  {
    label: 'Ship',
    text: 'Use the ship skill. If the Skill tool answers that it is already loaded, open the ship skill\'s SKILL.md with Read and run every step from it, not from memory.',
    effect: 'Commits, writes the changelog, pushes, checks CI and writes the release note.',
    toast: 'Sent: ship',
  },
  {
    label: 'Push',
    text: 'Push this branch to its remote, setting its upstream if it has none.',
    effect: "Pushes the current branch's commits to its remote; nothing is committed.",
    toast: 'Sent: push',
  },
]
export const ANSWER_IMAGE_EXT = /\.(png|jpe?g|gif|webp)$/i
export const ANSWER_VIDEO_EXT = /\.(mp4|mov|webm|mkv|m4v)$/i
export const ANSWER_MATH_COLUMNS = 80
export const PICTURE_TIMEOUT_MS = 30000
export const ANSWER_FILE_CAP = 4
export const ANSWER_PICTURES_PROMPT =
  'Pictures in answers (syafiqkit): in this terminal, a ```mermaid block, a $$ ... $$ display equation, a Markdown image of a local file (![alt](/full/path.png)) and the full path of a local video file are each drawn as a picture after your answer text. Use them when a picture explains more than prose. An answer has a diagram\'s shape when the reader would otherwise hold its structure in their head: steps that branch (approve or reject), a status that moves through stages, things moving between systems (which sales reach which place), work handed between roles, or how parts connect. Draw that as mermaid below a text answer that still says it all; keep one fact, figures, rules and short lists as text or a table. Formulas as $$ blocks, full paths for screenshots or recordings you made. Pictures come after all of the text, not inline, so refer to them as "below". Inline $x$ stays plain text. Up to four images you read with the Read tool are drawn for the user under that Read row, so there is no need to call show_image or repeat them as ![alt](path) just to show them; if the user says they cannot see one, use show_image.'
export const TYPESET_RENDER_VERSION = '2'
export const ANSWER_MISSING_RETRY_MS = 10000
export const TYPESET_WIDTH_STEP = 4
