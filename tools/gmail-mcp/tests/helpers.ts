import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { GmailMessage } from '../src/format.ts'
import type { Gmail } from '../src/gmail.ts'
import { registerTools } from '../src/tools.ts'

export const b64u = (text: string) => Buffer.from(text, 'utf8').toString('base64url')

export const ORIGINAL: GmailMessage = {
  id: 'm100',
  threadId: 't100',
  snippet: 'Please confirm the quote',
  internalDate: String(Date.parse('2026-11-18T02:30:00Z')),
  payload: {
    mimeType: 'text/plain',
    headers: [
      { name: 'From', value: 'Ana Lee <ana@client.test>' },
      { name: 'To', value: 'me@tsb.test, ops@tsb.test' },
      { name: 'Cc', value: 'boss@client.test' },
      { name: 'Subject', value: 'Quote QUO-1' },
      { name: 'Message-ID', value: '<orig@client.test>' },
      { name: 'References', value: '<root@client.test>' },
    ],
    body: { size: 10, data: b64u('Please confirm the quote') },
  },
}

export interface Sent {
  mime: string
  threadId?: string
}

export function tempFiles() {
  const dir = mkdtempSync(join(tmpdir(), 'gmail-send-'))
  const shot = join(dir, 'shot.png')
  const pdf = join(dir, 'quote.pdf')
  writeFileSync(shot, new Uint8Array(2048))
  writeFileSync(pdf, 'pdf bytes')
  return { dir, shot, pdf }
}

export async function connect(overrides: Partial<Record<keyof Gmail, unknown>> = {}, now: () => number = () => Date.parse('2026-11-19T04:00:00Z')) {
  const sent: Sent[] = []
  const gmail = {
    address: async () => 'me@tsb.test',
    message: async (id: string) => {
      if (id !== 'm100') throw new Error('Google API 404: Requested entity was not found.')
      return ORIGINAL
    },
    send: async (mime: Uint8Array, threadId?: string) => {
      sent.push({ mime: new TextDecoder().decode(mime), threadId })
      return { id: 'sent1', threadId: threadId ?? 'tnew' }
    },
    ...overrides,
  } as unknown as Gmail
  const root = mkdtempSync(join(tmpdir(), 'gmail-root-'))
  const log = join(root, 'sent.log')
  const server = new McpServer({ name: 'gmail', version: 't' })
  registerTools(server, gmail, log, root, now)
  const client = new Client({ name: 't', version: '1' })
  const [a, b] = InMemoryTransport.createLinkedPair()
  await Promise.all([server.connect(a), client.connect(b)])
  const call = async (name: string, args: Record<string, unknown>) => {
    const res: any = await client.callTool({ name, arguments: args })
    return { text: String(res.content[0].text), isError: !!res.isError }
  }
  const preview = async (args: Record<string, unknown>) => {
    const { text } = await call('email_send_preview', args)
    return {
      text,
      recipients: /^recipients: (.*)$/m.exec(text)?.[1] ?? '',
      digest: /^digest: (.*)$/m.exec(text)?.[1] ?? '',
    }
  }
  return { client, call, preview, sent, log, root }
}
