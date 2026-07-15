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

⚠️ **Cutting ≠ discarding.** A rule that fails the repeat-mistake test for THIS file may still be load-bearing elsewhere (a feature-scoped gotcha, a decision worth a record). Before deleting anything you're not certain is dead, check whether it belongs in a task doc instead — route it via `update-claude-docs`, don't just drop it.

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
6. **Split to a subdir CLAUDE.md when a whole section is subdir-local.** A subdir `CLAUDE.md` auto-loads *additively* on top of its parents, so a section can move down a level and leave only a one-line `> 📖` pointer behind — a real condensing lever, not just compression. Apply the **seam-test** first: move a section only if its rules are both needed in that subdir and useless elsewhere. Grep the section's 3-5 core symbols against every plausible sibling directory (`rg -l "<symbol>" <dir> --type=<lang> | wc -l`), not just the one its name suggests — usage counts decide, and a section can fail against the obvious guess while passing against a directory nobody thought to check. A token/money/table rule used across sibling dirs is cross-cutting and should stay at the layer level; vertical-slice trees (`app/Domain/*`) usually pass the seam-test, horizontal-layer trees (`components/`, `hooks/`) usually fail it. `.claude/rules/*.md` `paths:`/`globs:` frontmatter is NOT a substitute — those files always load in full regardless of frontmatter (confirmed via canary test); only a real subdirectory `CLAUDE.md` scopes load-by-path. When you do split, keep the parent's `> 📖` pointer carrying the single highest-cost fact inline.

   If no real subdirectory passes the seam-test, check whether the section is feature-specific before accepting "stays in the layer file" — a feature-scoped gotcha section can route to that feature's task doc instead (`update-claude-docs/references/structure.md` §6 "second structural lever"). A genuinely cross-cutting section — no subdirectory and no single feature owns it — does NOT have to stay inline: the **manual companion-file split (#7) applies to ANY file, not just the global one**. When a big cross-cutting section (a 100+-row gotchas block) is the bulk of an oversized layer/project file, offer to move it to a sibling companion (`<dir>/CLAUDE-<topic>.md`), keeping only the highest-frequency rows inline. ⚠️ Don't declare the split "exhausted" after the subdir seam-test fails — that failure is the *trigger* for the companion split, not a dead end. This is the lever that produces a visible size drop; reach for it before telling the user "it's dense, not bloated."

7. **Manually-referenced companion file** — the split for a section with no auto-loading target. Two cases need it: the **global `~/.claude/CLAUDE.md`** (tied to no subdirectory, so #6's auto-load split is unavailable at all), AND any **layer/project file** whose oversized section is genuinely cross-cutting (fails #6's subdir seam-test but isn't feature-owned). Move the lowest-frequency, most heterogeneous rows to a sibling `<dir>/CLAUDE-<topic>.md`, keep the highest-frequency rows (come up almost every session) inline, and replace the moved block with a `> 📖` pointer.

   ⚠️ **The pointer's content is the whole ballgame — a companion file does NOT auto-load, so it helps ONLY if the pointer makes a reader open it.** A bare "see `CLAUDE-<topic>.md`" is the "silently unfollowed" failure this plugin's own gotcha tables warn about. Requirements:
   - Name **concrete trigger symptoms/tools**, never a generic category label alone.
   - If the moved section had **multiple sub-categories** (React / Chakra / Data…), the pointer must be a **per-category symptom index** — one line per category listing its distinctive symptoms (`chart.js renders black`, `TICKET_STATUS double-N`), so a reader matches their exact bug against the index and decides to open the file *without* opening it. A single trigger phrase for a multi-category file is insufficient (this is what a real session had to correct twice).
   - Tell the user explicitly it does NOT auto-load like a subdir CLAUDE.md.
   - ⚠️ Moving a section moves its `{#anchor}` sub-anchors too — `grep -rn "<oldfile>. #<subanchor>"` across `tasks/**` + sibling CLAUDE.md and repoint every cross-reference to the companion, or they silently break.
   - Maintenance rule to hand the user: when a companion row is later added, its symptom must also be added to the matching index bullet in the main file.

## Process

1. `Read` the target CLAUDE.md fully
2. Mentally score each section: **keep as-is / compress / cut**
3. Rewrite the file from scratch using `Write` (not incremental `Edit`) — the new file replaces the old
4. Count lines: target ≤200 for project root CLAUDE.md. If still >250 after compressing, check for a section that passes the seam-test (Restructuring #6) and offer to split it to a subdir `CLAUDE.md` before asking which sections to cut — splitting relocates content without losing it, cutting loses it.
5. **Always check `wc -c` alongside line count before reporting done — line count alone is not a valid completion signal.** A `Symptom | Cause | Fix` table has one row per gotcha, so rows never merge: it can sit at the ≤200-line target while cells still run 800+ characters and total bytes stay near ~20kb (rule of thumb: target ~15kb for a root CLAUDE.md). If bytes are still high after compressing, apply the Cause/Fix-redundancy rule (Restructuring #4) or offer a split — the subdir seam-test split (Restructuring #6) OR, when the bulk is one big cross-cutting section that fails the seam-test, the companion-file split (Restructuring #7, applies to any file) — via `AskUserQuestion` in the same turn. Don't wait for the user to push back, and don't stop at "it's dense, not bloated" while the companion split is still untried.

   ⚠️ **Reformatting prose into a table is not compression** — a table cell holds the same words as the paragraph it replaced, just wrapped in `|`. Confirmed on a real run: converting 14 prose paragraphs to a 2-column table moved line count 324→314 and bytes 32.9kb→32.2kb — under 3% either way. Don't spend a pass on this expecting it to close a real gap; go straight to cutting/splitting content instead.

   ⚠️ **A file that's already ALL unique atomic facts (credential tables, ID/alias tables, one-gotcha-per-row) has no light-compression pass to run at all — check this BEFORE spending one.** Unlike the prose→table case above, there's no restated WHY, no Cause/Fix redundancy, no prose to tighten: every row is already a distinct fact (an MID, a container name, a client secret) that doesn't merge with any other row. Confirmed on a real run: light tightening of such a file moved 289→284 lines, 29.4kb→28.3kb (~4%) before the seam-test split (Restructuring #6) did the real work. Signal to skip straight to offering the split: skim 3-5 random rows — if none share a topic or restate another row's mechanism, don't attempt Step 51-54's compress pass; go directly to the seam-test/`AskUserQuestion` per Process #6.

## Hard rules

- **Never use `Edit` for a full condensation** — `Write` the whole file; partial edits on a bloated file leave stale content between hunks
- **Strip tool-output wrapper artifacts before writing** — if the file content came into context via a `Read` result, do not carry over `<content>`/`</content>` or any other tool-framing tags into the `Write` payload. Verify the last line of the new file is real content, not a leaked tag.
- **Preserve all `{#anchor}` IDs** — other files may link to them
- **Preserve established column names** — when collapsing 3→2 columns, drop a column; never rename existing ones. `❌ NEVER | ✅ ALWAYS` stays verbatim; `Symptom | Cause | Fix` stays verbatim.
- **Don't invent content** — only restructure what exists; if something is unclear, compress it rather than rewrite its meaning
- **Report both line count and `wc -c` byte count before/after** (see Process #6)
- **Verify no rows were silently dropped**: extract the first column (`awk -F'|' '{print $2}'`) from old and new versions and `comm -23` them — every old topic should still appear, possibly reworded. Treat the output as a candidate list, not a verdict: most flags are rewording false positives, not real drops. For each flagged line, `grep -c '<distinctive substring>'` the new file to confirm the content is actually present before escalating.
