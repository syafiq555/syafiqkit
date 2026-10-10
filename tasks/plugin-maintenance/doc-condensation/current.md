<!--LLM-CONTEXT
Status: Reference (ongoing) — 49 committed decisions across 5 themed decision files
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
Last updated: 2026-10-10 — section order conformed to the index template (Next Steps moved last, closed items moved to Last Session); `uiux` cleared from the over-ceiling list on 2026-10-07 but has grown since (blocker 5 needs re-measuring); eight 2026-09-29 review findings still open for a decision (Last Session).
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation

## Quick Start (read this first in next session)

**Where we are**: The plugin's "one fact, one home" doctrine implemented across task docs, CLAUDE.md, and skills. Two levers: **density** (byte-count bloat, `condense-claude-md`/`condense-task-doc`) and **overconstraint** (rigid rules, `unhobble-instructions`). Both shipped; each real run found verifier defects.

**Blockers (open)**:
1. ~~Automated version-file drift gate~~ — **closed 2026-09-12** by `.githooks/pre-commit`; opt-in per checkout is the residual gap (Task Status row 4)
2. Automated ADR-id uniqueness gate — 1 real collision caught 2026-08-02. Swept clean 2026-09-12; now a candidate for the same pre-commit hook
3. Watch arrival-rate gate impact — first measurement 1.33:1, down from the 2.6:1 it was built to move
4. ~~`unhobble-instructions` over the re-attach ceiling~~ — **closed 2026-09-12, a `bytes/4` measurement error** (4,566 real tokens; see the byte-count gotcha row)
5. **Open, figures unmeasured since their dates** — four skills were over the 5,000-token re-attach ceiling on the `cl100k_base` count of 2026-09-29 (staged 1.332.0 tree): `haiku/SKILL.md` 5,952 (was 5,489 on 2026-09-21), `done/SKILL.md` 5,486 (5,148 at 1.316.0, so already over then and unlisted), `refresh-instructions/SKILL.md` 5,286 (4,428 at 1.316.0), `condense-task-doc/SKILL.md` 5,196. Re-measure with a tokenizer before planning against them. Two are already suspect: `refresh-instructions/SKILL.md` is now 7,677 bytes, which cannot hold 5,286 tokens at the corpus's 4.5–4.8 bytes per token, so one of the two figures is wrong. `uiux` was cleared 2026-10-07 at 3,817 tokens for 17,982 B; it is now 22,181 B and unmeasured since, so it may be over again. For scale only, `haiku` is now 28,780 B, `done` 26,333 B, `condense-task-doc` 24,579 B. Nothing was cut to offset the growth. Each over-ceiling skill needs a dedicated condense pass, `haiku` first: about 800 bytes of `haiku`'s latest additions are avoidable (the tier-per-pass warning overlaps its one-tier-up allowance; the relocation self-check could move to `_shared/references/verifying-a-relocation.md`, which exists). Blocker 4's "all skills under 5,000" was true on 2026-09-12 and no longer holds. `harness-constraints.md` already carries a 2026-09-29 caveat, but its `haiku` figure (4,837) is the 2026-09-12 measurement, and it says five skills are over where this line says four.

**Next actions**: See Next Steps. Every Task Status row is closed.

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
| 12 | A pointer's relative DEPTH is wrong while its wording is right — `../_shared/…` is correct in a `SKILL.md` and broken one directory down in `references/*.md`. Distinct from row 11: nothing is severed and no file is orphaned, so every citation-graph check passes (D-pointer-depth-reads-as-correct) | ✅ |
| 13 | Every size threshold in the condense skills was a floor to reach with no ceiling — `condense-task-doc` deleted 64% of a doc set (~40 gotcha rows, one written minutes earlier) and reported the figure as success. The guard that existed sat in `task-summary`, which every dispatch path routes AWAY from (consumer issue #26, D-a-floor-is-not-a-ceiling) | ✅ |
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
| [decisions/structural-mechanics.md](decisions/structural-mechanics.md) | *When does a doc/CLAUDE.md/skill need a structural split (byte thresholds, companion files, plan-doc typing) instead of denser prose? Why does re-condensing the same skill keep failing? What checkpoint catches a rule that arrives with no defect, what size policy applies to `references/*.md`, and why does a stale pointer pass the same grep a missing rule fails? What stays in a split index versus routing down to `decisions/`? Why does a `📖` pointer need a trigger to fire, and why does a rule a session needs stay inline instead of behind a pointer?* (D22, D23, D26, D27, D33, D45, D46, D50, D54, D62, D69, D-pointer-needs-a-trigger, D-selection-stays-inline) |
| [decisions/unhobble-rule-writing.md](decisions/unhobble-rule-writing.md) | *When should a CLAUDE.md entry be prose vs. a table row, once a companion file exists is it ever a condense target itself, may condensation drafting be delegated to an agent, which kind of fact does an unhobbling pass mistake for hedging, what happens when two skills mandate opposite shapes for the same doc, may an unhobbling pass soften an absolutist rule, should authoring follow unhobble by default, and should a rewrite read the file as a document before any rule?* (D63, D64, D65, D66, D68, D-haiku-condense-delegation, D-mandate-vs-judgement, D-limitation-reads-as-hedging) |
| [decisions/verification-rigor.md](decisions/verification-rigor.md) | *How does a verifier decide whether a confirmed drop was correct, when is a file too unstable to verify, does a fact route by where it was found or what it's about, what breaks when a pass inlines a reference into its citing file, how does a pointer stay dead while reading as correct, does a pointer deliver the rule it cites, should an instruction file name the command or the property it checks, why does a size threshold catch a doc that shrank too little but not one that shrank too much, why can a sweep that passed a known-good AND a known-bad control still be reporting nothing, and does a shared vocabulary justify extracting a rule?* (D-dropped-is-not-the-same-as-correctly-dropped, D-torn-page-verification, D-route-by-subject-not-discovery, D-inlining-breaks-the-citation-graph, D-pointer-depth-reads-as-correct, D-deferral-is-not-delivery, D-prescribed-commands-are-environment-assumptions, D-a-floor-is-not-a-ceiling, D-controls-validate-the-predicate-not-the-extractor, D-a-shared-vocabulary-is-not-a-shared-rule) |
| [decisions/duplication-and-integrity.md](decisions/duplication-and-integrity.md) | *How does the plugin catch duplicated facts (within/across docs) and verify a fix actually landed everywhere?* (D37, D40, D12, demoted D2/D5/D7/D11) |

---

## Critical Gotchas

Defensive traps organized by mechanism. Full context: open the cited decision file.

| Trap | Tell | Where |
|------|------|-------|
| A deferred backlog row is an unverified claim wearing a decision's clothes | Rows carry counts, byte figures and line-number citations that nothing re-checks; each deferral reads as postponing work rather than as resting on a stale number, so no one re-measures. Measured 2026-09-12: 5 of 12 rows had moved, 4 were closable. Re-measure before planning against a row, and date the measurement | this row, measured 2026-09-12 |
| Correcting the figures leaves the generator running | 1.261.0 disproved `bytes/4`, quantified it at 15–20% and patched the affected numbers — while `harness-constraints.md` went on prescribing it for ten more versions. A corrected value reads as a closed case, so nothing asks what computed it. The inverse of "correcting a premise doesn't correct its dependents": here the dependents were fixed and the premise survived. Tell: your entry lists corrected values and names no method | this row, measured 2026-09-12 |
| A byte count is not a token count, and `bytes/4` invents ceiling breaches | Measured across all 38 skills: zero over 5,000 real `cl100k_base` tokens, while `bytes/4` flags three. The corpus averages 4.46 bytes/token so the divisor over-reports ~12%, but a dense file runs higher and generalising one file's ratio is its own trap (`unhobble-instructions` is 4.70 B/tok: 21,453 B → 5,363 est vs 4,566 real). The error is one-directional, so it always reads as a breach to fix rather than as a bad ruler. Count with a tokenizer before asserting an overage | this row, measured 2026-09-12 |
| A one-time size fix does not hold, and nothing notices it unwind | `unhobble-instructions/SKILL.md` was cut to 19,319 B in v1.205.0 to clear the re-attach ceiling and grew back to 24,011 B (5,119 real tokens, 119 over). The growth is real even where the reported overage was inflated; nothing measures a skill between passes | this row, measured 2026-09-12 |
| A shared vocabulary reads as a shared rule, and grep cannot tell them apart | Four files matching "resident"/"lazy-load"/`📖` stated four different rules (don't-merge-pointers, shape-the-index, run-the-test, order-the-gates). Read the passages side by side and ask what each tells a reader to DO before trusting an extraction count | D-a-shared-vocabulary-is-not-a-shared-rule (verification-rigor.md) |
| A size threshold guards one direction and reads as guarding both | A budget is written to stop a number falling short; the same number running away passes every check and reports as achievement. Ask which direction is dangerous, then guard the mechanism rather than the number — for a shrinking doc set, which file GREW to receive what left | D-a-floor-is-not-a-ceiling (verification-rigor.md) |
| A zero-hit grep is a claim about the pattern | A guard reworded `~10%`→"roughly a tenth" reads as deleted to every search keyed on the digits; the conclusion (restore what's present, report a live safeguard missing) is the expensive part. Run the pattern where the fact demonstrably lives before believing an absence | D-a-floor-is-not-a-ceiling (verification-rigor.md) |
| A gate's inputs must be computed at the DECIDING step, not a sibling step | Measurement placed after the hand-off sentence; checklist rows are themselves unenforced | D51, D-done-owes-the-condense (bloat-generator-fixes.md) |
| Ownership guards fire on uncommitted state only, not history | A safe operation blocked as "contested" because committed work looks like another session's baseline | D-guard-scoped-to-what-it-can-see (bloat-generator-fixes.md) |
| Glob-based measurement breaks on unsplit docs | `cat current.md decisions/*.md` aborts on unmatched glob in zsh; use `find...xargs cat | wc -lc` | D-unmatched-glob-measures-zero (bloat-generator-fixes.md) |
| Confirming absent doesn't establish should-be-absent | A passage is gone, but whether it *should* be gone is a separate test (apply target skill's bar, not yours) | D-dropped-is-not-the-same-as-correctly-dropped (verification-rigor.md) |
| A file mid-write is unstable to verify | A defect found mid-pass may already be fixed; wait for completion notification + two `wc -c` calls | D-torn-page-verification (verification-rigor.md) |
| A stated limitation looks like hedging to a condense pass | Text "does NOT do X" deleted, leaving confident "does Y" without the guard — only the claim changes | D-limitation-reads-as-hedging (unhobble-rule-writing.md) |
| Softening an absolutist rule without checking its history | D57/D64's rejection is still in `decisions/*.md`; grep before loosening | D64 (unhobble-rule-writing.md) |
| Companion files are CONDENSE targets, not just destinations | A file already unhobbled still needs condense's own pass (different checks) | D65 (unhobble-rule-writing.md) |
| Seam-test measures WHERE, not WHAT the fact is about | Playwright API facts route by discovery-repo rather than "true everywhere"; ask "would this exist if this code didn't" | D-route-by-subject-not-discovery (verification-rigor.md) |
| Aggregate metrics hide bloated sentences | Doc passes line/byte target while individual rows are 500+ characters of parentheticals | D67 (bloat-generator-fixes.md) |
| Retiring a convention's prescription leaves its instances | Nothing teaches the form anymore, yet the corpus is full of it; a rule against a shape doesn't rewrite what predates it | Last Session, prior sessions paragraph (2026-08-11 → 2026-09-03) |
| Marker density predicts GENRE, not health | Same marker runs 56-of-58 load-bearing in a symptom-indexed table and 14-of-17 hollow in prose skill bodies; the table's symptom column earns it, prose rarely does | CHANGELOG 1.137.19 (56 of 58 load-bearing) and 1.178.0 (the prose contrast); the 14-of-17 prose figure is not found in the repo as of 2026-10-10 |
| Mtime can't discriminate ownership between live sessions | Timestamps order files confidently and correctly while answering "when", never "whose" — concurrent sessions share the window | `_shared/references/diff-ownership.md` |
| Compression keeps the rule, drops the mechanism | A rewrite pass leaves the imperative and cuts the reason under it, or cuts the `📖` route to it; the file reads complete, so reading the result whole cannot find it — only a pre-dispatch snapshot diff can | `../agent-architecture/decisions/verification-rigor.md` § D-verify-by-definition-not-by-string ("kept the diagnosis and dropped the repair"); the snapshot-before-revert method is in `skills/haiku/references/verifying.md` |
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
| Format test per signal type | Prose for "it depends"; table row for exact value; prose+pointer for mixed — applies to Create-mode templates too | D63 (unhobble-rule-writing.md) |
| Condensation unit is the doc SET, not the named file | A member holding 2× the index's bytes unexamined; set index = Quick Start + doc-wide tables + routing | `task-summary/references/templates.md` |

---

## Last Session (2026-09-25, 2026-09-29, 2026-10-07, 2026-10-10)

- **`refresh-instructions` on `uiux` (a SKILL.md plus six references): only the unhobble pass applies, since no restructure or condense skill owns a SKILL.md.** One haiku pass cut `SKILL.md` 29,070 → 14,726 B and wrote three reference files (`porting-existing-designs`, `reading-live-branches`, `verification-traps`), then reported every dated incident moved and every warning and Tell converted. Reading the result found: an invented "five hours of redesign" incident and an invented trace procedure, invented cache-clearing steps, a reversed rule (calling a supplied prototype "a behaviour reference" is the mistake the original warns against), a misattributed license line, and a false claim that two sections were merged. `/done`'s code-reviewer then found five more the first read missed: the "single hit vs several hits" convention test reversed, the read-the-conventions-doc step weakened, "first render is a second approval gate" dropped, an invented control-placement imperative, and three measured incidents with no home. The product-reviewer found three triggers that had moved behind pointers (builder briefs from a summary, undrawn states, polish never executing a framework verdict). All patched; the incidents now live in `references/design-incidents.md`. Final `SKILL.md` 17,982 B, 3,817 tokens, 10 pointers resolving. Same profile as the 2026-09-25 record below: haiku's unhobble pass on a judgement-dense file fabricates and reverses while reporting success; the meaning-read against the original, not the report, is what caught it, and the first read still missed half.

- **`/done` over 1.317.0–1.332.0, shipped as 1.333.0 (docs-only, 31 files).** Review found and fixed a citation to a retired `task-summary` section (`validation-checklist.md`), an `output-style-hook/current.md` carrying five `## Last Session` blocks, and an undated "all 38 skills" claim in `CLAUDE.md`.
- **Still open from the same review, not applied (each changes skill behaviour, so the call is Syafiq's):** (1) `task-summary` says the MADR split is `condense-task-doc`'s job, but a single oversized `decisions/<theme>.md` needs `decision-splits.md`'s sub-split, which `condense-task-doc` would damage; (2) `continue-session` no longer records decisions that exist only in the conversation, and the doc template has no "awaiting a decision" home for the next session to find; (3) `update-plugin`'s new inventory and four-role table have no slot in its `## Output`, and Step 1 says "in the output" while Step 2 says "scratch"; (4) `casual-message`'s timeline scope contradicts its own "no bullet structure" line and the refer-back test that sends a card reply to `gchat-format`; (5) `task-summary` dropped the two-sentence row limit and "hashes live only in Last Session"; (6) six changed files (`quick-done`, `done`, `read-summary`, `explore-delegation`, `condense-claude-md`, `other-modes`) have no CHANGELOG entry; (7) `CHANGELOG` 1.328.0 names no command for regenerating an old code-simplifier agent, and 1.320.0/1.323.0/1.330.0 name private projects in a file shipped to colleagues; (8) `.githooks/pre-commit` could also reject staged `.DS_Store` and warn on a staged SKILL.md with no new CHANGELOG heading.

- **Haiku's failure profile on a full three-pass refresh of a 14-file instruction set** (global `CLAUDE.md` + 10 companions + 3 references), every pass verified against snapshots:
  - Restructure: 4 of 13 runs on small companions added group headings over 3–6 entries and were reverted.
  - Condense: nearly every run needed patches. Three runs were reverted outright: two claimed moves they never made, and one cut the measured figures a hot file cites by name.
  - Unhobble: four runs failed outright. One invented a false unifying cause, one claimed a table moved when nothing was written, one deleted protected config keys, and one dropped facts restored an hour earlier.
  - Sonnet: the three re-runs needed no correction.

  The user's standing preference is haiku by default, with one tier up only for a pass that fails (memory, and `haiku` 1.321.0). This record is the evidence for that trade-off, not a reversal of it.
- **Four agents stalled at the 600 s stream watchdog mid-pass.** Two of them had already written partial edits. `SendMessage` with the file's current byte count resumed all four to completion, so a stalled agent can be resumed rather than re-dispatched.
- **2026-10-10: this doc set and the global `CLAUDE.md` got a full three-pass refresh on haiku, and `verification-rigor.md` (50 KB) was split by topic.** The set went 162 KB → ~146 KB with all 49 decisions and 64 index rows kept; `verification-rigor.md` became `verification-rigor.md` (10 decisions) + `unhobble-rule-writing.md` (8), text moved word for word. A second condense on `bloat-generator-fixes.md` found nothing to cut, which is the expected result once one condense and one unhobble have run.
  - **Pass 2 cut inside ADRs and pass 3 had to put some back:** on `structural-mechanics.md` and `verification-rigor.md` the condense trimmed rejected-alternative parentheticals, quoted wording and a "reason not to split" that change what a reader concludes; the unhobble agent restored them by comparing against the pre-condense copy. Give the unhobble pass the pre-condense file and the instruction to restore, since nothing earlier checks the condense for that.
  - **An unhobble pass softened a hard rule in the global `CLAUDE.md`** ("Use `Edit` for all file changes; shell is for reading only" → "Prefer `Edit`") because it read the rule as contradicting the later "when a script is right" paragraph. The file's own text says that rule does not fire from recall, so the softening was reverted and the exception was written into the sentence instead. A rule recorded as failing from recall belongs on the protected list by name.
  - **Open, found by review and not decided:** (1) D19 says Multi-Agency concentrates "11-26x" in `app/Http/*`, D20 says "5-10x" — needs a count in that repo. (2) ~~D40 says `/done` runs the literal `</content>` grep~~ — reworded 2026-10-10 to say it runs in `merge-task-docs`, `condense-claude-md`, `condense-task-doc` and `task-summary`, not `/done`. (3) `structural-mechanics.md` D-pointer cites a global `CLAUDE.md` sentence and `{#pointer-needs-a-trigger}` anchor that the current global file lacks. (4) Task Status row 15 cites `D-retraction-is-wider-than-its-entry`, which has no heading in any decisions file. (5) Critical Gotchas row "Version drift recurs…" cites D26, which is the companion-file split. (6) Blocker 5's token figures are unmeasured (no tokenizer this session).


**Prior sessions (2026-08-11 → 2026-09-03)** — facts with no other home; the rest is in the ADRs and the CHANGELOG. Retiring a rule's *prescription* does not retire what it already produced: the `**Tell:**` convention left 17 residual instances across four files after the last instruction producing them was removed. Version drift reached its 10th recurrence, both from concurrency and from a single session drifting four versions at once. `ship` Step 4's extraction once violated D-deferral-is-not-delivery (moved triggers with their procedure); restored inline. Doc set peaked at 1,207 lines / 163KB (3.5× budget) before splitting.

---

## Next Steps

**Every row here states a number or a path that nothing re-checks.** Measured 2026-09-12 against the live tree: of twelve open rows, five asserted a figure or a file location that had since moved, and each still read as current. Four of those five were closable or already fixed. A backlog row decays exactly like the static facts this doc warns about elsewhere, with one difference that makes it worse — a deferral reads as a decision to postpone real work, never as a decision resting on a stale number. **Re-measure a row before planning against it, and put the date of the measurement in the row.**

**Automated gates**
- [ ] ADR-id uniqueness — still no post-write gate. Collided 2026-08-02 (D66); mechanism owned by [../agent-architecture/current.md](../agent-architecture/current.md). Swept 2026-09-12 with `grep -rho '^### D[^ ]*' tasks/*/*/decisions/*.md | sort | uniq -d`: zero duplicates across all domains. That sweep is a candidate for the same pre-commit hook now that one exists.

**Pointer reachability (deferred)**
- [ ] Audit whether facts in `_shared/references/` reach the **moment** each skill acts on them. Inlined leak-tag check reached only 1 of 5 files initially — same defect as a pointer nobody opens. Unmeasured since it was written; 18 reference files as of 2026-09-12.

**Verification tooling as tested snippet**
- [ ] Consider moving pointer/anchor sweep checks to `_shared/references/` with a live test, rather than rewriting per session. Partially addressed already — `editing-skills-checklist.md` holds the method and the three ways the sweep lies, but as prose, not as a runnable snippet with its own controls. The `.githooks/` directory added 2026-09-12 is now a plausible home for the executable half.

**Agent templates vs the Bootstrap pattern (lower priority)**
- [ ] `skills/agent-setup/templates/*.template.md` total **71,126 bytes across seven templates** (re-measured 2026-10-10 with `cat skills/agent-setup/templates/*.template.md | wc -c`; the 81,477 recorded 2026-09-12 no longer matches, and the cause is not located). Audit for content agents would read anyway. The `browser-verifier` template and its `USER-TRIGGERED ONLY` gate were retired 2026-09-30 (CHANGELOG), so there is no gate left to preserve.
- [ ] Restored passages pasted from a snapshot can carry back the shape the pass removed (`haiku/references/verifying.md`). Re-read restorations against each file's rewritten voice.
- [ ] Accepted limit, not a gap to engineer: sessions that never run `/done` add content with no gate at all, and no measurement inside `/done` can see them.
