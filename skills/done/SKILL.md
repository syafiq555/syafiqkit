---
name: done
description: Post-task cleanup - simplify code, review changes, update docs. Use when finished implementing or when user says "done", "wrap up", "finalize".
user-invocable: true
---

# Post-Task Workflow

Execute all steps in sequence without pausing for confirmation.

## Step 1: Simplify Code

**Check for project agent first:**
```
Glob: .claude/agents/code-simplifier.md
```

| Found? | Action |
|--------|--------|
| Yes | Run Task tool with `subagent_type: "code-simplifier"` |
| No | Run Task tool with `subagent_type: "code-simplifier:code-simplifier"` |

Prompt should include: list of modified files this session, focus on duplication removal, readability, pattern consistency.

## Step 2: Review Changes

**Check for project agent first:**
```
Glob: .claude/agents/code-reviewer.md
```

| Found? | Action |
|--------|--------|
| Yes | Run Task tool with `subagent_type: "code-reviewer"` |
| No | Run Task tool with `subagent_type: "feature-dev:code-reviewer"` |

Prompt should include: same files as Step 1.

If issues found: fix them immediately, then continue.

## Step 3: Update Task Docs

Invoke `syafiqkit:write-summary` for the primary domain/feature.

The skill handles: multi-domain detection, cross-references, shared gotcha consolidation.

## Step 4: Capture Patterns

Invoke `syafiqkit:update-claude-docs`.

The skill handles: routing gotchas vs guidance, refinement of ignored rules, DRY checks, **and syncing project agents**.

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
