---
description: Update existing task summaries with session findings. Appends new content, updates status, checks related domains.
argument-hint: "[domain/feature or path]"
---

# Update Task Summary

Update existing task documentation to reflect this session's work. Use when `current.md` already exists — skips template creation.

## 1. Resolve Target Path

Follow `/write-summary` Step 1. If the file doesn't exist, invoke `Skill: syafiqkit:write-summary` with the same args.

### Re-route check

If a gotcha's key file(s) appear in a different doc's `Key files:` field, write it to that doc instead. Otherwise, keep everything in the primary target and note secondary domains in cross-refs (Step 4).

## 2. Read & Update

```
Read: {resolved path}
```

| ❌ Never | ✅ Always |
|---------|---------|
| Overwrite existing `## Completed` sections | Append a new `## Completed (date)` below existing ones |
| Add a duplicate `## Completed (today)` | Edit the existing same-day section in place |
| Update LLM-CONTEXT without reading first | Read → update → write |
| Skip the Next Steps update | Remove completed items, add new ones |

| Action | What | Where | Skip if |
|--------|------|-------|---------|
| **Update** | `LLM-CONTEXT` Status (with emoji), Key files, Last updated | Top block | Never |
| **Append** | `## Completed ({date})` with new work | After existing Completed sections | Single bug fix or <30min |
| **Append** | New gotcha rows | Existing gotcha table | No new errors/surprises |
| **Append** | New architecture decisions | Existing decisions section | No new decisions |
| **Update** | Next steps | Bottom | Never |
| **Preserve** | All historical content | Everywhere | Never |

**Status emoji**: See `done` skill's `references/templates.md` Status Values table.

## 3. Validate

Re-read the file and verify:

1. `LLM-CONTEXT Last updated` changed to today
2. Historical `## Completed` sections all present
3. Next Steps reflects current state
4. Any failure → fix immediately before continuing

## 4. Cross-References (quick check)

```
Glob: tasks/**/current.md
```

Only update cross-refs if new connections were discovered this session.

**Trigger**: A file touched this session appears in another doc's `Key files:` → add **bidirectional** ref (update both docs).
