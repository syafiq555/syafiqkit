const convert = async ($, job) => {
  try {
    const home = await homeOf($)
    if (!home) throw new Error('no home folder for the picture cache')
    const dir = home + '/.claude/doc-pane-cache'
    const mmd = dir + '/' + job.key + '.mmd'
    const png = dir + '/' + job.key + '.png'
    const rendered = dir + '/' + job.key + '.ok'
    if (!(await safeExists($, rendered))) {
      await $.fs.write(mmd, job.source)
      await lockDown($, dir, '700')
      const ran = await $.process.run(
        ['npx', '--yes', MERMAID_PACKAGE, '-i', mmd, '-o', png, '-s', '2', '-b', 'white'],
        { cwd: dir, timeoutMs: MERMAID_TIMEOUT_MS },
      )
      if (ran.exitCode !== 0) throw new Error((ran.stderr || ran.stdout || 'mermaid-cli failed').slice(-300))
      await $.fs.write(rendered, 'ok')
    }
    const { base64 } = await $.fs.read(png, { as: 'bytes' })
    if (!base64) throw new Error('could not read the rendered picture')
    if (base64.length > MAX_BASE64) throw new Error('rendered picture is over 2 MiB')
    state.diagrams[job.key] = { status: 'ready', png: base64, size: pngSize(base64) }
  } catch (error) {
    state.diagrams[job.key] = {
      status: 'error',
      message: messageOf(error).slice(0, 300),
    }
  }
}

const pump = async ($) => {
  if (busy) return
  busy = true
  while (queue.length) {
    await convert($, queue.shift())
    $.ui.invalidate('ui.render')
  }
  busy = false
}

const wantDiagrams = ($, text) => {
  for (const part of segments(text)) {
    if (part.kind !== 'mermaid') continue
    const key = hashOf(part.source)
    if (state.diagrams[key]) continue
    state.diagrams[key] = { status: 'rendering' }
    queue.push({ key, source: part.source })
  }
  pump($)
}
