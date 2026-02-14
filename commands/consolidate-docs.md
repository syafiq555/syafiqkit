---
description: Consolidate related task documents into one
argument-hint: "[main-doc-path or domain/feature]"
disable-model-invocation: true
---

# Consolidate Task Documents

Merge multiple related task documents into a single structured document with anchor IDs. Deletes source files and updates all cross-references.

## Step 1: Resolve Main Document Path

| Input | Action |
|-------|--------|
| Full path (e.g. `tasks/training/participant/current.md`) | Use as-is |
| Short form (e.g. `training/participant`) | Expand to `tasks/{domain}/{feature}/current.md` |
| Empty | **Abort** — main doc path is required |

```
Read: {resolved path}
```

If file not found → abort with error.

## Step 2: Discover Related Documents

### 2.1 Parse main doc's `LLM-CONTEXT → Related:` field

Extract all `tasks/**/current.md` paths listed in `Related:`.

### 2.2 Grep for inbound references

```
Grep: pattern="{main-doc-filename}", path="tasks/", glob="**/current.md"
```

Find docs that reference the main doc (inbound cross-refs).

### 2.3 Follow one level deep

For each discovered doc, read its `LLM-CONTEXT → Related:` to find additional connected docs.

### 2.4 Build final set

Deduplicate all discovered paths. **Exclude**:

| Exclude | Reason |
|---------|--------|
| `tasks/shared/*` | Shared docs stay separate |
| Status: `Reference` | Reference docs are standalone |
| Main doc itself | It's the merge target, not a source |

If **no related docs found** → abort, nothing to consolidate.

### 2.5 Read all source docs

Read every doc in the final set. You now have the main doc + N related docs.

## Step 3: Build Merged Document

Write the consolidated document to the **main doc's path** (overwrite).

### Structure

```markdown
<!--LLM-CONTEXT
Purpose: {main doc's Purpose}
Key files: {union of all Key files from all docs, deduplicated}
Related: {any docs referenced but NOT merged — e.g. shared docs, Reference-status docs}
Status: {main doc's Status}
Domain: {main doc's Domain}
Last updated: {today's date}
-->

# {Main Doc Title} - Consolidated

**Status**: {status}

**Consolidated from**:
- `{source-path-1}` ({status})
- `{source-path-2}` ({status})

## Overview {#overview}

{Main doc's overview/summary content}

---

## {Source Doc Title} {#domain-feature}

> Source: `{original-path}`

### Overview {#domain-feature-overview}

{Source doc overview}

### Decisions {#domain-feature-decisions}

{Source doc decisions}

---

{Repeat for each source doc}

## Consolidated Gotchas {#consolidated-gotchas}

Deduplicated gotchas from all source documents.

| Symptom | Cause | Fix | Source |
|---------|-------|-----|--------|
| {row} | {row} | {row} | {domain/feature} |

## Next Steps {#next-steps}

{Merged next steps from all docs, deduplicated}
```

### Anchor ID Rules

**Format**: `#{domain}-{feature}-{section-slug}`

**Slugification**:
1. Lowercase everything
2. Replace spaces with hyphens
3. Remove non-alphanumeric characters (keep hyphens)
4. Collapse multiple hyphens

**Examples**:
| Section | Anchor |
|---------|--------|
| `## Overview` in `training/participant` | `#training-participant-overview` |
| `## Architecture Decisions` in `billing/invoice` | `#billing-invoice-architecture-decisions` |

**Collision**: If anchor already exists, append `-2`, `-3`, etc.

### Deduplication

**Gotcha rows**: Rows with identical Symptom + Cause + Fix → keep one, add Source column.

**Decision rows**: Rows with identical Decision + Rationale → keep one.

**Next steps**: Identical items → keep one.

## Step 4: Delete Source Files

**Safety**: Read back the merged document to verify it was written correctly before deleting anything.

```
Read: {main-doc-path}  # Verify merged doc exists and has content
```

Then delete each merged source file (NOT the main doc — it was overwritten with merged content):

```bash
rm tasks/{domain}/{feature}/current.md  # Each source doc
```

Remove empty directories:

```bash
find tasks/ -type d -empty -delete
```

## Step 5: Update Cross-References in Other Docs

### 5.1 Find referencing docs

```
Grep: pattern="{deleted-source-path}", path="tasks/", glob="**/current.md"
```

Run for each deleted path. Exclude the merged doc itself.

### 5.2 Update references

For each referencing doc, use Edit to replace old paths:

| Reference Type | Old | New |
|----------------|-----|-----|
| `LLM-CONTEXT Related:` | `tasks/old/path/current.md` | `tasks/main/path/current.md` |
| Inline link | `[text](../old/current.md)` | `[text](../main/current.md#old-domain-feature)` |
| Inline link + anchor | `[text](../old/current.md#section)` | `[text](../main/current.md#old-domain-feature-section)` |

Deduplicate Related field entries (if merged path already listed).

## Step 6: Report

Output this summary:

```markdown
## Consolidation Complete

| Metric | Value |
|--------|-------|
| Main document | {path} |
| Docs merged | {count} |
| Files deleted | {count} |
| Cross-refs updated | {count} in {N} files |

### Merged Documents
- `{path1}` (Status: {status})
- `{path2}` (Status: {status})

### Updated References
- `{doc}`: {N} references updated

### Recovery
All deleted files are recoverable via `git checkout -- {path}`
```

## Edge Cases

| Scenario | Handling |
|----------|----------|
| Main doc not found | Abort with error message |
| No related docs found | Abort — nothing to consolidate |
| Related doc is Status: Reference | Skip (don't merge) |
| Related doc in `tasks/shared/*` | Skip (shared stays separate) |
| Circular refs (A→B, B→A) | Merge both into main |
| Duplicate gotchas | Keep one row, add Source column |
| Anchor ID collision | Append `-2`, `-3` suffix |
| Source doc has no sections | Include as single block under its heading |
