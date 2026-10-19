import { SYNTAX_MAX_CHARS, SYNTAX_TONE } from '../core/constants.js'

export const SYNTAX_LANGS = {
  php: 'php',
  js: 'c',
  jsx: 'c',
  mjs: 'c',
  cjs: 'c',
  ts: 'c',
  tsx: 'c',
  vue: 'c',
  dart: 'c',
  java: 'c',
  kt: 'c',
  swift: 'c',
  go: 'c',
  rs: 'c',
  c: 'c',
  h: 'c',
  cpp: 'c',
  cs: 'c',
  json: 'c',
  css: 'css',
  scss: 'c',
  py: 'hash',
  rb: 'hash',
  sh: 'hash',
  bash: 'hash',
  zsh: 'hash',
  yml: 'hash',
  yaml: 'hash',
  md: 'md',
  mdx: 'md',
}

export const SYNTAX_KEYWORDS = new Set(
  (
    'abstract and as async await break case catch class const continue def default do echo elif else elseif enum export extends ' +
    'false final finally fn for foreach from function global if implements import in instanceof interface is lambda let match ' +
    'namespace new not null of or parent pass private protected public readonly return self static switch this throw trait true ' +
    'try type typeof use var void while with yield None True False undefined'
  ).split(' '),
)

export function syntaxLang(path) {
  if (/\.blade\.php$/i.test(path || '')) return null
  const found = /\.([A-Za-z0-9]+)$/.exec(path || '')
  return found ? SYNTAX_LANGS[found[1].toLowerCase()] || null : null
}

export function markdownTokens(text) {
  if (/^\s{0,3}#{1,6}\s/.test(text)) return [{ from: 0, to: text.length, tone: 'keyword' }]
  if (/^\s*(```|~~~)/.test(text)) return [{ from: 0, to: text.length, tone: 'comment' }]
  const tokens = []
  const marker = /^(\s*)([-*+]|\d+[.)])\s+(\[[ xX]\]\s)?/.exec(text)
  if (marker) tokens.push({ from: marker[1].length, to: marker[0].length, tone: 'number' })
  const inline = /`[^`]+`|\]\(([^)\s]+)\)/g
  let found
  while ((found = inline.exec(text))) {
    if (found.index < (marker ? marker[0].length : 0)) continue
    if (found[0][0] === '`') tokens.push({ from: found.index, to: found.index + found[0].length, tone: 'string' })
    else tokens.push({ from: found.index + 2, to: found.index + 2 + found[1].length, tone: 'call' })
  }
  return tokens
}

export function syntaxTokens(text, lang, inComment) {
  const tokens = []
  if (!lang || text.length > SYNTAX_MAX_CHARS) return { tokens, inComment: Boolean(inComment) }
  if (lang === 'md') return { tokens: markdownTokens(text), inComment: false }
  const push = (from, to, tone) => {
    if (to > from) tokens.push({ from, to, tone })
  }
  const slash = lang !== 'hash'
  let at = 0
  const openComment = inComment || (slash && lang !== 'css' && /^\s*\*(\/|$|\s+[^\s\d{(=*+\-/])/.test(text))
  if (openComment) {
    const end = text.indexOf('*/')
    if (end < 0) {
      push(0, text.length, 'comment')
      return { tokens, inComment: Boolean(inComment) }
    }
    push(0, end + 2, 'comment')
    at = end + 2
  }
  while (at < text.length) {
    const ch = text[at]
    if (slash && text.startsWith('/*', at)) {
      const end = text.indexOf('*/', at + 2)
      if (end < 0) {
        push(at, text.length, 'comment')
        return { tokens, inComment: true }
      }
      push(at, end + 2, 'comment')
      at = end + 2
      continue
    }
    const lineComment =
      (slash && lang !== 'css' && text.startsWith('//', at) && text[at - 1] !== ':') ||
      ((lang === 'hash' || lang === 'php') && ch === '#' && text[at + 1] !== '[')
    if (lineComment) {
      push(at, text.length, 'comment')
      break
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      let end = at + 1
      while (end < text.length && text[end] !== ch) end += text[end] === '\\' ? 2 : 1
      end = Math.min(end + 1, text.length)
      push(at, end, 'string')
      at = end
      continue
    }
    if (lang === 'php' && ch === '$' && /[A-Za-z_]/.test(text[at + 1] || '')) {
      at += /^\$\w+/.exec(text.slice(at))[0].length
      continue
    }
    if (/[0-9]/.test(ch) && !/[\w$]/.test(text[at - 1] || '')) {
      const number = /^[0-9][0-9a-fA-FxX_.]*/.exec(text.slice(at))[0]
      push(at, at + number.length, 'number')
      at += number.length
      continue
    }
    if (/[A-Za-z_]/.test(ch) && !/[\w$]/.test(text[at - 1] || '')) {
      const word = /^[A-Za-z_]\w*/.exec(text.slice(at))[0]
      const end = at + word.length
      const tone = SYNTAX_KEYWORDS.has(word) ? 'keyword' : /^\s*\(/.test(text.slice(end)) ? 'call' : /^[A-Z]/.test(word) ? 'type' : null
      if (tone) push(at, end, tone)
      at = end
      continue
    }
    at++
  }
  return { tokens, inComment: false }
}

export function syntaxSegments(length, tokens, span) {
  const cuts = new Set([0, length])
  for (const token of tokens) {
    cuts.add(token.from)
    cuts.add(token.to)
  }
  if (span) {
    cuts.add(Math.min(span[0], length))
    cuts.add(Math.min(span[1], length))
  }
  const points = [...cuts].sort((a, b) => a - b)
  const segments = []
  let next = 0
  for (let i = 0; i < points.length - 1; i++) {
    const from = points[i]
    const to = points[i + 1]
    while (next < tokens.length && tokens[next].to <= from) next++
    const token = next < tokens.length && tokens[next].from <= from && tokens[next].to >= to ? tokens[next] : null
    const tone = token ? token.tone : null
    const mark = Boolean(span) && from >= span[0] && to <= span[1]
    const last = segments[segments.length - 1]
    if (last && last.tone === tone && last.mark === mark) last.to = to
    else segments.push({ from, to, tone, mark })
  }
  return segments
}

export function syntaxSegmentStyle(segment, wordColor) {
  return ({
  ...(segment.tone ? { color: SYNTAX_TONE[segment.tone] } : {}),
  ...(segment.mark ? { backgroundColor: wordColor } : {}),
})
}

export function highlightLines(lines, path) {
  const lang = syntaxLang(path)
  const side = { old: false, now: false }
  return lines.map((line) => {
    if (line.kind === 'gap') {
      side.old = false
      side.now = false
      return []
    }
    const result = syntaxTokens(line.text, lang, line.kind === 'del' ? side.old : side.now)
    if (line.kind !== 'add') side.old = result.inComment
    if (line.kind !== 'del') side.now = result.inComment
    return result.tokens
  })
}
