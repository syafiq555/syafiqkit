export function hostClockEvery($, ...args) {
  return $.clock.every(...args)
}

export function hostClockNow($, ...args) {
  return $.clock.now(...args)
}

export function hostClockSleep($, ...args) {
  return $.clock.sleep(...args)
}

export function hostCommandRegister($, ...args) {
  return $.command.register(...args)
}

export function hostEnvGet($, name) {
  switch (name) {
    case 'HOME': return $.env.get('HOME')
    case 'SYAFIQKIT_MOD': return $.env.get('SYAFIQKIT_MOD')
    case 'USERPROFILE': return $.env.get('USERPROFILE')
  }
  return Promise.resolve(undefined)
}

export function hostFsExists($, ...args) {
  return $.fs.exists(...args)
}

export function hostFsList($, ...args) {
  return $.fs.list(...args)
}

export function hostFsRead($, ...args) {
  return $.fs.read(...args)
}

export function hostFsStat($, ...args) {
  return $.fs.stat(...args)
}

export function hostFsWrite($, ...args) {
  return $.fs.write(...args)
}

export function hostModelComplete($, ...args) {
  return $.model.complete(...args)
}

export function hostConfigList($, ...args) {
  return $.config.list(...args)
}

export function hostPluginRoot($) {
  return $.plugin.root
}

export function hostProcessRun($, ...args) {
  return $.process.run(...args)
}

export function hostProcessSpawn($, ...args) {
  return $.process.spawn(...args)
}

export function hostPromptFill($, ...args) {
  return $.prompt.fill(...args)
}

export function hostPromptRead($, ...args) {
  return $.prompt.read(...args)
}

export function hostPromptSubmit($, ...args) {
  return $.prompt.submit(...args)
}

export function hostStoreGet($, ...args) {
  return $.store.get(...args)
}

export function hostStoreSet($, ...args) {
  return $.store.set(...args)
}

export function hostSessionCwd($, ...args) {
  return $.session.cwd(...args)
}

export function hostSessionId($, ...args) {
  return $.session.id(...args)
}

export function hostToolRegister($, ...args) {
  return $.tool.register(...args)
}

export function hostUiAsk($, ...args) {
  return $.ui.ask(...args)
}

export function hostUiClose($, ...args) {
  return $.ui.close(...args)
}

export function hostUiCopy($, ...args) {
  return $.ui.copy(...args)
}

export function hostUiInvalidate($, ...args) {
  return $.ui.invalidate(...args)
}

export function hostUiOpen($, ...args) {
  return $.ui.open(...args)
}

export function hostUiResolve($, ...args) {
  return $.ui.resolve(...args)
}

export function hostUiScroll($, ...args) {
  return $.ui.scroll(...args)
}

export function hostUiToast($, ...args) {
  return $.ui.toast(...args)
}
