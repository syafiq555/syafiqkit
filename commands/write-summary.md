---
description: Create comprehensive task summary documentation. Use when starting new feature work, after completing a task, or when no current.md exists for the domain/feature.
argument-hint: "[domain/feature or full path]"
---

Create task documentation for humans and LLM agents.

## Path Resolution

| $ARGUMENTS | Target |
|------------|--------|
| Provided | Use as-is |
| Empty | Infer → `tasks/<domain>/<feature>/current.md` |
| Exists | Append/update relevant parts |

## Requirements

1. Document discussion points from session
2. Include file paths and code locations
3. Capture decisions with rationale
4. Add next steps
5. Write incrementally (section-by-section)
6. Use tables over prose; mermaid where it saves tokens

## Output Structure

```markdown
# [Feature Name]

## Overview
Brief description.

## Key Decisions
| Decision | Rationale |
|----------|-----------|

## Implementation
- File paths and patterns

## Lessons Learned
- Gotchas encountered

## Next Steps
- [ ] Pending items
```
