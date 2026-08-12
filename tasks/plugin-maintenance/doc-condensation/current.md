<!--LLM-CONTEXT
Status: Reference (ongoing) — 40 committed decisions across 4 themed decision files
Domain: plugin-maintenance/doc-condensation
Gotchas (critical — full list in ## Critical Gotchas below):
  - Confirming a passage is gone ≠ it should be gone; apply target skill's fact-vs-constraint bar
  - A file mid-write is unstable to verify; wait for completion notification before judging edits
Related:
  - ../agent-architecture/current.md (generated agents inherit conventions + sibling skill invocation)
  - ../madr-structure/current.md (the MADR format itself)
  - ../external-guidance/current.md (grading outside guidance against plugin measurements)
Last updated: 2026-08-12
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation

## Quick Start (read this first in next session)

**Where we are**: The plugin's "one fact, one home" doctrine implemented across task docs, CLAUDE.md, and skills. Two levers: **density** (byte-count bloat, `condense-claude-md`/`condense-task-doc`) and **overconstraint** (rigid rules, `unhobble-instructions`). Both shipped; each real run found verifier defects.

**Blockers (open)**:
1. Automated version-file drift gate (plugin.json/marketplace.json) — 5th recurrence
2. Automated ADR-id uniqueness gate — 1 real collision caught 2026-08-02
3. Watch arrival-rate gate impact (add/remove ratio, target 1:1 vs current 2.6:1)

**Next actions**: See Task Status 4-9 and Next Steps.

---

## Overview

Decisions about fighting duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage. Split out of the plugin-maintenance whole-doc MADR (2026-07-24) as its own feature, one level up from the prior `decisions/doc-condensation.md` router. Sibling features: [agent-architecture](../agent-architecture/current.md), [madr-structure](../madr-structure/current.md).

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Fix bloat at the generator, not by hand-trimming (D3, D6, D17, D18, D19, D20) | ✅ |
| 1b | Size authority defers to the file — declared budget (D44) + undersized floor (D51) | ✅ |
| 2 | Structural splits — byte thresholds, companion files, plan-doc typing (D22, D26, D27, D33, D45, D46, D62) | ✅ |
| 2b | Skill-file density (D23, D50, D54) — D23's hand-condense regressed; D50 replaced it with extraction + an arrival-rate gate; D54 closed the gate's open half (Gate B) and scoped `references/*.md` out of it | ✅ (watch the ratio) |
| 2c | Overconstraint as a distinct axis from density — `skills/unhobble-instructions/SKILL.md`, applied across `update-plugin`, `done`, `read-summary`, `update-claude-docs`, `task-summary`, `condense-task-doc`, `merge-task-docs`, `sweep-doc-overlaps` (2026-08-01) and CLAUDE.md itself (2026-08-09, 33.4KB→17.6KB + `_shared/references/editing-skills-checklist.md`) | ✅ shipped — each real run has found a defect in the skill or its verifier: D64 (softened a deliberately absolutist rule), D-limitation-reads-as-hedging (deleted stated limitations as hedging), D-dropped-is-not-the-same-as-correctly-dropped (the verifier ratified a real drop as correct trimming) |
| 3 | Duplication detection + leak-guard integrity (D37, D40, D12) | ✅ |
| 4 | Version-drift automated gate (plugin.json/marketplace.json) | ⏳ Pending — 6th recurrence |
| 5 | Companion file scope gap — `condense-claude-md`/`update-claude-docs` never treated a pre-existing companion as a condense target itself (D65) | ✅ |
| 6 | Sentence-length blind spot — `condense-task-doc`'s aggregate line/byte target passed with individual sentences still 500+ chars (D67) | ✅ |
| 7 | The condense rule had no enforcer — `/done` Step 4 now measures the doc set it just wrote (issue #19, D-done-owes-the-condense); `condense-task-doc`'s ownership guard scoped to uncommitted state (D-guard-scoped-to-what-it-can-see); the doc-set measurement fixed to survive an unsplit doc (D-unmatched-glob-measures-zero) | ✅ |
| 8 | Verification against a moving target + a revert argued from grep/byte-delta alone — 4th consecutive real run to find a defect in the verification tooling itself (D-dropped-is-not-the-same-as-correctly-dropped extended, D-torn-page-verification) | ✅ |
| 9 | Routing/seam-test asking WHERE a fact was found instead of WHAT it's about — buried two Playwright API facts in one repo's CLAUDE.md (D-route-by-subject-not-discovery); paired with a new `Invalidated` classification for a rule a session's own work disproved | ✅ |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/bloat-generator-fixes.md](decisions/bloat-generator-fixes.md) | *Where does the plugin fix doc bloat — at the generator (task-summary rules) or by hand-trimming? What structural levers exist for over-budget CLAUDE.md? What if the file declares its own budget, or is far UNDER it? How does the `/commit` staleness gate avoid lexical false positives? Can an aggregate line/byte target pass while individual sentences stay bloated? Who enforces the condense once a doc is over budget, when does an ownership guard block work it was never meant to, and why does a doc-set measurement read 0?* (D3, D6, D17, D18, D19, D20, D44, D51, D57, D67, D-done-owes-the-condense, D-guard-scoped-to-what-it-can-see, D-unmatched-glob-measures-zero) |
| [decisions/structural-mechanics.md](decisions/structural-mechanics.md) | *When does a doc/CLAUDE.md/skill need a structural split (byte thresholds, companion files, plan-doc typing) instead of denser prose? Why does re-condensing the same skill keep failing? What checkpoint catches a rule that arrives with no defect, what size policy applies to `references/*.md`, and why does a stale pointer pass the same grep a missing rule fails? What stays in a split index versus routing down to `decisions/`?* (D22, D23, D26, D27, D33, D45, D46, D50, D54, D62, D69) |
| [decisions/verification-rigor.md](decisions/verification-rigor.md) | *When should a CLAUDE.md entry be prose vs. a table row, once a companion file exists is it ever a condense target itself, may condensation drafting be delegated to an agent, which kind of fact does an unhobbling pass mistake for hedging, how does a verifier decide whether a confirmed drop was correct, what happens when two skills mandate opposite shapes for the same doc, when is a file too unstable to verify, and does a fact route by where it was found or what it's about?* (D63, D64, D65, D66, D68, D-haiku-condense-delegation, D-mandate-vs-judgement, D-limitation-reads-as-hedging, D-dropped-is-not-the-same-as-correctly-dropped, D-torn-page-verification, D-route-by-subject-not-discovery) |
| [decisions/duplication-and-integrity.md](decisions/duplication-and-integrity.md) | *How does the plugin catch duplicated facts (within/across docs) and verify a fix actually landed everywhere?* (D37, D40, D12, demoted D2/D5/D7/D11) |

---

## Next Steps

**Automated gates**
- [ ] `plugin.json`/`marketplace.json` version drift — 6th occurrence (D26 2026-07-15, then 2026-07-17, 2026-07-22, 2026-08-01, 2026-08-11, 2026-08-12). The 2026-08-12 instance was found by a session reading both files for an unrelated reason, not by any gate or agent — the two prior catches moved earlier each time but nothing yet catches it by construction. A bump to one file without the other passes silently; a pre-commit check or single-source-of-truth version file is the open fix.
- [ ] ADR-id uniqueness has no post-write gate — the same "silently passes" shape as the row above. **2026-08-02: this collided for real** — two unrelated decisions both minted `### D66` (fixed this session, renumbered to D67), the exact failure this item predicted before the gate existed. Mechanism + fix owned by [../agent-architecture/current.md](../agent-architecture/current.md) Next Steps.

**Extraction candidate (flagged 2026-08-11, deferral re-confirmed 2026-08-12 — growing)**
- [ ] The "resident vs. lazy-load" routing principle is now stated near-identically in `condense-claude-md/SKILL.md`, `condense-claude-md/references/structural-splits.md`, `unhobble-instructions/SKILL.md`, and `update-claude-docs/SKILL.md` (2026-08-12: this last site's §2a/§2b derivability+residency gates ported the same test into a 5th/6th citing location — commit dd51665). Past the 3+ extraction threshold and still growing each time a session touches one of these skills without doing the extraction. Extracting to `skills/_shared/references/` needs each site's phrasing re-tuned to a shared version without losing per-skill fit; user explicitly re-confirmed the hold on 2026-08-12 rather than actioning it during that session — pick this up as its own dedicated session rather than a `/done` side-effect.

**Pointer reachability (D-pointer-needs-a-trigger, executed 2026-08-12)**
- [x] That decision's **Rejected** section contradicted its own **Consequences** on whether rewording a closed pointer works. Execution settled it — six citations reworded open, one 8-line reference retired — and the Rejected bullet is now narrowed rather than deleted: the original objection holds for a reword that leaves the line terminating, and inline-or-cut is the lever only when the reference is too small to justify the pointer at all. ✅
- [ ] The unreachability audit was run against *pointer lines*, never against whether a fact reached the **moment** a skill acts on it. Two rounds of review caught the same defect at finer grain: the inlined leaked-tag check reached 1 of 5 files, then reached all 5 files but sat in "Hard rules" while three skills walk a separate numbered verify step. Both fixed. Worth a sweep asking the same question of the other 14 references — a fact present in a file it can't fire in is the same defect as a pointer nobody opens.

**Reciprocal note (D65)**
- [ ] `unhobble-instructions/SKILL.md` line 53's unhobble-vs-condense boundary is real but generic — it doesn't name the specific trap that caused D65 (sweeping every file under `.claude-companions/` for overconstraint feels exhaustive enough to skip condense's own pass, which is a different check). Add a line naming this specific companion-plurality shape so the same reasoning error doesn't recur in this direction next time.

**Arrival-rate gate — watch, now that both halves are closed (D54)**
- [ ] Re-measure the add/remove ratio after a few sessions run under Gate B — `git log --since=... --numstat -- 'skills/**/*.md'`. The gate's purpose is moving 2.6:1 toward 1:1; a one-time byte drop is not the success criterion. If the ratio has not moved, the remaining leak is sessions that never run `/done` at all — an accepted limit to state here rather than re-engineer.
- [ ] `condense-claude-md/references/structural-splits.md` is 6,515 bytes against the new ~6KB prose-reference ceiling — prose, not a catalog (6 table rows across 3 prose sections). First live edge case of that rule. Check it on the next density pass through `condense-claude-md`; do not split a 53-line file, which would make it harder to use.

**Agent templates vs the Bootstrap pattern (deferred from v1.131.0's plan, Phase 4)**
- [ ] `skills/agent-setup/templates/*.template.md` total **77KB — 12.5% of the corpus**, with `browser-verifier.template.md` alone at 15KB, larger than most skills. The Bootstrap pattern's premise is that agents read CLAUDE.md *at runtime* rather than carry injected content, so templates this size suggest it is leaking. Audit for content an agent would read anyway; **preserve** `browser-verifier`'s `USER-TRIGGERED ONLY` gate, which guards real unauthorised spend. Lower priority than the gates above — templates are read once at generation, not per invocation.

---

## Critical Gotchas

Defensive traps organized by mechanism. Full context: open the cited decision file.

| Trap | Tell | Where |
|------|------|-------|
| A gate's inputs must be computed at the DECIDING step, not a sibling step | Measurement placed after the hand-off sentence; checklist rows are themselves unenforced | D51, D-done-owes-the-condense (bloat-generator-fixes.md) |
| Ownership guards fire on uncommitted state only, not history | A safe operation blocked as "contested" because committed work looks like another session's baseline | D-guard-scoped-to-what-it-can-see (bloat-generator-fixes.md) |
| Glob-based measurement breaks on unsplit docs | `cat current.md decisions/*.md` aborts on unmatched glob in zsh; use `find...xargs cat | wc -lc` | D-unmatched-glob-measures-zero (bloat-generator-fixes.md) |
| Confirming absent doesn't establish should-be-absent | A passage is gone, but whether it *should* be gone is a separate test (apply target skill's bar, not yours) | D-dropped-is-not-the-same-as-correctly-dropped (verification-rigor.md) |
| A file mid-write is unstable to verify | A defect found mid-pass may already be fixed; wait for completion notification + two `wc -c` calls | D-torn-page-verification (verification-rigor.md) |
| A stated limitation looks like hedging to a condense pass | Text "does NOT do X" deleted, leaving confident "does Y" without the guard — only the claim changes | D-limitation-reads-as-hedging (verification-rigor.md) |
| Softening an absolutist rule without checking its history | D57/D64's rejection is still in `decisions/*.md`; grep before loosening | D64 (verification-rigor.md) |
| Companion files are CONDENSE targets, not just destinations | A file already unhobbled still needs condense's own pass (different checks) | D65 (verification-rigor.md) |
| Seam-test measures WHERE, not WHAT the fact is about | Playwright API facts route by discovery-repo rather than "true everywhere"; ask "would this exist if this code didn't" | D-route-by-subject-not-discovery (verification-rigor.md) |
| Aggregate metrics hide bloated sentences | Doc passes line/byte target while individual rows are 500+ characters of parentheticals | D67 (bloat-generator-fixes.md) |
| An enumerated set can lose items while pointers survive | Condensing an ENUMERATED list drops visibility; verify counts the prose claims | D50 (structural-mechanics.md) |
| Pointer's own line can be the only grep hit | Stale content sits one hop away, invisible because the pointer itself resolves | D62 (structural-mechanics.md) |
| `references/*.md` is OUT of the B/L gate | That ratio measures hot paths; a reference is a cold-path lookup whose correct shape is a dense table | D54 (structural-mechanics.md) |
| Marker downgrade is presentation, not condensation | `[!WARNING]` → `[!NOTE]` passes rule-count checks but changes what a reader does; diff sorted word SETS | D54 (structural-mechanics.md) |
| Plan docs are NOT `decisions/` candidates | Pre-existing schemas/specs are siblings, not ADRs; a MADR block needs its own condensation rule shipped with it | D27 (structural-mechanics.md) |
| One companion per topic, never a grab-bag | Splitting "Miscellaneous" relocates ten unrelated items, recreating bloat under a new path | D45 (structural-mechanics.md) |
| A rule stated in N files drifts in the ones that paraphrase it | Fixing a cross-file contradiction by grepping its phrase misses every site expressing the same idea in other words; and a site that agrees textually can still sit where the session never reads it | D69 (structural-mechanics.md) |
| Version drift recurs and passes silently | `plugin.json` vs `marketplace.json` diverge; 5th recurrence (see Next Steps) | D26 |
| ADR ids collide across sibling task docs | One sequence shared across all three `*/decisions/*.md` DOMAINS; test with `uniq -d` AFTER writing | — (agent-architecture) |
| Zero-result grep needs a must-hit control | A false-0 on a true fact is as bad as a false-positive on a false one | — (agent-architecture) |
| Format test per signal type | Prose for "it depends"; table row for exact value; prose+pointer for mixed — applies to Create-mode templates too | D63 (verification-rigor.md) |
| Condensation unit is the doc SET, not the named file | A member holding 2× the index's bytes unexamined; set index = Quick Start + doc-wide tables + routing | `task-summary/references/templates.md` |

---

## Last Session (2026-08-12)

- `/done` review of commit dd51665 (routing heuristic ported into `update-claude-docs` §2a/§2b + `unhobble-instructions`): fixed 2 stale line-number cross-references (`unhobble-instructions/SKILL.md` — self-citing "line 28" when the target bullet is at line 30) and one garbled table cell (`update-claude-docs/SKILL.md` mismatched quotes).
- Captured a new CLAUDE.md authoring rule: cite named headings/bullets internally, never raw line numbers (drift-prone).
- Product reviewer flagged the commit as adding a 5th/6th near-duplicate site to the already-flagged "resident vs. lazy-load" extraction candidate (below) — user re-confirmed the hold rather than actioning it this session.
- Closed GitHub #21 (consumer-reported): three skills disagreed on whether a split index's `## Next Steps` could route down to `decisions/`, making the 300-line target unreachable for any doc with a large backlog. Settled as D69 — actionables stay in the index and are excluded from the count. Seven sites across five files; the reporter found two, a phrase grep found two more, and the two reviewers found one and two respectively on different lenses.

**Prior session (2026-08-11)**: Registry/compliance fixes; 5th version-drift recurrence caught; doc set split (`structural-splits.md` → `structural-mechanics.md` + `verification-rigor.md`); `editing-skills-checklist.md` worked example fixed across all four citers.
