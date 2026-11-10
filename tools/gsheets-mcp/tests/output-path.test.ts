import { expect, test } from 'bun:test'
import { mkdtempSync, symlinkSync, writeFileSync, existsSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'
import { outputPath } from '../src/tools.ts'

const base = mkdtempSync(join(tmpdir(), 'gsheets-out-'))

test('refuses a relative path', () => {
  expect(() => outputPath('out.pdf')).toThrow('absolute')
})

test('refuses a credentials folder without creating it', () => {
  const target = join(homedir(), '.ssh', 'gsheets-test-new', 'a.pdf')
  expect(() => outputPath(target)).toThrow('credentials')
  expect(existsSync(join(homedir(), '.ssh', 'gsheets-test-new'))).toBe(false)
})

test('refuses a credentials file name', () => {
  expect(() => outputPath(join(base, '.env'))).toThrow('credentials')
})

test('refuses a symlink target', () => {
  const real = join(base, 'real.txt')
  writeFileSync(real, 'x')
  symlinkSync(real, join(base, 'link.txt'))
  expect(() => outputPath(join(base, 'link.txt'))).toThrow('symlink')
})

test('creates missing folders for a plain path', () => {
  const out = outputPath(join(base, 'new', 'deck.pdf'))
  expect(out.endsWith('/new/deck.pdf')).toBe(true)
  expect(existsSync(join(base, 'new'))).toBe(true)
})
