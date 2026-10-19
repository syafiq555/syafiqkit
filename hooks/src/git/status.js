import { messageOf } from '../core/format.js'
import { gitRun } from '../core/run.js'

export function parseStatus(stdout) {
  const parts = stdout.split('\0')
  const entries = []
  for (let at = 0; at < parts.length; at++) {
    const row = parts[at]
    if (row.length < 4 || row[2] !== ' ') continue
    const x = row[0]
    const y = row[1]
    const entry = { x, y, path: row.slice(3), orig: '' }
    if (x === 'R' || x === 'C' || y === 'R' || y === 'C') {
      entry.orig = parts[at + 1] || ''
      at++
    }
    entries.push(entry)
  }
  return entries
}

export function isConflict(entry) {
  return entry.x === 'U' || entry.y === 'U' || (entry.x === 'A' && entry.y === 'A') || (entry.x === 'D' && entry.y === 'D')
}

export function letterOf(entry, section) {
  if (isConflict(entry)) return 'C'
  const letter = section === 'staged' ? entry.x : entry.y
  return letter === '?' ? 'U' : letter
}

export function sectionEntries(entries, section) {
  return entries.filter((entry) => {
    if (section === 'staged') return !isConflict(entry) && entry.x !== ' ' && entry.x !== '?'
    return isConflict(entry) || entry.y !== ' '
  })
}

export const STATUS_COLOR = { M: 'yellow', A: 'green', U: 'green', D: 'red', R: 'cyan', C: 'red' }

export function splitFocus(focus) {
  const cut = focus.indexOf(':')
  return cut < 0 ? null : { plane: focus.slice(0, cut), path: focus.slice(cut + 1) }
}

export function entryInFocus(focus, plane, entry) {
  if (!focus) return true
  if (focus === plane + ':' || focus === plane + ':' + entry.path) return true
  return focus.endsWith('/') && focus.startsWith(plane + ':') && entry.path.startsWith(focus.slice(plane.length + 1))
}

export function numstatOf(raw) {
  const sizes = {}
  const at = raw.indexOf('\n')
  for (const row of (at < 0 ? '' : raw.slice(at + 1)).split('\0')) {
    const cut = row.split('\t')
    if (cut.length >= 3) sizes[cut.slice(2).join('\t')] = cut[0] + '/' + cut[1]
  }
  return sizes
}

export function signatureOf(entry, sizes) {
  return (sizes[entry.path] ? entry.x + entry.y + '|' + entry.orig + '|' + sizes[entry.path] : '')
}

export function nameOf(path) {
  return path.slice(path.lastIndexOf('/') + 1)
}

export function treeRows(entries, section, collapsed) {
  const root = { dirs: new Map(), files: [] }
  for (const entry of entries) {
    const parts = entry.path.split('/')
    let node = root
    for (const part of parts.slice(0, -1)) {
      if (!node.dirs.has(part)) node.dirs.set(part, { dirs: new Map(), files: [] })
      node = node.dirs.get(part)
    }
    node.files.push(entry)
  }
  const rows = []
  const countFiles = (node) => node.files.length + [...node.dirs.values()].reduce((sum, child) => sum + countFiles(child), 0)
  const walk = (node, prefix, depth) => {
    const names = [...node.dirs.keys()].sort()
    for (const name of names) {
      let child = node.dirs.get(name)
      let label = name
      let path = prefix ? prefix + '/' + name : name
      while (child.files.length === 0 && child.dirs.size === 1) {
        const [only] = [...child.dirs.keys()]
        label += '/' + only
        path += '/' + only
        child = child.dirs.get(only)
      }
      const key = 'dir:' + section + ':' + path
      rows.push({ kind: 'dir', key, label, depth, count: countFiles(child), open: !collapsed[key], dirPath: path + '/' })
      if (!collapsed[key]) walk(child, path, depth + 1)
    }
    for (const entry of [...node.files].sort((a, b) => a.path.localeCompare(b.path))) {
      rows.push({ kind: 'file', key: 'file:' + section + ':' + entry.path, entry, depth })
    }
  }
  walk(root, '', 0)
  return rows
}

export async function readStatus($, cwd, untracked) {
  try {
    const top = await gitRun($, ['git', 'rev-parse', '--show-toplevel'], { cwd })
    if (top.exitCode !== 0) return { repo: '', entries: [], hasHead: false, error: 'This folder is not a git repository.', raw: '' }
    const repo = top.stdout.trim()
    const status = await gitRun($,
      ['git', '--no-optional-locks', 'status', '--porcelain=v1', '-z', untracked ? '-uall' : '-uno'],
      { cwd: repo },
    )
    if (status.exitCode !== 0) return { repo, entries: [], hasHead: false, error: 'git status failed: ' + status.stderr.slice(0, 120), raw: '' }
    if (!untracked) return { repo, entries: parseStatus(status.stdout), hasHead: false, error: '', raw: status.stdout }
    const head = await gitRun($, ['git', 'rev-parse', '--verify', '-q', 'HEAD'], { cwd: repo })
    const hasHead = head.exitCode === 0
    const sizes = hasHead ? await gitRun($, ['git', '--no-optional-locks', 'diff', 'HEAD', '--numstat', '--no-renames', '-z'], { cwd: repo }) : null
    return {
      repo,
      entries: parseStatus(status.stdout),
      hasHead,
      error: '',
      raw: status.stdout + '\n' + (sizes && sizes.exitCode === 0 ? sizes.stdout : ''),
    }
  } catch (error) {
    return { repo: '', entries: [], hasHead: false, error: 'Could not run git: ' + messageOf(error).slice(0, 100), raw: '' }
  }
}
