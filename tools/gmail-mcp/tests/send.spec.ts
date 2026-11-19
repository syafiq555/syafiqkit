import { describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { checkSendFile, isSecretPath } from '../src/tools.ts'
import { connect, ORIGINAL, tempFiles } from './helpers.ts'

const NEW = { to: ['ana@client.test'], subject: 'Quote QUO-1 revised', body: 'Hi Ana,\nPlease see the new quote.\nThanks' }

function sendArgs(p: { recipients: string; digest: string }, args: Record<string, unknown> = NEW) {
  return { ...args, recipients: p.recipients, digest: p.digest }
}

describe('email_send is a hard lock in Claude Code', () => {
  test('only email_send carries requiresUserInteraction, as the JSON boolean true, so headless runs (dontAsk, claude -p) are denied', async () => {
    const { client } = await connect()
    const tools = (await client.listTools()).tools
    const flag = (name: string) => tools.find((t) => t.name === name)?._meta?.['anthropic/requiresUserInteraction']
    expect(flag('email_send')).toBe(true)
    for (const name of ['email_send_preview', 'emails_search', 'email_read', 'attachment_download']) expect(flag(name)).toBeUndefined()
    expect(tools.map((t) => t.name).sort()).toEqual(['attachment_download', 'email_read', 'email_send', 'email_send_preview', 'emails_search'])
  })
})

describe('email_send_preview', () => {
  test('summarises a new message, sends nothing, and hands over recipients and digest', async () => {
    const { preview, sent } = await connect()
    const p = await preview({ ...NEW, cc: ['boss@client.test'], bcc: ['me@tsb.test'] })
    expect(p.text).toBe(
      [
        'Send email as you from me@tsb.test.',
        'To: ana@client.test',
        'Cc: boss@client.test',
        'Bcc: me@tsb.test',
        'Subject: Quote QUO-1 revised',
        'Body: 3 lines, 40 chars. First lines:',
        '  | Hi Ana,',
        '  | Please see the new quote.',
        '  | Thanks',
        'Files: none',
        'Reply: no, a new conversation.',
        'recipients: to: ana@client.test; cc: boss@client.test; bcc: me@tsb.test',
        `digest: ${p.digest}`,
      ].join('\n'),
    )
    expect(p.digest).toMatch(/^[0-9a-f]{32}$/)
    expect(sent).toEqual([])
  })

  test('files are listed with sizes', async () => {
    const { shot, pdf } = tempFiles()
    const { preview } = await connect()
    const p = await preview({ ...NEW, files: [shot, pdf] })
    expect(p.text).toContain('Files: shot.png (2 KB), quote.pdf (9 B) (about')
  })

  test('addresses with a display name, a missing domain or a header injection are refused', async () => {
    const { call } = await connect()
    for (const bad of ['Ana <ana@client.test>', 'ana', 'a@x.test\r\nBcc: evil@x.test']) {
      const out = await call('email_send_preview', { ...NEW, to: [bad] })
      expect(out.isError).toBe(true)
      expect(out.text).toContain('not a plain email address')
    }
  })

  test('a subject is required for a new message, and no body with no files is refused', async () => {
    const { call } = await connect()
    expect((await call('email_send_preview', { to: ['a@x.test'], body: 'hi' })).text).toContain('A subject is required')
    expect((await call('email_send_preview', { to: ['a@x.test'], subject: '  ', body: 'hi' })).text).toContain('A subject is required')
    expect((await call('email_send_preview', { to: ['a@x.test'], subject: 'x', body: '   ' })).text).toContain('Give a body, files, or both')
    expect((await call('email_send_preview', { to: ['a@x.test'], subject: 'a\nb', body: 'x' })).text).toContain('single line')
  })

  test('a body over 20,000 characters is refused', async () => {
    const { call } = await connect()
    const out = await call('email_send_preview', { to: ['a@x.test'], subject: 'x', body: 'x'.repeat(20_001) })
    expect(out.isError).toBe(true)
    expect(out.text).toContain('20000 characters')
  })

  test('files too big for Gmail once encoded are refused with the reason', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'gmail-big-'))
    const big = join(dir, 'big.bin')
    writeFileSync(big, new Uint8Array(20 * 1024 * 1024))
    const { call } = await connect()
    const out = await call('email_send_preview', { ...NEW, files: [big] })
    expect(out.isError).toBe(true)
    expect(out.text).toContain("over Gmail's 25 MB limit (attachments grow by a third)")
  })
})

describe('replying', () => {
  test('threads the reply: threadId, In-Reply-To, References, Re: subject, and shows the original recipients without filling any in', async () => {
    const { preview, call, sent } = await connect()
    const args = { to: ['ana@client.test'], body: 'Confirmed.', replyTo: 'm100' }
    const p = await preview(args)
    expect(p.text).toContain('Subject: Re: Quote QUO-1')
    expect(p.text).toContain('Reply: in thread t100, to message m100. Original From: Ana Lee <ana@client.test>; To: me@tsb.test, ops@tsb.test; Cc: boss@client.test.')
    expect(p.recipients).toBe('to: ana@client.test')
    const out = await call('email_send', sendArgs(p, args))
    expect(out.text).toContain('Sent from me@tsb.test to to: ana@client.test')
    expect(sent[0]!.threadId).toBe('t100')
    expect(sent[0]!.mime).toContain('Subject: Re: Quote QUO-1\r\n')
    expect(sent[0]!.mime).toContain('In-Reply-To: <orig@client.test>\r\nReferences: <root@client.test> <orig@client.test>\r\n')
    expect(sent[0]!.mime).not.toContain('boss@client.test')
  })

  test('an original that already says Re: is not given a second one, and an explicit subject is kept', async () => {
    const reOriginal = { ...ORIGINAL, payload: { ...ORIGINAL.payload!, headers: ORIGINAL.payload!.headers!.map((h) => (h.name === 'Subject' ? { ...h, value: 'Re: Quote QUO-1' } : h)) } }
    const { preview } = await connect({ message: async () => reOriginal })
    expect((await preview({ to: ['a@x.test'], body: 'x', replyTo: 'm100' })).text).toContain('Subject: Re: Quote QUO-1\n')
    const kept = await preview({ to: ['a@x.test'], body: 'x', replyTo: 'm100', subject: 'Something else' })
    expect(kept.text).toContain('Subject: Something else\n')
    expect(kept.text).toContain('the subject differs from the original, so Gmail may start a new conversation')
  })

  test('an unknown replyTo fails with Google\'s error and sends nothing', async () => {
    const { call, sent } = await connect()
    const out = await call('email_send_preview', { to: ['a@x.test'], body: 'x', replyTo: 'nope' })
    expect(out.isError).toBe(true)
    expect(out.text).toContain('Google API 404')
    expect(sent).toEqual([])
  })
})

describe('email_send', () => {
  test('sends the previewed message as a UTF-8 MIME message with a threadless raw send, and logs SENT', async () => {
    const { preview, call, sent, log } = await connect()
    const args = { ...NEW, subject: 'Tuntutan RM50 é diluluskan' }
    const p = await preview(args)
    const out = await call('email_send', sendArgs(p, args))
    expect(out.text).toBe('Sent from me@tsb.test to to: ana@client.test at 19/11/2026 12:00. Message sent1, thread tnew.')
    expect(sent.length).toBe(1)
    expect(sent[0]!.threadId).toBeUndefined()
    expect(sent[0]!.mime).toContain('Subject: =?UTF-8?B?')
    expect(sent[0]!.mime).toContain('From: me@tsb.test\r\nTo: ana@client.test\r\n')
    const [at, outcome, digest, id] = readFileSync(log, 'utf8').trim().split('\t')
    expect([at, outcome, digest, id]).toEqual(['2026-11-19T04:00:00.000Z', 'SENT', p.digest, 'sent1'])
  })

  test('attachments go out as multipart/mixed with their content types', async () => {
    const { shot, pdf } = tempFiles()
    const { preview, call, sent } = await connect()
    const args = { ...NEW, files: [shot, pdf] }
    const p = await preview(args)
    await call('email_send', sendArgs(p, args))
    expect(sent[0]!.mime).toContain('multipart/mixed')
    expect(sent[0]!.mime).toContain('Content-Type: image/png; name="shot.png"')
    expect(sent[0]!.mime).toContain('Content-Type: application/pdf; name="quote.pdf"')
  })

  test('refuses when recipients differ from the preview, and nothing is sent or logged', async () => {
    const { preview, call, sent, log } = await connect()
    const p = await preview(NEW)
    const out = await call('email_send', { ...NEW, to: ['someone.else@x.test'], recipients: p.recipients, digest: p.digest })
    expect(out.text).toStartWith('NOT SENT: recipients "to: ana@client.test" do not match what this call would send ("to: someone.else@x.test")')
    expect(sent).toEqual([])
    expect(existsSync(log)).toBe(false)
  })

  test('a recipients string the preview never made is refused even with a matching digest', async () => {
    const { preview, call, sent } = await connect()
    const p = await preview(NEW)
    const out = await call('email_send', sendArgs({ recipients: 'to: ana@client.test; cc: boss@client.test', digest: p.digest }))
    expect(out.text).toStartWith('NOT SENT: recipients')
    expect(sent).toEqual([])
  })

  test('refuses when the body, subject, files or reply target changed since the preview', async () => {
    const { shot, pdf } = tempFiles()
    const { preview, call, sent } = await connect()
    const p = await preview({ ...NEW, files: [shot] })
    for (const changed of [{ body: `${NEW.body} PS` }, { subject: 'Other' }, { files: [pdf] }, { files: [] }, { replyTo: 'm100' }]) {
      const out = await call('email_send', sendArgs(p, { ...NEW, files: [shot], ...changed }))
      expect(out.text).toStartWith('NOT SENT: ')
    }
    expect(sent).toEqual([])
  })

  test('the digest covers file contents, so a file edited after the preview is refused', async () => {
    const { shot } = tempFiles()
    const { preview, call, sent } = await connect()
    const args = { ...NEW, files: [shot] }
    const p = await preview(args)
    writeFileSync(shot, new Uint8Array(2048).fill(7))
    const out = await call('email_send', sendArgs(p, args))
    expect(out.text).toStartWith('NOT SENT: digest does not match')
    expect(sent).toEqual([])
  })

  test('recipient matching ignores case and spacing but nothing else', async () => {
    const { preview, call, sent } = await connect()
    const p = await preview(NEW)
    const out = await call('email_send', sendArgs({ recipients: '  TO:  Ana@Client.test ', digest: p.digest }))
    expect(out.text).toContain('Sent from')
    expect(sent.length).toBe(1)
  })
})

describe('duplicate guard', () => {
  test('the same message within 10 minutes is refused as ALREADY SENT and logged DUPLICATE', async () => {
    let clock = Date.parse('2026-11-19T04:00:00Z')
    const { preview, call, sent, log } = await connect({}, () => clock)
    const p = await preview(NEW)
    expect((await call('email_send', sendArgs(p))).text).toContain('Sent from')
    clock += 9 * 60_000
    const again = await call('email_send', sendArgs(p))
    expect(again.text).toStartWith('ALREADY SENT: this exact message was sent at 19/11/2026 12:00')
    expect(sent.length).toBe(1)
    expect(readFileSync(log, 'utf8').trim().split('\n').map((l) => l.split('\t')[1])).toEqual(['SENT', 'DUPLICATE'])
  })

  test('after 10 minutes the same message may go again, and a different message is never held', async () => {
    let clock = Date.parse('2026-11-19T04:00:00Z')
    const { preview, call, sent } = await connect({}, () => clock)
    const p = await preview(NEW)
    await call('email_send', sendArgs(p))
    const other = { ...NEW, body: 'A different body' }
    const q = await preview(other)
    expect((await call('email_send', sendArgs(q, other))).text).toContain('Sent from')
    clock += 11 * 60_000
    expect((await call('email_send', sendArgs(p))).text).toContain('Sent from')
    expect(sent.length).toBe(3)
  })

  test('an UNSURE or DUPLICATE entry does not arm the guard, only SENT does', async () => {
    const { preview, call, sent, log } = await connect()
    const p = await preview(NEW)
    writeFileSync(log, `2026-11-19T03:59:00.000Z\tUNSURE\t${p.digest}\t-\tto: ana@client.test\t"x"\n2026-11-19T03:59:30.000Z\tDUPLICATE\t${p.digest}\t-\tx\t"x"\n`)
    expect((await call('email_send', sendArgs(p))).text).toContain('Sent from')
    expect(sent.length).toBe(1)
  })

  test('two identical email_send calls in flight at once send only one', async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => (release = resolve))
    let posts = 0
    const { preview, call } = await connect({
      send: async () => {
        posts++
        await gate
        return { id: 'sent1', threadId: 'tnew' }
      },
    })
    const p = await preview(NEW)
    const first = call('email_send', sendArgs(p))
    await Bun.sleep(30)
    const second = await call('email_send', sendArgs(p))
    expect(second.text).toStartWith('ALREADY SENT')
    release()
    expect((await first).text).toContain('Sent from')
    expect(posts).toBe(1)
  })
})

describe('outcomes', () => {
  const cases: [string, string][] = [
    ['Google API 400: Invalid To header', 'NOT SENT: Google refused the email'],
    ['Google API 403: Request had insufficient authentication scopes', 'NOT SENT: Google refused the email'],
    ['Google API 413: Request Entity Too Large', 'NOT SENT: Google refused the email'],
    ['Google API 429: Rate limit exceeded', 'NOT SENT: Google refused the email'],
    ['Google API 503: backend error', 'UNSURE WHETHER SENT'],
    ['Google API 500: internal', 'UNSURE WHETHER SENT'],
    ['No answer from Google within 30 s', 'UNSURE WHETHER SENT'],
    ['fetch failed', 'UNSURE WHETHER SENT'],
  ]
  for (const [error, expected] of cases) {
    test(`${error} reads ${expected.split(':')[0]}`, async () => {
      const { preview, call, log } = await connect({
        send: async () => {
          throw new Error(error)
        },
      })
      const p = await preview(NEW)
      const out = await call('email_send', sendArgs(p))
      expect(out.text).toStartWith(expected)
      if (expected.startsWith('UNSURE')) {
        expect(out.text).toContain('in:sent')
        expect(readFileSync(log, 'utf8')).toContain('\tUNSURE\t')
      } else {
        expect(existsSync(log)).toBe(false)
      }
    })
  }

  test('a log that cannot be written is reported in the result', async () => {
    const { preview, call, root } = await connect()
    const p = await preview(NEW)
    const { rmSync } = await import('node:fs')
    rmSync(root, { recursive: true })
    const out = await call('email_send', sendArgs(p))
    expect(out.text).toContain('Sent from')
    expect(out.text).toContain('Not written to sent.log')
  })
})

describe('what email_send will attach', () => {
  test('keys, credentials and config folders are never sent', () => {
    const home = '/Users/me'
    for (const p of ['/Users/me/.ssh/id_rsa', '/Users/me/.aws/credentials', '/Users/me/.config/syafiqkit/google-gmail/refresh.json', '/Users/me/.claude/settings.json', '/repo/.env', '/x/server.pem', '/Users/me/.SSH/config', '/repo/CLAUDE.local.md', '/Users/me/.claude.json', '/x/secrets.yaml', '/repo/.claude-companions/local/CLAUDE-stripe.md', '/srv/site/wp-config.php']) {
      expect(isSecretPath(p, home)).toBe(true)
    }
    for (const p of ['/Users/me/Downloads/shot.png', '/repo/environment.md', '/repo/CLAUDE.md']) expect(isSecretPath(p, home)).toBe(false)
  })

  test('a symlink is judged by the file it points to, case-insensitively', () => {
    const { dir, shot } = tempFiles()
    const link = join(dir, 'innocent.png')
    symlinkSync(shot, link)
    expect(checkSendFile(link).path).toBe(realpathSync(shot))
    const cfg = mkdtempSync(join(tmpdir(), 'gmail-cfg-'))
    const token = join(cfg, 'refresh.json')
    writeFileSync(token, '{"refresh_token":"x"}')
    const was = process.env.GMAIL_CONFIG_DIR
    process.env.GMAIL_CONFIG_DIR = cfg
    try {
      const trick = join(dir, 'photo.png')
      symlinkSync(token, trick)
      expect(() => checkSendFile(trick)).toThrow('never sends')
    } finally {
      if (was === undefined) delete process.env.GMAIL_CONFIG_DIR
      else process.env.GMAIL_CONFIG_DIR = was
    }
  })

  test('a denylisted file is refused at preview and at send, before anything goes out', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'gmail-deny-'))
    const env = join(dir, '.env')
    writeFileSync(env, 'SECRET=1')
    const link = join(dir, 'photo.png')
    symlinkSync(env, link)
    const { call, sent } = await connect()
    for (const path of [env, link]) {
      const out = await call('email_send_preview', { ...NEW, files: [path] })
      expect(out.isError).toBe(true)
      expect(out.text).toContain('never sends')
      const direct = await call('email_send', { ...NEW, files: [path], recipients: 'to: ana@client.test', digest: 'x' })
      expect(direct.isError).toBe(true)
      expect(direct.text).toContain('never sends')
    }
    expect(sent).toEqual([])
  })

  test('relative, missing and empty files are refused', async () => {
    const { dir } = tempFiles()
    const empty = join(dir, 'empty.txt')
    writeFileSync(empty, '')
    const { call } = await connect()
    expect((await call('email_send_preview', { ...NEW, files: ['shot.png'] })).text).toContain('is not an absolute path')
    expect((await call('email_send_preview', { ...NEW, files: [join(dir, 'nope.png')] })).text).toContain('does not exist')
    expect((await call('email_send_preview', { ...NEW, files: [empty] })).text).toContain('is empty')
  })
})
