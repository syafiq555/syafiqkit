<!--LLM-CONTEXT
Status: Reference (ongoing) — 49 committed decisions across 4 themed decision files
Domain: plugin-maintenance/doc-condensation
Gotchas (critical — full list in ## Critical Gotchas below):
  - Confirming a passage is gone ≠ it should be gone; apply target skill's fact-vs-constraint bar
  - A file mid-write is unstable to verify; wait for completion notification before judging edits
  - A pointer can read correct and be dead: `../_shared/…` is right in a SKILL.md, broken in references/*.md — resolve by ls, not by eye
  - A pointer defers a rule rather than delivering it; nothing forces a reference to load, so the fact that a problem EXISTS stays inline and only the fix procedure goes behind the `📖`
  - Retracting a rule reaches every file that prescribed it — grep the corpus for the practice's own vocabulary, never for the file list the changelog entry names
Related:
  - ../agent-architecture/current.md (generated agents inherit conventions + sibling skill invocation)
  - ../madr-structure/current.md (the MADR format itself)
  - ../external-guidance/current.md (grading outside guidance against plugin measurements)
Last updated: 2026-09-12 — backlog pass. Version-drift gate CLOSED after 10 recurrences (`.githooks/pre-commit`, opt-in per checkout). Four more rows closed: the resident-vs-lazy-load extraction declined on measurement (D-a-shared-vocabulary-is-not-a-shared-rule — four files shared a vocabulary, not a rule), size-measurement drift already fixed (all three gates measure lines against 300), D65's reciprocal note added to `unhobble-instructions`, and `structural-splits.md` given a declared ~10KB budget. Found while working: `unhobble-instructions/SKILL.md` is back over the 5,000-token re-attach ceiling at 24,011 bytes, undoing v1.205.0 — its `## Verifying` section drops after a compaction. Earlier same day — condensed Next Steps (55→12 lines), Prior Sessions (31→5 lines). Doc set was 1,207 lines / 163 KB (3.5× budget); split is correct structure, decision files are dense-but-live MADR blocks. Arrival-rate gate watching 1.33:1 ratio.
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation

## Quick Start (read this first in next session)

**Where we are**: The plugin's "one fact, one home" doctrine implemented across task docs, CLAUDE.md, and skills. Two levers: **density** (byte-count bloat, `condense-claude-md`/`condense-task-doc`) and **overconstraint** (rigid rules, `unhobble-instructions`). Both shipped; each real run found verifier defects.

**Blockers (open)**:
1. ~~Automated version-file drift gate~~ — **closed 2026-09-12** by `.githooks/pre-commit`, after 10 recurrences none of which a gate ever caught. Opt-in per checkout (`git config core.hooksPath .githooks`) is the residual gap
2. Automated ADR-id uniqueness gate — 1 real collision caught 2026-08-02. Swept clean 2026-09-12; now a candidate for the same pre-commit hook
3. Watch arrival-rate gate impact — first measurement 1.33:1, down from the 2.6:1 it was built to move
4. 🔴 **New** — `unhobble-instructions/SKILL.md` is back over the re-attach ceiling at ~6,000 tokens, so its own `## Verifying` section drops after a compaction. v1.205.0 fixed this once; ordinary growth undid it

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
| 4 | Version-drift automated gate (plugin.json/marketplace.json) | ✅ Closed 2026-09-12 — `.githooks/pre-commit` compares both manifests and blocks the commit on a mismatch, which is the "without anyone choosing to look" property this row held open for. Enable per checkout with `git config core.hooksPath .githooks`; that opt-in is the residual gap. `ship`'s 1.227.0 print-every-version step remains as the second layer |
| 5 | Companion file scope gap — `condense-claude-md`/`update-claude-docs` never treated a pre-existing companion as a condense target itself (D65) | ✅ |
| 6 | Sentence-length blind spot — `condense-task-doc`'s aggregate line/byte target passed with individual sentences still 500+ chars (D67) | ✅ |
| 7 | The condense rule had no enforcer — `/done` Step 4 now measures the doc set it just wrote (issue #19, D-done-owes-the-condense); `condense-task-doc`'s ownership guard scoped to uncommitted state (D-guard-scoped-to-what-it-can-see); the doc-set measurement fixed to survive an unsplit doc (D-unmatched-glob-measures-zero) | ✅ |
| 8 | Verification against a moving target + a revert argued from grep/byte-delta alone — 4th consecutive real run to find a defect in the verification tooling itself (D-dropped-is-not-the-same-as-correctly-dropped extended, D-torn-page-verification) | ✅ |
| 9 | Routing/seam-test asking WHERE a fact was found instead of WHAT it's about — buried two Playwright API facts in one repo's CLAUDE.md (D-route-by-subject-not-discovery); paired with a new `Invalidated` classification for a rule a session's own work disproved | ✅ |
| 10 | A skill's argument rewrites bare dollar-zero inside its own shell snippets, so `condense-task-doc`'s size verdict came from a command it never contained (consumer issue #22, D-skill-args-eat-dollar-zero) | ✅ |
| 11 | Inlining a reference severs the citation graph at both ends — an orphaned file and a dropped pointer to shared machinery, neither visible to a resolve-check, a diff, or a self-report (D-inlining-breaks-the-citation-graph) | ✅ |
| 13 | Every size threshold in the condense skills was a floor to reach with no ceiling — `condense-task-doc` deleted 64% of a doc set (~40 gotcha rows, one written minutes earlier) and reported the figure as success. The guard that existed sat in `task-summary`, which every dispatch path routes AWAY from (consumer issue #26, D-a-floor-is-not-a-ceiling) | ✅ |
| 12 | A pointer's relative DEPTH is wrong while its wording is right — `../_shared/…` is correct in a `SKILL.md` and broken one directory down in `references/*.md`. Distinct from row 11: nothing is severed and no file is orphaned, so every citation-graph check passes (D-pointer-depth-reads-as-correct) | ✅ |
| 14 | The two-direction control passes while a hand-rolled sweep is still wrong, because both cases route through the same extractor — two false findings in one run (9 "broken" pointers, 40 "split" tables, all sound). Paired with the inverse: `[ -e ]` confirming a pointer target that sits untracked and would be dropped by `git commit -am` (D-controls-validate-the-predicate-not-the-extractor) | ✅ |
| 15 | Retracting a rule reaches every file that prescribed it, not the files the changelog entry names — 1.225.0 removed the token-diff verification step and patched its four named files while two more still prescribed it, both on the delegated-rewrite path the removal was written about (D-retraction-is-wider-than-its-entry) | ✅ |
| 16 | Extracting to a reference took the trigger sentences with the procedure — `ship` Step 4a kept only "queue it in the background" inline and deferred the irreversible-ordering and standing-manual-step triggers behind a topic-index pointer, the exact shape D-deferral-is-not-delivery forbids, in the step whose 1.220.0 entry exists because a breached go-live obligation shipped unnoticed | ✅ |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/bloat-generator-fixes.md](decisions/bloat-generator-fixes.md) | *Where does the plugin fix doc bloat — at the generator (task-summary rules) or by hand-trimming? What structural levers exist for over-budget CLAUDE.md? What if the file declares its own budget, or is far UNDER it? How does the `/commit` staleness gate avoid lexical false positives? Can an aggregate line/byte target pass while individual sentences stay bloated? Who enforces the condense once a doc is over budget, when does an ownership guard block work it was never meant to, why does a doc-set measurement read 0, why can a shell snippet in a skill body not be trusted to run as written, and why do docs keep going stale when the skill that writes them validates every time?* (D3, D6, D17, D18, D19, D20, D44, D51, D57, D67, D-done-owes-the-condense, D-guard-scoped-to-what-it-can-see, D-unmatched-glob-measures-zero, D-skill-args-eat-dollar-zero, D-validation-scoped-to-the-diff) |
| [decisions/structural-mechanics.md](decisions/structural-mechanics.md) | *When does a doc/CLAUDE.md/skill need a structural split (byte thresholds, companion files, plan-doc typing) instead of denser prose? Why does re-condensing the same skill keep failing? What checkpoint catches a rule that arrives with no defect, what size policy applies to `references/*.md`, and why does a stale pointer pass the same grep a missing rule fails? What stays in a split index versus routing down to `decisions/`?* (D22, D23, D26, D27, D33, D45, D46, D50, D54, D62, D69) |
| [decisions/verification-rigor.md](decisions/verification-rigor.md) | *When should a CLAUDE.md entry be prose vs. a table row, once a companion file exists is it ever a condense target itself, may condensation drafting be delegated to an agent, which kind of fact does an unhobbling pass mistake for hedging, how does a verifier decide whether a confirmed drop was correct, what happens when two skills mandate opposite shapes for the same doc, when is a file too unstable to verify, does a fact route by where it was found or what it's about, what breaks when a pass inlines a reference into its citing file, how does a pointer stay dead while reading as correct, why does a size threshold catch a doc that shrank too little but not one that shrank too much, and why can a sweep that passed a known-good AND a known-bad control still be reporting nothing?* (D63, D64, D65, D66, D68, D-haiku-condense-delegation, D-mandate-vs-judgement, D-limitation-reads-as-hedging, D-dropped-is-not-the-same-as-correctly-dropped, D-torn-page-verification, D-route-by-subject-not-discovery, D-inlining-breaks-the-citation-graph, D-pointer-depth-reads-as-correct, D-a-floor-is-not-a-ceiling, D-prescribed-commands-are-environment-assumptions, D-deferral-is-not-delivery, D-controls-validate-the-predicate-not-the-extractor) |
| [decisions/duplication-and-integrity.md](decisions/duplication-and-integrity.md) | *How does the plugin catch duplicated facts (within/across docs) and verify a fix actually landed everywhere?* (D37, D40, D12, demoted D2/D5/D7/D11) |

---

## Next Steps

⚠️ **Every row here states a number or a path that nothing re-checks.** Measured 2026-09-12 against the live tree: of twelve open rows, five asserted a figure or a file location that had since moved, and each still read as current. Four of those five were closable or already fixed. A backlog row decays exactly like the static facts this doc warns about elsewhere, with one difference that makes it worse — a deferral reads as a decision to postpone real work, never as a decision resting on a stale number. **Re-measure a row before planning against it, and put the date of the measurement in the row.**

**Automated gates**
- [x] `plugin.json`/`marketplace.json` version drift — closed 2026-09-12. `.githooks/pre-commit` compares the two manifests and blocks the commit on a mismatch; enable per checkout with `git config core.hooksPath .githooks`. Verified in four directions (equal passes, drifted blocks, missing key blocks, real `git commit` blocked end-to-end). `ship`'s print-all-versions step stays as the second layer. There was no live drift at the time of the fix — both read 1.268.0 — so this closes the class rather than an instance. The hook is opt-in per clone, which is the residual gap.
- [ ] ADR-id uniqueness — still no post-write gate. Collided 2026-08-02 (D66); mechanism owned by [../agent-architecture/current.md](../agent-architecture/current.md). Swept 2026-09-12 with `grep -rho '^### D[^ ]*' tasks/*/*/decisions/*.md | sort | uniq -d`: zero duplicates across all domains. That sweep is a candidate for the same pre-commit hook now that one exists.

**Extraction candidate — closed, not warranted**
- [x] "Resident vs. lazy-load" routing principle — measured 2026-09-12 and **declined** (D-a-shared-vocabulary-is-not-a-shared-rule). The four cited files share a vocabulary, not a rule: don't-merge-pointers, shape-the-symptom-index, run-the-routing-test, order-the-three-gates. Only two express the same test, which is below the 3+ threshold the row invoked. Don't re-open on a grep count alone.

**Pointer reachability (deferred)**
- [ ] Audit whether facts in `_shared/references/` reach the **moment** each skill acts on them. Inlined leak-tag check reached only 1 of 5 files initially — same defect as a pointer nobody opens. Unmeasured since it was written; 18 reference files as of 2026-09-12.

**Size-measurement drift — closed**
- [x] Closed 2026-09-12: all three gates now measure **lines against 300**, not three units. `task-summary/SKILL.md` uses `wc -l`; `condense-task-doc` targets ≤300 lines; `done/references/task-doc-measurement.md` deliberately refuses to restate the number ("the threshold and the cut/keep rules live in `condense-task-doc`") so it cannot drift. The row's premise had been fixed by other work.

**Reciprocal note (D65) — closed**
- [x] Closed 2026-09-12. The row cited `unhobble-instructions/SKILL.md` line 53, which had become blank — the boundary had moved to the `## What This Is Not` list. Widened there: finishing an unhobble pass leaves every file it touched still an untouched condense target, and on a target with companions the condense must be scoped by the set rather than by the file someone named. Cited by clause text, not line number, since the line number is what broke.

**Verification tooling as tested snippet**
- [ ] Consider moving pointer/anchor sweep checks to `_shared/references/` with a live test, rather than rewriting per session. Partially addressed already — `editing-skills-checklist.md` holds the method and the three ways the sweep lies, but as prose, not as a runnable snippet with its own controls. The `.githooks/` directory added 2026-09-12 is now a plausible home for the executable half.

**Agent templates vs the Bootstrap pattern (lower priority)**
- [ ] `skills/agent-setup/templates/*.template.md` total **81,477 bytes — 8.9% of the ~920KB skills corpus** (re-measured 2026-09-12; the previous row said 77KB/12.5%, overstating both the size and the share). Audit for content agents would read anyway; preserve `browser-verifier`'s `USER-TRIGGERED ONLY` gate, confirmed present.
- [x] `quick-done/SKILL.md` Step 3 — closed 2026-09-12. Step 3 now carries the diff check and cites `_shared/references/diff-ownership.md`. Mtime survives as a first-pass filter ahead of it, which is the correct shape: it orders files cheaply, and the diff read is named as the only durable check.
- [x] `condense-claude-md/references/structural-splits.md` — closed 2026-09-12 by declaring a budget on the file rather than splitting it. It had grown to 10,248 bytes, 71% over the ~6KB prose-reference ceiling, not the 8% the old row recorded. It now declares ~10KB with a don't-re-open note, in the signal shapes `_shared/references/declared-budget.md` detects.
- [ ] Restored passages pasted from a snapshot can carry back the shape the pass removed (`haiku/references/verifying.md`). Re-read restorations against each file's rewritten voice.
- [ ] Accepted limit, not a gap to engineer: sessions that never run `/done` add content with no gate at all, and no measurement inside `/done` can see them.

**Found while working, not from this list**
- [ ] 🔴 `unhobble-instructions/SKILL.md` is back over the 5,000-token re-attach ceiling — **24,011 bytes (~6,000 tokens)**, against the 19,319 bytes v1.205.0 cut it to precisely so it would fully re-attach. The cut now lands inside `## Rewriting`, so `## Verifying`, `## Authoring Under This Lens` and `## Syafiqkit Conventions` silently stop existing after a compaction while the skill still reports as invoked — the exact regression v1.205.0 fixed, returned by ordinary growth. This is the skill losing its own verify step in the long sessions that compact. Needs a real extraction to `references/`, not trimming.

---

## Critical Gotchas

Defensive traps organized by mechanism. Full context: open the cited decision file.

| Trap | Tell | Where |
|------|------|-------|
| A deferred backlog row is an unverified claim wearing a decision's clothes | Rows carry counts, byte figures and line-number citations that nothing re-checks; each deferral reads as postponing work rather than as resting on a stale number, so no one re-measures. Measured 2026-09-12: 5 of 12 rows had moved, 4 were closable. Re-measure before planning against a row, and date the measurement | Last Session 2026-09-12 |
| A one-time size fix does not hold, and nothing notices it unwind | `unhobble-instructions/SKILL.md` was cut to 19,319 B in v1.205.0 specifically to clear the 5,000-token re-attach ceiling; ordinary growth returned it to 24,011 B, re-dropping its own `## Verifying` tail after compaction. The skill still reports as invoked either way | Last Session 2026-09-12 |
| A shared vocabulary reads as a shared rule, and grep cannot tell them apart | Four files matching "resident"/"lazy-load"/`📖` stated four different rules (don't-merge-pointers, shape-the-index, run-the-test, order-the-gates). Read the passages side by side and ask what each tells a reader to DO before trusting an extraction count | D-a-shared-vocabulary-is-not-a-shared-rule (verification-rigor.md) |
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
| Version drift recurs and passes silently | `plugin.json` vs `marketplace.json` diverge; 10th recurrence, and concurrent sessions cause it as readily as forgetful ones (see Next Steps) | D26 |
| ADR ids collide across sibling task docs | One sequence shared across all three `*/decisions/*.md` DOMAINS; test with `uniq -d` AFTER writing | — (agent-architecture) |
| Zero-result grep needs a must-hit control | A false-0 on a true fact is as bad as a false-positive on a false one | — (agent-architecture) |
| Format test per signal type | Prose for "it depends"; table row for exact value; prose+pointer for mixed — applies to Create-mode templates too | D63 (verification-rigor.md) |
| Condensation unit is the doc SET, not the named file | A member holding 2× the index's bytes unexamined; set index = Quick Start + doc-wide tables + routing | `task-summary/references/templates.md` |

---

## Last Session (2026-09-12)

- **A backlog row decays like any other static fact, and its deferral hides it.** Five of twelve open rows asserted a figure or path that had moved; four were closable or already fixed by other work. A row saying "deferred" reads as postponed work, never as a claim resting on an unverified number, so nothing prompts a re-measure. Rows now carry the date they were measured.
- **Version-drift gate shipped** — `.githooks/pre-commit`, verified in four directions including a real blocked commit. Closes a row that recurred 10 times and was caught by a reader every time.
- **The extraction the backlog pushed for three times was declined on measurement** (D-a-shared-vocabulary-is-not-a-shared-rule). Four files shared "resident", "lazy-load" and `📖` while stating four different rules. A survey agent independently recommended extracting, quoting the passages that refute it — accurate quotes, wrong synthesis.
- **`unhobble-instructions/SKILL.md` is back over the re-attach ceiling** (24,011 B, ~6,000 tok vs the 19,319 B v1.205.0 cut it to). Its `## Verifying` tail drops after compaction. A one-time size fix does not hold; nothing measures the file between passes.
- **Three sessions shared the checkout.** Two peers sent corrections; one was right about a mid-write file and a miscounted staging area, and wrong that the condensation had dropped ten open items. Splitting the count by checkbox state settled it — 12 open in both versions, the delta was ten completed rows retiring.

## Prior Session (2026-09-03)

- **Retraction reaches every prescriber, not the changelog's file list (D-retraction-is-wider-than-its-entry).** 1.225.0 named four files; `target-types.md` + `editing-skills-checklist.md` still prescribed it. Grep the practice's vocabulary, not the entry.
- **`ship` Step 4 extraction violated D-deferral-is-not-delivery.** Moved triggers with procedure; restored them inline (reference stays separate).
- **Version-file drift, 10th occurrence** — `plugin.json` 1.226.0 vs `marketplace.json` 1.224.0. Found by reader, not gate.
- **Reviewing agents cleared findings that disk contradicted.** Reconcile agent verdicts against disk post-run, not partition-by-partition.
- **Doc set 1,207 lines / 163 KB (3.5× budget).** Recorded for deliberate sizing next pass.

**Prior sessions (2026-08-11 → 2026-08-25)** — facts with no other home; the rest is in the ADRs and the CHANGELOG. Retiring a rule's *prescription* does not retire what it already produced: the `**Tell:**` convention left 17 residual instances across four files after the last instruction producing them was removed, 3 load-bearing enough to survive as prose and 14 cut. A file citing a rule reads as compliant with it, which is how two of those files carried residue while pointing at the file forbidding it. Version drift reached its 9th recurrence as a *single* session drifting four versions, widening the mechanism from concurrency alone to forgetfulness too.
