const parentOf = (path) => {
  const cut = path.lastIndexOf('/')
  return cut > 0 ? path.slice(0, cut) : ''
}

const isDirectory = (entry) => entry.kind !== 'file' && !entry.isLink && !entry.name.startsWith('.')

const kb = (bytes) => (typeof bytes === 'number' ? (bytes / 1024).toFixed(1) + ' KB' : '')

const clip = (text, width) => (text.length > width ? text.slice(0, width - 1) + '…' : text)

const messageOf = (error) => String(error && error.message ? error.message : error)

const homeOf = async ($) => {
  let home = ''
  try {
    home = (await $.env.get('HOME')) || ''
  } catch {
    home = ''
  }
  if (home) return home
  try {
    return (await $.env.get('USERPROFILE')) || ''
  } catch {
    return ''
  }
}

const lockDown = async ($, path, mode) => {
  try {
    await $.process.run(['chmod', mode, path])
  } catch {
    return
  }
}

const agoOf = (now, ms) => {
  if (typeof ms !== 'number' || !now) return ''
  const minutes = Math.max(0, Math.round((now - ms) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return minutes + ' min ago'
  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours + ' h ago'
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : days + ' d ago'
}

const statusLineOf = (text) => {
  const hit = text.match(/^\W*Status\b.*$/im)
  return hit ? hit[0].trim() : ''
}

const summaryOf = (line) => {
  if (!line) return ''
  const body = line.replace(/^\W*Status\b[:\s*]*/i, '').trim()
  const icon = (body.match(/^(\p{Extended_Pictographic}️?)/u) || [])[1] || '·'
  const rest = body.replace(/^\p{Extended_Pictographic}️?\s*/u, '')
  const head = rest.split(/\s[—–-]\s|\(|,/)[0].trim()
  return icon + ' ' + head.slice(0, 24)
}

const isInstructionFile = (doc) => doc.group === 'CLAUDE.md chain'

const isOversizedDecision = (file) => (file.size || 0) > DECISION_MAX_BYTES

const oversizedDecisions = (doc) => (doc.decisions || []).filter(isOversizedDecision)

const isHeavy = (doc) => {
  if (doc.group === 'Task docs' && oversizedDecisions(doc).length) return true
  if (typeof doc.lines !== 'number') return false
  if (isInstructionFile(doc)) return doc.lines > CLAUDE_MD_MAX_LINES || (doc.size || 0) > CLAUDE_MD_MAX_BYTES
  return doc.group === 'Task docs' && doc.lines > TASK_DOC_MAX_LINES
}

const heavyNote = (doc) => {
  const big = oversizedDecisions(doc).sort((a, b) => (b.size || 0) - (a.size || 0))
  const parts = []
  if (big.length) parts.push('decisions/' + big[0].name + ' ' + kb(big[0].size) + (big.length > 1 ? ' +' + (big.length - 1) : ''))
  if (typeof doc.lines === 'number' && doc.group === 'Task docs' && doc.lines > TASK_DOC_MAX_LINES) parts.push(doc.lines + ' lines')
  if (!parts.length) parts.push(isInstructionFile(doc) && doc.lines <= CLAUDE_MD_MAX_LINES ? kb(doc.size) : doc.lines + ' lines')
  return '⚠ ' + parts.join(' · ')
}

const heaviness = (doc) =>
  isInstructionFile(doc)
    ? doc.size || 0
    : oversizedDecisions(doc).reduce((sum, file) => sum + (file.size || 0), 0) + (doc.lines || 0)

const REFRESH_EFFECT = 'Rewrites the doc in place with three passes (restructure, shorten, loosen over-strict rules).'
const SHRINK_EFFECT =
  'Task doc: the task-summary skill judges each file over the limit (index over 300 lines, decisions file over 40 KB) and condenses, splits, does both, or proposes a better structure first. CLAUDE.md: condensed in place on haiku and verified.'

const refreshRequest = (doc) => 'Use the refresh-instructions skill on ' + doc.path + '.'

const haikuRequest = (skill, path, ask) =>
  'Use the haiku skill to run the ' +
  skill +
  ' skill on ' +
  path +
  ask +
  ' Then verify the result, and restore any fact, figure or quote the agent dropped or changed the meaning of, rather than reverting its work.'

const decisionLabel = (file) => 'decisions/' + file.name + ' (' + kb(file.size) + ')'

const decisionFileRequest = (doc, file, verb, ask) =>
  haikuRequest(
    'condense-task-doc',
    file.path,
    ' to ' +
      verb +
      ' ' +
      decisionLabel(file) +
      ask +
      ' Only this file is in scope: leave its index ' +
      doc.path +
      ' and the other decisions files alone, except routing rows and links that must change.',
  )

const SPLIT_EFFECT =
  'A haiku agent splits one decisions file into smaller ones by topic, moving the text word for word, and makes current.md the router that says which file holds what. Links to the old file are repointed, and the result is checked before it is reported.'

const splitRequest = (doc, file) =>
  decisionFileRequest(
    doc,
    file,
    'split',
    ' by topic into smaller decisions files. Move the text word for word and count its headings and table rows before and after, make current.md the router that says which file holds what, and repoint every link to the old file.',
  )

const CONDENSE_FILE_EFFECT =
  'A haiku agent condenses one decisions file in place: drops superseded and repeated text, keeps every decision, figure, name and quote, and checks the result before it is reported.'

const condenseFileRequest = (doc, file) =>
  decisionFileRequest(
    doc,
    file,
    'condense',
    ' in place. Remove superseded and repeated text, and keep every decision, figure, name and quoted line. If the file is the only copy of an outside source (a spec, a transcript, client notes), do not cut it: only remove repeats, and split it if it is over 40 KB. If it is still over 40 KB afterwards, say so.',
  )

const taskDocShrinkRequest = (doc) => {
  const sizes = []
  if (typeof doc.lines === 'number' && doc.lines > TASK_DOC_MAX_LINES) sizes.push('current.md is ' + doc.lines + ' lines (index limit 300)')
  const big = oversizedDecisions(doc)
  if (big.length) sizes.push(big.map(decisionLabel).join(', ') + (big.length === 1 ? ' is' : ' are') + ' over the 40 KB limit for one decisions file')
  return (
    'Use the task-summary skill on ' +
    doc.path +
    '. ' +
    (sizes.length ? 'Over the limit: ' + sizes.join('; ') + '. ' : '') +
    'For each oversized file, judge what fits: condense it, split it by topic with current.md as the router, condense then split, or a better structure. If you see a better way than these, propose it before changing anything. Keep every decision, figure, name and quote, and move text between files word for word. Verify the result before reporting.'
  )
}

const shrinkRequest = (doc) =>
  isInstructionFile(doc) ? haikuRequest('condense-claude-md', doc.path, '.') : taskDocShrinkRequest(doc)
