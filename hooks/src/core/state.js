import { atom, update } from 'claude-code'
import { hostClockSleep, hostFsRead, hostPluginRoot, hostUiInvalidate, hostUiOpen } from './api.js'
import { CLOSE_REDRAW_MS, PANE } from './constants.js'
import { messageOf } from './format.js'
import { modLog } from './log.js'

export const state = {
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
  disabled: false,
  reopen: null,
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
  noTopFloat: false,
  docParse: null,
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
  enhance: { phase: 'idle', original: '', filled: '', docs: [], pending: '', abort: null, stage: '' },
  version: '',
  typst: null,
  look: null,
  typeset: {},
  textView: false,
  answerPics: {},
  answerPicturesOff: false,
  wrapup: {
    asked: [],
    active: [],
    running: [],
    agents: [],
    startedAt: 0,
    branch: '',
    pushedAt: 0,
    shipAt: 0,
    background: false,
    commitIntents: 0,
    commitIntentUntil: 0,
    turnOpen: false,
    resyncCount: false,
    doneAt: 0,
    doneEditAt: 0,
    editAt: 0,
    commitAt: 0,
    startHead: null,
    head: null,
    upstream: false,
    ahead: 0,
    lastCount: 0,
  },
}

export async function loadVersion($) {
  try {
    const manifest = JSON.parse(await hostFsRead($, hostPluginRoot($) + '/.claude-plugin/plugin.json'))
    state.version = String(manifest.version || '')
  } catch (error) {
    modLog($, 'version read failed: ' + messageOf(error).slice(0, 200))
  }
}

export function invalidatePane($) {
  if (state.isOpen) hostUiInvalidate($, 'ui.render')
}

export async function openPaneWindow($, label) {
  try {
    const opened = await hostUiOpen($, { id: PANE, title: 'syafiqkit', focus: true, closeOnEscape: true, columns: 110 })
    if (!opened || !opened.isPlaced) modLog($, 'open ' + label + ': not placed')
  } catch (error) {
    modLog($, 'open ' + label + ' failed: ' + messageOf(error).slice(0, 200))
    state.isOpen = false
    hostUiInvalidate($, 'ui.render')
    throw error
  }
}

export async function redrawBandAfterClose($) {
  try {
    await hostClockSleep($, CLOSE_REDRAW_MS)
    if (!state.isOpen) hostUiInvalidate($, 'ui.render')
  } catch (error) {
    modLog($, 'close redraw failed: ' + messageOf(error).slice(0, 200))
  }
}

const picturesTick = atom({ plugin: 'syafiqkit', key: 'picturesTick' }, 0)

export function bumpPictures($) {
  update($, picturesTick, (tick) => (tick ?? 0) + 1).catch(() => {})
}
