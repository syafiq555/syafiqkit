# Section-by-Section Condensation Rules

Cold-path lookup for `condense-task-doc`. Consult the row for the section you are currently editing — this is a per-section reference, not a start-to-finish read. The cut/keep policy and Process live in SKILL.md.

| Section | Rule |
|---------|------|
| `<!--LLM-CONTEXT-->` | Gotchas block = 1-line teasers only. No full explanations — those live in Critical Gotchas. |
| `## Quick Start` | ≤15 lines total. Rewrite on every update — **doc contested → additive only** (`../../_shared/references/contested-doc-sections.md`). Answers: next action, commands, state, 2-3 gotchas, success criteria. Points to other sections, does not restate them. |
| `## Bugs Fixed` | One row per bug. Check Critical Gotchas for the same bug ID/topic first — if present, collapse to `Symptom | → See Critical Gotchas (section, ID)`. Otherwise: root cause 1-2 sentences, fix 1 sentence, date. No verification output, no commit SHAs (except the deploy SHA in the fix cell for cherry-pick disambiguation). Never merge two different bugs into one row even in the same subsystem — collapse the explanation, not the row count, unless symptom AND fix are both identical. |
| `## Critical Gotchas` | Keep. Compress row cells to task-summary's `Rows ≤2 sentences` rule (Density Rules Layer 2). |
| `## Key Technical Decisions` | Simple table-row decisions: keep, one row, WHY in ≤1 sentence. MADR-style blocks (Problem/Decision/Rejected/Consequences/Status): never flatten to a table row during condensation — that erases the "why we rejected X" record. To shrink a block, compress in order: Consequences (keep the one fact not already elsewhere, or delete if it's just a cross-reference) → Problem (1 sentence) → Decision's implementation bullets (file/symbol names, no prose) → never touch Rejected (shortest field, structurally irreplaceable). A block only demotes to a table row via `templates.md`'s demotion rule (settled + unrevisited), never as a generic condensation step. |
| `## Last Session` | ≤5 bullets, ≤2 lines each. Overwrite in place — one session only; **doc contested → do NOT overwrite** (`../../_shared/references/contested-doc-sections.md`). Before cutting a bullet, fold any still-load-bearing fact into its typed section. ⚠️ Count the dated blocks under the heading, not just the bullets in the newest: sessions append a block above the last one, which keeps the heading unique and every block accurate while the section silently becomes a changelog. More than one block is the finding — fold each one's load-bearing facts into their typed sections and delete the rest, subject to the contested rule above. A block deleted as "covered elsewhere" needs, for each fact, the section that now holds it, checked by grepping a distinctive phrase there. Measured 2026-10-01: five blocks were deleted on that claim, and four non-derivable gotchas they held were in no other doc. |
| `## Next Steps` | Delete completed items. No explanations — just the action. Regroup by KIND of work on sight if flat or date-grouped (`task-summary/references/templates.md` "Next Steps") — a condense pass is exactly when a list has grown past readable. Deleting done items is the only shrink available: on a split set this section never routes down to `decisions/*.md` and never counts toward the line budget, so a long live backlog is not something this pass is trying to reduce (SKILL.md step 2, already-split branch). |
| `## Investigation <date>` sections | These should not exist after condensing. Collapse content into Bugs Fixed rows and delete the section. |
| `## Files` | Living map only — ~10-15 key files, **filenames only, no per-feature/per-ADR grouped paragraphs and no parenthetical "what it does" annotations**. A doc that groups Files by feature/ADR/bug-number is really a changelog wearing a Files header — flatten to one list per repo/layer. The file→decision mapping already lives in the ADR file and Bugs Fixed; Files does not need to re-derive it. |
| `## Task Status` | If every row's status is a duplicate of a Bugs Fixed row or an ADR routing-table entry ("see Bugs Fixed", "see ADR-19"), the whole table has failed the keep-test — collapse it to a short paragraph: what's merged-live vs branch-pending, plus any deploy blockers. Only keep per-row granularity when a row states a fact found NOWHERE else (a specific verification gap, a blocking dependency). |

## Worked incidents (moved from SKILL.md)

SKILL.md keeps each cut/keep rule with its reason and a dated clause. This section holds the long form, with the measured incident behind it. Read it when a rule's reasoning is in doubt.

### Derivable facts: companions and the 2026-09-25 flake rate

Measured 2026-09-25: condense passes on global-CLAUDE.md companions deleted the "1 in 3" flake rate the hot file cites by name, and stripped `⚠️` from a reference file as a "skill requirement". The no-emoji rule covers task docs only; a companion's existing markers are content.

### Spec siblings and the file-grain filter

"Derivable from the code" is true of a fact and never of a sibling file, and applying the filter at file grain is how a spec gets evacuated. A `stories.md`, an acceptance-scenarios file or a business-rules page records what was *intended*; the code can confirm it and the tests can exercise it, but neither derives it, and where the two disagree the disagreement is the most valuable line in the set. Measured 2026-09-04: a pass replaced a 285-line stories file with a 16-line note saying the scenarios lived in the tests, and named two test targets that did not exist, while the file it removed held a validation rule the code had never enforced, which is a correction to record, not redundancy to drop. Condense a spec sibling the same way as the index, row by row; a whole file judged derivable is the filter misfiring, and any deletion justified by "lives in tests/code" names the survivor and checks it is there before the bytes leave.

### Renumbered citations

Reordering a numbered list is a renumber, and a renumber owes its own citations a repoint, deleting one as "dead" is the move that looks like tidying. Every `Step N` / `rule N` citation now names a different item while the list still reads as a clean sequence, so nothing in the prose flags it. The condense instinct makes it worse: a cross-reference whose number went stale presents as obsolete cruft, when the reorder you just performed is what made it fixable. Measured 2026-09-15 reordering a hook payload so its most-failed rule led, one citation was deleted as dead (it named a live pairing between two rules), and a second, in a section the diff never touched, silently came to point at the wrong one. Sweep for the citation syntax (`Step [0-9]`, `rule [0-9]+`), never for the retired number: the old label is usually gone, so grepping it returns zero and reads as clearance, while the live breakage is a citation carrying a number that still exists and now means something else. This reaches past the file, a sibling doc or skill citing `Step 4` is stranded the same way.

### Unordered bullet logs

The same trap fires with no numbered-list syntax at all, an unordered bullet log (an append-only precedent or memory file) cited by informal position ("row 8 above", "the entry above") has no `Step N`/`rule N` string to grep for, so the sweep above finds nothing even though sentence-length edits earlier in the file shift what a reader would count as "row 8" same as a reorder would. Measured 2026-09-18 condensing a flat bullet list: a prose trim shortened an earlier bullet, one bullet's "same tradeoff as row 8 above" silently came to point at the frontmatter line instead of the case it meant, caught only by a later pass. For an unordered list, grep for the position-citation PATTERN itself (`row [0-9]`, `above`, `below`) and re-verify each hit names the right neighbor by content, there is no stale label to search for, only a claim that must be re-checked against the current layout every time bullet lengths change.

### Cut evidence

Cutting a claim's evidence while keeping the claim leaves an assertion the doc can no longer support, and it shrinks the line count exactly like a good cut. Measured figures, dated incidents and percentages are the densest-looking prose in any row, so they surface first as padding, but "this is the most-failed step" or "the failure is measurable" is *only* load-bearing because of the numbers underneath it. Strip them and a grounded finding becomes an appeal to authority; the next pass, meeting an unsupported claim, cuts the claim too. Either keep the evidence or cut the claim it supports, never the claim alone, and prefer keeping both when the figure is what lets a reader judge whether a rule still applies to them.

### Marked gaps

A marked gap and a provenance tag are content, not staleness. A heading whose body is only `[TBD — no target recorded]`, and inline `[SOURCED]`/`[INFERRED]`/`[TBD]` tags, are deliberate reports that nobody has decided yet or that a claim was derived rather than transcribed, most often in a `PRD.md` or `ARCHITECTURE.md` written by `setup-project-docs`, which emits them for exactly this reason. They present as the purest form of what this skill removes: an empty section and an unverified-looking marker. Deleting one destroys the only record that the gap exists and makes it invisible to the person who could close it in a sentence, which is strictly worse than the emptiness it tidies. Leave both alone, on the same reasoning as *Required sections* in SKILL.md, a heading marked empty is a live report, while a deleted one is silence nobody can act on.

### Already-split index with a long client question list

Measured 2026-10-10: a 17-question summary dropped the numbering a sent message had used, read a still-unconfirmed item as settled, and lost each item's conflict; only a product review caught it. Rewording its cells to hit a byte target loses the evidence under each answer, and the index drops by the section's whole size instead of a few percent.

### Non-task-doc living docs and companion splits

Measured 2026-09-16: a condense pass on `CLAUDE.local.md` cut 291→282 lines, 83,875→68,120 bytes purely by sentence tightening, and both the condense and the following unhobble pass separately declined to extract a ~130-line Podman/nginx incident-response block into the `.claude-companions/local/references/` directory the file already pointed at three times, because this branch didn't exist to require it. The reasoning burden is on NOT splitting: if a companion directory is already referenced by this file and a section is symptom-indexed reference material, name why it stays resident rather than treating "nothing warrants moving" as a silent default.

### MADR blocks: paraphrase invents detail

A pass that "condenses" a decision paraphrases it, and a paraphrase written from a summary invents the details the summary lacked: measured 2026-09-08, ten blocks came back at half length carrying a field the code never had and "deployed" on decisions two waves out, under a report saying no facts were lost. Prove the move before reporting it: every `### D-` heading from the source greps once in the set, and a handful of distinctive phrases from the rewrite grep at least once in the source. A sourced research section (statute citations, graded `[PRIMARY]`/`[CORROB]`/`[UNVERIFIED]` findings) moves the same way and is equally verbatim.

### Source captures

A file whose header says it is a verbatim copy (terms, a policy, a contract or quotation) is not edited at all, not even to dedupe: its wording is the deliverable, and the next revision is checked by diffing against it. Measured 2026-10-02: a condense pass told that every client figure must survive still cut a 265-line client-sources capture by 43 lines, dropping supplier names, line-level workbook errors and verbatim WhatsApp wording, and had to be reverted whole.

Not editing it extends to not splitting it when a script, build or `git diff` history reads it as one file at its path; such a copy keeps a generated outline beside it instead (SKILL.md, the source-capture rule under step 8).

