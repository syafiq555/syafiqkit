const systemOf = async ($) => {
  try {
    return ((await $.process.run(['uname'])).stdout || '').trim()
  } catch {
    return ''
  }
}

const clipboardCommand = async ($) => {
  const system = await systemOf($)
  if (system === 'Darwin') return ['pbcopy']
  if (system === 'Linux') return ['xclip', '-selection', 'clipboard']
  return ['clip']
}

const copyDocFile = async ($, path, name, surface) => {
  let text = ''
  try {
    text = await $.fs.read(path)
  } catch (error) {
    return $.ui.toast('Could not read ' + name + ': ' + messageOf(error).slice(0, 80))
  }
  try {
    const copied = await $.ui.copy({ text, ...(surface ? { surface } : {}) })
    if (copied && copied.isCopied) return $.ui.toast('Copied ' + name + ' to the clipboard.')
    if (copied && copied.reason === 'refused') return $.ui.toast('Copy was refused.')
  } catch {}
  try {
    const ran = await $.process.run(await clipboardCommand($), { stdin: text })
    if (ran.exitCode === 0) return $.ui.toast('Copied ' + name + ' to the clipboard.')
    $.ui.toast('Could not copy: ' + (ran.stderr || 'clipboard tool failed').trim().slice(0, 80))
  } catch (error) {
    $.ui.toast('Could not copy: ' + messageOf(error).slice(0, 80))
  }
}

const openInEditor = async ($, path) => {
  try {
    const ran = await $.process.run(await viewerCommand($, path))
    if (ran.exitCode !== 0) $.ui.toast('Could not open the doc: ' + (ran.stderr || 'no app opened it').trim().slice(0, 80))
  } catch (error) {
    $.ui.toast('Could not open the doc: ' + messageOf(error).slice(0, 80))
  }
}
