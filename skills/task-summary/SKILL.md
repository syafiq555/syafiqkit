---
name: task-summary
description: Create or update task summary documentation (current.md). Handles path resolution, domain inference, template selection, cross-references. Use for any task documentation workflow.
---

# Task Summary

Living documentation for humans and LLM agents. Always reflects current state — not a changelog.

## 1. Resolve Path

| Input | Action |
|-------|--------|
| Full path | Use as-is |
| Domain/feature | Expand to `tasks/<domain>/<feature>/current.md` |
| Empty | Check `tasks/` for existing domains, infer from session files |

## 2. Create or Update?

Read the resolved path first. If missing → **Create** using Full Template in `references/templates.md`. If exists → **Update** in place.

## 3. When Creating

Use the **Full Template** from `references/templates.md` as the gold standard. Scale down to Minimal only for single bug fixes or short sessions.

LLM-CONTEXT required fields: `Status`, `Domain`, `Related`, `Last updated`.

**Mermaid diagrams**: Use freely in any section where a visual helps — architecture, data flow, layout, feature hierarchy, state transitions. Not limited to one section.

## 4. When Updating

Edit in place. The doc should always read as one coherent current-state document.

| ❌ Never | ✅ Always |
|---------|---------|
| Append `## Completed (date)` sections | Edit existing sections in place |
| Add duplicate rows | Update the existing row |
| Delete historical rows | Append new rows; keep old ones |
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
| `## Last Session` | **Overwrite** (not append) with 2–3 bullets of what changed this session |

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
| `## Task Status` | All rows ✅ → collapse to single "All tasks complete" row |
| `## Bugs Fixed` | >10 rows → keep last 5, summarize older as "N earlier bugs fixed" |
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

## 6. Cross-References

When creating, `Glob: tasks/**/current.md` and add bidirectional `Related:` refs for any connected domains.
