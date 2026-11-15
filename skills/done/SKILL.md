---
name: done
description: Post-task cleanup - simplify code, review changes, design-review anything a person sees that the diff changed (uiux's one combined review, carrying its impeccable and taste modules' checks), update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize", "wrap up with the design skills", "done with a design review".
---

# Post-Task Workflow

Run the steps in one turn. Naming a remaining step instead of invoking it is a pause; the only legitimate one is waiting for agents in Step 1.

**User args**: If the user passed instructions with `/done`, address those FIRST. They override the defaults. Record what you did in the **User args** row of the Output's Session table; omit the row if no args were passed.

**The contract.** A long session usually compacts before `/done`, and only this skill's opening survives that. You owe six rows: Simplify · Review · Product · Knowledge · Task docs · Plugin, plus Design whenever the diff changes something a person sees. Each row claims a step ran: an agent dispatched with the right kind of prompt, or a skill invoked *and confirmed to have changed something on disk*. Invoking is not updating. A row you cannot substantiate is a skipped step: go run it rather than writing `✅`.
Re-read this file whenever its body is no longer in view (after a compaction, after agents return, after an interrupted turn). Recalled steps read as `✅` without having run.

## Mode selection (decide first)

Read `git status --short` and recent commits, then match a mode.

| Mode | When | Step 1 runs | Verification |
|------|------|------------|--------------|
| **Full** (default) | Multi-file features, multi-domain work, or anything with external inputs | Three agents + partition | Agent reports |
| **Docs-only** | Diff is entirely markdown (task docs, CLAUDE.md, SKILL.md, commands/, agents/, references/, a `docs/` project set) | Reviewers + simplifiers per the count table below, + referential-integrity check. Product reviewer only when the markdown is itself what people use (see Step 1) | Agent reports + pointer resolution, anchor uniqueness, link validity, no wedged table rows |
| **Infra-only** | Entirely configuration code (CI, Dockerfile, nginx/env config, provisioning scripts); no application code | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |
| **Ops-only** | System changes applied out-of-band (deploy, backfill, config flip); no repo diff, no commit | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |

**Docs-only:** Count changed files from `git show --stat <this-session's commit>` plus the uncommitted diff, since agent review covers both. If the diff touches `docs/ARCHITECTURE*.md`, open each cited `file:line` and re-derive any count it states. 📖 `${CLAUDE_SKILL_DIR}/references/docs-only-mode.md` for why and the method.

⚠️ **The referential-integrity check is this mode's addition: when a sweep flags many pointers, suspect the extractor first.** Resolve a known-good and a known-bad pointer before trusting a run.

**Ambiguous signal:** Empty `git status --short` means work already committed, another writer's tree, or no changes. No changes skips Step 1 only: Steps 3 to 5 scan the conversation, not the diff, so a session that only read an email or meeting notes still owes them. **Tell: your Output reads "nothing to wrap up" and Steps 3 and 4 were never invoked.** When git errors, run **full mode** with substitutes per 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/verifying-a-write-landed.md`.

## Step 1: Simplify + Review + Product Review (parallel)

- **Simplifier**: is the code *clean*? (duplication, readability, consistency)
- **Reviewer**: is the code *correct*? (bugs, security, logic errors, conventions)
- **Product reviewer**: is the *feature* complete and valuable? (missing journeys, dead ends, UX and business gaps, what a line-level diff cannot catch). Runs in full mode, and in docs-only mode when the markdown is the product (what ships to users and steers their sessions), not notes about one project. A file kind settles the mode, not whether anyone reads it: ask who reads the output before skipping. 📖 `${CLAUDE_SKILL_DIR}/references/docs-only-mode.md` § Product reviewer scope.
- **Design review**: does the changed *screen* read well for its reader at every width? Runs whenever the diff touches something a person sees (screens, templates, components, stylesheets, emails, decks, rendered documents). Invoke `uiux` once, fresh, in the batch with the agents. It runs one combined review with one score, carrying every module's checks (detector, inspector, lint, its two isolated reviewers). Running a module's script from a shell or an agent is evidence, not the review. The Output's Design row gives that score, the review's method, whether `taste`'s passes and caps were applied, and each check as run or "not run: <reason>", so a skipped check shows. Fix or ask its findings like any reviewer's. The product reviewer judges journeys and rules; a code or product pass that "covers UX" does not stand in for this row. 📖 `${CLAUDE_SKILL_DIR}/references/design-review.md` for decks, rendered documents, emails and a UI diff with no spec. **Tell: your diff has a `.css`, template or screen file and no Design row.**

### Ownership & Partition

Judge file ownership by diff *content*: the harness auto-stages your own writes like a peer's. An untracked file has no `git diff HEAD`, and after a compaction "files I remember editing" is the summary's list, not the tree's. So before granting a write partition, run `ListAgents` and ask any live peer about each file you would hand out. Strike files a peer has released, and build the commit list from paths you wrote, never from `git status` minus folders you think are a peer's. 📖 `${CLAUDE_SKILL_DIR}/references/owner-and-partition.md` for the decision process, contested files and § Ownership Incidents.

**Ban these verbs in every agent prompt: `stash`, `checkout -- .`, `reset`, `clean`, `restore`, `commit`, `push`.** A file partition scopes reads, never git commands: one agent reaching for a clean baseline collides with your uncommitted work or a peer's, so naming the verbs is the guard. A report-only brief names generator scripts as writes too; tell it to use their check mode or a scratch path.

**One agent per file for writes, and you are in the partition too.** Simplifier and reviewer both carry `Edit`, so a shared list races them. Overlapping reads are fine; overlapping writes are not, since the post-fan-out re-read cannot see transient diagnostics. Re-read a granted file before each of your own edits (📖 `${CLAUDE_SKILL_DIR}/references/owner-and-partition.md` § Edits Against a Partitioned File).
**Multi-repo sessions:** Partition by repo first. Count changed files per repo (📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`) and sum for agent scaling. Mark the *other* repo's paths out of bounds in every brief.

### Agents to run

**Check for project agents first** by globbing `.claude/agents/code-simplifier.md`, `.claude/agents/code-reviewer.md` and `.claude/agents/product-reviewer.md`.

| Agent | When found | Type to dispatch |
|-------|-----------|------------------|
| Simplifier | Project file exists | `"code-simplifier"` or fallback `"code-simplifier:code-simplifier"` |
| Reviewer | Project file exists | `"code-reviewer"` or fallback `"feature-dev:code-reviewer"` |
| Product reviewer (full mode, or docs-only where the markdown is the product) | Project or user-level agent exists | `"product-reviewer"` or skip if absent |

**Project agents written this session won't register in time.** 📖 `${CLAUDE_SKILL_DIR}/references/project-agent-dispatch.md` for the timing gap, the workaround and how to note it in the Output.

**A UI diff with no Playwright spec is a finding** (`setup-playwright`): runtime behaviour is a spec's job.

Subagents run in the background, so a `<task-notification>` says an agent finished, not what it found. An agent spawned with `name:` must be told to report via `SendMessage`, or its findings are silently absent.

### Agent Count & Prompting

Count changed files using the variants in 📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`, then scale **per role**:

| Changed files | Reviewers | Simplifiers | Product | TOTAL |
|---|---|---|---|---|
| ≤30 | 1 | 1 | 1 | **3** |
| 31–80 | 2 | 2 | 1 | **5** |
| 81+ | 3 (cap) | 3 (cap) | 1 | **7** |

**Name the band before the batch.** The 81+ band is seven agents, not three, since each agent reviews only what it is handed. **Tell: you are about to emit a batch without having named which band the file count put you in.** 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` for partitioning, how to brief each agent (the calls it is unsure of, what it verified, what it did not check) and the count rationale.

**Now dispatch.** Your first token is an `Agent` call, not a sentence about `Agent` calls. Send every agent in ONE message so they run concurrently. Anything about partitioning goes in a message *before* the batch, never in a sentence sharing it. **Tell: you are writing a sentence and the next thing after it is an `Agent` call.**
**While they run:** work the verification agenda below. Don't preview changes in parallel, since that destroys the check that makes delegation safe. When the agenda is done, **end the turn**: the harness re-invokes you when agents finish, and polling buys nothing. **Tell: your previous identical call returned nothing new and you have no other work queued.** 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/explore-delegation.md` § The Waiting Game

**After all agents complete:** re-read `git rev-parse HEAD` and `git status -sb`, since an agent that committed or pushed shifts every later check, and re-read this file's remaining steps.

Reconcile agents against each other and the work: each sees one repo, domain or layer, so a universal "clean" verdict proves little. Read 📖 `${CLAUDE_SKILL_DIR}/references/agent-blind-spots.md` for the nine blindness patterns and how to settle contradictions.

Cross-agent findings are applied *after* both return, by you or a fresh dispatch carrying the finding in its brief, never by messaging a running agent.

Product-reviewer questions go through one `AskUserQuestion` call before Step 4, so the task doc records answers, not open questions. Before asking, open the code each question's premise rests on. **Tell: an option repeats a reviewer's claim about behaviour and you have not opened the file that decides it.**

## Step 2: Clean up temp code

Scan the session for temporary artifacts (debug UI, logging, commented-out migration code) and remove them or ask before keeping. Skip if none found.

⚠️ **"Nothing depends on this" is a claim about consumers.** Grep the *data* the routine produces and open whatever renders it, not the entry point. **Tell: you are about to call something dead because you followed its entry point rather than its output.**

⚠️ **A component published to a design system has a second home.** The sync's own config decides what is mirrored, not the directory name. If mirrored, state the count in Output and offer the re-sync rather than running it, since publishing is the user's call. **Tell: your diff touched a component directory and you have not checked whether anything republishes it.** 📖 `${CLAUDE_SKILL_DIR}/references/agent-blind-spots.md` § Step 2 Consumer Checks for the reasoning and the seeder and mirror incidents.

## Steps 3 + 4: Capture Knowledge + Update Task Docs (sequential: Step 3, then Step 4)

Run Step 3 before Step 4. Both skills scan the same conversation and decide routing (CLAUDE.md vs. task doc); in parallel, the same fact can land in both files or neither. `task-summary`'s rule that only broadly applying patterns go in CLAUDE.md relies on Step 3 having decided first.

**Step 3, Capture Session Knowledge:** Invoke `syafiqkit:update-claude-docs` bare, or with only a hint. Args that list only code facts silently drop the early-session behavioural insights, the highest-value captures. Do not draft CLAUDE.md entries here: a drafted summary reads complete and gets Step 4 skipped.

**Step 4, Update Task Docs:** Invoke `syafiqkit:task-summary` bare for a multi-domain scan; an explicit path misses related docs. If it already ran this session, invoke it scoped to what's NEW. A scoped invoke still counts as the step.

**Before leaving this step, measure what it wrote.** 📖 `${CLAUDE_SKILL_DIR}/references/task-doc-measurement.md` for the rules and the command. Over budget: run `condense-task-doc` in the same turn, or state in the Output that it was skipped.

## Step 5: Capture plugin learnings (optional, only if a gate fires)

Three gates. **Gate B** fires when this session wrote to `skills/**/*.md`, `commands/*.md` or `.claude/agents/*.md`, defect or no. **Gate A** fires on a real skill signal: something misfired, a step was wrong, you worked around an instruction. **Gate C** fires when the session built something inside a project that another project would reuse, and no skill or plugin tool carries it yet. Test: "would the next project have to rebuild this?" For each yes, recommend a skill (`skill-creator`), an extended skill, or a plugin MCP server where the reusable part is reaching an outside system, and ask in this step's `AskUserQuestion` before building, since a skill is hours of work and ships to every project. Examples: 📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` § Gate C Examples. **Tell: the session's most reusable artifact sits in a project folder, and your Plugin row says no gate fired.**

**Gate A is answered by recalling the session** (did a skill send you somewhere wrong, or did you correct or work around a step?), not by a status command: Gate B only shows the plugin tree changed, and reverting a bad edit erases that evidence.
Check the plugin tree with:
```bash
cd ~/.claude/plugins/syafiqkit && git status --short -- 'skills/**/*.md' 'commands/*.md' '.claude/agents/*.md'
```
Use `cd`, not `git -C` (which walks up to an enclosing repo). Any hit: check its mtime against session start; shared checkouts carry another session's work. 📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` for ownership and "replaced/routed/grew" meanings.

**Gate B re-fires on work already routed.** Ask what changed since the last `update-plugin` run: nothing new means the gate is satisfied. Check the CHANGELOG head too, since two bumps in one afternoon is a collision. 📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` § Gate Rationale.

Invoke `syafiqkit:update-plugin` once ownership is settled; it owns everything downstream (owner and consumer paths in the step5 reference's § Plugin Update).

## Exit Gate: Verify Steps Ran Before Writing Output

Confirm the WORK is done, not just this skill's steps: verify against the approved plan that every part was built; part-done means finish first.

**Code written after the Step 1 fan-out has had no review.** List the files changed since dispatch. More than a few one-line patches goes through a reviewer (and a product reviewer where a user sees the change). **Tell: your Review row lists fixes, and no agent was dispatched after they were written.**

⚠️ **A red test suite blocks the exit, whoever caused it.** A failure proved pre-existing is still a failure to fix in `/done`; a HEAD baseline tells you what to fix, never whether. Keep the full runner output, never a `tail`: the failure names are what a fix needs. **Tell: your Output says a test fails "on master too" and no row says it was fixed.** Verify each Output row before writing it. 📖 `${CLAUDE_SKILL_DIR}/references/exit-gate-rules.md` for the fix rule, fillability, verification and failed agents.

**Read the session from the top.** First, what would a reader need that exists only in this conversation (a plan in prose, a rule about what to stop doing, anything parked)? Grep the docs for that fact: a diff proves bytes moved, not that the right fact moved. Missing → back to Step 4. Second, is anything the user must decide placed first in the Output? Open questions go above the Summary; ✅ on a change with an open question is valid only if the question sits before it.

⚠️ **Interrupted turn.** If new work arrived from the user mid-`/done`, the wrap-up is the step most likely lost: the fix's own endpoint (green tests, a screenshot) reads as the conclusion. **Before writing Output, ask whether this turn was interrupted; if so, resume at the step you left and re-read this file.** 📖 `../_shared/references/one-turn-chain.md` for why a summary still evades the guards.

## Output

Lead with what the user has to decide; report what was built underneath it. Group by **what was built**, not by workflow step. 📖 `${CLAUDE_SKILL_DIR}/references/output-structure-rules.md` for structure, ordering and template.

**If the session ends with work deferred** (parked for room, an explicit "next session", or a visible compaction), offer a continuation prompt via `syafiqkit:continue-session` after the Summary, as one line. Judge by those visible signals, not an estimate of remaining context.

**Quick rules:**
- One to four open questions: one `AskUserQuestion` call. Five or more: `## Decisions` as well. If the session's brief was to finish everything, ask before wrapping up and build the answers. Don't park them in the task doc (📖 `../_shared/references/decision-first-output.md` § Where it goes).
- Omit empty rows; never "N/A".
- One change = one `### [Change]` + `### Session`. A change with only ✅ still gets its heading.
- Multi-repo: name the repo and branch per change (the reader's next act is committing). Name where one repo's work is inert without the other.
- Words the user still has to send are restated in full in Output, never pointed at (📖 `${CLAUDE_SKILL_DIR}/references/output-structure-rules.md` § Handoff Words).

**Output template:**

```
## Decisions

1️⃣ [what's true now]
   [the question]

(five or more open questions only; up to four go through one AskUserQuestion call)

## /done Summary

### [Change 1 name]
| Step | Result |
| Review | [issues + fixes, or ✅] |
| Simplify | [changes, or ✅] |
| Product | [✅ or → question] |
| Design | uiux: [screens and widths graded] · method [dual-agent / design review only / degraded] · score [N/M (P%)] · taste passes + caps [applied, caps held: none / which] · checks [detector, inspector, lint, taste-web checker: each run, or "not run: <reason>"] · [top findings + fixes]; omit the row only when nothing a person sees changed |
| Cleanup | [removed, or omit] |
| Test | [command/steps, or omit] |

### Session
| Step | Result |
| Knowledge | [N entries → files] |
| Task docs | [path → summary] |
| Plugin | [files + bump or issue URL] (omit if Step 5 didn't fire) |
| User args | [actions taken] (omit if none) |
```
