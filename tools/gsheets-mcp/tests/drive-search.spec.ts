import { expect, test } from 'bun:test'
import { driveSearchQuery } from '../src/tools.ts'

test('joins every name word, the type and trashed = false', () => {
  expect(driveSearchQuery({ nameContains: ['Daily standup', 'Notes by Gemini'], type: 'doc' })).toBe(
    "name contains 'Daily standup' and name contains 'Notes by Gemini' and mimeType = 'application/vnd.google-apps.document' and trashed = false",
  )
})

test('escapes quotes and backslashes in a name', () => {
  expect(driveSearchQuery({ nameContains: ["KL's notes \\ v2"] })).toBe("name contains 'KL\\'s notes \\\\ v2' and trashed = false")
})

test('reads a plain date as midnight Malaysia time', () => {
  expect(driveSearchQuery({ modifiedAfter: '2026-10-06' })).toBe("modifiedTime > '2026-10-05T16:00:00.000Z' and trashed = false")
})

test('keeps the zone of a full ISO time', () => {
  expect(driveSearchQuery({ modifiedAfter: '2026-10-06T09:00:00Z' })).toBe("modifiedTime > '2026-10-06T09:00:00.000Z' and trashed = false")
})

test('limits to a folder', () => {
  expect(driveSearchQuery({ folderId: 'abc' })).toBe("'abc' in parents and trashed = false")
})

test('refuses an empty search and a bad date', () => {
  expect(() => driveSearchQuery({ nameContains: ['  '] })).toThrow('at least one')
  expect(() => driveSearchQuery({ modifiedAfter: 'last week' })).toThrow('not a date')
})
