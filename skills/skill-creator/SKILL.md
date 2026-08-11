---
name: skill-creator
description: Create a new skill — draft its SKILL.md, place it in the right location, register it in the skill tables, and pressure-test that its trigger actually fires. Use when the user says "create a skill", "make a skill for X", "turn this into a skill", "I keep doing X manually", or describes a workflow they want captured for reuse. Also use when a session reveals a repeated procedure worth capturing that no existing skill covers. Do NOT use for editing an existing skill's trigger or workflow (that's `update-plugin`), for auditing one for overconstraint (`unhobble-instructions`), or for creating an agent (`agent-setup`).
---

# Skill Creator

Write a new skill that actually fires when it should and earns its place once it does.

## First: should this be a skill at all?

Most "I keep doing X" moments don't need one. A skill earns its existence when the knowledge is procedural (a sequence with real forks), reusable across sessions, and not derivable from the codebase in front of you. Against that, three cheaper homes usually win:

- A **fact about this project** — a schema quirk, a deploy step, a gotcha — belongs in CLAUDE.md via `update-claude-docs`. Skills that are really just facts never trigger reliably, because there's no moment that summons them.
- A **behavior you want on every turn** goes in CLAUDE.md too. A skill is loaded on demand; if it must always apply, it isn't a skill.
- An **existing skill that's close** should be extended rather than forked. Grep the skills dir for the concept's vocabulary before writing — two skills covering adjacent ground both trigger weakly, and the user gets whichever matched more keywords.

Say so plainly if one of those fits better. Talking someone out of a skill is a good outcome, not a failure to deliver.

## Where it goes

Three homes, and the request usually settles which: `~/.claude/plugins/syafiqkit/skills/` (shared everywhere, git-backed, needs the registration below), `<project>/.claude/skills/` (when the commands, paths, or vocabulary don't generalize past one repo), or `~/.claude/skills/` (personal, unversioned). The plugin is where all the existing ones live, so it's the assumption worth defaulting to when nothing in the request points elsewhere. Ask only when it's genuinely ambiguous — moving a skill later means fixing every cross-reference to it, which is what makes the fork worth a question when you can't tell.

## Writing it

**The frontmatter `description` is the whole trigger.** It's matched against what the user actually says, so it should carry the words they'd use — including the imprecise ones. Name the artifacts involved, the phrasings that should summon it, and at least one nearby thing it should *not* handle, pointing at whichever skill owns that instead. A description that only describes the skill's function, without the vocabulary of a request, is the single most common reason a good skill never fires.

**The body is read by an agent already in the moment of doing the task.** Write the reasoning and let it apply judgement to what it just read, rather than pre-empting each way it could go wrong with its own trip-wire — `unhobble-instructions` exists because that accumulates. A `⚠️` or a bolded imperative is earned when the cost of missing something is genuinely silent or irreversible, the case where a careful reader still walks past the problem; it stops meaning that if every rule carries one.

State facts the reader can't derive — an exact command, a real binary with a silent cost, a structural detail of this setup — flatly and keep them. What accumulates instead is the rule that mostly restates what a competent read of the surrounding prose already concludes.

Keep it short enough to read in the moment. The leanest skills here run under 100 lines; if a first draft is much longer, the usual cause is a rare branch inlined beside the common path, which can move to `references/` with a pointer left behind.

## Registering it

A plugin skill isn't done when the file exists: `CLAUDE.md` and `README.md` both carry hand-maintained skill tables, and the plugin's own convention wants a version bump in both `.claude-plugin/*.json` plus a CHANGELOG entry. Match whatever shape the neighbouring rows already use rather than inventing one.

The one thing that isn't derivable from reading those files: check versions with `git show HEAD:<path>`, not the working copy. A prior session's uncommitted bump makes the two JSONs disagree, and comparing working copies reports drift that the committed state doesn't have — then names the wrong file as stale.

## Verifying the trigger

The part worth not skipping, because a skill that never fires fails silently and looks fine. Take three or four phrasings you'd plausibly use months from now — including a vague one, and one that names the artifact but not the action — and check honestly whether this description would win against the other skills' descriptions. Where it wouldn't, the fix is usually vocabulary in the description, not more explanation in the body.

Also test the near-miss in the other direction: name something adjacent that should route elsewhere, and confirm the description's exclusions actually send it there. A skill that fires too eagerly costs more than one that fires too rarely, because it displaces the right skill silently.

Both of those tests read your own description and ask what it wins. The failure they can't see is a sibling whose description already claims your subject in words you'd never grep for, because you're searching your feature's vocabulary and it names the category — a skill about redesigning pages doesn't grep "UI/UX work". So open the descriptions of every skill in adjacent territory and read what they claim, rather than inferring it from their names or the registry table's one-line summary. What makes this worth the minutes is that overlap isn't symmetric in cost: where two skills prescribe *incompatible* workflows for one request — one gating all implementation behind an approval dialogue, the other building small changes directly — whichever fires decides the collaboration model, and the user experiences a spacing fix turning into an interrogation. When you find real overlap, a clause in each description naming the boundary is the fix, and it belongs in both files: the new skill deferring upward is only half of it, since the incumbent goes on claiming the same ground. Nothing checks this automatically, and a new skill's trigger is a claim about every existing trigger.

If a baseline eval is wanted (does the skill beat no-skill on a real task), move the skill directory out before running the without-skill arm — an installed skill gets discovered and used anyway, which contaminates the comparison.

## After

Mention `update-plugin` for the follow-up: it's what patches the skill when a later session reveals the trigger was wrong or a step misfired. This skill creates; that one maintains.
