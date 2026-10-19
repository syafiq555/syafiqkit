import { hostFsStat } from '../core/api.js'
import { DIFF_CONTEXT, LITERAL_PATHS, MAX_UNTRACKED_BYTES } from '../core/constants.js'
import { kb } from '../core/format.js'
import { gitRun } from '../core/run.js'
import { attachMedia } from './media.js'

export function wordSpan(before, after) {
  let head = 0
  const most = Math.min(before.length, after.length)
  while (head < most && before[head] === after[head]) head++
  let tail = 0
  while (tail < most - head && before[before.length - 1 - tail] === after[after.length - 1 - tail]) tail++
  if (head + tail === 0) return null
  return { before: [head, before.length - tail], after: [head, after.length - tail] }
}

export function markWordChanges(lines) {
  let at = 0
  while (at < lines.length) {
    if (lines[at].kind !== 'del') {
      at++
      continue
    }
    const delStart = at
    while (at < lines.length && lines[at].kind === 'del') at++
    const addStart = at
    while (at < lines.length && lines[at].kind === 'add') at++
    const pairs = Math.min(addStart - delStart, at - addStart)
    for (let i = 0; i < pairs; i++) {
      const span = wordSpan(lines[delStart + i].text, lines[addStart + i].text)
      if (!span) continue
      lines[delStart + i].span = span.before
      lines[addStart + i].span = span.after
    }
  }
}

export function parseDiff(text) {
  const lines = []
  let oldNo = 1
  let newNo = 1
  let inHunk = false
  for (const row of text.split('\n')) {
    const hunk = row.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/)
    if (hunk) {
      const hidden = Number(hunk[2]) - newNo
      oldNo = Number(hunk[1])
      newNo = Number(hunk[2])
      inHunk = true
      if (hidden > 0) lines.push({ kind: 'gap', oldNo: 0, newNo: 0, text: '', hidden })
      continue
    }
    if (!inHunk || row.startsWith('\\')) continue
    const sign = row[0]
    if (sign === '+') lines.push({ kind: 'add', oldNo: 0, newNo: newNo++, text: row.slice(1) })
    else if (sign === '-') lines.push({ kind: 'del', oldNo: oldNo++, newNo: 0, text: row.slice(1) })
    else if (sign === ' ') lines.push({ kind: 'ctx', oldNo: oldNo++, newNo: newNo++, text: row.slice(1) })
  }
  markWordChanges(lines)
  return lines
}

export function tally(lines, note) {
  return ({
  lines,
  note,
  added: lines.filter((line) => line.kind === 'add').length,
  removed: lines.filter((line) => line.kind === 'del').length,
})
}

export function diffArgs(plane, path) {
  return [
  'git',
  '--no-optional-locks',
  'diff',
  ...(plane === 'staged' ? ['--cached'] : plane === 'head' ? ['HEAD'] : []),
  '--no-color',
  '-U' + DIFF_CONTEXT,
  '--',
  ...path,
]
}

export const EMPTY_DIFF_NOTE = {
  staged: 'Nothing staged for this file.',
  worktree: 'No unstaged changes in this file.',
  head: 'No changes since the last commit.',
}

export async function readDiff($, cwd, paths, plane) {
  const first = paths[0]
  try {
    const ran = await gitRun($, diffArgs(plane, paths), { cwd, env: LITERAL_PATHS })
    if (ran.exitCode !== 0) {
      return tally([], 'Git could not diff this file: it is not in a repository, or the repository has no commit yet.')
    }
    const absolute = first.startsWith('/') ? first : cwd + '/' + first
    if (ran.stdout.trim()) {
      const lines = parseDiff(ran.stdout)
      if (lines.length) return tally(lines, '')
      return attachMedia($, cwd, tally([], 'Binary file or a change with no text lines.'), absolute, plane, false)
    }
    const tracked = await gitRun($, ['git', '--no-optional-locks', 'ls-files', '--error-unmatch', '--', first], {
      cwd,
      env: LITERAL_PATHS,
    })
    if (tracked.exitCode !== 0) {
      const stat = await hostFsStat($, absolute).catch(() => null)
      if (stat && stat.size > MAX_UNTRACKED_BYTES) return attachMedia($, cwd, tally([], 'New file, ' + kb(stat.size) + '.'), absolute, plane, true)
      const added = await gitRun($,
        ['git', '--no-optional-locks', 'diff', '--no-index', '--no-color', '-U' + DIFF_CONTEXT, '--', '/dev/null', absolute],
        { cwd },
      )
      if (!added.stdout.trim()) {
        return tally([], added.exitCode === 0 ? 'New empty file, not yet added to git.' : 'This file cannot be read: it may have been removed, or it is a folder.')
      }
      if (added.stdout.length > MAX_UNTRACKED_BYTES) return attachMedia($, cwd, tally([], 'New file, ' + kb(added.stdout.length) + '.'), absolute, plane, true)
      const lines = parseDiff(added.stdout)
      if (lines.length) return tally(lines, 'New file, not yet added to git.')
      return attachMedia($, cwd, tally([], 'Binary file or a change with no text lines.'), absolute, plane, true)
    }
    return tally([], EMPTY_DIFF_NOTE[plane])
  } catch {
    return tally([], 'Git could not be run here.')
  }
}
