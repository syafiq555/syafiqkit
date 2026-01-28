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

## Multi-Domain Sessions

Sessions often touch multiple domains. After updating the primary target:

1. **Search related docs**: `Glob tasks/**/current.md` to find other domains touched
2. **Update each relevant doc** with domain-specific changes
3. **Cross-reference**: Link between docs via LLM-CONTEXT `Related:` field
4. **Shared patterns**: If gotcha appears in 3+ domains, add to `tasks/shared/gotchas-registry.md`

Example: Participant enrollment work touches `training/participant/`, `training/jd14/`, `amendments/`

## Archive vs Delete

| Content | Action |
|---------|--------|
| Production SQL scripts, specific IDs | Move to `archive/` |
| Session logs, user stories | Move to `archive/` |
| Empty placeholder files | Delete |
| Timeless patterns/gotchas | Keep in `current.md` |

**Rule**: Archive preserves incident learning; only delete truly empty content.

## Workflow

### 1. Read Existing Summary
Use Read tool on target file before making changes.

### 2. Identify New Content
Review session for:
- API endpoints, database changes, file modifications
- Bugs and solutions
- Configuration/environment updates
- Decisions with rationale
- **Next steps** not completed this session

### 3. DRY Check

| Question | Action |
|----------|--------|
| In another task doc? | Cross-reference, skip duplication |
| Gotcha in 3+ domains? | Add to `tasks/shared/gotchas-registry.md` AND domain doc |
| Shared pattern (payment type, colors)? | Add to `tasks/shared/*.md`, reference here |
| Appears in 2+ features? | Designate canonical doc, cross-ref others |

**Cross-reference format:**
```markdown
> See [`path/to/file.md#anchor`](../path/to/file.md#anchor) — [1-line summary]
```

**Shared docs to check:**
- `tasks/shared/gotchas-registry.md` - Cross-domain gotchas
- `tasks/shared/payment-type-detection.md` - B2C/B2B patterns
- `tasks/shared/colors-and-theme.md` - Brand colors

### 4. Section Update Rules

| Section | Strategy |
|---------|----------|
| Status line | Update emoji, timeline |
| Decisions table | Prepend new row (recent first) |
| API Endpoints table | Append new only |
| Gotchas table | Prepend with observable symptoms |
| Checklist | Check completed items, add new |
| Next Steps | Add uncompleted work (if any) |

**Preserve**: Existing gotchas, completed checklists, historical decisions

### 5. Gotcha Format (Required)

| Error/Symptom | Root Cause | Solution |
|---------------|------------|----------|
| `500 on POST /invoices` | Timezone mismatch | `->setTimezone('UTC')` |

First column must contain: error code, log fragment, or user-visible symptom.

### 6. Next Steps (if any)

Only add if session has uncompleted planned work.

```markdown
## Next Steps
- [ ] Brief actionable item — context why needed
```

**Rules**:
- Skip section entirely if nothing pending
- Only items discussed/planned but not done this session
- Remove items once completed in future sessions
- Keep actionable (starts with verb)

### 7. Final Check
- Count lines; if > 500, suggest condensing
- Verify gotchas have symptoms
- Confirm no content removed

## Output
- 3-5 bullet summary of updates
- Current line count
- Condensing suggestion if needed
