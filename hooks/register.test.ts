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
  expect(names).toEqual(['task-docs', 'sk', 'changes'])
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

test('a message typed in the wrap-up confirm survives Enter and reaches the saved handoff', async ($, on) => {
  const writes: any[] = []
  stubSession(on, [], [])
  stubHandoffIo(on, writes, [{ role: 'user', text: 'finish the pane', toolUses: [] }])
  stubSummary(on, 'Goal\nFinish the pane')
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  stubRender(on)
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-wrap' })
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'also-handoff' })
  await pane.input({ key: 'handoff-message', text: 'review the band first' })
  await pane.input({ key: 'handoff-message', text: '' })
  await pane.press({ key: 'confirm-send' })
  await $.turn.start({ turnId: 't1' } as any)
  await $.turn.complete({ turnId: 't1', answer: 'done', durationMs: 5, isAborted: false, usage: null } as any)
  for (let waited = 0; waited < 50 && writes.length === 0; waited += 1) await new Promise((resolve) => setTimeout(resolve, 10))
  const saved = JSON.parse(writtenValue(writes[0], (value) => value.startsWith('{')))
  expect(saved.next).toBe('review the band first')
  await pane.unmount()
  await band.unmount()
})

test('a wrap-up turn that ends on a question waits: the handoff saves at the turn that finishes', async ($, on) => {
  const writes: any[] = []
  stubSession(on, [], [])
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
  await $.turn.start({ turnId: 't1' } as any)
  await $.turn.complete({ turnId: 't1', answer: 'Which one do you want?', durationMs: 5, isAborted: false, usage: null } as any)
  await new Promise((resolve) => setTimeout(resolve, 100))
  expect(writes.length).toBe(0)
  await $.turn.start({ turnId: 't2' } as any)
  await $.turn.complete({ turnId: 't2', answer: 'All done', durationMs: 5, isAborted: false, usage: null } as any)
  for (let waited = 0; waited < 50 && writes.length === 0; waited += 1) await new Promise((resolve) => setTimeout(resolve, 10))
  expect(writes.length).toBe(1)
  await pane.unmount()
  await band.unmount()
})

test('an Esc-aborted wrap-up turn saves the handoff even when it ends on a question', async ($, on) => {
  const writes: any[] = []
  stubSession(on, [], [])
  stubHandoffIo(on, writes, [{ role: 'user', text: 'x', toolUses: [] }])
  stubSummary(on, 'Goal\nFinish the pane')
  on('turn.start', (_$: any, e: any) => ({ turnId: e.turnId }))
  on('turn.complete', () => ({ text: '' }))
  stubRender(on)
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'band-wrap' })
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.press({ key: 'also-handoff' })
  await pane.press({ key: 'confirm-send' })
  await $.turn.start({ turnId: 't1' } as any)
  await $.turn.complete({ turnId: 't1', answer: 'Which one?', durationMs: 5, isAborted: true, usage: null } as any)
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
    'Before anything else, run /syafiqkit:read-summary on the Goal below (the read-summary skill; it finds the task docs by content).',
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

test('the docs list shows each task doc once: folders are headers, a heavy doc is flagged in its folder, a folder collapses', async ($, on) => {
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
  expect(await ui.find({ key: 'd0b' })).toBeUndefined()
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

test('a handoff note reaches the summary prompt, and the record names the session it came from', async ($, on) => {
  const writes: any[] = []
  const prompts: string[] = []
  stubSession(on, [], [])
  stubHandoffIo(on, writes, [
    { role: 'user', text: 'fix the billing groups', toolUses: [] },
    { role: 'assistant', text: 'Fixed', toolUses: [] },
  ])
  on('model.complete', (_$: any, e: any) => {
    prompts.push(e.prompt)
    return {
      value: {
        isAnswered: true,
        text: 'Goal\nRefresh the uiux skill',
        usage: { input_tokens: 1, output_tokens: 1, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      },
    }
  })
  on('session.id', () => ({ value: 'sess-billing' }))
  stubRender(on)
  const ui = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await ui.press({ key: 'band-handoff' })
  const pane = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await pane.input({ key: 'handoff-next', text: 'refresh the uiux skill' })
  expect(prompts[0]).toContain('"refresh the uiux skill"')
  const saved = JSON.parse(writtenValue(writes[0], (value) => value.startsWith('{')))
  expect(saved.sessionId).toBe('sess-billing')
  expect(saved.sessionGoal).toBe('fix the billing groups')
  await pane.unmount()
  await ui.unmount()
})

test('resuming a handoff with a note leads with the note and shows which session saved it', async ($, on) => {
  const sent: string[] = []
  stubSession(on, sent, [], [], ['fs.list', 'fs.exists'])
  const record = {
    id: '999000-abc',
    createdAt: 999_000,
    cwd: '/work',
    sessionGoal: 'fix the billing groups',
    summary: 'Goal\nRefresh the uiux skill',
    how: 'summary',
    next: 'refresh the uiux skill',
    selected: [],
    taskDocPath: '/work/tasks/billing/current.md',
    taskDocs: ['/work/tasks/billing/current.md'],
    files: [],
    branch: 'main',
    sha: 'abc1234',
    uncommitted: 0,
  }
  on('fs.exists', () => ({ value: true }))
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
  expect(await band.find({ type: 'Text', text: /from: fix the billing groups/ })).toBeDefined()
  await band.press({ key: 'resume' })
  const lines = sent[0].split('\n')
  expect(lines[0]).toBe('My task for this session: refresh the uiux skill')
  expect(lines[1]).toContain('read-summary on this topic: refresh the uiux skill')
  expect(sent[0]).toContain('Task docs the previous session touched: /work/tasks/billing/current.md')
  await band.unmount()
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

const fakeGit = (runs: string[][], status: string) => (_$: any, e: any) => {
  runs.push([...e.argv])
  const line = e.argv.join(' ')
  const done = (stdout = '') => ({ value: { exitCode: 0, stdout, stderr: '', isStdoutTruncated: false, isStderrTruncated: false } })
  if (line.includes('rev-parse --show-toplevel')) return done('/work\n')
  if (line.includes('rev-parse --verify')) return done('abc\n')
  if (line.includes(' status ')) return done(status)
  if (line.includes(' diff ')) return done(DIFF_TEXT)
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

test('Discard asks first, names the file, and an untracked file is removed with git clean', async ($, on) => {
  const runs: string[][] = []
  const ui = await openChangesPane($, on, runs, PANE)
  await ui.press({ key: 'worktree-0b' })
  await ui.press({ key: 'tb-discard' })
  expect(await ui.find({ key: 'discard-yes' })).toBeDefined()
  await ui.press({ key: 'discard-cancel' })
  expect(runs.some((run) => run[1] === 'restore' && !run.includes('--staged'))).toBe(false)
  expect(await ui.find({ key: 'worktree-toggle' })).toBeDefined()
  await ui.press({ key: 'worktree-1b' })
  await ui.press({ key: 'tb-discard' })
  expect(runs.some((run) => run[1] === 'clean')).toBe(false)
  await ui.press({ key: 'discard-yes' })
  expect(ran(runs, 'git', 'clean', '-f', '--', 'new.txt')).toBe(true)
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
  expect(await ui.find({ key: 'img-next' })).toBeUndefined()
  await ui.press({ key: 'img-clear' })
  expect(await ui.find({ key: 'img-clear' })).toBeUndefined()
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
  await $.tool.call({ tool: 'mcp__syafiqkit__show_image', paths: ['/tmp/a.png'] })
  const band = await $.ui.mount({ ...BAND, surface: 'terminal' })
  await band.press({ key: 'open-images' })
  await band.unmount()
  const ui = await $.ui.mount({ ...PANE, surface: 'terminal' })
  await ui.press({ key: 'img-open' })
  expect(ran(runs, 'open', '/tmp/a.png')).toBe(true)
  await ui.unmount()
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
