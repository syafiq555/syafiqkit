import { atom, read } from 'claude-code'
import { hostUiResolve } from '../core/api.js'
import { ANSWER_FILE_CAP } from '../core/constants.js'
import { messageOf } from '../core/format.js'
import { modLog } from '../core/log.js'
import { state } from '../core/state.js'
import { fitImage, hashOf } from '../docs/images.js'
import { wantFilePictures } from './pictures.js'

const picturesTick = atom({ plugin: 'syafiqkit', key: 'picturesTick' }, 0)

function readCallsOf(props) {
  if (Array.isArray(props.calls)) return props.isExpanded ? [] : props.calls
  return props.tool === 'Read' ? [props] : []
}

const contentPrints = new Map()

function contentPrint(call, file) {
  const base64 = file && typeof file.base64 === 'string' ? file.base64 : ''
  const id = (call.tool_use_id || '') + ':' + base64.length
  if (call.tool_use_id && contentPrints.has(id)) return contentPrints.get(id)
  const size = (file && file.dimensions) || {}
  const print = [file && file.originalSize, size.originalWidth, size.originalHeight, base64.length, hashOf(base64)].join('x')
  if (contentPrints.size > 200) contentPrints.clear()
  if (call.tool_use_id) contentPrints.set(id, print)
  return print
}

function readImageTargets(calls) {
  const targets = []
  for (const call of calls) {
    if (!call || call.tool !== 'Read' || call.isRunning || call.isErrored || call.isInterrupted) continue
    const output = call.output
    const path = call.input && call.input.file_path
    if (!output || output.type !== 'image' || typeof path !== 'string' || !path.startsWith('/')) continue
    const key = hashOf('read:' + path + ':' + contentPrint(call, output.file))
    const file = output.file || {}
    const bytes = typeof file.base64 === 'string' && file.base64 ? { base64: file.base64, media: file.type } : {}
    if (!targets.some((target) => target.key === key)) targets.push({ kind: 'image', path, key, snapshot: true, ...bytes })
  }
  return targets.slice(0, ANSWER_FILE_CAP)
}

async function withReadImages($, e, drawn) {
  if (!drawn) return drawn
  const targets = readImageTargets(readCallsOf(e.props || {}))
  if (!targets.length) return drawn
  await read($, picturesTick)
  const { Box, Image } = hostUiResolve($, e)
  if (!Image) return drawn
  wantFilePictures($, targets)
  const columns = Math.max(20, ((e.viewport && e.viewport.columns) || 100) - 4)
  const items = targets.flatMap((target, index) => {
    const picture = state.answerPics[target.key]
    if (!picture || picture.status !== 'ready') return []
    return [Image({ key: 'read-img-' + index, source: { file: picture.file, format: 'png' }, ...fitImage(picture.size, columns), alt: target.path.split('/').pop() })]
  })
  if (!items.length) return drawn
  return Box({ flexDirection: 'column', children: [drawn, ...items] })
}

export async function readPicturesView($, e, next) {
  const drawn = await next(e)
  if (e.surface !== 'terminal' || state.disabled) return drawn
  try {
    return await withReadImages($, e, drawn)
  } catch (error) {
    modLog($, 'read picture failed: ' + messageOf(error).slice(0, 200))
    return drawn
  }
}
