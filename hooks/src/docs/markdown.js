const splitCells = (line) =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replace(/\\\|/g, '|'))

const isSeparator = (line) => /^\s*\|?[\s:|-]*-[\s:|-]*\|?\s*$/.test(line) && line.includes('|')

const tableToBullets = (header, rows) =>
  rows.map((cells) => {
    const lead = cells[0] || ' '
    const rest = cells
      .slice(1)
      .map((value, index) => {
        const label = header[index + 1]
        if (!value) return ''
        return cells.length > 2 && label ? label + ': ' + value : value
      })
      .filter(Boolean)
    return '- **' + lead + '**' + (rest.length ? ' — ' + rest.join(' · ') : '')
  })

const reshapeTables = (text) => {
  const lines = text.split('\n')
  const out = []
  let inFence = false
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    if (/^\s*```/.test(line)) inFence = !inFence
    const startsTable =
      !inFence && line.trim().startsWith('|') && index + 1 < lines.length && isSeparator(lines[index + 1])
    if (!startsTable) {
      out.push(line)
      continue
    }
    const header = splitCells(line)
    const rows = []
    index += 2
    while (index < lines.length && lines[index].trim().startsWith('|')) {
      rows.push(splitCells(lines[index]))
      index += 1
    }
    index -= 1
    out.push(...tableToBullets(header, rows))
  }
  return out.join('\n')
}

const shape = (raw) => {
  const text = reshapeTables(raw.replace(/<!--[\s\S]*?-->\n?/g, ''))
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) + '\n\n_Truncated at ' + MAX_CHARS + ' characters._' : text
}

const segments = (text) => {
  const out = []
  let chunk = []
  let fence = null
  let diagram = []
  let section = ''
  const flush = () => {
    if (chunk.length) out.push({ kind: 'md', text: chunk.join('\n') })
    chunk = []
  }
  for (const line of text.split('\n')) {
    const marker = line.match(FENCE)
    if (fence === null) {
      if (marker) {
        if (marker[1] === 'mermaid') {
          flush()
          fence = 'mermaid'
          diagram = []
        } else {
          fence = 'other'
          chunk.push(line)
        }
        continue
      }
      const heading = line.match(HEADING)
      if (heading) section = heading[1].replace(/[*_`]/g, '').trim()
      const bold = line.match(/^\s*\*\*([^*]+)\*\*:?\s*$/)
      if (bold) section = bold[1].trim()
      const hit = line.match(ITEM)
      if (hit) {
        flush()
        out.push({ kind: 'item', done: hit[1] !== ' ', text: hit[2].trim(), section })
      } else {
        chunk.push(line)
      }
      continue
    }
    if (marker && marker[1] === '') {
      if (fence === 'mermaid') out.push({ kind: 'mermaid', source: diagram.join('\n') })
      else chunk.push(line)
      fence = null
      continue
    }
    if (fence === 'mermaid') diagram.push(line)
    else chunk.push(line)
  }
  if (fence === 'mermaid') chunk.push('```mermaid', ...diagram)
  flush()
  return out
}
