---
name: quick-done
description: The cheap post-task check for a session you already know was small — one code reviewer, one task-doc update, nothing else. Use when the user says "quick done", "quick wrap", "small change, just quick-done it", "wrap it up cheaply", or otherwise pairs a wrap-up request with a size or cost signal ("small", "quick", "cheap", "light", "just a typo") — that pairing beats /done's bare "wrap up" trigger. Deliberately skips the simplifier, the product reviewer, and the CLAUDE.md capture pass. Use /done instead for anything multi-file, multi-domain, a new user-facing flow, or when it isn't clear which fits — /done is the safe default, this skill is the deliberate exception.
---

# Quick Done

The cheap sibling of `/done`, for a session the user has already judged small.

If the session turns out bigger than it looked — several unrelated changes, a new user-facing journey, more than one domain — say `/done` fits better rather than absorbing the extra scope here. Growing this skill to cover a large session is how it stops being the cheap option.

## Step 1: Review

Run `git status --short` in every repo in play, then spawn one reviewer:

| Project agent at `.claude/agents/code-reviewer.md`? | `subagent_type` |
|---|---|
| Yes | `"code-reviewer"` |
| No | `"feature-dev:code-reviewer"` |

Give it the full changed-file list and a review-shaped prompt — bugs, security, logic errors, convention violations. Not cleanup, not journey completeness. One agent, no partitioning: a file count that genuinely doesn't fit one reviewer's attention is the signal this session doesn't fit this skill.

Project agents read CLAUDE.md and the task doc themselves — don't paste project conventions into the prompt.

Ban the repo-wide verbs in the prompt — `../_shared/references/agent-prompt-verb-ban.md`. A one-agent dispatch is no safer here than `/done`'s fan-out; the exposure is per-agent.

When the reviewer returns, a finding is a diagnosis, not a verified defect. Confirm it against the file as it stands now before acting, and re-run whatever failed after fixing it.

## Step 2: Task doc

Invoke `syafiqkit:task-summary` bare. An explicit path skips its multi-domain scan and misses related docs. This is the only doc write in this skill.

## Step 3: Plugin gate — only if it fires

```bash
git status --short -- 'skills/**/*.md' 'commands/*.md' '.claude/agents/*.md'
```

Run it from the plugin checkout as CWD, not `git -C <path>` — that walks up to an enclosing repo and answers about the wrong tree.

The checkout is shared across every project, so it may carry another session's work. Settle ownership by mtime against session start (`stat -f '%Sm' -t '%m-%d %H:%M' <file>` on macOS); files predating the session drop out. Anything surviving means a skill file was hand-edited this session — invoke `syafiqkit:update-plugin`, which owns everything downstream. An empty list means the gate didn't fire; skip silently and omit the row.

## Exit gate

Each Output row claims a step ran. The reviewer must have actually run with a review prompt, and `task-summary`'s target doc must actually have changed — invoking is not updating, so check with `git diff HEAD --stat -- <path>`. A row you can't substantiate is a step to go run, not a row to write.

## What this deliberately doesn't do

- **No simplifier, no product reviewer.** A new user-facing flow, or any doubt the feature is complete end-to-end, wants `/done`'s product lens.
- **No `update-claude-docs` pass.** A broadly reusable pattern this session surfaced — an env gotcha, a convention worth keeping — will not reach CLAUDE.md through this skill. If one came up, say so and either run `/update-claude-docs` directly or use `/done`.
- **No temp-artifact cleanup scan.**
- **No Gate A** — `/done` also captures a skill that misfired or a step that was wrong. Nothing here prompts for that, so if something felt off about a skill this session, say so and let `/update-plugin` judge it.
- **No mode selection.** A session varied enough to need one is a session for `/done`.

## Output

```
## Quick Done Summary

| Step | Result |
|------|--------|
| Review | [issues found + fixed, or ✅ clean] |
| Task doc | [doc path → one-line summary] |
| Plugin | [skill files patched + version bump — omit row if the gate didn't fire] |

Skipped by design: simplify, product review, CLAUDE.md capture, cleanup scan.
```
