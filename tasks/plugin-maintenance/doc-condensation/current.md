<!--LLM-CONTEXT
Status: Reference (ongoing) — 45 committed decisions across 4 themed decision files
Domain: plugin-maintenance/doc-condensation
Gotchas (critical — full list in ## Critical Gotchas below):
  - Confirming a passage is gone ≠ it should be gone; apply target skill's fact-vs-constraint bar
  - A file mid-write is unstable to verify; wait for completion notification before judging edits
  - A pointer can read correct and be dead: `../_shared/…` is right in a SKILL.md, broken in references/*.md — resolve by ls, not by eye
  - A pointer defers a rule rather than delivering it; nothing forces a reference to load, so the fact that a problem EXISTS stays inline and only the fix procedure goes behind the `📖`
Related:
  - ../agent-architecture/current.md (generated agents inherit conventions + sibling skill invocation)
  - ../madr-structure/current.md (the MADR format itself)
  - ../external-guidance/current.md (grading outside guidance against plugin measurements)
Last updated: 2026-08-18 (v1.179.0) — instruction files state what to establish, not which command establishes it: a prescribed command bakes in an environment, and its failures are quiet (an unmatched glob reporting `0`, a flag meaning something else on BSD, a range keyed to a heading someone renamed). The same rule over-applied by twenty agents deleted 400 project identifiers across 55 files in other repos, every one reporting success (D-prescribed-commands-are-environment-assumptions). Earlier (v1.178.0): retiring a convention's PRESCRIPTION does not retire its instances: 17 `**Tell:**` markers survived across 4 files with nothing left teaching the form, 14 hollow and 3 load-bearing. Marker density predicts a file's GENRE, not its health (2-of-58 load-bearing in a symptom-table file vs 14-of-17 hollow in prose skill bodies). Mtime cannot discriminate ownership between concurrent sessions — routed to `diff-ownership.md`. Earlier (v1.175.0, shipped 8970293): a `📖` pointer defers a rule rather than delivering it (D-deferral-is-not-delivery); issue #25's relocation check landed as `_shared/references/verifying-a-relocation.md`; `unhobble-instructions` + `haiku` unhobbled (26.7KB→20.2KB, 16.9KB→9KB); arrival-rate ratio 1.33:1
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation

## Quick Start (read this first in next session)

**Where we are**: The plugin's "one fact, one home" doctrine implemented across task docs, CLAUDE.md, and skills. Two levers: **density** (byte-count bloat, `condense-claude-md`/`condense-task-doc`) and **overconstraint** (rigid rules, `unhobble-instructions`). Both shipped; each real run found verifier defects.

**Blockers (open)**:
1. Automated version-file drift gate (plugin.json/marketplace.json) — 9th recurrence; the 2026-08-17 one was a single session drifting four versions, so concurrency is one cause rather than the cause
2. Automated ADR-id uniqueness gate — 1 real collision caught 2026-08-02
3. Watch arrival-rate gate impact — first measurement 1.33:1, down from the 2.6:1 it was built to move

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
| 4 | Version-drift automated gate (plugin.json/marketplace.json) | ⏳ Pending — 10th recurrence; v1.175.0 found the two manifests one release apart (1.174.0 vs 1.173.0), a half-applied bump surviving a full `/done` because nothing compares the two files |
| 5 | Companion file scope gap — `condense-claude-md`/`update-claude-docs` never treated a pre-existing companion as a condense target itself (D65) | ✅ |
| 6 | Sentence-length blind spot — `condense-task-doc`'s aggregate line/byte target passed with individual sentences still 500+ chars (D67) | ✅ |
| 7 | The condense rule had no enforcer — `/done` Step 4 now measures the doc set it just wrote (issue #19, D-done-owes-the-condense); `condense-task-doc`'s ownership guard scoped to uncommitted state (D-guard-scoped-to-what-it-can-see); the doc-set measurement fixed to survive an unsplit doc (D-unmatched-glob-measures-zero) | ✅ |
| 8 | Verification against a moving target + a revert argued from grep/byte-delta alone — 4th consecutive real run to find a defect in the verification tooling itself (D-dropped-is-not-the-same-as-correctly-dropped extended, D-torn-page-verification) | ✅ |
| 9 | Routing/seam-test asking WHERE a fact was found instead of WHAT it's about — buried two Playwright API facts in one repo's CLAUDE.md (D-route-by-subject-not-discovery); paired with a new `Invalidated` classification for a rule a session's own work disproved | ✅ |
| 10 | A skill's argument rewrites bare dollar-zero inside its own shell snippets, so `condense-task-doc`'s size verdict came from a command it never contained (consumer issue #22, D-skill-args-eat-dollar-zero) | ✅ |
| 11 | Inlining a reference severs the citation graph at both ends — an orphaned file and a dropped pointer to shared machinery, neither visible to a resolve-check, a diff, or a self-report (D-inlining-breaks-the-citation-graph) | ✅ |
| 13 | Every size threshold in the condense skills was a floor to reach with no ceiling — `condense-task-doc` deleted 64% of a doc set (~40 gotcha rows, one written minutes earlier) and reported the figure as success. The guard that existed sat in `task-summary`, which every dispatch path routes AWAY from (consumer issue #26, D-a-floor-is-not-a-ceiling) | ✅ |
| 12 | A pointer's relative DEPTH is wrong while its wording is right — `../_shared/…` is correct in a `SKILL.md` and broken one directory down in `references/*.md`. Distinct from row 11: nothing is severed and no file is orphaned, so every citation-graph check passes (D-pointer-depth-reads-as-correct) | ✅ |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/bloat-generator-fixes.md](decisions/bloat-generator-fixes.md) | *Where does the plugin fix doc bloat — at the generator (task-summary rules) or by hand-trimming? What structural levers exist for over-budget CLAUDE.md? What if the file declares its own budget, or is far UNDER it? How does the `/commit` staleness gate avoid lexical false positives? Can an aggregate line/byte target pass while individual sentences stay bloated? Who enforces the condense once a doc is over budget, when does an ownership guard block work it was never meant to, why does a doc-set measurement read 0, why can a shell snippet in a skill body not be trusted to run as written, and why do docs keep going stale when the skill that writes them validates every time?* (D3, D6, D17, D18, D19, D20, D44, D51, D57, D67, D-done-owes-the-condense, D-guard-scoped-to-what-it-can-see, D-unmatched-glob-measures-zero, D-skill-args-eat-dollar-zero, D-validation-scoped-to-the-diff) |
| [decisions/structural-mechanics.md](decisions/structural-mechanics.md) | *When does a doc/CLAUDE.md/skill need a structural split (byte thresholds, companion files, plan-doc typing) instead of denser prose? Why does re-condensing the same skill keep failing? What checkpoint catches a rule that arrives with no defect, what size policy applies to `references/*.md`, and why does a stale pointer pass the same grep a missing rule fails? What stays in a split index versus routing down to `decisions/`?* (D22, D23, D26, D27, D33, D45, D46, D50, D54, D62, D69) |
| [decisions/verification-rigor.md](decisions/verification-rigor.md) | *When should a CLAUDE.md entry be prose vs. a table row, once a companion file exists is it ever a condense target itself, may condensation drafting be delegated to an agent, which kind of fact does an unhobbling pass mistake for hedging, how does a verifier decide whether a confirmed drop was correct, what happens when two skills mandate opposite shapes for the same doc, when is a file too unstable to verify, does a fact route by where it was found or what it's about, what breaks when a pass inlines a reference into its citing file, how does a pointer stay dead while reading as correct, and why does a size threshold catch a doc that shrank too little but not one that shrank too much?* (D63, D64, D65, D66, D68, D-haiku-condense-delegation, D-mandate-vs-judgement, D-limitation-reads-as-hedging, D-dropped-is-not-the-same-as-correctly-dropped, D-torn-page-verification, D-route-by-subject-not-discovery, D-inlining-breaks-the-citation-graph, D-pointer-depth-reads-as-correct) |
| [decisions/duplication-and-integrity.md](decisions/duplication-and-integrity.md) | *How does the plugin catch duplicated facts (within/across docs) and verify a fix actually landed everywhere?* (D37, D40, D12, demoted D2/D5/D7/D11) |

---

## Next Steps

**Automated gates**
- [ ] `plugin.json`/`marketplace.json` version drift — 9th occurrence (D26 2026-07-15, then 2026-07-17, 2026-07-22, 2026-08-01, 2026-08-11, 2026-08-12, twice on 2026-08-14, and 2026-08-17). The 2026-08-17 recurrence widens the case rather than repeating it: a single session drifted four versions (`plugin.json` at 1.167.0 against `marketplace.json` at 1.163.0), so the concurrency explanation offered for the 2026-08-14 pair is not the whole mechanism — one session bumping repeatedly across a run drifts just as reliably, and each individual bump looked complete at the time. It was found by a review agent reading both files for an unrelated reason, which is now the pattern for four consecutive catches: the finder is always someone who happened to open both, never a gate. A bump to one file without the other passes silently; a pre-commit check or single-source-of-truth version file is the open fix.
- [ ] ADR-id uniqueness has no post-write gate — the same "silently passes" shape as the row above. **2026-08-02: this collided for real** — two unrelated decisions both minted `### D66` (fixed this session, renumbered to D67), the exact failure this item predicted before the gate existed. Mechanism + fix owned by [../agent-architecture/current.md](../agent-architecture/current.md) Next Steps.

**Extraction candidate (flagged 2026-08-11, deferral re-confirmed 2026-08-12 — growing)**
- [ ] The "resident vs. lazy-load" routing principle is now stated near-identically in `condense-claude-md/SKILL.md`, `condense-claude-md/references/structural-splits.md`, `unhobble-instructions/SKILL.md`, and `update-claude-docs/SKILL.md` (2026-08-12: this last site's §2a/§2b derivability+residency gates ported the same test into a 5th/6th citing location — commit dd51665). Past the 3+ extraction threshold and still growing each time a session touches one of these skills without doing the extraction. Extracting to `skills/_shared/references/` needs each site's phrasing re-tuned to a shared version without losing per-skill fit; user explicitly re-confirmed the hold on 2026-08-12 rather than actioning it during that session — pick this up as its own dedicated session rather than a `/done` side-effect.

**Pointer reachability (D-pointer-needs-a-trigger, executed 2026-08-12)**
- [x] That decision's **Rejected** section contradicted its own **Consequences** on whether rewording a closed pointer works. Execution settled it — six citations reworded open, one 8-line reference retired — and the Rejected bullet is now narrowed rather than deleted: the original objection holds for a reword that leaves the line terminating, and inline-or-cut is the lever only when the reference is too small to justify the pointer at all. ✅
- [ ] The unreachability audit was run against *pointer lines*, never against whether a fact reached the **moment** a skill acts on it. Two rounds of review caught the same defect at finer grain: the inlined leaked-tag check reached 1 of 5 files, then reached all 5 files but sat in "Hard rules" while three skills walk a separate numbered verify step. Both fixed. Worth a sweep asking the same question of the other 14 references — a fact present in a file it can't fire in is the same defect as a pointer nobody opens.

**Size-measurement drift across skills (D-skill-args-eat-dollar-zero, 2026-08-14)**
- [ ] `task-summary/SKILL.md`'s "Size budget" section measures `current.md` by bytes (`wc -c`, "not line count"), while `condense-task-doc` step 7 — the file this repo designates as sole owner of size policy — measures lines with the `## Next Steps` section subtracted. `claude-md-pruner` measures the set with `wc -lc` and names no exemption. Three gates, three units, only discoverable by reading all three. The owning skill should hold the formula and the others point at it; left as-is this session because the fix touches files outside the issue #22 scope.

**Marker arrival in `done/SKILL.md` (observed 2026-08-14, actioned same day)**
- [x] The 1.151.0 infra-only change took `**Tell:**` markers from 1 to 3; the marginal one is cut, leaving 2. Kept: "nothing in the test suite would fail if the file were wrong" — the operative test the mode rests on once its format enumeration was replaced by a mechanism, so cutting it would leave the mode undefined. Cut: "the diff contains a loop, a branch, or two lists that mirror each other" — its own bolded lead already says *imperative rather than declarative* and the sentence body already names the promote/rollback pair, so the marker restated a case the prose had made and turned judgement into a checklist. Judged by the session that wrote it, which is the right owner; the observing session correctly left it rather than trimming another session's uncommitted work. The bar `haiku`/`unhobble-instructions` state holds: a marker earns its place by naming a checkable fact the prose does NOT already carry — restatement is the disqualifier, not the marker itself, since a previous session wrongly trimmed one that was doing real work.

**Corpus-wide `**Tell:**` residue (closed 2026-08-18)**
- [x] 17 converted to prose across `update-claude-docs/SKILL.md`, `one-turn-chain.md`, `explore-delegation.md`, `done/SKILL.md`; 3 kept as prose clauses for naming a checkable fact the surrounding text didn't. ~26 remain corpus-wide, concentrated in `| Symptom | Cause | Fix |` companions where `writing-style.md` says the table shape already fills that slot — left deliberately, not pending. Re-measure with `grep -rc "Tell:" --include="*.md" skills/` rather than trusting this count.

**Owed edit against a contested file (2026-08-18)**
- [ ] `quick-done/SKILL.md` Step 3 prescribes the mtime check as its first ownership test ("Files predating your session start were edited by another"), which this session measured failing against a concurrent peer. The mechanism now lives in `_shared/references/diff-ownership.md`; Step 3 should defer to it rather than leading with mtime. Not edited this session — the file carried a peer's uncommitted work.

**Delegated `unhobble-instructions` deletions are invisible to the post-pass read (2026-08-18)**
- [x] Four haiku agents unhobbled `task-summary/SKILL.md` (208→192 lines), `read-summary/SKILL.md` (122→108, plus a new `references/validating-generated-agents.md` companion), `quick-done/SKILL.md` and `_shared/references/verifying-a-write-landed.md` (40→50 lines, denser). All four reported clean; five real defects surfaced only against a pre-dispatch `cp` snapshot. One shape recurred: compression keeps a rule's imperative and drops the MECHANISM under it, or drops the `📖` citation, leaving a rule with no route to its machinery. Instances — two severed shared-reference pointers (`diff-ownership.md`, `explore-delegation.md`) in `task-summary`; two paragraphs deleted rather than relocated from `read-summary`, killing its only `cross-session-messaging.md` citation; the `grep -L`-lists-files-matching-NONE trap lost while moving content to a new companion; and a bare "run it after Step 1" whose reason was cut. Already-owned coverage held up: `haiku/references/verifying.md` line 19 ("a report claiming content already lived elsewhere is the cheapest claim to make") is exactly what caught the last one — the agent's justification named a section that did not contain the fact. No CLAUDE.md capture; every candidate was already stated at `CLAUDE.md:173` or in `haiku/references/verifying.md`.
- [ ] Repairs were pasted from the snapshot, which `haiku/references/verifying.md` line 35 warns restores the *shape* the pass existed to remove. Re-read the four restored passages against each file's rewritten voice and carry the fact across in the new form where it still reads as snapshot bytes.

**Owed edit against a contested file — now unblocked (2026-08-18)**
- [x] The `quick-done/SKILL.md` Step 3 mtime deferral parked below was blocked on *this* session's uncommitted work in that file. Same conclusion reached independently here: mtimes across the two sessions interleaved (peer 17:50–17:54, this session 17:32–17:49) rather than separating, so "files predating your session start" ordered them correctly and answered the wrong question. `ListAgents` showing one busy peer plus a diff read is what actually settled it.

**Reciprocal note (D65)**
- [ ] `unhobble-instructions/SKILL.md` line 53's unhobble-vs-condense boundary is real but generic — it doesn't name the specific trap that caused D65 (sweeping every file under `.claude-companions/` for overconstraint feels exhaustive enough to skip condense's own pass, which is a different check). Add a line naming this specific companion-plurality shape so the same reasoning error doesn't recur in this direction next time.

**Arrival-rate gate — watch, now that both halves are closed (D54)**
- [x] **Measured 2026-08-14: 1.33:1** (`+1637 / -1229` since Gate B landed on 2026-08-12), down from 2.6:1. The gate is working — sessions are now retiring roughly three lines for every four added, against one for every two-and-a-half before. Re-measure with `git log --since=<gate-date> --numstat -- 'skills/**/*.md'` after another stretch; a one-time byte drop is still not the success criterion, so the thing to watch is whether the ratio holds rather than whether any single session shrank the corpus.
- [ ] The remaining leak is the one this measurement cannot see: sessions that never run `/done` at all, whose additions land with no gate. Stated here as an accepted limit rather than re-engineered — a gate that only fires inside one skill cannot cover work that skips it.
- [ ] `condense-claude-md/references/structural-splits.md` is 6,515 bytes against the new ~6KB prose-reference ceiling — prose, not a catalog (6 table rows across 3 prose sections). First live edge case of that rule. Check it on the next density pass through `condense-claude-md`; do not split a 53-line file, which would make it harder to use.

**Agent templates vs the Bootstrap pattern (deferred from v1.131.0's plan, Phase 4)**
- [ ] `skills/agent-setup/templates/*.template.md` total **77KB — 12.5% of the corpus**, with `browser-verifier.template.md` alone at 15KB, larger than most skills. The Bootstrap pattern's premise is that agents read CLAUDE.md *at runtime* rather than carry injected content, so templates this size suggest it is leaking. Audit for content an agent would read anyway; **preserve** `browser-verifier`'s `USER-TRIGGERED ONLY` gate, which guards real unauthorised spend. Lower priority than the gates above — templates are read once at generation, not per invocation.

---

## Critical Gotchas

Defensive traps organized by mechanism. Full context: open the cited decision file.

| Trap | Tell | Where |
|------|------|-------|
| A size threshold guards one direction and reads as guarding both | A budget is written to stop a number falling short; the same number running away passes every check and reports as achievement. Ask which direction is dangerous, then guard the mechanism rather than the number — for a shrinking doc set, which file GREW to receive what left | D-a-floor-is-not-a-ceiling (verification-rigor.md) |
| A zero-hit grep is a claim about the pattern | A guard reworded `~10%`→"roughly a tenth" reads as deleted to every search keyed on the digits; the conclusion (restore what's present, report a live safeguard missing) is the expensive part. Run the pattern where the fact demonstrably lives before believing an absence | D-a-floor-is-not-a-ceiling (verification-rigor.md) |
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
| Retiring a convention's prescription leaves its instances | Nothing teaches the form anymore, yet the corpus is full of it; a rule against a shape doesn't rewrite what predates it | Last Session 2026-08-18 |
| Marker density predicts GENRE, not health | Same marker runs 56-of-58 load-bearing in a symptom-indexed table and 14-of-17 hollow in prose skill bodies; the table's symptom column earns it, prose rarely does | Last Session 2026-08-18 (measurements in CHANGELOG v1.16x + v1.178.0) |
| Mtime can't discriminate ownership between live sessions | Timestamps order files confidently and correctly while answering "when", never "whose" — concurrent sessions share the window | `_shared/references/diff-ownership.md` |
| Compression keeps the rule, drops the mechanism | A rewrite pass leaves the imperative and cuts the reason under it, or cuts the `📖` route to it; the file reads complete, so reading the result whole cannot find it — only a pre-dispatch snapshot diff can | Next Steps 2026-08-18 |
| An enumerated set can lose items while pointers survive | Condensing an ENUMERATED list drops visibility; verify counts the prose claims | D50 (structural-mechanics.md) |
| Pointer's own line can be the only grep hit | Stale content sits one hop away, invisible because the pointer itself resolves | D62 (structural-mechanics.md) |
| A pointer reads correct at the wrong depth | `../_shared/…` is right in a `SKILL.md`, broken in `references/*.md`; resolve by `ls` from the citing file's own dir, never by eye | D-pointer-depth-reads-as-correct (verification-rigor.md) |
| `references/*.md` is OUT of the B/L gate | That ratio measures hot paths; a reference is a cold-path lookup whose correct shape is a dense table | D54 (structural-mechanics.md) |
| Marker downgrade is presentation, not condensation | `[!WARNING]` → `[!NOTE]` passes rule-count checks but changes what a reader does; diff sorted word SETS | D54 (structural-mechanics.md) |
| Plan docs are NOT `decisions/` candidates | Pre-existing schemas/specs are siblings, not ADRs; a MADR block needs its own condensation rule shipped with it | D27 (structural-mechanics.md) |
| One companion per topic, never a grab-bag | Splitting "Miscellaneous" relocates ten unrelated items, recreating bloat under a new path | D45 (structural-mechanics.md) |
| A rule stated in N files drifts in the ones that paraphrase it | Fixing a cross-file contradiction by grepping its phrase misses every site expressing the same idea in other words; and a site that agrees textually can still sit where the session never reads it | D69 (structural-mechanics.md) |
| Version drift recurs and passes silently | `plugin.json` vs `marketplace.json` diverge; 8th recurrence, and concurrent sessions cause it as readily as forgetful ones (see Next Steps) | D26 |
| ADR ids collide across sibling task docs | One sequence shared across all three `*/decisions/*.md` DOMAINS; test with `uniq -d` AFTER writing | — (agent-architecture) |
| Zero-result grep needs a must-hit control | A false-0 on a true fact is as bad as a false-positive on a false one | — (agent-architecture) |
| Format test per signal type | Prose for "it depends"; table row for exact value; prose+pointer for mixed — applies to Create-mode templates too | D63 (verification-rigor.md) |
| Condensation unit is the doc SET, not the named file | A member holding 2× the index's bytes unexamined; set index = Quick Start + doc-wide tables + routing | `task-summary/references/templates.md` |

---

## Last Session (2026-08-18)

- **The `**Tell:**` convention was dead on paper and alive in the corpus — 17 instances across four files with nothing left prescribing them.** `writing-style.md` has carried the mechanism-not-trip-wire rule since 1.168.x and 1.169.x removed the last instruction telling writers to produce one, so every remaining instance was residue: retiring a rule's *prescription* does not retire what was already written in its shape. Converted all 17 to prose in `update-claude-docs/SKILL.md` (3), `one-turn-chain.md` (4), `explore-delegation.md` (7), `done/SKILL.md` (3) — closing the thread Next Steps opened on 2026-08-14.
- **Three of the 17 were load-bearing and survived as prose clauses rather than markers**: the `rg --replace` corruption showing as "the search term missing from its own output", the moving-target `MM`/size-change pair, and infra-mode's "nothing in the test suite would fail if the file were wrong" (the operative test that whole mode rests on — the same one 2026-08-14 kept for the same reason). 14 of 17 hollow inverts the 2-of-58 ratio from the earlier verification-rules file, and the discriminator is genre, not care: that file was a symptom-indexed gotcha table where a tell fills the lookup slot, these four are prose-shaped skill bodies where the mechanism sentence already did the work. Density predicts subject, not health — in both directions.
- **Two files were self-contradicting, which is what let the residue survive a rule aimed at it.** `update-claude-docs/SKILL.md` carried three while pointing at the file that forbids them; `done/SKILL.md` used the unmarked form ("the tell: a commit you authored…") two paragraphs above a marked one. A file citing a rule reads as compliant with it.
- **Mtime failed as an ownership discriminator against a live peer session** — their writes at 17:48–17:49, this session's at 17:50–17:51. Concurrent sessions work the same window by definition, so the timestamp orders files correctly and confidently while saying nothing about authorship. Routed to `_shared/references/diff-ownership.md`, which already owned the topic and named only the status-plane trap.

## Prior Session (2026-08-17)

- **`unhobble-instructions` and `haiku` unhobbled** — the former by running it on its own `SKILL.md`. 26.7KB→20.2KB and 16.9KB→9KB, with haiku's symptom-indexed verification gotchas extracted to `references/verifying.md`. Both had accumulated the shape they exist to remove: haiku's Verification section had grown one appended paragraph per session, each naming a distinct way a delegated report misleads.
- **A new pointer-defect shape (D-pointer-depth-reads-as-correct)**: the extraction cited `../_shared/…` from inside a `references/` file, where the correct depth is `../../`. Dead pointer, correct-looking wording, every citation-graph check clean. A sweep for the pattern found a second instance predating the session by eight days — the argument for sweeping rather than fixing only the one in the diff. The `CLAUDE.md` rule naming both depths already existed and was walked past twice, so the escalation went to the method (`ls` the target from the citing file's own directory) rather than the rule's wording.
- **Version drift, 9th recurrence** — and this one was a *single* session drifting four versions, which widens the mechanism recorded on 2026-08-14: concurrency is one cause, not the cause. Found by a review agent reading both files for an unrelated reason, now the pattern for four consecutive catches.
- `setup-playwright` gained a mobile-viewport section (Playwright `grep`/`grepInvert` tag partitioning). The product reviewer caught it filed under *Scaffolding a new suite* while its own trigger phrases ("our e2e never tests mobile") describe an existing one; moved under *Hardening*. A section can be correct, well-written and still unreachable from the phrasing that should find it — the same reachability question D-pointer-needs-a-trigger asks of pointers, applied to a heading.

## Prior Session (2026-08-14)

- **The arrival-rate gate has data for the first time: 1.33:1**, down from the 2.6:1 it was built to move. Measured off `git log --numstat` since Gate B landed two days earlier.
- Trimmed the marginal `**Tell:**` marker the prior session flagged in `done/SKILL.md`. The hand-off worked as intended: the observing session declined to edit another session's uncommitted file and left the judgement to its owner, who agreed and cut it.
- The 1.151.0 infra-only change that prompted that flag came from a live case — an infra diff whose files (two ops shell scripts, a PHP guard) the mode's format enumeration did not name. The enumeration was replaced with the mechanism it stood for, and "skip the simplifier" became conditional on the infra being declarative.

## Prior Session (2026-08-12)

- `/done` review of commit dd51665 (routing heuristic ported into `update-claude-docs` §2a/§2b + `unhobble-instructions`): fixed 2 stale line-number cross-references (`unhobble-instructions/SKILL.md` — self-citing "line 28" when the target bullet is at line 30) and one garbled table cell (`update-claude-docs/SKILL.md` mismatched quotes).
- Captured a new CLAUDE.md authoring rule: cite named headings/bullets internally, never raw line numbers (drift-prone).
- Product reviewer flagged the commit as adding a 5th/6th near-duplicate site to the already-flagged "resident vs. lazy-load" extraction candidate (below) — user re-confirmed the hold rather than actioning it this session.
- Closed GitHub #21 (consumer-reported): three skills disagreed on whether a split index's `## Next Steps` could route down to `decisions/`, making the 300-line target unreachable for any doc with a large backlog. Settled as D69 — actionables stay in the index and are excluded from the count. Seven sites across five files; the reporter found two, a phrase grep found two more, and the two reviewers found one and two respectively on different lenses.

**Prior session (2026-08-11)**: Registry/compliance fixes; 5th version-drift recurrence caught; doc set split (`structural-splits.md` → `structural-mechanics.md` + `verification-rigor.md`); `editing-skills-checklist.md` worked example fixed across all four citers.
