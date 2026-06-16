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
Run-on sentences stuffed with commit hashes, parentheticals, and evidence numbers. One idea per sentence. Evidence lives in git commits, not the doc.

---

## What to cut

**Always remove:**
- Investigation narratives — the "how we found it" story (evidence tables, live API outputs, SQL queries run during the session, stale variant ID lists). The fix and the rule are what matter; the detective work belongs in git history.
- Verification numbers, commit SHAs (outside Last Session), and "confirmed X=Y on prod" evidence in table rows. One word ("verified") is enough.
- Duplicated facts — if a gotcha lives in Critical Gotchas AND Quick Start AND LLM-CONTEXT, keep it in one place and point to it from the others.
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

---

## Section-by-section rules

| Section | Rule |
|---------|------|
| `<!--LLM-CONTEXT-->` | Gotchas block = 1-line teasers only. No full explanations — those live in Critical Gotchas. |
| `## Quick Start` | ≤15 lines total. Rewrite on every update. Answers: next action, commands, state, 2-3 gotchas, success criteria. Points to other sections, does not restate them. |
| `## Bugs Fixed` | One row per bug. Root cause = 1-2 sentences. Fix = 1 sentence. Date. No verification output, no commit SHAs (except the most recent deploy SHA in the fix cell if needed for cherry-pick disambiguation). |
| `## Critical Gotchas` | Keep. Compress row cells to ≤2 sentences each. |
| `## Key Technical Decisions` | Keep. One row per decision — the WHY in ≤1 sentence. |
| `## Last Session` | ≤5 bullets, ≤2 lines each. Overwrite in place — one session only. Before cutting a bullet, fold any still-load-bearing fact into its typed section. |
| `## Next Steps` | Delete completed items. No explanations — just the action. |
| `## Investigation <date>` sections | These should not exist after condensing. Collapse content into Bugs Fixed rows and delete the section. |
| `## Files` | Living map only — ~10-15 key files. No per-phase subsections or changelogs. |

---

## Process

1. `Read` the full doc.
2. Identify all `## Investigation` or narrative-only sections — these are the primary source of bloat. Plan to collapse them into Bugs Fixed rows.
3. Scan for fact duplication: grep for the 2-3 most critical phrases. If a phrase appears in >2 sections, keep it in one canonical location and convert the others to pointers.
4. Rewrite the file using `Write` (full rewrite, not incremental `Edit`). Partial edits on a bloated doc leave stale content between hunks.
5. Count lines before and after. Report the reduction to the user.
6. Target: **≤300 lines** for a task doc with a full bug history. Flag if still >300 and ask which sections to cut further.

---

## Hard rules

- **Never use `Edit` for a full condensation** — `Write` the whole file.
- **Never invent content** — only restructure what exists. If a fact is ambiguous, compress rather than rewrite its meaning.
- **Never delete a Next Step** — only remove items that are clearly completed (marked ✅ or described in the past tense in a Bugs Fixed row).
- **Preserve LLM-CONTEXT block** — update it to match the condensed content, but keep all fields (Status, Domain, Gotchas, Related, Last updated).
- **Report line count before and after** so the user can see the reduction.
