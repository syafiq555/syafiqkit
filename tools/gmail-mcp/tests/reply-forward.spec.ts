import { describe, expect, test } from 'bun:test'
import type { GmailMessage } from '../src/format.ts'
import { forwardSubject } from '../src/mime.ts'
import { b64u, connect, ORIGINAL, tempFiles } from './helpers.ts'

function original(headers: Record<string, string | null>, extra: Partial<GmailMessage['payload']> = {}): GmailMessage {
  const base: Record<string, string> = {}
  for (const h of ORIGINAL.payload!.headers!) base[h.name] = h.value
  const merged = { ...base, ...headers }
  return {
    ...ORIGINAL,
    payload: {
      ...ORIGINAL.payload!,
      headers: Object.entries(merged).filter(([, v]) => v !== null).map(([name, value]) => ({ name, value: value! })),
      ...extra,
    },
  }
}

const sendArgs = (p: { recipients: string; digest: string }, args: Record<string, unknown>) => ({ ...args, recipients: p.recipients, digest: p.digest })

describe('replyMode', () => {
  const crowd = original({
    From: '"Lee, Ana" <ana@client.test>',
    To: 'Me <ME@tsb.test>, "Ops, Team" <ops@tsb.test>, boss@client.test',
    Cc: 'boss@client.test, Zed <zed@client.test>, ana@client.test',
  })

  test('is only valid with replyTo', async () => {
    const { call } = await connect()
    const out = await call('email_send_preview', { to: ['a@x.test'], subject: 'x', body: 'hi', replyMode: 'all' })
    expect(out.isError).toBe(true)
    expect(out.text).toContain('replyMode only works together with replyTo')
  })

  test('sender: To is the original From, with no to passed', async () => {
    const { preview } = await connect({ message: async () => crowd })
    const p = await preview({ body: 'ok', replyTo: 'm100', replyMode: 'sender' })
    expect(p.recipients).toBe('to: ana@client.test')
    expect(p.text).toContain('Recipients above were resolved from replyMode sender')
    expect(p.text).toContain('To: ana@client.test\nCc: -')
  })

  test('sender prefers Reply-To over From', async () => {
    const { preview } = await connect({ message: async () => original({ 'Reply-To': 'Desk <desk@client.test>' }) })
    const p = await preview({ body: 'ok', replyTo: 'm100', replyMode: 'sender' })
    expect(p.recipients).toBe('to: desk@client.test')
  })

  test('all: sender plus To and Cc, own address (any case) and duplicates dropped, Cc never repeats To', async () => {
    const { preview } = await connect({ message: async () => crowd })
    const p = await preview({ body: 'ok', replyTo: 'm100', replyMode: 'all' })
    expect(p.recipients).toBe('to: ana@client.test, ops@tsb.test, boss@client.test; cc: zed@client.test')
    expect(p.text).toContain('To: ana@client.test, ops@tsb.test, boss@client.test\nCc: zed@client.test')
  })

  test('explicit to, cc and bcc are merged with the derived ones, not ignored', async () => {
    const { preview } = await connect({ message: async () => crowd })
    const p = await preview({ body: 'ok', replyTo: 'm100', replyMode: 'all', to: ['extra@x.test', 'ANA@client.test'], cc: ['more@x.test'], bcc: ['hidden@x.test'] })
    expect(p.recipients).toBe('to: ana@client.test, ops@tsb.test, boss@client.test, extra@x.test; cc: zed@client.test, more@x.test; bcc: hidden@x.test')
  })

  test('a reply to your own sent message goes to the people you wrote to, as Gmail does', async () => {
    const mine = original({ From: 'Me <me@tsb.test>', To: 'ana@client.test, ME@tsb.test', Cc: 'zed@client.test' })
    const { preview } = await connect({ message: async () => mine })
    expect((await preview({ body: 'ok', replyTo: 'm100', replyMode: 'sender' })).recipients).toBe('to: ana@client.test')
    expect((await preview({ body: 'ok', replyTo: 'm100', replyMode: 'all' })).recipients).toBe('to: ana@client.test; cc: zed@client.test')
  })

  test('a reply that resolves to only your own address needs a to, and says why', async () => {
    const toSelf = original({ From: 'me@tsb.test', To: 'me@tsb.test', Cc: null })
    const { call, preview } = await connect({ message: async () => toSelf })
    const out = await call('email_send_preview', { body: 'ok', replyTo: 'm100', replyMode: 'sender' })
    expect(out.isError).toBe(true)
    expect(out.text).toContain('found no address other than yours')
    expect((await preview({ body: 'ok', replyTo: 'm100', replyMode: 'sender', to: ['x@x.test'] })).recipients).toBe('to: x@x.test')
  })

  test('without replyMode a reply still needs an explicit to', async () => {
    const { call } = await connect()
    const out = await call('email_send_preview', { body: 'ok', replyTo: 'm100' })
    expect(out.text).toContain('Give at least one To address')
  })

  test('the resolved list is what the prompt shows and what email_send checks', async () => {
    const { preview, call, sent } = await connect({ message: async () => crowd })
    const args = { body: 'ok', replyTo: 'm100', replyMode: 'all' }
    const p = await preview(args)
    const wrong = await call('email_send', sendArgs({ recipients: 'to: ana@client.test', digest: p.digest }, args))
    expect(wrong.text).toStartWith('NOT SENT: recipients "to: ana@client.test" do not match')
    const narrower = await call('email_send', sendArgs(p, { ...args, replyMode: 'sender' }))
    expect(narrower.text).toStartWith('NOT SENT: recipients')
    expect(sent).toEqual([])
    const ok = await call('email_send', sendArgs(p, args))
    expect(ok.text).toContain('Sent from me@tsb.test to to: ana@client.test, ops@tsb.test, boss@client.test; cc: zed@client.test')
    expect(sent[0]!.threadId).toBe('t100')
    expect(sent[0]!.mime).toContain('To: ana@client.test, ops@tsb.test, boss@client.test\r\nCc: zed@client.test\r\n')
  })

  test('a changed original between preview and send is refused', async () => {
    let current = crowd
    const { preview, call, sent } = await connect({ message: async () => current })
    const args = { body: 'ok', replyTo: 'm100', replyMode: 'all' }
    const p = await preview(args)
    current = original({ Cc: 'sneaky@client.test' })
    const out = await call('email_send', sendArgs(p, args))
    expect(out.text).toStartWith('NOT SENT: recipients')
    expect(sent).toEqual([])
  })
})

describe('forwarding', () => {
  const PDF = new Uint8Array([37, 80, 68, 70, 1, 2, 3])
  const withFile = original(
    { Date: 'Tue, 18 Nov 2026 10:30:00 +0800', Subject: 'Quote QUO-1' },
    {
      mimeType: 'multipart/mixed',
      body: undefined,
      parts: [
        { mimeType: 'text/plain', body: { size: 10, data: b64u('Please confirm the quote\nLine two') } },
        { mimeType: 'application/pdf', filename: 'quote.pdf', body: { size: PDF.byteLength, attachmentId: 'att1' } },
      ],
    },
  )
  const fetched: string[] = []
  const overrides = () => ({
    message: async (id: string) => {
      if (id !== 'm100') throw new Error('Google API 404: Requested entity was not found.')
      return withFile
    },
    attachment: async (message: string, id: string) => {
      fetched.push(`${message}/${id}`)
      return PDF
    },
  })

  test('subject defaults to Fwd: and never doubles', () => {
    expect(forwardSubject('Quote QUO-1', undefined)).toBe('Fwd: Quote QUO-1')
    expect(forwardSubject('Fwd: Quote QUO-1', undefined)).toBe('Fwd: Quote QUO-1')
    expect(forwardSubject('FW: Quote', '  ')).toBe('FW: Quote')
    expect(forwardSubject('Quote', 'Custom')).toBe('Custom')
  })

  test('preview shows subject, quoted block, attachment count and size, never fills recipients', async () => {
    const { preview, call, sent } = await connect(overrides())
    const missing = await call('email_send_preview', { body: 'FYI', forwardOf: 'm100' })
    expect(missing.isError).toBe(true)
    expect(missing.text).toContain('a forward never fills recipients')
    const p = await preview({ to: ['dev@tsb.test'], body: 'FYI', forwardOf: 'm100' })
    expect(p.text).toContain('Subject: Fwd: Quote QUO-1')
    expect(p.text).toContain('Files: quote.pdf (7 B, forwarded from the original)')
    expect(p.text).toContain('Forward: of message m100')
    expect(p.text).toContain('1 forwarded attachment (7 B). A new conversation, not threaded')
    expect(p.text).toContain('  | FYI')
    expect(p.recipients).toBe('to: dev@tsb.test')
    expect(sent).toEqual([])
  })

  test('sends the user text, a quoted header block and the original text, with the attachment re-attached and no threading', async () => {
    const { preview, call, sent } = await connect(overrides())
    const args = { to: ['dev@tsb.test'], body: 'FYI', forwardOf: 'm100' }
    const p = await preview(args)
    const out = await call('email_send', sendArgs(p, args))
    expect(out.text).toContain('Sent from me@tsb.test to to: dev@tsb.test with 1 file')
    expect(fetched).toContain('m100/att1')
    expect(sent[0]!.threadId).toBeUndefined()
    const mime = sent[0]!.mime
    expect(mime).not.toContain('In-Reply-To')
    expect(mime).toContain('Subject: Fwd: Quote QUO-1\r\n')
    expect(mime).toContain('Content-Type: application/pdf; name="quote.pdf"')
    const textPart = /Content-Transfer-Encoding: base64\r\n\r\n([\s\S]*?)\r\n--/.exec(mime)![1]!.replace(/\r\n/g, '')
    expect(Buffer.from(textPart, 'base64').toString('utf8').replace(/\r\n/g, '\n')).toBe(
      [
        'FYI',
        '',
        '---------- Forwarded message ---------',
        'From: Ana Lee <ana@client.test>',
        'Date: Tue, 18 Nov 2026 10:30:00 +0800',
        'Subject: Quote QUO-1',
        'To: me@tsb.test, ops@tsb.test',
        'Cc: boss@client.test',
        '',
        'Please confirm the quote\nLine two',
      ].join('\n'),
    )
  })

  test('the digest covers the forwarded attachment content, so a different file is refused', async () => {
    let bytes = PDF
    const { preview, call, sent } = await connect({ ...overrides(), attachment: async () => bytes })
    const args = { to: ['dev@tsb.test'], body: 'FYI', forwardOf: 'm100' }
    const p = await preview(args)
    bytes = new Uint8Array([9, 9, 9])
    const out = await call('email_send', sendArgs(p, args))
    expect(out.text).toStartWith('NOT SENT: digest does not match')
    expect(sent).toEqual([])
  })

  test('the user can add their own files, and an empty body is fine for a forward', async () => {
    const { shot } = tempFiles()
    const { preview } = await connect(overrides())
    const p = await preview({ to: ['dev@tsb.test'], forwardOf: 'm100', files: [shot] })
    expect(p.text).toContain('Files: quote.pdf (7 B, forwarded from the original), shot.png (2 KB)')
    expect(p.text).toContain('---------- Forwarded message ---------')
  })

  test('is refused together with replyTo or replyMode', async () => {
    const { call } = await connect(overrides())
    const both = await call('email_send_preview', { to: ['a@x.test'], body: 'x', replyTo: 'm100', forwardOf: 'm100' })
    expect(both.isError).toBe(true)
    expect(both.text).toContain('Give replyTo or forwardOf, not both')
    const mode = await call('email_send_preview', { to: ['a@x.test'], body: 'x', forwardOf: 'm100', replyMode: 'sender' })
    expect(mode.text).toContain('replyMode only works together with replyTo')
  })

  test('attachments past Gmail\'s 25 MB encoded limit are refused before any download', async () => {
    const big = original({}, { mimeType: 'multipart/mixed', parts: [{ mimeType: 'text/plain', body: { size: 3, data: b64u('hi') } }, { mimeType: 'application/zip', filename: 'big.zip', body: { size: 24 * 1024 * 1024, attachmentId: 'att9' } }] })
    const calls: string[] = []
    const { call } = await connect({
      message: async () => big,
      attachment: async (_m: string, id: string) => {
        calls.push(id)
        return new Uint8Array(1)
      },
    })
    const out = await call('email_send_preview', { to: ['a@x.test'], body: 'x', forwardOf: 'm100' })
    expect(out.isError).toBe(true)
    expect(out.text).toContain("over Gmail's 25 MB limit")
    expect(calls).toEqual([])
  })

  test('an actual download larger than the declared size is caught after download', async () => {
    const lying = original({}, { mimeType: 'multipart/mixed', parts: [{ mimeType: 'text/plain', body: { size: 3, data: b64u('hi') } }, { mimeType: 'application/zip', filename: 'x.zip', body: { size: 10, attachmentId: 'att9' } }] })
    const { call } = await connect({ message: async () => lying, attachment: async () => new Uint8Array(20 * 1024 * 1024) })
    const out = await call('email_send_preview', { to: ['a@x.test'], body: 'x', forwardOf: 'm100' })
    expect(out.text).toContain("over Gmail's 25 MB limit")
  })
})
