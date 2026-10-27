import { expect, test } from 'claude-code/testing'

const PANE = {
  plugin: 'syafiqkit',
  component: 'Pane',
  requestId: 'doc-pane',
  viewport: { columns: 120, rows: 40 },
  props: {
    title: 'syafiqkit',
    isFocused: true,
    bodyColumns: 100,
    placement: 'inline',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

const BAND = {
  plugin: 'syafiqkit',
  component: 'AbovePrompt',
  requestId: 'band',
  viewport: { columns: 120, rows: 40 },
  props: {},
} as const

const stubSession = (on: any, sent: string[], opened: string[], names: string[] = [], skip: string[] = []) => {
  on('session.start', () => ({ cwd: '/work' }))
  on('command.register', (_$: any, e: any) => {
    names.push(e.name)
    return { value: undefined }
  })
  if (!skip.includes('session.cwd')) on('session.cwd', () => ({ value: '/work' }))
  if (!skip.includes('env.get')) on('env.get', () => ({ value: '/home/test' }))
  if (!skip.includes('fs.list')) on('fs.list', () => ({ value: [] }))
  if (!skip.includes('fs.exists')) on('fs.exists', () => ({ value: false }))
  on('clock.now', () => ({ value: 1_000_000 }))
  on('clock.sleep', () => ({ value: undefined }))
  if (!skip.includes('clock.every')) on('clock.every', () => ({ value: {} }))
  on('ui.open', (_$: any, e: any) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => ({ value: undefined }))
  if (!skip.includes('ui.toast')) on('ui.toast', () => ({ value: undefined }))
  on('prompt.submit', (_$: any, e: any) => {
    sent.push(e.text)
    return { text: e.text }
  })
}

const stubRender = (on: any) => on('ui.render', () => ({ type: 'Text', props: {}, children: ['drawn by Claude Code'] }))

const stubTree = (on: any, tree: Record<string, any[]>) => on('fs.list', (_$: any, e: any) => ({ value: tree[e.path] ?? [] }))

test('session start registers the menu and docs commands', async ($, on) => {
  const names: string[] = []
  stubSession(on, [], [], names)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(names).toEqual(['task-docs', 'sk', 'changes'])
})

test('the menu shows the version read from plugin.json at session start', async ($, on) => {
  const reads: string[] = []
  stubSession(on, [], [])
  stubRender(on)
  on('fs.read', (_$: any, e: any) => {
    reads.push(e.path)
    return { value: String(e.path).endsWith('/.claude-plugin/plugin.json') ? '{ "name": "syafiqkit", "version": "9.8.7" }' : '' }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(reads.some((path) => path.endsWith('/.claude-plugin/plugin.json'))).toBe(true)
  await $.command.run({ command: 'sk', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await ui.findAll({ type: 'Text', text: /syafiqkit mod v9\.8\.7/ })).length).toBe(1)
  await ui.unmount()
})

test('the band offers quiet tools and the wrap-up chips, with no Menu button', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ key: 'open-menu' })).toBeUndefined()
  const keys = { 'band-enhance': 'e', 'open-docs': 'd', 'open-changes': 'g', 'band-done': 'w', 'band-commit': 'c', 'band-push': 'p', 'band-ship': 's' }
  for (const [key, hotkey] of Object.entries(keys)) {
    const button = await ui.find({ key })
    expect(button?.props.plain).toBe(true)
    expect(button?.props.hotkey).toBe(hotkey)
  }
  expect((await ui.findAll({ type: 'Text', text: /^ › $/ })).length).toBe(3)
  expect((await ui.findAll({ type: 'Text', text: /keys go to the pane/ })).length).toBe(0)
  await ui.unmount()
  const desktop = await $.ui.mount({ ...BAND, surface: 'desktop' })
  expect((await desktop.findAll({ type: 'Text', text: /^ › $/ })).length).toBe(0)
  expect((await desktop.find({ key: 'band-ship' }))?.props.label).toBe('○ ship')
  await desktop.unmount()
})

test('the band stays beside an open pane, without hotkeys so the pane keeps its letters', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface })
    for (const key of ['band-enhance', 'open-docs', 'open-changes', 'band-commit', 'band-done', 'band-ship']) {
      const button = await ui.find({ key })
      expect(button).toBeDefined()
      expect(button?.props.hotkey).toBeUndefined()
    }
    expect((await ui.findAll({ type: 'Text', text: /keys go to the pane/ })).length).toBe(1)
    await ui.unmount()
  }
})

test('band presses beside an open pane switch the view in place, while a typed command still opens and focuses the pane', async ($, on) => {
  const opened: string[] = []
  stubSession(on, [], opened)
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })
  expect(opened.length).toBe(1)
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'open-docs' })
  await band.press({ key: 'open-changes' })
  await band.press({ key: 'open-docs' })
  expect(opened.length).toBe(1)
  await $.command.run({ command: 'task-docs', args: '' })
  expect(opened.length).toBe(2)
  await band.unmount()
})

test('the band hotkeys come back once the pane closes', async ($, on) => {
  stubSession(on, [], [])
  on('fs.stat', () => ({ value: { size: 100, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', () => ({ value: { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' } }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/a.png'] })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'open-images' })
  await band.unmount()
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'img-close' })
  await pane.unmount()
  const after = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await after.find({ key: 'open-docs' }))?.props.hotkey).toBe('d')
  await after.unmount()
})

test('the band yields to a survey, so a notice such as Heads up is never covered', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  for (const surface of ['terminal', 'desktop'] as const) {
    const ui = await $.ui.mount({ ...BAND, surface, props: { hasSurvey: true } })
    expect(await ui.find({ key: 'open-docs' })).toBeUndefined()
    await ui.unmount()
  }
})

test('closing the pane brings the band back: a redraw is asked for once the pane is closed, on both surfaces', async ($, on) => {
  const redraws: string[] = []
  stubSession(on, [], [])
  on('fs.stat', () => ({ value: { size: 100, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', () => ({ value: { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' } }))
  stubRender(on)
  on('ui.invalidate', (_$: any, e: any) => {
    redraws.push(String(e.event ?? e))
    return { value: undefined }
  })
  for (const surface of ['terminal', 'desktop'] as const) {
    await $.session.start({ surface, isInteractive: true, cwd: '/work' })
    await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/a.png'] })
    const band = await $.ui.mount({ ...BAND, surface })
    await band.press({ key: 'open-images' })
    const pane = await $.ui.mount({ ...PANE, surface })
    redraws.length = 0
    await pane.press({ key: 'img-close' })
    for (let waited = 0; waited < 50 && redraws.length === 0; waited += 1) await new Promise((resolve) => setTimeout(resolve, 10))
    expect(redraws.length).toBeGreaterThan(0)
    await pane.unmount()
    await band.unmount()
  }
})

test('the band sends commit and done in one press, and push only after the confirm', async ($, on) => {
  const sent: string[] = []
  const opened: string[] = []
  stubSession(on, sent, opened)
  stubRender(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'band-commit' })
  expect(sent).toEqual(['Use the commit skill to commit the staged changes.'])
  await ui.press({ key: 'band-done' })
  expect(sent[1]).toBe('Use the done skill to wrap up this session.')
  expect(opened).toEqual([])
  await ui.press({ key: 'band-push' })
  expect(sent.length).toBe(2)
  expect(opened).toEqual(['doc-pane'])
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'confirm-send' })
  expect(sent[2]).toContain('Push this branch')
  await pane.unmount()
  await ui.unmount()
})

const chipText = async (ui: any, pattern: RegExp) => (await ui.findAll({ type: 'Text', text: pattern })).length

test('the done chip turns green after a done turn and amber after a later edit', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  const fresh = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(fresh, /^○ done$/)).toBe(1)
  expect(await chipText(fresh, /^○ commit$/)).toBe(1)
  expect(await chipText(fresh, /^○ push$/)).toBe(1)
  await fresh.unmount()
  await $.prompt.submit({ text: '/syafiqkit:done' } as any)
  await $.turn.start({ turnId: 't1' } as any)
  const running = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(running, /^◌ done$/)).toBe(1)
  await running.unmount()
  await $.tool.call({ tool: 'Edit', file_path: '/work/tasks/a/current.md' } as any)
  await $.turn.complete({ turnId: 't1', answer: 'wrapped', durationMs: 5, isAborted: false, usage: null } as any)
  const done = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(done, /^✓ done$/)).toBe(1)
  await done.unmount()
  await $.tool.call({ tool: 'Write', file_path: '/work/src/a.js' } as any)
  const edited = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(edited, /^↻ done$/)).toBe(1)
  expect(await chipText(edited, /^○ commit$/)).toBe(1)
  await edited.unmount()
})

test('commit and push chips follow HEAD and the upstream, and an edit after push turns them amber', async ($, on) => {
  const git = { head: 'aaa', ahead: '2', upstream: true }
  stubSession(on, [], [])
  stubRender(on)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('config.list', () => ({ value: [] }))
  on('tool.call', () => ({ result: 'ok' }))
  on('process.run', (_$: any, e: any) => {
    const argv = e.argv ?? e.command ?? []
    if (argv.includes('rev-list')) return { value: git.upstream ? { exitCode: 0, stdout: git.ahead + '\n', stderr: '' } : { exitCode: 128, stdout: '', stderr: 'no upstream' } }
    if (argv.includes('--abbrev-ref')) return { value: { exitCode: 0, stdout: 'main\n', stderr: '' } }
    if (argv.includes('merge-base')) return { value: { exitCode: 0, stdout: '', stderr: '' } }
    if (argv.includes('--format=%ct')) return { value: { exitCode: 0, stdout: String(Math.floor(Date.now() / 1000) + 60) + '\n', stderr: '' } }
    if (argv.includes('HEAD') && argv.includes('rev-parse')) return { value: { exitCode: 0, stdout: git.head + '\n', stderr: '' } }
    if (argv.includes('--show-toplevel')) return { value: { exitCode: 0, stdout: '/work\n', stderr: '' } }
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const settle = () => new Promise((resolve) => setTimeout(resolve, 50))
  let turn = 0
  const poll = async () => {
    turn += 1
    await $.turn.start({ turnId: 't' + turn } as any)
    await $.turn.complete({ turnId: 't' + turn, answer: 'ok', durationMs: 5, isAborted: false, usage: null } as any)
  }
  await settle()
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "feat: x"' } as any)
  git.head = 'bbb'
  await poll()
  await settle()
  const committed = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(committed, /^✓ commit$/)).toBe(1)
  expect(await chipText(committed, /^○ push$/)).toBe(1)
  await committed.unmount()
  git.ahead = '0'
  await poll()
  await settle()
  const pushed = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(pushed, /^✓ push$/)).toBe(1)
  await pushed.unmount()
  await new Promise((resolve) => setTimeout(resolve, 5))
  await $.tool.call({ tool: 'Edit', file_path: '/work/src/a.js' } as any)
  const edited = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(edited, /^↻ commit$/)).toBe(1)
  expect(await chipText(edited, /^↻ push$/)).toBe(1)
  await edited.unmount()
})

test('a commit and push made by another session in the same checkout leave this session\'s chips grey', async ($, on) => {
  const git = { head: 'aaa', ahead: '0' }
  stubSession(on, [], [])
  stubRender(on)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('config.list', () => ({ value: [] }))
  on('tool.call', () => ({ result: 'ok' }))
  on('process.run', (_$: any, e: any) => {
    const argv = e.argv ?? e.command ?? []
    if (argv.includes('rev-list')) return { value: { exitCode: 0, stdout: git.ahead + '\n', stderr: '' } }
    if (argv.includes('--abbrev-ref')) return { value: { exitCode: 0, stdout: 'master\n', stderr: '' } }
    if (argv.includes('merge-base')) return { value: { exitCode: 0, stdout: '', stderr: '' } }
    if (argv.includes('--format=%ct')) return { value: { exitCode: 0, stdout: String(Math.floor(Date.now() / 1000) + 60) + '\n', stderr: '' } }
    if (argv.includes('HEAD') && argv.includes('rev-parse')) return { value: { exitCode: 0, stdout: git.head + '\n', stderr: '' } }
    if (argv.includes('--show-toplevel')) return { value: { exitCode: 0, stdout: '/work\n', stderr: '' } }
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const settle = () => new Promise((resolve) => setTimeout(resolve, 50))
  await settle()
  await $.turn.start({ turnId: 't1' } as any)
  await $.tool.call({ tool: 'Agent', description: 'Inventory a report' } as any)
  git.head = 'bbb'
  await $.turn.complete({ turnId: 't1', answer: 'Agents started.', durationMs: 5, isAborted: false, usage: null } as any)
  await settle()
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(band, /^○ commit$/)).toBe(1)
  expect(await chipText(band, /^○ push$/)).toBe(1)
  await band.unmount()
  await $.turn.start({ turnId: 't2' } as any)
  await $.tool.call({ tool: 'Bash', command: 'git commit -m "fix: ours"' } as any)
  git.head = 'ccc'
  git.ahead = '1'
  await $.turn.complete({ turnId: 't2', answer: 'Committed.', durationMs: 5, isAborted: false, usage: null } as any)
  await settle()
  const ours = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(ours, /^✓ commit$/)).toBe(1)
  await ours.unmount()
})

test('a done skill call marks the done chip running even without a band press', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.turn.start({ turnId: 't1' } as any)
  await $.tool.call({ tool: 'Skill', skill: 'syafiqkit:done' } as any)
  const running = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(running, /^◌ done$/)).toBe(1)
  await running.unmount()
  await $.tool.call({ tool: 'Bash', command: 'git push origin main' } as any)
  const pushing = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(pushing, /^◌ push$/)).toBe(1)
  await pushing.unmount()
  await $.turn.complete({ turnId: 't1', answer: 'wrapped', durationMs: 5, isAborted: false, usage: null } as any)
  const done = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(done, /^✓ done$/)).toBe(1)
  await done.unmount()
})

test('done stays running while its background agents work, and their edits do not turn it amber', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.turn.start({ turnId: 't1' } as any)
  await $.tool.call({ tool: 'Skill', skill: 'done' } as any)
  await $.turn.start({ turnId: 'a1', agentId: 'simplifier' } as any)
  await $.turn.complete({ turnId: 't1', answer: 'Agents are running.', durationMs: 5, isAborted: false, usage: null } as any)
  await $.tool.call({ tool: 'Edit', file_path: '/work/src/a.js', agentId: 'simplifier' } as any)
  const waiting = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(waiting, /^◌ done$/)).toBe(1)
  await waiting.unmount()
  await $.turn.complete({ turnId: 'a1', agentId: 'simplifier', answer: 'simplified', durationMs: 5, isAborted: false, usage: null } as any)
  await $.turn.start({ turnId: 't2' } as any)
  await $.tool.call({ tool: 'Edit', file_path: '/work/tasks/a/current.md' } as any)
  await $.turn.complete({ turnId: 't2', answer: 'Wrapped up.', durationMs: 5, isAborted: false, usage: null } as any)
  const done = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(done, /^✓ done$/)).toBe(1)
  await done.unmount()
})

test('an unrelated prompt does not clear a running chip', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  await $.prompt.submit({ text: '/done' } as any)
  await $.prompt.submit({ text: 'also check the tests' } as any)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(ui, /^◌ done$/)).toBe(1)
  await ui.unmount()
})

test('the push chip asks before pushing', async ($, on) => {
  const sent: string[] = []
  const opened: string[] = []
  stubSession(on, sent, opened)
  stubRender(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect((await ui.find({ key: 'band-push' }))?.props.hotkey).toBe('p')
  await ui.press({ key: 'band-push' })
  expect(sent.length).toBe(0)
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'confirm-send' })
  expect(sent).toEqual(['Push this branch to its remote, setting its upstream if it has none.'])
  await pane.unmount()
  await ui.unmount()
})

test('the ship chip asks first, runs with the ship skill, and turns amber after a later edit', async ($, on) => {
  const sent: string[] = []
  const opened: string[] = []
  stubSession(on, sent, opened)
  stubRender(on)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(ui, /^○ ship$/)).toBe(1)
  expect((await ui.find({ key: 'band-ship' }))?.props.hotkey).toBe('s')
  await ui.press({ key: 'band-ship' })
  expect(sent.length).toBe(0)
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'confirm-send' })
  expect(sent).toEqual(['Use the ship skill.'])
  await pane.unmount()
  await ui.unmount()
  await $.turn.start({ turnId: 't1' } as any)
  await $.tool.call({ tool: 'Skill', skill: 'syafiqkit:ship' } as any)
  const running = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(running, /^◌ ship$/)).toBe(1)
  await running.unmount()
  await $.turn.complete({ turnId: 't1', answer: 'Shipped.', durationMs: 5, isAborted: false, usage: null } as any)
  const shipped = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(shipped, /^✓ ship$/)).toBe(1)
  await shipped.unmount()
  await new Promise((resolve) => setTimeout(resolve, 5))
  await $.tool.call({ tool: 'Edit', file_path: '/work/src/a.js' } as any)
  const edited = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(edited, /^↻ ship$/)).toBe(1)
  await edited.unmount()
})

test('the ship chip stays running while a background check is open, and turns green on the turn that confirms', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.turn.start({ turnId: 't1' } as any)
  await $.tool.call({ tool: 'Skill', skill: 'ship' } as any)
  await $.tool.call({ tool: 'Bash', command: 'gh run watch', run_in_background: true } as any)
  await $.turn.complete({ turnId: 't1', answer: 'CI is running.', durationMs: 5, isAborted: false, usage: null } as any)
  const waiting = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(waiting, /^◌ ship$/)).toBe(1)
  await waiting.unmount()
  await $.turn.start({ turnId: 't2' } as any)
  await $.turn.complete({ turnId: 't2', answer: 'Deployed and live.', durationMs: 5, isAborted: false, usage: null } as any)
  const shipped = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(shipped, /^✓ ship$/)).toBe(1)
  await shipped.unmount()
})

test('a ship that asks a question while its background check runs stays blue until a later turn finishes', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.turn.start({ turnId: 't1' } as any)
  await $.tool.call({ tool: 'Skill', skill: 'ship' } as any)
  await $.tool.call({ tool: 'Bash', command: 'gh run watch', run_in_background: true } as any)
  await $.turn.complete({ turnId: 't1', answer: 'CI is running. Post the release note to Chat?', durationMs: 5, isAborted: false, usage: null } as any)
  await $.turn.start({ turnId: 't2' } as any)
  await $.turn.complete({ turnId: 't2', answer: 'Noted, CI still running.', durationMs: 5, isAborted: false, usage: null } as any)
  const waiting = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(waiting, /^◌ ship$/)).toBe(1)
  await waiting.unmount()
  await $.turn.start({ turnId: 't3' } as any)
  await $.turn.complete({ turnId: 't3', answer: 'Deployed and live.', durationMs: 5, isAborted: false, usage: null } as any)
  const shipped = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(shipped, /^✓ ship$/)).toBe(1)
  await shipped.unmount()
})

test('a refused toast does not stop the session from starting', async ($, on) => {
  const names: string[] = []
  stubSession(on, [], [], names, ['ui.toast'])
  stubRender(on)
  on('ui.toast', () => {
    throw new Error('toasts are not allowed here')
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(names.length).toBeGreaterThan(0)
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await band.find({ key: 'band-ship' })).toBeDefined()
  await band.unmount()
})

test('the moved-buttons notice shows once, then never again', async ($, on) => {
  const toasts: string[] = []
  const stored: Record<string, unknown> = {}
  stubSession(on, [], [], [], ['ui.toast'])
  stubRender(on)
  on('ui.toast', (_$: any, e: any) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  on('store.get', (_$: any, e: any) => ({ value: stored[e.key] }))
  on('store.set', (_$: any, e: any) => {
    stored[e.key] = e.value
    return { value: undefined }
  })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(toasts.filter((text) => text.includes('/sk'))).toEqual(['The menu moved off the line: type /sk'])
})

test('a commit-and-push skill call leaves the ship chip alone', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('tool.call', () => ({ result: 'ok' }))
  await $.turn.start({ turnId: 't1' } as any)
  await $.tool.call({ tool: 'Skill', skill: 'syafiqkit:commit', args: 'push' } as any)
  const running = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await chipText(running, /^◌ push$/)).toBe(1)
  expect(await chipText(running, /^○ ship$/)).toBe(1)
  await running.unmount()
})

test('after sending items the docs button returns to that doc, not the list', async ($, on) => {
  const sent: string[] = []
  stubSession(on, sent, [], [], ['fs.list'])
  stubTree(on, {
    '/work/tasks': [{ name: 'a', kind: 'directory', size: 0, mtimeMs: 999_000, isLink: false }],
    '/work/tasks/a': [{ name: 'current.md', kind: 'file', size: 60, mtimeMs: 999_000, isLink: false }],
  })
  on('fs.read', () => ({ value: '# T\n- [ ] one\n- [ ] two' }))
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })
  const first = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await first.press({ key: 'r0b' })
  await first.press({ key: 'o0' })
  await first.press({ key: 'send' })
  expect(sent.length).toBe(1)
  expect(sent[0]).toContain('/syafiqkit:read-summary')
  await first.unmount()

  await $.command.run({ command: 'task-docs', args: '' })
  const again = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await again.find({ key: 'back' })).toBeDefined()
  expect(await again.find({ key: 'r0b' })).toBeUndefined()
  await again.unmount()
})

test('a long open item is cut into rows no wider than the pane on the terminal, and pressing any row selects it', async ($, on) => {
  const sent: string[] = []
  stubSession(on, sent, [], [], ['fs.list'])
  stubTree(on, {
    '/work/tasks': [dirEntry('a')],
    '/work/tasks/a': [fileEntry('current.md', 600)],
  })
  const long = '🟡 Ask the client: who at HQ chases a quiet master outlet or an unconfirmed receipt (HQ can now act for a dealer that has not paid in two days), and what happens to the units held meanwhile?'
  const huge = [long, long, long].join(' ')
  on('fs.read', () => ({ value: '# T\n- [ ] short one\n- [ ] ' + long + '\n- [ ] ' + huge }))
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })

  const terminal = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await terminal.press({ key: 'r0b' })
  const gutters = async (ui: any, glyph: RegExp) => (await ui.findAll({ type: 'Text', text: glyph })).length
  const more = /more lines? *$/
  expect(await gutters(terminal, /^[┃╹]$/)).toBe(0)
  expect((await terminal.findAll({ type: 'Text', text: more })).length).toBe(1)
  expect(await terminal.find({ key: 'o1.1' })).toBeDefined()
  await terminal.press({ key: 'o1.1' })
  expect((await terminal.find({ key: 'send' }))?.props.label).toBe('Read-summary, then do 1 selected')
  expect(await gutters(terminal, /^[┃╹]$/)).toBe(2)
  expect(await gutters(terminal, /^╹$/)).toBe(1)
  await terminal.press({ key: 'o2.3' })
  expect((await terminal.findAll({ type: 'Text', text: more })).length).toBe(0)
  expect((await terminal.find({ key: 'send' }))?.props.label).toBe('Read-summary, then do 1 selected')
  expect((await terminal.find({ key: 'expand' }))?.props.label).toBe('Collapse long')
  await terminal.unmount()

  await $.command.run({ command: 'task-docs', args: '' })
  const desktop = await $.ui.mount({ ...PANE, surface: 'desktop' })
  if (await desktop.find({ key: 'r0b' })) await desktop.press({ key: 'r0b' })
  expect((await desktop.find({ key: 'o1' }))?.props.label).toContain(long)
  expect(await desktop.find({ key: 'o1.1' })).toBeUndefined()
  await desktop.unmount()
})

test('the terminal doc list draws a text gauge only for docs near or over their limit', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  stubTree(on, {
    '/work/tasks': [dirEntry('a'), dirEntry('b')],
    '/work/tasks/a': [fileEntry('current.md', 600)],
    '/work/tasks/b': [fileEntry('current.md', 9000)],
  })
  on('fs.read', () => ({ value: '# T\n- [ ] one' + '\nline'.repeat(260) }))
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const gauges = await ui.findAll({ type: 'Text', text: /^[█░]{6}$/ })
  expect(gauges.length).toBeGreaterThan(0)
  expect(gauges.length).toBe((await ui.findAll({ type: 'Text', text: /262\/300/ })).length)
  expect(await ui.find({ type: 'Text', text: /0\.6 KB/ })).toBeDefined()
  await ui.unmount()
})

test('companion rows drop the shared CLAUDE- prefix and keep the end of a long name', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  stubTree(on, {
    '/work/.claude-companions/shared': [fileEntry('CLAUDE-frontend-troubleshooting-gotchas.md', 500)],
  })
  on('fs.read', () => ({ value: '# T' }))
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ text: /CLAUDE-frontend/ })).toBeUndefined()
  expect(await ui.find({ text: /frontend-tr…ting-gotchas/ })).toBeDefined()
  await ui.unmount()
})

test('a companion section puts files over or near the limit first, and one over on bytes alone still gets a bar', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  stubTree(on, {
    '/work/.claude-companions/local': [fileEntry('aaa-small.md', 500), fileEntry('zzz-heavy.md', 45000)],
  })
  on('fs.read', () => ({ value: '# T\nline' }))
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  const names = (await ui.findAll({ type: 'Button', text: /aaa-small|zzz-heavy/ })).map((node: any) => String(node.props.label))
  expect(names[0]).toContain('zzz-heavy')
  expect((await ui.findAll({ type: 'Text', text: /^[█░]{6}$/ })).length).toBeGreaterThan(0)
  await ui.unmount()
  const search = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await search.input({ key: 'filter', text: 'small' })
  expect(await search.find({ text: /local project companion/ })).toBeDefined()
  await search.unmount()
})

test('SYAFIQKIT_MOD=0 turns the mod off: no commands and no band', async ($, on) => {
  const names: string[] = []
  stubSession(on, [], [], names, ['env.get'])
  on('env.get', (_$: any, e: any) => ({ value: e.name === 'SYAFIQKIT_MOD' ? '0' : '/home/test' }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(names).toEqual([])
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ key: 'open-menu' })).toBeUndefined()
  await ui.unmount()
})

test('the reader folds a doc\'s decisions in on demand, and the list shows only current.md', async ($, on) => {
  const reads: string[] = []
  stubSession(on, [], [], [], ['fs.list'])
  const dir = { size: 0, mtimeMs: 999_000, isLink: false }
  stubTree(on, {
    '/work/tasks': [{ name: 'a', kind: 'directory', ...dir }],
    '/work/tasks/a': [
      { name: 'current.md', kind: 'file', size: 60, mtimeMs: 999_000, isLink: false },
      { name: 'decisions', kind: 'directory', ...dir },
    ],
    '/work/tasks/a/decisions': [
      { name: 'x.md', kind: 'file', size: 40, mtimeMs: 999_000, isLink: false },
      { name: 'y.md', kind: 'file', size: 30, mtimeMs: 999_000, isLink: false },
    ],
  })
  on('fs.read', (_$: any, e: any) => {
    reads.push(e.path)
    if (e.path.endsWith('x.md')) return { value: '# X\nBecause.' }
    if (e.path.endsWith('y.md')) return { value: '# Y\nAlso because.' }
    return { value: '# T\n- [ ] one' }
  })
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'task-docs', args: '' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'r0b' })).toBeDefined()
  expect(await ui.find({ key: 'r1b' })).toBeUndefined()
  await ui.press({ key: 'r0b' })
  expect(await ui.find({ key: 'decisions-toggle' })).toBeDefined()
  expect(reads).not.toContain('/work/tasks/a/decisions/x.md')
  await ui.press({ key: 'decisions-toggle' })
  expect(reads).not.toContain('/work/tasks/a/decisions/x.md')
  await ui.press({ key: 'dec0' })
  expect(reads).toContain('/work/tasks/a/decisions/x.md')
  expect(reads).not.toContain('/work/tasks/a/decisions/y.md')
  expect(await ui.find({ key: 'dec-back' })).toBeDefined()
  expect(await ui.find({ key: 'dec-prev' })).toBeUndefined()
  await ui.press({ key: 'dec-next' })
  expect(reads).toContain('/work/tasks/a/decisions/y.md')
  expect(await ui.find({ key: 'dec-next' })).toBeUndefined()
  await ui.press({ key: 'dec-back' })
  expect(await ui.find({ key: 'decisions-toggle' })).toBeDefined()
  await ui.unmount()
})

const fileEntry = (name: string, size: number) => ({ name, kind: 'file', size, mtimeMs: 999_000, isLink: false })
const dirEntry = (name: string) => ({ name, kind: 'directory', size: 0, mtimeMs: 999_000, isLink: false })

const stubTaskDoc = async ($: any, on: any, sent: string[], doc: string, currentSize: number, decisions: any[], read: string) => {
  stubSession(on, sent, [], [], ['fs.list'])
  stubTree(on, {
    '/work/tasks': [dirEntry(doc)],
    ['/work/tasks/' + doc]: [fileEntry('current.md', currentSize), dirEntry('decisions')],
    ['/work/tasks/' + doc + '/decisions']: decisions,
  })
  on('fs.read', () => ({ value: read }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
}

const openBigDecision = async ($: any, on: any, sent: string[]) => {
  await stubTaskDoc($, on, sent, 'a', 60, [fileEntry('plan.md', 47_000)], '# Plan\nBecause.')
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'r0b' })
  await ui.press({ key: 'decisions-toggle' })
  await ui.press({ key: 'dec0' })
  return ui
}

test('a short task doc with a decisions file over 40 KB is listed for shrinking, and Shrink asks task-summary to judge condense, split or a better shape', async ($, on) => {
  const sent: string[] = []
  await stubTaskDoc(
    $,
    on,
    sent,
    'brs',
    2000,
    [fileEntry('requirements.md', 185_000), fileEntry('small.md', 9_000)],
    '# T\n- [ ] one',
  )
  await $.command.run({ command: 'sk', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'vb5' })
  expect(await ui.find({ key: 'y0b' })).toBeDefined()
  await ui.press({ key: 'y0b' })
  expect(sent.length).toBe(1)
  expect(sent[0]).toContain('decisions/requirements.md')
  expect(sent[0]).not.toContain('small.md')
  expect(sent[0]).toContain('Use the task-summary skill')
  expect(sent[0]).toContain('propose it before changing anything')
  await ui.unmount()
})

test('a decisions page offers Split, which sends in one press and names that one file', async ($, on) => {
  const sent: string[] = []
  const ui = await openBigDecision($, on, sent)
  expect(await ui.find({ key: 'dec-split' })).toBeDefined()
  await ui.press({ key: 'dec-split' })
  expect(sent.length).toBe(1)
  expect(sent[0]).toContain('split decisions/plan.md')
  expect(sent[0]).toContain('Use the haiku skill')
  expect(sent[0]).toContain('/work/tasks/a/decisions/plan.md')
  expect(sent[0]).toContain('Only this file is in scope')
  await ui.unmount()
})

test('sending Split brings the doc back on the next Docs press', async ($, on) => {
  const sent: string[] = []
  const ui = await openBigDecision($, on, sent)
  await ui.press({ key: 'dec-split' })
  expect(sent.length).toBe(1)
  await ui.unmount()
  await $.command.run({ command: 'task-docs', args: '' })
  const again = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await again.find({ key: 'decisions-toggle' })).toBeDefined()
  await again.unmount()
})

test('Copy puts the decision and the doc on the clipboard, falling back to pbcopy where the surface cannot copy', async ($, on) => {
  const copied: string[] = []
  const runs: any[] = []
  let surfaceCopies = true
  on('ui.copy', (_$: any, e: any) => {
    copied.push(e.text)
    return { value: surfaceCopies ? { isCopied: true } : { isCopied: false, reason: 'remote' } }
  })
  on('process.run', (_$: any, e: any) => {
    runs.push(e)
    return { value: { exitCode: 0, stdout: e.argv[0] === 'uname' ? 'Darwin\n' : '', stderr: '' } }
  })
  const ui = await openBigDecision($, on, [])
  runs.length = 0
  await ui.press({ key: 'dec-copy' })
  expect(copied).toEqual(['# Plan\nBecause.'])
  expect(runs.filter((run) => run.argv[0] !== 'git')).toEqual([])
  surfaceCopies = false
  await ui.press({ key: 'dec-back' })
  await ui.press({ key: 'copy' })
  const pbcopy = runs.find((run) => run.argv[0] === 'pbcopy')
  expect(pbcopy.init.stdin).toBe('# Plan\nBecause.')
  await ui.press({ key: 'open' })
  expect(runs.some((run) => run.argv[0] === 'open' && run.argv[1] === '/work/tasks/a/current.md')).toBe(true)
  await ui.unmount()
})

test('Copy takes the file as written, not the reader\'s reshaped text, and a refused copy is not retried', async ($, on) => {
  const raw = '<!-- note -->\n# Plan\n\n| a | b |\n|---|---|\n| 1 | 2 |\n'
  const copied: string[] = []
  const runs: any[] = []
  on('ui.copy', (_$: any, e: any) => {
    copied.push(e.text)
    return { value: copied.length === 1 ? { isCopied: true } : { isCopied: false, reason: 'refused' } }
  })
  on('process.run', (_$: any, e: any) => {
    runs.push(e)
    return { value: { exitCode: 0, stdout: '', stderr: '' } }
  })
  const sent: string[] = []
  await stubTaskDoc($, on, sent, 'a', 60, [fileEntry('plan.md', 47_000)], raw)
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'r0b' })
  await ui.press({ key: 'decisions-toggle' })
  await ui.press({ key: 'dec0' })
  runs.length = 0
  await ui.press({ key: 'dec-copy' })
  expect(copied[0]).toBe(raw)
  await ui.press({ key: 'dec-copy' })
  expect(copied.length).toBe(2)
  expect(runs.some((run) => run.argv[0] === 'pbcopy' || run.argv[0] === 'xclip' || run.argv[0] === 'clip')).toBe(false)
  await ui.unmount()
})

test('a decisions page offers Condense, which sends in one press and condenses that one file on haiku', async ($, on) => {
  const sent: string[] = []
  const ui = await openBigDecision($, on, sent)
  await ui.press({ key: 'dec-condense' })
  expect(sent.length).toBe(1)
  expect(sent[0]).toContain('condense decisions/plan.md')
  expect(sent[0]).toContain('Use the haiku skill')
  expect(sent[0]).toContain('split it if it is over 40 KB')
  expect(sent[0]).toContain('changed the meaning of')
  await ui.unmount()
})

test('the docs list keeps a recent task doc in its folder too: folders are headers, a heavy doc is flagged in its folder, a folder collapses', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  const doc = (name: string, size: number, mtimeMs: number) => ({ name, entry: { name: 'current.md', kind: 'file', size, mtimeMs, isLink: false } })
  const docs: Record<string, ReturnType<typeof doc>[]> = {
    tenant: [doc('a', 60, 999_000), doc('b', 60, 996_000), doc('c', 60, 995_000), doc('d', 9_000, 1_000)],
    auth: [doc('e', 60, 998_000), doc('f', 60, 997_000), doc('g', 60, 2_000)],
  }
  const tree: Record<string, any[]> = { '/work/tasks': Object.keys(docs).map(dirEntry) }
  Object.entries(docs).forEach(([folder, list]) => {
    tree['/work/tasks/' + folder] = list.map((item) => dirEntry(item.name))
    list.forEach((item) => (tree['/work/tasks/' + folder + '/' + item.name] = [item.entry]))
  })
  stubTree(on, tree)
  on('fs.read', () => ({ value: '# T\n' + '\n'.repeat(400) }))
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'r0b' })).toBeDefined()
  expect(await ui.find({ key: 'd0b' })).toBeDefined()
  expect(await ui.find({ key: 'd3b' })).toBeDefined()
  expect(await ui.find({ key: 'd6b' })).toBeDefined()
  expect(await ui.find({ key: 'fold-tenant' })).toBeDefined()
  expect(await ui.find({ key: 'fold-auth' })).toBeDefined()
  expect(await ui.find({ key: 'show-heavy' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /NEEDS SHRINKING/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /⚠ 402 lines/ })).toBeDefined()
  await ui.press({ key: 'fold-tenant' })
  expect(await ui.find({ key: 'd3b' })).toBeUndefined()
  expect(await ui.find({ key: 'd6b' })).toBeDefined()
  await ui.press({ key: 'fold-tenant' })
  expect(await ui.find({ key: 'd3b' })).toBeDefined()
  await ui.unmount()
})

test('on Desktop a docs list of 110 task docs opens with folders and skills folded, stays drawable, and a folder still opens', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  const folders = Array.from({ length: 21 }, (_, index) => 'area' + index)
  const tree: Record<string, any[]> = { '/work/tasks': folders.map(dirEntry) }
  folders.forEach((folder, index) => {
    const names = Array.from({ length: index < 5 ? 10 : 4 }, (_, n) => folder + '-doc' + n)
    tree['/work/tasks/' + folder] = names.map(dirEntry)
    names.forEach((name) => (tree['/work/tasks/' + folder + '/' + name] = [fileEntry('current.md', 60)]))
  })
  stubTree(on, tree)
  on('fs.read', () => ({ value: '# T\n' }))
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...DESKTOP_PANE, surface: 'desktop' })
  expect(await ui.find({ key: 'fold-area0' })).toBeDefined()
  expect(await ui.find({ key: 'fold-area20' })).toBeDefined()
  expect(JSON.stringify(await ui.drawn()).length).toBeLessThan(95_000)
  const shown = async () => (JSON.stringify(await ui.drawn()).match(/area0-doc\d/g) || []).length
  const before = await shown()
  await ui.press({ key: 'fold-area0b' })
  expect(await shown()).toBeGreaterThanOrEqual(before + 10)
  await ui.unmount()
})

test('a doc whose Domain line says (hub is its folder main doc, marked in the folder and in Changed lately; a "detail hub" doc is not', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  const doc = (name: string, mtimeMs: number) => ({ name, entry: { name: 'current.md', kind: 'file', size: 60, mtimeMs, isLink: false } })
  const list = [doc('back-office', 1_000), doc('delivery', 999_000), doc('pos', 2_000)]
  const tree: Record<string, any[]> = { '/work/tasks': [dirEntry('crp45')], '/work/tasks/crp45': list.map((item) => dirEntry(item.name)) }
  list.forEach((item) => (tree['/work/tasks/crp45/' + item.name] = [item.entry]))
  stubTree(on, tree)
  on('fs.read', (_$: any, e: any) => ({
    value: e.path.includes('/delivery/') ? '<!--\nDomain: crp45 / delivery (hub: phases)\n-->\n' : '<!--\nDomain: crp45 (detail hub UX)\n-->\n',
  }))
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'fold-crp45', text: /main: delivery/ })).toBeDefined()
  expect(await ui.find({ key: 'd1', text: /main doc/ })).toBeDefined()
  expect(await ui.find({ key: 'r1', text: /main doc/ })).toBeDefined()
  expect(await ui.find({ key: 'd0', text: /main doc/ })).toBeUndefined()
  expect(await ui.find({ key: 'd2', text: /main doc/ })).toBeUndefined()
  await ui.unmount()

  const desktop = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await desktop.find({ key: 'd1', text: /main doc/ })).toBeDefined()
  expect(await desktop.find({ key: 'd2', text: /main doc/ })).toBeUndefined()
  await desktop.unmount()
})

test('CLAUDE.md files are named by scope and a file reached by two routes is listed once', async ($, on) => {
  stubSession(on, [], [], [], ['session.cwd', 'fs.exists'])
  on('session.cwd', () => ({ value: '/home/test/.claude/p' }))
  const present = new Set(['/home/test/.claude/p/CLAUDE.md', '/home/test/.claude/CLAUDE.md'])
  on('fs.exists', (_$: any, e: any) => ({ value: present.has(e.path) }))
  on('fs.stat', () => ({ value: { kind: 'file', size: 100, mtimeMs: 999_000, isLink: false } }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/home/test/.claude/p' })
  await $.command.run({ command: 'task-docs', args: '' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'd0b' })).toBeDefined()
  expect(await ui.find({ key: 'd1b' })).toBeDefined()
  expect(await ui.find({ key: 'd2b' })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /this project/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /your global/ })).toBeDefined()
  await ui.unmount()
})

test('the CLAUDE.md chain lists nested files and companions, skips vendored folders, and holds companions to the same limit', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  const dir = { size: 0, mtimeMs: 999_000, isLink: false }
  const file = (name: string, size: number) => ({ name, kind: 'file', size, mtimeMs: 999_000, isLink: false })
  stubTree(on, {
    '/work': [
      { name: 'api', kind: 'directory', ...dir },
      { name: 'node_modules', kind: 'directory', ...dir },
    ],
    '/work/api': [file('CLAUDE.md', 100)],
    '/work/node_modules': [file('CLAUDE.md', 100)],
    '/home/test/.claude/.claude-companions/shared': [file('CLAUDE-shell-gotchas.md', 9000), file('notes.txt', 10)],
    '/work/.claude-companions/local': [file('ops-runbook.md', 500)],
  })
  on('fs.read', () => ({ value: '\n'.repeat(299) }))
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'fold-Nested · load when touched', text: /Nested · load when touched \(1\)/ })).toBeDefined()
  expect(await ui.find({ key: 'fold-Global companions · on demand', text: /Global companions · on demand \(1\)/ })).toBeDefined()
  expect(await ui.find({ key: 'fold-Project companions · on demand' })).toBeUndefined()
  expect(await ui.find({ key: 'fold-Project local companions · this machine only', text: /Project local companions · this machine only \(1\)/ })).toBeDefined()
  expect(await ui.find({ text: /ops-runbook/ })).toBeDefined()
  expect(await ui.find({ text: /api\/CLAUDE\.md/ })).toBeDefined()
  expect(await ui.find({ text: /node_modules/ })).toBeUndefined()
  expect(await ui.find({ text: /notes\.txt/ })).toBeUndefined()
  expect(await ui.find({ type: 'Text', text: /300 lines/ })).toBeDefined()
  await ui.unmount()

  const desktop = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await desktop.find({ text: /Nested · load when touched/ })).toBeDefined()
  expect(await desktop.find({ text: /api\/CLAUDE\.md/ })).toBeDefined()
  expect(await desktop.find({ text: /nested: api/ })).toBeUndefined()
  expect(await desktop.find({ text: /300\/200/ })).toBeDefined()
  await desktop.unmount()
})

test('a safe menu verb sends its prompt and a risky one asks first', async ($, on) => {
  const sent: string[] = []
  const opened: string[] = []
  stubSession(on, sent, opened)
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'sk', args: '' })
  expect(opened).toEqual(['doc-pane'])

  const menu = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await menu.press({ key: 'vb0' })
  expect(sent).toEqual(['Use the commit skill to commit the staged changes.'])
  await menu.unmount()

  await $.command.run({ command: 'sk', args: '' })
  const again = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await again.press({ key: 'vb1' })
  expect(sent.length).toBe(1)
  await again.press({ key: 'confirm-send' })
  expect(sent[1]).toBe('Use the commit skill to commit the staged changes, and push.')
  await again.unmount()
})

test('the docs list shows the plugin skills, each opening its SKILL.md', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  on('fs.list', (_$: any, e: any) => ({
    value: e.path.endsWith('/skills')
      ? [
          { name: 'uiux', kind: 'directory', size: 0, mtimeMs: 999_000, isLink: false },
          { name: '_shared', kind: 'directory', size: 0, mtimeMs: 999_000, isLink: false },
          { name: 'commit', kind: 'directory', size: 0, mtimeMs: 999_000, isLink: false },
        ]
      : [],
  }))
  on('fs.stat', () => ({ value: { kind: 'file', size: 100, mtimeMs: 999_000, isLink: false } }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'task-docs', args: '' })

  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ type: 'Text', text: /SYAFIQKIT SKILLS \(2\)/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /_shared/ })).toBeUndefined()
  expect(await ui.find({ key: 'd0b' })).toBeDefined()
  expect(await ui.find({ key: 'd1b' })).toBeDefined()
  await ui.unmount()
})

const DIFF_TEXT = [
  'diff --git a/a.md b/a.md',
  'index 1..2 100644',
  '--- a/a.md',
  '+++ b/a.md',
  '@@ -3,2 +3,2 @@',
  ' keep',
  '-old line',
  '+new line',
  '',
].join('\n')

const fakeGit = (runs: string[][], status: string, diff: string = DIFF_TEXT) => (_$: any, e: any) => {
  runs.push([...e.argv])
  const line = e.argv.join(' ')
  const done = (stdout = '') => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
  if (line.includes('rev-parse --show-toplevel')) return done('/work\n')
  if (line.includes('rev-parse --verify')) return done('abc\n')
  if (line.includes(' status ')) return done(status)
  if (line.includes(' diff ')) return done(diff)
  if (line.includes('ls-files')) return done('x')
  return done()
}

const NARROW = { ...PANE, props: { ...PANE.props, bodyColumns: 80 } }

const MIXED_STATUS = 'M  hooks/src/x.js\0 M a.md\0?? new.txt\0'

const openChangesPane = async ($: any, on: any, runs: string[][], pane: any = NARROW, status: string = MIXED_STATUS) => {
  stubSession(on, [], [])
  on('process.run', fakeGit(runs, status))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  return $.ui.mount({ ...pane, surface: 'terminal' })
}

const ran = (runs: string[][], ...argv: string[]) => runs.some((run) => argv.every((part, index) => run[index] === part))

test('the changes pane lists staged and unstaged files, and stage, unstage and stage-all run the exact git command', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE)
  expect(await ui.find({ key: 'staged-toggle' })).toBeDefined()
  expect(await ui.find({ key: 'worktree-toggle' })).toBeDefined()
  expect(await ui.find({ key: 'tb-stage' })).toBeUndefined()
  await ui.press({ key: 'worktree-0b' })
  await ui.press({ key: 'tb-stage' })
  expect(ran(runs, 'git', 'add', '--', 'a.md')).toBe(true)
  await ui.press({ key: 'staged-1b' })
  await ui.press({ key: 'tb-stage' })
  expect(ran(runs, 'git', 'restore', '--staged', '--', 'hooks/src/x.js')).toBe(true)
  await ui.press({ key: 'worktree-all' })
  expect(ran(runs, 'git', 'add', '-A')).toBe(true)
  await ui.press({ key: 'staged-all' })
  expect(ran(runs, 'git', 'restore', '--staged', '.')).toBe(true)
  await ui.unmount()
})

test('pressing a file shows its diff with hidden-line gaps, and Back returns to the list', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs)
  await ui.press({ key: 'worktree-0b' })
  expect(await ui.find({ key: 'cf-back' })).toBeDefined()
  expect(ran(runs, 'git', '--no-optional-locks', 'diff')).toBe(true)
  expect(await ui.find({ key: 'l1' })).toBeDefined()
  expect(await ui.find({ key: 'l3' })).toBeDefined()
  expect(await ui.find({ key: 'cf-stage' })).toBeDefined()
  await ui.press({ key: 'cf-back' })
  expect(await ui.find({ key: 'worktree-toggle' })).toBeDefined()
  await ui.unmount()
})

test('Discard asks in the Claude Code question box, names the file, and an untracked file is removed with git clean', async ($, on) => {
  const runs: string[][] = []
  const asked: any[] = []
  const answers = ['Cancel', 'Discard']
  on('tool.call', { tool: 'AskUserQuestion' }, (_$: any, e: any) => {
    const question = e.questions[0]
    asked.push(question)
    return { result: { questions: e.questions, answers: { [question.question]: answers.shift() } } }
  })
  const ui = await openChangesPane($, on, runs, PANE)
  await ui.press({ key: 'worktree-0b' })
  await ui.press({ key: 'tb-discard' })
  expect(JSON.stringify(asked[0])).toContain('cannot be undone')
  expect(runs.some((run) => run[1] === 'restore' && !run.includes('--staged'))).toBe(false)
  expect(await ui.find({ key: 'worktree-toggle' })).toBeDefined()
  await ui.press({ key: 'worktree-1b' })
  expect(runs.some((run) => run[1] === 'clean')).toBe(false)
  await ui.press({ key: 'tb-discard' })
  expect(JSON.stringify(asked[1])).toContain('new.txt?')
  expect(ran(runs, 'git', 'clean', '-f', '--', 'new.txt')).toBe(true)
  await ui.unmount()
})

test('closing the Discard question discards nothing', async ($, on) => {
  const runs: string[][] = []
  on('tool.call', { tool: 'AskUserQuestion' }, () => ({ deny: 'dismissed' }))
  const ui = await openChangesPane($, on, runs, PANE)
  await ui.press({ key: 'worktree-1b' })
  await ui.press({ key: 'tb-discard' })
  expect(runs.some((run) => run[1] === 'clean' || (run[1] === 'restore' && !run.includes('--staged')))).toBe(false)
  expect(await ui.find({ key: 'worktree-toggle' })).toBeDefined()
  await ui.unmount()
})

test('a doc page has a Changes button that diffs that file against the last commit and returns to the doc', async ($, on) => {
  const runs: string[][] = []
  on('process.run', fakeGit(runs, ''))
  await stubTaskDoc($, on, [], 'a', 60, [], '# T\n- [ ] one')
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'r0b' })
  await ui.press({ key: 'changes' })
  expect(ran(runs, 'git', '--no-optional-locks', 'diff', 'HEAD')).toBe(true)
  expect(await ui.find({ key: 'l3' })).toBeDefined()
  expect(await ui.find({ key: 'cf-stage' })).toBeUndefined()
  await ui.press({ key: 'cf-back' })
  expect(await ui.find({ key: 'changes' })).toBeDefined()
  await ui.unmount()
})

test('a wide pane splits the tree from the diffs of every file, and pressing a file narrows the right side to it', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE)
  expect(await ui.find({ key: 'ch-diffs' })).toBeDefined()
  expect(await ui.find({ key: 'ch-all' })).toBeUndefined()
  expect(await ui.find({ key: 'worktree-view' })).toBeUndefined()
  expect(await ui.find({ key: 'worktree:a.md#3' })).toBeDefined()
  expect(await ui.find({ key: 'staged:hooks/src/x.js#m' })).toBeUndefined()
  expect(await ui.find({ key: 'dc-all' })).toBeDefined()
  await ui.press({ key: 'dc-all' })
  expect(await ui.find({ key: 'dc-all' })).toBeUndefined()
  expect(await ui.find({ key: 'staged:hooks/src/x.js#m' })).toBeDefined()
  await ui.press({ key: 'worktree-0b' })
  expect(await ui.find({ key: 'dc-all' })).toBeDefined()
  expect(await ui.find({ key: 'cf-back' })).toBeUndefined()
  await ui.unmount()
})

test('the terminal reads the diff of every file past 40, never folds files to save room, and draws only the rows near the scroll position', async ($, on) => {
  const runs: string[][] = []
  const many = Array.from({ length: 45 }, (_, index) => ' M f' + index + '.md\0').join('')
  const ui = await openChangesPane($, on, runs, PANE, many)
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(runs.some((argv) => argv.includes('diff') && argv.includes('f44.md'))).toBe(true)
  expect(await ui.find({ key: 'dc-collapsed' })).toBeUndefined()
  expect(await ui.find({ key: 'worktree:f0.md#hd' })).toBeDefined()
  expect(await ui.find({ key: 'w-below' })).toBeDefined()
  await ui.unmount()
})

test('terminal All diffs sets each file apart: a blank row before every file but the first, and the header on the file strip', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE, ' M f0.md\0 M f1.md\0')
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect((await ui.find({ key: 'worktree:f0.md#hd' }))?.props.backgroundColor).toBe('#1f2633')
  expect((await ui.find({ key: 'worktree:f1.md#hd' }))?.props.backgroundColor).toBe('#1f2633')
  expect(await ui.find({ key: 'worktree:f1.md#gap' })).toBeDefined()
  expect(await ui.find({ key: 'worktree:f0.md#gap' })).toBeUndefined()
  await ui.unmount()
})

test('show_image puts PNG screenshots in the pane, names the files it refused, and the gallery draws the picture', async ($, on) => {
  const specs: any[] = []
  const opened: string[] = []
  stubSession(on, [], opened)
  on('tool.register', (_$: any, e: any) => {
    specs.push(e)
    return { value: { tool: 'mcp__syafiqkit__show_image' } }
  })
  on('fs.stat', () => ({ value: { size: 100, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', (_$: any, e: any) => ({ value: { base64: String(e.path).endsWith('.png') ? 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' : 'AAAA' } }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const spec = specs[0].tool ?? specs[0]
  expect(spec.name).toBe('show_image')
  expect(spec.isDeferred).toBe(false)
  const out: any = await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/a.png', '/tmp/b.jpg', 'rel.png'] })
  expect(String(out.result)).toContain('Added 1 image')
  expect(String(out.result)).toContain('/tmp/b.jpg')
  expect(String(out.result)).toContain('rel.png (not an absolute path)')
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(opened).toEqual([])
  await band.press({ key: 'open-images' })
  expect(opened).toEqual(['doc-pane'])
  await band.unmount()
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'img-close' })).toBeDefined()
  await ui.press({ key: 'img-clear' })
  expect(await ui.find({ key: 'img-clear' })).toBeUndefined()
  await ui.unmount()
})

test('a picture over 4096 pixels on a side does not blank the terminal gallery: the pane still draws, the tall one offers the viewer', async ($, on) => {
  const tall = 'iVBORw0KGgoAAAANSUhEUgAAAAEAABOICAYAAABwnAfKAAAAPklEQVR42u3EQREAAAwCIPuX1uXYwYP0RJIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIkSZIk6X8D4R7WZNqnhEAAAAAASUVORK5CYII='
  const small = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  stubSession(on, [], [])
  on('fs.stat', () => ({ value: { size: 100, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', (_$: any, e: any) => ({ value: { base64: String(e.path).endsWith('tall.png') ? tall : small } }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const out: any = await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/tall.png', '/tmp/small.png'] })
  expect(String(out.result)).toContain('4096 pixels on a side')
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'open-images' })
  await band.unmount()
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await pane.find({ key: 'img-close' })).toBeDefined()
  expect(await pane.find({ key: 'gallery-img-/tmp/small.png' })).toBeDefined()
  expect(await pane.find({ key: 'gallery-img-/tmp/tall.png' })).toBeUndefined()
  await pane.unmount()
})

test('a terminal gallery past 2 MiB of picture data still draws: the newest pictures draw, the older ones wait behind a note', async ($, on) => {
  const big = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJgggAA' + 'A'.repeat(900_000)
  stubSession(on, [], [])
  on('fs.stat', () => ({ value: { size: 700_000, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', () => ({ value: { base64: big } }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const out: any = await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/1.png', '/tmp/2.png', '/tmp/3.png'] })
  expect(String(out.result)).toContain('1 older pictures in the gallery are not drawn')
  expect(String(out.result)).not.toContain('4096')
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'open-images' })
  await band.unmount()
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await pane.find({ key: 'img-close' })).toBeDefined()
  expect(await pane.find({ key: 'gallery-img-/tmp/3.png' })).toBeDefined()
  expect(await pane.find({ key: 'gallery-img-/tmp/2.png' })).toBeDefined()
  expect(await pane.find({ key: 'gallery-img-/tmp/1.png' })).toBeUndefined()
  await pane.unmount()
})

test('one picture past the pane budget on its own is called too large, never an older picture', async ($, on) => {
  const big = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJgggAA' + 'A'.repeat(2_400_000)
  stubSession(on, [], [])
  on('fs.stat', () => ({ value: { size: 1_800_000, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', () => ({ value: { base64: big } }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const out: any = await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/solo.png'] })
  expect(String(out.result)).toContain('1 of them are over about 1.5 MiB')
  expect(String(out.result)).not.toContain('older pictures')
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'open-images' })
  await band.unmount()
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await pane.find({ key: 'img-close' })).toBeDefined()
  expect(await pane.find({ key: 'gallery-img-/tmp/solo.png' })).toBeUndefined()
  await pane.unmount()
})

test('a render that arrives after the pane closed draws nothing of ours, so an expanded pane cannot be left redrawing the docs list', async ($, on) => {
  const opened: string[] = []
  stubSession(on, [], opened)
  on('fs.stat', () => ({ value: { size: 100, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', () => ({ value: { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' } }))
  stubRender(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/a.png'] })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await band.press({ key: 'open-images' })
  const open = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await open.find({ key: 'img-close' })).toBeDefined()
  await open.press({ key: 'img-close' })
  await open.unmount()
  const late = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await late.find({ key: 'img-close' })).toBeUndefined()
  expect(await late.find({ key: 'filter' })).toBeUndefined()
  await late.unmount()
  await band.unmount()
})

test('a narrow pane keeps the heading as a fold and gives each section its own view button, which shows only that section', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs)
  expect(await ui.find({ key: 'worktree-view' })).toBeDefined()
  expect(await ui.find({ key: 'staged-view' })).toBeDefined()
  await ui.press({ key: 'worktree-toggle' })
  expect(await ui.find({ key: 'worktree-0b' })).toBeUndefined()
  expect(await ui.find({ key: 'worktree-view' })).toBeDefined()
  await ui.press({ key: 'worktree-view' })
  expect(await ui.find({ key: 'ca-back' })).toBeDefined()
  expect(await ui.find({ key: 'worktree:a.md#m' })).toBeDefined()
  expect(await ui.find({ key: 'staged:hooks/src/x.js#m' })).toBeUndefined()
  await ui.press({ key: 'ca-back' })
  expect(await ui.find({ key: 'worktree-toggle' })).toBeDefined()
  await ui.unmount()
})

test('a narrow folder row folds on its name and shows only its own diffs from its view button', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs)
  await ui.press({ key: 'staged-0b' })
  expect(await ui.find({ key: 'staged-0v' })).toBeDefined()
  await ui.press({ key: 'staged-0v' })
  expect(await ui.find({ key: 'ca-back' })).toBeDefined()
  expect(await ui.find({ key: 'staged:hooks/src/x.js#m' })).toBeDefined()
  expect(await ui.find({ key: 'worktree:a.md#m' })).toBeUndefined()
  await ui.press({ key: 'ca-back' })
  await ui.press({ key: 'staged-0s' })
  expect(ran(runs, 'git', 'restore', '--staged', '--', 'hooks/src/x.js')).toBe(true)
  await ui.unmount()
})

test('the narrow All changes screen has collapsible sections and a stage button on each file header, Changes first', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs)
  await ui.press({ key: 'ch-all' })
  expect(await ui.find({ key: 'dt-worktree' })).toBeDefined()
  expect(await ui.find({ key: 'dt-staged' })).toBeDefined()
  expect(await ui.find({ key: 'worktree:a.md#m' })).toBeDefined()
  expect(await ui.find({ key: 'staged:hooks/src/x.js#m' })).toBeDefined()
  await ui.press({ key: 'worktree:a.md#m' })
  expect(ran(runs, 'git', 'add', '--', 'a.md')).toBe(true)
  await ui.press({ key: 'dt-worktree' })
  expect(await ui.find({ key: 'worktree:a.md#m' })).toBeUndefined()
  expect(await ui.find({ key: 'staged:hooks/src/x.js#m' })).toBeDefined()
  await ui.unmount()
})

test('pressing a section title in the wide tree focuses the diffs on that section only, and Show all restores both', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE)
  expect(await ui.find({ key: 'worktree:a.md#m' })).toBeDefined()
  expect(await ui.find({ key: 'staged:hooks/src/x.js#m' })).toBeUndefined()
  expect(await ui.find({ key: 'dt-worktree' })).toBeUndefined()
  await ui.press({ key: 'staged-focus' })
  expect(await ui.find({ key: 'staged:hooks/src/x.js#m' })).toBeDefined()
  expect(await ui.find({ key: 'worktree:a.md#m' })).toBeUndefined()
  await ui.press({ key: 'dc-all' })
  expect(await ui.find({ key: 'worktree:a.md#m' })).toBeDefined()
  expect(await ui.find({ key: 'staged:hooks/src/x.js#m' })).toBeDefined()
  await ui.unmount()
})

test('the right side opens on the unstaged changes, and shows both sections when nothing is unstaged', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE, 'M  hooks/src/x.js\0A  b.md\0')
  expect(await ui.find({ key: 'staged:hooks/src/x.js#m' })).toBeDefined()
  expect(await ui.find({ key: 'dc-all' })).toBeUndefined()
  await ui.unmount()
})

test('the gallery has an Open button that hands the file to the system viewer', async ($, on) => {
  const runs: string[][] = []
  stubSession(on, [], [])
  on('tool.register', () => ({ value: { tool: 'mcp__syafiqkit__show_image' } }))
  on('fs.stat', () => ({ value: { size: 100, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', () => ({ value: { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' } }))
  on('process.run', (_$: any, e: any) => {
    runs.push([...e.argv])
    return { value: { exitCode: 0, stdout: e.argv[0] === 'uname' ? 'Darwin\n' : '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/a.png', '/tmp/c.png'] })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'open-images' })
  await band.unmount()
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'img-open-/tmp/c.png' })).toBeDefined()
  await ui.press({ key: 'img-open-/tmp/a.png' })
  expect(ran(runs, 'open', '/tmp/a.png')).toBe(true)
  await ui.unmount()
})

test('on Desktop the gallery draws each picture as an Svg, and the terminal keeps its Image', async ($, on) => {
  stubSession(on, [], [])
  on('tool.register', () => ({ value: { tool: 'mcp__syafiqkit__show_image' } }))
  on('fs.stat', () => ({ value: { size: 100, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', () => ({ value: { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' } }))
  stubRender(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/a.png'] })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await band.press({ key: 'open-images' })
  await band.unmount()
  const desktop = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await desktop.find({ key: 'gallery-svg-/tmp/a.png' })).toBeDefined()
  expect(await desktop.find({ key: 'gallery-img-/tmp/a.png' })).toBeUndefined()
  await desktop.unmount()
  const terminal = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await terminal.find({ key: 'gallery-img-/tmp/a.png' })).toBeDefined()
  expect(await terminal.find({ key: 'gallery-svg-/tmp/a.png' })).toBeUndefined()
  await terminal.unmount()
})

test('a reloaded mod brings back the session gallery from its saved list and keeps adding to it', async ($, on) => {
  const writes: any[] = []
  stubSession(on, [], [])
  on('tool.register', () => ({ value: { tool: 'mcp__syafiqkit__show_image' } }))
  on('session.id', () => ({ value: 'sess-1' }))
  on('fs.stat', () => ({ value: { size: 100, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', (_$: any, e: any) => ({
    value: e.path.endsWith('/gallery-sess-1.json')
      ? JSON.stringify([{ path: '/tmp/old.png', caption: 'before the reload' }])
      : { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' },
  }))
  on('fs.write', (_$: any, e: any) => {
    writes.push(e)
    return { value: undefined }
  })
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/new.png'] })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  const images: any = await band.find({ key: 'open-images' })
  expect(images).toBeDefined()
  expect((await band.findAll({ type: 'Text', text: /^ 2$/ })).length).toBe(1)
  await band.unmount()
  const saved = writes.filter((w) => w.path.endsWith('/gallery-sess-1.json')).pop()
  expect(JSON.parse(saved.content ?? saved.text ?? saved.data).map((i: any) => i.path)).toEqual(['/tmp/old.png', '/tmp/new.png'])
})

test('on Desktop a picture too big for an Svg falls back to the viewer button instead of a broken drawing', async ($, on) => {
  stubSession(on, [], [])
  on('tool.register', () => ({ value: { tool: 'mcp__syafiqkit__show_image' } }))
  on('fs.stat', () => ({ value: { size: 100, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', () => ({ value: { base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==' + 'A'.repeat(140000) } }))
  stubRender(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/big.png'] })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await band.press({ key: 'open-images' })
  await band.unmount()
  const desktop = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect(await desktop.find({ key: 'img-open-/tmp/big.png' })).toBeDefined()
  expect(await desktop.find({ key: 'gallery-svg-/tmp/big.png' })).toBeUndefined()
  await desktop.unmount()
})

test('pressing a folder selects it: the toolbar stages the whole folder and git runs with literal pathspecs', async ($, on) => {
  const runs: string[][] = []
  const envs: any[] = []
  stubSession(on, [], [])
  const inner = fakeGit(runs, 'M  hooks/src/x.js\0M  hooks/src/y.js\0 M a.md\0')
  on('process.run', (_$: any, e: any) => {
    if (e.argv[1] === 'restore' || e.argv[1] === 'add') envs.push(e.init && e.init.env)
    return inner(_$, e)
  })
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'staged-0b' })
  await ui.press({ key: 'tb-stage' })
  expect(ran(runs, 'git', 'restore', '--staged', '--', 'hooks/src/x.js', 'hooks/src/y.js')).toBe(true)
  expect(envs[0]).toEqual({ GIT_LITERAL_PATHSPECS: '1' })
  await ui.unmount()
})

test('a staged file offers Unstage but no Discard', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE)
  await ui.press({ key: 'staged-1b' })
  expect(await ui.find({ key: 'tb-stage' })).toBeDefined()
  expect(await ui.find({ key: 'tb-discard' })).toBeUndefined()
  await ui.unmount()
})

test('diffs load only for the files in focus, and pressing the staged section loads its files then', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE)
  const diffed = (path: string) => runs.some((run) => run.includes('diff') && run.includes(path))
  expect(diffed('a.md')).toBe(true)
  expect(diffed('hooks/src/x.js')).toBe(false)
  await ui.press({ key: 'staged-focus' })
  expect(diffed('hooks/src/x.js')).toBe(true)
  await ui.unmount()
})

test('focusing a file again re-reads its diff, so an edit that kept the same line counts shows up', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE)
  const reads = () => runs.filter((run) => run.includes('diff') && run.includes('a.md')).length
  expect(reads()).toBe(1)
  await ui.press({ key: 'worktree-focus' })
  await ui.press({ key: 'worktree-focus' })
  expect(reads()).toBeGreaterThan(1)
  await ui.unmount()
})

test('Add repo opens a path field', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE)
  await ui.press({ key: 'ch-add' })
  expect(await ui.find({ key: 'repo-path' })).toBeDefined()
  await ui.unmount()
})

const openNestedRepos = async ($: any, on: any, runs: string[][], cwds: string[]) => {
  stubSession(on, [], [], [], ['fs.list'])
  on('fs.list', (_$: any, e: any) => ({
    value:
      e.path === '/work'
        ? [dirEntry('api'), dirEntry('web'), dirEntry('node_modules'), dirEntry('docs')]
        : e.path === '/work/api' || e.path === '/work/web'
          ? [dirEntry('.git')]
          : [],
  }))
  const inner = fakeGit(runs, ' M a.md\0')
  on('process.run', (_$: any, e: any) => {
    cwds.push((e.init && e.init.cwd) || '')
    const line = e.argv.join(' ')
    const cwd = (e.init && e.init.cwd) || ''
    if (line.includes('rev-parse --show-toplevel')) {
      runs.push([...e.argv])
      return { value: { exitCode: cwd === '/work' || cwd === '/work/api' || cwd === '/work/web' ? 0 : 128, stdout: cwd + '\n', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    }
    return inner(_$, e)
  })
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  return $.ui.mount({ ...PANE, surface: 'terminal' })
}

test('nested repos under the folder are listed as groups, and stage-all runs inside the repo that was picked', async ($, on) => {
  const runs: string[][] = []
  const cwds: string[] = []
  const ui = await openNestedRepos($, on, runs, cwds)
  expect(await ui.find({ key: 'repo-b-/work' })).toBeDefined()
  expect(await ui.find({ key: 'repo-b-/work/api' })).toBeDefined()
  expect(await ui.find({ key: 'repo-b-/work/web' })).toBeDefined()
  expect(await ui.find({ key: 'repo-b-/work/node_modules' })).toBeUndefined()
  expect(await ui.find({ key: 'repo-b-/work/docs' })).toBeUndefined()
  await ui.press({ key: 'repo-b-/work/api' })
  await ui.press({ key: 'worktree-all' })
  const at = runs.findIndex((run) => run[1] === 'add' && run[2] === '-A')
  expect(at).toBeGreaterThan(-1)
  expect(cwds[at]).toBe('/work/api')
  await ui.unmount()
})

test('removing a repo from the list only forgets it: nothing is deleted, and Show brings it back', async ($, on) => {
  const runs: string[][] = []
  const ui = await openNestedRepos($, on, runs, [])
  await ui.press({ key: 'repo-x-/work/web' })
  expect(await ui.find({ key: 'repo-b-/work/web' })).toBeUndefined()
  expect(runs.some((run) => ['clean', 'rm', 'restore'].includes(run[1]))).toBe(false)
  await ui.press({ key: 'ch-unhide' })
  expect(await ui.find({ key: 'repo-b-/work/web' })).toBeDefined()
  await ui.unmount()
})

test('a folder with one repo shows no repo headers', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE)
  expect(await ui.find({ key: 'repo-b-/work' })).toBeUndefined()
  expect(await ui.find({ key: 'ch-add' })).toBeDefined()
  await ui.unmount()
})

test('removing the active repo moves to the next, the last repo cannot be removed, and Show brings the others back', async ($, on) => {
  const runs: string[][] = []
  const ui = await openNestedRepos($, on, runs, [])
  await ui.press({ key: 'repo-x-/work/web' })
  await ui.press({ key: 'repo-x-/work' })
  expect(await ui.find({ key: 'repo-b-/work' })).toBeUndefined()
  expect(await ui.find({ key: 'repo-b-/work/api' })).toBeUndefined()
  expect(await ui.find({ key: 'worktree-toggle' })).toBeDefined()
  expect(await ui.find({ key: 'ch-unhide' })).toBeDefined()
  await ui.press({ key: 'ch-unhide' })
  expect(await ui.find({ key: 'repo-b-/work' })).toBeDefined()
  expect(await ui.find({ key: 'worktree-toggle' })).toBeDefined()
  await ui.unmount()
})

test('the changes-only view says how many staged files it hides, and pressing the line shows them', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE, 'M  hooks/src/x.js\0 M a.md\0')
  expect(await ui.find({ key: 'dc-hidden' })).toBeDefined()
  await ui.press({ key: 'dc-hidden' })
  expect(await ui.find({ key: 'dc-hidden' })).toBeUndefined()
  expect(await ui.find({ key: 'dc-all' })).toBeUndefined()
  await ui.unmount()
})

test('a changed task doc opens in the reader from /changes and Back returns to the same changes view, while a source file has no Doc button', async ($, on) => {
  const runs: string[][] = []
  stubSession(on, [], [], [], ['fs.list'])
  stubTree(on, {
    '/work/tasks': [dirEntry('a')],
    '/work/tasks/a': [fileEntry('current.md', 60)],
  })
  on('fs.read', () => ({ value: '# T\n- [ ] one' }))
  on('process.run', fakeGit(runs, ' M tasks/a/current.md\0 M x.js\0'))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await ui.find({ key: 'worktree:x.js#o' })).toBeUndefined()
  await ui.press({ key: 'worktree:tasks/a/current.md#o' })
  expect(await ui.find({ key: 'back' })).toBeDefined()
  await ui.press({ key: 'back' })
  expect(await ui.find({ key: 'dc-head' })).toBeDefined()
  await ui.unmount()
})

test('a changed doc the docs list has never seen still opens in the reader, so the Doc button is never a dead end', async ($, on) => {
  const runs: string[][] = []
  stubSession(on, [], [], [], ['fs.list'])
  stubTree(on, {})
  on('fs.read', () => ({ value: '# New\n- [ ] one' }))
  on('process.run', fakeGit(runs, '?? tasks/fresh/current.md\0'))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'worktree:tasks/fresh/current.md#o' })
  expect(await ui.find({ key: 'back' })).toBeDefined()
  await ui.press({ key: 'back' })
  expect(await ui.find({ key: 'dc-head' })).toBeDefined()
  await ui.unmount()
})

test('a file focused under Changes says its staged half is hidden, and pressing the line switches to that half', async ($, on) => {
  const runs: string[][] = []
  stubSession(on, [], [], [], ['fs.list'])
  stubTree(on, { '/work/tasks': [dirEntry('a')], '/work/tasks/a': [fileEntry('current.md', 60)] })
  on('fs.read', () => ({ value: '# T\n- [ ] one' }))
  on('process.run', fakeGit(runs, 'MM tasks/a/current.md\0'))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'worktree-0b' })
  expect(await ui.find({ key: 'dc-hidden' })).toBeDefined()
  await ui.press({ key: 'dc-hidden' })
  expect(await ui.find({ key: 'dc-hidden' })).toBeDefined()
  await ui.unmount()
})

const DESKTOP_PANE = { ...PANE, props: { ...PANE.props, bodyColumns: undefined } }

const openDesktopChanges = async ($: any, on: any, runs: string[][], status: string = MIXED_STATUS) => {
  stubSession(on, [], [])
  on('process.run', fakeGit(runs, status))
  stubRender(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  return $.ui.mount({ ...DESKTOP_PANE, surface: 'desktop' })
}

test('Desktop /changes draws section strips, a change map and file rows, and stage-all runs the exact git command', async ($, on) => {
  const runs: string[][] = []
  const ui = await openDesktopChanges($, on, runs)
  expect(await ui.find({ key: 'sec-staged' })).toBeDefined()
  expect(await ui.find({ key: 'sec-worktree' })).toBeDefined()
  expect(await ui.find({ key: 'map-worktree:a.md' })).toBeDefined()
  expect(await ui.find({ key: 'staged-toggle' })).toBeUndefined()
  await ui.press({ key: 'sec-worktree-all' })
  expect(ran(runs, 'git', 'add', '-A')).toBe(true)
  await ui.press({ key: 'sec-staged-all' })
  expect(ran(runs, 'git', 'restore', '--staged', '.')).toBe(true)
  await ui.unmount()
})

test('Desktop: pressing a change-map block opens that file with tinted diff rows, and Back returns', async ($, on) => {
  const runs: string[][] = []
  const ui = await openDesktopChanges($, on, runs)
  await ui.press({ key: 'map-worktree:a.md-b' })
  expect(await ui.find({ key: 'cf-back' })).toBeDefined()
  expect(await ui.find({ key: 'cf-rows' })).toBeDefined()
  expect(await ui.find({ key: 'l1' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /new/ })).toBeDefined()
  await ui.press({ key: 'cf-back' })
  expect(await ui.find({ key: 'sec-worktree' })).toBeDefined()
  await ui.unmount()
})

const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const mediaGit = (status: string, diff: string, runs: string[][], tracked: boolean) => (_$: any, e: any) => {
  runs.push([...e.argv])
  const line = e.argv.join(' ')
  const done = (stdout = '', exitCode = 0) => ({ value: { exitCode, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
  if (e.argv[0] === 'sips' && e.argv[1] === '-g') return done('  pixelWidth: 800\n  pixelHeight: 600\n')
  if (e.argv[0] === 'sips' || e.argv[0] === 'sh') return done()
  if (line.includes('rev-parse --show-toplevel')) return done('/work\n')
  if (line.includes('rev-parse --verify')) return done('abc\n')
  if (line.includes(' status ')) return done(status)
  if (line.includes('--no-index')) return done(diff)
  if (line.includes(' diff ')) return done(tracked ? diff : '')
  if (line.includes('ls-files')) return done('x', tracked ? 0 : 1)
  return done()
}

const openMediaFile = async ($: any, on: any, runs: string[][], status: string, diff: string, tracked: boolean, size: number, key: string) => {
  stubSession(on, [], [])
  on('fs.stat', () => ({ value: { kind: 'file', size, mtimeMs: 5, isLink: false } }))
  on('fs.read', () => ({ value: { base64: TINY_PNG } }))
  on('fs.write', () => ({ value: undefined }))
  on('process.run', mediaGit(status, diff, runs, tracked))
  stubRender(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  const ui = await $.ui.mount({ ...DESKTOP_PANE, surface: 'desktop' })
  await ui.press({ key })
  return ui
}

test('Desktop: a changed picture shows its before and after instead of "Binary file", with an Open in viewer button', async ($, on) => {
  const runs: string[][] = []
  const binary = 'Binary files a/shot.png and b/shot.png differ\n'
  const ui = await openMediaFile($, on, runs, ' M shot.png\0', binary, true, 5000, 'map-worktree:shot.png-b')
  expect(await ui.find({ key: 'cf#m-open' })).toBeDefined()
  expect((await ui.findAll({ type: 'Svg' })).length).toBe(2)
  expect(await ui.find({ type: 'Text', text: /Binary file/ })).toBeUndefined()
  expect(ran(runs, 'sh', '-c')).toBe(true)
  await ui.unmount()
})

test('Desktop: a large new PDF shows its first page and a viewer button, never "too large to show here"', async ($, on) => {
  const runs: string[][] = []
  const ui = await openMediaFile($, on, runs, '?? guide.pdf\0', '', false, 1_500_000, 'map-worktree:guide.pdf-b')
  expect(await ui.find({ key: 'cf#m-open' })).toBeDefined()
  expect((await ui.findAll({ type: 'Svg' })).length).toBe(1)
  expect(await ui.find({ type: 'Text', text: /too large/ })).toBeUndefined()
  expect(runs.some((run) => run[0] === 'qlmanage' && run.includes('/work/guide.pdf'))).toBe(true)
  await ui.unmount()
})

const TALL_PNG = 'iVBORw0KGgoAAAANSUhEUgAABkAAABBoCAIAAAA='

test('Desktop gallery: a tall picture picked alone is cut into readable parts, and Down shows the next part', async ($, on) => {
  const runs: string[][] = []
  stubSession(on, [], [])
  on('fs.stat', () => ({ value: { size: 100, mtimeMs: 0, isLink: false, kind: 'file' } }))
  on('fs.read', (_$: any, e: any) => ({ value: { base64: String(e.path).endsWith('.jpg') ? TINY_PNG : TALL_PNG } }))
  on('fs.write', () => ({ value: undefined }))
  on('process.run', (_$: any, e: any) => {
    runs.push([...e.argv])
    return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
  })
  stubRender(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/tall.png'] })
  const band = await $.ui.mount({ ...BAND, surface: 'desktop' })
  await band.press({ key: 'open-images' })
  const ui = await $.ui.mount({ ...DESKTOP_PANE, surface: 'desktop' })
  expect(await ui.find({ key: 'img-down-/tmp/tall.png' })).toBeUndefined()
  await ui.press({ key: 'img-pick-/tmp/tall.png' })
  expect(await ui.find({ key: 'img-down-/tmp/tall.png' })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /1600 x 4200 · part 1 of 6/ })).toBeDefined()
  expect(runs.some((run) => run[0] === 'sips' && run.includes('--cropOffset') && run.includes('0'))).toBe(true)
  await ui.press({ key: 'img-down-/tmp/tall.png' })
  expect(await ui.find({ type: 'Text', text: /part 2 of 6/ })).toBeDefined()
  expect(runs.some((run) => run[0] === 'sips' && run[run.indexOf('--cropOffset') + 1] === '520')).toBe(true)
  await ui.unmount()
  await band.unmount()
})

const NEW_MD_DIFF = ['diff --git a/guide.md b/guide.md', '--- /dev/null', '+++ b/guide.md', '@@ -0,0 +1,3 @@', '+# Guide', '+', '+Hello **world**', ''].join('\n')

test('Desktop: a new markdown file draws rendered, and Raw switches to the added lines and back', async ($, on) => {
  const ui = await openMediaFile($, on, [], '?? guide.md\0', NEW_MD_DIFF, false, 200, 'map-worktree:guide.md-b')
  expect(await ui.find({ key: 'cf#t-md' })).toBeDefined()
  expect(await ui.find({ type: 'Markdown' })).toBeDefined()
  expect(await ui.find({ key: 'l1' })).toBeUndefined()
  await ui.press({ key: 'cf#t-raw' })
  expect(await ui.find({ type: 'Markdown' })).toBeUndefined()
  expect(await ui.find({ key: 'l1' })).toBeDefined()
  await ui.press({ key: 'cf#t-md' })
  expect(await ui.find({ type: 'Markdown' })).toBeDefined()
  await ui.unmount()
})

const PHP_DIFF = [
  'diff --git a/src/Plan.php b/src/Plan.php',
  '--- a/src/Plan.php',
  '+++ b/src/Plan.php',
  '@@ -3,2 +3,2 @@',
  " // keep 'this'",
  "-        return $start->addDays(14);",
  "+        return $start->startOfDay(14);",
  '',
].join('\n')

const coloured = async (ui: any, text: RegExp) => (await ui.findAll({ type: 'Text', text })).map((node: any) => node.props.color).filter(Boolean)

test('Desktop diff rows colour code by language on flat rows and mark changed words in plain text', async ($, on) => {
  stubSession(on, [], [])
  on('process.run', fakeDesktopGit(' M src/Plan.php\0', PHP_DIFF))
  stubRender(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  const desk = await $.ui.mount({ ...DESKTOP_PANE, surface: 'desktop' })
  await desk.press({ key: 'map-worktree:src/Plan.php-b' })
  expect(await desk.find({ type: 'Code' })).toBeUndefined()
  expect(await coloured(desk, /^return$/)).toEqual(['#c678dd', '#c678dd'])
  expect(await coloured(desk, /^startOfDay$/)).toEqual([])
  expect(await coloured(desk, /^\/\/ keep 'this'$/)).toEqual(['#7f848e'])
  expect((await desk.find({ type: 'Text', text: /^startOfDay$/ }))?.props.backgroundColor).toBe('#215932')
  await desk.unmount()
})

test('markdown diffs colour headings and code spans', async ($, on) => {
  const md = ['diff --git a/x/current.md b/x/current.md', '--- a/x/current.md', '+++ b/x/current.md', '@@ -1,1 +1,2 @@', ' ## Status', '+- [ ] run `mod.log` check', ''].join('\n')
  stubSession(on, [], [])
  on('process.run', fakeGit([], ' M x/current.md\0', md))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  const ui = await $.ui.mount({ ...NARROW, surface: 'terminal' })
  await ui.press({ key: 'worktree-1b' })
  expect(await coloured(ui, /^## Status$/)).toEqual(['#c678dd'])
  expect(await coloured(ui, /^`mod\.log`$/)).toEqual(['#e5a56b'])
  await ui.unmount()
})

test('terminal diff rows colour code by language and mark changed words in plain text on the shared palette', async ($, on) => {
  stubSession(on, [], [])
  on('process.run', fakeGit([], ' M src/Plan.php\0', PHP_DIFF))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  const ui = await $.ui.mount({ ...NARROW, surface: 'terminal' })
  await ui.press({ key: 'worktree-1b' })
  expect(await ui.find({ key: 'cf-back' })).toBeDefined()
  expect(await ui.find({ type: 'Code' })).toBeUndefined()
  expect(await coloured(ui, /^return$/)).toEqual(['#c678dd', '#c678dd'])
  const word = await ui.find({ type: 'Text', text: /^startOfDay$/ })
  expect(word?.props.backgroundColor).toBe('#215932')
  expect(word?.props.color).toBeUndefined()
  await ui.unmount()
})

test('Desktop All diffs draws each file under a file strip with Stage and its diff rows', async ($, on) => {
  const runs: string[][] = []
  const ui = await openDesktopChanges($, on, runs)
  await ui.press({ key: 'ch-all' })
  expect(await ui.find({ key: 'worktree:a.md#hd' })).toBeDefined()
  expect(await ui.find({ key: 'staged:hooks/src/x.js#hd' })).toBeDefined()
  expect(await ui.find({ key: 'worktree:a.md#0' })).toBeDefined()
  await ui.press({ key: 'worktree:a.md#m' })
  expect(ran(runs, 'git', 'add', '--', 'a.md')).toBe(true)
  await ui.unmount()
})

const fakeDesktopGit = (status: string, diff: string) => (_$: any, e: any) => {
  const line = e.argv.join(' ')
  const done = (stdout = '') => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
  if (line.includes('rev-parse --show-toplevel')) return done('/work\n')
  if (line.includes('rev-parse --verify')) return done('abc\n')
  if (line.includes(' status ')) return done(status)
  if (line.includes(' diff ')) return done(diff)
  return done()
}

const openLoggedDesktop = async ($: any, on: any, writes: any[], status: string, diff: string) => {
  stubSession(on, [], [])
  on('fs.write', (_$: any, e: any) => {
    writes.push(e)
    return { value: undefined }
  })
  on('process.run', fakeDesktopGit(status, diff))
  on('fs.read', () => ({ value: '{ "version": "0.0.0" }' }))
  stubRender(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'changes', args: '' })
  return $.ui.mount({ ...DESKTOP_PANE, surface: 'desktop' })
}

const modLogText = (writes: any[]) =>
  writes
    .filter((write) => String(write.path).endsWith('/.claude/doc-pane-cache/mod.log'))
    .map((write) => String(write.content ?? write.data ?? write.text ?? ''))
    .join('\n')

test('a Desktop page that repeats a key shows why instead of a blank pane, and the reason goes to the mod log', async ($, on) => {
  const writes: any[] = []
  const ui = await openLoggedDesktop($, on, writes, ' M a.md\0 M a.md\0', DIFF_TEXT)
  expect(await ui.find({ key: 'draw-close' })).toBeDefined()
  expect(await ui.find({ key: 'ch-all' })).toBeUndefined()
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(modLogText(writes)).toContain('pane changes (desktop): two elements share the key')
  await ui.unmount()
})

test('a Desktop page of 200 dense coloured PHP lines stays under the size Desktop draws', async ($, on) => {
  const writes: any[] = []
  const dense = "        $total = $this->calculator->sum($items, 'net', 14) + Carbon::today()->diffInDays($start, false); // keep"
  const rows = Array.from({ length: 200 }, () => '+' + dense)
  const php = ['diff --git a/src/Plan.php b/src/Plan.php', '--- a/src/Plan.php', '+++ b/src/Plan.php', '@@ -0,0 +1,200 @@', ...rows, ''].join('\n')
  const ui = await openLoggedDesktop($, on, writes, ' M src/Plan.php\0', php)
  await ui.press({ key: 'map-worktree:src/Plan.php-b' })
  expect(await ui.find({ key: 'cf-back' })).toBeDefined()
  expect((await ui.findAll({ type: 'Text', text: /^sum$/ })).length).toBeGreaterThan(20)
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(modLogText(writes)).not.toContain('pane change-file (desktop): about')
  await ui.unmount()
})

test('a Desktop page past the size Desktop draws still draws, and the mod log warns about it', async ($, on) => {
  const writes: any[] = []
  const giant = ['diff --git a/a.md b/a.md', '--- a/a.md', '+++ b/a.md', '@@ -1,1 +1,2 @@', ' line', '+' + 'x'.repeat(120000), ''].join('\n')
  const ui = await openLoggedDesktop($, on, writes, ' M a.md\0', giant)
  await ui.press({ key: 'r-worktree-0b' })
  expect(await ui.find({ key: 'cf-back' })).toBeDefined()
  await new Promise((resolve) => setTimeout(resolve, 20))
  expect(modLogText(writes)).toContain('pane change-file (desktop): about')
  await ui.unmount()
})

test('Desktop pages stay drawable with 200 changed files: the overview, All diffs and a file', async ($, on) => {
  const writes: any[] = []
  const many = Array.from({ length: 200 }, (_, index) => ' M dir' + (index % 7) + '/f' + index + '.md\0').join('')
  const ui = await openLoggedDesktop($, on, writes, many, DIFF_TEXT)
  await ui.press({ key: 'ch-all' })
  await new Promise((resolve) => setTimeout(resolve, 50))
  expect(await ui.find({ key: 'w-below' })).toBeDefined()
  await ui.press({ key: 'ca-back' })
  await ui.press({ key: 'r-worktree-1b' })
  expect(await ui.find({ key: 'cf-back' })).toBeDefined()
  expect(modLogText(writes)).toBe('')
  await ui.unmount()
})

test('Desktop pages stay drawable with 313 changed files whose diffs are long and dense', async ($, on) => {
  const writes: any[] = []
  const dense = "        $total = $this->calculator->sum($items, 'net', 14) + Carbon::today()->diffInDays($start, false); // keep"
  const rows = Array.from({ length: 60 }, () => '+' + dense)
  const php = ['diff --git a/src/Plan.php b/src/Plan.php', '--- a/src/Plan.php', '+++ b/src/Plan.php', '@@ -0,0 +1,60 @@', ...rows, ''].join('\n')
  const many = Array.from({ length: 313 }, (_, index) => ' M app/dir' + (index % 9) + '/Service' + index + '.php\0').join('')
  const ui = await openLoggedDesktop($, on, writes, many, php)
  await ui.press({ key: 'ch-all' })
  await new Promise((resolve) => setTimeout(resolve, 100))
  expect(await ui.find({ key: 'w-below' })).toBeDefined()
  expect(await ui.find({ key: 'w-below1' })).toBeDefined()
  expect(modLogText(writes)).toBe('')
  await ui.unmount()
})

test('Desktop All diffs reads every file, Hide folds one and Show diff brings it back', async ($, on) => {
  const runs: string[][] = []
  const ui = await openDesktopChanges($, on, runs)
  await ui.press({ key: 'ch-all' })
  expect(runs.some((argv) => argv.includes('diff') && argv.includes('hooks/src/x.js'))).toBe(true)
  expect(await ui.find({ key: 'staged:hooks/src/x.js#0' })).toBeDefined()
  await ui.press({ key: 'staged:hooks/src/x.js#t' })
  expect(await ui.find({ key: 'staged:hooks/src/x.js#0' })).toBeUndefined()
  expect(await ui.find({ key: 'staged:hooks/src/x.js#hd' })).toBeDefined()
  await ui.press({ key: 'staged:hooks/src/x.js#t' })
  expect(await ui.find({ key: 'staged:hooks/src/x.js#0' })).toBeDefined()
  await ui.unmount()
})

test('Desktop Changes only has Stage all, which runs git add -A and moves the page to Staged Changes only', async ($, on) => {
  const runs: string[][] = []
  const ui = await openDesktopChanges($, on, runs)
  await ui.press({ key: 'sec-worktree-view' })
  expect(await ui.find({ key: 'ca-staged-all' })).toBeUndefined()
  await ui.press({ key: 'ca-worktree-all' })
  expect(ran(runs, 'git', 'add', '-A')).toBe(true)
  expect(await ui.find({ type: 'Text', text: /Staged Changes only/ })).toBeDefined()
  await ui.press({ key: 'ca-staged-all' })
  expect(ran(runs, 'git', 'restore', '--staged', '.')).toBe(true)
  await ui.unmount()
})

test('Desktop All changes offers Stage all and Unstage all, each naming how many files it moves', async ($, on) => {
  const runs: string[][] = []
  const ui = await openDesktopChanges($, on, runs)
  await ui.press({ key: 'ch-all' })
  expect((await ui.find({ key: 'ca-worktree-all' }))?.props.label).toBe('Stage all 2')
  expect((await ui.find({ key: 'ca-staged-all' }))?.props.label).toBe('Unstage all 1')
  await ui.unmount()
})

test('a Top button floats over the pane once it is scrolled down, and is absent at the top', async ($, on) => {
  const runs: string[][] = []
  const many = Array.from({ length: 45 }, (_, index) => ' M f' + index + '.md\0').join('')
  const ui = await openChangesPane($, on, runs, PANE, many)
  expect(await ui.find({ key: 'pane-top' })).toBeUndefined()
  await ui.unmount()
  const down = await $.ui.mount({ ...PANE, surface: 'terminal', props: { ...PANE.props, scroll: { offset: 40, bodyRows: 30 } } })
  expect(await down.find({ key: 'pane-top' })).toBeDefined()
  await down.unmount()
})

test('long pages draw the rows where the pane is actually scrolled, so jumping to the top is never blank', async ($, on) => {
  const runs: string[][] = []
  const many = Array.from({ length: 45 }, (_, index) => ' M f' + index + '.md\0').join('')
  const ui = await openChangesPane($, on, runs, PANE, many)
  await ui.unmount()
  const down = await $.ui.mount({ ...PANE, surface: 'terminal', props: { ...PANE.props, scroll: { offset: 400, bodyRows: 30 } } })
  expect(await down.find({ key: 'worktree:f0.md#h' })).toBeUndefined()
  await down.unmount()
  const top = await $.ui.mount({ ...PANE, surface: 'terminal', props: { ...PANE.props, scroll: { offset: 0, bodyRows: 30 } } })
  expect(await top.find({ key: 'worktree:f0.md#h' })).toBeDefined()
  await top.unmount()
})

test('Desktop All diffs pins the page bar and the file being read while scrolling, and the pinned Stage stages that file', async ($, on) => {
  const runs: string[][] = []
  const ui = await openDesktopChanges($, on, runs, ' M a.md\0 M b.md\0')
  await ui.press({ key: 'ch-all' })
  expect(await ui.find({ key: 'pane-sticky' })).toBeUndefined()
  await ui.unmount()
  const down = await $.ui.mount({ ...DESKTOP_PANE, surface: 'desktop', props: { ...DESKTOP_PANE.props, scroll: { offset: 7, bodyRows: 3 } } })
  expect(await down.find({ key: 'pane-sticky' })).toBeDefined()
  expect(await down.find({ key: 'stk-ca-back' })).toBeDefined()
  expect(await down.find({ key: 'stk-worktree:a.md#hd' })).toBeDefined()
  expect(await down.find({ key: 'draw-refused' })).toBeUndefined()
  await down.press({ key: 'stk-worktree:a.md#m' })
  expect(ran(runs, 'git', 'add', '--', 'a.md')).toBe(true)
  await down.unmount()
})

test('the terminal pane pins nothing, since it has no page colour to cover the rows underneath', async ($, on) => {
  const runs: string[][] = []
  const many = Array.from({ length: 45 }, (_, index) => ' M f' + index + '.md\0').join('')
  const ui = await openChangesPane($, on, runs, PANE, many)
  await ui.unmount()
  const down = await $.ui.mount({ ...PANE, surface: 'terminal', props: { ...PANE.props, scroll: { offset: 40, bodyRows: 30 } } })
  expect(await down.find({ key: 'pane-sticky' })).toBeUndefined()
  await down.unmount()
})

test('Desktop /task-docs pins Menu and the Filter, and typing in the pinned Filter filters the list', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  const docs = Array.from({ length: 12 }, (_, index) => dirEntry('d' + index))
  const tree: any = { '/work/tasks': docs }
  docs.forEach((_, index) => (tree['/work/tasks/d' + index] = [fileEntry('current.md', 60)]))
  stubTree(on, tree)
  on('fs.read', () => ({ value: '# T\n- [ ] one' }))
  stubRender(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'task-docs', args: '' })
  await (await $.ui.mount({ ...DESKTOP_PANE, surface: 'desktop' })).unmount()
  const down = await $.ui.mount({ ...DESKTOP_PANE, surface: 'desktop', props: { ...DESKTOP_PANE.props, scroll: { offset: 6, bodyRows: 4 } } })
  expect(await down.find({ key: 'stk-to-menu' })).toBeDefined()
  expect(await down.find({ key: 'stk-filter' })).toBeDefined()
  expect(await down.find({ key: 'draw-refused' })).toBeUndefined()
  await down.input({ key: 'stk-filter', text: 'd1' })
  expect(await down.find({ key: 'sec-h-match' })).toBeDefined()
  await down.unmount()
})

test('the doc toolbar wraps onto more lines in a narrow pane instead of running off the edge', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  stubTree(on, {
    '/work/tasks': [{ name: 'a', kind: 'directory', size: 0, mtimeMs: 999_000, isLink: false }],
    '/work/tasks/a': [{ name: 'current.md', kind: 'file', size: 60, mtimeMs: 999_000, isLink: false }],
  })
  on('fs.read', () => ({ value: '# T\n- [ ] one' }))
  stubRender(on)
  await $.session.start({ surface: 'desktop', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'desktop', props: { ...PANE.props, bodyColumns: 40 } })
  await ui.press({ key: 'r0b' })
  const rows = (await ui.findAll({ type: 'Box' })).filter((box: any) =>
    JSON.stringify(box.children ?? []).includes('"copy"'),
  )
  const toolbar = rows[rows.length - 1]
  expect(toolbar).toBeDefined()
  expect(toolbar.props.flexWrap).toBe('wrap')
})

test('under 60 columns the terminal doc list drops the age and gauge so the name and status fit', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  stubTree(on, {
    '/work/tasks': [dirEntry('a')],
    '/work/tasks/a': [fileEntry('current.md', 600)],
  })
  on('fs.read', () => ({ value: '# T\n- [ ] one' }))
  stubRender(on)
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal', props: { ...PANE.props, bodyColumns: 40 } })
  expect((await ui.findAll({ type: 'Text', text: /^[█░]{6}$/ })).length).toBe(0)
  const name = await ui.find({ key: 'r0b' })
  expect(name).toBeDefined()
  expect(String(name?.props.label).length).toBeLessThanOrEqual(18)
  await ui.unmount()
})

test('a 40-column changes pane keeps view and stage-all beside the section name', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, { ...PANE, props: { ...PANE.props, bodyColumns: 40 } })
  const toggle = await ui.find({ key: 'worktree-toggle' })
  expect(String(toggle?.props.label).length).toBeLessThanOrEqual(20)
  expect(await ui.find({ key: 'worktree-view' })).toBeDefined()
  expect(await ui.find({ key: 'worktree-all' })).toBeDefined()
  await ui.unmount()
})

test('a narrow terminal list still names each CLAUDE.md by scope, now in the row tail', async ($, on) => {
  stubSession(on, [], [], [], ['session.cwd', 'fs.exists'])
  on('session.cwd', () => ({ value: '/home/test/.claude/p' }))
  const present = new Set(['/home/test/.claude/p/CLAUDE.md', '/home/test/.claude/CLAUDE.md'])
  on('fs.exists', (_$: any, e: any) => ({ value: present.has(e.path) }))
  on('fs.stat', () => ({ value: { kind: 'file', size: 100, mtimeMs: 999_000, isLink: false } }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/home/test/.claude/p' })
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal', props: { ...PANE.props, bodyColumns: 40 } })
  expect(await ui.find({ type: 'Text', text: /this project/ })).toBeDefined()
  expect(await ui.find({ type: 'Text', text: /your global/ })).toBeDefined()
  await ui.unmount()
})

const DRAFT = 'fix the band hiding after the pane closes on desktop'

const DOC_TEXT = '<!--\nStatus: 🔨 Built\n-->\n# The Mod\n\n**Where we are**: a band above the prompt and a pane.\n'
const SKILL_TEXT = '---\nname: uiux\ndescription: >\n  Design judgement for UI work,\n  and research on real products.\n---\nbody'

const stubEnhance = (
  on: any,
  box: { text: string },
  toasts: string[],
  reply: (box: { text: string }) => any,
  digest: () => any = () => answered('{"facts": []}'),
  headless: ((argv: string[]) => any) | null = null,
) => {
  const calls: any[] = []
  const digests: any[] = []
  const runs: string[][] = []
  on('process.spawn', async function* (_$: any, e: any) {
    runs.push(e.argv)
    if (!headless) throw new Error('spawn ' + e.argv[0] + ' ENOENT')
    for await (const event of headless(e.argv)) yield { stream: 'stdout', text: JSON.stringify(event) + '\n' }
    return { value: { code: 0, signal: null } }
  })
  on('ui.toast', (_$: any, e: any) => {
    toasts.push(e.text)
    return { value: undefined }
  })
  stubSession(on, [], [], [], ['fs.list', 'ui.toast'])
  stubTree(on, {
    '/work/tasks': [{ name: 'mod', kind: 'directory', size: 0, mtimeMs: 999_000, isLink: false }],
    '/work/tasks/mod': [{ name: 'current.md', kind: 'file', size: 60, mtimeMs: 999_000, isLink: false }],
    '/work/tasks/mod/decisions': [{ name: 'builds.md', kind: 'file', size: 60, mtimeMs: 999_000, isLink: false }],
    '/work/.claude/skills': [{ name: 'uiux', kind: 'directory', size: 0, mtimeMs: 999_000, isLink: false }],
  })
  on('fs.read', (_$: any, e: any) => ({ value: String(e.path).endsWith('SKILL.md') ? SKILL_TEXT : DOC_TEXT }))
  on('prompt.read', () => ({ value: { text: box.text, cursor: box.text.length } }))
  on('prompt.fill', (_$: any, e: any) => {
    box.text = e.text
    return { isFilled: true, text: e.text }
  })
  on('model.complete', (_$: any, e: any) => {
    if (String(e.system).includes('"facts"')) {
      digests.push(e)
      return { value: digest() }
    }
    calls.push(e)
    return { value: reply(box) }
  })
  stubRender(on)
  return Object.assign(calls, { digests, runs })
}

const answered = (text: string) => ({
  isAnswered: true,
  text,
  usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
})

const rewrite = (fields: Record<string, any>) => answered(JSON.stringify({ goal: '', docs: [], skills: [], scope: '', outOfScope: '', checkAgainst: '', doneWhen: '', open: [], ...fields }))

test('enhance skips a short draft without calling the model', async ($, on) => {
  const box = { text: 'fix it' }
  const toasts: string[] = []
  const calls = stubEnhance(on, box, toasts, () => rewrite({}))
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-enhance' })
  expect(calls.length).toBe(0)
  expect(box.text).toBe('fix it')
  expect(toasts.some((t) => /needs a few words/.test(t))).toBe(true)
  await band.unmount()
})

test('enhance rewrites the draft with the doc, the skill, scope, proof and open points, and undo restores it', async ($, on) => {
  const box = { text: DRAFT }
  const calls = stubEnhance(on, box, [], () =>
    rewrite({
      goal: 'Fix: the band stays hidden after the pane closes on Desktop.',
      docs: ['tasks/mod/current.md', 'tasks/invented/current.md'],
      skills: [{ name: 'syafiqkit:uiux', why: 'check the band against the design.' }, { name: 'made-up', why: 'x' }],
      scope: 'the band redraw after close only',
      doneWhen: 'a screenshot of the band after closing the pane',
      open: ['[Terminal, Desktop, or both?]'],
    }),
    () => answered('{"facts": ["The band is hidden while a pane is open; redrawBandAfterClose brings it back.", "A reload does not swap a running mod."]}'),
  )
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-enhance' })
  expect(calls.length).toBe(1)
  expect(calls[0].model).toBe('haiku')
  expect(String(calls[0].prompt)).toContain('tasks/mod/current.md | The Mod')
  expect(String(calls[0].prompt)).toContain('a band above the prompt')
  expect(String(calls[0].prompt)).toContain('uiux | Design judgement for UI work, and research on real products.')
  expect(calls.digests.length).toBe(1)
  expect(String(calls.digests[0].prompt)).toContain('=== tasks/mod/current.md\n<!--')
  expect(String(calls.digests[0].prompt)).toContain('=== tasks/mod/decisions/builds.md\n')
  expect(String(calls.digests[0].prompt)).toContain('=== The ask\nFix: the band stays hidden')
  expect(box.text).toBe(
    [
      'Fix: the band stays hidden after the pane closes on Desktop.',
      '',
      'Context from tasks/mod/current.md:',
      '- The band is hidden while a pane is open; redrawBandAfterClose brings it back.',
      '- A reload does not swap a running mod.',
      '',
      'Use /uiux: check the band against the design.',
      'Scope: the band redraw after close only',
      'Done when: a screenshot of the band after closing the pane',
      '',
      'Open:',
      '- [Terminal, Desktop, or both?]',
    ].join('\n'),
  )
  expect((await band.findAll({ type: 'Text', text: /mod · \/uiux/ })).length).toBe(1)
  await band.press({ key: 'enhance-undo' })
  expect(box.text).toBe(DRAFT)
  expect(await band.find({ key: 'enhance-undo' })).toBeFalsy()
  await band.unmount()
})

test('enhance leaves the draft alone when nothing is added or the model fails', async ($, on) => {
  const box = { text: DRAFT }
  const toasts: string[] = []
  let reply: any = rewrite({ goal: DRAFT })
  stubEnhance(on, box, toasts, () => reply)
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-enhance' })
  expect(box.text).toBe(DRAFT)
  expect(toasts.some((t) => /Nothing to add/.test(t))).toBe(true)
  reply = { isAnswered: false, reason: 'api-error', status: 500, error: 'api_error', usage: answered('').usage }
  await band.press({ key: 'band-enhance' })
  expect(box.text).toBe(DRAFT)
  expect(toasts.some((t) => /failed/.test(t))).toBe(true)
  reply = answered('not json at all')
  await band.press({ key: 'band-enhance' })
  expect(box.text).toBe(DRAFT)
  expect(await band.find({ key: 'enhance-undo' })).toBeFalsy()
  await band.unmount()
})

test('enhance does not overwrite a draft typed into while it ran', async ($, on) => {
  const box = { text: DRAFT }
  stubEnhance(on, box, [], (current) => {
    current.text = DRAFT + ' and the gallery'
    return rewrite({ goal: 'Rewritten.' })
  })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-enhance' })
  expect(box.text).toBe(DRAFT + ' and the gallery')
  expect(await band.find({ key: 'enhance-use' })).toBeTruthy()
  await band.press({ key: 'enhance-use' })
  expect(box.text).toBe('Rewritten.')
  await band.press({ key: 'enhance-undo' })
  expect(box.text).toBe(DRAFT + ' and the gallery')
  await band.unmount()
})

test('enhance accepts a picked doc written as an absolute path, a ./ path or the folder name', async ($, on) => {
  const box = { text: DRAFT }
  let written = ''
  stubEnhance(on, box, [], () => rewrite({ docs: [written] }))
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  for (const form of ['/work/tasks/mod/current.md', './tasks/mod/current.md', 'mod', 'tasks/mod']) {
    written = form
    box.text = DRAFT
    await band.press({ key: 'band-enhance' })
    expect(box.text).toBe(DRAFT + '\n\nStart with /syafiqkit:read-summary on tasks/mod/current.md.')
  }
  await band.unmount()
})

test('enhance runs read-summary in a headless haiku claude and fills its rewrite, with no model call of its own', async ($, on) => {
  const box = { text: DRAFT }
  const result = JSON.stringify({
    goal: 'Fix the band hiding when the pane closes.',
    docs: ['tasks/mod/current.md', '/work/tasks/mod/decisions/live-checks.md'],
    skills: [{ name: 'plugin-authoring', why: 'mod edits go through it' }, { name: 'syafiqkit:read-summary', why: 'x' }],
    scope: '',
    outOfScope: 'The blank Desktop frame after close.',
    checkAgainst: '',
    doneWhen: '',
    open: [],
    facts: ['live-checks.md item 000: 1.396.2 brought the band back after close.'],
  })
  const calls = stubEnhance(on, box, [], () => rewrite({}), undefined, () => [
    { type: 'system', subtype: 'init' },
    { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Skill', input: { skill: 'syafiqkit:read-summary' } }] } },
    { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Read', input: { file_path: '/work/tasks/mod/current.md' } }] } },
    { type: 'result', is_error: false, result },
  ])
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-enhance' })
  expect(calls.length).toBe(0)
  expect(calls.runs.length).toBe(1)
  const argv = calls.runs[0]
  expect(argv[0]).toBe('claude')
  expect(argv.slice(1, 11)).toEqual([
    '-p',
    '--model',
    'haiku',
    '--permission-mode',
    'auto',
    '--disallowedTools',
    'Edit,Write,NotebookEdit',
    '--output-format',
    'stream-json',
    '--verbose',
  ])
  expect(argv[11]).toContain('Run /syafiqkit:read-summary')
  expect(argv[11]).toContain(DRAFT)
  expect(box.text).toBe(
    [
      'Fix the band hiding when the pane closes.',
      '',
      'Context from tasks/mod/current.md and tasks/mod/decisions/live-checks.md:',
      '- live-checks.md item 000: 1.396.2 brought the band back after close.',
      '',
      'Use /plugin-authoring: mod edits go through it.',
      'Out of scope: The blank Desktop frame after close.',
    ].join('\n'),
  )
  await band.unmount()
})

test('enhance falls back to the quick read when the headless run reports an error', async ($, on) => {
  const box = { text: DRAFT }
  const calls = stubEnhance(on, box, [], () => rewrite({ goal: 'Quick rewrite.' }), undefined, () => [
    { type: 'result', is_error: true, result: 'Failed to authenticate' },
  ])
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-enhance' })
  expect(calls.runs.length).toBe(1)
  expect(calls.length).toBe(1)
  expect(box.text).toBe('Quick rewrite.')
  await band.unmount()
})

test('enhance refuses a prompt it already enhanced, and marks a quick-read result', async ($, on) => {
  const box = { text: DRAFT + '\n\nContext from tasks/mod/current.md:\n- a fact' }
  const toasts: string[] = []
  const calls = stubEnhance(on, box, toasts, () => rewrite({ goal: 'Quick rewrite.', docs: ['tasks/mod/current.md'] }))
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-enhance' })
  expect(calls.length).toBe(0)
  expect(toasts.some((t) => /already enhanced/.test(t))).toBe(true)
  box.text = DRAFT
  await band.press({ key: 'band-enhance' })
  expect(box.text).toBe('Quick rewrite.\n\nStart with /syafiqkit:read-summary on tasks/mod/current.md.')
  expect((await band.findAll({ type: 'Text', text: /quick read · mod/ })).length).toBe(1)
  await band.unmount()
})

test('enhance writes a plain Context header when the facts name no doc file', async ($, on) => {
  const box = { text: DRAFT }
  stubEnhance(on, box, [], () => rewrite({}), undefined, () => [
    { type: 'result', is_error: false, result: JSON.stringify({ goal: 'Fix it.', docs: ['/elsewhere/CLAUDE.md'], facts: ['a fact'] }) },
  ])
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-enhance' })
  expect(box.text).toBe('Fix it.\n\nContext:\n- a fact\n')
  await band.unmount()
})

test('a prompt sent by someone else keeps Undo; sending the enhanced prompt itself clears it', async ($, on) => {
  const box = { text: DRAFT }
  stubEnhance(on, box, [], () => rewrite({ goal: 'Rewritten.' }))
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-enhance' })
  expect(box.text).toBe('Rewritten.')
  await $.prompt.submit({ text: 'Use the done skill to wrap up this session.' })
  await band.rerender?.()
  expect(await band.find({ key: 'enhance-undo' })).toBeTruthy()
  await $.prompt.submit({ text: 'Rewritten.' })
  await band.rerender?.()
  expect(await band.find({ key: 'enhance-undo' })).toBeFalsy()
  await band.unmount()
})

const TYPESET_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='

const TYPESET_DOC = '# T\n\nSome **bold** text.\n\n| a | b |\n|---|---|\n| 1 | 2 |'

const openTypesetDoc = async ($: any, on: any, runs: string[][], hasTypst: boolean, bodyColumns = 100, docText = TYPESET_DOC) => {
  stubSession(on, [], [], [], ['fs.list', 'env.get'])
  on('env.get', () => ({ value: '/Users/test' }))
  stubTree(on, { '/work/tasks': [dirEntry('a')], '/work/tasks/a': [fileEntry('current.md', 60)] })
  on('fs.read', (_$: any, e: any) => ({ value: String(e.path).endsWith('.png') ? { base64: TYPESET_PNG } : docText }))
  on('fs.write', () => ({ value: undefined }))
  on('config.list', () => ({ value: [{ key: 'theme', label: 'Theme', value: 'dark' }] }))
  on('process.run', (_$: any, e: any) => {
    const argv = e.argv || e.command || e
    runs.push(argv)
    if (argv[1] === '--version') return { value: { exitCode: hasTypst && argv[0] === 'typst' ? 0 : 1, stdout: '', stderr: '' } }
    if (argv[1] === 'compile') return { value: { exitCode: 0, stdout: '', stderr: '' } }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  await $.command.run({ command: 'task-docs', args: '' })
  const ui = await $.ui.mount({ ...PANE, props: { ...PANE.props, bodyColumns }, surface: 'terminal' })
  await ui.press({ key: 'r0b' })
  for (let tries = 0; tries < 20 && !(await ui.findAll({ type: 'Image' })).length; tries += 1) {
    await new Promise((resolve) => setTimeout(resolve, 20))
    await ui.rerender?.()
  }
  return ui
}

test('with Typst installed, a doc renders as pictures from the bundled template, and Text view switches back', async ($, on) => {
  const runs: string[][] = []
  const ui = await openTypesetDoc($, on, runs, true)
  const compile = runs.find((run) => run[1] === 'compile')
  expect(compile).toBeDefined()
  expect(compile?.some((arg) => arg.endsWith('/hooks/render/md.typ'))).toBe(true)
  expect(compile).toContain('theme=dark')
  expect((await ui.findAll({ type: 'Image' })).length).toBeGreaterThan(0)
  await ui.press({ key: 'view' })
  expect((await ui.findAll({ type: 'Image' })).length).toBe(0)
  await ui.unmount()
})

test('a long rendered doc draws only the pages near the scroll position, and scrolling it adds no floating Top button', async ($, on) => {
  const runs: string[][] = []
  const longDoc = Array.from({ length: 30 }, (_, index) => '## Part ' + index + '\n\nSome text for part ' + index + '.').join('\n\n')
  const ui = await openTypesetDoc($, on, runs, true, 100, longDoc)
  const atTop = await ui.findAll({ type: 'Image' })
  expect(atTop.length).toBeGreaterThan(0)
  expect(atTop.length).toBeLessThan(10)
  expect(await ui.find({ key: 'm0p0' })).toBeDefined()
  await ui.unmount()
  const down = await $.ui.mount({ ...PANE, surface: 'terminal', props: { ...PANE.props, bodyColumns: 100, scroll: { offset: 1000, bodyRows: 30 } } })
  const deep = await down.findAll({ type: 'Image' })
  expect(deep.length).toBeGreaterThan(0)
  expect(deep.length).toBeLessThan(10)
  expect(await down.find({ key: 'm0p0' })).toBeUndefined()
  expect(await down.find({ key: 'pane-top' })).toBeUndefined()
  expect(await down.find({ key: 'top-end' })).toBeDefined()
  await down.unmount()
})

test('without Typst the doc stays text and says how to get the rendered view', async ($, on) => {
  const runs: string[][] = []
  const ui = await openTypesetDoc($, on, runs, false)
  await ui.rerender?.()
  expect(runs.some((run) => run[1] === 'compile')).toBe(false)
  expect((await ui.findAll({ type: 'Image' })).length).toBe(0)
  expect((await ui.findAll({ type: 'Text', text: /Rendered docs need Typst/ })).length).toBe(1)
  expect(await ui.find({ key: 'view' })).toBeUndefined()
  await ui.unmount()
})

const ANSWER_TEXT = [
  'Here is the flow:',
  '',
  '```mermaid',
  'graph TD; A-->B',
  '```',
  '',
  '$$\\int_0^1 x^2\\,dx = \\frac{1}{3}$$',
  '',
  '![chart](/Users/test/out/chart.jpg)',
  '',
  'The recording is at `/Users/test/out/demo.mp4`.',
].join('\n')

const stubAnswerIo = (on: any, runs: string[][]) => {
  stubSession(on, [], [], [], ['env.get', 'fs.exists'])
  on('env.get', () => ({ value: '/Users/test' }))
  on('fs.exists', (_$: any, e: any) => ({ value: String(e.path).startsWith('/Users/test/out/') }))
  on('fs.write', (_$: any, e: any) => {
    runs.push(['write', String(e.path)])
    return { value: undefined }
  })
  on('fs.read', (_$: any, e: any) => ({ value: String(e.path).endsWith('.png') ? { base64: TYPESET_PNG } : '{ "version": "0.0.0" }' }))
  on('config.list', () => ({ value: [] }))
  on('process.run', (_$: any, e: any) => {
    const argv = e.argv || e.command || e
    runs.push(argv)
    if (argv[0] === 'sips' && argv[1] === '-g') return { value: { exitCode: 0, stdout: 'pixelWidth: 800\n  pixelHeight: 400\n', stderr: '' } }
    if (argv[0] === 'sh') return { value: { exitCode: 1, stdout: '', stderr: '' } }
    if (argv[0] === 'typst' || argv[0] === 'sips' || argv[0] === 'ffmpeg' || argv[0] === 'npx') return { value: { exitCode: 0, stdout: '', stderr: '' } }
    return { value: { exitCode: 1, stdout: '', stderr: '' } }
  })
}

const mountAnswer = async ($: any, text: string) => {
  const ui = await $.ui.mount({ plugin: 'syafiqkit', component: 'AssistantMessage', requestId: 'answer-1', surface: 'terminal', viewport: { columns: 100, rows: 40 }, props: { text } })
  for (let tries = 0; tries < 30 && (await ui.findAll({ type: 'Image' })).length < 4; tries += 1) {
    await new Promise((resolve) => setTimeout(resolve, 20))
    await ui.rerender?.()
  }
  return ui
}

test('an answer keeps its text and gains pictures for a diagram, display math, a local image and a video frame', async ($, on) => {
  const runs: string[][] = []
  stubAnswerIo(on, runs)
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const ui = await mountAnswer($, ANSWER_TEXT)
  expect((await ui.findAll({ type: 'Text', text: /drawn by Claude Code/ })).length).toBe(1)
  expect((await ui.findAll({ type: 'Image' })).length).toBe(4)
  expect(runs.some((run) => run[0] === 'npx')).toBe(true)
  expect(runs.some((run) => run[0] === 'typst' && run[1] === 'compile')).toBe(true)
  expect(runs.some((run) => run[0] === 'sips' && run.includes('/Users/test/out/chart.jpg'))).toBe(true)
  expect(runs.some((run) => run[0] === 'ffmpeg' && run.includes('/Users/test/out/demo.mp4'))).toBe(true)
  const madeFolder = runs.findIndex((run) => run[0] === 'write' && run[1] === '/Users/test/.claude/doc-pane-cache/answers/.keep')
  expect(madeFolder).toBeGreaterThan(-1)
  expect(madeFolder).toBeLessThan(runs.findIndex((run) => run[0] === 'ffmpeg'))
  expect(await ui.find({ key: 'ap-3-open' })).toBeDefined()
  await ui.unmount()
})

test('an answer another mod already drew as pictures is left alone', async ($, on) => {
  const runs: string[][] = []
  stubAnswerIo(on, runs)
  on('ui.render', () => ({ type: 'Image', props: { source: { png: TYPESET_PNG }, columns: 10, rows: 2, alt: 'drawn elsewhere' } }))
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const ui = await $.ui.mount({ plugin: 'syafiqkit', component: 'AssistantMessage', requestId: 'answer-2', surface: 'terminal', viewport: { columns: 100, rows: 40 }, props: { text: ANSWER_TEXT } })
  expect((await ui.findAll({ type: 'Image' })).length).toBe(1)
  expect(runs.some((run) => run[0] === 'ffmpeg' || run[0] === 'npx')).toBe(false)
  await ui.unmount()
})

test('format names in prose and paths to missing files get no picture and no Open button', async ($, on) => {
  const runs: string[][] = []
  stubAnswerIo(on, runs)
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const text = 'Video paths: `.mp4`, `.mov`, `.webm` and similar get a preview. Also see /Users/test/gone/clip.mp4 and ![x](.png).'
  const ui = await $.ui.mount({ plugin: 'syafiqkit', component: 'AssistantMessage', requestId: 'answer-3', surface: 'terminal', viewport: { columns: 100, rows: 40 }, props: { text } })
  await new Promise((resolve) => setTimeout(resolve, 60))
  await ui.rerender?.()
  expect(runs.some((run) => run[0] === 'ffmpeg')).toBe(false)
  expect((await ui.findAll({ type: 'Button' })).length).toBe(0)
  expect((await ui.findAll({ type: 'Image' })).length).toBe(0)
  await ui.unmount()
})

const composeBase = { sections: [{ id: 'intro', text: 'You are Claude.', scope: 'shared' }] }

test('Claude is told about answer pictures in terminal sessions only, and not once they are switched off', async ($, on) => {
  const runs: string[][] = []
  const stored: Record<string, unknown> = {}
  stubAnswerIo(on, runs)
  stubRender(on)
  on('store.get', (_$: any, e: any) => ({ value: stored[e.key] }))
  on('store.set', (_$: any, e: any) => {
    stored[e.key] = e.value
    return { value: undefined }
  })
  on('prompt.compose', () => composeBase)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const ids = async (surfaces: string[]) => ((await $.prompt.compose({ surfaces, model: 'claude-test', promptModel: 'claude-test', tools: [], outputStyle: null, traits: [] })).sections as any[]).map((section) => section.id)
  expect(await ids(['terminal'])).toContain('syafiqkit:answer-pictures')
  expect(await ids(['desktop'])).not.toContain('syafiqkit:answer-pictures')
  await $.command.run({ command: 'sk', args: '' })
  const menu = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect((await menu.find({ key: 'answer-pictures' }))?.props.label).toBe('Answer pictures: on')
  await menu.press({ key: 'answer-pictures' })
  expect(stored.answerPicturesOff).toBe(true)
  expect(await ids(['terminal'])).not.toContain('syafiqkit:answer-pictures')
  await menu.unmount()
  const answer = await $.ui.mount({ plugin: 'syafiqkit', component: 'AssistantMessage', requestId: 'answer-4', surface: 'terminal', viewport: { columns: 100, rows: 40 }, props: { text: ANSWER_TEXT } })
  expect((await answer.findAll({ type: 'Image' })).length).toBe(0)
  expect(runs.some((run) => run[0] === 'ffmpeg' || run[0] === 'npx')).toBe(false)
  await answer.unmount()
})

test('rendered doc pages are sized to a narrow pane, not a default width', async ($, on) => {
  const runs: string[][] = []
  const ui = await openTypesetDoc($, on, runs, true, 40)
  const compile = runs.find((run) => run[1] === 'compile')
  expect(compile).toContain('width=' + 36 * 7)
  const images = await ui.findAll({ type: 'Image' })
  expect(images.length).toBeGreaterThan(0)
  expect(images.every((image: any) => image.props.columns <= 38)).toBe(true)
  await ui.unmount()
})

test('$$ written inside inline code is not drawn as math, while a video path in backticks still is', async ($, on) => {
  const runs: string[][] = []
  stubAnswerIo(on, runs)
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  const text = 'The `$$` blocks need Typst, so a `$$` equation without it stays text. The clip is at `/Users/test/out/demo.mp4`.'
  const ui = await $.ui.mount({ plugin: 'syafiqkit', component: 'AssistantMessage', requestId: 'answer-5', surface: 'terminal', viewport: { columns: 100, rows: 40 }, props: { text } })
  await new Promise((resolve) => setTimeout(resolve, 60))
  await ui.rerender?.()
  expect(runs.some((run) => run[0] === 'typst' && run[1] === 'compile')).toBe(false)
  expect(runs.some((run) => run[0] === 'ffmpeg' && run.includes('/Users/test/out/demo.mp4'))).toBe(true)
  await ui.unmount()
})
