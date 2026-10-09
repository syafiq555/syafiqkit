---
name: update-summary
description: Same skill as task-summary under another name — update task summaries with session findings, creating the doc if missing.
---

> 📖 See `syafiqkit:task-summary` — this skill is a thin pointer to that skill. **`Skill(task-summary)` with the same args is your next action — load its body FIRST, then act.** A fuzzy argument (e.g. "check for the template drift") is an instruction *to task-summary*, not a puzzle to interpret inline: "template drift" is task-summary's own doc-vs-template gap-check (§4). Don't `AskUserQuestion` to disambiguate the args, and don't improvise an audit, before the target skill is loaded.
