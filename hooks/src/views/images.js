import { MAX_IMAGE_SIDE } from '../core/constants.js'
import { state } from '../core/state.js'
import { openInViewer, saveGallery } from '../docs/gallery.js'
import { fitImage, overBudgetPaths, svgPicture, terminalFault } from '../docs/images.js'
import { closePane } from '../docs/reader.js'
import { paneColumns } from './changes.js'
import { desktopImagesView } from './desktop.js'
import { isDesktop } from './ui.js'

export function galleryPicture(c, image, desktop, columns, overBudget = false) {
  const { Box, Text, Image, Svg } = c
  const note = (message) => Text({ dimColor: true, children: message })
  const tooLarge = desktop
    ? 'Too large for Desktop to draw here, and no smaller copy could be made: press Open in viewer.'
    : 'Too large to draw here (over about 1.5 MiB): press Open in viewer.'
  if (desktop) {
    const drawn = svgPicture(image)
    if (!drawn) return note(tooLarge)
    return Box({ key: 'gallery-svg-' + image.path, children: [Svg({ source: drawn.source, alt: image.name, width: drawn.width, height: drawn.height })] })
  }
  const fault = terminalFault(image)
  if (fault === 'large') return note(tooLarge)
  if (fault === 'tall') {
    return note('Too tall or wide to draw here (' + image.size.width + ' x ' + image.size.height + ' pixels, over ' + MAX_IMAGE_SIDE + ' on a side): press Open in viewer.')
  }
  if (overBudget) return note('Not drawn: the pictures above already use the 2 MiB a pane can hold. Press Open in viewer; Clear empties the whole gallery.')
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

export function imagesView($, c) {
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
      saveGallery($)
      redraw()
    },
  })
  const newestFirst = [...list].reverse()
  const overBudget = overBudgetPaths(newestFirst)
  const shown = newestFirst.map((image, index) =>
    Box({
      key: 'img-' + image.path,
      flexDirection: 'column',
      children: [
        Box({
          flexDirection: 'row',
          flexWrap: 'wrap',
          columnGap: 2,
          children: [
            Text({ bold: true, children: image.name }),
            Text({ dimColor: true, children: list.length - index + ' of ' + list.length }),
            Button({ key: 'img-open-' + image.path, label: 'Open in viewer', onPress: () => openInViewer($, image.path) }),
          ],
        }),
        ...(image.caption ? [Text({ dimColor: true, wrap: 'truncate-end', children: image.caption })] : []),
        Text({ dimColor: true, wrap: 'truncate-start', children: image.path }),
        galleryPicture(c, image, false, columns, overBudget.has(image.path)),
      ],
    }),
  )
  return Box({
    flexDirection: 'column',
    rowGap: 1,
    children: [Box({ flexDirection: 'row', columnGap: 2, children: [close, clear] }), ...shown],
  })
}
