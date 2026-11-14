import { expect, test } from 'bun:test'
import { sharePermission } from '../src/tools.ts'

test('anyone with the link needs only type and role', () => {
  expect(sharePermission({ type: 'anyone', role: 'reader' })).toEqual({ type: 'anyone', role: 'reader' })
})

test('a domain share carries the trimmed domain', () => {
  expect(sharePermission({ type: 'domain', role: 'commenter', domain: ' techstrongbox.com ' })).toEqual({
    type: 'domain',
    role: 'commenter',
    domain: 'techstrongbox.com',
  })
})

test('a user share carries the email address', () => {
  expect(sharePermission({ type: 'user', role: 'writer', emailAddress: 'someone@example.com' })).toEqual({
    type: 'user',
    role: 'writer',
    emailAddress: 'someone@example.com',
  })
})

test('a domain share without a domain is refused', () => {
  expect(() => sharePermission({ type: 'domain', role: 'reader' })).toThrow('type domain needs domain')
})

test('a user share without an email address is refused', () => {
  expect(() => sharePermission({ type: 'user', role: 'reader', emailAddress: 'nobody' })).toThrow('type user needs emailAddress')
})
