# Running a multi-step chain in one turn

For any skill whose workflow is a fixed sequence of steps, some of which invoke a sub-skill (`/done`, `/ship`).

## The rule

Ending the turn with steps outstanding is a pause, even when you announce it and ask nothing. Honest partial progress ("Step 3 done, ready for Step 4") is neither a confirmation request nor a false claim, so it evades every guard framed around those — it reads as transparency while leaving the run half-finished.

**Tell: your reply names a remaining step instead of performing it.**

## Where it actually fires: the sub-skill return boundary

The stop is not random. It lands where a nested `Skill(...)` call returns, because a sub-skill ends by writing its own terminal summary — a heading, a validation table, a results block. That artifact is shaped exactly like the end of a turn, so completing the *sub-skill* reads as completing the *work*.

Two consequences for anyone writing or following such a chain:

- **A restatement in the preamble does not reach the boundary.** The reader is many steps past it, holding a freshly-written summary that feels terminal. A parent workflow needs the cue *at* each step that hands off to a sub-skill, in that step's own text — not only at the top of the file.
- **A sub-skill invoked as a step of a parent workflow should not sign off.** Its closing summary is for a standalone invocation. Inside a chain, it is the thing that manufactures the stopping point.

## The same trap at the artifact-write boundary

A written artifact fires it too, not just a sub-skill's summary. Writing a plan file, a report, or a summary document produces something that *looks* like the turn's deliverable, so the step that ACTS on it — submitting it for approval, routing it to its owner, invoking the next skill — gets read as optional follow-up. The artifact exists, so the work feels delivered.

It isn't: an artifact nobody was asked to approve, or a finding nobody routed, has changed nothing. **Tell: you wrote a file and your closing paragraph describes it instead of submitting it.** The write and the act that makes it count belong in the same turn.

## What "done" means for the chain

The parent workflow's final Output block is the only sign-off. Until it is written, every sub-skill return is a mid-point — including the last one before it.
