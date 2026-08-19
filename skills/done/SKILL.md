---
name: done
description: Post-task cleanup - simplify code, review changes, update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize".
---

# Post-Task Workflow

Execute all steps in sequence. The skill is designed to run steps in a single turn without pausing — if you find yourself naming a remaining step rather than invoking it, that's a pause.

**`run_in_background: false` is not a guarantee the call blocks** — [subagents run in the background by default since v2.1.198](https://code.claude.com/docs/en/sub-agents), and [#69691](https://github.com/anthropics/claude-code/issues/69691) reports `false` is ignored in top-level sessions. Pass it anyway to express intent, but expect results as `<task-notification>`s regardless — see Step 1 for what that means in practice.

**User args**: If the user passed instructions with `/done` (e.g., "make sure this works for X"), address those FIRST before proceeding with the standard steps. The user's instructions override defaults. Record what you did about them in the **User Instructions** table of the Output. If no args were passed, omit that table.

**The contract, stated here because the rest of this file may not survive.** A long session usually compacts before reaching `/done`, and only a skill's opening survives that — so read this now rather than expecting the steps below to still be here.

You owe six rows: Simplify · Review · Product · Knowledge · Task docs · Plugin. **Every row is a claim that a step actually ran** — an agent you dispatched with the right kind of prompt, or a skill you invoked *and then confirmed changed something on disk*. Invoking is not updating. A row you cannot substantiate is a step you skipped, so go run it rather than writing `✅`. Then check that anything the user must decide is the first thing they read, not buried under a report.

If you reach the end of this file and the exit gate is missing from your context, that is the compaction — re-read this skill before writing the Output.

## Mode selection (decide first)

Choose a mode that reflects what the session changed, then apply its step cascade below. Mode selection cascades consequences across all downstream steps.

**Docs-only mode** when the diff is entirely documentation — task docs, CLAUDE.md, README, `skills/*/SKILL.md`, `commands/*.md`, `.claude/agents/*.md`, `references/`, and nothing else (`git status --short` shows no `.php`/`.ts`/`.tsx`/etc.). This mode is **additive, not subtractive** — it runs the full agent trio like full mode AND adds a docs-specific check; the agents are not skipped for prose. A doc can still hide a defect the agents catch: instruction markdown a future session *executes* has logic (a gate whose inputs no step computes, a threshold ambiguous against two numbers, an ordering defect *between* steps), and even a plain README can describe a workflow wrong — a referential check alone misses both.
- Step 1: **run all three agents (full-mode counts + partition)** AND run a **referential-integrity check** yourself: no broken `tasks/**/current.md` or `CLAUDE.md` links, renamed/deleted paths fully reconciled (0 stale refs), anchors unique, `> 📖` pointers resolve, and no edited table has a row/callout wedged mid-table (a blank line or prose between `|`-rows splits one GFM table into two).
- Steps 2-5 as normal (temp-artifact scan rarely applies to docs; knowledge capture + task-doc reconciliation still run). **Step 5's Gate B runs in every mode** — a docs-only diff is exactly where a hand-edited skill file hides.
- Output: fill Simplify/Review/Product from the agent runs as in full mode; ALSO report the referential-integrity result (append it to the Review row).
- **The partition must cover the whole SESSION's work, not just the uncommitted diff.** Code you already committed this session was never agent-reviewed, and the working tree may show only `.md` changes — so count files from `git show --stat <this-session's commit>` + the uncommitted diff and partition all of them. The tell: a commit you authored this session in `git log`, but `git status --short` lists only docs.

**Infra-only mode** when the diff is **entirely code that configures or operates an environment**, with no application code. CI workflows, `docker-compose*.yml`/`Dockerfile`, build config and nginx/env config are the common shapes, but the boundary is a mechanism rather than that list: infra is code whose failures are SILENT and whose blast radius is an environment rather than a user journey — nothing in the test suite would fail if the file were wrong. That test also admits the provisioning, promotion and guard scripts that sit beside the config — an ops script or a safety-gate check is infra by this reasoning even though no enumeration of config formats would name it, and those files are where the reviewer earns its place, since they carry real logic that nothing else exercises.
- Step 1: **reviewer ONLY**, in the usual case. Skip the product reviewer (no user journey). Size-independent — the trigger is file KIND, not count. Prompt the reviewer adversarially: give it the change's PURPOSE, what it must not break, ask for empirical verification. Two call sites of the same command can need opposite treatments.
- **Add the simplifier when the infra is imperative rather than declarative.** Skipping it is right for compose/nginx/YAML, where there is no logic to DRY. A shell or ops script is different: a promote/rollback pair, a setup/teardown pair, any two lists that must stay in step are exactly the duplication a simplifier catches, and a reviewer only finds that drift if you happened to prompt it about that risk.
- Steps 2-5 as normal. Output: mark Product as ➖ "infra-only", and Simplify the same way unless the imperative-infra case above brought it in.
- **Exception — a compose/env change that FLIPS A FEATURE FLAG on is NOT infra-only**; it exposes a user-facing capability → run the product reviewer.

**Ops-only mode** when the session changed a **running system rather than the repo** — provisioning/seeding an environment, a data migration or backfill, a deploy or config flip applied out-of-band — and produced **no repo diff and no session commit** in any repo.

- Step 1: **skip all three code agents** — there is no repo code to review. Do NOT substitute the docs-only integrity check either; nothing was edited yet at that point.
- **The state you changed is the deliverable, so verification is a READ-BACK, not an agent.** Query the live system for each value the session claimed to set and report what it returned — an action's own return value is not evidence. This replaces Step 1's Output row.
- Steps 2-5 as normal, and **Step 4 is the whole point**: a live-system change leaves no trace in `git log`, so the task doc is the only place it exists. Record what changed, in which environment, and anything synthetic/temporary that a later reader must not mistake for real.
- Output: mark Simplify/Review/Product as ➖ "ops-only, no repo diff"; report the read-back on the Review row.

**Full mode** (default) for everything else — multi-file features, multi-domain sessions, anything with external inputs (WhatsApp/ClickUp pastes) that may need new doc stubs. When in doubt, full.

**An empty `git status --short` doesn't by itself select a no-code mode.** It means: work already committed (full mode, use git variants), another writer's tree, or genuinely no repo changes (ops-only). Name which before treating "nothing to review" as the answer.

When git errors (`not a git repository` or no first commit), don't assume ops-only — an unversioned project still has code. Run **full mode** with substitutes per 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/verifying-a-write-landed.md` (mtime for changed-file list, re-read/grep for verification).


## Step 1: Simplify + Review + Product Review (parallel)

The three roles see the diff through different lenses:
- **Simplifier** — is the code *clean*? (duplication, readability, consistency)
- **Reviewer** — is the code *correct*? (bugs, security, logic errors, conventions)
- **Product reviewer** — is the *feature* complete and valuable? (missing journeys, dead-end flows, UX/business gaps — the class of miss a line-level diff structurally cannot catch). Runs in full mode only, and only if a project `.claude/agents/product-reviewer.md` exists (skip silently if absent).

### Ownership & Partition

Establish which files belong to this session before spawning agents — judge by diff *content*, since the harness auto-stages your own writes into the same shape a peer's take. `ListAgents` will tell you a peer session is live and is worth a heads-up before you bump a version, but it **cannot** say which checkout that peer is in, so it never substitutes for reading the diff.

**Ban these verbs in every agent prompt you write: `stash`, `checkout -- .`, `reset`, `clean`, `restore`, `commit`, `push`.** A file partition scopes what an agent *reads*, never what a `git` command it runs *touches* — so one agent reaching for a clean baseline can collide with your uncommitted work or a peer's. Naming the verbs is the guard; a prompt gesturing at "nothing destructive" reads as followed right up to the collision.

Read 📖 `${CLAUDE_SKILL_DIR}/references/owner-and-partition.md` for the ownership decision process and how to handle contested files.

Once you've settled ownership, emit all applicable agents in **ONE message** with no prose before the `Agent` calls — no count, no plan, no "spawning N agents now". The Emission rule is non-negotiable: open with the first call, emit the rest back-to-back. Narration ends the message early.

### Agents to run

**Check for project agents first:**
```
Glob: .claude/agents/code-simplifier.md
Glob: .claude/agents/code-reviewer.md
Glob: .claude/agents/product-reviewer.md
```

| Agent | Project agent found? | Fallback subagent_type |
|-------|---------------------|------------------------|
| Simplifier | `subagent_type: "code-simplifier"` | `"code-simplifier:code-simplifier"` |
| Reviewer | `subagent_type: "code-reviewer"` | `"feature-dev:code-reviewer"` |
| Product reviewer (full mode only) | `subagent_type: "product-reviewer"` | *(none — skip if the project file is absent)* |

Run the Glob first every time — don't assume.

**`browser-verifier` is NOT part of this step — it is opt-in, never auto-spawned.** Spawn it **only when the user asked in words** — "the diff touches UI so they'd want runtime proof" is an inference. A UI diff is a reason to offer, never a reason to spawn. See `references/browser-verification.md`.

### Agent Count & Prompting

Count changed files using the variants in 📖 `${CLAUDE_SKILL_DIR}/references/git-variants-by-state.md`, then read 📖 `${CLAUDE_SKILL_DIR}/references/emission-and-agent-counts.md` for the scaling table, partitioning rules, and what each agent prompt needs. The guide covers all role-specific prompting and how to supply high-value details (unsure judgement calls, what you've already verified, what you didn't check).

**While they run:** Work on something disjoint. The verification agenda below is rich and already in your head; starting it early duplicates the agents and destroys the check that makes delegating safe. Waiting costs nothing and polling costs the delegation. 📖 `${CLAUDE_SKILL_DIR}/../_shared/references/explore-delegation.md`

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
