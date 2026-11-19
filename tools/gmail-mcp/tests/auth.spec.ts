import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { existsSync, mkdtempSync, readFileSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { grantedScopesMatch, refreshPath, SCOPES, storeGrant } from '../src/auth.ts'

const READONLY = 'https://www.googleapis.com/auth/gmail.readonly'
const SEND = 'https://www.googleapis.com/auth/gmail.send'

let was: string | undefined
beforeEach(() => {
  was = process.env.GMAIL_CONFIG_DIR
  process.env.GMAIL_CONFIG_DIR = join(mkdtempSync(join(tmpdir(), 'gmail-auth-')), 'cfg')
})
afterEach(() => {
  if (was === undefined) delete process.env.GMAIL_CONFIG_DIR
  else process.env.GMAIL_CONFIG_DIR = was
})

describe('scopes', () => {
  test('are exactly gmail.readonly and gmail.send', () => {
    expect([...SCOPES].sort()).toEqual([READONLY, SEND])
  })

  test('the check is exact: extra, missing or reordered scopes', () => {
    expect(grantedScopesMatch(`${SEND} ${READONLY}`)).toBe(true)
    expect(grantedScopesMatch(READONLY)).toBe(false)
    expect(grantedScopesMatch(`${READONLY} ${SEND} https://www.googleapis.com/auth/gmail.modify`)).toBe(false)
    expect(grantedScopesMatch(`${READONLY} https://mail.google.com/`)).toBe(false)
  })
})

describe('storing a grant', () => {
  test('stores the refresh token with mode 0600 when the scopes are exact', () => {
    storeGrant({ scope: `${READONLY} ${SEND}`, refresh_token: 'r1' })
    expect(JSON.parse(readFileSync(refreshPath(), 'utf8'))).toEqual({ refresh_token: 'r1' })
    expect(statSync(refreshPath()).mode & 0o777).toBe(0o600)
  })

  test('stores nothing when Google grants more', () => {
    expect(() => storeGrant({ scope: `${READONLY} ${SEND} https://www.googleapis.com/auth/gmail.modify`, refresh_token: 'r1' })).toThrow('Nothing was stored')
    expect(existsSync(refreshPath())).toBe(false)
  })

  test('stores nothing when Google grants less', () => {
    expect(() => storeGrant({ scope: READONLY, refresh_token: 'r1' })).toThrow('Nothing was stored')
    expect(existsSync(refreshPath())).toBe(false)
  })

  test('stores nothing without a refresh token', () => {
    expect(() => storeGrant({ scope: `${READONLY} ${SEND}` })).toThrow('no refresh token')
    expect(existsSync(refreshPath())).toBe(false)
  })
})
