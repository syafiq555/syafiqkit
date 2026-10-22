import { hostSessionCwd, hostUiInvalidate } from '../core/api.js'
import { VERBS } from '../core/constants.js'
import { modLog } from '../core/log.js'
import { gitRun } from '../core/run.js'
import { state } from '../core/state.js'
import { readLook } from '../docs/typeset.js'

const DONE_COMMAND = /^\s*\/(syafiqkit:)?(quick-)?done\b/
const COMMIT_COMMAND = /^\/(syafiqkit:)?commit\b/
const PUSH_COMMAND = /^\/(syafiqkit:)?(commit\s+push|ship)\b/
const AGENT_HOLD_MS = 30 * 60 * 1000
const GIT_PUSH = /(^|[;&|(]\s*)git\s+(-C\s+\S+\s+)?push\b/
const verbText = (label) => (VERBS.find((verb) => verb.label === label) || {}).text
const DONE_TEXT = verbText('Done')
const COMMIT_TEXTS = [verbText('Commit'), verbText('Commit and push'), verbText('Ship')]
const PUSH_TEXTS = [verbText('Push'), verbText('Commit and push'), verbText('Ship')]

function stepsAsked(text) {
  const typed = String(text || '').trim()
  const steps = []
  if (DONE_COMMAND.test(typed) || typed === DONE_TEXT) steps.push('done')
  if (COMMIT_COMMAND.test(typed) || COMMIT_TEXTS.includes(typed)) steps.push('commit')
  if (PUSH_COMMAND.test(typed) || PUSH_TEXTS.includes(typed)) steps.push('push')
  return steps
}

function stepsFromTool(e) {
  if (e.tool === 'Skill') {
    const name = String(e.skill || '').replace(/^syafiqkit:/, '')
    if (name === 'done' || name === 'quick-done') return ['done']
    if (name === 'commit') return /\bpush\b/.test(String(e.args || '')) ? ['commit', 'push'] : ['commit']
    if (name === 'ship') return ['commit', 'push']
    return []
  }
  if (e.tool === 'Bash' && GIT_PUSH.test(String(e.command || ''))) return ['push']
  return []
}

export function wrapupStates() {
  const w = state.wrapup
  const done = !w.doneAt ? 'pending' : w.doneEditAt > w.doneAt ? 'stale' : 'complete'
  const committed = Boolean(w.commitAt)
  const commit = !committed ? 'pending' : w.editAt > w.commitAt ? 'stale' : 'complete'
  const pushed = w.upstream && w.ahead === 0 && (committed || w.pushedAt > 0)
  const push = !pushed ? 'pending' : w.editAt > Math.max(w.commitAt, w.pushedAt) ? 'stale' : 'complete'
  const running = (step, phase) => (w.running.includes(step) ? 'running' : phase)
  return { done: running('done', done), commit: running('commit', commit), push: running('push', push) }
}

function signature() {
  return Object.values(wrapupStates()).join()
}

function redrawIfMoved($, before) {
  if (signature() !== before) hostUiInvalidate($, 'ui.render')
}

function union(a, b) {
  return [...new Set([...a, ...b])]
}

export function resetWrapup() {
  const w = state.wrapup
  w.asked = []
  w.active = []
  w.running = []
  w.agents = []
  w.doneAt = 0
  w.doneEditAt = 0
  w.editAt = 0
  w.commitAt = 0
  w.pushedAt = 0
  w.startedAt = Date.now()
  w.startHead = w.head
}

export function noteSubmit($, text) {
  const steps = stepsAsked(text)
  if (!steps.length) return
  const before = signature()
  state.wrapup.asked = union(state.wrapup.asked, steps)
  state.wrapup.running = union(state.wrapup.running, steps)
  redrawIfMoved($, before)
}

export function noteSubmitFailed($, text) {
  const steps = stepsAsked(text)
  if (!steps.length) return
  const before = signature()
  const w = state.wrapup
  w.asked = w.asked.filter((step) => !steps.includes(step))
  w.running = w.running.filter((step) => w.active.includes(step))
  redrawIfMoved($, before)
}

export function noteTurnStart(e) {
  const w = state.wrapup
  if (e.agentId) {
    w.agents = [...w.agents.filter((agent) => agent.id !== e.agentId), { id: e.agentId, at: Date.now() }]
    return
  }
  w.active = union(w.active, w.asked)
  w.asked = []
}

export function noteTurnComplete($, e) {
  const w = state.wrapup
  const before = signature()
  if (e.agentId) {
    w.agents = w.agents.filter((agent) => agent.id !== e.agentId)
    return
  }
  const answer = typeof e.answer === 'string' ? e.answer.trim() : ''
  const now = Date.now()
  w.agents = e.isAborted ? [] : w.agents.filter((agent) => now - agent.at < AGENT_HOLD_MS)
  const unfinished = !e.isAborted && (w.agents.length > 0 || !answer || answer.endsWith('?'))
  if (unfinished && w.active.length) {
    modLog($, 'wrap-up still running: ' + w.active.join(', ') + ' (' + w.agents.length + ' agents open)')
    return
  }
  if (w.active.includes('done') && !e.isAborted) w.doneAt = now
  if (w.active.includes('push') && !e.isAborted) w.pushedAt = now
  w.resyncCount = w.active.length > 0
  w.active = []
  w.running = w.asked
  redrawIfMoved($, before)
}

export function noteToolCall($, e) {
  if (e.agentId) return
  const steps = stepsFromTool(e)
  if (!steps.length) return
  const w = state.wrapup
  const before = signature()
  modLog($, 'wrap-up running: ' + steps.join(', ') + ' (from ' + e.tool + ')')
  w.active = union(w.active, steps)
  w.running = union(w.running, steps)
  redrawIfMoved($, before)
}

export function noteEdit($) {
  const before = signature()
  markEdited()
  redrawIfMoved($, before)
}

function markEdited() {
  const w = state.wrapup
  const now = Date.now()
  w.editAt = now
  if (!w.active.includes('done')) w.doneEditAt = now
}

async function gitOut($, args) {
  const ran = await gitRun($, ['git', ...args], { cwd: state.cwd })
  return ran.exitCode === 0 ? ran.stdout.trim() : null
}

export async function pollWrapup($) {
  if (state.disabled) return
  if (!state.look) await readLook($)
  if (!state.cwd) state.cwd = await hostSessionCwd($)
  const w = state.wrapup
  const before = signature()
  const sha = (await gitOut($, ['rev-parse', '--verify', '-q', 'HEAD'])) || ''
  const branch = (await gitOut($, ['rev-parse', '--abbrev-ref', 'HEAD'])) || ''
  const aheadText = await gitOut($, ['rev-list', '--count', '@{u}..HEAD'])
  const ahead = aheadText === null ? 0 : Number(aheadText) || 0
  const first = w.startHead === null
  if (first || branch !== w.branch) {
    if (first) w.startedAt = Date.now()
    w.startHead = sha
    w.commitAt = 0
  } else if (sha !== w.head) {
    if (sha === w.startHead) w.commitAt = 0
    else if (await isCommit($, w.head, sha, ahead, aheadText !== null)) w.commitAt = Date.now()
  }
  w.head = sha
  w.branch = branch
  w.upstream = aheadText !== null
  w.ahead = ahead
  if (!first && !w.resyncCount && state.changeCount > w.lastCount) markEdited()
  w.resyncCount = false
  w.lastCount = state.changeCount
  redrawIfMoved($, before)
}

async function isCommit($, from, to, ahead, hasUpstream) {
  if (!from || !to) return false
  if ((await gitOut($, ['merge-base', '--is-ancestor', from, to])) === null) return false
  if (!hasUpstream || ahead > state.wrapup.ahead) return true
  const committed = Number(await gitOut($, ['log', '-1', '--format=%ct', to])) * 1000
  return committed >= state.wrapup.startedAt
}
