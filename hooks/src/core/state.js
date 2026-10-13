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
