import { hostUiToast } from '../core/api.js'
import { LITERAL_PATHS } from '../core/constants.js'
import { messageOf } from '../core/format.js'
import { gitRun } from '../core/run.js'
import { state } from '../core/state.js'

export async function runGit($, args) {
  try {
    const ran = await gitRun($, ['git', ...args], { cwd: state.changes.repo, env: LITERAL_PATHS })
    if (ran.exitCode !== 0) {
      hostUiToast($, 'git ' + args[0] + ' failed: ' + (ran.stderr || ran.stdout).trim().slice(0, 100))
      return false
    }
    return true
  } catch (error) {
    hostUiToast($, 'git ' + args[0] + ' failed: ' + messageOf(error).slice(0, 100))
    return false
  }
}

export function stagePaths($, paths) {
  return runGit($, ['add', '--', ...paths])
}

export function unstagePaths($, paths) {
  return state.changes.hasHead ? runGit($, ['restore', '--staged', '--', ...paths]) : runGit($, ['rm', '-r', '--cached', '-q', '--', ...paths])
}

export function stageAll($) {
  return runGit($, ['add', '-A'])
}

export function unstageAll($) {
  return state.changes.hasHead ? runGit($, ['restore', '--staged', '.']) : runGit($, ['rm', '-r', '--cached', '-q', '.'])
}

export function discardPath($, entry) {
  return entry.y === '?' ? runGit($, ['clean', '-f', '--', entry.path]) : runGit($, ['restore', '--', entry.path])
}
