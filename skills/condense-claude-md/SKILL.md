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
- **`Symptom | Cause | Fix` rows that restate the same fact twice** — Cause explains the mechanism, then Fix re-explains it in near-identical words before naming the action. State the mechanism ONCE (Cause), state the action ONCE (Fix). This is the single biggest lever on a large gotchas table — check it before anything else when a `Symptom | Cause | Fix` table is still bloated after other passes.
- **Incident narrative vs. mechanism** — cut "why this was discovered" archaeology (which class/test it broke, "tests with one user never catch it", "the bug is latent") and keep only the general mechanism + a short class-name pointer ("See `ClassName`"). A row needs the RULE for next time, not the story of how it was found.

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
4. **Lead with the rule, not the context** — "Use `&&` not `||` for ship idempotency" not "When checking ship conditions, you should prefer using `&&` over `||` because...". Base writing-style rules: `_shared/references/writing-style.md`.
5. **Section order**: Commands → Branches → Testing → Domain rules (alphabetical) → Deploy → Misc
6. **Split to a subdir CLAUDE.md when a whole section is subdir-local.** This is a real condensing lever, not just compression: a subdir `CLAUDE.md` auto-loads *additively* on top of its parents (editing `resources/js/routes/X` loads root + `resources/js/` + `routes/`), so a section can move down a level and leave only a one-line `> 📖` pointer behind. But apply the **seam-test** first: move a section ONLY if its rules are both needed in that subdir AND useless elsewhere. A token/money/table rule consumed across many sibling dirs is cross-cutting — splitting it forces you to either duplicate it into each subdir or orphan it, which is worse than a slightly longer layer file. Vertical-slice trees (`app/Domain/*`) usually pass the seam-test; horizontal-layer trees (`components/`, `pages/`, `hooks/`) usually fail it because their gotchas are about shared primitives used everywhere. When you do split, keep the parent's `> 📖` pointer carrying the single highest-cost fact inline — a fresh session won't follow a bare pointer.

## Process

1. `Read` the target CLAUDE.md fully
2. Mentally score each section: **keep as-is / compress / cut**
3. Identify any GitNexus `<!-- gitnexus:start/end -->` blocks — **preserve them verbatim**, they are managed separately
4. Rewrite the file from scratch using `Write` (not incremental `Edit`) — the new file replaces the old
5. Count lines: target ≤200 for project root CLAUDE.md. If still >250 after compressing, check for a section that passes the seam-test (Restructuring #6) and offer to split it to a subdir `CLAUDE.md` before asking which sections to cut — splitting relocates content without losing it, cutting loses it.

⚠️ **Line count alone is misleading for a one-row-per-item `Symptom | Cause | Fix` table** — it can already sit at the line target (one row per gotcha, rows never merge) while individual cells run 800–1400+ characters each. When this shape shows up, ALSO report `wc -c` before/after on the table's byte range, not just line count — that's the number that reflects whether the compression actually happened. If a first compression pass leaves line count unchanged but character count barely moved, the pass under-shot; re-run applying the Cause/Fix-redundancy rule above before declaring it done.

## Hard rules

- **Never use `Edit` for a full condensation** — `Write` the whole file; partial edits on a bloated file leave stale content between hunks
- **Strip tool-output wrapper artifacts before writing** — if the file content came into context via a `Read` result, do not carry over `<content>`/`</content>` or any other tool-framing tags into the `Write` payload. Verify the last line of the new file is real content, not a leaked tag.
- **Never rewrite GitNexus blocks** — copy them verbatim between `<!-- gitnexus:start -->` and `<!-- gitnexus:end -->`
- **Preserve all `{#anchor}` IDs** — other files may link to them
- **Preserve established column names** — when collapsing 3→2 columns, drop a column; never rename existing ones. `❌ NEVER | ✅ ALWAYS` stays verbatim; `Symptom | Cause | Fix` stays verbatim.
- **Don't invent content** — only restructure what exists; if something is unclear, compress it rather than rewrite its meaning
- **Report line count before and after** so the user can see the reduction
- **Verify no rows were silently dropped from a `Symptom | Cause | Fix` (or similar one-item-per-row) table** — a raw `grep -c '^|'` on old vs. new is NOT reliable (header/separator lines cause false deltas). Instead extract just the first column (`awk -F'|' '{print $2}'`) from both old and new versions and `diff` them — every old topic should still appear in the new list, just possibly reworded shorter. Do this before reporting success, not after the user asks.
