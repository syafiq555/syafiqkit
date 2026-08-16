<!--LLM-CONTEXT
Status: Shipped (v1.163.0) — one open verification
Domain: plugin-maintenance/output-style-hook
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../agent-architecture/current.md (sibling feature — how agents are defined and dispatched)
  - ../external-guidance/current.md (sibling feature — grading outside guidance against local evidence)
  - ../../../hooks/RULESET.md (the injected payload)
Last updated: 2026-08-17
-->

# Plugin Maintenance — Output-Style Hook

## Quick Start (read this first in next session)

**Where we are**: syafiqkit ships a `SessionStart` hook that `cat`s an output-style ruleset into every session. Built and loaded — `/reload-plugins` reports `1 hook`. One thing remains unverified: whether output actually changes shape, which needs a session started after the hook existed.

**Immediate next actions (in order)**:
1. Start a fresh session, ask something ordinary, and check whether the answer leads with the action. A ruleset present in context but ignored looks identical to one that's working.
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

Auto-discovered by well-known path; neither manifest declares a `hooks` field. Matchers `startup|resume|clear|compact`. Roughly 5.2KB per injection (~1,200 tokens), appended after the cached prefix so it pays full rate once and cache-reads after.

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

---

## Next Steps

**Verification**
- Confirm output shape actually changes in a session started after the hook loaded — the ruleset being in context proves nothing about whether it's followed
- Observe missing-file behaviour end-to-end (rename `RULESET.md`, start a session) rather than inferring it from `cat` exiting 1 plus a documented exit-code table

**Deferred by decision**
- `fork` matcher — add once its behaviour is confirmed (D-fork-excluded)
- Off-switch — only if a colleague asks, and it reopens D-no-off-switch rather than patching around it

---

## Last Session (2026-08-17)

Built the hook end to end: `hooks.json`, `RULESET.md` (drafted, then two `unhobble-instructions` passes via `haiku` with three cut facts patched back), version bump to 1.163.0 in both manifests, plus CLAUDE.md/README/CHANGELOG documentation.

`/done` ran docs-only mode. The reviewer caught the `fork` matcher contradicting "every session" claims in three docs; the product reviewer caught the README promising no escape while hiding `claude plugin uninstall`, and an ENOENT claim in CLAUDE.md stated as settled when only half of it had been tested. All fixed.

Version landed on 1.163.0 rather than the planned 1.162.0 — a concurrent session staged a 1.162.0 changelog entry mid-run.
