import { describe, expect, test } from 'bun:test'
import { grantedScopesMatch, SCOPES } from '../src/auth.ts'
import { klTime, mapLimit, matchesAll, messageLine, parseWhen, safeFileName, terms } from '../src/format.ts'

describe('dates', () => {
  const now = new Date('2026-11-13T04:00:00Z')

  test('relative windows count back from now', () => {
    expect(parseWhen('7d', now)).toBe('2026-11-06T04:00:00.000Z')
    expect(parseWhen('12h', now)).toBe('2026-11-12T16:00:00.000Z')
    expect(parseWhen('2w', now)).toBe('2026-10-30T04:00:00.000Z')
  })

  test('a bare date means Malaysia midnight, in either written order', () => {
    expect(parseWhen('13/11/2026')).toBe('2026-11-12T16:00:00.000Z')
    expect(parseWhen('2026-11-13')).toBe('2026-11-12T16:00:00.000Z')
    expect(parseWhen('3/1/2026')).toBe('2026-01-02T16:00:00.000Z')
  })

  test('nonsense, impossible dates and offset-less times are refused with the accepted shapes', () => {
    for (const bad of ['last tuesday', '31/02/2026', '13/13/2026', '0/0/2026', '1/1/26', '2026-11-13T10:00']) {
      expect(() => parseWhen(bad)).toThrow('7d, 12h')
    }
    expect(parseWhen('2026-11-13T10:00:00+08:00')).toBe('2026-11-13T02:00:00.000Z')
  })

  test('shows Malaysia time as dd/MM/yyyy HH:mm', () => {
    expect(klTime('2026-11-12T16:05:00Z')).toBe('13/11/2026 00:05')
    expect(klTime(undefined)).toBe('-')
  })
})

describe('search matching', () => {
  test('quoted phrases stay whole and matching ignores case', () => {
    expect(terms('SST "quarterly filing" Hong')).toEqual(['sst', 'quarterly filing', 'hong'])
    expect(matchesAll('Hong said the SST quarterly filing is due', terms('sst "quarterly filing"'))).toBe(true)
    expect(matchesAll('quarterly SST, filing later', terms('"quarterly filing"'))).toBe(false)
  })
})

test('deleted, card-only and quoting messages say so', () => {
  expect(messageLine({ createTime: '2026-11-13T02:30:00Z', deletionMetadata: {} }, 'A')).toContain('A: (deleted)')
  expect(messageLine({ createTime: '2026-11-13T02:30:00Z', cardsV2: [{ card: { header: { title: 'Deploy passed' } } }] }, 'Bot')).toContain('Bot: (card: Deploy passed)')
  expect(messageLine({ createTime: '2026-11-13T02:30:00Z', text: 'yes', quotedMessageMetadata: { name: 'm' } }, 'A')).toContain('A (quoting an earlier message): yes')
})

test('message line carries time, sender, files and thread', () => {
  const line = messageLine(
    { name: 'spaces/A/messages/m', createTime: '2026-11-13T02:30:00Z', text: 'see attached', threadReply: true, thread: { name: 'spaces/A/threads/t' }, attachment: [{ contentName: 'quote.pdf' }] },
    'Alya',
  )
  expect(line).toBe('[13/11/2026 10:30] Alya (in thread): see attached\n    files: quote.pdf · message: spaces/A/messages/m · thread: spaces/A/threads/t')
})

test('a message without files does not print its name', () => {
  expect(messageLine({ name: 'spaces/A/messages/m', createTime: '2026-11-13T02:30:00Z', text: 'hi', thread: { name: 'spaces/A/threads/t' } }, 'Alya')).toBe(
    '[13/11/2026 10:30] Alya: hi\n    thread: spaces/A/threads/t',
  )
})

test('attachment names cannot climb out of the download folder', () => {
  expect(safeFileName('../../etc/passwd', 0)).toBe('passwd')
  expect(safeFileName('..\\x\\shot.png', 0)).toBe('shot.png')
  expect(safeFileName('.hidden', 1)).toBe('hidden')
  expect(safeFileName('', 2)).toBe('attachment-3')
  expect(safeFileName(undefined, 0)).toBe('attachment-1')
})

test('mapLimit keeps order and caps concurrency', async () => {
  let live = 0
  let peak = 0
  const out = await mapLimit([5, 1, 3, 2], 2, async (n) => {
    live++
    peak = Math.max(peak, live)
    await Bun.sleep(n)
    live--
    return n * 10
  })
  expect(out).toEqual([50, 10, 30, 20])
  expect(peak).toBe(2)
})

test('scope check is exact', () => {
  expect(grantedScopesMatch([...SCOPES].reverse().join(' '))).toBe(true)
  expect(grantedScopesMatch(SCOPES.slice(1).join(' '))).toBe(false)
  expect(grantedScopesMatch([...SCOPES, 'https://www.googleapis.com/auth/chat.messages'].join(' '))).toBe(false)
})
