let gitQueue = Promise.resolve()

const gitRun = ($, argv, init) => {
  const ran = gitQueue.then(() => $.process.run(argv, { timeoutMs: GIT_TIMEOUT_MS, ...(init || {}) }))
  gitQueue = ran.catch((error) => modLog($, 'git ' + argv.slice(1, 5).join(' ') + ' failed: ' + messageOf(error).slice(0, 200)))
  return ran
}
