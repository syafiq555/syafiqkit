---
name: condense-task-doc
description: Aggressively condense a bloated task doc (current.md or any markdown living-doc) — collapse investigation narratives into table rows, strip verification numbers and commit hashes, remove duplicated facts across sections, trim Quick Start to ≤15 lines, and rewrite in place. Trigger when the user says "condense this", "shrink this doc", "trim the task doc", "remove what's not needed", "restructure/rephrase shorter", or any variation implying the doc has grown too large. Also auto-trigger when updating a task doc that is already >300 lines — condense first, then write the update. Do NOT confuse with condense-claude-md (which handles CLAUDE.md files, not task docs).
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

⚠️ **Row-existence pruning is a separate pass from sentence-compression — do both, not just the second.** Compressing every row's wording while deleting none is the most common under-condense: a doc can lose 5% from tighter sentences and still be bloated because half its ROWS shouldn't exist. Before compressing a single sentence, run the whole Critical Gotchas / Key Technical Decisions table through the keep-test above and **delete** (not shrink) any row that fails it. Concrete tell for "discoverable from code, delete the row": the fix is the first thing any competent engineer would try on seeing the symptom — generic React/CSS/framework behavior (`aspectRatio` for responsive sizing, guarding a conditional hook with `enabled:`, `stopPropagation` on click after pointerdown) is not a project gotcha even when it once cost a session to find. Keep only what's counter-intuitive to THIS project's architecture.

---

## Section-by-section rules

| Section | Rule |
|---------|------|
| `<!--LLM-CONTEXT-->` | Gotchas block = 1-line teasers only. No full explanations — those live in Critical Gotchas. |
| `## Quick Start` | ≤15 lines total. Rewrite on every update. Answers: next action, commands, state, 2-3 gotchas, success criteria. Points to other sections, does not restate them. |
| `## Bugs Fixed` | One row per bug. Before writing prose, check Critical Gotchas for the same bug ID/topic — if present, collapse to `Symptom | → See Critical Gotchas (section, ID)`. Otherwise: root cause = 1-2 sentences, fix = 1 sentence, date. No verification output, no commit SHAs (except the most recent deploy SHA in the fix cell if needed for cherry-pick disambiguation). Never merge two DIFFERENT bugs into one row even if same subsystem — only collapse the explanation, never the row count, unless both symptom AND fix are identical. |
| `## Critical Gotchas` | Keep. Compress row cells to ≤2 sentences each. |
| `## Key Technical Decisions` | Simple (table-row) decisions: keep, one row, WHY in ≤1 sentence. **MADR-style blocks (Problem/Decision/Rejected/Consequences/Status): do NOT flatten to a table row during condensation** — that erases the "why we rejected X" record the block exists to hold, and a table row cannot represent it. If a block must shrink, compress in this order: (1) Consequences — cut to the one fact not already recorded in Critical Gotchas/Bugs Fixed, or delete the field if it's purely a cross-reference; (2) Problem — trim to 1 sentence; (3) Decision's implementation bullets — collapse to file/symbol names, drop prose; (4) **never touch Rejected** — shortest field, structurally irreplaceable, the entire reason the block exists. A block only demotes to a table row via `templates.md`'s demotion rule (settled + unrevisited), never as a generic condensation step. |
| `## Last Session` | ≤5 bullets, ≤2 lines each. Overwrite in place — one session only. Before cutting a bullet, fold any still-load-bearing fact into its typed section. |
| `## Next Steps` | Delete completed items. No explanations — just the action. |
| `## Investigation <date>` sections | These should not exist after condensing. Collapse content into Bugs Fixed rows and delete the section. |
| `## Files` | Living map only — ~10-15 key files. No per-phase subsections or changelogs. |

---

## Process

1. `Read` the full doc.
2. Read `task-summary/references/templates.md` — note the canonical section headings, table column names, and field order for every section present in the doc.
3. Identify all `## Investigation` or narrative-only sections — these are the primary source of bloat. Plan to collapse them into Bugs Fixed rows.
4. Scan for fact duplication: grep for the 2-3 most critical phrases. If a phrase appears in >2 sections, keep it in one canonical location and convert the others to pointers. Specifically check every Bugs Fixed row against Critical Gotchas — a bug ID or symptom described in both is the most common duplication pattern in a doc that already went through one condensation pass.
5. **Row-existence pass (mandatory, do BEFORE sentence compression)**: for every row in Critical Gotchas and Key Technical Decisions, apply the keep-test in "What to keep" above and delete rows that fail it — not just shorten them. On a doc with 20+ gotcha/decision rows, expect to delete some; a pass that only tightens wording and drops zero rows has not done this step.
6. Rewrite the file using `Write` (full rewrite, not incremental `Edit`). Partial edits on a bloated doc leave stale content between hunks.
7. Count lines before and after. Report the reduction to the user.
8. Target: **≤300 lines** for a task doc with a full bug history, AND a real cut — a doc that started under 300 lines still needs step 5 applied; "already under budget" is not a reason to skip row-deletion. Flag if still >300 and ask which sections to cut further.

---

## Hard rules

- **Never use `Edit` for a full condensation** — `Write` the whole file.
- **Strip tool-output wrapper artifacts before writing** — if the file content came into context via a `Read` result, do not carry over `<content>`/`</content>` or any other tool-framing tags into the `Write` payload. Compose the rewritten body from the actual markdown only; verify the last line of the new file is real doc content (e.g. a `Last Session` bullet), not a leaked tag.
- **Never invent content** — only restructure what exists. If a fact is ambiguous, compress rather than rewrite its meaning.
- **Never delete a Next Step** — only remove items that are clearly completed (marked ✅ or described in the past tense in a Bugs Fixed row).
- **Preserve LLM-CONTEXT block** — update it to match the condensed content, but keep all fields (Status, Domain, Gotchas, Related, Last updated).
- **Preserve (or correct to) template structure** — column names, table formats, and section order must match `task-summary/references/templates.md` verbatim. Condensing does not grant license to rename columns or substitute bullets where a table is specified. Fix non-conformant structure in the same pass.
- **Report line count before and after** so the user can see the reduction.
