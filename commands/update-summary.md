---
description: Update existing task summaries with session findings. Appends new content, updates status, checks related domains.
argument-hint: "[domain/feature or path]"
---

# Update Task Summary

Update existing task documentation to reflect this session's work. This is a lighter version of `/write-summary` — use when the doc already exists and you just need to append findings.

## 1. Resolve Target Path

Same as `/write-summary` Step 1. If path not provided, infer from session files.

## 2. Read & Update

**Constraints:**

| ❌ Never | ✅ Always |
|---------|---------|
| Overwrite or truncate existing `## Completed` sections | Append below with new `## Completed (date)` header |
| Update LLM-CONTEXT without reading the file first | Read → update → write |
| Skip the Next Steps update | Always remove completed items and add new ones |
| Create the file if it doesn't exist | Fall back to `/write-summary` instead |

```
Read: {resolved path}
```

| Action | What | Where |
|--------|------|-------|
| **Update** | `LLM-CONTEXT` Status, Key files, Last updated | Top block |
| **Append** | New completed work as a new `## Completed (...)` section | After existing completed sections |
| **Append** | New gotchas | Add rows to existing gotcha table |
| **Append** | New architecture decisions | Add to existing decisions section |
| **Update** | Next steps — remove completed items, add new ones | Bottom |
| **Preserve** | All historical content — never delete completed sections | Everywhere |

## 3. Validate Written Document

After writing, re-read the file and verify:

1. `LLM-CONTEXT Last updated` was changed to today
2. Historical `## Completed` sections still exist (none deleted)
3. Next Steps reflects current state (no stale completed items)
4. If any check fails → fix immediately before continuing

## 4. Cross-References (quick check)

```
Glob: tasks/**/current.md
```

Only update cross-refs if new connections were discovered this session. Don't re-scan everything.
