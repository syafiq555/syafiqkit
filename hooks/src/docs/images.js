const hashOf = (text) => {
  let hash = 5381
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash * 33) ^ text.charCodeAt(index)) >>> 0
  }
  return hash.toString(16)
}

const pngSize = (base64) => {
  const bytes = []
  let bits = 0
  let value = 0
  for (const char of base64.slice(0, 32)) {
    const index = B64.indexOf(char)
    if (index < 0) continue
    value = ((value << 6) | index) & 0xffff
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((value >> bits) & 255)
    }
  }
  if (bytes.length < 24) return null
  const read = (offset) =>
    ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
  return { width: read(16), height: read(20) }
}

const fitImage = (size, maxColumns) => {
  if (!size || !size.width || !size.height) return { columns: Math.min(maxColumns, 60), rows: 15 }
  const ratio = size.height / size.width
  let columns = Math.min(maxColumns, 255, Math.max(20, Math.ceil(size.width / 12)))
  let rows = Math.ceil((columns * ratio) / 2)
  if (rows > MAX_IMAGE_ROWS) {
    rows = MAX_IMAGE_ROWS
    columns = Math.max(10, Math.floor((rows * 2) / ratio))
  }
  return { columns, rows: Math.max(1, Math.min(rows, 255)) }
}
