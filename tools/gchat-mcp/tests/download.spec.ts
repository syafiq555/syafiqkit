import { describe, expect, test } from 'bun:test'
import { mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { Chat } from '../src/chat.ts'
import { registerTools } from '../src/tools.ts'

const MESSAGE = {
  name: 'spaces/AAA/messages/m1',
  createTime: '2026-11-13T10:00:00Z',
  attachment: [
    { contentName: 'SCR-1.png', contentType: 'image/png', source: 'UPLOADED_CONTENT', attachmentDataRef: { resourceName: 'ref-1' } },
    { contentName: '../../evil.png', contentType: 'image/png', source: 'UPLOADED_CONTENT', attachmentDataRef: { resourceName: 'ref-2' } },
    { contentName: 'Budget.xlsx', source: 'DRIVE_FILE', driveDataRef: { driveFileId: 'drive123' } },
  ],
}

async function connect(failRef?: string) {
  const asked: string[] = []
  const chat = {
    message: async (name: string) => {
      asked.push(name)
      return MESSAGE
    },
    media: async (ref: string) => {
      if (ref === failRef) throw new Error('Google API 403: denied')
      return { data: new TextEncoder().encode(`bytes of ${ref}`), contentType: 'image/png' }
    },
  } as unknown as Chat
  const root = mkdtempSync(join(tmpdir(), 'gchat-dl-test-'))
  const server = new McpServer({ name: 'gchat', version: 't' })
  registerTools(server, chat, join(root, 'sent.log'), root)
  const client = new Client({ name: 't', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(a), client.connect(b)])
  const call = async (args: Record<string, unknown>) => {
    const res: any = await client.callTool({ name: 'attachment_download', arguments: args })
    return { text: String(res.content[0].text), isError: !!res.isError }
  }
  return { call, root, asked }
}

const pathOf = (out: string, label: string) => out.split('\n').find((l) => l.startsWith(`${label}: /`))!.split(': ')[1]!.split(' (')[0]!

describe('attachment_download', () => {
  test('saves uploaded files into a fresh folder under the root and reports Drive files by link', async () => {
    const { call, root, asked } = await connect()
    const { text, isError } = await call({ message: 'spaces/AAA/messages/m1' })
    expect(isError).toBe(false)
    expect(asked).toEqual(['spaces/AAA/messages/m1'])

    const shot = pathOf(text, 'SCR-1.png')
    expect(shot.startsWith(`${root}/gchat-attachments-`)).toBe(true)
    expect(readFileSync(shot, 'utf8')).toBe('bytes of ref-1')
    expect(statSync(shot).mode & 0o777).toBe(0o600)

    const evil = pathOf(text, '../../evil.png')
    expect(evil.endsWith('/evil.png')).toBe(true)
    expect(evil.startsWith(`${root}/gchat-attachments-`)).toBe(true)

    expect(text).toContain('Budget.xlsx: a Google Drive file, not downloadable here (https://drive.google.com/file/d/drive123/view; the gsheets server')
  })

  test('file narrows to one attachment', async () => {
    const { call } = await connect()
    const { text } = await call({ message: 'spaces/AAA/messages/m1', file: 'scr' })
    expect(text).toContain('SCR-1.png: /')
    expect(text).not.toContain('evil')
    expect(text).not.toContain('Budget')
  })

  test('one failed download is reported and the rest still save', async () => {
    const { call } = await connect('ref-1')
    const { text } = await call({ message: 'spaces/AAA/messages/m1' })
    expect(text).toContain('SCR-1.png: not downloaded (Google API 403: denied)')
    expect(text).toContain('../../evil.png: /')
  })

  test('a name that is not a message is refused before any call', async () => {
    const { call, asked } = await connect()
    const { isError } = await call({ message: 'spaces/AAA/messages/m1/../../x' })
    expect(isError).toBe(true)
    expect(asked).toEqual([])
  })
})

test('download folders older than a day are removed at start-up; newer ones and other folders stay', async () => {
  const { mkdirSync, existsSync, utimesSync } = await import('node:fs')
  const { pruneDownloads } = await import('../src/tools.ts')
  const root = mkdtempSync(join(tmpdir(), 'gchat-prune-'))
  const old = join(root, 'gchat-attachments-old')
  const fresh = join(root, 'gchat-attachments-new')
  const other = join(root, 'something-else')
  for (const d of [old, fresh, other]) mkdirSync(d)
  const twoDaysAgo = (Date.now() - 2 * 24 * 60 * 60 * 1000) / 1000
  utimesSync(old, twoDaysAgo, twoDaysAgo)
  utimesSync(other, twoDaysAgo, twoDaysAgo)
  pruneDownloads(root)
  expect(existsSync(old)).toBe(false)
  expect(existsSync(fresh)).toBe(true)
  expect(existsSync(other)).toBe(true)
})
