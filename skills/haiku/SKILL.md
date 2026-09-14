---
name: haiku
description: Run a task, or a named skill, on one or more haiku agents instead of the current session — then verify the result before reporting it. Use for research, bulk reading and survey work, and for mechanical rewrite passes (`condense-claude-md`, `condense-task-doc`, `unhobble-instructions`) where haiku is fast and good at restructuring. Trigger on "haiku this", "run X on haiku", "get haiku to research Y", "use haiku for the condense", "spin up N haikus for Z", "delegate this to haiku", or any request naming haiku as the thing that should do the work. Also fires when the user asks for several agents in parallel on disjoint work and doesn't name a tier. Not for choosing WHICH skill to run — name the skill and this dispatches it; deciding what needs doing is the calling session's job.
---

# Dispatch to haiku

The point of reaching for haiku is the tier itself — speed and restructuring judgment outsourced. Use it by resisting the urge to rewrite or second-guess.

## When to dispatch

A dispatch makes sense when the work is either pure mechanical (gathering, counting, bulk reading) or a rewrite where speed and breadth matter more than depth. The tier carries those strengths as defaults; the prompt should name only facts the agent cannot derive.

**Your own first tool call is `Agent(subagent_type: "general-purpose", model: "haiku", prompt: "...")`.** Never call `Skill(...)` on **the skill being dispatched** — that runs it here, opposite of dispatching. If the request names a skill, its name goes *inside* the prompt ("First run `/skill-name`"), not as a tool call you make. Re-invoking *this* skill is the exception: a sequencing caller reloads it before each prompt, since these rules never re-attach once read. Anything else is a free-form task (research, audit, bulk read) and goes into the prompt as itself.

**Read the request for three things:** Does it name a skill, a target, and whether more than one agent is needed? That shapes what goes into your prompt.

## Before dispatch: snapshot if files will change

For any task that writes files, take a baseline before dispatch:

1. **Read the targets' uncommitted diff** — work already present from another session will freeze into your baseline as if it were the committed state, and every downstream check then measures the agent against wrong-starting material. Name any contested files in the prompt as context. 📖 `../_shared/references/diff-ownership.md` distinguishes what to attribute to whom. ⚠️ **Your own recent write is the same hazard from a source you won't think to check** — and it arrives in two shapes, of which the second is the one that keeps recurring. A re-dispatch after a *failure* is obviously mid-correction. But a patch applied after a pass you judged *successful* is invisible in exactly the same way while feeling nothing like a correction — the pass finished, you fixed one thing it got wrong, and the tree reads as settled, so the next agent works from the pre-patch copy and silently reverts you while reporting honestly against its own baseline. 📖 `references/verifying.md` § Your own write as baseline for both measured cases.

Confirm the file matches the baseline you intend (`git status` clean, or `wc -c` against the committed blob) immediately before dispatching, and **state the expected counts in the prompt** so the agent can catch the mismatch itself. That second half is the load-bearing one on a sequential run: the prompt is an artifact you must write anyway, so a count embedded in it survives the recall gap that a discretionary re-read does not. **Tell: you patched something between two dispatches and the next prompt names no numbers.**
2. **Snapshot the targets to scratchpad** and record `wc -c`. This preserves what the files WERE; if verification later points toward a patch or revert, snapshot what the agent MADE afterward as well.

A read-only task needs no snapshot.

## Writing the prompt

**Keep it minimal: skill name (if any), target path, only facts the agent cannot derive.**

Where the target is a file under git, name the banned verbs in the prompt too — a dispatch that only says "run the skill and report" leaves committing unscoped, and an agent that judges its own work finished reaches for the verb that makes it durable. 📖 `../_shared/references/agent-prompt-verb-ban.md`. A single-agent dispatch is not exempt: the rule there is written for a fan-out, but the exposure is per-agent, and an unscoped commit from a lone haiku run pulls in whatever else is staged in that checkout, not just the target file.

Cite what you're outsourcing. For a named skill, include its spec if it has one — the agent judges whether to follow it or invoke the skill directly. Don't pre-write structure; name constraints not designs — *don't edit these three files*, not *must not create new files*, since the second bans what a skill may need.

⚠️ **A prompt that forbids a mechanism is usually narrower than the task, and it arrives feeling like diligence.** Whether the cause is a pass you just watched fail or a concurrent agent that might collide, the fix is the same shape: demand *verification* rather than prohibition (*confirm a relocation landed by reading the destination*, never *do not relocate*), and scope the write rather than the mechanism. A mechanism that failed once is evidence about that run, not about whether the next skill is entitled to use it — and banning a move a skill names as central deletes half its pass. **Tell: your prompt forbids something because you watched it fail, rather than because this task genuinely doesn't need it.** **Tell: your partition is disjoint by file, and the mechanism you are banning is one the dispatched skill names as central.** 📖 `references/writing-the-prompt.md` for both worked cases and the serialize-instead option.

For a skill like `unhobble-instructions` with published criteria, cite them so verification checks against the spec rather than guesswork. Where you hold a reading of the target, offer it as an observation to test and say plainly that "this file needs little of what you do, and here is why" is a legitimate result — a prompt that describes the expected finding as the job invites an agent to manufacture reshapes to look thorough.

**For general-purpose agents:** add "Do the work yourself; do not re-dispatch another agent." 📖 `../_shared/references/agent-may-not-redelegate.md` One delegates anyway sometimes and the report will not say so, so read the usage line before the findings: a tool count an order of magnitude below the work claimed ("24 searches, 13 fetches" against three tool uses) means a child did the retrieval, and your verification clauses reached it only as a paraphrase.

**For research:** Ask for a real URL against every claim, an explicit "COULD NOT RETRIEVE: `<url>` — what happened" when a page blocks or fails, a label on anything known only from training data, and say plainly that "not found" is valid — an agent with no place to file a failed retrieval invents one. Give the other half of that permission too: **a failed fetch is evidence about that URL and never about the subject**, so report the gap and stop rather than concluding the material does not exist. Ask which addresses were reached through a search and which were guessed; a guessed URL's 404 carries no information.

**For multi-file targets:** measure the actual conventions before stating them, so the agent doesn't break files based on wrong guesses. Loop through the target set first or say so.

⚠️ **A fact you list as "must survive" is a fact you are vouching for, and the agent will promote it, not check it.** The natural source for that list is the file being rewritten, and a doc's claim about code is exactly the kind of thing that has drifted. So a protected fact describing code, config or a route gets one `grep` against the thing it describes before it goes in the prompt; one that fails is not a loss to prevent but a correction to instruct. **Tell: your must-survive list was built by reading the target rather than by reading what the target describes.** 📖 `references/writing-the-prompt.md` § Vouching for a fact.

⚠️ **A must-survive entry naming a CLASS of sentence by its form — every `**Tell:**`, every `⚠️`, every dated incident — is not protection but a verdict, and it fires hardest on the judgement skills where the verdict was the deliverable.** The checkable kind above is a claim about the world that a `grep` can refute; this kind cannot be refuted at all, so an agent that disagrees has no way to say so and either obeys a rule it cannot test or quietly breaks it and writes a justification. Asserting the reason ("these are the highest-value sentences in the file") closes even that, since the agent must now contradict you rather than the file. Measured 2026-09-11 dispatching `unhobble-instructions`: a blanket "all `**Tell:**` sentences must survive" produced a run that deleted one anyway with a rationale attached, duplicated a rule it claimed to have relocated, and dropped a dated production incident — and the one it deleted turned out to be a genuinely marginal call the skill should have been left to make. Protect an INSTANCE whose loss you can name a cost for, never a category by its syntax; where you want a class considered carefully, say what it is FOR and let the agent judge each member ("a Tell names the moment a reader is in, which is usually not what the rule's headline states — keep the ones that add a moment, cut the ones that restate the headline"). **Tell: an entry on your must-survive list quantifies over a pattern rather than naming one thing.** 📖 `../_shared/references/explore-delegation.md` § Handing an agent a judgement-bearing skill — each specification you add replaces a decision the skill exists to make.

## Partition for concurrency

Dispatch independently when work is genuinely disjoint — separate files, separate questions, separate areas. Partition so no two agents touch the same file. Each agent gets one task (one skill, one target), not chains within a prompt.

Two skills in one prompt overwrite each other's accounts — dispatch as separate parallel agents instead. Same for one skill across two files: four calls total (two agents × two files) costs nothing extra and gains a checkable before/after pair.

Agents with non-overlapping targets go out together in one message (all at once, no prose before the calls). Anything waiting on another agent's output has to serialize — state which run parallel and why.

📖 `../_shared/references/explore-delegation.md` → "Spawning multiple agents" for batching mechanics.

## After dispatch: wait for the completion notification

Don't poll or shadow the agent — reading the delegated files yourself feels like progress but costs the delegation twice while the agent's work is still in flight. End the turn; the harness re-invokes you with the result. If you need immediate reading, scope was too wide — dispatch fewer agents instead. 📖 `../_shared/references/explore-delegation.md` → "The Waiting Game" for why shadowing breaks verification.

**A new requirement arriving mid-flight needs a fresh dispatch, not a message to the running agent.** A SendMessage landing after the agent concludes produces a truthful account of the original brief with no trace the new target existed. Re-dispatch as a separate task.

⚠️ **Re-read this skill's Verification section from the file when the notification arrives.** Everything below entered context at dispatch and is not re-attached when the agent returns. The rules governing the verdict are being recalled rather than read, which is why the wrong-instrument and revert-too-early failures recur here: the rules are correct, present, and stale at the only moment they matter.

## Verification

**The agent's report is a claim, not evidence.** Take the raw before/after counts as your first act, before reading the report's framing. A stated delta anchors you; a wrong one reframes what you then go looking for.

**For research dispatches, checks 1–4 below all no-op — there is no artifact to diff.** Open two or three cited sources yourself before relaying, and for any figure find the number *on* the page rather than confirming the page resolves. Treat a negative finding as the one claim whose evidence is an absence: retest a couple of the reported failures before repeating a conclusion drawn from them. 📖 `references/verifying-research.md`

### 1. Did the file change at all?

Did bytes actually move? `git diff HEAD` against your baseline. A file reading as rewritten while bytes are identical is the common failure. An agent that wrote nothing is untrustworthy throughout and gets re-dispatched. 📖 `../_shared/references/verifying-a-write-landed.md` for how to check, and why the report describing a change is never evidence it happened.

**Run `git status --short` on the whole repo, not `git diff` on the target.** Scoping the command to the file you dispatched about can only find a write that is missing, never one that is surplus — and an agent given one file sometimes edits neighbours it judged related, with the report describing only the assignment. Measured 2026-09-12: an `unhobble-instructions` run on a `CLAUDE.md` also rewrote two `.claude/agents/*.md` definitions, mtimes inside its run window, none of it mentioned. The edits were coherent and on-topic, which is what makes them easy to wave through — judge them as unreviewed work that arrived unannounced, and hand the call to the user rather than keeping them because they read well.

### 2. Does meaning survive?

Read the current file whole, as its reader meets it — not the diff, not the passages the report highlights. A rewrite inverting a formula while keeping every label passes completely until you read the sentence and derive the claim.

⚠️ **Do not run a token diff over the rewrite. Read the original and the rewrite, section by section, and say what each section lost.** This is not a caution about interpreting a diff carefully — it is the removal of the step. A `comm`/`grep -o` sweep of backticked spans has driven a wrong verdict on every recorded occasion (ten CHANGELOG entries; the last returned 413 "losses" that were 23 rules), because the number it produces is an artifact of tokenisation and reads as a finding. Nothing downstream can repair it: a number an order of magnitude too large makes a patchable run look systemic, and one too small makes real loss invisible. There is no correct way to interpret it, so do not generate it.

What replaces it: open both files and walk the original's sections in order. For each, name what it asserted and find where the rewrite says the same thing — reworded, relocated, or merged all count. A section you cannot account for is your finding, and you will have its heading and its claim in hand, which is exactly what a patch or a re-dispatch prompt needs. This costs one read of a file you are about to make a destructive decision about.

**A fact leaving this file is only a loss if this file was its home.** A rewrite skill's capture filter deletes what the reader can derive — the code holds the value, the doc holds why it matters — so a deleted config key, error code or symbol name is usually the pass working correctly. Before counting one as lost, look for it where it actually lives: the project's `CLAUDE.md`, a companion reference, the source itself. What survives that check is content nothing else records — a decision's reasoning, a rejected alternative, the history of what an incident cost — and those are worth more than the identifiers, which is the reverse of what a search surfaces.

Two things a search is still right for, both *before* dispatch: building the protected-token list that goes into the agent's prompt, and confirming a named destination exists. Neither is a verdict about the rewrite. 📖 `references/verifying.md` for the failure modes.

⚠️ **A rewrite is also a research report, and everything above reads it only for loss.** Where the source was silent, a template-conform pass fills sections from what a repo like this usually has, in the same register as the parts it copied faithfully. So after walking the original for what left, walk the rewrite for what *arrived*: `ls` every path, read every status word (live, shipped, enforced, blocked) against the source that held it, and ask where any example absent from the original came from. **Tell: the rewrite has a Files or Enforcement section fuller than the original's, and you have checked only that nothing was lost.** 📖 `references/verifying.md` § A rewrite is also a research report.

For a skill's own work, check against its spec. A rewrite skill has published criteria; verify against those — consult the reference the prompt cited if one exists.

### 3. For relocated content: check pointers and destinations

When a pass moves content to a companion (a `condense-*` split or `unhobble-instructions` extraction), verify the destination holds the moved content. A pointer resolving without content at the other end is the most common silent failure.

**Check path depth carefully.** A relative pointer from a SKILL.md uses `../` syntax that differs by depth. Resolve it from the citing file's directory: `ls ../reference-file.md` from the SKILL.md's own folder, not from repo root. 📖 `../unhobble-instructions/references/routing-content.md` covers clustering and pathfinding before writing the destination.

### 4. Re-measure the agent's own numbers

A report claiming contradictory things (lines cut but bytes up, anchors fixed when new ones added) has done arithmetic it never took. Re-count. Where a rewrite skill requires the agent to reconcile its own delta, that check ran inside the agent's context and reached you as a claim — so run it yourself: if bytes left the target, confirm by reading whichever file the report says gained them. A drop with no destination is deletion whatever the pass called it.

⚠️ **A perfectly coherent report can be simply wrong about the file.** Nothing in it argues with itself, so there is no seam to notice — the number is just false. The trigger for re-counting is **every** report that states a number you would otherwise repeat, not only one whose figures disagree with each other — and the count to take is the one the report's own claim rests on (pointer targets, not pointer mentions; distinct anchors, not heading count).

### 4b. A brief is a range in both directions — read the delta before the framing

An agent that stops short hands back a plan for what is left — "next session should delete lines 236–1096", "the remaining work is…" — in the same complete-looking shape as a finished report, and the numbers beside it are true of the partial state. Read the delta against what was asked before the framing: an 8% reduction on a doc briefed for 70% is the agent having run out of budget, not a judgement that the rest should stay.

Overshoot is the same miss and arrives labelled as a win. An agent briefed to cut to a *range* reads the number as a floor to beat. Rank the returned files by how far each landed from its brief and spend the meaning-read budget on the outlier first, in whichever direction it missed. **Tell: an agent's report states its result as exceeding the target rather than as landing in it.**

### 5. When to revert vs. patch

**Write the re-dispatch prompt first.** Not a decision about whether to revert — the actual prompt, listing every fact that would need naming. Then read what you wrote: a list of nameable facts *is* the patch instructions, so patch. Reverting is for the case where you cannot write that prompt at all.

A symptom list — whole sections gone, contradicting numbers, an untrustworthy report — reads as authorisation the moment one item matches. Those symptoms establish that something is wrong; they never establish that the rest is worthless.

Three ways a patch goes wrong after that call is correctly made. **Tell: your evidence for "systemic" is a set of greps you chose, and you have not opened the rewritten file's sections.** **Tell: you are restoring a passage because it reads as more detailed, not because you can name what a reader loses without it.** **Tell: a fact was restored into the section the agent happened to leave it in, and you have not checked whether that placement is actually correct.**

📖 `references/verifying.md` — the snapshot strategy (including snapshotting the agent's OUTPUT before reverting, without which the verdict cannot be checked even in principle), and § Patching for the placement check, the hand-picked-grep instrument trap, and why deciding to patch is a separate decision from deciding what to restore.

### Reporting what you found

Name which rules moved rather than how far the file shrank. A byte count is the instrument that found the problem and rarely is the problem, so opening on it reframes a content question as a size one — state which rules no longer survive and which are recoverable elsewhere, then give magnitude as support. Where a named skill did the work, open with its name and its job in one line ("ran via `unhobble-instructions`, which converts rules into judgement prose") before the results, since two skills are in play and the verdict belongs to whichever one's criteria govern it.


---

## For syafiqkit plugin maintainers

When dispatching on a syafiqkit file, additional conventions apply: ownership check before patching, shared-mechanism grep before assuming single-file scope, and version bump + CHANGELOG entry after dispatch. 📖 `syafiqkit:update-plugin` covers them.

## References

- 📖 `references/verifying.md` — detailed gotchas where confident claims fall apart (shape-measuring failures, stale content, pointer verification, what a rewrite *added*, and the three ways a patch goes wrong)
- 📖 `references/writing-the-prompt.md` — the worked cases behind over-constraint: banning a mechanism you watched fail, banning one a concurrent agent might collide with, and vouching for a protected fact instead of checking it
- 📖 `references/verifying-research.md` — grading a research dispatch, where checks 1–4 no-op: spot-checking claims, the number-vs-page distinction, and retesting a wall of failed fetches
- 📖 `../_shared/references/explore-delegation.md` — batching mechanics, partition strategy, shadowing pitfalls, count verification
- 📖 `../_shared/references/verifying-a-relocation.md` — when content moves to a companion, what can break and isn't visible in the rewritten file
- 📖 `../unhobble-instructions/references/verifying.md` — when dispatching a rewrite skill, shape/meaning distinction, anchor/identifier sweep traps
