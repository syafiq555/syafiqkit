---
description: Update existing task summaries with session findings. Appends new content, updates status, checks related domains.
argument-hint: "[domain/feature or path]"
---

# Update Task Summary

Update task documentation to reflect this session's work.

## 1. Discover Related Docs

**Step 1**: Map session files to domains (e.g., `app/Domains/Training/...` → `training`)

**Step 2**: Glob `tasks/**/current.md` (with `path` param), check `LLM-CONTEXT → Related` for explicit mentions of session domains or modified files

**Step 3**: Classify as PRIMARY (main work) or SECONDARY (related/mentioned)

## 2. Handle Missing Docs

| Scenario | Action |
|----------|--------|
| PRIMARY missing | Auto-create (minimal template below; user can run `/write-summary` later for full setup) |
| PRIMARY exists, Status: Done | Append new session section, update Status to "Active" |
| SECONDARY missing | Skip + suggest: "Run `/write-summary <domain>` if recurring" |
| shared/* missing | Skip silently |

**Auto-create template**:
```markdown
<!--LLM-CONTEXT
Purpose: [Inferred from file changes]
Key files: [Files modified this session]
Related: [Link to PRIMARY domain if applicable]
-->

# [Domain/Feature Name]

**Status**: Active

## Session [Date]

[Summary of changes from this session]
```

## 3. Update Each Doc

| Action | What |
|--------|------|
| **Add** | Gotchas (with error messages), decisions with rationale, cross-references |
| **Update** | Status, completed items, outdated info, `LLM-CONTEXT → Related` |
| **Remove** | Completed next steps, obsolete workarounds |
| **Preserve** | Historical decisions, resolved bugs |

## 4. Archive Cleanup (Production Fixes Only)

Move incident-specific content out of `current.md`:

| Content | Move to |
|---------|---------|
| Production SQL | `archive/prod-fix-YYYY-MM-DD.sql` |
| Specific IDs/usernames | `archive/incident-YYYY-MM-DD.md` |

Reference: `> See [archive/...](archive/...) — incident details`

Skip for normal feature work.