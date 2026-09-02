---
name: commit-invoice-generator
description: Generate invoice line items from git commit history. Analyzes commits to create billable service descriptions with estimated hours. Use when creating invoices, billing for development work, analyzing commit patterns for time tracking, or when user mentions "invoice", "billable hours", or "time log".
---

# Commit Invoice Generator

Generate invoice line items from git commits with hour estimates.

## Workflow

1. **If the target is an existing invoice-tracking doc** (e.g. `tasks/billing/invoices/current.md`), read it FIRST and resolve append-vs-new before doing anything else (see below) — deciding this after the table is already drafted means redoing the work.
2. Get date range (default: today + yesterday)
3. Extract commits: `git log --since="YYYY-MM-DD" --until="YYYY-MM-DD" --format="%h %s (%ad)" --date=short`
4. Analyze complexity, group related commits
5. Estimate hours, output invoice table (append to the resolved entry, or create a new one, per step 1)

## New Invoice vs Updating an Existing One

When the target is an existing invoice-tracking doc with prior dated `## INV-YYYY-NNNN` entries:

| User says | Action |
|-----------|--------|
| "use/update the previous invoice", "add to the last invoice" | **Append line items to the most recent existing `## INV-…` entry** whose date range covers (or is adjacent to) the new commits — do NOT create a new invoice number. Update that entry's total and the LLM-CONTEXT status line. |
| "new invoice", "create an invoice", or no prior invoice covers this date | Create a new `## INV-YYYY-NNNN` block, next sequential number |
| Ambiguous and a prior invoice's date range already includes today | Default to appending to that invoice — a same-day/adjacent-day invoice is more often a continuation than a new bill |

⚠️ Always check the existing invoice doc's most recent entry's date range BEFORE assuming a new invoice number is wanted — the doc's own convention (one invoice can span 2+ days, e.g. "17–18/07/2026") is the strongest signal of what "the previous invoice" refers to.

⚠️ **A shared date is not a shared invoice — check whose commits the existing entry bills before appending to it.** On a repo with several contributors, an entry covering today can belong to someone else's workstream entirely, and the date test alone routes straight into merging two people's billing under one total. Settle it by commits, not dates: list the SHAs the existing entry names and check whether any of the ones you are about to bill appear there. No overlap means a separate entry on the same date, however strongly the dates suggest a continuation. When two same-date entries do end up side by side, say in each that the other exists and why they are distinct — that pairing is exactly what gets read as an accidental duplicate later and quietly reconciled away.

## Hour Estimation

### Step 1: Start with the Clock

**Extract working windows from commit timestamps.** `git log --format='%ad %h %s' --date=format:'%H:%M' --reverse` gives actual elapsed time — cluster the commits (a gap over ~90 minutes starts a new session) and sum the clusters. This is direct evidence of the work; the estimation table below is a guess, so it should fill gaps only (thinking time, review, unfixed work) rather than produce the figure on its own.

However, the clock has two failure modes:

- **Degenerate clock (commits all land at once):** If commits cluster in a few minutes at the end of a session, the clock span is near zero and tells you nothing. This happens when a session lands everything at ship time. In this case, ignore the clock and move to Step 2.
- **Wall-clock is not billable time:** The elapsed span from first message to last commit includes planning, unrelated work, and gaps — that is not the time spent on the task. Use commit-to-commit gaps, not wall time.

When the clock works, use it. When it doesn't, proceed to Step 2.

### Step 2: Use the Table for Gaps and Gaps Only

When clock evidence is absent or degenerate, the estimation table below provides guidance:

| Type | Base Hours | Notes |
|------|------------|-------|
| `feat` | 1.5 - 4.0 | +1h new service/model, +0.5h UI |
| `fix` | 0.25 - 1.5 | Quick ~15min, complex ~1.5h |
| `refactor` | 1.0 - 2.5 | Scope-dependent |
| `perf` | 1.0 - 2.0 | Requires profiling |
| `chore` | 0.25 - 0.5 | Config, deps |
| `docs`/`style` | 0.25 | Often non-billable |

**Complexity modifiers**: +0.5h (migrations, complex UI, multiple services), +1h (external API)

⚠️ **The table estimates by SCOPE — files touched, features delivered — not by actual elapsed time.** This works for hand-written work where the two correlate, but agent-assisted work breaks that correlation. Labelling the entry "agent-assisted, ~50% reduction" does not salvage a scope estimate — halving a figure that was never an hours count yields a smaller falsehood. Measured 2026-08-27: a day whose commits span ~1.2h of real activity (plus a 27-minute model run the user watched) was initially drafted at 19.75h off scope alone, and settled at 9.00h once sized against the clock. The table's confidence masked that the estimate was decoupled from evidence.

**Rule:** Where session commits are in the range, their elapsed time is what you know for certain — anchor there and use scope estimates only to reason about time outside the commit windows.

### Step 3: Verify Against Prior Entries

Open the two or three most recent existing invoice entries and read their totals and line items. State in your entry which one you sized against and why yours is above or below it. This step is mandatory because scope estimates read as confident whether or not they are calibrated.

Measured 2026-09-01: an entry asserted "cross-checked on the 27/08 entry's rate" in prose without ever opening it, and billed 8.00h against that entry's 4.00h for a strictly harder day. A named comparable is what makes a scope figure credible; writing it down without doing the read is worse than omitting it.

The prior entries are the strongest calibration available. They cost one `sed` to read. **Tell: you are about to write a total, or cite another entry as justification, and you have not opened that entry's line items in this session.**

## User Time Logs

If provided (e.g., "2:20pm - 2:36pm"):
- Use exact times, round to 0.25h
- Keep their descriptions

A user-supplied log is the best source, but its absence is not a reason to fall back to scope alone — the commit timestamps are a weaker version of the same evidence and they are always available. Reach for them whenever no log is given.

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
