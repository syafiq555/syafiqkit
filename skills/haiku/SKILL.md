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

1. **Read the targets' uncommitted diff** — work already present from another session will freeze into your baseline as if it were the committed state, and every downstream check then measures the agent against wrong-starting material. Name any contested files in the prompt as context. 📖 `../_shared/references/diff-ownership.md` distinguishes what to attribute to whom. ⚠️ **Your own reverted pass is the same hazard from a source you won't think to check**, since a re-dispatch after a failure is exactly when the tree is mid-correction: an agent that reads the target between a bad write and the revert works from the truncated file, and then reports honestly against *its* baseline — "no rows dropped" is true and worthless. Measured 2026-09-01. Confirm the file matches the baseline you intend (`git status` clean, or `wc -c` against the committed blob) immediately before dispatching, and state the expected counts in the prompt so the agent can catch the mismatch itself.
2. **Snapshot the targets to scratchpad** and record `wc -c`. This preserves what the files WERE; if verification later points toward a patch or revert, snapshot what the agent MADE afterward as well.

A read-only task needs no snapshot.

## Writing the prompt

**Keep it minimal: skill name (if any), target path, only facts the agent cannot derive.**

Cite what you're outsourcing. For a named skill, include its spec if it has one — the agent judges whether to follow it or invoke the skill directly. Don't pre-write structure; name constraints not designs — *don't edit these three files*, not *must not create new files*, since the second bans what a skill may need.

⚠️ **A failed earlier pass is what actually produces the over-constrained prompt, and it arrives feeling like diligence rather than design.** Having just watched a mechanism go wrong — a relocation whose destination stayed empty, a research claim that was invented — the natural next move is to forbid the mechanism in the re-dispatch. But a mechanism that failed once is evidence about that *run*, not about whether the next skill is entitled to use it, and banning it hands the agent a narrower instrument than its procedure assumes. Measured 2026-09-01: a `condense` pass reported moving rules to a companion that received none of them, so the follow-up `unhobble` prompt banned companion writes — removing extraction, which is one of that skill's core moves, and yielding three reshapes on a file whose real problem was structural. Convert the failure into a **verification** demand instead: *confirm a relocation landed by reading the destination*, never *do not relocate*. **Tell: your prompt forbids something because you watched it fail, rather than because this task genuinely doesn't need it.**

⚠️ **A concurrent agent produces the same over-constrained prompt from a live cause rather than a remembered one, and that cause is real — which is what makes the ban feel like partitioning rather than crippling.** Two agents on disjoint *files* can still collide through a skill's *procedure*: `unhobble-instructions` extracts hot-path detail into `references/`, so dispatching it against `CLAUDE.md` while another agent restructures `references/` puts the collision inside one skill's core move, not across the file list. Banning the move resolves the collision and silently deletes half the pass — measured 2026-09-03, where the ban also contradicted the target skill's own "don't propose; execute", so the agent was handed instructions its procedure disagreed with and correctly reported "no extraction needed" as a finding that was the prompt's, not the file's. Scope the write, not the mechanism: *extract if the file calls for it; `ls` the destination and read it back after writing, because another agent is restructuring that directory*. Where even that is unsafe, the honest move is to serialize — this is the case the partition rule below cannot see, since it reasons about files and commands rather than about what a named skill's procedure entitles it to do. **Tell: your partition is disjoint by file, and the mechanism you are banning is one the dispatched skill names as central.**

For a skill like `unhobble-instructions` with published criteria, cite them so verification checks against the spec rather than guesswork. Where you hold a reading of the target, offer it as an observation to test and say plainly that "this file needs little of what you do, and here is why" is a legitimate result — a prompt that describes the expected finding as the job invites an agent to manufacture reshapes to look thorough.

**For general-purpose agents:** add "Do the work yourself; do not re-dispatch another agent." 📖 `../_shared/references/agent-may-not-redelegate.md` A haiku agent still delegates sometimes, and the report does not say so — it opens "both agents are complete" or claims "24 searches, 13 fetches" while the completion notice shows three tool uses. Read the usage line before the findings: a tool count an order of magnitude below the work claimed means a child did the retrieval and the verification clauses reached it only as a paraphrase, so the report's URL discipline is the child's, not yours to trust.

**For research:** Ask for a real URL against every claim. Explicitly name "COULD NOT RETRIEVE: `<url>` — what happened" when a page blocks or fails. Label anything known only from training data as such. Say plainly that "not found" is valid. This exists because an agent with no place to file a failed retrieval invents one, producing uniformly complete prose that is partly fabricated. Add the other half of that permission: **a failed fetch is evidence about that URL and never about the subject**, so the agent should report the gap and stop rather than concluding the material does not exist — and where it reaches a page through a search result rather than a guessed address, say which, since a guessed URL's 404 carries no information at all.

**For multi-file targets:** measure the actual conventions before stating them, so the agent doesn't break files based on wrong guesses. Loop through the target set first or say so.

⚠️ **A fact you list as "must survive" is a fact you are vouching for, and the agent will promote it, not check it.** The natural source for that list is the file being rewritten, and a doc's claim about code is exactly the kind of thing that has drifted. Measured 2026-09-04: a rate-validation floor read off a 2025 stories file went into the prompt as "recorded nowhere else"; the code enforced no such floor, and the rewrite spread the false rule into four places under a heading that said *Enforced in Code* — the protection was read as verification. So a protected fact that describes code, config or a route gets one `grep` against the thing it describes before it goes in the prompt, and a fact that fails that grep is not a loss to prevent but a correction to instruct: tell the agent the doc is wrong and what the code says. **Tell: your must-survive list was built by reading the target rather than by reading what the target describes.**

## Partition for concurrency

Dispatch independently when work is genuinely disjoint — separate files, separate questions, separate areas. Partition so no two agents touch the same file. Each agent gets one task (one skill, one target), not chains within a prompt.

Two skills in one prompt overwrite each other's accounts — dispatch as separate parallel agents instead. Same for one skill across two files: four calls total (two agents × two files) costs nothing extra and gains a checkable before/after pair.

Agents with non-overlapping targets go out together in one message (all at once, no prose before the calls). Anything waiting on another agent's output has to serialize — state which run parallel and why.

📖 `../_shared/references/explore-delegation.md` → "Spawning multiple agents" for batching mechanics.

## After dispatch: wait for the completion notification

Don't poll or shadow the agent — reading the delegated files yourself feels like progress but costs the delegation twice while the agent's work is still in flight. End the turn; the harness re-invokes you with the result.

If you need immediate reading, scope was too wide — dispatch fewer agents instead. 📖 `../_shared/references/explore-delegation.md` → "The Waiting Game" for why shadowing breaks verification.

**A new requirement arriving mid-flight needs a fresh dispatch, not a message to the running agent.** A SendMessage landing after the agent concludes produces a truthful account of the original brief with no trace the new target existed. Re-dispatch as a separate task.

⚠️ **When the notification arrives, re-read this skill's Verification section from the file before judging anything.** Everything below entered context at dispatch and is not re-attached when the agent returns — an arbitrary number of turns later, after other work. So the rules governing the verdict are being recalled rather than read, and a recalled rule is what "I already know this one" feels like from the inside. That gap is why the wrong-instrument and revert-too-early failures recur here more than anywhere else in the plugin: the rules are correct, present, and stale at the only moment they matter. One `sed -n` over this file costs less than the destructive call you are about to make.

## Verification

**The agent's report is a claim, not evidence.** Take the raw before/after counts as your first act, before reading the report's framing. A stated delta anchors you; a wrong one reframes what you then go looking for.

⚠️ **For research dispatches:** Checks 1–4 (below) all no-op since there's no artifact to diff. Verify the CLAIMS instead by opening sources yourself. A fabricated finding and a real one both read as prose; the fabrication runs toward *more* convincing because inventing a source costs nothing while retrieving one can fail. Spot-check before relaying by opening two or three cited URLs — especially any claim that decides something — and confirm which host or environment actually answered. A resolving URL grades the page, not the figure: a real page about the subject routinely carries a *different* number from the one attributed to it, and that passes the URL check clean, so for any figure or threshold find the number on the page rather than the page. Ask the report to separate what was retrieved from what was not, since an agent that must file "COULD NOT RETRIEVE" has somewhere to put a gap other than a guess.

⚠️ **An honest wall of `COULD NOT RETRIEVE` still needs checking, because the failure it hides is a conclusion drawn FROM the failures rather than a claim invented in place of one.** The retrieval discipline works exactly as designed and then the agent reasons from its own empty result — "these sources 404, therefore the literature has moved offline" — which arrives as a genuine-looking finding about the world, sourced to nothing, and reads as *more* trustworthy than a normal answer because it is visibly self-critical. Measured 2026-09-01: a research agent filed eleven dead URLs and concluded that no major company publishes guidance on a mainstream practice; three of the four load-bearing ones returned 200 on retest, the agent having guessed URLs rather than searched. So a negative finding is the one kind of claim whose *evidence is the absence itself*, and it has to be retested before it is relayed — retry a couple of the named failures yourself with a browser `User-Agent` (`curl -sL -o /dev/null -w '%{http_code}' -H 'User-Agent: Mozilla/5.0 …'`), since vendor and marketing pages routinely 403 a bare agent while serving a browser, and a guessed URL 404s for reasons that say nothing about whether the page exists. **Tell: the report concludes something does not exist, and your evidence for that is the report's own failed fetches.**

### 1. Did the file change at all?

Did bytes actually move? `git diff HEAD` against your baseline. A file reading as rewritten while bytes are identical is the common failure. An agent that wrote nothing is untrustworthy throughout and gets re-dispatched. 📖 `../_shared/references/verifying-a-write-landed.md` for how to check, and why the report describing a change is never evidence it happened.

### 2. Does meaning survive?

Read the current file whole, as its reader meets it — not the diff, not the passages the report highlights. A rewrite inverting a formula while keeping every label passes completely until you read the sentence and derive the claim.

⚠️ **Do not run a token diff over the rewrite. Read the original and the rewrite, section by section, and say what each section lost.** This is not a caution about interpreting a diff carefully — it is the removal of the step. A `comm`/`grep -o` sweep of backticked spans has driven a wrong verdict on every recorded occasion (ten CHANGELOG entries; the last returned 413 "losses" that were 23 rules), because the number it produces is an artifact of tokenisation and reads as a finding. Nothing downstream can repair it: a number an order of magnitude too large makes a patchable run look systemic, and one too small makes real loss invisible. There is no correct way to interpret it, so do not generate it.

What replaces it: open both files and walk the original's sections in order. For each, name what it asserted and find where the rewrite says the same thing — reworded, relocated, or merged all count. A section you cannot account for is your finding, and you will have its heading and its claim in hand, which is exactly what a patch or a re-dispatch prompt needs. This costs one read of a file you are about to make a destructive decision about.

**A fact leaving this file is only a loss if this file was its home.** A rewrite skill's capture filter deletes what the reader can derive — the code holds the value, the doc holds why it matters — so a deleted config key, error code or symbol name is usually the pass working correctly. Before counting one as lost, look for it where it actually lives: the project's `CLAUDE.md`, a companion reference, the source itself. What survives that check is content nothing else records — a decision's reasoning, a rejected alternative, the history of what an incident cost — and those are worth more than the identifiers, which is the reverse of what a search surfaces.

Two things a search is still right for, both *before* dispatch: building the protected-token list that goes into the agent's prompt, and confirming a named destination exists. Neither is a verdict about the rewrite. 📖 `references/verifying.md` for the failure modes.

⚠️ **A rewrite is also a research report, and everything above reads it only for loss.** A template-conform pass has sections to fill — Files, Status, Enforcement, an example — and where the source is silent the agent fills them from what a repo like this usually has, in the same confident register as the parts it copied. Two passes on one doc set on 2026-09-04 invented, between them, four file paths, two test targets, a worked customer example, a "live" on a feature that was unshipped, and an "awaiting customer" on a customer with nothing to await — none flagged, all inside prose that was otherwise faithful. So after walking the original for what left, walk the rewrite for what *arrived*: every path gets an `ls`, every status word (live, shipped, enforced, blocked) gets read against the source that held it, and every example or figure absent from the original is asked where it came from. The research spot-check rule applies here in full; the difference is that a rewrite's fabrications sit beside real content copied from your own file, which is the most credible place a fabrication can sit. **Tell: the rewrite has a Files or Enforcement section fuller than the original's, and you have checked only that nothing was lost.**

For a skill's own work, check against its spec. A rewrite skill has published criteria; verify against those — consult the reference the prompt cited if one exists.

### 3. For relocated content: check pointers and destinations

When a pass moves content to a companion (a `condense-*` split or `unhobble-instructions` extraction), verify the destination holds the moved content. A pointer resolving without content at the other end is the most common silent failure.

**Check path depth carefully.** A relative pointer from a SKILL.md uses `../` syntax that differs by depth. Resolve it from the citing file's directory: `ls ../reference-file.md` from the SKILL.md's own folder, not from repo root. 📖 `../unhobble-instructions/references/routing-content.md` covers clustering and pathfinding before writing the destination.

### 4. Re-measure the agent's own numbers

A report claiming contradictory things (lines cut but bytes up, anchors fixed when new ones added) has done arithmetic it never took. Re-count. Where a rewrite skill requires the agent to reconcile its own delta, that check ran inside the agent's context and reached you as a claim — so run it yourself: if bytes left the target, confirm by reading whichever file the report says gained them. A drop with no destination is deletion whatever the pass called it.

### 5. When to revert vs. patch

**Write the re-dispatch prompt first.** Not a decision about whether to revert — the actual prompt, listing every fact that would need naming. Then read what you wrote: a list of nameable facts *is* the patch instructions, so patch. Reverting is for the case where you cannot write that prompt at all, because you cannot characterise what went wrong.

Doing this in the other order is what fails. A symptom list — whole sections gone, contradicting numbers, an untrustworthy report — reads as authorisation the moment one item matches, and the enumeration test placed after it never gets applied to a case that already qualified. Those symptoms establish that something is wrong; they never establish that the rest is worthless. Patching restores the fact in the new file's shape, never by pasting the snapshot's bytes back.

⚠️ **The instrument that produced your loss list decides whether it is a list at all.** A hand-picked `grep -c` over tokens you chose feels categorically unlike the banned mechanical sweep — you selected each one, so its output reads as deliberate evidence rather than a screen. It is the same instrument: it answers whether a string left a file, never whether the fact left the project, and it cannot see a fact that survived reworded or one you did not think to grep for. Measured 2026-09-03: eight greps produced a confident loss list, five of the eight were in `CLAUDE.md` or derivable from code, and a legitimate restructure was destroyed over what turned out to be one session-log row. Before the word "revert" reaches the user, each fact in the case owes the three costs from `references/verifying.md` — the section you expected it in, the lines you actually read there, and why the prose you found does not cover it. A fact you cannot pay them for is a search result, not a loss. **Tell: your evidence for "systemic" is a set of greps you chose, and you have not opened the rewritten file's sections.**

📖 `references/verifying.md` for the snapshot strategy — including snapshotting the agent's OUTPUT before reverting, without which the verdict cannot be checked even in principle.

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
