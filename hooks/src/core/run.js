import { hostProcessRun } from './api.js'
import { GIT_TIMEOUT_MS } from './constants.js'
import { messageOf } from './format.js'
import { modLog } from './log.js'

export let gitQueue = Promise.resolve()

export function gitRun($, argv, init) {
  const ran = gitQueue.then(() => hostProcessRun($, argv, { timeoutMs: GIT_TIMEOUT_MS, ...(init || {}) }))
  gitQueue = ran.catch((error) => modLog($, 'git ' + argv.slice(1, 5).join(' ') + ' failed: ' + messageOf(error).slice(0, 200)))
  return ran
}
