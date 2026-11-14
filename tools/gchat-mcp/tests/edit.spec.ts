import { describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Chat } from '../src/chat.ts'
import { editOpening, registerTools } from '../src/tools.ts'

const SPACE = { name: 'spaces/AAA', displayName: 'CRP45', spaceType: 'SPACE' as const }
const MINE = {
  name: 'spaces/AAA/messages/m1',
  createTime: '2026-11-13T23:57:00Z',
  text: '*Title* • one • two',
  sender: { name: 'users/1' },
}

async function connect(message: Record<string, unknown> = MINE, selfId: string | null = 'users/1') {
  const edits: { name: string; text: string }[] = []
  let current: Record<string, unknown> = { ...message }
  const chat = {
    message: async () => current,
    self: async () => ({ id: selfId, name: 'Syafiq' }),
    senderOf: async () => 'Hong Liang',
    resolveSpace: async (ref: string) => {
      expect(ref).toBe('spaces/AAA')
      return SPACE
    },
    label: async () => 'CRP45',
    edit: async (name: string, text: string) => {
      edits.push({ name, text })
      return { ...current, text, lastUpdateTime: '2026-11-14T00:10:00Z' }
    },
  } as unknown as Chat
  const log = join(mkdtempSync(join(tmpdir(), 'gchat-')), 'sent.log')
  const server = new McpServer({ name: 'gchat', version: 't' })
  registerTools(server, chat, log)
  const client = new Client({ name: 't', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(a), client.connect(b)])
  const call = async (name: string, args: Record<string, unknown>) => {
    const res: any = await client.callTool({ name, arguments: args })
    return { text: String(res.content[0].text), isError: !!res.isError }
  }
  return { client, call, edits, log, change: () => (current = { ...current, lastUpdateTime: '2026-11-14T00:05:00Z' }) }
}

const NEW_TEXT = '**Title**\n- one\n- two'

describe('message_edit is a hard lock in Claude Code', () => {
  test('only message_edit carries requiresUserInteraction', async () => {
    const { client } = await connect()
    const tools = (await client.listTools()).tools
    const meta = (name: string) => tools.find((t) => t.name === name)?._meta ?? {}
    expect(meta('message_edit')['anthropic/requiresUserInteraction']).toBe(true)
    expect(meta('message_edit_preview')['anthropic/requiresUserInteraction']).toBeUndefined()
  })
})

describe('editOpening', () => {
  test('never cuts an emoji in half, so was survives a UTF-8 round trip', () => {
    const opening = editOpening(`${'a'.repeat(59)}😀bcd`)
    expect(opening).toBe(`${'a'.repeat(59)}😀…`)
    expect(new TextDecoder().decode(new TextEncoder().encode(opening))).toBe(opening)
  })

  test('exactly 60 characters gets no ellipsis, and empty text says so', () => {
    expect(editOpening('b'.repeat(60))).toBe('b'.repeat(60))
    expect(editOpening('  \n ')).toBe('(no text)')
  })
})

describe('message_edit_preview', () => {
  test('shows the chat, the current text, recipient and version, and changes nothing', async () => {
    const { call, edits } = await connect()
    const { text, isError } = await call('message_edit_preview', { message: MINE.name, text: NEW_TEXT })
    expect(isError).toBe(false)
    expect(text).toContain('Edit your message in CRP45 (spaces/AAA), sent 14/11/2026 07:57.')
    expect(text).toContain('Current text:\n*Title* • one • two')
    expect(text).toContain('recipient: CRP45')
    expect(text).toContain('version: 2026-11-13T23:57:00Z')
    expect(text.endsWith('was: *Title* • one • two')).toBe(true)
    expect(edits).toEqual([])
  })

  test('says when it is a thread reply, has files, or is over the cap', async () => {
    const { call } = await connect({ ...MINE, threadReply: true, attachment: [{ contentName: 'a.png' }], text: 'x'.repeat(1200) })
    const { text } = await call('message_edit_preview', { message: MINE.name, text: NEW_TEXT })
    expect(text).toContain('Edit your message (a reply in a thread) in CRP45')
    expect(text).toContain('It has 1 file, which stay.')
    expect(text).toContain('The current text is over 1000 characters')
    expect(text).toContain(`was: ${'x'.repeat(60)}…`)
  })

  test('refuses a message name carrying query characters', async () => {
    const { call } = await connect()
    const { text, isError } = await call('message_edit_preview', { message: 'spaces/AAA/messages/m1?allowMissing=true', text: NEW_TEXT })
    expect(isError).toBe(true)
    expect(text).toContain('Input validation error')
  })

  test('refuses someone else\'s message', async () => {
    const { call } = await connect({ ...MINE, sender: { name: 'users/2' } })
    const { text, isError } = await call('message_edit_preview', { message: MINE.name, text: NEW_TEXT })
    expect(isError).toBe(true)
    expect(text).toContain('sent by Hong Liang, not you')
  })

  test('refuses when it cannot tell who you are', async () => {
    const { call } = await connect(MINE, null)
    const { isError, text } = await call('message_edit_preview', { message: MINE.name, text: NEW_TEXT })
    expect(isError).toBe(true)
    expect(text).toContain('Could not tell which user is you')
  })

  test('refuses a deleted message', async () => {
    const { call } = await connect({ ...MINE, deletionMetadata: {} })
    const { isError, text } = await call('message_edit_preview', { message: MINE.name, text: NEW_TEXT })
    expect(isError).toBe(true)
    expect(text).toContain('was deleted')
  })
})

describe('message_edit', () => {
  test('edits when recipient, was and version match, and logs it', async () => {
    const { call, edits, log } = await connect()
    const { text } = await call('message_edit', { recipient: 'CRP45', message: MINE.name, text: NEW_TEXT, version: '2026-11-13T23:57:00Z', was: '*Title* • one • two' })
    expect(text).toContain('Edited your message in CRP45 (spaces/AAA) at 14/11/2026 08:10.')
    expect(edits).toEqual([{ name: MINE.name, text: NEW_TEXT }])
    expect(readFileSync(log, 'utf8')).toContain('\tEDITED\tspaces/AAA/messages/m1\t')
  })

  test('refuses a wrong recipient', async () => {
    const { call, edits } = await connect()
    const { text } = await call('message_edit', { recipient: 'Dourr', message: MINE.name, text: NEW_TEXT, version: '2026-11-13T23:57:00Z', was: '*Title* • one • two' })
    expect(text).toStartWith('NOT EDITED: recipient "Dourr"')
    expect(edits).toEqual([])
  })

  test('refuses a was that does not match the message being replaced', async () => {
    const { call, edits } = await connect()
    const { text } = await call('message_edit', { recipient: 'CRP45', message: MINE.name, text: NEW_TEXT, version: '2026-11-13T23:57:00Z', was: 'Some other message' })
    expect(text).toStartWith('NOT EDITED: was "Some other message" does not match')
    expect(edits).toEqual([])
  })

  test('refuses when the message changed since the preview', async () => {
    const { call, edits, change } = await connect()
    change()
    const { text } = await call('message_edit', { recipient: 'CRP45', message: MINE.name, text: NEW_TEXT, version: '2026-11-13T23:57:00Z', was: '*Title* • one • two' })
    expect(text).toStartWith('NOT EDITED: the message changed since the preview')
    expect(edits).toEqual([])
  })
})
