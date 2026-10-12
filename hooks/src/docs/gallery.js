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

const galleryIndexPath = async ($) => {
  const [home, id] = await Promise.all([homeOf($), $.session.id().catch(() => '')])
  if (!home || !id) return ''
  return home + '/.claude/doc-pane-cache/gallery-' + id + '.json'
}

const saveGallery = async ($) => {
  try {
    const path = await galleryIndexPath($)
    if (path) await $.fs.write(path, JSON.stringify(state.images.map((image) => ({ path: image.path, caption: image.caption || '' }))))
  } catch (error) {
    modLog($, 'gallery: could not save the list: ' + messageOf(error).slice(0, 200))
  }
}

const restoreGallery = ($) => {
  if (state.galleryRestore) return state.galleryRestore
  state.galleryRestore = (async () => {
    try {
      const path = await galleryIndexPath($)
      if (!path || state.images.length) return
      const saved = JSON.parse(await $.fs.read(path))
      if (!Array.isArray(saved)) return
      const entries = saved.filter((item) => item && typeof item.path === 'string').slice(-MAX_GALLERY)
      const read = await Promise.all(entries.map((item) => readGalleryImage($, item.path, typeof item.caption === 'string' ? item.caption : '')))
      const restored = []
      for (const item of read) if (item.image) restored.push(await shrinkForDesktop($, item.image))
      if (restored.length && !state.images.length) {
        state.images = restored
        redrawPane($)
      }
    } catch {}
  })()
  return state.galleryRestore
}

const showImages = async ($, e) => {
  await restoreGallery($)
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
    await saveGallery($)
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

const sliceGeometry = (size) => {
  const width = Math.min(size.width, SLICE_WIDTH)
  const height = Math.round((size.height * width) / size.width)
  return { width, height, count: Math.max(1, Math.ceil(height / SLICE_HEIGHT)) }
}

const slicesWanted = (image) => Boolean(image.size) && (sliceGeometry(image.size).count > 1 || image.size.width > DESKTOP_PICTURE_WIDTH)

const ensureSlice = async ($, image, index) => {
  if (!state.desktop || !image.size) return
  image.slices = image.slices || {}
  if (index in image.slices || image.slicing) return
  image.slicing = true
  try {
    const geo = sliceGeometry(image.size)
    const dir = await mediaDir($)
    if (!dir) {
      image.slices[index] = null
      return
    }
    const stem = dir + '/' + hoverScope(image.path) + '-z'
    let source = image.path
    if (image.size.width > SLICE_WIDTH) {
      source = stem + '-wide.png'
      if (!image.scaled) {
        await sipsRun($, ['--resampleWidth', String(SLICE_WIDTH), image.path, '--out', source])
        image.scaled = true
      }
    }
    const top = index * SLICE_HEIGHT
    const high = Math.min(SLICE_HEIGHT, geo.height - top)
    let drawn = null
    for (const quality of SLICE_QUALITIES) {
      const out = stem + '-' + index + '.jpg'
      await sipsRun($, ['-c', String(high), String(geo.width), '--cropOffset', String(top), '0', ...jpegArgs(quality), source, '--out', out])
      const { base64 } = await $.fs.read(out, { as: 'bytes' })
      drawn = svgOf(base64, 'jpeg', { width: geo.width, height: high }, SLICE_CHARS, SLICE_WIDTH)
      if (drawn) break
    }
    image.slices[index] = drawn
  } catch (error) {
    modLog($, 'picture ' + image.path + ': slice ' + index + ' failed: ' + messageOf(error).slice(0, 200))
    image.slices[index] = null
  } finally {
    image.slicing = false
  }
  const wanted = image.slice || 0
  if (!(wanted in image.slices)) await ensureSlice($, image, wanted)
}
