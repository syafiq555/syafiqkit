const imagesView = ($, c) => {
  const { e, Box, Text, Button, Image, redraw } = c
  const list = state.images
  const close = Button({ key: 'img-close', label: '< Close', hotkey: 'b', autoFocus: true, onPress: () => closePane($) })
  if (!list.length) {
    return Box({
      flexDirection: 'column',
      children: [
        close,
        Text({ dimColor: true, children: 'No images yet. Ask Claude to show a screenshot and it appears here.' }),
      ],
    })
  }
  const at = Math.min(Math.max(state.imageAt, 0), list.length - 1)
  const image = list[at]
  const move = (key, label, hotkey, to) =>
    Button({
      key,
      label,
      hotkey,
      onPress: () => {
        state.imageAt = to
        redraw()
      },
    })
  const size = fitImage(image.size, Math.max(20, paneColumns(e) - 2))
  return Box({
    flexDirection: 'column',
    children: [
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          close,
          ...(at > 0 ? [move('img-prev', '‹ Prev', 'p', at - 1)] : []),
          ...(at < list.length - 1 ? [move('img-next', 'Next ›', 'n', at + 1)] : []),
          Button({ key: 'img-open', label: 'Open in viewer', hotkey: 'o', onPress: () => openInViewer($, image.path) }),
          Button({
            key: 'img-clear',
            label: 'Clear',
            hotkey: 'c',
            onPress: () => {
              state.images = []
              state.imageAt = 0
              redraw()
            },
          }),
        ],
      }),
      Box({
        flexDirection: 'row',
        columnGap: 2,
        children: [
          Text({ bold: true, children: image.name }),
          Text({ dimColor: true, children: at + 1 + ' of ' + list.length }),
          ...(image.caption ? [Text({ wrap: 'truncate-end', children: image.caption })] : []),
        ],
      }),
      Text({ dimColor: true, wrap: 'truncate-start', children: image.path }),
      Image && image.png
        ? Image({
            key: 'gallery-img',
            source: { png: image.png },
            columns: size.columns,
            rows: size.rows,
            alt: 'Image not drawn here: start Claude Code with CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1',
          })
        : Text({
            dimColor: true,
            children: image.png ? 'This screen cannot draw pictures.' : 'Too large to draw here (over 2 MiB): press Open in viewer.',
          }),
    ],
  })
}
