---
name: update-plugin
description: >
  Scan the current session for learnings about the syafiqkit plugin itself, then patch the affected skill files (SKILL.md trigger descriptions, workflow steps, gotcha tables, rule tables) based on what was discovered. Use when the user says "update the plugin", "capture this for the skill", "improve the skill based on this session", "fix the skill trigger", or after any session where a skill misfired, a workflow step was wrong, or a new rule/pattern emerged from skill-creator work. This is the plugin equivalent of update-claude-docs — it writes to skill files, not to project CLAUDE.md.
---

# Update Plugin — Capture Session Learnings into Skill Files

After a session that involved creating, using, or debugging syafiqkit skills, this workflow extracts what was learned and patches the actual skill files so future sessions benefit automatically.

The key difference from `update-claude-docs`: that skill writes to CLAUDE.md (project knowledge). This skill writes to SKILL.md files (executable skill artifacts). The bar is higher — only changes that would alter how a skill behaves or triggers belong here.

## Step 1 — Scan: What happened involving the plugin?

Look for these signals in the session:

| Signal | What to capture |
|--------|-----------------|
| A skill triggered when it shouldn't (or didn't trigger when it should) | Fix the skill's `description:` frontmatter |
| User corrected a workflow step mid-execution | Add the correct step / fix the wrong one in the skill's workflow |
| A rule was missing and caused a mistake | Add the rule to the relevant skill's `## Rules` or critical gotcha table |
| A new skill was created this session | Update `plugin-maintenance/current.md` skill table + syafiqkit `CLAUDE.md` skill table |
| An existing skill was edited this session | Update the skill's `Last updated` note if it has one; update `plugin-maintenance/current.md` if architecture changed |
| A merge/refactor decision was made about the plugin itself | Add to `plugin-maintenance/current.md` Architecture Decisions table |
| A "keyword trap" or nuance that future sessions need to know | Add as a named rule with a concrete example in the relevant skill |

Skip signals that are project-specific (those go to `update-claude-docs` instead). The test: would this change be useful the next time *this skill* is used in *any* project? If yes, it belongs here.

## Step 2 — Route: Which file needs patching?

For each signal, identify the target:

| Target | When |
|--------|------|
| `skills/<name>/SKILL.md` → `description:` frontmatter | Trigger was wrong or missed |
| `skills/<name>/SKILL.md` → body section | Workflow step, rule, or gotcha was wrong/missing |
| `tasks/plugin-maintenance/current.md` | Architecture decision, new skill added, composition pattern changed |
| `syafiqkit/CLAUDE.md` → Skills table | New skill added to the registry |
| `CHANGELOG.md` | A skill was meaningfully changed (not just minor wording) |

Read the target file before writing. Check whether the fix already exists — if a rule is present but Claude ignored it, the fix is to strengthen the wording, not duplicate the rule.

## Step 3 — Write: Patch the skill files

For each change, apply the most targeted edit possible:

**Fixing a trigger description** — rewrite the `description:` frontmatter to include the missing context. Trigger descriptions work by keyword match against the user's message; they should name:
- The action words users say ("merge", "consolidate", "find related")
- The artifacts they mention ("task docs", "current.md", "skill files")
- Edge cases that caused misses this session

**Adding a workflow rule** — insert into the most relevant existing section (Rules table, Critical Gotchas, or a named workflow step). Don't add a new section for one rule. Rules should be actionable: `❌ X | ✅ Y` format or `| Signal | Action |` table rows.

**Adding an architecture decision** — append to the `## Architecture Decisions` table in `plugin-maintenance/current.md`. Format: `| Decision | Rationale |`. The rationale should explain *why* — not just what.

**Adding a new skill to registries** — update both:
1. `tasks/plugin-maintenance/current.md` → `### Current Skills` table
2. `syafiqkit/CLAUDE.md` → `### Skills` table

Both tables must stay in sync.

## Step 4 — Validate

After writing:
- Re-read each changed file. Confirm the new content doesn't duplicate an existing row.
- For trigger description changes: read the new description and ask "would this have caught what was missed in this session?" If no, revise.
- For rule additions: ask "is this a one-time project quirk, or will this pattern recur across projects?" If one-time, skip it.

## What NOT to capture here

- Project-specific gotchas (schema column names, API keys, specific service behavior) → `update-claude-docs` instead
- Vague process notes ("remember to check X") with no actionable rule → skip
- Decisions that are already documented but were just forgotten → strengthen the wording, don't add a duplicate

## Output

Tell the user:
- Which skill files were patched and what changed (one line per change)
- Whether `plugin-maintenance/current.md` or `CHANGELOG.md` was updated
- Any signals found but skipped, and why
