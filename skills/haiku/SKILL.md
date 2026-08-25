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

**Keep it minimal: skill name (if any), target path, and only facts the agent cannot derive.**

Start with what you're outsourcing. If it's a named skill, cite it in the prompt and name its spec if it has one (the skill's own published shape). The agent then judges whether to follow the spec or invoke the skill — both legitimate calls depending on task scope. Avoid pre-writing structure conclusions. A tier that judges well fails when given outlines to follow instead; name constraints rather than designs — *don't edit these three files*, not *must not create new files* — since the second bans what a skill may require for its normal operation.

A skill like `unhobble-instructions` has published criteria (rule shape, fact vs. constraint, reference routing). Cite those so verification can check against them rather than against what you guessed the skill should do.

**For general-purpose agents: state "Do the work yourself; do not re-dispatch another agent."** The agent carries full tool access and can re-dispatch, which undoes your dispatch while returning a success-shaped report. That clause is a non-derivable fact about the current session. 📖 `../_shared/references/agent-may-not-redelegate.md`

**Measure conventions in the actual target before stating them.** A style read off two files becomes "this format" in the next sentence; a wrong convention steers the agent into breaking files. Loop through the target set first or say so and let the skill judge each.

## Partition for concurrency

Fan out when work is genuinely disjoint: independent files, separate unrelated questions, a survey across separate areas. Partition so no two agents touch the same file. Give each agent a single task — one skill against one target — rather than chains within a prompt.

Two skills in one prompt overwrite each other's accounts; dispatch them as two separate agents running in parallel. The same applies to one skill across two files — it becomes four calls total (two agents, two files, two targets per agent), costs nothing extra, and gains a checkable before/after pair for each.

Agents whose targets don't overlap can go out together in one message (spawn them all at once, no prose before the calls). Anything waiting on another agent's file has to serialize — say which agents run parallel and why.

📖 `../_shared/references/explore-delegation.md` → "Spawning multiple agents" for the mechanics of one-message batching.

## After dispatch: wait for the completion notification

**Never poll or shadow the agent.** The temptation while waiting is to read the delegated files yourself — it feels like progress and costs the delegation twice. You pay for the same facts inline, and the agent's result lands later. There is no waiting call to make; end the turn and the harness re-invokes you with the result.

If you need to read something right now, the delegation was scoped too wide — spawn fewer agents instead. 📖 `../_shared/references/explore-delegation.md` → "The Waiting Game" for why shadowing destroys verification.

**A new requirement that arrives mid-flight needs a fresh dispatch, not a message to the running agent.** A `SendMessage` can land after the agent has already concluded, and its report will then be a truthful account of the original brief with no sign the new target existed. Re-dispatch as a separate task, opening with what the work is — a re-assignment reads as the task the agent believes it finished.

## Verification

**The agent's report is a claim, not evidence.** Run these checks in order:

### 1. Did the file change at all?

Did bytes actually move? `git diff HEAD` against your baseline. A file reading as rewritten while bytes are identical is the common failure. An agent that wrote nothing is untrustworthy throughout and gets re-dispatched. 📖 `../_shared/references/verifying-a-write-landed.md` for how to check, and why the report describing a change is never evidence it happened.

### 2. Does meaning survive?

Read the current file whole, as its reader meets it — not the diff, not the passages the report highlights. A term-survival sweep (grepping for words) measures that words survived, never that their sentences mean the same thing. A rewrite inverting a formula while keeping every label passes completely until you read the sentence and derive the claim.

**For a skill's own work, check against its spec, not against what you guessed it should do.** A rewrite skill has published criteria; verify against those. If the prompt cited a reference like `../unhobble-instructions/references/verifying.md`, consult it before reporting results — that reference answers what shape a clean pass has for THIS skill's own work.

### 3. For relocated content: check pointers and destinations

When a pass moves content to a companion (a `condense-*` split or `unhobble-instructions` extraction), verify the destination holds the moved content. A pointer resolving without content at the other end is the most common silent failure.

**Check path depth carefully.** A relative pointer from a SKILL.md uses `../` syntax that differs by depth. Resolve it from the citing file's directory: `ls ../reference-file.md` from the SKILL.md's own folder, not from repo root. 📖 `../unhobble-instructions/references/routing-content.md` covers clustering and pathfinding before writing the destination.

### 4. Re-measure the agent's own numbers

A report claiming contradictory things (lines cut but bytes up, anchors fixed when new ones added) has done arithmetic it never took. Re-count.

### 5. When to revert vs. patch

A contained gap (one passage, one dead pointer, facts you can name) gets patched from the snapshot — restoring the fact in the new file's shape, not pasting bytes verbatim. A systemic failure (whole sections gone, contradicting numbers, untrustworthy report) gets reverted and re-dispatched.

**Ask what you would put in a re-dispatch prompt.** A specific fact list is the patch instructions already; reverting throws away the good structure to earn it again. Weigh what the revert discards against what the pass got wrong.

⚠️ **Before discarding or reverting, open 📖 `references/verifying.md` — that reference covers when a count is not a verdict and when a whole-file read is required before proposing an irreversible act.** The rule you've already seen four times is the one most often violated at this moment. **Tell: you are about to overwrite an agent's output and your last tool call was a `grep`, `wc`, or `comm`, not a `Read`.**

**Snapshot the agent's OUTPUT before reverting** — the pre-dispatch copy preserves what the file was, but the rewrite is what you're judging. Without it, the verdict becomes unfalsifiable.

### Reporting verification

**Name which rules moved, not how much the file shrank.** A byte count is the instrument you used to find problems; it rarely IS the problem and opening on it reframes a content question as a size one. State which rules no longer survive and which are recoverable elsewhere, then give magnitude as support.

For a named skill, open with its name and its job in one line ("ran via `unhobble-instructions`, which converts rules into judgement prose"), then report results. Two skills are in play (this one dispatches; the named skill decides structure), and the verdict belongs to whichever skill's criteria govern it.

---

## For syafiqkit plugin maintainers

When the target is a syafiqkit file, additional conventions apply: ownership check before patching (is this a consumer-side install?), shared-mechanism grep before assuming a fix is single-file, and version bump + CHANGELOG entry post-dispatch. 📖 `syafiqkit:update-plugin` covers them. For third-party files, they don't apply.

## References

- 📖 `references/verifying.md` — detailed gotchas where confident claims fall apart (shape-measuring failures, stale content, pointer verification)
- 📖 `../_shared/references/explore-delegation.md` — batching mechanics, partition strategy, shadowing pitfalls, count verification
- 📖 `../_shared/references/verifying-a-relocation.md` — when content moves to a companion, what can break and isn't visible in the rewritten file
- 📖 `../unhobble-instructions/references/verifying.md` — when dispatching a rewrite skill, shape/meaning distinction, anchor/identifier sweep traps
