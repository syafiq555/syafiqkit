<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log split by theme into decisions/*.md
Domain: plugin-maintenance/agent-architecture
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../doc-condensation/current.md (sibling feature — fighting duplication/bloat across docs, CLAUDE.md, skills)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
  - ../output-style-hook/current.md (sibling feature — the SessionStart hook; shares the verify-the-agent's-report problem)
  - ../skill-authoring/current.md (sibling feature — creating and scoping skills; where issue #27 was finally closed)
Last updated: 2026-08-26 (v1.211.0). Session-by-session history lives in `## Last Session` and the ADRs it cites, not here. Key incidents: issue #27 (named agents don't return reports), issue #24 (contested-file guard placement), D-agent-may-not-redelegate (tool grants in comments), D-verify-by-definition-not-by-string (template parity checks).
-->

# Plugin Maintenance — Agent Architecture

## Quick Start (read this first in next session)

**Where we are**: How generated project agents (`.claude/agents/*.md`) inherit CLAUDE.md conventions, delegate to sibling skills, reliably invoke them, and how the plugin delegates work to cheaper/parallel agents — plus how a session learns a *peer session* is writing the same files. 40 decisions (38 live, D35 superseded; D-quick-done superseded in its step composition only) across 3 themed sub-files (counted, not incremented — `grep -h '^### D' decisions/*.md | wc -l`).

**State**: this feature's own work last shipped at v1.173.0 (the issue-#24 contested-file guard). Earlier context, still true of the 1.140.x era: later versions on `origin/master` belong to sibling features — the cross-session-messaging work shipped together with the concurrent session's `haiku`/`two-tier-condense` changes, whose CHANGELOG entries (1.140.4–1.140.6) that session had already written. The contest over `CHANGELOG.md` resolved by shipping both sessions' work in one push; don't read the `haiku` or `two-tier-condense` diffs as this feature's own. This repo has no CI and no deploy chain, so the push IS the ship; consumers pick it up via `claude plugin update syafiqkit@syafiqkit`. The version files reached the push at 1.140.3 while the changelog already carried headings through 1.140.6 — the entries had been written without their bump, which `/ship`'s version gate caught and reconciled to 1.140.6.

**Gotchas that will trip you** (grouped by decision file):

**Injection & Delegation** (decisions/injection-and-delegation.md):
- Agents don't inherit CLAUDE.md — D1
- Orchestrator skills delegate to sibling skills, never inline — D4
- Every generated agent template carries `Skill` in `tools:` — D14/D29
- `claude-md-pruner` name is legacy; renaming breaks Step 4 dispatch — D43
- Tool grant scoped only in YAML comment is unscoped at runtime — D-agent-may-not-redelegate
- `disallowedTools` guard blocks calls, not intent; use ROLE-based redirect — D60
- `Explore`'s `Write`/`Edit` grant is deliberate (scratchpad); scoping is body text only — D-explore-write-is-granted-scoped-by-role (partially supersedes D60)

**Verification Rigor** (decisions/verification-rigor.md):
- A Step-N "verify" checklist needs each item run against current content, not earlier reads — D21
- A self-caught deviation is reportable; a silent pass is not — D24
- A "zero results = done" exit needs a must-hit control, not just a correct command — D25
- `merge-task-docs` Step 2 defaults to executing scope/structure inline, asks only on ambiguity — D28
- Widening a threshold table requires checking every downstream decision point — D39
- An audit agent handed a defect definition manufactures matches; clean verdicts are reliable — D47
- Verification step with empty input emits same output as genuine pass — D49
- Git commands error in non-git projects; detection needs two probes (`rev-parse --git-dir`, `rev-parse HEAD`) — D-non-git-projects-error-they-dont-return-empty
- Reordering a rule earlier fixes cold-start read, not mid-reasoning behavioral miss; re-trigger at the point of action — D-emission-shape-reanchor
- A rule about every turn cannot live in wrap-up skills; `read-summary` or global `CLAUDE.md` are the furthest hosts — D-decision-first-output
- Parity between template and generated agent proves agreement, never correctness — D-parity-drift-is-bidirectional

**Elsewhere** — unhobbling's own ADR history lives in the sibling feature, not here:
- Checking a rule's content is not the same test as checking its row decoration, and a step the linear Process never references doesn't get applied even when it exists elsewhere in the file — D63–D66 (../doc-condensation/decisions/verification-rigor.md)

**Concurrency & Delegation** (decisions/concurrency-and-delegation.md):
- Delegating heavy steps to cheaper agents requires splitting mechanical (retrieval) from judgment halves — D30
- Template/agent edits must be ported in the same change, and drift happens silently with no edit trigger — D31
- Skill pairs scanning the same signal class must dispatch sequentially, not in parallel batch — D42
- An ownership marker must be a string peers have no reason to type; version numbers fail this — D-cross-session-messaging
- A new rule's branch is dead where no step computes its condition — D53
- Doc another session is writing inverts overwrite mandates; owner is grep of MANDATE vocabulary — D53
- Two skills disagreeing about run-time state need explicit carve-outs, not implicit contradiction — D-commit-staleness-same-session-carveout
- A caller's `description:` doesn't say whether body hardcodes `invoke`; cheaper siblings lock callers silently — D-quick-done
- Agent's declared ROLE isn't evidence of tool grants; read frontmatter, not role title — D-agent-verb-ban-shared
- Sweeping by actor reach (`grep subagent_type`) misses direct `Skill()` calls and reader-triggered deletes; grep the ACT — D-guard-the-act-not-the-dispatcher
- Agent's contested-file test cannot be bare non-empty `git diff`; dispatcher just wrote to it — (D-guard-the-act-not-the-dispatcher context)

---

## Immediate Next Actions

1. **Task-builder vs. browser-verifier split (user decision 2026-09-11)**
   `task-builder.md` was generated deliberately; `browser-verifier.md` was intentionally not. The pair that one decision originally treated together is now split on purpose — the original rationale still governs `browser-verifier`. No skill dispatches `task-builder` yet; dispatch is explicit rather than skill-driven. When dispatch changes, the seam is `plan-worklist`'s hand-off step (currently names only `tackle`). Backfilling also requires regenerating `claude-md-pruner.md` to ensure the contested-file check matches its template (landed by hand-edit at v1.173.0).

2. **Post-write ADR-id uniqueness gate**
   Two collision rounds have occurred (D40/D44 → renumbered D48/D49, then D66 independently minted twice). The allocator CLAUDE.md prescribes (`grep -rhoE "^### D[0-9]+" tasks/ | ...`) works manually but is not automated. Add a pre-write gate to the plugin CLAUDE.md that runs the allocator against the global corpus before minting a new id. Never reuse numbering gaps — D2/D5/D7/D11/D41 are demoted/retired ids still cited in prose. Highest id is 69 (measured 2026-09-12 across `tasks/`; re-measure rather than trusting this number, which was stale at 67 when last written).

3. **Sweep whole-file-rewrite skills for ownership checks**
   `condense-claude-md` was discovered to have no ownership gate despite performing whole-file rewrites (reached by direct `Skill()` call, invisible to dispatch greps). `unhobble-instructions` and `self-organize-agent-memory` rewrite files in place and were never checked. Pattern: grep the *action* (rewrite/delete), not the dispatcher (D-guard-the-act-not-the-dispatcher).

---

## Overview

Decisions about how generated project agents (`.claude/agents/*.md`) inherit conventions, delegate to sibling skills, reliably invoke them, and how the plugin delegates work to cheaper/parallel agents. Split out of the plugin-maintenance whole-doc MADR (2026-07-24) as its own feature, one level up from the prior `decisions/agent-architecture.md` router. Sibling features: [doc-condensation](../doc-condensation/current.md), [madr-structure](../madr-structure/current.md).

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Prompt-injection agent architecture (D1) | ✅ |
| 2 | Orchestrator delegation pattern (D4, D14, D29, D43) | ✅ |
| 3 | Verification rigor across skill checklists (D21, D24, D25, D28, D38, D39, D47, D48, D49, D52, D58, D-emission-shape-reanchor, D-decision-first-output) | ✅ |
| 4 | Concurrency/cheap-model delegation (D30, D31, D32, D42, D53, D-commit-staleness-same-session-carveout, D-quick-done, D-agent-verb-ban-shared); transcript-scan tried + removed (D34→D36) | ✅ |
| 5 | Agent tool-guard vs. intent; role-correction over prohibition (D60) | ✅ |
| 6 | Backfill `task-builder`/`browser-verifier` agents in this repo | ✅ Settled — `task-builder` generated 2026-09-11 by user decision; `browser-verifier` intentionally still absent |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/injection-and-delegation.md](decisions/injection-and-delegation.md) | *How do generated agents inherit CLAUDE.md conventions and call sibling skills instead of reimplementing them?* (D1, D4, D14, D29, D43, D15) |
| [decisions/verification-rigor.md](decisions/verification-rigor.md) | *How do skills verify their own checklists actually ran, and catch self-caught deviations or silent-pass exit conditions? When is an agent's finding trustworthy vs its clean verdict? When does `/done` run agents on an all-doc diff? Does reordering a rule earlier in a doc actually fix a salience miss?* (D21, D24, D25, D28, D38, D39, D47, D48, D49, D52, D58, D-emission-shape-reanchor) |
| [decisions/concurrency-and-delegation.md](decisions/concurrency-and-delegation.md) | *How does the plugin delegate to cheaper/parallel agents, what does `run_in_background` actually guarantee, what happened to the transcript-scan mechanism, how do skills write a doc another session owns, how do two skills reconcile disagreeing about the same run-time state, where does cost relief for an expensive skill live, what must a spawned agent be told not to run, and how does a session learn a peer is editing the same files before their bytes land?* (D30, D31, D32, D34, D35, D36, D42, D53, D-commit-staleness-same-session-carveout, D-quick-done, D-agent-verb-ban-shared, D-mtime-cannot-see-concurrent-writers, D-cross-session-messaging) |

---

## Operational Tasks

**Agent-definition coverage**
- [ ] `agent-may-not-redelegate.md` states the failure shape but never the compliant one. Adding one example of a properly-scoped `Explore` dispatch would settle the question; possibly already inferable from the gathering-vs-judgment framing.
- [ ] Three condense/unhobble skills reference `claude-md-pruner` in prose but carry no `📖` pointer to the shared constraint file. Coverage: `condense-claude-md`, `condense-task-doc`, `unhobble-instructions`. Note: they do not dispatch `claude-md-pruner`; the relationship runs the other way (pruner delegates sizing policy to them).
- [ ] `setup-playwright`'s video section needs a code fence showing three interacting requirements (context-level `recordVideo`, holding context open before close, resolving `page.video().path()` before close). Deferred: a snippet in a SKILL.md must be run against a real suite before landing.

**Released items**
- [x] Stale agent detector landed (v1.158.0): `read-summary` now probes for a safety-relevant rule the first time a session dispatches a project agent. Template-side constraints only govern behaviour once `/agent-setup` regenerates copies, so the probe alerts consumers to regenerate when their agent predates a fix.
- [x] `/quick-done` size claim corrected (v1.140.2): shipped v1.140.0 advertised 31.9KB vs 75.8KB (both wrong); corrected to 53.6KB vs `/done`'s 76.6KB (~30% saving).

**Doc structure**
- [ ] **This doc set is 1051 lines / 142KB against a 300-line budget — the overage is structural, not bloat.** Two independent `condense-task-doc` passes measured ~26 lines per ADR (skill's floor ~20), confirming that further compression would delete decisions. The real lever is structural (promoting a theme to its own `tasks/plugin-maintenance/<feature>/`), a scope call not a condense. This finding is final; don't re-route to `condense-task-doc` expecting a different answer.

**Deferred**
- [ ] `hobby-review` Step 5 emits its verdict template without verifying the conversation reached the 3 gates — D49's pattern, judged not worth fixing (soft guidance, writes nothing). Revisit only if an unfinished arc produces a bad verdict.

---

## Session History

**Pattern across all sessions: Generated files and templates drift silently; presence-shaped checks pass while content differs.** The fix is to read the constraint text itself, not just its location. This pattern appears in issues #27, #24, and #20; it is captured at D-verify-by-definition-not-by-string and D-parity-drift-is-bidirectional. Each session below arrived at this finding independently.

**v1.279.0 (2026-09-15) — The coordinator is inside its own file partition**
`/done`'s partition rule ("one agent per file for writes") reads as a rule about the *agents*, so the dispatcher grants a file to a simplifier and then keeps editing it. Your context for that file goes stale the moment the agent writes, and an `Edit` from remembered text still applies cleanly — it anchors on a string that survived the rewrite while the paragraphs around it moved. Measured this session: a figure restored into `CHANGELOG.md` landed beside a paragraph the simplifier had already refolded, leaving the entry describing a dependency two paragraphs before the one explaining its removal. The harness's "modified on disk since you last read it" notice is the only signal and it arrives *after* the write, so the guard is to hold your own edits to a granted file until the agent returns, or re-read before each one. Fixed at `done/SKILL.md` Step 1. Also reconfirmed issue #27 first-hand: three reviewers were dispatched without a `SendMessage` clause and the product reviewer's findings never arrived — recovered only by resuming it and asking, which is what surfaced the two second-order defects below.

**v1.211.0 (2026-08-26) — Issue #27: Named agents don't return reports**
Passing `name:` to `Agent` silently changes where the report goes. A named subagent is an addressable teammate, so its plain-text final output never returns to the caller — the completion notification carries only that it finished. Five of six agents in a reporter's `/done` fan-out went idle with their reviews unretrieved. Non-determinism means this needs a standing clause, not a noticed-once fix: six identically-spawned agents split one-reporting vs five-not, so a successful run is no evidence the clause is unnecessary. Fixed at `done/SKILL.md` (inside compaction window) and in `references/emission-and-agent-counts.md`. Also: template/agent parity check passed on `code-reviewer` despite both drifting — content differed while `📖` pointer matched.

**v1.173.0 (2026-08-18) — Issue #24: Contested-file guard placement**
`update-claude-docs` Step 4 mandated spawning `claude-md-pruner` at a contested CLAUDE.md, which the skill's preamble forbids. A sibling sweep (`grep subagent_type`) found one dispatch site; reviewers found two more via other routes. `condense-claude-md` reached the agent via direct `Skill()` call, invisible to dispatch greps — pattern: grep the *action*, not the *dispatcher* (D-guard-the-act-not-the-dispatcher). Also: a working-tree version mismatch (`plugin.json` 1.172.0, `marketplace.json` 1.170.0) read as shipped drift until git history confirmed both matched HEAD — `git show <sha>:<path>` is the tiebreaker for what consumers saw (D-cross-session-messaging applies here).

**v1.158.0 (2026-08-14) — Stale agent detection**
`/plan-worklist` dispatch caught `product-reviewer` spawning a nested `product-reviewer` (D-agent-may-not-redelegate). The restriction existed in six of seven templates as a comment, which runtime never reads. A grep sweep (`grep '^  - Agent'`) found seven templates; `task-builder` was missed because it omits `tools:` to receive the full set. The corrected rule: grep what the runtime cares about, not what a comment asserts. Added detection to `read-summary` and `done/SKILL.md`'s blindness-patterns table so dispatchers know what a relayed report looks like. Shipped 1.154.0 after resolving a concurrent session's half-applied 1.153.0 (only `plugin.json` bumped).

**v1.144.0 (2026-08-11) — Issue #20: Regression and detection gap**
Two defects: (1) parity check passed on template/agent pairs despite both being equally wrong — `85104d8` deleted `Explore`'s `disallowedTools` guard and the ⚠️ Bootstrap explaining it together, so the check compared two equally-wrong files; (2) detection for non-git repos required two probes (`rev-parse --git-dir`, `rev-parse HEAD`) because the first returns 0 in zero-commit repos. Generalized `verifying-a-write-landed.md` to the repo level. Resolved Defect 2's fix against D60 rather than restoring the guard — the grant is deliberate (scratchpad), and scope lives in body text (matching `Plan`'s approach).

**2026-08-09 — Cross-session messaging design**
Judged whether to implement cross-session messaging as a general feature. Two of four documented concurrency problems were intra-session (subagent races); the user reframed the remaining case as "same project, same files, any two sessions" — which moved the check from write sites to `read-summary`. Version-number markers fail for ownership (1.140.6 matched peer's own heading); ownership classification by grep of MANDATE vocabulary is more reliable (D-cross-session-messaging). The feature demonstrated its limits: `ListAgents` does not report cwd; mtime cannot see concurrent writers (D-mtime-cannot-see-concurrent-writers).
