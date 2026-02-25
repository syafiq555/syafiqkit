---
description: Create/Update task summary documentation. Use when starting new feature work or when no current.md exists for a domain/feature.
argument-hint: "[domain/feature or path]"
---

# Create/Update Task Summary

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

## 2. Create or Update?

```
Read: {resolved path}
```

| File exists? | Action |
|-------------|--------|
| No | **Create** — use minimal template (Step 3) |
| Yes | **Update** — append session work (Step 4) |

## 3. Create New Document

| ❌ Never | ✅ Always |
|---------|---------|
| Skip reading path (another session may have created it) | Read first |
| Infer domain from a single file path | Use deepest common folder across all session files |
| Omit any LLM-CONTEXT field | All required: Status, Domain, Key files, Related, Last updated |

Use the **Minimal Template** from the `done` skill's `references/templates.md` file.

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
| Rewrite existing architecture decisions | Add new rows, keep historical ones |
| Set `Status: Done` without user instruction | Preserve existing status unless told to change |

| Action | What | Where |
|--------|------|-------|
| **Update** | `LLM-CONTEXT` Status, Key files, Last updated | Top block |
| **Append** | New completed work as `## Completed (...)` | After existing completed sections |
| **Append** | New gotchas | Existing gotcha table |
| **Append** | New architecture decisions | Existing decisions section |
| **Update** | Next steps — remove completed, add new | Bottom |
| **Preserve** | All historical content | Everywhere |

## 5. Validate Written Document

After writing, re-read the file and verify:

1. `LLM-CONTEXT` block is present with all required fields
2. All previous `## Completed` sections still exist (none deleted)
3. `Last updated` date matches today
4. If any check fails → fix immediately and re-read before continuing

## 6. Cross-References + Shared Gotchas

```
Glob: tasks/**/current.md
```

| Found others? | Action |
|--------------|--------|
| None | Skip |
| 1-2 docs | Read their `LLM-CONTEXT → Related` — add bidirectional ref if connected |
| 3+ docs | Only check docs whose domain overlaps with session files |

**Connection trigger**: A file touched this session appears in another doc's `Key files:` → add bidirectional ref.

**Shared gotchas**: When adding a gotcha, search the Glob results for the same symptom keyword. If found in 2+ other docs, move all occurrences to `tasks/shared/gotchas-registry.md`.
