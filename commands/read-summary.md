---
description: Read, find and understand task summary context. Use at session start to load existing feature documentation before continuing work.
argument-hint: "[domain/feature or full path to current.md]"
---

**Path Convention**: `tasks/<domain>/<feature>/current.md`
- Examples: `tasks/payment/gateway/current.md`, `tasks/tenant/rebate/current.md`

## Read Order

1. Read the requested `current.md` if not provided please search according to the domain/feature
2. Check LLM-CONTEXT `Related:` field for linked docs
3. If Related mentions `tasks/shared/*.md`, read those too
4. **GitNexus (mandatory if `.gitnexus/` exists)** — run in parallel with step 1:
   - `gitnexus_query({query: "<domain/feature>", repo: "autorentic"})` to find execution flows
   - `gitnexus_context({name: "<symbol>", repo: "autorentic"})` on the 2-3 most critical symbols from `Key files` (e.g., main service class, controller)
   - ⚠️ Do NOT skip this even if you "already read the files" — file reads miss callers, process participation, and blast radius

**Shared docs**: Check `Glob: tasks/shared/*.md` for cross-domain references if they exist.

---

Read and understand $ARGUMENTS (plus any Related docs mentioned and GitNexus context if available), do not do anything, wait for my next instruction.