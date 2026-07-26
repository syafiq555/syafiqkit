<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log split by theme into decisions/*.md
Domain: plugin-maintenance/agent-architecture
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../doc-condensation/current.md (sibling feature — fighting duplication/bloat across docs, CLAUDE.md, skills)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
Last updated: 2026-07-26 — D52: D47's findings-vs-clean reliability is prompt-dependent, not fixed — a `/done` pass over the session's OWN fresh fixes returned three findings that all held, the load-bearing one invisible to both file-scoped lenses and the author
-->

# Plugin Maintenance — Agent Architecture

## Quick Start (read this first in next session)

**Where we are**: How generated project agents (`.claude/agents/*.md`) inherit CLAUDE.md conventions, delegate to sibling skills, reliably invoke them, and how the plugin delegates work to cheaper/parallel agents. 23 decisions (22 live, D35 superseded) across 3 themed sub-files (counted, not incremented — `grep -h '^### D' decisions/*.md | wc -l`; the prior "21" was itself an increment off a stale figure).

**Immediate next actions (in order)**:
1. This repo's own `.claude/agents/` is still missing `task-builder.md` and `browser-verifier.md` (templates exist, never generated) — run `/agent-setup` to backfill; exercises the Missing-agent check (D38) end-to-end.
2. Add the post-write ADR-id uniqueness gate to the plugin CLAUDE.md — the D40/D44 collisions are renumbered (→ D48/D49), but the allocator that minted them is unchanged (see Next Steps).

**Gotchas that will trip you**:
- Agents don't inherit CLAUDE.md — see D1 (decisions/injection-and-delegation.md)
- Orchestrator skills must delegate to sibling skills, never inline their procedure — see D4 (decisions/injection-and-delegation.md)
- A Step-N "verify" checklist is not satisfied by having read the files earlier in-session — each item needs its own command run against current content — see D21 (decisions/verification-rigor.md)
- A self-caught deviation from a skill's own instructions is a reportable signal, not a silent win — see D24 (decisions/verification-rigor.md)
- Delegating a skill's heavy step to a cheaper agent only works when the mechanical (retrieval) half is split from the judgment half first — the judgment half stays on the calling session's own model — see D30 (decisions/concurrency-and-delegation.md)
- A scan's "zero results = done" exit condition needs a must-hit control, not just a correct command — see D25 (decisions/verification-rigor.md)
- `merge-task-docs` Step 2 defaults to executing the recommended scope/structure/naming inline, asking only on genuine ambiguity — see D28 (decisions/verification-rigor.md)
- Every generated agent template now carries `Skill` in `tools:` — see D14/D29 (decisions/injection-and-delegation.md)
- A verification step whose input is empty emits the same output as a genuine pass — an empty diff, a single polled run id — see D49 (decisions/verification-rigor.md)
- An audit agent handed a defect definition manufactures matches; its *clean* verdicts are the reliable half — see D47 (decisions/verification-rigor.md)
- ⚠️ **That reliability is prompt-dependent, not fixed — a review of the session's OWN fresh fixes inverts it** (all three agents' findings held, and the product reviewer caught what neither file-scoped lens nor the author could see). An author cannot see whether anything computes their new rule's inputs — the intent is in their head — see D52 (decisions/verification-rigor.md)
- `claude-md-pruner` prunes task docs too and its name is deliberately legacy — renaming silently breaks `update-claude-docs` Step 4's literal Glob/`subagent_type` and orphans the old file in every existing project — see D43 (decisions/injection-and-delegation.md)
- Editing a generated `.claude/agents/*.md` requires porting the same edit into its source `skills/agent-setup/templates/*.template.md` in the same change — now a root CLAUDE.md `⚠️ MANDATORY` callout, 3rd recurrence — see D31 (decisions/concurrency-and-delegation.md)
- Widening a threshold table (agent-count tiers, byte budgets) needs every downstream decision point checked, not just the table itself — see D39 (decisions/verification-rigor.md)
- A skill pair that both scan the same conversation for the same signal class and route dependently must dispatch sequentially — D32's parallel-batch default assumes disjoint state, which this pair doesn't have — see D42 (decisions/concurrency-and-delegation.md)

---

## Overview

Decisions about how generated project agents (`.claude/agents/*.md`) inherit conventions, delegate to sibling skills, reliably invoke them, and how the plugin delegates work to cheaper/parallel agents. Split out of the plugin-maintenance whole-doc MADR (2026-07-24) as its own feature, one level up from the prior `decisions/agent-architecture.md` router. Sibling features: [doc-condensation](../doc-condensation/current.md), [madr-structure](../madr-structure/current.md).

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Prompt-injection agent architecture (D1) | ✅ |
| 2 | Orchestrator delegation pattern (D4, D14, D29, D43) | ✅ |
| 3 | Verification rigor across skill checklists (D21, D24, D25, D28, D38, D39, D47, D48, D49, D52) | ✅ |
| 4 | Concurrency/cheap-model delegation (D30, D31, D32, D42); transcript-scan tried + removed (D34→D36) | ✅ |
| 5 | Backfill `task-builder`/`browser-verifier` agents in this repo | ⏳ Pending |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/injection-and-delegation.md](decisions/injection-and-delegation.md) | *How do generated agents inherit CLAUDE.md conventions and call sibling skills instead of reimplementing them?* (D1, D4, D14, D29, D43, D15) |
| [decisions/verification-rigor.md](decisions/verification-rigor.md) | *How do skills verify their own checklists actually ran, and catch self-caught deviations or silent-pass exit conditions? When is an agent's finding trustworthy vs its clean verdict?* (D21, D24, D25, D28, D38, D39, D47, D48, D49, D52) |
| [decisions/concurrency-and-delegation.md](decisions/concurrency-and-delegation.md) | *How does the plugin delegate to cheaper/parallel agents, what does `run_in_background` actually guarantee, and what happened to the transcript-scan mechanism?* (D30, D31, D32, D34, D35, D36, D42) |

---

## Next Steps

**Backfill**
- [ ] This repo's own `.claude/agents/` is missing `task-builder.md` and `browser-verifier.md` (templates exist, never generated) — run `/agent-setup` to backfill; would also exercise the Missing-agent check (D38) end-to-end.

**Doc integrity**
- [ ] **Add the post-write ADR-id gate — the numbers are fixed, the allocator is not.** This was the 2nd collision round and the 1st caused it: `doc-condensation`'s D40 was renumbered off a duplicate D32 on 2026-07-20 into an id this feature then took. Picking "the next free number" is a pre-write lookup; without re-running `grep -rhoE "^### D[0-9]+" */decisions/*.md | grep -oE "[0-9]+" | sort -n | uniq -d` across **all three sibling features after writing**, round 3 is the same mistake. Belongs in the plugin CLAUDE.md's ADR row. ⚠️ Never reuse a numbering gap — D2/D5/D7/D11/D41 are demoted/retired ids still cited in prose.

**Deferred**
- [ ] `hobby-review` Step 5 emits its verdict template after "the conversation naturally reaches the 3 gates" with nothing verifying it did — D49's shape, judged not worth fixing (soft guidance, writes nothing to disk). Revisit only if a verdict ever lands on an unfinished arc.

---

## Last Session (2026-07-26)

- **D52**: reviewing this session's own fresh fixes inverted D47's prior. All three `/done` agents filed findings and all three held — where D47's definition-handed auditors filed 3-of-4 false. The difference is prompt shape (hunt a supplied definition across many files vs. review a small self-authored change), so D47's rule stays scoped to audits.
- The 🔴 came from the **product reviewer**, on a 3-file all-markdown diff: the new floor gate named two inputs nothing computed before the deciding step read them. Both file-scoped lenses read the same lines and missed it — the defect was in ordering across steps. Small diff ≠ nothing for that lens to add.
- Docs-only mode needed a hand override to run at all, then was **fixed** (1.127.0): it now gates on prose-vs-executable, so an all-`.md` diff of `skills/`/`commands/`/`.claude/agents/` files takes full mode automatically.
- The `sort -n | uniq -d` post-write check ran clean (highest id now 52) — still the open gate, still manual.
- Counting rather than incrementing caught this doc's own decision figure stale at "21" before the addition; now 23, with the command written beside it.
