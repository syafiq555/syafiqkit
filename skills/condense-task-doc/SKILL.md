---
name: condense-task-doc
description: Aggressively condense a bloated task doc (current.md or any markdown living-doc) — collapse investigation narratives into table rows, strip verification numbers and commit hashes, remove duplicated facts across sections, trim Quick Start to ≤15 lines, and rewrite in place. Trigger when the user says "condense this", "shrink this doc", "trim the task doc", "remove what's not needed", "restructure/rephrase shorter", or any variation implying the doc has grown too large. Also auto-trigger when updating a task doc that is already >300 lines — condense first, then write the update. When the doc is a whole-doc MADR (decision-log) still >300 lines after a legitimate conversion, this skill SPLITS it (index + decisions/<theme>.md files) by default instead of condensing — see Process step 2. Do NOT confuse with condense-claude-md (which handles CLAUDE.md files, not task docs).
tools: Read, Write, Edit
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
- Duplicated facts — if a gotcha lives in Critical Gotchas AND Quick Start AND LLM-CONTEXT, keep it in one place and point to it from the others.
- Bugs Fixed rows that re-explain a bug already in Critical Gotchas — check every Bugs Fixed row against Critical Gotchas by ID/topic; if a match exists, collapse the row to `Symptom | → See Critical Gotchas (section, ID)`. Only bugs with no gotcha counterpart keep full root-cause + fix prose.
- Historical metrics (e.g. "1,957 zero-stock syncs over 3 days, 209 models") — context for the original incident, not for future sessions.
- Stale bullet lists of row IDs, variant IDs, or order IDs that were affected — file a one-line summary ("25 stale rows nulled") if needed, not the full list.
- Process history ("Step 1 we reviewed X, then we checked Y, then Z was confirmed") — captures HOW the session ran, not WHAT to know.
- Sections that only exist as incident logs (e.g. `## Investigation 2026-06-03`) — collapse into Bugs Fixed rows.

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

⚠️ **Row-existence pruning is a separate pass from sentence-compression — do both, not just the second.** Compressing every row's wording while deleting none is the most common under-condense: a doc can lose 5% from tighter sentences and still be bloated because half its rows shouldn't exist. Before compressing a single sentence, run the whole Critical Gotchas / Key Technical Decisions table through the keep-test above and **delete** (not shrink) any row that fails it. Tell for "discoverable from code, delete the row": the fix is the first thing any competent engineer would try on seeing the symptom (e.g. generic framework behavior, not a project-specific gotcha) — keep only what's counter-intuitive to THIS project's architecture.

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

1. `Read` the full doc.
2. **Check whether this is actually bloat before touching anything.** Line count alone is misleading: a whole-doc MADR restructure (`## Architecture Decisions` / `### D1` blocks) turns dense wrapped table cells into several short bullet lines, growing lines while shrinking bytes. Run `git show HEAD:<path> | wc -c` vs `wc -c <path>`. Bytes flat or lower → this is a restructure, not bloat — stop, tell the user, report both deltas. Bytes grew because of genuinely new ADRs (not restructure artifacts) and the doc is still >300 lines → also not condensable bloat: every ADR earns its place, so row-existence pruning (step 6) has nothing to cut. **Split** instead — index + `decisions/<theme>.md` files per `task-summary/references/templates.md`'s "Splitting a whole-doc MADR further" — as the default action, not something to ask permission for first. Only proceed with condensing past this step if bytes grew from accumulated cruft, not legitimate MADR growth.
3. Read `task-summary/references/templates.md` — note the canonical section headings, table column names, and field order for every section present in the doc.
4. Identify all `## Investigation` or narrative-only sections — these are the primary source of bloat. Plan to collapse them into Bugs Fixed rows.
5. Scan for fact duplication: grep for the 2-3 most critical phrases. If a phrase appears in >2 sections, keep it in one canonical location and convert the others to pointers. Specifically check every Bugs Fixed row against Critical Gotchas — a bug ID or symptom described in both is the most common duplication pattern in a doc that already went through one condensation pass.
6. **Row-existence pass (mandatory, do BEFORE sentence compression)**: for every row in Critical Gotchas and Key Technical Decisions, apply the keep-test in "What to keep" above and delete rows that fail it — not just shorten them. On a doc with 20+ gotcha/decision rows, expect to delete some; a pass that only tightens wording and drops zero rows has not done this step.
7. Rewrite the file using `Write` (full rewrite, not incremental `Edit`). Partial edits on a bloated doc leave stale content between hunks.
8. Count BOTH lines and bytes before and after (`wc -lc`). Report both deltas to the user.
9. Target: **≤300 lines** for a task doc with a full bug history, AND a real cut — a doc that started under 300 lines still needs step 6 applied; "already under budget" is not a reason to skip row-deletion. Line count alone is not the success gate: check bytes-per-line before declaring done — above ~120-150 (loose eyeball), or `## Files`/`## Task Status`/`## Bugs Fixed` each still >4KB, is a second bloat signal independent of the 300-line threshold. Run a second, more aggressive pass on those specific sections before reporting done; don't wait for the user to say "still bloated."

---

## Hard rules

- **Never use `Edit` for a full condensation** — `Write` the whole file.
- **Strip tool-output wrapper artifacts before writing** — if the file content came into context via a `Read` result, do not carry over `<content>`/`</content>` or any other tool-framing tags into the `Write` payload. Compose the rewritten body from the actual markdown only; verify the last line of the new file is real doc content (e.g. a `Last Session` bullet), not a leaked tag.
- **Never invent content** — only restructure what exists. If a fact is ambiguous, compress rather than rewrite its meaning.
- **Never delete a Next Step** — only remove items that are clearly completed (marked ✅ or described in the past tense in a Bugs Fixed row).
- **Preserve LLM-CONTEXT block** — update it to match the condensed content, but keep all fields (Status, Domain, Gotchas, Related, Last updated).
- **Preserve (or correct to) template structure** — column names, table formats, and section order must match `task-summary/references/templates.md` verbatim. Condensing does not grant license to rename columns or substitute bullets where a table is specified. Fix non-conformant structure in the same pass.
- **Report line count before and after** so the user can see the reduction.
