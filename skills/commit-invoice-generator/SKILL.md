---
name: commit-invoice-generator
description: Generate invoice line items from git commit history. Analyzes commits to create billable service descriptions with estimated hours. Use when creating invoices, billing for development work, analyzing commit patterns for time tracking, or when user mentions "invoice", "billable hours", or "time log".
allowed-tools: Bash(git:*), Read, Grep, Glob
user-invocable: true
---

# Commit Invoice Generator

Generate professional invoice line items from git commits with realistic hour estimates.

## Workflow

1. **Get date range** from user (default: today + yesterday)
2. **Extract commits** using git log
3. **Analyze complexity** of each commit
4. **Group related commits** into logical service items
5. **Estimate hours** based on commit type and scope
6. **Output invoice table** in markdown format

## Step 1: Extract Commits

```bash
git log --since="YYYY-MM-DD" --until="YYYY-MM-DD" --format="%h %s (%ad)" --date=short
```

For more detail on specific commits:
```bash
git show --stat <commit-hash>
```

## Step 2: Hour Estimation Guidelines

Base estimates (agent-assisted development):

| Commit Type | Base Hours | Notes |
|-------------|------------|-------|
| `feat` (new feature) | 1.5 - 4.0 | +1h if new service/model, +0.5h if UI work |
| `fix` (bug fix) | 0.25 - 1.5 | Quick fixes ~15min, complex debugging ~1.5h |
| `refactor` | 1.0 - 2.5 | Depends on scope |
| `perf` | 1.0 - 2.0 | Usually requires profiling |
| `chore` | 0.25 - 0.5 | Config, deps, tooling |
| `docs` | 0.25 - 0.5 | Often non-billable |
| `style` | 0.25 | Usually non-billable |

### Complexity Multipliers

- **New database tables/migrations**: +0.5h
- **External API integration**: +1h
- **Chart.js/complex UI**: +0.5h
- **Multiple services touched**: +0.5h
- **Data migration/seeder**: +0.5h

### Agent-Assisted Adjustments

When user confirms they used Claude Code agents:
- Reduce base estimates by 40-60%
- Design/planning time remains similar
- Implementation time drops significantly
- Review/testing time still applies

## Step 3: Output Format

### Invoice Table

```markdown
## Invoice Line Items — Development Work (Date Range)

| Date | Service Description | Duration | Hours |
|------|---------------------|----------|------:|
| DD/MM/YYYY | **Title** — Brief description | HH:MM – HH:MM | X.XX |
```

### Summary Table

```markdown
### Summary

| | Hours |
|---|------:|
| Item 1 | X.XX |
| Item 2 | X.XX |
| **Total Billable Hours** | **X.XX** |
```

## Step 4: User Time Logs

If user provides actual time logs (e.g., "2:20pm - 2:36pm"), use those exact times:
- Calculate duration from timestamps
- Round to nearest 0.25 hour for billing
- Keep their descriptions

For commits without time logs, estimate based on complexity.

## Best Practices

1. **Group related commits** — Multiple commits for same feature = one line item
2. **Professional descriptions** — Client-facing language, not commit messages
3. **Conservative estimates** — Better to under-promise with agent-assisted work
4. **Ask for time logs** — Real data beats estimates
5. **Exclude non-billable** — Skip docs/style commits unless client wants them

## Example Output

```markdown
## Invoice Line Items — Development Work (5-11 January 2026)

| Date | Service Description | Duration | Hours |
|------|---------------------|----------|------:|
| 5/1/2026 | **TikTok Order Race Condition Fix** — Package ID availability during order creation | 2:20pm – 2:36pm | 0.25 |
| 7/1/2026 | **Marketplace Shipping Idempotency** — Prevent duplicate ship API calls | 4:00pm – 5:43pm | 1.75 |
| 10/1/2026 | **Customer Profile Dashboard** — CRM system with analytics, Chart.js, DataTables | 12:00pm – 3:30pm | 3.5 |

### Summary

| | Hours |
|---|------:|
| TikTok Order Race Condition Fix | 0.25 |
| Marketplace Shipping Idempotency | 1.75 |
| Customer Profile Dashboard | 3.5 |
| **Total Billable Hours** | **5.5** |
```
