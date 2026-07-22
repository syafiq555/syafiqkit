---
name: condense-task-doc
description: Aggressively condense a bloated task doc (current.md or any markdown living-doc) — collapse investigation narratives into table rows, strip verification numbers and commit hashes, remove duplicated facts across sections AND across the doc's sibling files, trim Quick Start to ≤15 lines, and rewrite in place. Trigger when the user says "condense this", "shrink this doc", "trim the task doc", "remove what's not needed", "restructure/rephrase shorter", or any variation implying the doc has grown too large. A named path is the doc SET, not one file — always condense the index AND its decisions/*.md siblings together. Also auto-trigger when updating a task doc that is already >300 lines — condense first, then write the update. When the doc is a whole-doc MADR (decision-log) still >300 lines after a legitimate conversion, this skill SPLITS it (index + decisions/<theme>.md files) by default instead of condensing — see Process step 2. Do NOT confuse with condense-claude-md (which handles CLAUDE.md files, not task docs).
---

# Condense Task Doc

The goal is maximum signal-to-noise: a cold-start agent should be able to read the doc in under 2 minutes and act correctly. Every line must earn its place.

## Two failure modes that cause bloat

**1. The same fact restated in multiple sections.**
A fact belongs in exactly ONE place. LLM-CONTEXT and Quick Start *point* to canonical sections — they do not restate them. Investigation narratives re-tell what Bugs Fixed already records. Verification logs re-tell what git history owns.

**2. Bloated sentences.**
Base writing-style rules: `_shared/references/writing-style.md`. Evidence (hashes, numbers, SQL output) lives in git — not the doc.

---

## What to cut

**Always remove:**
- Investigation narratives — the "how we found it" story (evidence tables, live API outputs, SQL queries run during the session, stale variant ID lists). The fix and the rule are what matter; the detective work belongs in git history.
- Verification numbers, commit SHAs (outside Last Session), and "confirmed X=Y on prod" evidence in table rows. One word ("verified") is enough.
- Duplicated facts — if a gotcha lives in Critical Gotchas AND Quick Start AND LLM-CONTEXT, keep it in one place and point to it from the others. An OPEN item restated with full mechanism in the index, a theme file, AND Next Steps collapses to one canonical statement (Next Steps) + bare pointers elsewhere. Finding these across files is Process step 5.
- Over-used `⚠️` — grep-count it; if it appears roughly every 8-10 lines or less, most instances aren't marking an irreversible/destructive consequence and should downgrade to plain/bold text. Reserve it for data loss, a broken audit trail, a silent prod regression, or an unrecoverable action — task-summary's Layer 1 has the full rule.
- Bugs Fixed rows that re-explain a bug already in Critical Gotchas — check every Bugs Fixed row against Critical Gotchas by ID/topic; if a match exists, collapse the row to `Symptom | → See Critical Gotchas (section, ID)`. Only bugs with no gotcha counterpart keep full root-cause + fix prose.
- Historical metrics (e.g. "1,957 zero-stock syncs over 3 days, 209 models") — context for the original incident, not for future sessions.
- Stale bullet lists of row IDs, variant IDs, or order IDs that were affected — file a one-line summary ("25 stale rows nulled") if needed, not the full list.
- Process history ("Step 1 we reviewed X, then we checked Y, then Z was confirmed") — captures HOW the session ran, not WHAT to know.
- Sections that only exist as incident logs (e.g. `## Investigation 2026-06-03`) — collapse into Bugs Fixed rows.

**Never cut a required section to nonexistence.** `Task Status`, `Bugs Fixed`, `Critical Gotchas` and `Next Steps` may lose every row and still keep their heading — leave a pointer row (`| — | see decisions/<theme>.md |`) instead of deleting the section. A missing section is invisible to every check here (they all detect excess), and on a split doc it silently stops the index showing open work.

**Compress, don't delete:**
- Long multi-sentence Bugs Fixed rows → fix description + one-line fix summary. Root cause detail beyond what's needed to classify a recurrence gets dropped.
- Quick Start > 15 lines → cut anything restated in Bugs Fixed or Critical Gotchas. Quick Start answers 5 questions: next action, commands/files, current state, 2-3 gotchas, success criteria.
- Last Session > 5 bullets → keep only what hasn't yet been folded into a Decision or Gotcha row.

---

## What to keep

Every fact that, if removed, would cause a future agent to act incorrectly. Signals:
- A counter-intuitive behavior specific to this project (e.g. "successful_syncs:1 = dispatch, NOT API success")
- A gotcha that looks safe but silently fails (e.g. "combo `available_qty` is always 0 in DB — use getComboStock()")
- A non-obvious ordering constraint or guard that prevents a recurring bug class
- A current-state fact needed to pick up work (e.g. "B14 deployed as cherry-pick, not feature branch SHA")

Do NOT keep:
- Evidence that something worked (that's what git blame/log is for)
- Implementation detail that's obvious from reading the code
- Root cause narration beyond what's needed to recognize a recurrence

⚠️ **Row-existence pruning is a separate pass from sentence-compression — do both.** The most common under-condense: tighter sentences, zero rows deleted, still bloated. Before compressing a sentence, run the whole Critical Gotchas / Key Technical Decisions table through the keep-test above and **delete** (not shrink) any row that fails it. Tell: if the fix is the first thing any competent engineer would try on seeing the symptom (generic framework behavior, not project-specific), delete the row.

---

## Section-by-section rules

| Section | Rule |
|---------|------|
| `<!--LLM-CONTEXT-->` | Gotchas block = 1-line teasers only. No full explanations — those live in Critical Gotchas. |
| `## Quick Start` | ≤15 lines total. Rewrite on every update. Answers: next action, commands, state, 2-3 gotchas, success criteria. Points to other sections, does not restate them. |
| `## Bugs Fixed` | One row per bug. Check Critical Gotchas for the same bug ID/topic first — if present, collapse to `Symptom | → See Critical Gotchas (section, ID)`. Otherwise: root cause 1-2 sentences, fix 1 sentence, date. No verification output, no commit SHAs (except the deploy SHA in the fix cell for cherry-pick disambiguation). Never merge two different bugs into one row even in the same subsystem — collapse the explanation, not the row count, unless symptom AND fix are both identical. |
| `## Critical Gotchas` | Keep. Compress row cells to task-summary's `Rows ≤2 sentences` rule (Density Rules Layer 2). |
| `## Key Technical Decisions` | Simple table-row decisions: keep, one row, WHY in ≤1 sentence. MADR-style blocks (Problem/Decision/Rejected/Consequences/Status): never flatten to a table row during condensation — that erases the "why we rejected X" record. To shrink a block, compress in order: Consequences (keep the one fact not already elsewhere, or delete if it's just a cross-reference) → Problem (1 sentence) → Decision's implementation bullets (file/symbol names, no prose) → never touch Rejected (shortest field, structurally irreplaceable). A block only demotes to a table row via `templates.md`'s demotion rule (settled + unrevisited), never as a generic condensation step. |
| `## Last Session` | ≤5 bullets, ≤2 lines each. Overwrite in place — one session only. Before cutting a bullet, fold any still-load-bearing fact into its typed section. |
| `## Next Steps` | Delete completed items. No explanations — just the action. |
| `## Investigation <date>` sections | These should not exist after condensing. Collapse content into Bugs Fixed rows and delete the section. |
| `## Files` | Living map only — ~10-15 key files, **filenames only, no per-feature/per-ADR grouped paragraphs and no parenthetical "what it does" annotations**. A doc that groups Files by feature/ADR/bug-number (`**ADR-14 paths**`, `**GAP-1 signed-agreement**`, `**#26 unlink mirror**`) is really a changelog wearing a Files header — flatten to one list per repo/layer (Backend AR / Frontend AR / Backend Dourr / Frontend Dourr). The file→decision mapping already lives in the ADR file and Bugs Fixed; Files does not need to re-derive it. |
| `## Task Status` | If every row's status is a duplicate of a Bugs Fixed row or an ADR routing-table entry ("see Bugs Fixed", "see ADR-19"), the whole table has failed the keep-test — collapse it to a short paragraph: what's merged-live vs branch-pending, plus any deploy blockers. Only keep per-row granularity when a row states a fact found NOWHERE else (a specific verification gap, a blocking dependency). |

---

## Process

1. ⚠️ **`Read` the full doc — and the whole doc SET.** The unit of condensation is the feature's documentation, not the path you were handed. `ls` the doc's directory: a `decisions/` subdir (or any sibling the doc routes to) is in scope, and is routinely bigger than the index — a split doc's `decisions/*.md` can be 2-3× the file named in the args. Condensing only the named file and reporting a byte delta is a false result: the set barely moved. Measure and report the SET's total, not the index's. **Tell you got this wrong: the user says "not only the current.md".**
2. **Check whether this is actually bloat first** — line count lies, since a MADR restructure grows lines while shrinking bytes. Run `git show HEAD:<path> | wc -c` vs `wc -c <path>`:
   - Bytes flat or lower → restructure, not bloat. Stop, report both deltas.
   - Bytes grew from genuinely new ADRs, still >300 lines → not condensable either (every ADR earns its place; step 6 has nothing to cut). **Split** by default, no permission needed — index + `decisions/<theme>.md` per `task-summary/references/templates.md`. ⚠️ The index keeps **three** things (templates.md L136): Quick Start, **doc-wide operational tables** (Task Status / Bugs Fixed / Critical Gotchas / Next Steps, scoped to cross-cutting), and the routing table. Only theme DETAIL moves down. After splitting, `grep '^## '` the index and confirm those sections survived — no other check here detects a missing section.
   - Bytes grew from accumulated cruft → condense, continue.
3. Read `task-summary/references/templates.md` — note the canonical section headings, table column names, and field order for every section present in the doc.
4. Identify all `## Investigation` or narrative-only sections — these are the primary source of bloat. Plan to collapse them into Bugs Fixed rows.
5. Scan for fact duplication **across the whole set, not per file** — `grep -rl` the 2-3 most critical phrases over every file at once. A per-file pass is structurally blind to the cross-file case: a fact stated fully in the index AND in its owning decision file passes every single-file check, so this only surfaces if you grep them together. Two patterns dominate, both in docs that already went through one condense pass:
   - **Within a file** — a phrase in >2 sections; every Bugs Fixed row whose bug ID/symptom is also in Critical Gotchas.
   - **Across the set** — a Bugs Fixed row explained in full in the index *and* in full in its owning `decisions/*.md`. The recent bugs are the usual offenders (each session wrote them up in both places). Collapse the index side to `→ decisions/<file>.md ADR-N`, matching how older bugs already point.
   ⚠️ Before trusting any new pointer, grep the TARGET for the fact you just deleted — a pointer to a file that doesn't explain it is worse than the duplication it replaced.
6. **Row-existence pass (mandatory, before sentence compression)**: for every row in Critical Gotchas and Key Technical Decisions, apply the keep-test in "What to keep" and delete rows that fail it — not just shorten them. On a doc with 20+ rows, expect to delete some; zero deletions means this step wasn't done.
7. **Draft + verify**: execution model is `_shared/references/two-tier-condense.md` — do the full rewrite inline (`Write`, not incremental `Edit`; partial edits on a bloated doc leave stale content between hunks; no spawned agent), using steps 1-6's findings (the row-deletion list, the duplication map, the section plan). ⚠️ **Verify with a diff against the file's pre-draft state, read every `-` line, confirm the same fact survives in the `+` lines — never verify by re-reading the finished file.** (`git diff HEAD` is the right baseline ONLY if the doc was clean when you started — a doc carrying uncommitted edits needs a pre-draft snapshot, or the other writer's changes masquerade as regressions that were never real.) An invented cause/mechanism reads exactly as plausible as the real one in isolation, and a dropped Next Step leaves a doc that still reads perfectly coherent — only the diff exposes either.
8. Count BOTH lines and bytes before and after (`wc -lc`) **for every file in the set**, and report the per-file deltas plus the set total. A big cut on the index while `decisions/*.md` sat untouched is not a condensed doc set.
9. Target: **≤300 lines** for a task doc with a full bug history, AND a real cut — "already under budget" does not excuse skipping step 6. Line count alone is not the success gate: bytes-per-line above ~120-150, or `## Files`/`## Task Status`/`## Bugs Fixed` each still >4KB, is a second bloat signal. Run a second, more aggressive pass on those sections before reporting done.
   ⚠️ **Still >300 lines after condensing, and the excess is MADR blocks (each already near its ~20-line floor), not compressible prose → this is step 2's split trigger firing late, not a signal to compress harder.** A second aggressive pass on prose that's already tight just erodes real content for no line-count gain. Re-run step 2's second bullet now: split Key Technical Decisions into `decisions/<theme>.md` per `templates.md` L134 — **no user ask required**, do it as part of this same pass, matching step 2's "no permission needed" wording. Report both the condensed delta and the split as one result.
10. ⚠️ **Run step 5's cross-file grep AGAIN after all writes land, and before reporting done.** Section-by-section (and file-by-file) editing is the most common way duplication is introduced *during* the pass — the per-file diff-verify in step 7 confirms nothing was lost, and is blind by construction to the same fact surviving twice. Only a set-wide grep after the last write closes it. Reporting "done" off per-file checks alone is the failure this step exists to prevent.

---

## Hard rules

- **Never use `Edit` for a full condensation** — the drafting agent `Write`s the whole file (step 7).
- **Strip tool-output wrapper artifacts before writing** — see `_shared/references/strip-tool-output-tags.md`.
- **Never invent content** — only restructure what exists. If a fact is ambiguous, compress rather than rewrite its meaning.
- **Never delete a Next Step** — only remove items that are clearly completed (marked ✅ or described in the past tense in a Bugs Fixed row).
- **Preserve LLM-CONTEXT block** — update it to match the condensed content, but keep all fields (Status, Domain, Gotchas, Related, Last updated). `Last updated` states the date + a one-line summary of what changed — it does NOT restate deploy/environment status prose ("LIVE in production", "deployed to staging"); that belongs solely in Quick Start's state line (task-summary's "one fact, one home" rule). If the doc being condensed has that phrase duplicated in both places, collapse it to Quick Start and point `Last updated` there instead of copying it forward.
- **Delete git-tracked state on sight — never dedupe it.** "Committed" / "uncommitted" / "pushed" / "not yet pushed" is not a fact worth keeping even once: `git log`/`git status` answers it, and a doc's copy is wrong the moment someone commits. This is a real cut every condense pass makes automatically, distinct from the row-existence judgment call in "What to keep" — don't confuse it with deploy/environment status above, which DOES stay (staging/prod is not git-tracked). ⚠️ Nor with an MADR `**Status**: committed` field — that's a decision-lifecycle value (`committed | planned | debating`), not git state, and no git command answers it. Leave those.
- **Preserve (or correct to) template structure** — column names, table formats, and section order must match `task-summary/references/templates.md` verbatim. Condensing does not grant license to rename columns or substitute bullets where a table is specified. Fix non-conformant structure in the same pass.
- **Report line count before and after.**
- Content-loss verification is step 7's job (`_shared/references/two-tier-condense.md`) — it also covers sections step 4/6 never explicitly named (a reference table, a credentials note, an unrelated cross-link swept up in the rewrite).
