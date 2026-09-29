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
  - ../skill-authoring/current.md (sibling feature — creating and scoping skills; a live case of the pointer-defers-a-rule finding)
Last updated: 2026-09-29 — `/done` over the 1.317.0–1.332.0 range, shipped together as 1.333.0; five skills now over the 5,000-token re-attach ceiling (blocker 5), eight review findings left open for a decision (Last Session).
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation

## Quick Start (read this first in next session)

**Where we are**: The plugin's "one fact, one home" doctrine implemented across task docs, CLAUDE.md, and skills. Two levers: **density** (byte-count bloat, `condense-claude-md`/`condense-task-doc`) and **overconstraint** (rigid rules, `unhobble-instructions`). Both shipped; each real run found verifier defects.

**Blockers (open)**:
1. ~~Automated version-file drift gate~~ — **closed 2026-09-12** by `.githooks/pre-commit`, after 10 recurrences none of which a gate ever caught. Opt-in per checkout (`git config core.hooksPath .githooks`) is the residual gap
2. Automated ADR-id uniqueness gate — 1 real collision caught 2026-08-02. Swept clean 2026-09-12; now a candidate for the same pre-commit hook
3. Watch arrival-rate gate impact — first measurement 1.33:1, down from the 2.6:1 it was built to move
4. **Closed, and it was a measurement error** — `unhobble-instructions/SKILL.md` was reported over the re-attach ceiling at ~6,000 tokens. Real count was 5,119 at its peak and is 4,566 now. The figure came from `bytes/4`, which over-reports this corpus by ~12% and 17% on a file this dense; all 38 skills are under 5,000 real tokens
5. **Open** — five skills are over the 5,000-token re-attach ceiling (`cl100k_base`, measured 2026-09-29 on the staged 1.332.0 tree): `haiku/SKILL.md` 5,952 (was 5,489 on 2026-09-21), `done/SKILL.md` 5,486 (5,148 at 1.316.0, so already over then and unlisted), `refresh-instructions/SKILL.md` 5,286 (4,428 at 1.316.0; this range pushed it over), `condense-task-doc/SKILL.md` 5,196, `uiux/SKILL.md` 5,122 (crossed with 1.327.0). Nothing was cut to offset the growth. Each needs a dedicated condense pass, `haiku` first: about 800 bytes of its latest additions are avoidable (the tier-per-pass warning overlaps its one-tier-up allowance; the relocation self-check could move to `_shared/references/verifying-a-relocation.md`). Blocker 4's "all skills under 5,000" was true on 2026-09-12 and no longer holds; `harness-constraints.md` still cites `haiku` at 4,837 and needs the same correction.

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
| 17 | Two review agents reasoning over the same evidence reached opposite verdicts on a duplication (convention violation vs. deliberate early-host copy) — neither executed anything, so the execution-outranks-reasoning tie-breaker didn't apply. Resolved by naming which criterion governs (the repo's own 3+-skill DRY threshold) and fixing with a canonical copy + local pointer, satisfying both readings (`done/references/agent-blind-spots.md` new row) | ✅ |

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
- [x] ~~`unhobble-instructions/SKILL.md` is back over the re-attach ceiling~~ — **the overage was a measurement error, corrected 2026-09-12.** The file was 5,119 real tokens at its peak (24,011 bytes), i.e. 119 over rather than the ~1,000 first reported; it now sits at 4,566 tokens after the reorder pass, with 434 tokens of headroom. The "~6,000 tokens" figure came from dividing bytes by four, which over-reports this corpus by roughly 12%, and 17% on this particular file — see the `bytes/4` trap row in Critical Gotchas below for the full-corpus measurement.

---

## Critical Gotchas

Defensive traps organized by mechanism. Full context: open the cited decision file.

| Trap | Tell | Where |
|------|------|-------|
| A deferred backlog row is an unverified claim wearing a decision's clothes | Rows carry counts, byte figures and line-number citations that nothing re-checks; each deferral reads as postponing work rather than as resting on a stale number, so no one re-measures. Measured 2026-09-12: 5 of 12 rows had moved, 4 were closable. Re-measure before planning against a row, and date the measurement | Last Session 2026-09-12 |
| Correcting the figures leaves the generator running | 1.261.0 disproved `bytes/4`, quantified it at 15–20% and patched the affected numbers — while `harness-constraints.md` went on prescribing it for ten more versions. A corrected value reads as a closed case, so nothing asks what computed it. The inverse of "correcting a premise doesn't correct its dependents": here the dependents were fixed and the premise survived. Tell: your entry lists corrected values and names no method | Last Session 2026-09-12 |
| A byte count is not a token count, and `bytes/4` invents ceiling breaches | Measured across all 38 skills: zero over 5,000 real `cl100k_base` tokens, while `bytes/4` flags three. The corpus averages 4.46 bytes/token so the divisor over-reports ~12%, but a dense file runs higher and generalising one file's ratio is its own trap (`unhobble-instructions` is 4.70 B/tok: 21,453 B → 5,363 est vs 4,566 real). The error is one-directional, so it always reads as a breach to fix rather than as a bad ruler. Count with a tokenizer before asserting an overage | Last Session 2026-09-12 |
| A one-time size fix does not hold, and nothing notices it unwind | `unhobble-instructions/SKILL.md` was cut to 19,319 B in v1.205.0 to clear the re-attach ceiling and grew back to 24,011 B (5,119 real tokens, 119 over). The growth is real even where the reported overage was inflated; nothing measures a skill between passes | Last Session 2026-09-12 |
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

## Last Session (2026-09-25, 2026-09-29)

- **`/done` over the 1.317.0–1.332.0 range, shipped together as 1.333.0 in one commit (31 files, docs-only; 2 simplifiers, 2 reviewers, 1 product reviewer).** Reviewers found and this pass fixed: `validation-checklist.md` citing a `task-summary` "§6" that the 1.318.0 rewrite retired (the retired-label-still-cited case); `output-style-hook/current.md` carrying five `## Last Session` blocks, a withdrawn "build the `UserPromptSubmit` hook" instruction, and a decision that called the sixth pass future work; a staged `skills/.DS_Store` (unstaged, `.DS_Store` now in `.gitignore`); `CLAUDE.md`'s "all 38 skills under the ceiling" (now dated). The `refresh-instructions` "step 61" line-number cite was already fixed by the simplifier.
- **Still open from the same review, not applied (each changes skill behaviour, so the call is Syafiq's):** (1) `task-summary` says the MADR split is `condense-task-doc`'s job, but a single oversized `decisions/<theme>.md` needs `decision-splits.md`'s sub-split, which `condense-task-doc` would damage; (2) `continue-session` no longer records decisions that exist only in the conversation, and the doc template has no "awaiting a decision" home for the next session to find; (3) `update-plugin`'s new inventory and four-role table have no slot in its `## Output`, and Step 1 says "in the output" while Step 2 says "scratch"; (4) `casual-message`'s timeline scope contradicts its own "no bullet structure" line and the refer-back test that sends a card reply to `gchat-format`; (5) `task-summary` dropped the two-sentence row limit and "hashes live only in Last Session"; (6) six changed files (`quick-done`, `done`, `read-summary`, `explore-delegation`, `condense-claude-md`, `other-modes`) have no CHANGELOG entry; (7) `CHANGELOG` 1.328.0 names no command for regenerating an old code-simplifier agent, and 1.320.0/1.323.0/1.330.0 name private projects in a file shipped to colleagues; (8) `.githooks/pre-commit` could also reject staged `.DS_Store` and warn on a staged SKILL.md with no new CHANGELOG heading.
- **Simplifier edits landed unstaged on top of five already-staged files** (`casual-message`, `done`, `quick-done`, `read-summary`, `refresh-instructions`), so `git diff --cached` alone under-described the tree; `git add -u` before the commit folded them in.

- **Haiku's failure profile on a full three-pass refresh of a 14-file instruction set** (global `CLAUDE.md` + 10 companions + 3 references), every pass verified against snapshots:
  - Restructure: 4 of 13 runs on small companions added group headings over 3–6 entries and were reverted.
  - Condense: nearly every run needed patches. Three runs were reverted outright: two claimed moves they never made, and one cut the measured figures a hot file cites by name.
  - Unhobble: four runs failed outright. One invented a false unifying cause, one claimed a table moved when nothing was written, one deleted protected config keys, and one dropped facts restored an hour earlier.
  - Sonnet: the three re-runs needed no correction.

  The user's standing preference is haiku by default, with one tier up only for a pass that fails (memory, and `haiku` 1.321.0). This record is the evidence for that trade-off, not a reversal of it.
- **The same session first refreshed the wrong set.** It was invoked from a project's `.claude/` directory with no path, ran all passes on the parent project's CLAUDE.md files, and reverted them. Fixed in `refresh-instructions` 1.323.0 step 0.
- **Four agents stalled at the 600 s stream watchdog mid-pass.** Two of them had already written partial edits. `SendMessage` with the file's current byte count resumed all four to completion, so a stalled agent can be resumed rather than re-dispatched.

## Prior Session (2026-09-21)

- **Two review agents reasoning over identical evidence reached opposite verdicts, and neither the execution-outranks-reasoning tie-breaker nor a baseline mismatch applied — both had only read.** A `/done` docs-only pass dispatched simplifier/reviewer/product-reviewer over a 28-file skills diff. The reviewer flagged a paragraph duplicated verbatim across `read-summary/SKILL.md` and `_shared/references/explore-delegation.md` as a convention violation; the product-reviewer read the same duplication as deliberate, citing the "a standing rule needs an early-loading host" principle. Resolved by naming which criterion actually governs when both apply — the repo's own 3+-skill DRY threshold — and fixing with a canonical copy (`explore-delegation.md`) plus a local Tell-only pointer in `read-summary`, which satisfies both readings rather than picking one. Added as a new row to `done/references/agent-blind-spots.md`'s blindness-pattern table (distinct from the existing "contradictory reports" row, which is about baseline mismatch, not pure reasoning divergence).
- **The simplifier separately caught a genuine 4-file DRY violation the other two agents didn't check for**: a "fewest tokens for the same or better meaning" paragraph, near-identical, freshly added to `condense-claude-md`, `condense-task-doc`, `unhobble-instructions` and `update-claude-docs` in the same session. Extracted to `_shared/references/writing-style.md` (an existing shared-density-rules file, not a new one) as a new table row; each SKILL.md kept only its one-line pointer plus its artifact-specific specialization sentence.
- **Design-handoff's new "verify the destination's own facts" callout named the trap but no mechanism** — product-reviewer caught it citing a URL-verification step that should exist but didn't. Added the `curl -sL -o /dev/null -w '%{http_code}'` check with a pointer to `haiku/references/verifying-research.md`, which already carries the mechanism and the "success is never evidence of a real address" principle.
- **`haiku/SKILL.md` is over its own re-attach ceiling again and growing, not shrinking** — 1.304.0 (this doc's 2026-09-12 entry above) recorded it at 5,196 tokens after a trim, already over 5,000, with "the remainder needs its own dedicated pass." This session's diff (1.305.0–1.308.0) added several more paragraphs with no offsetting cut; independently re-measured at 5,489 tokens (`cl100k_base`). Flagged as a Step 5 signal rather than trimmed mid-review — a squeezed-in cut during a reconciliation pass is exactly the "blind further cut" 1.304.0 said not to do. Needs its own dedicated pass.

## Prior Session (2026-09-12)

- **A backlog row decays like any other static fact, and its deferral hides it.** Five of twelve open rows asserted a figure or path that had moved; four were closable or already fixed by other work. Rows now carry the date they were measured.
- **Version-drift gate shipped** — `.githooks/pre-commit`, verified in four directions including a real blocked commit. Closes a row that recurred 10 times and was caught by a reader every time.
- **The bytes/4 error was a RECURRENCE, and the first fix is why it survived.** 1.261.0 diagnosed this exact bug, quantified it, and named four of six files as never over the ceiling — then patched only those figures. `harness-constraints.md` kept prescribing `bytes ÷ 4` for ten more versions. **Correcting a number does not correct the rule that produced it.**
- **A ratio measured on one file generalises badly.** The corpus averages 4.46 bytes/token (~12% over-report); 17% was `unhobble-instructions` alone, the densest file in the sample, and it got written into five places as the corpus figure. Corrected everywhere; swept all 38 skills — none exceed 5,000 real tokens under the correct measure.
- **Three sessions shared the checkout**; splitting a disputed count by checkbox state settled a peer's correction (12 open in both versions, the delta was ten completed rows retiring).

**Prior sessions (2026-08-11 → 2026-09-03)** — facts with no other home; the rest is in the ADRs and the CHANGELOG. Retiring a rule's *prescription* does not retire what it already produced: the `**Tell:**` convention left 17 residual instances across four files after the last instruction producing them was removed. Version drift reached its 10th recurrence, both from concurrency and from a single session drifting four versions at once. `ship` Step 4's extraction once violated D-deferral-is-not-delivery (moved triggers with their procedure); restored inline. Doc set peaked at 1,207 lines / 163KB (3.5× budget) before splitting.
