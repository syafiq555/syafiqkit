# What a Task Doc Is Authoritative For — and the Staleness Handoff

Cold path for `read-summary`. Reached *after* a doc is loaded: what to trust it for, and what to do when it contradicts the code.

## Staleness handoff (don't just narrate it)

⚠️ Reading a doc is also **auditing** it. While loading context you will often catch the doc contradicting the code you just examined — a `Status:` saying "not done" for a built feature, a `Provider:`/dependency the code has since swapped, a `Key files` path that moved, a date-conditioned caveat now past. **Do NOT just mention the drift in passing and move on** — that drops the fix on the floor, the exact failure this skill exists to prevent.

1. **Sweep, don't spot-report.** The contradicting line is where you *noticed* drift, not its extent — `Quick Start`, `Status:`, and `Immediate next actions` are written once and revisited least, so they hold the costliest staleness (a shipped fix still listed as "staged, deploy this next" sends the reader to redo it). Re-check those fields against reality and report them together.
2. **Name it explicitly** as a stale-doc finding (which doc, which line/field, what the code actually shows), separate from answering the user's question.
3. **Route it so it survives silence** — this skill is read-only, so the fix belongs to `task-summary` (project facts) or `update-plugin` (skill/command defects). ⚠️ An offer parked on the user's reply is NOT routing: they will often act on your answer and never respond, and the finding dies. Either hand off in the same turn, or state the correction as an owed action you carry into the next doc-writing skill — never as a question that expires unanswered.

Staleness you surface and route is closed; staleness you narrate and abandon is a silent regression waiting for the user to catch it later.

## A doc's diagnosis for an open bug is a hypothesis

⚠️ **Confidence is the symptom, not the evidence.** Two shapes, both making you (or an agent) confidently cite a wrong cause:

1. A live "OPEN BUG" row whose diagnosis a *different* doc has since RETRACTED — tells: the row prescribes a fix for a "decided" issue, or the behaviour has an accepted workflow around it in the owning doc.
2. A doc's stated root cause for a bug it *still* lists as open, uncontradicted — tells: it prescribes a fix despite the bug being open (a decided fix implies a decided diagnosis), or its own `Last Session` admits writing it from the symptom.

Either way: read the code path the doc blames before changing it. Expect the real cause to be adjacent but different in kind from what's written.

## Authoritative FOR vs. NOT

⚠️ **A task doc is authoritative for DECISIONS and GOTCHAS. It is NOT a live-state oracle.**

| The doc IS authoritative for | The doc is NOT authoritative for |
|------------------------------|----------------------------------|
| Why it's built this way (ADRs, rejected options) | What's in prod's DB / `.env` / a bucket **right now** |
| What will bite you (gotchas, traps, invariants) | Whether a flag is on, a table exists, a row is populated |
| Vocabulary, ownership, blast radius | Whether a bug it calls "open" is still open |
| Why we picked/evaluated a third-party tool | **What that tool actually DOES** — its delete/write scope lives in its source, never in our summary |

⚠️ **The mirror trap: when the doc HAS already made a decision, USE it — don't re-derive it and hand it back as a question.** A decision-heavy doc often records the tradeoff, the rejected options, and the chosen answer for exactly the fork you're about to raise. Reading the doc and then presenting that same fork via `AskUserQuestion` reads as not having read it — the answer comes back "it's in the doc." **Tell: your clarifying question restates a tradeoff the doc's Decisions/ADRs already resolved.** Ask only what THEIR context decides (a preference, a priority, a fact only they hold).

A well-read doc feels *fully grounded* — the trap is answering a live-state question from a weeks-stale snapshot with total confidence. **If the answer depends on the current state of a running system, go MEASURE it**, then reconcile. When doc and live system disagree, the live system wins and the doc gets routed for update. Three specific cases:

- **Running a researched tool** — a doc researching X doesn't license running it once the task shifts to "let's use X" and X writes/deletes/migrates. Its summary bullets (stack, license, install command) describe the box, not the delete paths inside. Read the tool's source and issue tracker for data-loss reports before the first destructive command — measuring the live system doesn't substitute, since you can profile every byte on disk and still not know what the tool removes. Tell: you can't name, from code you read, the exact paths the command touches.
- **Remote state from local absence** — never infer a REMOTE system's state from a LOCAL file's absence ("prod's `.env` has no `AWS_*`" describes wiring, not whether the bucket exists). Ask the remote system with a call that discriminates (`HeadBucket`: 403 = exists-but-denied vs 404 = absent).
- **"It's the staging/test one"** — a live-state CLAIM, not a property of the name; measure before recommending anything irreversible. A doc saying "staging exists for e2e, flag is on" describes what the env was SET UP to be, never what it IS now. Test-ness lives in one value (API-key prefix, bucket name, DB name, `mode` field) — name it and read it from the running process (`printenv KEY` + a control that must resolve).
