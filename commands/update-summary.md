---
description: Update existing task summaries with session findings. Appends new content, updates status, checks related domains.
argument-hint: "[domain/feature or path]"
---

# Update Task Summary

Update task documentation to reflect this session's work.

## 1. Load Discovery Guidance

Use the Skill tool to load `syafiqkit:task-summary` skill first. This provides:
- Discovery algorithm
- Classification criteria (PRIMARY vs SECONDARY)
- Cross-reference requirements
- Templates reference

Wait for the skill to load before proceeding.

## 2. Run Discovery

Follow the discovery algorithm from the loaded task-summary skill:

1. Map session files → domains
2. Glob `tasks/**/current.md` (with `path` param)
3. Check `LLM-CONTEXT → Related` for connections
4. Classify as PRIMARY or SECONDARY

## 3. Handle Missing Docs

| Scenario | Action |
|----------|--------|
| PRIMARY missing | Auto-create minimal template (from skill's templates.md) |
| PRIMARY exists, Status: Done | Append new section, update Status → Active |
| SECONDARY missing | Skip + suggest: "Run `/write-summary <domain>` if recurring" |
| `tasks/shared/*` missing | Skip silently |

## 4. Update Each Doc

| Action | What |
|--------|------|
| **Add** | Gotchas (with error messages), decisions with rationale, cross-references |
| **Update** | Status, completed items, `LLM-CONTEXT → Related` |
| **Remove** | Completed next steps, obsolete workarounds |
| **Preserve** | Historical decisions, resolved bugs (for context) |

## 5. Ensure Cross-References

Check bidirectionality:
- If doc A mentions doc B, ensure B mentions A
- Add missing reverse references
