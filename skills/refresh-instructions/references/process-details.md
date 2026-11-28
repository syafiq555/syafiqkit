# Process Details — Refresh Instructions

Full guidance on scope, verification, protection, and Syafiqkit conventions.

## Why load Skill(haiku) three times, not once

The skill body loads once per invocation and never re-attaches, so by the third prompt the rule is recalled rather than read, and recall drops the clause that applied.

Measured 2026-09-14: a Pass 2 prompt said "a row-existence and density pass, not demolition" and zero of 57 rows were deleted; Pass 3 said "do not condense". Both used `haiku` from memory. Load before each prompt. A repeat may answer "already loaded" (2026-10-07), so open `../haiku/SKILL.md` at `## Writing the prompt` instead.

## Task doc sets

A task doc's unit is `current.md` **plus its `decisions/*.md` siblings**, one document split across files. When refreshing "the task doc", always measure and refresh the whole set, never just one.

`ls -lc current.md decisions/*.md` shows density per file. The index gets refreshed by passing sessions and stays tidy; siblings grow unattended and hold the real work (a refresh that only touched `current.md` reported "not done" despite measurable improvement). Sequential passes across siblings are safe, since each dispatch re-reads its own file. Run per file (siblings in parallel), or name the scoped file and why.

The set's total is not a condense budget: `condense-task-doc`'s thresholds apply to the index's line count and each decisions file's ~40 KB. Source captures are exempt from condensing for size; a verbatim copy, or one a script or version diff reads at its path, is exempt from splitting too and gets a generated outline, which no pass edits (regenerate it). A ≤300-line index can sit beside a 408-line, 14-ADR set, so name the threshold (≤300 lines, bytes grown from new ADRs) in the Pass 2 prompt as a number to check, and let the split fire inside the dispatch.

## Target-set incidents {#target-set-incidents}

- **Vendored skills** (28/11/2026): two vendored skills (`taste` and `emil-design-eng`) were first left out of a refresh as "vendored". The user answered: "outside sources not necessarily written well also right ? It should be fine as long we can somehow reconcile when want to update". Both were then refreshed, with a pristine `upstream/SKILL.upstream.md` kept beside each.
- **CLAUDE.md unit** (20/11/2026): a six-file CLAUDE set left 15 companions out until the user asked "Is the all claude.md includes all companions too or not ?", then answered "all companions treated as claude.md too"; the companions are CLAUDE.md in their own right.
- **Source captures** (16/11/2026): a task doc's twelve capture siblings were dropped and its condense skipped ("it would reword the captures"); condense already handles captures.
- **Provenance churn** (12/11/2026): on a 35-file set, Pass 3 restored provenance notes in most scaffold files that Pass 2 had cut, because the condense prompt never said provenance was evidence.
- **Body against description** (2026-10-27): an unhobble pass made `condense-task-doc`'s body require asking before a split its description says is automatic; no byte, pointer or anchor check saw it.
- **Pre-condense snapshot** (17/11/2026): split files copied into the pre-condense folder overwrote the one baseline Pass 3 needed.
- **Skill unit** (15/11/2026): a bare refresh took two task docs and skipped the skills the session had rewritten, and the user asked why, then widened it to "all the design skills". A silent exclusion reads as a missed file.
- **Bare refresh read as the working directory** (15/11/2026): the working-directory reading alone refreshed one CLAUDE.md while a task doc flagged an hour earlier waited. A bare refresh at session end is usually that session's own cleanup; with nothing touched and no CLAUDE.md in the working directory, ask rather than climb to a parent (the parent-tree reading is the one that got reverted).

## Protecting facts when building the list

A protection list distinguishes which parts of the file are facts (teachable only by this file) from constraints (derivable from context). Both matter; the distinction changes how to hand it to the agent.

**Softened rules.** A hard rule beside a softer exception reads to an unhobble pass as a contradiction, and the pass softens the rule. Two incidents: on 2026-10-10 "Use `Edit` for all file changes" became "Prefer `Edit`" in a global `CLAUDE.md`; on 17/11/2026 a pass added "(a question with no real choice behind it is not one)" inside the decision-first sentence `judgement` quotes. The repair is to write an exception the file already states into the rule's own sentence, never to invent one.

**Facts stay named by consequence.** A fact that only the file teaches, such as "MySQL in Docker uses `DB_HOST=127.0.0.1`, not `localhost`", survives the pass by name with its cost attached: "remove this and future sessions fail on TCP vs socket." That is what makes blanket protection safe — a loss has a checkable cost.

**Constraints become reasoning.** A rule added to prevent a past mistake, "never edit generated files", is a constraint. A reader would derive it; the rule exists because one time someone didn't and learned hard. Protect it by that narrative ("the 2026-09-03 auto-generated file re-edit incident"), not by form ("keep all `⚠️` callouts").

**Two things earn blanket protection: cross-file contracts.** `{#anchor}`s and `📖` pointers are named by other files and disappear silently if lost. Both are machine-checkable, which makes blanket protection safe. Everything else goes named.

**When dispatching `unhobble-instructions`, don't protect a content CLASS by form.** Clauses like "keep every `**Tell:**`" or "preserve all `⚠️` callouts" protect form, not meaning, and `unhobble-instructions` judges whether each rule earns its shape. Say what the class is FOR and let the agent judge members. Measured 2026-09-11: a pass protected `⚠️` callouts and removed the house-style rule for any CLAUDE.md the skill touches, calling it redundant with the file's opening (it was not: that opening is summary prose and a mode table).

## Measuring table padding {#table-padding}

Measure a padded table before judging its density: the padding is spaces set by the widest cell, and no rewording shrinks it. Measure with `sed -n '<table lines>p' f | wc -c` against the same output piped through `tr -s ' -'`; the difference is padding. Pass 1 then turns the table into bullets and density is checked again (19/11/2026: 11 KB of a 44.5 KB file).

## Pass 1 that turned rows into decision blocks {#decision-block-pass-1}

Where Pass 1 turned rows into decision blocks, grep the added `**Rejected**` and `**Problem**` lines and find each one in the snapshot. A template-conform pass fills those fields from what a decision usually has, so a field with no source line is invented.

## Verification and patching cycles

**Verify by re-measuring boundaries, never by counting what survived.** Re-take any count a "no edits warranted" verdict rests on. A pass claiming changes but not whether anything became principle or left the hot path has only reworded. Numbers that survive can still be quietly wrong: an identifier survives while the claim around it flipped.

**Verifying a pass and patching it are separate acts.** A patch made between verify and dispatch feels like part of the verified state. The next agent may have opened the target before it landed, work from the pre-patch copy, and silently revert you while reporting honestly against its own baseline.

So carry the evidence in the next prompt, not in your memory: after any patch, put the post-patch counts in it as numbers the agent must check before editing (`"this file has 18 gotcha lines and 8 Related paths; if you see fewer, stop and report rather than proceeding"`).

Carry forward the same protected-fact list across all three prompts. Build it once before Pass 1 by reading the target; don't rebuild per pass. A fact that survives Pass 1 reworded needs the same protection in Pass 2's prompt even though its wording changed.

### Incidents behind the restore and sweep rules {#restore-sweep-incidents}

- **Restore without a destination check (04/11/2026):** a frontend `CLAUDE.md` went 38.7 to 41.7 KB when Pass 3 restored relocated text as lost, duplicating its companions.
- **Condense trims inside decision records (2026-10-10):** on two decisions files, Pass 3 restored 12 and 4 passages condense had cut.
- **Restore on a wrong "not there" (23/11/2026):** a Pass 3 agent restored an effort-level bullet into a global `CLAUDE.md` because "the companion did not hold it"; the companion held it word for word. A grep at the destination would have shown the hit.
- **Citation sweep (2026-10-15):** an index pass folded Quick Start steps 1 to 7 into 1 to 4, reported its one in-file reference as handled, and left a sibling decisions file citing "step 1.3".
- **An agent's "corrected" citation (23/11/2026):** a condense on a credential companion changed a symptom-router row to a heading that exists only in a sibling file and reported it as a fix; `/done`'s reviewer caught it.
- **Closed destinations (11/11/2026):** a CLAUDE.md condense ran beside its two companions' condenses, listing moved text for the caller to place, and nothing was lost.
- **Empty grep recorded as fact (2026-10-10):** one of five condense agents, given no verified facts, wrote "`party_capacity` is design-only" into a doc whose table and consumers both exist. A search that skipped `vendor/` or used a singular name for a plural table reads as absent. Hand every parallel agent the verified current-state facts, and grep each new absent, does-not-exist or design-only correction before the next pass builds on it.

## A target that holds credentials {#credential-targets}

A machine-local companion or `CLAUDE.local.md` often carries passwords, API keys and test logins inline. Every pass reads it whole, and any line you print to check a pass (a `git diff`, a `grep`, a section dump) puts a secret into the transcript. So:

- **Each pass's prompt** says: keep every secret byte-identical and edit around it, never quote one in the report or in tool output, read with the Read tool and never grep for one.
- **Use `../scripts/seccheck.py`**: `save` before Pass 1, `mask` for a copy to read, and `check` after each pass across the file and every gitignored destination it moved text into, with each tracked file the pass touched listed after `--tracked`, so a secret that moved somewhere git would publish fails. A candidate already in a tracked file's committed copy (a backticked CLI flag, a common phrase) is counted, not flagged, so only a NEW appearance fails (before 21/11/2026 those generic matches swamped the report). Its saved `.json` holds the raw secrets: keep it in a `chmod 700` folder and delete it with the other snapshots.
- **Read for meaning from a masked copy.** The script masks tokens mixing letter classes and digits, whatever follows `password`/`key`/`secret`/`token`, and every backticked table cell in the file (a login table's password column carries no keyword, and an all-letter passphrase or all-digit PIN mixes no classes), then read that copy rather than the target. The mask over-matches (quoted phrases, camel-case names). That costs nothing, because it only hides words from you.
- **Check secret survival by token set, not by reading.** Every token the mask hid in the original is a candidate. After each pass, print only how many candidates are missing and their original line numbers. Then inspect each miss with its value hidden (first three characters, length, and the words before it; under 12 characters, the words before it only, since a prefix of a short secret is most of it). Measured 17/11/2026: of 150 candidates, 14 went missing after the condense pass, and all 14 were mask false positives (quoted phrases), which the hidden-value view showed without printing a secret.
- **The masked reference is evidence until the last writer is done.** `/done`'s simplifier and reviewer write after Pass 3, so keep the masked copy and the check script until they return. Then delete every snapshot holding secrets, including any backup an agent made on its own (📖 `../../haiku/references/verifying.md` § Surplus writes). Deleting them at the end of Pass 3 left the post-simplifier state unchecked (17/11/2026), and again on 23/11/2026, when `/done` had to re-save a baseline from the current files; the reminder now sits at SKILL.md's Report step.

- **A reorganization never carries a credential out of a gitignored folder.** A split or move of a credential file lands in the same gitignored folder (`.claude-companions/local/`), and a moved paragraph is checked for secrets before it goes anywhere tracked.

## Reorganization checks (step 6b) {#reorganization-checks}

A move can make a rule unreachable as easily as it saves bytes, and no prose test catches that, so each move passes two checks before it lands:

1. **A rule moves into a folder's `CLAUDE.md` only if every task that applies it touches that folder.** A rule that also fires from the repo root (a push, a test run, a question answered without opening a file) stays where it loads, or leaves a pointer there.
2. **A rule leaving an always-loaded file leaves a 📖 pointer that names the moment it applies** ("before running or checking anything in the app, or answering where to log in"), so reachability can be grepped and a session asking the question in its own words still finds it.

Report each move with its loading effect ("root drops 2 KB; loads when work touches `resources/js`"), which also makes a no-op reorganization visibly empty.

## A manager per unit {#manager-per-unit}

A set of a dozen or more units (22/11/2026: 20 docs) is too much for one context to verify pass by pass, so each unit gets one manager agent (`sonnet`, named in the call) that loads this skill and dispatches its own `haiku` passes. The caller keeps one shared brief file on disk and a queue file, so each dispatch prompt is a few lines naming the unit and the brief, and a wave resumes after a slot frees. Cap the managers so managers plus their pass agents stay under the harness's 20, and tell each manager how many pass agents it may run at once.

A manager reads its own judgement as an exit: in that run, 3 of the first 6 hand-edited an over-budget file, called it "already tight" or "risk higher than gain", skipped the passes and the fresh reviewer, and reported done. The brief carries, in so many words:

- a file over budget is never too tight to skip; a hand edit does not replace a pass;
- if the `Agent` tool is unavailable, say so in the first line and stop, rather than doing the passes by hand;
- the between-pass reviewer is a fresh agent, not the manager's own read;
- both budgets the reader's dashboard checks (for a task doc: about 300 lines for `current.md` and about 40 KB per `decisions/` file), since a unit cut under one can still end over the other (two units ended at 317 and 301 lines);
- the Edit-only rule and the banned git verbs. One manager still rewrote with `head`/`sed`, so for any shell-touched file, check that every removed line is in its destination before accepting it.

The cross-file citation sweep and every commit stay with the caller.

## When to pause between passes — the real case

The only legitimate pause is a failed verification. Saying "verification failed, I'm patching" is different from asking "should I continue with the next pass?" A clean verification is evidence the pass worked, so it is a reason to continue, not to re-ask.

The tempting pause-points are checkpoints where a reader might choose differently on second thought, after seeing counts or Pass 1's output. That is re-litigation: the user chose three passes when invoking the skill, and a clean result is the moment that choice looks most solid. The numbers confirm the decision; they do not reopen it.

The same holds for extraction, and this file settles it: a condense pass may move content to named destinations by default. A per-run prompt names the destinations and the cross-file contract (anchors, pointers) it will check afterwards, never a ban, and asking the user hands back a decision already made.

## File-type specifics: When Pass 1 has no owning skill

Where no skill owns restructure (a README, runbook or design doc; a CLAUDE.md companion is not one, since `update-claude-docs` rewrite owns it and its anchor, house-style and pointer rules are the companion's contract), restructure against the document's own contract (what a reader opens it to answer), never a template borrowed from a different file type.

A README reshaped into a task doc is a worse file than the one you started with, and the pass reports success either way. Where the target resembles a PRD or architecture doc, 📖 `../setup-project-docs/references/standard-shapes.md` is the shape authority (arc42, C4, PR/FAQ, Shape Up); otherwise, the ordering question is the one Pass 3 asks anyway: does each rule sit where the reader is when it applies.

**On a task-doc set, decide each file's shape before writing its Pass 1 prompt:** index or theme file, and a theme file that is really a feature. Hand a `decisions/*.md` agent the conform-to-template brief alone and it applies the `current.md` Full Template, the only template it finds, moving sections into an order the theme file never needed. Name the target shape in the prompt (`templates.md#theme-file` or the Full Template) and say the template's order is the order it should have. A theme file already carrying Overview, Files, Bugs Fixed, or Next Steps gets no Pass 1; report it as a candidate to graduate into its own feature folder and let the user decide. Name the target shape in Pass 2 and Pass 3 prompts too, since `unhobble-instructions` otherwise reads restructuring as its licence to rename and drop sections.

## Syafiqkit conventions

When editing this skill: read 📖 `../update-plugin`, which owns ownership checks (never edit a consumer-side install), shared-mechanism searches (never assume a fix is single-file), and version bump + CHANGELOG entry. For a third-party file, none of it applies.

All dispatch mechanics are already in `syafiqkit:haiku`'s body. This file only says which three skills, in which order, on which file type. Changes to the sequence itself live here; changes to how haiku works live there.
