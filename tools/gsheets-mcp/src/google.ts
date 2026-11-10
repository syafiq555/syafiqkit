import type { TokenSource } from './auth.ts'

export const SHEETS = 'https://sheets.googleapis.com/v4/spreadsheets'
export const DRIVE = 'https://www.googleapis.com/drive/v3/files'
export const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3/files'
export const SLIDES = 'https://slides.googleapis.com/v1/presentations'

type Fetch = (input: string, init?: RequestInit) => Promise<Response>

export interface CallOptions {
  body?: unknown
  rawBody?: RequestInit["body"]
  contentType?: string
}

export class Google {
  constructor(
    private readonly tokens: TokenSource,
    private readonly fetcher: Fetch = fetch,
  ) {}

  async call(method: string, url: string, opts: CallOptions = {}): Promise<any> {
    const res = await this.sendRetrying(method, url, opts)
    const text = await res.text()
    const body = text ? safeJson(text) : {}
    if (!res.ok) throw apiError(res.status, body, text)
    return body
  }

  async bytes(url: string): Promise<Uint8Array> {
    const res = await this.sendRetrying('GET', url, {})
    if (!res.ok) {
      const text = await res.text()
      throw apiError(res.status, safeJson(text), text)
    }
    return new Uint8Array(await res.arrayBuffer())
  }

  async download(url: string): Promise<Uint8Array> {
    const res = await this.fetcher(url)
    if (!res.ok) throw new Error(`Download ${res.status} from ${new URL(url).host}`)
    return new Uint8Array(await res.arrayBuffer())
  }

  private async sendRetrying(method: string, url: string, opts: CallOptions): Promise<Response> {
    const res = await this.send(method, url, opts, false)
    return res.status === 401 ? this.send(method, url, opts, true) : res
  }

  private async send(method: string, url: string, opts: CallOptions, force: boolean): Promise<Response> {
    const token = await this.tokens.get(force)
    const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
    let body: RequestInit["body"] | undefined
    if (opts.rawBody !== undefined) {
      body = opts.rawBody
      if (opts.contentType) headers['Content-Type'] = opts.contentType
    } else if (opts.body !== undefined) {
      body = JSON.stringify(opts.body)
      headers['Content-Type'] = 'application/json'
    }
    return this.fetcher(url, { method, headers, body })
  }
}

function apiError(status: number, body: any, text: string): Error {
  return new Error(`Google API ${status}: ${body?.error?.message || text || `HTTP ${status}`}`)
}

function safeJson(text: string): any {
  try {
    return JSON.parse(text)
  } catch {
    return { raw: text }
  }
}

export function query(params: Record<string, string | boolean | number | string[] | undefined>): string {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    if (Array.isArray(v)) v.forEach((item) => q.append(k, item))
    else q.append(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}
