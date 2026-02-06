---
name: done
description: Post-task cleanup - simplify code, review changes, update docs. Use when finished implementing or when user says "done", "wrap up", "finalize".
user-invocable: true
---

# Post-Task Workflow

Execute all steps in sequence without pausing for confirmation.

## Step 1: Simplify + Review (parallel)

Run both agents **in parallel** (single message, two Task tool calls).

**Check for project agents first:**
```
Glob: .claude/agents/code-simplifier.md
Glob: .claude/agents/code-reviewer.md
```

| Agent | Project agent found? | Fallback subagent_type |
|-------|---------------------|------------------------|
| Simplifier | `subagent_type: "code-simplifier"` | `"code-simplifier:code-simplifier"` |
| Reviewer | `subagent_type: "code-reviewer"` | `"feature-dev:code-reviewer"` |

**Prompt for both must include:**
- List of modified files this session (full paths)
- For simplifier: focus on duplication removal, readability, pattern consistency
- For reviewer: focus on bugs, security, logic errors, project convention violations

**After both complete:**
- If reviewer found issues → fix them immediately, then continue
- If simplifier made changes → verify they were applied (linter may have auto-formatted)

## Step 2: Clean up temp code

Scan session for temporary artifacts that should be removed:

| Artifact | How to detect | Action |
|----------|--------------|--------|
| Test buttons / debug UI | `TEMP:`, `TODO: REMOVE`, `test buttons` in modified files | Ask user: "Remove temp test code from {file}?" |
| `console.log` debugging | `console.log` added this session | Remove unless intentional |
| Commented-out old code | Large commented blocks from migration | Remove if replaced |

**Skip if**: No temp artifacts found.

## Step 3: Update Task Docs

Invoke `syafiqkit:write-summary` for the primary domain/feature.

If the path is obvious from session context, pass it directly to avoid discovery overhead:
```
Skill: syafiqkit:write-summary
Args: tasks/{domain}/{feature}/current.md
```

The skill handles: multi-domain detection, cross-references, shared gotcha consolidation.

## Step 4: Capture Patterns

Invoke `syafiqkit:update-claude-docs`.

The skill handles: routing to correct CLAUDE.md (sub-project vs root), dedup check across files, **and syncing project agents**.

**Important**: The routing in update-claude-docs determines the target file. Do NOT override its routing — let it check which sub-project files were modified.

## Output

```
## /done Summary

| Step | Status | Notes |
|------|--------|-------|
| Simplify | ✅/⚠️ | [changes made or "no simplifications needed"] |
| Review | ✅/⚠️ | [issues found/fixed or "no issues"] |
| Cleanup | ✅/➖ | [temp code removed or "nothing to clean"] |
| Task Docs | ✅ | [files updated, cross-refs added] |
| Patterns | ✅/➖ | [CLAUDE.md updates or "nothing to capture"] |
```
