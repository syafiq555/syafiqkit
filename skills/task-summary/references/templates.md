# Task Summary Templates

## LLM-CONTEXT Block

Place at the very top of `current.md`:

```markdown
<!--LLM-CONTEXT
Purpose: [One sentence describing what this feature/task does]
Key files: [Comma-separated list of primary files]
Related: [Links to related task docs or "None"]
-->
```

### Field Guidelines

| Field | Content | Example |
|-------|---------|---------|
| `Purpose` | What problem this solves, not how | "Manage participant enrollment lifecycle" |
| `Key files` | 3-5 most important files | `app/Services/EnrollmentService.php, app/Models/Participant.php` |
| `Related` | Other task docs with connections | `tasks/training/jd14/current.md, tasks/shared/gotchas-registry.md` |

### Related Field Syntax

```markdown
Related: tasks/training/participant/current.md, tasks/billing/invoice/current.md
Related: None (standalone feature)
Related: tasks/shared/patterns.md (for shared utilities)
```

## Status Values

| Status | Meaning | When to Use |
|--------|---------|-------------|
| `Active` | Currently being worked on | Default for new/resumed work |
| `Done` | Feature complete, no active work | When shipping/closing |
| `Blocked` | Waiting on external dependency | Document what's blocking |
| `Reference` | Ongoing reference, not a task | For patterns, gotchas registries |

## Gotcha Table Format

Always include error messages/symptoms for searchability:

```markdown
## Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| `500 on POST /invoices` | Timezone mismatch in Carbon | `->setTimezone('UTC')` before save |
| `Undefined index: user_id` | Middleware order | Move `auth` before `tenant` |
| Tests pass locally, fail CI | PHP version drift | Sync `composer.lock` from prod |
```

### Bad vs Good Gotchas

| Bad (abstract) | Good (concrete) |
|----------------|-----------------|
| "Date handling can be tricky" | "`InvalidArgumentException: month overflow` → use `parse($m . '-01')` not `createFromFormat('Y-m', $m)`" |
| "Watch out for eager loading" | "`N+1 on /participants` → add `->with('enrollments')` to query" |

## Minimal Template (Auto-Create)

Used when PRIMARY doc is missing:

```markdown
<!--LLM-CONTEXT
Purpose: [Inferred from domain/feature path]
Key files: [Files modified this session]
Related: None
-->

# [Domain] - [Feature]

**Status**: Active

## Overview

[To be documented]

## Decisions

[To be documented]

## Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| | | |
```

## Full Template

For comprehensive documentation:

```markdown
<!--LLM-CONTEXT
Purpose: [One sentence]
Key files: [Primary files]
Related: [Related docs]
-->

# [Domain] - [Feature]

**Status**: Active

## Overview

[What this feature does and why it exists]

## Architecture

[Key components and how they interact]

## Decisions

| Decision | Rationale | Date |
|----------|-----------|------|
| [What was decided] | [Why] | [When] |

## Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| | | |

## Next Steps

- [ ] [Pending work item]

## References

- [PR #123](link) - Initial implementation
- [Slack thread](link) - Design discussion
```

## Cross-Reference Examples

### Adding to Related Field

When doc A relates to doc B:

**In A's current.md:**
```markdown
Related: tasks/training/participant/current.md
```

**In B's current.md (bidirectional):**
```markdown
Related: tasks/billing/invoice/current.md
```

### Inline Cross-References

Within document body:

```markdown
See [participant enrollment](../participant/current.md) for enrollment flow details.

This uses the [shared timezone helper](../../shared/patterns.md#timezone-helper).
```
