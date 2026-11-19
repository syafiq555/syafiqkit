export function splitAddressList(raw: string): string[] {
  const parts: string[] = []
  let current = ''
  let inQuote = false
  let inAngle = false
  let comment = 0
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]!
    if (inQuote) {
      current += ch
      if (ch === '\\' && i + 1 < raw.length) current += raw[++i]
      else if (ch === '"') inQuote = false
      continue
    }
    if (comment) {
      if (ch === '(') comment++
      else if (ch === ')') comment--
      current += ch
      continue
    }
    if (ch === '"') inQuote = true
    else if (ch === '(') comment++
    else if (ch === '<') inAngle = true
    else if (ch === '>') inAngle = false
    else if ((ch === ',' || ch === ';') && !inAngle) {
      parts.push(current)
      current = ''
      continue
    }
    current += ch
  }
  parts.push(current)
  return parts.map((p) => p.trim()).filter(Boolean)
}

function addressOf(segment: string): string {
  const angle = /<([^<>]*)>\s*$/.exec(segment)
  if (angle) return angle[1]!.trim()
  return segment
    .replace(/\([^)]*\)/g, '')
    .replace(/^[^@<>"]*:\s*/, '')
    .trim()
}

export function parseAddressList(raw: string | undefined): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const segment of splitAddressList(raw ?? '')) {
    const address = addressOf(segment)
    if (!address || seen.has(address.toLowerCase())) continue
    seen.add(address.toLowerCase())
    out.push(address)
  }
  return out
}
