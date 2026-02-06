---
description: Create/Update task summary documentation. Use when starting new feature work or when no current.md exists for a domain/feature.
argument-hint: "[domain/feature or path]"
---

# Create/Update Task Summary

Create or update task documentation optimized for humans and LLM agents.

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

Read the existing doc first. Then:

| Action | What | Where |
|--------|------|-------|
| **Update** | `LLM-CONTEXT` Status, Key files, Last updated | Top block |
| **Append** | New completed work as a new `## Completed (...)` section | After existing completed sections |
| **Append** | New gotchas | Add rows to existing gotcha table |
| **Append** | New architecture decisions | Add to existing decisions section |
| **Update** | Next steps — remove completed items, add new ones | Bottom |
| **Preserve** | All historical content — never delete completed sections | Everywhere |

## 5. Cross-References (only if multiple task docs exist)

Quick check — only run if there are other task docs:
```
Glob: tasks/**/current.md
```

| Found others? | Action |
|--------------|--------|
| None | Skip |
| 1-2 docs | Read their `LLM-CONTEXT → Related` — add bidirectional ref if connected |
| 3+ docs | Only check docs whose domain overlaps with session files |

## 6. Shared Gotchas (only if pattern repeats)

| Pattern appears in... | Put it in... |
|-----------------------|--------------|
| 3+ domains | `tasks/shared/gotchas-registry.md` |
| Multiple features in same domain | Feature's own doc |
| Just this feature | This doc only |
