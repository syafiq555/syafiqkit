import { expect, test } from 'bun:test'
import { copiedSheetProperties } from '../src/tools.ts'

test('no title and no index needs no follow-up request', () => {
  expect(copiedSheetProperties(42)).toBeNull()
  expect(copiedSheetProperties(42, '   ')).toBeNull()
})

test('a title renames the copy, trimmed', () => {
  expect(copiedSheetProperties(42, ' Pages & Design ')).toEqual({
    updateSheetProperties: { properties: { sheetId: 42, title: 'Pages & Design' }, fields: 'title' },
  })
})

test('index 0 still moves the copy to the front', () => {
  expect(copiedSheetProperties(42, undefined, 0)).toEqual({
    updateSheetProperties: { properties: { sheetId: 42, index: 0 }, fields: 'index' },
  })
})

test('title and index go in one request', () => {
  expect(copiedSheetProperties(7, 'Sitemap', 4)).toEqual({
    updateSheetProperties: { properties: { sheetId: 7, title: 'Sitemap', index: 4 }, fields: 'title,index' },
  })
})
