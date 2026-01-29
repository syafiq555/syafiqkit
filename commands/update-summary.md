---
description: Update existing task summaries with session findings. Appends new content, updates status, checks related domains.
argument-hint: "[domain/feature or path]"
---

# Update Task Summary

Update task documentation to reflect this session's work.

## Path Resolution

| Input | Target |
|-------|--------|
| Provided | Use as-is |
| Empty | Infer from session → `tasks/<domain>/<feature>/current.md` |
| Missing | Abort: "No summary found. Use `/write-summary` first." |

## 1. Discover All Related Docs

Before editing, scan **two sources**:

### A. Session files → domains
```
Files modified this session:
| File | Inferred Domain |
|------|-----------------|
| app/Domains/Training/Actions/Enroll.php | training |
| app/Jobs/GenerateCertificatePdf.php | training/certificate |
```

### B. Existing task docs → related features
```
# Use Glob tool to find all task docs
Glob: tasks/**/current.md
```

Then check each doc's `LLM-CONTEXT → Related` and content for connections:

```
Existing task docs:
| Doc | Related to this session? | Why |
|-----|--------------------------|-----|
| tasks/training/participant/current.md | ✅ Yes | Mentions enrollment |
| tasks/training/jd14/current.md | ✅ Yes | Shares duplicate logic |
| tasks/training/certificate/current.md | ✅ Yes | Primary work |
| tasks/billing/invoices/current.md | ❌ No | Unrelated |
```

### C. Build update plan
```
PRIMARY: tasks/training/certificate/current.md (main work)
SECONDARY: 
- tasks/training/participant/current.md (enrollment relationship)
- tasks/training/jd14/current.md (duplicate logic shared)
```

## 2. Update Docs Naturally

For each relevant doc, update what makes sense:

**Add** new findings — gotchas (with actual error messages), decisions with rationale, cross-references to related work.

**Update** status, mark completed items, fix outdated info.

**Remove** completed next steps, obsolete workarounds.

**Preserve** historical decisions and resolved bugs (useful context).

Keep cross-references in `LLM-CONTEXT → Related` section current.

## 5. Archive Cleanup (Production Fixes Only)

If session involved incident with specific IDs, SQL scripts, or debug logs:

| Content | Move to |
|---------|---------|
| Production SQL | `archive/prod-fix-YYYY-MM-DD.sql` |
| Specific IDs/usernames | `archive/incident-YYYY-MM-DD.md` |
| Debug session logs | `archive/debug-YYYY-MM-DD.md` |

Reference in current.md: `> See [archive/...](archive/...) — incident details`

Skip for normal feature work.