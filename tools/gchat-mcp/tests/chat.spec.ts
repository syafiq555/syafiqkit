import { expect, test } from 'bun:test'
import { Chat } from '../src/chat.ts'
import type { Google } from '../src/google.ts'

function fakeGoogle(routes: Record<string, unknown>) {
  const calls: string[] = []
  const g = {
    call: async (_method: string, url: string) => {
      calls.push(url)
      const key = Object.keys(routes).find((k) => url.includes(k))
      if (!key) throw new Error(`Google API 404: ${url}`)
      return routes[key]
    },
  } as unknown as Google
  return { g, calls }
}

test('names 200 senders with one self lookup and one directory crawl', async () => {
  const { g, calls } = fakeGoogle({
    '/spaces?': { spaces: [{ name: 'spaces/D1', spaceType: 'DIRECT_MESSAGE' }, { name: 'spaces/D2', spaceType: 'DIRECT_MESSAGE' }] },
    'spaces/D1/members': { memberships: [{ member: { name: 'users/9' } }, { member: { name: 'users/1', displayName: 'Syafiq' } }] },
    'spaces/D2/members': { memberships: [{ member: { name: 'users/1', displayName: 'Syafiq' } }, { member: { name: 'users/8' } }] },
    'listDirectoryPeople': { people: [{ resourceName: 'people/2', names: [{ displayName: 'Hong Liang' }] }] },
  })
  const chat = new Chat(g)
  const names = await Promise.all(Array.from({ length: 200 }, (_, i) => chat.person(i % 2 ? 'users/1' : 'users/2')))
  expect(new Set(names)).toEqual(new Set(['Syafiq (you)', 'Hong Liang']))
  expect(calls.filter((u) => u.includes('/members'))).toHaveLength(2)
  expect(calls.filter((u) => u.includes('listDirectoryPeople'))).toHaveLength(1)
})

test('the space list refreshes after two minutes', async () => {
  const { g, calls } = fakeGoogle({ '/spaces?': { spaces: [{ name: 'spaces/A' }] } })
  let now = 0
  const chat = new Chat(g, () => now)
  await chat.spaces()
  now = 60_000
  await chat.spaces()
  expect(calls).toHaveLength(1)
  now = 121_000
  await chat.spaces()
  expect(calls).toHaveLength(2)
})

test('a DM lookup by email keeps setup errors instead of saying "no DM"', async () => {
  const { g } = fakeGoogle({})
  const chat = new Chat(g)
  await expect(chat.resolveSpace('kl@example.com')).rejects.toThrow('No DM with kl@example.com')
  const failing = new Chat({ call: async () => { throw new Error('Google API 403: Google Chat app not found') } } as unknown as Google)
  await expect(failing.resolveSpace('kl@example.com')).rejects.toThrow('Chat app not found')
})

test('a failed self lookup is retried after 30 s and never freezes a DM label', async () => {
  let dmsReady = false
  const calls: string[] = []
  const g = {
    call: async (_m: string, url: string) => {
      calls.push(url)
      if (url.includes('/spaces?')) return { spaces: dmsReady ? [{ name: 'spaces/D1', spaceType: 'DIRECT_MESSAGE' }, { name: 'spaces/D2', spaceType: 'DIRECT_MESSAGE' }] : [{ name: 'spaces/D1', spaceType: 'DIRECT_MESSAGE' }] }
      if (url.includes('spaces/D1/members')) return { memberships: [{ member: { name: 'users/1', displayName: 'Syafiq' } }, { member: { name: 'users/9', displayName: 'Man Hou' } }] }
      if (url.includes('spaces/D2/members')) return { memberships: [{ member: { name: 'users/1', displayName: 'Syafiq' } }, { member: { name: 'users/8', displayName: 'Lyana' } }] }
      throw new Error(`Google API 404: ${url}`)
    },
  } as unknown as Google
  let now = 0
  const chat = new Chat(g, () => now)
  const dm = { name: 'spaces/D1', spaceType: 'DIRECT_MESSAGE' as const }
  expect(await chat.label(dm)).toBe("DM: Syafiq, Man Hou (couldn't tell which member is you)")
  await chat.self()
  await chat.self()
  dmsReady = true
  now = 10_000
  expect((await chat.self()).id).toBeNull()
  now = 200_000
  expect((await chat.self()).id).toBe('users/1')
  expect(await chat.label(dm)).toBe('DM: Man Hou')
})

test('a DM whose members cannot be read says so instead of "yourself", and is retried', async () => {
  let fail = true
  const g = {
    call: async (_m: string, url: string) => {
      if (url.includes('/spaces?')) return { spaces: [{ name: 'spaces/D1', spaceType: 'DIRECT_MESSAGE' }, { name: 'spaces/D2', spaceType: 'DIRECT_MESSAGE' }] }
      if (url.includes('spaces/D2/members')) return { memberships: [{ member: { name: 'users/1', displayName: 'Syafiq' } }, { member: { name: 'users/8', displayName: 'Lyana' } }] }
      if (url.includes('spaces/D1/members')) {
        if (fail && url.includes('pageSize=20')) throw new Error('Google API 500: oops')
        return { memberships: [{ member: { name: 'users/1', displayName: 'Syafiq' } }, { member: { name: 'users/9', displayName: 'Man Hou' } }] }
      }
      throw new Error(`Google API 404: ${url}`)
    },
  } as unknown as Google
  const chat = new Chat(g)
  const dm = { name: 'spaces/D1', spaceType: 'DIRECT_MESSAGE' as const }
  expect(await chat.label(dm)).toBe('DM (members unknown)')
  fail = false
  expect(await chat.label(dm)).toBe('DM: Man Hou')
})
