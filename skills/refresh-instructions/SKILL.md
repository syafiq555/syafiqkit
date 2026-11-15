---
name: refresh-instructions
description: Run a full three-pass refresh on any living doc (a CLAUDE.md, task doc, skill or agent file and its references, project docs set, README, runbook, design doc, or spec sibling) by dispatching restructure, condense, and unhobble-instructions in sequence on `haiku`, each verified before the next. For a task doc the target is the SET: current.md plus its decisions/*.md siblings.
---

# Refresh Instructions

Three passes, same file, one after another: **restructure** → **condense** → **unhobble**. Each answers a different question. Condense works on correctly-ordered content; unhobble works on tight prose instead of fighting structure and density at once.

This skill sequences the three; all mechanics live in `syafiqkit:haiku` (snapshot, verify, patch discipline).

## Should you run all three passes?

**Start here.** The decision bounds the work that follows.

| Condition | Action |
|---|---|
| File is already well-structured AND tight | Run only `unhobble-instructions` |
| File is bloated OR misordered | Run all three |
| File is structured but density unknown | Check bytes per line (`wc -c` ÷ `wc -l`): above roughly 120–150 is dense, so run condense |
| File is over its size budget | Bloated, however tidy. `condense-claude-md` owns the number for CLAUDE.md and CLAUDE.local.md alike; its landing figure sits below its trigger ceiling. Quote the landing figure in the condense prompt, not a range: a range written near the ceiling reads as permission to stop there, and the file is back over within days. A SKILL.md's budget is the 5,000-token re-attach limit, counted with a tokenizer after the last pass (command in 📖 `../update-plugin/references/harness-constraints.md`); a byte target derived from it passed `done` at 5,026 tokens (2026-10-27). **Before Pass 1, judge whether a split suits the file**: sections serving different readers, or a distance from the landing figure that condensing alone won't close. If so, split inside this refresh, by `condense-claude-md`'s split rule, not after Pass 3 (14/11/2026: a 46 KB companion ran three passes to 41 KB and the user asked why; the split was knowable from the first read) |

**Don't use "the invocation added work" or "it ran earlier" as reason to skip.** Check per-file tightness via `wc -l` and `wc -c`, independent of what invoked the skill or prior sessions.

⚠️ **On files without a template owner (README, runbook, design doc), "well-structured" means rules sit where readers need them, not a template shape borrowed from another file type.** Where the target resembles a PRD or architecture, 📖 `../setup-project-docs/references/standard-shapes.md` is authority. Decide its native shape before writing Pass 1's prompt and say the shape is already correct if restructure would have nothing to do.

## Pick the skills by file type

| Target | Pass 1 (restructure) | Pass 2 (condense) | Pass 3 (unhobble) |
|---|---|---|---|
| `CLAUDE.md` | `update-claude-docs` (rewrite) | `condense-claude-md` | `unhobble-instructions` |
| Task doc index (`current.md`) | `task-summary` (Full Template) | `condense-task-doc` | `unhobble-instructions` |
| Task doc theme file (`decisions/*.md`) | `task-summary` (theme-file shape per `templates.md#theme-file`) | `condense-task-doc` | `unhobble-instructions` |
| Project doc set (`docs/PRD.md`, `ARCHITECTURE.md`, `ARCHITECTURE-ESSENTIALS.md`) | `setup-project-docs` (update) | `condense-task-doc` | `unhobble-instructions` |
| CLAUDE.md companion (`.claude-companions/**/*.md`) | `update-claude-docs` (rewrite, symptom-router shape) | `condense-claude-md` | `unhobble-instructions` |
| Skill or agent file (`SKILL.md`, its `references/*.md`, a module entry file, `.claude/agents/*.md`) | restructure by own shape (the steps a session walks first; rare branches to `references/` with a pointer) | `condense-claude-md` | `unhobble-instructions` |
| Any other living doc (README, runbook, spec sibling) | restructure by own shape | `condense-task-doc` | `unhobble-instructions` |

**`condense-task-doc` on the bottom two rows is deliberate.** Its keep-test is facts-based, not file-type-based — would losing this cause a future session to act incorrectly. 📖 `../condense-task-doc/` for how it handles spec siblings and section-rule lookups that degrade on docs without templated headings.

## Process

1. **Resolve TARGET SET explicitly.** When the invocation names no path but its words name a set ("our claude.md sets"), resolve those words against the working directory, not the repo root. When it is bare (or as vague as "refresh the docs"), the target is first every living doc this session wrote or flagged, instruction files included (a task doc it updated, a skill, reference or agent file it edited, one `/done` reported over budget with its condense skipped), then the working directory's CLAUDE.md: a bare refresh at session end is usually that session's own cleanup (15/11/2026: the working-directory reading alone refreshed one CLAUDE.md while the task doc flagged an hour earlier waited). With nothing touched this session and no CLAUDE.md in the working directory, ask rather than climb to a parent: the parent-tree reading is the one that got reverted. Either way, state the set and why in one line before Pass 1, and say when it is a guess. A task doc's unit is `current.md` plus its `decisions/*.md` siblings, one document split across files; `ls -lc current.md decisions/*.md` shows which siblings exist and their density. ⚠️ **Siblings grow unattended while every passing session refreshes the index, so they hold the density the refresh exists to fix.** A narrowed scope catches only the tidy file. Name the files in scope before Pass 1, explicit rather than discovered mid-pass. A skill's unit is likewise its `SKILL.md` plus the files it routes to (references, modules); a file a pass leaves out goes in that one line with its reason, since the user reads a silent exclusion as a missed file (15/11/2026: a bare refresh took two task docs and skipped the skills the session had rewritten; the user asked why, then widened it to "all the design skills"). A vendored file whose scripts cite it by step or rule number keeps that numbering through every pass.

2. **Snapshot** byte and line count before Pass 1. Probe git once (`git rev-parse --git-dir` and `git rev-parse HEAD`) — where either fails, use `wc`/`cmp` and mtime instead of `git diff` for verification. 📖 `../_shared/references/verifying-a-write-landed.md` holds the substitutes.

3. **Load `Skill(haiku)` before writing Pass 1's prompt.** Load it again before Pass 2, again before Pass 3. One invocation per pass; a repeat can answer "already loaded" and attach nothing, so then open `../haiku/SKILL.md` at `## Writing the prompt` before writing the prompt. A single prompt listing multiple skills has them overwrite each other. Each prompt needs:
   - Banned git verbs named: `commit`, `push`, `stash`, `reset`, `checkout -- .`, `clean`
   - Target file type and shape (e.g., "conform to Full Template" for a task doc index)
   - Protected facts as a list of NAMED INSTANCES with costs. A form-based class ("keep all `⚠️` lines") quantifies a pattern and cannot be tested; "the 2026-09-06 chunk-load incident, the only evidence this rule exists" names a thing. A rule the file records as failing from recall ("this rule does not fire from recall", "recurred") goes on the list by name too: an unhobble pass reads a hard rule beside a softer exception as a contradiction and softens it, when the right repair is to write the exception into the rule's own sentence (2026-10-10: "Use `Edit` for all file changes" became "Prefer `Edit`" in a global `CLAUDE.md`). **On a file over budget, an incident story is protected by its destination, not its location:** name where the full story may move, and condense keeps the rule plus one figure with a pointer. Lock in place only a sentence nothing else records and no rule line restates; otherwise the list cancels condense's main move (14/11/2026: about 20 locked stories held a pass at 41 KB). **List only facts you checked this session.** An unverified one goes in as a claim to check against the code, never as "keep as is": a false write-guard claim survived three passes that way.
   - A structural boundary for this pass: `condense-task-doc` measures row counts (deliberate deletions); `unhobble-instructions` names whether anything became a principle or left the hot path
   - From Pass 2 on, a sentence saying the target's uncommitted diff is the earlier pass's own output. Condense skills gate on a peer's uncommitted work, and an unexplained staged rewrite a few minutes old looks exactly like one: measured 04/11/2026, a `condense-claude-md` agent stopped on Pass 1's restructure and wrote nothing.
   - The current-state facts you verified, in every pass's prompt, Pass 1 included: a restructure rewrites status lines too (04/11/2026: a Pass 1 agent called a feature live on production "switched off")
   - For Pass 3 on a task-doc set, or any target whose Pass 2 moved content out, the file as it stood BEFORE Pass 2 and an instruction to restore from it any rejected alternative, quoted wording, measured figure or stated reason whose loss changes what a reader would conclude, unless a 📖 pointer's destination now holds it: relocated text read as lost puts the file back over budget (04/11/2026: a frontend `CLAUDE.md` went 38.7 to 41.7 KB, duplicating its companions). Condense trims inside decision records even though `condense-task-doc` says they are kept whole, and no check between the passes reads for it; measured 2026-10-10 on two decisions files, where Pass 3 restored 12 and 4 such passages.

4. **Dispatch Pass 1**, verify (byte/line diff, then read the whole file for meaning).

5. **Snapshot again**, load `Skill(haiku)` again before Pass 2's prompt.

6. **Dispatch Pass 2**, verify. A condense that stops above the landing figure because "the rest is protected" has found a defect in your prompt, not a floor: loosen the protection or run the split, re-dispatch the same skill, and only then go on. A hand-written prompt in its place drops that skill's rules.

7. **Snapshot again, load `Skill(haiku)` again** before Pass 3's prompt.

8. **Dispatch Pass 3**, verify.

9. **Report pass-by-pass**, not net diff — readers deciding whether to trust the result need to know what each pass moved.

**Stop between passes if verification fails.** A condense running on an unverified restructure compounds what restructure dropped. Patch or revert, then snapshot again before continuing.

**Encode counts in the prompt as a gate, for every list or table a condense pass may touch, and again after any patch between passes:** `"This file should have 18 gotchas and 8 related paths; if you see fewer, stop and report rather than proceeding."` This moves the verification catch from your memory to the agent who can still see the mismatch. A section protected by name ("may be tightened") has no count to fail, and bullets folded into a paragraph lose items while the report says nothing moved (06/11/2026: a condense folded the `taste` skill's 20 laws into five paragraphs, dropped about ten, and reported the section intact; only a hand diff found it). Where content may move out, the count spans this file plus the named destinations, so a relocated item counts as kept and the gate stops only a real loss.

**When one agent per file runs in parallel on a set, the cross-file citation sweep is yours, because no agent can do it.** An agent that renumbers a list or renames a heading sweeps its own file and reports it clean, while a sibling's agent cannot know the target moved. After every pass, grep the whole set for citation syntax (`step [0-9]`, `rule [0-9]`, `§ <heading>`), not the old labels, and check each hit still names what it meant (2026-10-15: an index pass folded Quick Start steps 1 to 7 into 1 to 4, reported its one in-file reference as handled, and left a sibling decisions file citing "step 1.3"). Extraction follows the same split: an agent may not write into a sibling another agent is editing in the same pass. Its prompt names those siblings as closed destinations and asks it to list the moved text verbatim in its report, for you to place after the pass (11/11/2026: a CLAUDE.md condense ran beside its two companions' condenses this way, and nothing was lost). The harness runs at most 20 subagents at once, so a larger set goes out in waves as slots free; keep the queue on disk, since a rejected dispatch is not retried for you.

**Tell each condense prompt whether provenance on a claim ("checked on Packagist", "proven by a probe file", "confirmed on the page") is process detail or evidence.** Condense reads it as verification narration and strips it; unhobble, restoring against the pre-Pass-2 copy, finds nothing else records it and puts it back, so both passes churn the same lines. A marker recording how a claim was verified is evidence the claim can be trusted; keep it unless another line carries the same check (12/11/2026: on a 35-file set, Pass 3 restored provenance notes in most scaffold files that Pass 2 had cut).

## Key Principles

**State scope explicitly.** Silent narrowing to a single file when the directory holds siblings, or a silent assumption about what a prompt may extract, lets rewording pass for structural work: bytes fall while line count hides that nothing moved. Name which files are in scope and where extracted text may land, and give the agent a decision rather than a silence to fill. **Never forbid extraction on a file over budget:** moving incidents out is `condense-claude-md`'s main lever, and a ban leaves it a floor it reports truthfully. Protect anchors and pointers by checking them after the pass, not by banning the move.

**Don't ask permission at checkpoints.** Invoking this skill authorises the whole sequence on the decision above. A verified pass is a reason to continue, not to re-ask. 📖 `references/process-details.md` § When to pause between passes — the real case.

**Verify structurally, not by counting survivors.** A pass claiming "no edits warranted" is a legitimate verdict AND the cheapest fail-state: re-take any number its reasoning rests on. A pass claiming changes but not whether anything became principle or left the hot path has only reworded; structure didn't move. A pass claiming extraction needs both sides verified: sources shrank, not only that the companion appeared. After Pass 3, read the rewritten body against the file's own frontmatter `description`, which no pass may edit: an unhobble pass reconciling two rules inside the body can make it contradict the description (2026-10-27: `condense-task-doc`'s body made a split conditional on being asked while its description says an oversized MADR is split), and no byte, pointer or anchor check sees it.

**On a target that makes claims about a codebase (agent memory, task docs), no pass checks whether a surviving claim is still true.** State words like "unfixed", "still missing", "in-flight" survive every pass unchanged. Put the reverse check in the condense prompt: re-check each open-state claim against the code, not only the ones being cut. A story moved to a task doc or companion carries its state words with it, and no pass visits that destination, so read each relocated open-state claim against the code yourself before reporting. ⚠️ That check manufactures the opposite error: an agent's empty grep becomes a dated "not in code" fact, in the agent's own vocabulary (a singular name for a plural table, a search that skipped `vendor/`). So hand every parallel agent the current-state facts you verified, not only the agent whose file needs them, and grep each new "absent / does not exist / design-only" correction before the next pass builds on it (2026-10-10: one of five condense agents, given no verified facts, wrote "`party_capacity` is design-only" into a doc whose table and consumers both exist).

📖 `references/process-details.md` — full detail on fact-vs-constraint judgment in protection lists, what "well-structured" means per file type, Syafiqkit conventions, version bumping, and why the haiku-loading rule appears where it does.
