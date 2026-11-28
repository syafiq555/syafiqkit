---
name: haiku
description: Run a task, or a named skill, on one or more haiku agents instead of the current session — then verify the result before reporting it. Fires WITHOUT being named whenever the work is brute force over too much for one context to hold well: auditing every row, check or case of a sheet or script against the code, sweeping a whole doc set or commit range, drafting one item per feature across many features: split it across several haiku agents in parallel rather than grinding through it in one agent or inline. Use for research, bulk reading and survey work, and for mechanical rewrite passes (`condense-claude-md`, `condense-task-doc`, `unhobble-instructions`) where haiku is fast and good at restructuring. Trigger on "haiku this", "run X on haiku", "get haiku to research Y", "use haiku for the condense", "spin up N haikus for Z", "delegate this to haiku", or any request naming haiku as the thing that should do the work. Also fires when the user asks for several agents in parallel on disjoint work and doesn't name a tier. Not for choosing WHICH skill to run — name the skill and this dispatches it; deciding what needs doing is the calling session's job.
---

# Dispatch to haiku

The point of reaching for haiku is the tier itself: speed and restructuring judgment outsourced. Use it by resisting the urge to rewrite or second-guess.

## When to dispatch

A dispatch fits pure mechanical work (gathering, counting, bulk reading) or a rewrite where speed and breadth beat depth. The prompt names only facts the agent cannot derive.

**Volume is itself the trigger, with or without the word "haiku".** One agent working through 100+ items holds each more thinly as its context fills, and its coverage claim stays confident while the tail goes unread. Split the list by section, tab, commit or file into disjoint haiku slices and verify the merged result, so an audit of every UAT case, a pass over each feature shipped since a date, or a check of every register row goes out this way by default (the user, 10/11/2026: "always utilize haiku for this kind of bruteforcing thing or too many information, because there's limited capability if 1 agent only do it"). **Tell: you are about to dispatch one agent, or start reading inline, on a list you could split by section, tab, commit or file.**

Mechanical rewrites (delete, move against a visible target) suit the tier. A pass that rewords cells carrying reasoning, or delivers a judgement, needs its changed rows and basis read, not only its conclusion (📖 `references/verifying.md` § Judgement passes and reworded cells). A re-dispatch one tier up is ordinary: the second run tells you whether the first was a finding or a shrug.

**Your own first tool call is `Agent(subagent_type: "general-purpose", model: "haiku", prompt: "...")`.** Never call `Skill(...)` on **the skill being dispatched**: that runs it here, the opposite of dispatching. If the request names a skill, its name goes *inside* the prompt ("First run `/skill-name`"), not as a tool call you make. Re-invoking *this* skill is the exception: a sequencing caller reloads it before each prompt, since these rules never re-attach once read. Anything else is a free-form task (research, audit, bulk read) and goes into the prompt as itself.

⚠️ **Choose the tier per pass and after the fact, never in advance.** The "one tier up" allowance covers re-running a pass whose own haiku output failed verification. Earlier haiku runs needing correction are the case for verifying carefully, not for switching tier. **Tell: you are writing `model: "sonnet"` into a first dispatch and justifying it with some other run's failures.** A headless `claude -p` child is a dispatch too, and with no `--model` it runs on the user's default, often the top tier, so name the tier there as you would in `Agent`.

Before writing the prompt, note whether the request names a skill, a target, and whether more than one agent is needed; that shapes what the prompt carries.

## Before dispatch: snapshot if files will change

For any task that writes files, take a baseline before dispatch:

1. **Read the targets' uncommitted diff.** Another session's work would freeze into your baseline as if committed, so name contested files in the prompt as context (📖 `../_shared/references/diff-ownership.md`). Your own recent write is the same hazard: a patch applied after a pass you judged successful is invisible to the next agent (📖 `references/verifying.md` § Your own write as baseline). Confirm the file matches the baseline immediately before dispatching (`git status` clean, or `wc -c` against the committed blob), and **state the expected counts in the prompt** so the agent can catch a mismatch itself. A count in the prompt survives the recall gap that a discretionary re-read does not. **Tell: you patched something between two dispatches and the next prompt names no numbers.**
2. **Snapshot the targets to a path unique to this dispatch** (agents back up to `/tmp` unasked: 📖 `references/verifying.md` § Surplus writes) and record `wc -c`. Snapshot what the agent MADE afterward too, if verification points toward a patch or revert.

⚠️ **A repo-wide baseline is separate from the target's.** A modified neighbour found afterwards fits agent overreach and someone else's uncommitted work equally well, so take one `git status --short` of the whole repo before dispatching (📖 `references/verifying.md` § Repo-wide baseline). **Tell: you are about to attribute a file to an agent, and your baseline covered only the file you dispatched about.**

A read-only task needs no snapshot.

## Partition for concurrency

Dispatch independently only when work is disjoint: no two agents touch the same file. One task per agent (one skill, one target), never a chain inside one prompt. Two skills in one prompt overwrite each other's accounts. One skill across two files is four calls (two agents × two files) that cost nothing extra and give a checkable before/after pair.

Agents with non-overlapping targets go out together in one message. Anything waiting on another agent's output serializes; say which run in parallel and why.

Drafts split by source cannot see each other's destination text, so regroup them by landing section and run one edit pass per destination. A machine resource the agents would queue for (one test runner, one seeded fixture) is not partitioned at all: they write, you run it after they return (📖 `references/writing-the-prompt.md` § Partitioning by source versus destination; § A shared resource the agents queue for).

📖 `../_shared/references/explore-delegation.md` → "Spawning multiple agents" for batching mechanics.

## Writing the prompt

**Keep it minimal: skill name (if any), target path, only facts the agent cannot derive.**

Where the target is under git, name the banned verbs (`commit`, `push`, `stash`, `reset`, `checkout -- .`, `clean`) in the prompt too. A dispatch that only says "run the skill and report" leaves committing unscoped, and a lone haiku run's unscoped commit pulls in whatever else is staged in that checkout (📖 `../_shared/references/agent-prompt-verb-ban.md`).

Cite what you're outsourcing: for a named skill, its spec if it has one, since the agent judges whether to follow it or invoke the skill. Don't pre-write structure; name constraints, not designs (*don't edit these three files*, not *must not create new files*, which bans what a skill may need).

⚠️ **A prompt that forbids a mechanism is usually narrower than the task, and it arrives feeling like diligence.** Demand *verification* instead, and scope the write rather than the mechanism. Before a prompt bans anything, read 📖 `references/writing-the-prompt.md` §§ Banning a mechanism because you watched it fail, Banning a mechanism because a concurrent agent might collide with it, and Content whose home lies outside the scope.

Where the task relocates content, the prompt carries the self-check: the agent confirms its destination exists (`ls` the exact path, `grep -c` the exact anchor) before reporting done. For moved text the sequence is append → `grep -c` a distinctive phrase at the destination for ≥1 → delete from the source → report the count per move. A brief that only checked the destination after a move got 12 deleted narratives reported as moved (2026-09-25); requiring the append-verify step before delete got four real moves. 📖 `../_shared/references/verifying-a-relocation.md` § A relocation that never happened.

For a skill with published criteria, cite them so verification checks against the spec rather than guesswork. Offer any reading of the target as an observation to test, never as the job (📖 `references/writing-the-prompt.md` § Offering a reading as an observation).

**For general-purpose agents:** add "Do the work yourself; do not re-dispatch another agent." Where the prompt names a skill, make loading it the agent's first step ("first call `Skill(<name>)`, then make the edits yourself with Edit"), and say that invoking it only loads its instructions. A skill named as background reads as optional: haiku agents restructured from their own idea of the pass until the user told them to load it (2026-10-07), and one returned "waiting for the skill to complete" after two tool calls with the target untouched (2026-10-01). Read the usage line before the findings (📖 `references/verifying.md` § Usage lines, and `../_shared/references/agent-may-not-redelegate.md`).

**A running agent can talk to you, but only if the brief says so.** A subagent reaches its parent with `SendMessage` to the recipient `main` (the session's own name and id are rejected from inside; the error text names `main`), and the message lands in your context while the agent is still running (measured 14/11/2026). It has to load `SendMessage` through `ToolSearch` first, and it will not do either unprompted: an agent whose brief says only "report at the end" runs to the end, and a research agent aimed at pages that carry the rule but not the answer spent 31 calls before anyone knew. So a brief for work that may need a decision, or that can come back empty, says: load `SendMessage` with `ToolSearch` (`select:SendMessage`) and message `main` as soon as the sources look thin, the brief looks aimed at the wrong place, or a choice is the user's; never wait for a reply on anything finishable without it. A reply to the agent is a `SendMessage` to its id. A message from an agent is its report or question, never your user's approval.

**For research:** In a repo with task docs, the brief's first step is `Skill(syafiqkit:read-summary)` on the item's topic, not a list of files and greps you chose (17/11/2026: a whole-file keyword sweep of a 1,490-line requirements file). Ask for a real URL against every claim. Say that "not found" is valid, since an agent with nowhere to file a failure invents one. **A failed fetch is evidence about that URL, never about the subject:** report the gap and stop. 📖 `references/writing-the-prompt.md` § Briefing a research dispatch for the outline rule, the COULD NOT RETRIEVE line and guessed URLs.

**For a fill-in shape** (a JSON or table field such as `default`, `owner`, `stage`, `row`): give each required field a sanctioned empty answer ("none written down", `null`), since a required field with no empty option comes back filled with a plausible guess (08/11/2026: seven agents invented four "defaults" the sources never set). 📖 `references/writing-the-prompt.md` § Briefing a fill-in shape for the decision-record grep and the read-back.

**For multi-file targets:** measure the actual conventions before stating them, so the agent doesn't break files based on wrong guesses. Loop through the target set first or say so.

⚠️ **Before writing a single-file prompt, `ls` the target's directory for siblings that make it a SET** (a task doc's `decisions/*.md`, a CLAUDE.md's companions). Scoping to the named index is the quiet failure: sessions prune the index, and the siblings carry the drift. Where the set is real, dispatch one agent per file and say which files were and were not covered. **Tell: your prompt names one file and you have not listed what else sits beside it.**

⚠️ **A fact you list as "must survive" is a fact you are vouching for, and the agent will promote it, not check it.** Before a must-survive list is written, read 📖 `references/writing-the-prompt.md` § Vouching for a fact instead of checking it, and § The unfalsifiable half: protecting a category by its form, which hold each Tell and the rule for protecting a class. For the judgement-bearing case, also `../_shared/references/explore-delegation.md` § Handing an agent a judgement-bearing skill.

## After dispatch: wait for the completion notification

Don't poll or shadow the agent. End the turn; the harness re-invokes you with the result. If you need an immediate read, the scope was too wide (📖 `../_shared/references/explore-delegation.md` → "The Waiting Game").

**A new requirement arriving mid-flight needs a fresh dispatch, not a message to the running agent.** A SendMessage landing after the agent concludes produces a truthful account of the original brief with no trace the new target existed. Re-dispatch as a separate task.

⚠️ **Re-read this skill's Verification section from the file when the notification arrives.** Everything below entered context at dispatch and is not re-attached when the agent returns, so the verdict rules get recalled rather than read.

## Verification

**The agent's report is a claim, not evidence.** Take the raw before/after counts as your first act, before reading the report's framing. A stated delta anchors you; a wrong one reframes what you then go looking for.

**For research dispatches, checks 1–4 below all no-op, because there is no artifact to diff.** Open two or three cited sources yourself and find each figure *on* the page. Where most cells come back "not stated", the brief aimed at the wrong pages: re-brief once at a different source kind before relaying (📖 `references/verifying-research.md` § A report where most cells say "not stated").

**For judgement dispatches (a verdict, not a file mutation), checks 1–4 also no-op.** Before accepting a verdict that changes what you do next (merge, delete, escalate), open the smallest artifact it rests on and check the quoted evidence is where it is claimed to be (📖 `references/verifying.md` § Judgement dispatches).

⚠️ **A coverage verdict ("this sentence answers that requirement") comes back lenient, and at volume a spot read cannot catch it.** Run a second strict pass over every row marked covered (📖 `references/verifying.md` § Coverage verdicts).

### 1. Did the file change at all?

Did bytes actually move? `git diff HEAD` against your baseline. A file reading as rewritten while bytes are identical is the common failure, and an agent that wrote nothing gets re-dispatched (📖 `../_shared/references/verifying-a-write-landed.md`). Where the prompt named a skill, count the `"skill":"<name>"` input in the agent's output file (grep, never read it): a report describes the method followed, and a pass run without its skill passes every byte check.

**Run `git status --short` on the whole repo, not `git diff` on the target.** Scoped to the dispatched file, it can only find a missing write, never a surplus one. Agents sometimes edit neighbours and report only the assignment (2026-09-12: an `unhobble-instructions` run also rewrote two `.claude/agents/*.md` files, unmentioned). Treat surplus edits as unreviewed work and hand the call to the user (📖 `references/verifying.md` § Surplus writes).

### 2. Does meaning survive?

Read the current file whole, as its reader meets it: not the diff, and not the passages the report highlights. Do not run a token diff over the rewrite; a `comm`/`grep -o` sweep measures tokenisation, not damage (📖 `references/verifying.md` § Measurement history). Walk the original's sections in order, name what each asserted, and find where the rewrite says the same thing (reworded, relocated or merged all count). A section you cannot account for is your finding, with the heading and claim a patch needs.

A fact leaving this file is a loss only if this file was its home. Look where it lives before counting it lost; what survives that check is content nothing else records, such as a decision's reasoning or what an incident cost (📖 `references/verifying.md` § A fact leaving the file). A search is right only *before* dispatch, for building the protected-token list and confirming a named destination exists; neither is a verdict about the rewrite.

⚠️ **A rewrite is also a research report, and everything above reads it only for loss.** Walk the rewrite for what *arrived*: `ls` every path, read every status word against the source that held it, and ask where any example absent from the original came from. **Tell: the rewrite has a Files or Enforcement section fuller than the original's, and you have checked only that nothing was lost.** 📖 `references/verifying.md` § A rewrite is also a research report.

For a skill's own work, check against its published spec, the reference the prompt cited (📖 `../unhobble-instructions/references/verifying.md` when the skill is `unhobble-instructions`).

### 3. For relocated content: check pointers and destinations

Verify the destination holds moved content. A pointer with nothing at the other end is the most common silent failure (📖 `../_shared/references/verifying-a-relocation.md` § A relocation that never happened).

**Check path depth.** Resolve a SKILL.md's `../` pointer from the citing file's own folder, not repo root (📖 `../unhobble-instructions/references/routing-content.md`).

### 4. Re-measure the agent's own numbers

A report that contradicts itself (lines cut but bytes up) has done arithmetic it never took. Re-count, and run any delta reconciliation yourself: if bytes left the target, read the file the report says gained them. A drop with no destination is deletion, whatever the pass called it.

⚠️ **A perfectly coherent report can be simply wrong about the file.** With no seam to notice, re-count **every** number you would otherwise repeat, and count what the claim rests on: pointer targets, not pointer mentions; distinct anchors, not heading count.

### 4b. A brief is a range in both directions: read the delta before the framing

An agent that stops short hands back a plan for what is left in the same complete-looking shape as a finished report. Read the delta against the brief before the framing: a cut that lands far short of its range (an agent's "next session should delete lines 236-1096", or an 8% cut on a doc briefed for 70%) is a run out of budget, not a judgement that the rest should stay. Overshoot is the same miss, labelled as a win (📖 `references/verifying.md` § A brief is a range in both directions).

### 5. When to revert vs. patch

**Write the re-dispatch prompt first.** Not a decision about whether to revert: the actual prompt, listing every fact that would need naming. Then read what you wrote: a list of nameable facts *is* the patch instructions, so patch. Reverting is for the case where you cannot write that prompt at all.

A symptom list (whole sections gone, contradicting numbers, an untrustworthy report) reads as authorisation the moment one item matches. Those symptoms establish that something is wrong; they never establish that the rest is worthless. A small gain is not a reason to revert either: patch back what was lost and keep what the agent got right (2026-10-10: a 1.9 KB condense was reverted whole, when patching its six dropped passages was the call).

Three ways a patch goes wrong after that call is correctly made. **Tell: your evidence for "systemic" is a set of greps you chose, and you have not opened the rewritten file's sections.** **Tell: you are restoring a passage because it reads as more detailed, not because you can name what a reader loses without it.** **Tell: a fact was restored into the section the agent happened to leave it in, and you have not checked whether that placement is actually correct.**

📖 `references/verifying.md` § Revert or patch and § Patching: placement, instrument, and scope.

## Reporting what you found

Name which rules moved rather than how far the file shrank. A byte count is the instrument that found the problem, rarely the problem itself, and opening on it reframes a content question as a size one: state which rules no longer survive and which are recoverable elsewhere, then give magnitude. Where a named skill did the work, open with its name and its job in one line ("ran via `unhobble-instructions`, which converts rules into judgement prose") before the results.

---

## For syafiqkit plugin maintainers

Dispatching on a syafiqkit file adds conventions: ownership check before patching, shared-mechanism grep before assuming single-file scope, and version bump plus CHANGELOG entry after dispatch (📖 `syafiqkit:update-plugin`).
