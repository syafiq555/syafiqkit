# Enforcing House Style on a CLAUDE.md

Referenced by the skills that rewrite an existing CLAUDE.md — `update-claude-docs` (Create, Rewrite, Capture) and `condense-claude-md`. Apply before the first structural edit.

## The rule

**House style is the standard, in every repo. A CLAUDE.md's existing shape is never a reason to leave it as-is.**

Someone installing this plugin is installing an opinion about how a CLAUDE.md should be built — the taxonomy, the `❌/✅` pairing for bare do/don'ts, `Symptom | Cause | Fix` for lookup gotchas, prose where a rule needs reasoning, an `{#anchor}` on every heading. That opinion is the product. A pass that finds a file written some other way and defers to it delivers nothing; the user asked for the restructure by invoking the skill.

So: convert free-form bullets to `❌/✅` rows, debugging notes to `Symptom | Cause | Fix` rows, reasoning-bearing tables to prose, sections into taxonomy order, and add every missing anchor — in the plugin's own repo and in a consumer's alike. `references/structure.md` in `update-claude-docs` is the authority for what house style *is*.

**Consistency in the existing file is not evidence to weigh.** A shape applied uniformly is what a single pass produces, whoever ran it, so uniformity tells you a pass was uniform and nothing about whether it was right. Judging "this looks deliberate" is a guess about intent that the file cannot actually support.

## What still constrains the pass

Enforcing shape is not licence to lose content. The safety gate is unchanged and it is the part that matters:

- **Inventory every rule before touching anything**, and diff that inventory against the result. Every load-bearing rule survives, possibly relocated. A rewrite that silently drops a hard-won gotcha is worse than no rewrite, and shape conversion is exactly where a cell's content gets dropped on the way into prose.
- **Deletion is the capture filter's job, not the formatter's.** Content goes only because it is derivable from the code, linter-enforced, or feature-specific — never because it didn't fit the shape you were converting into.
- **Facts stay literal.** A command, an error string, an id or a port is an exact value; converting it into flowing prose produces a paragraph that reads complete and can't be acted on. Reasoning becomes prose, values stay in rows.

## Say what you changed

State it in one line before the edit lands — *restructuring to house style: 4 tables to prose, 11 bullets to ❌/✅ rows, 3 sections reordered, 6 anchors added.* The file's owner should be able to see that a restructure happened and what it did, rather than meeting it in a diff. This is the cheapest half of the pass and the half most often skipped, because the changes feel self-evident at the moment you make them and are invisible an hour later.

## Task docs are a different artifact

This file is about CLAUDE.md. Task docs (`tasks/**/current.md` and `decisions/*.md`) have their own template in `task-summary`, and there the older judgement still holds: **drift is a section going missing, not a shape that differs — reshape only where the current shape loses something.** A split axis that fits the domain, or columns carrying real gotchas, are correct as they stand. Don't carry CLAUDE.md's conformance rule across to them.
