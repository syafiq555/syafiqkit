---
name: commit-invoice-generator
description: Generate invoice line items from git commit history. Analyzes commits to create billable service descriptions with estimated hours. Use when creating invoices, billing for development work, analyzing commit patterns for time tracking, or when user mentions "invoice", "billable hours", or "time log".
---

# Commit Invoice Generator

Generate invoice line items from git commits with hour estimates.

## Workflow

1. Get date range (default: today + yesterday)
2. Extract commits: `git log --since="YYYY-MM-DD" --until="YYYY-MM-DD" --format="%h %s (%ad)" --date=short`
3. Analyze complexity, group related commits
4. Estimate hours, output invoice table

## Hour Estimation

| Type | Base Hours | Notes |
|------|------------|-------|
| `feat` | 1.5 - 4.0 | +1h new service/model, +0.5h UI |
| `fix` | 0.25 - 1.5 | Quick ~15min, complex ~1.5h |
| `refactor` | 1.0 - 2.5 | Scope-dependent |
| `perf` | 1.0 - 2.0 | Requires profiling |
| `chore` | 0.25 - 0.5 | Config, deps |
| `docs`/`style` | 0.25 | Often non-billable |

**Complexity modifiers**: +0.5h (migrations, complex UI, multiple services), +1h (external API)

**Agent-assisted**: Reduce estimates 40-60%

## User Time Logs

If provided (e.g., "2:20pm - 2:36pm"):
- Use exact times, round to 0.25h
- Keep their descriptions

## Output Format

```markdown
## Invoice Line Items — Development Work (Date Range)

| Date | Service Description | Duration | Hours |
|------|---------------------|----------|------:|
| DD/MM/YYYY | **Title** — Brief description | HH:MM – HH:MM | X.XX |

### Summary

| | Hours |
|---|------:|
| Item 1 | X.XX |
| **Total Billable Hours** | **X.XX** |
```

## Best Practices

- Group related commits into one line item
- Use client-facing language, not commit messages
- Conservative estimates for agent-assisted work
- Skip docs/style unless client wants them
