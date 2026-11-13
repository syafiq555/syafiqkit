import { describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Chat } from '../src/chat.ts'
import { registerTools, sendId } from '../src/tools.ts'
import { sendPreview } from '../src/format.ts'

const SPACE = { name: 'spaces/AAA', displayName: 'Autorentic', spaceType: 'SPACE' as const }
const OLD = { name: 'spaces/AAA/messages/old', createTime: '2026-11-13T01:00:00Z', text: 'earlier', sender: { name: 'users/9' } }
const NEW = { name: 'spaces/AAA/messages/new', createTime: '2026-11-13T01:05:00Z', text: 'actually never mind', sender: { name: 'users/9' } }

async function connect(latest: typeof OLD | null = OLD) {
  const sent: { space: string; text: string; thread?: string }[] = []
  let current = latest
  const chat = {
    resolveSpace: async () => SPACE,
    label: async () => 'Autorentic',
    senderOf: async () => 'Man Hou',
    latest: async () => current,
    send: async (space: string, text: string, thread?: string) => {
      sent.push({ space, text, thread })
      return { name: 'spaces/AAA/messages/m1', createTime: '2026-11-13T02:00:00Z', thread: { name: 'spaces/AAA/threads/t1' } }
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
  return { client, call, sent, log, moveOn: () => (current = NEW) }
}

describe('message_send is a hard lock in Claude Code', () => {
  test('only message_send carries requiresUserInteraction, as the JSON boolean true', async () => {
    const { client } = await connect()
    const tools = (await client.listTools()).tools
    const meta = (name: string) => tools.find((t) => t.name === name)?._meta ?? {}
    expect(meta('message_send')['anthropic/requiresUserInteraction']).toBe(true)
    expect(meta('message_send_preview')['anthropic/requiresUserInteraction']).toBeUndefined()
    expect(meta('messages_list')['anthropic/requiresUserInteraction']).toBeUndefined()
  })
})

describe('message_send_preview', () => {
  test('returns who, size and last message, plus the newest message name, and sends nothing', async () => {
    const { call, sent } = await connect()
    const { text } = await call('message_send_preview', { space: 'spaces/AAA', text: 'Deploy done' })
    expect(text).toBe(
      'Send as you to Autorentic (spaces/AAA) [space], as a new top-level message. 1 line, 11 chars. Last message there: Man Hou, 13/11/2026 09:00.\nrecipient: Autorentic\nafterMessage: spaces/AAA/messages/old',
    )
    expect(sent).toEqual([])
  })

  test('an empty chat reports afterMessage none', async () => {
    const { call } = await connect(null)
    const { text } = await call('message_send_preview', { space: 'spaces/AAA', text: 'hi' })
    expect(text.endsWith('afterMessage: none')).toBe(true)
  })
})

describe('message_send', () => {
  test('posts when afterMessage is still the newest message, and logs it', async () => {
    const { call, sent, log } = await connect()
    const { text } = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'Deploy done', afterMessage: 'spaces/AAA/messages/old' })
    expect(text).toContain('Sent to Autorentic (spaces/AAA)')
    expect(sent).toEqual([{ space: 'spaces/AAA', text: 'Deploy done', thread: undefined }])
    expect(readFileSync(log, 'utf8')).toContain('"Deploy done"')
  })

  test('a thread reply is not sent if the thread moved on after the preview', async () => {
    const { call, sent, log, moveOn } = await connect()
    moveOn()
    const { text } = await call('message_send', {
      recipient: 'Autorentic',
      space: 'spaces/AAA',
      thread: 'spaces/AAA/threads/t',
      text: 'ok sure',
      afterMessage: 'spaces/AAA/messages/old',
    })
    expect(text).toContain('NOT SENT: the chat moved on since the preview')
    expect(text).toContain('actually never mind')
    expect(sent).toEqual([])
    expect(existsSync(log)).toBe(false)
  })

  test('a new top-level post in a space is not held back by chatter elsewhere', async () => {
    const { call, sent, moveOn } = await connect()
    moveOn()
    const { text } = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'Release note', afterMessage: 'spaces/AAA/messages/old' })
    expect(text).toContain('Sent to Autorentic')
    expect(sent.length).toBe(1)
  })

  test('the same text after the same preview carries the same message id, so Google can refuse a double post', () => {
    const a = sendId('spaces/AAA', 'spaces/AAA/messages/old', 'hi', undefined, [])
    expect(a).toMatch(/^client-[0-9a-f]{56}$/)
    expect(sendId('spaces/AAA', 'spaces/AAA/messages/old', 'hi', undefined, [])).toBe(a)
    expect(sendId('spaces/AAA', 'spaces/AAA/messages/old', 'hi again', undefined, [])).not.toBe(a)
  })

  test('text over 1000 characters is refused with a nudge to split it, and nothing is sent', async () => {
    const { call, sent } = await connect()
    const { text, isError } = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'x'.repeat(1001), afterMessage: 'spaces/AAA/messages/old' })
    expect(isError).toBe(true)
    expect(text).toContain('split it into several messages')
    expect(sent).toEqual([])
  })

  test('a recipient that does not match the space is refused', async () => {
    const { call, sent } = await connect()
    const { text } = await call('message_send', { recipient: 'Man Hou', space: 'spaces/AAA', text: 'x', afterMessage: 'spaces/AAA/messages/old' })
    expect(text).toBe('NOT SENT: recipient "Man Hou" does not match Autorentic (spaces/AAA). Preview again with the same text and show the user the right name.')
    expect(sent).toEqual([])
  })

  test('afterMessage none on an empty chat sends', async () => {
    const { call, sent } = await connect(null)
    await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'first!', afterMessage: 'none' })
    expect(sent.length).toBe(1)
  })

  test('a display name instead of a space name is refused, so the prompt names the real target', async () => {
    const { call, sent } = await connect()
    const out = await call('message_send', { space: 'Autorentic', text: 'x', afterMessage: 'spaces/AAA/messages/old' })
    expect(out.isError).toBe(true)
    expect(sent).toEqual([])
  })

  test('a thread from another space is refused', async () => {
    const { call, sent } = await connect()
    const { text } = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'x', thread: 'spaces/BBB/threads/t', afterMessage: 'spaces/AAA/messages/old' })
    expect(text).toContain('not in spaces/AAA')
    expect(sent).toEqual([])
  })
})

describe('preview line', () => {
  test('says who, what kind, size and the last message', () => {
    expect(
      sendPreview({
        to: 'Autorentic (spaces/AAA)',
        space: { spaceType: 'SPACE', membershipCount: { joinedDirectHumanUserCount: 12 } },
        thread: false,
        body: 'line one\nline two',
        last: { who: 'Man Hou', at: '2026-11-13T10:47:00Z' },
      }),
    ).toBe('Send as you to Autorentic (spaces/AAA) [space, 12 people], as a new top-level message. 2 lines, 17 chars. Last message there: Man Hou, 13/11/2026 18:47.')
  })

  test('a DM says DM, a thread says so, and files-only says no text', () => {
    expect(sendPreview({ to: 'DM: Man Hou (spaces/D)', space: { spaceType: 'DIRECT_MESSAGE' }, thread: true, body: '', last: null, files: [{ name: 'a.png', bytes: 2048 }] })).toBe(
      'Send as you to DM: Man Hou (spaces/D) [DM], as a reply in a thread. No text. With 1 file: a.png (2 KB).',
    )
  })
})

test('a chat whose members could not be read is never sent to, since the recipient cannot be checked', async () => {
  const sent: unknown[] = []
  const chat = {
    resolveSpace: async () => ({ name: 'spaces/D', spaceType: 'DIRECT_MESSAGE' }),
    label: async () => 'DM (members unknown)',
    latest: async () => null,
    send: async () => sent.push(1),
  } as unknown as Chat
  const server = new McpServer({ name: 'gchat', version: 't' })
  registerTools(server, chat, join(mkdtempSync(join(tmpdir(), 'gchat-')), 'sent.log'))
  const client = new Client({ name: 't', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(a), client.connect(b)])
  const res: any = await client.callTool({ name: 'message_send', arguments: { recipient: 'DM (members unknown)', space: 'spaces/D', text: 'x', afterMessage: 'none' } })
  expect(String(res.content[0].text)).toContain('Could not tell who is in spaces/D')
  expect(sent).toEqual([])
})
