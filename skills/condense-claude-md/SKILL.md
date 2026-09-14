---
name: condense-claude-md
description: Aggressively condense and restructure a bloated CLAUDE.md file — strip verbose WHY columns, discoverable content, redundant tables, and overly long rows, then rewrite it shorter and clearer. Use when the user says "condense", "shrink", "trim", "clean up", or "make CLAUDE.md shorter", or when the file exceeds ~250 lines. Also use when asked to "restructure" or "rephrase" CLAUDE.md sections. Do NOT confuse with claude-md-improver (which adds missing content) — this skill removes excess.
---

# Condense CLAUDE.md

Maximum information density: every line must earn its place, readable in under two minutes.

**This skill owns CLAUDE.md size policy — thresholds and split decisions.** No other skill or agent carries its own number. `claude-md-pruner` delegates here for staleness/duplication; `condense-task-doc` owns task docs by the same principle.

**Target: ≤200 lines, ≤40KB bytes** for root CLAUDE.md. Non-root layers have more slack but same logic. A file declaring its own budget (📖 `../_shared/references/declared-budget.md`) defers to that. A pre-existing `.claude-companions/<shared|local>/CLAUDE-*.md` is a condense target in its own right — on a bare invocation, `Glob .claude-companions/**/*.md` alongside `**/CLAUDE.md`.

## Before You Start {#ownership-gate}

**Check ownership:** This rewrites whole files. Judge by diff content (📖 `../_shared/references/diff-ownership.md`); a dirty file is a baseline, not a blocker. What stops the rewrite is a **peer's uncommitted work**, which a pass destroys unrecoverably. A live peer can be identified before bytes reach disk (📖 `../_shared/references/cross-session-messaging.md`).

Check here, not in the caller — this skill is reached multiple ways (direct invocation, `haiku`, `claude-md-pruner`'s handoff), and a caller's ownership check doesn't cover yours.

## Judgment Framework {#judgment}

### Scope: Global vs. Local {#seam-test}

A row about a framework, test runner, or harness is *true in every project using them* yet may pass locally on a handful of file hits. Ask: **would this hold if this codebase didn't exist?** If yes → global `~/.claude/` or shared companion. This tests where a fact is *used*, not where it's *true*.

### Content: Keep or Cut {#cut-criteria}

Remove content with no checkable consequence if missed:

- **Non-local rules** — restatements of framework/global policy, sections duplicated from global `~/.claude/CLAUDE.md`, generic best practices, discoverable trees (`routes/`, `EventServiceProvider`).
- **Non-concrete content** — changelog entries, empty sections, WHY/reason columns when the pairing is self-evident. "Self-evident" means: can you name the command that reconstructs it? (`ls`, `grep`, `--help`, the manifest?). A reason with no such command (a PHP version quirk, a harness's restore behavior, a rule existing only elsewhere) stays, however short. "A competent reader would know" is the sentence written just before deleting the fact the reader couldn't have known.

Route feature-scoped or decision-grade rules to task docs via `update-claude-docs` rather than deleting. Keep every rule that, if removed, would cause Claude to repeat a real past mistake: concrete examples where the wrong path caused a bug, counter-intuitive behavior (Shopee's `error:""` on success), sharp edges specific to THIS project, non-obvious ordering constraints.

### Compression: In-Place {#compress-in-place}

These conversions are house style and apply everywhere:

- Long multi-sentence rows → one tight sentence
- Nested sub-tables → flat
- "Never X" + "Always Y" + WHY paragraph → single ❌/✅ row
- `Symptom | Cause | Fix` redundancy → state mechanism once
- Incident narrative → mechanism + class-name pointer only

Collapsing `Symptom | Cause | Fix` to prose is legitimate when clearer. What *must* survive: Cause cells hold greppable specifics (exception class, exact expression, `See <Class>` pointer). Renaming kept columns breaks positional `awk` checks.

The house-style opinion is what this plugin holds correct (📖 `../_shared/references/adopt-vs-impose.md`). Prefer bullet lists over tables for prose rules. Lead with the rule, not context — "Use `&&` not `||` for idempotency" not "When checking conditions, prefer…".

### Splitting vs. Restructuring {#split-decision}

Size is the first test, not the only one. A file can be under budget yet wrong. Ask: **what must a reader already know to decide this file holds their answer?**

- A subject-named file (`auth`, `media`, `migrations`) answers that from the pointer alone.
- A layer-named file (`backend`, `frontend`, `utils`, `misc`) answers nothing — the only thing true of everything a reader might be doing. No natural eviction pressure: every gotcha plausibly belongs. Split by subject regardless of line count, and match any sibling already split that way.

A dense file under budget: restructure in-place with `{#anchor}` subsections grouped by reader-search axis (where they are when the symptom hits), not subsystem. If a section list's entries share no reader (headings would make sensible separate filenames), split.

A split producing multiple companions is index-based by default: a thin router file naming which sibling answers which symptom. Enumerating them in the parent is hand-maintained prose that goes stale silently. 📖 `references/split-decision-tree.md` — lever selection, index-file shape, pointer requirements.

## Verification {#verify}

Report `wc -l` and `wc -c` before and after — both, every run. A line drop with bytes flat means content moved, not deleted. A byte drop past ~10% on restructure means content left; past ~33%, name the rules judged non-essential and why, not just the total. If an extraction went to a companion/subdir, that destination should have grown by roughly what the source lost — shrink on both sides means content went nowhere.

If still >250 lines after compressing, offer to split before asking what to cut. When growth is the diagnosis, report headroom in days, not bytes: "6KB left, ~4 days at observed rate" (check history: `git log --format='%h %ad %s' --date=short -N -- <file>`).

Extract first column of old/new (`awk -F'|' '{print $2}'`), `comm -23` them, confirm each against diff. Confirm the last line is real content (not a `</content>` tag — see Hard rules).

## Hard Rules

- **Strip tool-output wrapper artifacts.** A `Read` result wraps file content in `<content>` tags; full-file rewrite can carry the wrapper into `Write` as a literal trailing line. Confirm after writing: `tail -c 40 <file>`.
- **Preserve all `{#anchor}` IDs** — other files link to them.
- **Preserve the opening line under H1.** It reads as boilerplate but is what `/init` mandates and grades a re-run against; trimming it makes the next `/init` report non-conforming.
- **Preserve `[TBD]` headings and `[SOURCED]`/`[INFERRED]` tags.** They mark gaps and sourcing decisions; deleting them destroys the record that the gap exists. It looks inert and something else depends on it.
- **Don't invent content** — only restructure. If unclear, compress rather than rewrite meaning.

## Traps {#traps}

⚠️ **"Moved to a companion" is the claim most worth disbelieving.** A pass that deleted rows and one that relocated them produce the same shrunken source. The difference is only visible at the destination, which nobody re-opens — so "everything moved to X" is an intent claim that costs one command to falsify. Measured 2026-09-01: a 46KB condense claimed thirteen rules moved; the companion held zero and they existed nowhere in the tree. Take a distinctive token per row *before* dispatching (a symbol, constant, measured figure — `CATEGORY_ORDER`, `POPULAR_AREAS`, `landed_house`), then sweep that list against the whole tree afterward — a rule can also land in a *different* companion than claimed.

⚠️ **After any split, `grep -c` each moved row against both files.** Copy-without-delete leaves the main file paying for relocated content — orphans survive invisibly, pointer looks right, only byte count disagrees. After a split specifically (not in-place restructure), read 📖 `../_shared/references/verifying-a-relocation.md` and run every check: a link whose `../` depth stopped resolving once both halves changed level, a documented glob still matching after it stops covering, a destination file nothing pointed at (how to find a half-landed split in the same directory).

⚠️ **A pointer's CONDITION is content.** Merging a list of `📖`s onto one line deletes every condition while keeping every path — so validity checks pass completely. Consolidating pointers is what shrinking looks like, which is why it happens here: result reads tidy, leaving a bibliography of equally-weighted paths, and the rational response to eleven undifferentiated pointers is to open none. A rule behind `📖` is read only when someone chooses to open it; the condition is the whole mechanism by which they choose. Measured 2026-09-11: eleven companions collapsed to one bullet-separated line, four dropped outright, and agents would now never read any of them. **Keep each pointer's trigger.** Where several share a section, use a table keyed on the MOMENT (`before you change a <title> or any JSON-LD → read the SEO companion`) with the deferral fact stated above, so the next pass reads the shape as deliberate rather than as verbosity to squeeze.

⚠️ **Verify pointer validity after reorg.** A changed `📖 <path>` isn't automatically a violation; if concurrent reorg left the old path dead, reverting to "preserve verbatim" re-breaks what was already broken. Check with `git status --short` — old path `D` (deleted) + new path present = real reorg, not hallucination.

⚠️ **A section is a unit of placement, not a unit of genericness — judging it as one verdict deletes whatever minority didn't fit the majority's label.** A 145-line `## Transaction & Query Patterns` section was cut whole, reported as "entirely generic Laravel patterns… the project doesn't have project-specific transaction patterns." True of roughly three quarters of it (eager-loading before loops, `DB::raw()` not binding, basic `lockForUpdate`) — cutting those is this skill working correctly. But the same section also named this project's own services and failure modes: a service method that opens its own transaction, so nesting it inside an outer one leaves state uncommitted on failure; a filesystem check that passes for a directory built from a nullable column and ships an empty output; a logging call that never throws and has no error column to read after, so the obvious debugging path returns null. A section-level verdict is the natural shape for a report to take — it reads as decisive — and the mixed case is invisible inside it. **Cut per rule, not per section**, and before cutting any rule that names a project-specific symbol (a class, a method, a column), grep the repo for whether that rule survives anywhere else; homelessness is what settles it; one instance here matched a task doc's content and was fine to cut, two others returned zero matches anywhere in the tree and would have been unrecoverable loss. The cheap tripwire is anchor loss: diff `{#anchor}` slugs old vs. new before reading the report — a `{#transactions}`-shaped anchor disappearing is what surfaces a whole-section deletion that reading the prose would not.
