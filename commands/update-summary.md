---
description: Update existing task summaries with session findings. Appends new content, updates status, checks related domains.
argument-hint: "[domain/feature or path]"
---

# Update Task Summary

Update existing task documentation to reflect this session's work. This is a lighter version of `/write-summary` — use when the doc already exists and you just need to append findings.

## 1. Resolve Target Path

Same as `/write-summary` Step 1. If path not provided, infer from session files.

## 2. Read & Update

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

## 3. Cross-References (quick check)

```
Glob: tasks/**/current.md
```

Only update cross-refs if new connections were discovered this session. Don't re-scan everything.
