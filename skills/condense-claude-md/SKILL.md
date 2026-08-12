---
name: condense-claude-md
description: Aggressively condense and restructure a bloated CLAUDE.md file — strip verbose WHY columns, discoverable content, redundant tables, and overly long rows, then rewrite it shorter and clearer. Use when the user says "condense", "shrink", "trim", "clean up", or "make CLAUDE.md shorter", or when the file exceeds ~250 lines. Also use when asked to "restructure" or "rephrase" CLAUDE.md sections. Do NOT confuse with claude-md-improver (which adds missing content) — this skill removes excess.
---

# Condense CLAUDE.md

The goal is maximum information density: every line must earn its place. A reader should be able to scan the file in under two minutes and find every non-obvious rule.

This skill is the single source of truth for CLAUDE.md size policy — thresholds, budgets a file declares for itself, and every split decision (subdir, task doc, companion file). No other skill or agent carries its own number. `claude-md-pruner` delegates here (its step 0) and keeps only staleness/duplication verified against the live repo; it exists for `memory: project` + background spawning, not for owning a threshold. The task-doc equivalent is `condense-task-doc` — same rule, different artifact.

A pre-existing `.claude-companions/<shared|local>/CLAUDE-*.md` is a condense target in its own right, not just a place content gets moved to — on a bare invocation, `Glob .claude-companions/**/*.md` alongside the usual `**/CLAUDE.md` sweep. 📖 `../_shared/references/declared-budget.md`.

## What to cut and compress

Remove content that doesn't change behavior if missed:

**Non-local rules** — restatements of framework/global policy that hold everywhere, not here:
- Rows restating what code or framework already enforces (e.g. "use $fillable", "validate user input")
- Sections duplicated verbatim from the global `~/.claude/CLAUDE.md`
- Generic best practices and obvious PHP/Laravel/JS behavior
- Controller/method lists, event→listener tables, file structure trees (discoverable from `routes/`, `EventServiceProvider`, `ls`)

**Non-concrete content** — no checkable consequence if removed:
- Changelog entries, PR summaries, session notes embedded in the file
- Empty or near-empty sections (one sentence with no actionable content)
- WHY/reason columns in ❌/✅ tables when the pairing alone is self-evident

Route feature-scoped or decision-grade rules to task docs via `update-claude-docs` rather than deleting them.

**Compress in place:**
- Long multi-sentence table rows → one tight sentence; move nuance to inline comment only if non-obvious
- Nested sub-tables that repeat parent structure → flatten or inline
- "Never do X" + "Always do Y" + separate WHY paragraph → single ❌/✅ row
- `Symptom | Cause | Fix` redundancy: state mechanism once (Cause), action once (Fix), not both twice. This is the single biggest lever on large gotchas tables.
- Incident narrative: cut discovery archaeology ("which test broke it") and keep only the mechanism + class-name pointer ("See `ClassName`")

## What to keep

Every rule that, if removed, would cause Claude to repeat a real past mistake. Signals:
- A concrete example where the wrong path caused a bug or silent failure
- A counter-intuitive behavior (e.g. Shopee returns `error:""` on success, not null)
- A sharp edge specific to THIS project's architecture (not general Laravel)
- A non-obvious ordering constraint (e.g. FLUSHDB before restart horizon, not after)

## Restructuring approach

**Organization rules** (apply to all rewrites):
1. Lead with the rule, not the context — "Use `&&` not `||` for ship idempotency" not "When checking ship conditions, you should prefer…"
2. Group by domain (stock, API calls, queue jobs, deploy, misc) — don't mix concerns
3. Collapse 3-column tables (❌ / ✅ / WHY) to 2-column when WHY is obvious
4. Prefer bullet lists over tables for prose rules with no clear column structure
5. Order sections by load-bearing relevance at session start (see `../update-claude-docs/references/structure.md` §3)

**Splitting (when the file is still dense after compression):**

Under budget, restructure in-place: add `{#anchor}` subsections grouped by search axis (where a reader is when the symptom hits — runtime stage, test run, environment), not by subsystem. Over budget, move content via levers below.

Two decisions can't be conflated: *should this auto-load every session* (asked every pass) vs. *should it move to a file* (only when over budget). 📖 `../_shared/references/declared-budget.md` for size thresholds. A session once created companions for a 216-line file under budget, misreading "split by category" as a size question — size is decided first.

**Seam-test pattern:** A row about a framework, test runner, or the harness is *true in every project using them*, yet passes the seam-test as "local" on a handful of file hits and gets buried in whichever repo surfaced it. Ask: would this hold if this codebase didn't exist? If yes, it belongs at global level (`~/.claude/`) or its companion. The test measures where a fact is *used*, not where it's *true* — don't confuse the two.

**Lever #1: Subdir CLAUDE.md** — for sections that are subdir-local and auto-load additively (parent keeps a `> 📖` pointer). Decided by seam-test: grep 3-5 core symbols against sibling dirs; let usage counts decide. If it fails seam-test but is **feature-scoped**, route it to that feature's task doc instead.

**Lever #2: Companion file** — for genuinely cross-cutting sections (no subdir owner, failed seam-test). Moves lowest-frequency rows to `.claude-companions/<shared|local>/`, clustered by reader-search topic, behind a symptom index. Frequency alone doesn't decide eviction: a companion is reached by searching a symptom, so a rule governing a routine choice (which tool to reach for, what to check before a common action) has no symptom to search under and stays inline however seldom it's referenced — 📖 `references/structural-splits.md#7`. A row mixing judgement with exact values (IP, command, id) can split within itself instead of moving wholesale — see `references/prose-vs-value-split.md`.

📖 **Full mechanics: `references/structural-splits.md`** — lever-selection table, seam-test rules, companion trackability, and pointer requirements.

## Process

1. **Read** the target CLAUDE.md fully.

2. **Score each section:** keep as-is / compress / cut. Before drafting, gate this: if a table's rows share no topic and restate no mechanism, skip to seam-test (Restructuring levers). A light pass on such a table plateaus at ~1-10% regardless — splitting, not trimming, moves the needle. Sort by length (`awk -F'|' '{print length, NR}' file | sort -rn | head`) and read the 3-5 longest against Restructuring rules first. Propose the split in the same turn, not after being told trimming wasn't enough.

3. **Draft + verify** (only if step 2 didn't route around it): 📖 `../_shared/references/two-tier-condense.md` covers execution model, write-mode choice (if byte delta <~15%, use `Edit` not `Write`), and when to delegate to a `haiku` agent.

4. **Measure size** — target ≤200 lines, ≤40KB bytes for root CLAUDE.md (non-root layers have more slack but same logic). Both numbers defer to a file's declared budget (📖 `../_shared/references/declared-budget.md`). If still >250 lines after compressing, offer to split via Restructuring levers before asking what to cut — splitting relocates, cutting loses.

   "Under the ceiling" and "context-efficient" are different goals. Run seam-test/split analysis even when ceilings are met; a bare `/condense-claude-md` puts frequency-of-use in scope. A file already under budget gets in-place restructuring, not file creation.

   Two passes that look productive and aren't: reformatting prose into a table saves under 3% either way (the cell holds the same words, just wrapped in `|`), and projecting a fleet-wide rewrite off the 3-5 longest rows overstates the win — they're long *because* they hold the most redundancy. Project from the median instead (`grep -o '<pattern>[^|]*' file | awk '{s+=length} END {print s/NR}'`) and state the basis. Shape decides the ceiling: narrative rules (story + mechanism) cut hard, procedure rules (branch A → X, branch B → Y) barely move, since every clause is load-bearing.

5. **Verify no loss:** Extract first column of old/new (`awk -F'|' '{print $2}'`), `comm -23` them, confirm each against diff. Also confirm the last line is real content rather than a `</content>` tag carried in from a `Read` (`tail -c 40 <file>`) — see Hard rules for why a full-file rewrite is where that rides in. Byte reduction from trimming alone doesn't prove density improved — a 100+-row table that's still one unbroken block still reads as a wall. Re-run step 2 on large tables: do distinct topics warrant seam-test/split independently? If yes, offer the structural split in the same pass.

   **Growth-rate check:** If recent commits are mostly condenses, check history (`git log --format='%h %ad %s' --date=short -N -- <file>`) — repeat condenses buy days, then rebound because arrival rate never changed. Report headroom in days, not bytes: "6KB left, ~4 days at observed rate" not "37KB". When growth is the diagnosis, say so plainly; the durable fix is capture-threshold or format change (lives in `update-claude-docs`, not here).

## Hard rules

- Strip tool-output wrapper artifacts before writing. A `Read` result wraps file content in `<content>` tags, so a full-file rewrite that echoes it back — directly, or via a drafting agent that saw the same `Read` — can carry the wrapper into the `Write` payload as a literal trailing line. Confirm after writing that the last line is real content: `tail -c 40 <file>`. The tag is invisible until someone reads the file later, so nothing else catches it.
- Preserve all `{#anchor}` IDs — other files link to them.
- Table shape is a means, not the preserved thing. Collapsing `Symptom | Cause | Fix` to prose is legitimate when it reads better. What *must* survive is the cell content you drop: Cause cells hold greppable specifics (exception class, exact expression, `See <Class>` pointer). Renaming kept columns breaks positional `awk` checks and changes nothing a reader sees.
- Don't invent content — only restructure. If unclear, compress rather than rewrite its meaning.
- Report line count + byte count before/after (Process #4).
- After any split, `grep -c` each moved row against *both* files. A copy-without-delete leaves the main file paying for relocated content — orphans survive invisibly, pointer looks right, only byte count disagrees. Sweep pre-existing companions too.
- Verify no rows silently dropped (Process #5 via full-diff review). Fast check: extract first column (`awk -F'|' '{print $2}'`), `comm -23` old vs. new.
- A changed `📖 <task-doc-path>` pointer isn't automatically a violation. If a concurrent reorg (rename/merge/split, staged separately) left the old path dead, reverting to "preserve verbatim" re-breaks what was already broken. Verify with `git status --short` — old path `D` (deleted) + new path present = real reorg, not hallucination.
