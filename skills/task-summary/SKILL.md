---
name: task-summary
description: Create, update, or rewrite task summary documentation (current.md and its decisions/*.md theme files). Handles path resolution, domain inference, template selection, cross-references, Quick Start writing, and splitting an oversized theme file into sub-files. This is `/done` Step 4 — after implementation work, invoke `/done` rather than this skill alone, so the sibling steps (review, CLAUDE.md capture) run too. Use directly for ANY task documentation workflow — including "rewrite with proper template", "conform to template", "add a Quick Start", or continuing/finishing doc work from an earlier turn in the same session — even if the template shape is already known from a prior read. Invoke this skill fresh each time rather than editing docs directly against a recalled structure; its rules (condense/split thresholds, validation greps) can move between sessions.
---

# Task Summary

Living documentation for humans and LLM agents. Always reflects current state — not a changelog.

A task doc's job is to be readable cold — a stranger to the work reads it once and acts correctly. That contract requires three things: each fact lives in exactly one section (so a reader landing on any entry point sees the whole story, not fragments scattered across multiple homes); every rule is shaped as judgment rather than trip-wire machinery (so readers handle cases the doc didn't enumerate); and sections are shaped to let a reader scan — tables where scanning helps, prose where reasoning matters, numbers and commands where those are the answer. 📖 `references/templates.md` holds the canonical structure; every section heading, table column and field name you write must match it verbatim.

## Workflow at a glance

1. **Resolve path** — turn the input (full path / `domain/feature` / empty) into `tasks/<domain>/<feature>/current.md`. No explicit path → run the multi-domain scan first (§1).
2. **Read `references/templates.md`** — then pick Full (multi-session feature) or Minimal (single bug fix or short session). Section headings, table columns and field names come from it verbatim.
3. **Create or update** — missing doc → Full template; existing doc → edit in place, gap-checking for missing sections.
4. **After writing** — validate the doc, reconcile cross-references, and check whether your doc set is over budget.

Doc already over budget (see below)? Delegate to `condense-task-doc` rather than hand-rolling the row-existence pass OR the MADR split into `decisions/<theme>.md` — both are its job, not just the pruning half. Measured 2026-09-28: a session inside `task-summary`, correcting an earlier bad split, read `decision-splits.md` directly and executed the split by hand rather than delegating — the file's own guidance to "split... without waiting for the user to ask" was followed once reached, but reaching `condense-task-doc` itself never happened, because this line's own wording ("row-existence pass") reads as scoped to pruning only.

## Core principle: facts live once

Each fact has exactly one home. Within a doc, sections like LLM-CONTEXT and Quick Start are indexes into canonical sections, never copies. Across files, a `decisions/<theme>.md` and the index both explaining the same decision is a violation — one must go.

**Derivable state** (git tracking "committed"/"pushed", env config deciding "deployed") goes stale when copied — delete it. **Ephemeral input** (pasted messages, screenshots, one-off figures, extracted research) must be captured into the doc now or it is lost forever — `/clear` discards the source and with it any basis for decisions the doc now rests on. When the source is external (a spec, a PDF, a shared link, a vendor doc, a research-agent report), the instruction is to absorb it into the doc, not cite it — writing `See <path>` or `Per the vendor doc` instead of the actual decision/figure/constraint reads as done because a reference sits where a fact should be, while the doc silently depends on something outside it. Extract the content into the doc the same way you would a pasted message, keeping the citation only as a pointer alongside.

⚠️ **A LIVE source that others keep editing — a Claude Design, Figma prototype, or shared spec** — is not the exception it looks like. "Re-read it at build time" feels like the careful capture while the next session inherits nothing but a file to re-derive from. Capture what the source decides for work ahead: per screen, sections/fields/actions/states/copy/navigation, dated with when you read it. The pointer and line ranges are how to refresh it, not a substitute. Where a research agent extracted the source this session, its report is the capture — move it into a `decisions/` file before the conversation ends, but check each thing it calls missing against the source first, since an absence claim is the likeliest to be wrong and the likeliest to become build work. **Tell: your doc says "re-read the design at build time" and holds none of the design.**

⚠️ **A large structured source — a multi-file spec, a requirements set, an exported doc tree, a meeting transcript — is captured section by section, and coverage is checked against the source's own headings, not against what felt notable.** Extraction from memory keeps what the session judged interesting (conflicts, changes, findings) and silently drops everything that was merely *specified*, and fact-lives-once plus the size budget both push further toward a findings digest. When a revised version arrives, a digest can only record the delta against a baseline it never held, so the gap compounds across drops. Measured 2026-09-25: the third drop of a 13-file, ~3,500-line spec set was captured as findings across three docs; role permissions, agent lifecycle, report lists, sitemap, audit triggers, integration specs and the schema existed nowhere in the repo, and the user asked why. The target is a doc a reader can build from without ever opening the source — compact (tables, one line per rule) but complete. Complete is not one file: a reader asking about one area should open one small file, so the capture lands as several `decisions/` files grouped by the source's own sections (one module or a few related ones each), and that folder's `current.md` is the router saying which file holds what. Measured 2026-10-10: a 292-requirement BRS captured as one 185 KB decisions file had to be split into twelve after the user said one that size is never right. Before finishing, list the source's headings (`grep '^#'` per file) and name where each one landed or why it was deliberately dropped; a heading with no answer is the gap. A transcript has no headings, so its units are its timestamp blocks: walk them in order and give each a row or a stated drop. Recalling by topic loses the asides, conditional offers ("see if you can pull X into phase 1") and side requests (measured 2026-10-08: a 63-page client transcript missed 12 points across two passes before the user asked for a block-by-block recheck). Then grep your own doc for citations into the source's numbering (`item 7a`, `09-open-items`, `§3.2`): each one sends the reader back to a file they don't have, and sources renumber between revisions, so state the content instead. **Tell: the user hands over a source a second time and your doc update is a list of what changed.**

## 1. Resolve Path and Identify Domains

**Check for contested edits.** Docs may be contested when another session is actively editing them — see signals and handling in 📖 `../_shared/references/diff-ownership.md` (a rare edge case, consulted only when needed).

**Convert your input to `tasks/<domain>/<feature>/current.md`:**

| Input | Action |
|-------|--------|
| Full path | Use as-is |
| Domain/feature | Expand to `tasks/<domain>/<feature>/current.md` |
| Empty / task description | Run multi-domain scan (see 1a below) |

### 1a. Multi-Domain Scan (when no path given)

Scan the conversation for every domain needing a task doc. Infer from code changes (use `git status --short` or `git diff --name-only <base>..HEAD`), decision records (scope calls, work parked pending someone else, items unactionable without captured reasoning), and existing docs (match by content, not folder name — use `Explore` agent to `Glob tasks/**/*.md` and `Grep` for the concept). Build a table of all domains before writing, then create/update each one. 📖 `${CLAUDE_SKILL_DIR}/references/resolving-path.md` for candidate-gathering and when to split a sibling repo in the same pass.

**Capture ephemeral input during this scan** — pasted messages, screenshots, figures, constraints stated once. Each either gets into a doc now or is lost at the next `/clear`. Paraphrase decisions with who asked; record figures from spreadsheets; capture constraints from screenshots. Material large enough to deserve its own home goes to a separate doc and pointed at; the test is whether a cold session, with the source unavailable, can still act correctly. Personal-machine paths are sources, never homes.

Keep the domain count honest — past two files per domain, readers are assembling rather than reading. Before splitting, count what the domain already has; consolidating siblings often loses nothing because the split's 40% is cross-restatement existing only to make each file alone readable.

## 2. Read Template, Then Create or Update

Read `references/templates.md` first — it holds the canonical section structure. Then decide:

| State | Action |
|-------|--------|
| Missing doc | Create using Full Template |
| Existing doc | Update in place; align headings toward the template if drifted |
| Existing `decisions/<theme>.md` | Align toward the **theme-file** shape (`templates.md#theme-file`), never the Full Template. One already carrying Overview/Files/Bugs/Next Steps is a feature: propose graduating it, don't conform it |

**Template shape follows subject, not borrowed examples.** A proposal with no code has no `Architecture` section. An off-template doc means aligning toward the template rather than preserving its drift, because a template improvement reaches old docs only through such edits.

## 2a. When Merging, Renaming, or Reorganizing

User requests `merge A into B`, a folder rename, or restructuring the doc set by a new axis — read `references/merge-rename.md`. Merging delegates to `syafiqkit:merge-task-docs`; renaming is `git mv` plus reconciling every back-reference.

## 3. When Creating

Use the Full Template from `references/templates.md`; scale down to Minimal only for single bug fixes. Copy section headings, table columns, and field names verbatim — renaming a column breaks the structure every other rule assumes. 📖 `${CLAUDE_SKILL_DIR}/references/creating-and-updating.md` for the creation workflow.

A template section the source cannot fill stays empty or marked as such — never inferred from "what a project usually has". A path goes in only after `ls` returns it; a status word is copied from the source or the branch rather than from the template's vocabulary. That guard prevents a conform pass that lists nonexistent paths, promotes "built, unshipped" to "live", or writes examples the source never contained.

## 4. When Updating

Docs describe current state, not session history. Edit in place; don't append. When rewriting Last Session, route facts first: read what's there and ask whether each fact describes the session (this turn) or the system (behaviour that shipped). Move system facts to their owning typed sections; discard narration.

**Last Session is one section, not an append-only log.** Writing a dated block above the existing one keeps each block accurate, which passes every check you will run — and that is exactly why nothing registers as wrong when the stack grows to four or five blocks, each one correctly stated, the whole thing a changelog this skill's opening line says it is not. **Count the dated blocks before adding one** — if the answer isn't zero after you write, facts from older blocks either belong in a typed section or belong nowhere. Renaming the old block `## Previous Session` is the same failure from the other side: it duplicates a heading the moment a prior session did the same. When inheriting a stack: blocks a peer wrote are their record (📖 `../_shared/references/contested-doc-sections.md` governs), collapse your own block, leave theirs; where the whole stack is yours and long, delegate to `condense-task-doc`'s row-existence pass, not a hand-rolled cut.

The same routing check runs the other way on Next Steps: every canonical example there (📖 `references/templates.md`) is `[ ]` open work, so a `[x]` ✅ completed item under that heading — however detailed and correct its own prose is — belongs in Last Session instead, not sitting below a "still open" heading. 📖 `${CLAUDE_SKILL_DIR}/references/creating-and-updating.md` for gap-checking and MADR rules.

**Use `Edit`, never computed bounds.** A script that locates section bounds by heading match splices from a cross-reference instead of the heading itself (a heading like `## Open Questions` appears in Quick Start, `Related:`, and Next Steps rows alike) — measured 2026-08-27, a 353-line doc became 610 lines with every section duplicated. `Edit` refuses a non-unique anchor; that's the guard. After any structural rewrite, verify by counting headings (`grep -c '^## '`) rather than trusting the exit code — duplication is invisible in a line count you didn't have a prior baseline for.

## Quick Start Section

Place immediately after the `# Title` and before `## Overview`. A cold-start agent reads only this section — if it can't act from Quick Start alone, it's insufficient. State what's happening now (status), what's unblocked (what can start next turn), and what's blocked (waiting on whom/what). Never mention prior work or narrate the session that led here. 📖 `${CLAUDE_SKILL_DIR}/references/quick-start-rules.md` for the five questions and environment resource rules.

## Credentials

Never include API keys, merchant keys, passwords, or secrets in task docs. Reference `.env` keys by name only.

## After Writing: Validate, Reconcile, and Check Budget

Re-read the whole doc end-to-end. Does every section say something true, complete, and stated exactly once? Pay closest attention to sections that change least between sessions (`Quick Start`, `Status:`, opening prose) — they are the easiest to leave stale. 📖 `${CLAUDE_SKILL_DIR}/references/validation-checklist.md` for the full fact-check and judgment-check lists. Run the judgment checks even when no restructuring happened: matching headings is necessary, not sufficient — a doc can pass structure while its rows restate each other or read as trip-wire lists ("1. Never X, 2. Always Y" rewritten as one reason-bearing sentence).

When creating, add bidirectional `Related:` refs for any connected domains. When updating, close the loop on what refers back to the doc you just updated. 📖 `${CLAUDE_SKILL_DIR}/references/reconciling-references.md` for scanning referencing docs and reconciling three cases: status mirrors, fixed bugs (symptom-grep), and moved facts (file/anchor-grep).

**Check doc size, per file.** Run `wc -lc current.md decisions/*.md` — two numbers, not one. A MADR restructure grows lines while shrinking bytes, so a line count alone can read fine on a doc that's dense (📖 `../_shared/references/two-tier-condense.md` for measurement). The ~300-line budget is the **index's**, the file every session reads. `decisions/*.md` files are opened on demand and are judged one by one: each should hold one topic and stay readable, and one over ~40 KB is too big to open for a single question however legitimate its content, so it gets condensed, split by topic with `current.md` routing to the parts, or both, whichever its content calls for. A line count misses this on a capture of wide table rows (527 lines read fine; the bytes were 185 KB). The set total is for accounting, so a split can be told apart from a deletion; it isn't a budget. Once the index is over 300 lines, or any file is dense (bytes-per-line >120–150), delegate to `condense-task-doc` rather than hand-rolling cuts; its row-existence pass is the step most often skipped.
