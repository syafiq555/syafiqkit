import { CHAT, CHAT_UPLOAD, Google, PEOPLE, query } from './google.ts'
import { mapLimit, type ChatMessage } from './format.ts'

export interface Space {
  name: string
  displayName?: string
  spaceType?: 'SPACE' | 'GROUP_CHAT' | 'DIRECT_MESSAGE'
  lastActiveTime?: string
  membershipCount?: { joinedDirectHumanUserCount?: number }
}

export interface AttachmentRef {
  resourceName?: string
  attachmentUploadToken?: string
}

interface Self {
  id: string | null
  name: string | null
}

const SPACES_TTL_MS = 2 * 60_000
const SELF_RETRY_MS = 30_000

export class Chat {
  private directory: Promise<Map<string, string>> | null = null
  private me: Promise<Self> | null = null
  private meRetryAt = 0
  private names = new Map<string, Promise<string>>()
  private labels = new Map<string, Promise<string>>()
  private spaceCache: { at: number; list: Promise<Space[]> } | null = null

  constructor(
    private readonly g: Google,
    private readonly now: () => number = Date.now,
  ) {}

  spaces(): Promise<Space[]> {
    if (this.spaceCache && this.now() - this.spaceCache.at < SPACES_TTL_MS) return this.spaceCache.list
    const list = this.fetchSpaces()
    this.spaceCache = { at: this.now(), list }
    list.catch(() => {
      if (this.spaceCache?.list === list) this.spaceCache = null
    })
    return list
  }

  private async fetchSpaces(): Promise<Space[]> {
    const all: Space[] = []
    let pageToken: string | undefined
    do {
      const page = await this.g.call('GET', `${CHAT}/spaces${query({ pageSize: 1000, pageToken })}`)
      all.push(...(page.spaces ?? []))
      pageToken = page.nextPageToken
    } while (pageToken)
    return all.sort((a, b) => (b.lastActiveTime ?? '').localeCompare(a.lastActiveTime ?? ''))
  }

  self(): Promise<Self> {
    if (this.me && (this.meRetryAt === 0 || this.now() < this.meRetryAt)) return this.me
    this.meRetryAt = 0
    this.me = this.selfFromDms().catch(() => {
      this.meRetryAt = this.now() + SELF_RETRY_MS
      return { id: null, name: null }
    })
    return this.me
  }

  private async selfFromDms(): Promise<Self> {
    const dms = (await this.spaces()).filter((s) => s.spaceType === 'DIRECT_MESSAGE').slice(0, 2)
    if (dms.length < 2) throw new Error('need two DMs to tell which member is you')
    const members = await Promise.all(
      dms.map(async (s) => {
        const page = await this.g.call('GET', `${CHAT}/${s.name}/members${query({ pageSize: 10 })}`)
        return (page.memberships ?? []).map((x: any) => x.member).filter((u: any) => u?.name)
      }),
    )
    const shared = members[0]!.find((u: any) => members[1]!.some((v: any) => v.name === u.name))
    if (!shared) throw new Error('no member common to two DMs')
    return { id: shared.name, name: shared.displayName ?? null }
  }

  label(space: Space): Promise<string> {
    if (space.displayName) return Promise.resolve(space.displayName)
    let cached = this.labels.get(space.name)
    if (!cached) {
      cached = this.memberLabel(space)
      this.labels.set(space.name, cached)
    }
    return cached
  }

  private async memberLabel(space: Space): Promise<string> {
    const { id: me } = await this.self()
    if (!me) this.labels.delete(space.name)
    const page = await this.g.call('GET', `${CHAT}/${space.name}/members${query({ pageSize: 20 })}`).catch(() => null)
    if (!page) {
      this.labels.delete(space.name)
      return space.spaceType === 'DIRECT_MESSAGE' ? 'DM (members unknown)' : '(members unknown)'
    }
    const others = (page.memberships ?? []).map((x: any) => x.member).filter((u: any) => u?.name && u.name !== me)
    if (!others.length) return space.spaceType === 'DIRECT_MESSAGE' ? 'DM (yourself)' : '(unnamed)'
    const people = (await Promise.all(others.map((u: any) => this.person(u.name, u.displayName)))).join(', ')
    const unsure = me ? '' : " (couldn't tell which member is you)"
    return `${space.spaceType === 'DIRECT_MESSAGE' ? `DM: ${people}` : people}${unsure}`
  }

  async person(userName: string | undefined, displayName?: string): Promise<string> {
    if (!userName) return displayName || 'unknown'
    const me = await this.self()
    if (userName === me.id) return me.name ? `${me.name} (you)` : 'You'
    if (displayName) return displayName
    let cached = this.names.get(userName)
    if (!cached) {
      cached = this.lookupName(userName)
      this.names.set(userName, cached)
    }
    return cached
  }

  private async lookupName(userName: string): Promise<string> {
    const id = userName.replace(/^users\//, '')
    const fromDirectory = (await this.loadDirectory()).get(id)
    if (fromDirectory) return fromDirectory
    const p = await this.g.call('GET', `${PEOPLE}/people/${id}${query({ personFields: 'names,emailAddresses' })}`).catch(() => null)
    return p?.names?.[0]?.displayName || p?.emailAddresses?.[0]?.value || userName
  }

  senderOf(m: ChatMessage): Promise<string> {
    return this.person(m.sender?.name, m.sender?.displayName)
  }

  private loadDirectory(): Promise<Map<string, string>> {
    this.directory ??= this.fetchDirectory()
    return this.directory
  }

  private async fetchDirectory(): Promise<Map<string, string>> {
    const map = new Map<string, string>()
    let pageToken: string | undefined
    try {
      do {
        const page = await this.g.call(
          'GET',
          `${PEOPLE}/people:listDirectoryPeople${query({
            readMask: 'names,emailAddresses',
            sources: 'DIRECTORY_SOURCE_TYPE_DOMAIN_PROFILE',
            pageSize: 1000,
            pageToken,
          })}`,
        )
        for (const p of page.people ?? []) {
          const id = String(p.resourceName ?? '').replace(/^people\//, '')
          const name = p.names?.[0]?.displayName || p.emailAddresses?.[0]?.value
          if (id && name) map.set(id, name)
        }
        pageToken = page.nextPageToken
      } while (pageToken)
    } catch {}
    return map
  }

  async resolveSpace(ref: string): Promise<Space> {
    const r = ref.trim()
    if (r.startsWith('spaces/')) {
      const known = (await this.spaces()).find((s) => s.name === r)
      return known ?? (await this.g.call('GET', `${CHAT}/${r}`))
    }
    if (r.includes('@')) {
      return this.g.call('GET', `${CHAT}/spaces:findDirectMessage${query({ name: `users/${r}` })}`).catch((err: Error) => {
        if (!err.message.startsWith('Google API 404')) throw err
        throw new Error(`No DM with ${r} yet. This sign-in can't start a new DM; start it once in Chat, then retry.`)
      })
    }
    const all = await this.spaces()
    const needle = r.toLowerCase()
    const named = all.filter((s) => s.displayName?.toLowerCase() === needle)
    if (named.length === 1) return named[0]!
    const partial = named.length ? named : all.filter((s) => s.displayName?.toLowerCase().includes(needle))
    if (partial.length === 1) return partial[0]!
    if (partial.length > 1) {
      throw new Error(`"${ref}" matches several spaces: ${partial.map((s) => `${s.displayName} (${s.name})`).join('; ')}. Pass the space name.`)
    }
    const dms = all.filter((s) => s.spaceType === 'DIRECT_MESSAGE').slice(0, 60)
    const labelled = await mapLimit(dms, 6, async (s) => ({ s, label: (await this.label(s)).toLowerCase() }))
    const hit = labelled.filter((x) => x.label.includes(needle))
    if (hit.length === 1) return hit[0]!.s
    if (hit.length > 1) throw new Error(`"${ref}" matches several DMs: ${hit.map((x) => `${x.label} (${x.s.name})`).join('; ')}. Pass the space name or the person's email.`)
    throw new Error(`No space or DM matches "${ref}". List them with spaces_list, or pass the person's email.`)
  }

  async messages(space: string, opts: { since?: string; until?: string; thread?: string; limit: number; newestFirst: boolean }): Promise<ChatMessage[]> {
    const filter = [
      opts.since ? `createTime > "${opts.since}"` : '',
      opts.until ? `createTime < "${opts.until}"` : '',
      opts.thread ? `thread.name = ${opts.thread}` : '',
    ]
      .filter(Boolean)
      .join(' AND ')
    const out: ChatMessage[] = []
    let pageToken: string | undefined
    do {
      const page = await this.g.call(
        'GET',
        `${CHAT}/${space}/messages${query({
          pageSize: Math.min(1000, opts.limit - out.length),
          pageToken,
          filter: filter || undefined,
          orderBy: opts.newestFirst ? 'createTime DESC' : 'createTime ASC',
        })}`,
      )
      out.push(...(page.messages ?? []))
      pageToken = page.nextPageToken
    } while (pageToken && out.length < opts.limit)
    return out.slice(0, opts.limit)
  }

  message(name: string): Promise<ChatMessage> {
    return this.g.call('GET', `${CHAT}/${name}`)
  }

  media(resourceName: string, maxBytes: number): Promise<{ data: Uint8Array; contentType: string | null }> {
    if (!/^[A-Za-z0-9_\-.~=+/]+$/.test(resourceName) || resourceName.split('/').includes('..')) {
      return Promise.reject(new Error('Unexpected attachment reference from Google; not downloaded'))
    }
    return this.g.bytes(`${CHAT}/media/${resourceName}?alt=media`, maxBytes)
  }

  async latest(space: string, thread?: string): Promise<ChatMessage | null> {
    return (await this.messages(space, { limit: 1, newestFirst: true, thread }))[0] ?? null
  }

  async upload(space: string, filename: string, data: Uint8Array, contentType: string): Promise<AttachmentRef> {
    const res = await this.g.upload(`${CHAT_UPLOAD}/${space}/attachments:upload${query({ uploadType: 'multipart' })}`, { filename }, data, contentType)
    if (!res?.attachmentDataRef) throw new Error(`Upload of ${filename} returned no attachment reference`)
    return res.attachmentDataRef
  }

  async send(space: string, text: string, thread?: string, attachments: AttachmentRef[] = [], messageId?: string): Promise<ChatMessage> {
    const body: Record<string, unknown> = { text }
    if (attachments.length) body.attachment = attachments.map((ref) => ({ attachmentDataRef: ref }))
    if (thread) body.thread = { name: thread }
    const opt = query({ messageReplyOption: thread ? 'REPLY_MESSAGE_OR_FAIL' : undefined, messageId })
    return this.g.call('POST', `${CHAT}/${space}/messages${opt}`, body)
  }
}
