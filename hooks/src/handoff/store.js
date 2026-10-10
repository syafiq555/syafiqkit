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
