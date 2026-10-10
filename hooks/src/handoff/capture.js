const gitState = async ($) => {
  try {
    const status = await $.process.run(['git', '--no-optional-locks', 'status', '--porcelain'])
    const head = await $.process.run(['git', 'rev-parse', '--short', 'HEAD'])
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
  'Write a handoff for a fresh session that has none of this conversation. Plain text, under 220 words, with these headings: Goal (one line), Done (bullets: exact file paths, decisions, numbers), In flight (anything still running or half-edited), Next (the first thing to do), Open decisions (questions I have not answered; write none if there are none). Use only what is in the conversation and invent nothing. Do not repeat these instructions.'

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
    return (await $.process.run(['git', 'branch', '--show-current'])).stdout.trim()
  } catch {
    return ''
  }
}
