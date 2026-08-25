---
name: haiku
description: Run a task, or a named skill, on one or more haiku agents instead of the current session — then verify the result before reporting it. Use for research, bulk reading and survey work, and for mechanical rewrite passes (`condense-claude-md`, `condense-task-doc`, `unhobble-instructions`) where haiku is fast and good at restructuring. Trigger on "haiku this", "run X on haiku", "get haiku to research Y", "use haiku for the condense", "spin up N haikus for Z", "delegate this to haiku", or any request naming haiku as the thing that should do the work. Also fires when the user asks for several agents in parallel on disjoint work and doesn't name a tier. Not for choosing WHICH skill to run — name the skill and this dispatches it; deciding what needs doing is the calling session's job.
---

# Dispatch to haiku

The point of reaching for haiku is the tier itself — speed and restructuring judgment outsourced. Use it by resisting the urge to rewrite or second-guess.

## When to dispatch

A dispatch makes sense when the work is either pure mechanical (gathering, counting, bulk reading) or a rewrite where speed and breadth matter more than depth. The tier carries those strengths as defaults; the prompt should name only facts the agent cannot derive.

**Your own first tool call is `Agent(subagent_type: "general-purpose", model: "haiku", prompt: "...")`.** Never call `Skill(...)` yourself — that runs the skill in the current session, opposite of dispatching. If the request names a skill, that skill name goes *inside* the prompt as an instruction to the dispatched agent ("First run `/skill-name`"), not as a direct tool call you make. Anything else is a free-form task (research, audit, bulk read) and goes into the prompt as itself.

**Read the request for three things:** Does it name a skill, a target, and whether more than one agent is needed? That shapes what goes into your prompt.

## Before dispatch: snapshot if files will change

For any task that writes files, take a baseline before dispatch:

1. **Read the targets' uncommitted diff** — work already present from another session will freeze into your baseline as if it were the committed state, and every downstream check then measures the agent against wrong-starting material. Name any contested files in the prompt as context. 📖 `../_shared/references/diff-ownership.md` distinguishes what to attribute to whom.
2. **Snapshot the targets to scratchpad** and record `wc -c`. This preserves what the files WERE; if verification later points toward a patch or revert, snapshot what the agent MADE afterward as well.

A read-only task needs no snapshot.

## Writing the prompt

**Keep it minimal: skill name (if any), target path, only facts the agent cannot derive.**

Cite what you're outsourcing. For a named skill, include its spec if it has one — the agent judges whether to follow it or invoke the skill directly. Don't pre-write structure; name constraints not designs — *don't edit these three files*, not *must not create new files*, since the second bans what a skill may need.

For a skill like `unhobble-instructions` with published criteria, cite them so verification checks against the spec rather than guesswork.

**For general-purpose agents:** add "Do the work yourself; do not re-dispatch another agent." 📖 `../_shared/references/agent-may-not-redelegate.md`

**For research:** Ask for a real URL against every claim. Explicitly name "COULD NOT RETRIEVE: `<url>` — what happened" when a page blocks or fails. Label anything known only from training data as such. Say plainly that "not found" is valid. This exists because an agent with no place to file a failed retrieval invents one, producing uniformly complete prose that is partly fabricated.

**For multi-file targets:** measure the actual conventions before stating them, so the agent doesn't break files based on wrong guesses. Loop through the target set first or say so.

## Partition for concurrency

Dispatch independently when work is genuinely disjoint — separate files, separate questions, separate areas. Partition so no two agents touch the same file. Each agent gets one task (one skill, one target), not chains within a prompt.

Two skills in one prompt overwrite each other's accounts — dispatch as separate parallel agents instead. Same for one skill across two files: four calls total (two agents × two files) costs nothing extra and gains a checkable before/after pair.

Agents with non-overlapping targets go out together in one message (all at once, no prose before the calls). Anything waiting on another agent's output has to serialize — state which run parallel and why.

📖 `../_shared/references/explore-delegation.md` → "Spawning multiple agents" for batching mechanics.

## After dispatch: wait for the completion notification

Don't poll or shadow the agent — reading the delegated files yourself feels like progress but costs the delegation twice while the agent's work is still in flight. End the turn; the harness re-invokes you with the result.

If you need immediate reading, scope was too wide — dispatch fewer agents instead. 📖 `../_shared/references/explore-delegation.md` → "The Waiting Game" for why shadowing breaks verification.

**A new requirement arriving mid-flight needs a fresh dispatch, not a message to the running agent.** A SendMessage landing after the agent concludes produces a truthful account of the original brief with no trace the new target existed. Re-dispatch as a separate task.

## Verification

**The agent's report is a claim, not evidence.** Take the raw before/after counts as your first act, before reading the report's framing. A stated delta anchors you; a wrong one reframes what you then go looking for.

⚠️ **For research dispatches:** Checks 1–4 (below) all no-op since there's no artifact to diff. Verify the CLAIMS instead by opening sources yourself. A fabricated finding and a real one both read as prose; the fabrication runs toward *more* convincing because inventing a source costs nothing while retrieving one can fail. Spot-check before relaying by opening two or three cited URLs — especially any claim that decides something — and confirm which host or environment actually answered. Ask the report to separate what was retrieved from what was not, since an agent that must file "COULD NOT RETRIEVE" has somewhere to put a gap other than a guess.

### 1. Did the file change at all?

Did bytes actually move? `git diff HEAD` against your baseline. A file reading as rewritten while bytes are identical is the common failure. An agent that wrote nothing is untrustworthy throughout and gets re-dispatched. 📖 `../_shared/references/verifying-a-write-landed.md` for how to check, and why the report describing a change is never evidence it happened.

### 2. Does meaning survive?

Read the current file whole, as its reader meets it — not the diff, not the passages the report highlights. A rewrite inverting a formula while keeping every label passes completely until you read the sentence and derive the claim.

Each absent fact costs you three things before it can enter the report: the section you expected it in, the lines you read there, and why the prose you found doesn't cover it. Produce those and a search corrects itself — either the fact is there reworded, or it's genuinely absent. 📖 `references/verifying.md` for the failure modes.

For a skill's own work, check against its spec. A rewrite skill has published criteria; verify against those — consult the reference the prompt cited if one exists.

### 3. For relocated content: check pointers and destinations

When a pass moves content to a companion (a `condense-*` split or `unhobble-instructions` extraction), verify the destination holds the moved content. A pointer resolving without content at the other end is the most common silent failure.

**Check path depth carefully.** A relative pointer from a SKILL.md uses `../` syntax that differs by depth. Resolve it from the citing file's directory: `ls ../reference-file.md` from the SKILL.md's own folder, not from repo root. 📖 `../unhobble-instructions/references/routing-content.md` covers clustering and pathfinding before writing the destination.

### 4. Re-measure the agent's own numbers

A report claiming contradictory things (lines cut but bytes up, anchors fixed when new ones added) has done arithmetic it never took. Re-count. Where a rewrite skill requires the agent to reconcile its own delta, that check ran inside the agent's context and reached you as a claim — so run it yourself: if bytes left the target, confirm by reading whichever file the report says gained them. A drop with no destination is deletion whatever the pass called it.

### 5. When to revert vs. patch

A contained gap (one passage, one dead pointer, facts you can name) gets patched from the snapshot — restoring the fact in the new file's shape, not pasting bytes verbatim. A systemic failure (whole sections gone, contradicting numbers, untrustworthy report) gets reverted and re-dispatched.

Ask what would go in a re-dispatch prompt. A specific fact list is the patch instructions already; reverting throws away the good structure to earn it again. Weigh what the revert discards against what the pass got wrong. If you can list every fact that needs naming in a re-dispatch, you are holding the patch instructions — patch. 📖 `references/verifying.md` for the enumeration test and snapshot strategy.

### Reporting what you found

Name which rules moved rather than how far the file shrank. A byte count is the instrument that found the problem and rarely is the problem, so opening on it reframes a content question as a size one — state which rules no longer survive and which are recoverable elsewhere, then give magnitude as support. Where a named skill did the work, open with its name and its job in one line ("ran via `unhobble-instructions`, which converts rules into judgement prose") before the results, since two skills are in play and the verdict belongs to whichever one's criteria govern it.


---

## For syafiqkit plugin maintainers

When dispatching on a syafiqkit file, additional conventions apply: ownership check before patching, shared-mechanism grep before assuming single-file scope, and version bump + CHANGELOG entry after dispatch. 📖 `syafiqkit:update-plugin` covers them.

## References

- 📖 `references/verifying.md` — detailed gotchas where confident claims fall apart (shape-measuring failures, stale content, pointer verification)
- 📖 `../_shared/references/explore-delegation.md` — batching mechanics, partition strategy, shadowing pitfalls, count verification
- 📖 `../_shared/references/verifying-a-relocation.md` — when content moves to a companion, what can break and isn't visible in the rewritten file
- 📖 `../unhobble-instructions/references/verifying.md` — when dispatching a rewrite skill, shape/meaning distinction, anchor/identifier sweep traps
