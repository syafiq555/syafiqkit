---
name: condense-task-doc
description: Aggressively condense a bloated task doc (current.md or any markdown living-doc) — collapse investigation narratives into table rows, strip verification numbers and commit hashes, remove duplicated facts across sections AND across the doc's sibling files, trim Quick Start to ≤15 lines, and rewrite in place. Trigger when the user says "condense this", "shrink this doc", "trim the task doc", "remove what's not needed", "restructure/rephrase shorter", or any variation implying the doc has grown too large. A named path is the doc SET, not one file — always condense the index AND its decisions/*.md siblings together. Also auto-trigger when updating a task doc that is already >300 lines — condense first, then write the update. When the doc is a whole-doc MADR (decision-log) still >300 lines after a legitimate conversion, this skill SPLITS it (index + decisions/<theme>.md files) by default instead of condensing — see Process step 2. Do NOT confuse with condense-claude-md (which handles CLAUDE.md files, not task docs).
---

# Condense Task Doc

The goal is maximum signal-to-noise: a cold-start agent should be able to read the doc in under 2 minutes and act correctly. Every line must earn its place.

**This skill is the single source of truth for task-doc size and cut/keep policy** — thresholds, budgets a doc declares for itself, the split-into-`decisions/<theme>.md` decision, and every What-to-cut/What-to-keep rule. No other skill or agent carries its own number. `claude-md-pruner` (legacy name; it prunes task docs too) delegates here for every sizing verdict and points at these rules rather than copying them — its own lane is staleness verified against the live codebase, which this skill does not do. The CLAUDE.md equivalent is `condense-claude-md` — same rule, different artifact.

## The Underlying Principle

Everything in this skill comes down to one test: **Is this fact derivable by a competent engineer reading the code, or would losing it cause a future session to act incorrectly?** 

Investigation narratives, evidence, and verification logs fail that test — git history already carries them. A counter-intuitive project-specific behavior, a silent-failure gotcha, or a non-obvious ordering constraint passes it. Hold this test through every decision rather than re-deriving its application per section.

## What Gets Cut vs. What Stays

The cut-or-keep decision applies to whole rows, sentences, and sections. The distinction is whether the material survives the underlying test:

**Remove:**
- Investigation narratives and "how we found it" stories (evidence tables, live API outputs, SQL queries run during the session, stale variant ID lists)
- Verification numbers, commit SHAs (outside Last Session), and "confirmed X=Y on prod" evidence in rows — "verified" suffices
- Duplicated facts: if a gotcha lives in Critical Gotchas AND Quick Start AND LLM-CONTEXT, keep it in one place and point to it from the others
- Over-used `⚠️` — if it appears roughly every 8–10 lines or less, most instances aren't marking an irreversible/destructive consequence and should downgrade to plain/bold text. Reserve it for data loss, a broken audit trail, a silent prod regression, or an unrecoverable action
- Bugs Fixed rows that re-explain a bug already in Critical Gotchas — collapse to `Symptom | → See Critical Gotchas (section, ID)` instead
- Historical metrics (e.g. "1,957 zero-stock syncs over 3 days, 209 models") and stale lists of row/variant/order IDs
- Process history ("Step 1 we reviewed X, then we checked Y") — captures session narrative, not future-session knowledge
- Sections that only exist as dated incident logs (e.g. `## Investigation 2026-06-03`) — collapse into Bugs Fixed rows
- Git-tracked state ("committed", "uncommitted", "pushed", "not yet pushed") on sight — `git log`/`git status` answers this; the doc's copy is stale the moment someone commits. (This is distinct from deploy/environment status, which belongs in Quick Start and stays.)

**Compress (not delete):**
- Long multi-sentence Bugs Fixed rows → fix description + one-line summary
- Quick Start > 15 lines → drop anything restated in Bugs Fixed or Critical Gotchas
- Last Session > 5 bullets → keep only what hasn't folded into a Decision or Gotcha row

**Keep:**
Every fact that, if removed, would cause a future agent to act incorrectly:
- A counter-intuitive behavior specific to this project (e.g. "successful_syncs:1 = dispatch, NOT API success")
- A gotcha that looks safe but silently fails (e.g. "combo `available_qty` is always 0 in DB — use getComboStock()")
- A non-obvious ordering constraint or guard
- A current-state fact needed to pick up work (e.g. "B14 deployed as cherry-pick, not feature branch SHA")

Do not keep implementation detail that's obvious from reading the code, or root cause narration beyond what's needed to recognize a recurrence.

**Required sections:** Task Status, Bugs Fixed, Critical Gotchas, and Next Steps may lose every row and still keep their heading — use a pointer row (`| — | see decisions/<theme>.md |`) instead of deleting the section. A missing section is invisible to later checks.

---

## Process

0. **Settle whose doc this is before rewriting it.** This skill rewrites whole files in place, so it destroys more than a section-scoped mandate does when the doc turns out to belong to someone else. Judge by diff *content*, never by `git status` plane (`../_shared/references/diff-ownership.md`); a dirty doc is a peer's baseline, not just a measurement problem for step 2. Contested → take the additive branches in `../_shared/references/contested-doc-sections.md` and don't collapse rows you didn't write, or condense only the siblings you own. A live peer can be known before any of its bytes reach disk (`../_shared/references/cross-session-messaging.md`).

1. **Read the full doc and the whole doc SET.** The unit of condensation is the feature's documentation, not the path you were handed. `ls` the doc's directory: a `decisions/` subdir (or any sibling the doc routes to) is in scope, and is routinely bigger than the index — a split doc's `decisions/*.md` can be 2–3× the file named in the args. Condensing only the named file and reporting a byte delta is a false result. Measure and report the SET's total.

2. **Check whether this is actually bloat first** — line count lies, since a MADR restructure grows lines while shrinking bytes. Run `git show HEAD:<path> | wc -c` vs `wc -c <path>` — valid only if the doc was CLEAN at session start; on an already-dirty doc HEAD is a prior writer's baseline, so the delta credits their work to your pass. Dirty → measure `wc -c` before your first write, or use `git show :<path>` (staged). Per `../_shared/references/two-tier-condense.md`.

   **Bytes flat or lower:** Restructure, not bloat. Stop and report both deltas.

   **Bytes grew from genuinely new ADRs, still >300 lines:** Not condensable — split by default instead. Index keeps three things: Quick Start, doc-wide operational tables (Task Status / Bugs Fixed / Critical Gotchas / Next Steps, scoped to cross-cutting), and the routing table. Only theme DETAIL moves down. After splitting, `grep '^## '` the index and confirm those sections survived. Per `task-summary/references/templates.md`'s "Splitting a whole-doc MADR further" section.

   **Already split, and the INDEX is still oversized:** Measure per section (`awk '/^## /{...}'`) before deciding. Bug/gotcha/ops tables gain a row per session and lose none, so a compression pass buys one update's headroom. Route each ROW to its owning theme file (its own "see ADR-N" column usually names it), leave a routing table plus still-open items in the index. Rows belonging to no theme (env, fixtures, deploy) get a descriptively named sibling — avoid generic `bugs.md`/`misc.md`. Per `templates.md`'s "Splitting a whole-doc MADR further" section.

   **Multi-domain case:** If the ADRs cluster into separate FEATURES (each promotable to its own `tasks/<domain>/<feature>/current.md`, with no single file left as parent index) — see `templates.md`'s "Multi-domain fan-out" subsection. Doc-wide content that belongs to no single sibling must be folded into the most relevant one or flagged to the user, never silently dropped.

   **Bytes grew from accumulated cruft:** Condense and continue.

3. **Read `task-summary/references/templates.md`** — note the canonical section headings, table column names, and field order for every section present in the doc.

4. **Identify `## Investigation` or narrative-only sections** — these are the primary source of bloat. Plan to collapse them into Bugs Fixed rows.

5. **Scan for fact duplication across the whole set, not per file** — `grep -rl` the 2–3 most critical phrases over every file at once. A per-file pass is structurally blind to the cross-file case. Two patterns dominate:
   - **Within a file:** A phrase in >2 sections; every Bugs Fixed row whose bug ID/symptom also appears in Critical Gotchas
   - **Across the set:** A Bugs Fixed row explained fully in the index *and* fully in its owning `decisions/*.md` — collapse the index side to `→ decisions/<file>.md ADR-N`

   Before trusting any new pointer, grep the TARGET for the fact you just deleted — a pointer to missing content is worse than duplication.

6. **Row-existence pass** — for every row in Critical Gotchas and Key Technical Decisions, apply the keep-test and **delete** (not shorten) any row that fails it. On a doc with 20+ rows, expect to delete some. This is a separate operation from sentence compression and must happen first. If no row deletes, the pass was likely skipped rather than finding genuinely nothing.

7. **Draft and verify:** Execution model, write-mode choice, and diff-baseline rules are in `../_shared/references/two-tier-condense.md` — which also covers when to hand the draft to a `haiku` agent and what the parent session owes afterward. Use steps 1–6's findings (row-deletion list, duplication map, section plan) to estimate write mode before writing. A doc set that already went through a condense, or `decisions/*.md` MADR blocks near their ~20-line floor, is nearly always an `Edit` job.

8. **Count BOTH lines and bytes before and after** (`wc -lc`) for every file in the set. Report per-file deltas plus the set total. A big cut on the index while `decisions/*.md` sat untouched is not a condensed doc set.

9. **Target: ≤300 lines** for a task doc with a full bug history, and a real cut. Being already under budget doesn't mean skipping step 6. A doc can meet the line target while individual sentences remain bloated — check sentence length directly. `awk '{print length, NR}' <file> | sort -rn | head -15` after a row-existence pass; tighten paragraphs running 500+ characters of stacked parentheticals and measurements (collapse evidence to its conclusion, split run-on facts into separate lines). Bytes-per-line above ~120–150, or individual sections (Files, Task Status, Bugs Fixed) still >4KB each, signal a second pass on those sections.

   **Still >300 lines after condensing, and the excess is MADR blocks** (each near its ~20-line floor, not compressible): This is step 2's split trigger firing late. Split Key Technical Decisions into `decisions/<theme>.md` per `templates.md`'s "Splitting a whole-doc MADR further" section — no user ask required. Report both the condensed delta and the split.

10. **Verification: Run step 5's cross-file grep again after all writes land.** Section-by-section editing is the most common way duplication is introduced *during* the pass. The per-file diff-verify in step 7 is blind by construction to the same fact surviving twice across files. Only a set-wide grep after the last write catches that.

11. **Execution choice:** Most condensing is an `Edit` job (section rewrites, row deletions); a full `Write` rewrite landing under ~15% byte delta signals a wrong mode choice on an already-tight doc. Name the mode when reporting rather than presenting a small delta as a finished result.

---

## Section-by-Section Rules

📖 **`references/section-rules.md`** — per-section cut/keep rules (LLM-CONTEXT, Quick Start, Bugs Fixed, Critical Gotchas, Key Technical Decisions, Last Session, Next Steps, Investigation sections, Files, Task Status). Open the row for the section you are editing.

---

## Hard Rules

- **A restructure fork goes through `AskUserQuestion`, not inline prose** — condensing needs no permission, but choosing between preserving-vs-deleting, or between competing target structures, changes what the doc BECOMES. Ask it as options at the point it arises. An answer that names a constraint governs the whole run.
- **Strip tool-output wrapper artifacts before writing** — see `../_shared/references/strip-tool-output-tags.md`.
- **Never invent content** — only restructure what exists. If a fact is ambiguous, compress rather than rewrite its meaning.
- **Never delete a Next Step** — only remove items marked ✅ or described in past tense in a Bugs Fixed row.
- **Preserve LLM-CONTEXT block** — update it to match the condensed content, but keep all fields (Status, Domain, Gotchas, Related, Last updated). The `Last updated` field states the date + a one-line summary of what changed — it does NOT restate deploy/environment status prose ("LIVE in production", "deployed to staging"); that belongs solely in Quick Start's state line. If duplicated in both places, collapse it to Quick Start and point `Last updated` there.
- **Preserve (or correct to) template structure** — column names, table formats, and section order must match `task-summary/references/templates.md` exactly. Condensing does not grant license to rename columns or substitute bullets for a specified table.
- **Report line count before and after.**
- Content-loss verification is step 7's job (`../_shared/references/two-tier-condense.md`) — it also covers sections step 4/6 never explicitly named.
