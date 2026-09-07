# Getting a board in front of the user, and what goes wrong

## The four ways to load a board, ranked

1. **Clipboard paste (default).** `build_board.py … --clipboard` puts `{"type":"excalidraw/clipboard","elements":[…]}` on the macOS clipboard. In the excalidraw.com tab: click the canvas, `cmd+a`, `Delete`, `cmd+v`, `Escape`, click empty canvas, `shift+1` (zoom to fit), screenshot. Nothing leaves the machine, no payload rides in a tool argument, and it works for any size. The pasted scene persists in that browser profile's local storage, so the tab survives reloads.
2. **The `.excalidraw` file.** Saved beside the task doc; the user opens it with `Cmd+O` on excalidraw.com or in the desktop app. Excalidraw never writes back to disk by itself, so tell the user to `Cmd+S` over the same file after the meeting, or the repo copy is stale.
3. **`localStorage` patch via `javascript_tool`.** Read `localStorage.excalidraw`, mutate element fields by id, bump `version` and `versionNonce` on everything you touched, write back, reload. Fine for a few field changes; a full scene in a tool argument is 20 to 60 KB of tokens each time, which is why paste wins.
4. **`mcp__excalidraw__export_to_excalidraw`.** Uploads to excalidraw.com's share backend and returns a public link. That is publishing: partner names and internal decisions leave the machine. Do it only when the user asks for a link.

## Traps, indexed by what you saw

| You saw | What happened | Do instead |
|---|---|---|
| `create_view` returned a `checkpointId` and nothing visible | The Excalidraw MCP is an MCP App; its canvas renders only in Claude Desktop. In Claude Code it paints nowhere, and `read_checkpoint` returns your own input, not expanded elements | Generate raw JSON yourself and verify with a Chrome screenshot |
| `Runtime.evaluate timed out after 45000ms`, renderer "frozen" | A `fetch('http://127.0.0.1:…')` from the https excalidraw.com page hangs under its CSP instead of failing | Never fetch from the page. Paste from the clipboard |
| Heading renders as `DECIDEI`, list lines spill past their box | A free text element narrower than its glyphs is clipped; `autoResize` does not rescue widths you set by hand. Helvetica (`fontFamily: 2`) is wider than the 0.55 em estimate | Set free-text `width` at about 0.72 em per character, and give strips 520 px |
| Two cards overlap in one column | A branch with three lines outgrew a fixed 44 px box | Height follows measured text (`build_board.py` does this); never hard-code card heights |
| `file_upload` finds no input | excalidraw.com's Open uses the native File System Access picker, not an `<input type=file>` | Paste, or tell the user to press `Cmd+O` |
| You just `cat`ed the board JSON to check it | 60 KB of coordinates entered context for nothing | Check counts with `python3 -c` or `wc -c`; look at the screenshot, not the JSON |
| Zoom to fit shows the board shifted off-screen | An element was still selected when `shift+1` ran, or the click landed on a card | `Escape`, click empty canvas, then `shift+1` |
| Old board still showing after paste | `cmd+a`/`Delete` ran while a text element had focus | Click empty canvas first; confirm the element count in the screenshot |
| A brand-new tab already shows the previous board, or the paste lands on top of it | excalidraw.com restores the last scene from the profile's local storage, so a fresh tab is not an empty canvas | Treat every tab as non-empty: click empty canvas, `cmd+a`, `Backspace`, screenshot to confirm blank, then paste |
| A strip line runs past the right edge of its box | Strips are a fixed 520 px and `build_board.py` does not wrap strip lines | Keep decided/open/action lines under about 58 characters; shorten the line rather than widening the strip |

## Element format notes for hand-built JSON

- A labelled box is two elements: the rectangle with `boundElements: [{id, type: "text"}]`, and a text element with `containerId`, `textAlign: "center"`, `verticalAlign: "middle"`. The MCP's `label` shorthand is not valid in a `.excalidraw` file.
- Connectors are `arrow` elements with `points: [[0,0],[dx,dy]]`, `startBinding`/`endBinding` `{elementId, focus: 0, gap: 1}`, and both bound shapes list the arrow in their `boundElements`. `endArrowhead: null` gives a plain line.
- `roundness: {"type": 3}` rounds rectangles; `strokeWidth: 4` is the gate border; `strokeStyle: "dashed"` marks done. Everything else stays at defaults, which Excalidraw's `restore()` fills in.
- Keep `fontFamily: 2`. The hand-drawn font (`1`) is charming and unreadable at 16 px in a screenshot.
