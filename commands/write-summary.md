---
description: Create/Update task summary documentation. Use when starting new feature work or when no current.md exists for a domain/feature.
argument-hint: "[domain/feature or path]"
---

# Create/Update Task Summary

Create or update task documentation optimized for humans and LLM agents.

## 0. Pre-Flight Reasoning

Before resolving the path, think through:

```
<thinking>
- What files were modified this session?
- What domain/feature do they belong to?
- Does a current.md already exist for this path?
- Is this a create or update operation?
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
| Backend files (`app/`, `controllers/`, `models/`) | Backend domain from nearest folder name |
| Mobile files (`screens/`, `services/`, expo/RN patterns) | `mobile` |
| Multi-repo: files in a sub-folder | Use sub-folder name as scope hint |

For **single-repo** projects, domain maps directly to folder structure.
For **multi-repo** workspaces, also consider which sub-project the files belong to.

## 2. Create or Update?

```
Read: {resolved path}
```

| File exists? | Action |
|-------------|--------|
| No | **Create** — use minimal template (Step 3) |
| Yes | **Update** — append session work (Step 4) |

## 3. Create New Document

**Constraints:**

| ❌ Never | ✅ Always |
|---------|---------|
| Skip reading path even if you think it's new | Read first — another session may have created it |
| Infer domain from a single file path | Use the deepest common folder across all session files |
| Omit any required LLM-CONTEXT field | All fields required: Status, Domain, Key files, Related, Last updated |

**LLM-CONTEXT block** (required at top):
```markdown
<!--LLM-CONTEXT
Status: Active
Domain: {domain}
Key files: {3-5 primary files from this session}
Related: None
Last updated: {today}
-->
```

**Sections to include:**
- `## Summary` — one sentence on what this feature does
- `## Completed` — what was done this session (tables preferred)
- `## Gotchas` — any errors/surprises encountered (Symptom | Cause | Fix)
- `## Architecture Decisions` — why, not just what
- `## Next Steps` — remaining work

## 4. Update Existing Document

**Constraints:**

| ❌ Never | ✅ Always |
|---------|---------|
| Delete or overwrite existing `## Completed` sections | Append a new `## Completed (date)` below existing ones |
| Rewrite architecture decisions that already exist | Add new rows/paragraphs, keep historical ones |
| Set `Status: Done` without user instruction | Preserve existing status unless explicitly told to change |

Read the existing doc first. Then:

| Action | What | Where |
|--------|------|-------|
| **Update** | `LLM-CONTEXT` Status, Key files, Last updated | Top block |
| **Append** | New completed work as a new `## Completed (...)` section | After existing completed sections |
| **Append** | New gotchas | Add rows to existing gotcha table |
| **Append** | New architecture decisions | Add to existing decisions section |
| **Update** | Next steps — remove completed items, add new ones | Bottom |
| **Preserve** | All historical content — never delete completed sections | Everywhere |

## 5. Validate Written Document

After writing, re-read the file and verify:

1. `LLM-CONTEXT` block is present with all required fields
2. All previous `## Completed` sections still exist (none deleted)
3. `Last updated` date matches today
4. If any check fails → fix immediately and re-read before continuing

## 6. Cross-References (only if multiple task docs exist)

Quick check — only run if there are other task docs:
```
Glob: tasks/**/current.md
```

| Found others? | Action |
|--------------|--------|
| None | Skip |
| 1-2 docs | Read their `LLM-CONTEXT → Related` — add bidirectional ref if connected |
| 3+ docs | Only check docs whose domain overlaps with session files |

## 7. Shared Gotchas (only if pattern repeats)

| Pattern appears in... | Put it in... |
|-----------------------|--------------|
| 3+ domains | `tasks/shared/gotchas-registry.md` |
| Multiple features in same domain | Feature's own doc |
| Just this feature | This doc only |
