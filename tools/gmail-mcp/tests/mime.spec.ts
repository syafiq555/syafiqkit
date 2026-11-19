import { describe, expect, test } from 'bun:test'
import { baseSubject, buildMime, crlf, encodedWord, fromBase64Url, htmlToText, replySubject, toBase64Url, validAddress } from '../src/mime.ts'

const NOW = new Date('2026-11-19T04:00:00Z')
const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes)
const base = { from: 'me@tsb.test', to: ['a@x.test'], cc: [], bcc: [], subject: 'Hello', body: 'Hi there', files: [] }

function bodyOf(mime: string): string {
  const b64 = mime.split('\r\n\r\n')[1]!.replace(/\r\n/g, '')
  return Buffer.from(b64, 'base64').toString('utf8')
}

describe('headers', () => {
  test('a plain message is CRLF throughout with a base64 UTF-8 text part', () => {
    const mime = decode(buildMime({ ...base, cc: ['c@x.test'], bcc: ['b@x.test'] }, NOW))
    expect(mime).not.toMatch(/[^\r]\n/)
    expect(mime.split('\r\n').slice(0, 8)).toEqual([
      'From: me@tsb.test',
      'To: a@x.test',
      'Cc: c@x.test',
      'Bcc: b@x.test',
      'Subject: Hello',
      'Date: Thu, 19 Nov 2026 04:00:00 +0000',
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=UTF-8',
    ])
    expect(mime).toContain('Content-Transfer-Encoding: base64')
    expect(bodyOf(mime)).toBe('Hi there')
  })

  test('a non-ASCII subject becomes encoded words, long ones folded on character boundaries', () => {
    expect(encodedWord('Hello')).toBe('Hello')
    const word = encodedWord('Pembayaran November é RM 1,200')
    expect(word).toMatch(/^=\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/m)
    const long = encodedWord('日本語のとても長い件名です日本語のとても長い件名です日本語のとても長い件名です')
    const parts = long.split('\r\n ')
    expect(parts.length).toBeGreaterThan(1)
    const text = parts.map((p) => Buffer.from(/^=\?UTF-8\?B\?(.*)\?=$/.exec(p)![1]!, 'base64').toString('utf8')).join('')
    expect(text).toBe('日本語のとても長い件名です日本語のとても長い件名です日本語のとても長い件名です')
    for (const p of parts) expect(p.length).toBeLessThanOrEqual(75)
    const mime = decode(buildMime({ ...base, subject: 'Tuntutan RM50 é ✓' }, NOW))
    expect(mime).toContain('Subject: =?UTF-8?B?')
    expect(mime).not.toContain('Subject: Tuntutan')
  })

  test('reply headers appear only when given', () => {
    const plain = decode(buildMime(base, NOW))
    expect(plain).not.toContain('In-Reply-To')
    const reply = decode(buildMime({ ...base, inReplyTo: '<a@x>', references: '<r@x> <a@x>' }, NOW))
    expect(reply).toContain('In-Reply-To: <a@x>\r\nReferences: <r@x> <a@x>\r\n')
  })

  test('a long recipient list or References chain is folded under 78 characters, and a CR/LF in a reply id cannot start a header', () => {
    const to = Array.from({ length: 40 }, (_, i) => `person${i}@example.test`)
    const refs = Array.from({ length: 40 }, (_, i) => `<ref${i}@mail.example.test>`).join(' ')
    const head = decode(buildMime({ ...base, to, inReplyTo: '<a@x>\r\nBcc: evil@x.test', references: refs }, NOW)).split('\r\n\r\n')[0]!
    for (const line of head.split('\r\n')) expect(line.length).toBeLessThanOrEqual(78)
    expect(head.replace(/\r\n /g, ' ')).toContain(`To: ${to.join(', ')}\r\n`)
    expect(head).not.toMatch(/\r\nBcc:/)
  })
})

describe('body', () => {
  test('LF and CR line endings become CRLF and UTF-8 survives', () => {
    expect(crlf('a\nb\rc\r\nd')).toBe('a\r\nb\r\nc\r\nd')
    const mime = decode(buildMime({ ...base, body: 'Salam\nTerima kasih, Syafiq ✓' }, NOW))
    expect(bodyOf(mime)).toBe('Salam\r\nTerima kasih, Syafiq ✓')
  })

  test('base64 lines are at most 76 characters', () => {
    const mime = decode(buildMime({ ...base, body: 'x'.repeat(5000) }, NOW))
    for (const line of mime.split('\r\n')) expect(line.length).toBeLessThanOrEqual(76)
  })
})

describe('attachments', () => {
  const files = [
    { name: 'quote.pdf', contentType: 'application/pdf', data: new Uint8Array([1, 2, 3, 4]) },
    { name: 'Laporan Jualan ✓.xlsx', contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', data: new Uint8Array([9, 9]) },
  ]

  test('multipart/mixed: text part first, one part per file with its content type, closing boundary', () => {
    const mime = decode(buildMime({ ...base, files }, NOW, 'BND'))
    expect(mime).toContain('Content-Type: multipart/mixed; boundary="BND"\r\n')
    expect(mime.match(/--BND\r\n/g)!.length).toBe(3)
    expect(mime.endsWith('--BND--\r\n')).toBe(true)
    expect(mime.indexOf('text/plain')).toBeLessThan(mime.indexOf('application/pdf'))
    expect(mime).toContain('Content-Type: application/pdf; name="quote.pdf"\r\nContent-Disposition: attachment; filename="quote.pdf"\r\nContent-Transfer-Encoding: base64\r\n\r\nAQIDBA==\r\n')
    expect(mime).toContain("filename*=UTF-8''Laporan%20Jualan%20%E2%9C%93.xlsx")
    expect(mime).not.toMatch(/[^\r]\n/)
  })
})

describe('base64url', () => {
  test('uses - and _ with no padding, and round-trips', () => {
    const bytes = new Uint8Array([251, 255, 254, 62, 63])
    const encoded = toBase64Url(bytes)
    expect(encoded).not.toMatch(/[+/=]/)
    expect([...fromBase64Url(encoded)]).toEqual([...bytes])
  })
})

describe('reply subject', () => {
  test('defaults to Re: original, never doubled, and an explicit subject wins', () => {
    expect(replySubject('Quote QUO-1', undefined)).toBe('Re: Quote QUO-1')
    expect(replySubject('Re: Quote QUO-1', undefined)).toBe('Re: Quote QUO-1')
    expect(replySubject('RE: Quote QUO-1', '  ')).toBe('RE: Quote QUO-1')
    expect(replySubject('Quote QUO-1', 'Re: Quote QUO-1 (revised)')).toBe('Re: Quote QUO-1 (revised)')
    expect(baseSubject('Re: RE: Fwd: Quote')).toBe('quote')
  })
})

describe('addresses and html', () => {
  test('plain addresses only, nothing that could inject a header', () => {
    for (const ok of ['a@x.test', 'first.last+tag@sub.example.com']) expect(validAddress(ok)).toBe(true)
    for (const bad of ['a@x', 'Ana <a@x.test>', 'a@x.test, b@x.test', 'a@x.test\r\nBcc: z@z.test', 'a b@x.test', '', '@x.test']) expect(validAddress(bad)).toBe(false)
  })

  test('html becomes readable text', () => {
    expect(htmlToText('<style>p{}</style><p>Hello&nbsp;<b>Ana</b> &amp; Co</p><ul><li>One</li><li>Two</li></ul><br>Bye &#8364;5')).toBe('Hello Ana & Co\n- One\n- Two\n\nBye €5')
  })
})
