---
name: task-summary
description: Create or update task summary documentation (current.md). Handles path resolution, domain inference, template selection, cross-references. Use for any task documentation workflow.
---

# Task Summary

Create or update task documentation optimized for humans and LLM agents.

## 0. Pre-Flight Reasoning

```
<thinking>
- What files were modified this session?
- What domain/feature do they belong to? (Check CLAUDE.md #{tasks} for known domain names)
- Does a current.md already exist for this path?
- Is this a create or update? Trivial session (<30min, single bug fix)? → If trivial: LLM-CONTEXT metadata only (see Step 3 scaling table)
- Does any finding belong in a DIFFERENT feature's doc? (e.g., gotcha discovered in invoice/ that belongs in payment/)
</thinking>
```

## 1. Resolve Target Path

| Input | Action |
|-------|--------|
| Full path provided | Use as-is |
| Domain/feature provided | Expand to `tasks/<domain>/<feature>/current.md` |
| Empty | Infer from session files (see below) |

**Domain inference** — derive from session file paths:

| Clue | Domain |
|------|--------|
| Frontend files (`*.jsx`, `*.tsx`, `*.vue`, `components/`) | `frontend` |
| Backend files (`app/`, `controllers/`, `models/`) | Nearest folder name |
| Mobile files (`screens/`, expo/RN patterns) | `mobile` |
| Multi-repo: files in a sub-folder | Sub-folder name |

**Known domains**: Check `tasks/` directory for existing domain folders. Common patterns: domain name from `app/Domains/`, route groups, or feature folders.

## 2. Detect Mode

```
Read: {resolved path}
```

| File exists? | Action |
|-------------|--------|
| No | **Create** → Step 3 |
| Yes | **Update** → Step 4 |

**Re-route check**: If a gotcha's key file(s) appear in a different doc's `Key files:` field, write it to that doc instead. Otherwise, keep everything in the primary target and note secondary domains in cross-refs (Step 6).

## 3. Create New Document

| ❌ Never | ✅ Always |
|---------|---------|
| Skip reading path (another session may have created it) | Read first |
| Infer domain from a single file path | Use deepest common folder across all session files |
| Omit any LLM-CONTEXT field | All required: Status, Domain, Key files, Related, Last updated |

Use the **Minimal Template** from this skill's `references/templates.md`.

**Sections to include** (scale to session size):

| Session type | Sections |
|-------------|----------|
| New feature / significant work | Summary, Completed, Gotchas, Architecture Decisions, Next Steps |
| Single bug fix | Gotchas + Next Steps only |
| Short session (<30min, no surprises) | LLM-CONTEXT metadata only |

## 4. Update Existing Document

| ❌ Never | ✅ Always |
|---------|---------|
| Delete or overwrite existing `## Completed` sections | Append a new `## Completed (date)` below existing ones |
| Add a duplicate `## Completed (today)` | Edit the existing same-day section in place |
| Update LLM-CONTEXT without reading first | Read → update → write |
| Rewrite existing architecture decisions | Add new rows, keep historical ones |
| Set `Status: Done` without user instruction | Preserve existing status unless told to change |
| Skip the Next Steps update | Remove completed items, add new ones |

| Action | What | Where | Skip if |
|--------|------|-------|---------|
| **Update** | `LLM-CONTEXT` Status (with emoji), Key files, Last updated | Top block | Never |
| **Append** | `## Completed ({date})` with new work | After existing Completed sections | Single bug fix or <30min |
| **Append** | New gotcha rows | Existing gotcha table | No new errors/surprises |
| **Append** | New architecture decisions | Existing decisions section | No new decisions |
| **Update** | Next steps | Bottom | Never |
| **Preserve** | All historical content | Everywhere | Never |

**Status emoji**: See this skill's `references/templates.md` Status Values table.

## 5. Validate

After writing, re-read the file and verify:

1. `LLM-CONTEXT` block is present with all required fields
2. All previous `## Completed` sections still exist (none deleted)
3. `Last updated` date matches today
4. Next Steps reflects current state
5. If any check fails → fix immediately and re-read before continuing

## 6. Cross-References + Shared Gotchas

```
Glob: tasks/**/current.md
```

| Mode | Scope |
|------|-------|
| **Create** (new doc) | Full scan: read Related fields of other docs, add bidirectional refs if connected, check for shared gotchas |
| **Update** (existing doc) | Quick check: only update cross-refs if new connections discovered this session |

**Connection trigger**: A file touched this session appears in another doc's `Key files:` → add **bidirectional** ref (update both docs).

**Shared gotchas**: When adding a gotcha, search the Glob results for the same symptom keyword. If found in 2+ other docs, move all occurrences to `tasks/shared/gotchas-registry.md`.
