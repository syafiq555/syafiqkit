import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { TokenSource } from '../src/auth.ts'
import { Gmail } from '../src/gmail.ts'
import { Google } from '../src/google.ts'
import { connect } from './helpers.ts'

let was: string | undefined
beforeEach(() => {
  was = process.env.GMAIL_CONFIG_DIR
  process.env.GMAIL_CONFIG_DIR = '/tmp/gmail-second-account'
})
afterEach(() => {
  if (was === undefined) delete process.env.GMAIL_CONFIG_DIR
  else process.env.GMAIL_CONFIG_DIR = was
})

const creds = () => ({ clientId: 'id', clientSecret: 'secret' })

describe('an expired or revoked sign-in', () => {
  test('invalid_grant from the token endpoint says so and names the config folder and the auth command', async () => {
    const tokens = new TokenSource(async () => new Response(JSON.stringify({ error: 'invalid_grant', error_description: 'Token has been expired or revoked.' }), { status: 400 }), Date.now, creds, () => 'r')
    const err = await tokens.get().catch((e: Error) => e)
    expect((err as Error).message).toContain('gmail: The Gmail sign-in for /tmp/gmail-second-account expired or was revoked')
    expect((err as Error).message).toMatch(/on their Mac .*GMAIL_CONFIG_DIR=\/tmp\/gmail-second-account \/\S+\/bin\/gmail-mcp auth/)
  })

  test('other token errors keep their own wording', async () => {
    const tokens = new TokenSource(async () => new Response(JSON.stringify({ error: 'invalid_client' }), { status: 401 }), Date.now, creds, () => 'r')
    await expect(tokens.get()).rejects.toThrow('Google refused the token request (invalid_client)')
  })

  test('a 401 that survives the forced token refresh says the sign-in expired', async () => {
    let calls = 0
    const g = new Google({ get: async () => 'tok' } as unknown as TokenSource, async () => {
      calls++
      return new Response(JSON.stringify({ error: { message: 'Invalid Credentials' } }), { status: 401 })
    })
    const err = await new Gmail(g).message('abc').catch((e: Error) => e)
    expect(calls).toBe(2)
    expect((err as Error).message).toStartWith('Google API 401: The Gmail sign-in for /tmp/gmail-second-account expired or was revoked')
    expect((err as Error).message).toContain('gmail-mcp auth')
    expect((err as Error).message).toContain('Invalid Credentials')
  })

  for (const error of ['Google API 401: The Gmail sign-in for /x expired or was revoked. Ask the user to sign in again: GMAIL_CONFIG_DIR=/x gmail-mcp auth', 'gmail: The Gmail sign-in for /x expired or was revoked. (Google: invalid_grant).']) {
    test(`email_send stays NOT SENT when the send fails with: ${error.slice(0, 24)}`, async () => {
      const { preview, call, log } = await connect({
        send: async () => {
          throw new Error(error)
        },
      })
      const args = { to: ['a@x.test'], subject: 's', body: 'b' }
      const p = await preview(args)
      const out = await call('email_send', { ...args, recipients: p.recipients, digest: p.digest })
      expect(out.text).toStartWith('NOT SENT: Google refused the email')
      expect(out.text).toContain('expired or was revoked')
      expect(await Bun.file(log).exists()).toBe(false)
    })
  }

  test('email_send is NOT SENT when the expiry hits while composing (reading the original)', async () => {
    const { call } = await connect({
      message: async () => {
        throw new Error('Google API 401: The Gmail sign-in for /x expired or was revoked.')
      },
    })
    const out = await call('email_send', { to: ['a@x.test'], body: 'b', replyTo: 'm100', recipients: 'to: a@x.test', digest: 'x' })
    expect(out.text).toStartWith('NOT SENT: Google API 401')
    expect(out.isError).toBe(true)
  })
})
