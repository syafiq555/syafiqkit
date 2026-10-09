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

const isHeavy = (doc) => {
  if (typeof doc.lines !== 'number') return false
  if (isInstructionFile(doc)) return doc.lines > CLAUDE_MD_MAX_LINES || (doc.size || 0) > CLAUDE_MD_MAX_BYTES
  return doc.group === 'Task docs' && doc.lines > TASK_DOC_MAX_LINES
}

const REFRESH_EFFECT = 'Rewrites the doc in place with three passes (restructure, shorten, loosen over-strict rules).'
const SHRINK_EFFECT =
  'Condenses the doc in place on haiku agents and verifies it, and splits a task doc over 300 lines into an index plus decisions files.'

const refreshRequest = (doc) => 'Use the refresh-instructions skill on ' + doc.path + '.'

const shrinkRequest = (doc) =>
  'Use the haiku skill to run the ' +
  (isInstructionFile(doc) ? 'condense-claude-md' : 'condense-task-doc') +
  ' skill on ' +
  doc.path +
  ', then verify the result before reporting.'
