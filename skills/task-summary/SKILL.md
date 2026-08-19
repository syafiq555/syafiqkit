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
5. **Reconcile back-references** — sync any roadmap/hub/`Related:` doc that mirrors the status you changed.

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

Don't assume one domain per session — scan the full conversation for every domain that needs a task doc. Sources: code changes (what files changed and what domains do they belong to), external inputs (messages, emails, screenshots, ClickUp pastes naming issues), verbal requests ("also note X", "don't forget Y"), and outcomes that left no diff (decisions deferred, declined, blocked, or ruled out).

**Code domains:** Use `git status --short` to infer domains from file paths. If the output is empty because work is already committed, use `git diff --name-only <base>..HEAD` where `<base>` is the session's starting HEAD. In a non-git project, infer domains from mtime listing off session start (`../_shared/references/verifying-a-write-landed.md`). A sibling repo has its own `tasks/` tree this scan doesn't reach on its own — whenever the session touched a second repo, re-run the scan from its root and update its own `tasks/**/current.md` in the same pass; otherwise one side gets documented exhaustively while the other is never opened.

**Decision domains:** A session whose product is a decision rather than code change still needs routing. What does this session know that only exists in the conversation? A scope call carries its reason with it (defer, decline, block-on-X) — the item is unactionable next session without why. Work parked pending someone else's answer is the most often lost and most expensive to lose: it looks finished from inside the session and abandoned from outside.

**Map existing docs:** Match by content, not folder name — a file path `src/modules/qc-review/` doesn't match doc folder `setup/upload-redesign/` on the name. Delegate candidate-gathering to the `Explore` agent: `Glob tasks/**/*.md` plus `Grep` for the concept's vocabulary and synonyms. The mapping judgment stays inline against the returned data. Once dispatched, don't re-Glob or re-grep the same tree inline while it runs — wait for the completion notification; mechanics are in `../_shared/references/explore-delegation.md`. Follow any `Merged into`/`Supersedes` redirect to the live doc (prevents duplicate doc creation).

Build a table of all domains before writing:

```
| Domain/Feature | Source | Task Doc | Action |
|---|----------|--------|--------|
| webhook phone fix | code changes | tasks/notifications/webhook/current.md | Update |
| freemium tab | WhatsApp msg | tasks/student/freemium/current.md | Create |
```

Then create/update each task doc. Every issue mentioned gets one — even if just a 📋 Planning stub. If a session reverse-mapped a whole module because no task doc existed, that mapping work is the argument for creating it now; don't file "no task doc exists for X" without creating it, as that guarantees the next session repeats the same study.

## 2. Create or Update?

Read both the resolved path and `references/templates.md` first — the template holds the canonical section structure for either path. Missing doc → **Create** using the Full Template. Existing doc → **Update** in place.

## 2a. When Merging, Renaming, or Reorganizing

User requests `merge A into B`, a folder rename, or restructuring the doc set by a new axis — this is a cold path; read `references/merge-rename.md` for the full process, including reorganizing (splitting many docs onto a different axis, e.g. platform → feature). Merging delegates to `syafiqkit:merge-task-docs`; renaming is `git mv` plus reconciling every back-reference. Neither case leaves a redirect stub — delete the source outright, and verify zero stale references before finishing.

## 3. When Creating

Use the Full Template from `references/templates.md` as the gold standard; scale down to Minimal only for single bug fixes or short sessions.

Copy section headings, table columns, and field names verbatim from the template — renaming a column, reordering a field, or swapping in free-form bullets where a table is specified breaks the structure every other rule in this file assumes exists.

LLM-CONTEXT required fields: `Status`, `Domain`, `Related`, `Last updated`.

Mermaid diagrams are fine in any section where a visual helps — architecture, data flow, layout, feature hierarchy, state transitions — not limited to one section.

Strip tool-output wrapper artifacts before writing, whether creating fresh or rewriting the whole doc. A `Read` result wraps file content in `<content>` tags, so a rewrite that echoes it back — directly, or via a drafting agent that saw the same `Read` — can carry the wrapper into the `Write` payload as a literal trailing line.

## 4. When Updating

Docs describe current state, not session history. A fact that changed gets edited into its existing row rather than added beside it; a finished work stream collapses to one summary row ("Phase 2 built + reviewed + committed ✅") rather than staying itemized. Don't wait for every row to tick ✅ first — summarize as you go.

Two sections break this rule when §1's ownership guard fires (contested doc): **Quick Start and Last Session rewrite wholly** rather than append, and both become additive-only, facts routed to typed sections instead. 📖 `../_shared/references/contested-doc-sections.md`.

When rewriting Quick Start or Last Session on a normal (uncontested) update, **route facts before overwriting**. Read what's there and ask whether each fact describes the session (a thing that happened this turn) or the system (a behaviour that shipped, a state a reader needs, an action pending). Move system facts into their owning typed sections (Next Steps, architecture table, Gotchas); discard session narration. Only then rewrite. Skipping the routing feels correct because the rewrite is mandated, so the deletion reads as compliance — the loss surfaces sessions later as a fact nobody can find. Confirm by grepping after rewriting; a fact already covered elsewhere needs no home.

Start with a gap-check and structure-check against the template:
1. List the doc's `## ` headers; add any missing from the template's required set.
2. Verify each existing section's internal structure matches the template — table columns, field names, order — and fix non-conformant structure in place. What counts as drift is a section going missing, not a shape that differs — a split axis fitting the domain (Hosting/Build-Pipeline) or columns carrying actual gotchas are correct as-is. Reshape only when the current shape loses something.
3. `## Next Steps` is grouped by kind of work, not by when items were found — regroup an ungrouped or date-grouped list whenever you touch the doc. In a SPLIT doc set, every open actionable belongs in the index's `## Next Steps`, not scattered across `decisions/*.md` files — splitting is about where explanation lives, not where work lives. Each index item is one line (what to do + pointer to detail); decisions files point back. Exception: a checklist meant to be ticked while doing something belongs beside the procedure, with the index carrying a single line pointing to it.

New rows in Bugs Fixed and Critical Gotchas get composed already-condensed: paraphrase root cause and fix directly, rather than transcribing session detail (timestamps, assertion counts) and trimming after. A Critical Gotchas row instructs a reader rather than recording a decision, so it applies the mechanism-not-trip-wire rule.

**Maintenance:** Three sections require regular pruning to stay clear. `## Bugs Fixed` past 10 rows keeps the last 5 and summarizes the rest; `## Files` stays a living map of ~15 key files (per-phase subsections collapse into it); `## Next Steps` deletes done items rather than checking them off. A `## Completed (date)` section shouldn't exist — merge its content into the sections that own it.

### MADR Blocks — Edit-in-Place vs Append

`references/templates.md` defines when a Decision becomes an MADR block instead of a table row. Did the underlying decision change, or did the record get more accurate?

| Signal | Action |
|--------|--------|
| Record of an already-recorded decision got more accurate (status `planned`→`shipped`, Consequence changed, implementation evolved) | Edit the existing block's fields in place — same principle as Quick Start and all other sections. Update Status/date. |
| The decision itself changed — genuinely new, or a Rejected option got reconsidered | Append a new block with `Supersedes D-[id]` in its Status line (slug ID like `D-gateway-fee-cap`). Don't rewrite the old block — that D-[id] was later reversed is itself worth keeping. |

### Quick Start Section

Place immediately after the `# Title` and before `## Overview`. **Rewrite on every update** (same principle as all other sections — edit in place, don't append), unless §1's ownership guard fired (then additive only). A cold-start agent reads only this section before acting — if it can't act from Quick Start alone, the section is insufficient.

Must answer these 5 questions in ≤15 lines total:

| # | Question | Format |
|---|----------|--------|
| 1 | What's the immediate next action? | Numbered list (ordered, first item = first thing to do) |
| 2 | What exact commands/files are involved? | Code blocks or inline code |
| 3 | What's the current state? | Bullet points — committed vs uncommitted, local vs prod, DB state |
| 4 | What gotchas will trip me up? | 2-3 critical ones only (e.g., "MUST use --queue not sync") |
| 5 | What does "success" look like? | One sentence with concrete numbers/expected output |

Litmus test: if a Sonnet agent reads only the Quick Start and answers "what do I do first?", it should give the correct action and the correct command without reading any other section.

A named environment resource is the one kind of Quick Start content that decays without anything in the doc changing — a fixture id, a seeded account, a test record, a queue name. Nothing marks it stale when someone restores a database or reseeds, so a section that named it correctly last month reads exactly as authoritative today, and a cold-start agent builds on an id that resolves to nothing. Cheap to settle while you're already in the doc: query for the ones this session didn't touch, not just the ones it did. If a named resource is gone, replacing the id matters less than saying what changed and what the environment now holds, since the next reader's real question is which fixtures are reachable at all.

### Credentials

Never include API keys, merchant keys, passwords, or secrets in task docs. Reference `.env` keys by name only (e.g., `2C2P_MERCHANT_KEY` not the actual value).

## 5. Validate

Re-read the whole doc end-to-end. Does every section still say something true, complete, and stated exactly once?

A write's validation scope usually ends at the diff — which is where staleness lives. A doc goes stale because the session that broke a fact and the session that could fix it are different. You rename a thing and update the doc about the rename, while a sibling paragraph mentioning the old name isn't in your diff and so never gets read. It stays wrong until someone opens the file for a different reason. You are that someone now, holding the file open with edit intent — which makes this the cheapest moment to catch the staleness. Sweep the fields written once and read least (`Quick Start`, `Status:`, `Immediate next actions`, and opening prose describing what the system is), and in a split doc set read the `decisions/*.md` headers too — the index gets attention while siblings inherit drift. Fix what you can verify; where the doc contradicts what you observed this session, check before flipping — a doc claim is as often right as it is stale, and an unverified "correction" leaves a source that was correct now discredited.

**Fact checks** — these verify structure and the integrity of edits:

1. **LLM-CONTEXT.** Has Status, Domain, Related, Last updated, with today's date. Every section matches the template — correct table columns, correct field names, no free-form bullets where the template specifies a table.

2. **No accidental row loss.** Deliberate pruning is expected. Count the table rows, the warning markers and the bytes BEFORE rewriting, so you have something to compare against afterwards — the comparison is worthless if you take it after the fact. A restructured-only doc that drops more than roughly a tenth of its bytes lost content, since restructuring moves text rather than removing it. A doc set each shedding a third of its bytes is deletion wearing a rewrite's face.

3. **Derivable state.** If your write touched git state or environment status, run these doc-wide greps: `committed`/`uncommitted`/`pushed` (delete any outside an MADR `**Status**: committed` lifecycle field) and `deployed`/`staging`/`prod` (collapse multiple sections into Quick Start's state line). Both leak into Task Status and Last Session in ways section-by-section editing misses.

4. **No wrapper artifacts.** Last line is real content, not a `</content>` tag from a Read result. Run `tail -c 40 <file>` to check.

**Judgment checks** — these catch logical completeness:

- **Cross-section duplication.** Grep the doc for 2–3 critical phrases. A phrase in more than two sections or the same fact across two bullets means collapsing to one. A doc-wide grep after all edits lands; section-by-section reading misses duplicates introduced within one section.
- **Back-references reconciled (§6).** No roadmap/index/`Related:` doc still mirrors an outdated status for the feature you updated.
- **MADR compliance.** Every row in `## Key Technical Decisions` is either an MADR block or legitimately escaped it (no real alternative existed). If whole-doc MADR exceeds 300 lines, split into index + `decisions/<theme>.md`.
- **Doc-stated counts.** If the doc names a count ("N decisions", "5 critical gotchas"), re-derive it by running the command that produces it, never adjust by hand. A doc carrying both the count and the command drifts silently on every increment.

## 6. Cross-References

When creating, `Glob: tasks/**/current.md` and add bidirectional `Related:` refs for any connected domains.

### Reconcile back-references (on update)

The §1 scan finds docs to update from code changes, inputs, and verbal requests — docs that *own* work. Some docs own no work; they only mirror a feature's status: roadmaps, index/hub docs, anything listing the feature in a row or `Related:` link. Nothing in a git diff points at them, so a work-driven scan never reaches them and their mirrored status can drift silently — a roadmap row still saying "uncommitted" weeks after ship.

After updating a feature doc, close the loop on what refers back to it:

1. `Grep tasks/**/*.md` for the updated doc's path and its feature name/vocabulary — in every repo the feature spans, not just the one you edited. A cross-repo feature's loudest mirrors often live in the *other* repo's tree, where a same-repo grep can't reach them.
2. For each doc that mentions it — roadmap rows, hub tables, `Related:` lists — check whether the status it mirrors still matches reality; flip stale "uncommitted/pending/not pushed" hedges to match.
3. Status-sync, not a rewrite — touch only the row/line referencing the feature, leave the rest of the index doc alone.

Signal you've found a mirror needing sync: the referencing doc describes the feature in the past tense of an older state than the doc you just updated.

The feature-name grep above misses two other reconciliation cases, each needing its own vocabulary to search for rather than the feature's name:

1. **A fixed bug.** A doc describing it may never mention the feature at all, only the defect — grep the symptom/flag/command the gotcha names (`RELOAD_NGINX`, the error string) plus its hedges ("still", "until they're fixed", "can never"). Every hit asserting the bug is live needs to flip to fixed, with the reason it's now safe. Run the command that actually settles this before flipping anything, and be willing to flip in the other direction too — a doc claim that contradicts your session's experience is as often right as it is stale, and an unverified "correction" discredits a source that was correct while reading as settled to whoever reads it next. A stale status is merely out of date; a stale gotcha actively misleads — the next session re-fixes a solved bug or routes around a problem that no longer exists.
2. **A moved fact.** If the session split a doc, extracted a section, or renamed an anchor, grep the file/anchor name instead of any claim — a move leaves every claim true and only the routing wrong, so a claim-based grep finds nothing to fix. Nothing 404s; the emptied file still resolves as a router, and every `📖 <file>` that promised a fact now lands the reader where the fact isn't. `grep -rn "escrow-engine.md" tasks/` and repoint each hit at the leaf that now owns the fact, prioritizing `Gotchas:` teasers and `Next Steps` items (their contract is "one-line fact + the file with detail," so a reader may act on the teaser alone) — then mark the emptied file a router in the index.
