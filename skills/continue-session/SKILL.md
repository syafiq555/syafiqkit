---
name: continue-session
description: >
  Produce a copy-paste prompt that starts a fresh session where this one stopped —
  the task doc path, the next goal and uncommitted state — open decisions stay in the
  task doc for the NEXT session to ask via AskUserQuestion, never listed in the paste. Use when
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

A session ending with work deferred — not finished, parked for next time — is the moment to offer it. The signals are observable:

- Work was deferred with a reason (time, context, decision needed).
- The session visibly compacted: earlier turns summarised, a skill re-read mid-run because it left your context.
- The user says running low, clearing, or starting fresh.

⚠️ **Do not estimate your own remaining context.** Your sense of context reports willingness, not membership — the answer reads identical whether something was loaded and deemed irrelevant or never loaded at all. `/context` is the user's command; you cannot read it. Key on observable signals instead.

Offer once, at the end of the wrap-up. Don't insist.

## What the prompt carries

The task doc holds the plan. The prompt carries only what points at it:

1. **`/syafiqkit:read-summary <exact task doc path>`** — literal path, never a topic. Keyword discovery can miss the doc; a handoff that sends the next session hunting has failed. Confirm the path resolves first — a doc renamed or merged this session leaves your remembered name pointing at nothing, which the next session reads as "no doc".
2. **`Next:`** — one line naming the goal. Point at the doc's Quick Start for execution order. No waves, blockers, or KIV blocks — those live in the doc and restating them creates drift. Re-read the Quick Start first: if it's missing or disagrees with your `Next:`, fix the doc through a scoped `task-summary` invoke, not by hand — it's what the next session will actually read. When this runs inside an unfinished `/done`, the hand edit is what makes `/done`'s Knowledge and Task docs rows read as done with neither skill invoked: finish `/done`'s Steps 3 and 4 first and write the paste last (measured 2026-10-23: the user asked "i think u didnt run task summary and update-claude-docs ?"). No task doc at all is the finding itself, and the remedy is to create it now through `task-summary` (leaving plan mode first if it is on), absorbing the plan, then pointing the paste at it. A paste pointing at `~/.claude/plans/` or another personal-machine file is a source, not a home: the next session builds from a plan nothing maintains, and the user ends up invoking `task-summary` themselves (measured 2026-10-20). While the Quick Start is open, check that work adding or reshaping screens has a design-research step (`uiux`, or `design-handoff` where the team designs elsewhere) before its first build step; a plan whose files include pages but whose steps begin at the migration hands over a build with no design. When the Quick Start's next actions span more than one repo or product, the doc's order says what is unblocked, not what the user is focusing on, so ask which comes first through `AskUserQuestion` before writing `Next:` (measured 2026-10-20: a paste naming the doc's first step, a Dourr build, came back as "we are focusing on the Autorentic one").
3. **Uncommitted state** — file count and sha, with "don't commit unless asked" where the tree is dirty.

**The paste may start while this session is still alive.** Users often open it in a parallel session on the same checkout, and the default above assumes this one has ended. Say up front whether that's safe, and if it is, add a `Running:` line to the paste naming what this session still has in flight: a test suite, a background agent, a file it may still edit. Those are the things the new session would otherwise commit around or run a second suite against. Before handing over, stop editing the files the paste names, and say so. Parallel is unsuitable while this session still has edits to make to those files: two writers on one file share one commit. **Tell: you wrote the paste, this session is still running something, and the paste doesn't name it.**

Open product decisions live in the task doc for the next session to surface via `AskUserQuestion` before building — never list them in the paste. A KIV in a paste is a question nobody answers. Don't ask at handoff time; let the next session ask the user. With no open decisions in the doc, drop that clause from `Next:`.

Fence it, and put nothing after the closing backticks — text below a fence reads as part of the paste.

**A follow-up after the paste is shown amends the paste, not this session's work.** "It needs X too, right?" said against a handoff means put X in the doc's Quick Start and the paste; starting X here spends this session on what the user just scheduled for the next one (measured 2026-10-20: "needs uiux/haiku research" launched two research agents, and the user said they meant the next-session prompt). Where it is genuinely unclear, amend the handoff and offer to run it now as a choice.

## Shape

```
/syafiqkit:read-summary tasks/<domain>/<topic>/current.md

Next: <the goal> — follow the Quick Start order. First ask me the open product decisions in the doc with AskUserQuestion.
State: <N files uncommitted / all committed at <sha>> — don't commit unless asked.
Running: <only when this session is still live: what it has in flight, e.g. "the previous session's PHPUnit run, wait for it before your own">
```

Keep it to what a fresh session cannot recover on its own. Everything else is in the doc it will read first, and duplicating it here means two copies that drift.
