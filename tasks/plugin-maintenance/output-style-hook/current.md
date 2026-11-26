<!--LLM-CONTEXT
Status: 🔨 Ruleset shipped at 1.455.0; adherence unverified, last measured 84% (2026-09-15)
Domain: plugin-maintenance/output-style-hook
Gotchas (critical; full list in ## Critical Gotchas below):
  - The hook is one inline shell-form line with no script file: no off-switch, and the payload must stay under the 10,000-char hook-output cap
  - Adherence cannot be judged from inside the session that read the ruleset; judge from outside transcripts
Related: ../agent-architecture/current.md (sibling feature: how agents are defined and dispatched), ../external-guidance/current.md (sibling feature: grading outside guidance against local evidence), ../../../hooks/RULESET.md (the injected payload), ../mod/current.md (sibling: the mod now shares `hooks/hooks.json` with this hook; older-client behaviour of the `modules` key is unverified)
Last updated: 2026-11-27 (both hooks to shell form for Windows, issue #37)
-->

# Plugin Maintenance: Output-Style Hook Summary

## Quick Start (read this first in next session)

**Where we are**: syafiqkit ships a `SessionStart` hook that prints an output-style ruleset into every session, or a restart line when the session's version folder has been pruned (1.467.13, D-stale-session-notice). A second hook prunes retired version folders: older than 7 days, or older than 24 hours once 10 newer ones exist (D-prune-hook, amended 24/11/2026). Since 1.488.0 both hooks are shell form so they run in Git Bash on Windows (D-cat-not-node, amended 27/11/2026; unconfirmed on Windows). The ruleset is at 1.455.0 (pushed to `master` 2026-11-18): 8,983 characters, 10 numbered rules, 8 exceptions. Hook stdout is capped at 10,000 characters (Architecture, Critical Gotchas). A `SessionStart:clear` delivered the whole file in full on 2026-08-17. The 2026-10-08 cut to 8,149 characters shipped in 1.371.0 at the user's call; the pre-cut wording is `git show bd98189:hooks/RULESET.md` (13,240 characters). Whether output actually *follows* the ruleset is still open (Adherence Measurements), and the session reading it cannot settle that.

**Next actions** (detail in Next Steps):
1. Judge adherence from outside transcripts, never from the session that read the ruleset.
2. In a fresh session after `claude plugin update`, confirm the start banner shows the full ruleset with no "Output too large" line.
3. Waiting on the #37 reporter to confirm the Windows shell-form fix (1.488.0, tested on macOS only).
4. See the restart line once in a live session (Next Steps), then pick up the copy-size follow-up: each cached copy is 287 MB, mostly `tools/*/node_modules`.

**Key facts for cold start**: the size check is `wc -m hooks/RULESET.md` under a UTF-8 locale; it must stay under 10,000. The headroom is about 1,000 characters; if a session misses a detail the 2026-10-08 cut dropped, `git show bd98189:hooks/RULESET.md` holds the pre-cut wording to restore from.

**Gotchas that will trip you**:
- The hook is one inline shell-form line with no script file, so there is **no off-switch** (see D-no-off-switch). Keep it shell form: exec form cannot spawn `/bin/sh` on Windows (D-cat-not-node, amended 27/11/2026)
- `node` is not a safe hook interpreter on this machine even though it is on the interactive PATH (see D-cat-not-node)
- `fork` is the fifth `SessionStart` matcher and is deliberately unwired, so forked sessions get no ruleset (see D-fork-excluded)

---

## Overview

Skills are procedural and reach only the sessions that invoke them, so no skill could shape how results get reported. Spreading output rules across every SKILL.md would drift at once and miss later skills. A `SessionStart` hook fires once before anything else, the only host that reaches a whole session. Its payload is an ADHD-oriented ruleset adapted from [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd): lead with the action, number multi-step work, concrete time units, suppress tangents, drop stock openers and closers.

---

## Architecture / Data Model {#architecture}

```
hooks/hooks.json     shell form (sh -c; Git Bash on Windows) → cat "$CLAUDE_PLUGIN_ROOT/hooks/RULESET.md", else print a restart line
hooks/RULESET.md     the injected payload, plain markdown, no frontmatter
hooks/prune-caches.sh  second SessionStart entry (matcher startup), silent cache pruning (D-prune-hook)
```

Auto-discovered by well-known path; neither manifest declares a `hooks` field. Matchers `startup|resume|clear|compact`. **Hard ceiling: 10,000 characters** of hook stdout (`code.claude.com/docs/en/hooks.md`, read 2026-10-08). Over it, Claude gets a file path and a 2,000-char preview, and the session-start banner shows "Output too large". `.githooks/pre-commit` fails a commit whose staged `RULESET.md` is ≥10,000 chars (`wc -m` under a UTF-8 locale). Size history in chars: 5,261 (08-17) → 8,248 (09-15) → 10,521 (09-17, first over) → 13,240 (10-07) → 8,149 (10-08). The same docs page advises "factual statements rather than imperative system instructions", since command-framed injected text can trip prompt-injection defences; not yet acted on. The payload sits after the cached prefix, so it pays full rate once and cache-reads after. Measure with a tokenizer, never `bytes ÷ 4`: this file's prose runs 4.78 bytes/token, so the divisor over-reports by ~20%. The cost recurs per session, not per read, which weighs against any future growth.

---

## Key Technical Decisions

### D-cat-not-node: `cat` as the hook command, not a Node script · 2026-08-17

**Status**: shipped 2026-08-17
**Problem**: The reference implementation wires a Node script and ships unwired `.sh`/`.ps1` fallbacks. Copying that shape would have produced a hook that silently does nothing on the author's own machine.
**Decision**: `"command": "cat"`, `"args": ["${CLAUDE_PLUGIN_ROOT}/hooks/RULESET.md"]` in exec form.
**Rejected**: Node primary: Claude Code now ships as a native binary, so installing the CLI brings no Node, and a version-managed `node` (nvm, Herd) lives on the PATH only because the shell profile puts it there. Exec-form hooks source no profile. A shell-form interpreter probe was also rejected: it reintroduces the quoting hazards exec form avoids, and shell form on Windows needs Git Bash anyway, so the gap only moves.
**Consequences**: `/bin/cat` resolves from a clean environment on macOS and Linux, so coverage holds there and on Windows-with-Git-Bash while bare Windows gets a silent no-op. Removing the script also removed the reasons a script needs machinery: `${CLAUDE_PLUGIN_ROOT}` expands in `hooks.json` but not inside a script body, and a frontmatter-bearing payload would need strip logic whose edge cases are what the upstream test suite exists to catch.

**Amended 24/11/2026 (D-stale-session-notice)**: the hook is now `/bin/sh -c 'if [ -f "$1" ]; then /bin/cat "$1"; else echo <restart line>; fi' sh ${CLAUDE_PLUGIN_ROOT}/hooks/RULESET.md`. Problem: `prune-caches.sh` (count cap, same day) can delete the version folder under a session still open, and that session then lost its rules on `/clear` or `compact` with no sign why. A live-session guard was ruled out because neither `ps` arguments nor `~/.claude/sessions/*.json` show which plugin version a session loaded. The owner chose the restart line over a changelog note only. It stays inline because a script file would be deleted with the folder. Bare Windows without Git Bash is still a silent no-op, unchanged from `cat`.

**Amended 27/11/2026 (issue #37)**: both hooks moved to shell form (`command` string, no `args`), reading the path from `$CLAUDE_PLUGIN_ROOT`. The 2026-08 Consequences line was wrong, and the shell-form rejection above rested on it: exec form resolves `command` itself, so `/bin/sh` and `cat` failed on Windows even with Git Bash (`uv_spawn '/bin/sh'` ENOENT, `Executable not found in $PATH: "cat"`; Windows 11, Claude Code 2.1.330). Per `code.claude.com/docs/en/hooks.md` § Exec form and shell form, shell form runs `sh -c` on macOS and Linux, Git Bash on Windows, and PowerShell only without Git Bash. `prune-caches.sh` converts `\` to `/` in its argument so the cache-folder guard matches a Windows path. Tested on macOS from `env -i PATH=/usr/bin:/bin`, including a path with a space and an apostrophe; not yet run on Windows. The reporter's Node port was declined: it reintroduces the Node dependency this decision exists to avoid.

### D-no-off-switch: On by default with no toggle · 2026-08-17

**Status**: shipped 2026-08-17
**Problem**: syafiqkit has colleague users who installed it for `/commit` and `/ship`. On-by-default reshapes their output on the next update.
**Decision**: No off-switch. In 2026-08 `cat` could not check an env var and a guard meant a script. Since the 24/11/2026 `/bin/sh -c` line it could check one, so this now stands as the owner's call alone.
**Rejected**: A flag file or env var gate, which would have restored the script and every problem it carries.
**Consequences**: The release note and README carry the weight instead: both name `claude plugin uninstall syafiqkit@syafiqkit` as the only escape, because a section promising "no way back" while the actual off-ramp sits under an unrelated heading strands the reader who most needs it. Any request to make the style optional reopens the shape rather than patching it.

### D-fork-excluded: Four matchers, not five · 2026-08-17

**Status**: shipped 2026-08-17
**Problem**: `SessionStart` documents five matchers. `fork` covers sessions branched via `--fork-session`, `/fork` or `/branch`.
**Decision**: Wire `startup|resume|clear|compact` only.
**Rejected**: Including `fork`, whose behaviour with hook output was never verified.
**Consequences**: A bounded, nameable gap beats machinery that would first misbehave in production. Adding it later is a one-token change once someone confirms what a forked session does, at which point the carve-out wording in `README.md` and the changelog comes out too.

### D-no-userpromptsubmit: Ruled out as the carrier fix · 2026-09-22

**Status**: rejected 2026-09-22
**Problem**: Five wording/position passes on the once-per-session `SessionStart` payload have not moved the measured adherence failure (70%→84% across two measurements), and the 2026-09-21 session showed a second, independent rule (register, not just rule 10's preamble pattern) failing the identical way: recalled at load, unchecked by the time a reply is composed turns later. `CLAUDE.md` `{#rule-placement}` names `UserPromptSubmit` as the mechanism the harness executes every turn rather than leaving to recall, and this doc's Next Steps had named "decide the carrier" as the open item since 2026-09-14.
**Decision**: Do not build a `UserPromptSubmit` hook for this. Asked directly; user declined, no reason attached, and pushed back on the framing that it was the only candidate, correctly: `PreToolUse`/`PostToolUse` matched on the `Skill` tool were never evaluated anywhere in this task doc or `update-plugin`'s CHANGELOG history, and are arguably the more precise fix for THIS failure specifically (fires exactly when a skill invocation displaces register, not on every turn regardless of relevance). `Stop` was also unexamined but fires after the reply is generated, too late to prevent it.
**Rejected**: Any per-turn or per-tool-call re-injection hook (`UserPromptSubmit`, and by the same user decision, `PreToolUse`/`PostToolUse` on `Skill`). The user declined building new hook machinery for this problem, not specifically `UserPromptSubmit` over its alternatives.
**Consequences**: The carrier stays `SessionStart`-only, so the measured decay (rule read once, unchecked at reply time, worse at longer sessions) remains open and unaddressed by design rather than by oversight. The sixth wording pass (1.311.0, rule 2's register callout) is done and unverified; a seventh on `RULESET.md` is the only remaining lever without new hook machinery, despite six priors not moving the rate. If this is revisited, evaluate `PreToolUse` on `Skill` on its own merits rather than reusing the `UserPromptSubmit` analysis; it is a different mechanism with a different trigger surface, not a synonym for it.

### D-prune-hook: a second SessionStart entry that deletes stale caches · 2026-10-23

**Status**: shipped 2026-10-23 (1.407.7); `hooks/prune-caches.sh` is committed
**Problem**: Claude Code marks an old plugin version with `.orphaned_at` but did not delete it: on 2026-10-23 versions orphaned 14 days earlier were still cached, 79 copies and 2.9 GB, each 63 MB because a `directory` marketplace copies the gitignored `tools/remote-cli/node_modules` too. The mod's `doc-pane-cache/typeset` held 1.4 GB of pages from under a week, with nothing pruning it.
**Decision**: `/bin/sh hooks/prune-caches.sh ${CLAUDE_PLUGIN_ROOT}` on matcher `startup` only, printing nothing. It deletes version folders whose marker is over 7 days old, never the running one and only under `plugins/cache/syafiqkit/syafiqkit`. It also deletes typeset keys, answer previews and `sips` copies untouched for 7 days. It runs for colleagues and has no off-switch; the owner chose both on 2026-10-23.
**Rejected**: 3 days, because a session left open over a weekend would lose the version its skills and Typst templates load from. Pruning inside the mod, which has no delete call and would add a new host API to what colleagues run. Moving remote-cli's `node_modules` out of the plugin, because with pruning only a handful of copies remain.
**Amended 24/11/2026**: also delete a version whose marker is over 24 hours old and outside the 10 newest markers. The 7-day window alone held 105 copies (22 GB of `du`) at about 20 releases a day; the owner picked "newest 10 + last 24 h" over a 3 GB size cap and a 2-day window. Cost: a session open over a day across 10+ releases loses its version until restart.
**Consequences**: Unlike the ruleset entry this is a script, so it takes the plugin root as an argument (the variable does not expand inside a script) and calls `/usr/bin/find` and `/bin/rm` by absolute path. A doc page read daily still re-renders weekly, since a cache hit does not touch the file's mtime.

**Simple decisions** (no meaningful alternatives):

| Decision | Rationale |
|----------|-----------|
| Most-failed rule first: rule 10 became rule 1 on 2026-09-15, the rest renumbered | The rule failing most leads the payload; the 2026-09-15 pass did not claim this moves the measured rate |
| "It can't be done" lives in `RULESET.md` Exceptions (1.455.0, 2026-11-18), not in `judgement` | A "can't" conclusion lands at any turn of any session; only this payload is in context for all of them, and no skill description matches "about to say I can't". Review added two carve-outs: a refusal by the user, a permission prompt, a hook or a policy is a stop to report (the first draft's word "blocked" invited routing around safety controls), and a plain "does X support Y?" keeps its plain answer first. Only checked routes count, so "at least three" never forces invented ones. The recommended route opens the reply, so rule 2 holds |

---

## Critical Gotchas

### Hook payload and measurement

| Issue | Rule |
|-------|------|
| An interpreter on your interactive PATH may be invisible to a hook | Version managers add binaries from the shell profile; exec-form hooks source no profile. `env -i PATH="/usr/bin:/bin" sh -c 'command -v <tool>'` answers what a spawned process sees. |
| A reference implementation's file list is not its wiring | Upstream ships three runtimes and wires one. Read what a project executes, not what it contains: unexecuted files look like coverage and provide none. |
| An unhobble pass trims by appearance, not by derivability | Two passes over `RULESET.md` cut a numbered-steps principle, a cross-skill precedence fact, and a self-guard against over-trimming, each in imperative clothing while naming something a cold reader can't derive. Read the rewrite whole against the original; a report's preservation claim is not evidence. |
| A raw line-number citation goes stale silently | One pass cited `read-summary` SKILL.md "lines 78-84", correct that day and stale after. `RULESET.md` is `cat`'d standalone, so no pointer, line or section, reaches a reader: facts go inline. |
| A rewrite pass on this file misses in whichever direction it wasn't watching | Three passes over-trimmed it (2026-08-17 ×2, 2026-09-14), and the pass correcting the third *grew* it 78% with prose arguing for its own rules. A competent reader makes "why this rule exists" the padding a condense cuts next. Brief any pass with the measured token count and say size is not the objective in either direction, or the pass infers one. The exception is the 10,000-char ceiling, a mechanism, not a target. |
| Growth past the hook cap is silent from inside the session | The 2026-09-17 → 2026-10-08 overrun broke nothing visible: the hook still reported success and the preview still opened with rule 1. Sessions measured in that window (the 2026-09-20/21 register recurrences) were judged against rules they never received. The only trace is "Output too large (NKB)" in the start banner. Check the payload size for an adherence finding's date before reading the finding. |
| Prose makes a single rule deletable without the deletion being visible | A cut that improved the flow looked identical to a cut that removed a rule, so the cycle ran four times. Resolved 2026-09-14 by rebuilding on upstream's numbered ten-rule spine: **a missing paragraph is invisible, a missing number is not.** Count to ten and count eight exceptions (seven before 1.455.0 added "It can't be done") after any pass. Renumbering removes that check and strands `rule N` citations (2026-09-15: an exception cited rule 1 where it meant rule 2), so sweep every citation after any renumber. |
| A rule-survival grep can return zero for every version, including one you've read | A `git show \| grep -c` loop with a `\|` alternation under `sh` returned 0 for every version, including a line already read on screen. A zero that contradicts what you have seen is a broken checker. Pair every survival sweep with a known-present and a known-absent control: a single positive control passes even when the predicate is inverted. |
| `compact` is context pressure, not turn count | `compact` fires when the window fills. A 114-turn session that never fills it never re-fires the hook, so it is as decayed at turn 114 as at turn 0. The failure rate tracks session length, and the carrier, not the wording, is the binding constraint. |
| Rewording a decayed rule is the fix that has already failed here | Three passes (`6b84490` → `2c3239d` → `8cab34e`) each improved rule 10's wording (then rule 10; now rule 1), and the measured rate rose across them. The header mutated (`Privately, what I need next` → `Needed next` → `Needs:`) while the shape survived: a half-remembered rule, not an absent one. The banned-string blockquote exists because recall reconstructs prose loosely but recognises exact phrases. 1.311.0 gave rule 2's register callout the same instrument rather than a fourth principle restatement, since it decays the identical way. Unverified either way from inside a session. |
| Each rule can pass a check while the one that decayed goes unchecked | On 2026-09-21 rules 1 to 10 were each followed (short reply, led with content, no preamble) while the register rule, read once at `SessionStart` and not re-consulted when the reply was composed, failed. Judge adherence rule by rule from a transcript, never from a session's sense that the rules were met. |
| Judging output against a working-tree copy of the ruleset | A session receives the installed plugin copy, not the working tree. On 2026-09-14 the copy in context matched none of three divergent working-tree versions, so the output judged came from an older install. Confirm which copy loaded before reading output as a verdict on the file. |

---

## Adherence Measurements

Measured from outside the sessions. Log further recurrences here; do not re-propose a `UserPromptSubmit` hook (closed 2026-09-22, D-no-userpromptsubmit).

- **2026-09-14, ten transcript `.jsonl` files: 174 of 249 assistant turns (70%) opened by narrating planning state instead of answering.** The rate tracks length, not topic: 0% at 6 turns, 61% at 23, 73% at 93, 90% at 114, 100% at 26.
- **2026-09-15, an eleventh transcript (196 turns, whose `SessionStart:startup` success carries this file's text): 166 of 196 (84%) opened with a banned string.** The openers converged from paraphrase (`I'll start by`) to the literal `What I need next:` header and held for the rest of the session. This is the highest rate recorded and sits above the 70% that prompted the 2026-09-14 rewrite.

---

## Last Session (2026-11-24)

A `reclaim-disk` run found 105 retired syafiqkit copies in the plugin cache (22 GB by `du`; deleting them freed 12 GB). The prune hook had worked as written: 142 releases in 7 days outran its age-only window. Syafiq picked the count cap (D-prune-hook amendment). Then, on the product reviewer's finding that a session whose folder is pruned loses its rules silently, he picked the restart line (D-stale-session-notice). Both are shipped as 1.467.13. The copy-size fix was parked as a Next Steps item at his choice.

---

## Next Steps

### Blocking the adherence verdict
- [ ] Confirm the ruleset is *followed*, judged from outside the session that read it. Still open: `SessionStart` fires at turn 0 but the failure appears past turn ~23, so moving a rule inside a once-injected payload cannot reach the moment it fails. A scripted `claude -p --resume` chain proves the probe works, not adherence. Judge any future pass against the 84% baseline (Adherence Measurements)
- [ ] Confirm the fix reached sessions: after `claude plugin update`, a fresh session's start banner must show the full 1.455.0 ruleset with no "Output too large" line. That check is on the session, not the commit
- [ ] Treat the register recurrences (2026-09-20, 2026-09-21) and the 1.311.0 pass as **untested, not failed**: rule 2's callout sits past char 2,000, which the capped payload did not deliver then. The first real test is a transcript from a session that received the full payload
- [ ] After any pass, count to ten and count eight exceptions (Critical Gotchas)
- [ ] Measure the "It can't be done" exception (1.455.0) from outside, on a transcript started after it shipped: of the replies that conclude something is impossible or unsupported, how many open with a recommended route and name other checked routes. It sits seventh of eight in the least-recalled section, so expect decay like rule 1; log the rate in Adherence Measurements before rewording it
- [ ] See the restart line in a live session (D-stale-session-notice): rename `RULESET.md` in the installed version folder, run `/clear`, and check that the model tells the user to restart. Today it is tested only from `env -i`
- [ ] Confirm the Windows fix on a real machine (issue #37, 1.488.0): the reporter (Windows 11, Git Bash, launched from cmd.exe) updates and reports whether both `SessionStart` errors are gone and the ruleset prints. Close #37 only on their word. If prune fails with a `done\r`-style syntax error, the plugin clone applied CRLF despite `.gitattributes`
- [ ] 🟡 Shrink each cached copy (owner chose this as the follow-up, 24/11/2026): about 225 MB of each 287 MB copy is `tools/*/node_modules`, which a `directory` marketplace copies every release. D-prune-hook's "only a handful of copies remain" reason for not moving them was disproved at 105 copies. Options: keep dependencies outside the copied tree, or bump the version less often than every commit

### Deferred / accepted
- [ ] 🟡 `fork` matcher, add once its behaviour is confirmed (D-fork-excluded)
- [ ] 🟡 Off-switch, only if a colleague asks, and it reopens D-no-off-switch rather than patching around it
