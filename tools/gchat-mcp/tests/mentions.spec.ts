import { describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Chat } from '../src/chat.ts'
import { planMentions } from '../src/mentions.ts'
import { registerTools } from '../src/tools.ts'

const SPACE = { name: 'spaces/AAA', displayName: 'Autorentic', spaceType: 'SPACE' as const }
const NAMES: Record<string, string> = {
  'users/1': 'Thean Kwok Lim',
  'users/2': 'Thean',
  'users/3': 'Man Hou',
  'users/9': 'Syafiq (you)',
}
const posts = (...ids: string[]) => ids.map((id, i) => ({ name: `spaces/AAA/messages/p${i}`, createTime: '2026-11-18T01:00:00Z', text: 'hi', sender: { name: id } }))
const MINE = { name: 'spaces/AAA/messages/m1', createTime: '2026-11-18T01:30:00Z', text: 'old words', sender: { name: 'users/9' } }
const TAG = (id: string) => `<chat-user data-user="users/${id}">`

async function connect(history = posts('users/1', 'users/2', 'users/3', 'users/9'), readFails = false) {
  const sent: string[] = []
  const edits: string[] = []
  const chat = {
    resolveSpace: async () => SPACE,
    label: async () => 'Autorentic',
    senderOf: async (m: { sender?: { name?: string } }) => NAMES[m.sender?.name ?? ''] ?? m.sender?.name,
    latest: async () => history[0] ?? null,
    messages: async () => {
      if (readFails) throw new Error('Google API 403')
      return history
    },
    self: async () => ({ id: 'users/9', name: 'Syafiq' }),
    message: async () => MINE,
    send: async (_s: string, text: string) => {
      sent.push(text)
      return { name: 'spaces/AAA/messages/n1', createTime: '2026-11-18T02:00:00Z' }
    },
    edit: async (_n: string, text: string) => {
      edits.push(text)
      return { ...MINE, text, lastUpdateTime: '2026-11-18T02:10:00Z' }
    },
  } as unknown as Chat
  const server = new McpServer({ name: 'gchat', version: 't' })
  registerTools(server, chat, join(mkdtempSync(join(tmpdir(), 'gchat-')), 'sent.log'))
  const client = new Client({ name: 't', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(a), client.connect(b)])
  const call = async (name: string, args: Record<string, unknown>) => {
    const res: any = await client.callTool({ name, arguments: args })
    return { text: String(res.content[0].text), isError: !!res.isError }
  }
  return { call, sent, edits, client }
}

const PEOPLE = [
  { id: 'users/1', name: 'Thean Kwok Lim' },
  { id: 'users/2', name: 'Thean' },
  { id: 'users/3', name: 'Man Hou' },
]

describe('planMentions', () => {
  test('a whole display name becomes a mention, case-insensitively', () => {
    const plan = planMentions('hi @man hou, see this', PEOPLE)
    expect(plan.text).toBe(`hi ${TAG('3')}, see this`)
    expect(plan.mentions).toBe('@Man Hou -> users/3')
  })

  test('the longest name wins, and the shorter one still matches on its own', () => {
    const plan = planMentions('@Thean Kwok Lim and @Thean', PEOPLE)
    expect(plan.text).toBe(`${TAG('1')} and ${TAG('2')}`)
    expect(plan.mentions).toBe('@Thean Kwok Lim -> users/1, @Thean -> users/2')
  })

  test('an email address and a mid-word @ are never touched', () => {
    const body = 'mail a@Thean.com or x@Man Hou or https://x.com/@Thean'
    const plan = planMentions(body, PEOPLE)
    expect(plan.text).toBe(body)
    expect(plan.mentions).toBe('')
  })

  test('only a whole name matches: @Theanx is not Thean', () => {
    const plan = planMentions('@Theanx', PEOPLE)
    expect(plan.text).toBe('@Theanx')
    expect(plan.notTagged).toEqual(['@Theanx'])
  })

  test('an unmatched name is listed with its capitalised words and left as typed', () => {
    const plan = planMentions('cc @Foo Bar please, (@Man Hou)', PEOPLE)
    expect(plan.notTagged).toEqual(['@Foo Bar'])
    expect(plan.text).toBe(`cc @Foo Bar please, (${TAG('3')})`)
  })

  test('two people with one display name are not tagged', () => {
    const plan = planMentions('@Sam', [...PEOPLE, { id: 'users/7', name: 'Sam' }, { id: 'users/8', name: 'Sam' }])
    expect(plan.text).toBe('@Sam')
    expect(plan.ambiguous).toEqual(['@Sam'])
  })
})

describe('message_send_preview and message_send agree', () => {
  test('the preview lists mentions and not-tagged names, and the send posts the transformed text', async () => {
    const { call, sent } = await connect()
    const body = 'cc @thean kwok lim and @Foo'
    const preview = await call('message_send_preview', { space: 'spaces/AAA', text: body })
    expect(preview.text).toContain('\nmentions: @Thean Kwok Lim -> users/1\n')
    expect(preview.text).toContain('\nnot tagged (no one by that name posted here): @Foo\n')
    expect(preview.text).toContain('1 line, 27 chars')
    expect(sent).toEqual([])
    const mentions = /\nmentions: (.*)\n/.exec(preview.text)![1]
    const out = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: body, afterMessage: 'spaces/AAA/messages/p0', mentions })
    expect(out.text).toContain('Sent to Autorentic')
    expect(sent).toEqual([`cc ${TAG('1')} and @Foo`])
  })

  test('a send without the mentions value is refused, so the prompt always shows who is tagged', async () => {
    const { call, sent } = await connect()
    const out = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'hi @Man Hou', afterMessage: 'spaces/AAA/messages/p0' })
    expect(out.text).toContain('NOT SENT: the @mentions do not match the preview')
    expect(sent).toEqual([])
  })

  test('a mentions value that no longer resolves the same way is refused', async () => {
    const { call, sent } = await connect(posts('users/3', 'users/9'))
    const out = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'hi @Thean', afterMessage: 'spaces/AAA/messages/p0', mentions: '@Thean -> users/2' })
    expect(out.text).toContain('NOT SENT: the @mentions do not match')
    expect(sent).toEqual([])
  })

  test('text with no @ sends as typed and never reads the chat history', async () => {
    const { call, sent } = await connect(posts('users/3'), true)
    const out = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'mail a@b.com', afterMessage: 'spaces/AAA/messages/p0' })
    expect(out.text).toContain('Sent to Autorentic')
    expect(sent).toEqual(['mail a@b.com'])
  })

  test('when the history cannot be read, nothing is sent rather than posting a plain-text name', async () => {
    const { call, sent } = await connect(posts('users/3'), true)
    const out = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'hi @Man Hou', afterMessage: 'spaces/AAA/messages/p0', mentions: '@Man Hou -> users/3' })
    expect(out.isError).toBe(true)
    expect(out.text).toContain('so @names cannot be turned into mentions')
    expect(sent).toEqual([])
  })

  test('the yourself sender is never offered as a person to tag', async () => {
    const { call } = await connect()
    const preview = await call('message_send_preview', { space: 'spaces/AAA', text: 'note to @Syafiq' })
    expect(preview.text).toContain('not tagged (no one by that name posted here): @Syafiq')
  })
})

describe('message_edit with mentions', () => {
  const args = { message: MINE.name, version: MINE.createTime, was: 'old words' }

  test('the preview says an edit notifies nobody, and the edit sends the transformed text', async () => {
    const { call, edits } = await connect()
    const preview = await call('message_edit_preview', { message: MINE.name, text: 'ping @Man Hou' })
    expect(preview.text).toContain('\nmentions: @Man Hou -> users/3\n')
    expect(preview.text).toContain('note: an edit notifies nobody')
    const out = await call('message_edit', { recipient: 'Autorentic', ...args, text: 'ping @Man Hou', mentions: '@Man Hou -> users/3' })
    expect(out.text).toContain('Edited your message')
    expect(edits).toEqual([`ping ${TAG('3')}`])
  })

  test('an edit missing the mentions value is refused', async () => {
    const { call, edits } = await connect()
    const out = await call('message_edit', { recipient: 'Autorentic', ...args, text: 'ping @Man Hou' })
    expect(out.text).toStartWith('NOT EDITED: the @mentions do not match')
    expect(edits).toEqual([])
  })

  test('an edit without @ names has no mention lines and no note', async () => {
    const { call, edits } = await connect()
    const preview = await call('message_edit_preview', { message: MINE.name, text: 'plain words' })
    expect(preview.text).not.toContain('mentions:')
    expect(preview.text).not.toContain('note:')
    await call('message_edit', { recipient: 'Autorentic', ...args, text: 'plain words' })
    expect(edits).toEqual(['plain words'])
  })
})
