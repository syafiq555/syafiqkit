---
description: Read and understand task summary context. Use at session start to load existing feature documentation before continuing work.
argument-hint: "[domain/feature or full path to current.md]"
---

**Path Convention**: `tasks/<domain>/<feature>/current.md`
- Examples: `tasks/payment/gateway/current.md`, `tasks/tenant/rebate/current.md`

## Read Order

1. Read the requested `current.md`
2. Check LLM-CONTEXT `Related:` field for linked docs
3. If Related mentions `tasks/shared/*.md`, read those too
4. Check for `archive/` subfolder (historical context, optional)

**Shared docs**: `tasks/shared/*.md`

Read and understand $ARGUMENTS (plus any Related docs mentioned), do not do anything, wait for my next instruction.