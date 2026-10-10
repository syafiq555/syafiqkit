<!--LLM-CONTEXT
Status: 🚀 Shipped as 1.376.0 (d52b73a on master, 2026-10-10; origin/master matches HEAD); 18 kit tests pass; the band showed in a live session, not yet used by colleagues
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

**Where we are**: The mod is a Claude Code mod inside the main plugin: a band above the prompt, a `/sk` menu, a `/task-docs` reader and session handoffs. Its source is `hooks/src/` (folders `core`, `docs`, `handoff`, `views`, plus `mod.js`), bundled by `hooks/build.sh` into the single `hooks/register.js` the host loads. `claude plugin validate .` passes and `claude plugin test .` passes 14 tests. Shipped to master as 1.375.0 (commit 3fa861c) with 1.372.0, 1.373.0 and 1.374.0 before it.

**Immediate next actions (in order)**:
1. Run it for real: `claude plugin update syafiqkit@syafiqkit`, restart WITHOUT `--plugin-dir /tmp/mods-try-docs` (a second copy collides on `/sk` and `/task-docs`), and with `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` in iTerm2.
2. Check the paths only the kit exercised: Resume under bypass permissions, band hotkeys while typing in the prompt, whether `prompt.submit` overwrites a half-typed draft, and a submit that lands mid-turn.
3. Test one Claude Code older than 2.1.287 against the shared `hooks.json`.

**Key facts for cold start**:
- Tests: `claude plugin test .` from the repo root (`hooks/register.test.ts`); validate: `claude plugin validate .` (`--strict` fails on three standing warnings, so judge by the plain run).
- Off switch: `SYAFIQKIT_MOD=0` keeps the skills and drops the mod; `claude --safe-mode` drops everything.
- The scratch copy at `/tmp/mods-try-docs` is stale; the repo file is the source of truth.

**Gotchas that will trip you**:
- Write the file whole, or order edits so no call precedes its function: a failed reload keeps the old module live and the chat shows "reload failed, the previous version stays loaded".
- Mods need Claude Code 2.1.287 or later (Desktop 2.1.286); nothing draws in the VS Code panel or `claude -p`.

---

## Overview

The user wanted the plugin's daily jobs (commit, commit and push, done, read a task doc, ship, shrink, refresh, merge, hand off) one press away, a rendered task-doc browser that costs the model no tokens, and a handoff that carries the whole session instead of one task doc. A mod is the only mechanism that can draw in the interface, so the plugin ships one. It runs with the user's permissions, which is why anything that acts for the user is a button and the risky ones show the exact message first.

---

## Architecture / Data Model

| Piece | What it does | Notes |
|-------|--------------|-------|
| Band above the prompt | Menu, Docs, Commit, Done, Hand off; a handoff row with Resume and Dismiss | Hidden while the pane is open; shows a send bar when items are picked |
| Pane views | `menu`, `list`, `doc`, `decision`, `confirm`, `handoff` | One pane id (`doc-pane`), state in module variables |
| Commands | `/sk` opens the menu, `/task-docs` the list | Registered with `immediate: true`, so no model turn; both return `{}` |
| Handoff record | `<id>.json` per save under `~/.claude/handoffs/<hash of cwd>/`, with a `<id>.state` marker file (`claimed:<nonce>`, `dismissed`, `superseded`, `open`) | chmod 700 dir, 600 files, best effort; expires after 24 hours |
| Diagram cache | `~/.claude/doc-pane-cache/<hash>.png`, valid once `<hash>.ok` exists | PNG rendered by a pinned `@mermaid-js/mermaid-cli@12.0.0` through `npx`, read back with `$.fs.read({ as: 'bytes' })` |

---

## Files

- `hooks/src/` — the source: `core/` (constants, state, format), `docs/` (discovery, markdown, images, diagrams, reader), `handoff/` (capture, store), `views/` (band, pane, pane-context, menu, list, doc, actions), `mod.js` (the `register` wiring, always last)
- `hooks/build.sh` — joins `src/` into `hooks/register.js` (`--check` fails when stale; `.githooks/pre-commit` runs it). `register.js` is generated: edit `src/`, never the bundle
- `hooks/register.test.ts` — kit tests for commands, band, menu, confirm, handoff save/resume, /clear, off switch, decisions, reopen
- `hooks/hooks.json` — `modules: ["./register.js"]` beside the ruleset `hooks`
- `docs/ARCHITECTURE.md` §8 — host-API traps; `docs/ARCHITECTURE-ESSENTIALS.md` `{#mod-one-file}`; `CLAUDE.md` §The Mod

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Menu and band: one-press Commit, Hand off form, Done confirm | ✅ |
| 2 | Task-doc browser: filter, recents, size badges, scoped names, open items pickable, decisions on their own page | ✅ |
| 3 | Mermaid as pictures | ✅ needs `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1` in iTerm2 |
| 4 | Session handoff (haiku summary), Resume starts with `/syafiqkit:read-summary` | ✅ |
| 5 | Done confirm with optional hand-off afterwards | ✅ |
| 6 | README front door and `/commit push` wording | ✅ uncommitted (1.374.0) |
| 7 | Source split into `hooks/src/` and bundled; Wrap up renamed Done | ✅ |
| 8 | Handoffs and diagrams without `mkdir`/`mv`/`openssl` (Windows) | ✅ built, untested on Windows |
| 9 | Real-session soak, older-client check, `SYAFIQKIT_MOD=0` via shell and via settings.json | ⏳ |
| 10 | A decisions file over 40 KB (`DECISION_MAX_BYTES`) makes its task doc heavy, whatever `current.md`'s size; list shows `⚠ decisions/<file> <size>`, shrink request asks for a split with `current.md` as router; each decisions page has Condense ⚠ (`dec-condense`, `k`) and Split ⚠ (`dec-split`, `t`, not `s`: Send is `s`), both on haiku, both ask first; Cancel returns to the calling view (`confirm.back`), Send sets `reopen`; doc Shrink asks task-summary to judge (1.376.0) | ✅ four tests added |

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
| Tables become bullets in the reader | `Markdown` draws wide tables badly in a narrow pane |
| One source tree bundled into one file, in folders by concern | The host takes one module path and refuses `$` in an object, so fragments are plain top-level code joined by `build.sh` (core/constants.js first, mod.js last, rest sorted). The user disliked numeric file prefixes; folders follow haiku research (small projects stay flat until a concern has three or more files) |
| Resume keeps the keyword check (ship, push, merge, delete, deploy, drop, reset) before previewing | The user's call over always previewing; generated text with no such word goes out in one press |
| Merge docs stays a button that asks first | The merge skill picks the files, so the effect line cannot name them; accepted |
| Shrink runs `condense-*` through the `haiku` skill; Refresh already runs on haiku; Commit stays on the main model | Condense is mechanical; commit judges which staged files are the session's |

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
| Test fails `no implementation for turn.start` | A stub is needed for every host call; `turn.start` must return `{ turnId }`, `prompt.submit` must return `{ text }` | See `docs/ARCHITECTURE.md` §8 |

---

## Next Steps

**Verify**
- [ ] Resume under bypass permissions, band hotkeys while typing, a draft overwritten by `prompt.submit`, a submit that lands mid-turn
- [ ] One Claude Code older than 2.1.287 against the shared `hooks.json`; the ruleset hook is the first thing to check if a colleague reports it missing
- [ ] `SYAFIQKIT_MOD=0` under `env` in `settings.json`: does it hide the band? The shell route did (checked live 2026-10-10, session started from the home folder; the band showed in a normal session from the plugin folder, so the mod loads)
- [ ] Windows run: handoff save, Resume, diagrams (`npx` must be on PATH); written without shell calls but never run there

**Decide**
- [x] Commit as three commits by version (1.373.0 is the other session's `uiux` work); ship after the live checks above

**Later**
- [ ] Count a doc's decisions bytes toward the size badge (the shrink skill treats the set as one thing)
- [ ] Re-read open decision pages on change, as the main doc already is
- [ ] Optional automatic digest-only handoff on `/clear` (declined for now: it writes files unasked)

---

## Last Session (2026-10-10)

Split the 1,730-line `register.js` into `hooks/src/` fragments bundled by `hooks/build.sh`; views became top-level functions taking `$` and a context (the host refuses `$` inside an object). Renamed the menu's Wrap up to Done (sent text unchanged). Rewrote handoff claiming and the picture cache to avoid `mkdir`/`mv`/`openssl` so the mod can run on Windows (marker files; tested with stubs only; a Windows-off variant was built and reversed at the user's request). Review pass: architecture doc statements about "no runtime code" corrected, `mkdir` added to the commands list, 14 kit tests pass; the shell route of `SYAFIQKIT_MOD=0` was seen to hide the band, the settings.json route is untested. Not otherwise used in a live session.
