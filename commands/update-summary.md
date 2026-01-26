---
description: Append new findings to existing task summary. Use after completing work on an existing feature, fixing bugs, or when session added new insights to document.
argument-hint: "[optional: domain/feature or full path]"
---

Incrementally update task summaries based on recent session work.

## Path Resolution

| $ARGUMENTS | Target |
|------------|--------|
| Provided | Use as-is (supports full paths) |
| Empty | Scan conversation → `tasks/<domain>/<feature>/current.md` |
| File missing | Abort: "No summary found. Use `/write-summary` first." |

## Workflow

### 1. Read Existing Summary
Use Read tool on target file before making changes.

### 2. Identify New Content
Review session for:
- API endpoints, database changes, file modifications
- Bugs and solutions
- Configuration/environment updates
- Decisions with rationale

### 3. DRY Check

| Question | Action |
|----------|--------|
| In another task doc? | Cross-reference, skip duplication |
| Shared pattern (auth, pagination)? | Add to `CLAUDE.md`, reference here |
| Appears in 2+ features? | Designate canonical doc, cross-ref others |

**Cross-reference format:**
```markdown
> See [`path/to/file.md#anchor`](../path/to/file.md#anchor) — [1-line summary]
```

### 4. Section Update Rules

| Section | Strategy |
|---------|----------|
| Status line | Update emoji, timeline |
| Decisions table | Prepend new row (recent first) |
| API Endpoints table | Append new only |
| Gotchas table | Prepend with observable symptoms |
| Checklist | Check completed items, add new |

**Preserve**: Existing gotchas, completed checklists, historical decisions

### 5. Gotcha Format (Required)

| Error/Symptom | Root Cause | Solution |
|---------------|------------|----------|
| `500 on POST /invoices` | Timezone mismatch | `->setTimezone('UTC')` |

First column must contain: error code, log fragment, or user-visible symptom.

### 6. Final Check
- Count lines; if > 500, suggest condensing
- Verify gotchas have symptoms
- Confirm no content removed

## Output
- 3-5 bullet summary of updates
- Current line count
- Condensing suggestion if needed
