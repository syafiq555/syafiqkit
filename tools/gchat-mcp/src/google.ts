import type { TokenSource } from './auth.ts'

export const CHAT = 'https://chat.googleapis.com/v1'
export const CHAT_UPLOAD = 'https://chat.googleapis.com/upload/v1'
export const PEOPLE = 'https://people.googleapis.com/v1'

type Fetch = (input: string, init?: RequestInit) => Promise<Response>

export class Google {
  constructor(
    private readonly tokens: TokenSource,
    private readonly fetcher: Fetch = fetch,
    private readonly timeoutMs = { call: 30_000, transfer: 180_000 },
  ) {}

  async call(method: string, url: string, body?: unknown): Promise<any> {
    const json = body === undefined ? undefined : JSON.stringify(body)
    return this.parse(
      await this.retrying((force) => this.send(method, url, force, this.timeoutMs.call, json === undefined ? undefined : 'application/json', json)),
    )
  }

  async bytes(url: string, maxBytes: number): Promise<{ data: Uint8Array; contentType: string | null }> {
    const res = await this.retrying((force) => this.send('GET', url, force, this.timeoutMs.transfer))
    if (!res.ok) throw apiError(res.status, await res.text())
    const declared = Number(res.headers.get('content-length') ?? 0)
    if (declared > maxBytes) throw new Error(`File is ${declared} bytes, over the ${limitLabel(maxBytes)} limit`)
    const chunks: Uint8Array[] = []
    let total = 0
    const reader = res.body?.getReader()
    if (reader) {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > maxBytes) {
          await reader.cancel()
          throw new Error(`File is over the ${limitLabel(maxBytes)} limit`)
        }
        chunks.push(value)
      }
    }
    const data = new Uint8Array(total)
    let offset = 0
    for (const c of chunks) {
      data.set(c, offset)
      offset += c.byteLength
    }
    return { data, contentType: res.headers.get('content-type') }
  }

  async upload(url: string, metadata: unknown, data: Uint8Array, contentType: string): Promise<any> {
    const boundary = `gchat-${crypto.randomUUID()}`
    const head = new TextEncoder().encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`,
    )
    const tail = new TextEncoder().encode(`\r\n--${boundary}--\r\n`)
    const payload = new Uint8Array(head.byteLength + data.byteLength + tail.byteLength)
    payload.set(head, 0)
    payload.set(data, head.byteLength)
    payload.set(tail, head.byteLength + data.byteLength)
    return this.parse(await this.retrying((force) => this.send('POST', url, force, this.timeoutMs.transfer, `multipart/related; boundary=${boundary}`, payload)))
  }

  private async retrying(attempt: (force: boolean) => Promise<Response>): Promise<Response> {
    const res = await attempt(false)
    return res.status === 401 ? attempt(true) : res
  }

  private async parse(res: Response): Promise<any> {
    const text = await res.text()
    if (!res.ok) throw apiError(res.status, text)
    return text ? safeJson(text) : {}
  }

  private async send(method: string, url: string, force: boolean, timeoutMs: number, contentType?: string, body?: RequestInit['body']): Promise<Response> {
    const headers: Record<string, string> = { Authorization: `Bearer ${await this.tokens.get(force)}` }
    if (contentType) headers['Content-Type'] = contentType
    try {
      return await this.fetcher(url, { method, headers, body, signal: AbortSignal.timeout(timeoutMs) })
    } catch (err) {
      if ((err as Error)?.name === 'TimeoutError') throw new Error(`No answer from Google within ${Math.round(timeoutMs / 1000)} s`)
      throw err
    }
  }
}

function limitLabel(bytes: number): string {
  const mb = 1024 * 1024
  return bytes % mb === 0 ? `${bytes / mb} MB` : `${bytes}-byte`
}

function apiError(status: number, text: string): Error {
  const parsed = text ? safeJson(text) : {}
  return new Error(`Google API ${status}: ${hint(parsed?.error?.message || text || `HTTP ${status}`)}`)
}

function hint(message: string): string {
  if (/Chat app not found|configure the app/i.test(message)) {
    return `${message} (fill in the Google Chat API "Configuration" page of the OAuth client's Cloud project: app name, avatar URL, description; leave interactive features off)`
  }
  if (/has not been used in project|is disabled/i.test(message)) return `${message} (enable that API in the OAuth client's Cloud project)`
  return message
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

export function query(params: Record<string, string | number | boolean | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) if (v !== undefined) q.append(k, String(v))
  const s = q.toString()
  return s ? `?${s}` : ''
}
