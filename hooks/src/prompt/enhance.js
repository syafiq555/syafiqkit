const ENHANCE_MIN_CHARS = 8
const ENHANCE_TIMEOUT_MS = 30000
const ENHANCE_CATALOGUE_CHARS = 40000
const ENHANCE_SKILLS_CHARS = 9000
const ENHANCE_MAX_DOCS = 3
const ENHANCE_MAX_SKILLS = 3
const ENHANCE_MAX_OPEN = 3
const ENHANCE_MAX_FACTS = 6
const ENHANCE_DOC_CHARS = 40000
const ENHANCE_READ_CHARS = 100000
const ENHANCE_HEADLESS_TIMEOUT_MS = 180000
const ENHANCE_STOP_POLL_MS = 300

const ENHANCE_DIGEST = [
  'You read a repository\'s task docs (each current.md with its decisions files) for a coding agent about to work on the ask below, so it starts informed without reading them itself.',
  'Return the 3 to 6 facts that bear on THIS ask, most specific first: earlier fixes, attempts or open findings about the same symptom or feature (with their version or date), decisions that constrain the fix, gotchas that will bite, and where the relevant code lives.',
  'Leave out general facts about the subsystem that would be true for any task in it (what the UI shows, how to build or test, which surfaces it runs on), unless the ask is about exactly that.',
  'Only facts the docs state; never infer, advise or plan. Keep file paths, function names, commands, versions and numbers exactly as written. One line each, 30 words at most.',
  'Fewer is fine. Never copy a password, token or key.',
  'Reply with JSON only, no fence: {"facts": ["...", "..."]}',
].join('\n')

const ENHANCE_SYSTEM = [
  'You turn a developer\'s rough draft into a clear prompt for a coding agent in their repository. You do not do the work and you do not answer the draft.',
  'The draft is short, lowercase and typo\'d English, sometimes Malay; read through that.',
  'Their past sessions show what goes wrong, so fill exactly these gaps when the draft leaves them open:',
  '- The skill that owns the ask was not used. Name the 0 to 3 skills whose purpose matches: research or a UI question goes to uiux, a brief for someone else to design to design-handoff, a message to a named person to casual-message, a post for Google Chat to gchat-format, docs work to task-summary, research or bulk reading on cheap agents to haiku, wrap-up to done. Only skills that really exist. Do not list read-summary; picking a doc covers it.',
  '- Scope was vague ("all", "this", "the doc"). Say what it covers in the draft\'s own terms, e.g. the whole doc set rather than one file, this form only. Out of scope only when the draft says so.',
  '- No source to check against. Name it only when the draft points at something outside the task docs: a file or PDF they gave, a transcript, a quotation, the live system, a vendor\'s docs, another app of theirs. Never the draft itself or the picked doc.',
  '- No proof. Say what shows it is done when the kind of work implies it: a screenshot of the changed screen, an e2e run, the failing case passing, the message text.',
  'One skill per job: a message is either casual-message (to a person) or gchat-format (a post), never both. Skip a skill whose fit you have to argue for.',
  'When the draft asks for something to take elsewhere (a prompt for another tool, a message, a PDF, a reply), the goal is to produce that thing, not to do the work it describes.',
  'Each of scope, outOfScope, checkAgainst and doneWhen is one short clause, 15 words at most. Do not restate the goal in them.',
  'Never add features, requirements, technologies, numbers, layout or design decisions, plans, phases or waves the draft did not ask for. When the draft asks someone else to design, do not design.',
  'Open points: at most 3, only choices the developer must make that the agent cannot find in the repo, the docs or the session (never what a feature does or where code lives). Write each as a short bracketed choice, e.g. "[Terminal, Desktop, or both?]". Most drafts need none; they dislike being asked what judgement can settle.',
  'goal: the ask in one or two plain sentences, keeping their meaning and words, typos fixed, in the draft\'s language. Never copy a password, token or API key from the draft; write "<secret>" instead.',
  'Reply with JSON only, no fence: {"goal": "", "docs": ["<task doc path as written>"], "skills": [{"name": "<skill name as written>", "why": "<5 to 10 words>"}], "scope": "", "outOfScope": "", "checkAgainst": "", "doneWhen": "", "open": []}. Leave a field empty rather than guess.',
].join('\n')

const ENHANCE_SPINNER = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
const ENHANCE_TICK_MS = 160

let enhanceTick = 0
let stopEnhanceTicker = null

const spinnerFrame = () => ENHANCE_SPINNER[enhanceTick % ENHANCE_SPINNER.length]

const elapsedOf = (startedAt) => (startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) + 's' : '')

const clearEnhanceTicker = () => {
  const timer = stopEnhanceTicker
  stopEnhanceTicker = null
  if (typeof timer === 'function') timer()
  else if (timer && typeof timer.cancel === 'function') timer.cancel()
}

const startEnhanceTicker = ($) => {
  clearEnhanceTicker()
  enhanceTick = 0
  stopEnhanceTicker = $.clock.every(ENHANCE_TICK_MS, () => {
    if (state.enhance.phase !== 'running') {
      clearEnhanceTicker()
      return
    }
    enhanceTick += 1
    if (!state.isOpen) $.ui.invalidate('ui.render')
  })
}

const enhanceState = () => state.enhance

const setEnhance = (fields) => {
  state.enhance = { phase: 'idle', original: '', filled: '', docs: [], pending: '', abort: null, stage: '', ...fields }
}

const resetEnhance = () => setEnhance({})

const failEnhance = ($, message) => {
  resetEnhance()
  $.ui.toast(message)
}

const redrawBand = ($) => {
  $.ui.invalidate('ui.render')
}

const docTitleOf = (text) => {
  const hit = text.match(/^#\s+(.+)$/m)
  return hit ? hit[1].trim() : ''
}

const docAboutOf = (text) => {
  const where = text.match(/\*\*Where we are\*\*\s*:?\s*(.+)/i)
  if (where) return where[1].replace(/[*`]/g, '').trim()
  const overview = text.match(/^##\s+Overview\s*\n+([^\n#].+)/im)
  return overview ? overview[1].replace(/[*`]/g, '').trim() : ''
}

const draftWordsOf = (draft) => [...new Set((draft.toLowerCase().match(/[a-z0-9][a-z0-9_-]{3,}/g) || []))]

const matchScore = (line, words) => {
  const lower = line.toLowerCase()
  return words.reduce((score, word) => score + (lower.includes(word) ? 1 : 0), 0)
}

const buildCatalogue = async ($, cwd, draft) => {
  const docs = await findTaskDocs($, cwd)
  const words = draftWordsOf(draft)
  const entries = (
    await Promise.all(
      docs.map(async (doc) => {
        let text = ''
        try {
          text = await $.fs.read(doc.path)
        } catch {
          return null
        }
        const status = statusLineOf(text).replace(/^\W*Status\b[:\s*]*/i, '')
        const about = docAboutOf(text)
        const line =
          relativeTo(cwd, doc.path) +
          ' | ' +
          clip(docTitleOf(text) || doc.label, 70) +
          (status ? ' | ' + clip(status, 60) : '') +
          (about ? ' | ' + clip(about, 140) : '')
        return { line, score: matchScore(line, words), mtime: doc.mtime || 0 }
      }),
    )
  ).filter(Boolean)
  entries.sort((a, b) => b.score - a.score || b.mtime - a.mtime)
  const lines = []
  let size = 0
  for (const { line } of entries) {
    if (size + line.length > ENHANCE_CATALOGUE_CHARS) break
    lines.push(line)
    size += line.length + 1
  }
  return { lines, total: entries.length }
}

const matchKnownDoc = (path, known, cwd) => {
  const bare = path.trim().replace(cwd + '/', '').replace(/^\.\//, '').replace(/^\/+/, '')
  if (known.has(bare)) return bare
  const asFolder = 'tasks/' + bare.replace(/^tasks\//, '').replace(/\/(current\.md)?$/, '') + '/current.md'
  if (known.has(asFolder)) return asFolder
  return [...known].find((candidate) => bare.length > 8 && candidate.endsWith('/' + bare)) || ''
}

const skillDescriptionOf = (text) => {
  const front = text.match(/^---\n([\s\S]*?)\n---/)
  if (!front) return ''
  const lines = front[1].split('\n')
  const at = lines.findIndex((line) => /^description:/.test(line))
  if (at < 0) return ''
  const inline = lines[at].replace(/^description:\s*/, '').trim()
  if (inline && !/^[>|][-+]?$/.test(inline)) return inline.replace(/^["']|["']$/g, '')
  const folded = []
  for (const line of lines.slice(at + 1)) {
    if (!/^\s+\S/.test(line)) break
    folded.push(line.trim())
  }
  return folded.join(' ')
}

const buildSkillList = async ($, cwd) => {
  const own = (await findSkills($)).map((skill) => ({ command: '/syafiqkit:' + skill.name, name: skill.name, path: skill.path }))
  const local = (await safeList($, cwd + '/.claude/skills'))
    .filter((entry) => isDirectory(entry))
    .map((entry) => ({ command: '/' + entry.name, name: entry.name, path: cwd + '/.claude/skills/' + entry.name + '/SKILL.md' }))
  const lines = []
  const skills = []
  let size = 0
  for (const skill of [...local, ...own]) {
    if (skill.name === 'read-summary') continue
    let text = ''
    try {
      text = await $.fs.read(skill.path)
    } catch {
      continue
    }
    const line = skill.name + ' | ' + clip(skillDescriptionOf(text) || skill.name, 160)
    if (size + line.length > ENHANCE_SKILLS_CHARS) break
    lines.push(line)
    skills.push(skill)
    size += line.length + 1
  }
  return { lines, skills }
}

const textField = (value) => (typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '')

const matchSkill = (name, skills) => {
  const bare = textField(name).replace(/^\//, '').replace(/^[\w-]+:/, '')
  return skills.find((skill) => skill.name === bare) || null
}

const looseDoc = (path, cwd) => {
  const bare = textField(path).replace(cwd + '/', '').replace(/^\.\//, '')
  return /\.md$/.test(bare) && !bare.startsWith('/') ? bare : ''
}

const looseSkill = (name, skills) => {
  const bare = textField(name).replace(/^\//, '')
  if (!bare || /(^|:)read-summary$/.test(bare)) return null
  const known = matchSkill(bare, skills)
  if (known && !bare.includes(':')) return known
  return { command: '/' + bare, name: bare.replace(/^[\w-]+:/, '') }
}

const jsonObjectIn = (text) => {
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start < 0 || end <= start) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

const listOf = (value, limit) => (Array.isArray(value) ? value : []).map(textField).filter(Boolean).slice(0, limit)

const parseEnhanceReply = (text, known, cwd, skills, loose) => {
  const reply = jsonObjectIn(text)
  if (!reply) return null
  const docs = (Array.isArray(reply.docs) ? reply.docs : [])
    .map((path) => (typeof path !== 'string' ? '' : loose ? looseDoc(path, cwd) : matchKnownDoc(path, known, cwd)))
    .filter((path, index, all) => path && all.indexOf(path) === index)
    .slice(0, loose ? ENHANCE_MAX_DOCS + 1 : ENHANCE_MAX_DOCS)
  const picked = []
  for (const entry of Array.isArray(reply.skills) ? reply.skills : []) {
    const name = entry && typeof entry === 'object' ? entry.name : entry
    const skill = loose ? looseSkill(name, skills) : matchSkill(name, skills)
    if (skill && !picked.some((done) => done.skill.command === skill.command)) picked.push({ skill, why: textField(entry && entry.why) })
  }
  return {
    goal: textField(reply.goal),
    docs,
    skills: picked.slice(0, ENHANCE_MAX_SKILLS),
    scope: textField(reply.scope),
    outOfScope: textField(reply.outOfScope),
    checkAgainst: textField(reply.checkAgainst),
    doneWhen: textField(reply.doneWhen),
    open: listOf(reply.open, ENHANCE_MAX_OPEN),
    facts: listOf(reply.facts, ENHANCE_MAX_FACTS),
  }
}

const headlessPromptOf = (draft) =>
  [
    'Run /syafiqkit:read-summary for the developer\'s draft below and follow the skill fully: task docs and their decisions files, the docs/ set, the CLAUDE.md files on the path, and the pointers they make. Do not start the work, edit anything, or ask questions.',
    'Then turn the draft into a prompt for the coding agent that will do the work, by these rules, using the skills you have rather than a list:',
    ENHANCE_SYSTEM,
    'Add a "facts" array to that JSON: the 3 to 6 facts you read that bear on THIS ask, most specific first (earlier fixes or attempts on the same symptom with their version or date, decisions that constrain it, gotchas, where the code lives). One line each, 30 words at most, paths and names exactly as written, never general facts about the subsystem, and never a password, token or key. In "docs" list the doc files those facts came from.',
    'Your final message is that JSON alone.',
    '',
    'Draft:',
    draft,
  ].join('\n')

const HEADLESS_ARGS = [
  '-p',
  '--model',
  'haiku',
  '--permission-mode',
  'auto',
  '--disallowedTools',
  'Edit,Write,NotebookEdit',
  '--output-format',
  'stream-json',
  '--verbose',
]

const stepOf = (name, input, cwd) => {
  const shown = (path) => relativeTo(cwd, String(path || ''))
  if (name === 'Skill') return 'running /' + String(input.skill || input.command || 'skill').replace(/^\//, '')
  if (name === 'Read') return 'reading ' + readableDocPath(shown(input.file_path))
  if (name === 'Grep') return 'searching "' + clip(String(input.pattern || ''), 40) + '"' + (input.path && input.path !== cwd ? ' in ' + shown(input.path) : '')
  if (name === 'Glob') return 'listing ' + String(input.pattern || '')
  if (name === 'Agent' || name === 'Task') return 'agent: ' + clip(String(input.description || input.subagent_type || ''), 60)
  if (name === 'Bash') return input.description ? clip(String(input.description), 70) : '$ ' + clip(String(input.command || '').split('\n')[0].replace(/^cd \S+ && /, ''), 70)
  const detail = input.description || input.file_path || input.path || input.pattern || input.command || input.query || input.url || ''
  return detail ? name + ' ' + clip(shown(detail), 70) : name
}

const readableDocPath = (path) => {
  const task = path.match(/^tasks\/(?:.*\/)?([^/]+)\/current\.md$/)
  if (task) return task[1] + ' task doc'
  const decision = path.match(/^tasks\/(?:.*\/)?([^/]+)\/decisions\/([^/]+)$/)
  if (decision) return decision[1] + ' › ' + decision[2]
  const parts = path.split('/')
  return parts.length > 2 ? '…/' + parts.slice(-2).join('/') : path
}

const narrationOf = (text) =>
  clip(
    String(text || '')
      .replace(/[#*`>]+/g, '')
      .replace(/\s+/g, ' ')
      .trim(),
    90,
  )

const STREAM_STOPPED = { stopped: true }

const stopWatcher = ($, isStale, deadline) => {
  let live = true
  const promise = (async () => {
    while (live) {
      if (isStale() || Date.now() > deadline) return STREAM_STOPPED
      await $.clock.sleep(ENHANCE_STOP_POLL_MS)
    }
    return null
  })()
  return { promise, end: () => (live = false) }
}

const streamClaude = async ($, cwd, prompt, onStep, isStale) => {
  for (const bin of ['claude', (await homeOf($)) + '/.local/bin/claude']) {
    let pending = ''
    let outcome = null
    let child = null
    const watcher = stopWatcher($, isStale, Date.now() + ENHANCE_HEADLESS_TIMEOUT_MS)
    try {
      child = $.process.spawn({ argv: [bin, ...HEADLESS_ARGS, prompt], cwd, env: { SYAFIQKIT_MOD: '0' } })
      while (true) {
        const pulled = await Promise.race([child.next(), watcher.promise])
        if (pulled === STREAM_STOPPED) {
          child.return(undefined).catch(() => {})
          return STREAM_STOPPED
        }
        if (pulled.done) break
        const { stream, text } = pulled.value
        if (stream !== 'stdout') continue
        pending += text
        const lines = pending.split('\n')
        pending = lines.pop()
        for (const line of lines) {
          let event = null
          try {
            event = JSON.parse(line)
          } catch {
            continue
          }
          if (event.type === 'result') outcome = event
          const content = event.type === 'assistant' && event.message && Array.isArray(event.message.content) ? event.message.content : []
          const nested = event.parent_tool_use_id ? '↳ ' : ''
          for (const block of content) {
            if (block.type === 'text' && block.text && block.text.trim() && !block.text.trim().startsWith('{')) {
              onStep(nested + narrationOf(block.text))
              continue
            }
            if (block.type !== 'tool_use') continue
            onStep(nested + stepOf(block.name, block.input || {}, cwd))
          }
        }
      }
    } catch (error) {
      if (!outcome && /ENOENT|no such file|command not found/i.test(messageOf(error))) continue
      throw error
    } finally {
      watcher.end()
    }
    return { outcome }
  }
  return null
}

const headlessEnhance = async ($, cwd, draft, skills, abort) => {
  const onStep = (step) => {
    if (enhanceState().abort !== abort) return
    state.enhance.stage = step
    redrawBand($)
  }
  let ran
  try {
    ran = await streamClaude($, cwd, headlessPromptOf(draft), onStep, () => enhanceState().abort !== abort)
  } catch (error) {
    modLog($, 'enhance headless failed: ' + messageOf(error).slice(0, 200))
    return null
  }
  if (!ran) {
    modLog($, 'enhance headless: claude not found')
    return null
  }
  if (ran.stopped) {
    if (enhanceState().abort === abort) modLog($, 'enhance headless: stopped after ' + ENHANCE_HEADLESS_TIMEOUT_MS / 1000 + ' s')
    return null
  }
  const outcome = ran.outcome
  if (!outcome || outcome.is_error || typeof outcome.result !== 'string') {
    modLog($, 'enhance headless: ' + (outcome ? JSON.stringify(outcome).slice(0, 300) : 'no result event'))
    return null
  }
  modLog($, 'enhance headless reply: ' + outcome.result.replace(/\s+/g, ' ').slice(0, 400))
  return parseEnhanceReply(outcome.result, null, cwd, skills, true)
}

const docSetOf = async ($, cwd, doc) => {
  const folder = doc.replace(/\/current\.md$/, '')
  const decisions = (await safeList($, cwd + '/' + folder + '/decisions'))
    .filter((entry) => entry.kind === 'file' && entry.name.endsWith('.md'))
    .map((entry) => folder + '/decisions/' + entry.name)
  return [doc, ...decisions]
}

const readPickedDocs = async ($, cwd, docs) => {
  const paths = (await Promise.all(docs.map((doc) => docSetOf($, cwd, doc)))).flat()
  const texts = []
  let size = 0
  for (const path of paths) {
    let text = ''
    try {
      text = (await $.fs.read(cwd + '/' + path)).slice(0, ENHANCE_DOC_CHARS)
    } catch {
      continue
    }
    if (size + text.length > ENHANCE_READ_CHARS) text = text.slice(0, Math.max(0, ENHANCE_READ_CHARS - size))
    if (!text) break
    texts.push('=== ' + path + '\n' + text)
    size += text.length
  }
  return texts
}

const parseFacts = (text) => {
  const reply = jsonObjectIn(text)
  return reply ? listOf(reply.facts, ENHANCE_MAX_FACTS) : []
}

const digestDocs = async ($, draft, goal, texts, signal) => {
  const result = await $.model.complete(
    {
      model: 'haiku',
      system: ENHANCE_DIGEST,
      prompt: texts.join('\n\n') + '\n\n=== The ask\n' + (goal || draft),
      maxTokens: 1200,
      effort: 'low',
      timeoutMs: ENHANCE_TIMEOUT_MS,
    },
    { signal },
  )
  if (!result.isAnswered) {
    modLog($, 'enhance digest: ' + result.reason)
    return []
  }
  modLog($, 'enhance digest reply: ' + result.text.replace(/\s+/g, ' ').slice(0, 400))
  return parseFacts(result.text)
}

const composeEnhanced = (draft, parsed) => {
  const lines = []
  const facts = parsed.facts || []
  if (facts.length) lines.push('Context' + (parsed.docs.length ? ' from ' + parsed.docs.join(' and ') : '') + ':\n' + facts.map((fact) => '- ' + fact).join('\n') + '\n')
  else if (parsed.docs.length) lines.push('Start with /syafiqkit:read-summary on ' + parsed.docs.join(' and ') + '.')
  for (const { skill, why } of parsed.skills) lines.push('Use ' + skill.command + (why ? ': ' + why.replace(/\.$/, '') : '') + '.')
  if (parsed.scope) lines.push('Scope: ' + parsed.scope)
  if (parsed.outOfScope) lines.push('Out of scope: ' + parsed.outOfScope)
  if (parsed.checkAgainst) lines.push('Check against: ' + parsed.checkAgainst)
  if (parsed.doneWhen) lines.push('Done when: ' + parsed.doneWhen)
  const open = parsed.open.length ? '\n\nOpen:\n' + parsed.open.map((item) => '- ' + item).join('\n') : ''
  const body = lines.length ? '\n\n' + lines.join('\n') : ''
  return (parsed.goal || draft.trim()) + body + open
}

const docLabelOf = (path) => path.replace(/^tasks\//, '').replace(/\/current\.md$/, '')

const enhanceSummary = (parsed) => [
  ...(parsed.quick ? ['quick read'] : []),
  ...parsed.docs.map(docLabelOf),
  ...parsed.skills.map(({ skill }) => skill.command),
]

const startEnhance = async ($) => {
  if (enhanceState().phase === 'running') {
    $.ui.toast('Enhance is already running; Cancel it to start again')
    return
  }
  const box = await $.prompt.read()
  if (enhanceState().phase === 'running') return
  const draft = (box && box.text) || ''
  const trimmed = draft.trim()
  if (trimmed.length < ENHANCE_MIN_CHARS || /^[/!]/.test(trimmed)) {
    $.ui.toast(trimmed ? 'Enhance needs a few words, or a prompt that is not a /command' : 'Type a prompt first, then press Enhance')
    return
  }
  if (/\n(Context( from [^\n]*)?:|Start with \/syafiqkit:read-summary on )/.test(draft)) {
    $.ui.toast('This prompt is already enhanced; Undo or edit it instead')
    return
  }
  const abort = new AbortController()
  setEnhance({ phase: 'running', original: draft, abort, stage: 'choosing task docs and skills', startedAt: Date.now() })
  startEnhanceTicker($)
  redrawBand($)
  try {
    const cwd = await $.session.cwd()
    if (enhanceState().abort !== abort) return
    state.enhance.stage = 'starting read-summary on haiku'
    redrawBand($)
    const skillList = await buildSkillList($, cwd)
    if (enhanceState().abort !== abort) return
    let parsed = await headlessEnhance($, cwd, draft, skillList.skills, abort)
    if (enhanceState().abort !== abort) return
    if (!parsed) parsed = await quickEnhance($, cwd, draft, abort, skillList)
    if (!parsed || enhanceState().abort !== abort) return
    const enhanced = composeEnhanced(draft, parsed)
    if (enhanced.trim() === draft.trim()) {
      failEnhance($, 'Nothing to add, your prompt is unchanged')
      return
    }
    const now = await $.prompt.read()
    if (enhanceState().abort !== abort) return
    if (((now && now.text) || '') !== draft) {
      state.enhance = { ...state.enhance, phase: 'ready', pending: enhanced, docs: enhanceSummary(parsed), abort: null }
      redrawBand($)
      return
    }
    await fillEnhanced($, draft, enhanced, enhanceSummary(parsed))
  } catch (error) {
    modLog($, 'enhance failed: ' + messageOf(error).slice(0, 200))
    if (enhanceState().abort === abort) failEnhance($, 'Enhance failed, your prompt is unchanged')
  } finally {
    redrawBand($)
  }
}

const quickEnhance = async ($, cwd, draft, abort, skillList) => {
  state.enhance.stage = 'read-summary run failed, using the quick read'
  redrawBand($)
  const listed = await buildCatalogue($, cwd, draft)
  const catalogue = listed.lines
  state.enhance.stage = 'choosing from ' + listed.total + ' task docs'
  redrawBand($)
  const known = new Set(catalogue.map((line) => line.split(' | ')[0]))
  const result = await $.model.complete(
    {
      model: 'haiku',
      system:
        ENHANCE_SYSTEM +
        '\nYou get the task docs (path | title | status | what it covers) and the skills the agent can run (name | what it is for); name only skills from that list.',
      prompt:
        'Task docs:\n' +
        (catalogue.length ? catalogue.join('\n') : '(none)') +
        '\n\nSkills:\n' +
        (skillList.lines.length ? skillList.lines.join('\n') : '(none)') +
        '\n\nDraft:\n' +
        draft,
      maxTokens: 2000,
      effort: 'low',
      timeoutMs: ENHANCE_TIMEOUT_MS,
    },
    { signal: abort.signal },
  )
  if (enhanceState().abort !== abort) return
  if (!result.isAnswered) {
    const why = result.reason === 'aborted' ? (abort.signal.aborted ? 'cancelled' : 'timed out') : 'failed (' + result.reason + ')'
    modLog($, 'enhance ' + why)
    failEnhance($, 'Enhance ' + why + ', your prompt is unchanged')
    return
  }
  modLog($, 'enhance: ' + catalogue.length + ' docs, ' + skillList.lines.length + ' skills, reply: ' + result.text.replace(/\s+/g, ' ').slice(0, 400))
  const parsed = parseEnhanceReply(result.text, known, cwd, skillList.skills)
  if (!parsed) {
    modLog($, 'enhance: unreadable reply: ' + result.text.slice(0, 200))
    failEnhance($, 'Enhance could not read the reply, your prompt is unchanged')
    return
  }
  parsed.facts = []
  parsed.quick = true
  if (parsed.docs.length) {
    state.enhance.stage = 'reading ' + parsed.docs.map(docLabelOf).join(', ')
    redrawBand($)
    const texts = await readPickedDocs($, cwd, parsed.docs)
    if (texts.length) parsed.facts = await digestDocs($, draft, parsed.goal, texts, abort.signal)
  }
  return parsed
}

const fillEnhanced = async ($, original, enhanced, docs) => {
  const filled = await $.prompt.fill({ text: enhanced, mode: 'replace' })
  if (!filled || !filled.isFilled) {
    setEnhance({ phase: 'ready', pending: enhanced, docs })
    $.ui.toast('The prompt box is busy; press Use it when it is free')
    redrawBand($)
    return
  }
  setEnhance({ phase: 'done', original, filled: filled.text != null ? filled.text : enhanced, docs })
  redrawBand($)
}

const useReadyEnhance = async ($) => {
  const current = enhanceState()
  if (current.phase !== 'ready') return
  const box = await $.prompt.read()
  await fillEnhanced($, (box && box.text) || '', current.pending, current.docs)
}

const cancelEnhance = ($) => {
  const current = enhanceState()
  if (current.abort) current.abort.abort()
  resetEnhance()
  $.ui.toast('Enhance cancelled, your prompt is unchanged')
  redrawBand($)
}

const undoEnhance = async ($) => {
  const current = enhanceState()
  if (current.phase !== 'done') return
  const box = await $.prompt.read()
  if (((box && box.text) || '') !== current.filled) {
    failEnhance($, 'The prompt changed since Enhance, nothing to undo')
    redrawBand($)
    return
  }
  const restored = await $.prompt.fill({ text: current.original, mode: 'replace' })
  if (!restored || !restored.isFilled) {
    $.ui.toast('The prompt box is busy; press Undo again when it is free')
    return
  }
  resetEnhance()
  redrawBand($)
}

const enhanceOwnsSubmit = (text) => {
  const current = enhanceState()
  if (current.phase === 'idle') return false
  const sent = String(text || '').trim()
  return Boolean(sent) && [current.original, current.filled, current.pending].some((own) => own && own.trim() === sent)
}

const discardEnhance = ($) => {
  resetEnhance()
  redrawBand($)
}

const dropEnhanceOnEdit = ($) => {
  if (enhanceState().phase === 'done') discardEnhance($)
}

const enhanceRow = ($, e) => {
  const { Box, Text, Button } = $.ui.resolve(e)
  const current = enhanceState()
  const row = (children) => Box({ key: 'enhance-row', flexDirection: 'row', flexWrap: 'wrap', columnGap: 2, paddingX: 1, children })
  if (current.phase === 'running') {
    const desktop = isDesktop(e)
    const elapsed = elapsedOf(current.startedAt)
    return Box({
      key: 'enhance-row',
      flexDirection: 'row',
      columnGap: 1,
      paddingX: 1,
      ...(desktop ? { backgroundColor: DESKTOP_TONE.strip, alignItems: 'center' } : {}),
      children: [
        Text({ color: 'cyan', bold: true, children: spinnerFrame() + ' Enhancing' }),
        desktop ? chip({ Text }, 'enhance-elapsed', elapsed, 'muted') : Text({ dimColor: true, children: elapsed }),
        Text({ dimColor: true, wrap: 'truncate-end', children: current.stage || '' }),
        Button({ key: 'enhance-cancel', label: 'Cancel', onPress: () => cancelEnhance($) }),
      ],
    })
  }
  if (current.phase === 'ready') {
    return row([
      Text({ color: 'cyan', children: '✨ Enhanced version ready' }),
      Button({ key: 'enhance-use', label: 'Use it', onPress: () => useReadyEnhance($) }),
      Button({ key: 'enhance-discard', label: 'Discard', onPress: () => discardEnhance($) }),
    ])
  }
  if (current.phase === 'done') {
    return row([
      Text({ color: 'cyan', children: '✨ Enhanced' }),
      Text({
        dimColor: true,
        wrap: 'truncate-end',
        children: current.docs.length ? current.docs.join(' · ') : 'rewritten, no doc or skill matched',
      }),
      Button({ key: 'enhance-undo', label: 'Undo', onPress: () => undoEnhance($) }),
    ])
  }
  return null
}
