<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log split by theme into decisions/*.md
Domain: plugin-maintenance/agent-architecture
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../doc-condensation/current.md (sibling feature — fighting duplication/bloat across docs, CLAUDE.md, skills)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
Last updated: 2026-07-26 — D47: fleet audit closed both open rows (D24 is `done`-only; D49's shape fixed in `sweep-doc-overlaps` + `md-to-pdf`). D40→D48, D44→D49 to clear collisions with older doc-condensation ids
-->

# Plugin Maintenance — Agent Architecture

## Quick Start (read this first in next session)

**Where we are**: How generated project agents (`.claude/agents/*.md`) inherit CLAUDE.md conventions, delegate to sibling skills, reliably invoke them, and how the plugin delegates work to cheaper/parallel agents. 21 decisions (20 live, D35 superseded) across 3 themed sub-files.

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
| 3 | Verification rigor across skill checklists (D21, D24, D25, D28, D38, D39, D47, D48, D49) | ✅ |
| 4 | Concurrency/cheap-model delegation (D30, D31, D32, D42); transcript-scan tried + removed (D34→D36) | ✅ |
| 5 | Backfill `task-builder`/`browser-verifier` agents in this repo | ⏳ Pending |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/injection-and-delegation.md](decisions/injection-and-delegation.md) | *How do generated agents inherit CLAUDE.md conventions and call sibling skills instead of reimplementing them?* (D1, D4, D14, D29, D43, D15) |
| [decisions/verification-rigor.md](decisions/verification-rigor.md) | *How do skills verify their own checklists actually ran, and catch self-caught deviations or silent-pass exit conditions?* (D21, D24, D25, D28, D38, D39, D47, D48, D49) |
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

- D47 recorded: fleet audit of all 19 substantive skills for both open audit rows. D24's shape is `done`-only (it needs a *reporting* gate; constraint tables aren't it). D49's shape found and fixed in `sweep-doc-overlaps` Step 4 (zero-candidate exit now gated on three checks) and `md-to-pdf` Step 1 (`grep -c ''` control + `grep -a` recovery). Both Next Steps audit rows removed.
- 3 of 4 audit agents filed findings that failed re-verification — one quoted the line disproving its own claim. Their enumerated *clean* verdicts held. Captured as a global `~/.claude/CLAUDE.md` agent-bootstrap row, since it governs any delegated audit, not one skill.
- The `sort -n | uniq -d` uniqueness check caught this ADR mislabelled D45 (already taken by `doc-condensation/structural-splits.md`); renumbered to D47. Same check surfaced two pre-existing duplicates, since resolved: this feature's D40→**D48** and D44→**D49**, dates deciding ownership (the later arrival renumbers, so both landed here). Every citation repointed; the two CHANGELOG lines citing the *older* D40 are history and stay.
- The duplicates were a RECURRENCE: `doc-condensation`'s D40 was itself renumbered off a duplicate D32 on 2026-07-20, into an id this feature took on 2026-07-24. Renumbering without a post-write uniqueness check is what mints the next collision — that gate is the remaining open item.
- Version 1.123.27 still unreleased — both skill fixes folded into its existing CHANGELOG entry, no version minted.
