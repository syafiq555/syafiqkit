---
name: done
description: Post-task cleanup - simplify code, review changes, design-review any screen the diff changed (uiux grading plus impeccable critique, and taste on customer-facing pages), update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize", "wrap up with the design skills", "done with a design review".
---

# Post-Task Workflow

Run the steps in one turn. Naming a remaining step instead of invoking it is a pause; the only legitimate one is waiting for agents in Step 1.

**User args**: If the user passed instructions with `/done`, address those FIRST; they override the defaults and go in the **User args** row of the Output's Session table (omitted when none were passed).

**The contract.** A long session usually compacts before `/done`, and only this skill's opening survives that. You owe six rows: Simplify · Review · Product · Knowledge · Task docs · Plugin, plus Design whenever the diff changes something a person sees, and Motion always ("no motion in diff" when the session added none, rendered or not). Each row claims a step ran: an agent dispatched with the right kind of prompt, or a skill invoked *and confirmed to have changed something on disk*. Invoking is not updating. A row you cannot substantiate is a skipped step: go run it rather than writing `✅`.
Re-read this file whenever its body is no longer in view (after a compaction, after agents return, after an interrupted turn). Recalled steps read as `✅` without having run.

**"Has /done run?" is answered by git, not memory, whoever asks** (the user, a button, a peer session's broadcast offering "reply done already"). Find the commit this skill's last Output covered and list code commits after it (`git log --oneline <that-sha>..HEAD -- <code paths>`): any you wrote means run it now, and the reply is the run, not "done already". A session that wrote nothing (fresh, or after `/clear`), or args naming the last release ("then /ship, last posted 1.488.0"), scopes the run to every commit since that release that no `/done` Output covered, whoever wrote it: where a push is the ship, a peer's unreviewed push has already gone out (27/11/2026: six versions went out that way, and an empty-session run reported nothing to review). A small follow-up feels covered by the wrap-up before it, and the wrap-up never saw it. **Tell: you are about to reply "done already" and have not listed the commits since the last /done Output.**

## Mode selection (decide first)

Read `git status --short` and recent commits, then match a mode.

| Mode | When | Step 1 runs | Verification |
|------|------|------------|--------------|
| **Full** (default) | Multi-file features, multi-domain work, or anything with external inputs | Three agents + partition | Agent reports |
| **Docs-only** | Diff is entirely markdown (task docs, CLAUDE.md, SKILL.md, commands/, agents/, references/, a `docs/` project set) | Reviewers + simplifiers per the count table, + referential-integrity check. Product reviewer only if people use the markdown (see Step 1) | Agent reports + pointer resolution, anchor uniqueness, link validity, no wedged table rows |
| **Infra-only** | Entirely configuration code (CI, Dockerfile, nginx/env config, provisioning scripts); no application code | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |
| **Ops-only** | System changes applied out-of-band (deploy, backfill, config flip); no repo diff, no commit | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |

**Docs-only:** count changed files from `git show --stat <this-session's commit>` plus the uncommitted diff, since agent review covers both. If the diff touches `docs/ARCHITECTURE*.md`, re-derive any count it states from its cited `file:line`. 📖 `${CLAUDE_SKILL_DIR}/references/docs-only-mode.md` for why and the method.

⚠️ **Referential integrity is this mode's addition: when a sweep flags many pointers, suspect the extractor first.** 📖 `${CLAUDE_SKILL_DIR}/references/docs-only-mode.md` § Referential integrity for the method.

**Ambiguous signal:** an empty `git status --short` (work committed, another writer's tree, or no changes) skips Step 1 and nothing else. In a session that wrote nothing, or one whose args name a release, that skip also needs every commit since that release to be covered (the "Has /done run?" rule above; the range and how to mark each commit: 📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md` § Work Already Committed); otherwise Step 1 reviews those commits. Steps 3 to 5 always run, since they scan the conversation, so a session that only read an email or meeting notes still owes them, and the Design review still runs for anything a person will see that the session built outside the repo (a clip, deck or rendered file). **Tell: your Output reads "nothing to wrap up" and Steps 3 and 4 were never invoked.** When git errors, run **full mode** with substitutes per 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/verifying-a-write-landed.md`.

## Step 1: Simplify + Review + Product Review (parallel)

- **Simplifier**: is the code *clean*? (duplication, readability, consistency)
- **Reviewer**: is the code *correct*? (bugs, security, logic errors, conventions)
- **Product reviewer**: is the *feature* complete and valuable? (missing journeys, dead ends, UX and business gaps, what a line-level diff cannot catch). Full mode; docs-only only when the markdown is the product (what ships to users or steers their sessions), not notes about one project, so ask who reads the output before skipping. 📖 `${CLAUDE_SKILL_DIR}/references/docs-only-mode.md` § Product reviewer scope.
- **Design review**: does the changed *screen* read well for its reader at every width? Runs whenever the diff touches something a person sees (any page, screen, template, component, stylesheet, email, deck or rendered document), and equally for anything a person will see that this session built outside the repo (social posts, slides, films, a deck in a work folder): list those from the session, not from git, since no diff shows them (27/11/2026: TikTok previews built in a home folder were presented with no design pass until the user asked "use score loop and design skills already ?", and round 1 then failed each on text size, safe zone and brand). Three skills start in one batch: `uiux` grades (its `scripts/check-render.mjs` measures and captures each changed screen at 320 to 1280 in each colour scheme, every capture opened), `impeccable` critiques, and `taste`'s review path joins for a customer's screen. The Output's Design row names all three with what each found, so a dropped one shows as a blank. The measuring and critique run in the Step 1 batch; the fixes wait until the code agents have returned (one writer per file), are made by you, and count as reviewed by the check-render re-run and the Design row, so they do not reopen the late-code review below. Their findings merge into one score and are **fixed in this step**, not reported: only a finding that changes who can do or see something, or a direction the user picked, goes to the user. Then show before and after captures of each changed screen (the image gallery tool where it exists). An audit with nothing built is the complaint this step exists for: "Why does all other design skills only audit like that ?" (15/11/2026). A render check or a code or product pass does not stand in for it: on 14/11/2026 a redesigned admin screen passed both, and the user then had to ask for the design skills. 📖 `${CLAUDE_SKILL_DIR}/references/design-review-merge.md` for each skill's scope, the deck case and the merge score the Output's Design row reports (read § Merge again before writing that row). **Tell: your diff has a `.css`, template or screen file and no Design row.**
- **Motion review**: is the motion *right*? Its own step, decided by the diff and not by whether anything renders: search the added lines of `git diff HEAD` and of this session's commits (`git show`), so an empty working tree never skips it, for motion (a CSS `transition`, `animation` or `@keyframes`; a Tailwind `transition-`, `animate-` or `duration-` class; a Chakra `transition=` prop; a Motion/Framer `animate`, `AnimatePresence`, `layoutId`, `drag=`/`dragConstraints` or `useSpring`; a Vaul `Drawer`) and, on any real hit, invoke `emil-review-animations` with those files in the same batch. It reads code, so CSS no screen uses yet still gets it, and a Design row "not run" never skips it. 📖 `${CLAUDE_SKILL_DIR}/references/design-review-merge.md` § Dispatch.

### Ownership & Partition

Judge ownership by diff *content*, never by remembered edits: before granting a partition, run `ListAgents` and ask any live peer about each file, strike what a peer released, and build the commit list from paths you wrote, never from `git status` minus folders you think are a peer's. 📖 `${CLAUDE_SKILL_DIR}/references/owner-and-partition.md` for the decision process, contested files and § Ownership Incidents.

**Ban these verbs in every agent prompt: `stash`, `checkout -- .`, `reset`, `clean`, `restore`, `commit`, `push`.** A file partition scopes reads, never git commands: one agent reaching for a clean baseline collides with your uncommitted work or a peer's, so naming the verbs is the guard. A report-only brief names generator scripts as writes too; tell it to use their check mode or a scratch path. **A partition also never covers what commands share** (a test database, a framework's fixed fake-storage folder, a dev server port): name ONE suite runner per batch, usually you after the agents return, and tell every other agent to run nothing or only its own filtered files. Concurrent runs delete each other's fixtures, the failing tests change from run to run, and agents report your diff as broken or refuse to edit it (25/11/2026: four agents each ran a Pest suite whose `Storage::fake()` folder is shared, and photo tests failed at random). 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` for the diagnosis.

**One agent per file for writes, and you are in the partition too.** Simplifier and reviewer both carry `Edit`, so overlapping reads are fine and overlapping writes are not: a reviewer and a simplifier handed the same file list both write to it, so give them different lists or brief one of the pair report-only (27/11/2026: three groups each got a reviewer and a simplifier on one list). Re-read a granted file before each of your own edits (📖 `${CLAUDE_SKILL_DIR}/references/owner-and-partition.md` § Edits Against a Partitioned File).

**Multi-repo sessions:** Partition by repo first. Count changed files per repo (📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`) and sum for agent scaling. Mark the *other* repo's paths out of bounds in every brief.

### Agents to run

**Check for project agents first** by globbing `.claude/agents/code-simplifier.md`, `.claude/agents/code-reviewer.md` and `.claude/agents/product-reviewer.md`.

| Agent | Type to dispatch |
|-------|------------------|
| Simplifier | `"code-simplifier"` or fallback `"code-simplifier:code-simplifier"` |
| Reviewer | `"code-reviewer"` or fallback `"feature-dev:code-reviewer"` |
| Product reviewer (full mode, or docs-only where the markdown is the product) | `"product-reviewer"` or skip if absent (project or user-level) |

**Project agents written this session won't register in time.** 📖 `${CLAUDE_SKILL_DIR}/references/project-agent-dispatch.md` for the timing gap, the workaround and how to note it in the Output.

**A UI diff with no Playwright spec is a finding** (`setup-playwright`): runtime behaviour is a spec's job.

A `<task-notification>` says an agent finished, not what it found. An agent spawned with `name:` must be told to report via `SendMessage`, or its findings are silently absent.

### Agent Count & Prompting

Count changed files using the variants in 📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`, then scale **per role**:

| Changed files | Reviewers | Simplifiers | Product | TOTAL |
|---|---|---|---|---|
| ≤30 | 1 | 1 | 1 | **3** |
| 31–80 | 2 | 2 | 1 | **5** |
| 81+ | 3 (cap) | 3 (cap) | 1 | **7** |

**Name the band before the batch.** The 81+ band is seven agents, not three, since each agent reviews only what it is handed. **Tell: you are about to emit a batch without having named which band the file count put you in.** 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` for partitioning, briefing each agent and the count rationale.

**Now dispatch.** Your first token is an `Agent` call, not a sentence about `Agent` calls. Send every agent in ONE message so they run concurrently. Anything about partitioning goes in a message *before* the batch, never in a sentence sharing it. **Tell: you are writing a sentence and the next thing after it is an `Agent` call.**
**While they run:** work the verification agenda below. Don't preview changes in parallel, since that destroys the check that makes delegation safe. When the agenda is done, **end the turn**: the harness re-invokes you on completion, so polling buys nothing. **Tell: your previous identical call returned nothing new and you have no other work queued.** 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/explore-delegation.md` § The Waiting Game

**After all agents complete:** re-read `git rev-parse HEAD` and `git status -sb`, since an agent that committed or pushed shifts every later check, and re-read this file's remaining steps. A reviewer that holds no `Write` (a product reviewer generated from `agent-setup`'s template) ends its report with a `Memory notes` line; save each note into `.claude/agent-memory/<agent>/` and its `MEMORY.md` index before Step 3, since nothing else will.

Reconcile agents against each other: each sees one repo, domain or layer, so a universal "clean" proves little. Read 📖 `${CLAUDE_SKILL_DIR}/references/agent-blind-spots.md` for the nine blindness patterns and how to settle contradictions.

Cross-agent findings are applied *after* both return, by you or a fresh dispatch carrying the finding in its brief, never by messaging a running agent.

Every reviewer's questions for the user go through one `AskUserQuestion` call before Step 4, so the task doc records answers, not open questions: the product reviewer's list, and any code reviewer line saying "a decision to confirm" or "the user's call", however low it ranks the line (21/11/2026: a refund-timing decision sat under a code reviewer's LOW notes and missed the question batch). Open the code each premise rests on first. A question about how the product should behave is researched before it is asked: who can do or see something (which role ships, who sets a status, what exits a stuck state), and equally what a user sees or what happens to their data (whether a value moves on its own, what a switch keeps or clears, which fields a form offers). A question about how a screen handles one of its states for the person using it (block or warn, what an error says, what happens after an action) is not asked at all: it is a design call the Design step's `uiux` pass makes and builds, unless the answer changes who can do or see something or what a customer is promised (25/11/2026: a block, warn or leave choice for a failed photo upload came back "improve use uiux skill"). One `haiku` agent per question goes to the governing spec rows (searched across the whole spec by the behaviour's nouns, not only the item's own row), live products and design guidance, with quotes inside the options; asked bare, the user answers "research" and they come back twice (21/11/2026: three reviewer questions asked with code evidence only; once researched, two of the three recommendations reversed). The same holds for every later round in the run (a finding that arrives after the user answered the first batch is asked the same way), and an option that carries a design over from a sibling feature ("same as the direct route: a second approver") says where that design came from, the spec row or the user's own dated call, because a carried-over default reads as the spec's (25/11/2026: a follow-up cancel question went out bare and came back "/haiku research", then its "second approver" default came back "Did the brs got say need 2nd approver?"; it was the user's 18/11 call, and BRS M2.6 says only "where configured"). **Tell: an option repeats a reviewer's claim about behaviour and you have not opened the file that decides it, a behaviour option carries no quote from the spec, a product or a guidance page, or an option reuses a sibling feature's rule without naming who set it.**

## Step 2: Clean up temp code

Scan the session for temporary artifacts (debug UI, logging, commented-out migration code) and remove them or ask before keeping. Skip if none found.

⚠️ **"Nothing depends on this" is a claim about consumers.** Grep the *data* the routine produces and open whatever renders it, not the entry point. **Tell: you are about to call something dead because you followed its entry point rather than its output.**

⚠️ **A component published to a design system has a second home.** The sync's own config decides what is mirrored, not the directory name. If mirrored, state the count in Output and offer the re-sync rather than running it, since publishing is the user's call. **Tell: your diff touched a component directory and you have not checked whether anything republishes it.** 📖 `${CLAUDE_SKILL_DIR}/references/agent-blind-spots.md` § Step 2 Consumer Checks for the reasoning and the seeder and mirror incidents.

## Steps 3 + 4: Capture Knowledge + Update Task Docs (sequential: Step 3, then Step 4)

Run Step 3 before Step 4: both scan the same conversation and route facts (CLAUDE.md vs. task doc), so in parallel the same fact can land in both files or neither. `task-summary`'s rule that only broadly applying patterns go in CLAUDE.md relies on Step 3 deciding first.

**Step 3, Capture Session Knowledge:** Invoke `syafiqkit:update-claude-docs` bare, or with only a hint. Args that list only code facts silently drop the early-session behavioural insights, the highest-value captures. Do not draft CLAUDE.md entries here: a drafted summary reads complete and gets Step 4 skipped.

**Step 4, Update Task Docs:** Invoke `syafiqkit:task-summary` bare for a multi-domain scan; an explicit path misses related docs. If it already ran this session, invoke it scoped to what's NEW. A scoped invoke still counts as the step. **A builder or other agent editing task docs is not `task-summary` having run**: it updated the files its brief named, never the hub's Quick Start or the project's derived views (`docs/ARCHITECTURE*.md`, `PRD.md`), so unless `task-summary` itself already ran this session the invoke stays bare, and its args never tell `task-summary` the agents' doc work is complete (19/11/2026: args saying "beyond what the builders already wrote" left a hub Quick Start listing two built features as not built, and `ARCHITECTURE.md` describing a superseded refund rule, until a bare re-run found both). **Tell: your Step 4 args contain "already wrote", "already updated" or "scoped to what's new" and `task-summary` has not run earlier in this session.**

**Before leaving this step, measure what it wrote.** 📖 `${CLAUDE_SKILL_DIR}/references/task-doc-measurement.md` for the rules and the command. Over budget: run `condense-task-doc` in the same turn, or state in the Output that it was skipped.

## Step 5: Capture plugin learnings (every run answers all three gates)

**Gate A first, and from the transcript, not a command.** List every skill this session invoked and every user correction or redirect ("i meant the chat", a draft changed at send time, a step the user added or had to run by hand); each one a skill owns is a signal for `update-plugin`. A clean `git status` of the plugin tree answers Gate B only, though running it feels like having done the step. **Tell: your Step 5 evidence is a status command's output.**

Three gates. **Gate B** fires when this session wrote anywhere in the plugin tree (skills, commands, agents, `tools/`, `hooks/`), defect or no: a tool's code change carries the same routing and changelog duties as a skill's. **Gate A** fires on a real skill signal: something misfired, a step was wrong, you worked around an instruction. **Gate C** fires when the session built something inside a project that another project would reuse, and no skill or plugin tool carries it yet. Test: "would the next project have to rebuild this?" For each yes, recommend a skill (`skill-creator`), an extended skill, or a plugin MCP server where the reusable part is reaching an outside system, and ask in this step's `AskUserQuestion` before building, since a skill is hours of work and ships everywhere. Examples: 📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` § Gate C Examples. **Tell: the session's most reusable artifact sits in a project folder, and your Plugin row says no gate fired.**

For Gate B, check the plugin tree with `cd`, not `git -C` (which walks up to an enclosing repo): `cd ~/.claude/plugins/syafiqkit && git status --short && git log --oneline --since=<session start>` (committed work counts: a session that built and shipped a tool shows an empty status). Any hit: check its mtime against session start, then `git diff HEAD -- <file>` on anything you don't remember editing (a bare `git diff` misses the auto-staged plane and reports your own work as foreign). 📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` for ownership and "replaced/routed/grew" meanings.

**Gate B re-fires on work already routed.** Ask what changed since the last `update-plugin` run: nothing new means the gate is satisfied. Check the CHANGELOG head too, since two bumps in one afternoon is a collision. 📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` § Gate Rationale.

Invoke `syafiqkit:update-plugin` once ownership is settled; it owns everything downstream (owner and consumer paths in the step5 reference's § Plugin Update).

## Exit Gate: Verify Steps Ran Before Writing Output

Confirm the WORK is done, not just this skill's steps: verify against the approved plan that every part was built; part-done means finish first.

**Code written after the Step 1 fan-out has had no review, so it goes to a reviewer** (and a product reviewer where a user sees the change). List the files changed since dispatch; only a few one-line patches may skip it, and the Review row says so. **Tell: your Review row lists fixes, and no agent was dispatched after they were written.**

⚠️ **A red test suite blocks the exit, whoever caused it.** A failure proved pre-existing is still a failure to fix in `/done`; a HEAD baseline tells you what to fix, never whether. Keep the full runner output, never a `tail`: a fix needs the failure names. On a checkout a live peer shares, the suite runs their unsaved code too, so the verdict comes from a worktree of your own paths with peers paused. **Tell: your Output says a test fails "on master too" and no row says it was fixed.** Verify each Output row before writing it. 📖 `${CLAUDE_SKILL_DIR}/references/exit-gate-rules.md` for the fix rule, fillability, verification and failed agents.

**Steps a CLAUDE.md adds to `/done` are part of this run, not a follow-up to offer.** A loaded CLAUDE.md that says `/done` also updates a tracker, a huddle sheet or cards binds this run as much as the steps above; this file never names them, so they drop out unless you grep the loaded instructions for `/done` before writing the Output and do each one (28/11/2026: a "checks ClickUp and the huddle" rule was reported as "not updated, say if you want me to" and came back "Why u didnt read the huddle ?"). **Tell: your Output offers to update something a CLAUDE.md told `/done` to update.**

**Read the session from the top.** First, what would a reader need that exists only in this conversation (a plan in prose, a rule about what to stop doing, anything parked)? Grep the docs for that fact: a diff proves bytes moved, not that the right fact moved. Missing → back to Step 4. Second, is anything the user must decide placed first in the Output? Open questions go above the Summary; ✅ on a change with an open question is valid only if the question sits before it.

⚠️ **Interrupted turn.** If new work arrived from the user mid-`/done`, the wrap-up is the step most likely lost: the fix's own endpoint (green tests, a screenshot) reads as the conclusion. **Before writing Output, ask whether this turn was interrupted; if so, resume at the step you left and re-read this file.** 📖 `../_shared/references/one-turn-chain.md` for why a summary still evades the guards.

## Output

Lead with what the user has to decide; report what was built underneath it. Group by **what was built**, not by workflow step. 📖 `${CLAUDE_SKILL_DIR}/references/output-structure-rules.md` for structure, ordering and template.

**If the session ends with work deferred** (parked for room, an explicit "next session", or a visible compaction), offer a continuation prompt via `syafiqkit:continue-session` after the Summary, as one line. Judge by those visible signals, not an estimate of remaining context.

**Quick rules:**
- One to four open questions: one `AskUserQuestion` call. Five or more: `## Decisions` as well. If the session's brief was to finish everything, ask before wrapping up and build the answers. Don't park them in the task doc (📖 `../_shared/references/decision-first-output.md` § Where it goes).
- Omit empty rows; never "N/A". The Plugin row is the exception: it always states its three gates.
- Every table keeps its `|------|--------|` line under the header. Without it, the phone app and Remote Control show raw pipes instead of a table. A cell holds plain text with no `<br>`, which those views print literally. A row with several points gets one short line in its cell, and the points go as bullets under that table (28/11/2026: a Summary with no separator line and `<br>` lists arrived on the phone as pipe-and-tag soup).
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
