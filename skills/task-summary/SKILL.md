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

The density rules below apply to *every* write in steps 3–4 — they're what keep the doc from bloating. Doc already over budget (see Size budget below)? Delegate to `condense-task-doc` rather than hand-rolling — don't reimplement its row-existence pass here.

## Density rules (apply to every write — this is what keeps docs from bloating)

**Goal**: minimum tokens, maximum actionability. A cold-start session reads the doc once and acts correctly — no re-reads, no guessing.

Two failure modes kill these docs: the same fact restated in 4-5 sections, and bloated sentences. Enforce both layers:

### Layer 1 — one fact, one home

| Rule | Detail |
|------|--------|
| **One fact, one home** | Each fact lives in EXACTLY one section. LLM-CONTEXT + Quick Start *point* to the canonical section — they do NOT restate it. A fact is either a Decision (*why*) OR a Gotcha (*what breaks*) — never both. |
| **LLM-CONTEXT is a pointer index** | `Gotchas:` block = 1-line teasers naming the section to read — not a copy of the table. |
| **Quick Start ≤15 lines** | State + next action only — never re-explain a Decision/Gotcha. |
| **Commit/deploy status is one fact too** | "Uncommitted" / "committed, not yet deployed" / "LIVE in production" goes ONLY in Quick Start's state line. LLM-CONTEXT's `Last updated:` line points there ("see Quick Start") instead of restating the phrase — during a ship the status changes minutes apart, and a phrase mirrored in 2+ places means editing it twice every time. |
| **An external tracker ID (ClickUp/Jira/Linear) belongs in `Related:`, not just in prose** | If a session pulls in a ticket ID to explain *why* a status changed, mentioning it in `Last updated`/`Last Session` is not enough — it reads there once and is gone next overwrite. Add it to `Related:` too (its durable home) the same write, don't wait to be asked. |

### Layer 2 — sentence style (every sentence you write)

Base rules: `_shared/references/writing-style.md`. Additional rules for task docs:

| Rule | Detail |
|------|--------|
| **Rows ≤2 sentences** | Rule + single strongest reason. Rejected-alternative essays and verification narratives get deleted; git history owns them. |
| **No metrics/hashes in rows** | Commit hashes = Last Session only. Verification = one word ("verified"). |

### Size budget

`current.md` should stay **under 300 lines**, measured by byte size (`wc -c`), not line count — a whole-doc MADR rewrite can legitimately grow lines while shrinking bytes (a dense table cell becomes several short ADR Consequence bullets). Compare `wc -c` against the last committed version (`git show HEAD:<path> | wc -c`) before forcing a condense; flat/shrunk bytes means the doc restructured, not bloated. Already over budget by bytes → condense FIRST via `condense-task-doc` rather than hand-rolling — its row-existence pass (delete gotcha/decision rows discoverable-from-code) is the step most likely skipped when improvising; sentence-tightening alone on a 40+-row doc isn't a real reduction.

⚠️ **MADR is the default decision structure.** Every `## Key Technical Decisions` entry is an MADR block (Problem/Decision/Rejected/Consequences/Status, per templates.md) by default, not an upgrade for decision-heavy docs. Escape to a plain `| Decision | Rationale |` row only when no alternative was genuinely considered. Whole-doc MADR already over budget after legitimate growth → split into index + `decisions/<theme>.md` (templates.md) as part of the current write, don't ask first.

Litmus tests before finishing (also see Validate §5.8): (1) grep the doc for its 2-3 most critical phrases — >2 sections containing one means collapse the extras to pointers; (2) scan for sentences with 2+ parentheticals or commit hashes outside Last Session — rewrite them.

## 1. Resolve Path

⚠️ **Before scanning: is another writer mid-rewrite on these docs?** A background `Agent` still running, or `git status` showing `tasks/` files you never touched (a parallel session). If so, do NOT run the multi-domain scan — it will edit the contested docs and clobber work you can't see. Verify read-only instead (report gaps for the owner to fix), or scope to the one doc you own. A writer reads a file when it starts, not when it finishes.

| Input | Action |
|-------|--------|
| Full path | Use as-is |
| Domain/feature | Expand to `tasks/<domain>/<feature>/current.md` |
| Empty / task description | **Multi-domain scan** — see below |

### Multi-Domain Scan (when no explicit path given)

⚠️ **Do NOT assume one domain per session.** Scan the full conversation for ALL domains that need task docs:

1. **Code changes**: `git status --short` (every repo in a multi-repo project) → infer domains from file paths. ⚠️ Not `git diff --name-only` — it hides staged AND untracked files, so it returns **empty** once you've staged, and you'd conclude "no code changed" and skip every doc. A nothing result for work you just did = the blind spot, not a clean tree
2. **External inputs**: WhatsApp messages, emails, Slack, screenshots, ClickUp pastes — extract every distinct issue/feature/bug mentioned
3. **Verbal requests**: User said "also note X", "don't forget Y", "the other issues" → those are domains too

⚠️ **Map each to its EXISTING doc by content, not by folder name.** A changed file path or feature name rarely matches the doc's folder (code `src/modules/qc-review/` → doc `setup/upload-redesign/`; folder names are engineer-domain-named). Delegate raw candidate-gathering to the `Explore` agent, one call per domain/feature (or one batched prompt covering all): `Glob tasks/**/*.md` (incl `_archive/` + flat `tasks/<domain>/<feature>.md`) and `Grep` for the concept's vocabulary + synonyms across doc body + header. The mapping judgment — which candidate is the actual match, given folders rarely match feature names — stays inline against the returned raw data. Delegation rules: `_shared/references/explore-delegation.md`. Follow any `Merged into`/`Supersedes` redirect that still exists to the live doc (older repos may have legacy stubs; new merges no longer create them — see §2a). This prevents creating a duplicate doc when one already exists under a different folder name.

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

⚠️ **Strip tool-output wrapper artifacts before writing** — applies whether creating fresh or rewriting the whole doc. See `_shared/references/strip-tool-output-tags.md`.

## 4. When Updating

Edit in place. The doc should always read as one coherent current-state document.

⚠️ **MANDATORY first: gap-check AND structure-check against the template** (a user asking to "check for template drift" means exactly this pass — the doc's divergence from `references/templates.md`, NOT any PDF/Blade template in the code). Before editing:
1. List the doc's `## ` headers — add any missing from the template's required set.
2. Verify each existing section's internal structure matches the template exactly (table columns, field names, order) — fix non-conformant structure in place (e.g. free-form bullets where `| Issue | Rule |` is specified, wrong Bugs Fixed columns, missing Backend/Frontend split in Gotchas).

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
| Whole doc | Over budget by bytes → condense first (see Size budget above). |
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

The §1 scan finds docs to update from code changes, inputs, and verbal requests — i.e. docs that *own* work. Some docs own no work; they only **mirror** a feature's status: roadmaps, index/hub docs, anything listing the feature in a row or `Related:` link. Nothing in a git diff points at them, so a work-driven scan never reaches them and their mirrored status drifts silently — a roadmap row still says "uncommitted" weeks after ship.

After updating a feature doc, close the loop on what *refers back* to it:

1. `Grep tasks/**/*.md` for the updated doc's path **and** its feature name/vocabulary.
2. For each doc that mentions it — roadmap rows, hub tables, `Related:` lists — check whether the **status it mirrors still matches reality**; flip stale "uncommitted/pending/not pushed" hedges to match.
3. Status-sync, not a rewrite — touch only the row/line referencing the feature, leave the rest of the index doc alone.

Signal you've found a mirror needing sync: the referencing doc describes the feature in the past tense of an *older* state than the doc you just updated.

⚠️ **If the session FIXED a bug, also grep the DEFECT's own vocabulary — not just the feature's.** A doc describing a fixed bug may never mention the feature at all, only the defect — a feature-name grep structurally can't find it. Grep the symptom/flag/command the gotcha names (`RELOAD_NGINX`, the error string) plus its hedges ("still", "until they're fixed", "can never"). Every hit asserting the bug is LIVE must flip to fixed, with the *reason* it's now safe. Higher-severity than a stale status: a stale status is out of date, a stale gotcha **actively misleads** — the next session reads "still does X" and re-fixes a solved bug or routes around a non-problem. Run this even if the fix is uncommitted: mark "fixed (uncommitted)" rather than leave the doc asserting a live bug.

⚠️ **If the session MOVED a fact — split a doc, extracted a section, renamed an anchor — grep the FILE/ANCHOR name, not the claim.** The two greps above hunt a claim that turned false; a move leaves every claim **true** and only the *routing* wrong, so neither trigger fires. Nothing 404s, the emptied file still resolves — it's just become a router, and every `📖 <file>` that promised a fact now lands the reader where the fact isn't. The file you changed cannot fix the files that point at it, so this only happens if you go looking: `grep -rn "escrow-engine.md" tasks/` and repoint each hit at the leaf that now owns the fact. Prioritize `Gotchas:` teasers and `Next Steps` items — their contract is "one-line fact + the file with detail", so a reader may act on the teaser alone. Then mark the emptied file a router in the index, or the next reader stops there and reads zero decisions.
