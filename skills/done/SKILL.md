---
name: done
description: Post-task cleanup - simplify code, review changes, update docs. Use when finished implementing or when user says "done", "wrap up", "finalize".
user-invocable: true
---

# Post-Task Workflow

Execute all steps in sequence without pausing for confirmation.

## Step 1: Simplify Code

Run `code-simplifier:code-simplifier` on modified files from this session.

Focus: duplication removal, readability improvements, pattern consistency.

## Step 2: Review Changes

Run `feature-dev:code-reviewer` on the same files.

If issues found: fix them immediately, then continue.

## Step 3: Update Task Docs

Invoke `syafiqkit:update-summary` for the primary domain/feature.

The skill handles: multi-domain detection, cross-references, shared gotcha consolidation, archive cleanup.

## Step 4: Capture Patterns

Invoke `syafiqkit:update-claude-docs`.

The skill handles: routing gotchas vs guidance, refinement of ignored rules, DRY checks.

## Output
```
## /done Summary

| Step | Status | Notes |
|------|--------|-------|
| Simplify | ✅/⚠️ | [changes made or "no simplifications needed"] |
| Review | ✅/⚠️ | [issues found/fixed or "no issues"] |
| Task Docs | ✅ | [files updated, cross-refs added] |
| Patterns | ✅/➖ | [CLAUDE.md updates or "nothing to capture"] |
```