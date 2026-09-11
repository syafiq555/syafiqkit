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

**Carry forward the same protected-fact list across all three dispatch prompts** — anchors, `📖` pointers, dated incidents (for CLAUDE.md) or MADR decisions/status fields (for a task doc). Build this list once, before Pass 1, by reading the target; don't rebuild it fresh for each pass, since a fact that survives Pass 1 reworded needs the same protection in Pass 2's prompt even though its exact wording has changed.

Every dispatch prompt must name the banned git verbs per `haiku`'s own rule (`commit`, `push`, `stash`, `reset`, `checkout -- .`, `clean`) — this rule exists precisely because a bare "run the skill and report" prompt left one uncaught.

## When not to run all three

A file that's already well-structured and tight needs only `unhobble-instructions` — don't restructure or condense something that isn't bloated or misordered just because this skill exists. Check line count and skim structure first; if restructure and condense would both report "nothing to do," skip straight to unhobble and say so rather than running three passes for one pass's worth of change.

📖 `syafiqkit:update-plugin` for the follow-up — if a pass exposes a gap in `haiku`, `unhobble-instructions`, or either condense skill, that's where the fix belongs, not here.
