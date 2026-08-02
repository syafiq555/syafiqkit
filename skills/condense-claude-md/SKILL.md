---
name: condense-claude-md
description: Aggressively condense and restructure a bloated CLAUDE.md file — strip verbose WHY columns, discoverable content, redundant tables, and overly long rows, then rewrite it shorter and clearer. Use when the user says "condense", "shrink", "trim", "clean up", or "make CLAUDE.md shorter", or when the file exceeds ~250 lines. Also use when asked to "restructure" or "rephrase" CLAUDE.md sections. Do NOT confuse with claude-md-improver (which adds missing content) — this skill removes excess.
---

# Condense CLAUDE.md

The goal is maximum information density: every line must earn its place. A reader should be able to scan the file in under two minutes and find every non-obvious rule.

This skill is the single source of truth for CLAUDE.md size policy — thresholds, budgets a file declares for itself, and every split decision (subdir, task doc, companion file). No other skill or agent carries its own number. `claude-md-pruner` delegates here (its step 0) and keeps only staleness/duplication verified against the live repo; it exists for `memory: project` + background spawning, not for owning a threshold. The task-doc equivalent is `condense-task-doc` — same rule, different artifact.

A pre-existing `.claude-companions/<shared|local>/CLAUDE-*.md` is a condense target in its own right, not just a place content gets moved to — on a bare invocation, `Glob .claude-companions/**/*.md` alongside the usual `**/CLAUDE.md` sweep. 📖 `../_shared/references/declared-budget.md`.

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

Cutting isn't the same as discarding. A rule that fails the repeat-mistake test for THIS file may still be load-bearing elsewhere (a feature-scoped gotcha, a decision worth a record). Before deleting anything you're not certain is dead, check whether it belongs in a task doc instead — route it via `update-claude-docs`, don't just drop it.

**Compress, don't delete:**
- Long multi-sentence table rows → one tight sentence; move the nuance to a comment only if truly non-obvious
- Nested sub-tables that repeat the parent structure → flatten or inline
- "Never do X" + "Always do Y" + separate WHY paragraph → single ❌/✅ row
- `Symptom | Cause | Fix` rows that restate the same fact twice — Cause explains the mechanism, then Fix re-explains it in near-identical words before naming the action. State the mechanism once (Cause), state the action once (Fix). This is the single biggest lever on a large gotchas table — check it before anything else when a `Symptom | Cause | Fix` table is still bloated after other passes.
- Incident narrative vs. mechanism — cut "why this was discovered" archaeology (which class/test it broke, "tests with one user never catch it", "the bug is latent") and keep only the general mechanism + a short class-name pointer ("See `ClassName`"). A row needs the rule for next time, not the story of how it was found.

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
4. **Lead with the rule, not the context** — "Use `&&` not `||` for ship idempotency" not "When checking ship conditions, you should prefer using `&&` over `||` because...". Base writing-style rules: `../_shared/references/writing-style.md`.
5. **Section order**: Commands → Branches → Testing → Domain rules (alphabetical) → Deploy → Misc

"Split" names a shape, not a destination, and the shape only applies once a file is actually over budget — this is a deliberately hardened gate, not a style preference: a session once jumped straight to creating new companion files for a 216-line file that was well under budget, reasoning "the user asked to split by category," which conflates a request about *organization* with a request about *size*. Measure first (`../_shared/references/declared-budget.md`). A section that reads as a wall inside a file **under** budget gets `### ` subsections with `{#anchor}`s in place instead — every row stays inline, no new file, grouped by the axis a reader searches on (where they are when the symptom hits — runtime stage, test run, environment) rather than which subsystem authored the row. Only an over-budget file earns lever #6 or #7 below. If you're about to create a file and the source's line count is under its declared budget, that's the signal you skipped this check.

6. **Subdir `CLAUDE.md`** — for a section that is subdir-local (auto-loads additively; parent keeps a `> 📖` pointer). Decided by a seam-test: grep the section's 3-5 core symbols against every plausible sibling directory and let usage counts decide. Fails the seam-test but the section is **feature-scoped** → route it to that feature's task doc (the second lever, `update-claude-docs/references/structure.md` §6) before accepting "stays inline".
7. **Companion file** — for a genuinely cross-cutting section (no subdir, no feature owner). Moves the lowest-frequency rows to `.claude-companions/<shared|local>/`, clustered by topic, behind a per-category symptom index. A failed seam-test is this lever's trigger, not a dead end. A row that mixes a judgement call with an attached exact value (an IP, command, id) can split WITHIN itself instead of moving wholesale — `references/prose-vs-value-split.md`.

   📖 **Full mechanics for all three: `references/structural-splits.md`** — lever-selection table, seam-test rules, companion location/trackability, and the pointer requirements that decide whether a companion is ever read. Open it before executing any split.

## Process

1. `Read` the target CLAUDE.md fully.
2. Mentally score each section: keep as-is / compress / cut.

   Run this gate before drafting, not after: if a table's rows share no topic and restate no other row's mechanism, there's no compress pass to run on it — skip straight to the seam-test (Restructuring #6/#7). A light pass on a table like that plateaus at roughly 1-10% no matter how many times it's repeated, since there's no redundancy left to squeeze — reporting that capped number reads as done when the lever that actually moves the needle (splitting) was never applied. Don't settle the verdict on one narrow defect (exact duplicates alone); sort by length (`awk -F'|' '{print length, NR}' file | sort -rn | head`) and read the 3-5 longest against Restructuring #4 first. A large heterogeneous table with nothing to merge is precisely Restructuring #7's target — propose the split in the same turn rather than after being told the light pass wasn't enough.
3. **Draft + verify** (only if step 2's gate didn't route around this): execution model, write-mode choice, and diff-baseline rules are all `../_shared/references/two-tier-condense.md` — work inline, no spawned agent, using step 2's keep/compress/cut scoring. A `Write`-rewrite whose byte delta comes out under ~15% means `Edit` was the better fit — most of the file survived unchanged, and a full rewrite of mostly-unchanged bytes is just risk with no return.
4. Count lines: target ≤200 for project root CLAUDE.md. If still >250 after compressing, check for a section that passes the seam-test (Restructuring #6) and offer to split it to a subdir `CLAUDE.md` before asking which sections to cut — splitting relocates content without losing it, cutting loses it.

   Both numbers defer to a budget the file declares for itself (`../_shared/references/declared-budget.md`) — a file stating "~460, not the global 350" is measured against 460. And a file recording the split as already evaluated and declined does not get the split offered again: that's a closed decision, not just a different threshold. Report size against its own budget and stop — the measurement still runs either way; deferring on the threshold isn't deferring on whether it was met.

   "Under the ceiling" and "context-efficient" are different goals — the ceilings bound *file size*, not whether every row needs to auto-load every session. Run the seam-test/split analysis even when both ceilings are already met; a bare `/condense-claude-md` puts frequency-of-use in scope, so don't wait for the user to name that goal.
5. Check `wc -c` alongside line count before reporting done — line count alone isn't a valid completion signal. A `Symptom | Cause | Fix` table has one row per gotcha, so rows never merge: it can sit at the ≤200-line target while cells still run 800+ characters (rule of thumb: ceiling is 40KB for a root CLAUDE.md; a non-root layer file, e.g. `app/CLAUDE.md`, has more slack but the same logic applies). If bytes are still above the ceiling after compressing, apply the Cause/Fix-redundancy rule (Restructuring #4) or run the seam-test (Restructuring #6/#7) in the same turn.

   Byte reduction from row-trimming alone doesn't prove the file stopped reading as one dense block — a single 100+-row table that's still one unbroken table after tightening every cell still renders as a wall, and a byte percentage improving isn't the same claim as "this looks less dense." Before reporting a trim-only pass done on a table that large, re-run step 2's own question: does the table hold multiple distinct topics that would each pass the seam-test or the companion-split (#7) independently? If yes, the trim was necessary but not sufficient — offer the structural split in the same pass. When the file is already under budget, that structural split is the in-place one (the budget gate above), not a relocation.

   Reformatting prose into a table isn't compression — a table cell holds the same words as the paragraph it replaced, just wrapped in `|`, typically saving under 3% either way. Don't spend a pass on this expecting it to close a real gap; go straight to cutting/splitting content instead.

   A file that's been condensed before is a growth-rate problem, not a density problem — measure the trajectory before choosing a lever. Repeat condenses on the same file tend to produce a sawtooth with a rising floor: the next pass buys days, then the user is back, because the underlying arrival rate of new rules never changed. Check history before drafting (`git log --format='%h %ad %s' --date=short -N -- <file>`, sizing each revision with `git show <sha>:<file> | wc -c`) and compare a stable content class against a growing one — reference material (tool tables, conventions) plateaus, incident-capture rules usually don't. This matters most when the file's recent commits are mostly condenses, or the user's own request hints it's already tight ("quite dense already") — that's the signal a pure trim will just repeat the pattern. Report headroom in days at the observed rate, not just bytes against the ceiling: "37KB" reads as done, "6KB left, ~4 days" is the real state. When growth is the diagnosis, say so plainly — the honest report is that compression is a treadmill and the durable fix is a capture-threshold or format change, which lives in the writing skill (`update-claude-docs`), not here.

   When projecting a fleet-wide rewrite ("apply this fix to all N rows"), compute the projection from the mean/median row, not the 3-5 longest you happened to preview — the longest rows are long *because* they hold the most redundancy, so they overstate the win, while the median is often already close to the target shape (`grep -o '<pattern>[^|]*' file | awk '{s+=length} END {print s/NR}'`, then quote the projection from that and state the basis). Two shapes also compress differently: narrative rules (story + mechanism) cut hard; procedure rules (branch A → X, branch B → Y) barely move, because every clause is load-bearing.

## Hard rules

- Strip tool-output wrapper artifacts before writing — see `../_shared/references/strip-tool-output-tags.md`.
- Preserve all `{#anchor}` IDs — other files may link to them.
- Preserve established column names — when collapsing 3→2 columns, drop a column; never rename existing ones. `❌ NEVER | ✅ ALWAYS` stays verbatim; `Symptom | Cause | Fix` stays verbatim.
- Don't invent content — only restructure what exists; if something is unclear, compress it rather than rewrite its meaning.
- Report both line count and `wc -c` byte count before/after (see Process #5).
- After any split, `grep -c` each moved row against BOTH files. A split that copies without deleting leaves the main file paying for content it already routed away, and the orphans are invisible afterward — the pointer looks right, the companion looks right, only the byte count disagrees. Measured once: 3 orphaned rows survived two days past a commit whose own message was "prune rules already covered by companion files." Sweep pre-existing companions too, not just the block you moved this run.
- Verify no rows were silently dropped — step 3's Verify (`../_shared/references/two-tier-condense.md`) covers this via full-diff review. Table-specific supplement: extract the first column (`awk -F'|' '{print $2}'`) from old and new versions and `comm -23` them for a fast candidate list of possibly-dropped topics, then confirm each against the diff before escalating.
- A changed `📖 <task-doc-path>` pointer isn't automatically a violation — if the drafter rewrote one, `ls` both the old and new path before reverting. A concurrent doc reorg (rename/merge/split already staged in the working tree, separate from this condense) can leave the old path dead and the drafter's new path the only one that resolves; reverting to "preserve verbatim" would silently re-break a pointer that was already broken before you started. Verify with `git status --short` on both paths — the old one staged-deleted (`D`) with the new one present confirms a real reorg, not a hallucination.
