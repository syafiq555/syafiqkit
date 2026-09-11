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

## Vouching for a fact instead of checking it

A fact you list as "must survive" is a fact you are vouching for, and the agent will promote it, not check it. The natural source for that list is the file being rewritten, and a doc's claim about code is exactly the kind of thing that has drifted.

Measured 2026-09-04: a rate-validation floor read off a 2025 stories file went into the prompt as "recorded nowhere else". The code enforced no such floor, and the rewrite spread the false rule into four places under a heading that said *Enforced in Code* — the protection was read as verification.

So a protected fact that describes code, config or a route gets one `grep` against the thing it describes before it goes in the prompt. A fact that fails that grep is not a loss to prevent but a correction to instruct: tell the agent the doc is wrong and what the code says.

**Tell: your must-survive list was built by reading the target rather than by reading what the target describes.**
