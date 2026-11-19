import { GMAIL, GMAIL_UPLOAD, Google, query } from './google.ts'
import { mapLimit, type GmailMessage } from './format.ts'
import { toBase64Url, fromBase64Url } from './mime.ts'

export const JSON_SEND_LIMIT_BYTES = 4 * 1024 * 1024

function partFields(depth: number): string {
  const own = 'filename,mimeType,body(attachmentId,size)'
  return depth === 0 ? own : `${own},parts(${partFields(depth - 1)})`
}

const SUMMARY_FIELDS = `id,threadId,snippet,internalDate,payload(headers,${partFields(5)})`
const ID = /^[A-Za-z0-9_-]+$/
const ATTACHMENT_ID = /^[A-Za-z0-9_\-.]+$/

export interface SearchResult {
  messages: GmailMessage[]
  more: boolean
}

export interface SentMessage {
  id?: string
  threadId?: string
}

function checked(id: string, pattern: RegExp, what: string): string {
  if (!pattern.test(id)) throw new Error(`gmail: unexpected ${what} "${id}"`)
  return id
}

export class Gmail {
  private me: Promise<string> | null = null

  constructor(private readonly g: Google) {}

  address(): Promise<string> {
    if (!this.me) {
      const attempt = this.g.call('GET', `${GMAIL}/profile`).then((p) => {
        if (!p?.emailAddress) throw new Error('Gmail did not say which address is signed in')
        return String(p.emailAddress)
      })
      this.me = attempt
      attempt.catch(() => {
        if (this.me === attempt) this.me = null
      })
    }
    return this.me
  }

  private async list(q: string, max: number): Promise<{ refs: { id: string }[]; more: boolean }> {
    const page = await this.g.call('GET', `${GMAIL}/messages${query({ q, maxResults: max })}`)
    return { refs: page.messages ?? [], more: !!page.nextPageToken }
  }

  async countMatching(q: string, cap: number): Promise<{ count: number; more: boolean }> {
    const { refs, more } = await this.list(q, cap)
    return { count: refs.length, more }
  }

  async search(q: string, max: number): Promise<SearchResult> {
    const { refs, more } = await this.list(q, max)
    const messages = await mapLimit(refs, 6, (r) => this.g.call('GET', `${GMAIL}/messages/${checked(r.id, ID, 'message id')}${query({ format: 'full', fields: SUMMARY_FIELDS })}`))
    return { messages, more }
  }

  async message(id: string): Promise<GmailMessage> {
    return this.g.call('GET', `${GMAIL}/messages/${checked(id, ID, 'message id')}${query({ format: 'full' })}`)
  }

  async thread(id: string): Promise<GmailMessage[]> {
    const t = await this.g.call('GET', `${GMAIL}/threads/${checked(id, ID, 'thread id')}${query({ format: 'full' })}`)
    const messages: GmailMessage[] = t.messages ?? []
    return messages.sort((a, b) => Number(a.internalDate ?? 0) - Number(b.internalDate ?? 0))
  }

  async attachment(messageId: string, attachmentId: string): Promise<Uint8Array> {
    const res = await this.g.call('GET', `${GMAIL}/messages/${checked(messageId, ID, 'message id')}/attachments/${checked(attachmentId, ATTACHMENT_ID, 'attachment id')}`, undefined, 'transfer')
    if (typeof res?.data !== 'string') throw new Error('Gmail returned no attachment data')
    return fromBase64Url(res.data)
  }

  async send(mime: Uint8Array, threadId?: string): Promise<SentMessage> {
    if (mime.byteLength <= JSON_SEND_LIMIT_BYTES) {
      return this.g.call('POST', `${GMAIL}/messages/send`, { raw: toBase64Url(mime), ...(threadId ? { threadId } : {}) })
    }
    return this.g.upload(`${GMAIL_UPLOAD}/messages/send${query({ uploadType: 'multipart' })}`, threadId ? { threadId } : {}, mime, 'message/rfc822')
  }
}
