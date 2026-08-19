---
name: task-summary
description: Create, update, or rewrite task summary documentation (current.md and its decisions/*.md theme files). Handles path resolution, domain inference, template selection, cross-references, Quick Start writing, and splitting an oversized theme file into sub-files. This is `/done` Step 4 — after implementation work, invoke `/done` rather than this skill alone, so the sibling steps (review, CLAUDE.md capture) run too. Use directly for ANY task documentation workflow — including "rewrite with proper template", "conform to template", "add a Quick Start", or continuing/finishing doc work from an earlier turn in the same session — even if the template shape is already known from a prior read. Invoke this skill fresh each time rather than editing docs directly against a recalled structure; its rules (condense/split thresholds, validation greps) can move between sessions.
---

# Task Summary

Living documentation for humans and LLM agents. Always reflects current state — not a changelog.

A task doc's job is to be readable cold — a stranger to the work reads it once and acts correctly. That contract requires three things: each fact lives in exactly one section (so a reader landing on any entry point sees the whole story, not fragments scattered across multiple homes); every rule is shaped as judgment rather than trip-wire machinery (so readers handle cases the doc didn't enumerate); and sections are shaped to let a reader scan — tables where scanning helps, prose where reasoning matters, numbers and commands where those are the answer. The workflow below delivers that shape. 📖 `references/templates.md` holds the canonical structure; every section heading, table column and field name you write must match it verbatim.

## Workflow at a glance

1. **Resolve path** — turn the input (full path / `domain/feature` / empty) into `tasks/<domain>/<feature>/current.md`. No explicit path → run the multi-domain scan first (§1).
2. **Pick template** — Full (multi-session feature) or Minimal (single bug fix or short session). Section headings, table columns, field names all come from `references/templates.md` verbatim.
3. **Create or update** — missing doc → Full template; existing doc → edit in place, gap-checking for missing sections.
4. **Validate** — re-read the whole doc; does every section still say something true and complete? (§5 lists the checks.)
5. **Reconcile back-references** — sync any roadmap/hub/`Related:` doc that mirrors the status you changed. Nothing in a git diff points at these, so the scan in step 1 never reaches them and a roadmap row can still read "uncommitted" weeks after ship. Go looking for them deliberately; §6 has the method.

Doc already over budget (see below)? Delegate to `condense-task-doc` rather than hand-rolling the row-existence pass.

## Core principles

### A doc reads cold when facts don't repeat.

Each fact lives in exactly one section — everywhere else points to it rather than restating it. This applies within a doc (LLM-CONTEXT and Quick Start are pointer indexes into canonical sections, not copies of them) and across files (a `decisions/<theme>.md` and the index both re-explaining the same item is the same violation crossing a file boundary). A fact is either a Decision (why) or a Gotcha (what breaks) — never both.

Two sources of false content to recognize:

- **Derivable state.** Git tracks "committed" / "pushed"; environment configuration tracks "which environment"; a doc's copy of either goes stale silently. Delete git-state words on sight. Route environment status to Quick Start's state line and point to it elsewhere.
- **Durable references.** External tracker IDs (ClickUp/Jira) in prose explaining a status belong in `Related:` when you add them, not as a mention in `Last Session` that disappears next overwrite.

### Judgment shapes rules; trip-wires paralyze them.

A rule stating "mechanism" lets a reader handle cases the doc never anticipated. A trip-wire naming one specific mistake trains a reader to reach for a checklist instead of reasoning. For task docs: rows teach "what to know and do", decision blocks record "why we chose this", gotchas explain "what mechanism breaks" — not "these 17 ways to have failed." Collapse enumerations into principles; where a rule is truly underivable (a harness quirk, a binary with silent failure), state it plainly rather than as a trip-wire. 📖 `../_shared/references/writing-style.md` covers the full tension; for task docs the three key moves are capture filter, prose-vs-value, and mechanism-not-trip-wire.

Base sentence style: rows hold one rule plus the single strongest reason, in two sentences or fewer. Rejected-alternative essays and verification narratives belong to git history, not the doc. Commit hashes live only in Last Session; elsewhere, verification is one word.

### Task docs are unhobbled even in their decision blocks.

Every section — including `## Key Technical Decisions` and its MADR/ADR blocks — is written as judgment not enumeration. A Consequence that reads "1. Never X, 2. Always Y, 3. Don't Z" is the same trip-wire trap in MADR form. Rewrite as: "Because X silently fails in condition C and Y requires Z, we chose this approach to handle both." Each decision block teaches; it doesn't prescribe. This applies equally to the index doc and any `decisions/*.md` companion — the shape rule holds across the whole doc set.

### Doc maintenance: size thresholds and scope

Docs should stay focused — roughly under 300 lines, judged by byte size rather than line count — so readers can hold the whole domain in mind. Once over, delegate to `condense-task-doc`; its row-existence pass (deleting gotchas/decisions discoverable from code) is the step most likely skipped, and prose-tightening alone won't move a 40+-row doc. 📖 `../_shared/references/two-tier-condense.md` for measurement mechanics and split strategy.

**In a split doc set, the budget covers every file together**, since `decisions/*.md` often outweighs `current.md` several times over after a split — an index measured alone reads healthy while the domain's docs are the real problem. Whatever way you total them, satisfy yourself the count actually covered the sibling files: a doc that was never split has no `decisions/` directory, and the ways of counting that assume one tend to report zero rather than an error, which reads as a doc comfortably inside budget.

## 1. Resolve Path

**Check ownership before proceeding.** If another session is editing these docs (background agent running, `git status` showing `tasks/` files you didn't touch, uncommitted edits predating this session, or a mixed-content doc both of you edited), the doc is contested. When contested: skip the multi-domain scan; on an explicit path, verify read-only instead of overwriting; scope to what you actually own, or send a heads-up via `../_shared/references/cross-session-messaging.md` before a major rewrite.

Judge by diff *content*, not status plane (`../_shared/references/diff-ownership.md`) — auto-staging makes your writes indistinguishable from another writer's staged work at a glance. The real question is whether this session's own content traces this diff. Do this check when the session starts, not when it finishes.

| Input | Action |
|-------|--------|
| Full path | Use as-is |
| Domain/feature | Expand to `tasks/<domain>/<feature>/current.md` |
| Empty / task description | **Multi-domain scan** — see below |

### Multi-Domain Scan (when no explicit path given)

Don't assume one domain per session — scan the full conversation for every domain that needs a task doc. Build a table of all domains before writing, then create/update each one. 📖 `${CLAUDE_SKILL_DIR}/references/resolving-path.md` for candidate-gathering, the domain table structure, and when to split a sibling repo's `tasks/` tree in the same pass.

## 2. Create or Update?

Read both the resolved path and `references/templates.md` first — the template holds the canonical section structure for either path. Missing doc → **Create** using the Full Template. Existing doc → **Update** in place.

## 2a. When Merging, Renaming, or Reorganizing

User requests `merge A into B`, a folder rename, or restructuring the doc set by a new axis — read `references/merge-rename.md`. Merging delegates to `syafiqkit:merge-task-docs`; renaming is `git mv` plus reconciling every back-reference.

## 3. When Creating

Use the Full Template from `references/templates.md` as the gold standard; scale down to Minimal only for single bug fixes. Copy section headings, table columns, and field names verbatim — renaming a column breaks the structure every other rule assumes exists. 📖 `${CLAUDE_SKILL_DIR}/references/creating-and-updating.md` for the creation workflow.

## 4. When Updating

Docs describe current state, not session history. Edit in place; don't append. When rewriting Quick Start or Last Session on a normal (uncontested) update, route facts first: read what's there and ask whether each fact describes the session (this turn) or the system (behaviour that shipped). Move system facts to their owning typed sections (Next Steps, Gotchas); discard narration. 📖 `${CLAUDE_SKILL_DIR}/references/creating-and-updating.md` for gap-checking, maintenance thresholds, and MADR rules.

### Quick Start Section

Place immediately after the `# Title` and before `## Overview`. A cold-start agent reads only this section — if it can't act from Quick Start alone, the section is insufficient. 📖 `${CLAUDE_SKILL_DIR}/references/quick-start-rules.md` for the five questions, litmus test, and environment resource rules.

### Credentials

Never include API keys, merchant keys, passwords, or secrets in task docs. Reference `.env` keys by name only.

## 5. Validate

Re-read the whole doc end-to-end. Does every section say something true, complete, and stated exactly once? Sweep fields written once and read least (`Quick Start`, `Status:`, opening prose). 📖 `${CLAUDE_SKILL_DIR}/references/validation-checklist.md` for the full fact-check and judgment-check lists.

## 6. Reconcile Cross-References

When creating, add bidirectional `Related:` refs for any connected domains. When updating, close the loop on what refers back to the doc you just updated. 📖 `${CLAUDE_SKILL_DIR}/references/reconciling-references.md` for scanning referencing docs and reconciling three cases: status mirrors, fixed bugs (symptom-grep), and moved facts (file/anchor-grep).
