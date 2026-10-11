const galleryPicture = (c, image, desktop, columns) => {
  const { Box, Text, Image, Svg } = c
  const note = (message) => Text({ dimColor: true, children: message })
  const tooLarge = desktop
    ? 'Too large for Desktop to draw here, and no smaller copy could be made: press Open in viewer.'
    : 'Too large to draw here (over 2 MiB): press Open in viewer.'
  if (desktop) {
    const drawn = svgPicture(image)
    if (!drawn) return note(tooLarge)
    return Box({ key: 'gallery-svg-' + image.path, children: [Svg({ source: drawn.source, alt: image.name, width: drawn.width, height: drawn.height })] })
  }
  if (!image.png) return note(tooLarge)
  if (!Image) return note('This screen cannot draw pictures.')
  const size = fitImage(image.size, columns)
  return Image({
    key: 'gallery-img-' + image.path,
    source: { png: image.png },
    columns: size.columns,
    rows: size.rows,
    alt: 'Image not drawn here: start Claude Code with CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1',
  })
}

const imagesView = ($, c) => {
  if (isDesktop(c.e) && c.Svg) return desktopImagesView($, c)
  const { e, Box, Text, Button, redraw } = c
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
  const columns = Math.max(20, paneColumns(e) - 2)
  const clear = Button({
    key: 'img-clear',
    label: 'Clear',
    hotkey: 'c',
    onPress: () => {
      state.images = []
      redraw()
    },
  })
  const shown = [...list].reverse().map((image, index) =>
    Box({
      key: 'img-' + image.path,
      flexDirection: 'column',
      children: [
        Box({
          flexDirection: 'row',
          columnGap: 2,
          children: [
            Text({ bold: true, children: image.name }),
            Text({ dimColor: true, children: list.length - index + ' of ' + list.length }),
            Button({ key: 'img-open-' + image.path, label: 'Open in viewer', onPress: () => openInViewer($, image.path) }),
          ],
        }),
        ...(image.caption ? [Text({ dimColor: true, wrap: 'truncate-end', children: image.caption })] : []),
        Text({ dimColor: true, wrap: 'truncate-start', children: image.path }),
        galleryPicture(c, image, false, columns),
      ],
    }),
  )
  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [Box({ flexDirection: 'row', columnGap: 2, children: [close, clear] }), ...shown],
  })
}
