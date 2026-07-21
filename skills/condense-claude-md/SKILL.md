---
name: condense-claude-md
description: Aggressively condense and restructure a bloated CLAUDE.md file — strip verbose WHY columns, discoverable content, redundant tables, and overly long rows, then rewrite it shorter and clearer. Use when the user says "condense", "shrink", "trim", "clean up", or "make CLAUDE.md shorter", or when the file exceeds ~250 lines. Also use when asked to "restructure" or "rephrase" CLAUDE.md sections. Do NOT confuse with claude-md-improver (which adds missing content) — this skill removes excess.
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
6. **Split to a subdir CLAUDE.md when a whole section is subdir-local.** A subdir `CLAUDE.md` auto-loads *additively* on top of its parents, so a section can move down a level and leave only a one-line `> 📖` pointer behind — a real condensing lever, not just compression. Apply the **seam-test** first: move a section only if its rules are both needed in that subdir and useless elsewhere. Grep the section's 3-5 core symbols against every plausible sibling directory (`rg -l "<symbol>" <dir> --type=<lang> | wc -l`), not just the one its name suggests — usage counts decide, and a section can fail against the obvious guess while passing against a directory nobody thought to check. A token/money/table rule used across sibling dirs is cross-cutting and should stay at the layer level; vertical-slice trees (`app/Domain/*`) usually pass the seam-test, horizontal-layer trees (`components/`, `hooks/`) usually fail it. `.claude/rules/*.md` `paths:`/`globs:` frontmatter is NOT a substitute — those files always load in full regardless of frontmatter; only a real subdirectory `CLAUDE.md` scopes load-by-path. When you do split, keep the parent's `> 📖` pointer carrying the single highest-cost fact inline.

   If no real subdirectory passes the seam-test, check whether the section is feature-specific before accepting "stays in the layer file" — a feature-scoped gotcha section can route to that feature's task doc instead (`update-claude-docs/references/structure.md` §6 "second structural lever"). A genuinely cross-cutting section — no subdirectory and no single feature owns it — does NOT have to stay inline: the **manual companion-file split (#7) applies to ANY file, not just the global one**. When a big cross-cutting section (a 100+-row gotchas block) is the bulk of an oversized layer/project file, offer to move it to `.claude-companions/` (see #7), keeping only the highest-frequency rows inline. ⚠️ A failed subdir seam-test is the *trigger* for the companion split, not a dead end — reach for it before telling the user "it's dense, not bloated."

7. **Manually-referenced companion file** — the split for a section with no auto-loading target. Two cases need it: the **global `~/.claude/CLAUDE.md`** (tied to no subdirectory, so #6's auto-load split is unavailable at all), AND any **layer/project file** whose oversized section is genuinely cross-cutting (fails #6's subdir seam-test but isn't feature-owned). Move the lowest-frequency, most heterogeneous rows into `.claude-companions/<shared|local>/CLAUDE-<topic>.md`, keep the highest-frequency rows (come up almost every session) inline, and replace the moved block with a `> 📖` pointer.

   **Location**: one `.claude-companions/` folder at the nearest git-repo root (not a same-directory file, and not the monorepo root in a multi-repo checkout — each repo gets its own). For the global `~/.claude/CLAUDE.md` case, `~/.claude` is not itself a git repo — the companion folder is `~/.claude-companions/`, a sibling of `~/.claude/`, never nested inside it. Two subfolders split by trackability:
   - `shared/` — tracked in git. Use when the companion supports a checked-in file (a project CLAUDE.md, a subdir CLAUDE.md, a task doc) — team-visible, same as the parent.
   - `local/` — gitignored. Use when the companion supports a local-only file (`CLAUDE.local.md`, `.env`-adjacent notes) — never commit these regardless of what the parent file's own tracking state is.

   ⚠️ **The pointer's content is the whole ballgame — a companion file does NOT auto-load, so it helps ONLY if the pointer makes a reader open it.** A bare "see `CLAUDE-<topic>.md`" is the "silently unfollowed" failure this plugin's own gotcha tables warn about. Requirements:
   - Name **concrete trigger symptoms/tools**, never a generic category label alone.
   - If the moved section had **multiple sub-categories** (React / Chakra / Data…), the pointer must be a **per-category symptom index** — one line per category listing its distinctive symptoms (`chart.js renders black`, `TICKET_STATUS double-N`), so a reader matches their exact bug against the index and decides to open the file *without* opening it. A single trigger phrase is insufficient for a multi-category file.
   - Tell the user explicitly it does NOT auto-load like a subdir CLAUDE.md.
   - Existing cross-references to a moved anchor (`OldFile.md #{anchor}`) do NOT need repointing if the parent's own redirect line indexes that anchor by name (per the requirement above) — the reader lands on the parent, matches the anchor in the index, and follows it in one extra hop. Only repoint a reference when the anchor ISN'T named in the redirect index (renamed/merged during the move) — `grep -rn "<oldfile>. #<subanchor>"` across `tasks/**` + sibling CLAUDE.md to find those.
   - Maintenance rule to hand the user: when a companion row is later added, its symptom must also be added to the matching index bullet in the main file.
   - Writing to `.claude-companions/local/` for the first time in a repo: check `.gitignore` for `.claude-companions/local/` and add it if missing — don't assume a prior split already did this.

## Process

1. `Read` the target CLAUDE.md fully
2. Mentally score each section: **keep as-is / compress / cut**
3. **Draft + verify**: execution model is `_shared/references/two-tier-condense.md` — rewrite the file from scratch inline (`Write`, not incremental `Edit`), no spawned agent, using step 2's keep/compress/cut scoring. ⚠️ **Verify with a diff against the file's pre-draft state, not by re-reading the finished file** — an invented cause/mechanism reads as plausible as the real one until diffed against the actual source. (`git diff HEAD` is correct ONLY if the file was clean when you started; a CLAUDE.md carrying this session's own uncommitted entries needs a pre-draft snapshot, or your earlier edits read as regressions that were never real. Baseline rules: `_shared/references/two-tier-condense.md`.)
4. Count lines: target ≤200 for project root CLAUDE.md. If still >250 after compressing, check for a section that passes the seam-test (Restructuring #6) and offer to split it to a subdir `CLAUDE.md` before asking which sections to cut — splitting relocates content without losing it, cutting loses it.
5. **Always check `wc -c` alongside line count before reporting done — line count alone is not a valid completion signal.** A `Symptom | Cause | Fix` table has one row per gotcha, so rows never merge: it can sit at the ≤200-line target while cells still run 800+ characters (rule of thumb: ceiling is 40KB for a root CLAUDE.md; a non-root layer file — e.g. `app/CLAUDE.md` — has more slack but the same logic applies). If bytes are still above the ceiling after compressing, apply the Cause/Fix-redundancy rule (Restructuring #4) or offer a split — the subdir seam-test split (Restructuring #6) OR, when the bulk is one big cross-cutting section that fails the seam-test, the companion-file split (Restructuring #7, applies to any file) — via `AskUserQuestion` in the same turn. Don't wait for the user to push back, and don't stop at "it's dense, not bloated" while the companion split is still untried.
   ⚠️ **A single "already dense, light pass only" table (Process #6 below) is NOT a reason to skip this step** — it's the reason to run it *harder*. A light pass on an all-atomic-facts table caps out around 1-10% no matter how many times you re-run it (verified: a 48KB file dropped to 44KB on a full light pass — under the 40KB ceiling but only barely, and a separate 42KB file only reached 41.7KB, i.e. ~1.4%). If the byte count after Process #6's check is still at or above the ceiling, go straight to scoring the table's OWN rows for topic clusters (marketplace/POS/auth/etc.) and propose the companion split in the SAME turn you report the light-pass result — don't report "8% smaller" as if that were the finish line and wait to be told it's still bloated.

   ⚠️ **Reformatting prose into a table is not compression** — a table cell holds the same words as the paragraph it replaced, just wrapped in `|`, typically saving under 3% either way. Don't spend a pass on this expecting it to close a real gap; go straight to cutting/splitting content instead.

   ⚠️ **A file that's already ALL unique atomic facts (credential tables, ID/alias tables, one-gotcha-per-row) has no light-compression pass to run at all — check this BEFORE spending one.** Unlike the prose→table case above, there's no restated WHY, no Cause/Fix redundancy, no prose to tighten: every row is already a distinct fact (an MID, a container name, a client secret) that doesn't merge with any other row. Signal to skip straight to offering the split: skim 3-5 random rows — if none share a topic or restate another row's mechanism, don't attempt a compress pass; go directly to the seam-test/`AskUserQuestion` per Process #6.

## Hard rules

- **Never use `Edit` for a full condensation** — the drafting agent `Write`s the whole file (Process #3); partial edits on a bloated file leave stale content between hunks
- **Strip tool-output wrapper artifacts before writing** — see `_shared/references/strip-tool-output-tags.md`.
- **Preserve all `{#anchor}` IDs** — other files may link to them
- **Preserve established column names** — when collapsing 3→2 columns, drop a column; never rename existing ones. `❌ NEVER | ✅ ALWAYS` stays verbatim; `Symptom | Cause | Fix` stays verbatim.
- **Don't invent content** — only restructure what exists; if something is unclear, compress it rather than rewrite its meaning
- **Report both line count and `wc -c` byte count before/after** (see Process #6)
- **Verify no rows were silently dropped** — step 3's Verify (`_shared/references/two-tier-condense.md`) covers this via full-diff review. Table-specific supplement: extract the first column (`awk -F'|' '{print $2}'`) from old and new versions and `comm -23` them for a fast candidate list of possibly-dropped topics, then confirm each against the diff before escalating.
- **A changed `📖 <task-doc-path>` pointer is not automatically a violation** — if the drafter rewrote one, `ls` both the old and new path before reverting. A concurrent doc reorg (rename/merge/split already staged in the working tree, separate from this condense) can leave the OLD path dead and the drafter's NEW path the only one that resolves; reverting to "preserve verbatim" would silently re-break a pointer that was already broken before you started. Verify with `git status --short` on both paths — the old one staged-deleted (`D`) with the new one present confirms a real reorg, not a hallucination.
