---
name: haiku
description: Run a task, or a named skill, on one or more haiku agents instead of the current session — then verify the result before reporting it. Use for research, bulk reading and survey work, and for mechanical rewrite passes (`condense-claude-md`, `condense-task-doc`, `unhobble-instructions`) where haiku is fast and good at restructuring. Trigger on "haiku this", "run X on haiku", "get haiku to research Y", "use haiku for the condense", "spin up N haikus for Z", "delegate this to haiku", or any request naming haiku as the thing that should do the work. Also fires when the user asks for several agents in parallel on disjoint work and doesn't name a tier. Not for choosing WHICH skill to run — name the skill and this dispatches it; deciding what needs doing is the calling session's job.
---

# Dispatch to haiku

The point of reaching for haiku is the tier itself. The agent carries speed and restructuring judgment you're outsourcing for; use it by resisting the urge to rewrite or second-guess in-session.

`model: "haiku"` only applies to `general-purpose`. Passing it to a registered agent (`code-reviewer`, `Explore`) silently overrides that agent's own frontmatter tier — dispatch `general-purpose` when speed matters.

## What to dispatch

Read the request for three things: whether it names a skill, whether it names a target, and whether it wants more than one agent.

**Your own first tool call here is `Agent(subagent_type: "general-purpose", model: "haiku", prompt: "...")` — never `Skill(...)`.** Calling `Skill(...)` yourself runs the named skill in the current session, which is the opposite of dispatching and defeats the entire point of reaching for this skill. The skill name and target go inside the `Agent` prompt, not into a `Skill` call you make directly: a leading `/skill-name` or a bare skill name in the request means the DISPATCHED AGENT's first action is `Skill(skill: "syafiqkit:<name>")` against the target that follows — that line is an instruction to write into the agent's prompt, not a call for you to make. Anything else is a free-form task — research, a survey, a bulk read — and goes into the prompt as itself.

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

The core principle is **trust the tier to judge structure, not to follow your structure.** A tier that judges well fails when given pre-written conclusions to execute instead. Three patterns break dispatch:

**Over-specification replaces the tier's judgment with outline-following.** Structure decisions — merge vs. split, duplication vs. reuse, enum type vs. string — belong to the tier. A prompt pre-writing conclusions or listing things that "must survive" directs the tier to rewrite toward your outline instead of toward its own. Compare the result against what the skill was supposed to do, not the prompt, to spot it. 📖 `../_shared/references/explore-delegation.md` for why judgment-skills degrade with over-specification.

**A general-purpose agent carries the full toolset and can re-dispatch.** It can spawn a copy of itself running the same skill against the same target, undoing your dispatch while returning a success-shaped report. The first instruction in your dispatch must name what you're outsourcing: "Do the work yourself; do not re-dispatch another agent." This is a fact about tool access the agent cannot derive. 📖 `../_shared/references/agent-may-not-redelegate.md`

**Constraints forbidding what the skill requires strand it.** A skill like `unhobble-instructions` that splits detail into companions must write the destination before cutting from source; a prompt banning new writes leaves only cut available, landing as a lean file pointing at a companion that doesn't exist. Name contested files instead — *don't touch these specific paths*, not *create nothing*. Same applies to banning edits while a skill requires them for its normal operation. Stating what a skill cannot do is rarely the problem; naming what it cannot touch is. **Tell: you are about to trap an agent in an impossible constraint your own prompt created.**

**A removal rule gets applied to whatever resembles it, so state the boundary as a positive.** Justifying removal by what a thing *assumes* is the shape that spreads: "`php artisan` assumes Laravel" is true of the tool and false of the project, so agents given that reason strip the framework's own command names while every report comes back successful, because each deletion genuinely matched the reason given. The same instruction was correct on one corpus and destroyed 400 identifiers across another. Name which side of the line a case falls on — *hardcoded platform syntax goes, names of things that exist here stay* — rather than describing what the wrong side has in common. Expect to verify by count rather than by report.

**Measure the actual convention before stating it.** A style read off two files becomes "this format" in the next sentence; a wrong one directs the agent to break already-correct files. Loop through the target set before it goes in the prompt, or where the tree is inconsistent, say so and let the skill judge each. **Tell: you are about to state a convention you haven't counted.**

Against a clean tree there are no such facts, and the prompt becomes skill name and path. That brevity feels negligent, but what fills the gap is rarely a guardrail — usually a note on a predecessor's attempt or a list to avoid, each a conclusion the agent then works to fill rather than a fact it lacked.

A free-form task with no named skill has no inherited criteria — "audit what's not needed", "clean this up" leave the bar unstated. Where the request names a recognizable shape a skill owns (overconstraint, staleness), route there instead. Where it doesn't, state what bar you're using before dispatch, so a wrong guess costs a line not a full cycle.

## After dispatch

**Wait for the completion notification — don't shadow the agent while running.** Each re-read measures the same facts twice. 📖 `../_shared/references/explore-delegation.md` ("The Waiting Game") for why mid-pass reads corrupt your measurement.

**A new requirement that arrives mid-flight needs a fresh dispatch, not a message to the running agent.** This is a different case from the rule above, not an exception to it: waiting is right, but waiting is not how a constraint reaches an agent that has already formed its plan. A `SendMessage` can land after the agent has concluded, and its report will then be a truthful account of the original brief with no sign the new target ever existed — one run returned exactly that, against a file byte-identical to its baseline. Re-dispatch instead, and open with what the work is (a re-assignment reads as the task the agent already believes it finished). If you do send one anyway, verify the report against the new constraint specifically rather than against the original task, since a report silent on a requirement is not evidence it was applied.

## Verification

**The agent's report is a claim, not evidence.** The parts that read most decisively are often not the parts most likely to be true. Measured across actual runs, confident summaries often contained errors — including one where a headline claim (section renamed, table restructured) simply never happened. A report volunteering preservation ("preserved all references to X") costs nothing to write whether true.

Verification has two main checks for files that changed:

**Did the file change at all?** Did bytes actually move — 📖 `../_shared/references/verifying-a-write-landed.md`. An agent that wrote nothing is the common failure. Re-measure the report's own numbers rather than trusting them; re-counting is the cheapest step. A contradiction (claims lines cut but bytes up, or anchors fixed when new ones added) means the agent did arithmetic it never took.

**Did meaning survive?** Read the file whole, as its reader meets it — not the diff, not the passages the report names. A report describing a rewrite steers you to exactly the places it feels confident. Counting anything at this stage measures shape, and defects usually live in meaning, so the read is the real check on what changed in place.

For fans-out across many files, whole-reads per-file stop happening — each reads coherently, so nothing draws attention, and the pass that removed too much is indistinguishable from the correct pass. There the cheap count is what you have: name the class of thing the rewrite must NOT touch and count instances before and after, per file. A rule aimed at prose will take identifiers with it, so command names, hostnames, class and method names, config keys and flags are usually that class. One such sweep found 400 removed across 55 files after nineteen reports had described the work as a clean conversion — because a summary phrases the correct pass and the destructive one identically, and the count is the only thing that separates them. Then read whole the two or three files the count says lost most.

📖 `references/verifying.md` covers the specific gotchas where confident-sounding claims fall apart: shape-measuring instruments failing silently, pointers existing without content, stale facts surviving untouched, reports that under-claim as well as overstate, and how to distinguish repair from full reversal.

**For relocated content — any `condense-*` split or `unhobble-instructions` pass that extracts to a companion — read 📖 `../_shared/references/verifying-a-relocation.md` before reporting clean.** The severed route is a link whose `../` depth no longer resolves, a documented glob still matching a fraction of what it used to cover, or a destination file never cited by anything that should reference it.

**Report what changed and what you verified.** When the dispatch ran a named skill, name it and state its job in one line before reporting results — "this ran via `unhobble-instructions`, which rewrites a file to convert rigid rules into judgement prose" — rather than presenting the outcome as haiku's own. Two skills are in play (this one dispatches and verifies; the named skill decides structure), and a verdict belongs to whichever skill's criteria actually govern it.
