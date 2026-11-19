import { describe, expect, test } from 'bun:test'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync, utimesSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { pruneDownloads } from '../src/tools.ts'
import { b64u, connect, ORIGINAL } from './helpers.ts'

const REPLY = { ...ORIGINAL, id: 'm101', internalDate: String(Date.parse('2026-11-18T04:00:00Z')), snippet: 'Confirmed', payload: { ...ORIGINAL.payload!, body: { data: b64u('Confirmed, thanks') }, headers: ORIGINAL.payload!.headers!.map((h) => (h.name === 'Message-ID' ? { ...h, value: '<reply@tsb.test>' } : h)) } }
const WITH_FILE = {
  id: 'm400',
  threadId: 't400',
  payload: {
    mimeType: 'multipart/mixed',
    headers: [{ name: 'Subject', value: 'Files' }],
    parts: [
      { mimeType: 'text/plain', body: { data: b64u('see files') } },
      { mimeType: 'image/png', filename: 'SCR-1.png', body: { attachmentId: 'A1', size: 5 } },
      { mimeType: 'image/png', filename: '../../evil.png', body: { attachmentId: 'A2', size: 5 } },
      { mimeType: 'application/zip', filename: 'huge.zip', body: { attachmentId: 'A3', size: 80 * 1024 * 1024 } },
    ],
  },
}

describe('emails_search', () => {
  test('lists one line per message and says when more exist', async () => {
    const asked: [string, number][] = []
    const { call } = await connect({
      search: async (q: string, max: number) => {
        asked.push([q, max])
        return { messages: [ORIGINAL, REPLY], more: true }
      },
    })
    const out = await call('emails_search', { q: 'from:ana@client.test' })
    expect(asked).toEqual([['from:ana@client.test', 20]])
    const lines = out.text.split('\n')
    expect(lines[0]).toBe('2 messages for "from:ana@client.test" (more exist: raise max up to 50 or narrow the query), times in Asia/Kuala_Lumpur:')
    expect(lines[1]).toBe('[18/11/2026 10:30] · from: Ana Lee <ana@client.test> · subject: Quote QUO-1 · snippet: Please confirm the quote · id: m100 · thread: t100 · files: 0')
    expect(lines.length).toBe(3)
  })

  test('no match says so, and max is capped at 50', async () => {
    const { call } = await connect({ search: async () => ({ messages: [], more: false }) })
    expect((await call('emails_search', { q: 'zzz' })).text).toBe('No messages match "zzz".')
    expect((await call('emails_search', { q: 'zzz', max: 51 })).isError).toBe(true)
  })
})

describe('email_read', () => {
  test('reads one message', async () => {
    const { call } = await connect()
    const out = await call('email_read', { message: 'm100' })
    expect(out.text).toContain('== message: m100 · thread: t100')
    expect(out.text).toContain('Message-ID: <orig@client.test>')
    expect(out.text).toEndWith('Please confirm the quote')
  })

  test('reads a thread oldest to newest', async () => {
    const { call } = await connect({ thread: async () => [REPLY, ORIGINAL] })
    const out = await call('email_read', { thread: 't100' })
    expect(out.text.indexOf('message: m101')).toBeLessThan(out.text.indexOf('message: m100'))
  })

  test('needs exactly one of message and thread', async () => {
    const { call } = await connect()
    expect((await call('email_read', {})).text).toBe('Give exactly one of message or thread.')
    expect((await call('email_read', { message: 'm100', thread: 't100' })).isError).toBe(true)
  })

  test('a long thread is cut and says which messages were left out', async () => {
    const big = (id: string) => ({ ...ORIGINAL, id, payload: { ...ORIGINAL.payload!, body: { data: b64u('x'.repeat(19_000)) } } })
    const { call } = await connect({ thread: async () => ['a', 'b', 'c', 'd'].map(big) })
    const out = await call('email_read', { thread: 't100' })
    expect(out.text).toContain('message: a')
    expect(out.text).toContain('message: c')
    expect(out.text).not.toContain('message: d ·')
    expect(out.text).toContain('[1 more message not shown to keep the output short: read them one by one with message ids (d)]')
  })
})

describe('attachment_download', () => {
  const setup = () =>
    connect({
      message: async () => WITH_FILE,
      attachment: async (_m: string, id: string) => new TextEncoder().encode(`bytes of ${id}`),
    })
  const pathOf = (out: string, label: string) => out.split('\n').find((l) => l.startsWith(`${label}: /`))!.split(': ')[1]!.split(' (')[0]!

  test('saves into a fresh 0700 folder as 0600 files with sanitised names, and skips files over 50 MB', async () => {
    const { call, root } = await setup()
    const out = await call('attachment_download', { message: 'm400' })
    const first = pathOf(out.text, 'SCR-1.png')
    const evil = pathOf(out.text, '../../evil.png')
    expect(first.startsWith(root)).toBe(true)
    expect(evil.endsWith('/evil.png')).toBe(true)
    expect(evil.startsWith(root)).toBe(true)
    expect(readFileSync(first, 'utf8')).toBe('bytes of A1')
    expect(statSync(first).mode & 0o777).toBe(0o600)
    expect(statSync(join(first, '..')).mode & 0o777).toBe(0o700)
    expect(out.text).toContain('huge.zip: not downloaded (80.0 MB, over the 50 MB limit)')
  })

  test('file narrows to one attachment, and a miss lists the names', async () => {
    const { call } = await setup()
    const one = await call('attachment_download', { message: 'm400', file: 'scr-1' })
    expect(one.text).toContain('SCR-1.png')
    expect(one.text).not.toContain('evil')
    expect((await call('attachment_download', { message: 'm400', file: 'nothing' })).text).toContain('Files: SCR-1.png, ../../evil.png, huge.zip')
  })

  test('a message without files says so, and ids that are not plain are refused', async () => {
    const { call } = await connect({ message: async () => ORIGINAL })
    expect((await call('attachment_download', { message: 'm100' })).text).toBe('Message m100 has no attached files.')
    expect((await call('attachment_download', { message: '../x' })).isError).toBe(true)
  })

  test('folders older than a day are removed on start, newer ones and strangers stay', () => {
    const root = mkdtempSync(join(tmpdir(), 'gmail-prune-'))
    const old = join(root, 'gmail-attachments-old')
    const fresh = join(root, 'gmail-attachments-new')
    const other = join(root, 'something-else')
    for (const d of [old, fresh, other]) mkdirSync(d)
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000)
    utimesSync(old, twoDaysAgo, twoDaysAgo)
    utimesSync(other, twoDaysAgo, twoDaysAgo)
    pruneDownloads(root)
    expect([existsSync(old), existsSync(fresh), existsSync(other)]).toEqual([false, true, true])
  })
})
