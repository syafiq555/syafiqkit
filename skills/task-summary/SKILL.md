---
name: task-summary
description: Create, update, or rewrite task summary documentation (current.md and its decisions/*.md theme files). Handles path resolution, domain inference, template selection, cross-references, Quick Start writing, and splitting an oversized theme file into sub-files. This is `/done` Step 4 — after implementation work, invoke `/done` rather than this skill alone, so the sibling steps (review, CLAUDE.md capture) run too. Use directly for ANY task documentation workflow — including "rewrite with proper template", "conform to template", "add a Quick Start", or continuing/finishing doc work from an earlier turn in the same session — even if the template shape is already known from a prior read. Invoke this skill fresh each time rather than editing docs directly against a recalled structure; its rules (condense/split thresholds, validation greps) can move between sessions.
---

# Task Summary

Living documentation for humans and LLM agents. Always reflects current state — not a changelog.

## Workflow at a glance

1. **Resolve path** — turn the input (full path / `domain/feature` / empty) into `tasks/<domain>/<feature>/current.md`. No explicit path → run the multi-domain scan first (§1).
2. **Open `references/templates.md` and keep it open** — every section heading, table column and field name you write must match it verbatim, so this is a read-while-writing file, not a one-time skim. Pick Full (multi-session) or Minimal (single fix).
3. **Create or update** — missing doc → Full template; existing doc → edit in place, gap-checking against the template for missing sections.
4. **Validate** — re-read against the checks in §5.
5. **Reconcile back-references** — sync any roadmap/hub/`Related:` doc that mirrors the status you just changed.

The density rules below apply to every write in steps 3–4. Doc already over budget (see Size budget) → delegate to `condense-task-doc` rather than hand-rolling its row-existence pass.

## Density rules

**Goal**: minimum tokens, maximum actionability. A cold-start session reads the doc once and acts correctly — no re-reads, no guessing. Two failure modes kill these docs: the same fact restated in several sections, and bloated sentences.

### One fact, one home

Each fact lives in exactly one section — everywhere else points to it rather than restating it. This applies within a doc (LLM-CONTEXT and Quick Start are pointer indexes into the canonical section, not copies of it) and across a doc's files (a `decisions/<theme>.md` file and the index both re-explaining the same open item is the same violation crossing a file boundary). A fact is either a Decision (why) or a Gotcha (what breaks) — never both.

Two facts are easy to mistake for doc content when they're actually derivable elsewhere:

- **Git-tracked state doesn't belong in the doc at all.** "Committed" / "pushed" / "not yet pushed" is answered by `git log`/`git status`, and a doc's copy of that answer goes wrong the instant someone commits — delete these words on sight rather than deduping them. The word adds nothing even said once, so this isn't a repetition fix.
- **Deploy/environment status is different — it's a real fact, and it does belong**, because "which environment ran this code" isn't git-tracked (staging has real S3 CORS, local media behaves differently). Its one home is Quick Start's state line; everywhere else points there instead of restating it.

An external tracker ID (ClickUp/Jira/Linear) that shows up in prose explaining why a status changed needs its durable home too — add it to `Related:` in the same write, not just the sentence that pulled it in; a mention in `Last Session` reads once and is gone next overwrite.

`⚠️` is reserved for irreversible/destructive consequences — data loss, a broken audit trail, a silent prod regression, something unrecoverable. Ask "if this happens, can it be undone?" before reaching for it; if yes, bold text carries "surprising" or "worth knowing" just as well, and the marker stays meaningful for the cases that actually need triage-by-glance.

### Sentence style

Base rules: `../_shared/references/writing-style.md`. For task docs specifically: rows hold the rule plus the single strongest reason, in two sentences or fewer — rejected-alternative essays and verification narratives belong to git history, not the doc. Commit hashes live only in Last Session; elsewhere, verification is one word ("verified").

### Size budget

`current.md` should stay under 300 lines, measured by byte size (`wc -c`), not line count — a whole-doc MADR rewrite can legitimately grow lines while shrinking bytes (a dense table cell becomes several short ADR Consequence bullets), so compare `wc -c` against the version you started from before concluding a doc needs condensing. `git show HEAD:<path>` is the right baseline only when the file was clean at session start; on an already-dirty doc, HEAD's copy includes a prior writer's unfinished edits, and the delta you'd report is theirs plus yours. Capture `wc -c` before your first write, or diff against `git show :<path>` (staged) — see `../_shared/references/two-tier-condense.md` for the full baseline rule.

Once over budget, condense via `condense-task-doc` rather than improvising — its row-existence pass (deleting gotcha/decision rows that are discoverable from code) is the step most likely to get skipped under time pressure, and sentence-tightening alone doesn't move a 40+-row doc.

Budget the doc **set**, not just the index: once a doc is split, `decisions/*.md` routinely outweighs `current.md` several times over, so measuring the index alone reads healthy while the feature's docs are the real problem. `find <doc-dir> -name '*.md' | xargs cat | wc -lc` is the number that matters — `find`, not a `decisions/*.md` glob, because an unsplit doc has no such directory and zsh aborts the command on the unmatched glob, reporting 0 and passing every unsplit doc as empty.

MADR is the default decision structure — every `## Key Technical Decisions` entry is an MADR block (Problem/Decision/Rejected/Consequences/Status, per templates.md) unless no alternative was genuinely considered, in which case a plain `| Decision | Rationale |` row is the honest shape. A whole-doc MADR that's already over budget after legitimate growth splits into index + `decisions/<theme>.md` (templates.md) as part of the current write — this doesn't need to wait for a separate ask.

Before finishing a write that touched commit/deploy state, run two greps against the whole doc regardless of how clean it feels: `committed`/`uncommitted`/`pushed` (case-insensitive — any hit outside an MADR `**Status**: committed` field, which is a decision-lifecycle value per templates.md and not git state, is a delete) and the deploy/environment word (`deployed`/`staging`/`prod` — more than one section carrying it means collapsing the extras into Quick Start's state line). Both routinely leak into Task Status rows, Last Session, and a sibling `decisions/*.md` Status line in ways that section-by-section editing doesn't catch — the only reliable check is a doc-wide grep after all edits land.

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

1. **Code changes**: `git status --short` (every repo the session touched — see the sibling-repo note below) → infer domains from file paths. Use `git status`, not `git diff --name-only` — the latter hides staged and untracked files, so it goes empty the moment you've staged, reading as "nothing changed" for work you just did. If it's empty because the session's work is already committed, that's the same blind spot with a different cause: count from the session's base commit instead, `git diff --name-only <base>..HEAD` where `<base>` is HEAD at session start (or the merge-base with trunk).
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

Strip tool-output wrapper artifacts before writing, whether creating fresh or rewriting the whole doc — see `../_shared/references/strip-tool-output-tags.md`.

## 4. When Updating

Edit in place. The doc should always read as one coherent current-state document, never a changelog of sessions appended to each other.

Start with a gap-check and structure-check against the template — this is what a user asking to "check for template drift" means (the doc's divergence from `references/templates.md`, not any PDF/Blade template in the code):
1. List the doc's `## ` headers; add any missing from the template's required set.
2. Verify each existing section's internal structure matches the template — table columns, field names, order — and fix non-conformant structure in place. What counts as drift is a section the template names going missing, not a shape that differs — a split axis fitting the doc's domain (Hosting/Build-Pipeline on an infra doc), or columns carrying what that doc's gotchas actually need, are correct as-is. Reshape only when the current shape loses something: free-form bullets where a table would let a reader scan, or a gotcha table whose rows have no axis separating them at all. The same in-place fix extends to a row's decoration, not just its columns: a Critical Gotchas row you're already touching for the structure check that carries a `**Tell:**` restating its own left-hand cell is worth trimming while you're there — this is presentation, not a rewrite of the rule, and it stops at the rows this pass already reads for a structural reason, not a fresh sweep for style.
3. `## Next Steps` is grouped by kind of work, not by when items were found — regroup an ungrouped or date-grouped list the moment you touch the doc, regardless of length. Vocabulary: `references/templates.md` "Next Steps".

   In a SPLIT doc set, every open actionable belongs in the index's `## Next Steps`, not distributed across the `decisions/*.md` files that own the detail. Splitting a doc is about where explanation lives; a reader asking "what's outstanding?" should still get one list in one file, since per-file backlogs mean checking four files to answer a question the index exists to answer. Each index item is one line — what to do, plus a pointer to the file holding the why and how — and each decisions file points back rather than keeping its own copy. The exception is a checklist meant to be ticked while doing something (a test-run pass), which belongs beside the procedure it accompanies, with the index carrying a single line pointing at it.

Two sections are rewritten rather than added to: **Quick Start**, which describes the present rather than a history of presents, and **Last Session**, which holds one session only. Before overwriting Last Session, move anything still load-bearing into its typed table — that section is gone next run, so a decision, gotcha or bug left there is lost. Both invert when §1's ownership guard fires: additive only, facts routed to their typed sections instead (`../_shared/references/contested-doc-sections.md`).

Everything else is edited in place. A fact that changed updates its existing row rather than gaining a second one beside it, and a finished work stream collapses to a single summary row ("Phase 2 built + reviewed + committed ✅") rather than staying itemized — don't wait for every row to tick ✅ first. New rows in Bugs Fixed and Critical Gotchas get composed already-condensed: paraphrase root cause and fix into a sentence or two directly, rather than transcribing the session's investigation (timestamps, assertion counts, "verified by X vs Y") and trimming after. A Critical Gotchas row instructs a reader rather than recording a decision, so the mechanism-not-trip-wire rule from the base writing-style rules applies to it the way it does to a CLAUDE.md entry; the ADR blocks are a different job and it doesn't reach them.

Three sections grow without bound unless pruned on the way past: `## Bugs Fixed` past 10 rows keeps the last 5 and summarizes the rest as "N earlier bugs fixed"; `## Files` stays a living map of the ~15 key files, so per-phase subsections collapse into it; `## Next Steps` deletes done items rather than checking them off. A `## Completed (date)` section shouldn't exist at all — merge its content into the sections that own it.

| Section | Action |
|---------|--------|
| `LLM-CONTEXT` | Update Status + Last updated |
| `## Quick Start` | Rewrite entirely (see below) |
| `## Task Status` | Tick off completed rows; collapse a finished stream to one summary row |
| `## Bugs Fixed` | Append, composed condensed |
| `## Critical Gotchas` | Append to the Backend or Frontend table, composed condensed |
| `## Key Technical Decisions` | New decision → append. Same decision evolved → edit in place (MADR sub-rule below) |
| `## Files` | Add new files; keep it a map, not a changelog |
| `## Next Steps` | Remove done, add pending; regroup per step 3 above |
| `## Last Session` | Fold out what's load-bearing, then overwrite — ≤5 bullets, ≤2 lines each |

A user's scope call on a Next Steps item (defer, decline, deprioritize, block-on-X) is worth capturing in the item with its reason, since a chat-only acknowledgement is lost next session — and the item's markers should agree with it, because a priority marker on something the user just deferred contradicts itself.

### MADR Blocks — Edit-in-Place vs Append

`references/templates.md` defines when a Decision becomes an MADR block instead of a table row. The test that decides edit-vs-append: did the underlying decision change, or did the record of an unchanged decision get more accurate?

| Signal | Action |
|--------|--------|
| Record of an already-recorded decision got more accurate (status flipped `planned`→`shipped`, a Consequence turned out different, an implementation bullet changed) | Edit the existing block's fields in place — same "edit in place, don't append" rule Quick Start follows. Update Status/date to show it was touched. |
| The decision itself changed — genuinely new decision, or a Rejected option got reconsidered and adopted | Append a new block with `Supersedes D-[id]` in its Status line (new blocks use a slug ID, e.g. `D-gateway-fee-cap` — see `references/templates.md`). Don't rewrite the old block to match — that D-[id] was later reversed is itself worth keeping. |

### Quick Start Section (cold-start context for next session)

Place immediately after the `# Title` and before `## Overview`. Rewrite on every update, not append, unless §1's guard fired (then additive only per the table above). A fresh agent reads only this section before starting work — if it can't act from Quick Start alone, the section is insufficient.

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

Re-read after writing. Most of what follows is one underlying question — does every section still say something true, complete, and stated exactly once — applied to a different part of the doc:

1. LLM-CONTEXT has Status, Domain, Related, Last updated, and the date is today.
2. Every section's structure matches the template — correct table columns, correct field names, no free-form bullets where a table is specified.
3. Next Steps has no stale completed items, and is grouped by kind of work — no flat list, no group named for when its items were found, no empty groups.
4. No rows lost incidentally. Deliberate pruning is expected; what this catches is a row dropped while reflowing a section — a rewrite that touched large blocks wants `../_shared/references/two-tier-condense.md`'s diff pass, since re-reading confirms the result reads plausibly, not that nothing fell out of it. The diff has to be run by whoever will act on the result: a rewrite delegated to an agent comes back reporting the check passed regardless of whether it did, and "zero fact loss" is the sentence such a report reaches for precisely when rows went missing. Capture the counts (`grep -c '^|'`, `grep -c '⚠️'`, and a copy of the files) BEFORE dispatching, since afterwards there is nothing left to compare against. A large byte drop on a doc that was only being restructured is the tell — restructuring moves text, it doesn't remove it, so anything past roughly a tenth means content went, and a set of files each shedding a third of their bytes is a deletion wearing a rewrite's description.
5. Back-references reconciled (§6) — no roadmap/index/`Related:` doc still mirrors an out-of-date status for the feature you just updated. Compare the repos the session's work touched against the repos whose docs you opened — if the first count is larger, the sibling-repo step in §1 didn't fire and the pass is incomplete.
6. MADR compliance — every row in `## Key Technical Decisions` is either an MADR block or legitimately hit the escape hatch (no real alternative existed); a plain table row for a decision that did have a rejected alternative isn't compliant, convert it now. If the doc is already whole-doc MADR and now >300 lines, split per Density rules rather than leaving it for next session.
7. Cross-section duplication — grep the doc for its 2-3 most critical phrases. A phrase surviving in more than two sections, or the same fact split across two bullets in the same section (two Next Steps items both saying "then deploy via full CI"), means collapsing to one. This is easiest to miss during a condense pass done section-by-section, since a duplicate introduced in one section isn't visible from re-reading that section alone — only a doc-wide grep after all edits land catches it. If the write touched commit/deploy state, run the two Size-budget greps here too, even if the doc felt clean while you were editing it.

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
