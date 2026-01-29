---
description: Create new task summary documentation. Use when starting new feature work or when no current.md exists for a domain/feature.
argument-hint: "[domain/feature or path]"
---

# Create Task Summary

Create task documentation optimized for humans and LLM agents.

## Path Resolution

| Input | Target |
|-------|--------|
| Provided | Use as-is |
| Empty | Infer → `tasks/<domain>/<feature>/current.md` |
| Exists | Auto-switch to `/update-summary` behavior |

## What to Include

Write naturally. Include what's useful, skip what's not.

**Must have:**
- `<!--LLM-CONTEXT ... -->` block at top with purpose, key files, related docs
- Status line so readers know if it's active/done/blocked

**Include when relevant:**
- Why decisions were made (not just what)
- Gotchas with actual error messages/symptoms (not abstract descriptions)
- Cross-references to related task docs
- Next steps if work is ongoing
- Discussion points, alternatives considered, tradeoffs weighed
- Conclusions reached and reasoning behind them
- Context that would help future-you (or another dev) pick up where you left off
- Links to relevant PRs, issues, Slack threads, external docs

**Format freely:**
- Tables when comparing things or listing attributes
- Prose when explaining context
- Mermaid when visualizing helps understanding
- Whatever fits the content best

## Before Writing

### 1. Scan existing task docs for relationships
```
# Use Glob tool to find all task docs
Glob: tasks/**/current.md
```

Check each doc's content and LLM-CONTEXT for connections to this new feature:
```
| Existing Doc | Related? | Add cross-ref? |
|--------------|----------|----------------|
| tasks/training/participant/current.md | ✅ | Both directions |
| tasks/training/jd14/current.md | ✅ | Both directions |
| tasks/billing/current.md | ❌ | No |
```

### 2. Check if content belongs in shared location

| Pattern appears in... | Put it in... |
|-----------------------|--------------|
| 3+ domains | `tasks/shared/gotchas-registry.md` |
| Multiple features | `tasks/shared/patterns.md` |
| Just this feature | This doc only |

### 3. Plan cross-references

New doc will link to related docs, AND update those docs to link back.