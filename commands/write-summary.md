---
description: Create comprehensive task summary documentation. Use when starting new feature work, after completing a task, or when no current.md exists for the domain/feature.
argument-hint: "[domain/feature or full path]"
---

Create comprehensive module documentation that balances human readability with token efficiency.

File Path:
- If argument provided: Use as-is (supports full paths)
- If no argument: Infer from conversation → tasks/<domain>/<feature>/current.md

Requirements:
1. Document all discussion points from this session
2. Include relevant file paths and code locations
3. Capture lessons learned and key decisions made
4. Add conclusions and next steps
5. Use mermaid diagrams where they save tokens over prose explanations
6. Write incrementally section-by-section (not all at once)

Context:
- Target audience: Human developers who need to understand the work + LLM agents needing context
- Keep content lean but complete enough for future reference
- Follow standard task documentation conventions
- If file exists, append new section or update relevant parts

The documentation should tell the story of what was built/discussed in a scannable format for both humans and AI agents.

Tool Usage:
- Use `@` prefix for file references in requirements
- Cross-reference related task docs when detecting shared patterns

## Output Structure

```markdown
# [Feature Name]

## Overview
Brief description of what was built/discussed.

## Key Decisions
| Decision | Rationale |
|----------|-----------|

## Implementation
- File paths and code locations
- Key patterns used

## Lessons Learned
- Gotchas encountered
- What worked well

## Next Steps
- [ ] Pending items
```
