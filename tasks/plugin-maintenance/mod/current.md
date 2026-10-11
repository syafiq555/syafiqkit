<!--LLM-CONTEXT
Status: 🔨 1.384.0–1.386.0 on master (1.386.0 unseen live). 1.388.0 committed:
  - The Desktop redesign (rows 16–17).
  - Windowed Changes pages on both surfaces (row 18).
  - Gallery smaller copies via `sips` (row 13).
  - `mod.log` and tree checks (row 19).
  - 60 kit tests pass.
  Desktop pages were seen working in the user's Desktop 2026-10-11: overview, All diffs, file page, gallery. Terminal windowing has not been run in a real terminal. Not yet used by colleagues.
Domain: plugin-maintenance/mod
Gotchas (critical — full list in ## Gotchas below):
  - The host loads one file, so the source lives in `hooks/src/` and `hooks/build.sh` bundles it into `hooks/register.js`; `$` is never put in an object, and a save that fails to load keeps the OLD module running
  - Older Claude Code versions are unverified against a `modules` key sharing `hooks.json` with the ruleset hook
Related:
  - ../project-docs/current.md (ESSENTIALS entry `{#mod-one-file}` extracts The Mod)
  - ../output-style-hook/current.md (shares `hooks/hooks.json`)
Last updated: 2026-10-11
-->

# Plugin Maintenance — The Mod

## Quick Start (read this first in next session)

**Where we are**: The mod is a Claude Code mod inside the main plugin: a band above the prompt, a `/sk` menu, a `/task-docs` reader, a `/changes` source-control view, an image gallery and session handoffs. Its source is `hooks/src/` (folders `core`, `docs`, `git`, `handoff`, `views`, plus `mod.js`), bundled by `hooks/build.sh` into the single `hooks/register.js` the host loads. `claude plugin validate .` passes and `claude plugin test .` passes 60 tests. 1.384.0–1.386.0 are on master.

1.388.0 (committed after the other session's `setup-playwright` 1.387.0):
- The Desktop redesign of every pane (row 17).
- `/changes`, All diffs and the file page drawing only the rows near the scroll position, on both surfaces (row 18).
- Gallery smaller copies via macOS `sips` (row 13).
- `~/.claude/doc-pane-cache/mod.log` plus tree checks (row 19).

The changelog entry must name the new `sips` call and the new writes (picture copies, `mod.log`). When a pane misbehaves, read `mod.log` first.

**Immediate next actions (in order)**:
1. **Terminal windowing, run in iTerm2** (row 18). In a repo with 100+ changes, open `/changes` wide and narrow All diffs.
   - Scroll with the wheel and with PgUp/arrows. Does the keyboard fire `ui.scroll`?
   - Check that rows keep drawing past the first two screens.
   - Try to reach a file's `+` far down by keyboard alone.
   - Then commit by version, keeping the other session's files out (`git status --short` first).
2. Open `/task-docs` in the 106-doc repo (the user's first screenshot came from it) and compare the header count with `find tasks -name current.md | wc -l`. Run it for real: `claude plugin update syafiqkit@syafiqkit`, restart WITHOUT `--plugin-dir /tmp/mods-try-docs` (a second copy collides on `/sk` and `/task-docs`), and with `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` in iTerm2 (now set in `~/.claude/settings.json` `env`).
3. Desktop, in a session started with **New** there (a Desktop window onto a terminal session shows nothing and proves nothing):
   - Check the panes not yet seen: the docs list in the 106-doc repo, the doc reader, the handoff form, the confirm pages, and `/sk`.
   - Check that the first click after a page change lands and that nothing blanks.
   - Check the gallery's big picture now draws from its smaller copy.
   - Scroll a stack of several tall pictures in iTerm2 too.
4. Check the paths only the kit exercised: Resume under bypass permissions, band hotkeys while typing in the prompt, whether `prompt.submit` overwrites a half-typed draft, and a submit that lands mid-turn.
5. Test one Claude Code older than 2.1.287 against the shared `hooks.json`.

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
| Band above the prompt | Menu, Docs, `Changes (N)`, `Images (N)` (only when the gallery has images), Commit, Done, Hand off; a handoff row with Resume and Dismiss | Hidden while the pane is open; shows a send bar when items are picked. The Changes count excludes untracked files (cheap `-uno` status every 5 s); the pane lists them |
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
| Diagram cache | `~/.claude/doc-pane-cache/<hash>.png`, valid once `<hash>.ok` exists | PNG rendered by a pinned `@mermaid-js/mermaid-cli@12.0.0` through `npx`, read back with `$.fs.read({ as: 'bytes' })` |

---

## Files

- `hooks/src/`, the source:
  - `core/`: constants (the only hex values, `DESKTOP_TONE`/`DESKTOP_DIFF`), state, format, `run.js` (the serial `gitRun` queue) and `log.js` (`modLog`, `treeProblem`, `drawingSize`).
  - `docs/`: discovery, markdown, images, diagrams, reader, gallery.
  - `git/`: status parse and tree, diff parse with word marks, actions, repos, controller.
  - `handoff/`: capture, store.
  - `views/`: band, pane (the tree checks and `refusedView`), pane-context, menu, list, doc, actions, changes (terminal, with `terminalDiffItems`/`allDiffItems`), images, plus `ui.js` (Desktop parts: chip, strip, meter, pageBar, mapBlock, `hoverScope`) and `desktop.js` (Desktop pages and `windowedRows`).
  - `mod.js`: the `register` wiring, always last.
- `hooks/build.sh` — joins `src/` into `hooks/register.js` (`--check` fails when stale; `.githooks/pre-commit` runs it). `register.js` is generated: edit `src/`, never the bundle
- `hooks/register.test.ts` — kit tests for commands, band, menu, confirm, handoff save/resume, /clear, off switch, decisions, reopen
- `hooks/hooks.json` — `modules: ["./register.js"]` beside the ruleset `hooks`
- `docs/ARCHITECTURE.md` §8 — host-API traps; `docs/ARCHITECTURE-ESSENTIALS.md` `{#mod-one-file}`; `CLAUDE.md` §The Mod

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Menu and band: one-press Commit, Hand off form, Done confirm | ✅ |
| 2 | Task-doc browser: filter, recents, size badges, open items pickable, decisions on their own page; list layout is task 11 | ✅ |
| 3 | Mermaid as pictures | ✅ needs `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` in iTerm2 |
| 4 | Session handoff (haiku summary), Resume starts with `/syafiqkit:read-summary` | ✅ |
| 5 | Done confirm with optional hand-off afterwards | ✅ |
| 6 | README front door and `/commit push` wording | ✅ committed (c2c081f, 1.374.0) |
| 7 | Source split into `hooks/src/` and bundled; Wrap up renamed Done | ✅ |
| 8 | Handoffs and diagrams without `mkdir`/`mv`/`openssl` (Windows) | ✅ built, untested on Windows |
| 9 | Real-session soak, older-client check, `SYAFIQKIT_MOD=0` via shell and via settings.json | ⏳ |
| 10 | A decisions file over 40 KB (`DECISION_MAX_BYTES`) makes its task doc heavy, whatever `current.md`'s size; the row shows `⚠ decisions <size>` (or `⚠ N decisions, max <size>`, no file name since 1.382.0), shrink request asks for a split with `current.md` as router; each decisions page has Condense ⚠ (`dec-condense`, `k`) and Split ⚠ (`dec-split`, `t`, not `s`: Send is `s`), both on haiku, both ask first; Cancel returns to the calling view (`confirm.back`), Send sets `reopen`; doc Shrink asks task-summary to judge (1.376.0) | ✅ four tests added |
| 11 | Docs list shows each doc once: task docs under folder headers (`▾ tenant (9)  ⚠ 4`, press to collapse, rows indented, no per-row folder column), the five most recent on top with folder and status and removed from their folder, over-limit docs flagged inline, the old NEEDS SHRINKING list is one `⚠ N over the size limit · show` button opening the `heavyOnly` view, blank line and bold header per section (1.382.0) | ✅ one test added; seen live on an 8-doc repo only |
| 12 | `/changes`: tree plus stacked diffs with line numbers, red/green rows and changed words marked; stage, unstage per file, folder, section and all; discard asks first; opens on Changes when anything is unstaged, otherwise on both; a doc and a decisions page have a Changes button (diff against HEAD) (1.384.0) | ✅ built, kit tests for the list, file page, discard, folder and section focus, default focus; seen live except the last fix round |
| 13 | `show_image` gallery: PNGs Claude names appear under a band `Images (N)` button; pane never opens itself (1.384.0). One-at-a-time Prev/Next replaced by one scrollable stack, newest first, Open in viewer per image, Clear and Close on top; Desktop draws through `Svg` with numbered chips, and big pictures from a `sips` copy | ✅ pictures drew in the user's iTerm2 after `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` went into `~/.claude/settings.json`; the Desktop `Svg` picture drew for the user 2026-10-11 ("now image looks no issue"); ⏳ the `sips` copy built and measured offline (a 2000-px screenshot came out at 59k characters at 720 px), not seen in Desktop; the terminal stack with 12 tall pictures not seen |
| 14 | `/changes` on big and multi-repo change sets: diffs read only for the focused files and kept per file; nested repos listed as stacked groups with per-repo stage, unstage, discard; `Add repo` and `✕` for the session (1.386.0) | ✅ built, 7 kit tests added (focus-only reads, refocus re-read, Add repo field, nested repos with per-repo cwd, remove keeps files, remove-active moves on and the last repo cannot go, no headers for one repo), two review rounds applied; ⏳ not seen live |
| 15 | `/changes` says what it hides: under `Changes only` a line `Staged Changes (N) hidden · show` (section, folder or file focus); a changed doc-type file (task doc, decisions file, `CLAUDE.md`, `docs/*.md`, `.claude/rules/*.md`) has a `Doc` button (`Open doc`, `o`, on its file page) that opens the task-docs reader, and `< Back to changes` returns to the same list or file page (1.386.0) | ✅ built, 3 kit tests, correctness and product review applied; ⏳ not seen live |
| 16 | `/changes` in Claude Desktop (narrow layout, about 700px): file rows are label buttons with a separate coloured status letter; each section and folder gets a `view` button beside its name (the name still folds) that opens a page of just that group's diffs, and each folder row a `+`/`−` button that stages or unstages the folder; the stacked page reads diffs one at a time, untracked files last and through `git diff --no-index`, with a `Diffs: N of M read` line and `Reading diff…` placeholders; Desktop draws dark hex red/green rows (`DESKTOP_DIFF`). The 150-row cap and the collapsed rows are replaced by row 18 | ✅ the user saw the tree, `view`, diffs and Back work in Desktop |
| 17 | Desktop redesign, all behind `isDesktop(e)` so the terminal is unchanged:<br>• native primary/dismiss buttons and tinted section strips with count chips<br>• a clickable change map (log-weighted blocks, hover lights the file row)<br>• doc rows with a size gauge<br>• `/sk` grouped under SHIP WORK / DOCS / SESSION with an "asks first" chip<br>• confirm and handoff with primary Send/Save<br>• gallery picture chips<br>• `view ›` buttons<br>• the folder path shortened to its last two parts | ✅ the user saw `/changes`, the menu, the docs list and the gallery in Desktop 2026-10-11; ⏳ light theme, doc reader, handoff form and confirm pages unseen |
| 18 | Long pages draw only the rows near the scroll position, Desktop and terminal: the `/changes` overview list, All diffs and the file page.<br>• Every file is open and read (no "N files collapsed", no 40/100-file caps). Hide/Show diff (Desktop) or ▾ (terminal) folds one; showing a file with no diff reads it.<br>• Desktop rows: one line high in the lists; diff lines wrap with a height estimated from length (`DESKTOP_WRAP_CHARS` = 140, biased low: too low only jumps, too high can blank the bottom).<br>• Terminal diff lines are hard-wrapped into one-row pieces, so heights are exact.<br>• The window spans half a screen above and below; the scroll hook redraws after a third of a screen. | ✅ Desktop seen working on the user's 68-file beacon-mart (scroll, file page, long markdown); 3 kit tests (45 files in the terminal, 200 on Desktop, Hide/Show); ⏳ not run in a real terminal |
| 19 | Debug log and tree checks:<br>• `modLog` writes `~/.claude/doc-pane-cache/mod.log` (last 300 lines, re-read before each append so two sessions don't overwrite each other, consecutive repeats skipped).<br>• It logs oversized Desktop pages, failed or timed-out git calls, `sips` failures and `ui.fault`.<br>• A tree with a repeated sibling key or a hover scope over 64 shows "This page could not be drawn here" on Desktop, with Close and Changes. | ✅ 2 kit tests (repeated key shows the page and logs; oversized page still draws and logs) |

---

## Key Technical Decisions

| Decision | Reasoning |
|----------|-----------|
| Mod lives in the main plugin | The user's call, over the recommendation of a separate opt-in plugin. Mitigations: `SYAFIQKIT_MOD=0`, a changelog line naming the version floor |
| Handoff is a file per project under `~/.claude`, not `$.store` and not the repo | `$.store` gets and sets are not atomic across sessions; `.claude/handoffs` was not gitignored in the repo checked |
| A claim writes `claimed:<nonce>` to `<id>.state` and reads it back | The host's `$.fs` has no move or delete, so the atomic `mv -n` was dropped for Windows support (the user's call; a Windows-off alternative was built and reversed). Two sessions pressing Resume at the same instant can both win; a failed send writes `open` back |
| A session saving a second handoff supersedes its first; its own handoff is hidden until `/clear` | Otherwise old test handoffs resurface; `/clear` is the case the handoff exists for, and module state survives it |
| Summary comes from haiku over a trimmed transcript, not `$.model.fork` | Fork always runs the session's own model and a cache belongs to one model. Transcript is messages only, 60,000 characters, 1,500 per turn |
| Resume always begins `/syafiqkit:read-summary`, with the topic when no doc exists | The user: that line is mandatory. The paste is rebuilt at press time with live git state and the confirm shows the same text |
| Commit is one press; Hand off opens a one-line form (Enter saves, message optional); Done, Ship, Merge, Shrink, Refresh, risky Resume ask first with an effect line, and those confirms can add a hand-off after the turn | A wrong click on Wrap up happened; Commit is reversible; the user asked for an optional message |
| Only `current.md` is listed; decisions open on their own page with Prev and Next | The user: decisions are not needed in the list, and inline was crowded |
| A doc appears once in the list; a recent doc leaves its folder, an over-limit doc stays in its folder with a yellow `⚠` | The user: the list was cluttered and repeated (one doc up to three times, folder name on every row). Research (four rounds) found no source stating a rule for an item in two sections, a collapse default or a row threshold; only Linear and MUI sticky group headers, Notion's per-group toggle and GitHub Projects' one-group-per-item are verified. Judgement, so folders start open (user answered neither option; one constant to flip) |
| Scope column kept on recent rows, filter matches, the over-limit view and CLAUDE.md rows; dropped where a folder header or group name already says it | Those rows have no header above them. Warning text comes first in a row's tail so a narrow pane clips the status, not the warning |
| Tables become bullets in the reader | `Markdown` draws wide tables badly in a narrow pane |
| One source tree bundled into one file, in folders by concern | The host takes one module path and refuses `$` in an object, so fragments are plain top-level code joined by `build.sh` (core/constants.js first, mod.js last, rest sorted). The user disliked numeric file prefixes; folders follow haiku research (small projects stay flat until a concern has three or more files) |
| Resume keeps the keyword check (ship, push, merge, delete, deploy, drop, reset) before previewing | The user's call over always previewing; generated text with no such word goes out in one press |
| Merge docs stays a button that asks first | The merge skill picks the files, so the effect line cannot name them; accepted |
| Shrink runs `condense-*` through the `haiku` skill; Refresh already runs on haiku; Commit stays on the main model | Condense is mechanical; commit judges which staged files are the session's |
| `/changes` tree rows carry no buttons; one toolbar acts on the selected file or folder (`s` stages or unstages, `d` discards), and each diff header on the right keeps `+`/`−`/`↶` | The user found a button on every row cluttered and asked for them to sit somewhere fixed. Selecting a folder (press its name; the `▾` collapses) brought folder staging back after the first toolbar dropped it |
| Tree order is Staged first, diff column order is Changes first; the right side opens on Changes only when anything is unstaged | The user asked for both orders. The harness stages every write, so Changes is usually empty and an empty `Changes only` would read as a blank pane |
| Discard is offered for the working-tree side only; a staged file is unstaged first and the toolbar says so | The user chose that over a single Discard that removes staged and working edits. Discard always asks, naming the file, and on an `MM` file leaves the staged half |
| No Commit button inside the pane | The user: not needed; the band's Commit (which asks Claude to write the message) stays |
| The gallery keeps its images until Clear (not reset on `/clear`) and the pane never opens by itself on a `show_image` call | The user chose both. Cap is 12 images, newest kept |
| The gallery is one scrollable stack, newest first, not Prev/Next | The user, after pressing Prev and Next on 8 images and nothing changing ("also nothing happens"): show all in one pane and scroll. Cause of the dead buttons not reproduced: the header text moved ("7 of 8") while the picture seemed to stay, and the picture's `key` was the same for every image, which is the likely reason; each picture's key now carries its path. Newest first because the freshest screenshot is what the user opens the pane for; Clear has no confirm yet |
| A picture too big for Desktop's `Svg` is drawn from a smaller JPEG copy made with macOS `sips`, in a Desktop session only | Reverses the earlier "not shrunk" call. The user saw big pictures fail in Desktop and asked "can we have image shrink or something for the big one only" (2026-10-11). The cost the first call weighed is real and goes in the changelog: a new command (`sips`) and new writes under `~/.claude/doc-pane-cache`. Off macOS, `sips` is missing and the picture falls back to the viewer button. Copies accumulate per path and are not pruned |
| Long pages are windowed, not budgeted: every file open and read, only about two screens drawn (`windowedRows`) | Budgets and collapse hid diffs behind "N files collapsed to save room", which the user rejected ("every file's diff is reachable"). They also still froze Desktop. The research (verified): GitHub cut "eight components per diff line to two" and keeps "only about 100 rows real at once"; VS Code's multi-diff editor virtualises; the native Desktop Changes panel virtualises its file list and fetches patches only for expanded files. Desktop did send `ui.scroll` once a trace looked, after an earlier read of zero events from an old module |
| Diffs are read only for the focused, open files (no count cap since windowing) and cached per file by status plus `numstat` line counts; a file with no line counts (untracked, no HEAD) is always re-read, and pressing a section, folder or file forces a re-read | User screenshot, 238 files: 100 diffs were read up front whatever was focused, and each 2 s refresh that saw a change cancelled the load and discarded finished batches, so only file names ever drew. Research: GitHub Desktop reads one selected file's diff; VS Code throttles refresh to one running plus one queued. Not built: one `git diff` for many paths, poll back-off |
| `Doc` opens the reader for any doc-type path, with no docs-list membership required: every press re-runs `discover`, and a doc it does not list (nested repo, file created this session) gets a doc record built from the path and a `decisions/` listing; a decisions file opens on its decisions page under its `current.md` | The user: doc-type files (CLAUDE.md, project docs, task docs and their decisions) open in the task-docs reader and Back must return to where they were; non-doc markdown such as agent files gets no button. Both reviewers found the first build (list lookup, cached once) gave a button that toasted `Not in the docs list` for new files and nested repos; a button gated by one rule and acting by another is a dead end |
| On a narrow pane the section or folder NAME still folds and a separate `view` button opens that group's diffs; pages keep `autoFocus` on their first button in Desktop too | The user (2026-10-11) chose a button beside the name. Research found no product that opens a group's diffs from a name press or splits chevron from title (lazygit, VS Code, Zed and Gitea fold on a folder press and open diffs from a file press; Azure's tree root and Sourcetree's folder are the only group-level views, Sourcetree's buggy), none with a narrow-width branch, so this is judgement. `autoFocus` stays because without it the first click after a page change is lost |
| Desktop diff colours are fixed dark hex (`DESKTOP_DIFF`), and diffs are tinted rows, not the host's `Code format:'diff'` drawer | The theme colours drew solid bright blocks the user found hard to read. The `Code` drawer was the first plan, but the user found it hard to distinguish next to the native Changes panel ("native changes much more easier to see"). Fixed hex is unchecked on a light-theme Desktop |
| Desktop design: native buttons, tinted strips, chips, a change map, gauges; the terminal untouched | The user asked for a Desktop that "looks very nice and easy to use, compact while retaining context, can also get wild", and chose "Go wild", `view ›` and all five surfaces. Every hex value lives in `DESKTOP_TONE`/`DESKTOP_DIFF`, and the parts in `views/ui.js` read them. A probe settled what Desktop accepts: Text inside a Button loses colour, so clickable map blocks are coloured Boxes around plain Buttons |
| A Desktop tree is checked before it is drawn; a repeated key or a long hover scope draws an explanation page, and size is only logged | Desktop refuses these silently (blank pane), and the kit accepts them. Size is logged, not refused, because the docs say only that text past 100,000 characters is cut, and a 108k page drew while a 103k one didn't |
| Several repos: stacked headers with counts, one repo's tree open at a time (accordion), stage and discard act in the active repo; hand-added repos last for the session only, `✕` only forgets (hides) | User chose stacked-per-repo and session-only. Evidence: VS Code scans one folder level by default (`git.repositoryScanMaxDepth` 1), opens nested repos independently, stage-all is per repo; Fork refuses to scan inside repos for speed; GitKraken, Fork, Sublime Merge and lazygit show one repo at a time. No source states what removal does to files, so the button says it only forgets |

---

## Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| `returned an Input without an onSubmit function` | Every `Input` needs both `onInput` and `onSubmit` | Add both; the whole render is skipped otherwise |
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
| Test fails `no implementation for turn.start` | A stub is needed for every host call; `turn.start` must return `{ turnId }`, `prompt.submit` must return `{ text }` | See `docs/ARCHITECTURE.md` §8 |

---

## Next Steps

**Verify**
- [ ] Desktop, in a session started with New: `/sk` and the other mod commands (not known to be intercepted there; the docs are silent), the band's buttons opening a pane, and whether a small PNG draws through `Svg` (nested `<image>` data URI; the docs do not say it is allowed, and a failure would be an empty box with the viewer button beside it). Also whether `tool.call` carries the surface, so `show_image` could tell Claude where the user will see the picture
- [ ] Terminal windowing in iTerm2 (row 18, kit only):
  - Does keyboard scrolling (PgUp, arrows) fire `ui.scroll`?
  - Do rows keep drawing past two screens?
  - Can a file's `+` far down be reached by Tab? Off-screen buttons are not in the tree.
  - Do wide characters (emoji, CJK) only clip at the edge?
- [ ] Desktop `/changes` still unseen: the folder `view`, a fully staged tree, an empty new file, a new file over 256 KB, light-theme contrast for `DESKTOP_DIFF` and `DESKTOP_TONE`, a wide window with long markdown lines (estimate blank band), and the `sips` copy of a big gallery picture
- [ ] Linux: `sips` absent, so the gallery shows the viewer button and `mod.log` says "no smaller copy"; never run
- [ ] Other panes in Desktop, ranked by the product review's risk: the docs list (106 docs, no row cap), the gallery (12 `Svg` pictures), the doc reader's long `Markdown`, the handoff form and confirm pages (their `autoFocus` sits on an Input or on Cancel, so the first click on Send or Discard may be lost)
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
- [ ] Surface silent caps in the list: discovery stops at 180 task docs (`MAX_ENTRIES * 3`) and filter matches at 40 with the header still saying `MATCHES (40)`; the first symptom would be a missing doc
- [ ] Render check at 80 columns with a recent heavy doc (status plus warning is about 55 characters) and a long folder name (the folder button label is not clipped); `TASK DOCS (n)` counts all docs while folder counts exclude the five recents, so the header says `· 5 listed above`
- [ ] Shrink picker no longer names which decisions file is oversized (`heavyNote` shortened); collapse state lives for the whole mod session and is keyed by folder name
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

---

## Last Session (2026-10-11)

Redesigned the mod for Claude Desktop and made long change sets usable on both surfaces. The user's brief: "very nice and easy to use, compact while retaining context, can also get wild". They chose:
- "Go wild", `view ›`, and all five surfaces, Changes first.
- The `Code` diff drawer at first, then reversed to tinted rows after comparing with the native Changes panel.

The Desktop failures, all from screenshots, were silent refusals the kit never reproduced: a long hover scope, repeated keys, and pages that grew too big. "Reading diff…" stuck forever was the biggest of them. A trace showed reads finishing in milliseconds while the pane kept an old drawing.

The user asked for research into how VS Code, GitHub and the native panel handle large diffs, and chose "draw only what's on screen". A trace then showed Desktop does send `ui.scroll`, so windowing was built on Desktop, then on the terminal, removing the "N files collapsed to save room" line. The user had flagged that line; the other session that added the probe passed the requirement on as "every file's diff is reachable".

The user then asked for the following, all built:
- big pictures shrunk (the `sips` copy);
- logging "to easily debug later" (`mod.log` plus tree checks); Playwright on Desktop was judged mostly blocked because Claude Desktop ships with `EnableNodeCliInspectArguments` off;
- long markdown lines shown in full;
- the file-row buttons kept inside the pane.

`/done` ran a simplifier, a correctness reviewer and a product reviewer, then a second reviewer on the fixes. Applied:
- reset and clamp of the scroll offset;
- the untracked-size guard restored;
- terminal Show diff reading a missing diff;
- `sips` gated to Desktop;
- log writes serialised and re-read;
- the column width passed explicitly.

The temporary `/sk-probe` and git trace are removed. Nothing is committed or version-bumped.
