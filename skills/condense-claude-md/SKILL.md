---
name: condense-claude-md
description: Aggressively condense and restructure a bloated CLAUDE.md file — strip verbose WHY columns, discoverable content, redundant tables, and overly long rows, then rewrite it shorter and clearer. Use when the user says "condense", "shrink", "trim", "clean up", or "make CLAUDE.md shorter", or when the file exceeds ~250 lines. Also use when asked to "restructure" or "rephrase" CLAUDE.md sections. Do NOT confuse with claude-md-improver (which adds missing content) — this skill removes excess.
---

# Condense CLAUDE.md

The goal is maximum information density: every line must earn its place. A reader should be able to scan the file in under two minutes and find every non-obvious rule.

This skill is the single source of truth for CLAUDE.md size policy — thresholds, budgets a file declares for itself, and every split decision (subdir, task doc, companion file). No other skill or agent carries its own number. `claude-md-pruner` delegates here (its step 0) and keeps only staleness/duplication verified against the live repo; it exists for `memory: project` + background spawning, not for owning a threshold. The task-doc equivalent is `condense-task-doc` — same rule, different artifact.

Target: ≤200 lines, ≤40KB bytes for root CLAUDE.md (non-root layers have more slack but same logic). A file that declares its own budget (📖 `../_shared/references/declared-budget.md`) defers to that. A pre-existing `.claude-companions/<shared|local>/CLAUDE-*.md` is a condense target in its own right, not just a destination for moved content — on a bare invocation, `Glob .claude-companions/**/*.md` alongside the usual `**/CLAUDE.md` sweep.

## Process

**Prerequisites:** Before starting, check ownership. This skill rewrites whole files in place. Judge by diff *content* (📖 `../_shared/references/diff-ownership.md`); a dirty file is a baseline, not a measurement problem, and "another session committed this" describes git history rather than a reason to defer — rewriting committed content is what this skill does. What stops the rewrite is a peer's **uncommitted** work in the target, which a whole-file pass destroys unrecoverably. A live peer can be known before bytes reach disk (📖 `../_shared/references/cross-session-messaging.md`).

Check it here rather than trusting a caller, since this skill is reached several ways — a direct invocation, a background `haiku` agent, and `claude-md-pruner`'s handoff once staleness cleanup leaves a file still oversized. A caller that checked ownership before its own edits has not checked it for yours, and the gap between the two is exactly where a peer starts writing.

**1. Read** the target CLAUDE.md fully.

**2. Score each section** as keep-as-is, compress, cut, or split. Before drafting, apply the seam-test gate: a row about a framework, test runner, or the harness is *true in every project using them*, yet may pass locally on a handful of file hits. Ask: would this hold if this codebase didn't exist? If yes, it belongs at global level (`~/.claude/`) or a shared companion. This test measures where a fact is *used*, not where it's *true* — don't confuse the two.

For tables where rows share no topic and restate no mechanism, skip trimming — splitting moves the needle. Sort by length (`awk -F'|' '{print length, NR}' file | sort -rn | head`) and read the 3-5 longest against the cut/compress/split guidance below before drafting.

**3. Apply cut/compress rules.** Remove content that doesn't change behavior if missed:

- **Non-local rules** — restatements of framework/global policy: rows enforcing what code already does (e.g. "use $fillable"), sections duplicated from global `~/.claude/CLAUDE.md`, generic best practices, discoverable trees (`routes/`, `EventServiceProvider`, `ls`).
- **Non-concrete content** — no checkable consequence if removed: changelog entries, empty sections, WHY/reason columns when the pairing alone is self-evident.
- **Compress in place:** long multi-sentence rows to one tight sentence; nested sub-tables to flat; "Never X" + "Always Y" + WHY paragraph to a single ❌/✅ row; `Symptom | Cause | Fix` redundancy by stating mechanism once; incident narrative by cutting discovery archaeology and keeping only mechanism + class-name pointer.

⚠️ **The compress-in-place conversions reshape convention, so they need the ownership question answered first.** Turning a WHY paragraph into an `❌/✅` row is this plugin's house style, and applying it to a CLAUDE.md in someone else's repo rewrites a shape its maintainers may have chosen — a condense pass is a shrink they asked for, not a restyle. Inside the syafiqkit repo, convert freely: the house style is authoritative and a differing shape is drift. In any other repo, compress *within* the shape the file already uses — a long row becomes a short row, a long paragraph a short paragraph — and leave the form alone. The size target is met either way; only the conversions are gated. 📖 `../_shared/references/adopt-vs-impose.md`

Route feature-scoped or decision-grade rules to task docs via `update-claude-docs` rather than deleting them. Keep every rule that, if removed, would cause Claude to repeat a real past mistake: a concrete example where the wrong path caused a bug, counter-intuitive behavior (e.g. Shopee returns `error:""` on success), a sharp edge specific to THIS project's architecture, or a non-obvious ordering constraint.

**4. Decide splitting.** If a table is dense after compression, ask whether distinct topics warrant seam-test/split independently. A session once created companions for a 216-line file under budget, misreading "split by category" as size — a dense file is not by itself a split candidate. If under budget and the file's name states a subject, restructure in-place with `{#anchor}` subsections grouped by reader-search axis (where they are when the symptom hits), not subsystem.

⚠️ **Size is the first test, not the only one — a file can be under budget and still be the wrong file.** Ask what a reader must already know to decide this file holds their answer. A name that states a subject (`auth`, `media`, `migrations`) answers that from the pointer alone; a name that states a LAYER or an artifact type (`backend`, `frontend`, `utils`, `misc`) answers nothing, because the only thing it asserts is true of everything a reader might be doing. Such a file has no natural eviction pressure: every new gotcha plausibly belongs, so it accretes unrelated sections indefinitely and each one is individually justified. Split it by subject regardless of line count, and treat a sibling already split that way as the shape to match — a layer-named file sitting beside subject-named peers is a split someone started and didn't finish. The tell is a section list whose entries share no reader: if the file's own headings would make sensible separate filenames, they should be.

A split producing more than one companion is index-based by default: a thin router file naming which sibling answers which symptom, with the parent pointing at the router rather than listing siblings. Enumerating them in the parent is hand-maintained prose that goes stale silently — the companion a later session adds is written, correct and unreferenced.

📖 `references/split-decision-tree.md` — lever-selection table (Subdir CLAUDE.md, Companion file, Task doc), the index-file shape and what belongs in it, pointer requirements, and prose-vs-value split patterns.

**5. Draft + verify.** Organization rules:
- Lead with the rule, not context — "Use `&&` not `||` for ship idempotency" not "When checking conditions, prefer…"
- Group by domain (stock, API, queue, deploy, misc) — don't mix concerns
- Collapse 3-column tables (❌ / ✅ / WHY) to 2-column when WHY is obvious
- Prefer bullet lists over tables for prose rules
- Order sections by load-bearing relevance at session start (📖 `../update-claude-docs/references/structure.md` §3)

📖 `../_shared/references/two-tier-condense.md` — execution model and write-mode choice (if byte delta <~15%, use `Edit` not `Write`).

**6. Verify no loss.** Extract first column of old/new (`awk -F'|' '{print $2}'`), `comm -23` them, confirm each against diff. Confirm the last line is real content (not a `</content>` tag — see Hard rules #1). Report `wc -lc` before and after — both counts, every run, since a line drop with bytes flat means content moved rather than went, and the two numbers disagreeing is the cheapest signal that something needs a second look. Those two counts agreeing says nothing about how far they fell, and a pass that cut most of the file reports its deltas in the same tone as one that cut well — so also account for where the bytes went. A drop past roughly a tenth on a restructure means content left rather than moved; past roughly a third, name the rules judged non-essential and why, rather than reporting a total. Where the cut was an extraction to a companion or subdir file, that destination should have grown by roughly what this file lost — a shrink on both sides means nothing received the content, whatever the pass called itself. If still >250 lines after compressing, offer to split before asking what to cut. When growth is the diagnosis, report headroom in days, not bytes: "6KB left, ~4 days at observed rate" not "37KB" (check history: `git log --format='%h %ad %s' --date=short -N -- <file>`).

## Hard rules

- **Strip tool-output wrapper artifacts.** A `Read` result wraps file content in `<content>` tags; a full-file rewrite can carry the wrapper into the `Write` payload as a literal trailing line. Confirm after writing: `tail -c 40 <file>`.
- **Preserve all `{#anchor}` IDs** — other files link to them.
- **Don't invent content** — only restructure. If unclear, compress rather than rewrite meaning.
- **Table shape is a means.** Collapsing `Symptom | Cause | Fix` to prose is legitimate when it reads better. What *must* survive is cell content you drop: Cause cells hold greppable specifics (exception class, exact expression, `See <Class>` pointer). Renaming kept columns breaks positional `awk` checks.
- **After any split, `grep -c` each moved row against both files.** A copy-without-delete leaves the main file paying for relocated content — orphans survive invisibly, pointer looks right, only byte count disagrees. Sweep pre-existing companions too. That sweep reads the two files the split produced, so it cannot see the routes *into* them that the split severed — after a split specifically (not an in-place restructure), read 📖 `../_shared/references/verifying-a-relocation.md` and run its three checks: a link whose `../` depth stopped resolving once both halves changed level, a documented glob that keeps matching after it stops covering, and — the one no before/after can surface — a destination file nothing ever pointed at, which is how you find the earlier split that half-landed in the same directory.
- **Verify pointer validity.** A changed `📖 <task-doc-path>` pointer isn't automatically a violation; if concurrent reorg left the old path dead, reverting to "preserve verbatim" re-breaks what was already broken. Verify with `git status --short` — old path `D` (deleted) + new path present = real reorg, not hallucination.
