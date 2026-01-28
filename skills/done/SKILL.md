---
name: done
description: Post-task cleanup - simplify code, review quality, update docs. Use when finished implementing, after completing features/fixes, or when user says "done", "wrap up", "finalize".
user-invocable: true
---

# Post-Task Workflow

**CRITICAL**: Execute ALL steps in ONE response flow. Do NOT stop until the final summary table is output.

## Steps (Execute All Sequentially)

### Step 1: Code Simplifier
Run `code-simplifier:code-simplifier` agent on recently modified files:
- Prompt must include: "Refer these docs: Root CLAUDE.md, app/CLAUDE.md, and any relevant task doc (tasks/{domain}/{feature}/current.md)"
- Wait for agent result, then **immediately continue to Step 2**

### Step 2: Update/Write Summary
Preserve session context in task docs:
1. Check if `tasks/{domain}/{feature}/current.md` exists for this feature
2. **If exists**: Run `/update-summary` to append new findings
3. **If not exists**: Run `/write-summary` to create initial documentation
4. **Capture next steps**: Any planned but uncompleted work from this session (required if pending work exists)
5. **Cross-domain check**: If session touched multiple domains, update each relevant `current.md`
6. **Shared patterns check**: If gotcha appears in 3+ domains, add to `tasks/shared/gotchas-registry.md`
7. **Never skip** - every implementation needs documented context for future sessions
- Wait for skill completion, then **immediately continue to Step 3**

### Step 3: Code Reviewer
Run `feature-dev:code-reviewer` agent on the same changes:
- Prompt must include: "Review against these docs: Root CLAUDE.md, app/CLAUDE.md, and any relevant task doc (tasks/{domain}/{feature}/current.md)"
- Wait for agent result, then **immediately continue to Step 4**

### Step 4: Fix Issues
If code reviewer found issues:
- Fix them immediately using Edit tool
- Then **immediately continue to Step 5**

If no issues found:
- **Immediately continue to Step 5**

### Step 5: Update CLAUDE Docs
Run `/update-claude-docs` skill to capture new patterns/gotchas:
- Route cross-domain gotchas to `tasks/shared/gotchas-registry.md`
- Route behavioral guidance to `~/.claude/CLAUDE.md`
- Route technical gotchas to relevant `CLAUDE.md` files
- Wait for skill completion, then **output final summary**

## Output (Required)

```
## /done Summary

| Step | Status | Findings |
|------|--------|----------|
| 1. Code Simplifier | ✅/⚠️ | [brief findings] |
| 2. Update Summary | ✅ | [entries added] + [shared docs updated if any] |
| 3. Code Reviewer | ✅/⚠️ | [issues found or "No issues"] |
| 4. Fix Issues | ✅/➖ | [fixes applied or "N/A"] |
| 5. Update CLAUDE Docs | ✅ | [docs updated or "No updates needed"] |
```

## Archive Check (For Bug Fixes)

If session was a completed bug fix:
1. Keep patterns/gotchas in `current.md` (timeless)
2. Move SQL scripts, specific IDs, session logs to `archive/` subfolder
3. Reference: `See archive/production-fixes-YYYY-MM-DD.md for details`
