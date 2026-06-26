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

Two failure modes kill these docs: **the same fact restated in 4–5 sections**, and **bloated sentences** (run-ons stuffed with parentheticals, commit hashes, and verification numbers). Enforce both layers:

### Layer 1 — one fact, one home

| Rule | Detail |
|------|--------|
| **One fact, one home** | Each fact lives in EXACTLY one section. LLM-CONTEXT + Quick Start *point* to the canonical section ("see Gotcha X / Decision Y"), they do NOT restate it. A fact is either a Decision (*why we chose this*) OR a Gotcha (*what will break you*) — never both. |
| **LLM-CONTEXT is a pointer index** | The `Gotchas:` block in LLM-CONTEXT is 1-line teasers that name the section to read — not a second copy of the Gotchas table. |
| **Quick Start ≤15 lines** | State + next action only — never re-explain a Decision/Gotcha. Full spec: *Quick Start Section* below. |

### Layer 2 — sentence style (every sentence you write)

| Rule | Detail |
|------|--------|
| **Short declarative sentences** | One idea per sentence. ≤1 parenthetical per sentence. No arrow-chain shorthand (`A → B → fails`) — write it out. |
| **Rows ≤2 sentences** | A Gotcha/Decision cell holds the rule + the single strongest reason. If the rationale needs more, CONDENSE it — do not relocate it. Rejected-alternative essays and verification narratives get deleted; git history owns them. |
| **No metrics/hashes in rows** | Commit hashes live ONLY in Last Session. Verification detail is one word ("verified") — the numbers live in the commit message. |
| **Capture filter** | Keep a fact only if a future session would ACT DIFFERENTLY knowing it: decisions still in force, gotchas that still bite, current state, next steps. Process history (what was reviewed, how it was tested, what order things happened) fails this test. |

### Size budget

`current.md` should stay **under 300 lines**. If the doc is already >300 lines when you open it for an update, run a condense pass FIRST (apply Layer 2 to existing rows, collapse finished Task Status streams, trim Files to a living map), then write your update.

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

⚠️ **Map each to its EXISTING doc by content, not by folder name.** A changed file path or feature name rarely matches the doc's folder (code `src/modules/qc-review/` → doc `setup/upload-redesign/`; folder names are engineer-domain-named). For each domain/feature found above, `Glob tasks/**/*.md` (incl `_archive/` + flat `tasks/<domain>/<feature>.md`) and `Grep` for the concept's vocabulary + synonyms across doc body + header — never assume the folder slug matches. Follow `Merged into`/`Supersedes` redirects to the live doc. This prevents creating a duplicate doc when one already exists under a different folder name.

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

## 2a. When Merging (user requests `merge A into B`)

When the user explicitly requests merging two docs:

1. **Read both docs** in full before writing anything.
2. **Choose the canonical path** — keep the richer/primary doc's path as the merge target. The secondary doc's path becomes the redirect stub.
3. **Write the merged doc** to the canonical path — combine all sections (Decisions, Gotchas, Files, Bugs) without duplicating rows. Update LLM-CONTEXT `Domain` to reflect both concerns (e.g. `student/exam-taking + admin/exam-sets`).
4. **Replace the secondary doc** with a redirect stub — do NOT delete it (breaks `rg` discoverability). Strip the secondary doc's LLM-CONTEXT block entirely — the stub must NOT have one:
   ```markdown
   <!-- Reason: [one sentence on why they're coupled] -->
   # Merged into: tasks/<canonical>/current.md
   ```
   The `# Merged into:` heading is visible to both humans and `rg`. The `Reason:` stays in the comment to avoid cluttering rendered output.
5. **Update back-references** — run §5 Validate + §6 Cross-References on the merged doc and every doc that referenced either old path. §6's roadmap/hub sweep covers more than just `Related:` fields — don't stop at `Related:` alone.

| ❌ Never | ✅ Always |
|---------|---------|
| Delete the secondary doc outright | Leave a redirect stub — `rg` must be able to find the old path |
| Keep an LLM-CONTEXT block in the stub | Strip it — the stub is a pointer, not a live doc |
| Only update `Related:` fields in back-references | Run full §6 sweep — roadmap rows and hub tables also mirror status |

## 3. When Creating

Use the **Full Template** from `references/templates.md` as the gold standard. Scale down to Minimal only for single bug fixes or short sessions.

LLM-CONTEXT required fields: `Status`, `Domain`, `Related`, `Last updated`.

**Mermaid diagrams**: Use freely in any section where a visual helps — architecture, data flow, layout, feature hierarchy, state transitions. Not limited to one section.

## 4. When Updating

Edit in place. The doc should always read as one coherent current-state document.

⚠️ **MANDATORY first: gap-check against the template, don't just edit existing sections.** An in-place update inherits whatever sections the doc already has — a planning stub that just shipped is usually MISSING `## Key Technical Decisions`, `## Critical Gotchas`, `## Bugs Fixed`, `## Next Steps`. Before editing, list the doc's `## ` headers and compare to the template's required set; ADD any missing section. A decision/gotcha/bug captured only in `## Last Session` is a bug — Last Session is overwritten next run, so those facts must live in their typed table, not the narrative.

| ❌ Never | ✅ Always |
|---------|---------|
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
| `## Key Technical Decisions` | Append new rows |
| `## Files` | Add new files if introduced |
| `## Next Steps` | Remove done, add pending |
| `## Last Session` | **Overwrite in place — ONE session only, ≤5 bullets, ≤2 lines each.** Delete the previous session's bullets entirely (never append a dated bullet below them — that's a changelog). Before deleting, fold any still-load-bearing fact into its proper Decision/Gotcha row. Parallel sessions: overwrite only your own content, but the one-session cap still holds. |

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
| Whole doc | >300 lines → mandatory condense pass before your update (see Size budget) |
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
3. Next Steps has no stale completed items
4. No rows deleted
5. Back-references reconciled (§6) — no roadmap/index/`Related:` doc still mirrors an out-of-date status for the feature you just updated

## 6. Cross-References

When creating, `Glob: tasks/**/current.md` and add bidirectional `Related:` refs for any connected domains.

### Reconcile back-references (on update)

The §1 scan finds docs to update from code changes, inputs, and verbal requests — i.e. docs that *own* work. But some docs own no work; they only **mirror** the status of a feature: roadmaps, index/hub docs, and any doc that lists the changed feature in a row or links it via `Related:`. Nothing in a git diff points at them, so a work-driven scan never reaches them and their mirrored status drifts silently — a roadmap row still says "uncommitted" weeks after the feature shipped.

So after you finish updating a feature doc, close the loop on what *refers back* to it:

1. `Grep tasks/**/*.md` for the updated doc's path **and** its feature name/vocabulary.
2. For each doc that mentions it — especially roadmap rows, hub tables, and `Related:` lists — check whether the **status it mirrors still matches reality**. If the feature shipped, flip the mirrored status (and any stale "uncommitted / pending / not pushed" hedges) to match.
3. This is a status-sync, not a rewrite — touch only the row/line that references the feature, leave the rest of the index doc alone.

A good signal you've found a mirror that needs syncing: the referencing doc describes the feature in the past tense of an *older* state than the doc you just updated.
