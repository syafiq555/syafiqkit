import { hostFsRead, hostFsStat, hostFsWrite, hostProcessRun } from '../core/api.js'
import { DESKTOP_DRAW_CHARS, DESKTOP_PICTURE_WIDTH, MEDIA_PAIR_CHARS, MEDIA_PAIR_WIDTH, PDF_PAGE_SIDE, PICTURE_EXTS, PNG_PREFIX, PREVIEW_STEPS, PREVIEW_TIMEOUT_MS } from '../core/constants.js'
import { homeOf, kb, messageOf } from '../core/format.js'
import { modLog } from '../core/log.js'
import { gitRun } from '../core/run.js'
import { state } from '../core/state.js'
import { hashOf, svgOf } from '../docs/images.js'

export const mediaMemo = new Map()

export function extOf(path) {
  const dot = path.lastIndexOf('.')
  return dot < 0 ? '' : path.slice(dot + 1).toLowerCase()
}

export function mediaKind(path) {
  const ext = extOf(path)
  if (ext === 'pdf') return 'pdf'
  return PICTURE_EXTS.has(ext) ? 'picture' : 'file'
}

export async function mediaDir($) {
  const home = await homeOf($)
  if (!home) return ''
  const dir = home + '/.claude/doc-pane-cache'
  await hostFsWrite($, dir + '/.previews', 'ok')
  return dir
}

export async function pixelSize($, path) {
  const ran = await hostProcessRun($, ['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', path], { timeoutMs: PREVIEW_TIMEOUT_MS })
  if (ran.exitCode !== 0) return null
  const width = Number((ran.stdout.match(/pixelWidth:\s*(\d+)/) || [])[1])
  const height = Number((ran.stdout.match(/pixelHeight:\s*(\d+)/) || [])[1])
  return width && height ? { width, height } : null
}

export async function sipsRun($, args) {
  const ran = await hostProcessRun($, ['sips', ...args], { timeoutMs: PREVIEW_TIMEOUT_MS })
  if (ran.exitCode !== 0) throw new Error((ran.stderr || 'sips failed').trim().slice(0, 200))
}

export function jpegArgs(quality) {
  return ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(quality)]
}

export async function fitPreview($, source, outBase, budget, widest) {
  const size = await pixelSize($, source)
  if (!size) return null
  const original = await hostFsRead($, source, { as: 'bytes' })
  const whole = original.base64 && original.base64.startsWith(PNG_PREFIX) ? svgOf(original.base64, 'png', size, budget, widest) : null
  if (whole) return { svg: whole, size }
  for (const [side, quality] of PREVIEW_STEPS) {
    const out = outBase + '-' + side + '.jpg'
    await sipsRun($, [...jpegArgs(quality), '-Z', String(side), source, '--out', out])
    const { base64 } = await hostFsRead($, out, { as: 'bytes' })
    const svg = svgOf(base64, 'jpeg', size, budget, widest)
    if (svg) return { svg, size }
  }
  return null
}

export async function blobPath($, cwd, spec, out) {
  const ran = await gitRun($, ['sh', '-c', 'git --no-optional-locks cat-file blob "$1" > "$2"', 'sh', spec, out], { cwd })
  return ran.exitCode === 0
}

export function relativeTo(cwd, path) {
  return (path.startsWith(cwd + '/') ? path.slice(cwd.length + 1) : path)
}

export async function pictureSide($, source, outBase, budget, widest) {
  try {
    return await fitPreview($, source, outBase, budget, widest)
  } catch (error) {
    modLog($, 'picture ' + source + ': ' + messageOf(error).slice(0, 200))
    return null
  }
}

export async function pdfFirstPage($, source, stem) {
  const folder = stem + '-ql'
  try {
    await hostFsWrite($, folder + '/.q', 'ok')
    const ran = await hostProcessRun($, ['qlmanage', '-t', '-s', String(PDF_PAGE_SIDE), '-o', folder, source], { timeoutMs: PREVIEW_TIMEOUT_MS })
    if (ran.exitCode === 0) return folder + '/' + source.slice(source.lastIndexOf('/') + 1) + '.png'
  } catch (error) {
    modLog($, 'pdf ' + source + ': qlmanage failed: ' + messageOf(error).slice(0, 200))
  }
  try {
    const out = stem + '-page.png'
    await sipsRun($, ['-s', 'format', 'png', source, '--out', out])
    return out
  } catch (error) {
    modLog($, 'pdf ' + source + ': first page could not be made: ' + messageOf(error).slice(0, 200))
    return ''
  }
}

export function mediaStamp(diff) {
  return (diff.media ? diff.media.mtime + ':' + diff.media.bytes : '')
}

export async function mediaPreview($, cwd, media, plane) {
  const stat = await hostFsStat($, media.abs).catch(() => null)
  const memoKey = [media.kind, cwd, media.abs, plane, media.isNew, stat ? stat.mtimeMs + ':' + stat.size : 'gone'].join('|')
  if (!mediaMemo.has(memoKey)) {
    const pending = buildPreview($, cwd, media, plane, stat, memoKey)
    mediaMemo.set(memoKey, pending)
    pending.catch(() => mediaMemo.delete(memoKey))
    if (mediaMemo.size > 60) mediaMemo.delete(mediaMemo.keys().next().value)
  }
  return mediaMemo.get(memoKey)
}

export async function buildPreview($, cwd, media, plane, stat, memoKey) {
  const dir = await mediaDir($)
  if (!dir) return {}
  const rel = relativeTo(cwd, media.abs)
  const stem = dir + '/m-' + hashOf(memoKey)
  const pair = !media.isNew && stat && media.kind === 'picture'
  const budget = pair ? MEDIA_PAIR_CHARS : DESKTOP_DRAW_CHARS - 20000
  const widest = pair ? MEDIA_PAIR_WIDTH : DESKTOP_PICTURE_WIDTH
  const side = (source, name) => pictureSide($, source, stem + '-' + name, budget, widest)
  const result = {}
  if (media.kind === 'pdf') {
    const page = stat ? await pdfFirstPage($, media.abs, stem) : ''
    if (page) result.after = await side(page, 'after')
  } else if (media.kind === 'picture') {
    if (stat && plane !== 'staged') result.after = await side(media.abs, 'after')
    if (plane === 'staged' && (await blobPath($, cwd, ':./' + rel, stem + '-staged'))) result.after = await side(stem + '-staged', 'after')
    if (!media.isNew) {
      const spec = (plane === 'worktree' ? ':./' : 'HEAD:./') + rel
      if (await blobPath($, cwd, spec, stem + '-was')) result.before = await side(stem + '-was', 'before')
    }
  }
  if (stat) {
    result.bytes = stat.size
    result.mtime = stat.mtimeMs
  }
  return result
}

export async function attachMedia($, cwd, diff, abs, plane, isNew) {
  const media = { kind: mediaKind(abs), abs, isNew }
  if (state.desktop && media.kind !== 'file') {
    try {
      Object.assign(media, await mediaPreview($, cwd, media, plane))
    } catch (error) {
      modLog($, 'preview ' + abs + ': ' + messageOf(error).slice(0, 200))
    }
  }
  return { ...diff, media }
}

export function mediaCaption(media) {
  const kind = media.kind === 'pdf' ? 'PDF' : media.kind === 'picture' ? 'Picture' : 'File'
  const where = media.isNew ? 'New ' : 'Changed '
  const dims = media.after && media.after.size ? media.after.size.width + ' x ' + media.after.size.height : ''
  return [where + kind.toLowerCase(), dims, media.bytes ? kb(media.bytes) : ''].filter(Boolean).join(' · ')
}
