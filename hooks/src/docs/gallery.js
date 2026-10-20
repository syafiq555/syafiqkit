import { hostFsRead, hostFsStat, hostFsWrite, hostProcessRun, hostSessionId, hostToolRegister, hostUiOpen, hostUiToast } from '../core/api.js'
import { DESKTOP_PICTURE_WIDTH, MAX_GALLERY, MAX_GALLERY_BASE64, MAX_GALLERY_BYTES, MAX_TREE_IMAGE_SOURCE, PANE, PNG_PREFIX, PREVIEW_STEPS, PREVIEW_TIMEOUT_MS, SLICE_CHARS, SLICE_HEIGHT, SLICE_QUALITIES, SLICE_WIDTH } from '../core/constants.js'
import { homeOf, messageOf } from '../core/format.js'
import { modLog } from '../core/log.js'
import { state } from '../core/state.js'
import { systemOf } from './export.js'
import { overBudgetPaths, pngSize, svgOf, svgPicture, terminalFault } from './images.js'
import { stopWatch } from './reader.js'
import { redrawPane } from '../git/controller.js'
import { jpegArgs, mediaDir, sipsRun } from '../git/media.js'
import { nameOf } from '../git/status.js'
import { hoverScope } from '../views/ui.js'

export async function registerImageTool($) {
  try {
    await hostToolRegister($, {
      name: 'show_image',
      isDeferred: false,
      description:
        "Show PNG images to the user in the syafiqkit side pane instead of reporting a file path. Use it for e2e or Playwright screenshots saved under /tmp, rendered charts, and any picture the user should look at. Paths must be absolute and PNG; pass several to open them as a gallery. On Desktop a picture over about 65 KB is shown as a smaller copy on macOS (full size in the system viewer); a picture that still cannot be drawn, or one over about 1.5 MiB or 4096 pixels on a side in a terminal (a tall full-page screenshot), shows a button that opens it in the system viewer instead; nothing draws in the VS Code panel, so report the file path there.",
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

export const ABSOLUTE_PATH = /^(\/|[A-Za-z]:[\\/])/

export async function readGalleryImage($, path, caption) {
  if (!ABSOLUTE_PATH.test(path)) return { refused: path + ' (not an absolute path)' }
  try {
    const stat = await hostFsStat($, path)
    if (stat.size > MAX_GALLERY_BYTES) return { refused: path + ' (over 12 MiB)' }
    const { base64 } = await hostFsRead($, path, { as: 'bytes' })
    if (!base64 || !base64.startsWith(PNG_PREFIX)) return { refused: path + ' (not a PNG; only PNG files can be drawn)' }
    if (base64.length > MAX_GALLERY_BASE64) return { refused: path + ' (over 16 MiB)' }
    const inline = base64.length <= MAX_TREE_IMAGE_SOURCE
    return { image: { path, name: nameOf(path), size: pngSize(base64), caption, bytes: stat.size, png: inline ? base64 : '' } }
  } catch {
    return { refused: path + ' (could not be read)' }
  }
}

export async function shrinkForDesktop($, image) {
  if (!state.desktop || !image.size || svgPicture(image)) return image
  try {
    const home = await homeOf($)
    if (!home) return image
    const dir = home + '/.claude/doc-pane-cache'
    await hostFsWrite($, dir + '/.previews', 'ok')
    for (const [side, quality] of PREVIEW_STEPS) {
      const out = dir + '/' + hoverScope(image.path) + '-' + side + '.jpg'
      const ran = await hostProcessRun($, 
        ['sips', '-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality), '-Z', String(side), image.path, '--out', out],
        { timeoutMs: PREVIEW_TIMEOUT_MS },
      )
      if (ran.exitCode !== 0) {
        modLog($, 'picture ' + image.path + ': sips could not shrink it: ' + (ran.stderr || '').trim().slice(0, 200))
        return image
      }
      const { base64 } = await hostFsRead($, out, { as: 'bytes' })
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

export async function galleryIndexPath($) {
  const [home, id] = await Promise.all([homeOf($), hostSessionId($).catch(() => '')])
  if (!home || !id) return ''
  return home + '/.claude/doc-pane-cache/gallery-' + id + '.json'
}

export async function saveGallery($) {
  try {
    const path = await galleryIndexPath($)
    if (path) await hostFsWrite($, path, JSON.stringify(state.images.map((image) => ({ path: image.path, caption: image.caption || '' }))))
  } catch (error) {
    modLog($, 'gallery: could not save the list: ' + messageOf(error).slice(0, 200))
  }
}

export function restoreGallery($) {
  if (state.galleryRestore) return state.galleryRestore
  state.galleryRestore = (async () => {
    try {
      const path = await galleryIndexPath($)
      if (!path || state.images.length) return
      const saved = JSON.parse(await hostFsRead($, path))
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

export async function showImages($, e) {
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
    hostUiToast($, noun + ' ready: press Images in the band')
    redrawPane($)
    lines.push(
      'Added ' + noun + ' to the syafiqkit gallery. ' +
        'The pane does not open by itself; the user opens it with the Images button in the band.',
    )
    if (state.desktop) {
      const undrawn = added.filter((image) => !svgPicture(image)).length
      if (undrawn) lines.push(undrawn + ' of them are too large to draw in the pane; the user opens them with Open in viewer.')
    } else {
      const tooBig = added.filter((image) => terminalFault(image) === 'large').length
      const tooTall = added.filter((image) => terminalFault(image) === 'tall').length
      const hidden = overBudgetPaths([...state.images].reverse()).size
      if (tooBig) lines.push(tooBig + ' of them are over about 1.5 MiB and will not draw in the pane; the user opens them with Open in viewer.')
      if (tooTall) lines.push(tooTall + ' of them are over 4096 pixels on a side and will not draw; send viewport-sized screenshots instead of full-page ones.')
      if (hidden) lines.push(hidden + ' older pictures in the gallery are not drawn because the pane holds at most 2 MiB of pictures; Clear empties the gallery.')
    }
  }
  if (wanted.length > paths.length) lines.push(wanted.length - paths.length + ' more paths were not added (limit ' + MAX_GALLERY + ' per call)')
  if (refused.length) lines.push('Not shown: ' + refused.join('; '))
  return lines.join('\n')
}

export async function viewerCommand($, path) {
  const system = await systemOf($)
  if (system === 'Darwin') return ['open', path]
  if (system === 'Linux') return ['xdg-open', path]
  return ['cmd', '/c', 'start', '', path]
}

export async function openInViewer($, path) {
  try {
    const ran = await hostProcessRun($, await viewerCommand($, path))
    if (ran.exitCode !== 0) hostUiToast($, 'Could not open the image: ' + (ran.stderr || 'viewer failed').trim().slice(0, 80))
  } catch (error) {
    hostUiToast($, 'Could not open the image: ' + messageOf(error).slice(0, 80))
  }
}

export async function openImages($, fromBand = false) {
  const wasOpen = fromBand && state.isOpen
  if (wasOpen && state.view === 'images') return
  try {
    stopWatch()
    state.view = 'images'
    state.current = null
    state.isOpen = true
    redrawPane($)
    if (wasOpen) return
    await hostUiOpen($, { id: PANE, title: 'syafiqkit', focus: true, closeOnEscape: true, columns: 110 })
  } catch {
    state.isOpen = false
    redrawPane($)
  }
}

export function sliceGeometry(size) {
  const width = Math.min(size.width, SLICE_WIDTH)
  const height = Math.round((size.height * width) / size.width)
  return { width, height, count: Math.max(1, Math.ceil(height / SLICE_HEIGHT)) }
}

export function slicesWanted(image) {
  return Boolean(image.size) && (sliceGeometry(image.size).count > 1 || image.size.width > DESKTOP_PICTURE_WIDTH)
}

export async function ensureSlice($, image, index) {
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
      const { base64 } = await hostFsRead($, out, { as: 'bytes' })
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
