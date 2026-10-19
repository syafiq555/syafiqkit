import { atom, read } from 'claude-code'
import { hostFsRead, hostFsStat, hostFsWrite, hostProcessRun, hostSessionCwd, hostStoreGet, hostStoreSet, hostUiResolve } from '../core/api.js'
import { ANSWER_FILE_CAP, ANSWER_IMAGE_EXT, ANSWER_MISSING_RETRY_MS, ANSWER_MATH_COLUMNS, ANSWER_PICTURES_PROMPT, ANSWER_VIDEO_EXT, PICTURE_TIMEOUT_MS } from '../core/constants.js'
import { homeOf, lockDown, messageOf } from '../core/format.js'
import { modLog } from '../core/log.js'
import { bumpPictures, state } from '../core/state.js'
import { wantDiagrams } from '../docs/diagrams.js'
import { safeExists } from '../docs/discovery.js'
import { openInViewer } from '../docs/gallery.js'
import { fitImage, hashOf, pngSize } from '../docs/images.js'
import { segments } from '../docs/markdown.js'
import { enqueue, newQueue, typesetKeyOf, typesetSize, wantTypeset } from '../docs/typeset.js'

const picturesTick = atom({ plugin: 'syafiqkit', key: 'picturesTick' }, 0)

const fileQueue = newQueue()

function hasImage(node, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 40) return false
  if (Array.isArray(node)) return node.some((child) => hasImage(child, depth + 1))
  if (node.type === 'Image' || node.type === 'Raster' || node.type === 'Svg') return true
  return hasImage(node.children, depth + 1) || hasImage(node.props && node.props.children, depth + 1)
}

function isFilePath(path) {
  return !/^[a-z]+:\/\//i.test(path) && path.includes('/') && /(^|\/)[^/.][^/]*\.[a-z0-9]+$/i.test(path)
}

function withoutFences(text) {
  return text.replace(/^\s*(```|~~~)[^\n]*\n[\s\S]*?^\s*\1[^\n]*$/gm, '')
}

function findPictures(text) {
  const found = []
  for (const part of segments(text)) {
    if (part.kind === 'mermaid') {
      found.push({ kind: 'mermaid', source: part.source })
      continue
    }
    if (part.kind !== 'md') continue
    const prose = withoutFences(part.text)
    for (const match of prose.replace(/`[^`\n]*`/g, '').matchAll(/\$\$([\s\S]+?)\$\$/g)) found.push({ kind: 'math', source: '$$' + match[1] + '$$' })
    for (const match of prose.matchAll(/!\[[^\]]*\]\(<?([^)\s>]+)>?\)/g)) {
      if (isFilePath(match[1]) && ANSWER_IMAGE_EXT.test(match[1])) found.push({ kind: 'image', path: match[1] })
    }
    for (const match of prose.matchAll(/(?:^|[\s`(\[])((?:~|\.{1,2})?\/?[^\s`()\[\]"']+)(?=$|[\s`)\].,;:])/gm)) {
      if (isFilePath(match[1]) && ANSWER_VIDEO_EXT.test(match[1])) found.push({ kind: 'video', path: match[1] })
    }
  }
  const seen = new Set()
  return found.filter((item) => {
    const id = item.kind + ':' + (item.source || item.path)
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
}

function resolvePath(path, cwd, home) {
  if (path.startsWith('~/')) return home + path.slice(1)
  if (path.startsWith('/')) return path
  return cwd.replace(/\/$/, '') + '/' + path.replace(/^\.\//, '')
}

async function sizeOf($, file) {
  try {
    const { base64 } = await hostFsRead($, file, { as: 'bytes' })
    const size = base64 ? pngSize(base64) : null
    if (size && size.width && size.height) return size
  } catch {}
  const ran = await hostProcessRun($, ['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', file], { timeoutMs: PICTURE_TIMEOUT_MS })
  const stdout = String(ran.stdout)
  const width = Number((stdout.match(/pixelWidth:\s*(\d+)/) || [])[1])
  const height = Number((stdout.match(/pixelHeight:\s*(\d+)/) || [])[1])
  if (ran.exitCode !== 0 || !width || !height) throw new Error('could not read the picture size')
  return { width, height }
}

async function preparePicture($, job) {
  try {
    if (!(await safeExists($, job.path))) {
      state.answerPics[job.key] = { status: 'missing', at: Date.now() }
      return
    }
    const home = await homeOf($)
    if (!home) throw new Error('no home folder for the picture cache')
    const dir = home + '/.claude/doc-pane-cache/answers'
    const stat = await hostFsStat($, job.path).catch(() => null)
    const out = dir + '/' + job.key + '-' + Math.round((stat && stat.mtimeMs) || 0) + '.png'
    if (job.kind === 'image' && /\.png$/i.test(job.path)) {
      state.answerPics[job.key] = { status: 'ready', file: job.path, size: await sizeOf($, job.path) }
      return
    }
    if (!(await safeExists($, out))) {
      await hostFsWrite($, dir + '/.keep', '')
      const viaFfmpeg = ['ffmpeg', '-y', '-loglevel', 'error', '-i', job.path, '-frames:v', '1', '-vf', 'scale=960:-2', out]
      let ran = { exitCode: 1, stderr: '' }
      if (job.kind === 'image') ran = await hostProcessRun($, ['sips', '-s', 'format', 'png', job.path, '--out', out], { cwd: home, timeoutMs: PICTURE_TIMEOUT_MS }).catch(() => ran)
      if (ran.exitCode !== 0) ran = await hostProcessRun($, viaFfmpeg, { cwd: home, timeoutMs: PICTURE_TIMEOUT_MS }).catch((error) => ({ exitCode: 1, stderr: messageOf(error) }))
      if (ran.exitCode !== 0) throw new Error(String(ran.stderr || ran.stdout || 'ffmpeg failed').trim().slice(0, 200))
      await lockDown($, dir, '700')
    }
    state.answerPics[job.key] = { status: 'ready', file: out, size: await sizeOf($, out) }
  } catch (error) {
    state.answerPics[job.key] = { status: 'error', message: messageOf(error).slice(0, 200) }
    modLog($, 'answer ' + job.kind + ' preview failed for ' + job.path + ': ' + messageOf(error).slice(0, 200))
  }
}

async function pumpPictures($) {
  if (fileQueue.busy) return
  fileQueue.busy = true
  try {
    while (fileQueue.jobs.length) {
      await preparePicture($, fileQueue.jobs.shift())
      bumpPictures($)
    }
  } finally {
    fileQueue.busy = false
  }
}

export async function loadAnswerPictures($) {
  state.answerPicturesOff = (await hostStoreGet($, 'answerPicturesOff').catch(() => false)) === true
}

export async function toggleAnswerPictures($) {
  state.answerPicturesOff = !state.answerPicturesOff
  await hostStoreSet($, 'answerPicturesOff', state.answerPicturesOff).catch(() => {})
  bumpPictures($)
}

export async function answerPicturesPrompt($, e, next) {
  const result = await next(e)
  const surfaces = e.surfaces || []
  if (state.disabled || state.answerPicturesOff || surfaces[0] !== 'terminal' || (e.traits || []).includes('print')) return result
  return { ...result, sections: [...result.sections, { id: 'syafiqkit:answer-pictures', text: ANSWER_PICTURES_PROMPT, scope: 'session' }] }
}

function wantFilePictures($, items) {
  for (const item of items) {
    const known = state.answerPics[item.key]
    if (known && known.status === 'missing' && Date.now() - known.at > ANSWER_MISSING_RETRY_MS) delete state.answerPics[item.key]
    enqueue(fileQueue, state.answerPics, item.key, item)
  }
  pumpPictures($)
}

export async function answerPicturesView($, e, next) {
  const drawn = await next(e)
  if (e.surface !== 'terminal') return drawn
  await read($, picturesTick)
  try {
    return await withPictures($, e, drawn)
  } catch (error) {
    modLog($, 'answer pictures failed: ' + messageOf(error).slice(0, 200))
    return drawn
  }
}

async function withPictures($, e, drawn) {
  if (state.disabled || state.answerPicturesOff) return drawn
  const props = e.props || {}
  if (props.isSummary || typeof props.text !== 'string' || !props.text.trim()) return drawn
  if (!drawn || hasImage(drawn)) return drawn
  const found = findPictures(props.text)
  if (!found.length) return drawn
  const { Box, Text, Button, Image } = hostUiResolve($, e)
  if (!Image) return drawn

  const cwd = state.cwd || (await hostSessionCwd($).catch(() => '')) || ''
  const home = (await homeOf($)) || ''
  const columns = Math.max(20, ((e.viewport && e.viewport.columns) || 100) - 4)
  const mathColumns = Math.min(columns, ANSWER_MATH_COLUMNS)
  const math = found.filter((item) => item.kind === 'math').map((item) => item.source)
  const files = found
    .filter((item) => item.kind === 'image' || item.kind === 'video')
    .slice(0, ANSWER_FILE_CAP)
    .map((item) => {
      const path = resolvePath(item.path, cwd, home)
      return { kind: item.kind, path, key: hashOf(item.kind + ':' + path) }
    })
  if (found.some((item) => item.kind === 'mermaid')) wantDiagrams($, props.text)
  if (math.length) wantTypeset($, math, mathColumns, cwd + '/answer').catch(() => {})
  if (files.length) wantFilePictures($, files)

  const items = []
  let fileAt = 0
  found.forEach((item, index) => {
    const key = 'ap-' + index
    if (item.kind === 'mermaid') {
      const diagram = state.diagrams[hashOf(item.source)]
      if (diagram && diagram.status === 'ready') {
        items.push(Image({ key, source: { png: diagram.png }, ...fitImage(diagram.size, columns), alt: 'Mermaid diagram' }))
      } else if (diagram && diagram.status === 'error') {
        items.push(Text({ key, dimColor: true, wrap: 'truncate-end', children: 'Diagram not drawn: ' + diagram.message }))
      } else {
        items.push(Text({ key, dimColor: true, children: '… drawing the diagram (the first one downloads a browser and can take a few minutes)' }))
      }
      return
    }
    if (item.kind === 'math') {
      const entry = state.look ? state.typeset[typesetKeyOf(item.source, mathColumns, state.look)] : null
      if (entry && entry.status === 'ready' && entry.pages[0]) {
        items.push(Image({ key, source: { file: entry.pages[0].file, format: 'png' }, ...typesetSize(entry.pages[0], mathColumns, state.look.cell), alt: item.source.slice(0, 200) }))
      }
      return
    }
    const target = files[fileAt]
    fileAt += 1
    if (!target) return
    const picture = state.answerPics[target.key]
    const name = target.path.split('/').pop()
    const open = Button({ key: key + '-open', label: item.kind === 'video' ? 'Open video ' + name : 'Open ' + name, onPress: () => openInViewer($, target.path) })
    const pathLine = Text({ key: key + '-path', dimColor: true, wrap: 'truncate-start', children: target.path })
    if (picture && picture.status === 'ready') {
      items.push(Box({ key, flexDirection: 'column', children: [Image({ key: key + '-img', source: { file: picture.file, format: 'png' }, ...fitImage(picture.size, columns), alt: name }), ...(item.kind === 'video' ? [open, pathLine] : [])] }))
    } else if (picture && picture.status === 'error' && item.kind === 'video') {
      items.push(Box({ key, flexDirection: 'column', children: [Text({ key: key + '-why', dimColor: true, children: 'No preview for ' + name + ' (needs ffmpeg)' }), open, pathLine] }))
    }
  })
  if (!items.length) return drawn
  return Box({ flexDirection: 'column', children: [drawn, ...items] })
}
