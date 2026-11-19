import { fromBase64Url, htmlToText } from './mime.ts'
import { zoneParts } from './zone.ts'

export interface Part {
  mimeType?: string
  filename?: string
  headers?: { name: string; value: string }[]
  body?: { size?: number; data?: string; attachmentId?: string }
  parts?: Part[]
}

export interface GmailMessage {
  id?: string
  threadId?: string
  snippet?: string
  internalDate?: string
  payload?: Part
}

export interface AttachmentInfo {
  name: string
  mimeType: string
  size: number
  attachmentId: string
}

function formatLocal(at: Date): string {
  const parts = zoneParts(at)
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour}:${parts.minute}`
}

export function localTime(iso: string | undefined): string {
  return iso ? formatLocal(new Date(iso)) : '-'
}

export function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function safeFileName(name: string | undefined, index: number): string {
  const base = (name ?? '').split(/[\\/]/).pop() ?? ''
  const cleaned = base.replace(/[\x00-\x1f<>:"|?*]/g, '_').replace(/^\.+/, '').trim()
  return cleaned || `attachment-${index + 1}`
}

export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i]!)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

function partHeader(part: Part | undefined, name: string): string {
  const wanted = name.toLowerCase()
  return (part?.headers ?? []).find((h) => h.name.toLowerCase() === wanted)?.value.trim() ?? ''
}

export function header(m: GmailMessage, name: string): string {
  return partHeader(m.payload, name)
}

export function oneLine(text: string): string {
  return text.replace(/\s+/g, ' ').trim()
}

export function sentAt(m: GmailMessage): string {
  if (m.internalDate && /^\d+$/.test(m.internalDate)) return formatLocal(new Date(Number(m.internalDate)))
  const parsed = new Date(header(m, 'Date'))
  return Number.isNaN(parsed.getTime()) ? header(m, 'Date') || '-' : formatLocal(parsed)
}

function walk(part: Part | undefined, visit: (p: Part) => void): void {
  if (!part) return
  visit(part)
  for (const child of part.parts ?? []) walk(child, visit)
}

export function attachmentsOf(m: GmailMessage): AttachmentInfo[] {
  const out: AttachmentInfo[] = []
  walk(m.payload, (p) => {
    if (p.filename && p.body?.attachmentId) out.push({ name: p.filename, mimeType: p.mimeType ?? 'application/octet-stream', size: p.body.size ?? 0, attachmentId: p.body.attachmentId })
  })
  return out
}

function charsetOf(part: Part): string {
  return /charset\s*=\s*"?([^";\s]+)/i.exec(partHeader(part, 'content-type'))?.[1]?.toLowerCase() ?? 'utf-8'
}

function decode(part: Part): string {
  const data = part.body?.data
  if (!data) return ''
  const bytes = fromBase64Url(data)
  try {
    return new TextDecoder(charsetOf(part) as 'utf-8').decode(bytes)
  } catch {
    return new TextDecoder('utf-8').decode(bytes)
  }
}

export function bodyText(m: GmailMessage): string {
  let plain = ''
  let html = ''
  walk(m.payload, (p) => {
    if (p.filename) return
    if (p.mimeType === 'text/plain' && !plain) plain = decode(p)
    else if (p.mimeType === 'text/html' && !html) html = decode(p)
  })
  if (plain.trim()) return plain.replace(/\r\n/g, '\n').trim()
  if (html.trim()) return htmlToText(html)
  return ''
}

export function searchLine(m: GmailMessage): string {
  const files = attachmentsOf(m).length
  return [
    `[${sentAt(m)}]`,
    `from: ${oneLine(header(m, 'From')) || '-'}`,
    `subject: ${oneLine(header(m, 'Subject')) || '(no subject)'}`,
    `snippet: ${oneLine(m.snippet ?? '').slice(0, 140)}`,
    `id: ${m.id ?? '-'}`,
    `thread: ${m.threadId ?? '-'}`,
    `files: ${files}`,
  ].join(' · ')
}

export interface ReadOptions {
  maxBody: number
}

export function readBlock(m: GmailMessage, opts: ReadOptions): string {
  const files = attachmentsOf(m)
  const full = bodyText(m)
  const cut = full.length > opts.maxBody
  const lines = [
    `== message: ${m.id ?? '-'} · thread: ${m.threadId ?? '-'}`,
    `From: ${oneLine(header(m, 'From')) || '-'}`,
    `To: ${oneLine(header(m, 'To')) || '-'}`,
  ]
  const cc = oneLine(header(m, 'Cc'))
  if (cc) lines.push(`Cc: ${cc}`)
  lines.push(`Date: ${sentAt(m)}`, `Subject: ${oneLine(header(m, 'Subject')) || '(no subject)'}`, `Message-ID: ${header(m, 'Message-ID') || '-'}`)
  if (files.length) lines.push(`Attachments: ${files.map((f) => `${f.name} (${fileSize(f.size)}, attachmentId: ${f.attachmentId})`).join('; ')}`)
  lines.push('', full ? full.slice(0, opts.maxBody) : '(no text body)')
  if (cut) lines.push(`[body truncated: ${full.length - opts.maxBody} more characters not shown]`)
  return lines.join('\n')
}
