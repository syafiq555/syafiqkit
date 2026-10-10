---
name: refresh-instructions
description: Run a full three-pass refresh on any living doc — a CLAUDE.md, task doc, project docs set, README, runbook, design doc, or spec sibling — by dispatching restructure, condense, and unhobble-instructions in sequence on `haiku`, each verified before the next. For a task doc the target is the SET: current.md plus its decisions/*.md siblings.
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

**Don't use "the invocation added work" or "it ran earlier" as reason to skip.** Check per-file tightness via `wc -l` and `wc -c`, independent of what invoked the skill or prior sessions.

⚠️ **On files without a template owner (README, runbook, design doc), "well-structured" means rules sit where readers need them, not a template shape borrowed from another file type.** Where the target resembles a PRD or architecture, 📖 `../setup-project-docs/references/standard-shapes.md` is authority. Decide its native shape before writing Pass 1's prompt and say the shape is already correct if restructure would have nothing to do.

## Pick the skills by file type

| Target | Pass 1 (restructure) | Pass 2 (condense) | Pass 3 (unhobble) |
|---|---|---|---|
| `CLAUDE.md` | `update-claude-docs` (rewrite) | `condense-claude-md` | `unhobble-instructions` |
| Task doc index (`current.md`) | `task-summary` (Full Template) | `condense-task-doc` | `unhobble-instructions` |
| Task doc theme file (`decisions/*.md`) | `task-summary` (theme-file shape per `templates.md#theme-file`) | `condense-task-doc` | `unhobble-instructions` |
| Project doc set (`docs/PRD.md`, `ARCHITECTURE.md`, `ARCHITECTURE-ESSENTIALS.md`) | `setup-project-docs` (update) | `condense-task-doc` | `unhobble-instructions` |
| CLAUDE.md companion (`.claude-companions/**/*.md`) | restructure by symptom (no owning skill) | `condense-claude-md` | `unhobble-instructions` |
| Any other living doc (README, runbook, spec sibling) | restructure by own shape | `condense-task-doc` | `unhobble-instructions` |

**`condense-task-doc` on the bottom two rows is deliberate.** Its keep-test is facts-based, not file-type-based — would losing this cause a future session to act incorrectly. 📖 `../condense-task-doc/` for how it handles spec siblings and section-rule lookups that degrade on docs without templated headings.

## Process

1. **Resolve TARGET SET explicitly.** When the invocation names no path, resolve it from the working directory — not the repo root or the set you last worked on — and where that directory holds no CLAUDE.md of its own, say in one line that the reading is a guess before Pass 1. A task doc's unit is `current.md` plus its `decisions/*.md` siblings, one document split across files. `ls -lc current.md decisions/*.md` shows which sibling files exist and their density. ⚠️ **Siblings grow unattended while the index gets refreshed by every passing session, so they hold the density the refresh exists to fix.** A narrowed scope catches only the tidy file. Name which files are in scope before Pass 1, explicit rather than discovered mid-pass.

2. **Snapshot** byte and line count before Pass 1. Probe git once (`git rev-parse --git-dir` and `git rev-parse HEAD`) — where either fails, use `wc`/`cmp` and mtime instead of `git diff` for verification. 📖 `../_shared/references/verifying-a-write-landed.md` holds the substitutes.

3. **Load `Skill(haiku)` before writing Pass 1's prompt.** Load it again before Pass 2, again before Pass 3. One invocation per pass; a repeat can answer "already loaded" and attach nothing, so then open `../haiku/SKILL.md` at `## Writing the prompt` before writing the prompt. A single prompt listing multiple skills has them overwrite each other. Each prompt needs:
   - Banned git verbs named: `commit`, `push`, `stash`, `reset`, `checkout -- .`, `clean`
   - Target file type and shape (e.g., "conform to Full Template" for a task doc index)
   - Protected facts as a list of NAMED INSTANCES with costs (not form-based classes like "keep all `⚠️` lines", but "the 2026-09-06 chunk-load incident because it's the only evidence this rule exists"). A rule the file itself records as failing from recall ("this rule does not fire from recall", "recurred") goes on this list by name too: an unhobble pass reads a hard rule next to a softer exception as a contradiction and softens it, when the right repair is to write the exception into the rule's own sentence. Measured 2026-10-10: "Use `Edit` for all file changes" became "Prefer `Edit`" in a global `CLAUDE.md`.
   - A structural boundary for this pass: `condense-task-doc` measures row counts (deliberate deletions); `unhobble-instructions` names whether anything became a principle or left the hot path
   - For Pass 3 on a task-doc set, the file as it stood BEFORE Pass 2 and an instruction to restore from it any rejected alternative, quoted wording, measured figure or stated reason whose loss changes what a reader would conclude. Condense trims inside decision records even though `condense-task-doc` says they are kept whole, and no check between the passes reads for it; measured 2026-10-10 on two decisions files, where Pass 3 restored 12 and 4 such passages.

4. **Dispatch Pass 1**, verify (byte/line diff, then read the whole file for meaning).

5. **Snapshot again**, load `Skill(haiku)` again before Pass 2's prompt.

6. **Dispatch Pass 2**, verify.

7. **Snapshot again, load `Skill(haiku)` again** before Pass 3's prompt.

8. **Dispatch Pass 3**, verify.

9. **Report pass-by-pass**, not net diff — readers deciding whether to trust the result need to know what each pass moved.

**Stop between passes if verification fails.** A condense running on an unverified restructure compounds what restructure dropped. Patch or revert, then snapshot again before continuing.

**After any patch between passes, encode the post-patch counts in the next prompt as a gate:** `"This file should have 18 gotchas and 8 related paths; if you see fewer, stop and report rather than proceeding."` This moves the verification catch from your memory to the agent who can still see the mismatch.

## Key Principles

**State scope explicitly.** Silent narrowing to a single file when the directory holds siblings, or a silent assumption about what a prompt may extract, lets rewording pass for structural work — bytes fall while line count hides that nothing moved. Name which files are in scope, whether extraction may go to a companion, or forbid it in every prompt. Either way, give the agent a decision rather than a silence to fill.

**Don't ask permission at checkpoints.** Invoking this skill authorises the whole sequence on the decision above. A verified pass is a reason to continue, not to re-ask. 📖 `references/process-details.md` § When to pause between passes — the real case.

**Verify structurally, not by counting survivors.** A pass claiming "no edits warranted" is a legitimate verdict AND the cheapest fail-state — re-take any number its reasoning rests on. A pass claiming changes but not whether anything became principle or left the hot path has only reworded; structure didn't move. A pass claiming extraction needs both sides verified: sources shrank, not only that the companion appeared.

**On a target that makes claims about a codebase (agent memory, task docs), no pass checks whether a surviving claim is still true.** State words like "unfixed", "still missing", "in-flight" survive every pass unchanged. Put the reverse check in the condense prompt: re-check each open-state claim against the code, not only the ones being cut. ⚠️ That check manufactures the opposite error: an agent's grep that comes back empty becomes a dated "not in code" fact in the doc, and its vocabulary is the agent's (a singular name for a plural table, a search that skipped `vendor/`). So hand every parallel agent the current-state facts you verified yourself, not just the agent whose file obviously needs them, and grep each new "absent / does not exist / design-only" correction before the next pass builds on it. Measured 2026-10-10: of five condense agents, the one given the verified facts got the status right, while one without them wrote "`party_capacity` is design-only" into a doc whose table and consumers both exist.

📖 `references/process-details.md` — full detail on fact-vs-constraint judgment in protection lists, what "well-structured" means per file type, Syafiqkit conventions, version bumping, and why the haiku-loading rule appears where it does.
