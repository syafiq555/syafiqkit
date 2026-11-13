import { expect, test } from 'bun:test'
import type { TokenSource } from '../src/auth.ts'
import { Google } from '../src/google.ts'

const tokens = { get: async () => 'tok' } as unknown as TokenSource

test('upload sends a multipart/related body: JSON metadata, then the raw bytes', async () => {
  let seen: { url: string; init: RequestInit } | null = null
  const g = new Google(tokens, async (url, init) => {
    seen = { url, init: init! }
    return new Response(JSON.stringify({ attachmentDataRef: { resourceName: 'r1' } }), { status: 200 })
  })
  const out = await g.upload('https://x/upload', { filename: 'a.png' }, new Uint8Array([1, 2, 3]), 'image/png')
  expect(out).toEqual({ attachmentDataRef: { resourceName: 'r1' } })

  const headers = seen!.init.headers as Record<string, string>
  expect(headers.Authorization).toBe('Bearer tok')
  const boundary = /^multipart\/related; boundary=(.+)$/.exec(headers['Content-Type']!)![1]!
  const body = seen!.init.body as Uint8Array
  const text = new TextDecoder('latin1').decode(body)
  expect(text.startsWith(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n{"filename":"a.png"}\r\n--${boundary}\r\nContent-Type: image/png\r\n\r\n`)).toBe(true)
  expect(text.endsWith(`\r\n--${boundary}--\r\n`)).toBe(true)
  const start = text.indexOf('image/png\r\n\r\n') + 'image/png\r\n\r\n'.length
  expect([...body.slice(start, start + 3)]).toEqual([1, 2, 3])
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
  await expect(g.call('POST', 'https://x/messages', { text: 'hi' })).rejects.toThrow('No answer from Google within 0 s')
})

test('a 50 MB limit is worded in MB', async () => {
  const g = new Google(tokens, async () => new Response(new Uint8Array(1), { status: 200, headers: { 'content-length': String(60 * 1024 * 1024) } }))
  await expect(g.bytes('https://x/media', 50 * 1024 * 1024)).rejects.toThrow('over the 50 MB limit')
})

test('bytes refuses a file over the limit', async () => {
  const g = new Google(tokens, async () => new Response(new Uint8Array(10), { status: 200 }))
  await expect(g.bytes('https://x/media', 5)).rejects.toThrow('over the 5-byte limit')
})

test('bytes stops a streamed body with no length header once it passes the limit', async () => {
  let pulled = 0
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulled++
      controller.enqueue(new Uint8Array(4))
      if (pulled > 100) controller.close()
    },
  })
  const g = new Google(tokens, async () => new Response(stream, { status: 200 }))
  await expect(g.bytes('https://x/media', 10)).rejects.toThrow('over the 10-byte limit')
  expect(pulled).toBeLessThan(10)
})
