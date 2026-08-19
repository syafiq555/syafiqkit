# Output Structure and Reporting Rules

## Key Principles

- **Lead with what the user has to decide** — report what was built underneath it
- **Group by feature, not by workflow step** — findings per feature/change, not per agent/skill
- **Partition the diff into coherent changes** — units the user thinks of as one thing (one feature, bugfix, refactor), not one file. Files coupled by logic are one change; features that share a file are two.

## Content Order

1. **Open with open questions** — A product gap that stayed a recommendation, or any call the user owns. One uses `AskUserQuestion`, two+ use a `## Decisions` block. See `${CLAUDE_SKILL_DIR}/../_shared/references/decision-first-output.md` for shape, tests, and rationale. Nothing open means no block at all.

2. **Per-change summaries** — For each change, report what Simplify/Review/Product found. Omit roles that produced nothing on that change. A cell reports the finding; it isn't where you argue the work was good, and a gap already asked about above gets pointed at rather than restated.

3. **Add Test row for changes with one** — Concrete command or 1-2 steps the user hasn't seen executed yet. For API/data: a `curl` against the new route, a query for the new column. For UI/workflow: the literal navigation path a user follows to see it. Skip for doc-only edits or pure renames. If the test suite already ran, linking to it is enough.

4. **Session-level rows stay together** — Knowledge, Task docs, Plugin are shared writes, not per-change.

## What Not to Include

- Omit a row for changes with nothing on it; never fill it with "N/A"
- Omit roles that produced nothing on that change
- A change with only ✅/➖ across every row (nothing found, nothing to test) still gets its own heading — the value is telling the reader "here's everything about X"
- A session with exactly one change collapses to one `### [Change]` block plus `### Session` — don't invent a second change to justify the grouping

## Template

```
## Decisions

1️⃣ [what's true now]
   [the question]

(two or more open questions only)

## /done Summary

### [Change 1 name]
| Step | Result |
|------|--------|
| Review | [issues found + fixed, or ✅ clean; docs-only ALSO appends referential-integrity; ops-only = live read-back] |
| Simplify | [changes made, or ✅ none needed] |
| Product | [✅ journeys complete, or → question] |
| Cleanup | [removed, or omit] |
| Test | [exact command or steps the user runs] |

### [Change 2 name]
(same shape — omit rows this change had nothing for)

### Session
| Step | Result |
|------|--------|
| Knowledge | [N entries → target files; "0 new" if none] |
| Task docs | [doc path → summary] |
| Plugin | owner: [files + bump] · consumer: [issue URL or why not] (omit if Step 5 didn't fire) |
| User args | [what was done about them] (only if args passed) |
```
