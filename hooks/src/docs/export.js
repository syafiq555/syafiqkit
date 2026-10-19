import { hostFsRead, hostProcessRun, hostUiCopy, hostUiToast } from '../core/api.js'
import { messageOf } from '../core/format.js'
import { viewerCommand } from './gallery.js'

export async function systemOf($) {
  try {
    return ((await hostProcessRun($, ['uname'])).stdout || '').trim()
  } catch {
    return ''
  }
}

export async function clipboardCommand($) {
  const system = await systemOf($)
  if (system === 'Darwin') return ['pbcopy']
  if (system === 'Linux') return ['xclip', '-selection', 'clipboard']
  return ['clip']
}

export async function copyDocFile($, path, name, surface) {
  let text = ''
  try {
    text = await hostFsRead($, path)
  } catch (error) {
    return hostUiToast($, 'Could not read ' + name + ': ' + messageOf(error).slice(0, 80))
  }
  try {
    const copied = await hostUiCopy($, { text, ...(surface ? { surface } : {}) })
    if (copied && copied.isCopied) return hostUiToast($, 'Copied ' + name + ' to the clipboard.')
    if (copied && copied.reason === 'refused') return hostUiToast($, 'Copy was refused.')
  } catch {}
  try {
    const ran = await hostProcessRun($, await clipboardCommand($), { stdin: text })
    if (ran.exitCode === 0) return hostUiToast($, 'Copied ' + name + ' to the clipboard.')
    hostUiToast($, 'Could not copy: ' + (ran.stderr || 'clipboard tool failed').trim().slice(0, 80))
  } catch (error) {
    hostUiToast($, 'Could not copy: ' + messageOf(error).slice(0, 80))
  }
}

export async function openInEditor($, path) {
  try {
    const ran = await hostProcessRun($, await viewerCommand($, path))
    if (ran.exitCode !== 0) hostUiToast($, 'Could not open the doc: ' + (ran.stderr || 'no app opened it').trim().slice(0, 80))
  } catch (error) {
    hostUiToast($, 'Could not open the doc: ' + messageOf(error).slice(0, 80))
  }
}
