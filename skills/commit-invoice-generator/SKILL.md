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
5. If updating an existing invoice doc, check whether to append to an existing entry vs create a new one (see below)

## New Invoice vs Updating an Existing One

When the target is an existing invoice-tracking doc (e.g. `tasks/billing/invoices/current.md`) with prior dated `## INV-YYYY-NNNN` entries:

| User says | Action |
|-----------|--------|
| "use/update the previous invoice", "add to the last invoice" | **Append line items to the most recent existing `## INV-…` entry** whose date range covers (or is adjacent to) the new commits — do NOT create a new invoice number. Update that entry's total and the LLM-CONTEXT status line. |
| "new invoice", "create an invoice", or no prior invoice covers this date | Create a new `## INV-YYYY-NNNN` block, next sequential number |
| Ambiguous and a prior invoice's date range already includes today | Default to appending to that invoice — a same-day/adjacent-day invoice is more often a continuation than a new bill |

⚠️ Always check the existing invoice doc's most recent entry's date range BEFORE assuming a new invoice number is wanted — the doc's own convention (one invoice can span 2+ days, e.g. "17–18/07/2026") is the strongest signal of what "the previous invoice" refers to.

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
