import { describe, expect, test } from 'bun:test'
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Chat } from '../src/chat.ts'
import { mentionLines, planMentions } from '../src/mentions.ts'
import { registerTools } from '../src/tools.ts'

const POSTS = ['users/1', 'users/2', 'users/3', 'users/9'].map((id, i) => ({ name: `spaces/AAA/messages/p${i}`, createTime: '2026-11-18T01:00:00Z', text: 'hi', sender: { name: id } }))
const MINE = { name: 'spaces/AAA/messages/m1', createTime: '2026-11-18T01:30:00Z', text: 'old words', sender: { name: 'users/9' } }
const TAG = (id: string) => `<chat-user data-user="users/${id}">`

const MEMBERS = [
  { id: 'users/1', name: 'Thean Kwok Lim' },
  { id: 'users/2', name: 'Thean' },
  { id: 'users/3', name: 'Man Hou' },
]

async function connect(opts: { members?: { id: string; name: string }[]; readFails?: boolean; spaceType?: 'SPACE' | 'DIRECT_MESSAGE' } = {}) {
  const members = [...(opts.members ?? MEMBERS)]
  const sent: string[] = []
  const edits: string[] = []
  const space = { name: 'spaces/AAA', displayName: 'Autorentic', spaceType: opts.spaceType ?? ('SPACE' as const) }
  const chat = {
    resolveSpace: async () => space,
    label: async () => 'Autorentic',
    senderOf: async () => 'Someone',
    latest: async () => POSTS[0] ?? null,
    humanMembers: async () => {
      if (opts.readFails) throw new Error('Google API 403')
      return members
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
  return { call, sent, edits, members }
}

const sendArgs = { recipient: 'Autorentic', space: 'spaces/AAA', afterMessage: 'spaces/AAA/messages/p0' }

describe('planMentions', () => {
  test('a whole display name becomes a mention, case-insensitively', () => {
    const plan = planMentions('hi @man hou, see this', MEMBERS)
    expect(plan.text).toBe(`hi ${TAG('3')}, see this`)
    expect(plan.mentions).toBe('@Man Hou -> users/3')
  })

  test('a mention at the very start or end of the body is tagged', () => {
    expect(planMentions('@Man Hou first', MEMBERS).text).toBe(`${TAG('3')} first`)
    expect(planMentions('last @Man Hou', MEMBERS).text).toBe(`last ${TAG('3')}`)
  })

  test('the same person mentioned twice is tagged twice and listed once', () => {
    const plan = planMentions('@Man Hou and again @man hou', MEMBERS)
    expect(plan.text).toBe(`${TAG('3')} and again ${TAG('3')}`)
    expect(plan.mentions).toBe('@Man Hou -> users/3')
  })

  test('the longest name wins, and the shorter one still matches on its own', () => {
    const plan = planMentions('@Thean Kwok Lim and @Thean', MEMBERS)
    expect(plan.text).toBe(`${TAG('1')} and ${TAG('2')}`)
    expect(plan.mentions).toBe('@Thean Kwok Lim -> users/1, @Thean -> users/2')
  })

  test('an email address and a mid-word @ are never touched', () => {
    const body = 'mail a@Thean.com or x@Man Hou or https://x.com/@Thean'
    const plan = planMentions(body, MEMBERS)
    expect(plan.text).toBe(body)
    expect(plan.mentions).toBe('')
    expect(plan.notTagged).toEqual([])
  })

  test('a name after a colon, bracket or parenthesis is still taggable', () => {
    expect(planMentions('cc:@Man Hou', MEMBERS).text).toBe(`cc:${TAG('3')}`)
    expect(planMentions('[@Man Hou]', MEMBERS).text).toBe(`[${TAG('3')}]`)
    expect(planMentions('(@Man Hou);', MEMBERS).text).toBe(`(${TAG('3')});`)
  })

  test('only a whole name matches: @Theanx is not Thean', () => {
    const plan = planMentions('@Theanx', MEMBERS)
    expect(plan.text).toBe('@Theanx')
    expect(plan.notTagged).toEqual([{ typed: '@Theanx', guesses: [] }])
  })

  test('two members with one display name, even differing only in case, are not tagged', () => {
    const plan = planMentions('@sam', [...MEMBERS, { id: 'users/7', name: 'Sam' }, { id: 'users/8', name: 'SAM' }])
    expect(plan.text).toBe('@sam')
    expect(plan.ambiguous).toEqual(['@sam'])
  })

  test('more typed than the matched name means no tag: wrong-person risk', () => {
    const cases: [string, string][] = [
      ['@Man Hou Lee', '@Man Hou Lee'],
      ['@Thean-Lee', '@Thean-Lee'],
      ["@Thean's", "@Thean's"],
      ['@Thean.Lee', '@Thean.Lee'],
      ['@Theań', '@Theań'],
    ]
    for (const [body, typed] of cases) {
      const plan = planMentions(body, MEMBERS)
      expect(plan.text).toBe(body)
      expect(plan.mentions).toBe('')
      expect(plan.notTagged[0]!.typed).toBe(typed)
    }
  })

  test('a name followed by sentence punctuation and a capital word is still tagged', () => {
    expect(planMentions('thanks @Thean. Next up', MEMBERS).text).toBe(`thanks ${TAG('2')}. Next up`)
  })

  test('@Ana Lee with only Ana a member is not tagged and hints at Ana', () => {
    const plan = planMentions('ping @Ana Lee', [{ id: 'users/5', name: 'Ana' }])
    expect(plan.text).toBe('ping @Ana Lee')
    expect(plan.notTagged).toEqual([{ typed: '@Ana Lee', guesses: ['Ana'] }])
  })

  test('@Hong Liang suggests Hong Liang Ng and tags nothing', () => {
    const plan = planMentions('cc @Hong Liang please', [{ id: 'users/4', name: 'Hong Liang Ng' }])
    expect(plan.text).toBe('cc @Hong Liang please')
    expect(plan.notTagged).toEqual([{ typed: '@Hong Liang', guesses: ['Hong Liang Ng'] }])
    expect(mentionLines(plan)).toEqual(['not tagged (no member by that exact name): @Hong Liang (did you mean @Hong Liang Ng?)'])
  })

  test('a name contained as whole words is suggested, a stranger gets "no similar"', () => {
    const plan = planMentions('@Kwok Lim and @Foo', MEMBERS)
    expect(mentionLines(plan)).toEqual(['not tagged (no member by that exact name): @Kwok Lim (did you mean @Thean Kwok Lim?); @Foo (no similar member name)'])
  })

  test('code spans, fences and an escaped @ are skipped', () => {
    for (const body of ['run `@Man Hou` now', '```\n@Man Hou\n```', 'literal \\@Man Hou', 'a `x` and `@Foo Bar`']) {
      const plan = planMentions(body, MEMBERS)
      expect(plan.text).toBe(body)
      expect(plan.mentions).toBe('')
      expect(plan.notTagged).toEqual([])
    }
    expect(planMentions('`code` then @Man Hou', MEMBERS).text).toBe(`\`code\` then ${TAG('3')}`)
  })

  test('display names lose control characters, newlines and doubled spaces', () => {
    const plan = planMentions('hi @Man Hou', [{ id: 'users/3', name: 'Man\n\u0007 Hou​  ' }])
    expect(plan.mentions).toBe('@Man Hou -> users/3')
    expect(plan.pool).toEqual(['Man Hou'])
  })

  test('the can-be-tagged line caps at 15 names and only shows when something was not tagged', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ id: `users/${100 + i}`, name: `Person ${String.fromCharCode(65 + i)}` }))
    const plan = planMentions('@Nobody', many)
    const line = mentionLines(plan, { listMembers: true }).find((l) => l.startsWith('can be tagged here'))!
    expect(line.endsWith(', and 5 more')).toBe(true)
    expect(line.split(', ')).toHaveLength(16)
    expect(mentionLines(planMentions('@Person A', many), { listMembers: true })).toEqual(['mentions: @Person A -> users/100'])
  })
})

describe('message_send_preview and message_send agree', () => {
  test('the preview lists mentions, not-tagged names and who can be tagged, and the send posts the transformed text', async () => {
    const { call, sent } = await connect()
    const body = 'cc @thean kwok lim and @Foo'
    const preview = await call('message_send_preview', { space: 'spaces/AAA', text: body })
    expect(preview.text).toContain('\nmentions: @Thean Kwok Lim -> users/1\n')
    expect(preview.text).toContain('\nnot tagged (no member by that exact name): @Foo (no similar member name)\n')
    expect(preview.text).toContain('\ncan be tagged here: Thean Kwok Lim, Thean, Man Hou\n')
    expect(preview.text).toContain('1 line, 27 chars')
    expect(sent).toEqual([])
    const mentions = /\nmentions: (.*)\n/.exec(preview.text)![1]
    const out = await call('message_send', { ...sendArgs, text: body, mentions })
    expect(out.text).toContain('Sent to Autorentic')
    expect(sent).toEqual([`cc ${TAG('1')} and @Foo`])
  })

  test('in a DM the same names resolve but the can-be-tagged line is left out', async () => {
    const { call } = await connect({ spaceType: 'DIRECT_MESSAGE' })
    const preview = await call('message_send_preview', { space: 'spaces/AAA', text: '@Man Hou and @Foo' })
    expect(preview.text).toContain('\nmentions: @Man Hou -> users/3\n')
    expect(preview.text).toContain('not tagged (no member by that exact name): @Foo')
    expect(preview.text).not.toContain('can be tagged here')
  })

  test('a send without the mentions value is refused, so the prompt always shows who is tagged', async () => {
    const { call, sent } = await connect()
    const out = await call('message_send', { ...sendArgs, text: 'hi @Man Hou' })
    expect(out.text).toContain('NOT SENT: the @mentions do not match the preview')
    expect(sent).toEqual([])
  })

  test('a member who appears between the preview and the send makes the send refuse', async () => {
    const { call, sent, members } = await connect()
    const preview = await call('message_send_preview', { space: 'spaces/AAA', text: 'hi @Newbie' })
    expect(preview.text).not.toContain('mentions:')
    members.push({ id: 'users/6', name: 'Newbie' })
    const out = await call('message_send', { ...sendArgs, text: 'hi @Newbie' })
    expect(out.text).toContain('NOT SENT: the @mentions do not match')
    expect(sent).toEqual([])
  })

  test('a mentions value that no longer resolves the same way is refused', async () => {
    const { call, sent } = await connect({ members: [{ id: 'users/3', name: 'Man Hou' }] })
    const out = await call('message_send', { ...sendArgs, text: 'hi @Thean', mentions: '@Thean -> users/2' })
    expect(out.text).toContain('NOT SENT: the @mentions do not match')
    expect(sent).toEqual([])
  })

  test('text with no @ name, or only one inside code, sends as typed and never reads the members', async () => {
    const { call, sent } = await connect({ readFails: true })
    for (const text of ['mail a@b.com', 'run `@Man Hou`']) {
      const out = await call('message_send', { ...sendArgs, text })
      expect(out.text).toContain('Sent to Autorentic')
    }
    expect(sent).toEqual(['mail a@b.com', 'run `@Man Hou`'])
  })

  test('when the members cannot be read, nothing is sent rather than posting a plain-text name', async () => {
    const { call, sent } = await connect({ readFails: true })
    const out = await call('message_send', { ...sendArgs, text: 'hi @Man Hou', mentions: '@Man Hou -> users/3' })
    expect(out.isError).toBe(true)
    expect(out.text).toStartWith('NOT SENT: Could not read who is in spaces/AAA')
    expect(out.text).toContain('so @names cannot be turned into mentions')
    expect(sent).toEqual([])
  })

  test('your own name is not in the pool, so it is not tagged', async () => {
    const { call } = await connect()
    const preview = await call('message_send_preview', { space: 'spaces/AAA', text: 'note to @Syafiq' })
    expect(preview.text).toContain('not tagged (no member by that exact name): @Syafiq (no similar member name)')
  })

  test('a raw Chat mention tag is refused in the preview and the send', async () => {
    const { call, sent } = await connect()
    const refusal = 'NOT SENT: the text already contains a Chat mention tag; write @Full Name instead so the preview can list who is tagged.'
    for (const text of ['hi <users/123>', 'all <users/all>', 'x < USERS / 1 >', 'y <chat-user data-user="users/1">', 'z <Chat-User data-user="users/1">']) {
      expect((await call('message_send_preview', { space: 'spaces/AAA', text })).text).toBe(refusal)
      expect((await call('message_send', { ...sendArgs, text })).text).toBe(refusal)
    }
    expect(sent).toEqual([])
  })
})

describe('message_edit with mentions', () => {
  const args = { recipient: 'Autorentic', message: MINE.name, version: MINE.createTime, was: 'old words' }

  test('the preview says an edit notifies nobody, and the edit sends the transformed text', async () => {
    const { call, edits } = await connect()
    const preview = await call('message_edit_preview', { message: MINE.name, text: 'ping @Man Hou' })
    expect(preview.text).toContain('\nmentions: @Man Hou -> users/3\n')
    expect(preview.text).toContain('\nnote: an edit notifies nobody. To notify these people, post a new message instead.\n')
    const out = await call('message_edit', { ...args, text: 'ping @Man Hou', mentions: '@Man Hou -> users/3' })
    expect(out.text).toContain('Edited your message')
    expect(edits).toEqual([`ping ${TAG('3')}`])
  })

  test('an edit missing the mentions value is refused', async () => {
    const { call, edits } = await connect()
    const out = await call('message_edit', { ...args, text: 'ping @Man Hou' })
    expect(out.text).toStartWith('NOT EDITED: the @mentions do not match')
    expect(edits).toEqual([])
  })

  test('an edit refuses a raw tag and a failed member read, each with its own prefix', async () => {
    const { call, edits } = await connect({ readFails: true })
    const raw = await call('message_edit', { ...args, text: 'hi <users/all>' })
    expect(raw.text).toBe('NOT EDITED: the text already contains a Chat mention tag; write @Full Name instead so the preview can list who is tagged.')
    expect((await call('message_edit_preview', { message: MINE.name, text: '<users/1>' })).text).toStartWith('NOT EDITED: the text already contains')
    const failed = await call('message_edit', { ...args, text: 'hi @Man Hou', mentions: '@Man Hou -> users/3' })
    expect(failed.isError).toBe(true)
    expect(failed.text).toStartWith('NOT EDITED: Could not read who is in')
    expect(edits).toEqual([])
  })

  test('an edit without @ names has no mention lines and no note', async () => {
    const { call, edits } = await connect()
    const preview = await call('message_edit_preview', { message: MINE.name, text: 'plain words' })
    expect(preview.text).not.toContain('mentions:')
    expect(preview.text).not.toContain('note:')
    await call('message_edit', { ...args, text: 'plain words' })
    expect(edits).toEqual(['plain words'])
  })
})
