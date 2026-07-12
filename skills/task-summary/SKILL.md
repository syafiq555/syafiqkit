---
name: task-summary
description: Create or update task summary documentation (current.md). Handles path resolution, domain inference, template selection, cross-references. Use for any task documentation workflow.
---

# Task Summary

Living documentation for humans and LLM agents. Always reflects current state — not a changelog.

## Workflow at a glance

Do these in order — the detailed rules for each are in the sections below.

1. **Resolve path** — turn the input (full path / `domain/feature` / empty) into `tasks/<domain>/<feature>/current.md`. No explicit path → run the multi-domain scan first (Step 1).
2. **Read the template** — `references/templates.md` holds the canonical sections; pick Full (multi-session) or Minimal (single fix).
3. **Create or update** — missing doc → Full template; existing doc → edit in place, gap-checking against the template for missing sections.
4. **Validate** — re-read: LLM-CONTEXT complete, Quick Start rewritten, no rows dropped, Last Session overwritten not appended.
5. **Reconcile back-references** — sync any roadmap/hub/`Related:` doc that mirrors the status you just changed.

The density rules below apply to *every* write in steps 3–4 — they're what keep the doc from bloating.

## Density rules (apply to every write — this is what keeps docs from bloating)

**Goal**: minimum tokens, maximum actionability. A cold-start session reads the doc once and acts correctly — no re-reads, no guessing. Every word that doesn't serve that goal gets cut.

Two failure modes kill these docs: **the same fact restated in 4–5 sections**, and **bloated sentences**. Enforce both layers:

### Layer 1 — one fact, one home

| Rule | Detail |
|------|--------|
| **One fact, one home** | Each fact lives in EXACTLY one section. LLM-CONTEXT + Quick Start *point* to the canonical section — they do NOT restate it. A fact is either a Decision (*why*) OR a Gotcha (*what breaks*) — never both. |
| **LLM-CONTEXT is a pointer index** | `Gotchas:` block = 1-line teasers naming the section to read — not a copy of the table. |
| **Quick Start ≤15 lines** | State + next action only — never re-explain a Decision/Gotcha. |

### Layer 2 — sentence style (every sentence you write)

Base rules: `_shared/references/writing-style.md`. Additional rules for task docs:

| Rule | Detail |
|------|--------|
| **Rows ≤2 sentences** | Rule + single strongest reason. Rejected-alternative essays and verification narratives get deleted; git history owns them. |
| **No metrics/hashes in rows** | Commit hashes = Last Session only. Verification = one word ("verified"). |

### Size budget

`current.md` should stay **under 300 lines**. If the doc is already >300 lines when you open it for an update, run a condense pass FIRST — delegate to `condense-task-doc` rather than hand-rolling it. That skill's row-existence pass (delete gotcha/decision rows that are discoverable-from-code, not just shorten their wording) is the step most likely to be skipped if you improvise a condense inline; sentence-tightening alone on a 40+-row doc yields a token cut in the single digits, not a real reduction.

⚠️ **Line count is a proxy, not the metric — check byte size (`wc -c`) before forcing a condense.** A whole-doc MADR rewrite (see templates.md) can legitimately GROW line count while SHRINKING total bytes: a dense table cell becomes several short bullet lines in an ADR's Consequences section — more newlines, fewer total characters. Before condensing solely because line count crossed 300, compare `wc -c` on both versions (or `git show HEAD:<path> | wc -c` vs `wc -c <path>`) — if bytes dropped or held flat, the doc restructured, it didn't bloat, and a forced condense would just re-compress readable bullets back into wide table cells.

⚠️ **MADR is the default decision structure — apply on every create/update.** Every decision written to `## Key Technical Decisions` is an MADR block (Problem/Decision/Rejected/Consequences/Status) by default (templates.md "MADR-Style Decisions") — not an upgrade reserved for decision-heavy docs. Escape hatch to a plain `| Decision | Rationale |` row ONLY when the decision genuinely had no alternative considered (Rejected would come up empty). Already whole-doc MADR AND >300 lines after legitimate ADR growth → split into index + `decisions/<theme>.md` by default (templates.md "Splitting a whole-doc MADR further") as part of the current write, don't ask first.

Litmus tests before finishing: (1) grep your doc for the 2-3 most critical phrases — a phrase in >2 sections means collapse the extras to pointers; (2) scan for sentences with 2+ parentheticals or commit hashes outside Last Session — rewrite them.

## 1. Resolve Path

| Input | Action |
|-------|--------|
| Full path | Use as-is |
| Domain/feature | Expand to `tasks/<domain>/<feature>/current.md` |
| Empty / task description | **Multi-domain scan** — see below |

### Multi-Domain Scan (when no explicit path given)

⚠️ **Do NOT assume one domain per session.** Scan the full conversation for ALL domains that need task docs:

1. **Code changes**: `git diff --name-only` → infer domains from file paths
2. **External inputs**: WhatsApp messages, emails, Slack, screenshots, ClickUp pastes — extract every distinct issue/feature/bug mentioned
3. **Verbal requests**: User said "also note X", "don't forget Y", "the other issues" → those are domains too

⚠️ **Map each to its EXISTING doc by content, not by folder name.** A changed file path or feature name rarely matches the doc's folder (code `src/modules/qc-review/` → doc `setup/upload-redesign/`; folder names are engineer-domain-named). For each domain/feature found above, `Glob tasks/**/*.md` (incl `_archive/` + flat `tasks/<domain>/<feature>.md`) and `Grep` for the concept's vocabulary + synonyms across doc body + header — never assume the folder slug matches. Follow any `Merged into`/`Supersedes` redirect that still exists to the live doc (older repos may have legacy stubs; new merges no longer create them — see §2a). This prevents creating a duplicate doc when one already exists under a different folder name.

Build a table of all domains before writing anything:

```
| # | Domain/Feature | Source | Task Doc | Action |
|---|---------------|--------|----------|--------|
| 1 | webhook phone fix | code changes | tasks/notifications/webhook/current.md | Update |
| 2 | freemium tab | WhatsApp msg | tasks/student/freemium/current.md | Create |
```

Then create/update each task doc. **Every issue mentioned in the session gets a task doc** — even if it's just a 📋 Planning stub. A captured issue is better than a forgotten one.

## 2. Create or Update?

Read **both** the resolved path **and `references/templates.md`** first — the template holds the canonical section structure and gold-standard format you need for either path. Then: if the doc is missing → **Create** using the Full Template. If it exists → **Update** in place.

## 2a. When Merging or Renaming (user requests `merge A into B`, or rename a doc folder)

Cold-path — read `references/merge-rename.md` for the full process. Merging delegates to `syafiqkit:merge-task-docs`; renaming is `git mv` + reconcile every back-reference. **NO redirect stubs** either way — delete the source outright, the gate is 0 stale references.

## 3. When Creating

Use the **Full Template** from `references/templates.md` as the gold standard. Scale down to Minimal only for single bug fixes or short sessions.

⚠️ **Exact structure required** — copy section headings, table columns, and field names verbatim from the template. Do not rename columns, reorder fields, or substitute free-form bullets where a table is specified.

LLM-CONTEXT required fields: `Status`, `Domain`, `Related`, `Last updated`.

**Mermaid diagrams**: Use freely in any section where a visual helps — architecture, data flow, layout, feature hierarchy, state transitions. Not limited to one section.

## 4. When Updating

Edit in place. The doc should always read as one coherent current-state document.

⚠️ **MANDATORY first: gap-check AND structure-check against the template.** Before editing:
1. List the doc's `## ` headers — add any section missing from the template's required set.
2. For each existing section, verify its internal structure matches the template exactly: correct table columns, correct field names, correct order. Fix non-conformant structure in place (e.g. free-form bullets where `| Issue | Rule |` is specified, wrong column names in Bugs Fixed, missing Backend/Frontend split in Gotchas).

A decision/gotcha/bug captured only in `## Last Session` is a bug — Last Session is overwritten next run, so those facts must live in their typed table.

| ❌ Never | ✅ Always |
|---------|---------|
| Rename columns, reorder fields, or use bullets where a table is specified | Match template structure exactly — column names, table format, section order |
| Append `## Completed (date)` sections | Edit existing sections in place |
| Add duplicate rows | Update the existing row |
| Enumerate finished work streams row-by-row | **Collapse, don't enumerate** — completed Task Status rows from a finished stream become ONE summary row ("Phase 2 built + reviewed + committed ✅"); only open + current-stream rows stay itemized |
| Keep per-phase Files changelogs | Files = a living map of the ~15 key files; git history owns "what changed when" |
| Skip Next Steps | Remove done items, add new pending ones |
| Leave Quick Start stale after changes | Rewrite Quick Start to reflect current state |

| Section | Action |
|---------|--------|
| `LLM-CONTEXT` | Update Status + Last updated |
| `## Quick Start` | ⚠️ **MANDATORY on every update** — rewrite entirely (see below) |
| `## Task Status` | Tick off completed rows |
| `## Bugs Fixed` | Append new bugs |
| `## Critical Gotchas` | Append new rows to Backend or Frontend table |
| `## Key Technical Decisions` | New decision → append. Same decision evolved → edit its existing row/block in place (see MADR sub-rule below) |
| `## Files` | Add new files if introduced |
| `## Next Steps` | Remove done, add pending. **FLAT `- [ ]` checklist — never bold sub-headings grouping items ("**this session's findings:**", "**earlier:**"); grouping drifts it into a changelog.** Order by priority if needed; session provenance goes in `## Last Session`, not as structure here. |
| `## Last Session` | **Overwrite in place — ONE session only, ≤5 bullets, ≤2 lines each.** Delete the previous session's bullets entirely (never append a dated bullet below them — that's a changelog). Before deleting, fold any still-load-bearing fact into its proper Decision/Gotcha row. Parallel sessions: overwrite only your own content, but the one-session cap still holds. |

### MADR Blocks — Edit-in-Place vs Append (when the doc has one)

`references/templates.md` defines when a Decision becomes an MADR block instead of a table row. The test: **did the underlying decision change, or did our record of an unchanged decision get more accurate?**

| Signal | Action |
|--------|--------|
| Record of an already-recorded decision got more accurate (status flipped `planned`→`shipped`, a Consequence turned out different, an implementation bullet changed) | **Edit the existing block's fields in place** — same "edit in place, don't append" rule Quick Start follows. Update Status/date to show it was touched. |
| The decision itself changed — genuinely new decision, or a Rejected option got reconsidered and adopted | **Append a new block** with `Supersedes D-N` in its Status line. Don't rewrite the old block to match — that D-N was later reversed is itself worth keeping. |

### Quick Start Section (cold-start context for next session)

⚠️ **MANDATORY** — place immediately after the `# Title` and before `## Overview`. Rewrite on EVERY update (not append). A fresh agent reads ONLY this section before starting work. If it can't act from Quick Start alone, the section is insufficient.

Must answer these 5 questions in ≤15 lines total:

| # | Question | Format |
|---|----------|--------|
| 1 | What's the immediate next action? | Numbered list (ordered, first item = first thing to do) |
| 2 | What exact commands/files are involved? | Code blocks or inline code |
| 3 | What's the current state? | Bullet points — committed vs uncommitted, local vs prod, DB state |
| 4 | What gotchas will trip me up? | 2-3 critical ones only (e.g., "MUST use --queue not sync") |
| 5 | What does "success" look like? | One sentence with concrete numbers/expected output |

**Litmus test**: If a Sonnet agent reads ONLY the Quick Start and answers "what do I do first?", it should give the correct action + the correct command without reading any other section.

### Pruning

Prevent unbounded growth — apply when updating:

| Section | Prune when |
|---------|------------|
| Whole doc | >300 lines AND byte size grew vs the last committed version → mandatory condense pass before your update (see Size budget). Byte size flat/shrunk → likely a legitimate restructure (e.g. whole-doc MADR), not bloat — skip the forced condense. |
| `## Task Status` | A work stream finishes (committed + reviewed) → collapse its rows to one summary row. Don't wait for ALL rows ✅ |
| `## Bugs Fixed` | >10 rows → keep last 5, summarize older as "N earlier bugs fixed" |
| `## Files` | Per-phase subsections exist → replace with one living map of key files |
| `## Next Steps` | Remove ✅ items (don't just check them off — delete) |
| `## Completed (date)` sections | Should not exist — merge content into relevant sections |

### Credentials

❌ Never include API keys, merchant keys, passwords, or secrets in task docs. Reference `.env` keys by name only (e.g., `2C2P_MERCHANT_KEY` not the actual value).

## 5. Validate

Re-read after writing:
1. LLM-CONTEXT has Status, Domain, Related, Last updated
2. Last updated = today
3. Every section's structure matches the template — correct table columns, correct field names, no free-form bullets where a table is specified
4. Next Steps has no stale completed items
5. No rows deleted
6. Back-references reconciled (§6) — no roadmap/index/`Related:` doc still mirrors an out-of-date status for the feature you just updated
7. **MADR compliance** — every row in `## Key Technical Decisions` is either an MADR block or legitimately hit the escape hatch (no real alternative existed). A plain table row for a decision that DID have a rejected alternative is non-compliant — convert it now. If the doc is already whole-doc MADR and now >300 lines, split per Density rules — don't leave it for next session.
8. **Cross-section duplication** — grep the doc for its 2-3 most critical phrases (see Density rules litmus test). A phrase surviving in >2 sections, OR the same fact split across two bullets in the SAME section (e.g. two Next Steps items both saying "then deploy via full CI"), means collapse to one. Section-by-section editing during a condense pass is the most common way this is missed — a duplicate introduced in one section isn't caught by re-reading that section alone, only by a doc-wide grep after all edits land.

## 6. Cross-References

When creating, `Glob: tasks/**/current.md` and add bidirectional `Related:` refs for any connected domains.

### Reconcile back-references (on update)

The §1 scan finds docs to update from code changes, inputs, and verbal requests — i.e. docs that *own* work. But some docs own no work; they only **mirror** the status of a feature: roadmaps, index/hub docs, and any doc that lists the changed feature in a row or links it via `Related:`. Nothing in a git diff points at them, so a work-driven scan never reaches them and their mirrored status drifts silently — a roadmap row still says "uncommitted" weeks after the feature shipped.

So after you finish updating a feature doc, close the loop on what *refers back* to it:

1. `Grep tasks/**/*.md` for the updated doc's path **and** its feature name/vocabulary.
2. For each doc that mentions it — especially roadmap rows, hub tables, and `Related:` lists — check whether the **status it mirrors still matches reality**. If the feature shipped, flip the mirrored status (and any stale "uncommitted / pending / not pushed" hedges) to match.
3. This is a status-sync, not a rewrite — touch only the row/line that references the feature, leave the rest of the index doc alone.

A good signal you've found a mirror that needs syncing: the referencing doc describes the feature in the past tense of an *older* state than the doc you just updated.

⚠️ **If the session FIXED a bug, also grep the DEFECT's own vocabulary — not just the feature's.** A doc describing a bug you just fixed is stale in a way a feature-name grep structurally cannot find: it may never mention the feature at all, only the defect. Grep the symptom/flag/command the gotcha names (`RELOAD_NGINX`, `nginx -s reload`, the error string), plus its hedges ("still", "until they're fixed", "can never", "not yet"). Every hit that asserts the bug is LIVE must flip to fixed — with the *reason* it's now safe, so nobody re-introduces it.

This is higher-severity than a stale status. A stale status is merely out of date; a stale gotcha **actively misleads** — the next session reads "the workflows still do X" and either re-fixes a solved bug or routes around a problem that no longer exists. Run this grep even when the fix is uncommitted: mark it "fixed (uncommitted)" rather than leaving the doc asserting a live bug.
