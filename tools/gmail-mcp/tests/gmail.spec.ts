import { describe, expect, test } from 'bun:test'
import type { TokenSource } from '../src/auth.ts'
import { Gmail, JSON_SEND_LIMIT_BYTES } from '../src/gmail.ts'
import { Google } from '../src/google.ts'
import { fromBase64Url } from '../src/mime.ts'

const tokens = { get: async () => 'tok' } as unknown as TokenSource

function fake(routes: (url: string, init: RequestInit) => unknown) {
  const calls: { url: string; init: RequestInit }[] = []
  const g = new Google(tokens, async (url, init) => {
    calls.push({ url, init: init! })
    const body = routes(url, init!)
    return body instanceof Response ? body : new Response(JSON.stringify(body), { status: 200 })
  })
  return { gmail: new Gmail(g), calls }
}

describe('Gmail', () => {
  test('a small message goes to messages.send as JSON with raw base64url and the threadId', async () => {
    const { gmail, calls } = fake(() => ({ id: 's1', threadId: 't1' }))
    const mime = new TextEncoder().encode('Subject: x\r\n\r\nhello?>>')
    const out = await gmail.send(mime, 't1')
    expect(out).toEqual({ id: 's1', threadId: 't1' })
    expect(calls[0]!.url).toBe('https://gmail.googleapis.com/gmail/v1/users/me/messages/send')
    const body = JSON.parse(String(calls[0]!.init.body))
    expect(body.threadId).toBe('t1')
    expect(body.raw).not.toMatch(/[+/=]/)
    expect(new TextDecoder().decode(fromBase64Url(body.raw))).toBe('Subject: x\r\n\r\nhello?>>')
  })

  test('a message over the JSON limit goes through the upload endpoint as message/rfc822', async () => {
    const { gmail, calls } = fake(() => ({ id: 's2', threadId: 't2' }))
    await gmail.send(new Uint8Array(JSON_SEND_LIMIT_BYTES + 1), 't2')
    expect(calls[0]!.url).toBe('https://gmail.googleapis.com/upload/gmail/v1/users/me/messages/send?uploadType=multipart')
    const text = new TextDecoder('latin1').decode(calls[0]!.init.body as Uint8Array)
    expect(text).toContain('{"threadId":"t2"}')
    expect(text).toContain('Content-Type: message/rfc822')
  })

  test('search lists ids, then reads each message with a fields mask that leaves bodies out', async () => {
    const { gmail, calls } = fake((url) => (url.includes('/messages?') ? { messages: [{ id: 'a1' }, { id: 'b2' }], nextPageToken: 'n' } : { id: url.split('/messages/')[1]!.split('?')[0], payload: { headers: [] } }))
    const out = await gmail.search('from:x newer_than:1d', 2)
    expect(out.more).toBe(true)
    expect(out.messages.map((m) => m.id)).toEqual(['a1', 'b2'])
    expect(calls[0]!.url).toContain('q=from%3Ax+newer_than%3A1d&maxResults=2')
    expect(decodeURIComponent(calls[1]!.url)).toContain('format=full&fields=id,threadId,snippet,internalDate,payload(headers,filename,mimeType,body(attachmentId,size)')
  })

  test('a thread comes back oldest first', async () => {
    const { gmail } = fake(() => ({ messages: [{ id: 'b', internalDate: '200' }, { id: 'a', internalDate: '100' }] }))
    expect((await gmail.thread('t1')).map((m) => m.id)).toEqual(['a', 'b'])
  })

  test('ids that are not plain are never put in a URL', async () => {
    const { gmail, calls } = fake(() => ({}))
    await expect(gmail.message('../../drafts')).rejects.toThrow('unexpected message id')
    await expect(gmail.attachment('abc', 'x/../y')).rejects.toThrow('unexpected attachment id')
    expect(calls).toEqual([])
  })

  test('the signed-in address is asked once', async () => {
    const { gmail, calls } = fake(() => ({ emailAddress: 'me@tsb.test' }))
    expect(await gmail.address()).toBe('me@tsb.test')
    expect(await gmail.address()).toBe('me@tsb.test')
    expect(calls.length).toBe(1)
  })

  test('a Google refusal carries the status so the tool can tell NOT SENT from UNSURE', async () => {
    const { gmail } = fake(() => new Response(JSON.stringify({ error: { message: 'Invalid To header' } }), { status: 400 }))
    await expect(gmail.send(new Uint8Array(3))).rejects.toThrow('Google API 400: Invalid To header')
  })
})

test('a request Google never answers fails with a timeout instead of hanging', async () => {
  const g = new Google(
    tokens,
    (_url, init) =>
      new Promise((_resolve, reject) => {
        init!.signal!.addEventListener('abort', () => reject(init!.signal!.reason))
      }),
    { call: 20, transfer: 20 },
  )
  await expect(new Gmail(g).send(new Uint8Array(3))).rejects.toThrow('No answer from Google within 0 s')
})
