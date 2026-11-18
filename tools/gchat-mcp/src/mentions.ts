import type { Chat } from './chat.ts'

const RECENT_MESSAGES = 200
const LETTER_OR_DIGIT = /[\p{L}\p{N}_]/u
const BLOCKS_MENTION = /[\p{L}\p{N}_./:@=+%&?#-]/u
const USER_ID = /^users\/[0-9]+$/

export interface Person {
  id: string
  name: string
}

export interface MentionPlan {
  text: string
  mentions: string
  notTagged: string[]
  ambiguous: string[]
}

export function mentionTag(id: string): string {
  return `<chat-user data-user="${id}">`
}

function atPositions(body: string): number[] {
  const out: number[] = []
  for (let i = body.indexOf('@'); i !== -1; i = body.indexOf('@', i + 1)) {
    const before = i === 0 ? '' : Array.from(body.slice(Math.max(0, i - 2), i)).pop()!
    if (before && BLOCKS_MENTION.test(before)) continue
    if (!/^\p{L}/u.test(body.slice(i + 1, i + 3))) continue
    out.push(i)
  }
  return out
}

export function hasMentionCandidate(body: string): boolean {
  return atPositions(body).length > 0
}

function typedName(body: string, from: number): string {
  const first = /^\p{L}[\p{L}\p{N}'’._-]*/u.exec(body.slice(from))
  if (!first) return ''
  let name = first[0].replace(/[._'’-]+$/, '')
  if (/^\p{Lu}/u.test(name)) {
    let rest = body.slice(from + first[0].length)
    for (let n = 0; n < 3; n++) {
      const more = /^[ \t]+(\p{Lu}[\p{L}'’-]*)/u.exec(rest)
      if (!more) break
      name += ` ${more[1]!.replace(/[-'’]+$/, '')}`
      rest = rest.slice(more[0].length)
    }
  }
  return name
}

export function planMentions(body: string, people: Person[]): MentionPlan {
  const byName = new Map<string, Person[]>()
  for (const p of people) {
    if (!USER_ID.test(p.id)) continue
    const key = p.name.toLowerCase()
    const same = byName.get(key) ?? []
    if (!same.some((x) => x.id === p.id)) same.push(p)
    byName.set(key, same)
  }
  const keys = [...byName.keys()].sort((a, b) => b.length - a.length)
  const positions = new Set(atPositions(body))
  const matched: { name: string; id: string }[] = []
  const notTagged: string[] = []
  const ambiguous: string[] = []
  let text = ''
  let i = 0
  while (i < body.length) {
    if (!positions.has(i)) {
      text += body[i]
      i++
      continue
    }
    const rest = body.slice(i + 1)
    const key = keys.find((k) => {
      if (rest.slice(0, k.length).toLowerCase() !== k) return false
      const next = rest.slice(k.length, k.length + 1)
      return !next || !LETTER_OR_DIGIT.test(next)
    })
    if (key === undefined) {
      const typed = typedName(body, i + 1)
      if (typed) notTagged.push(`@${typed}`)
      text += '@'
      i++
      continue
    }
    const hits = byName.get(key)!
    const shown = body.slice(i, i + 1 + key.length)
    if (hits.length > 1) {
      ambiguous.push(shown)
      text += shown
    } else {
      matched.push({ name: hits[0]!.name, id: hits[0]!.id })
      text += mentionTag(hits[0]!.id)
    }
    i += 1 + key.length
  }
  return {
    text,
    mentions: matched.map((m) => `@${m.name} -> ${m.id}`).join(', '),
    notTagged: [...new Set(notTagged)],
    ambiguous: [...new Set(ambiguous)],
  }
}

export async function recentPosters(chat: Pick<Chat, 'messages' | 'senderOf'>, space: string): Promise<Person[]> {
  const msgs = await chat.messages(space, { limit: RECENT_MESSAGES, newestFirst: true })
  const firstBy = new Map<string, (typeof msgs)[number]>()
  for (const m of msgs) {
    const id = m.sender?.name
    if (id && m.sender?.type !== 'BOT' && !firstBy.has(id)) firstBy.set(id, m)
  }
  const people = await Promise.all(
    [...firstBy].map(async ([id, m]) => ({ id, name: (await chat.senderOf(m)).trim() })),
  )
  return people.filter((p) => p.name && !p.name.endsWith('(you)') && !p.name.startsWith('users/') && p.name !== 'unknown')
}

export async function resolveMentions(chat: Pick<Chat, 'messages' | 'senderOf'>, space: string, body: string): Promise<MentionPlan> {
  if (!hasMentionCandidate(body)) return planMentions(body, [])
  let people: Person[]
  try {
    people = await recentPosters(chat, space)
  } catch (err) {
    throw new Error(`Could not read who has posted in ${space} (${(err as Error).message}), so @names cannot be turned into mentions. Nothing was posted or changed. Try once more.`)
  }
  return planMentions(body, people)
}

export function mentionLines(plan: MentionPlan, edit = false): string[] {
  const lines: string[] = []
  if (plan.mentions) lines.push(`mentions: ${plan.mentions}`)
  if (plan.notTagged.length) lines.push(`not tagged (no one by that name posted here): ${plan.notTagged.join(', ')}`)
  if (plan.ambiguous.length) lines.push(`not tagged (two people by that name posted here): ${plan.ambiguous.join(', ')}`)
  if (edit && plan.mentions) lines.push('note: an edit notifies nobody, so these names become mention chips without alerting anyone. Post a new message if they should be notified.')
  return lines
}

export function claimedMentions(value: string | undefined): string {
  const v = (value ?? '').trim()
  return v.toLowerCase() === 'none' ? '' : v
}
