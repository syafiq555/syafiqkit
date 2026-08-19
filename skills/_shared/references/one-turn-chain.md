# Running a multi-step chain in one turn

For any skill whose workflow is a fixed sequence of steps, some of which invoke a sub-skill (`/done`, `/ship`).

## The rule

Ending the turn with steps outstanding is a pause, even when you announce it and ask nothing. Honest partial progress ("Step 3 done, ready for Step 4") is neither a confirmation request nor a false claim, so it evades every guard framed around those — it reads as transparency while leaving the run half-finished. Naming a remaining step is not performing it.

## Where it actually fires: the sub-skill return boundary

The stop is not random. It lands where a nested `Skill(...)` call returns, because a sub-skill ends by writing its own terminal summary — a heading, a validation table, a results block. That artifact is shaped exactly like the end of a turn, so completing the *sub-skill* reads as completing the *work*.

Two consequences for anyone writing or following such a chain:

- **A restatement in the preamble does not reach the boundary.** The reader is many steps past it, holding a freshly-written summary that feels terminal. A parent workflow needs the cue *at* each step that hands off to a sub-skill, in that step's own text — not only at the top of the file.
- **A sub-skill invoked as a step of a parent workflow should not sign off.** Its closing summary is for a standalone invocation. Inside a chain, it is the thing that manufactures the stopping point.

## The same trap at the artifact-write boundary

A written artifact fires it too, not just a sub-skill's summary. Writing a plan file, a report, or a summary document produces something that *looks* like the turn's deliverable, so the step that ACTS on it — submitting it for approval, routing it to its owner, invoking the next skill — gets read as optional follow-up. The artifact exists, so the work feels delivered.

It isn't: an artifact nobody was asked to approve, or a finding nobody routed, has changed nothing. A closing paragraph that describes the file you just wrote is standing in for the act that would have made it count, and the two belong in the same turn.

## Naming the next step is the stop

The cue at each handoff is addressed to the act of invoking, and a reply that *names* the next step satisfies nothing while feeling like it has: announcing "next is Step N" is a description of work, not work. It reads as orientation rather than as a pause, which is why a correctly-placed boundary warning can be read and followed and still not fire.

Treat writing the next step's name as the trigger to call it, in that same message — a sentence naming the next step with no tool call after it is where the chain stops.

## When the turn ends without you choosing to

Everything above describes a stop the model elects. A chain can also be severed involuntarily — context compaction between two steps — and the guards written for the voluntary case do not reach it, because they all assume the turn is still running.

What survives a compaction is prose, and prose about an unfinished step reads as settled context rather than as outstanding work; a summary can name the remaining step in as many words and still be walked straight past. The resumed turn also lands mid-chain holding a sub-skill's terminal summary, which is the same artifact this file already identifies as manufacturing a false stopping point — only now there is no memory of the parent workflow to contradict it, and the instruction to resume without recapping discourages the re-orientation that would surface the gap.

So on re-entry, which steps ran is a question to answer from evidence, not from the summary's account of itself. Each of a workflow's steps writes something — a file, a doc, a commit — and whether that artifact changed on disk is checkable in a way a narrative is not. `/done` already states the standard as its Output-table rule: a row is fillable only if the artifact it claims actually changed. A summary saying a step completed is the account under review, never the evidence for it.

## What "done" means for the chain

The parent workflow's final Output block is the only sign-off. Until it is written, every sub-skill return is a mid-point — including the last one before it.
