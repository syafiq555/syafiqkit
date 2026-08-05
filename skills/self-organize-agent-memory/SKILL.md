---
name: self-organize-agent-memory
description: ANY project agent's own .md definition (code-simplifier, code-reviewer, product-reviewer, task-builder — whichever one has the problem) has grown a large inline reference table or block of standing facts that's crowding out its procedural instructions — e.g. code-simplifier's "Don't Simplify" table, or code-reviewer's "Known False Positives" table. Dispatch THAT SAME agent to read its own file and decide what stays inline versus what belongs in its own .claude/agent-memory/<agent>/ directory. Trigger phrasings: "this agent file is too long, move some of it to memory", "let the agent organize its own memory", "the [agent]'s [table name] is huge again", "have the agent self-organize its instructions", "code-reviewer's false-positives list is bloated". Does NOT apply to a bare "shrink/condense/trim this agent file" with no memory-migration intent (that's just editing the file directly, or condense-claude-md's mechanism applied by hand — this skill is specifically about MOVING content to agent-memory, not making prose denser in place), to CLAUDE.md/companion files (unhobble-instructions or condense-claude-md), or to creating a NEW agent from scratch (agent-setup) — this is specifically an EXISTING agent reorganizing content it already owns into its own memory, and it applies the same way regardless of WHICH agent that is.
---

# Self-Organize Agent Memory

The mechanic: dispatch the agent **onto itself**, not a different reviewer agent auditing it from outside. Whichever agent owns the bloated file deciding what belongs in its own memory produces a result in that agent's own established voice and judgment; a different agent making the same call is grading someone else's homework by a rubric it invented. This applies identically no matter which agent has the problem — the file just happens to be `code-simplifier.md` in one project, `code-reviewer.md` in another.

## When this applies

A project agent's `.md` file has a block of content that is dense, standing, and self-contained — `code-simplifier`'s "these patterns look like bugs but aren't" table, `code-reviewer`'s "known false positives, don't re-flag these" table, a list of prior extraction verdicts, anything the agent would otherwise re-derive from scratch each session if it weren't written down. It's grown to the point where scrolling past it to reach the procedural steps (Bootstrap, Process, Rules) costs more than it should. That's the trigger — not a line-count threshold, since a table that's earning its length by covering real distinct facts isn't the problem this skill exists for.

**Bootstrap/Process/Rules never move, even if they'd technically fit in memory.** Agent-memory is Glob'd on demand, not loaded automatically — a step the agent needs every single invocation, in a fixed order, has to stay inline or it becomes something the agent might forget to go look up. The candidate content for this skill is specifically the standing-fact kind: true regardless of what task the agent is doing this run, not something that governs *how* the agent runs.

Check first whether the agent already has an `agent-memory/<agent-name>/` directory (`Glob .claude/agent-memory/<agent>/*.md`). If it does, this is continuing an established pattern. If it doesn't, decide alongside the agent whether creating one is the right move here, or whether the content is too small/one-off to be worth a whole new persistent directory (a handful of rows might just stay inline).

## Running it

Dispatch the agent on itself with something like: *"Read your own definition file. Some of the content in it is a standing reference table rather than a procedural instruction. Decide for yourself what belongs inline (things you need every invocation, in the order you need them) versus what belongs in your own agent-memory (dense standing facts you'd Glob on demand) — your Bootstrap/Process/Rules steps never move, only the standing-fact content. If you decide to move something, first read your existing `agent-memory/<you>/MEMORY.md` (if one exists) and follow whatever shape it already uses — some agents index as a flat list of pointers, others group by domain with headers and inline facts alongside pointers; match your own established shape rather than picking a new one. Write the moved content into memory files in whatever format actually serves the content, and add an index row for each new file to MEMORY.md in the same pass. Come back with what you moved and why."*

No prescribed migration checklist, no mandated output format. The agent read the content that got written into it session after session; it's better positioned to judge its own shape than an outside audit applying a template. Where the format question turns out genuinely open (self-contained entries vs. a shared-principle-plus-instances structure, one memory file vs. several split by some real axis), that's the agent's call to make and explain — not something this skill should pre-decide for it.

## Verify, don't trust the summary

Before anything else, confirm the dispatched agent actually wrote to disk — 📖 `../_shared/references/verifying-a-write-landed.md`'s mirror-direction note: a subagent's closing report can describe specific, plausible-sounding moves (which table went where, what got renamed) against a target whose bytes never changed, and every check below passes trivially on an unedited file, so this has to come first, not be assumed from the report reading as detailed.

Once the write is confirmed, there's one more outside check: after the agent reports what it moved, confirm nothing was silently dropped in translation. Pull every distinctive identifier from the original content (a class name, a bug number, a decision ID, an exact error code) and grep the new memory files for each one. A rewrite that generalizes a specific fact into vaguer prose — "an unhandled error" instead of "a raw 1062 MySQL duplicate-key error" — reads as a clean summary and is a real loss; the identifier sweep is what catches it, not a re-read that just confirms the new prose sounds plausible.

Then confirm the agent's own file still makes sense on its own: the pointer to the new memory file(s) is clear, nothing that was inline and load-bearing (a tool grant reason, a Bootstrap ordering) got swept out along with the reference table, and any other file that names an entry count or references the old inline content got updated to match.

Last, confirm `MEMORY.md` actually gained a row for each new file — a memory file with no index entry is invisible to a future session's `Glob`-then-`MEMORY.md` bootstrap read, which is a silent version of the same fact-loss the identifier sweep catches, just one level up (the file exists, but nothing points a future session at it).

## After

`update-plugin` picks up if a later session finds the self-organized memory format didn't actually serve the agent well, or the split axis it chose turns out wrong.
