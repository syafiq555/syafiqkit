# Task Summary Templates

## LLM-CONTEXT Block

Place at the very top of `current.md`:

```markdown
<!--LLM-CONTEXT
Status: 🔨 In Progress
Domain: [domain name]
Key files: [Comma-separated list of primary files]
Gotchas: [One critical gotcha if any — omit line if none]
Related: [Links to related task docs or "None"]
Last updated: [YYYY-MM-DD]
-->
```

### Field Guidelines

| Field | Content | Example |
|-------|---------|---------|
| `Status` | Emoji + short state description | `🚀 Local E2E verified, prod pending` |
| `Domain` | Project domain name | `risk-analysis`, `invoice`, `payment` |
| `Key files` | 3-5 most important files | `app/Services/EnrollmentService.php, app/Models/Participant.php` |
| `Gotchas` | One-liner for the most critical gotcha | `API_URL must not include /api suffix` |
| `Related` | Other task docs with connections | `tasks/training/jd14/current.md, tasks/shared/gotchas-registry.md` |
| `Last updated` | ISO date of last edit | `2026-02-25` |

### Related Field Syntax

```markdown
Related: tasks/training/participant/current.md, tasks/billing/invoice/current.md
Related: None (standalone feature)
Related: tasks/shared/patterns.md (for shared utilities)
```

## Status Values

| Emoji | Status | Meaning | When to Use |
|-------|--------|---------|-------------|
| 🔨 | In Progress | Currently being worked on | Default for new/resumed work |
| ✅ | Complete | Feature complete, no active work | When shipping/closing |
| 🚀 | Testing/Staging | Verified locally, prod pending | After local E2E passes |
| ⏸️ | Blocked | Waiting on external dependency | Document what's blocking |
| 📋 | Planning | Not yet started | Pre-implementation planning |

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
Status: 🔨 In Progress
Domain: [domain]
Key files: [Files modified this session]
Related: None
Last updated: [today]
-->

# [Domain] - [Feature]

## Summary

[One sentence on what this feature does]

## Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| | | |

## Next Steps

- [ ] [Pending work item]
```

## Full Template

For comprehensive documentation:

```markdown
<!--LLM-CONTEXT
Status: 🔨 In Progress
Domain: [domain]
Key files: [Primary files]
Gotchas: [Critical gotcha one-liner if any]
Related: [Related docs or None]
Last updated: [today]
-->

# [Domain] - [Feature]

## Summary

[What this feature does and why it exists]

## Architecture

[Key components and how they interact — use diagram or table]

## Architecture Decisions

| Decision | Why |
|----------|-----|
| [What was decided] | [Why] |

## Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| | | |

## Next Steps

- [ ] [Pending work item]
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
