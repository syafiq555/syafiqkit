# Pictures: rendered docs, answer pictures, and the module layout

Decisions and measurements from 2026-10-19, when the user asked to study `razorback16/cc-intelligent-ui` (commit `ec796e7`, 18/10) and then to take what was useful.

## What cc-intelligent-ui is {#study}

A Claude Code mod (MIT, v0.2.0, about 6,600 lines of TypeScript in `hooks/lib/*.ts`, 373 kit tests) that redraws every Claude answer as Typst-typeset PNG pictures in the terminal: Markdown, LaTeX via the `mitex` package, live Typst drawings (CeTZ, fletcher), links and commands as clickable rows under the pictures, a rendered plan-approval flow, and a Perl clipboard watcher that turns a mouse copy of picture cells back into text. macOS only; pictures draw in kitty, Ghostty, cmux and iTerm2 (after `/iui setup` adds a shell line), not tmux, Warp, Terminal.app or VS Code. It reads each terminal's config to tell light from dark, because a mod cannot see the OSC 11 answer. Commands: `/iui on|off|theme|size|grid|updates|details|setup`. It is all or nothing: there is no mode that keeps answers as text and draws only diagrams.

What it taught this mod (each verified here, not taken from its docs):

| Finding | How it was checked |
|---|---|
| A mod can be many ES modules; the host follows `import`s from the `modules` entry | Their mod validated and passed 373 tests on Claude Code 2.1.303; ours then loaded from `hooks/src/mod.js` with all tests green |
| Past an import, `$` goes only into a `function name($)` declaration | The host's own refusal text: "$ is passed to "registerCommand", a name bound to a function expression, outside the hook's own file" |
| One wrapper per `$` method keeps `validate`'s `calls:` line complete | Our line went from cut off to listing all 27 calls `(via hostX)` |
| State atoms redraw only their readers | Plugin-authoring reference; the band's spinner kept turning beside an open pane (user, live) |
| `$.ui.ask` shows Claude Code's own question box; tests answer it through `tool.call` on `AskUserQuestion` | Their `tests/plan.test.ts`, then ours |

## User calls {#calls}

| Call | Choice | Why |
|---|---|---|
| Which confirms move to Claude Code's question box | Discard only | Done and Ship keep the pane page because it shows the exact message that will be sent |
| Daily "new version" notice | Skip | Colleagues update with `claude plugin update`; it adds a network call per machine |
| Rendered Claude answers | Install `cc-intelligent-ui` separately (optional), never bundle it | 6,600 lines of someone else's active code; two installs would draw twice |
| Rendered `/task-docs` | Terminal only, with a Text view toggle and plain-text fallback | Desktop untested for large SVG |
| Lighter mode: text stays, pictures added | Mermaid, `$$` math, local images and video first frames, all four | The user wanted pictures without the full renderer |
| Mermaid colours | Follow Claude Code's theme (dark theme, transparent background) | The white card glared on a dark terminal |
| Tell Claude about the pictures | The mod adds a session section in terminal sessions only | Ruleset loads everywhere, including Desktop where nothing draws |
| Linux and Windows | macOS-first, stated in the README; no Linux work now | Conversion uses macOS `sips` with `ffmpeg` as fallback; a picture that cannot be made simply does not appear |
| Claude Code theme `auto` | Treated as dark | Right for dark terminals; a light terminal on `auto` gets faint pictures, accepted |

## Measurements {#measured}

- A real task doc rendered with their template in 0.13 s; tables, inline code and wrapped prose looked right at terminal width.
- Typst `{0p}` zero-pads page names to the page count (12 pages: `-01` to `-12`); `{p}` gives `-1` to `-12`.
- macOS automounts `/home`, so the host refuses an `Image` `{ file }` there as a network path.
- The first live `/task-docs` render went blank; sending pictures by file path instead of base64 is the fix tried, not yet confirmed live. A doc of 10 or more chunks also failed to read its pages (the `{0p}` bug) until `TYPESET_RENDER_VERSION` 2.
- Live, 2026-10-19 in iTerm2: under one answer the mermaid diagram, the typeset quadratic formula and a PNG all drew; the video preview did not, because `ffmpeg` cannot create the missing cache folder (fixed, unseen since). Pictures come after all of an answer's text: the host draws the text as one node.
- Format names in prose (`.mp4`, `.mov`) were once read as files in the current folder and drew dead Open buttons; a path now needs a `/` and a file name before the extension.

## Licences {#licences}

`hooks/render/` copies `md.typ`, `theme.typ`, `fonts.typ`, `themes/vscode` and `themes/claude-code` (MIT, cc-intelligent-ui), plus the Typst packages `cmarker` 0.1.6 (MIT) and `mitex` 0.2.7 (Apache-2.0); `NOTICE.md` lists them. The LGPL `cetz` packages were left out, so live Typst drawings inside a doc fail and fall back to the safe compile.
