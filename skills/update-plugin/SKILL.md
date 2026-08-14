---
name: update-plugin
description: >
  Scan the session for learnings about the syafiqkit plugin itself, then patch the affected skill files — trigger descriptions, workflow steps, gotcha and rule tables. Use it when a skill misfired (triggered wrongly, stayed silent when it should have fired, a step turned out wrong mid-execution, or you worked around its instructions instead of following them), when a session hand-edited a skill/command/agent file even with no defect, and as a near-session-end sweep. Cue phrases: "update the plugin", "capture this for the skill", "improve the skill based on this session", "fix the skill trigger". It patches skills that already exist — creating a new one is `skill-creator`, a project gotcha or a general communication preference is `update-claude-docs`.
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

`CONSUMER` (or a non-git dir) → don't patch, don't bump the version.

**A consumer's whole path is Step 1 then upstream** — the patching steps below (2, 3, 3a, 4) don't apply, so read Step 1, then read the upstreaming flow below. A defect a real user hit is worth capturing regardless of who can commit the fix.

Upstreaming means filing a GitHub issue under the user's own identity, which reaches the maintainer fast. **Ask before filing; never post unprompted under the user's name.** 📖 **`references/upstream-consumer-finding.md`** — `gh auth status`, drafting the report, `gh issue create`, and the fenced fallback when `gh` isn't available or the user declines. Report the skill + version, what happened reproducibly, and the suggested fix.

📖 **`../_shared/references/consumer-portability.md`** — read before writing any step that names a plugin path or shell command a consumer would run: `tasks/` not shipping with installs, `/Users/syafiqshamsuddin/.claude/plugins/syafiqkit/` not expanding in markdown, `~` on Windows/WSL.

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

The right target is whichever file actually owns the kind of fact the signal is — not necessarily the skill the session happened to be using when the gap showed up. The skill in front of you revealed the problem; it isn't automatically where the fix belongs.

**Grep the other skills for the mechanism before writing.** Whether a mechanism is shared is what the grep tells you, so treating the sweep as conditional on already knowing means it never runs. 📖 **`references/grep-for-sharing.md`** — how to search, the blind spot that survives a correctly-run grep, and when to route a fix to `_shared/references/` instead of one skill.

**Structural gotchas during routing:** 📖 **`references/routing-gotchas.md`** — contested file detection (via diff content, not git status) and when an agent file is a generated copy (fix the template first).

## Step 3 — Write: Patch the skill files

Apply the most targeted edit for the kind of change:

- **Trigger description** — the frontmatter is matched by keyword against what users actually say, so it should name the words they use, the artifacts they mention, and whatever edge case caused the miss this session. It carries routing vocabulary, not enforcement: a boundary belongs there as the one clause that sends a near-miss to the right skill, while the reasoning behind it lives in the body. A description that accumulates multiple `Do NOT use` clauses has usually stopped triggering better and started just getting longer — the restraint from the body already says everything those clauses are trying to enforce.
- **Workflow rule** — goes into the most relevant existing section; don't spin up a new section for one rule. State the general principle the incident revealed, not a retelling of the incident itself — a rule that names this session's specific artifact or exact wording only fires again on an identical recurrence. The concrete story belongs in the CHANGELOG entry; the skill body carries the abstracted rule.

  Write it with enough reasoning that a future reader can apply it to cases the session didn't encounter. A marker (`⚠️`, bold, `**Tell:**`) belongs on a rule only when the cost of missing it is silent or irreversible — the marker is to stop a careful reader who would otherwise walk past the problem. A fact the reader can't derive (a harness quirk, an exact command, a real binary) is worth stating plainly; a rule that mostly restates what the surrounding prose already covers accumulates without firing better.

  These files ship publicly, so an example naming a command, path or tool is one a stranger has to be able to run. Generalise it to the layer the mechanism actually lives at before writing it — 📖 **`../_shared/references/consumer-portability.md`** names which layer that is for each case, plus what a step may assume about paths, identity probes and the consumer's shell.
- **A rule moved out of a reference and inlined** — placing it in the file is half the job; it also has to sit where that skill acts. A skill with both a "Hard rules" list and its own numbered verify step will have sessions walk the numbered steps and never re-read the list as a checklist, so a check landing in the list is present and still never fires. Ask which step a session is executing when the rule needs to apply, and put it there — if it's genuinely a standing constraint rather than a step, the list is right. Verify by reading the skill's own procedure top-to-bottom as a session would, not by grepping the file for the fact.
- **Architecture decision** — append to the relevant `decisions/*.md` theme file as `Decision | Rationale`, and make the rationale actually explain why.
- **New skill in the registries** — both `CLAUDE.md`'s skill table and `README.md`'s need the entry; they're hand-maintained and easy to update one without the other.

### Step 3a — Density

Whether a file needs tightening is a read, not a formula — if a SKILL.md feels like it's accumulated more constraint than it's earning, that's the signal, not a computed ratio against a fixed number. `references/*.md` files are a different case: they're cold-path lookups meant to be dense, so the same instinct doesn't apply there — what matters for a reference is staying on one topic and being reachable from a pointer that names the actual symptom, not its byte count (a catalog like `task-summary/references/templates.md`, read one section at a time, is expected to grow with what it catalogs).

When a SKILL.md is genuinely dense already, adding a new rule is a good moment to ask what it could replace or where it could move, rather than only appending — a file that gains rules every session and retires none regrows no matter how tightly each one is worded. Candidates for tightening:

- Two callouts making the same point from different angles — say it once, keep the sharper version.
- A worked incident embedded in the instructions themselves — the incident belongs in git history/CHANGELOG; the skill body keeps only the rule it produced.
- A rule that's dead because its trap can't fire anymore (the tool's gone, the format changed) — delete it, don't compress it. Check the tool's actually gone before assuming so.
- A clear default plus a rare branch, both inlined — the rare branch can usually move to `references/` with a short pointer left behind, keeping the common path lean.

If tightening lands, bump the plugin version + CHANGELOG per `CLAUDE.md`'s Version Bumping convention. The invocation might ask to skip one; treat "skip the changelog" as covering the version bump too — they're one convention.

## Step 4 — Before calling it done

Re-read what changed. Does the new text actually address what was missed this session? Does it duplicate something already there? Is it a pattern likely to recur, or a one-off not worth a permanent rule? For a file that was already dense, did the change replace or relocate something, or is it pure addition with no reason given? A good check: read your own new prose against the same judgment this skill applies to the plugin — does the fix embody the instinct it's trying to teach, or does it contradict itself mid-sentence?

## What NOT to capture here

Project-specific gotchas belong in `update-claude-docs`, not here. Vague observations with no actionable pattern are worth skipping. Before adding a rule, check whether it's already there but just forgotten — if so, strengthen the existing wording rather than duplicating the row.

## Output

**Owner** — tell the user which files were patched and what changed, whether `plugin-maintenance/current.md` or `CHANGELOG.md` moved, and any signals found but skipped and why. A signal you skipped on a judgement call rather than a clear non-issue is theirs to overrule, so ask it as a question above this report rather than filing it in the list (`../_shared/references/decision-first-output.md`).

**Consumer** — no files touched; report per the upstreaming flow in Step 0.
