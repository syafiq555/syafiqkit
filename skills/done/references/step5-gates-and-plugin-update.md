# Step 5: Plugin Capture Gates and Update Logic

Skip this step if neither gate fires. When a gate fires, invoke `syafiqkit:update-plugin` — it owns everything downstream.

## Gate A — Skill Signal

Capture if a skill misfired, a workflow step was wrong, a trigger missed, or an absent rule caused a mistake. Most runs have none — skip silently.

**What counts as a signal:**
- A deviation you caught (you declined to follow a step or worked around something)
- A workaround you typed into an agent prompt

**What does NOT count:**
- Merely using skills successfully
- A correct-looking step that went as planned

For each signal: record what instruction the skill or docs lacked. The fix belongs in the agent file or docs, not in the prompt.

## Gate B — Session Wrote to Skill Files

Measure it:
```bash
# Run from the plugin checkout (CWD), not git -C <path>, which walks up to enclosing repos
git status --short -- 'skills/**/*.md' 'commands/*.md' '.claude/agents/*.md'
```

The checkout is shared by every project, so it may carry another session's work. **Settle ownership:**

1. Compare each file's modification time against your session's start
2. Files stamped OUTSIDE your window drop out (earlier = prior work, later = peer writing concurrently)
3. If the list empties, Gate B did not fire

**Important:** A clean mtime pass is not ownership — read `git diff HEAD -- <file>` on anything you don't remember editing, since a foreign edit is recognisable on sight. `HEAD` matters: a bare `git diff` misses the staged plane the harness auto-stages your own work into, so it reports your files as foreign. Getting this wrong ships someone else's in-flight work under your version bump.

See `${CLAUDE_SKILL_DIR}/../_shared/references/diff-ownership.md` for the full logic.

## Reporting Gate Findings

For each surviving file, say which happened:

- **Replaced** — a rule replaced one already there
- **Routed** — content moved to `references/`
- **Grew** — the file grew and no retirement was available

The third answer is legitimate and worth stating plainly; what it is NOT is the silent default, which is how a corpus reaches 2:1 additions-to-removals with every individual rule justified.

## Plugin Update

Invoke `syafiqkit:update-plugin` once both gates are checked:

- **Owner** → patch the skill files + version bump + CHANGELOG
- **Consumer** → draft and offer to file as a GitHub issue upstream

Either way the finding survives.
