import { describe, expect, test } from 'bun:test'
import { parseAddressList } from '../src/addresses.ts'

describe('parseAddressList', () => {
  test('bare addresses, angle forms and mixed lists', () => {
    expect(parseAddressList('a@x.test')).toEqual(['a@x.test'])
    expect(parseAddressList('Ana Lee <ana@x.test>')).toEqual(['ana@x.test'])
    expect(parseAddressList('Ana Lee <ana@x.test>, b@x.test,  <c@x.test>')).toEqual(['ana@x.test', 'b@x.test', 'c@x.test'])
  })

  test('a quoted display name may hold commas, angle brackets and escaped quotes', () => {
    expect(parseAddressList('"Lee, Ana" <ana@x.test>, "Tan, Bob (KL)" <bob@x.test>')).toEqual(['ana@x.test', 'bob@x.test'])
    expect(parseAddressList('"Weird <name@fake.test>, x" <real@x.test>')).toEqual(['real@x.test'])
    expect(parseAddressList('"Say \\"hi\\", ok" <q@x.test>, z@x.test')).toEqual(['q@x.test', 'z@x.test'])
  })

  test('comments, groups, empty input and duplicates', () => {
    expect(parseAddressList('ana@x.test (Ana, KL), b@x.test')).toEqual(['ana@x.test', 'b@x.test'])
    expect(parseAddressList('Team: a@x.test, b@x.test;')).toEqual(['a@x.test', 'b@x.test'])
    expect(parseAddressList('')).toEqual([])
    expect(parseAddressList(undefined)).toEqual([])
    expect(parseAddressList('A@x.test, a <a@X.test>')).toEqual(['A@x.test'])
  })
})
