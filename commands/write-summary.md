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

## LLM-CONTEXT Block (Required)

Every `current.md` must start with an LLM-CONTEXT block:

```markdown
<!--LLM-CONTEXT
Purpose: 1-line summary
Key files: comma-separated list
Gotchas: critical gotcha if any
Related: tasks/shared/*.md, other domain docs
-->
```

**Related field**: Cross-reference shared patterns and related domain docs so agents can discover connections.

## Shared Patterns Check

Before writing, check if content belongs in shared docs:

| Content Type | Target |
|--------------|--------|
| Cross-domain gotcha (appears 3+ domains) | `tasks/shared/gotchas-registry.md` |
| B2C/B2B payment detection | `tasks/shared/payment-type-detection.md` |
| Brand colors, email styling | `tasks/shared/colors-and-theme.md` |
| Domain-specific pattern | Keep in domain `current.md` |

**Rule**: Add to shared doc AND reference from domain doc (not either/or).

## Output Structure

```markdown
# [Feature Name]

<!--LLM-CONTEXT
Purpose: Brief description
Key files: app/..., resources/js/...
Related: tasks/shared/gotchas-registry.md (if gotchas), other related docs
-->

**Status**: [emoji] [state] | **Updated**: [date]

## Overview
Brief description.

## Key Decisions
| Decision | Rationale |
|----------|-----------|

## Implementation
- File paths and patterns

## Gotchas
| Error/Symptom | Fix |
|---------------|-----|

## Related
- `tasks/shared/...` - Cross-cutting patterns
- `archive/...` - Historical details (if applicable)

## Next Steps
- [ ] Pending items (only if incomplete work)
```

## Archive Pattern

For completed bug fixes or historical content:
1. Keep patterns/gotchas in `current.md` (timeless)
2. Move SQL scripts, specific IDs, session logs to `archive/`
3. Reference archive: `See archive/production-fixes-YYYY-MM-DD.md for details`
