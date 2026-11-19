import { beforeEach, describe, expect, test } from 'bun:test'
import { chmodSync, copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const ENABLE = join(import.meta.dir, '..', 'bin', 'enable')

interface Run {
  code: number
  out: string
  err: string
  claudeCalls: string[]
  checkEnv: string
}

let tree: string
let stubBin: string
let home: string

function script(path: string, body: string) {
  writeFileSync(path, `#!/bin/sh\n${body}\n`)
  chmodSync(path, 0o755)
}

beforeEach(() => {
  tree = mkdtempSync(join(tmpdir(), 'gmail-enable-'))
  mkdirSync(join(tree, 'bin'))
  copyFileSync(ENABLE, join(tree, 'bin', 'enable'))
  chmodSync(join(tree, 'bin', 'enable'), 0o755)
  stubBin = join(tree, 'stub')
  home = join(tree, 'home')
  mkdirSync(stubBin)
  mkdirSync(home)
})

function run(args: string[], opts: { registered?: string; checkOk?: boolean; env?: Record<string, string> } = {}): Run {
  const log = join(tree, 'claude.log')
  const checkEnv = join(tree, 'check.env')
  writeFileSync(log, '')
  script(
    join(stubBin, 'claude'),
    `echo "$*" >> "${log}"\nif [ "$1 $2" = "mcp get" ] && [ "$3" = "${opts.registered ?? '-none-'}" ]; then echo "registered: $3"; exit 0; fi\nif [ "$1 $2" = "mcp get" ]; then exit 1; fi\nexit 0`,
  )
  script(join(tree, 'bin', 'gmail-mcp'), `echo "$GMAIL_CONFIG_DIR" > "${checkEnv}"\n${opts.checkOk === false ? 'echo "gmail: not signed in" >&2; exit 1' : 'exit 0'}`)
  const base: Record<string, string> = { PATH: `${stubBin}:/usr/bin:/bin`, HOME: home }
  const p = Bun.spawnSync(['/bin/sh', join(tree, 'bin', 'enable'), ...args], { env: { ...base, ...(opts.env ?? {}) } })
  let env = ''
  try {
    env = readFileSync(checkEnv, 'utf8').trim()
  } catch {}
  return {
    code: p.exitCode ?? -1,
    out: p.stdout.toString(),
    err: p.stderr.toString(),
    claudeCalls: readFileSync(log, 'utf8').split('\n').filter((l) => l.startsWith('mcp add')),
    checkEnv: env,
  }
}

describe('bin/enable', () => {
  test('no name keeps the old behaviour: gmail, no env', () => {
    const r = run([])
    expect(r.code).toBe(0)
    expect(r.claudeCalls).toEqual([`mcp add gmail --scope user -- ${tree}/bin/gmail-mcp`])
    expect(r.checkEnv).toBe('')
  })

  test('no name with GMAIL_CONFIG_DIR set passes it through', () => {
    const r = run([], { env: { GMAIL_CONFIG_DIR: '/x/cfg' } })
    expect(r.claudeCalls).toEqual([`mcp add gmail --scope user --env GMAIL_CONFIG_DIR=/x/cfg -- ${tree}/bin/gmail-mcp`])
    expect(r.checkEnv).toBe('/x/cfg')
  })

  test('a name registers under that name with its own config folder, checked first', () => {
    const r = run(['gmail-personal'])
    expect(r.code).toBe(0)
    expect(r.checkEnv).toBe(`${home}/.config/syafiqkit/google-gmail-personal`)
    expect(r.claudeCalls).toEqual([`mcp add gmail-personal --scope user --env GMAIL_CONFIG_DIR=${home}/.config/syafiqkit/google-gmail-personal -- ${tree}/bin/gmail-mcp`])
    expect(r.out).toContain('/mcp reconnect gmail-personal')
  })

  test('a name with GMAIL_CONFIG_DIR set uses that folder', () => {
    const r = run(['gmail-personal'], { env: { GMAIL_CONFIG_DIR: '/x/other' } })
    expect(r.claudeCalls[0]).toContain('--env GMAIL_CONFIG_DIR=/x/other')
  })

  test('refuses an invalid name before touching claude', () => {
    for (const bad of ['Gmail', 'gmail_personal', 'a b', '-x', 'g;rm', 'gmail.2']) {
      const r = run([bad])
      expect(r.code).toBe(2)
      expect(r.err).toContain('lowercase letters, digits and hyphens')
      expect(r.claudeCalls).toEqual([])
    }
  })

  test('refuses when a server of that name is registered, and says how to remove it', () => {
    const r = run(['gmail-personal'], { registered: 'gmail-personal' })
    expect(r.code).toBe(1)
    expect(r.err).toContain('A server named gmail-personal is already registered')
    expect(r.err).toContain('claude mcp remove gmail-personal')
    expect(r.claudeCalls).toEqual([])
  })

  test('a second account that is not signed in gets the exact auth command and nothing is registered', () => {
    const r = run(['gmail-personal'], { checkOk: false })
    expect(r.code).toBe(1)
    expect(r.err).toContain(`Sign in first: GMAIL_CONFIG_DIR="${home}/.config/syafiqkit/google-gmail-personal" ${tree}/bin/gmail-mcp auth --client <client.json`)
    expect(r.claudeCalls).toEqual([])
  })

  test('with a client.json already in that folder the auth command needs no --client', () => {
    const dir = join(home, '.config', 'syafiqkit', 'google-gmail-personal')
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, 'client.json'), '{}')
    const r = run(['gmail-personal'], { checkOk: false })
    expect(r.err).toContain(`gmail-mcp auth\n`)
    expect(r.err).not.toContain('--client')
  })
})
