---
name: continue-session
description: >
  Produce a copy-paste prompt that starts a fresh session where this one stopped —
  the task doc path, the one next task, the blocker, and uncommitted state. Use when
  the user says "continuation prompt", "handoff prompt", "carry this over", "I'm
  running out of context", "start a new session for this", "what do I paste into the
  next one", or when a session is ending with work deferred rather than finished.
  Offered by `done` and `quick-done` at wrap-up. This WRITES A PROMPT and stops —
  it does not continue the work. "Let's continue" / "do the next steps", meaning
  carry on building now in this session, is `tackle`. Briefing a person or an
  external designer is `design-handoff`.
---

# Continue Session

A fresh session knows nothing. This writes the paste that fixes that.

## When to offer it unprompted

The user asks for this maybe once; the rest of the time it should be offered at the moment a session is ending with work left. The signals are things you can observe, not a number you estimate:

- Work was deferred this session with a reason — "not enough room to build it", "next session", anything parked rather than finished.
- The session has visibly compacted: earlier turns are summarised, or a skill's steps left your context mid-run and had to be re-read.
- The user says they are running low, clearing, or starting fresh.

⚠️ **Do not try to measure your own remaining context.** A session asked what it has in context reports willingness, not membership — the answer reads identical whether a thing was never loaded or was loaded and judged irrelevant, so a percentage you estimate is invented. `/context` is the user's command and shows them the real figure; you cannot read it. Key on the observable events above instead, the same way `done` keys on "the exit gate is missing from your context, that is the compaction."

Offer, don't insist. One line at the end of the wrap-up is enough.

## What the prompt carries

The point is that the next session can act without re-deriving anything. Four things do that:

1. **`/syafiqkit:read-summary <exact task doc path>`** as the first line — the literal path, never a topic. Keyword discovery can miss the doc, and a handoff that sends the next session hunting has failed at its only job.
2. **The one next task**, its scope, and what is explicitly out of scope. One task, not the backlog; a list invites the next session to pick.

    ⚠️ **Unless the invocation asks for scale** — "the max we can do", "everything left", "as much as fits". Then one task is the wrong answer and reads as diligence: the rule above is right for a default handoff, so it holds while the user's own argument contradicts it. Give the whole reachable set, but SEQUENCED so it still cannot be cherry-picked — ordered waves, each one a file partition that can go to parallel builders, with the gating item alone in wave 0 and the verification that must pass before the next wave starts. What keeps that from becoming the backlog-dump the rule forbids is the second half: every item the next session must NOT decide goes in an explicit KIV block naming whose call it is. Read the task docs' own Next Steps to build this rather than recalling the session — and fix any item that is now stale (work you completed, or a fix rendered moot) before carrying it across, since a handoff that sends the next session at a deleted component fails the same way a missing path does. **Tell: the user asked for maximum and your draft names a single task.**
3. **The blocker** that must be solved first — the non-obvious one, the thing that cost this session time to find. If there isn't one, say so rather than inventing.
4. **Uncommitted state**, with "don't commit unless asked" where the tree is dirty.

Most of 2–4 is what the task doc's Quick Start already answers. **Read the Quick Start you just wrote and carry it across** rather than re-deriving from the conversation — if the two disagree, the doc is what the next session will actually read, so fix the doc first. Where no task doc exists, that is the finding: the next session needs one more than it needs this prompt, so say so.

Fence it, and put nothing after the closing backticks — text below a fence reads as part of the paste.

## Shape

```
/syafiqkit:read-summary tasks/<domain>/<topic>/current.md

Next: <the one task — what to build, and what's out of scope>
Blocker: <the thing to solve first, or "none known">
State: <N files uncommitted / all committed at <sha>> — don't commit unless asked.
```

Asked for scale, `Next:` becomes ordered waves and gains a KIV block; the other lines are unchanged:

```
/syafiqkit:read-summary tasks/<domain>/<topic>/current.md

Next: <the goal>. Partition by file, parallel builders per wave, specs between waves.

WAVE 0 — <the gating item, alone, because the rest depends on it>
WAVE 1 — <independent files, N builders>
WAVE 2 — <next tranche>

KIV — do NOT decide these, they are the user's call: <item + where it's parked>

Blocker: <...>
State: <...>
```

Keep it to what a fresh session cannot recover on its own. Everything else is in the doc it will read first, and duplicating it here means two copies that drift.
