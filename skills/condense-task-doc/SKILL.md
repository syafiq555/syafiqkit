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

The distinction is whether the material survives the underlying test. Apply the test to whole rows, sentences, and sections.

**Derivable facts (delete):** Investigation narratives, evidence of how something was found, verification logs, commit SHAs outside Last Session, duplicated facts living in multiple sections, historical metrics and stale lists, git-tracked state ("committed"/"pushed"), and sections that only exist as dated incident logs. These all have permanent homes in git history. Similarly, drop dated evidence from rows ("confirmed X=Y on prod" → "verified").

**Inert explanation (delete):** Root cause narration beyond what a future session needs to *recognize* a recurrence. A reader doesn't need the story of how it failed, just the signature that will let them spot it again.

**Loud but routine (downgrade):** Over-used warning symbols. If `⚠️` appears every 8–10 lines or less, most instances aren't marking irreversible consequences — they're decorating routine cautions. Downgrade to plain text or bold; reserve the emoji for data loss, broken audit trails, silent regressions, or genuinely unrecoverable actions.

**Compressed (not deleted):** Long multi-sentence rows → fix description + one-line summary. Quick Start > 15 lines → drop anything already restated in Bugs Fixed or Critical Gotchas. Last Session > 5 bullets → keep only what hasn't folded into a Decision or Gotcha row.

**Preserved (essential facts):** Counter-intuitive project behaviors (e.g. "successful_syncs:1 = dispatch, NOT API success"), gotchas that look safe but fail silently (e.g. "combo `available_qty` is always 0 in DB — use getComboStock()"), non-obvious ordering constraints, and current-state facts needed to pick up work (e.g. "B14 deployed as cherry-pick, not feature branch SHA"). Do not preserve implementation detail obvious from the code.

**Duplicated facts:** If a gotcha lives in Critical Gotchas AND Quick Start AND LLM-CONTEXT, keep it once and point to it from the others. Before trusting any pointer, grep the target for the fact — a pointer to missing content is worse than duplication.

**Required sections:** Task Status, Bugs Fixed, Critical Gotchas, and Next Steps may lose every row and still keep their heading — use a pointer row (`| — | see decisions/<theme>.md |`) instead of deleting. A missing heading is invisible to later checks.

---

## Process

**Prerequisites:** Before starting, check ownership. This skill rewrites whole files in place. Judge by diff *content* (📖 `../_shared/references/diff-ownership.md`); a dirty doc is a baseline, not a measurement problem. A live peer can be known before bytes reach disk (📖 `../_shared/references/cross-session-messaging.md`). The ordinary case: a mature doc was written by sessions long gone, and "another session committed this" describes git history, not a reason to defer. Rewriting committed content is what this skill does.

**Core facts first:**
- **Never invent content.** Only restructure what exists. Compress rather than rewrite if a fact is ambiguous.
- **Never delete a Next Step** — only remove items marked ✅ or described in past tense in a Bugs Fixed row.
- **Strip tool-output wrapper artifacts.** A `Read` result wraps in `<content>` tags; a full-file rewrite can carry them in as a literal trailing line. After writing: `tail -c 40 <file>` to confirm the last line is real content.
- **Preserve LLM-CONTEXT block.** Update it to match condensed content, keep all fields. The `Last updated` field states date + one-line summary of what changed — not environment status (that lives only in Quick Start).
- **Conserve content, not form.** A table's shape is a means. Collapse columns or a table into prose if it reads better. What must survive: any Cause cell carrying greppable specifics (exception class, exact expression, `See <Class>` pointer). Renaming columns you're keeping breaks positional checks and changes nothing a reader sees.
- **Editing a shell snippet below? A bare dollar-zero cannot survive here.** This skill is invoked with a path argument, and the harness replaces that token anywhere in this file with the path text before you read it — code fences included — so an `awk` whole-line capture silently becomes a bare regex and the size verdict comes back plausible and wrong. Read a line back through a shell variable (`grep -n` for the number, `sed -n "${var}p"` for the text) instead. `$1`, `$2` and friends are unaffected. 📖 `../_shared/references/editing-skills-checklist.md`'s "Writing a Shell Snippet Into a Skill Body" for the audit command and how it applies to other skills.

**Execution flow:**

1. **Read the full doc SET.** The unit is the feature's documentation, not the path you were handed. `ls` the directory: a `decisions/` subdir is in scope and often bigger than the index — a split doc's `decisions/*.md` can be 2–3× the named file. Measure and report the SET's total, not just the index.

2. **Check bytes first to decide approach.** Line count lies (a MADR restructure grows lines while shrinking bytes). Run `git show HEAD:<path> | wc -c` vs `wc -c <path>` — valid only if the doc was CLEAN at session start. Dirty → capture `wc -c` before your first write, or use `git show :<path>` (staged). (📖 `../_shared/references/two-tier-condense.md`).
   - **Bytes flat or lower:** Restructure, not bloat. Report both deltas and stop.
   - **Bytes grew from new ADRs, >300 lines:** Split instead of condense. Index keeps Quick Start, cross-cutting operational tables, and routing. Theme detail moves to `decisions/*.md`. (📖 `task-summary/references/decision-splits.md`'s "Splitting a whole-doc MADR further".)
   - **Already split, INDEX still oversized:** Measure per section, longest first, to see which one drives the overage:

     ```bash
     grep -n '^## ' <file> | cut -d: -f1 | { total=$(wc -l < <file>); prev=""; while read -r ln; do
       [ -n "$prev" ] && echo "$((ln - prev - 1)) $(sed -n "${prev}p" <file>)"
       prev=$ln
     done; [ -n "$prev" ] && echo "$((total - prev)) $(sed -n "${prev}p" <file>)"; }
     ```

     Route each row to its owning theme file (its own "see ADR-N" column usually names it). Rows belonging to no theme (env, fixtures) get a descriptively named sibling, not `bugs.md`/`misc.md`. A `##`-prefixed line inside a fenced block counts as a heading here, so a doc full of shell examples reads slightly long.
   - **Bytes grew from accumulated cruft:** Condense and continue.

3. **Find what to delete:** Identify `## Investigation` or narrative-only sections (primary bloat sources). Scan for duplication across the whole set with `grep -rl` on 2–3 critical phrases — a per-file pass is blind to cross-file cases. Within a file: phrases in >2 sections, or Bugs Fixed rows whose bug ID also appears in Critical Gotchas. Across files: Bugs Fixed rows explained fully in the index *and* fully in their owning `decisions/*.md` — collapse the index side to a pointer.

4. **Row-existence pass:** For every row in Critical Gotchas and Key Technical Decisions, apply the keep-test ("would losing this cause incorrect action?") and **delete** (not shorten) rows that fail it. On a doc with 20+ rows, expect to delete some. This is separate from sentence compression and must happen first. If no rows delete, the pass was likely skipped.

5. **Execute and measure:** Most condensing is an `Edit` job (section rewrites, row deletions). Count BOTH lines and bytes before and after (`wc -lc`) for every file in the SET. Report per-file deltas plus the set total. Also report row count: gotcha/decision rows before, after, and how many were deliberately deleted. A pass skipping step 4 produces the same tidy byte delta as one that ran it, so row arithmetic is the signal; a set of deletions that doesn't reconcile against the byte delta indicates the row-existence pass got skipped. (📖 `../_shared/references/two-tier-condense.md` for write-mode choice and diff-baseline rules.)

6. **After all writes land, run the duplication check again** (`grep -rl` from step 3). Section-by-section editing can reintroduce the same fact across files. The per-file diff is blind by construction to that case; only a set-wide grep catches it. Confirm each file's last line is real content (`tail -c 40 <file>`).

7. **Target: ≤300 lines** for an indexed doc with full bug history, measured on a split index with the `## Next Steps` section subtracted — open actionables stay in the index and don't count against its budget:

   ```bash
   total=$(wc -l < <file>)
   ns=$(grep -n '^## Next Steps' <file> | head -1 | cut -d: -f1)
   [ -z "$ns" ] && echo "$total" || {
     nxt=$(grep -n '^## ' <file> | cut -d: -f1 | while read -r n; do [ "$n" -gt "$ns" ] && { echo "$n"; break; }; done)
     [ -z "$nxt" ] && nxt=$((total + 1))
     echo $(( total - (nxt - ns) ))
   }
   ```

   This subtracts the span of that one section, so sections after it still count — Next Steps is often mid-file, not last. A doc over budget by live backlog alone has passed; report it with the backlog's size rather than routing actionables out to buy lines. Being under budget doesn't mean skipping step 4. Check sentence length directly: `awk '{print length, NR}' <file> | sort -rn | head -15`. Tighten paragraphs running 500+ characters of stacked parentheticals. Bytes-per-line >120–150, or sections >4KB each (Files, Task Status, Bugs Fixed), signal a second pass.
   - **Still >300 lines after condensing, excess is MADR blocks:** Split Key Technical Decisions into `decisions/<theme>.md` (📖 `task-summary/references/templates.md`). Report both the condensed delta and the split.

8. **Read `task-summary/references/templates.md`** for canonical section headings, table column names, and field order.

---

## Section-by-Section Rules

📖 **`references/section-rules.md`** — per-section cut/keep rules (LLM-CONTEXT, Quick Start, Bugs Fixed, Critical Gotchas, Key Technical Decisions, Last Session, Next Steps, Investigation sections, Files, Task Status). Open the row for the section you are editing.

---

## Additional Guidance

- **A restructure fork goes through `AskUserQuestion`, not inline prose** — condensing needs no permission, but choosing between preserving-vs-deleting or between competing structures changes what the doc BECOMES. Ask it as options at the point it arises. An answer naming a constraint governs the whole run.
