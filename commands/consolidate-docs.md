---
description: Consolidate related task documents — investigates, proposes options, executes the user's chosen path
argument-hint: "[domain or domain/feature — optional]"
disable-model-invocation: true
---

# Consolidate Task Documents

A conversational workflow for reducing task-doc sprawl. You **investigate first**, **present options via AskUserQuestion**, then **execute the chosen path**. No rigid mode flags — the situation dictates what's needed.

**Goal**: end state = 3–5 active docs per domain + one `_archive/` folder + load-bearing patterns migrated to the nearest `CLAUDE.md`.

---

## Principles (apply throughout)

| ❌ Don't | ✅ Do |
|---------|-------|
| Jump straight to merging/archiving | Audit staleness first — git log + code spot-check before deciding any doc's fate |
| Rewrite a doc that's still being actively edited | Leave docs with recent commits + "Next Steps" alone; only touch frozen/stable reference docs |
| Duplicate gotchas in task doc + CLAUDE.md | Task doc = incident narrative (who/when/what broke); CLAUDE.md = reusable rule. Archive-bound docs must migrate rules BEFORE the archive move |
| `rm` originals | `git mv` to flat `<domain>/_archive/<name>.md` — preserves history, file tree stays clean |
| Nested `<feature>/archive/current.md` | Flat `<domain>/_archive/<name>.md` — IDE file tree shows N active dirs + 1 collapsed `_archive/`, not 2N mostly-empty dirs |
| Guess at lifecycle state | Ask. Use AskUserQuestion with 2–4 options per decision |

---

## Step 1: Scope

Resolve what the user means:

| Input | Action |
|-------|--------|
| `domain/feature` (e.g. `invoice/duplicate-fix`) | Single-doc scope — probably wants a specific merge. Read that doc + its `Related:` neighbors |
| `domain` (e.g. `invoice`) | Domain-wide scope — likely wants to tidy the whole tree. `Glob: tasks/<domain>/**/current.md` |
| Empty | Ask: "Which domain should I consolidate?" — offer top 3 domains by doc count |

Read every candidate doc. Don't skim — the LLM-CONTEXT header tells you Status and Related; the body tells you whether the feature is still evolving.

---

## Step 2: Staleness Audit

For each candidate, collect:

```bash
git log -1 --format="%ad | %s" --date=short -- <path>   # Last touch
git log --oneline --follow -- <path> | wc -l            # Total commits
```

Then spot-check 2–3 code claims from each doc against live code (file paths, line numbers, function signatures mentioned in the doc). If claims diverge from reality, the doc is stale in a dangerous way — flag it.

Classify each doc:

| Signal | Classification | Default action |
|--------|---------------|---------------|
| Recent commit + "Next Steps" populated + Status 🔨/🚀 | **Active** | Leave alone |
| No edits in 2+ months + Status ✅ + claims still match code | **Stable reference** | Candidate for fold-into-CLAUDE.md + archive |
| Single commit ever (written once, never revisited) | **Frozen narrative** | Candidate for archive |
| Claims diverge from current code | **Stale (dangerous)** | Flag to user — does the doc need correcting or archiving? |
| Incident-specific (one-off production fix, data cleanup) | **Historical fix** | Candidate for merge into `historical-fixes/current.md` |

Present the audit as a table to the user before proposing anything.

---

## Step 3: Propose (AskUserQuestion)

Based on the audit, craft 2–4 options. Examples of questions worth asking — adapt to the actual situation:

- **"How aggressive should consolidation be?"** — light touch (archive 2–3 frozen), medium (merge related pairs + archive), aggressive (collapse to 3–4 active docs + single `_archive/`)
- **"What name for the merged historical doc?"** — `historical-fixes`, `data-integrity`, `fixes-log`
- **"Preserve Mermaid diagram from X?"** — fold into CLAUDE.md, drop, or keep standalone
- **"Archive path pattern?"** — flat `_archive/<name>.md` (recommended), nested `<feature>/archive/current.md`, or delete

Always recommend the option you think fits; add `(Recommended)` to its label. Let the user pick or type "Other" with their own plan.

For any Mermaid diagrams, line-range claims, or "fold into CLAUDE.md" proposals, **verify the target location still exists** before proposing — don't promise to fold into a section that was renamed away.

---

## Step 4: Migrate Patterns to CLAUDE.md (before any archive move)

For every doc that's about to be archived or merged, grep for **durable patterns** — things a fresh Claude session needs to know even after the task doc is gone:

| Pattern type | Where it belongs |
|--------------|------------------|
| Maintenance commands (artisan, npm scripts) | Domain `CLAUDE.md#{commands}` table |
| `❌ NEVER / ✅ ALWAYS` rules that apply beyond one feature | Domain `CLAUDE.md` (new gotcha table row) |
| Architecture diagrams that shape future edits | Domain `CLAUDE.md#{lifecycle}` or similar |
| Storage-format gotchas (e.g. "field is stored in two formats") | Layer `CLAUDE.md` (`app/CLAUDE.md`) |
| Cross-domain patterns | `tasks/shared/gotchas-registry.md` |

**Before archiving a doc, each of these must already live in a `CLAUDE.md`** — the archive is a narrative record, not a rules source. Run a grep after migration to confirm:

```
Grep: pattern="<key phrase from migrated pattern>", path="app/**/CLAUDE.md CLAUDE.md"
```

If the grep returns nothing, the migration didn't land — fix before moving on.

---

## Step 5: Execute — Merge Mode

When the user picks "merge these docs into a single reference":

1. **Build the merged doc** at `tasks/<domain>/<merged-name>/current.md` (usually `historical-fixes/`).
2. Structure:
   - LLM-CONTEXT header with `Status`, `Domain`, `Related`, `Last updated`
   - `## Overview` — one paragraph on what this doc is
   - `## Fixes Index` — scannable table linking to each section
   - Per-fix sections: root cause, fix (with file:line refs), maintenance commands, pointer to CLAUDE.md for durable patterns
   - `## Bugs Fixed` — consolidated severity table across all merged fixes
   - `## Last Session` — 2–3 bullets on what this consolidation changed
   - `## Next Steps` — usually empty ("append new fixes above")
3. **Do NOT duplicate** CLAUDE.md content. When tempted to paste a gotcha table, write a pointer instead:
   > Full error-code table in `app/Domain/X/CLAUDE.md#{myinvois-gotchas}`.
4. Keep each section terse — the merged doc exists for "have we seen this before?" lookups, not deep study.

File-standards rules apply: max 80 lines per Edit. Write the skeleton first, then Edit sections in.

---

## Step 6: Execute — Archive Mode

When the user picks "archive these stale docs":

```bash
mkdir -p tasks/<domain>/_archive
git mv tasks/<domain>/<feature>/current.md tasks/<domain>/_archive/<feature>.md
# For docs with sibling files (SQL scripts, session logs) belonging to the same archive:
git mv tasks/<domain>/<feature>/swap.sql tasks/<domain>/_archive/<feature>.sql
# Remove now-empty parent dir:
rmdir tasks/<domain>/<feature>
```

Gotchas encountered in practice:

| Symptom | Cause | Fix |
|---------|-------|-----|
| `git mv: ... has changes staged in the index` | File was renamed once this session, now being renamed again | `git mv -f` or chain via `git rm --cached` + rewrite |
| `rmdir: Directory not empty` | Nested `archive/` subdir still exists | `rmdir <feature>/archive && rmdir <feature>` (two calls) |
| Doc has non-`.md` companions (SQL, JSON fixtures) | They're part of the incident record | Move them to `_archive/` with descriptive suffix (`<feature>-sql-log.sql`) |

Never delete. `git mv` preserves history so `git log --follow tasks/<domain>/_archive/<name>.md` still shows the full evolution.

---

## Step 7: Fix Cross-References

After any archive or merge, hunt down broken `Related:` pointers:

```
Grep: pattern="tasks/<domain>/<moved-feature>/current.md", path="tasks/", glob="**/current.md"
```

Run once per moved path. For each hit, open the referencing doc and update:

| Old | New |
|-----|-----|
| `tasks/<domain>/<feature>/current.md` (moved to `_archive/`) | `tasks/<domain>/_archive/<feature>.md` or `tasks/<domain>/historical-fixes/current.md#{section}` |
| Inline link to merged doc | Link to new merged path with anchor |

Also check the project root `CLAUDE.md` — the `#{tasks}` domain index table usually lists active docs per domain. If you changed the active set, update that row.

---

## Step 8: Report

Show the user a before/after comparison and what moved where:

```markdown
## Consolidation Summary

**Before**: N active docs (~M lines total)
**After**: X active docs + 1 `_archive/` folder

### Active (X)
| Doc | Role |
|-----|------|
| ... | ... |

### Archived via git mv (Y docs, recoverable)
- `_archive/<name>.md` (was `<feature>/current.md`)

### Patterns migrated to CLAUDE.md
- `<CLAUDE.md path>#{anchor}` — [what was added]

### Cross-references updated
- `<doc path>`:<line> — [what changed]

Run `git diff --stat` to see the full scope. Commit message suggestion:
`docs(<domain>): consolidate N task docs into historical-fixes + _archive`
```

---

## Step 9: Post-Consolidation Hygiene

After the user reviews the diff:

1. Suggest they run `/syafiqkit:done` to capture any session-specific learnings
2. Remind them to commit with a single atomic commit (don't split merge + cross-ref fixes — keeps blame clean)
3. If GitNexus is indexed, note: docs-only changes don't need re-analyze (it indexes code, not markdown)

---

## Anti-Patterns (spotted in this codebase's history)

| Anti-pattern | Why it's bad | Correct |
|--------------|--------------|---------|
| 9 task docs for one domain | Readers can't find canonical info; `/read-summary` returns overlapping results | 3–5 active docs max; historical-fixes for everything else |
| `<feature>/archive/current.md` per feature | File tree shows 2N directories when N are active — visual clutter | Flat `_archive/<name>.md` |
| Gotcha tables repeated in task doc + CLAUDE.md | Two places to update when rule changes — guaranteed drift | Rule in CLAUDE.md; task doc points |
| Archive doc without first migrating patterns | Rules disappear from the searchable surface (`/read-summary`, always-loaded CLAUDE.md) | Migrate durable patterns first, THEN archive |
| "Consolidation log" sections inside CLAUDE.md | CLAUDE.md is loaded every session — logs waste tokens | Keep consolidation history in commit messages, not CLAUDE.md |
