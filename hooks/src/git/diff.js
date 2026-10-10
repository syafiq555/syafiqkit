const wordSpan = (before, after) => {
  let head = 0
  const most = Math.min(before.length, after.length)
  while (head < most && before[head] === after[head]) head++
  let tail = 0
  while (tail < most - head && before[before.length - 1 - tail] === after[after.length - 1 - tail]) tail++
  if (head + tail === 0) return null
  return { before: [head, before.length - tail], after: [head, after.length - tail] }
}

const markWordChanges = (lines) => {
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

const parseDiff = (text) => {
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

const allAdded = (raw) => {
  const rows = raw.endsWith('\n') ? raw.slice(0, -1).split('\n') : raw.split('\n')
  return rows.map((text, index) => ({ kind: 'add', oldNo: 0, newNo: index + 1, text }))
}

const tally = (lines, note) => ({
  lines,
  note,
  added: lines.filter((line) => line.kind === 'add').length,
  removed: lines.filter((line) => line.kind === 'del').length,
})

const diffArgs = (plane, path) => [
  'git',
  '--no-optional-locks',
  'diff',
  ...(plane === 'staged' ? ['--cached'] : plane === 'head' ? ['HEAD'] : []),
  '--no-color',
  '-U' + DIFF_CONTEXT,
  '--',
  ...path,
]

const EMPTY_DIFF_NOTE = {
  staged: 'Nothing staged for this file.',
  worktree: 'No unstaged changes in this file.',
  head: 'No changes since the last commit.',
}

const readDiff = async ($, cwd, paths, plane) => {
  const first = paths[0]
  try {
    const ran = await $.process.run(diffArgs(plane, paths), { cwd, env: LITERAL_PATHS })
    if (ran.exitCode !== 0) {
      return tally([], 'Git could not diff this file: it is not in a repository, or the repository has no commit yet.')
    }
    if (ran.stdout.trim()) {
      const lines = parseDiff(ran.stdout)
      return tally(lines, lines.length ? '' : 'Binary file or a change with no text lines.')
    }
    const tracked = await $.process.run(['git', '--no-optional-locks', 'ls-files', '--error-unmatch', '--', first], {
      cwd,
      env: LITERAL_PATHS,
    })
    if (tracked.exitCode !== 0) {
      const absolute = first.startsWith('/') ? first : cwd + '/' + first
      try {
        const stat = await $.fs.stat(absolute)
        if (stat.size > MAX_UNTRACKED_BYTES) return tally([], 'New file, ' + kb(stat.size) + ': too large to show here.')
        return tally(allAdded(await $.fs.read(absolute)), 'New file, not yet added to git.')
      } catch {
        return tally([], 'This file cannot be read: it may have been removed, or it is a folder.')
      }
    }
    return tally([], EMPTY_DIFF_NOTE[plane])
  } catch {
    return tally([], 'Git could not be run here.')
  }
}
