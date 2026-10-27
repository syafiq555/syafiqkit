import { hostEnvGet, hostProcessRun } from './api.js'
import { CLAUDE_MD_MAX_BYTES, CLAUDE_MD_MAX_LINES, DECISION_MAX_BYTES, RECENT_AGE_DAYS, TASK_DOC_MAX_LINES } from './constants.js'

export function parentOf(path) {
  const cut = path.lastIndexOf('/')
  return cut > 0 ? path.slice(0, cut) : ''
}

export function isDirectory(entry) {
  return entry.kind !== 'file' && !entry.isLink && !entry.name.startsWith('.')
}

export function kb(bytes) {
  return (typeof bytes === 'number' ? (bytes / 1024).toFixed(1) + ' KB' : '')
}

export function clip(text, width) {
  return (text.length > width ? text.slice(0, width - 1) + '…' : text)
}

export function clipStart(text, width) {
  return (text.length > width ? '…' + text.slice(text.length - width + 1) : text)
}

export function cellWidth(char) {
  return (/\p{Extended_Pictographic}/u.test(char) ? 2 : 1)
}

export function cellsOf(chars) {
  return chars.reduce((sum, char) => sum + cellWidth(char), 0)
}

export function wrapWords(text, width) {
  const lines = []
  let line = ''
  let used = 0
  const flush = () => {
    if (used) lines.push(line)
    line = ''
    used = 0
  }
  for (const word of text.split(/\s+/).filter(Boolean)) {
    let rest = [...word]
    while (cellsOf(rest) > width) {
      flush()
      let take = 0
      while (cellsOf(rest.slice(0, take + 1)) <= width) take += 1
      lines.push(rest.slice(0, take).join(''))
      rest = rest.slice(take)
    }
    const need = cellsOf(rest)
    if (used && used + 1 + need > width) flush()
    line += (used ? ' ' : '') + rest.join('')
    used += (used ? 1 : 0) + need
  }
  flush()
  return lines.length ? lines : ['']
}

export function clipMiddle(text, width) {
  if (text.length <= width) return text
  const tail = Math.ceil((width - 1) / 2)
  return text.slice(0, width - 1 - tail) + '…' + text.slice(text.length - tail)
}

export function shortName(doc) {
  const name = doc.name || doc.label
  return doc.companion ? name.replace(/^CLAUDE-/, '').replace(/\.md$/, '') : name
}

export function docLabel(doc, width) {
  return (doc.listName ? clipStart(doc.listName, width) : clipMiddle(shortName(doc), width))
}

export function docAgeOf(now, ms, fullAge) {
  return (fullAge || (typeof ms === 'number' && now - ms < RECENT_AGE_DAYS * 86400000) ? agoOf(now, ms) : '')
}

export function messageOf(error) {
  return String(error && error.message ? error.message : error)
}

export async function homeOf($) {
  let home = ''
  try {
    home = (await hostEnvGet($, 'HOME')) || ''
  } catch {
    home = ''
  }
  if (home) return home
  try {
    return (await hostEnvGet($, 'USERPROFILE')) || ''
  } catch {
    return ''
  }
}

export async function lockDown($, path, mode) {
  try {
    await hostProcessRun($, ['chmod', mode, path])
  } catch {
    return
  }
}

export function agoOf(now, ms) {
  if (typeof ms !== 'number' || !now) return ''
  const minutes = Math.max(0, Math.round((now - ms) / 60000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return minutes + ' min ago'
  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours + ' h ago'
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : days + ' d ago'
}

export function statusLineOf(text) {
  const hit = text.match(/^\W*Status\b.*$/im)
  return hit ? hit[0].trim() : ''
}

export function isHubText(text) {
  const hit = text.match(/^\W*Domain\s*:.*$/im)
  return Boolean(hit && /\(\s*hub\s*[:;,)]/i.test(hit[0]))
}

export function summaryOf(line) {
  if (!line) return ''
  const body = line.replace(/^\W*Status\b[:\s*]*/i, '').trim()
  const icon = (body.match(/^(\p{Extended_Pictographic}️?)/u) || [])[1] || '·'
  const rest = body.replace(/^\p{Extended_Pictographic}️?\s*/u, '')
  const head = rest.split(/\s[—–-]\s|\(|,/)[0].trim()
  return icon + ' ' + head.slice(0, 24)
}

export function isInstructionFile(doc) {
  return doc.group === 'CLAUDE.md chain'
}

export function isOversizedDecision(file) {
  return (file.size || 0) > DECISION_MAX_BYTES
}

export function oversizedDecisions(doc) {
  return (doc.decisions || []).filter(isOversizedDecision)
}

export function isHeavy(doc) {
  if (doc.group === 'Task docs' && oversizedDecisions(doc).length) return true
  if (typeof doc.lines !== 'number') return false
  if (isInstructionFile(doc)) return doc.lines > CLAUDE_MD_MAX_LINES || (doc.size || 0) > CLAUDE_MD_MAX_BYTES
  return doc.group === 'Task docs' && doc.lines > TASK_DOC_MAX_LINES
}

export function heavyNote(doc) {
  const big = oversizedDecisions(doc).sort((a, b) => (b.size || 0) - (a.size || 0))
  const parts = []
  if (big.length) parts.push(big.length > 1 ? big.length + ' decisions, max ' + kb(big[0].size) : 'decisions ' + kb(big[0].size))
  if (typeof doc.lines === 'number' && doc.group === 'Task docs' && doc.lines > TASK_DOC_MAX_LINES) parts.push(doc.lines + ' lines')
  if (!parts.length) parts.push(isInstructionFile(doc) && doc.lines <= CLAUDE_MD_MAX_LINES ? kb(doc.size) : doc.lines + ' lines')
  return '⚠ ' + parts.join(' · ')
}

export function heaviness(doc) {
  return isInstructionFile(doc)
    ? doc.size || 0
    : oversizedDecisions(doc).reduce((sum, file) => sum + (file.size || 0), 0) + (doc.lines || 0)
}

export function refreshRequest(doc) {
  return 'Use the refresh-instructions skill on ' + doc.path + '.'
}

export function haikuRequest(skill, path, ask) {
  return 'Use the haiku skill to run the ' +
  skill +
  ' skill on ' +
  path +
  ask +
  ' Then verify the result, and restore any fact, figure or quote the agent dropped or changed the meaning of, rather than reverting its work.'
}

export function decisionLabel(file) {
  return 'decisions/' + file.name + ' (' + kb(file.size) + ')'
}

export function decisionFileRequest(doc, file, verb, ask) {
  return haikuRequest(
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
}

export function splitRequest(doc, file) {
  return decisionFileRequest(
    doc,
    file,
    'split',
    ' by topic into smaller decisions files. Move the text word for word and count its headings and table rows before and after, make current.md the router that says which file holds what, and repoint every link to the old file.',
  )
}

export function condenseFileRequest(doc, file) {
  return decisionFileRequest(
    doc,
    file,
    'condense',
    ' in place. Remove superseded and repeated text, and keep every decision, figure, name and quoted line. If the file is the only copy of an outside source (a spec, a transcript, client notes), do not cut it: only remove repeats, and split it if it is over 40 KB. If it is still over 40 KB afterwards, say so.',
  )
}

export function taskDocShrinkRequest(doc) {
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

export function shrinkRequest(doc) {
  return isInstructionFile(doc) ? haikuRequest('condense-claude-md', doc.path, '.') : taskDocShrinkRequest(doc)
}
