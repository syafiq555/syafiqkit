# Process Details — Refresh Instructions

Full guidance on scope, verification, protection, and Syafiqkit conventions.

## Why load Skill(haiku) three times, not once

The skill body loads once per invocation and never re-attaches. Its "Writing the prompt" section is what stops a prompt arriving closed — and that section only helps while it is in front. By the third prompt, you're recalling the rule rather than reading it, and recall drops the clause that applied.

Measured 2026-09-14: a Pass 2 prompt said "a row-existence and density pass, not demolition" and zero of 57 rows were deleted (against the skill's own expectation of some deletions). Pass 3 said "do not condense" (which forbids both moves the skill names as carrying most of the work). Both used `haiku` from memory after reading it at the session start. Load before each prompt instead. The repeat may answer "already loaded" (2026-10-07), so after the first load, open `../haiku/SKILL.md` at `## Writing the prompt` before writing the next prompt.

## Task doc sets

A task doc's unit is `current.md` **plus its `decisions/*.md` siblings** — one document split across files. When refreshing "the task doc", always measure and refresh the whole set, never just one.

`ls -lc current.md decisions/*.md` shows density per file. The index typically gets refreshed by passing sessions and stays tidy; siblings grow unattended. Narrowing to the index catches the wrong end — the real work is in the siblings, which is why a refresh that only touched `current.md` reported "not done" despite measurable improvement there. Sequential passes across siblings are safe: each dispatch re-reads its own file, so stale-copy risk doesn't justify narrowing. Run the sequence per file (siblings in parallel), or name upfront which file you're scoping to and why.

The set's total is not a budget for condense: `condense-task-doc`'s size thresholds apply to the index's line count and to each decisions file's ~40 KB, and source-capture files are exempt from condensing for size, and a verbatim copy, or one a script or version diff reads at its path, is exempt from splitting too: it gets a generated outline instead, which no pass edits, so regenerate that outline rather than editing it. When a doc index is ≤300 lines but a 14-ADR set totals 408, the split needs to fire inside the dispatch, not as work invented after the user notices the file is still large. Name the threshold (≤300 lines, bytes grown from new ADRs) in the Pass 2 prompt as a number to check.

## Target-set incidents {#target-set-incidents}

- **CLAUDE.md unit** (20/11/2026): a set of six CLAUDE files left 15 companions out until the user asked "Is the all claude.md includes all companions too or not ?", then answered "all companions treated as claude.md too".
- **Source captures** (16/11/2026): a BRS task doc's twelve capture siblings were dropped from scope and its condense pass skipped because "it would reword the captures"; the user pointed out condense already handles captures.
- **Provenance churn** (12/11/2026): on a 35-file set, Pass 3 restored provenance notes in most scaffold files that Pass 2 had cut, because the condense prompt never said provenance was evidence.
- **Body against description** (2026-10-27): an unhobble pass made `condense-task-doc`'s body put a split behind being asked, while its description says an oversized MADR is split; no byte, pointer or anchor check saw it.
- **Pre-condense snapshot** (17/11/2026): split files copied into the pre-condense folder overwrote the one baseline Pass 3 needed.
- **Skill unit** (15/11/2026): a bare refresh took two task docs and skipped the skills the session had rewritten; the user asked why, then widened it to "all the design skills". A silent exclusion reads as a missed file.

## Protecting facts when building the list

A protection list distinguishes which parts of the file are facts (teachable only by this file) from constraints (derivable from context). Both matter; the distinction changes how to hand it to the agent.

**Facts stay named by consequence.** A fact that only the file teaches — "MySQL in Docker uses `DB_HOST=127.0.0.1`, not `localhost`" — survives the pass by name with its cost attached: "remove this and future sessions fail on TCP vs socket." That is what makes blanket protection safe — a loss has a checkable cost.

**Constraints become reasoning.** A rule added to prevent a past mistake — "never edit generated files" — is a constraint. A reader would derive it; the rule exists because one time someone didn't and learned hard. Protect it by that narrative ("the 2026-09-03 auto-generated file re-edit incident"), not by form ("keep all `⚠️` callouts").

**Two things earn blanket protection: cross-file contracts.** `{#anchor}`s and `📖` pointers are named by other files and disappear silently if lost. Both are machine-checkable, which makes blanket protection safe. Everything else goes named.

⚠️ **When dispatching `unhobble-instructions`, don't protect a content CLASS by form.** `"keep every `**Tell:**`", "preserve all `⚠️` callouts"` protects form, not meaning — and `unhobble-instructions` judges whether each rule earns its shape. A form-based clause deletes the deliverable and prevents disagreement, since a claim about syntax cannot be refuted the way code judgment can. Say what the class is FOR and let the agent judge members. The measured case (2026-09-11): a pass protected `⚠️` callouts and removed the rule that house style applies to any CLAUDE.md the skill touches, reporting it redundant with the file's own opening (it wasn't — that is summary prose and a mode table).

## Verification and patching cycles

**Verify by re-measuring boundaries, never by counting what survived.** A pass claiming "no edits warranted" is a real possible verdict and also the cheapest fail-state. Re-take any count its reasoning rests on. A pass claiming changes but not naming whether anything became principle or left the hot path has only reworded — structure did not move. Numbers that survive a change can still be quietly wrong: an identifier survives while the claim around it flipped, or bytes fell while line count hid it.

**Verifying a pass and patching it are two separate acts.** A snapshot between them records your fix without the next agent seeing it mid-flight. The steps read as one cycle — verify, snapshot, dispatch — so a patch made in between feels like part of the verified state. It isn't: the next agent re-reads the file, and if it opened the target before your patch landed, it works from the pre-patch copy and silently reverts you while reporting honestly against its own baseline.

So make the next prompt carry the evidence instead of your memory. After any patch, put post-patch counts into the next dispatch's prompt as numbers the agent must check before editing (`"this file has 18 gotcha lines and 8 Related paths; if you see fewer, stop and report rather than proceeding"`). The prompt is something you write anyway, so the check rides on work already happening rather than discretionary re-read — and moves the catch to the party who can still see the mismatch.

Carry forward the same protected-fact list across all three prompts. Build it once before Pass 1 by reading the target; don't rebuild per pass. A fact that survives Pass 1 reworded needs the same protection in Pass 2's prompt even though its wording changed.

## A target that holds credentials {#credential-targets}

A machine-local companion or `CLAUDE.local.md` often carries passwords, API keys and test logins inline. Every pass reads it whole, and any line you print to check a pass (a `git diff`, a `grep`, a section dump) puts a secret into the transcript. So:

- **Each pass's prompt** says: keep every secret byte-identical and edit around it, never quote one in the report or in tool output, read with the Read tool and never grep for one.
- **Read for meaning from a masked copy.** Write one with a script that masks tokens mixing letter classes and digits, whatever follows `password`/`key`/`secret`/`token`, and every backticked table cell in the file (a login table's password column carries no keyword, and an all-letter passphrase or all-digit PIN mixes no classes), then read that copy rather than the target. The mask over-matches (quoted phrases, camel-case names). That costs nothing, because it only hides words from you.
- **Check secret survival by token set, not by reading.** Every token the mask hid in the original is a candidate. After each pass, print only how many candidates are missing and their original line numbers. Then inspect each miss with its value hidden (first three characters, length, and the words before it; under 12 characters, the words before it only, since a prefix of a short secret is most of it). Measured 17/11/2026: of 150 candidates, 14 went missing after the condense pass, and all 14 were mask false positives (quoted phrases), which the hidden-value view showed without printing a secret.
- **The masked reference is evidence until the last writer is done.** `/done`'s simplifier and reviewer write after Pass 3, so keep the masked copy and the check script until they return. Then delete every snapshot holding secrets, including any backup an agent made on its own (📖 `../../haiku/references/verifying.md` § Surplus writes). Deleting them at the end of Pass 3 left the post-simplifier state unchecked (17/11/2026).

- **A reorganization never carries a credential out of a gitignored folder.** A split or move of a credential file lands in the same gitignored folder (`.claude-companions/local/`), and a moved paragraph is checked for secrets before it goes anywhere tracked.

## Reorganization checks (step 6b) {#reorganization-checks}

A move can make a rule unreachable as easily as it saves bytes, and no prose test catches that, so each move passes two checks before it lands:

1. **A rule moves into a folder's `CLAUDE.md` only if every task that applies it touches that folder.** A rule that also fires from the repo root (a push, a test run, a question answered without opening a file) stays where it loads, or leaves a pointer there.
2. **A rule leaving an always-loaded file leaves a 📖 pointer that names the moment it applies** ("before running or checking anything in the app, or answering where to log in"), so reachability can be grepped and a session asking the question in its own words still finds it.

Report each move with its loading effect ("root drops 2 KB; loads when work touches `resources/js`"), which also makes a no-op reorganization visibly empty.

## When to pause between passes — the real case

Legitimate pauses are rare. Invoking this skill authorised the whole sequence, so the only pause is a failed verification — and saying "verification failed, I'm patching" is a different question from "should I continue with the next pass?" When verification passes clean, that's evidence the pass worked well and therefore reason to continue, not cause for re-asking.

The tempting pause-points are checkpoints where a reader might choose differently on second thought (after seeing actual counts, after reading what Pass 1 produced). That is re-litigation: the user chose three passes when they invoked the skill, and a clean result with real numbers in hand is the moment that choice looks most solid, which is precisely why it *doesn't* warrant re-asking. The decision is already made; the numbers are confirmation.

The same holds for extraction, and this file settles it: a condense pass may move content to named destinations by default. A per-run prompt names the destinations and the cross-file contract (anchors, pointers) it will check afterwards, never a ban, and asking the user hands back a decision already made.

## File-type specifics: When Pass 1 has no owning skill

Where no skill owns restructure (a README, runbook or design doc; a CLAUDE.md companion is not one, since `update-claude-docs` rewrite owns it and its anchor, house-style and pointer rules are the companion's contract), restructure against the document's own contract (what a reader opens it to answer), never a template borrowed from a different file type.

A README reshaped into a task doc is a worse file than the one you started with, and the pass reports success either way. Where the target resembles a PRD or architecture doc, 📖 `../setup-project-docs/references/standard-shapes.md` is the shape authority (arc42, C4, PR/FAQ, Shape Up); otherwise, the ordering question is the one Pass 3 asks anyway — does each rule sit where the reader is when it applies.

**On a task-doc set, decide each file's shape before writing its Pass 1 prompt:** index or theme file, and a theme file that is really a feature. Hand a `decisions/*.md` agent the conform-to-template brief alone and it applies the `current.md` Full Template because that is the only template it finds. It moves sections into an order the theme file never needed. Instead, name the target shape in the prompt — `templates.md#theme-file` or the Full Template — and say the template's order is the order it should have. A theme file already carrying Overview, Files, Bugs Fixed, or Next Steps gets no Pass 1. Report it as a candidate to graduate into its own feature folder and let the user decide. Name the target shape in Pass 2 and Pass 3 prompts too, since `unhobble-instructions` otherwise reads restructuring as its licence to rename and drop sections.

## Syafiqkit conventions

When editing this skill: read 📖 `../update-plugin`, which owns ownership checks (never edit a consumer-side install), shared-mechanism searches (never assume a fix is single-file), and version bump + CHANGELOG entry. For a third-party file, none of it applies.

All dispatch mechanics are already in `syafiqkit:haiku`'s body. This file only says which three skills, in which order, on which file type. Changes to the sequence itself live here; changes to how haiku works live there.
