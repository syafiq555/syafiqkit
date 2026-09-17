<!--LLM-CONTEXT
Status: Shipped (v1.163.0, pushed 2c3239d); ruleset rebuilt on a numbered spine 2026-09-14, reordered 2026-09-15 so the most-failed rule leads (both committed in 1.291.0) — injection verified; adherence MEASURED at 70% across ten transcripts (2026-09-14) and 84% on an eleventh (2026-09-15), the worst yet and on a session that received the current file. Four wording/position passes have not moved it; `{#rule-placement}` says the carrier is the binding constraint, and the `UserPromptSubmit` row is empty
Domain: plugin-maintenance/output-style-hook
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../agent-architecture/current.md (sibling feature — how agents are defined and dispatched)
  - ../external-guidance/current.md (sibling feature — grading outside guidance against local evidence)
  - ../../../hooks/RULESET.md (the injected payload)
Last updated: 2026-09-14
-->

# Plugin Maintenance — Output-Style Hook

## Quick Start (read this first in next session)

**Where we are**: syafiqkit ships a `SessionStart` hook that `cat`s an output-style ruleset into every session. Pushed to `master` as `2c3239d`; installed copy confirmed at 1.163.0. Injection is verified — a `SessionStart:clear` in a later session delivered the full `RULESET.md` body into context. Whether output actually *follows* the ruleset is still open, and can't be settled by the session reading it.

**Immediate next actions (in order)**:
1. Judge the shape from outside: read back answers from a session that had the hook, rather than asking that session to grade itself. A ruleset present in context but ignored looks identical to one that's working, and self-assessment can't tell them apart.
2. If a session ever fails to start, rename `hooks/RULESET.md` and retry — the no-guard design assumes a missing file degrades rather than blocks, and that has not been observed end-to-end.

**Gotchas that will trip you**:
- The hook is `cat` with no script, so it cannot read an env var — there is **no off-switch**, and adding one means adding a script and reopening the design (see D-no-off-switch)
- `node` is not a safe hook interpreter on this machine even though it is on the interactive PATH (see D-cat-not-node)
- `fork` is the fifth `SessionStart` matcher and is deliberately unwired, so forked sessions get no ruleset (see D-fork-excluded)

---

## Overview

Every syafiqkit skill is procedural — it tells a session what steps to take when invoked. Nothing shaped *how* results get reported, and no skill could: a skill only reaches sessions that call it. Spreading output rules across 33 SKILL.md files would drift immediately and still miss every skill added later.

A `SessionStart` hook fires once before anything else, which makes it the only host reaching a whole session. The payload is an ADHD-oriented ruleset adapted from [ayghri/i-have-adhd](https://github.com/ayghri/i-have-adhd): lead with the action, number multi-step work, concrete time units, suppress tangents, drop stock openers and closers.

---

## Architecture {#architecture}

```
hooks/hooks.json     exec form → cat + ${CLAUDE_PLUGIN_ROOT}/hooks/RULESET.md
hooks/RULESET.md     the injected payload, plain markdown, no frontmatter
```

Auto-discovered by well-known path; neither manifest declares a `hooks` field. Matchers `startup|resume|clear|compact`. Roughly 6.4KB per injection (1342 tokens, cl100k_base, measured 2026-09-14 after the numbered-spine rebuild; was 999 tokens), appended after the cached prefix so it pays full rate once and cache-reads after. Measure with a tokenizer, never `bytes ÷ 4` — this file's prose runs 4.78 bytes/token, so the divisor over-reports by ~20%. The cost recurs per session rather than per read, which is the argument to weigh against any future growth.

---

## Key Technical Decisions

### D-cat-not-node — `cat` as the hook command, not a Node script

**Status**: shipped 2026-08-17
**Context**: The reference implementation wires a Node script and ships unwired `.sh`/`.ps1` fallbacks. Copying that shape would have produced a hook that silently does nothing on the author's own machine.
**Decision**: `"command": "cat"`, `"args": ["${CLAUDE_PLUGIN_ROOT}/hooks/RULESET.md"]` in exec form.
**Rejected**: Node primary — Claude Code now ships as a native binary, so installing the CLI brings no Node, and a version-managed `node` (nvm, Herd) lives on the PATH only because the shell profile puts it there. Exec-form hooks source no profile. A shell-form interpreter probe was also rejected: it reintroduces the quoting hazards exec form avoids, and shell form on Windows needs Git Bash anyway, so the gap only moves.
**Consequences**: `/bin/cat` resolves from a clean environment on macOS and Linux, so coverage holds there and on Windows-with-Git-Bash while bare Windows gets a silent no-op. Removing the script also removed the reasons a script needs machinery: `${CLAUDE_PLUGIN_ROOT}` expands in `hooks.json` but not inside a script body, and a frontmatter-bearing payload would need strip logic whose edge cases are what the upstream test suite exists to catch.

### D-no-off-switch — On by default with no toggle

**Status**: shipped 2026-08-17
**Context**: syafiqkit has colleague users who installed it for `/commit` and `/ship`. On-by-default reshapes their output on the next update.
**Decision**: No off-switch. `cat` cannot check an env var, and a guard means a script.
**Rejected**: A flag file or env var gate, which would have restored the script and every problem it carries.
**Consequences**: The release note and README carry the weight instead — both name `claude plugin uninstall syafiqkit@syafiqkit` as the only escape, because a section promising "no way back" while the actual off-ramp sits under an unrelated heading strands the reader who most needs it. Any request to make the style optional reopens the shape rather than patching it.

### D-fork-excluded — Four matchers, not five

**Status**: shipped 2026-08-17
**Context**: `SessionStart` documents five matchers. `fork` covers sessions branched via `--fork-session`, `/fork` or `/branch`.
**Decision**: Wire `startup|resume|clear|compact` only.
**Rejected**: Including `fork`, whose behaviour with hook output was never verified.
**Consequences**: A bounded, nameable gap beats machinery that would first misbehave in production. Adding it later is a one-token change once someone confirms what a forked session does — at which point the carve-out wording in `README.md` and the changelog comes out too.

---

## Critical Gotchas

| Gotcha | Mechanism |
|--------|-----------|
| An interpreter on your interactive PATH may be invisible to a hook | Version managers add binaries from the shell profile; exec-form hooks source no profile. `env -i PATH="/usr/bin:/bin" sh -c 'command -v <tool>'` answers what a spawned process sees. |
| A reference implementation's file list is not its wiring | Upstream ships three runtimes and wires one. Read what a project *executes*, not what it contains — the unexecuted files look like coverage and provide none. |
| An unhobble pass trims by appearance, not by derivability | Two passes over `RULESET.md` cut a numbered-steps principle, a cross-skill precedence fact, and a self-guard against over-trimming — each wore imperative clothing while naming something a cold reader can't derive. Read the rewrite whole against the original; a report's confident preservation claim costs nothing to write. |
| A raw line-number citation goes stale silently | One pass cited `read-summary` SKILL.md "lines 78-84". The numbers were correct that day. `RULESET.md` is `cat`'d standalone, so a reader can't follow a pointer anywhere — facts have to be inline. |
| A rewrite pass on this file misses in whichever direction it wasn't watching | Three passes over-trimmed it (2026-08-17 ×2, 2026-09-14), and the pass correcting the third *grew* it 78% with prose arguing for its own rules — a reader arrives competent, so "why this rule exists" is the padding a condense pass will cut next, restarting the cycle. Brief a pass on this file with the measured token count and state plainly that size is not the objective in either direction; without that, an agent infers one. |
| Prose makes a single rule deletable without the deletion being visible | The cycle above ran four times because the file had no inventory to check a rewrite against: a cut that improved the flow looked identical to a cut that removed a rule. Resolved 2026-09-14 by rebuilding on upstream's numbered ten-rule spine — **a missing paragraph is invisible, a missing number is not.** A pass over this file is now verifiable: count to ten, count seven exceptions. Renumbering or un-numbering the rules removes the only check that catches the recurrence. |
| A rule-survival grep can return zero for every version including one you've read | While auditing which rules each version still held, a `git show \| grep -c` loop with a `\|` alternation under `sh` returned 0 across the board — including for a line already read on screen in that same session. The all-zero table was reported as a finding before the contradiction was noticed. A zero contradicting something you have seen is a broken checker, so pair every survival sweep with a known-present AND a known-absent control; a single positive control passes even when the predicate is inverted. |
| `compact` is context pressure, not turn count | The matcher list reads as periodic coverage, so a long session looks self-correcting. It isn't: `compact` fires when the window fills, so a 114-turn session that never fills it never re-fires the hook and is exactly as decayed at turn 114 as before. This is why the measured failure rate tracks session length and why the carrier, not the wording, is the binding constraint. |
| Rewording a decayed rule is the fix that has already failed here | Three passes (`6b84490` → `2c3239d` → `8cab34e`) each improved rule 10's wording; the measured rate rose across them. The header mutated (`Privately, what I need next` → `Needed next` → `Needs:`) while the shape underneath survived every time — a half-remembered rule, not an absent one. Rule 10's banned-string blockquote exists because recall reconstructs prose loosely but recognises exact phrases; that enumeration is deliberate and is the one place in this file where a list beats a principle. |

---

## Next Steps

**Verification**
- ✅ Injection confirmed 2026-08-17 — a `SessionStart:clear` in a subsequent session delivered `RULESET.md` in full as hook output
- ✅ Adherence measured 2026-09-14 from outside the sessions, by parsing ten transcript `.jsonl` files: **174 of 249 assistant turns (70%) opened by narrating planning state instead of answering.** Per-session rate tracks length, not topic — 0% at 6 turns, 61% at 23, 73% at 93, 90% at 114, 100% at 26. This is the first evidence of adherence the item below had been open for since 2026-08-17, and it answers it in the negative
- ✅ Re-measured 2026-09-15 on an eleventh transcript, a 196-turn session whose line-5 `SessionStart:startup` hook success carries this file's own text: **166 of 196 turns (84%)** opened with a banned string. The openers converged from paraphrase (`I'll start by`, `the honest list of what I still need`) to the literal `What I need next:` header and then held for the rest of the session. This is the highest rate yet recorded and lands *above* the 70% that prompted the 2026-09-14 rewrite
- Confirm the ruleset is actually *followed*, judged from outside the session that read it — a session grading its own output shape is not evidence. **Still open**, and the 2026-09-15 reorder does not close it: `SessionStart` fires at turn 0 while the failure is measured at turn 23+, so moving a rule within a once-injected payload cannot reach the moment it fails. Judge any future pass against the 84% baseline
- **Decide the carrier before attempting a fifth wording pass.** `CLAUDE.md` `{#rule-placement}` puts a rule that must hold every turn in a `UserPromptSubmit` hook — the only mechanism the harness executes per-turn rather than the model choosing to recall — and nothing currently occupies that row. Four passes have now moved rule 10's wording or position (`6b84490` → `2c3239d` → `8cab34e` → 2026-09-15) and the measured rate rose across them; a fifth is the same experiment
- Re-check rule survival after any future pass — count to ten, count seven exceptions. This is the check the four prior cycles had no way to run
- Observe missing-file behaviour end-to-end (rename `RULESET.md`, start a session) rather than inferring it from `cat` exiting 1 plus a documented exit-code table

**Deferred by decision**
- `fork` matcher — add once its behaviour is confirmed (D-fork-excluded)
- Off-switch — only if a colleague asks, and it reopens D-no-off-switch rather than patching around it

---

## Last Session (2026-09-15)

Re-measured adherence on an eleventh transcript and got 84% — the worst rate yet, on a session that provably received the current file. Reordered the ruleset so the most-failed rule sits first: rule 10 became rule 1, the other nine renumbered, via `condense-claude-md` (8295 → 7786 bytes). Three defects followed from that pass and were fixed by hand: it deleted rule 5's "same rule seen from two ends" sentence as a dead cross-reference when the renumber made it fixable; it dropped the 70/100/0 measured figures while keeping the "the failure is measurable" claim they supported; and it renumbered without sweeping citations, leaving the Exceptions section's decision-first carve-out pointing at rule 1 when it means rule 2. Restored all three, and folded the 84% into the evidence paragraph. Final: 61 lines, rules 1–10 intact, seven exceptions, both `rule N` citations verified against what the numbers now name.

A ten-turn `claude -p --resume` chain confirmed the probe mechanism works but proved nothing about adherence — ten turns tests the regime where this file already scores 0%. The failure is recall decay past turn ~23; a short scripted chain cannot reach it.

Not committed. The reorder is attempt four at the same rule and the doc does not claim it will move the number — see Next Steps on deciding the carrier.

## Last Session (2026-09-14)

User reported dissatisfaction with the ruleset and pointed at upstream `ayghri/i-have-adhd` to study. The working tree held three divergent versions — HEAD 5291 bytes, staged 3341, worktree 4934 — and the SessionStart copy in context matched none of them, so the output being judged came from an older installed copy. Four rules had been lost across the cut-then-regrow cycle: flat errors, no-preamble/recap/closers, the `read-summary` precedence fact (cut once before and restored), and the ambiguity exception. Rebuilt on upstream's numbered ten-rule spine with seven explicit exceptions, all four restored, verified by grep with both a known-present and known-absent control. 1342 tokens. Fixed manifest drift (1.277.0 vs 1.275.0) and bumped both to 1.278.0.

Not done: nothing is committed. Adherence remains unverifiable from inside the session that read the ruleset, and this rebuild does not change that — the open verification item below still stands, and now has a fresh payload to judge.

## Last Session (2026-08-17)

Built hook end-to-end, drafted and two passes refined `RULESET.md`. Reviewers caught `fork` matcher contradicting docs, README hiding the escape hatch, and a half-tested ENOENT claim. Version bumped to 1.163.0 (concurrent session conflict with planned 1.162.0).
