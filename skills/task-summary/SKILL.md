---
name: task-summary
description: This skill should be used when the user asks to "create task docs", "update task summary", "write summary", "find related docs", or when working with task documentation in `tasks/**/current.md`. Provides smart discovery of related task documents and cross-reference management.
user-invocable: false
---

# Task Summary Management

Guidance for discovering, creating, and updating task documentation optimized for humans and LLM agents.

## Core Concepts

**Path convention**: `tasks/<domain>/<feature>/current.md`

**LLM-CONTEXT block**: Machine-readable metadata at top of each doc for agent discovery.

**Cross-references**: Bidirectional links between related task docs via `Related:` field.

## Discovery Algorithm

### Step 1: Map Session Files to Domains

Extract domain from file paths modified in session:

| Path Pattern | Domain |
|--------------|--------|
| `app/Domains/{Name}/*` | lowercase(Name) |
| `app/Services/Shared/*` | `shared` |
| `app/Http/Controllers/{Name}/*` | lowercase(Name) |
| `resources/js/Pages/{Name}/*` | lowercase(Name) |
| `resources/js/components/*` | `frontend` |
| `database/migrations/*` | Check migration name for domain hint |

**Edge cases**:
- Files touching multiple domains → list all, pick PRIMARY by file count
- Shared utilities → skip unless 3+ usages (consolidate to `tasks/shared/`)

### Step 2: Scan Existing Task Docs

```
Glob: tasks/**/current.md (with path param)
```

For each doc found, read and check:
1. `LLM-CONTEXT → Related:` for explicit domain mentions
2. `LLM-CONTEXT → Key files:` for overlap with session files
3. Content for domain keywords

### Step 3: Classify Documents

| Classification | Criteria | Action |
|----------------|----------|--------|
| **PRIMARY** | Main work domain (highest file overlap) | Always update/create |
| **SECONDARY** | Mentioned in Related, or mentions PRIMARY | Update cross-refs |
| **SKIP** | No connection | Ignore |

### Step 4: Check Cross-References

Ensure bidirectional references:
- If doc A mentions doc B in `Related:`, doc B should mention A
- Detect orphaned references (one-way links)
- Flag for update if asymmetric

### Step 5: Handle Missing Docs

| Scenario | Action |
|----------|--------|
| PRIMARY missing | Auto-create minimal template |
| PRIMARY exists, Status: Done | Append new section, update Status → Active |
| SECONDARY missing | Skip + suggest: "Run `/write-summary <domain>` if recurring" |
| `tasks/shared/*` missing | Skip silently |

## Document Structure

See `references/templates.md` for:
- LLM-CONTEXT block structure
- Gotcha table format (Symptom | Cause | Fix)
- Status values and meanings
- Cross-reference syntax

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Include error messages in gotchas | Future search will match actual errors |
| Record "why" not just "what" | Context prevents re-debating decisions |
| Link PRs/issues/threads | External context stays discoverable |
| Update Status when work resumes | Prevents stale "Done" markers |
| Cross-reference bidirectionally | Both directions need the link |

## Integration with Commands

This skill provides discovery logic for:
- `/write-summary` - Creates new task docs
- `/update-summary` - Updates existing docs

Commands invoke this skill first, then execute their specific action.
