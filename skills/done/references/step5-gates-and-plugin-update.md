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

## Gate Rationale

**Gate B is a *file-modification* test and cannot answer whether a skill misled you, it only says the plugin tree changed.** Reverting a bad edit erases exactly the evidence Gate B looks for, so better defect handling makes the gate likelier to report nothing. Measured 2026-09-03: a session was sent wrong, reverted its own and template edits, saw empty status, reported "gate did not fire", two invocations later the same signal patched five files. **Gate A is answered by recalling the session, not by status command.** Did a skill send you somewhere wrong? Did you correct a step mid-execution? Did you work around an instruction? A `git status` cannot answer these. On any session where you fixed something, treat Gate A as likelier.

**Gate B re-fires on work already routed.** Once files land in a session commit they stay in `git show --stat` for every later `/done`. A second run sees the same hit with nothing new, which reads as unrouted. Ask what changed since the last `update-plugin` run: nothing new means the gate is satisfied. A genuinely new signal means invoking scoped to it. Also read the CHANGELOG head, your signal may already be captured there, and two version bumps in one afternoon is a collision to avoid.
