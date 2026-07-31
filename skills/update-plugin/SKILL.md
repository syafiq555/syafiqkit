---
name: update-plugin
description: >
  Scan the current session for learnings about the syafiqkit plugin itself, then patch the affected skill files (SKILL.md trigger descriptions, workflow steps, gotcha tables, rule tables) based on what was discovered. Fire it the moment a skill misfired this session — triggered when it shouldn't have, stayed silent when it should have fired, a workflow step turned out wrong mid-execution, or you found yourself working around a skill's instructions instead of following them. Also fire near session end, after any skill-creator work, to sweep for missed signals. Fire it too when a session simply HAND-EDITED a skill/command/agent file with no defect at all — the deliverable then is just naming what happened to each touched file (tightened, moved, or grew, and why), not finding a bug. Cue phrases: "update the plugin", "capture this for the skill", "improve the skill based on this session", "fix the skill trigger". Do NOT use for a project-specific gotcha (schema, API key, service behavior) or a durable communication/working-style preference with no skill-trigger implication — both go to `update-claude-docs` instead. The test is whether the fix changes how a *skill* triggers or behaves, versus how Claude communicates generally.
---

# Update Plugin — Capture Session Learnings into Skill Files

After a session that involved creating, using, or debugging syafiqkit skills, this workflow extracts what was learned and patches the actual skill files so future sessions benefit automatically. `update-claude-docs` writes to CLAUDE.md (project knowledge); this skill writes to SKILL.md files (executable skill artifacts) — the bar for a change here is higher, since it alters what an agent actually does, not just what it knows.

Can be invoked directly, or as `/done`'s conditional Step 5.

## Step 0 — Ownership

Patching only makes sense on the plugin's own dev checkout — an installed copy gets silently overwritten by `claude plugin update`, so an edit there vanishes and diverges from upstream in the meantime. Check the plugin dir's own git remote, not the working directory (this skill is usually invoked from a project, and a bare `git rev-parse` there answers for the wrong repo):

```bash
D=~/.claude/plugins/syafiqkit
[ "$(git -C "$D" rev-parse --show-toplevel 2>/dev/null)" = "$(cd "$D" && pwd -P)" ] \
  && git -C "$D" remote get-url origin 2>/dev/null | grep -q 'syafiq555/syafiqkit' && echo OWNER || echo CONSUMER
```

`CONSUMER` (or a non-git dir) → don't patch, don't bump the version. Still run Step 1 — a defect a real user hit is valuable regardless — then route it upstream via Step 5 instead of editing files.

📖 **`_shared/references/consumer-portability.md`** — read before writing any step that names a plugin path or shell command a consumer would run: `tasks/` not shipping with installs, `${CLAUDE_PLUGIN_ROOT}` not expanding in markdown, `~` on Windows/WSL.

## Step 1 — Scan: What happened involving the plugin?

Read the whole session, not just the recent turns — a correction that landed three turns ago and was fixed in the moment still hasn't patched the skill, and it's easy to miss because the fix already feels done. If invoked with no defect at all (a session hand-edited a skill/command/agent file and nothing misfired — `/done`'s Gate B), skip straight to Step 3a: the deliverable is naming what happened to each touched file, not hunting for a bug that isn't there.

Signals worth capturing:

| Signal | What to capture |
|--------|-----------------|
| A skill triggered when it shouldn't (or didn't when it should) | Fix the `description:` frontmatter |
| User corrected a workflow step mid-execution | Fix the step |
| A rule was missing and caused a mistake | Add it to the relevant skill's rules/gotchas |
| A new skill was created this session | Update `plugin-maintenance/current.md` + `CLAUDE.md`'s skill table |
| An existing skill changed meaningfully | Update its `Last updated` note; update `plugin-maintenance/current.md` if the architecture shifted |
| A merge/refactor decision about the plugin itself | Add to `plugin-maintenance/current.md`'s Architecture Decisions |
| A keyword trap or nuance future sessions need | Name it as a rule with a concrete example, in the relevant skill |
| A skill or reference reads as bloated | Density pass — Step 3a |
| The correction was to update-plugin's own logic, not a skill it was patching | This file is a valid target too — fix the step that misfired here |

Skip anything project-specific or a general communication preference with no skill-trigger implication — those belong in `update-claude-docs` (a project gotcha → project CLAUDE.md, a style preference → global `~/.claude/CLAUDE.md`).

## Step 2 — Route: Which file needs patching?

| Target | When |
|--------|------|
| `skills/<name>/SKILL.md` → `description:` | Trigger was wrong or missed |
| `skills/<name>/SKILL.md` → body | Workflow step, rule, or gotcha was wrong/missing |
| `tasks/plugin-maintenance/{agent-architecture,doc-condensation,external-guidance,madr-structure}/current.md` | Architecture or composition decision; `external-guidance` owns verdicts on outside advice |
| `CLAUDE.md` + `README.md` skill tables | A skill was added to the registry — both are hand-maintained, update both |
| `CHANGELOG.md` | A skill changed meaningfully |
| `skills/agent-setup/templates/<agent>.template.md` + every generated copy | A behavioral fix to an agent that has a template |

Read the target before writing, and check whether the fix already exists — if a rule is present but got ignored, strengthen the wording rather than duplicate it.

The right target is whichever file actually owns the kind of fact the signal is — not necessarily the skill the session happened to be using when the gap showed up. The skill in front of you revealed the problem; it isn't automatically where the fix belongs. If the fix touches a mechanism several skills share (a shared field, a shared convention), route it to `_shared/references/` and point every owner at it rather than fixing one copy — a quick grep for how the other skills already talk about that mechanism (their own vocabulary, not the new rule's wording) usually settles who else needs it. And if the fix is really about how the *harness* behaves — install layout, what a variable expands to, which shell runs — that's worth actually checking (a doc, an installed artifact) rather than reasoned from the repo, since a plausible guess here is often wrong in exactly the environment the fix is meant to serve.

Two narrower structural facts worth knowing:
- A target with another writer's uncommitted work on it is contested — don't patch through it, and don't drop the finding either. Tell contested state by diff content, not by git status (auto-staging makes edits from two sessions look identical). If the rule is shared, its natural home in `_shared/references/` is free to write even when the caller's own file isn't; if only the contested file needs it, just name the exact spot in your report so the next session can apply it in one step.
- An agent file under `.claude/agents/` is usually a generated copy — a durable fix belongs in its template (`skills/agent-setup/templates/`) first, then ported to the copies that should carry it, or it's lost on the next regeneration.

## Step 3 — Write: Patch the skill files

Apply the most targeted edit for the kind of change:

- **Trigger description** — the frontmatter is matched by keyword against what users actually say, so it should name the words they use, the artifacts they mention, and whatever edge case caused the miss this session.
- **Workflow rule** — goes into the most relevant existing section; don't spin up a new section for one rule. State the general principle the incident revealed, not a retelling of the incident itself — a rule that names this session's specific artifact or exact wording only fires again on an identical recurrence. The concrete story belongs in the CHANGELOG entry; the skill body carries the abstracted rule.
- **Architecture decision** — append to the relevant `decisions/*.md` theme file as `Decision | Rationale`, and make the rationale actually explain why.
- **New skill in the registries** — both `CLAUDE.md`'s skill table and `README.md`'s need the entry; they're hand-maintained and easy to update one without the other.

### Step 3a — Density

Whether a file needs tightening is a read, not a formula — if a SKILL.md feels like it's accumulated more constraint than it's earning, that's the signal, not a computed ratio against a fixed number. `references/*.md` files are a different case: they're cold-path lookups meant to be dense, so the same instinct doesn't apply there — what matters for a reference is staying on one topic and being reachable from a pointer that names the actual symptom, not its byte count (a catalog like `task-summary/references/templates.md`, read one section at a time, is expected to grow with what it catalogs).

When a SKILL.md is genuinely dense already, adding a new rule is a good moment to also ask what it could replace or where it could move, rather than only appending — a file that gains rules every session and retires none regrows no matter how tightly each one is worded. Worth watching for while tightening:

- Two callouts making the same point from different angles — say it once, keep the sharper version.
- A worked incident embedded in the instructions themselves — the incident belongs in git history/CHANGELOG; the skill body keeps only the rule it produced.
- A rule that's dead because its trap can't fire anymore (the tool's gone, the format changed) — delete it, don't compress it. Check the tool's actually gone before assuming so.
- A skill arguing for concision while itself running long — fix that first, it undercuts everything else in the file.
- A clear default plus a rare branch, both inlined — the rare branch can usually move to `references/` with a short pointer left behind, keeping the common path lean.

After tightening: bump the plugin version + CHANGELOG per `CLAUDE.md`'s Version Bumping convention, unless the invocation says to skip one (treat "skip the changelog" as covering the version bump too — they're one convention). Ask if it's unclear which was meant.

## Step 4 — Before calling it done

Re-read what changed. Does the new text actually address what was missed this session? Does it duplicate something already there? Is it a pattern likely to recur, or a one-off not worth a permanent rule? For a file that was already dense, did the change replace or relocate something, or is it pure addition with no reason given? And it's worth reading your own new prose once against the density instincts above — a fix for "stop writing rigid imperatives" that is itself a rigid imperative is a real and easy way to undercut the point mid-sentence.

## What NOT to capture here

- Project-specific gotchas → `update-claude-docs`
- Vague notes with no actionable rule → skip
- Something already documented but just forgotten → strengthen the wording, don't duplicate

## Step 5 — Upstream a consumer finding (CONSUMER only)

A consumer can't patch, but can file — a GitHub issue reaches the maintainer fast, under their own identity. Ask before filing; never post unprompted under the user's name.

📖 **`references/upstream-consumer-finding.md`** — the flow: `gh auth status`, drafting the report, `gh issue create`, and the fenced fallback if `gh` isn't available or the user declines.

## Output

**Owner** — tell the user which files were patched and what changed, whether `plugin-maintenance/current.md` or `CHANGELOG.md` moved, and any signals found but skipped and why.

**Consumer** — no files touched. Report the skill + version, what happened (reproducibly), and the suggested fix. Then offer Step 5.
