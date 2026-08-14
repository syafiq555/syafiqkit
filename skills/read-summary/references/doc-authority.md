# What a Task Doc Is Authoritative For

Opened when a doc's claim about a running system or an open bug is load-bearing for your answer. What to trust a task doc for, and what to measure yourself.

## A doc's diagnosis for an open bug is a hypothesis, not a fact

When a doc labels a bug "OPEN" and proposes a root cause, the diagnosis is what the author believed at the time they wrote it — not a fact to act on. Read the code path the doc blames before changing anything. The real cause is often adjacent to what's written but different in kind, or the stated diagnosis has since been contradicted by a fix in another doc (look for the tell: the prescribed fix addresses something different from what the bug row says is the cause).

A task doc is authoritative for decisions and gotchas — it is not a live-state oracle:

| The doc IS authoritative for | The doc is NOT authoritative for |
|------------------------------|----------------------------------|
| Why it's built this way (ADRs, rejected options) | What's in prod's DB / `.env` / a bucket **right now** |
| What will bite you (gotchas, traps, invariants) | Whether a flag is on, a table exists, a row is populated |
| Vocabulary, ownership, blast radius | Whether a bug it calls "open" is still open |
| Why we picked/evaluated a third-party tool | **What that tool actually DOES** — its delete/write scope lives in its source, never in our summary |
| That a difference between two envs was once chosen | **That the envs still differ that way, or that the current difference is the chosen one** — see below |

**The mirror trap**: when the doc has already settled a decision, use it — don't re-derive the same fork and hand it back to the user as a question. A decision-heavy doc often records the tradeoff, the rejected options, and the chosen answer for exactly the fork you're about to raise. Presenting that fork after reading the doc reads as not having read it. Ask only what the user's own context decides — a preference, a priority, a fact only they hold — not a tradeoff the doc's decisions already resolved.

The trap doesn't need an `AskUserQuestion` to fire: laying out options in prose, or explaining why the system behaves some way, re-opens a settled decision just as surely. It fires hardest on questions phrased as behaviour ("why did it charge me?") rather than decision ("should it charge?"), because behaviour questions feel like they need reasoning instead of a lookup.

A well-read doc feels fully grounded, which is exactly where the trap sits: answering a live-state question from a stale snapshot inherits that confidence even though it's unearned. When the answer depends on current system state, measure it yourself. When doc and live system disagree, the live system wins. Four cases where stale docs bite hardest:

- **Running a researched tool** — a doc that researched tool X doesn't license running it once the task becomes "let's use X" and X writes or deletes. A summary of X (stack, license, install command) describes the box, not the paths inside. Read the tool's own source for data-loss reports before the first destructive command; if you can't name the exact paths from code you've read, that's the signal you're not ready.
- **Remote state from local absence** — a local file's absence describes wiring, not existence. "Prod's `.env` has no `AWS_*`" doesn't mean the bucket is gone. Ask the remote directly with a call that discriminates presence from denial (e.g., `HeadBucket`: 403 = exists, 404 = absent).
- **A config difference marked deliberate** — "by design" reads as an ADR, which the doc is authoritative for, so the difference stops being a question. But the label and the values are separate claims — the choice may be real while values drifted. A difference marked deliberate is one nobody re-examines, so treat it as needing *more* verification, not less. Read the values from the running system and confirm they're still the ones the label describes.
- **"It's the staging environment"** — this is a live-state claim, not a label property. A doc saying "staging exists for e2e, flag is on" describes what it was set up to be, not what it is now. Test-ness lives in a concrete value (an API-key prefix, bucket name, DB name, `mode` field) — read that value from the running process.

## A doc's shorthand ID isn't self-explanatory

A MADR-style ID (`D8`, `R2`, `D-gateway-fee-cap`) is handy for internal cross-reference but opaque to a user. When a doc-sourced ID appears in a question or answer to the user, say what it refers to. Keep the ID alongside as a back-reference if useful, not as the whole answer — "keep D8 or switch to D16?" makes them stop and re-open the doc just to find out what's being asked.

Numeric IDs are especially risky because they're not unique across split doc sets. Older docs number chronologically per feature (`D-1`, `D-2`, ...), so once split, the same `D-3` names a different decision in each file. Always qualify with the feature or file when the set is split. Newer decisions use a topic slug instead (`D-gateway-fee-cap`), which is self-describing and collides only when two decisions in the same domain genuinely share a topic.

## Telling a router from a decisions file

A `decisions/` file can be pure routing — an index with no ADRs — and treating its summary as a decision re-opens a settled question. A router can carry Quick Start and prose that makes it read as substantive. The mechanical check: `grep -cE "^### D([0-9]|-[a-z0-9])" <file>` returning 0 means there are no decisions in it, whatever it looks like. The pattern covers variant ID formats (`D-1`, `D66`, `D-gateway-fee-cap`) but doesn't match unrelated headers like `### Deferred` — so verify which convention a project uses before trusting a 0 as "this is a router."
