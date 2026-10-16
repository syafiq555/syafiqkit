<!--LLM-CONTEXT
Status: 🔨 Built through 1.405.2 (Enhance button, band beside an open pane; unshipped, uncommitted); 1.399.0 on master (2026-10-15). 104 kit tests pass. Desktop pages seen working 2026-10-11 (overview, All diffs, file page, gallery); most later builds not yet seen live (decisions/live-checks.md). Not yet used by colleagues.
Domain: plugin-maintenance/mod
Gotchas (critical; full list in ## Gotchas below):
  - The host loads one file, so the source lives in `hooks/src/` and `hooks/build.sh` bundles it into `hooks/register.js`; `$` is never put in an object, and a save that fails to load keeps the OLD module running
  - A reload swaps the mod only when it reports "re-read from its folder" (directory source, measured 2026-10-16); otherwise only a new session loads a changed one
  - Older Claude Code versions are unverified against a `modules` key sharing `hooks.json` with the ruleset hook
Related:
  - ../project-docs/current.md (ESSENTIALS entry `{#mod-one-file}` extracts The Mod)
  - ../output-style-hook/current.md (shares `hooks/hooks.json`)
Last updated: 2026-10-16 (Enhance button, decisions/enhance.md; band beside an open pane)
-->

# Plugin Maintenance: The Mod

## Quick Start (read this first in next session)

**Where we are**: The mod is a Claude Code mod inside the main plugin: a band above the prompt, a `/sk` menu, a `/task-docs` reader, a `/changes` source-control view, an image gallery, session handoffs and an Enhance button that rewrites the draft prompt after a headless haiku read-summary run. Source is `hooks/src/` (folders `core`, `docs`, `git`, `handoff`, `prompt`, `views`, plus `mod.js`), bundled by `hooks/build.sh` into the single `hooks/register.js` the host loads. When a pane misbehaves, read `~/.claude/doc-pane-cache/mod.log` first.

**Immediate next actions (in order)**:
1. Commit and ship 1.405.2 (Enhance and the band beside an open pane) once the two live checks at the top of § Next Steps → Verify pass in a Desktop **New** session and a terminal session (`/sk` reads `mod v1.405.2`).
2. Run the newest older checks in `decisions/live-checks.md` (items 00000 and 0000: narrow panes at ~40 columns, terminal open items, the survey yield), then the rest of § Next Steps → Verify; a fix found there ships as a new version.

| Read | When |
|------|------|
| `decisions/builds.md` | What a numbered build (rows 1 to 28) does and what was seen live |
| `decisions/design-calls.md` | Why something is built the way it is, and which calls were the user's |
| `decisions/live-checks.md` | The step-by-step check for a build, and what the close-frame and reload investigations measured |
| `decisions/session-history.md` | Earlier sessions' user decisions and measurements |
| `decisions/enhance.md` | The Enhance button: research evidence, the study of 3,908 past prompts behind its rewrite rules, the user's calls, headless-run measurements |

**Key facts for cold start**:
- Tests: `claude plugin test .` from the repo root (`hooks/register.test.ts`); validate: `claude plugin validate .` (`--strict` fails on three standing warnings, so judge by the plain run).
- Off switch: `SYAFIQKIT_MOD=0` keeps the skills and drops the mod; `claude --safe-mode` drops everything.
- The scratch copy at `/tmp/mods-try-docs` is stale; the repo file is the source of truth.

**Gotchas that will trip you**:
- Write the file whole, or order edits so no call precedes its function: a failed reload keeps the old module live and the chat shows "reload failed, the previous version stays loaded".
- Mods need Claude Code 2.1.287 or later (Desktop 2.1.286); nothing draws in the VS Code panel or `claude -p`, in a cloud session, or on the phone (Remote Control draws only in the terminal on the Mac). Desktop draws in a local session started there; see the Gotchas row on Desktop windows.

---

## Overview

The user wanted the plugin's daily jobs (commit, commit and push, done, read a task doc, ship, shrink, refresh, merge, hand off) one press away, a rendered task-doc browser that costs the model no tokens, and a handoff that carries the whole session instead of one task doc. They later asked to stop opening VS Code only to review what Claude changed (a changed-files tree beside stacked diffs, with stage, unstage and discard) and to have e2e screenshots Claude takes show up in the pane instead of as a `/tmp` path. A mod is the only mechanism that can draw in the interface, so the plugin ships one. It runs with the user's permissions, which is why anything that acts for the user is a button and the risky ones show the exact message first.

---

## Architecture / Data Model

| Piece | What it does | Notes |
|-------|--------------|-------|
| Band above the prompt | Menu, Enhance, Docs, `Changes (N)`, `Images (N)` (only when the gallery has images), Commit, Done, Hand off; a handoff row with Resume and Dismiss; an Enhance row while a run is going or done | Stays drawn beside an open pane but drops its hotkeys then, because the pane owns `c`, `d`, `g`; `redrawBandAfterClose` brings them back after close (1.405.0; replaces the 2026-10-12 Desktop-only variant, reverted over the same key clash). "N selected / Send to Claude" is its own row (key `selected-row`). The Changes count excludes untracked files (cheap `-uno` status every 5 s); the pane lists them |
| Pane views | `menu`, `list`, `doc`, `decision`, `confirm`, `handoff`, `changes`, `change-file`, `change-all`, `discard`, `images` | One pane id (`doc-pane`), state in module variables |
| Changes pane | From 100 body columns: left a fixed-width tree (Staged first, Changes second; chevron collapses, title or folder name selects) under one toolbar, right the diffs of everything, Changes first | Below 100 columns the tree is a list, a file press opens its own page, and `All changes` is a separate screen with no toolbar. Status is re-read every 2 s, never overlapping (`state.polling`); `git diff HEAD --numstat --no-renames -z` is appended to the signature so a re-edit of a modified file redraws and doubles as the per-file diff cache key (`state.allSig`). Every open file covered by the focus is read, with no cap, one git call at a time through the serial `gitRun` queue (15 s timeout each). A finished read is stored even when a newer load overtakes it. Pages draw only about two screens around the scroll position (`windowedRows`, `state.allScroll` from the `ui.scroll` hook). Files over 400 lines end in `… N more lines · show` |
| Repos | `git/repos.js`: the session folder's repo plus subfolders one level down holding `.git` (skipping `node_modules`, `vendor`, dot folders), each normalised through `rev-parse --show-toplevel`; `Add repo` takes any path (`~/` works); `✕` hides, `N hidden · show` restores | Shown only when more than one repo is visible: one header per repo with its change count, and only the active repo's tree opens under its header (press another to switch, press the active one to fold). `state.changes` is always the ACTIVE repo's data; other repos' counts come from `-unormal` status every 10 s. Added and hidden state lives in module variables for the session only |
| Gallery | `show_image` tool (`$.tool.register`, `isDeferred: false`) adds absolute PNG paths under 12 MiB; the pane never opens by itself | 12 images at most, all stacked in one scrollable pane, newest first, each with its own Open in viewer (`uname` then `open`, `xdg-open` or `start`). Terminal: `Image` from `{ png: base64 }` up to 2 MiB. Desktop (`e.surface === 'desktop'` and `Svg` resolves): the PNG inside an `<image>` in an `Svg`.
  - `svgPicture` caps the width at 720 and the source at 90,000 characters.
  - A bigger PNG is drawn from a JPEG copy that macOS `sips` makes in a Desktop session only (`shrinkForDesktop`, steps `PREVIEW_STEPS`, into `~/.claude/doc-pane-cache/<hash>-<side>.jpg`).
  - Without `sips`, or if still too big, it shows the viewer button.
  - `All` stops drawing when the page is full, and each picture left over gets a "press to show it alone" button. The `show_image` description and return string say which pictures will not draw |
| Commands | `/sk` opens the menu, `/task-docs` the list, `/changes` the source-control view | Registered with `immediate: true`, so no model turn; all return `{}` |
| Handoff record | `<id>.json` per save under `~/.claude/handoffs/<hash of cwd>/`, with a `<id>.state` marker file (`claimed:<nonce>`, `dismissed`, `superseded`, `open`) | chmod 700 dir, 600 files, best effort; expires after 24 hours |
| Enhance | `prompt/enhance.js`: `$.prompt.read` → headless `claude -p --model haiku --permission-mode auto --disallowedTools Edit,Write,NotebookEdit --output-format stream-json --verbose` via `$.process.spawn` running `/syafiqkit:read-summary` → JSON → `$.prompt.fill`; fallback is two `$.model.complete` haiku calls (catalogue, then digest) marked `quick read` | `state.enhance.phase`: `idle`, `running`, `ready` (draft typed into meanwhile; Use it / Discard), `done` (Undo until the box changes). Each pull of the stream races a 300 ms watcher so Cancel and the 3-minute stop don't wait on output. Only a submit whose text is the draft, the filled text or the pending text ends a run. Spinner on `$.clock.every` (160 ms, skipped while a pane is open); its handle is `{ cancel }`. Evidence and calls: `decisions/enhance.md` |
| Diagram cache | `~/.claude/doc-pane-cache/<hash>.png`, valid once `<hash>.ok` exists | PNG rendered by a pinned `@mermaid-js/mermaid-cli@12.0.0` through `npx`, read back with `$.fs.read({ as: 'bytes' })` |

---

## Files

- `hooks/src/`, the source:
  - `core/`: constants (the only hex values, `DESKTOP_TONE`/`DESKTOP_DIFF`/`SYNTAX_TONE`), state, format, `run.js` (the serial `gitRun` queue) and `log.js` (`modLog`, `treeProblem`, `drawingSize`).
  - `docs/`: discovery, markdown, images, diagrams, reader, gallery.
  - `git/`: status parse and tree, diff parse with word marks, `syntax.js` (the diff colourer), actions, repos, controller.
  - `handoff/`: capture, store.
  - `prompt/`: `enhance.js` (the Enhance button: prompts, catalogue, headless stream, quick fallback, band row).
  - `views/`: band, pane (the tree checks and `refusedView`), pane-context, menu, list, doc, actions, changes (terminal, with `terminalDiffItems`/`allDiffItems`), images, plus `ui.js` (Desktop parts: chip, strip, meter, pageBar, mapBlock, `hoverScope`) and `desktop.js` (Desktop pages and `windowedRows`).
  - `mod.js`: the `register` wiring, always last.
- `hooks/build.sh` — joins `src/` into `hooks/register.js` (`--check` fails when stale; `.githooks/pre-commit` runs it). `register.js` is generated: edit `src/`, never the bundle
- `hooks/register.test.ts` — kit tests for commands, band, menu, confirm, handoff save/resume, /clear, off switch, decisions, reopen
- `hooks/hooks.json` — `modules: ["./register.js"]` beside the ruleset `hooks`
- `hooks/CLAUDE.md`: the mod's rules, host traps, debugging and what it runs (moved out of the root `CLAUDE.md` 2026-10-16; read it before mod work, since its automatic load on reading a `hooks/` file is unverified)
- `docs/ARCHITECTURE.md` §8: host-API traps; `docs/ARCHITECTURE-ESSENTIALS.md` `{#mod-one-file}`

---

## Task Status

Detail, evidence and what was seen live per row: `decisions/builds.md`.

| # | Task | Status |
|---|------|--------|
| 1 | Menu and band: one-press Commit, Hand off form, Done confirm | ✅ |
| 2 | Task-doc browser: filter, recents, size badges, pickable open items, decisions pages | ✅ |
| 3 | Mermaid as pictures | ✅ needs `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` in iTerm2 |
| 4 | Session handoff (haiku summary), Resume starts with `/syafiqkit:read-summary` | ✅ |
| 5 | Done confirm with optional hand-off afterwards | ✅ |
| 6 | README front door and `/commit push` wording | ✅ |
| 7 | Source split into `hooks/src/` and bundled; Wrap up renamed Done | ✅ |
| 8 | Handoffs and diagrams without `mkdir`/`mv`/`openssl` (Windows) | ✅ built, untested on Windows |
| 9 | Real-session soak, older-client check, `SYAFIQKIT_MOD=0` via shell and via settings.json | ⏳ |
| 10 | Decisions file over 40 KB flags its doc; Condense and Split on decisions pages | ✅ |
| 11 | Docs list under folder headers, five recents on top, over-limit flags | ✅ seen on an 8-doc repo only |
| 12 | `/changes`: tree plus stacked diffs, stage/unstage/discard | ✅ seen live except the last fix round |
| 13 | `show_image` gallery, one scrollable stack, Desktop `Svg` and `sips` copies | ✅ terminal and Desktop picture seen; ⏳ `sips` copy and 12-picture stack |
| 14 | `/changes` on big and multi-repo change sets | ✅ built; ⏳ not seen live |
| 15 | `/changes` hidden-staged hint and `Doc` / `Open doc` | ✅ built; ⏳ not seen live |
| 16 | `/changes` in Claude Desktop (narrow layout, `view` per group) | ✅ seen in Desktop |
| 17 | Desktop redesign of every pane | ✅ partly seen; ⏳ light theme, doc reader, handoff, confirm |
| 18 | Long pages draw only rows near the scroll position | ✅ Desktop seen; ⏳ real terminal |
| 19 | `mod.log` and tree checks | ✅ |
| 20 | Main-doc tag in `/task-docs` (1.389.0) | ✅ built; ⏳ not seen live |
| 21 | Stage all on the Desktop diff page, floating ↑ Top (1.390.0) | ✅ built; ⏳ press after the blank-page fix unseen |
| 22 | Syntax colours in `/changes` diffs (1.391.0) | ✅ built; ⏳ not seen live |
| 23 | Pinned bars on Desktop (1.392.0) | ✅ built; ⏳ not seen in Desktop |
| 24 | Copy and Open in editor on doc pages (1.395.0-1.395.1) | ✅ built; ⏳ not pressed in Desktop |
| 25 | Close crash fix (1.395.2), non-text diffs (1.396.0) | ✅ built; ⏳ not seen in Desktop |
| 26 | Terminal `/task-docs` open items (1.396.3 to 1.397.3) | ✅ hover group seen in 1.397.1; ⏳ rest unseen |
| 27 | Narrow panes: toolbars wrap (1.398.2) | ✅ built; ⏳ unseen live |
| 28 | Narrow lists (1.398.3) | ✅ built; ⏳ unseen live |
| 29 | Enhance button (1.400.0 to 1.405.2) | ✅ built; headless run, live steps, Desktop row and short prompts seen in Desktop 2026-10-16; ⏳ fixes after the /done review unseen |
| 30 | Band beside an open pane, hotkeys off while open (1.405.0); a band press switches the pane's view in place with no second `$.ui.open`, a press on the view already showing does nothing, and `Changes (N)` keeps counting beside non-Changes views | ✅ built; ⏳ unseen live |

---

## Key Technical Decisions

| — | see `decisions/design-calls.md` (34 calls: mod placement, main-doc marker, handoff storage and claims, Resume rules, button-vs-confirm, docs list layout, one bundled source tree, `/changes` toolbar, orders, discard, gallery, `sips` copies, windowing, diff caching, `Doc` button, Desktop colours and tokenizer, Desktop design, tree checks, multi-repo, CLAUDE.md chain) |

---

## Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| `returned an Input without an onSubmit function` | Every `Input` needs both `onInput` and `onSubmit` | Add both; the whole render is skipped otherwise |
| A PDF first page is blurry | `sips -s format png x.pdf` renders at 72 dpi (596 x 842) | `qlmanage -t -s 1100 -o <dir> x.pdf` writes `<dir>/x.pdf.png` at 778 x 1100; `pdfFirstPage` tries it first and falls back to `sips` |
| Closing the Desktop pane hangs or crashes with no `mod.log` fault | A render arriving after close drew `state.view = 'list'` (about 240k characters, past what Desktop draws); the cause is inferred, not reproduced | `paneView` and `ui.scroll` return `next` while `state.isOpen` is false, so every opener must set `isOpen = true` before `$.ui.open`; Desktop's own errors are in `~/Library/Logs/Claude/main.log` (`ui_press failed`) |
| `state.stop is not a function` | `$.clock.every` returns `{ cancel }` | Call `timer.cancel()` |
| `"/docs" refused: it is the user's /anthropic-skills:docs` | A command name collides with a skill, and that throw skips the rest of `session.start` | Named `task-docs`; `registerCommand` catches the refusal |
| `reload failed, the previous version stays loaded: $ is passed to "openPane", which is not a function declared at the top of this file` | An edit sequence referenced a function before it was written | Declare helpers above `register`; save the file whole |
| Handoff not offered after `/clear` | The session's own handoff is excluded and module state survives `/clear` | `classic.SessionStart` with source clear/resume/fork resets it |
| Pictures show `Diagram not drawn here` in iTerm2 | Claude Code classes iTerm2 3.7.3 as `kittyGraphics=no` though it answers the query | Start with `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` |
| Every test fails with `hooks module did not load … $ itself is put in an object` or `$.env.get takes a literal name` | A context object holding `$`, or `$.env.get(name)` with a variable | Pass `$` as its own argument; spell each variable name out |
| Pane draws for a second then goes blank with real data, kit green | A drawn tree the host refuses or fails on (thousands of rows, or two elements sharing a `key` such as the tree's and the diff column's `staged-gap`); the kit validates the tree but did not reproduce it. Desktop also refuses a hover scope over 64 characters | Window long lists (`windowedRows`) rather than capping them. Keep every key unique among siblings. Hash long names into hover scopes (`hoverScope`). `views/pane.js` now catches the key and scope cases and says so on screen; `mod.log` has the reason |
| Whole module refuses to load after an edit that only reshuffled calls | `$` passed to a callee picked by a ternary or a wrapper (`(cond ? a : b)($, x)`, `thenAfterGit(fn)`) | Call each function by its literal name, one branch per call |
| `Image` shows `Image not drawn here` and `{ file, format }` was the source | In iTerm2 pictures need `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1`; the variable was unset when `{ file }` was tried, so the source itself is not proven unsupported | Gallery uses `{ png: base64 }` like the diagrams; the variable is in `~/.claude/settings.json` `env` |
| A `Box` with a `width` inside a row is narrower than asked and its neighbour's text overlays it | Flex shrink; a plain `Button` also adds padding, so a row sized to the box overflows | `flexShrink: 0` on the fixed column, explicit width on the other, one element per row |
| `/changes` lists file names with no diff bodies on a big change set while Claude is editing | A load that a newer poll cancels before it stores anything restarts forever; or, after a repo switch, an old repo's load writes into the new repo's cache (keys are `plane:path`, not repo-qualified) | Store each finished batch; capture the repo root and generation at load start and drop results when the root changed; `resetRepoView` bumps `diffGen` |
| Band, toasts and `/sk` do nothing in Claude Desktop, though `show_image` answers and the `syafiqkit:` skills list | The Desktop window is a view onto a terminal session (`~/.claude/sessions/<pid>.json` says `entrypoint: "cli"`; its `bridgeSessionId` is the id Desktop shows); the mod runs in the terminal process and draws only there, and Desktop sent `/sk` to the model as text. Cost one hour of this session | Test in a session started with New in Desktop; a probe there wrote `surface: "desktop"` for `AbovePrompt`, so the band is raised. `Image` and `Raster` are terminal-only, `Svg` Desktop-only |
| In Desktop the first click after a page change does nothing, and `< Back` seems dead | The pressed button leaves the tree when the page swaps, so nothing in the pane has focus and the next click only gives it focus; stripping `autoFocus`, hotkeys or boxed-button styling on Desktop did not help | Keep `autoFocus` on each page's first button (resolved 2026-10-11) |
| In Desktop the stacked diff page sits on `Diffs: starting` or `Reading diff…` and Back does not respond, kit green | Seen only in the user's Desktop: a `Promise.all` batch of 8 `$.process.run` diff reads never returned; later the page kept showing an old drawing while reads finished in about 20 ms each, meaning Desktop had stopped accepting the growing page | All git calls go through the serial `gitRun` queue. Pages are windowed (row 18). The file page once sat on "Reading diff…" at 103k characters until it was windowed too |
| Long diff lines overlap the next row in Desktop | A row of fixed height 1 holding a line that wraps; nested `Text` ignores `wrap: 'truncate'` | Desktop rows have no fixed height and an estimated one (`DESKTOP_WRAP_CHARS`); the terminal hard-wraps into one-row pieces |
| Mod seems dead anywhere | A refused or failed load leaves no trace in the chat | Read `~/.claude/doc-pane-cache/mod.log` first (refused pages, git failures, `ui.fault`). Then `claude plugin test` from a folder with no mod (can mods load at all), the `mods active` line in `/plugin`, `claude --debug` for `hooks module <name> not loaded:` with the reason |
| No way to drive the Desktop pane from Playwright | Claude Desktop ships with the `EnableNodeCliInspectArguments` fuse off, so no inspector attaches (judged 2026-10-11) | Test Desktop by eye in a New session, with `mod.log` for the silent failures |
| Test fails `no implementation for turn.start` | A stub is needed for every host call; `turn.start` must return `{ turnId }`, `prompt.submit` must return `{ text }` | See `docs/ARCHITECTURE.md` §8 |

---

## Next Steps

**Verify**
- [ ] Band beside the pane (row 30), in a Desktop **New** session without `/reload-plugins`: open `/changes`, check the band stays beside the pane and pressing `c` acts on the pane, not Commit; close with ✕, `< Close` and Esc, and after each check Commit's `c` works again. Then pick items in a task doc and press the band's Docs, then Changes: the view switches without the pane flashing or refocusing oddly, and pressing Docs on the Docs list keeps its filter. The blank expanded frame after close is Desktop's own bug (it stayed blank with no mod redraw, 2026-10-12); no code change for it.
- [ ] Enhance (row 29) after the review fixes: press Cancel during a long silent step (a sub-agent) and run `ps aux | grep "claude -p"` to see the child is gone; send another message (or let a task notification arrive) mid-run and see it keep going; press Enhance with a pane open and see the row update; check Undo survives the fill (whether the host fires `prompt.edit` for the mod's own `$.prompt.fill` is unmeasured).
- [ ] Rows 27 and 28 live at ~40 columns, Desktop and terminal (`decisions/live-checks.md` item 00000). Whether a Desktop Pane render carries `bodyColumns` is unmeasured; logging `e.props.bodyColumns` once from a Desktop session would say whether Desktop could use the terminal's width switch. Left as polish: the Desktop gallery strip's buttons can squeeze the image name to nothing; terminal menu hints truncate to fragments. From the 1.399.0 release review, unmeasured: `windowedRows` gets a fixed `topRows` (3 for the single-file page, `LIST_TOP_ROWS` for the list) while the toolbar above it can now wrap to 2 rows at ~40 columns, so spacers or a pinned header may land 1 to 2 rows off; Desktop open items are a Button around a dim Text, and Text inside a Button loses its colour, so the dim on unpicked items may vanish.
- [ ] 1.397.3 (row 26) in a new terminal session: the five checks in `decisions/live-checks.md` item 0000. A true full-item highlight for keyboard focus is not possible (the host lights one line); if the extra Tab stops (one per row, 3 per long item) annoy, drop the clickable continuation rows. The doc-list gauge mixes units (small docs show KB against the 40 KB limit, measured docs show lines against 300) and drops the old size figure for measured docs.
- [ ] Syntax colours (row 22) live in a Desktop New session and in iTerm2: rows look like the native panel; a tall window on a long dense file stays drawn (the kit measured a 200-line dense PHP page under the 95k warning at its default 60-row window only); light theme (colours are fixed for dark; on a light terminal the yellow type and grey comment colours on a light row may be hard to read)
- [ ] Pinned bars (row 23) live in a Desktop New session, in order: (1) the absolute Box draws at all; (2) on a long All changes page the top row and file bar stay put and the file bar names the file actually under it, also deep in a 20-file page (Desktop's wrap estimate drifts, so a wrong name there means the threshold needs measuring); (3) a pinned Next ›, Back or Stage all pressed deep in a page lands at the top of the new view, not mid-page (`goto` resets only the mod's offset; if the host keeps it, call `$.ui.scroll` to the start in `goto`, which the kit cannot press-test); (4) a pinned `/task-docs` folder fold keeps you at that folder; (5) how tall the pinned block is in a narrow window, and whether `#1e1e1e` matches the pane background; (6) whether Home/End fire `ui.scroll`
- [ ] Pinned `/task-docs` Filter (user chose to pin it, 2026-10-12): two `Input`s share `state.filter`; check live that typing in the pinned one keeps focus across the redraw and the other box shows the same text. Terminal pinning was declined by the user (Desktop only; ↑ Top covers the terminal)
- [ ] ↑ Top (row 21) live: does Desktop draw a `position: 'absolute'` Box in the Pane (first use in the kit), does the press scroll to the top, does it cover a diff line's end rather than a button, and is a redraw per wheel tick in the terminal noticeable on a long list. Fallback if it doesn't draw: a page-bar button, which scrolls away on Desktop
- [ ] Desktop, in a session started with New: `/sk` and the other mod commands (not known to be intercepted there; the docs are silent), the band's buttons opening a pane, and whether a small PNG draws through `Svg` (nested `<image>` data URI; the docs do not say it is allowed, and a failure would be an empty box with the viewer button beside it). Also whether `tool.call` carries the surface, so `show_image` could tell Claude where the user will see the picture
- [ ] Terminal windowing in iTerm2 (row 18, kit only):
  - Does keyboard scrolling (PgUp, arrows) fire `ui.scroll`?
  - Do rows keep drawing past two screens?
  - Can a file's `+` far down be reached by Tab? Off-screen buttons are not in the tree.
  - Do wide characters (emoji, CJK) only clip at the edge?
- [ ] Desktop `/changes` still unseen: the folder `view`, a fully staged tree, an empty new file, a new file over 256 KB, light-theme contrast for `DESKTOP_DIFF` and `DESKTOP_TONE`, a wide window with long markdown lines (estimate blank band), and the `sips` copy of a big gallery picture
- [ ] Linux: `sips` absent, so the gallery shows the viewer button and `mod.log` says "no smaller copy"; never run
- [ ] The docs list in autorentic (106 task docs, Desktop): it drew blank in 1.388.0–1.389.0 (`mod.log`: "pane list (desktop): about 240k characters", about 1.45k per row). 1.390.0 folds folders when there are over 40 task docs (`LIST_FOLD_FROM`), folds Skills on Desktop, and windows the list (`LIST_TOP_ROWS`). Check it draws, a folder opens, and opening several folders stays under the limit. The filter and over-limit pages are still unwindowed (filter caps at 40)
- [ ] Other panes in Desktop, ranked by the product review's risk: the gallery (12 `Svg` pictures), the doc reader's long `Markdown`, the handoff form and confirm pages (their `autoFocus` sits on an Input or on Cancel, so the first click on Send or Discard may be lost)
- [ ] The gallery stack in iTerm2: does the pane scroll with 12 tall pictures, do Close and Clear stay reachable after scrolling (Esc closes), and does Clear want a confirm
- [ ] Per-image captions: one caption per call is stored on every image in it, and a later call without a caption replaces it
- [ ] Resume under bypass permissions, band hotkeys while typing, a draft overwritten by `prompt.submit`, a submit that lands mid-turn
- [ ] One Claude Code older than 2.1.287 against the shared `hooks.json`; the ruleset hook is the first thing to check if a colleague reports it missing
- [ ] `SYAFIQKIT_MOD=0` under `env` in `settings.json`: does it hide the band? The shell route did (checked live 2026-10-10, session started from the home folder; the band showed in a normal session from the plugin folder, so the mod loads)
- [ ] Windows run: handoff save, Resume, diagrams (`npx` must be on PATH); written without shell calls but never run there; `nameOf` in `git/status.js` splits on `/` only, so a Windows path shows whole
- [ ] `/changes` last fix round live: folder select then `+ Stage folder`, unstaging a staged rename (both paths now passed), and `-uall` status cost in a repo with many untracked files
- [ ] Whether Claude Code asks the user to allow `mcp__syafiqkit__show_image` on its first call (it did not on 2026-10-10 in a bypass-permissions session), and the Open in viewer button on the user's Mac
- [ ] `/changes` hidden-staged hint (section, folder and file focus) and `Doc` / `Open doc` (also on the collapsed one-line rows; reader's diff button reads `Doc diff` when opened from `/changes`) live: not seen. Unbuilt: a deleted doc shows the button and opens an unreadable page; no 'Opening…' state on a slow doc
- [ ] `unstagePaths` before a first commit (`git rm -r --cached`) for a file that is staged and then modified again (`AM`): not run
- [ ] Editor-free diagnostics (the user opened VS Code for errors; 2026-10-10): with VS Code quit, a Read of a scratch `.js` file returned TypeScript errors, but PHP after the quit and an Edit that adds an error were not retried (the first run's edit error was not reported), and an undefined function call was never flagged. If errors should be visible to the user, the Changes pane has no diagnostics view and the mod host API has no language-server call

- [ ] Wrap-up handoff Message live (built 2026-10-10, unseen): Done → tick the box → type a Message → Enter. The dim line should keep showing 'Next session starts with: …' after the box clears. Also that a Done turn ending on a question defers the save (at most 3 times, any answer ending in `?` or empty) and an Esc-aborted turn still saves
- [ ] Handoff Message cause not reproduced: the kit cannot clear an `Input` on Enter, so which callbacks the real host fires on Enter (`onInput('')` before `onSubmit`?) is unknown; if the dim line shows 'No message' after typing, `onInput` is clearing state

**Decide**
- [x] Handoff after Done: an aborted turn saves anyway; a turn that ends on a question waits for the one that finishes (user, 2026-10-10)
- [x] Commit as three commits by version (1.373.0 is the other session's `uiux` work); ship after the live checks above

**Later**
- [ ] Colourer rough edges (row 22), from review: an apostrophe in Vue/HTML text or YAML/shell prose opens a string to the end of the line; a multi-line string or Python docstring is coloured only on its first and last lines; a regex literal holding a quote swallows the rest of the line; a comment or keyword inside the changed-word mark is low contrast (comment grey on `addedWord` is about 1.7:1)
- [ ] Surface silent caps in the list: discovery stops at 180 task docs (`MAX_ENTRIES * 3`) and filter matches at 40 with the header still saying `MATCHES (40)`; the first symptom would be a missing doc
- [ ] Render check at 80 columns with a recent heavy doc (status plus warning is about 55 characters) and a long folder name (the folder button label is not clipped); `TASK DOCS (n)` counts all docs while folder counts exclude the five recents, so the header says `· 5 listed above`
- [ ] Shrink picker no longer names which decisions file is oversized (`heavyNote` shortened); collapse state lives for the whole mod session and is keyed by folder name
- [ ] Main-doc tag (row 20) review leftovers, 2026-10-12: a doc opened from `/changes` goes through `docAt` (`git/controller.js`), which re-runs `discover` without `readDocMeta`/`measureHeavy`, so a later trip to the list may show no `main doc`, status or size flags (pre-existing for status, unconfirmed); `readDocMeta` now reads every task doc in full on open, and docs over 8 KB twice (read only the head, or share the text, if opening feels slow); two hub docs in one folder both get the tag while the folder line names the first
- [ ] Count a doc's decisions bytes toward the size badge (the shrink skill treats the set as one thing)
- [ ] Re-read open decision pages on change, as the main doc already is
- [ ] Dart and Vue have no Claude Code language-server plugin (only `php-lsp` and `typescript-lsp` are installed), though `dart` and `vue-language-server` exist on this machine
- [ ] Optional automatic digest-only handoff on `/clear` (declined for now: it writes files unasked)
- [ ] An edit to a file that is only untracked (`??`) changes neither the status line nor `numstat`, so the poll sees no change and its diff stays old until you press it (a press forces a re-read); folding `$.fs.stat` size and mtime of `??` entries into the status signature would catch it
- [ ] The band's `Changes (N)` still counts only the repo at the session folder; sum `repoCounts` once repos are known, or label it
- [ ] One `git diff` for many paths per batch, and backing the poll off while a diff load runs, were planned for 1.386.0 and not built; measure on a 200+ file tree first
- [ ] Narrow layout still loads the default focus's diffs on open though only `All changes` draws them
- [ ] Narrow layout (under 100 columns) has no toolbar and no tree-plus-diff: a file press opens its own page with Stage/Discard; add the toolbar there only if narrow use is real
- [ ] Nested untracked repos appear as `sub/`: the tree row has an empty name, Discard runs `git clean -f` without `-d` and still toasts success, and its diff note reads 'cannot be read'
- [ ] With every file read and one serial git queue, a click's own git call (Stage, a file page) waits behind the remaining background diff reads; at about 20 ms each that is seconds on a 200-file set. A foreground lane in `gitRun` would fix it; measure first
- [ ] Finding one file in a 200-file set on the narrow terminal and Desktop All diffs: the collapsed index is gone and nothing replaces it but scrolling and folding sections
- [ ] `sips` copies in `~/.claude/doc-pane-cache/*.jpg` are never pruned; Clear could delete them
- [ ] A size-based "could not be drawn" fallback once Desktop's real limit is known (size is only logged today)
- [x] 2026-10-12 (1.393.0): a 313-file set with 60-line dense diffs made the `w-below` spacer taller than 10,000 rows, which the host refuses ("Box prop height must be a finite number between 0 and 10000"), so the whole pane failed. `windowedRows` now draws spacers in blocks of `SPACER_MAX_ROWS`. The "about 100k characters" log lines at 10:43 and 12:07 local predate 1.390.0 to 1.392.0 (shipped 12:27), so whether the size warnings recur on 1.393.0 is still to be seen in a new Desktop session. Desktop's own `symbolic-ref origin/<branch>` errors (code 1) are its probe on repos whose `origin/<branch>` is a plain ref, not a mod fault.
- [ ] `/task-docs`: a folder with its own `current.md` lands under a folder named `tasks` rather than its own (latent; only `project-docs` has one in beacon-mart); filter matches don't sort the main doc first
- [ ] Discard all on the diff page: not built on purpose. It needs its own confirm naming the file count and the untracked files `git clean` will delete, since unlike Stage all it can't be undone

---

## Last Session (2026-10-16)

The user brought a friend's "Enhance prompt" mod idea and asked for haiku research; the build went through nine versions in one sitting, each tried live in Desktop or iTerm (row 29, `decisions/enhance.md` for every call and measurement). `/done` review found Cancel and the timeout blocked on a silent child, edits still allowed in the headless run, no secret rule on facts, the `~/.local/bin` fallback unreachable, a ticker never cancelled (`$.clock.every` returns `{ cancel }`) and a frozen row beside an open pane; all fixed in 1.405.2 with 4 new tests. Mid-`/done` the user reported Enhance stopping when another message arrived: the `prompt.submit` hook cancelled on any submit, now only on the draft itself. A parallel session (syafiqkit-f1) built row 30, the band beside an open pane, in `band.js` under an explicit hand-over; its `/done` review found band presses re-running `openPane` on the already-open pane (a second `$.ui.open`, picks and filter wiped) and a frozen `Changes (N)`, both fixed with 2 tests. The same session moved the mod's rules from the root `CLAUDE.md` into `hooks/CLAUDE.md`. The CHANGELOG carries both as one unshipped 1.405.2 entry. Nothing is committed.
