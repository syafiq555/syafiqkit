const KL_OFFSET = '+08:00'

const klFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Asia/Kuala_Lumpur',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export function klTime(iso: string | undefined): string {
  if (!iso) return '-'
  const parts = Object.fromEntries(klFormat.formatToParts(new Date(iso)).map((p) => [p.type, p.value]))
  return `${parts.day}/${parts.month}/${parts.year} ${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`
}

export function parseWhen(input: string, now: Date = new Date()): string {
  const s = input.trim()
  const ago = s.match(/^(\d+)\s*([dhw])$/i)
  if (ago) {
    const unit = { d: 86_400_000, h: 3_600_000, w: 604_800_000 }[ago[2]!.toLowerCase() as 'd' | 'h' | 'w']
    return new Date(now.getTime() - Number(ago[1]) * unit).toISOString()
  }
  const unreadable = new Error(`Can't read the date "${input}". Use 7d, 12h, 2w, 13/11/2026, 2026-11-13 or an ISO timestamp with an offset.`)
  const dmy = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  const ymd = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  const parts = dmy ? [dmy[3]!, dmy[2]!, dmy[1]!] : ymd ? [ymd[1]!, ymd[2]!, ymd[3]!] : null
  if (parts) {
    const [y, m, d] = parts.map(Number) as [number, number, number]
    const check = new Date(Date.UTC(y, m - 1, d))
    if (check.getUTCFullYear() !== y || check.getUTCMonth() !== m - 1 || check.getUTCDate() !== d) throw unreadable
    return new Date(`${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}T00:00:00${KL_OFFSET}`).toISOString()
  }
  if (!/^\d{4}-\d{2}-\d{2}T.+(Z|[+-]\d{2}:?\d{2})$/i.test(s)) throw unreadable
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) throw unreadable
  return d.toISOString()
}

export function terms(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(/"([^"]+)"|(\S+)/g)) out.push((m[1] ?? m[2]!).toLowerCase())
  return out
}

export function matchesAll(haystack: string, needles: string[]): boolean {
  const h = haystack.toLowerCase()
  return needles.every((n) => h.includes(n))
}

export function count(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? '' : 's'}`
}

export interface PreviewSpace {
  spaceType?: string
  membershipCount?: { joinedDirectHumanUserCount?: number }
}

function audience(space: PreviewSpace): string {
  if (space.spaceType === 'DIRECT_MESSAGE') return 'DM'
  const people = space.membershipCount?.joinedDirectHumanUserCount
  const kind = space.spaceType === 'GROUP_CHAT' ? 'group chat' : 'space'
  return people ? `${kind}, ${count(people, 'person').replace('persons', 'people')}` : kind
}

export function fileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function sendPreview(p: {
  to: string
  space: PreviewSpace
  thread: boolean
  body: string
  last: { who: string; at?: string } | null
  files?: { name: string; bytes: number }[]
}): string {
  const files = p.files ?? []
  const size = p.body ? `${count(p.body.split('\n').length, 'line')}, ${count(p.body.length, 'char')}.` : 'No text.'
  const attached = files.length ? ` With ${count(files.length, 'file')}: ${files.map((f) => `${f.name} (${fileSize(f.bytes)})`).join(', ')}.` : ''
  const where = p.thread ? ', as a reply in a thread' : p.space.spaceType === 'SPACE' ? ', as a new top-level message' : ''
  return `Send as you to ${p.to} [${audience(p.space)}]${where}. ${size}${attached}${p.last ? ` Last message there: ${p.last.who}, ${klTime(p.last.at)}.` : ''}`
}

export interface Attachment {
  name?: string
  contentName?: string
  contentType?: string
  source?: 'UPLOADED_CONTENT' | 'DRIVE_FILE' | string
  attachmentDataRef?: { resourceName?: string }
  driveDataRef?: { driveFileId?: string }
}

export function safeFileName(name: string | undefined, index: number): string {
  const base = (name ?? '').split(/[\\/]/).pop() ?? ''
  const cleaned = base.replace(/[\x00-\x1f<>:"|?*]/g, '_').replace(/^\.+/, '').trim()
  return cleaned || `attachment-${index + 1}`
}

export interface ChatMessage {
  name?: string
  createTime?: string
  text?: string
  sender?: { name?: string; displayName?: string; type?: string }
  thread?: { name?: string }
  threadReply?: boolean
  attachment?: Attachment[]
  quotedMessageMetadata?: { name?: string }
  deletionMetadata?: unknown
  cardsV2?: { card?: { header?: { title?: string } } }[]
}

function body(m: ChatMessage, hasFiles: boolean): string {
  if (m.deletionMetadata) return '(deleted)'
  const text = (m.text ?? '').trim()
  if (text) return text
  const card = m.cardsV2?.[0]?.card?.header?.title
  if (m.cardsV2?.length) return card ? `(card: ${card})` : '(card message)'
  return hasFiles ? '' : '(no text)'
}

export function messageLine(m: ChatMessage, who: string): string {
  const files = (m.attachment ?? []).map((a) => a.contentName).filter(Boolean)
  const head = `[${klTime(m.createTime)}] ${who}${m.threadReply ? ' (in thread)' : ''}${m.quotedMessageMetadata ? ' (quoting an earlier message)' : ''}: ${body(m, files.length > 0)}`
  const tail = [files.length ? `files: ${files.join(', ')}` : '', files.length && m.name ? `message: ${m.name}` : '', `thread: ${m.thread?.name ?? '-'}`]
    .filter(Boolean)
    .join(' · ')
  return `${head}\n    ${tail}`
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
