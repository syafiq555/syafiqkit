# What a Task Doc Is Authoritative For — and the Staleness Handoff

Cold path for `read-summary`. Reached *after* a doc is loaded: what to trust it for, and what to do when it contradicts the code.

## Staleness handoff

The sweep/name/route logic (reading a doc is also auditing it; don't narrate drift and move on) is stated in full in `SKILL.md`'s "After the doc loads: authority limits + staleness" section — this file doesn't restate it. What's specific to *this* file is the authoritative-for boundary and the live-state cases below, which govern what kind of drift is even worth flagging.

## A doc's diagnosis for an open bug is a hypothesis

A doc's stated root cause is easy to over-trust because the confidence in the writing isn't evidence the diagnosis is still correct. Two shapes lead to citing a wrong cause with full confidence: a live "OPEN BUG" row whose diagnosis a *different* doc has since retracted (the tell is that the row prescribes a fix for what's actually a decided/superseded issue, or the behaviour already has an accepted workaround in its owning doc); and a doc's stated root cause for a bug it still lists as open, uncontradicted (a decided fix implies a decided diagnosis, which is a contradiction if the bug is genuinely still open — or its own `Last Session` note admits it was written straight from the symptom, not the code). Either way, read the code path the doc blames before changing it, and expect the real cause to be adjacent to what's written but different in kind.

## Authoritative FOR vs. NOT

A task doc is authoritative for decisions and gotchas — it is not a live-state oracle:

| The doc IS authoritative for | The doc is NOT authoritative for |
|------------------------------|----------------------------------|
| Why it's built this way (ADRs, rejected options) | What's in prod's DB / `.env` / a bucket **right now** |
| What will bite you (gotchas, traps, invariants) | Whether a flag is on, a table exists, a row is populated |
| Vocabulary, ownership, blast radius | Whether a bug it calls "open" is still open |
| Why we picked/evaluated a third-party tool | **What that tool actually DOES** — its delete/write scope lives in its source, never in our summary |
| That a difference between two envs was once chosen | **That the envs still differ that way, or that the current difference is the chosen one** — see below |

**The mirror trap**: when the doc has already made a decision, use it — don't re-derive the same fork and hand it back as a question. A decision-heavy doc often records the tradeoff, the rejected options, and the chosen answer for exactly the fork about to be raised, so presenting that same fork after having read the doc reads as not having read it (the answer comes back "it's in the doc"). Ask only what the user's own context decides — a preference, a priority, a fact only they hold — not a tradeoff the doc's Decisions/ADRs already resolved.

The trap doesn't need a question to spring, which is what makes it easy to walk past: laying out options in prose, or explaining what the tradeoffs *would* be, re-opens a settled fork just as surely as `AskUserQuestion` does, and neither feels like asking. It also fires hardest on a question phrased as behaviour rather than as a decision — "why did it still charge me?" is answerable from the ADR that chose to charge, but it doesn't read like a decision question, so the reflex is to go reason about the code instead. **Tell:** you're about to enumerate options, or explain why the system behaves some way, on a doc whose Decisions you haven't actually opened — descend to the ADR first and answer from it.

A well-read doc feels fully grounded, which is exactly the trap: answering a live-state question from a weeks-stale snapshot inherits that same confidence even though it's now unearned. If the answer depends on the current state of a running system, measure it, then reconcile — when doc and live system disagree, the live system wins and the doc gets routed for update. Four cases where this bites:

- **Running a researched tool** — a doc researching X doesn't license running it once the task shifts to "let's use X" and X writes/deletes/migrates. Its summary bullets (stack, license, install command) describe the box, not the delete paths inside, and measuring the live system doesn't substitute for reading the tool's own behavior — profiling every byte on disk still doesn't reveal what the command removes. Read the tool's source and issue tracker for data-loss reports before the first destructive command; if you can't name the exact paths the command touches from code you've actually read, that's the signal you're not ready to run it.
- **Remote state from local absence** — a local file's absence describes wiring, not whether a remote resource exists ("prod's `.env` has no `AWS_*`" doesn't mean the bucket is gone). Ask the remote system directly, with a call that discriminates presence from denial (`HeadBucket`: 403 = exists-but-denied vs 404 = absent).
- **A config difference the doc calls deliberate** — "Intentional", "by design", "prod keeps this off" reads as an ADR, which the doc *is* authoritative for, so the difference stops being a question. But the label and the values are two separate claims: the choice may be genuine while the values drifted out from under it, and a migration that hand-copies config into a new home is exactly where a wrong value inherits the old label. The asymmetry is what makes this expensive — a difference marked deliberate is one nobody re-examines, so it survives far longer than an unlabelled one. Read the values from whatever the running system actually consumes and confirm they're still the ones the label describes; treat a difference *labelled* deliberate as needing more verification than an unlabelled one, not less.
- **"It's the staging/test one"** — this is a live-state claim, not a property of the name, so it needs measuring before anything irreversible follows from it. A doc saying "staging exists for e2e, flag is on" describes what the env was set up to be, not what it is now. Test-ness lives in one concrete value (an API-key prefix, a bucket name, a DB name, a `mode` field) — name that value and read it from the running process (`printenv KEY` plus a control that must resolve) rather than trusting the label.

## A doc's shorthand ID isn't a label the user carries in their head

A MADR-style ID (`D8`, `R2`, `B3`) is handy as a doc's own internal cross-reference, but it's not something to hand back to the user as if it were self-explanatory — "keep D8 or switch to D16?" makes them stop and go re-open the doc just to find out what's being asked. When a doc-sourced ID ends up in a question for the user, say what it actually refers to; keep the ID alongside as a back-reference if useful, not as the whole answer.

Qualify the ID as `<feature> D-N` / `<feature> D-<slug>` whenever the set is split — don't hand back a bare ID and expect it to resolve on its own. The ID may not even be unique: older doc sets number chronologically per feature (`D-1`, `D-2`, ...), so once split, the same `D-3` names a different decision in each, and a bare numeric ID resolves to whichever file you happened to open with nothing signalling the collision. Newer decisions use a topic slug instead (`D-gateway-fee-cap`) specifically to avoid this — a slug is self-describing and collides only if two decisions in the same domain genuinely share a topic, which is rarer and more visible than two features both landing on `D-3`.

## Telling a router from a decisions file

A `decisions/` file can be pure routing — an index that holds no ADRs at all — and reading its summary as though it were the decision is how a settled question gets re-opened. Judging by appearance is unreliable: a router can carry a Quick Start, prose, and a full-looking routing table, so it reads as substantive. The mechanical check is what holds — `grep -cE "^### D([0-9]|-[a-z0-9])" <file>` returning 0 means there are no decisions in it, whatever it looks like, and the real ADRs are a level down. The pattern covers every ID variant from the previous section (`D-1` per-feature, a plugin-wide `D66` with no hyphen, or a topic slug like `D-gateway-fee-cap`) without also matching an unrelated `### Deferred`-style header — a narrower numeric-only pattern run against a file full of slug IDs (or vice versa) returns a false 0 on a file that's full of real ADRs, so confirm which convention a project actually uses before trusting a 0 as "router." Worth running before quoting any decisions file as settling something.
