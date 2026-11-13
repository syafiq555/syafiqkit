import { describe, expect, test } from 'bun:test'
import { mkdtempSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Chat } from '../src/chat.ts'
import { checkSendFile, isSecretPath, registerTools } from '../src/tools.ts'

const SPACE = { name: 'spaces/AAA', displayName: 'Autorentic', spaceType: 'SPACE' as const }
const LAST = { name: 'spaces/AAA/messages/old', createTime: '2026-11-13T01:00:00Z', text: 'earlier', sender: { name: 'users/9' } }
const AFTER = 'spaces/AAA/messages/old'

function files() {
  const dir = mkdtempSync(join(tmpdir(), 'gchat-send-'))
  const shot = join(dir, 'shot.png')
  const pdf = join(dir, 'quote.pdf')
  writeFileSync(shot, new Uint8Array(2048))
  writeFileSync(pdf, 'pdf bytes')
  return { dir, shot, pdf }
}

async function connect() {
  const uploads: { space: string; filename: string; bytes: number; contentType: string }[] = []
  const sent: { text: string; refs: unknown[] }[] = []
  const chat = {
    resolveSpace: async () => SPACE,
    label: async () => 'Autorentic',
    senderOf: async () => 'Man Hou',
    latest: async () => LAST,
    upload: async (space: string, filename: string, data: Uint8Array, contentType: string) => {
      uploads.push({ space, filename, bytes: data.byteLength, contentType })
      return { resourceName: `ref-${filename}` }
    },
    send: async (_space: string, text: string, _thread: string | undefined, refs: unknown[] = []) => {
      sent.push({ text, refs })
      return { name: 'spaces/AAA/messages/m1', createTime: '2026-11-13T02:00:00Z', thread: { name: 'spaces/AAA/threads/t1' } }
    },
  } as unknown as Chat
  const server = new McpServer({ name: 'gchat', version: 't' })
  registerTools(server, chat, join(mkdtempSync(join(tmpdir(), 'gchat-log-')), 'sent.log'))
  const client = new Client({ name: 't', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(a), client.connect(b)])
  const call = async (name: string, args: Record<string, unknown>) => {
    const res: any = await client.callTool({ name, arguments: args })
    return { text: String(res.content[0].text), isError: !!res.isError }
  }
  return { call, uploads, sent }
}

describe('sending files', () => {
  test('the preview names each file and size, and uploads nothing', async () => {
    const { shot, pdf } = files()
    const { call, uploads } = await connect()
    const { text } = await call('message_send_preview', { space: 'spaces/AAA', text: 'Here you go', files: [shot, pdf] })
    expect(text.split('\n')[0]).toContain('With 2 files: shot.png (2 KB), quote.pdf (9 B).')
    expect(uploads).toEqual([])
  })

  test('message_send uploads each file, then posts them with the text', async () => {
    const { shot, pdf } = files()
    const { call, uploads, sent } = await connect()
    const { text } = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'Here you go', files: [shot, pdf], afterMessage: AFTER })
    expect(text).toContain('Sent to Autorentic (spaces/AAA) with 2 files')
    expect(uploads).toEqual([
      { space: 'spaces/AAA', filename: 'shot.png', bytes: 2048, contentType: 'image/png' },
      { space: 'spaces/AAA', filename: 'quote.pdf', bytes: 9, contentType: 'application/pdf' },
    ])
    expect(sent).toEqual([{ text: 'Here you go', refs: [{ resourceName: 'ref-shot.png' }, { resourceName: 'ref-quote.pdf' }] }])
  })

  test('files alone are allowed', async () => {
    const { shot } = files()
    const { call, sent } = await connect()
    await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', files: [shot], afterMessage: AFTER })
    expect(sent[0]!.text).toBe('')
  })

  test('a missing, relative or empty request is refused before anything is uploaded', async () => {
    const { dir } = files()
    const { call, uploads, sent } = await connect()
    const missing = await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'x', files: [join(dir, 'nope.png')], afterMessage: AFTER })
    expect(missing.isError).toBe(true)
    expect(missing.text).toContain('does not exist. Nothing was sent.')
    expect((await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: 'x', files: ['shot.png'], afterMessage: AFTER })).text).toContain('is not an absolute path')
    expect((await call('message_send', { recipient: 'Autorentic', space: 'spaces/AAA', text: '   ', afterMessage: AFTER })).text).toContain('Give text, files, or both')
    expect(uploads).toEqual([])
    expect(sent).toEqual([])
  })
})

describe('what message_send will attach', () => {
  test('keys, credentials and config folders are never sent', () => {
    const home = '/Users/me'
    for (const p of ['/Users/me/.ssh/id_rsa', '/Users/me/.aws/credentials', '/Users/me/.config/gchat-mcp/token.json', '/Users/me/.claude/settings.json', '/repo/.env', '/repo/.env.production', '/x/server.pem', '/x/cert.p12', '/tmp/id_ed25519']) {
      expect(isSecretPath(p, home)).toBe(true)
    }
    for (const p of ['/Users/me/Library/Application Support/Google/Chrome/Default/Cookies', '/Users/me/.zshrc', '/Users/me/.gitconfig', '/repo/.mcp.json', '/repo/.claude/settings.local.json', '/x/AuthKey_ABC.p8', '/x/app.sqlite', '/x/service-account-prod.json', '/repo/.npmrc', '/repo/.netrc', '/Users/me/.zshenv']) {
      expect(isSecretPath(p, home)).toBe(true)
    }
    for (const p of ['/Users/me/.claude.json', '/Users/me/.npmrc', '/Users/me/.netrc', '/Users/me/.git-credentials', '/Users/me/.zsh_history', '/Users/me/Library/Keychains/login.keychain-db', '/repo/auth.json', '/repo/CLAUDE.local.md', '/Users/me/.SSH/config', '/x/credentials.json', '/x/secrets.yaml']) {
      expect(isSecretPath(p, home)).toBe(true)
    }
    for (const p of ['/Users/me/Downloads/shot.png', '/repo/environment.md', '/Users/me/configs.txt', '/tmp/key-points.pdf', '/repo/CLAUDE.md']) {
      expect(isSecretPath(p, home)).toBe(false)
    }
  })

  test('a symlink is judged and sent by the file it points to', () => {
    const { dir, shot } = files()
    const link = join(dir, 'innocent.png')
    symlinkSync(shot, link)
    const f = checkSendFile(link)
    expect(f.path).toBe(realpathSync(shot))
    expect(f.name).toBe('shot.png')
  })

  test('a Google refusal says NOT SENT; a timeout says it may have posted', async () => {
    for (const [error, expected] of [
      ['Google API 400: bad thread', 'NOT SENT: Google refused the message'],
      ['Google API 503: busy', 'UNSURE WHETHER SENT'],
      ['Google API 408: timeout', 'UNSURE WHETHER SENT'],
      ['No answer from Google within 30 s', 'UNSURE WHETHER SENT'],
      ['Google API 409: Message already exists', 'ALREADY POSTED'],
      ['Google API 409: aborted', 'UNSURE WHETHER SENT'],
    ] as const) {
      const chat = {
        resolveSpace: async () => SPACE,
        label: async () => 'Autorentic',
        senderOf: async () => 'Man Hou',
        latest: async () => LAST,
        send: async () => {
          throw new Error(error)
        },
      } as unknown as Chat
      const server = new McpServer({ name: 'gchat', version: 't' })
      registerTools(server, chat, join(mkdtempSync(join(tmpdir(), 'gchat-log-')), 'sent.log'))
      const client = new Client({ name: 't', version: '1' })
      const [a, b] = InMemoryTransport.createLinkedPair()
      await Promise.all([server.connect(a), client.connect(b)])
      const res: any = await client.callTool({ name: 'message_send', arguments: { recipient: 'Autorentic', space: 'spaces/AAA', text: 'x', afterMessage: AFTER } })
      expect(String(res.content[0].text)).toStartWith(expected)
    }
  })
})

test('an attachment reference that is not a plain media name is never fetched', async () => {
  const { Chat } = await import('../src/chat.ts')
  let fetched = false
  const chat = new Chat({ bytes: async () => { fetched = true; return { data: new Uint8Array(), contentType: null } } } as any)
  await expect(chat.media('a/../../v1/spaces', 10)).rejects.toThrow('Unexpected attachment reference')
  await expect(chat.media('ref?x=1', 10)).rejects.toThrow('Unexpected attachment reference')
  expect(fetched).toBe(false)
  await chat.media('ABC_123-x/y=', 10)
  expect(fetched).toBe(true)
})
