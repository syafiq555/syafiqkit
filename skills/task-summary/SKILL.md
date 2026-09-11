---
name: task-summary
description: Create, update, or rewrite task summary documentation (current.md and its decisions/*.md theme files). Handles path resolution, domain inference, template selection, cross-references, Quick Start writing, and splitting an oversized theme file into sub-files. This is `/done` Step 4 — after implementation work, invoke `/done` rather than this skill alone, so the sibling steps (review, CLAUDE.md capture) run too. Use directly for ANY task documentation workflow — including "rewrite with proper template", "conform to template", "add a Quick Start", or continuing/finishing doc work from an earlier turn in the same session — even if the template shape is already known from a prior read. Invoke this skill fresh each time rather than editing docs directly against a recalled structure; its rules (condense/split thresholds, validation greps) can move between sessions.
---

# Task Summary

Living documentation for humans and LLM agents. Always reflects current state — not a changelog.

A task doc's job is to be readable cold — a stranger to the work reads it once and acts correctly. That contract requires three things: each fact lives in exactly one section (so a reader landing on any entry point sees the whole story, not fragments scattered across multiple homes); every rule is shaped as judgment rather than trip-wire machinery (so readers handle cases the doc didn't enumerate); and sections are shaped to let a reader scan — tables where scanning helps, prose where reasoning matters, numbers and commands where those are the answer. The workflow below delivers that shape. 📖 `references/templates.md` holds the canonical structure; every section heading, table column and field name you write must match it verbatim.

## Workflow at a glance

1. **Resolve path** — turn the input (full path / `domain/feature` / empty) into `tasks/<domain>/<feature>/current.md`. No explicit path → run the multi-domain scan first (§1).
2. **Read `references/templates.md`** — then pick Full (multi-session feature) or Minimal (single bug fix or short session). Section headings, table columns and field names come from it verbatim.
3. **Create or update** — missing doc → Full template; existing doc → edit in place, gap-checking for missing sections.
4. **Validate** — re-read the whole doc; does every section still say something true and complete? (§5 lists the checks.)
5. **Reconcile back-references** — sync any roadmap/hub/`Related:` doc that mirrors the status you changed. Nothing in a git diff points at these, so the scan in step 1 never reaches them and a roadmap row can still read "uncommitted" weeks after ship. Go looking for them deliberately; §6 has the method.

Doc already over budget (see below)? Delegate to `condense-task-doc` rather than hand-rolling the row-existence pass.

## Core principles

**Each fact lives in exactly one section, stated plainly, as either a Decision (why) or a Gotcha (what breaks) — never both.** This applies within a doc (LLM-CONTEXT and Quick Start are pointer indexes into canonical sections, not copies) and across files (a `decisions/<theme>.md` and the index both explaining the same item is the same violation). Two sources of false content: *derivable state* (git tracking "committed"/"pushed", env config deciding "deployed") goes stale when copied — delete it; *ephemeral input* (pasted messages, screenshots, one-off figures) must be captured into the doc now or it is lost forever. A durable reference (a ClickUp/Jira id explaining a status) belongs in `Related:` when you add it, not as a `Last Session` mention that disappears next overwrite.

**Conformance means both structure and content.** The template says which sections exist; your subject says what goes in them. Matching headings is not the same as following the template. Heading shape (right sections, right order) is a necessary but not sufficient check — content conformance means no fact restated across sections, rows hold one rule plus the single strongest reason in two sentences or fewer (a MADR Consequence reading "1. Never X, 2. Always Y" is the same trip-wire in ADR form — rewrite as "Because X fails in condition C, we chose this to handle it"), and commit hashes live only in Last Session with verification elsewhere reduced to one word. A doc can pass structure and fail content badly enough that "rewrite with proper template" triggers both: run `references/validation-checklist.md` for judgment checks even when no restructuring is needed.

**Under-budget doesn't mean healthy — total the whole doc set.** Run `wc -l current.md decisions/*.md` so there is one number to react to; checking the index alone first lets "under budget" register as done, and the sentence about totaling the siblings arrives too late. Once over 300 lines, delegate to `condense-task-doc` rather than hand-rolling cuts; its row-existence pass is the step most often skipped. 📖 `../_shared/references/two-tier-condense.md` for measurement and split strategy.

## 1. Resolve Path and Identify Domains

**Check ownership first.** Docs are contested when another session is actively editing them. Signals: background agent running, `git status` showing `tasks/` files you didn't stage, or mixed-content edits from both of you. Judge by diff *content* not status plane (auto-staging makes your writes indistinguishable from another's at a glance) — what matters is whether this session's own content traces the diff. When contested: skip the multi-domain scan, verify read-only instead of overwriting, scope to what you own, or message ahead before a major rewrite. 📖 `../_shared/references/diff-ownership.md` and `cross-session-messaging.md`.

**Convert your input to `tasks/<domain>/<feature>/current.md`:**

| Input | Action |
|-------|--------|
| Full path | Use as-is |
| Domain/feature | Expand to `tasks/<domain>/<feature>/current.md` |
| Empty / task description | Run multi-domain scan (see 1a below) |

### 1a. Multi-Domain Scan (when no path given)

Scan the conversation for every domain needing a task doc. Infer from code changes (use `git status --short` or `git diff --name-only <base>..HEAD`), decision records (scope calls, work parked pending someone else, items unactionable without captured reasoning), and existing docs (match by content, not folder name — use `Explore` agent to `Glob tasks/**/*.md` and `Grep` for the concept). Build a table of all domains before writing, then create/update each one. 📖 `${CLAUDE_SKILL_DIR}/references/resolving-path.md` for candidate-gathering and when to split a sibling repo in the same pass.

**Capture ephemeral input during this scan.** Pasted messages, screenshots, figures, constraints stated once — each either gets into a doc now or is lost at the next `/clear`. The loss is invisible: conclusions survive while their basis vanishes. Paraphrase decisions with who asked; record figures from spreadsheets; capture constraints from screenshots. Material large enough to deserve its own home goes to a separate doc and pointed at; the test is whether a cold session, with the source unavailable, can still act correctly. Personal-machine paths are sources, never homes.

**An external reference is the instruction to absorb it, not to cite it — whether the user handed it over or you went and found it.** When the source is a pasted spec, an attached PDF, a shared link, "here's the doc", or your own WebFetch/WebSearch/research-agent result that turned out load-bearing — writing `See <path/link>` or `Per the vendor doc` instead of the actual decision, figure, or constraint is the same failure as an unreached ephemeral capture, just wearing a citation's clothes: it reads as done because a reference sits where a fact should be, and the doc silently depends on something outside it that a cold session cannot open or that has since moved. The reference surfacing at all — whoever surfaced it — is the signal its content belongs in the system now: extract it into the doc the same way you would a pasted message, and keep the citation only as a pointer alongside the captured content, never as a substitute for it.

Keep the domain count honest — past two files per domain, readers are assembling rather than reading. Before splitting, count what the domain already has; consolidating siblings often loses nothing because the split's 40% is cross-restatement existing only to make each file alone readable.

## 2. Read Template, Then Create or Update

Read `references/templates.md` first — it holds the canonical section structure. Then decide:

| State | Action |
|-------|--------|
| Missing doc | Create using Full Template |
| Existing doc | Update in place; align headings toward the template if drifted |

**Template shape follows subject, not borrowed examples.** A proposal with no code has no `Architecture` section. An off-template doc means aligning toward the template rather than preserving its drift, because a template improvement reaches old docs only through such edits.

## 2a. When Merging, Renaming, or Reorganizing

User requests `merge A into B`, a folder rename, or restructuring the doc set by a new axis — read `references/merge-rename.md`. Merging delegates to `syafiqkit:merge-task-docs`; renaming is `git mv` plus reconciling every back-reference.

## 3. When Creating

Use the Full Template from `references/templates.md`; scale down to Minimal only for single bug fixes. Copy section headings, table columns, and field names verbatim — renaming a column breaks the structure every other rule assumes. 📖 `${CLAUDE_SKILL_DIR}/references/creating-and-updating.md` for the creation workflow.

A template section the source cannot fill stays empty or marked as such — never inferred from "what a project usually has". A path goes in only after `ls` returns it; a status word is copied from the source or the branch rather than from the template's vocabulary. That guard prevents a conform pass that lists nonexistent paths, promotes "built, unshipped" to "live", or writes examples the source never contained.

## 4. When Updating

Docs describe current state, not session history. Edit in place; don't append. When rewriting Last Session, route facts first: read what's there and ask whether each fact describes the session (this turn) or the system (behaviour that shipped). Move system facts to their owning typed sections; discard narration. The same routing check runs the other way on Next Steps: every canonical example there (`references/templates.md`) is `[ ]` open work, so a `[x]` ✅ item sitting under that heading — however detailed and correct its own prose is — belongs in Last Session instead, not a patch target for restoring lost detail in place. A restoration that puts the fact back where it was found inherits whatever placement error was already there; check the destination section's own template before writing, not just whether the fact survived. 📖 `${CLAUDE_SKILL_DIR}/references/creating-and-updating.md` for gap-checking and MADR rules.

**Use `Edit`, never computed bounds.** A script that locates section bounds by heading match splices from a cross-reference instead of the heading itself (a heading like `## Open Questions` appears in Quick Start, `Related:`, and Next Steps rows alike) — measured 2026-08-27, a 353-line doc became 610 lines with every section duplicated. `Edit` refuses a non-unique anchor; that's the guard. After any structural rewrite, verify by counting headings (`grep -c '^## '`) rather than trusting the exit code — duplication is invisible in a line count you didn't have a prior baseline for.

## Quick Start Section

Place immediately after the `# Title` and before `## Overview`. A cold-start agent reads only this section — if it can't act from Quick Start alone, it's insufficient. State what's happening now (status), what's unblocked (what can start next turn), and what's blocked (waiting on whom/what). Never mention prior work or narrate the session that led here. 📖 `${CLAUDE_SKILL_DIR}/references/quick-start-rules.md` for the five questions and environment resource rules.

## Credentials

Never include API keys, merchant keys, passwords, or secrets in task docs. Reference `.env` keys by name only.

## 5. Validate

Re-read the whole doc end-to-end. Does every section say something true, complete, and stated exactly once? Sweep fields written once and read least (`Quick Start`, `Status:`, opening prose). 📖 `${CLAUDE_SKILL_DIR}/references/validation-checklist.md` for the full fact-check and judgment-check lists.

## 6. Reconcile Cross-References

When creating, add bidirectional `Related:` refs for any connected domains. When updating, close the loop on what refers back to the doc you just updated. 📖 `${CLAUDE_SKILL_DIR}/references/reconciling-references.md` for scanning referencing docs and reconciling three cases: status mirrors, fixed bugs (symptom-grep), and moved facts (file/anchor-grep).
