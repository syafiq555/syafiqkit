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

| Section | Action |
|---------|--------|
| `LLM-CONTEXT` | Update Status + Last updated |
| `## Task Status` | Tick off completed rows |
| `## Bugs Fixed` | Append new bugs |
| `## Critical Gotchas` | Append new rows to Backend or Frontend table |
| `## Key Technical Decisions` | Append new rows |
| `## Files` | Add new files if introduced |
| `## Next Steps` | Remove done, add pending |
| `## Last Session` | **Overwrite** (not append) with 2–3 bullets of what changed this session |

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
