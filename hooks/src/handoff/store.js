import { hostClockNow, hostFsRead, hostFsWrite, hostSessionId, hostSessionMessages, hostUiInvalidate, hostUiToast } from '../core/api.js'
import { HANDOFF_EXPIRES_MS } from '../core/constants.js'
import { agoOf, lockDown } from '../core/format.js'
import { state } from '../core/state.js'
import { safeExists, safeList } from '../docs/discovery.js'
import { hashOf } from '../docs/images.js'
import { submitPrompt } from '../docs/reader.js'
import { branchOf, ensurePaths, gitState, handoffDir, sessionGoalOf, summariseSession, taskDocsIn, touchedFiles } from './capture.js'

export async function saveHandoff($, next) {
  await ensurePaths($)
  let messages = []
  try {
    messages = await hostSessionMessages($)
  } catch {
    messages = []
  }
  const [git, branch, summary, sessionId] = await Promise.all([
    gitState($),
    branchOf($),
    summariseSession($, messages, next),
    hostSessionId($).catch(() => ''),
  ])
  const docs = taskDocsIn(messages)
  if (!docs.length && state.lastDoc && state.lastDoc.group === 'Task docs') docs.push(state.lastDoc.path)
  const createdAt = await hostClockNow($)
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
  await hostFsWrite($, dir + '/' + id + '.json', JSON.stringify(record, null, 2))
  await lockDown($, dir, '700')
  await lockDown($, dir + '/' + id + '.json', '600')
  if (state.ownHandoff) await writeMark($, state.ownHandoff, 'superseded')
  state.ownHandoff = id
  return record
}

export function markFile(id) {
  return handoffDir() + '/' + id + '.state'
}

export function idOfFile(name) {
  return name.replace(/\.json$/, '')
}

export function writeMark($, id, value) {
  return hostFsWrite($, markFile(id), value)
}

export async function readMark($, id) {
  try {
    return String(await hostFsRead($, markFile(id))).trim()
  } catch {
    return ''
  }
}

export async function isTaken($, id) {
  const mark = await readMark($, id)
  return mark !== '' && mark !== 'open'
}

export function texts(value) {
  return (Array.isArray(value) ? value.filter((item) => typeof item === 'string') : [])
}

export function cleanRecord(raw, name) {
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

export async function loadHandoff($) {
  try {
    await ensurePaths($)
    const now = await hostClockNow($)
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
      hostUiInvalidate($, 'ui.render')
    }
    for (const entry of candidates) {
      if (state.handoff && state.handoff.name === entry.name) return
      try {
        const record = cleanRecord(JSON.parse(await hostFsRead($, handoffDir() + '/' + entry.name)), entry.name)
        record.file = handoffDir() + '/' + entry.name
        record.docExists = await safeExists($, record.taskDocPath)
        state.handoff = record
        hostUiInvalidate($, 'ui.render')
        return
      } catch {
        continue
      }
    }
    if (state.handoff) {
      state.handoff = null
      hostUiInvalidate($, 'ui.render')
    }
  } catch {
    state.handoff = null
  }
}

export function resumeText(record, now) {
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

export function goalOf(record) {
  const hit = (record.summary || '').match(/Goal[:*\s]*([^\n]+)/i)
  return hit ? hit[1].replace(/[*_`]/g, '').trim() : ''
}

export async function claimHandoff($, record) {
  const id = idOfFile(record.name)
  if (await isTaken($, id)) return false
  const mine = 'claimed:' + hashOf(String(await hostClockNow($)) + Math.random())
  await writeMark($, id, mine)
  return (await readMark($, id)) === mine
}

export async function restoreHandoff($, record) {
  await writeMark($, idOfFile(record.name), 'open')
  state.dismissed = ''
  await loadHandoff($)
}

export async function claimAndSend($, record, text) {
  const claimed = await claimHandoff($, record)
  state.handoff = null
  if (!claimed) {
    hostUiToast($, 'Another session already took this handoff')
    hostUiInvalidate($, 'ui.render')
    return
  }
  const message = text || resumeText(record, await gitState($))
  await submitPrompt($, message, 'Resuming the handoff', () => restoreHandoff($, record))
}

export async function dismissHandoff($, record) {
  state.dismissed = record.id
  state.handoff = null
  await writeMark($, idOfFile(record.name), 'dismissed')
  hostUiInvalidate($, 'ui.render')
}
