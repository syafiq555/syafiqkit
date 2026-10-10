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
  on('clock.every', () => ({ value: {} }))
  on('ui.open', (_$: any, e: any) => {
    opened.push(e.id)
    return { value: { isPlaced: true } }
  })
  on('ui.close', () => ({ value: undefined }))
  on('ui.toast', () => ({ value: undefined }))
  on('prompt.submit', (_$: any, e: any) => {
    sent.push(e.text)
    return { text: e.text }
  })
}

const stubRender = (on: any) => on('ui.render', () => ({ type: 'Text', props: {}, children: ['drawn by Claude Code'] }))

const stubSummary = (on: any, text: string) =>
  on('model.complete', () => ({
    value: {
      isAnswered: true,
      text,
      usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    },
  }))

const stubHandoffIo = (on: any, writes: any[], messages: any[]) => {
  on('session.messages', () => ({ value: messages }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: 'main\n', stderr: '' } }))
  on('fs.write', (_$: any, e: any) => {
    writes.push(e)
    return { value: undefined }
  })
}

const stubTree = (on: any, tree: Record<string, any[]>) => on('fs.list', (_$: any, e: any) => ({ value: tree[e.path] ?? [] }))

const writtenValue = (write: any, accepts: (value: string) => boolean) =>
  Object.values(write).find((value: any) => typeof value === 'string' && accepts(value)) as string

test('session start registers the menu and docs commands', async ($, on) => {
  const names: string[] = []
  stubSession(on, [], [], names)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })
  expect(names).toEqual(['task-docs', 'sk'])
})

test('the band offers the menu and the docs while the pane is closed', async ($, on) => {
  stubSession(on, [], [])
  stubRender(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await ui.find({ key: 'open-menu' })).toBeDefined()
  expect(await ui.find({ key: 'open-docs' })).toBeDefined()
  expect(await ui.find({ key: 'band-commit' })).toBeDefined()
  expect(await ui.find({ key: 'band-wrap' })).toBeDefined()
  expect(await ui.find({ key: 'band-handoff' })).toBeDefined()
  await ui.unmount()
})

test('the band sends commit in one press and wrap-up only after the confirm', async ($, on) => {
  const sent: string[] = []
  const opened: string[] = []
  stubSession(on, sent, opened)
  stubRender(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'band-commit' })
  expect(sent).toEqual(['Use the commit skill to commit the staged changes.'])
  await ui.press({ key: 'band-wrap' })
  expect(sent.length).toBe(1)
  expect(opened).toEqual(['doc-pane'])
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'confirm-send' })
  expect(sent[1]).toBe('Use the done skill to wrap up this session.')
  await pane.unmount()
  await ui.unmount()
})

test('the wrap-up confirm can also hand off once the wrap-up turn finishes', async ($, on) => {
  const sent: string[] = []
  const writes: any[] = []
  stubSession(on, sent, [])
  stubHandoffIo(on, writes, [{ role: 'user', text: 'finish the pane', toolUses: [] }])
  stubSummary(on, 'Goal\nFinish the pane')
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  stubRender(on)
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-wrap' })
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'also-handoff' })
  await pane.press({ key: 'confirm-send' })
  expect(sent).toEqual(['Use the done skill to wrap up this session.'])
  expect(writes.length).toBe(0)
  await $.turn.start({ turnId: 't1' } as any)
  await $.turn.complete({ turnId: 't1', answer: 'done', durationMs: 5, isAborted: false, usage: null } as any)
  for (let waited = 0; waited < 50 && writes.length === 0; waited += 1) await new Promise((resolve) => setTimeout(resolve, 10))
  expect(writes.length).toBe(1)
  await pane.unmount()
  await band.unmount()
})

test('the band hands off the session and writes the summary, files and git state', async ($, on) => {
  const writes: any[] = []
  stubSession(on, [], [])
  stubHandoffIo(on, writes, [
    { role: 'user', text: 'build the pane', toolUses: [] },
    { role: 'assistant', text: 'Built it', toolUses: [{ tool_use_id: 't1', tool: 'Edit', input: { file_path: '/work/a.js' } }] },
  ])
  stubSummary(on, 'Goal\nBuild the pane')
  stubRender(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'band-handoff' })
  expect(writes.length).toBe(0)
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await pane.find({ key: 'handoff-next' })).toBeDefined()
  await pane.input({ key: 'handoff-next', text: '  review the band first ' })
  expect(writes.length).toBe(1)
  const saved = JSON.parse(writtenValue(writes[0], (value) => value.startsWith('{')))
  expect(saved.summary).toBe('Goal\nBuild the pane')
  expect(saved.how).toBe('summary')
  expect(saved.files).toEqual(['/work/a.js'])
  expect(saved.branch).toBe('main')
  expect(saved.next).toBe('review the band first')
  await pane.unmount()
  await ui.unmount()
})

test('a pending wrap-up handoff is dropped by /clear, so it never summarises the new conversation', async ($, on) => {
  const writes: any[] = []
  stubSession(on, [], [])
  stubHandoffIo(on, writes, [{ role: 'user', text: 'finish the pane', toolUses: [] }])
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  on('classic.SessionStart', () => ({}))
  stubRender(on)
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-wrap' })
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'also-handoff' })
  await pane.press({ key: 'confirm-send' })
  await pane.unmount()
  await band.unmount()
  await $.classic.SessionStart({ source: 'clear' })
  await $.turn.start({ turnId: 't2' } as any)
  await $.turn.complete({ turnId: 't2', answer: 'hi', durationMs: 5, isAborted: false, usage: null } as any)
  await new Promise((resolve) => setTimeout(resolve, 100))
  expect(writes.length).toBe(0)
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

test('a handoff saved in this session is offered again after /clear, not before', async ($, on) => {
  const writes: any[] = []
  stubSession(on, [], [], [], ['fs.list'])
  const written = () => writtenValue(writes[0], (value) => value.startsWith('{'))
  const pathOf = () => writtenValue(writes[0], (value) => value.endsWith('.json'))
  stubHandoffIo(on, writes, [{ role: 'user', text: 'finish the pane', toolUses: [] }])
  stubSummary(on, 'Goal\nFinish the pane')
  on('fs.list', () => ({
    value: writes.length ? [{ name: pathOf().split('/').pop(), kind: 'file', size: 1, mtimeMs: 999_500, isLink: false }] : [],
  }))
  on('fs.read', (_$: any, e: any) => ({ value: e.path.endsWith('.state') ? '' : written() }))
  on('classic.SessionStart', () => ({}))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-handoff' })
  const form = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await form.press({ key: 'handoff-save' })
  expect(writes.length).toBe(1)
  await form.unmount()
  await band.unmount()
  await $.classic.SessionStart({ source: 'startup' })
  const same = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await same.find({ key: 'resume' })).toBeUndefined()
  await same.unmount()

  await $.classic.SessionStart({ source: 'clear' })
  const cleared = await $.ui.mount({ ...BAND, surface: 'terminal' })
  expect(await cleared.find({ key: 'resume' })).toBeDefined()
  await cleared.unmount()
})

test('resuming a handoff always starts with read-summary, even with no task doc', async ($, on) => {
  const sent: string[] = []
  stubSession(on, sent, [], [], ['fs.list'])
  const record = {
    id: '999000-abc',
    createdAt: 999_000,
    cwd: '/work',
    summary: 'Goal\nBuild the pane\nDone\n- wrote it\nNext\nTry it',
    how: 'summary',
    next: '',
    selected: [],
    taskDocPath: '',
    taskDocs: [],
    files: [],
    branch: 'main',
    sha: 'abc1234',
    uncommitted: 2,
  }
  on('fs.list', () => ({ value: [{ name: '999000-abc.json', kind: 'file', size: 400, mtimeMs: 999_000, isLink: false }] }))
  const marks: Record<string, string> = {}
  on('fs.write', (_$: any, e: any) => {
    marks[e.path] = e.text
    return { value: undefined }
  })
  on('fs.read', (_$: any, e: any) => ({ value: e.path.endsWith('.state') ? marks[e.path] ?? '' : JSON.stringify(record) }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '' } }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'resume' })
  expect(sent.length).toBe(1)
  expect(sent[0].split('\n')[0]).toBe(
    'Before anything else, run /syafiqkit:read-summary on this topic: Build the pane (the read-summary skill; it finds the task docs by content).',
  )
  expect(sent[0]).toContain('2 files uncommitted at abc1234 on main')
  await band.unmount()
})

test('a handoff another session already claimed is not offered', async ($, on) => {
  stubSession(on, [], [], [], ['fs.list'])
  const record = { id: '999000-abc', createdAt: 999_000, cwd: '/work', summary: 'Goal\nBuild the pane', how: 'summary', next: '' }
  on('fs.list', () => ({ value: [{ name: '999000-abc.json', kind: 'file', size: 400, mtimeMs: 999_000, isLink: false }] }))
  on('fs.read', (_$: any, e: any) => ({ value: e.path.endsWith('.state') ? 'claimed:other' : JSON.stringify(record) }))
  on('process.run', () => ({ value: { exitCode: 0, stdout: '', stderr: '' } }))
  stubRender(on)
  await $.session.start({ surface: 'terminal', isInteractive: true, cwd: '/work' })

  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await expect(band.press({ key: 'resume' })).rejects.toThrow()
  await band.unmount()
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
  await ui.press({ key: 'confirm-send' })
  expect(sent.length).toBe(1)
  expect(sent[0]).toContain('decisions/requirements.md')
  expect(sent[0]).not.toContain('small.md')
  expect(sent[0]).toContain('Use the task-summary skill')
  expect(sent[0]).toContain('propose it before changing anything')
  await ui.unmount()
})

test('a decisions page offers Split, which asks first and names that one file', async ($, on) => {
  const sent: string[] = []
  const ui = await openBigDecision($, on, sent)
  expect(await ui.find({ key: 'dec-split' })).toBeDefined()
  await ui.press({ key: 'dec-split' })
  expect(sent.length).toBe(0)
  await ui.press({ key: 'confirm-send' })
  expect(sent.length).toBe(1)
  expect(sent[0]).toContain('split decisions/plan.md')
  expect(sent[0]).toContain('Use the haiku skill')
  expect(sent[0]).toContain('/work/tasks/a/decisions/plan.md')
  expect(sent[0]).toContain('Only this file is in scope')
  await ui.unmount()
})

test('cancelling Split returns to the decisions page, and sending it brings the doc back on the next Docs press', async ($, on) => {
  const sent: string[] = []
  const ui = await openBigDecision($, on, sent)
  await ui.press({ key: 'dec-split' })
  await ui.press({ key: 'confirm-cancel' })
  expect(await ui.find({ key: 'dec-split' })).toBeDefined()
  await ui.press({ key: 'dec-split' })
  await ui.press({ key: 'confirm-send' })
  await ui.unmount()
  await $.command.run({ command: 'task-docs', args: '' })
  const again = await $.ui.mount({ ...PANE, surface: 'terminal' })
  expect(await again.find({ key: 'decisions-toggle' })).toBeDefined()
  await again.unmount()
})

test('a decisions page offers Condense, which asks first and condenses that one file on haiku', async ($, on) => {
  const sent: string[] = []
  const ui = await openBigDecision($, on, sent)
  await ui.press({ key: 'dec-condense' })
  expect(sent.length).toBe(0)
  await ui.press({ key: 'confirm-send' })
  expect(sent.length).toBe(1)
  expect(sent[0]).toContain('condense decisions/plan.md')
  expect(sent[0]).toContain('Use the haiku skill')
  expect(sent[0]).toContain('split it if it is over 40 KB')
  expect(sent[0]).toContain('changed the meaning of')
  await ui.unmount()
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
