---
name: condense-claude-md
description: Aggressively condense and restructure a bloated CLAUDE.md file — strip verbose WHY columns, discoverable content, redundant tables, and overly long rows, then rewrite it shorter and clearer. Use when the user says "condense", "shrink", "trim", "clean up", or "make CLAUDE.md shorter", or when the file exceeds ~250 lines. Also use when asked to "restructure" or "rephrase" CLAUDE.md sections. Do NOT confuse with claude-md-improver (which adds missing content) — this skill removes excess.
tools: Read, Write, Bash
---

# Condense CLAUDE.md

The goal is maximum information density: every line must earn its place. A reader should be able to scan the file in under two minutes and find every non-obvious rule.

## What to cut

**Always remove:**
- WHY/reason columns in ❌/✅ tables when the rule is self-evident from the pairing alone
- Rows that restate what the code or framework already enforces (e.g. "use $fillable", "validate user input")
- Sections duplicated from the global `~/.claude/CLAUDE.md` (check for exact same content)
- Controller/method lists, event→listener tables, file structure trees — discoverable from `routes/`, `EventServiceProvider`, `ls`
- Generic best practices not specific to this codebase
- Obvious "gotchas" that are just standard PHP/Laravel/JS behavior
- Changelog entries, PR summaries, or session notes embedded in the file
- Empty or near-empty sections (one sentence with no actionable content)

**Compress, don't delete:**
- Long multi-sentence table rows → one tight sentence; move the nuance to a comment only if truly non-obvious
- Nested sub-tables that repeat the parent structure → flatten or inline
- "Never do X" + "Always do Y" + separate WHY paragraph → single ❌/✅ row

## What to keep

Every rule that, if removed, would cause Claude to repeat a real past mistake. Signals:
- A concrete example where the wrong path caused a bug or silent failure
- A counter-intuitive behavior (e.g. Shopee returns `error:""` on success, not null)
- A sharp edge specific to THIS project's architecture (not general Laravel)
- A non-obvious ordering constraint (e.g. FLUSHDB before restart horizon, not after)

## Restructuring approach

1. **Group by domain** — stock, API calls, queue jobs, deploy, misc. Don't mix concerns in one section.
2. **Collapse 3-column tables** (❌ / ✅ / WHY) to 2-column when WHY is obvious. Add a `*` footnote only when the WHY is surprising.
3. **Prefer bullet lists over tables** for prose rules with no clear column structure.
4. **Lead with the rule, not the context** — "Use `&&` not `||` for ship idempotency" not "When checking ship conditions, you should prefer using `&&` over `||` because..."
5. **Section order**: Commands → Branches → Testing → Domain rules (alphabetical) → Deploy → Misc

## Process

1. `Read` the target CLAUDE.md fully
2. Mentally score each section: **keep as-is / compress / cut**
3. Identify any GitNexus `<!-- gitnexus:start/end -->` blocks — **preserve them verbatim**, they are managed separately
4. Rewrite the file from scratch using `Write` (not incremental `Edit`) — the new file replaces the old
5. Count lines: target ≤200 for project root CLAUDE.md. Flag if still >250 and ask user which sections to cut further.

## Hard rules

- **Never use `Edit` for a full condensation** — `Write` the whole file; partial edits on a bloated file leave stale content between hunks
- **Never rewrite GitNexus blocks** — copy them verbatim between `<!-- gitnexus:start -->` and `<!-- gitnexus:end -->`
- **Preserve all `{#anchor}` IDs** — other files may link to them
- **Don't invent content** — only restructure what exists; if something is unclear, compress it rather than rewrite its meaning
- **Report line count before and after** so the user can see the reduction
