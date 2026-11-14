---
name: done
description: Post-task cleanup - simplify code, review changes, design-review any screen the diff changed (uiux grading plus impeccable critique, and taste on customer-facing pages), update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize", "wrap up with the design skills", "done with a design review".
---

# Post-Task Workflow

Run the steps in one turn. If you find yourself naming a remaining step rather than invoking it, that is a pause; the only legitimate one is waiting for agents in Step 1.

**User args**: If the user passed instructions with `/done` (e.g., "make sure this works for X"), address those FIRST before proceeding with the standard steps. The user's instructions override defaults. Record what you did about them in the **User args** row of the Output's Session table. If no args were passed, omit that row.

**The contract.** A long session usually compacts before reaching `/done`, and only this skill's opening survives that, so read it now rather than trusting that the steps below will still be in view. You owe six rows: Simplify · Review · Product · Knowledge · Task docs · Plugin, and a seventh, Design, whenever the diff changes something a person sees. Every row is a claim that a step actually ran: an agent you dispatched with the right kind of prompt, or a skill you invoked *and then confirmed changed something on disk*. Invoking is not updating. A row you cannot substantiate is a step you skipped, so go run it rather than writing `✅`. Then check that anything the user must decide is the first thing they read, not buried under a report.

Re-read this file whenever its body is no longer in view: after a compaction, after agents return (the body is not re-attached), or after an interrupted turn. Recalled steps read as `✅` without having run.

## Mode selection (decide first)

Read `git status --short` and recent commits, then match the session to a mode. Each mode runs different agents and verifies differently.

| Mode | When | Step 1 runs | Verification |
|------|------|------------|--------------|
| **Full** (default) | Multi-file features, multi-domain work, or anything with external inputs | Three agents + partition | Agent reports |
| **Docs-only** | Diff is entirely markdown (task docs, CLAUDE.md, SKILL.md, commands/, agents/, references/, a `docs/` project set) | Reviewers + simplifiers per the count table below, + referential-integrity check. Product reviewer only when the markdown is itself what people use (see Step 1) | Agent reports + pointer resolution, anchor uniqueness, link validity, no wedged table rows |
| **Infra-only** | Entirely configuration code (CI, Dockerfile, nginx/env config, provisioning scripts); no application code | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |
| **Ops-only** | System changes applied out-of-band (deploy, backfill, config flip); no repo diff, no commit | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |

**Docs-only:** Count changed files from `git show --stat <this-session's commit>` plus the uncommitted diff, since agent review covers both: code committed earlier this session was never reviewed. If the diff touches `docs/ARCHITECTURE*.md`, open each cited `file:line` and re-derive any count it states. Those are claims about the codebase, and a markdown-only diff gives a reviewer no reason to doubt them.

⚠️ **The referential-integrity check is the one this mode adds, and a hand-rolled sweep for it reports the corpus broken when the bug is in your extractor.** A defect that common would already have surfaced in a maintained corpus, so when a sweep flags many pointers, suspect the extractor first, and resolve a known-good and a known-bad pointer before trusting a run. 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/editing-skills-checklist.md` owns the method.

**Ambiguous signal:** Empty `git status --short` means work already committed, another writer's tree, or no changes at all. No changes at all skips Step 1 only: Steps 3 to 5 scan the conversation, not the diff, so a session that only read an email, a PDF or meeting notes still owes them, and its pasted or attached material is gone at `/clear`. **Tell: your Output reads "nothing to wrap up" and Steps 3 and 4 were never invoked.** When git errors (no repo, no first commit), run **full mode** with substitutes per 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/verifying-a-write-landed.md`.

## Step 1: Simplify + Review + Product Review (parallel)

The three roles see the diff through different lenses:
- **Simplifier**: is the code *clean*? (duplication, readability, consistency)
- **Reviewer**: is the code *correct*? (bugs, security, logic errors, conventions)
- **Product reviewer**: is the *feature* complete and valuable? (missing journeys, dead-end flows, UX and business gaps, the class of miss a line-level diff cannot catch). Runs in full mode, and in docs-only mode when the markdown is the product rather than notes about one: instructions or prompts for an assistant people talk to, a user guide, public docs, and a plugin's skills, commands and agent files, which ship to everyone who installs it and decide what their sessions do. Notes about a project (task docs, a project's own CLAUDE.md) skip it. A file kind settles the mode, not whether anyone uses what it says, so ask who reads the diff's output before skipping. Dispatch it only if a project or user-level `product-reviewer` agent is available; skip silently otherwise.
- **Design review**: does the changed *screen* read well for its reader at every width? Runs whenever the diff touches something a person sees: a page, screen, template, component, stylesheet, admin screen or email layout, and equally a slide deck or rendered document (a deck spec, a .pptx or Google Slides build, a PDF), graded from its rendered pages rather than at widths. On a deck, `impeccable`'s detector reads only web markup, so its critique runs the design review alone and says so; a render check for overflow is not this row (14/11/2026: a 31-slide deck passed every render check, and its owner then asked for the design skills because it looked generic). It is skills, not one agent, started in the same batch: invoke `uiux` fresh to grade (capture each changed screen at 375, 768 and 1280, open every capture, grade against its siblings), invoke `impeccable` `critique` on the changed screens (it runs its own two isolated reviewers), and on a screen a customer sees also `taste`'s review path. Their findings are fixed or asked before Output like any reviewer's. The product reviewer judges the journey and rules; this row judges what the reader sees, and a code or product pass that "covers UX" does not stand in for it. Measured 14/11/2026: a redesigned admin screen passed code and product review, and the user still had to ask twice for the design skills to run at wrap-up. **Tell: your diff has a `.css`, template or screen file and no Design row.**

### Ownership & Partition

Judge file ownership by diff *content*, since the harness auto-stages your own writes identically to a peer's. Read the diff before spawning agents. Two cases leave nothing to read. An untracked file has no `git diff HEAD`. And after a compaction, "files I remember editing" is the summary's list, written before any peer touched them. So before granting a write partition, run `ListAgents`, and ask any live peer in the same repo about each file you would hand out. A summary's file list is a claim about the past, not ownership now (09/11/2026: a simplifier rewrote two untracked files a peer had restructured that morning). The same goes for a file this session handed to a peer earlier ("it's free now"): your commit list still names it, so it slips into a partition and the agent edits the peer's work (12/11/2026, a one-line revert). Strike released files from the list before partitioning. The commit list follows the same rule: build it from the paths you wrote, never from `git status` minus the folders you think are a peer's, since an exclusion filter passes every peer file it didn't anticipate (12/11/2026: two CRP45 files rode into a marketplace commit and had to be backed out before push).

**Ban these verbs in every agent prompt: `stash`, `checkout -- .`, `reset`, `clean`, `restore`, `commit`, `push`.** A file partition scopes reads, never git commands: one agent reaching for a clean baseline collides with your uncommitted work or a peer's, so naming the verbs is the guard. A report-only brief also names the project's build and generator scripts as writes. An agent checking whether a generated file is stale will otherwise run the generator and rewrite it, so tell it to use the tool's check mode or a scratch path.

**One agent per file for writes, and you are in the partition too.** Simplifier and reviewer both carry `Edit`, so handing both the same list races them. Overlapping reads are fine; overlapping writes are not, because the post-fan-out re-read cannot see the transient diagnostics they leave. Your own edits count as well: a partition reads as a rule about *them*, but an `Edit` against remembered text still applies cleanly to a string that survived a rewrite while its paragraph moved. Hold your edits to a granted file until the agent returns, or re-read before each one.
**Multi-repo sessions:** Partition by repo first. Count changed files per repo (📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`) and sum for agent scaling. Mark the *other* repo's paths out of bounds: a partition listing paths reads as advisory once an agent notices a sibling file.

Read 📖 `${CLAUDE_SKILL_DIR}/references/owner-and-partition.md` for the ownership decision process and contested-file handling.

### Agents to run

**Check for project agents first** by globbing `.claude/agents/code-simplifier.md`, `.claude/agents/code-reviewer.md` and `.claude/agents/product-reviewer.md`.

| Agent | When found | Type to dispatch |
|-------|-----------|------------------|
| Simplifier | Project file exists | `"code-simplifier"` or fallback `"code-simplifier:code-simplifier"` |
| Reviewer | Project file exists | `"code-reviewer"` or fallback `"feature-dev:code-reviewer"` |
| Product reviewer (full mode, or docs-only where the markdown is the product) | Project or user-level agent exists | `"product-reviewer"` or skip if absent |

**Project agents written this session won't register in time.** Read 📖 `${CLAUDE_SKILL_DIR}/references/project-agent-dispatch.md` for the timing gap, the dispatch workaround, and how to note it in the Output.

**Runtime behaviour is a Playwright spec's job, not an agent's.** A UI diff with no spec covering it is a finding: write or extend the spec (`setup-playwright`) and run it, rather than reviewing the running app by eye.

Subagents run in the background by default, so what arrives is a `<task-notification>`: it says an agent finished, not what it found. An agent spawned with `name:` is an addressable teammate whose plain-text output never reaches you, so its prompt must tell it to report via `SendMessage`, or the findings are silently absent while every agent shows complete.

### Agent Count & Prompting

Count changed files using the variants in 📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`, then scale **per role**:

| Changed files | Reviewers | Simplifiers | Product | TOTAL |
|---|---|---|---|---|
| ≤30 | 1 | 1 | 1 | **3** |
| 31–80 | 2 | 2 | 1 | **5** |
| 81+ | 3 (cap) | 3 (cap) | 1 | **7** |

**Name the band before the batch.** The 81+ band is seven agents, not three, since each agent reviews only what it is handed. The table is inlined rather than behind a pointer; the reasoning is in 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` § Count Rationale and Dispatch History. **Tell: you are about to emit a batch without having named which band the file count put you in.**

Then read 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` for partitioning rules and how to brief each agent (the calls you are unsure of, what you verified, what you did not check).

**Now dispatch.** Your first token is an `Agent` call, not a sentence about `Agent` calls. Send every agent in ONE message so they run concurrently. Anything about partitioning goes in a message *before* the batch, never in a sentence sharing it. **Tell: you are writing a sentence and the next thing after it is an `Agent` call.** Failure record: 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` § Count Rationale and Dispatch History.

**While they run:** work the verification agenda below (agent blind spots, git re-reads, output structure). Don't preview changes in parallel, since that destroys the check that makes delegation safe. When the agenda is done, **end the turn**: the harness re-invokes you when agents finish, and polling buys nothing. **Tell: your previous identical call returned nothing new and you have no other work queued.** 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/explore-delegation.md` § The Waiting Game

**After all agents complete:** re-read `git rev-parse HEAD` and `git status -sb`, since an agent that committed or pushed shifts every later check, and re-read this file's remaining steps: the body is not re-attached when agents return, so a recalled step reads as `✅` without having run.

Reconcile agents against each other and the work. Agents have bounded visibility (one repo, one domain, one layer), so universal "clean" verdicts don't prove the codebase is clean. Read 📖 `${CLAUDE_SKILL_DIR}/references/agent-blind-spots.md` for the nine blindness patterns and how to settle contradictions.

Cross-agent findings (agent A's result needs a change in agent B's file) are applied *after* both return, by you or a fresh dispatch carrying the finding in its brief. Messaging a still-running agent reads as an out-of-brief instruction, and a well-built agent refuses it.

Product-reviewer questions go through one `AskUserQuestion` call before Step 4, so the task doc records answers, not open questions. Before asking, open the code each question's premise rests on: a reviewer's "this flow does X" comes from the files it happened to open. **Tell: an option repeats a reviewer's claim about behaviour and you have not opened the file that decides it.**

## Step 2: Clean up temp code

Scan the session for temporary artifacts (debug UI, logging, commented-out migration code) and remove them or ask before keeping. Skip if none found.

⚠️ **"Nothing depends on this" is a claim about consumers, and an entry point shows where a feature goes, not what it needs.** Stopping a seeder, fixture builder or setup routine is deleting it without the grep that deleting would prompt. Grep the *data* the routine produces and open whatever renders it, since the dependent is usually a page or job fetching those rows. **Tell: you are about to call something dead because you followed its entry point rather than its output.**

⚠️ **A component published to a design system has a second home.** If the repo mirrors components out (Claude Design, a Storybook deploy, a released package), the published copy keeps serving the old build and nothing errors. The sync's own config or manifest is the authority for what is mirrored, not the directory name. If mirrored, state the count in Output and offer the re-sync rather than running it, since publishing is the user's call. **Tell: your diff touched a component directory and you have not checked whether anything republishes it.**

## Steps 3 + 4: Capture Knowledge + Update Task Docs (sequential: Step 3, then Step 4)

Run Step 3 before Step 4. Both skills scan the same conversation and decide routing (CLAUDE.md vs. task doc). Run in parallel, the same fact can land in both files or neither. `task-summary`'s rule ("only patterns that apply broadly go in CLAUDE.md") depends on Step 3's decision already being made.

**Step 3, Capture Session Knowledge:** Invoke `syafiqkit:update-claude-docs` bare (no arg), or with only a hint. Pre-written args that list only code facts silently drop the early-session behavioural insights, which are the highest-value captures. Do not draft CLAUDE.md entries here: a summary drafted here reads complete and gets Step 4 skipped, so the next thing after the skill returns is task-summary, not a reply about what was written.

**Step 4, Update Task Docs:** Invoke `syafiqkit:task-summary` bare for a multi-domain scan. An explicit path skips the scan and misses related docs. If the skill already ran this session, invoke it scoped to only what's NEW. A scoped invoke still counts as running the step; skipping it does not.

**Before leaving this step, measure what it wrote.** Read 📖 `${CLAUDE_SKILL_DIR}/references/task-doc-measurement.md` for the three core rules and the measurement command. Over budget: run `condense-task-doc` in the same turn, or state in the Output that it was skipped.

## Step 5: Capture plugin learnings (optional, only if a gate fires)

Steps 3+4 write to the *project*; this writes to the *plugin*, a global artifact shared across every project.

Three gates. **Gate B** fires when this session wrote to `skills/**/*.md`, `commands/*.md` or `.claude/agents/*.md`, defect or no. **Gate A** fires on a real skill signal: something misfired, a step was wrong, you worked around an instruction. **Gate C** fires when the session built something inside a project that another project would reuse, and no skill or plugin tool carries it yet. Examples: a generator or checker whose logic names nothing project-specific, a multi-step procedure worked out by trial and error, or an API call hand-rolled with `curl` and a minted token. Answer it by asking "would the next project have to rebuild this?" For each yes, recommend creating a skill (`skill-creator`), extending an existing skill, or a new or extended plugin MCP server where the reusable part is reaching an outside system (an API, a Google file, a vendor portal; `gsheets-mcp` gained its export tools this way), and ask the user in this step's `AskUserQuestion` before building, since a skill is hours of work and ships to every project. **Tell: the session's most reusable artifact sits in a project folder, and your Plugin row says no gate fired.**

**Gate B only says the plugin tree changed, so it cannot tell you whether a skill misled you**, and reverting a bad edit erases the evidence it looks for. **Gate A is answered by recalling the session** (did a skill send you somewhere wrong, or did you correct or work around a step?), not by a status command.
Check the plugin tree with:
```bash
cd ~/.claude/plugins/syafiqkit && git status --short -- 'skills/**/*.md' 'commands/*.md' '.claude/agents/*.md'
```
Use `cd`, not `git -C`: the latter walks up to an enclosing repo. Any hit: check its mtime against session start, since shared checkouts carry another session's work. Read 📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` for ownership and "replaced/routed/grew" meanings.

**Gate B re-fires on work already routed.** Committed files stay in `git show --stat` for later `/done` runs. Ask what changed since the last `update-plugin` run: nothing new means the gate is satisfied, and a new signal means invoking scoped to it. Check the CHANGELOG head too, since two bumps in one afternoon is a collision.

Invoke `syafiqkit:update-plugin` once ownership is settled. It owns everything downstream (patch files + version + CHANGELOG for owner, or draft GitHub issue for consumer).

## Exit Gate — Verify Steps Ran Before Writing Output

Confirm the WORK is done, not just this skill's steps: verify against the approved plan that every part was built. Part-done means finish the work first.

**Code written after the Step 1 fan-out has had no review.** The agents saw the diff as it stood at dispatch. List the files changed since then. More than a few one-line patches goes through a reviewer (and a product reviewer where a user sees the change), scaled to that delta. **Tell: your Review row lists fixes, and no agent was dispatched after they were written.**

⚠️ **A red test suite blocks the exit, whoever caused it.** A failure proved pre-existing is still a failure to fix in `/done`. A HEAD baseline tells you what to fix, never whether. Fix the code when it's wrong, the test when it's stale or date- or order-dependent, and where the behaviour is a real product call, fix the test's determinism and record the question. Keep the full runner output, never a `tail`: the failure names are what a fix needs, and dropping them costs a whole re-run. **Tell: your Output says a test fails "on master too" and no row says it was fixed.** Verify each Output row before writing it. Read 📖 `${CLAUDE_SKILL_DIR}/references/exit-gate-rules.md` for fillability tests, verification methods and failed-agent handling.

**Read the session from the top, asking two things.** First, what would a reader need that exists only in this conversation (a plan in prose, a rule about what to stop doing, anything parked or waiting)? Grep the docs for that specific fact: a diff proves bytes moved, not that the right fact moved. Missing → back to Step 4. Second, is anything the user must decide placed first in the Output? Open questions go above the Summary, and ✅ on a change with an open question is valid only if the question sits before it. Six filled rows read as thorough, which makes skipping this check likelier. Structure that looks complete is not evidence a check ran.

⚠️ **Interrupted turn.** If new work arrived from the user mid-`/done`, the wrap-up is the step most likely lost, because fixing the request produces its own endpoint (green tests, a screenshot) that reads as the conclusion, and the steps still owed have scrolled out of view. **Before writing Output, ask whether this turn was interrupted; if so, resume at the step you left and re-read this file rather than recalling it.** 📖 `../_shared/references/one-turn-chain.md` for why an honest summary of the remaining step still evades every guard.

## Output

Lead with what the user has to decide; report what was built underneath it. Group by **what was built** (features/changes), not by workflow step (agents/skills). Read 📖 `${CLAUDE_SKILL_DIR}/references/output-structure-rules.md` for the full structure, ordering rules, and template.

**If the session ends with work deferred** (parked for room, an explicit "next session", or a visible compaction), offer a continuation prompt via `syafiqkit:continue-session` after the Summary, as one line. Judge by those visible signals, not an estimate of remaining context, which can't be measured from inside.

**Quick rules:**
- One to four open questions: one `AskUserQuestion` call. Five or more: `## Decisions` as well. If the session's brief was to finish everything, ask them before wrapping up and build the answers. Don't park them in the task doc (📖 `../_shared/references/decision-first-output.md` § Where it goes).
- Omit empty rows; don't fill with "N/A".
- One change = one `### [Change]` + `### Session`.
- A change with only ✅ still gets its heading.
- Multi-repo: name the repo and branch per change (reader's next act is committing). Name where one repo's work is inert without the other.
- Words the user still has to send (a handoff prompt, a message) are restated in full in Output, never pointed at ("the message from my earlier reply"). The earlier copy has scrolled away, and if what it points at was revised since, it's stale too.

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
| Design | [screens and widths graded, critique findings + fixes; omit only when nothing a person sees changed] |
| Cleanup | [removed, or omit] |
| Test | [command/steps, or omit] |

### Session
| Step | Result |
| Knowledge | [N entries → files] |
| Task docs | [path → summary] |
| Plugin | [files + bump or issue URL] (omit if Step 5 didn't fire) |
| User args | [actions taken] (omit if none) |
```
