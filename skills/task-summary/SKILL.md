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

Two facts are often mistaken for doc content when they're actually derivable:

- **Git-tracked state doesn't belong.** "Committed" / "pushed" is answered by `git log`/`git status` — a doc's copy goes stale the instant someone commits. Delete these words on sight.
- **Deploy/environment status is real.** "Which environment ran this code" isn't git-tracked (staging has real S3, local has different media behavior). Its one home is Quick Start's state line; elsewhere point there.

An external tracker ID (ClickUp/Jira) in prose explaining a status needs its durable home too — add it to `Related:` in the same write, not a mention in `Last Session` that disappears next overwrite.

### Judgment shapes rules; trip-wires paralyze them.

A rule stating "mechanism" lets a reader handle cases the doc never anticipated. A trip-wire naming one specific mistake trains a reader to reach for a checklist instead of reasoning. For task docs, this means: rows teach "what to know and do", decision blocks record "why we chose this", gotchas explain "what mechanism breaks" — not "these 17 ways to have failed." Collapse enumerations into principles; where a rule is truly underivable (a harness quirk, a binary with silent failure), state it plainly rather than as a trip-wire. 📖 `../_shared/references/writing-style.md` covers the full tension; for task docs the capture filter, prose-vs-value, and mechanism-not-trip-wire are the three that need deciding.

Base sentence style: rows hold one rule plus the single strongest reason, in two sentences or fewer. Rejected-alternative essays and verification narratives belong to git history, not the doc. Commit hashes live only in Last Session; elsewhere, verification is one word.

### Task docs are unhobbled even in their decision blocks.

Every section — including `## Key Technical Decisions` and its MADR/ADR blocks — is written as judgment not enumeration. A Consequence that reads "1. Never X, 2. Always Y, 3. Don't Z" is the same trip-wire trap in MADR form. Rewrite as: "Because X silently fails in condition C and Y requires Z, we chose this approach to handle both." Each decision block teaches; it doesn't prescribe. This applies equally to the index doc and any `decisions/*.md` companion — the shape rule holds across the whole doc set.

### Size budget

`current.md` should stay under 300 lines, measured by byte size (`wc -c`), not line count — a whole-doc MADR rewrite can grow lines while shrinking bytes (dense table cells become short ADR bullets). Compare `wc -c` against your starting point; if that file was already dirty, use `git show :<path>` (staged copy) rather than HEAD. Capture the baseline before your first write. 📖 `../_shared/references/two-tier-condense.md` for the full mechanics.

Once over budget, delegate to `condense-task-doc` — its row-existence pass (deleting gotchas/decisions discoverable from code) is the step most likely skipped under time pressure, and sentence-tightening alone won't move a 40+-row doc.

Budget the **set**, not just the index: once split, `decisions/*.md` often outweighs `current.md` several times. Run `find <doc-dir> -name '*.md' | xargs wc -lc` for the real number — `find`, not a glob, because an unsplit doc has no such directory and zsh aborts the command, reporting 0.

**Before finishing any write** that touched commit/deploy state, run two doc-wide greps:
- `committed`/`uncommitted`/`pushed` (case-insensitive — delete any outside an MADR `**Status**: committed` lifecycle field)
- `deployed`/`staging`/`prod` (multiple sections = collapse extras into Quick Start's state line)

Both leak into Task Status, Last Session, and companion Status lines in ways that section-by-section editing misses. Only a full-doc grep catches it.

## 1. Resolve Path

Before writing — scan or explicit path alike — settle whether you own these docs. Judge by diff *content*, never by status plane (`../_shared/references/diff-ownership.md`): auto-staging makes your own writes indistinguishable from another writer's staged work at a glance. The real question is whether this session's own content traces this diff. A background `Agent` still running, `git status` showing `tasks/` files you never touched, uncommitted doc edits predating this session, two sessions having edited the same doc so the content itself is a mix — these all read as "the doc is contested for the rest of this run" once noticed, and a case resembling none of them still needs the same question asked. Check this when the session starts, not when it finishes.

Contested → don't run the multi-domain scan, and on an explicit path take §4's guard-fired branches instead of its overwrite mandates; verify read-only instead (report gaps for the owner to fix) or scope to the doc you actually own.

That test reads the peer off disk, so it sees nothing until their bytes land. When a live peer is already known (`../_shared/references/cross-session-messaging.md`), a one-line heads-up naming the doc before a Quick Start rewrite is worth sending — it doesn't gate the write, and no reply changes what the guard above decides.

| Input | Action |
|-------|--------|
| Full path | Use as-is |
| Domain/feature | Expand to `tasks/<domain>/<feature>/current.md` |
| Empty / task description | **Multi-domain scan** — see below |

### Multi-Domain Scan (when no explicit path given)

Don't assume one domain per session — scan the full conversation for every domain that needs a task doc:

1. **Code changes**: `git status --short` (every repo the session touched — see the sibling-repo note below) → infer domains from file paths. Use `git status`, not `git diff --name-only` — the latter hides staged and untracked files, so it goes empty the moment you've staged, reading as "nothing changed" for work you just did. If it's empty because the session's work is already committed, that's the same blind spot with a different cause: count from the session's base commit instead, `git diff --name-only <base>..HEAD` where `<base>` is HEAD at session start (or the merge-base with trunk). In a non-git project the command errors instead of going empty — infer domains from an mtime listing off session start (`../_shared/references/verifying-a-write-landed.md`).
2. **External inputs**: WhatsApp messages, emails, Slack, screenshots, ClickUp pastes — extract every distinct issue/feature/bug mentioned.
3. **Verbal requests**: "also note X", "don't forget Y", "the other issues" — those are domains too.

A sibling repo has its own `tasks/` tree that this scan doesn't reach on its own — two independent checkouts in sibling directories aren't the nested-sub-repo shape the commit/ship skills describe, so no `git -C <subdir>` walk finds them and the harness only walks from the working dir. Whenever the session's work touched a second repo at all, re-run the scan from that repo's root and update its own `tasks/**/current.md` in the same pass (mirrors `read-summary`'s sibling-repo step) — otherwise the feature's originating side gets documented exhaustively while the other side is never opened, and nothing about the doc you did write looks incomplete.

Map each domain to its existing doc by content, not by folder name — a changed file path or feature name rarely matches the doc's folder (code `src/modules/qc-review/` → doc `setup/upload-redesign/`; folders are engineer-domain-named, not feature-named). Delegate raw candidate-gathering to the `Explore` agent, one call per domain/feature or one batched prompt covering all: `Glob tasks/**/*.md` (incl. `_archive/` and flat `tasks/<domain>/<feature>.md`) plus `Grep` for the concept's vocabulary and synonyms across doc body and header. The mapping judgment — which candidate is the actual match — stays inline against the returned raw data. Once dispatched, don't re-Glob/re-grep the same tree inline while it runs — wait for the completion notification instead; delegation mechanics are in `../_shared/references/explore-delegation.md`. Follow any surviving `Merged into`/`Supersedes` redirect to the live doc (older repos may have legacy stubs; new merges no longer create them — see §2a). This is what prevents creating a duplicate doc when one already exists under a different folder name.

Build a table of all domains before writing anything:

```
| # | Domain/Feature | Source | Task Doc | Action |
|---|---------------|--------|----------|--------|
| 1 | webhook phone fix | code changes | tasks/notifications/webhook/current.md | Update |
| 2 | freemium tab | WhatsApp msg | tasks/student/freemium/current.md | Create |
```

Then create/update each task doc. Every issue mentioned in the session gets one — even if it's just a 📋 Planning stub. A captured issue is better than a forgotten one.

If a session had to reverse-map a whole module because no task doc existed for it (several Explore agents, reading the full flow), that mapping work is itself the argument for creating the doc now, not a note to leave in a related doc's Last Session for later. Filing "no task doc exists for X" without creating it just guarantees the next session repeats the same full-module study — turn the mapping you already did into `tasks/<its-domain>/<feature>/current.md` and cross-reference it from wherever you would have left the note.

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

**Edit in place.** The doc should always read as one coherent current-state document, never sessions appended to each other. Everything else updates in place: a fact that changed gets edited to its existing row rather than added beside it; a finished work stream collapses to one summary row ("Phase 2 built + reviewed + committed ✅") rather than staying itemized. Don't wait for every row to tick ✅ first. 

**Two sections are rewritten wholesale rather than appended:** Quick Start (describes the present, not a history of presents) and Last Session (holds one session only, because it disappears next run). Both invert when §1's ownership guard fires: additive only, facts routed to typed sections instead. 📖 `../_shared/references/contested-doc-sections.md`.

**Rewriting those two is a two-step operation, and the second step is the one that gets skipped: route before you overwrite.** Read what's there and ask of each fact whether it describes the session or the system — a pending action nobody has done yet, a behaviour that shipped, a route or flag a reader would need — and move those into whichever typed section owns them (Next Steps, the architecture or widget table, Gotchas). Only then rewrite. Skipping the routing feels correct in the moment precisely because the collapse itself is mandated, so the deletion reads as compliance and the loss surfaces sessions later as a fact nobody can find; the older the entries, the more likely they are shipped behavior rather than session narration, which is the opposite of how stale they look. Confirm by grepping the doc for each fact after the rewrite rather than by trusting that you moved it — a fact already covered elsewhere needs no home, and finding zero hits is how you learn which one did.

Start with a gap-check and structure-check against the template — this is what "check for template drift" means:
1. List the doc's `## ` headers; add any missing from the template's required set.
2. Verify each existing section's internal structure matches the template — table columns, field names, order — and fix non-conformant structure in place. What counts as drift is a section going missing, not a shape that differs — a split axis fitting the domain (Hosting/Build-Pipeline) or columns carrying actual gotchas are correct as-is. Reshape only when the current shape loses something: free-form bullets where a table would let a reader scan, or a gotcha table whose rows have no separating axis at all.
3. `## Next Steps` is grouped by kind of work, not by when items were found — regroup an ungrouped or date-grouped list whenever you touch the doc. Vocabulary: `references/templates.md`. In a SPLIT doc set, every open actionable belongs in the index's `## Next Steps`, not scattered across `decisions/*.md` files — splitting is about where explanation lives, not where work lives. Each index item is one line (what to do + pointer to detail); decisions files point back. Exception: a checklist meant to be ticked while doing something belongs beside the procedure, with the index carrying a single line pointing to it.

New rows in Bugs Fixed and Critical Gotchas get composed already-condensed: paraphrase root cause and fix directly, rather than transcribing session detail (timestamps, assertion counts) and trimming after. A Critical Gotchas row instructs a reader rather than recording a decision, so it applies the mechanism-not-trip-wire rule — explain what breaks and why, not "never do X".

Three sections grow without bound unless pruned: `## Bugs Fixed` past 10 rows keeps the last 5 and summarizes the rest; `## Files` stays a living map of ~15 key files (per-phase subsections collapse into it); `## Next Steps` deletes done items rather than checking them off. A `## Completed (date)` section shouldn't exist — merge its content into the sections that own it.

A user's scope call on a Next Steps item (defer, decline, deprioritize, block-on-X) is worth capturing with its reason, since a chat-only acknowledgement is lost next session. The item's markers should agree — a priority marker on something just deferred contradicts itself.

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

Re-read the whole doc. Does every section still say something true, complete, and stated exactly once?

**"True" covers the sections you didn't touch.** The checks below mostly ask whether this write broke something, which quietly scopes validation to the diff — and staleness is precisely what lives outside it. A doc goes stale because the session that falsified a fact and the session that could notice are different sessions: you rename a thing and update the doc about the rename, while the sibling paragraph mentioning the old name isn't in your diff, isn't in the §1 scan (which maps *code* changes to docs, not doc changes to sibling docs), and so is never read. It stays wrong until someone opens that file for an unrelated reason. You are that someone now, holding the file open with edit intent — which makes this the cheapest moment the staleness will ever have. Sweep the fields written once and checked least (`Quick Start`, `Status:`, `Immediate next actions`, and any prose in a file's opening lines describing what the system currently is), and in a split doc set read the `decisions/*.md` headers too, since the index gets the attention and the siblings inherit the drift. Fix what you can settle, and where the doc contradicts what this session observed, verify before flipping — a doc claim is as often right as it is stale, and an unverified "correction" discredits a source that was correct.

**Three essential checks:**

1. **LLM-CONTEXT** has Status, Domain, Related, Last updated, and the date is today. Every section's structure matches the template — correct table columns, correct field names, no free-form bullets where a table is specified.

2. **No accidental losses.** Deliberate pruning is expected; what this catches is a row dropped while reflowing a section. A rewrite touching large blocks wants `../_shared/references/two-tier-condense.md`'s diff pass — re-reading confirms the result reads plausibly, but that doesn't prove rows didn't fall out. Capture counts BEFORE rewriting: `grep -c '^|'`, `grep -c '⚠️'`, a byte count. A large byte drop on a restructured-only doc is the tell — restructuring moves text, it doesn't remove it, so anything past ~10% means content went. A doc set each shedding a third of bytes is deletion wearing a rewrite's face.

3. **Cross-section duplication** — grep the doc for its 2–3 most critical phrases. A phrase in more than two sections or the same fact across two bullets (two Next Steps both saying "then deploy via CI") means collapsing to one. A doc-wide grep after all edits lands; section-by-section re-reading misses duplicates introduced within one section.

**Additional checks** (run these if they apply to your write):
- **Back-references reconciled (§6)** — no roadmap/index/`Related:` doc still mirrors an out-of-date status for the feature you just updated.
- **MADR compliance** — every row in `## Key Technical Decisions` is either an MADR block or legitimately escaped it (no real alternative existed). If whole-doc MADR exceeds 300 lines, split into index + `decisions/<theme>.md`.
- **Next Steps structure** — grouped by kind of work, not by when items were found. No stale completed items. In split docs, every actionable belongs in the index's list, not distributed across `decisions/*.md`.
- **No wrapper artifacts** — last line is real content, not a `</content>` tag from a Read result. Run `tail -c 40 <file>` or check the final `+` line of `git diff HEAD -- <file>`.
- **Doc-stated counts are re-derived** — if the doc names a count ("N decisions", "5 critical gotchas"), run the command that produces it, never adjust a number by hand. A doc carrying both the count and the command is drifting silently on every increment.
- **Commit/deploy state** — if your write touched commit/deploy state, run these doc-wide greps even if everything feels clean: `committed`/`uncommitted`/`pushed` (delete any outside an MADR `**Status**: committed` lifecycle field) and `deployed`/`staging`/`prod` (collapse multiple sections into Quick Start's state line). Both leak into Task Status and Last Session in ways section-by-section editing misses — only a full-doc grep catches it.

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
