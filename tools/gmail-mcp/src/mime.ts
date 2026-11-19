import { extname } from 'node:path'

export interface MimeFile {
  name: string
  contentType: string
  data: Uint8Array
}

export interface Outgoing {
  from: string
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  body: string
  files: MimeFile[]
  inReplyTo?: string
  references?: string
}

export const CONTENT_TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  pdf: 'application/pdf',
  txt: 'text/plain',
  csv: 'text/csv',
  html: 'text/html',
  json: 'application/json',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  zip: 'application/zip',
}

export function contentTypeOf(fileName: string): string {
  return CONTENT_TYPES[extname(fileName).slice(1).toLowerCase()] ?? 'application/octet-stream'
}

const ADDRESS = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$/

export function validAddress(address: string): boolean {
  return address.length <= 254 && ADDRESS.test(address)
}

const encoder = new TextEncoder()

export function toBase64(data: Uint8Array): string {
  return Buffer.from(data).toString('base64')
}

export function toBase64Url(data: Uint8Array): string {
  return Buffer.from(data).toString('base64url')
}

export function fromBase64Url(text: string): Uint8Array {
  return new Uint8Array(Buffer.from(text, 'base64url'))
}

function wrap76(b64: string): string {
  return (b64.match(/.{1,76}/g) ?? []).join('\r\n')
}

export function crlf(text: string): string {
  return text.replace(/\r\n|\r|\n/g, '\r\n')
}

export function encodedWord(text: string): string {
  if (/^[\x20-\x7e]*$/.test(text)) return text
  const words: string[] = []
  let current = ''
  let bytes = 0
  for (const ch of text) {
    const size = encoder.encode(ch).byteLength
    if (bytes + size > 45) {
      words.push(current)
      current = ''
      bytes = 0
    }
    current += ch
    bytes += size
  }
  if (current) words.push(current)
  return words.map((w) => `=?UTF-8?B?${toBase64(encoder.encode(w))}?=`).join('\r\n ')
}

function percentEncode(text: string): string {
  return Array.from(encoder.encode(text), (b) => (/[A-Za-z0-9.\-_~]/.test(String.fromCharCode(b)) ? String.fromCharCode(b) : `%${b.toString(16).toUpperCase().padStart(2, '0')}`)).join('')
}

function quoted(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
}

function fileDisposition(name: string): string {
  const ascii = name.replace(/[^\x20-\x7e]/g, '_')
  const plain = `filename="${quoted(ascii)}"`
  return ascii === name ? plain : `${plain}; filename*=UTF-8''${percentEncode(name)}`
}

function nameParam(name: string): string {
  return `name="${quoted(name.replace(/[^\x20-\x7e]/g, '_'))}"`
}

export function rfc2822Date(at: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const p = (n: number) => String(n).padStart(2, '0')
  return `${days[at.getUTCDay()]}, ${p(at.getUTCDate())} ${months[at.getUTCMonth()]} ${at.getUTCFullYear()} ${p(at.getUTCHours())}:${p(at.getUTCMinutes())}:${p(at.getUTCSeconds())} +0000`
}

function foldHeader(name: string, items: string[], separator = ''): string {
  const lines: string[] = []
  let line = `${name}:`
  items.forEach((item, i) => {
    const token = i < items.length - 1 ? `${item}${separator}` : item
    if (i > 0 && line.length + 1 + token.length > 76) {
      lines.push(line)
      line = ` ${token}`
    } else {
      line += ` ${token}`
    }
  })
  lines.push(line)
  return lines.join('\r\n')
}

function idTokens(value: string | undefined): string[] {
  return (value ?? '').split(/\s+/).filter(Boolean)
}

export function buildMime(m: Outgoing, now: Date = new Date(), boundary = `gmail-mcp-${crypto.randomUUID()}`): Uint8Array {
  const headers = [`From: ${m.from}`, foldHeader('To', m.to, ',')]
  if (m.cc.length) headers.push(foldHeader('Cc', m.cc, ','))
  if (m.bcc.length) headers.push(foldHeader('Bcc', m.bcc, ','))
  headers.push(`Subject: ${encodedWord(m.subject)}`, `Date: ${rfc2822Date(now)}`, 'MIME-Version: 1.0')
  const inReplyTo = idTokens(m.inReplyTo)
  const references = idTokens(m.references)
  if (inReplyTo.length) headers.push(foldHeader('In-Reply-To', inReplyTo))
  if (references.length) headers.push(foldHeader('References', references))

  const textPart = ['Content-Type: text/plain; charset=UTF-8', 'Content-Transfer-Encoding: base64', '', wrap76(toBase64(encoder.encode(crlf(m.body))))].join('\r\n')

  if (!m.files.length) return encoder.encode(`${[...headers, textPart].join('\r\n')}\r\n`)

  const parts = [`--${boundary}\r\n${textPart}\r\n`]
  for (const f of m.files) {
    parts.push(
      `--${boundary}\r\n${[
        `Content-Type: ${f.contentType}; ${nameParam(f.name)}`,
        `Content-Disposition: attachment; ${fileDisposition(f.name)}`,
        'Content-Transfer-Encoding: base64',
        '',
        wrap76(toBase64(f.data)),
      ].join('\r\n')}\r\n`,
    )
  }
  parts.push(`--${boundary}--\r\n`)
  return encoder.encode(`${[...headers, `Content-Type: multipart/mixed; boundary="${boundary}"`, ''].join('\r\n')}\r\n${parts.join('')}`)
}

export function replySubject(original: string, given: string | undefined): string {
  if (given !== undefined && given.trim()) return given.trim()
  const base = original.trim()
  return /^re:\s*/i.test(base) ? base : `Re: ${base}`
}

export function forwardSubject(original: string, given: string | undefined): string {
  if (given !== undefined && given.trim()) return given.trim()
  const base = original.trim() || '(no subject)'
  return /^(fwd?)\s*:\s*/i.test(base) ? base : `Fwd: ${base}`
}

export function baseSubject(subject: string): string {
  return subject.replace(/^\s*((re|fwd?)\s*:\s*)+/i, '').trim().toLowerCase()
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '-', mdash: '-', hellip: '...', rsquo: "'", lsquo: "'", rdquo: '"', ldquo: '"', copy: '(c)' }

export function htmlToText(html: string): string {
  return html
    .replace(/<(script|style|head)[\s\S]*?<\/\1>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|tr|h[1-6]|li|table|blockquote)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/t[dh]>/gi, '\t')
    .replace(/<[^>]+>/g, '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (whole, name: string) => {
      if (name[0] === '#') {
        const code = name[1]?.toLowerCase() === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10)
        return Number.isFinite(code) && code > 0 && code < 0x110000 ? String.fromCodePoint(code) : whole
      }
      return ENTITIES[name.toLowerCase()] ?? whole
    })
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
