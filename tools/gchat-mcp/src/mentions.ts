import type { Chat } from './chat.ts'

const NAME_CHAR = /[\p{L}\p{M}\p{N}_]/u
const BLOCKS_BEFORE_AT = /[\p{L}\p{M}\p{N}_./@=+%&?#\\-]/u
const NAME_CONTINUES = /^(?:[ \t]+\p{Lu}|\p{M}|[-.'’]\p{L})/u
const NAME_EXTENSION = /^[ \t]*[\p{L}\p{M}'’._-]+/u
const CODE = /```[\s\S]*?(?:```|$)|`[^`\n]*`/g
const RAW_TAG = /<\s*(?:users\s*\/|chat-user\b)[^>]*>/i
const USER_ID = /^users\/[0-9]+$/
const MAX_LISTED_NAMES = 15
const MAX_GUESSES = 3

interface Person {
  id: string
  name: string
}

interface NotTagged {
  typed: string
  guesses: string[]
}

interface MentionPlan {
  text: string
  mentions: string
  notTagged: NotTagged[]
  ambiguous: string[]
  pool: string[]
}

function mentionTag(id: string): string {
  return `<chat-user data-user="${id}">`
}

function cleanName(name: string): string {
  return name
    .replace(/\p{Cc}/gu, ' ')
    .replace(/\p{Cf}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function codeRanges(body: string): [number, number][] {
  return [...body.matchAll(CODE)].map((m) => [m.index!, m.index! + m[0].length])
}

function atPositions(body: string): number[] {
  const code = codeRanges(body)
  const out: number[] = []
  for (let i = body.indexOf('@'); i !== -1; i = body.indexOf('@', i + 1)) {
    if (code.some(([from, to]) => i >= from && i < to)) continue
    const before = i === 0 ? '' : Array.from(body.slice(Math.max(0, i - 2), i)).pop()!
    if (before && BLOCKS_BEFORE_AT.test(before)) continue
    if (!/^\p{L}/u.test(body.slice(i + 1, i + 3))) continue
    out.push(i)
  }
  return out
}

function hasMentionCandidate(body: string): boolean {
  return atPositions(body).length > 0
}

export function rawTagRefusal(body: string, prefix: string): string | null {
  return RAW_TAG.test(body) ? `${prefix}: the text already contains a Chat mention tag; write @Full Name instead so the preview can list who is tagged.` : null
}

function typedName(body: string, from: number): string {
  const first = /^\p{L}[\p{L}\p{M}\p{N}'’._-]*/u.exec(body.slice(from))
  if (!first) return ''
  const name = first[0].replace(/[._'’-]+$/, '')
  if (name.length !== first[0].length || !/^\p{Lu}/u.test(name)) return name
  let out = name
  let rest = body.slice(from + first[0].length)
  for (let n = 0; n < 3; n++) {
    const more = /^[ \t]+(\p{Lu}[\p{L}\p{M}'’-]*)/u.exec(rest)
    if (!more) break
    out += ` ${more[1]!.replace(/[-'’]+$/, '')}`
    rest = rest.slice(more[0].length)
  }
  return out
}

function guessesFor(typed: string, names: string[]): string[] {
  const t = typed.toLowerCase()
  return names
    .filter((n) => {
      const l = n.toLowerCase()
      return l.startsWith(t) || ` ${l} `.includes(` ${t} `) || t.startsWith(`${l} `)
    })
    .slice(0, MAX_GUESSES)
}

export function planMentions(body: string, people: Person[]): MentionPlan {
  const byName = new Map<string, Person[]>()
  const shownNames = new Map<string, string>()
  for (const p of people) {
    const name = cleanName(p.name)
    if (!USER_ID.test(p.id) || !name) continue
    const key = name.toLowerCase()
    const same = byName.get(key) ?? []
    if (!same.some((x) => x.id === p.id)) same.push({ id: p.id, name })
    byName.set(key, same)
    if (!shownNames.has(key)) shownNames.set(key, name)
  }
  const pool = [...shownNames.values()]
  const keys = [...byName.keys()].sort((a, b) => b.length - a.length)
  const positions = new Set(atPositions(body))
  const matched = new Map<string, string>()
  const notTagged = new Map<string, NotTagged>()
  const ambiguous: string[] = []
  const leave = (typed: string) => {
    if (!notTagged.has(typed)) notTagged.set(typed, { typed: `@${typed}`, guesses: guessesFor(typed, pool) })
  }
  let text = ''
  let i = 0
  while (i < body.length) {
    if (!positions.has(i)) {
      text += body[i]
      i++
      continue
    }
    const rest = body.slice(i + 1)
    const key = keys.find((k) => rest.slice(0, k.length).toLowerCase() === k && !NAME_CHAR.test(rest.charAt(k.length)))
    if (key === undefined) {
      const typed = typedName(body, i + 1)
      if (typed) leave(typed)
      text += '@'
      i++
      continue
    }
    const shown = body.slice(i, i + 1 + key.length)
    const tail = rest.slice(key.length)
    if (NAME_CONTINUES.test(tail)) {
      leave(`${shown.slice(1)}${(NAME_EXTENSION.exec(tail)?.[0] ?? '').replace(/[._'’-]+$/, '')}`)
      text += shown
      i += 1 + key.length
      continue
    }
    const hits = byName.get(key)!
    if (hits.length > 1) {
      ambiguous.push(shown)
      text += shown
    } else {
      matched.set(hits[0]!.id, hits[0]!.name)
      text += mentionTag(hits[0]!.id)
    }
    i += 1 + key.length
  }
  return {
    text,
    mentions: [...matched].map(([id, name]) => `@${name} -> ${id}`).join(', '),
    notTagged: [...notTagged.values()],
    ambiguous: [...new Set(ambiguous)],
    pool,
  }
}

export async function resolveMentions(chat: Pick<Chat, 'humanMembers'>, space: string, body: string, refusal = ''): Promise<MentionPlan> {
  if (!hasMentionCandidate(body)) return planMentions(body, [])
  let people: Person[]
  try {
    people = (await chat.humanMembers(space)).filter((p) => p.name && !p.name.endsWith('(you)') && !p.name.startsWith('users/') && p.name !== 'unknown')
  } catch (err) {
    throw new Error(`${refusal ? `${refusal}: ` : ''}Could not read who is in ${space} (${(err as Error).message}), so @names cannot be turned into mentions. Nothing was posted or changed. Try once more.`)
  }
  return planMentions(body, people)
}

function guessLine(n: NotTagged): string {
  if (!n.guesses.length) return `${n.typed} (no similar member name)`
  return `${n.typed} (did you mean ${n.guesses.map((g) => `@${g}`).join(' or ')}?)`
}

export function mentionLines(plan: MentionPlan, opts: { edit?: boolean; listMembers?: boolean } = {}): string[] {
  const lines: string[] = []
  if (plan.mentions) lines.push(`mentions: ${plan.mentions}`)
  if (plan.notTagged.length) lines.push(`not tagged (no member by that exact name): ${plan.notTagged.map(guessLine).join('; ')}`)
  if (plan.ambiguous.length) lines.push(`not tagged (two members have that name): ${plan.ambiguous.join(', ')}`)
  if ((plan.notTagged.length || plan.ambiguous.length) && opts.listMembers && plan.pool.length) {
    const more = plan.pool.length - MAX_LISTED_NAMES
    lines.push(`can be tagged here: ${plan.pool.slice(0, MAX_LISTED_NAMES).join(', ')}${more > 0 ? `, and ${more} more` : ''}`)
  }
  if (opts.edit && plan.mentions) lines.push('note: an edit notifies nobody. To notify these people, post a new message instead.')
  return lines
}

export function claimedMentions(value: string | undefined): string {
  const v = (value ?? '').trim()
  return v.toLowerCase() === 'none' ? '' : v
}

export function mentionMismatch(plan: MentionPlan, claimed: string): string | null {
  if (claimed === plan.mentions) return null
  return `the @mentions do not match the preview (you passed "${claimed || 'none'}", the text resolves to "${plan.mentions || 'none'}" now). Preview again with the same text and show the user its mentions line.`
}
