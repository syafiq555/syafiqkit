const MOD_INSTANCE = Math.random().toString(36).slice(2, 6)
let modLogPath = ''
let modLogLast = ''
let modLogQueue = Promise.resolve()

const appendModLog = async ($, entry) => {
  if (!modLogPath) {
    const home = await homeOf($)
    if (!home) return
    modLogPath = home + '/.claude/doc-pane-cache/' + MOD_LOG_FILE
  }
  let previous = ''
  try {
    previous = String((await $.fs.read(modLogPath)) || '')
  } catch {
    previous = ''
  }
  const lines = [...previous.split('\n').filter(Boolean), entry].slice(-MOD_LOG_LINES)
  await $.fs.write(modLogPath, lines.join('\n') + '\n')
}

const modLog = ($, line) => {
  if (line === modLogLast) return modLogQueue
  modLogLast = line
  const entry = new Date().toISOString() + ' [' + MOD_INSTANCE + '] ' + line
  modLogQueue = modLogQueue.then(() => appendModLog($, entry)).catch(() => {})
  return modLogQueue
}

const childrenOf = (node) => {
  if (!node || typeof node !== 'object') return []
  const kids = Array.isArray(node.children) ? node.children : node.props && Array.isArray(node.props.children) ? node.props.children : []
  return kids.filter((kid) => kid && typeof kid === 'object')
}

const keyOf = (node) => (node.props && node.props.key !== undefined ? node.props.key : node.key)

const treeProblem = (node) => {
  const kids = childrenOf(node)
  const seen = new Set()
  for (const kid of kids) {
    const key = keyOf(kid)
    if (key !== undefined && key !== null) {
      if (seen.has(key)) return 'two elements share the key "' + String(key).slice(0, 60) + '"'
      seen.add(key)
    }
    const scope = kid.props && kid.props.hover && kid.props.hover.scope
    if (typeof scope === 'string' && scope.length > MAX_HOVER_SCOPE) return 'a hover scope is ' + scope.length + ' characters (limit ' + MAX_HOVER_SCOPE + ')'
    const inner = treeProblem(kid)
    if (inner) return inner
  }
  return ''
}

const drawingSize = (tree) => {
  try {
    return JSON.stringify(tree).length
  } catch {
    return 0
  }
}
