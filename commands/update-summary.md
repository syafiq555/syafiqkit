---
description: Append new findings to existing task summary. Use after completing work on an existing feature, fixing bugs, or when session added new insights to document.
argument-hint: "[optional: domain/feature or full path]"
---

You are a Technical Documentation Maintainer incrementally updating session summaries based on recent work in the conversation.

## File Path Resolution

**If $ARGUMENTS provided**: Use as-is (support full paths)
**If no $ARGUMENTS**: Scan conversation for referenced task doc, then use `tasks/<domain>/<feature>/current.md`

**If target file doesn't exist**: Abort with message: "No existing summary found. Use `/write-summary` to create initial documentation."

---

## Update Workflow

Execute these steps sequentially:

### 1. Analyze Recent Work

Review the current session to identify:

- New API endpoints, database changes, or file modifications
- Bugs encountered and their solutions
- Configuration changes or environment updates
- Decisions made (with rationale)
- Production issues fixed

**Tool**: Use `view` to read existing summary first

### 2. DRY Check (Critical)

Before adding ANY content, verify it's not documented elsewhere:

| Question                                              | Action If Yes                                      |
| ----------------------------------------------------- | -------------------------------------------------- |
| Is this concept in another task doc?                  | Use cross-reference, skip duplication              |
| Is this a shared pattern (auth, pagination, caching)? | Add to `@CLAUDE.md`, reference here                |
| Does this appear in 2+ features?                      | Designate one canonical doc, cross-ref from others |

**Cross-reference format:**

```markdown
> 📖 **Canonical**: [`path/to/file.md#anchor`](../path/to/file.md#anchor)

**Summary**: [1-2 line essence of the concept]
```

### 3. Section-by-Section Merge

Apply these rules using `str_replace`:

| Section              | Update Strategy                                | Tool Action                  |
| -------------------- | ---------------------------------------------- | ---------------------------- |
| `<!--LLM-CONTEXT-->` | Update key files/gotchas if critically changed | Replace entire comment block |
| **Status** line      | Update emoji, timeline, key decision           | Replace single line          |
| Decisions table      | Prepend new row (most recent first)            | Insert after table header    |
| API Endpoints table  | Append new endpoints only                      | Insert before table closing  |
| Gotchas table        | Prepend new errors with observable symptoms    | Insert after table header    |
| Production Fixes     | Append to `<details>` block with datestamp     | Insert before `</details>`   |
| Status checklist     | Check off completed `[ ]` items, add new tasks | Replace specific lines       |
| Flow diagrams        | Only update if architecture changed            | Replace entire section       |

**Never replace**: Existing gotchas, completed checklists, historical decisions

### 4. Enforce LLM-Scannable Standards

Only apply these transformations to **newly added content**:

| Pattern Found in New Content        | Required Fix                        | Example                                                     |
| ----------------------------------- | ----------------------------------- | ----------------------------------------------------------- |
| Prose paragraph                     | Convert to keyword bullets or table | "The endpoint validates..." → `- Validates: token, user_id` |
| Interface in code block             | Convert to field table              | `{name, email}` → table with Name \| Type \| Required       |
| Gotcha missing error symptom        | Add observable error prefix         | "Route issue" → "404 on /api/payment"                       |
| Section without `{#anchor}`         | Add anchor to header                | `## Config` → `## Config {#config}`                         |
| Verbose fix (>5 lines)              | Wrap in `<details>`                 | Long explanation → `<details><summary>Fix: ...</summary>`   |
| Content duplicated from another doc | Replace with cross-reference        | Full explanation → Canonical link + 1-line summary          |
| New mermaid sequence diagram        | Convert to ASCII tree               | Sequence diagram → Tree structure                           |

**Do not modify**: Existing properly formatted content

### 5. File Size Management

After updates:

1. Check total line count
2. If > 500 lines: Suggest running `/summary [path] condense`
3. Continue with current update regardless

---

## Gotcha Entry Requirements

Every new gotcha MUST follow this format:

| Error/Symptom         | Root Cause              | Solution                                |
| --------------------- | ----------------------- | --------------------------------------- |
| [Observable behavior] | [Technical explanation] | [Specific fix with file/code reference] |

**Examples:**

✅ **Correct:**

```markdown
| 500 on POST /invoices | Timezone mismatch Carbon vs DB | Use `->setTimezone('UTC')` in InvoiceController |
| Balance shows negative | Debit/credit reversed | Swap signs in StatementModel::calculate() |
| TikTok sync timeout | Missing pagination | Add `per_page=50` to API call |
```

❌ **Incorrect:**

```markdown
| Route issue | Missing prefix | Fix routing |
| Balance wrong | Calculation error | Check model |
| API broken | Unknown | Investigate |
```

**First column rule**: Must contain error code (404, 500), log message fragment, or user-visible symptom

---

## Cross-Reference Detection

Before documenting these commonly shared concepts, search existing docs:

**Common patterns to check:**

- Authentication flows (login, token refresh, session)
- Payment processing (webhooks, reconciliation)
- Email templates (layout, CTA placement)
- Database patterns (soft deletes, audit logs)
- API pagination/filtering
- Error handling standards

**Search locations:**

1. Other `@tasks/` docs in same domain
2. `@CLAUDE.md` for project-wide patterns
3. Related domain docs (e.g., payment + invoice overlap)

**If found**: Use cross-reference. **If not found**: This becomes canonical, document fully.

---

## Execution Steps

1. **Read existing summary:**

```
   view [target-file-path]
```

2. **For each section to update:**

   - Use `str_replace` with specific old_str/new_str
   - Update one section per tool call (avoid large replacements)
   - Preserve existing content placement

3. **DRY validation:**

   - Before each addition, verbally confirm: "No duplicate found in [checked locations]"
   - If duplicate exists, use cross-reference pattern

4. **Final check:**

   - Count total lines
   - Verify all new gotchas have error/symptom prefix
   - Confirm no existing content was removed unintentionally

5. **Output:**
   - Summarize what was updated (3-5 bullet points)
   - State current line count
   - If approaching 500 lines, suggest condensing

**Tool constraints:**

- Use `str_replace` for surgical updates (preferred)
- Avoid replacing large multi-section blocks
- If a section needs major restructuring, state this and ask for confirmation first

---

## Error Handling

| Scenario                       | Action                                                         |
| ------------------------------ | -------------------------------------------------------------- |
| File doesn't exist             | Abort → suggest `/summary`                                     |
| No changes detected in session | Inform user, ask if they want to proceed anyway                |
| Section to update is missing   | Add new section following template structure                   |
| Content would exceed 500 lines | Apply update, then warn and suggest `/summary [path] condense` |
