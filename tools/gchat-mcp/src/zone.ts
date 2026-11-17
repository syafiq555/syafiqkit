const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(zone: string): Intl.DateTimeFormat {
  let f = formatters.get(zone)
  if (!f) {
    try {
      f = new Intl.DateTimeFormat('en-GB', {
        timeZone: zone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hourCycle: 'h23',
      })
    } catch {
      throw new Error(`SYAFIQKIT_TZ="${zone}" is not a time zone; use an IANA name such as Asia/Kuala_Lumpur or Europe/London`)
    }
    formatters.set(zone, f)
  }
  return f
}

export function timeZone(): string {
  return process.env.SYAFIQKIT_TZ || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export function zoneParts(at: Date, zone = timeZone()): Record<string, string> {
  return Object.fromEntries(formatter(zone).formatToParts(at).map((p) => [p.type, p.value]))
}

function offsetMs(zone: string, utcMs: number): number {
  const p = zoneParts(new Date(utcMs), zone)
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour), Number(p.minute), Number(p.second))
  return asUtc - Math.floor(utcMs / 1000) * 1000
}

export function zoneMidnight(year: number, month: number, day: number, zone = timeZone()): Date {
  const wall = Date.UTC(year, month - 1, day)
  const first = wall - offsetMs(zone, wall)
  const at = wall - offsetMs(zone, first)
  const shownAt = at + offsetMs(zone, at)
  if (shownAt < wall) return new Date(at + (wall - shownAt))
  const hourBefore = zoneParts(new Date(at - 3_600_000), zone)
  const sameDay = Number(hourBefore.year) === year && Number(hourBefore.month) === month && Number(hourBefore.day) === day
  return new Date(sameDay ? at - 3_600_000 : at)
}
