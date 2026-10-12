const registerImageTool = async ($) => {
  try {
    await $.tool.register({
      name: 'show_image',
      isDeferred: false,
      description:
        "Show PNG images to the user in the syafiqkit side pane instead of reporting a file path. Use it for e2e or Playwright screenshots saved under /tmp, rendered charts, and any picture the user should look at. Paths must be absolute and PNG; pass several to open them as a gallery. On Desktop a picture over about 65 KB is shown as a smaller copy on macOS (full size in the system viewer); a picture that still cannot be drawn, or one over 2 MiB in a terminal, shows a button that opens it in the system viewer instead; nothing draws in the VS Code panel, so report the file path there.",
      inputSchema: {
        type: 'object',
        properties: {
          paths: { type: 'array', items: { type: 'string' }, description: 'Absolute paths of PNG files' },
          caption: { type: 'string', description: 'Optional one-line note shown with the images' },
        },
        required: ['paths'],
      },
    })
  } catch {
    return
  }
}

const ABSOLUTE_PATH = /^(\/|[A-Za-z]:[\\/])/

const readGalleryImage = async ($, path, caption) => {
  if (!ABSOLUTE_PATH.test(path)) return { refused: path + ' (not an absolute path)' }
  try {
    const stat = await $.fs.stat(path)
    if (stat.size > MAX_GALLERY_BYTES) return { refused: path + ' (over 12 MiB)' }
    const { base64 } = await $.fs.read(path, { as: 'bytes' })
    if (!base64 || !base64.startsWith(PNG_PREFIX)) return { refused: path + ' (not a PNG; only PNG files can be drawn)' }
    if (base64.length > MAX_GALLERY_BASE64) return { refused: path + ' (over 16 MiB)' }
    const inline = base64.length <= MAX_BASE64
    return { image: { path, name: nameOf(path), size: pngSize(base64), caption, png: inline ? base64 : '' } }
  } catch {
    return { refused: path + ' (could not be read)' }
  }
}

const shrinkForDesktop = async ($, image) => {
  if (!state.desktop || !image.size || svgPicture(image)) return image
  try {
    const home = await homeOf($)
    if (!home) return image
    const dir = home + '/.claude/doc-pane-cache'
    await $.fs.write(dir + '/.previews', 'ok')
    for (const [side, quality] of PREVIEW_STEPS) {
      const out = dir + '/' + hoverScope(image.path) + '-' + side + '.jpg'
      const ran = await $.process.run(
        ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality), '-Z', String(side), image.path, '--out', out],
        { timeoutMs: PREVIEW_TIMEOUT_MS },
      )
      if (ran.exitCode !== 0) {
        modLog($, 'picture ' + image.path + ': sips could not shrink it: ' + (ran.stderr || '').trim().slice(0, 200))
        return image
      }
      const { base64 } = await $.fs.read(out, { as: 'bytes' })
      const shrunk = { ...image, preview: base64 }
      if (svgPicture(shrunk)) return shrunk
    }
  } catch (error) {
    modLog($, 'picture ' + image.path + ': no smaller copy: ' + messageOf(error).slice(0, 200))
    return image
  }
  modLog($, 'picture ' + image.path + ': still too big after shrinking')
  return image
}

const showImages = async ($, e) => {
  const raw = Array.isArray(e.paths) ? e.paths : typeof e.path === 'string' ? [e.path] : []
  const wanted = [...new Set(raw.filter((path) => typeof path === 'string' && path))]
  const paths = wanted.slice(0, MAX_GALLERY)
  if (!paths.length) return 'Nothing shown: pass paths, an array of absolute PNG file paths.'
  const caption = typeof e.caption === 'string' ? e.caption.slice(0, 200) : ''
  const read = await Promise.all(paths.map((path) => readGalleryImage($, path, caption)))
  const added = []
  for (const item of read) if (item.image) added.push(await shrinkForDesktop($, item.image))
  const refused = read.filter((item) => item.refused).map((item) => item.refused)
  const lines = []
  if (added.length) {
    const kept = state.images.filter((image) => !added.some((fresh) => fresh.path === image.path))
    state.images = [...kept, ...added].slice(-MAX_GALLERY)
    const noun = added.length + (added.length === 1 ? ' image' : ' images')
    $.ui.toast(noun + ' ready: press Images in the band')
    redrawPane($)
    lines.push(
      'Added ' + noun + ' to the syafiqkit gallery. ' +
        'The pane does not open by itself; the user opens it with the Images button in the band.',
    )
    const undrawn = added.filter((image) => (state.desktop ? !svgPicture(image) : !image.png)).length
    if (undrawn) lines.push(undrawn + ' of them are too large to draw in the pane; the user opens them with Open in viewer')
  }
  if (wanted.length > paths.length) lines.push(wanted.length - paths.length + ' more paths were not added (limit ' + MAX_GALLERY + ' per call)')
  if (refused.length) lines.push('Not shown: ' + refused.join('; '))
  return lines.join('\n')
}

const viewerCommand = async ($, path) => {
  const system = await systemOf($)
  if (system === 'Darwin') return ['open', path]
  if (system === 'Linux') return ['xdg-open', path]
  return ['cmd', '/c', 'start', '', path]
}

const openInViewer = async ($, path) => {
  try {
    const ran = await $.process.run(await viewerCommand($, path))
    if (ran.exitCode !== 0) $.ui.toast('Could not open the image: ' + (ran.stderr || 'viewer failed').trim().slice(0, 80))
  } catch (error) {
    $.ui.toast('Could not open the image: ' + messageOf(error).slice(0, 80))
  }
}

const openImages = async ($) => {
  try {
    stopWatch()
    state.view = 'images'
    state.current = null
    state.isOpen = true
    redrawPane($)
    await $.ui.open({ id: PANE, title: 'syafiqkit', focus: true, closeOnEscape: true, columns: 110 })
  } catch {
    state.isOpen = false
    redrawPane($)
  }
}
