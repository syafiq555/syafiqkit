import { describe, expect, test } from 'bun:test'
import { attachmentsOf, bodyText, readBlock, searchLine, sentAt, type GmailMessage } from '../src/format.ts'
import { b64u, ORIGINAL } from './helpers.ts'

const WITH_FILES: GmailMessage = {
  id: 'm200',
  threadId: 't200',
  snippet: 'See attached\n  invoice',
  internalDate: String(Date.parse('2026-11-18T10:15:00Z')),
  payload: {
    mimeType: 'multipart/mixed',
    headers: [
      { name: 'From', value: 'Billing <billing@vendor.test>' },
      { name: 'To', value: 'me@tsb.test' },
      { name: 'Subject', value: 'Invoice 77' },
      { name: 'Message-ID', value: '<inv77@vendor.test>' },
    ],
    parts: [
      {
        mimeType: 'multipart/alternative',
        parts: [
          { mimeType: 'text/plain', headers: [{ name: 'Content-Type', value: 'text/plain; charset="UTF-8"' }], body: { data: b64u('Plain version\r\nline two') } },
          { mimeType: 'text/html', body: { data: b64u('<p>HTML version</p>') } },
        ],
      },
      { mimeType: 'application/pdf', filename: 'invoice-77.pdf', body: { attachmentId: 'ATT1', size: 123456 } },
      { mimeType: 'image/png', filename: 'logo.png', body: { attachmentId: 'ATT2', size: 900 } },
    ],
  },
}

const HTML_ONLY: GmailMessage = {
  id: 'm300',
  threadId: 't300',
  internalDate: String(Date.parse('2026-11-18T11:00:00Z')),
  payload: {
    mimeType: 'text/html',
    headers: [{ name: 'Subject', value: 'Newsletter' }],
    body: { data: b64u('<html><head><style>x{}</style></head><body><p>Big <b>sale</b> &amp; more</p></body></html>') },
  },
}

describe('search lines', () => {
  test('one line: local time, from, subject, snippet on one line, ids, attachment count', () => {
    expect(searchLine(WITH_FILES)).toBe(
      '[18/11/2026 18:15] · from: Billing <billing@vendor.test> · subject: Invoice 77 · snippet: See attached invoice · id: m200 · thread: t200 · files: 2',
    )
    expect(searchLine(ORIGINAL)).toContain('files: 0')
  })

  test('a missing subject reads (no subject)', () => {
    expect(searchLine({ id: 'x', threadId: 'y', payload: { headers: [] } })).toContain('subject: (no subject)')
  })
})

describe('bodies', () => {
  test('prefers text/plain over html, and strips html when it is all there is', () => {
    expect(bodyText(WITH_FILES)).toBe('Plain version\nline two')
    expect(bodyText(HTML_ONLY)).toBe('Big sale & more')
  })

  test('attachments come from parts with a filename and an attachmentId', () => {
    expect(attachmentsOf(WITH_FILES)).toEqual([
      { name: 'invoice-77.pdf', mimeType: 'application/pdf', size: 123456, attachmentId: 'ATT1' },
      { name: 'logo.png', mimeType: 'image/png', size: 900, attachmentId: 'ATT2' },
    ])
  })

  test('a declared non-UTF-8 charset is decoded', () => {
    const latin: GmailMessage = {
      payload: { mimeType: 'text/plain', headers: [{ name: 'Content-Type', value: 'text/plain; charset=iso-8859-1' }], body: { data: Buffer.from([0x63, 0x61, 0x66, 0xe9]).toString('base64url') } },
    }
    expect(bodyText(latin)).toBe('café')
  })
})

describe('email_read block', () => {
  test('headers, message id, attachments with sizes and ids, then the body', () => {
    expect(readBlock(WITH_FILES, { maxBody: 1000 })).toBe(
      [
        '== message: m200 · thread: t200',
        'From: Billing <billing@vendor.test>',
        'To: me@tsb.test',
        'Date: 18/11/2026 18:15',
        'Subject: Invoice 77',
        'Message-ID: <inv77@vendor.test>',
        'Attachments: invoice-77.pdf (121 KB, attachmentId: ATT1); logo.png (900 B, attachmentId: ATT2)',
        '',
        'Plain version\nline two',
      ].join('\n'),
    )
  })

  test('Cc shows only when present', () => {
    expect(readBlock(ORIGINAL, { maxBody: 1000 })).toContain('Cc: boss@client.test')
    expect(readBlock(WITH_FILES, { maxBody: 1000 })).not.toContain('Cc:')
  })

  test('a long body is cut and says how much was left out', () => {
    const long: GmailMessage = { ...ORIGINAL, payload: { ...ORIGINAL.payload!, body: { data: b64u('abcdefghij'.repeat(10)) } } }
    const out = readBlock(long, { maxBody: 30 })
    expect(out).toContain('abcdefghij'.repeat(3))
    expect(out).not.toContain('abcdefghij'.repeat(4))
    expect(out).toContain('[body truncated: 70 more characters not shown]')
  })

  test('the date falls back to the Date header when there is no internalDate', () => {
    expect(sentAt({ payload: { headers: [{ name: 'Date', value: 'Wed, 18 Nov 2026 10:15:00 +0000' }] } })).toBe('18/11/2026 18:15')
  })
})
