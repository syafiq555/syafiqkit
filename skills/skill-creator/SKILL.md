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

⚠️ **`CLAUDE.md` splits skills by *how they fire*, so ask which tables the skill belongs in rather than filing it in one and moving on.** "Direct user invocation" and "Proactive invocation (model auto-fires on symptom match)" are separate tables, and a skill that fires both ways needs a row in each — `read-summary`, `brainstorming` and `uiux` all carry two. A registry-sync check cannot catch this: it verifies a skill appears *somewhere*, so a skill filed under the wrong mode reads as registered and the omission is invisible to every sweep. The cost falls on exactly the skills that most need auto-firing, since a skill listed as direct-only is one the registry tells future readers to wait for a typed command before using. Measured 2026-09-11: `judgement` — written specifically to fire unprompted mid-task, because the rule it carries had already failed when it depended on being recalled — shipped in the direct-invocation table only. **Tell: the skill's own description argues it must fire at a moment the user is not typing, and you have written one registry row.**

**`git status` on all four registry files before touching any of them.** They're exactly the files `update-plugin` writes to, so a peer session mid-plugin-maintenance leaves them `MM` more often than any other path in the repo — measured 2026-09-11, all four plus the two version JSONs already carried a concurrent session's uncommitted work when this step ran. Additive edits (appending a table row, prepending a CHANGELOG entry) are safe to layer on top; don't commit the result, since committing would sweep the peer's staged slice in under your message.

⚠️ **The two version files can disagree with EACH OTHER in the uncommitted state, not just with `HEAD` — check both working copies against each other, not just against `HEAD`.** `plugin.json` and `marketplace.json` are bumped as one atomic change, but a session can leave that bump half-done, and `git show HEAD:<path>` only catches the case where the working copy is stale relative to what's committed — it says nothing when both working copies have moved but disagree with each other (measured 2026-09-11: `plugin.json` at `1.257.0`, `marketplace.json` still at `1.250.0`, both ahead of `HEAD`'s `1.243.0`). Read both working copies, take the higher of the two as the real current version, then bump from there.

## Verifying the trigger

The session that wrote the file can't invoke it yet. Skills are registered when the session starts, so a `Skill` call on one you just created returns `Unknown skill` no matter how correct the file is — run `/reload-skills` first, and read the "N skills available (M added)" line to confirm yours is among them. Worth knowing because the error names the skill rather than the registry, which reads as a bad `name:` field or a misplaced file and sends you editing something that was already right.

Don't skip this; a skill that never fires fails silently. 📖 `references/trigger-testing.md` — how to test whether this description actually wins, how to catch overlap with existing skills (where two describe incompatible workflows for one request), and what a baseline eval looks like.

## After

Mention `update-plugin` for the follow-up: it's what patches the skill when a later session reveals the trigger was wrong or a step misfired. This skill creates; that one maintains.
