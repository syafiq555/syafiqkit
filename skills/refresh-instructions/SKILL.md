---
name: refresh-instructions
description: Run a full three-pass refresh on one instruction-bearing file — a CLAUDE.md or a task doc (current.md) — by dispatching restructure, then condense, then unhobble-instructions, each on `haiku`, each verified before the next starts. Trigger on "full pass on this doc", "refresh this CLAUDE.md", "run the whole rewrite sequence", "restructure, condense, and unhobble this", or "give this doc the full treatment". Not for running just one of the three passes alone — invoke that skill directly (`update-claude-docs rewrite` / `task-summary` rewrite, `condense-claude-md` / `condense-task-doc`, `unhobble-instructions`) instead of this combo. Not for a file that isn't a CLAUDE.md or task doc — `unhobble-instructions` alone covers SKILL.md/agent/command files.
---

# Refresh Instructions

Three passes, same file, one after another: **restructure** (canonical section order) → **condense** (density) → **unhobble** (judgment vs. constraint). Each pass answers a different question, and running them in this order means condense works on already-correctly-ordered content, and unhobble works on already-tight prose instead of fighting bloat and structure at the same time.

This skill is pure sequencing. All three passes, the dispatch mechanics, and the verification discipline (snapshot before, re-measure after, read for meaning not diff, patch-vs-revert) already live in `syafiqkit:haiku` — read it before dispatching the first pass if it's not already in context. This file only says which three skills, in which order, on which file type.

## Pick the pair by file type

| Target | Pass 1 (restructure) | Pass 2 (condense) | Pass 3 (unhobble) |
|---|---|---|---|
| `CLAUDE.md` | `update-claude-docs` (rewrite mode) | `condense-claude-md` | `unhobble-instructions` |
| Task doc (`current.md`) | `task-summary` (rewrite/conform-to-template) | `condense-task-doc` | `unhobble-instructions` |

## Process

Run each pass as its own `haiku` dispatch — three dispatches, not one prompt naming all three skills. A single prompt listing multiple skills has them overwrite each other's accounts; three sequential calls each get a clean snapshot-verify cycle, per `haiku`'s own partition rule.

1. **Snapshot** the target before Pass 1 (per `haiku`'s pre-dispatch discipline).
2. **Dispatch Pass 1**, wait, verify (byte/line diff, then read the whole file for meaning — not the agent's report).
3. **Snapshot again** on top of Pass 1's verified output, dispatch Pass 2, wait, verify.
4. **Snapshot again**, dispatch Pass 3, wait, verify.
5. Report what changed pass-by-pass, not just the net diff — a reader deciding whether to trust the result needs to know which pass moved what.

**Stop between passes if a pass fails verification.** A condense running on top of an unverified restructure inherits whatever that restructure silently dropped, and the drop compounds — patch or revert before continuing, never chain onto unverified output.

⚠️ **Verifying a pass and PATCHING it are two acts, and the snapshot between them records your fix without making the next agent see it.** The steps above read as one cycle — verify, snapshot, dispatch — so a patch applied in between feels like part of the verified state it is nominally "on top of". It is not: the next agent re-reads the file, and if it opened the target before your patch landed, it works from the pre-patch copy and then silently reverts you while reporting honestly against its own baseline. Measured 2026-09-11 on a four-file refresh: a restored `<!--LLM-CONTEXT-->` block was gutted a second time by the Pass 2 agent, and the same block needed restoring twice in one run. `haiku` already states the rule ("confirm the file matches the baseline you intend immediately before dispatching"), and stating it again is not the fix — it failed because a patch made minutes ago reads as obviously current.

**So make the next prompt carry the evidence instead of your memory.** After any patch between passes, put the post-patch counts into the next dispatch's prompt as numbers the agent must check before editing (`this file has 18 gotcha lines and 8 Related paths; if you see fewer, stop and report rather than proceeding`). The prompt is an artifact you have to write anyway, so the check rides on work already happening rather than on a discretionary re-read — and it moves the catch to the one party who can still see the mismatch.

**Carry forward the same protected-fact list across all three dispatch prompts.** Build it once, before Pass 1, by reading the target; don't rebuild it per pass, since a fact that survives Pass 1 reworded needs the same protection in Pass 2's prompt even though its wording has changed.

⚠️ **Only two things belong on that list as a CATEGORY, and both for the same reason: they are cross-file contracts a single-file pass cannot see it is breaking.** `{#anchor}`s and `📖` pointers are named by other files, so their loss surfaces somewhere the agent never opens — and both are machine-checkable after the fact, which is what makes blanket protection safe. Everything else goes on as a NAMED INSTANCE whose loss you can state a cost for. The tempting third entry is a content class — dated incidents, `⚠️` callouts, `**Tell:**` lines — and that one inverts the pass: by Pass 3 you are dispatching `unhobble-instructions`, whose entire job is judging whether each rule earns its shape, so protecting a class by its syntax deletes the deliverable and leaves the agent unable to disagree, since a claim about form cannot be refuted the way a claim about code can. Say what the class is FOR and let the agent judge members. 📖 `syafiqkit:haiku` § Writing the prompt for the measured case (2026-09-11) and `../_shared/references/explore-delegation.md` § Handing an agent a judgement-bearing skill.

Every dispatch prompt must name the banned git verbs per `haiku`'s own rule (`commit`, `push`, `stash`, `reset`, `checkout -- .`, `clean`) — this rule exists precisely because a bare "run the skill and report" prompt left one uncaught.

## When not to run all three

A file that's already well-structured and tight needs only `unhobble-instructions` — don't restructure or condense something that isn't bloated or misordered just because this skill exists. Check line count and skim structure first; if restructure and condense would both report "nothing to do," skip straight to unhobble and say so rather than running three passes for one pass's worth of change.

📖 `syafiqkit:update-plugin` for the follow-up — if a pass exposes a gap in `haiku`, `unhobble-instructions`, or either condense skill, that's where the fix belongs, not here.
