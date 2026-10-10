<!--LLM-CONTEXT
Status: 🔨 `/changes` source-control pane and the `show_image` gallery built as 1.384.0, pushed to master (fa2a608); handoff Message fix and defer-on-question shipped as 1.385.0 (9a929b8, pushed to master, unseen live); 37 kit tests pass; tree, split diffs, toolbar and images were seen in the user's iTerm2, the last fix round (folder staging, rename-safe unstage, batched diffs) was not; docs-list redesign 1.382.0 built and unseen in the 106-doc repo; 1.376.0 shipped (d52b73a); not yet used by colleagues
Domain: plugin-maintenance/mod
Gotchas (critical — full list in ## Gotchas below):
  - The host loads one file, so the source lives in `hooks/src/` and `hooks/build.sh` bundles it into `hooks/register.js`; `$` is never put in an object, and a save that fails to load keeps the OLD module running
  - Older Claude Code versions are unverified against a `modules` key sharing `hooks.json` with the ruleset hook
Related:
  - ../project-docs/current.md (ESSENTIALS entry `{#mod-one-file}` extracts The Mod)
  - ../output-style-hook/current.md (shares `hooks/hooks.json`)
Last updated: 2026-10-10
-->

# Plugin Maintenance — The Mod

## Quick Start (read this first in next session)

**Where we are**: The mod is a Claude Code mod inside the main plugin: a band above the prompt, a `/sk` menu, a `/task-docs` reader, a `/changes` source-control view, an image gallery and session handoffs. Its source is `hooks/src/` (folders `core`, `docs`, `git`, `handoff`, `views`, plus `mod.js`), bundled by `hooks/build.sh` into the single `hooks/register.js` the host loads. `claude plugin validate .` passes and `claude plugin test .` passes 37 tests. Shipped to master through 1.380.0; 1.382.0 (docs list), 1.383.0 (another session's `refresh-instructions` patch) and 1.384.0 (`/changes` plus `show_image`) are in the working tree, uncommitted, and the staged set also carries that other session's skill and task-doc edits.

**Immediate next actions (in order)**:
1. `/reload-plugins`, open `/changes` and look at the last fix round: folder selection plus the toolbar's `+ Stage folder`, the `Staged first, Changes first on the right` order, the 'files collapsed' line, the Open in viewer button. Then commit by version, keeping the other session's files out (`git status --short` first).
2. Open `/task-docs` in the 106-doc repo (the user's first screenshot came from it) and compare the header count with `find tasks -name current.md | wc -l`. Run it for real: `claude plugin update syafiqkit@syafiqkit`, restart WITHOUT `--plugin-dir /tmp/mods-try-docs` (a second copy collides on `/sk` and `/task-docs`), and with `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` in iTerm2 (now set in `~/.claude/settings.json` `env`).
3. Check the paths only the kit exercised: Resume under bypass permissions, band hotkeys while typing in the prompt, whether `prompt.submit` overwrites a half-typed draft, and a submit that lands mid-turn.
4. Test one Claude Code older than 2.1.287 against the shared `hooks.json`.

**Key facts for cold start**:
- Tests: `claude plugin test .` from the repo root (`hooks/register.test.ts`); validate: `claude plugin validate .` (`--strict` fails on three standing warnings, so judge by the plain run).
- Off switch: `SYAFIQKIT_MOD=0` keeps the skills and drops the mod; `claude --safe-mode` drops everything.
- The scratch copy at `/tmp/mods-try-docs` is stale; the repo file is the source of truth.

**Gotchas that will trip you**:
- Write the file whole, or order edits so no call precedes its function: a failed reload keeps the old module live and the chat shows "reload failed, the previous version stays loaded".
- Mods need Claude Code 2.1.287 or later (Desktop 2.1.286); nothing draws in the VS Code panel or `claude -p`.

---

## Overview

The user wanted the plugin's daily jobs (commit, commit and push, done, read a task doc, ship, shrink, refresh, merge, hand off) one press away, a rendered task-doc browser that costs the model no tokens, and a handoff that carries the whole session instead of one task doc. They later asked to stop opening VS Code only to review what Claude changed (a changed-files tree beside stacked diffs, with stage, unstage and discard) and to have e2e screenshots Claude takes show up in the pane instead of as a `/tmp` path. A mod is the only mechanism that can draw in the interface, so the plugin ships one. It runs with the user's permissions, which is why anything that acts for the user is a button and the risky ones show the exact message first.

---

## Architecture / Data Model

| Piece | What it does | Notes |
|-------|--------------|-------|
| Band above the prompt | Menu, Docs, `Changes (N)`, `Images (N)` (only when the gallery has images), Commit, Done, Hand off; a handoff row with Resume and Dismiss | Hidden while the pane is open; shows a send bar when items are picked. The Changes count excludes untracked files (cheap `-uno` status every 5 s); the pane lists them |
| Pane views | `menu`, `list`, `doc`, `decision`, `confirm`, `handoff`, `changes`, `change-file`, `change-all`, `discard`, `images` | One pane id (`doc-pane`), state in module variables |
| Changes pane | From 100 body columns: left a fixed-width tree (Staged first, Changes second; chevron collapses, title or folder name selects) under one toolbar, right the diffs of everything, Changes first | Below 100 columns the tree is a list, a file press opens its own page, and `All changes` is a separate screen with no toolbar. Status is re-read every 2 s; a `git diff HEAD --numstat` is appended to the signature so a re-edit of a modified file redraws |
| Gallery | `show_image` tool (`$.tool.register`, `isDeferred: false`) adds absolute PNG paths under 12 MiB; the pane never opens by itself | 12 images at most, drawn from `{ png: base64 }` up to 2 MiB, larger ones only through Open in viewer (`uname` then `open`, `xdg-open` or `start`) |
| Commands | `/sk` opens the menu, `/task-docs` the list, `/changes` the source-control view | Registered with `immediate: true`, so no model turn; all return `{}` |
| Handoff record | `<id>.json` per save under `~/.claude/handoffs/<hash of cwd>/`, with a `<id>.state` marker file (`claimed:<nonce>`, `dismissed`, `superseded`, `open`) | chmod 700 dir, 600 files, best effort; expires after 24 hours |
| Diagram cache | `~/.claude/doc-pane-cache/<hash>.png`, valid once `<hash>.ok` exists | PNG rendered by a pinned `@mermaid-js/mermaid-cli@12.0.0` through `npx`, read back with `$.fs.read({ as: 'bytes' })` |

---

## Files

- `hooks/src/` — the source: `core/` (constants, state, format), `docs/` (discovery, markdown, images, diagrams, reader, gallery), `git/` (status parse and tree, diff parse with word marks, actions, controller), `handoff/` (capture, store), `views/` (band, pane, pane-context, menu, list, doc, actions, changes, images), `mod.js` (the `register` wiring, always last)
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
| 6 | README front door and `/commit push` wording | ✅ uncommitted (1.374.0) |
| 7 | Source split into `hooks/src/` and bundled; Wrap up renamed Done | ✅ |
| 8 | Handoffs and diagrams without `mkdir`/`mv`/`openssl` (Windows) | ✅ built, untested on Windows |
| 9 | Real-session soak, older-client check, `SYAFIQKIT_MOD=0` via shell and via settings.json | ⏳ |
| 10 | A decisions file over 40 KB (`DECISION_MAX_BYTES`) makes its task doc heavy, whatever `current.md`'s size; the row shows `⚠ decisions <size>` (or `⚠ N decisions, max <size>`, no file name since 1.382.0), shrink request asks for a split with `current.md` as router; each decisions page has Condense ⚠ (`dec-condense`, `k`) and Split ⚠ (`dec-split`, `t`, not `s`: Send is `s`), both on haiku, both ask first; Cancel returns to the calling view (`confirm.back`), Send sets `reopen`; doc Shrink asks task-summary to judge (1.376.0) | ✅ four tests added |
| 11 | Docs list shows each doc once: task docs under folder headers (`▾ tenant (9)  ⚠ 4`, press to collapse, rows indented, no per-row folder column), the five most recent on top with folder and status and removed from their folder, over-limit docs flagged inline, the old NEEDS SHRINKING list is one `⚠ N over the size limit · show` button opening the `heavyOnly` view, blank line and bold header per section (1.382.0) | ✅ one test added; seen live on an 8-doc repo only |
| 12 | `/changes`: tree plus stacked diffs with line numbers, red/green rows and changed words marked; stage, unstage per file, folder, section and all; discard asks first; opens on Changes when anything is unstaged, otherwise on both; a doc and a decisions page have a Changes button (diff against HEAD) (1.384.0) | ✅ built, kit tests for the list, file page, discard, folder and section focus, default focus; seen live except the last fix round |
| 13 | `show_image` gallery: PNGs Claude names appear under a band `Images (N)` button, Prev/Next/Clear/Open in viewer; pane never opens itself (1.384.0) | ✅ pictures drew in the user's iTerm2 after `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` went into `~/.claude/settings.json`; whether Claude Code asks permission for the tool was not seen |

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
| Diff drawing is budgeted: 500 rows in all, 120 per file (`· show` expands to 400), 100 files, batches of 8 git calls; files past the budget start as headers with a 'files collapsed' line | The pane showed for a moment and went blank with 44 expanded files from real data. Row volume and a duplicate key were fixed together, so which one was the cause is not known |

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
| Pane draws for a second then goes blank with real data, kit green | A drawn tree the host refuses or fails on (thousands of rows, or two elements sharing a `key` such as the tree's and the diff column's `staged-gap`); the kit validates the tree but did not reproduce it | Cap drawn rows, keep every key unique across the whole tree, and check against a real status and real diffs; with `claude --debug` the refusal reason is in the debug log |
| Whole module refuses to load after an edit that only reshuffled calls | `$` passed to a callee picked by a ternary or a wrapper (`(cond ? a : b)($, x)`, `thenAfterGit(fn)`) | Call each function by its literal name, one branch per call |
| `Image` shows `Image not drawn here` and `{ file, format }` was the source | In iTerm2 pictures need `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1`; the variable was unset when `{ file }` was tried, so the source itself is not proven unsupported | Gallery uses `{ png: base64 }` like the diagrams; the variable is in `~/.claude/settings.json` `env` |
| A `Box` with a `width` inside a row is narrower than asked and its neighbour's text overlays it | Flex shrink; a plain `Button` also adds padding, so a row sized to the box overflows | `flexShrink: 0` on the fixed column, explicit width on the other, one element per row |
| Test fails `no implementation for turn.start` | A stub is needed for every host call; `turn.start` must return `{ turnId }`, `prompt.submit` must return `{ text }` | See `docs/ARCHITECTURE.md` §8 |

---

## Next Steps

**Verify**
- [ ] Resume under bypass permissions, band hotkeys while typing, a draft overwritten by `prompt.submit`, a submit that lands mid-turn
- [ ] One Claude Code older than 2.1.287 against the shared `hooks.json`; the ruleset hook is the first thing to check if a colleague reports it missing
- [ ] `SYAFIQKIT_MOD=0` under `env` in `settings.json`: does it hide the band? The shell route did (checked live 2026-10-10, session started from the home folder; the band showed in a normal session from the plugin folder, so the mod loads)
- [ ] Windows run: handoff save, Resume, diagrams (`npx` must be on PATH); written without shell calls but never run there; `nameOf` in `git/status.js` splits on `/` only, so a Windows path shows whole
- [ ] `/changes` last fix round live: folder select then `+ Stage folder`, unstaging a staged rename (both paths now passed), the `N files collapsed` line, and `-uall` status cost in a repo with many untracked files
- [ ] Whether Claude Code asks the user to allow `mcp__syafiqkit__show_image` on its first call (it did not on 2026-10-10 in a bypass-permissions session), and the Open in viewer button on the user's Mac
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
- [ ] An edit to a file that is only untracked (`??`) changes neither the status line nor `numstat`, so its diff in the stacked view stays old until something else changes; folding `$.fs.stat` size and mtime of `??` entries into the signature would catch it
- [ ] Narrow layout (under 100 columns) has no toolbar and no tree-plus-diff: a file press opens its own page with Stage/Discard; add the toolbar there only if narrow use is real
- [ ] Nested untracked repos appear as `sub/`: the tree row has an empty name, Discard runs `git clean -f` without `-d` and still toasts success, and its diff note reads 'cannot be read'
- [ ] Overlapping status polls on a large change set are guarded for diffs (generation counter) but not for `loadChanges`; a slow `git status` could briefly show a pre-stage state

---

## Last Session (2026-10-10)

Built the `/changes` view and the `show_image` gallery (1.384.0) from the user's VS Code screenshots, iterating on their screenshots of the live pane: a blank pane after the first paint, tree rows spilling into the diff column, small buttons, ragged header columns, the default focus on Changes. Two `uiux` research rounds (haiku on product docs, then on open-source row code) mostly answered "not stated"; what was verified on the pages: GitHub Desktop keeps the file name and elides the directory, VS Code shows row actions only on hover or focus, Maersk truncates at the end unless the middle is distinctive, and the ARIA tree pattern wants selected and focused to look different. Two review rounds (reviewer, simplifier, product reviewer, then a second reviewer on the fixes) produced the batching, literal pathspecs, rename-safe unstage, folder staging and the image caps. Pictures drew only after the iTerm2 variable went into `~/.claude/settings.json`. Not committed. The docs list from the earlier 1.382.0 session is still unseen in the 106-doc repo.

Later the same day, a handoff fix: the Done confirm's optional Message "cleared on Enter, form stayed". A first fix (ignore the submitted value) was reverted because the kit's `pane.input` fires only `onSubmit`, so the test could not tell it from the old code. Final shape: `onSubmit` keeps a non-empty value only, a dim line echoes the Message (or 'No message'), the standalone handoff form uses the same guard, `resumeText` says 'the Goal below' only when a goal exists, the Sent toast says the handoff saves when it finishes, and `turn.complete` defers the save while the turn ends on a question (`MAX_HANDOFF_DEFERRALS`). Two reviewers' findings applied; the defer rule was written after them and has only its own test.
