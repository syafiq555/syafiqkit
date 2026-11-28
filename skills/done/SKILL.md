---
name: done
description: Post-task cleanup - simplify code, review changes, design-review any screen the diff changed (uiux grading plus impeccable critique, and taste on customer-facing pages), update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize", "wrap up with the design skills", "done with a design review".
---

# Post-Task Workflow

Run the steps in one turn. Naming a remaining step instead of invoking it is a pause; the only legitimate one is waiting for agents in Step 1.

**User args**: address any instructions passed with `/done` FIRST; they override the defaults and go in the **User args** row of the Output's Session table (omitted when none).

**The contract.** A long session usually compacts before `/done`, and only this skill's opening survives that. You owe six rows: Simplify · Review · Product · Knowledge · Task docs · Plugin, plus Design whenever the diff changes something a person sees, and Motion always ("no motion in diff" when the session added none, rendered or not). Each row claims a step ran: an agent dispatched, or a skill invoked *and confirmed to have changed something on disk*. A row you cannot substantiate is a skipped step: run it rather than writing `✅`.
Re-read this file whenever its body has left view (after a compaction, agents returning, or an interrupted turn). Recalled steps read as `✅` without having run.

**"Has /done run?" is answered by git, not memory, whoever asks** (the user, a button, a peer session's broadcast offering "reply done already"). Find the commit this skill's last Output covered and list code commits after it (`git log --oneline <that-sha>..HEAD -- <code paths>`): any you wrote means run it now, and the reply is the run, not "done already". A session that wrote nothing (fresh, or after `/clear`), or args naming the last release ("then /ship, last posted 1.488.0"), scopes the run to every commit since that release that no `/done` Output covered, whoever wrote it: where a push is the ship, a peer's unreviewed push has already gone out (27/11/2026: six versions went out that way, and an empty-session run reported nothing to review). A small follow-up feels covered by the wrap-up before it, and the wrap-up never saw it. **Tell: you are about to reply "done already" and have not listed the commits since the last /done Output.**

## Mode selection (decide first)

Read `git status --short` and recent commits, then match a mode.

| Mode | When | Step 1 runs | Verification |
|------|------|------------|--------------|
| **Full** (default) | Multi-file features, multi-domain work, or anything with external inputs | Three agents + partition | Agent reports |
| **Docs-only** | Diff is entirely markdown (task docs, CLAUDE.md, SKILL.md, commands/, agents/, references/, `docs/`) | Reviewers + simplifiers per the count table, + referential-integrity check; product reviewer per Step 1 | Agent reports + pointer resolution, anchor uniqueness, link validity, no wedged table rows |
| **Infra-only** | Configuration code only (CI, Dockerfile, nginx/env, provisioning scripts), no application code | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |
| **Ops-only** | Out-of-band system changes (deploy, backfill, config flip); no repo diff or commit | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |

**Docs-only:** count changed files from `git show --stat <this-session's commit>` plus the uncommitted diff. ⚠️ **Referential integrity is this mode's addition: when a sweep flags many pointers, suspect the extractor first.** 📖 `${CLAUDE_SKILL_DIR}/references/docs-only-mode.md` (when the diff touches `docs/ARCHITECTURE*.md`, the counts it states get re-derived; method, § Referential integrity).

**Ambiguous signal:** an empty `git status --short` skips Step 1 unless commits need review, and the Design review still runs for anything this session built outside the repo (a clip, deck or file). A session that wrote nothing, or whose args name a release, reviews every commit since that release that no `/done` Output covers (📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md` § Work Already Committed). Steps 3 to 5 always run, since they scan the conversation: an email- or notes-only session still owes them. **Tell: your Output reads "nothing to wrap up" and Steps 3 and 4 were never invoked.** When git errors, run **full mode** with substitutes per 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/verifying-a-write-landed.md`.

## Step 1: Simplify + Review + Product Review (parallel)

- **Simplifier**: is the code *clean*? (duplication, readability, consistency)
- **Reviewer**: is the code *correct*? (bugs, security, logic errors, conventions)
- **Product reviewer**: is the *feature* complete and valuable (missing journeys, dead ends, UX and business gaps a diff cannot catch)? Full mode; docs-only only when the markdown is the product, so ask who reads it first (📖 `${CLAUDE_SKILL_DIR}/references/docs-only-mode.md` § Product reviewer scope).
- **Design review**: does the changed *screen* read well for its reader at every width? Runs whenever the diff touches something a person sees, or this session built one outside the repo (listed from the session, not git). `uiux`, `impeccable` and `taste`'s review path (for customer screens) start in one batch, and the Output's Design row names all three. Findings merge into one score and are **fixed in this step**, except one that changes who can do or see something or a direction the user picked. Open every capture; deliver before and after with `SendUserFile` when the reader may be on a phone. 📖 `${CLAUDE_SKILL_DIR}/references/design-review-merge.md` (re-read § Merge before the Design row). **Tell: your diff has a `.css`, template or screen file and no Design row.**
- **Motion review**: is the motion *right*? Decided by the added lines of `git diff HEAD` and this session's commits, never by rendering, so an empty tree never skips it. On any motion hit, invoke `emil-review-animations` with those files in the same batch; a Design row "not run" never skips it. 📖 `${CLAUDE_SKILL_DIR}/references/design-review-merge.md` § Dispatch.

### Ownership & Partition

Judge ownership by diff *content*, never by memory: before granting a partition, run `ListAgents`, ask any live peer about each file, and build the commit list from paths you wrote, not `git status` minus peers' folders. 📖 `${CLAUDE_SKILL_DIR}/references/owner-and-partition.md`.

**Ban these verbs in every agent prompt: `stash`, `checkout -- .`, `reset`, `clean`, `restore`, `commit`, `push`.** A file partition scopes reads, never git commands, so naming the verbs is the guard. **A partition never covers shared resources** (a test database, a dev server port): name ONE suite runner per batch, and tell every other agent to run nothing or only its own filtered files. 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` § Partitioning by Write Authority.

**One agent per file for writes, you included.** Simplifier and reviewer both carry `Edit`, so split their file lists or brief one report-only. Re-read a granted file before each of your own edits (📖 `${CLAUDE_SKILL_DIR}/references/owner-and-partition.md` § Edits Against a Partitioned File).

**Multi-repo sessions:** partition by repo first (📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md` counts each repo; sum them for agent scaling), and mark the *other* repo's paths out of bounds in every brief.

### Agents to run

**Check for project agents first** by globbing `.claude/agents/` for the three types in the table below.

| Agent | Type to dispatch |
|-------|------------------|
| Simplifier | `"code-simplifier"` or fallback `"code-simplifier:code-simplifier"` |
| Reviewer | `"code-reviewer"` or fallback `"feature-dev:code-reviewer"` |
| Product reviewer (full, or docs-only if the markdown is the product) | `"product-reviewer"` or skip if absent (project or user-level) |

**Project agents written this session won't register in time** (📖 `${CLAUDE_SKILL_DIR}/references/project-agent-dispatch.md`: workaround and Output note).

**A UI diff with no Playwright spec is a finding** (`setup-playwright`): runtime behaviour belongs to a spec.

A `<task-notification>` says an agent finished, not what it found. An agent spawned with `name:` must report via `SendMessage`, or its findings are silently absent.

### Agent Count & Prompting

Count changed files using the variants in 📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`, then scale **per role**:

| Changed files | Reviewers | Simplifiers | Product | TOTAL |
|---|---|---|---|---|
| ≤30 | 1 | 1 | 1 | **3** |
| 31–80 | 2 | 2 | 1 | **5** |
| 81+ | 3 (cap) | 3 (cap) | 1 | **7** |

**Name the band before the batch.** The 81+ band is seven agents, not three. **Tell: you are about to emit a batch without naming the band your file count put you in.** 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` (partitioning, briefing, count rationale).

**Now dispatch.** Your first token is an `Agent` call. Send every agent in one message to run them concurrently. Partitioning goes in a message *before* the batch, never in a sentence sharing it. **Tell: you are writing a sentence and the next thing after it is an `Agent` call.**

**While they run:** work Steps 2 to 5 below; don't preview changes in parallel, which destroys the check that makes delegation safe. Then **end the turn**; the harness re-invokes you. **Tell: your previous identical call returned nothing new and you have no other work queued.** 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/explore-delegation.md` § The Waiting Game

**After all agents complete:** re-read `git rev-parse HEAD` and `git status -sb` (an agent that committed or pushed shifts every later check) and the remaining steps. Save each `Memory notes` line a no-`Write` reviewer returned before Step 3 (📖 `${CLAUDE_SKILL_DIR}/references/project-agent-dispatch.md`).

Reconcile agents against each other: each sees one repo, domain or layer, so a universal "clean" proves little (📖 `${CLAUDE_SKILL_DIR}/references/agent-blind-spots.md`).

Cross-agent findings are applied *after* both return, by you or a fresh dispatch carrying the finding, never by messaging a running agent.

Every reviewer question for the user, including a code reviewer line saying "a decision to confirm" however low it ranks, goes through one `AskUserQuestion` call before Step 4, so the task doc records answers, not open questions. Open the code each premise rests on first, and research product-behaviour questions (one `haiku` agent per product-behaviour question; quotes from the spec, a live product or a guidance page per option) before asking. Screen-state questions are the Design step's `uiux` call and are not asked, unless the answer changes who can do or see something or what a customer is promised (📖 `${CLAUDE_SKILL_DIR}/references/reviewer-questions.md`). **Tell: an option repeats a reviewer's behaviour claim and you have not opened the file that decides it, a behaviour option carries no quote, or an option reuses a sibling's rule without naming who set it.**

## Step 2: Clean up temp code

Remove temporary artifacts (debug UI, logging, commented-out migration code) or ask before keeping.

**"Nothing depends on this" is a claim about consumers.** Grep the *data* the routine produces, not its entry point. **Tell: you called something dead by following its entry point, not its output.**

**A component published to a design system has a second home.** Its sync config, not its directory name, decides what is mirrored; state the count in Output and offer the re-sync rather than running it. **Tell: your diff touched a component directory and you have not checked whether anything republishes it.** 📖 `${CLAUDE_SKILL_DIR}/references/agent-blind-spots.md` § Step 2 Consumer Checks.

## Steps 3 + 4: Capture Knowledge + Update Task Docs (sequential: Step 3, then Step 4)

Run Step 3 before Step 4: in parallel, a fact may land in both docs or neither.

**Step 3, Capture Session Knowledge:** Invoke `syafiqkit:update-claude-docs` bare, or with only a hint. Args listing only code facts drop the early-session behavioural insights. Do not draft CLAUDE.md entries here: a drafted summary reads complete and gets Step 4 skipped.

**Step 4, Update Task Docs:** Invoke `syafiqkit:task-summary` bare for a multi-domain scan (an explicit path misses related docs); if it already ran, a scoped invoke to what's NEW still counts. **A builder's or agent's doc edits are not `task-summary` having run**, so the invoke stays bare unless it already ran this session, and its args never say the agents' doc work is complete (📖 `${CLAUDE_SKILL_DIR}/references/step4-task-doc-invocation.md`). **Tell: your Step 4 args contain "already wrote", "already updated" or "scoped to what's new" and `task-summary` has not run earlier in this session.**

**Before leaving this step, measure what it wrote.** 📖 `${CLAUDE_SKILL_DIR}/references/task-doc-measurement.md` for the rules and the command. Over budget: run `condense-task-doc` in the same turn, or say in the Output it was skipped.

## Step 5: Capture plugin learnings (every run answers all three gates)

**Gate A first, from the transcript, not a command.** List every skill this session invoked and every user correction or redirect (a step the user added or had to run by hand counts); each one a skill owns is a signal for `update-plugin` (📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` § Gate A). **Tell: your Step 5 evidence is a status command's output.**

**Gate B** fires when this session wrote anywhere in the plugin tree (skills, commands, agents, `tools/`, `hooks/`), defect or no. **Gate A** fires on a real skill signal: a misfire, a wrong step, a workaround. **Gate C** fires when a project build would be reused elsewhere and no skill or plugin tool carries it yet (test: "would the next project have to rebuild this?"). For each yes, recommend a skill (`skill-creator`), an extended skill, or a plugin MCP server where the reusable part reaches an outside system, and ask in this step's `AskUserQuestion` before building: a skill ships everywhere. Examples: 📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` § Gate C Examples. **Tell: the session's most reusable artifact sits in a project folder, and your Plugin row says no gate fired.**

For Gate B, run the status and log from the plugin checkout (`cd ~/.claude/plugins/syafiqkit`), never `git -C`, which walks up to an enclosing repo. Committed work counts; settle ownership by mtime and `git diff HEAD -- <file>` (📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` § Gate B, with the commands). For each surviving file say replaced, routed or grew (§ Reporting Gate Findings). **Gate B re-fires on work already routed:** nothing new since the last `update-plugin` run means satisfied (§ Gate Rationale). Once ownership is settled, invoke `syafiqkit:update-plugin`, which owns everything downstream (owner and consumer paths: § Plugin Update).

## Exit Gate: Verify Steps Ran Before Writing Output

Confirm the WORK is done against the approved plan, not just this skill's steps: part-done means finish first.

**List the files changed since dispatch.** Code written after the Step 1 fan-out has had no review, so it goes to a reviewer (and a product reviewer where a user sees the change). Only a few one-line patches may skip it, and the Review row says so (design fixes excepted: `design-review-merge.md` § Fixes Wait for the Code Agents). **Tell: your Review row lists fixes, and no agent was dispatched after they were written.**

⚠️ **A red test suite blocks the exit, whoever caused it.** A HEAD baseline tells you what to fix, never whether: a pre-existing failure is still yours to fix. **Tell: your Output says a test fails "on master too" and no row says it was fixed.** Verify each Output row before writing it, and keep the full runner output, never a `tail` (a fix needs the failure names) (📖 `${CLAUDE_SKILL_DIR}/references/exit-gate-rules.md` § Red Suites).

**Steps a CLAUDE.md adds to `/done` bind this run too.** This file never names them: grep the loaded instructions for `/done` before the Output and do each one (📖 `${CLAUDE_SKILL_DIR}/references/exit-gate-rules.md` § Steps a CLAUDE.md Adds to /done). **Tell: your Output offers to update something a CLAUDE.md told `/done` to update.**

**Read the session from the top.** Is anything a reader needs only in this conversation (a plan in prose, a rule to stop doing, anything parked)? Grep the docs for it: a diff proves bytes moved, not that the right fact moved. Missing → back to Step 4. Open questions go above the Summary (📖 `${CLAUDE_SKILL_DIR}/references/output-structure-rules.md`).

⚠️ **Interrupted turn.** Work the user sent mid-`/done` makes the wrap-up the step most likely lost. **Before writing Output, ask whether this turn was interrupted; if so, resume at the step you left and re-read this file.** 📖 `../_shared/references/one-turn-chain.md`.

## Output

Lead with what the user has to decide; report what was built underneath it, grouped by **what was built**, not by workflow step (📖 `${CLAUDE_SKILL_DIR}/references/output-structure-rules.md`).

**If work is deferred** (parked, an explicit "next session", or a visible compaction), offer `syafiqkit:continue-session` after the Summary, as one line, judged by those signals, not a guess at what's left.

**Quick rules:**
- One to four open questions: one `AskUserQuestion` call; five or more add `## Decisions`. If the brief was to finish everything, ask before wrapping up. Don't park questions in the task doc (📖 `../_shared/references/decision-first-output.md` § Where it goes).
- Omit empty rows; never "N/A". The Plugin row is the exception: it always states its three gates.
- Every table keeps its `|------|--------|` line under the header. Without it, the phone app and Remote Control show raw pipes instead of a table. A cell holds plain text with no `<br>`, which those views print literally. A row with several points gets one short line in its cell, and the points go as bullets under that table (28/11/2026: a Summary with no separator line and `<br>` lists arrived on the phone as pipe-and-tag soup).
- One change = one `### [Change]` + `### Session`. A change with only ✅ still gets its heading.
- Multi-repo: name the repo and branch per change (the reader's next act is committing), and where one repo's work is inert without the other.
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
|------|--------|
| Review | [issues + fixes, or ✅] |
| Simplify | [changes, or ✅] |
| Product | [✅ or → question] |
| Design | score [before → after, N/M merged] · check-render: [FAIL count before → after, or "not run: <reason>"] · uiux: [screens and widths graded] · words: [strings cut or restructured, consequences kept, or "no copy on screen"] · impeccable: [critique findings + fixes] · taste: [review-path findings, or "not run: <reason>"] · changed: [finding → fix, top items] · before/after shown: [yes, or why not]; omit the row only when nothing a person sees changed |
| Motion | [`emil-review-animations` verdict, findings + fixes, or "no motion in diff"]; never omitted, even when Design is not run |
| Cleanup | [removed, or omit] |
| Test | [command/steps, or omit] |

### Session
| Step | Result |
|------|--------|
| Knowledge | [N entries → files] |
| Task docs | [path → summary] |
| Plugin | A: [signals → update-plugin, or "none" naming the invocations and corrections checked] · B: [plugin tree writes or none] · C: [reusable artifact or none] · [files + bump or issue URL]; never omitted |
| User args | [actions taken] (omit if none) |
```
