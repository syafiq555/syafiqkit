---
name: done
description: Post-task cleanup - simplify code, review changes, update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize".
---

# Post-Task Workflow

Execute all steps in sequence. The skill is designed to run steps in a single turn without pausing — if you find yourself naming a remaining step rather than invoking it, that's a pause.

Subagents run in the background by default, so what arrives is a `<task-notification>` — check Step 1 for what that means in practice. A notification says an agent finished; it does not carry what the agent found. An agent spawned with `name:` is an addressable teammate whose plain-text output never reaches you, so its prompt must tell it to report via `SendMessage` or the findings are silently absent while every agent shows complete.

**User args**: If the user passed instructions with `/done` (e.g., "make sure this works for X"), address those FIRST before proceeding with the standard steps. The user's instructions override defaults. Record what you did about them in the **User Instructions** table of the Output. If no args were passed, omit that table.

**The contract.** A long session usually compacts before reaching `/done`, and only a skill's opening survives that — so read this now rather than expecting the steps below to still be here.

You owe six rows: Simplify · Review · Product · Knowledge · Task docs · Plugin. **Every row is a claim that a step actually ran** — an agent you dispatched with the right kind of prompt, or a skill you invoked *and then confirmed changed something on disk*. Invoking is not updating. A row you cannot substantiate is a step you skipped, so go run it rather than writing `✅`. Then check that anything the user must decide is the first thing they read, not buried under a report.

If you reach the end of this file and the exit gate is missing from your context, that is the compaction — re-read this skill before writing the Output.

## Mode selection (decide first)

Read `git status --short` and recent commits, then match the session to a mode. Different modes run different agents and apply different verification checks.

| Mode | When | Step 1 runs | Verification |
|------|------|------------|--------------|
| **Full** (default) | Multi-file features, multi-domain work, or anything with external inputs | Three agents + partition | Agent reports |
| **Docs-only** | Diff is entirely markdown (task docs, CLAUDE.md, SKILL.md, commands/, agents/, references/, a `docs/` project set) | Three agents + referential-integrity check | Agent reports + pointer resolution, anchor uniqueness, link validity, no wedged table rows. Where the diff touches `docs/ARCHITECTURE*.md`, also open each `file:line` anchor it cites and re-derive any count it states — both are claims about the codebase that a markdown-only diff gives a reviewer no reason to doubt |
| **Infra-only** | Entirely configuration code (CI, Dockerfile, nginx/env config, provisioning scripts); no application code | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |
| **Ops-only** | System changes applied out-of-band (deploy, backfill, config flip); no repo diff, no commit | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |

**Docs-only:** Count changed files from `git show --stat <this-session's commit>` PLUS the uncommitted diff — agent review covers both, since code committed earlier this session was never reviewed.

⚠️ **The referential-integrity check is the one this mode adds, and a hand-rolled sweep for it reports the corpus broken when the bug is in your extractor.** A `📖` lives inside the backticks and is not part of the path; `${CLAUDE_SKILL_DIR}` must be expanded, not stripped; and the syntax is shared by relative paths, bare skill names (`syafiqkit:haiku`) and prose *about* pointers, only the first of which is testable with `[ -e ]`. So a sweep returns a pile of confident false positives, and the failure rate is the tell — a defect that common in a maintained corpus would have surfaced already. Resolve one pointer you know is good and one you know is bad before believing any run, print the extracted paths rather than only the verdicts, and classify each hit by kind before counting it. 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/editing-skills-checklist.md` owns the method.

**Ambiguous signal:** Empty `git status --short` means work already committed, another writer's tree, or no changes at all. When git errors (no repo, no first commit), run **full mode** with substitutes per 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/verifying-a-write-landed.md`.


## Step 1: Simplify + Review + Product Review (parallel)

The three roles see the diff through different lenses:
- **Simplifier** — is the code *clean*? (duplication, readability, consistency)
- **Reviewer** — is the code *correct*? (bugs, security, logic errors, conventions)
- **Product reviewer** — is the *feature* complete and valuable? (missing journeys, dead-end flows, UX/business gaps — the class of miss a line-level diff structurally cannot catch). Runs in full mode only, and only if a project `.claude/agents/product-reviewer.md` exists (skip silently if absent).

### Ownership & Partition

Judge file ownership by diff *content*, since the harness auto-stages your own writes identically to a peer's. Read the diff before spawning agents.

**Ban these verbs in every agent prompt: `stash`, `checkout -- .`, `reset`, `clean`, `restore`, `commit`, `push`.** A file partition scopes reads, never git commands — one agent reaching for a clean baseline collides with your uncommitted work or a peer's. Naming the verbs is the guard.

**One agent per file for writes, and you are in the partition too.** Simplifier and reviewer both carry `Edit`; handing both the same list races them. Overlapping reads are fine; overlapping writes produce transient diagnostics the post-fan-out re-read cannot detect. The case the partition misses is your own: having granted a file to an agent, you keep editing it yourself, because a partition reads as a rule about *them*. Your context for that file then goes stale the moment the agent writes, and an `Edit` against remembered text still applies cleanly — it anchors on a string that survived the rewrite while the surrounding paragraphs moved. Measured 2026-09-15: an edit restoring a figure landed beside a paragraph the simplifier had already refolded, leaving the entry describing a dependency two paragraphs before the one explaining its removal; the harness's "modified on disk since you last read it" notice was the only signal, and it arrives *after* the write. So either hold your own edits to a granted file until the agent returns, or re-read before each one — never edit from context you held before dispatch.

**Multi-repo sessions:** Partition by repo first. Count changed files per repo (📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`) and sum for agent scaling. Mark the *other* repo's paths out of bounds — a partition listing paths reads as advisory once an agent notices a sibling file.

Read 📖 `${CLAUDE_SKILL_DIR}/references/owner-and-partition.md` for the ownership decision process and contested-file handling.

All agents go out in **ONE message** — the shape rule is restated at the dispatch itself, below, because that is where it has repeatedly failed.

### Agents to run

**Check for project agents first** by globbing:
```
Glob: .claude/agents/code-simplifier.md
Glob: .claude/agents/code-reviewer.md
Glob: .claude/agents/product-reviewer.md
```

| Agent | When found | Type to dispatch |
|-------|-----------|------------------|
| Simplifier | Project file exists | `"code-simplifier"` or fallback `"code-simplifier:code-simplifier"` |
| Reviewer | Project file exists | `"code-reviewer"` or fallback `"feature-dev:code-reviewer"` |
| Product reviewer (full mode only) | Project file exists | `"product-reviewer"` or skip if absent |

**Project agents written this session won't register in time.** Read 📖 `${CLAUDE_SKILL_DIR}/references/project-agent-dispatch.md` for the timing gap, the dispatch workaround, and how to note it in the Output.

**Runtime behaviour is a Playwright spec's job, not an agent's.** A UI diff with no spec covering it is a finding: write or extend the spec (`setup-playwright`) and run it, rather than reviewing the running app by eye.

### Agent Count & Prompting

Count changed files using the variants in 📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`, then scale **per role**:

| Changed files | Reviewers | Simplifiers | Product | TOTAL |
|---|---|---|---|---|
| ≤30 | 1 | 1 | 1 | **3** |
| 31–80 | 2 | 2 | 1 | **5** |
| 81+ | 3 (cap) | 3 (cap) | 1 | **7** |

⚠️ **The count is inlined because a pointer loses it.** It was a `📖` away until 1.291.0, and the paragraph that follows this one is a loud "dispatch NOW, no prose first" — which pulls attention past the pointer, so the reference goes unopened and three agents feel like the whole batch whatever the diff size. Measured 2026-09-22: a 110-file diff (81+ band, seven agents) got three, and the shortfall surfaced only because the user asked. Nothing in the dispatch reads as wrong — three agents is the *correct* answer for the band you never checked, and every report comes back clean because each agent reviewed what it was handed. **Tell: you are about to emit a batch without having named which band the file count put you in.**

Then read 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` for partitioning rules and what each agent prompt needs — role-specific prompting, and how to supply the high-value details (unsure judgement calls, what you've already verified, what you did NOT check and want hunted).

**Now dispatch — and this is the message the one-message rule governs.** Everything above was preparation; what you write next is the batch. Your first token is an `Agent` call, not a sentence about `Agent` calls: whatever you were about to say (which agent gets which files, what you already verified) goes in the message *after* the last call, or it goes in the partition message *before* this one. This paragraph is last on purpose — the rule has now failed eight recorded times, every one of them a session that read it correctly ~40 lines earlier and then composed the dispatch from memory once the partition reasoning had absorbed its attention (2026-09-18 is the latest; the sixth and seventh both came after this paragraph was moved here for exactly this reason, which is why 1.288.0 ruled that restating it again makes it less followed, not more). **Tell: you are writing a sentence and the next thing after it is an `Agent` call.** ⚠️ The eighth failure hid inside the carve-out above: the sentence written before call #1 was *about the partition*, which this paragraph explicitly permits — so it read as the allowed preamble rather than as narration, and the Tell never fired. The carve-out means a partition message sent **before** the batch, not a partition sentence sharing the message with it.

**While they run:** Start the verification agenda below — reading agent blind spots, preparing your re-reads of git state, deciding output structure. Don't duplicate the agents' work by previewing changes in parallel; that destroys the check that makes delegation safe. **When that agenda is done, end the turn rather than waiting** — the harness re-invokes you when the agents finish, and a `sleep` or re-fired status check buys nothing. Polling reads as the diligent alternative to previewing. **Tell: your previous identical call returned nothing new and you have no other work queued.** 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/explore-delegation.md` § The Waiting Game

**After all agents complete:**

Re-read `git rev-parse HEAD` and `git status -sb` — an agent that committed or pushed shifts every check that follows. Re-read this skill's remaining steps from the file at the same time: the body entered context before the fan-out and is not re-attached when agents return, so the steps below are being recalled rather than read. The six rows and exit gate are most often satisfied from memory, which is what makes a row readable as `✅` without the step behind it having run.

Reconcile agents against each other and the work. Agents have bounded visibility (one repo, one domain, one layer), so universal "clean" verdicts don't prove the codebase is clean. Read 📖 `${CLAUDE_SKILL_DIR}/references/agent-blind-spots.md` for the nine blindness patterns and how to settle contradictions.

Cross-agent findings (agent A's result needs a change in agent B's file) are applied *after* both return, by you or a fresh dispatch with the finding in its brief. Messaging a still-running agent reads as an out-of-brief instruction; a well-built agent refuses it (two did 2026-09-05, and the finding nearly lost while every report read complete).

Questions the product reviewer raises are asked through one `AskUserQuestion` call now, before Step 4, so the task doc records answers rather than open questions. On a brief to finish everything, build the answers first.

## Step 2: Clean up temp code

Scan the session for temporary artifacts — debug UI, logging, commented-out migration code — and remove or ask before keeping. Skip if none found.

⚠️ **"Nothing depends on this" is a claim about consumers, and the entry point tells you where a feature GOES, not what it NEEDS.** Stopping calling a seeder, a fixture builder or a setup routine is the same act as deleting it, minus the grep that deleting would have prompted — so the check gets skipped precisely because nothing was removed. Following the button that reaches the feature is not that check either: it resolves the route and reads as verification while answering a different question. What settles it is grepping the *data* the routine produces and opening whatever renders it, since the dependent is usually a page or job that fetches those rows rather than anything naming the function. Measured 2026-09-17: a test-mode seeder was stopped after confirming its entry point merely navigated elsewhere; five sub-pages fetched those rows and a summary card hardcoded their contents, so the whole surface silently advertised data that no longer existed. **Tell: you are about to call something dead because you followed its entry point rather than its output.**

⚠️ **A component published to a design system has a second home, and editing the first one silently retires the copy everyone else builds against.** Where a repo mirrors components out to a published system (Claude Design, a Storybook deploy, a released package), the source file is the only one your diff, your tests and your reviewers can see; the published copy keeps serving the version it was last built from, and nothing errors — designs and downstream consumers keep rendering, just from code that no longer exists here. The drift is therefore invisible at exactly the moment it is created, and it compounds per session. Establish whether the files you touched are mirrored (the sync's own config or build manifest enumerates them — that list is the authority, never the directory name), and when they are, say so in Output with the count and offer the re-sync rather than running it: a sync is long, it publishes, and whether it happens now is the user's call. Measured 2026-09-16: eleven mirrored files across four published components were edited and committed while the published system still served the prior build. **Tell: you are wrapping up a session whose diff touched a component directory, and you have not checked whether anything republishes it.**

## Steps 3 + 4: Capture Knowledge + Update Task Docs (sequential — Step 3, then Step 4)

Run Step 3 before Step 4. Both skills scan the same conversation for the same class of signal and independently decide routing (CLAUDE.md vs. task doc). Parallel dispatch risks the same fact landing in both files or neither — `update-claude-docs` decides what's broadly reusable, and `task-summary`'s own rule ("only patterns that apply broadly go in CLAUDE.md") depends on that decision already being made. Step 4 reads Step 3's result.

**Step 3 — Capture Session Knowledge:**

Invoke `syafiqkit:update-claude-docs` bare (no arg), or pass only a HINT if you must. The skill scans the FULL conversation for signals (corrections, preferences, misses) and code patterns (env surprises, tool misuse), then routes to the narrowest scope. Pre-written args listing only code facts silently drop early-session behavioral insights — the highest-value captures.

Delegate capture to the skill. Do not draft CLAUDE.md entries in `/done` — a summary reads complete and makes Step 4 get skipped. The next thing after this skill returns is task-summary, not a reply about what was written.

**Step 4 — Update Task Docs:**

Invoke `syafiqkit:task-summary` bare for a multi-domain scan. An explicit path skips the scan and misses related docs. If the skill already ran THIS session, invoke scoped to only what's NEW — a scoped invoke still counts as running the step; skipping it does not.

The skill auto-detects create vs update and handles path resolution and cross-references.

**Before leaving this step, measure what it wrote.** Read 📖 `${CLAUDE_SKILL_DIR}/references/task-doc-measurement.md` for the three core rules and measurement command. Over budget → run `condense-task-doc` in the same turn or state in Output that it was skipped. Once measured, proceed to Step 5 check.

> Agent files no longer contain injected CLAUDE.md content — they read it dynamically. No agent syncing needed.

## Step 5: Capture plugin learnings (optional — only if a gate fires)

Steps 3+4 write to the *project*; this writes to the *plugin* — a global artifact shared across every project.

Two gates. **Gate B** fires when this session wrote to `skills/**/*.md`, `commands/*.md` or `.claude/agents/*.md`, defect or no. **Gate A** fires on a real skill signal — something misfired, a step was wrong, you worked around an instruction.

**Gate B is a *file-modification* test and cannot answer whether a skill misled you — it only says the plugin tree changed.** Reverting a bad edit erases exactly the evidence Gate B looks for, so better defect handling makes the gate likelier to report nothing. Measured 2026-09-03: a session was sent wrong, reverted its own and template edits, saw empty status, reported "gate did not fire" — two invocations later the same signal patched five files. **Gate A is answered by recalling the session, not by status command.** Did a skill send you somewhere wrong? Did you correct a step mid-execution? Did you work around an instruction? A `git status` cannot answer these. On any session where you fixed something, treat Gate A as likelier.

Check the plugin tree with:
```bash
cd ~/.claude/plugins/syafiqkit && git status --short -- 'skills/**/*.md' 'commands/*.md' '.claude/agents/*.md'
```
Use `cd`, not `git -C` — the latter walks up to an enclosing repo. Any hit: check its mtime against session start (shared checkouts carry another session's work). Read 📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` for ownership and "replaced/routed/grew" meanings.

**Gate B re-fires on work already routed.** Once files land in a session commit they stay in `git show --stat` for every later `/done`. A second run sees the same hit with nothing new — which reads as unrouted. Ask what changed since the last `update-plugin` run: nothing new means the gate is satisfied. A genuinely new signal means invoking scoped to it. Also read the CHANGELOG head — your signal may already be captured there, and two version bumps in one afternoon is a collision to avoid.

Invoke `syafiqkit:update-plugin` once ownership is settled — it owns everything downstream (patch files + version + CHANGELOG for owner, or draft GitHub issue for consumer).

## Exit Gate — Verify Steps Ran Before Writing Output

Confirm the WORK is done, not just this skill's steps — verify against the approved plan that every part was built; part-done means finish the work first.

⚠️ **A red test suite blocks the exit, whoever caused it.** A failure you proved pre-existing is still a failure, and fixing it is part of `/done`. A baseline run at HEAD tells you WHAT to fix (the code or an outdated test), never WHETHER to fix it. "Not caused by this diff" is a finding to state beside the fix, not a reason to stop at a report. Fix the code when it's wrong. Fix the test when it's stale or its fixture is date- or order-dependent. Where the right behaviour is a genuinely open product call, fix the test's determinism and record the product question. Measured 2026-09-29: a `/done` proved 7 billing failures pre-existing and wrote them up as not its concern, and the user had to ask for the fix. Keep the full runner output, never a `tail`: the failure names are what a fix needs, and dropping them costs a whole re-run. **Tell: your Output says a test fails "on master too" and no row says it was fixed.** Every Output row is a claim that a step ran — verify each before writing. Read 📖 `${CLAUDE_SKILL_DIR}/references/exit-gate-rules.md` for fillability tests, verification methods for Knowledge/Task docs, and failed agent handling.

**Read the session from the top, asking two things:** First, what would a reader need that exists only in this conversation — a plan in prose, a rule about what to stop doing, anything parked or waiting? A doc step passes every check having written findings without reasoning. Grep the docs for the specific fact: a diff proves bytes moved, never that the right fact moved. Missing → go back to Step 4.

Second, is anything the user must decide placed first in Output? Open questions must be asked above — `✅` on a change with an unresolved question only if the question sits before the Summary section.

**Six rows to fill reads as thorough and makes skipping this check likelier.** Measured 2026-08-28: `/done` wrote a decision block and stopped while a sequencing plan stayed in the conversation; the next `/quick-done` caught it. Structure that looks complete is not evidence a check ran.

⚠️ **If new work arrived from the user while this skill was running, the wrap-up is the thing most likely to have been lost — and nothing will remind you.** A bug report mid-`/done` is real and urgent, so attending to it is right; what makes it costly is that fixing it produces its own endpoint (tests green, a screenshot) which then gets written up as the turn's conclusion, because at that moment it is the only outstanding thing in view. The steps still owed are not contradicted by anything — they are simply no longer present, having entered context before several rounds of file edits. Measured 2026-09-17: five interrupting reports landed during a `/done`; all five were fixed and verified, and the reply that followed carried no Knowledge, Task-docs or Plugin row and never mentioned `/done` had run. **Before writing Output, ask whether this turn was interrupted; if it was, resume at the step you left and re-read this file rather than recalling it.** 📖 `../_shared/references/one-turn-chain.md` for the involuntary-severance cases and why an honest summary of the remaining step still evades every guard.

## Output

Lead with what the user has to decide; report what was built underneath it. Group by **what was built** (features/changes), not by workflow step (agents/skills). Read 📖 `${CLAUDE_SKILL_DIR}/references/output-structure-rules.md` for the full structure, ordering rules, and template.

**Where the session is ending with work deferred rather than finished** — something parked for lack of room, an explicit "next session", or a visible compaction — offer a continuation prompt via `syafiqkit:continue-session` after the Summary. One line; it's an offer, not a step. Don't estimate your remaining context to decide: that number is unmeasurable from the inside, and the signals above are observable without it.

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
| Cleanup | [removed, or omit] |
| Test | [command/steps, or omit] |

### Session
| Step | Result |
| Knowledge | [N entries → files] |
| Task docs | [path → summary] |
| Plugin | [files + bump or issue URL] (omit if Step 5 didn't fire) |
| User args | [actions taken] (omit if none) |
```
