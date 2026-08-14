---
name: quick-done
description: The cheap post-task wrap-up for a session you already know was small — the CLAUDE.md capture pass and one task-doc update, nothing else. Use when the user says "quick done", "quick wrap", "small change, just quick-done it", "wrap it up cheaply", or otherwise pairs a wrap-up request with a size or cost signal ("small", "quick", "cheap", "light", "just a typo") — that pairing beats /done's bare "wrap up" trigger. This skill is docs-only and spawns no reviewer, so nothing here reads the code for defects; it deliberately skips the code review, the simplifier, and the product reviewer. Use /done instead for anything multi-file, multi-domain, a new user-facing flow, anything about to ship, or when it isn't clear which fits — /done is the safe default, this skill is the deliberate exception.
---

# Quick Done

The cheap sibling of `/done`, for a session the user has already judged small.

If the session turns out bigger than it looked — several unrelated changes, a new user-facing journey, more than one domain — say `/done` fits better rather than absorbing the extra scope here. Growing this skill to cover a large session is how it stops being the cheap option.

## Step 1: CLAUDE.md capture

Run `git status --short` in every repo in play first — the changed-file list is what tells you which CLAUDE.md files are even in scope.

Invoke `syafiqkit:update-claude-docs`. It owns the capture decision, including deciding there's nothing worth capturing; a small session often surfaces no reusable pattern, and an empty pass is a real outcome, not a failed step.

If that skill spawns an agent, the repo-wide verb ban applies — `../_shared/references/agent-prompt-verb-ban.md`. The exposure is per-agent, so one dispatch is no safer than a fan-out.

## Step 2: Task doc

Invoke `syafiqkit:task-summary` bare. An explicit path skips its multi-domain scan and misses related docs. Run it after Step 1, not alongside — the two doc skills are sequential-dependent, so overlapping them is what the ordering exists to prevent.

## Step 3: Plugin gate — only if it fires

The checkout is shared across every project, so it may carry another session's concurrent work. Any file you don't remember editing must be read before assuming it's yours — a foreign edit is recognisable on sight, and shipping one under your version bump is the failure this gate exists to prevent.

**Check ownership:**
1. Run `git status --short -- 'skills/**/*.md' 'commands/*.md' '.claude/agents/*.md'` from the plugin checkout as CWD, not `git -C <path>` — that walks up to an enclosing repo and answers about the wrong tree. An empty list means the gate didn't fire; skip silently and omit the row.

2. For each file, verify you edited it this session:
   - **Mtime check:** `stat -f '%Sm' -t '%m-%d %H:%M' <file>` on macOS. Files predating your session start were edited by another. 
   - **Diff check on unknowns:** Read `git diff HEAD -- <file>` on anything you don't remember editing. A bare `git diff` misses the staged plane (`📖 ../_shared/references/diff-ownership.md`). Ask before treating an unrecognised file as yours. `ListAgents` can confirm a peer session is live (`📖 ../_shared/references/cross-session-messaging.md`), but the diff read is the only durable check.

What survives both checks was hand-edited this session — invoke `syafiqkit:update-plugin`, which owns everything downstream.

## Exit gate

Each Output row claims a step ran. Both doc steps write files, so substantiate them the same way — `git diff HEAD --stat -- <path>` — since invoking a skill is not the same as it having changed anything. The one asymmetry: `update-claude-docs` legitimately writes nothing when the session surfaced no reusable pattern, so an empty diff there is a real result to report as such, while an empty diff from `task-summary` means the step still needs running. A row you can't substantiate is a step to go run, not a row to write.

## What this deliberately doesn't do

- **No code review.** Nothing in this skill reads the diff for bugs, security holes, or convention violations — the steps are both documentation writes. A session wrapped here has unreviewed code, which matters most on the way to `/ship`: run `/done`, or a review of your own, before shipping anything wrapped this way.
- **No simplifier, no product reviewer.** A new user-facing flow, or any doubt the feature is complete end-to-end, wants `/done`'s product lens.
- **No temp-artifact cleanup scan.**
- **No Gate A** — `/done` also captures a skill that misfired or a step that was wrong. Nothing here prompts for that, so if something felt off about a skill this session, say so and let `/update-plugin` judge it.
- **No mode selection.** A session varied enough to need one is a session for `/done`.

## Output

```
## Decisions

1️⃣ [what's true now]
   [the question]

(only when something open surfaced — shape and thresholds in `../_shared/references/decision-first-output.md`)

## Quick Done Summary

| Step | Result |
|------|--------|
| CLAUDE.md | [file path → what was captured, or "nothing reusable surfaced"] |
| Task doc | [doc path → one-line summary] |
| Plugin | [skill files patched + version bump — omit row if the gate didn't fire] |

Skipped by design: code review, simplify, product review, cleanup scan. The code was not read for defects.
```

No product reviewer runs here, so a build-or-skip gap is rare — but `task-summary` can surface its own Decisions output if something the user must decide emerges (a stub worth creating, a doc stale enough to act on). If it does, that appears in task-summary's own report, independent of this skill's Decisions section above.
