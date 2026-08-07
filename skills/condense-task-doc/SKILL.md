---
name: condense-task-doc
description: Aggressively condense a bloated task doc (current.md or any markdown living-doc) — collapse investigation narratives into table rows, strip verification numbers and commit hashes, remove duplicated facts across sections AND across the doc's sibling files, trim Quick Start to ≤15 lines, and rewrite in place. Trigger when the user says "condense this", "shrink this doc", "trim the task doc", "remove what's not needed", "restructure/rephrase shorter", or any variation implying the doc has grown too large. A named path is the doc SET, not one file — always condense the index AND its decisions/*.md siblings together. Also auto-trigger when updating a task doc that is already >300 lines — condense first, then write the update. When the doc is a whole-doc MADR (decision-log) still >300 lines after a legitimate conversion, this skill SPLITS it (index + decisions/<theme>.md files) by default instead of condensing — see Process step 2. Do NOT confuse with condense-claude-md (which handles CLAUDE.md files, not task docs).
---

# Condense Task Doc

The goal is maximum signal-to-noise: a cold-start agent should be able to read the doc in under 2 minutes and act correctly. Every line must earn its place.

**This skill is the single source of truth for task-doc size and cut/keep policy** — thresholds, budgets a doc declares for itself, the split-into-`decisions/<theme>.md` decision, and every What-to-cut/What-to-keep rule. No other skill or agent carries its own number. `claude-md-pruner` (legacy name; it prunes task docs too) delegates here for every sizing verdict and points at these rules rather than copying them — its own lane is staleness verified against the live codebase, which this skill does not do. The CLAUDE.md equivalent is `condense-claude-md` — same rule, different artifact.

## The underlying test

Everything below — what to cut, what to keep, whether a pass actually worked — comes down to one question, asked at different moments: **is this fact derivable by a competent engineer reading the code, or would losing it cause a future session to act incorrectly?** Investigation narratives, evidence, and verification logs fail that test (git history already carries them). A counter-intuitive project-specific behavior, a silent-failure gotcha, or a non-obvious ordering constraint passes it. Hold onto this one test through the rest of the skill rather than re-deriving it per section — it's the same judgement whether you're deciding a row, a sentence, or whether the whole pass counted as real condensing.

## Two failure modes that cause bloat

**1. The same fact restated in multiple sections.**
A fact belongs in exactly ONE place. LLM-CONTEXT and Quick Start *point* to canonical sections — they do not restate them. Investigation narratives re-tell what Bugs Fixed already records. Verification logs re-tell what git history owns.

**2. Bloated sentences.**
Base writing-style rules: `../_shared/references/writing-style.md`. Evidence (hashes, numbers, SQL output) lives in git — not the doc.

---

## What to cut

**Always remove:**
- Investigation narratives — the "how we found it" story (evidence tables, live API outputs, SQL queries run during the session, stale variant ID lists). The fix and the rule are what matter; the detective work belongs in git history.
- Verification numbers, commit SHAs (outside Last Session), and "confirmed X=Y on prod" evidence in table rows. One word ("verified") is enough.
- Duplicated facts — if a gotcha lives in Critical Gotchas AND Quick Start AND LLM-CONTEXT, keep it in one place and point to it from the others. An OPEN item restated with full mechanism in the index, a theme file, AND Next Steps collapses to one canonical statement (Next Steps) + bare pointers elsewhere. Finding these across files is Process step 5.
- Over-used `⚠️` — grep-count it; if it appears roughly every 8-10 lines or less, most instances aren't marking an irreversible/destructive consequence and should downgrade to plain/bold text. Reserve it for data loss, a broken audit trail, a silent prod regression, or an unrecoverable action — task-summary's Layer 1 has the full rule.
- Bugs Fixed rows that re-explain a bug already in Critical Gotchas — check every Bugs Fixed row against Critical Gotchas by ID/topic; if a match exists, collapse the row to `Symptom | → See Critical Gotchas (section, ID)`. Only bugs with no gotcha counterpart keep full root-cause + fix prose.
- Historical metrics (e.g. "1,957 zero-stock syncs over 3 days, 209 models") — context for the original incident, not for future sessions.
- Stale bullet lists of row IDs, variant IDs, or order IDs that were affected — file a one-line summary ("25 stale rows nulled") if needed, not the full list.
- Process history ("Step 1 we reviewed X, then we checked Y, then Z was confirmed") — captures HOW the session ran, not WHAT to know.
- Sections that only exist as incident logs (e.g. `## Investigation 2026-06-03`) — collapse into Bugs Fixed rows.

**Never cut a required section to nonexistence.** `Task Status`, `Bugs Fixed`, `Critical Gotchas` and `Next Steps` may lose every row and still keep their heading — leave a pointer row (`| — | see decisions/<theme>.md |`) instead of deleting the section. A missing section is invisible to every other check here (they all detect excess, not absence), and on a split doc it silently stops the index showing open work.

**Compress, don't delete:**
- Long multi-sentence Bugs Fixed rows → fix description + one-line fix summary. Root cause detail beyond what's needed to classify a recurrence gets dropped.
- Quick Start > 15 lines → cut anything restated in Bugs Fixed or Critical Gotchas. Quick Start answers 5 questions: next action, commands/files, current state, 2-3 gotchas, success criteria.
- Last Session > 5 bullets → keep only what hasn't yet been folded into a Decision or Gotcha row.

---

## What to keep

Every fact that, if removed, would cause a future agent to act incorrectly. Signals:
- A counter-intuitive behavior specific to this project (e.g. "successful_syncs:1 = dispatch, NOT API success")
- A gotcha that looks safe but silently fails (e.g. "combo `available_qty` is always 0 in DB — use getComboStock()")
- A non-obvious ordering constraint or guard that prevents a recurring bug class
- A current-state fact needed to pick up work (e.g. "B14 deployed as cherry-pick, not feature branch SHA")

Do NOT keep:
- Evidence that something worked (that's what git blame/log is for)
- Implementation detail that's obvious from reading the code
- Root cause narration beyond what's needed to recognize a recurrence

**Row-existence pruning is a separate pass from sentence-compression — do both.** Tighter sentences with zero rows deleted is the most common way a pass looks done and isn't. Before compressing a sentence, run the whole Critical Gotchas / Key Technical Decisions table through the keep-test above and **delete** (not shrink) any row that fails it — if the fix is the first thing any competent engineer would try on seeing the symptom (generic framework behavior, not project-specific), the row goes.

---

## Section-by-section rules

📖 **`references/section-rules.md`** — per-section cut/keep rules (LLM-CONTEXT, Quick Start, Bugs Fixed, Critical Gotchas, Key Technical Decisions, Last Session, Next Steps, Investigation sections, Files, Task Status). Open the row for the section you are editing.

---

## Process

1. **`Read` the full doc — and the whole doc SET.** The unit of condensation is the feature's documentation, not the path you were handed. `ls` the doc's directory: a `decisions/` subdir (or any sibling the doc routes to) is in scope, and is routinely bigger than the index — a split doc's `decisions/*.md` can be 2-3× the file named in the args. Condensing only the named file and reporting a byte delta is a false result, since the set barely moved. Measure and report the SET's total, not the index's.
2. **Check whether this is actually bloat first** — line count lies, since a MADR restructure grows lines while shrinking bytes. Run `git show HEAD:<path> | wc -c` vs `wc -c <path>` — **valid only if the doc was CLEAN at session start**; on an already-dirty doc HEAD is a prior writer's baseline, so the delta credits their work to your pass. Dirty → measure `wc -c` before your first write, or use `git show :<path>` (staged). Per `../_shared/references/two-tier-condense.md`.
   - Bytes flat or lower → restructure, not bloat. Stop, report both deltas.
   - Bytes grew from genuinely new ADRs, still >300 lines → not condensable either (every ADR earns its place; step 6 has nothing to cut). **Split** by default, no permission needed — index + `decisions/<theme>.md` per `task-summary/references/templates.md`'s "Splitting a whole-doc MADR further" section. The index keeps **three** things: Quick Start, **doc-wide operational tables** (Task Status / Bugs Fixed / Critical Gotchas / Next Steps, scoped to cross-cutting), and the routing table. Only theme DETAIL moves down. After splitting, `grep '^## '` the index and confirm those sections survived — no other check here detects a missing section.
   - **Already split, and the INDEX is still oversized → the append-only tables are the bulk, and compressing them is the wrong move.** Measure per section (`awk '/^## /{...}'`) before deciding: a bug/gotcha/ops table gains a row per session and loses none, so a tighter pass buys one update of headroom and the doc is back next session. Route each ROW to the theme file owning its mechanism (its own "see ADR-N" column usually names it), leave a routing table plus still-open items in the index. Rows belonging to no theme (env, fixtures, deploy) get a descriptively named sibling — a generic `bugs.md`/`misc.md` is just a second index waiting to bloat. Per `templates.md`'s same "Splitting a whole-doc MADR further" section.
     - **If the ADRs cluster into separate FEATURES rather than themes within one feature** (each promotable to its own sibling `tasks/<domain>/<feature>/current.md`, with no single file left to be the parent index) — this is the multi-domain fan-out case, not the single-domain split above. See `task-summary/references/templates.md`'s "Multi-domain fan-out" subsection: doc-wide content that belongs to no single sibling (a registry table, a cross-cutting index) must be folded into the most relevant sibling or flagged to the user — never silently dropped because no resulting folder "owns" it.
   - Bytes grew from accumulated cruft → condense, continue.
3. Read `task-summary/references/templates.md` — note the canonical section headings, table column names, and field order for every section present in the doc.
4. Identify all `## Investigation` or narrative-only sections — these are the primary source of bloat. Plan to collapse them into Bugs Fixed rows.
5. Scan for fact duplication **across the whole set, not per file** — `grep -rl` the 2-3 most critical phrases over every file at once. A per-file pass is structurally blind to the cross-file case: a fact stated fully in the index AND in its owning decision file passes every single-file check, so this only surfaces if you grep them together. Two patterns dominate, both in docs that already went through one condense pass:
   - **Within a file** — a phrase in >2 sections; every Bugs Fixed row whose bug ID/symptom is also in Critical Gotchas.
   - **Across the set** — a Bugs Fixed row explained in full in the index *and* in full in its owning `decisions/*.md`. The recent bugs are the usual offenders (each session wrote them up in both places). Collapse the index side to `→ decisions/<file>.md ADR-N`, matching how older bugs already point.
   Before trusting any new pointer, grep the TARGET for the fact you just deleted — a pointer to a file that doesn't explain it is worse than the duplication it replaced.
6. **Row-existence pass (before sentence compression)**: for every row in Critical Gotchas and Key Technical Decisions, apply the keep-test in "What to keep" and delete rows that fail it — not just shorten them. On a doc with 20+ rows, expect to delete some; zero deletions is a sign this step was skipped rather than genuinely finding nothing to cut.
7. **Draft + verify**: execution model, write-mode choice, and diff-baseline rules are all `../_shared/references/two-tier-condense.md` — which also covers when to hand the draft to a `haiku` agent and what the parent session owes afterward — using steps 1-6's findings (the row-deletion list, the duplication map, the section plan). Estimate the write mode from steps 5-6 BEFORE writing. A doc set that already went through a condense, or `decisions/*.md` MADR blocks near their ~20-line floor, is nearly always an `Edit` job — a full `Write`-rewrite landing under ~15% byte delta is the sign you picked the wrong mode for an already-tight doc, worth naming when you report rather than presenting the small delta as the finished result.
8. Count BOTH lines and bytes before and after (`wc -lc`) **for every file in the set**, and report the per-file deltas plus the set total. A big cut on the index while `decisions/*.md` sat untouched is not a condensed doc set.
9. Target: **≤300 lines** for a task doc with a full bug history, and a real cut — being already under budget doesn't excuse skipping step 6. Line count alone isn't the whole signal: bytes-per-line above ~120-150, or `## Files`/`## Task Status`/`## Bugs Fixed` each still >4KB, means there's a second pass worth running on those sections.
   **Still >300 lines after condensing, and the excess is MADR blocks (each already near its ~20-line floor), not compressible prose → this is step 2's split trigger firing late, not a signal to compress harder.** A second aggressive pass on prose that's already tight just erodes real content for no line-count gain. Re-run step 2's second bullet now: split Key Technical Decisions into `decisions/<theme>.md` per `templates.md`'s "Splitting a whole-doc MADR further" section — no user ask required, do it as part of this same pass, matching step 2's "no permission needed" wording. Report both the condensed delta and the split as one result.
10. **Run step 5's cross-file grep again after all writes land, and before reporting done.** Section-by-section (and file-by-file) editing is the most common way duplication is introduced *during* the pass — the per-file diff-verify in step 7 confirms nothing was lost but is blind by construction to the same fact surviving twice across files. Only a set-wide grep after the last write catches that.
11. **A doc can clear step 9's line/byte target while individual sentences are still bloated — check sentence length directly, not just the aggregate.** `awk '{print length, NR}' <file> | sort -rn | head -15` after a row-existence pass; a paragraph running 500+ characters of stacked parentheticals and inline measurements is the same failure mode step 6 fixes for rows, just at sentence granularity, and bytes-per-line stays inside step 9's normal range because *most* lines are short — only the worst few carry the bloat, so an aggregate metric averages them away. Tighten those specifically (evidence/measurement detail collapses to its conclusion; three related facts in one run-on sentence become one line naming just the mechanism) before reporting a byte delta as the finished result.

---

## Hard rules

- **A restructure fork goes through `AskUserQuestion`, not inline prose** — condensing needs no permission, but choosing between preserving-vs-deleting, or between competing target structures, changes what the doc BECOMES and is the user's call. Ask it as options at the point it arises (matching `merge-task-docs` Step 2's forks). An answer that names a constraint on HOW ("not a generic name", "keep it under X") governs the whole run, not just the one option it was attached to.
- **Strip tool-output wrapper artifacts before writing** — see `../_shared/references/strip-tool-output-tags.md`.
- **Never invent content** — only restructure what exists. If a fact is ambiguous, compress rather than rewrite its meaning.
- **Never delete a Next Step** — only remove items that are clearly completed (marked ✅ or described in the past tense in a Bugs Fixed row).
- **Preserve LLM-CONTEXT block** — update it to match the condensed content, but keep all fields (Status, Domain, Gotchas, Related, Last updated). `Last updated` states the date + a one-line summary of what changed — it does NOT restate deploy/environment status prose ("LIVE in production", "deployed to staging"); that belongs solely in Quick Start's state line (task-summary's "one fact, one home" rule). If the doc being condensed has that phrase duplicated in both places, collapse it to Quick Start and point `Last updated` there instead of copying it forward.
- **Delete git-tracked state on sight — never dedupe it.** "Committed" / "uncommitted" / "pushed" / "not yet pushed" is not a fact worth keeping even once: `git log`/`git status` answers it, and a doc's copy is wrong the moment someone commits. This is a real cut every condense pass makes automatically, distinct from the row-existence judgment call in "What to keep" — don't confuse it with deploy/environment status above, which DOES stay (staging/prod is not git-tracked). Nor with an MADR `**Status**: committed` field — that's a decision-lifecycle value (`committed | planned | debating`), not git state, and no git command answers it. Leave those.
- **Preserve (or correct to) template structure** — column names, table formats, and section order must match `task-summary/references/templates.md` verbatim. Condensing does not grant license to rename columns or substitute bullets where a table is specified. Fix non-conformant structure in the same pass.
- **Report line count before and after.**
- Content-loss verification is step 7's job (`../_shared/references/two-tier-condense.md`) — it also covers sections step 4/6 never explicitly named (a reference table, a credentials note, an unrelated cross-link swept up in the rewrite).
