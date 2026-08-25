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

**Know your session's scope before choosing agents.** Read `git status --short` and recent commits, then match the session to a mode. Mode selection cascades consequences across all downstream steps — different agents run, different rows fill the Output, and different verification checks apply.

| Mode | When | Step 1 runs | Verification |
|------|------|------------|--------------|
| **Full** (default) | Multi-file features, multi-domain work, or anything with external inputs | Three agents + partition | Agent reports |
| **Docs-only** | Diff is entirely markdown (task docs, CLAUDE.md, SKILL.md, commands/, agents/, references/) | Three agents + referential-integrity check | Agent reports + pointer resolution, anchor uniqueness, link validity, no wedged table rows |
| **Infra-only** | Entirely configuration code (CI, Dockerfile, nginx/env config, provisioning scripts); no application code | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |
| **Ops-only** | System changes applied out-of-band (deploy, backfill, config flip); no repo diff, no commit | None (skip Step 1) | Read 📖 `${CLAUDE_SKILL_DIR}/references/rare-modes.md` |

**Docs-only partition rule:** Count changed files from `git show --stat <this-session's commit>` PLUS the uncommitted diff — agent review covers both, since code committed earlier this session was never reviewed. 

**Ambiguous signal?** Empty `git status --short` means: work already committed (full mode + git variants to list it), another writer's tree, or no changes at all. Name which. When git errors (no repo, no first commit), run **full mode** with substitutes per 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/verifying-a-write-landed.md`.


## Step 1: Simplify + Review + Product Review (parallel)

The three roles see the diff through different lenses:
- **Simplifier** — is the code *clean*? (duplication, readability, consistency)
- **Reviewer** — is the code *correct*? (bugs, security, logic errors, conventions)
- **Product reviewer** — is the *feature* complete and valuable? (missing journeys, dead-end flows, UX/business gaps — the class of miss a line-level diff structurally cannot catch). Runs in full mode only, and only if a project `.claude/agents/product-reviewer.md` exists (skip silently if absent).

### Ownership & Partition

Establish which files belong to this session before spawning agents — judge by diff *content*, since the harness auto-stages your own writes into the same shape a peer's take. `ListAgents` will tell you a peer session is live and is worth a heads-up before you bump a version, but it **cannot** say which checkout that peer is in, so it never substitutes for reading the diff.

**Ban these verbs in every agent prompt you write: `stash`, `checkout -- .`, `reset`, `clean`, `restore`, `commit`, `push`.** A file partition scopes what an agent *reads*, never what a `git` command it runs *touches* — so one agent reaching for a clean baseline can collide with your uncommitted work or a peer's. Naming the verbs is the guard; a prompt gesturing at "nothing destructive" reads as followed right up to the collision.

**Give at most ONE agent write authority over any given file.** Simplifier and reviewer both carry `Edit`, so handing both the same list races them on one file — and a diff small enough that neither role splits is exactly where that looks correct. Overlapping READS are fine; overlapping writes produce transient diagnostics indistinguishable from real defects, and the post-fan-out `HEAD`/`status` re-read does not detect it.

**When the session spans more than one repo, the partition axis is the repo before it is the file, and every count is per-repo.** A second checkout is easy to under-serve because the whole skill reads in the singular: `git status --short` answers for whichever directory you happen to be in, so a file count taken once silently describes one repo and the other's work goes unreviewed. Run the counting variants in each repo (📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`) and sum for agent scaling. Then state the *other* repo's path in each agent's prompt as out of bounds — the verb ban above stops destructive commands but says nothing about an agent helpfully editing a sibling checkout it can see, and a partition listing only paths reads as advisory once an agent notices a related file next door. Where the repos differ in language or toolchain, that split is usually also the natural role split (one repo's diff to the reviewer, the other's to the simplifier), which gets one-writer-per-file for free.

Read 📖 `${CLAUDE_SKILL_DIR}/references/owner-and-partition.md` for the ownership decision process and how to handle contested files.

Once you've settled ownership, emit all applicable agents in **ONE message**, opening with the first `Agent` call and emitting the rest back-to-back. No prose before the first call; open with it. Narration before the dispatch closes the message early, serializing the agent starts and making their reports land while you're writing the next dispatch — exactly the opposite of what parallelism gains. Write any introduction *after* the last call.

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

**`browser-verifier` is opt-in only.** Spawn it only when the user asked for it in words — "the diff touches UI so they'd want runtime proof" is an inference and not a reason to spawn. A UI diff is a reason to offer, never to spawn. 📖 `${CLAUDE_SKILL_DIR}/references/browser-verification.md`

### Agent Count & Prompting

Count changed files using the variants in 📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`, then read 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` for the scaling table, partitioning rules, and what each agent prompt needs. The guide covers all role-specific prompting and how to supply high-value details (unsure judgement calls, what you've already verified, what you didn't check).

**While they run:** Start the verification agenda below — reading agent blind spots, preparing your re-reads of git state, deciding output structure. Don't duplicate the agents' work by previewing changes in parallel; that destroys the check that makes delegation safe. 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/explore-delegation.md`

**After all agents complete:**

Re-read `git rev-parse HEAD` and `git status -sb` first — your pre-fan-out state reading is not current. An agent that committed or pushed leaves every other check silent, and the file-count you reasoned from silently stops describing the tree.

Once every agent has reported, reconcile them against each other and against the work. Agents have bounded visibility (one repo, one domain, one layer), so a partition that reads "clean" everywhere is not the same as a codebase that is clean. Verify what none of them could see — read 📖 `${CLAUDE_SKILL_DIR}/references/agent-blind-spots.md` for the nine blindness patterns and how to settle contradictions between reviewers.

## Step 2: Clean up temp code

Scan the session for temporary artifacts — debug UI, logging, commented-out migration code — and remove or ask before keeping. Skip if none found.

## Steps 3 + 4: Capture Knowledge + Update Task Docs (sequential — Step 3, then Step 4)

Run Step 3 before Step 4. Both skills scan the same conversation for the same class of signal and independently decide routing (CLAUDE.md vs. task doc). Parallel dispatch risks the same fact landing in both files or neither — `update-claude-docs` decides what's broadly reusable, and `task-summary`'s own rule ("only patterns that apply broadly go in CLAUDE.md") depends on that decision already being made. Step 4 reads Step 3's result.

**Step 3 — Capture Session Knowledge:**

Invoke `syafiqkit:update-claude-docs` bare (no arg), or if you pass an arg keep it a HINT, not a scope limiter. The skill scans the FULL conversation for conversational signals (user corrections, preferences, things Claude got wrong) AND code-level patterns (env surprises, tool misuse), then routes to the narrowest scope. Handing it a pre-written arg listing only code facts silently narrows the scan and drops early-session behavioral misses — exactly the highest-value captures.

Do not pre-write CLAUDE.md entries in `/done` — delegate the whole capture to the skill. A summary of CLAUDE.md writes is a complete-looking artifact; reporting it is how Step 4 gets skipped. The next thing after this skill's return is invoking the task-summary skill, not a reply describing what was written.

**Step 4 — Update Task Docs:**

Invoke `syafiqkit:task-summary` bare, letting the skill do a multi-domain scan. Passing an explicit path skips the scan, missing updates to related docs (roadmaps, bug reports needing stubs).

If the skill already ran THIS session (e.g., a `/commit`'s staleness gate forcing a full run): invoke it scoped, passing only what's NEW since that run. A scoped invoke still counts as running the step; skipping it does not.

The skill auto-detects create vs update and handles path resolution, status updates, cross-references.

**Then, before leaving this step, measure what it wrote.** Read 📖 `${CLAUDE_SKILL_DIR}/references/task-doc-measurement.md` for the three core rules and the measurement command. Over budget → run `condense-task-doc` in the same turn or state in Output that it was skipped. Once measured, run the Step 5 check next.

> Agent files no longer contain injected CLAUDE.md content — they read it dynamically. No agent syncing needed.

## Step 5: Capture plugin learnings (optional — only if a gate fires)

Steps 3+4 write to the *project*; this writes to the *plugin* — a global artifact shared across every project.

Two gates, and **Gate B is the one that gets missed**: it fires whenever this session wrote to a `skills/**/*.md`, `commands/*.md` or `.claude/agents/*.md` file, defect or no defect — check the diff for those paths rather than deciding from memory. Gate A fires on a real skill signal (something misfired, a step was wrong, you worked around an instruction), which is the rarer case. A docs-only session is exactly where a hand-edited skill file hides, so neither gate is safe to assume unfired.

Read 📖 `${CLAUDE_SKILL_DIR}/references/step5-gates-and-plugin-update.md` for the ownership settlement and what "replaced/routed/grew" means for each file.

**Gate B keys on paths, so it re-fires on work a previous run already routed.** Once those files land in a session commit they stay in `git show --stat` for every later `/done`, and a second run sees the same hit with nothing new behind it — which reads as an unrouted edit rather than a finished one. Ask what changed since the last `update-plugin` run, the way Step 4 already does for `task-summary`: nothing new means the gate is satisfied, and saying so in the Output is the honest row. A genuinely new signal means invoking scoped to that signal, since passing the whole session re-derives conclusions already shipped and the version bump it produces looks like new work.

⚠️ **A peer session can own the plugin tree while you decide this.** `update-plugin` is exactly what a fork gets dispatched to run, so the checkout may already carry a version bump and edits that are not yours. Read `git -C <plugin-dir> status --short` and the CHANGELOG head before writing — your signal may be captured there already, in better form, and two sessions bumping the same version in one afternoon is the collision this avoids.

Invoke `syafiqkit:update-plugin` once you've settled ownership — it owns everything downstream (patch skill files + version + CHANGELOG for owner, or draft GitHub issue for consumer).

## Exit Gate — Verify Steps Ran Before Writing Output

Confirm the WORK is done, not just this skill's steps. Verify against the approved plan that every part was built. Part-done → finish the work first.

Every Output row is a claim that a step ran — verify each before writing. Read 📖 `${CLAUDE_SKILL_DIR}/references/exit-gate-rules.md` for the fillability tests per row, verification methods for Knowledge/Task docs, and how to handle failed agents.

**Then read your message from the top:** Is there anything the user has to decide, and is it the first thing they hit? Open questions that survived triage must be asked above — the Product row reads `✅` on a change with an open question only if that question sits in the Output before the Summary section.

## Output

Lead with what the user has to decide; report what was built underneath it. Group by **what was built** (features/changes), not by workflow step (agents/skills). Read 📖 `${CLAUDE_SKILL_DIR}/references/output-structure-rules.md` for the full structure, ordering rules, and template.

**Quick rules:**
- One open question? Use `AskUserQuestion`. Two or more? Use `## Decisions` block.
- Omit rows that have nothing; don't fill with "N/A".
- One change = one `### [Change]` + `### Session`; don't invent structure.
- A change with only ✅ across every row still gets its heading (it tells the reader "here's everything about X").
- Multi-repo: name the repo and branch per change, since the reader's next act is committing and the two repos rarely share a branch name or a push consequence. Say plainly where work in one repo is inert without the other — a queue whose consumer lives in the sibling checkout ships as a no-op if only one side lands.

**Output template:**

```
## Decisions

1️⃣ [what's true now]
   [the question]

(two or more open questions only)

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
