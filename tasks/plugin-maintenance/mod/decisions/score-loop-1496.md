# Score loop: 1.496.0 (review fixes for 1.490.0 to 1.495.0)

Frozen 27/11/2026 before round 1. Scope: the uncommitted 1.496.0 diff (mod Enhance fixes, `done`/`ship` rule for unreviewed releases, `headless-watch` auto-migration and stop line).

## Stop rule

Owner chose "score-loop, then ship" with no number. Default stated: 18/20 from both judges in the same round (retained and fresh from round 2), cap 4 rounds; a plateau is reported and asked about.

## Rubric (each 0/1/2; 2 = fully meets, 1 = visible gap, 0 = missing or broken)

| # | Criterion |
|---|---|
| 1 | Enhance quick read lists, reads and labels task docs from parent folders and child repos end to end, with a test that fails if the read breaks |
| 2 | `chat not read` shows exactly when the session has an id and the result did not come from the fork, never otherwise; tested both ways |
| 3 | A fork failure with no result event is judged lasting from stderr (older `claude` rejecting `--fork-session`); passing errors still retry; tested |
| 4 | The child-folder scan is bounded and normal folders behave as before |
| 5 | `done`: a session that wrote nothing, or args naming the last release, reviews every commit since that release no `/done` covered (evidence: a headless run given the owner's words) |
| 6 | `ship`: a release note scoped back past this push sends unreviewed commits through the review gate first, consistent with `done` and with ship's existing prerequisites |
| 7 | `watcher.sh install` auto-migration is right for `Skill`, `Skill(<name>)`, `Skill` only and an unresolvable prompt; keeps old files; prints the chosen skill; does not silently pick a wrong skill on plausible prompts |
| 8 | Stop line and Managing-jobs text are accurate for Telegram, ntfy and `HEARTBEAT=off` |
| 9 | CHANGELOG 1.496.0 tells a colleague what changed and what to do, every claim matches the code, no internal noise, no em dashes |
| 10 | No regressions: kit suite green, `claude plugin validate .` passes, `bash -n watcher.sh`, `hooks/RULESET.md` under 10,000 chars, versions match, `hooks/CLAUDE.md` and task docs agree with the code |

"Cannot assess from here" scores 0 and is named beside the total.

## Conventions (not defects)

- Enhance has no off switch, cost line or spend cap, and stays on haiku (owner, 27/11, `decisions/enhance.md`).
- No live press in Desktop or a terminal is possible for a judge; kit tests stand in.
- Known open, not scored: `forkFailedSession` never clears after `/compact`; a session outside home walks up to `/`.
- Auto-migration over keep-refusing is the owner's call (27/11).
- Judges run no full test suite (output saved by the main session) and never run `watcher.sh install` outside a sandbox `HOME` with a fake `launchctl`.

## Settled list

| Criterion | Decision | Why | Date | By | Revisit |
|---|---|---|---|---|---|
| 7 | `install` migrates pre-1.494.0 jobs itself | colleagues should not hand-edit two files | 27/11/2026 | Syafiq | if a migration picks the wrong skill |

## Rounds

- Round 1 (two fresh judges): 15/20 and 13/20, plus a code reviewer. Fixed: the migration no longer takes a plain word as a skill name and refuses when several are named; `prompt.md` is no longer edited (lines naming the Skill tool are printed); `job.env` keeps its lines and gets an appended `%q`-quoted override, checked by loading it back (the first rewrite stripped spaces from `Bash(git log *)`, broke multi-line values and expanded `$`); `done`'s "Ambiguous signal" no longer contradicts the new rule, and `git-variants-by-state.md` says how to mark covered commits; `ship` says a defect in pushed code becomes a new version the note covers; a child repo's doc is labelled `<repo>/<doc>`; tests for child-repo docs and the 400 cap (each control fails without its fix). Headless re-run (`sl-headless-new2.jsonl`) marked commits covered by earlier task-doc evidence and reviewed from the first uncovered one. Judge A kept as the retained judge from round 2.
- Round 2: retained 20/20 (9 closed) · fresh 17/20, plus a code reviewer. Fixed: a `Skill(...)` entry after a newline now triggers migration (`[[:space:]]` strip); an uninstalled `Skill(<name>)` refuses instead of falling back to the prompt; no unquoted candidate loop left; `scripts/test-migrate.sh` runs ten job shapes (control: the old trigger fails the multi-line case); `done`'s empty-status rule is gated like the "Has /done run?" paragraph, skills and references count as code when marking coverage, a repo with no release falls back to the session-start base, and the reference heading is now "Work Already Committed"; CHANGELOG says "quick read" and that an explicit entry must be installed.
- Round 3: retained 20/20 (3 closed) · fresh 17/20, plus a code reviewer. Fixed: a trailing `:` no longer breaks a skill name in the prompt; a preset `SKILL` that isn't installed refuses before `job.env` is touched; a pattern with a comma inside its brackets refuses instead of being rewritten; the appended block says to edit there; `test-migrate.sh` unsets the watcher env vars, checks the refusal reason and that a refusal leaves `job.env` alone (16 cases); the fork-success test asserts no `chat not read`; `hooks/CLAUDE.md` names the 400 cap; `done` names the base for a session with no release named (newest commit a `/done` Output names, else ask), only `tasks/**` counts as notes, and the "skips Step 1 only" wording reads one way. Known, not fixed: a single prompt mention like "do not use other-skill" is still taken (printed, and the skill tells the user to check it).
- Round 4: retained 20/20 · fresh 18/20 (sum checked), plus a code reviewer: stop rule met. After the round: the prompt scan only reads lines that ask to use, run or invoke a skill and skips never, avoid and do-not lines (two new cases, 18 in all); the no-version-file case now uses the newest `/done`-named commit or asks, never the empty session-start range; the CHANGELOG headline and migration bullet were cut to what a colleague does. Left for the owner: none. Unscored minors: `prompt.md` lines naming the Skill tool are printed, not removed; the 400 cap takes host order; the final `done` wording was not re-run headless (the run before it did mark covered commits).
