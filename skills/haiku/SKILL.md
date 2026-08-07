---
name: haiku
description: Run a task, or a named skill, on one or more haiku agents instead of the current session — then verify the result before reporting it. Use for research, bulk reading and survey work, and for mechanical rewrite passes (`condense-claude-md`, `condense-task-doc`, `unhobble-instructions`) where haiku is fast and good at restructuring. Trigger on "haiku this", "run X on haiku", "get haiku to research Y", "use haiku for the condense", "spin up N haikus for Z", "delegate this to haiku", or any request naming haiku as the thing that should do the work. Also fires when the user asks for several agents in parallel on disjoint work and doesn't name a tier. Not for choosing WHICH skill to run — name the skill and this dispatches it; deciding what needs doing is the calling session's job.
---

# Run it on haiku

Dispatch the work to `haiku` rather than doing it here. The tier is the point, so the work happens in the agent — resist doing it yourself and using the agent as a second opinion.

`model: "haiku"` only applies to `general-purpose`. Passing it to a registered agent (`code-reviewer`, `Explore`) silently overrides that agent's own frontmatter tier, so dispatch `general-purpose` here.

## What to dispatch

Read the request for three things: whether it names a skill, whether it names a target, and whether it wants more than one agent.

A leading `/skill-name` or a bare skill name means the agent's first action is `Skill(skill: "syafiqkit:<name>")` against the target that follows. Anything else is a free-form task — research, a survey, a bulk read — and goes over as itself.

Fan out when the request asks for it ("3 agents", "split this") or when the work is genuinely disjoint: several independent files, several unrelated questions, a survey across separate areas. Partition so no two agents touch the same file, and give each its own slice rather than the whole list. One coherent task on one file stays a single agent — splitting it produces conflicting rewrites of the same bytes. 📖 `../_shared/references/explore-delegation.md` for batching mechanics and the one-message rule that makes parallel actually parallel.

## Writing the prompt

Keep it to what the agent can't derive: the skill name if there is one, the target path, and the boundaries a stranger to this session couldn't know — which files are contested, what must not be run, which repo it's in.

Everything else is already in the skill — restating what the skill says, listing what must survive, or pre-writing the conclusion replaces the judgement you dispatched for. Where you're worried about damage, the snapshot below is the instrument, not the prompt. 📖 `../_shared/references/explore-delegation.md` for why a judgement-skill gets *less* useful the more you specify, and why narrating a predecessor's failure into a retry primes the agent to under-edit.

## Before dispatch, if files will change

Snapshot every target the agent may write (`cp` to the session scratchpad) and record `wc -lc`. This is what makes the verification below possible; without it there's nothing to compare against and a self-report is all you're left with. A read-only research task needs none of this.

## After it returns

The agent's closing report is a claim about the work, not evidence of it. Measured across three runs this way, each returned a confident summary and each had something wrong in it — including one whose headline structural claim (a section renamed, a table restructured) had simply not happened, while the honest work sat further down the list. The parts of a report that read most decisively are not the parts most likely to be true.

For a task that wrote files, run the same three checks `../_shared/references/two-tier-condense.md`'s Verify section owns — bytes actually moved first (📖 `../_shared/references/verifying-a-write-landed.md`), then identifier/number survival against the snapshot, then a reworded-claim scan. Add one more here: spot-check the report's own structural claims against the file — a heading diff costs one command and catches the case where the report describes a rewrite that never happened.

A pass that sheds far more bytes than it moved content is worth opening before accepting — but treat the number as a reason to look, not a verdict. Reworded facts read as missing to a grep for their old phrasing, and calling that data loss is its own error, costlier than the drop it was meant to catch.

For research, the equivalent check is provenance: a finding that can't cite a file, line, or source is the agent reasoning toward an answer.

Report what changed and what you verified, and say plainly when a check failed or you skipped one.
