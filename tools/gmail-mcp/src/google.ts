import { expiredSignIn, type TokenSource } from './auth.ts'

export const GMAIL = 'https://gmail.googleapis.com/gmail/v1/users/me'
export const GMAIL_UPLOAD = 'https://gmail.googleapis.com/upload/gmail/v1/users/me'

type Fetch = (input: string, init?: RequestInit) => Promise<Response>

export class Google {
  constructor(
    private readonly tokens: TokenSource,
    private readonly fetcher: Fetch = fetch,
    private readonly timeoutMs = { call: 30_000, transfer: 180_000 },
  ) {}

  async call(method: string, url: string, body?: unknown, kind: 'call' | 'transfer' = 'call'): Promise<any> {
    const json = body === undefined ? undefined : JSON.stringify(body)
    return this.parse(
      await this.retrying((force) => this.send(method, url, force, this.timeoutMs[kind], json === undefined ? undefined : 'application/json', json)),
    )
  }

  async upload(url: string, metadata: unknown, data: Uint8Array, contentType: string): Promise<any> {
    const boundary = `gmail-${crypto.randomUUID()}`
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

function apiError(status: number, text: string): Error {
  const parsed = text ? safeJson(text) : {}
  if (status === 401) return new Error(`Google API 401: ${expiredSignIn()}. Google said: ${parsed?.error?.message || text || 'unauthorized'}`)
  return new Error(`Google API ${status}: ${hint(parsed?.error?.message || text || `HTTP ${status}`)}`)
}

function hint(message: string): string {
  if (/insufficient authentication scopes|insufficientPermissions/i.test(message)) return `${message} (the sign-in lacks a Gmail scope: run gmail-mcp auth again)`
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
