const runGit = async ($, args) => {
  try {
    const ran = await $.process.run(['git', ...args], { cwd: state.changes.repo, env: LITERAL_PATHS })
    if (ran.exitCode !== 0) {
      $.ui.toast('git ' + args[0] + ' failed: ' + (ran.stderr || ran.stdout).trim().slice(0, 100))
      return false
    }
    return true
  } catch (error) {
    $.ui.toast('git ' + args[0] + ' failed: ' + messageOf(error).slice(0, 100))
    return false
  }
}

const stagePaths = ($, paths) => runGit($, ['add', '--', ...paths])

const unstagePaths = ($, paths) =>
  state.changes.hasHead ? runGit($, ['restore', '--staged', '--', ...paths]) : runGit($, ['rm', '-r', '--cached', '-q', '--', ...paths])

const stageAll = ($) => runGit($, ['add', '-A'])

const unstageAll = ($) =>
  state.changes.hasHead ? runGit($, ['restore', '--staged', '.']) : runGit($, ['rm', '-r', '--cached', '-q', '.'])

const discardPath = ($, entry) =>
  entry.y === '?' ? runGit($, ['clean', '-f', '--', entry.path]) : runGit($, ['restore', '--', entry.path])
