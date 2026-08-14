# Routing Gotchas — When the Target File Isn't Obvious

Consulted during Step 2 (routing), these are structural traps that surface when scanning for which file needs patching.

## Contested file detection

A file may have uncommitted changes from another session already in-flight. Patching through it risks silent conflicts or duplicated work. Detect this via diff CONTENT, not git status — and check `git diff HEAD -- <file>`, since auto-staging makes unrelated edits look identical to the diff you need to verify.

📖 **`../_shared/references/contested-doc-sections.md`** — detection method and the routing rules once a doc is contested (additive-only edits, don't overwrite Last Session, etc.).

## Agent files are generated copies

An `.claude/agents/` file is usually NOT the source — it's a generated copy from a template. A durable fix belongs in the template (`skills/agent-setup/templates/<agent>.template.md`) first, then ported to the copies it should carry forward, or it's lost on the next regeneration.

Check whether the agent file has a corresponding template by searching `agent-setup/templates/` for the agent's name. If both exist, the template is where the durable fix lands — but it is the regeneration source, not automatically the better text, so where the two have already diverged, read the diff before restoring either way: both can be ahead on different axes, and a wholesale copy discards whichever improvement the other side was carrying (`../../_shared/references/editing-skills-checklist.md` § Editing Agent Files). If no template exists (the agent was created by hand), the file itself is the keeper.
