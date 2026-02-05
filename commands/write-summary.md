---
description: Create/Update task summary documentation. Use when starting new feature work or when no current.md exists for a domain/feature.
argument-hint: "[domain/feature or path]"
---

# Create/Update Task Summary

Create/Update task documentation optimized for humans and LLM agents.

## 1. Load Discovery Guidance

Use the Skill tool to load `syafiqkit:task-summary` skill first (MANDATORY). This provides:
- Path conventions (`tasks/<domain>/<feature>/current.md`)
- LLM-CONTEXT block structure
- Cross-reference requirements
- Templates reference

Wait for the skill to load before proceeding.

## 2. Resolve Target Path

| Input | Action |
|-------|--------|
| Path provided | Use as-is |
| Domain/feature provided | Expand to `tasks/<domain>/<feature>/current.md` |
| Empty | Infer from session files using discovery algorithm |
| Path exists | Switch to `/update-summary` behavior |

## 3. Discover Related Docs

Follow discovery algorithm from task-summary skill:

1. Glob `tasks/**/current.md` (with `path` param)
2. Check each doc's `LLM-CONTEXT → Related` for connections
3. Build cross-reference map

| Existing Doc | Related? | Action |
|--------------|----------|--------|
| Has connection | Yes | Add bidirectional cross-ref |
| No connection | No | Skip |

## 4. Check Shared Location

| Pattern appears in... | Put it in... |
|-----------------------|--------------|
| 3+ domains | `tasks/shared/gotchas-registry.md` |
| Multiple features | `tasks/shared/patterns.md` |
| Just this feature | This doc only |

## 5. Create Document

Use templates from `syafiqkit:task-summary` skill's `references/templates.md`.

**Must have:**
- `<!--LLM-CONTEXT ... -->` block at top
- Status line

**Include when relevant:**
- Why decisions were made (not just what)
- Gotchas with actual error messages
- Cross-references to related docs
- Next steps if work is ongoing
- Links to PRs, issues, external docs

**Format freely** — tables, prose, Mermaid, whatever fits.

## 6. Update Related Docs

Add cross-reference back to new doc in each related doc's `LLM-CONTEXT → Related` field.
