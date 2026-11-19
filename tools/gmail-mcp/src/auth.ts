import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
]

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const REFRESH_MARGIN_MS = 60_000
const TOKEN_TIMEOUT_MS = 30_000

export function configDir(): string {
  return process.env.GMAIL_CONFIG_DIR || join(homedir(), '.config', 'syafiqkit', 'google-gmail')
}

const sheetsClientPath = () => join(homedir(), '.config', 'syafiqkit', 'google', 'client.json')
export const clientPath = () => join(configDir(), 'client.json')
export const refreshPath = () => join(configDir(), 'refresh.json')

export interface ClientCreds {
  clientId: string
  clientSecret: string
}

export function readClient(path = clientPath()): ClientCreds {
  if (!existsSync(path)) {
    const reuse = existsSync(sheetsClientPath()) ? 'gmail-mcp auth (it reuses the Sheets tool\'s client)' : 'gmail-mcp auth --client <Desktop-app client.json> (the /setup-tools skill walks through making one)'
    throw new Error(`gmail: no OAuth client at ${path}. Run: ${reuse}`)
  }
  const raw = JSON.parse(readFileSync(path, 'utf8'))
  const d = raw.installed ?? raw.web ?? raw
  if (!d.client_id || !d.client_secret) throw new Error(`gmail: ${path} has no client_id/client_secret`)
  return { clientId: d.client_id, clientSecret: d.client_secret }
}

export function readRefreshToken(path = refreshPath()): string {
  if (!existsSync(path)) throw new Error(`gmail: not signed in (no ${path}). Run: gmail-mcp auth`)
  const token = JSON.parse(readFileSync(path, 'utf8')).refresh_token
  if (!token) throw new Error(`gmail: ${path} holds no refresh_token. Run: gmail-mcp auth`)
  return token
}

export function grantedScopesMatch(granted: string): boolean {
  const got = new Set(granted.split(/\s+/).filter(Boolean))
  return got.size === SCOPES.length && SCOPES.every((s) => got.has(s))
}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>

function writePrivate(path: string, data: string | Uint8Array): void {
  writeFileSync(path, data, { mode: 0o600 })
  chmodSync(path, 0o600)
}

async function postToken(fetcher: Fetch, form: Record<string, string>): Promise<any> {
  let res: Response
  try {
    res = await fetcher(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(TOKEN_TIMEOUT_MS),
    })
  } catch (err) {
    throw new Error(`gmail: could not get a token from Google (${(err as Error)?.name === 'TimeoutError' ? `no answer within ${TOKEN_TIMEOUT_MS / 1000} s` : (err as Error).message}). Nothing was sent.`)
  }
  const body: any = await res.json().catch(() => ({}))
  if (!res.ok) {
    const reason = body.error_description || body.error || `HTTP ${res.status}`
    throw new Error(`gmail: Google refused the token request (${reason}). If the sign-in was revoked, run: gmail-mcp auth`)
  }
  return body
}

export class TokenSource {
  private token: string | null = null
  private expiresAt = 0

  constructor(
    private readonly fetcher: Fetch = fetch,
    private readonly now: () => number = Date.now,
    private readonly creds: () => ClientCreds = () => readClient(),
    private readonly refreshToken: () => string = () => readRefreshToken(),
  ) {}

  async get(force = false): Promise<string> {
    if (!force && this.token && this.now() < this.expiresAt - REFRESH_MARGIN_MS) return this.token
    const { clientId, clientSecret } = this.creds()
    const body = await postToken(this.fetcher, {
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: this.refreshToken(),
      grant_type: 'refresh_token',
    })
    this.token = body.access_token
    this.expiresAt = this.now() + (Number(body.expires_in) || 3600) * 1000
    return this.token!
  }
}

export function storeGrant(body: { scope?: string; refresh_token?: string }): void {
  if (!grantedScopesMatch(body.scope || '')) {
    throw new Error(`gmail: Google granted "${body.scope}", expected exactly ${SCOPES.join(' ')}. Nothing was stored.`)
  }
  if (!body.refresh_token) throw new Error('gmail: Google returned no refresh token. Nothing was stored.')
  mkdirSync(configDir(), { recursive: true, mode: 0o700 })
  writePrivate(refreshPath(), JSON.stringify({ refresh_token: body.refresh_token }))
}

const page = (heading: string) => new Response(`<h2>${heading}</h2>`, { headers: { 'Content-Type': 'text/html' } })

export async function consent(clientFile?: string): Promise<void> {
  const dir = configDir()
  mkdirSync(dir, { recursive: true, mode: 0o700 })
  chmodSync(dir, 0o700)
  const source = clientFile ?? (!existsSync(clientPath()) && existsSync(sheetsClientPath()) ? sheetsClientPath() : undefined)
  if (source) writePrivate(clientPath(), readFileSync(source))
  const { clientId, clientSecret } = readClient()
  const state = crypto.randomUUID()

  let resolveCode!: (code: string) => void
  let rejectCode!: (err: Error) => void
  const codePromise = new Promise<string>((res, rej) => {
    resolveCode = res
    rejectCode = rej
  })

  const server = Bun.serve({
    hostname: '127.0.0.1',
    port: 0,
    fetch(req) {
      const q = new URL(req.url).searchParams
      if (q.get('state') !== state) return new Response('Not found', { status: 404 })
      if (q.get('code')) {
        resolveCode(q.get('code')!)
        return page('Signed in. You can close this tab.')
      }
      rejectCode(new Error(`gmail: sign-in failed (${q.get('error') || 'no code returned'})`))
      return page('Sign-in failed.')
    },
  })

  const redirect = `http://127.0.0.1:${server.port}`
  const url =
    'https://accounts.google.com/o/oauth2/v2/auth?' +
    new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirect,
      response_type: 'code',
      scope: SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    }).toString()

  console.error(`\nGrant ONLY these:\n  ${SCOPES.join('\n  ')}\nReading your mail and sending mail as you are expected; if the consent screen lists anything else (Calendar, Drive, deleting or changing mail), deny it.\n\n${url}\n`)
  try {
    Bun.spawn([process.platform === 'darwin' ? 'open' : 'xdg-open', url], { stdout: 'ignore', stderr: 'ignore' })
  } catch {
    console.error('Open the link above in your browser.')
  }

  const timeout = setTimeout(() => rejectCode(new Error('gmail: sign-in timed out after 5 minutes. Run auth again.')), 5 * 60_000)
  try {
    const code = await codePromise
    const body = await postToken(fetch, {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirect,
      grant_type: 'authorization_code',
    })
    storeGrant(body)
    console.error(`Signed in. Refresh token stored at ${refreshPath()}`)
  } finally {
    clearTimeout(timeout)
    server.stop(true)
  }
}
