---
description: Update existing task summaries based on recent session work. Appends new findings, updates status, removes completed items, and refactors as needed.
argument-hint: "[optional: domain/feature or full path]"
---

Update task summaries to reflect session outcomes.

## Path Resolution

| $ARGUMENTS | Target |
|------------|--------|
| Provided | Use as-is (supports full paths) |
| Empty | Scan conversation → `tasks/<domain>/<feature>/current.md` |
| File missing | Abort: "No summary found. Use `/write-summary` first." |

## ⚠️ CRITICAL: Multi-Domain Check (BLOCKING STEP)

**You MUST output this scan FIRST, before any edits:**

```markdown
## Multi-Domain Scan

**Existing docs found:**
- tasks/training/participant/current.md
- tasks/training/jd14/current.md
- tasks/training/certificate/current.md
- ...

**Files modified this session:**
| File | Domain |
|------|--------|
| app/Jobs/GenerateCertificatePdfJob.php | training/certificate |
| app/Domains/Tenant/Models/Certificate.php | training/certificate |
| ... | ... |

**Domains to update:**
- PRIMARY: tasks/training/certificate/current.md
- SECONDARY: tasks/training/participant/current.md (certificates relate to participants)
- SECONDARY: tasks/training/jd14/current.md (both use training context)

**Action plan:**
1. Update PRIMARY with full changes
2. Add cross-reference to SECONDARY docs
3. Check shared gotchas registry
```

❌ **WRONG behavior (what Claude did before):**
```
1. Read primary doc
2. Make small edit
3. Output "Updated: tasks/.../current.md"
4. Skip secondary domains entirely
```

✅ **RIGHT behavior:**
```
1. OUTPUT multi-domain scan table (show your work)
2. Read ALL affected docs
3. Update PRIMARY with full changes
4. Update SECONDARY with cross-references
5. Output structured report showing ALL updates
```

**WHY secondary docs matter:**
- User finds stale cross-references in related docs
- User expects "certificate" mentioned in "participant" doc if they're related
- User grepped "Related:" and found missing links
- Future sessions miss context because links are one-way

---

## Workflow

### 1. Read Primary Target
Use Read tool on target file before making changes.

### 2. Scan Session for All Touched Domains (MANDATORY)

Review the conversation for:
- File paths mentioned (extract domain from `app/Domains/{Domain}/`)
- Task doc references (`@tasks/{domain}/{feature}/`)
- Explicit domain mentions in user messages
- Database tables touched (map to domains via naming)

Build list of affected domains. Example:
```
Session touched:
- training/participant/ (primary - enrollment fixes)
- training/jd14/ (secondary - duplicate check)  
- amendments/ (secondary - status transition)
```

### 3. Identify Changes Per Domain

For each domain, extract:
- **New content**: API endpoints, database changes, file modifications, bugs/solutions
- **Status changes**: Features completed, blockers resolved, timeline shifts
- **Completed work**: Checklist items done, next steps finished
- **Obsolete content**: Workarounds replaced, temporary fixes removed
- **Decisions**: New decisions with rationale

### 4. DRY Check (Before Writing)

| Question | Action |
|----------|--------|
| In another task doc? | Cross-reference, skip duplication |
| Gotcha in 3+ domains? | Add to `tasks/shared/gotchas-registry.md` AND each domain doc |
| Shared pattern (payment type, colors)? | Add to `tasks/shared/*.md`, reference in domains |
| Appears in 2+ features within same domain? | Designate canonical doc, cross-ref others |

**Cross-reference format:**
```markdown
> See [`path/to/file.md#anchor`](../path/to/file.md#anchor) — [1-line summary]
```

### 5. Update Each Domain Doc

For primary + all secondary domains:

1. **Read existing summary** (if not already read)
2. **Apply updates** using section rules below
3. **Add cross-references** to related domains
4. **Note shared gotchas** (will consolidate in step 6)

**Section Update Rules:**

| Section | Add | Update | Remove |
|---------|-----|--------|--------|
| Status line | - | Emoji, timeline, blockers | - |
| LLM-CONTEXT → Related | Cross-refs to other domains | - | Dead links |
| Decisions table | Prepend new rows | - | - |
| API Endpoints table | Append new endpoints | Modify changed endpoints | Removed endpoints |
| Database Changes | New migrations/columns | Schema modifications | - |
| Gotchas table | Prepend new with symptoms | Enhance weak entries | Obsolete workarounds |
| Implementation Checklist | New tasks | - | Check off completed |
| Next Steps | New planned work | - | Completed items |
| Files Created/Modified | New files | Updated files | - |

**Operations:**

- **Add**: New information from this session
- **Update**: Existing content that changed (status, endpoints, schema)
- **Remove**: Completed checklist items, finished next steps, obsolete workarounds
- **Enhance**: Weak gotchas → add symptoms, vague decisions → add rationale

**Preserve**: Historical decisions, resolved bugs (with resolution), completed checklists (check them off, don't delete)

### 6. Consolidate Shared Gotchas

After updating domain docs, check if any gotcha appears in 3+ domains:

1. **Read** `tasks/shared/gotchas-registry.md`
2. **Add** cross-domain gotchas with domain list
3. **Update** domain docs to reference shared registry

Format for shared registry:
```markdown
| Gotcha | Domains | Solution |
|--------|---------|----------|
| BackedEnum cast error | Training, Amendments, Billing | Cast to `->value` before DB |
```

### 7. Refactor If Needed

| Trigger | Action |
|---------|--------|
| Section > 200 lines | Condense: merge similar items, move details to code comments |
| Duplicate patterns | Extract to shared doc, cross-reference |
| Completed checklists fill page | Move to `archive/completed-YYYY-MM.md` |
| 10+ "Next Steps" | Group by milestone, defer low-priority |
| Obsolete workarounds | Remove if permanent fix deployed |

**Don't remove**: Production incident details, root cause analyses, architectural decisions

### 8. Archive Cleanup (If Needed)

| Content | Action |
|---------|--------|
| Production SQL scripts, specific IDs | Move to `archive/` subdirectory |
| Session logs, user stories | Move to `archive/` subdirectory |
| Completed milestone checklists | Move to `archive/completed-YYYY-MM.md` |
| Empty placeholder files | Delete |
| Timeless patterns/gotchas | Keep in `current.md` |

**Rule**: Archive preserves incident learning; only delete truly empty content.

## Required Formats

### Gotcha Table (Symptoms Required)
| Error/Symptom | Root Cause | Solution |
|---------------|------------|----------|
| `500 on POST /invoices` | Timezone mismatch | `->setTimezone('UTC')` |

First column must contain: error code, log fragment, or user-visible symptom.

### Cross-References in LLM-CONTEXT
```markdown
## LLM-CONTEXT
Related:
- [`tasks/training/jd14/current.md`](../training/jd14/current.md) — Duplicate prevention logic
- [`tasks/amendments/current.md`](../../amendments/current.md) — Status transition rules
```

### Next Steps (Only if Pending)
```markdown
## Next Steps
- [ ] Brief actionable item — context why needed
```

**Rules**:
- Remove section entirely if nothing pending
- Only items discussed/planned but not done this session
- Delete items once completed in future sessions
- Keep actionable (starts with verb)

### Checklist Updates
```markdown
## Implementation Checklist
- [x] ~~Create migration~~ (completed this session)
- [x] Add API endpoint (completed)
- [ ] Write tests (pending)
```

Use strikethrough for newly completed items to show progress.

## Output Format

**⚠️ Output MUST start with the multi-domain scan, then updates:**

```
## Multi-Domain Scan

Existing docs: 12 found (tasks/**/current.md)

Files modified this session:
| File | Domain |
|------|--------|
| app/Jobs/X.php | training/certificate |
| resources/js/domains/training/... | training/certificate |

Domains to update:
- PRIMARY: training/certificate
- SECONDARY: training/participant (Related: field links)
- SKIPPED: training/jd14 (no changes relevant)

---

## Updates

Primary:
✓ tasks/training/participant/current.md (234 lines → 218 lines)
  Added:
  - Enrollment validation gotcha
  - 2 new API endpoints
  Updated:
  - Status: In Progress → Testing
  - Modified POST /enroll endpoint (added duplicate check)
  Removed:
  - 3 completed next steps
  - Obsolete timezone workaround (permanent fix deployed)
  Cross-refs:
  - Linked to JD14 duplicate logic

Secondary:
✓ tasks/training/jd14/current.md (156 lines → 162 lines)
  Added:
  - Duplicate check decision
  Updated:
  - Checked off 2 implementation items
  Cross-refs:
  - Linked to participant enrollment
  
✓ tasks/amendments/current.md (189 lines → 195 lines)
  Added:
  - Status transition gotcha
  Updated:
  - Enhanced existing enum gotcha with symptom
  Cross-refs:
  - Linked to enrollment workflow

Shared:
✓ tasks/shared/gotchas-registry.md
  - No new cross-domain gotchas (threshold: 3+ domains)

Refactoring:
- Condensed participant/current.md Implementation section (merged 5 similar checklist items)
- Archived completed JD14 milestone to archive/completed-2025-01.md
```

Or if only one domain:
```
Updated: tasks/billing/invoices/current.md (312 lines → 298 lines)

Added:
- SST calculation gotcha (symptom: incorrect total in preview)
- 1 database column (invoices.sst_rate)

Updated:
- Status: Blocked → In Progress (LHDN API access granted)
- Modified schema diagram
- Checked off 3 completed items

Removed:
- 4 completed next steps
- Temporary manual calculation workaround

Multi-domain scan: ✓ No other domains affected (checked: amendments, training)
```

**⚠️ REQUIRED**: Output must ALWAYS include one of:
- `Secondary: [list of secondary docs updated]`
- `Multi-domain scan: ✓ No other domains affected (checked: X, Y, Z)`

Never output just the primary update without confirming secondary check was done.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Didn't update training/jd14/" | Explicitly list files: `@tasks/training/jd14/current.md` |
| "Only updated primary" | Check: Did session actually touch other domains? |
| "Duplicated content" | Run DRY check; use cross-references |
| "Removed too much" | Only remove: completed items, obsolete workarounds, dead links |
| "File grew too large" | Apply refactoring rules; move completed work to archive |