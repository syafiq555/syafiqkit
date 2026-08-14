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

The plugin (`~/.claude/plugins/syafiqkit/skills/`) is the default — it's git-backed, shared across all projects, and where the existing skills live. Use it unless the request points to a narrower home: `<project>/.claude/skills/` for workflows that don't generalize past one repo (project-specific commands, paths, or vocabulary), or `~/.claude/skills/` for personal unversioned experiments. Moving a skill later means rewriting every cross-reference, so ask early if the scope is genuinely ambiguous.

## Writing it

**The frontmatter `description` is the whole trigger.** It's matched against what the user actually says, so it must carry the words they'd use — vague phrasings, artifact names, and at least one nearby thing it should *not* handle (pointing at the skill that owns it instead). A description that only restates the skill's function, without the vocabulary of a request, is the most common reason a good skill never fires.

**The body is reasoning, not checklist.** An agent reads it already in the moment of doing the task; write principle and let it apply judgment, rather than pre-empting each failure mode with its own trip-wire. A `⚠️` or bolded imperative is earned only when missing it costs silence or irreversibility — a careful read that still walks past the problem. State facts the reader can't derive (exact commands, binaries with silent costs, structural details) flatly. What accumulates instead is the rule that restates what careful reading already concludes.

Keep it short. If a first draft is much longer, the usual cause is a rare branch inlined beside the common path — move it to `references/` with a pointer left behind.

## Registering it

A plugin skill isn't done when the file exists. Update `CLAUDE.md` and `README.md` (hand-maintained skill tables), version-bump `.claude-plugin/*.json`, and add a CHANGELOG entry — match the neighbouring rows' shape.

⚠️ **Check versions with `git show HEAD:<path>`, not the working copy.** A prior session's uncommitted bump makes the JSONs disagree, and comparing working copies reports drift that the committed state doesn't have — then blames the wrong file as stale.

## Verifying the trigger

Don't skip this; a skill that never fires fails silently. 📖 `references/trigger-testing.md` — how to test whether this description actually wins, how to catch overlap with existing skills (where two describe incompatible workflows for one request), and what a baseline eval looks like.

## After

Mention `update-plugin` for the follow-up: it's what patches the skill when a later session reveals the trigger was wrong or a step misfired. This skill creates; that one maintains.
