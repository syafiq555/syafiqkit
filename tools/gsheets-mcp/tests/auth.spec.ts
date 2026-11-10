import { describe, expect, test } from 'bun:test'
import { TokenSource, grantedScopesMatch } from '../src/auth.ts'
import { Google } from '../src/google.ts'

const creds = () => ({ clientId: 'c', clientSecret: 's' })
const refresh = () => 'r'

function tokenServer() {
  let n = 0
  const fetcher = async () => {
    n += 1
    return new Response(JSON.stringify({ access_token: `t${n}`, expires_in: 3600 }))
  }
  return { fetcher, count: () => n }
}

describe('TokenSource', () => {
  test('caches until a minute before expiry, then refreshes', async () => {
    let now = 0
    const server = tokenServer()
    const source = new TokenSource(server.fetcher, () => now, creds, refresh)
    expect(await source.get()).toBe('t1')
    now = 3_500_000
    expect(await source.get()).toBe('t1')
    now = 3_545_000
    expect(await source.get()).toBe('t2')
    expect(server.count()).toBe(2)
  })

  test('explains a revoked sign-in', async () => {
    const fetcher = async () => new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }), { status: 400 })
    const source = new TokenSource(fetcher, Date.now, creds, refresh)
    await expect(source.get()).rejects.toThrow('gsheets-mcp auth')
  })
})

describe('Google.call', () => {
  test('refreshes once on 401 and retries', async () => {
    const server = tokenServer()
    const source = new TokenSource(server.fetcher, Date.now, creds, refresh)
    const seen: string[] = []
    const api = async (_url: string, init?: RequestInit) => {
      const auth = (init?.headers as Record<string, string>).Authorization!
      seen.push(auth)
      return auth === 'Bearer t1' ? new Response('{"error":{"message":"expired"}}', { status: 401 }) : new Response('{"ok":true}')
    }
    const g = new Google(source, api)
    expect(await g.call('GET', 'https://example.test')).toEqual({ ok: true })
    expect(seen).toEqual(['Bearer t1', 'Bearer t2'])
  })

  test('surfaces Google error messages', async () => {
    const source = new TokenSource(tokenServer().fetcher, Date.now, creds, refresh)
    const g = new Google(source, async () => new Response('{"error":{"message":"Unable to parse range"}}', { status: 400 }))
    await expect(g.call('GET', 'https://example.test')).rejects.toThrow('Google API 400: Unable to parse range')
  })
})

test('scope check is exact and order-free', () => {
  expect(grantedScopesMatch('https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets')).toBe(true)
  expect(grantedScopesMatch('https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/spreadsheets')).toBe(false)
  expect(grantedScopesMatch('https://www.googleapis.com/auth/spreadsheets')).toBe(false)
  expect(grantedScopesMatch('https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive')).toBe(false)
})
