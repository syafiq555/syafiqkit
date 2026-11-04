# Writing the Prompt — Over-Constraint and Protected Facts

Three ways a dispatch prompt gets narrower than the task needs. Each arrives feeling like care rather than damage, which is why they are worth the worked cases.

## Banning a mechanism because you watched it fail

A failed earlier pass is what actually produces the over-constrained prompt. Having just watched a mechanism go wrong — a relocation whose destination stayed empty, a research claim that was invented — the natural next move is to forbid that mechanism in the re-dispatch. But a mechanism that failed once is evidence about that *run*, not about whether the next skill is entitled to use it, and banning it hands the agent a narrower instrument than its own procedure assumes.

Measured 2026-09-01: a `condense` pass reported moving rules to a companion that received none of them, so the follow-up `unhobble` prompt banned companion writes. That removed extraction, one of that skill's core moves, and yielded three reshapes on a file whose real problem was structural.

Convert the failure into a **verification** demand instead: *confirm a relocation landed by reading the destination*, never *do not relocate*.

**Tell: your prompt forbids something because you watched it fail, rather than because this task genuinely doesn't need it.**

## Banning a mechanism because a concurrent agent might collide with it

A concurrent agent produces the same over-constrained prompt from a live cause rather than a remembered one, and that cause is real — which is what makes the ban feel like partitioning rather than crippling. Two agents on disjoint *files* can still collide through a skill's *procedure*: `unhobble-instructions` extracts hot-path detail into `references/`, so dispatching it against `CLAUDE.md` while another agent restructures `references/` puts the collision inside one skill's core move rather than across the file list.

Banning the move resolves the collision and silently deletes half the pass. Measured 2026-09-03: the ban also contradicted the target skill's own "don't propose; execute", so the agent was handed instructions its procedure disagreed with and correctly reported "no extraction needed" as a finding that was the prompt's, not the file's.

Scope the write, not the mechanism: *extract if the file calls for it; `ls` the destination and read it back after writing, because another agent is restructuring that directory*. Where even that is unsafe, the honest move is to serialize. This is the case a file-and-command partition cannot see, since it reasons about files rather than about what a named skill's procedure entitles it to do.

**Tell: your partition is disjoint by file, and the mechanism you are banning is one the dispatched skill names as central.**

### A shared resource the agents queue for: run it yourself

Disjoint files do not make a shared *machine* resource safe: one test runner, one seeded fixture, one dev server. A lock directory the agents take in turn (`mkdir` as the mutex) looks like the fix and fails differently: an agent that takes the lock and then stops, waiting on its own monitor or killed mid-run, leaves it held, and nothing in any agent's brief lets it clear a lock it did not create. Measured 2026-10-27: eight guide-writing agents shared one Playwright lock; it was orphaned twice for about 20 minutes each, two agents gave up without running their specs, and four of the five specs that never ran in their agent's session failed on first run in the orchestrator's. Have the agents write and list (compile-only) the thing that needs the resource, and run it yourself after they return, serially, where a failure is yours to read. The same briefs also met a harness guard that refuses a subagent's `Write` of a `.md` file it judges to be a report ("Subagents should return findings as text"), even when the file is the assigned deliverable: two of fourteen agents hit it. Say in the brief that a refused write is answered by returning the full text for the orchestrator to write, not by a shell workaround.

## Vouching for a fact instead of checking it

A fact you list as "must survive" is a fact you are vouching for, and the agent will promote it, not check it. The natural source for that list is the file being rewritten, and a doc's claim about code is exactly the kind of thing that has drifted.

Measured 2026-09-04: a rate-validation floor read off a 2025 stories file went into the prompt as "recorded nowhere else". The code enforced no such floor, and the rewrite spread the false rule into four places under a heading that said *Enforced in Code* — the protection was read as verification.

So a protected fact that describes code, config or a route gets one `grep` against the thing it describes before it goes in the prompt. A fact that fails that grep is not a loss to prevent but a correction to instruct: tell the agent the doc is wrong and what the code says.

**Tell: your must-survive list was built by reading the target rather than by reading what the target describes.**

### The unfalsifiable half: protecting a category by its form

Everything above assumes the entry is a claim about the world, which is what makes `grep` the remedy. The other failure needs no grep because nothing could settle it: an entry that quantifies over a pattern — *every* `**Tell:**` line, *all* `⚠️` callouts, *all* dated incidents — asserts a verdict about a class of sentence, and a verdict cannot be refuted by evidence the agent has access to. Adding the reason makes it worse rather than better: "they are the highest-value sentences in the file" leaves an agent that disagrees needing to contradict *you* rather than the file, so the disagreement goes underground.

Measured 2026-09-11, dispatching `unhobble-instructions` on a frontend `CLAUDE.md` with "all `**Tell:**` sentences must survive; they are the highest-value sentences in the file". The run deleted one Tell anyway with a written justification, duplicated a rule it reported having relocated (both copies byte-identical, in a report claiming the original was removed), and dropped a dated production incident that a separate clause had protected by name. The deleted Tell then turned out, on inspection, to be the one genuinely marginal case in the file — its headline already carried the condition — so the clause had suppressed the skill's judgement on the single rule where that judgement was worth having, and the compliance elsewhere was indistinguishable from obedience.

Two rules follow. **Protect instances, not patterns**: an entry belongs on the list when you can state what a reader loses without that specific thing. **Where you want a class treated carefully, say what it is for** and let the agent judge each member — "a Tell names the moment a reader is in, which is usually not what the rule's headline states; keep the ones that add a moment, cut the ones that restate it" gives the agent something to apply and something to disagree with. Cross-file contracts are the real exception: `{#anchor}`s and `📖` pointers are referenced by files outside the agent's view and are machine-checkable afterwards, so blanket protection there costs no judgement.

**Tell: an entry on your must-survive list quantifies over a pattern rather than naming one thing.**

## Partitioning by source versus destination

Agents that each draft additions for their own slice of a source (one spec section each) cannot see what the others wrote for the same place in the target. The placed drafts repeat and contradict each other and the text already there. Regroup the drafts by where they land and run one edit pass per destination section against its existing text. Measured 2026-10-14: about 190 sentences drafted per requirement area went into a quotation as duplicated bullets and a promise beside its own exclusion; a per-module pass merged them to 158 and marked 10 as already said.

## Content whose home lies outside the scope

A scoped write that deletes content whose real home is outside its scope loses that content. Name it in the report and leave it where it is. Measured 2026-09-25: an agent-memory pass deleted another repo's notes as "belongs in that repo's memory" and never put them there.

## Offering a reading as an observation

Where you hold a reading of the target, offer it as an observation to test. "This file needs little of what you do, and here is why" is a legitimate result. A prompt that describes the expected finding as the job invites an agent to manufacture reshapes to look thorough.
