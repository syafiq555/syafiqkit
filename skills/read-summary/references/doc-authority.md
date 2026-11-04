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
- **A `file:line` anchor under a rule that is still true** — an essentials or architecture doc cites where a constraint is enforced, and the citation decays on the next edit of that file while the rule it supports stays correct. The two fail independently, which is what makes this awkward: an anchor landing on unrelated code reads as evidence the *rule* is stale, and deleting the rule is the expensive mistake. Open the file and find the symbol before concluding anything — usually the constraint moved a few lines. The same split applies to any count a doc states about the codebase (`177 models`, `518 views`): correct on the day written, decaying silently after, and never worth trusting over a `find | wc -l` you can run in a second.

## A doc's shorthand ID isn't self-explanatory

A MADR-style ID (`D8`, `R2`, `D-gateway-fee-cap`) is handy for internal cross-reference but opaque to a user. When a doc-sourced ID appears in a question or answer to the user, say what it refers to. Keep the ID alongside as a back-reference if useful, not as the whole answer — "keep D8 or switch to D16?" makes them stop and re-open the doc just to find out what's being asked.

Numeric IDs are especially risky because they're not unique across split doc sets. Older docs number chronologically per feature (`D-1`, `D-2`, ...), so once split, the same `D-3` names a different decision in each file. Always qualify with the feature or file when the set is split. Newer decisions use a topic slug instead (`D-gateway-fee-cap`), which is self-describing and collides only when two decisions in the same domain genuinely share a topic.

## A doc header's shorthand is not its architecture

"React" in a header might mean the library, an SDK, or one layer of a larger stack: the *surface* of the technology the project actually uses. Stopping at the shorthand leaves you wrong about the layer. When a doc's architecture matters to your next step, read past the tables to the prose and confirm against something on disk before building on it.

## A doc that records both an ask and a conclusion

A doc that records both what someone ASKED FOR and what a session CONCLUDED can misdirect. Both are decisions, so both read as authoritative, but a conclusion that resolved one premise is often written as though it settled the whole request, and it is the later, narrower sentence a reader scopes from. So scope from the ask and treat the conclusion as one input to re-check, particularly where its stated reason resolved a *premise* (a cost, a constraint, a feasibility question) rather than the request itself. **Tell: the sentence you are scoping from begins "the work is therefore".**

## Telling a router from a decisions file

A `decisions/` file can be pure routing — an index with no ADRs — and treating its summary as a decision re-opens a settled question. A router can carry Quick Start and prose that makes it read as substantive. The mechanical check: `grep -cE "^### D([0-9]|-[a-z0-9])" <file>` returning 0 means there are no decisions in it, whatever it looks like. The pattern covers variant ID formats (`D-1`, `D66`, `D-gateway-fee-cap`) but doesn't match unrelated headers like `### Deferred` — so verify which convention a project uses before trusting a 0 as "this is a router."

## Incidents behind the read-summary rules

Each entry backs a rule in SKILL.md; the rule stays there, the story lives here.

- **Live measurement is not corroboration** (SKILL.md top): Measured 2026-09-20: a designer's ledger questions were answered from SQL and controllers alone, and the domain's companion then contradicted two of them: direction comes from the amounts (never the transaction type), and a "running balance" is account-wide. Neither is guessable from the schema.
- **A live peer's wait is arranged by you** (SKILL.md top): Measured 2026-10-27: a clip session waited on the user while its builder sat one `ListAgents` call away; the user had to say "communicate with the session", and the peer's first reply carried a selector change that would have broken the capture.
- **Doc siblings may sit upstream** (SKILL.md {#finding-docs}): Measured 2026-10-12: a task doc's `decisions/` siblings were reported absent while they sat one commit ahead on `origin`.
- **A settled state, not a mid-reaction one** (SKILL.md {#doc-authority}): Measured 2026-09-03: a credentials file read three minutes into a container start showed intact tokens, was used to declare an incident write-up wrong, and the write-up had been right. 📖 `../../ship/references/ship-deploy-verification.md` § Reading a Destination That Is Still Reacting.
- **A blocker on a config value** (SKILL.md {#doc-authority}): Measured 2026-09-11: `tasks/credit/engine/current.md` carried "Request 2C2P production credentials" as a 🔴 blocker, while `config('services.payment_gateway.driver')` had defaulted to `'curlec'` and production resolved `curlec` in both `printenv` and `config()`.
- **Read the entry point, not the manifest** (SKILL.md {#doc-authority}): Measured 2026-09-01: `vite`, `tailwindcss` and `alpinejs` were installed and declared in a Laravel app that ships Bootstrap 5 and jQuery from static files, with no `@vite` directive in any of its 518 views and no build output, and its frontend doc had recorded half of it.
- **A request that names a skill** (SKILL.md {#what-comes-next}): Measured 2026-10-07: "research uiux" went to a general web agent, and `uiux` ran only after the user asked "u didnt use the uiux skill for research?".
- **A second guess** (SKILL.md {#what-comes-next}): Measured 2026-10-29: two hours of guessed fixes for a suite that failed under parallel load, one of them a fix the project's own diagnosis doc already recorded as not working.
- **Delegated plan defaults** (SKILL.md {#plan-mode}): Measured 2026-10-07: six part-payment rules from a Plan agent went into an approved plan this way, including a fee that could be charged twice.
- **Decision-first opens** (SKILL.md {#decision-first}): Measured 2026-09-14: ~12 consecutive replies opened that way before the user asked what the spam was.
- **Sibling doc answers a question** (SKILL.md {#decision-first}): Measured 2026-10-21: a "build or reword" question went out while the owning domain held the opposite answer. The same holds for a defect reported as new: measured 2026-10-26, a stale receipt balance went out as a finding while the `Related:` payments doc held the bug and the user's decision from two weeks before.
