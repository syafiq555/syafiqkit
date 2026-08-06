<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log split by theme into decisions/*.md
Domain: plugin-maintenance/agent-architecture
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../doc-condensation/current.md (sibling feature — fighting duplication/bloat across docs, CLAUDE.md, skills)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
Last updated: 2026-08-06 — `code-simplifier` project agent had silently drifted to `model: opus` against its already-correct `sonnet` template, discovered via a spawn 400 rather than an edit (D31, 4th recurrence). Prior same-day: two upstream issues fixed (#16, #18) — `/commit`'s staleness gate gained a same-session `task-summary`-already-ran carve-out (D-commit-staleness-same-session-carveout), and `/done` Step 1's Ownership→Emission-shape reorder got a point-of-action re-anchor (D-emission-shape-reanchor). Prior: 2026-08-02, `unhobble-instructions` row-decoration check (D63-D66, doc-condensation).
-->

# Plugin Maintenance — Agent Architecture

## Quick Start (read this first in next session)

**Where we are**: How generated project agents (`.claude/agents/*.md`) inherit CLAUDE.md conventions, delegate to sibling skills, reliably invoke them, and how the plugin delegates work to cheaper/parallel agents. 28 decisions (27 live, D35 superseded) across 3 themed sub-files (counted, not incremented — `grep -h '^### D' decisions/*.md | wc -l`; the prior "21" was itself an increment off a stale figure).

**State**: v1.139.10 ships via `/ship` — this repo has no CI and no deploy chain, so the push IS the ship; consumers pick it up via `claude plugin update syafiqkit@syafiqkit`.

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
- ⚠️ **That reliability is prompt-dependent, not fixed — a review of the session's OWN fresh fixes inverts it** (all three agents' findings held, and the product reviewer caught what neither file-scoped lens nor the author could see). An author cannot see whether anything computes their new rule's inputs — the intent is in their head — see D52 (decisions/verification-rigor.md), then D53 for the 2nd instance
- A new rule's branch is dead wherever no step computes its condition — an unreachable branch and an unmeasured threshold are one defect with two faces — see D53 (decisions/concurrency-and-delegation.md)
- A doc another session is writing inverts `task-summary`'s Quick Start/Last Session overwrite mandates; "single owner" is a grep of the MANDATE's vocabulary, not an impression — see D53 (decisions/concurrency-and-delegation.md)
- `claude-md-pruner` prunes task docs too and its name is deliberately legacy — renaming silently breaks `update-claude-docs` Step 4's literal Glob/`subagent_type` and orphans the old file in every existing project — see D43 (decisions/injection-and-delegation.md)
- Editing a generated `.claude/agents/*.md` requires porting the same edit into its source `skills/agent-setup/templates/*.template.md` in the same change — now a root CLAUDE.md `⚠️ MANDATORY` callout, 4th recurrence. Drift also happens silently with no edit trigger — a `code-simplifier` spawn 400ing on `effort 'xhigh'` traced to the generated file alone having drifted to `model: opus` while its template already read `sonnet` — see D31 (decisions/concurrency-and-delegation.md)
- A `disallowedTools` guard blocks an agent's *call*, never its *intent* — redirect by stating the agent's ROLE, and keep the redirect anchored to a named target category; de-priming to pure abstraction trades a loud rare failure for a silent universal one — see D60 (decisions/injection-and-delegation.md)
- Widening a threshold table (agent-count tiers, byte budgets) needs every downstream decision point checked, not just the table itself — see D39 (decisions/verification-rigor.md)
- A skill pair that both scan the same conversation for the same signal class and route dependently must dispatch sequentially — D32's parallel-batch default assumes disjoint state, which this pair doesn't have — see D42 (decisions/concurrency-and-delegation.md)
- `unhobble-instructions`' own Process didn't wire its row-decoration check into the numbered steps that actually drive execution, so running the skill on its own logic still mis-stripped a genuine `**Tell:**` alongside hollow ones — checking content is not the same test as checking decoration, and a step that isn't referenced by the linear Process doesn't get applied even when it exists elsewhere in the file — see D63–D66 (../doc-condensation/decisions/structural-splits.md, not this feature's own decisions/ — unhobbling's ADR history lives in doc-condensation)
- Two skills disagreeing about the same run-time state (`/commit`'s absolutist staleness gate vs. `/done` Step 4's scoped-invoke principle) needs the later skill's carve-out named explicitly in the earlier gate, not left as an implicit contradiction — see D-commit-staleness-same-session-carveout (decisions/concurrency-and-delegation.md)
- Reordering a rule earlier in a doc fixes the cold-start read, not a behavioral miss that happens mid-reasoning — the constraint needs to re-trigger at the point of action, not just appear earlier in a linear read — see D-emission-shape-reanchor (decisions/verification-rigor.md)

---

## Overview

Decisions about how generated project agents (`.claude/agents/*.md`) inherit conventions, delegate to sibling skills, reliably invoke them, and how the plugin delegates work to cheaper/parallel agents. Split out of the plugin-maintenance whole-doc MADR (2026-07-24) as its own feature, one level up from the prior `decisions/agent-architecture.md` router. Sibling features: [doc-condensation](../doc-condensation/current.md), [madr-structure](../madr-structure/current.md).

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Prompt-injection agent architecture (D1) | ✅ |
| 2 | Orchestrator delegation pattern (D4, D14, D29, D43) | ✅ |
| 3 | Verification rigor across skill checklists (D21, D24, D25, D28, D38, D39, D47, D48, D49, D52, D58, D-emission-shape-reanchor) | ✅ |
| 4 | Concurrency/cheap-model delegation (D30, D31, D32, D42, D53, D-commit-staleness-same-session-carveout); transcript-scan tried + removed (D34→D36) | ✅ |
| 5 | Agent tool-guard vs. intent; role-correction over prohibition (D60) | ✅ |
| 6 | Backfill `task-builder`/`browser-verifier` agents in this repo | ⏳ Pending |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/injection-and-delegation.md](decisions/injection-and-delegation.md) | *How do generated agents inherit CLAUDE.md conventions and call sibling skills instead of reimplementing them?* (D1, D4, D14, D29, D43, D15) |
| [decisions/verification-rigor.md](decisions/verification-rigor.md) | *How do skills verify their own checklists actually ran, and catch self-caught deviations or silent-pass exit conditions? When is an agent's finding trustworthy vs its clean verdict? When does `/done` run agents on an all-doc diff? Does reordering a rule earlier in a doc actually fix a salience miss?* (D21, D24, D25, D28, D38, D39, D47, D48, D49, D52, D58, D-emission-shape-reanchor) |
| [decisions/concurrency-and-delegation.md](decisions/concurrency-and-delegation.md) | *How does the plugin delegate to cheaper/parallel agents, what does `run_in_background` actually guarantee, what happened to the transcript-scan mechanism, how do skills write a doc another session owns, and how do two skills reconcile disagreeing about the same run-time state?* (D30, D31, D32, D34, D35, D36, D42, D53, D-commit-staleness-same-session-carveout) |

---

## Next Steps

**Backfill**
- [ ] This repo's own `.claude/agents/` is missing `task-builder.md` and `browser-verifier.md` (templates exist, never generated) — run `/agent-setup` to backfill; would also exercise the Missing-agent check (D38) end-to-end.

**Doc integrity**
- [ ] **Add the post-write ADR-id gate — the numbers are fixed, the allocator is not.** This was the 2nd collision round and the 1st caused it: `doc-condensation`'s D40 was renumbered off a duplicate D32 on 2026-07-20 into an id this feature then took. **2026-08-02: round 3 happened exactly as predicted** — `doc-condensation`'s own D66 was independently minted twice (a `/done` review caught it, renumbered to D67), because the allocator step CLAUDE.md's ADR row already prescribes (`grep -rhoE "^### D[0-9]+" tasks/ | ...`) wasn't run against the global corpus before writing. The manual fix works; the gate to make it automatic is still open. ⚠️ Never reuse a numbering gap — D2/D5/D7/D11/D41 are demoted/retired ids still cited in prose. Highest id is now 67.

**Doc size**
- [ ] The doc SET is 633 lines / 70KB against a 300-line budget — 605 at HEAD, so pre-existing, not this session's growth (`cat current.md decisions/*.md | wc -lc`). The index reads healthy at 96 lines, which is what hides it. Weight is `decisions/verification-rigor.md` (231 lines), not the theme file most recently edited. Route to `condense-task-doc` — it owns the thresholds and any further split; don't hand-condense.

**Deferred**
- [ ] `hobby-review` Step 5 emits its verdict template after "the conversation naturally reaches the 3 gates" with nothing verifying it did — D49's shape, judged not worth fixing (soft guidance, writes nothing to disk). Revisit only if a verdict ever lands on an unfinished arc.

---

## Last Session (2026-08-06)

- `/done` on a docs-only session (new `setup-playwright` skill + several small skill-file edits, v1.139.11→1.139.14): the `code-simplifier` project agent 400'd on spawn (`effort 'xhigh' not supported when thinking is disabled`). Traced to `.claude/agents/code-simplifier.md` alone having drifted to `model: opus` while its source template (`skills/agent-setup/templates/code-simplifier.template.md`) already read `sonnet` — fixed by syncing the generated file to its template (D31, 4th recurrence, first one with no edit trigger).
- Global companion `CLAUDE-agent-bootstrap.md` currently states an Opus-pinned spawn fault is "not fixable in the agent's own frontmatter" — this session's cause was fixable (a stale generated file), so that premise is worth revisiting there, but companion edits are out of this skill's Capture-mode scope; left as a verbal note, not an edit.
- Product reviewer caught a real gap in the new `setup-playwright` skill: its trigger list includes "tests only pass on my machine" but its causal model only covered 3 flake causes (data races, unseeded fixtures, throttled auth); fixed same session by adding a 4th "Environment and browser drift" section.
