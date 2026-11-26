<!--LLM-CONTEXT
Status: ✅ Stopped at 19/20 in round 2 (owner's rule: 18/20 or 3 rounds), 26/11/2026
Domain: plugin-maintenance (mod)
Related: `../current.md` (rows 44, 45)
Last updated: 2026-11-26
-->

# Score loop: Read images and /sk removal (1.477.0)

## Brief {#brief}

Owner's words, 26/11/2026: images Claude reads should be shown to the user directly in the terminal, like the Claude Code mobile app does, "instead of putting it in ruleset or mcp image"; "pdf no need, just image is sufficient"; terminal only ("desktop already display"); then "can remove the /sk, i dont really use them", confirmed as the whole `/sk` menu.

## Stop rule {#stop-rule}

The owner's: 18/20 or 3 rounds, whichever comes first. Judges on Sonnet, one fresh judge per round, a code reviewer on the round's diff in the same batch.

## Rubric (frozen) {#rubric}

Ten criteria, 0/1/2 each (N/20): 2 = fully meets, 1 = meets with a visible gap, 0 = missing or broken, "cannot assess" = 0 and named beside the total.

| # | Criterion | 2 means |
|---|---|---|
| 1 | Read image drawn under its row | A finished Read with an image result gets an `Image` under its `ToolUse` row in the terminal, the host's row kept |
| 2 | Folded and expanded views | A folded `ToolGroup` line draws its image reads; an expanded group leaves it to the rows; never drawn twice |
| 3 | Shows what Claude saw | The picture comes from the Read result's bytes; a re-read of an overwritten file draws the new one and the old row keeps the old; a deleted file still draws; non-PNG converted |
| 4 | Scope held | Images only (text, notebook, PDF and `parts` results draw nothing); terminal only (Desktop and other surfaces untouched) |
| 5 | Fails safe | Any error, missing tool or odd input returns the host's row unchanged; no source the host refuses (`{ png }` bytes, oversized trees); a cached file is never trusted half-written |
| 6 | Mod rules kept | `hooks/CLAUDE.md` rules: `$` only into `function name($)` declarations, every host call through `core/api.js`, atoms declared, no code comments, no needless duplication |
| 7 | /sk fully removed | No `sk` command, menu page, menu verbs, notice or switch left in code; no dangling import or reference |
| 8 | Nothing stranded | Every action the menu offered is reachable another way or stated as gone; a confirm's Cancel and the list leave no dead end; Desktop's first button keeps `autoFocus` |
| 9 | Tests | Kit tests cover the new drawing and the removal; the saved suite output passes |
| 10 | Docs tell the truth | CHANGELOG 1.477.0 tells a colleague what changed, what's gone and what to do; `hooks/CLAUDE.md`, README, `docs/`, the mod task doc agree with the code |

## Conventions {#conventions}

Not defects: the picture not yet seen in a live terminal (judge against the host types and kit tests); other sessions' changes in this checkout (skills/, help-centre rows, the manifests at 1.475.0 and CHANGELOG entries 1.474.0 and 1.475.0); the standing `LICENSE_MISSING` directory warning in validate; history lines in the CHANGELOG and `decisions/` files that mention `/sk`.

Settled (owner's decisions, not to be reversed by a judge): no PDF drawing; terminal only; the whole `/sk` menu removed including the Answer pictures switch, so pictures are always on; Merge docs leaves the mod (the `merge-task-docs` skill remains).

## Rounds {#rounds}

| Round | Score | Judge | Notes |
|---|---|---|---|
| 1 | 16/20 | fresh (Sonnet) | Docked 5 (temp `.b64`/`.src` left in cache, unbounded print cache, silent fallback to the live file), 6 (duplicate sips/ffmpeg chain, `pickAction` indirection), 9 (no negative or JPEG tests), 10 (changelog silent on new `sh` calls, two live `/sk` mentions). All fixed; code review of the /sk removal folded in (dead `askFirst`, unused imports, Cancel test). Suite 139 pass |
| 2 | 19/20 | fresh (Sonnet) | Docked 9 only: no test for Cancel returning to the changes view, none for a failed decode. Both added after scoring (141 pass); nits: `menu.js` now holds only `confirmView` (rename to `confirm.js` left), `pickAction: open` alias kept. Code review beside it: no blocking defect; low items left: a timed-out `sh` call can leave a temporary file until `prune-caches.sh` (7 days), a conversion failure logs a generic reason |

Stopped: the owner's 18/20 band was met in round 2.
