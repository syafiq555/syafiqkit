import { DESKTOP_TONE, PIPE_MARK, PIPE_TONE } from '../core/constants.js'
import { state } from '../core/state.js'

export function isDesktop(e) {
  return Boolean(e) && e.surface === 'desktop'
}

export function hoverScope(text) {
  let hash = 0
  for (let at = 0; at < text.length; at++) hash = (Math.imul(hash, 31) + text.charCodeAt(at)) | 0
  return 'f' + (hash >>> 0).toString(36)
}

export function chip(c, key, text, tone) {
  return c.Text({ key, backgroundColor: DESKTOP_TONE[tone + 'Chip'] || DESKTOP_TONE.mutedChip, children: ' ' + text + ' ' })
}

export function pipeStrip(c, chips) {
  const tones = PIPE_TONE[state.look?.mode === 'light' ? 'light' : 'dark']
  const children = []
  chips.forEach(({ key, label, phase, hotkey, onPress }, at) => {
    if (at > 0 && !state.desktop) children.push(c.Text({ key: key + '-sep', dimColor: true, children: ' › ' }))
    children.push(
      c.Box({
        key: key + '-chip',
        flexShrink: 0,
        ...(state.desktop ? { paddingX: 1, backgroundColor: tones[phase].bg } : {}),
        children: [
          c.Button({
            key,
            plain: true,
            ...(hotkey ? { hotkey } : {}),
            onPress,
            ...(state.desktop
              ? { label: PIPE_MARK[phase] + ' ' + label }
              : { children: [c.Text({ color: tones[phase].fg, children: PIPE_MARK[phase] + ' ' + label })] }),
          }),
        ],
      }),
    )
  })
  return c.Box({ key: 'pipe', flexDirection: 'row', flexShrink: 0, columnGap: 0, children })
}

export function toolStrip(c, tools) {
  return c.Box({
    key: 'tools',
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 2,
    children: tools.map(({ key, label, count, hotkey, onPress }) =>
      c.Button({
        key,
        plain: true,
        ...(hotkey ? { hotkey } : {}),
        onPress,
        ...(state.desktop
          ? { label: count ? label + ' ' + count : label }
          : {
              children: [
                c.Text({ key: key + '-label', dimColor: true, children: label }),
                ...(count ? [c.Text({ key: key + '-count', children: ' ' + count })] : []),
              ],
            }),
      }),
    ),
  })
}

export function counts(c, key, added, removed) {
  return c.Box({
    key,
    flexDirection: 'row',
    columnGap: 1,
    flexShrink: 0,
    children: [
      ...(added ? [c.Text({ key: key + '+', color: 'success', children: '+' + added })] : []),
      ...(removed ? [c.Text({ key: key + '-', color: 'error', children: '−' + removed })] : []),
    ],
  })
}

export function strip(c, { key, title, count, tone, right, onPress, hot }) {
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

export function meter(c, key, value, max, width = 10) {
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

export function textMeter(value, max, width) {
  const filled = value > 0 ? Math.max(1, Math.min(width, Math.round((value / Math.max(1, max)) * width))) : 0
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

export function stickyTop(make) {
  state.stickyTop = make
  return make('')
}

export function liveOnly(prefix, props) {
  return (prefix ? {} : props)
}

export function pageBar(c, opts) {
  return stickyTop((prefix) => pageBarRow(c, opts, prefix))
}

export function pageBarRow(c, { back, actions, title, sub }, prefix) {
  const { Box, Text, Button } = c
  const own = (hotkey, autoFocus) => liveOnly(prefix, { hotkey, ...(autoFocus ? { autoFocus: true } : {}) })
  return Box({
    key: prefix + 'page-bar',
    flexDirection: 'column',
    rowGap: 0,
    children: [
      Box({
        key: prefix + 'page-bar-row',
        flexDirection: 'row',
        columnGap: 1,
        flexWrap: 'wrap',
        children: [
          ...(back ? [Button({ key: prefix + back.key, label: back.label, role: 'dismiss', ...own(back.hotkey, true), onPress: back.onPress })] : []),
          ...(actions || []).filter((action) => !(prefix && action.unpinned)).map((action) =>
            Button({
              key: prefix + action.key,
              label: action.label,
              variant: action.primary ? 'primary' : 'secondary',
              ...own(action.hotkey, action.autoFocus),
              onPress: action.onPress,
            }),
          ),
        ],
      }),
      ...(title ? [Text({ key: prefix + 'page-bar-title', bold: true, wrap: 'truncate-start', children: title })] : []),
      ...(sub ? [Text({ key: prefix + 'page-bar-sub', dimColor: true, wrap: 'truncate-end', children: sub })] : []),
    ],
  })
}

export function mapBlock(c, { key, scope, added, removed, cells, onPress }) {
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
