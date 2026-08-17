---
name: haiku
description: Run a task, or a named skill, on one or more haiku agents instead of the current session — then verify the result before reporting it. Use for research, bulk reading and survey work, and for mechanical rewrite passes (`condense-claude-md`, `condense-task-doc`, `unhobble-instructions`) where haiku is fast and good at restructuring. Trigger on "haiku this", "run X on haiku", "get haiku to research Y", "use haiku for the condense", "spin up N haikus for Z", "delegate this to haiku", or any request naming haiku as the thing that should do the work. Also fires when the user asks for several agents in parallel on disjoint work and doesn't name a tier. Not for choosing WHICH skill to run — name the skill and this dispatches it; deciding what needs doing is the calling session's job.
---

# Dispatch to haiku

The point of reaching for haiku is the tier itself. The agent carries speed and restructuring judgment you're outsourcing for; use it by resisting the urge to rewrite or second-guess in-session.

`model: "haiku"` only applies to `general-purpose`. Passing it to a registered agent (`code-reviewer`, `Explore`) silently overrides that agent's own frontmatter tier — dispatch `general-purpose` when speed matters.

## What to dispatch

Read the request for three things: whether it names a skill, whether it names a target, and whether it wants more than one agent.

A leading `/skill-name` or a bare skill name means the agent's first action is `Skill(skill: "syafiqkit:<name>")` against the target that follows. Anything else is a free-form task — research, a survey, a bulk read — and goes over as itself.

**Partition for concurrency, but never for complexity depth.** Fan out when the request asks for it ("3 agents", "split this") or when the work is genuinely disjoint: several independent files, several unrelated questions, a survey across separate areas. Partition so no two agents touch the same file, and give each its own slice rather than the whole list. One coherent task on one file stays a single agent — splitting it produces conflicting rewrites of the same bytes.

Give each agent a single task — one skill against one target — rather than a chain. Two skills in one prompt, or one skill across two files, is where haiku starts reporting work it didn't finish: a later step in the chain overwrites the account of an earlier one. Two skills over two files is four calls, not one, and it costs nothing extra in total work — what it gains is a checkable before/after pair for each.

Agents whose targets don't overlap can go out together in one message, while anything queueing behind a file another agent is still writing has to wait. A user asking for sequential work usually means "don't let these collide"; the same-file legs serialize and the disjoint ones can still run at once. Worth saying which you did and why.

📖 `../_shared/references/explore-delegation.md` for batching mechanics and the one-message rule.

## Before dispatch — establish a baseline if files will change

For any task that writes files, take a snapshot before dispatch. Without it, you're measuring only against the agent's own report.

**First, read the targets' uncommitted diff.** Work already present — another session or a forgotten edit — will freeze into your baseline as if it were the committed state, and every downstream check then measures the agent against wrong-starting material. 📖 `../_shared/references/diff-ownership.md` distinguishes what to attribute. Where contested work exists, name it in the prompt as a non-derivable fact, or wait until the tree settles.

**Then snapshot every target** (`cp` to scratchpad) and record `wc -lc`. A read-only task needs no snapshot.

## Writing the prompt

**Keep it minimal: skill name (if any), target path, and only facts the agent cannot derive.** Everything else wastes the tier.

The core principle is **trust the tier to judge structure, not to follow your structure.** This manifests as three specific traps:

**Specifying structure in the prompt replaces the agent's judgment with outline-following.** A skill that rewrites code owns decisions about merge vs. split, duplication vs. reuse, enum type vs. string — each choice the prompt names is a choice the agent doesn't make. Pre-writing conclusions, listing things that "must survive," or restating the skill's own logic produces a confident report executing your outline, which is indistinguishable from the skill working. Compare the result against what the skill was supposed to do, not the prompt, to spot it. 📖 `../_shared/references/explore-delegation.md` for why judgment-skills degrade with over-specification.

**`general-purpose` re-dispatches silently.** It carries the full toolset and will spawn a copy of itself running the same skill against the same target, undoing your dispatch while returning a success-shaped report. This is not a pre-written conclusion; it's a fact about tool grants the agent cannot derive. One guard line is required: "Do the work yourself; do not re-dispatch another agent." 📖 `../_shared/references/agent-may-not-redelegate.md`

**Constraints forbidding what the skill requires strand it.** A skill like `unhobble-instructions` that splits detail into companions must write the destination before cutting from source; a prompt banning new writes leaves only cut available, landing as a lean file pointing at a companion that doesn't exist. Name contested files instead — *don't touch these specific paths*, not *create nothing*. Same applies to banning edits while a skill requires them for its normal operation. **Tell: you are about to trap an agent in an impossible constraint your own prompt created.**

**Measure the actual convention before stating it.** A style read off two files becomes "this format" in the next sentence; a wrong one directs the agent to break already-correct files. Loop through the target set before it goes in the prompt, or where the tree is inconsistent, say so and let the skill judge each. **Tell: you are about to state a convention you haven't counted.**

Against a clean tree there are no such facts, and the prompt becomes skill name and path. That brevity feels negligent, but what fills the gap is rarely a guardrail — usually a note on a predecessor's attempt or a list to avoid, each a conclusion the agent then works to fill rather than a fact it lacked.

A free-form task with no named skill has no inherited criteria — "audit what's not needed", "clean this up" leave the bar unstated. Where the request names a recognizable shape a skill owns (overconstraint, staleness), route there instead. Where it doesn't, state what bar you're using before dispatch, so a wrong guess costs a line not a full cycle.

## After dispatch

**Wait for the completion notification — don't shadow the agent while running.** Re-reading or re-grepping target files inline pays for the same facts twice. 📖 `../_shared/references/explore-delegation.md` ("The Waiting Game") for why mid-pass reads corrupt the measurement.

## Verification

**The agent's report is a claim, not evidence.** The parts that read most decisively are often not the parts most likely to be true. Measured across actual runs, confident summaries often contained errors — including one where a headline claim (section renamed, table restructured) simply never happened. A report volunteering preservation ("preserved all references to X") costs nothing to write whether true.

Verification has two phases for files that changed:

**Phase 1: Did the file change at all?** Did bytes actually move — 📖 `../_shared/references/verifying-a-write-landed.md`. An agent that wrote nothing is the common failure. Re-measure the report's own numbers rather than trusting them; re-counting is the cheapest step. A contradiction (claims lines cut but bytes up, or anchors fixed when new ones added) means the agent did arithmetic it never took.

**Phase 2: Did meaning survive?** Read the file whole, as its reader meets it — not the diff, not the passages the report names. A report describing a rewrite steers you to exactly the places it feels confident. Counting anything at this stage (surviving identifiers, anchors, rows) measures shape; defects that matter live in meaning. This is the only real check.

📖 `references/verifying.md` covers the specific gotchas where confident-sounding claims fall apart: shape-measuring instruments failing silently, pointers existing without content, stale facts surviving untouched, and how to distinguish repair from full reversal.

**Report what changed and what you verified.** When the dispatch ran a named skill, name it and state its job in one line before reporting results — "this ran via `unhobble-instructions`, which rewrites a file to convert rigid rules into judgement prose" — rather than presenting the outcome as haiku's own. Two skills are in play (this one dispatches and verifies; the named skill decides structure), and a verdict belongs to whichever skill's criteria actually govern it.
