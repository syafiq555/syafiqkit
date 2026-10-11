const isDesktop = (e) => Boolean(e) && e.surface === 'desktop'

const hoverScope = (text) => {
  let hash = 0
  for (let at = 0; at < text.length; at++) hash = (Math.imul(hash, 31) + text.charCodeAt(at)) | 0
  return 'f' + (hash >>> 0).toString(36)
}

const chip = (c, key, text, tone) =>
  c.Text({ key, backgroundColor: DESKTOP_TONE[tone + 'Chip'] || DESKTOP_TONE.mutedChip, children: ' ' + text + ' ' })

const counts = (c, key, added, removed) =>
  c.Box({
    key,
    flexDirection: 'row',
    columnGap: 1,
    flexShrink: 0,
    children: [
      ...(added ? [c.Text({ key: key + '+', color: 'success', children: '+' + added })] : []),
      ...(removed ? [c.Text({ key: key + '-', color: 'error', children: '−' + removed })] : []),
    ],
  })

const strip = (c, { key, title, count, tone, right, onPress, hot }) => {
  const { Box, Text, Button } = c
  const label = [title, count === undefined ? '' : String(count)].filter(Boolean).join('  ')
  return Box({
    key,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: 1,
    paddingX: 1,
    backgroundColor: hot ? DESKTOP_TONE.stripHot : DESKTOP_TONE[(tone || '') + 'Strip'] || DESKTOP_TONE.strip,
    children: [
      onPress
        ? Button({ key: key + '-t', plain: true, onPress, children: [Text({ bold: true, children: label })] })
        : Text({ key: key + '-t', bold: true, wrap: 'truncate-end', children: label }),
      Box({ key: key + '-r', flexDirection: 'row', columnGap: 1, flexShrink: 0, children: right || [] }),
    ],
  })
}

const meter = (c, key, value, max, width = 10) => {
  const over = value > max
  const filled = Math.max(value > 0 ? 1 : 0, Math.min(width, Math.round((value / Math.max(1, max)) * width)))
  const bar = (part, cells, color) =>
    c.Box({ key: key + part, width: cells, flexShrink: 0, backgroundColor: color, children: [c.Text({ children: ' ' })] })
  return c.Box({
    key,
    width,
    flexShrink: 0,
    flexDirection: 'row',
    children: [
      ...(filled ? [bar('f', filled, over ? DESKTOP_TONE.warnMeter : DESKTOP_TONE.meter)] : []),
      ...(width - filled ? [bar('t', width - filled, DESKTOP_TONE.meterTrack)] : []),
    ],
  })
}

const pageBar = (c, { back, actions, title, sub }) => {
  const { Box, Text, Button } = c
  return Box({
    key: 'page-bar',
    flexDirection: 'column',
    rowGap: 0,
    children: [
      Box({
        key: 'page-bar-row',
        flexDirection: 'row',
        columnGap: 1,
        flexWrap: 'wrap',
        children: [
          ...(back ? [Button({ key: back.key, label: back.label, hotkey: back.hotkey, role: 'dismiss', autoFocus: true, onPress: back.onPress })] : []),
          ...(actions || []).map((action) =>
            Button({
              key: action.key,
              label: action.label,
              hotkey: action.hotkey,
              variant: action.primary ? 'primary' : 'secondary',
              ...(action.autoFocus ? { autoFocus: true } : {}),
              onPress: action.onPress,
            }),
          ),
        ],
      }),
      ...(title ? [Text({ key: 'page-bar-title', bold: true, wrap: 'truncate-start', children: title })] : []),
      ...(sub ? [Text({ key: 'page-bar-sub', dimColor: true, wrap: 'truncate-end', children: sub })] : []),
    ],
  })
}

const mapBlock = (c, { key, scope, added, removed, cells, onPress }) => {
  const { Box, Button } = c
  const tone = added && removed ? 'mix' : removed ? 'del' : 'add'
  return Box({
    key,
    width: cells,
    flexShrink: 0,
    backgroundColor: DESKTOP_TONE[tone + 'Block'],
    hover: { scope, backgroundColor: DESKTOP_TONE[tone + 'BlockHot'] },
    children: [Button({ key: key + '-b', plain: true, label: ' '.repeat(cells), onPress })],
  })
}
