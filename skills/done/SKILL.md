---
name: done
description: Post-task cleanup - simplify code, review quality, update docs. Use when finished implementing, after completing features/fixes, or when user says "done", "wrap up", "finalize".
user-invocable: true
---

# Post-Task Workflow

**CRITICAL**: Execute ALL steps in ONE response flow. Do NOT stop until the final summary table is output. Do NOT ask for permission between steps.

## Steps (Execute All Sequentially)

### Step 1: Code Simplifier
Run `code-simplifier:code-simplifier` agent on recently modified files:

**Agent prompt pattern:**
```
Simplify the following files while preserving functionality:
[list of modified files]

Context docs to follow:
- CLAUDE.md (root)
- app/CLAUDE.md
- tasks/{domain}/{feature}/current.md (if exists)

Focus: Remove duplication, improve readability, maintain patterns documented above.
```

Wait for agent result, then **immediately continue to Step 2** (no user confirmation needed).

### Step 2: Scan Session for Domain Impact

Before updating docs, identify ALL touched domains:

1. **Extract domains from modified files**:
   - `app/Domains/{Domain}/` → domain name
   - `resources/js/Domains/{Domain}/` → domain name
   - Database migrations → map table names to domains

2. **Build domain list**:
```
   Primary: training/participant (main feature work)
   Secondary: training/jd14 (duplicate logic touched)
   Secondary: amendments (status transition shared)
```

3. **Check for existing task docs**:
   - For each domain: Does `tasks/{domain}/{feature}/current.md` exist?
   - Build action plan: `[create|update]` per domain

**Immediately continue to Step 3** with domain list in context.

### Step 3: Update/Write Task Summaries

**⚠️ MANDATORY: Use Skill tool, NOT manual edits**

For EACH domain identified in Step 2, invoke the appropriate skill:

**If task doc exists** (`tasks/{domain}/{feature}/current.md`):
```
<Use Skill tool: skill="syafiqkit:update-summary" args="{domain}/{feature}">
```
The skill ensures updates include: new findings, status changes, gotchas, cross-references, next steps, and diagrams.

**If task doc does NOT exist**:
```
<Use Skill tool: skill="syafiqkit:write-summary" args="{domain}/{feature}">
```
The skill ensures: LLM-CONTEXT block, diagrams, cross-references, and implementation details.

**❌ NEVER manually edit task docs in /done workflow**
**✅ ALWAYS invoke the Skill tool to delegate to the specialized skill**

**Multi-domain workflow**:
1. Update/create primary domain doc first
2. Update/create each secondary domain doc
3. Add cross-references in LLM-CONTEXT → Related field:
```markdown
   Related:
   - tasks/training/jd14/current.md — Duplicate prevention logic
   - tasks/amendments/current.md — Status transition patterns
```

**Shared patterns check** (execute after domain updates):
- If same gotcha appears in 3+ domains → add to `tasks/shared/gotchas-registry.md`
- If reusable enum/pattern → add to relevant `tasks/shared/*.md`
- Update domain docs to reference shared registry

**Never skip** - every implementation needs documented context for future sessions.

Wait for all summaries to complete, then **immediately continue to Step 4**.

### Step 4: Code Reviewer
Run `feature-dev:code-reviewer` agent on the same changes:

**Agent prompt pattern:**
```
Review the following changes for issues:
[list of modified files]

Review against these standards:
- `CLAUDE.md` (root)
- `app/CLAUDE.md`
- `tasks/{domain}/{feature}/current.md` (all touched domains)

Check for:
- Logic errors and edge cases
- Security vulnerabilities
- Performance issues
- Style violations
- Missing error handling
```

Wait for agent result, then **immediately continue to Step 5**.

### Step 5: Fix Issues
If code reviewer found issues:
- **Fix them immediately** using str_replace tool
- Apply fixes in order of severity (critical → major → minor)
- Verify fixes don't break existing patterns
- Then **immediately continue to Step 6**

If no issues found:
- **Immediately continue to Step 6** (no output needed)

### Step 6: Capture Patterns to CLAUDE Docs

**⚠️ MANDATORY: Use Skill tool, NOT manual edits**

```
<Use Skill tool: skill="syafiqkit:update-claude-docs">
```

The skill handles extraction and routing:
- User corrections → captures what went wrong
- Friction points → documents solutions
- Gotchas → routes to appropriate CLAUDE.md
- Behavioral guidance → ~/.claude/CLAUDE.md

**Routing (handled by skill)**:
- Cross-domain gotchas (3+ domains) → `tasks/shared/gotchas-registry.md`
- Behavioral guidance → `~/.claude/CLAUDE.md`
- Domain-specific gotchas → `app/Domains/{Domain}/CLAUDE.md`
- Backend-only → `app/CLAUDE.md`
- Frontend-only → `resources/js/CLAUDE.md`

**❌ NEVER manually edit CLAUDE.md files in /done workflow**
**✅ ALWAYS invoke the Skill tool to delegate to update-claude-docs**

Wait for skill completion, then **immediately continue to Step 7**.

### Step 7: Archive Cleanup (If Applicable)

**Only for completed bug fixes or incidents**:

| Content Type | Action |
|--------------|--------|
| Production SQL scripts | Move to `tasks/{domain}/{feature}/archive/prod-fix-YYYY-MM-DD.sql` |
| Specific IDs, usernames | Move to `tasks/{domain}/{feature}/archive/incident-YYYY-MM-DD.md` |
| Session logs, debugging notes | Move to `tasks/{domain}/{feature}/archive/debug-session-YYYY-MM-DD.md` |
| Timeless patterns/gotchas | **Keep in current.md** (don't archive) |

**Reference pattern in current.md**:
```markdown
## Production Incident
Fixed duplicate enrollment issue. Details archived for compliance.

> See [`archive/prod-fix-2025-01-29.md`](archive/prod-fix-2025-01-29.md) — SQL scripts and affected records
```

**Skip this step if**:
- New feature work (no incident)
- Refactoring (no production fix)
- Normal development (no debugging artifacts)

**Immediately continue to output final summary**.

## Output (Required)
```
## /done Summary

| Step | Status | Findings |
|------|--------|----------|
| 1. Code Simplifier | ✅/⚠️ | [e.g., "Removed 3 duplicate methods, extracted validation logic"] |
| 2. Domain Scan | ✅ | Primary: training/participant • Secondary: training/jd14, amendments |
| 3. Update Summaries | ✅ | Updated 3 docs • Added cross-refs • 1 shared gotcha to registry |
| 4. Code Reviewer | ✅/⚠️ | [e.g., "Found 2 issues: missing null check, unhandled exception"] |
| 5. Fix Issues | ✅/➖ | [e.g., "Applied 2 fixes"] OR "N/A - no issues found" |
| 6. Capture Patterns | ✅ | Updated app/CLAUDE.md (1 gotcha) • Refined 1 ignored rule in ~/.claude/CLAUDE.md |
| 7. Archive | ✅/➖ | [e.g., "Archived SQL scripts to archive/prod-fix-2025-01-29.md"] OR "N/A - no incident" |

### Documentation Updates
**Task Summaries**:
- ✅ `tasks/training/participant/current.md` (updated, 234→218 lines)
- ✅ `tasks/training/jd14/current.md` (updated, 156→162 lines)
- ✅ `tasks/amendments/current.md` (updated, 189→195 lines)

**Shared Registry**:
- ✅ `tasks/shared/gotchas-registry.md` (added BackedEnum cast error affecting 3 domains)

**CLAUDE Docs**:
- ✅ `app/CLAUDE.md` (added enrollment validation gotcha)
- ✅ `~/.claude/CLAUDE.md` (refined "update related docs" rule - was ignored 2x)

### Cross-References Added
- participant ↔ jd14 (duplicate prevention logic)
- participant ↔ amendments (status transition patterns)
- All 3 → shared/gotchas-registry.md (BackedEnum casting)
```

## Execution Rules

1. **No pausing**: Execute all 7 steps without stopping for confirmation
2. **No permission requests**: Don't ask "Should I update X?" - just do it
3. **Always multi-domain aware**: Scan for ALL touched domains, not just primary
4. **Always cross-reference**: Link related domains in LLM-CONTEXT → Related
5. **Always check shared patterns**: 3+ domains = shared registry entry
6. **Document refinement over addition**: If Claude ignored docs, refine them
7. **Output table is mandatory**: Even if some steps are N/A
8. **Use Skill tool for Step 3 & 6**: NEVER manually edit task docs or CLAUDE.md - invoke the skills

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Only updated primary domain" | Step 2 must build complete domain list before Step 3 |
| "Didn't add cross-references" | Every domain doc needs LLM-CONTEXT → Related with links |
| "Skipped shared registry" | Count domains with same gotcha; if ≥3, add to registry |
| "Stopped at Step 3" | Don't wait for user; continue to Step 4 immediately |
| "Code reviewer didn't see patterns" | Agent prompt must explicitly @ reference CLAUDE.md files |
| "Captured gotcha but Claude ignored it again" | Step 6 should REFINE existing entry, not just add duplicate |
| "Manually edited task docs" | Step 3 MUST use Skill tool with `syafiqkit:update-summary` or `syafiqkit:write-summary` |
| "Manually edited CLAUDE.md" | Step 6 MUST use Skill tool with `syafiqkit:update-claude-docs` |

## Quality Checklist (Internal - Don't Output)

Before outputting final summary, verify:
- [ ] All modified files processed by code-simplifier
- [ ] All touched domains identified (not just primary)
- [ ] Each domain doc updated/created with session findings
- [ ] Cross-references added between related domains
- [ ] Shared gotchas (3+ domains) added to registry
- [ ] Code reviewer ran on all changes
- [ ] Issues fixed (or confirmed none exist)
- [ ] Patterns captured to appropriate CLAUDE.md files
- [ ] Ignored docs refined (if applicable)
- [ ] Archive cleanup done (if incident/bug fix)
- [ ] Output table shows all 7 steps