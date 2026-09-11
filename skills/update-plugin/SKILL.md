---
name: update-plugin
description: >
  Scan the session for learnings about the syafiqkit plugin itself, then patch the affected skill files — trigger descriptions, workflow steps, gotcha and rule tables. Use it when a skill misfired (triggered wrongly, stayed silent when it should have fired, a step turned out wrong mid-execution, or you worked around its instructions), when a session hand-edited a skill/command/agent file even with no defect, and as a near-session-end sweep. Cue phrases: "update the plugin", "capture this for the skill", "improve the skill based on this session", "fix the skill trigger". It patches skills that already exist — creating a new one is `skill-creator`, a project gotcha or a general communication preference is `update-claude-docs`.
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

**A consumer's whole path is Step 1 then upstream** — the patching steps below (2 through 6) don't apply, so read Step 1, then read the upstreaming flow below. A defect a real user hit is worth capturing regardless of who can commit the fix.

Upstreaming means filing a GitHub issue under the user's own identity, which reaches the maintainer fast. **Ask before filing; never post unprompted under the user's name.** 📖 **`references/upstream-consumer-finding.md`** — `gh auth status`, drafting the report, `gh issue create`, and the fenced fallback when `gh` isn't available or the user declines. Report the skill + version, what happened reproducibly, and the suggested fix.

📖 **`../_shared/references/consumer-portability.md`** — read before writing any step that names a plugin path or shell command a consumer would run.

## Step 1 — Scan: What happened involving the plugin?

Read the whole session, not just the recent turns — a correction that landed three turns ago still hasn't patched the skill. If invoked with no defect (a session hand-edited a file and nothing misfired — `/done`'s Gate B), skip straight to Step 4.

Capture gaps, not presence of working code. Trigger misfires, wrong steps, missing rules, and workarounds all ask for fixes. A working skill adds nothing. Specifically:

| Finding | Belongs in | Fix |
|---------|-----------|-----|
| Trigger misfired (fired wrongly or stayed silent) | `description:` frontmatter | Keyword that captures the miss |
| Workflow step was wrong or corrected mid-execution | Body of that step | The corrected instruction |
| Rule was missing, or a keyword trap has no home | Relevant skill's rules section | The principle, with a concrete example |
| Rule was PRESENT and broke anyway | Step 1a diagnosis | Usually a route or instrument change, not re-wording |
| New skill created this session | `CLAUDE.md` and `README.md` registries | Entry with trigger and purpose |
| Existing skill changed meaningfully | CHANGELOG + `Last updated` note | What the change enables |
| Architecture or composition decision | `plugin-maintenance/current.md` decisions | Decision and rationale |
| Skill or reference reads bloated | This file (after this session) | Tightening pass — see Step 4 |
| Correction to update-plugin's own logic | This file (update-plugin/SKILL.md) | The step that misfired |

Skip anything project-specific or a general communication preference with no skill-trigger implication — those belong in `update-claude-docs` (a project gotcha → project CLAUDE.md, a style preference → global `~/.claude/CLAUDE.md`).

### Step 1a — When the rule was already there

When you find a rule present in the codebase and the session still broke it, the rule failed at one of distinct points. First, grep the CHANGELOG for the rule's mechanism — the pattern of prior failures tells you more than this one incident. If the rule recurred, re-wording is not the remedy; the redundancy itself has become the defect. Cut back to one statement where it actually fires, and change the *kind* of instrument rather than its wording. Then ask which of these four points applied *this* time:

**It was never reached.** The rule sits in a `references/` file, below the 5,000-token re-attach boundary, or in a skill never invoked on the path that failed. Fix the route: make the pointer imperative at the moment the act happens, or move the check into the step that performs it. A duplicate copy of an unreached rule creates two unread copies.

**It was reached and read as satisfied.** The work already done *feels* like compliance. Wording is already maximal, so strengthening it does nothing. What helps is a gate at the irreversible act rather than a statement of principle earlier.

**It was read at invocation, decision many turns later.** A skill body enters context once and is never re-read. For dispatch-then-verify shapes, the verdict rules are consulted from memory, not re-consulted from the file: nothing re-attaches the text after a background agent returns. The remedy is a different harness row (Step 3), not a different paragraph, so a hook fires on the verdict instead of a principle rule.

**It was contradicted by another skill.** Two files give opposite instructions and the session followed the other one. Find the frame each is right in and scope them — re-wording either leaves the conflict unresolved.

**The remedy was unfalsifiable.** The rule required a check inside a delegated agent's context, leaving the orchestrator with a claim rather than evidence. Move the check to whoever can still verify it after the agent returns.

Verify your diagnosis by opening the file: a plausible story about why a rule didn't fire mirrors the session's own failure (count-without-reading in disguise).

## Step 2 — Route: Which file needs patching?

| Target | When |
|--------|------|
| `skills/<name>/SKILL.md` → `description:` | Trigger was wrong or missed |
| `skills/<name>/SKILL.md` → body | Workflow step, rule, or gotcha was wrong/missing |
| `tasks/plugin-maintenance/{agent-architecture,doc-condensation,external-guidance,madr-structure}/current.md` | Architecture or composition decision; `external-guidance` owns verdicts on outside advice |
| `CLAUDE.md` + `README.md` skill tables | A skill was added to the registry — both hand-maintained; `CLAUDE.md` splits by how a skill fires, so one that auto-fires needs its proactive row too |
| `CHANGELOG.md` | A skill changed meaningfully |
| `skills/agent-setup/templates/<agent>.template.md` + every generated copy | A behavioral fix to an agent that has a template |

Read the target before writing, and check whether the fix already exists.

The right target is whichever file actually owns the fact, not where the session discovered the gap. **Grep the other skills for the mechanism before writing** — a defect surfaces in whichever skill happened to run, but the same mechanism is typically *created* in one skill, *consumed* by another, and *maintained* by a third. Ask which skill writes the artifact, which reads it before acting, which maintains it, and which verifies it — then check each. Fixing the discovery site leaves the other two intact and the next session repeats the failure through a different door. One signal, four files; a first report naming one is incomplete.

📖 **`references/grep-for-sharing.md`** — search strategy and when to route to `_shared/references/` instead of one skill. 📖 **`references/routing-gotchas.md`** — contested files and generated agent copies.

## Step 3 — Harness Constraints

**A patch is scheduled, not just filed — pick the mechanism by WHEN the rule must fire.** Each row below loads at a different moment, and a rule in the wrong one is correct, present and inert (verified against `code.claude.com/docs`, 2026-09-10):

| Must fire | Mechanism | Loads |
|---|---|---|
| Every turn | `UserPromptSubmit` hook stdout | Once per turn, harness-injected |
| Every session, past compaction | `hooks/RULESET.md` (SessionStart), project-root `CLAUDE.md` | Start + re-fires on `compact` |
| On touching matching files | `.claude/rules/*.md` with `paths:` | On read of a match |
| When a task starts | Skill body, first **5,000 tokens** (25,000 shared, most-recent first) | On invoke |
| Only if chosen | A `📖` reference | Never, unless opened |

⚠️ **A rule that must survive recall — one governing a verdict reached after a background agent returned — needs a different harness row (Step 3), not reworded prose.** Eight prior fixes that moved or reworded a rule all recurred; both positions in one file are equally unread at decision time. A hook is the only mechanism that fires at the verdict rather than leaving it to the model's memory.

Two more facts with silent failures: `allowed-tools:` **pre-approves and never restricts** — every tool stays callable whether listed or not, so omitting `Agent` only charges a permission prompt. And an operation whose output must be identical across contexts (checksums, flag combinations) needs exact specification; a heuristic loses that property and a judgement rule loses it faster.

📖 **`references/harness-constraints.md`** — the full reference for token ceilings and re-attachment windows.

## Step 4 — Before writing: Is the file dense already?

Whether a file needs tightening is a read, not a formula — if a SKILL.md feels like it's accumulated more constraint than it's earning, that's the signal, not a computed ratio against a fixed number. `references/*.md` files are a different case: they're cold-path lookups meant to be dense, so the same instinct doesn't apply there — what matters for a reference is staying on one topic and being reachable from a pointer that names the actual symptom, not its byte count.

When a SKILL.md is genuinely dense already, adding a new rule is a moment to ask what it could replace or where it could move, rather than only appending. Candidates for tightening:

- Two callouts making the same point from different angles — say it once, keep the sharper version.
- A worked incident embedded in the instructions themselves — the incident belongs in git history/CHANGELOG; the skill body keeps only the rule it produced.
- A rule that's dead because its trap can't fire anymore (the tool's gone, the format changed) — delete it, don't compress it. Check the tool's actually gone before assuming so.
- A clear default plus a rare branch, both inlined — the rare branch can usually move to `references/` with a short pointer left behind, keeping the common path lean.

⚠️ **Retracting a rule reaches every file that prescribed the practice, which is more than the files you edit.** Every other site still instructs the reader to do the retracted thing, and reads correct because it *was* correct until now. Grep the practice rather than just the file list before writing the CHANGELOG. 📖 `references/retracting-a-rule.md`.

If tightening lands during this session, bump the plugin version + CHANGELOG per `CLAUDE.md`'s Version Bumping convention. The invocation might ask to skip one; treat "skip the changelog" as covering the version bump too — they're one convention.

## Step 5 — Write: Patch the skill files

Apply the most targeted edit for the kind of change:

- **Trigger description** — name the words users say, artifacts they mention, edge cases. It carries routing vocabulary: a boundary clause sends a near-miss to the right skill.
- **Workflow rule** — goes into the most relevant existing section; don't spin up a new section for one rule. State the general principle, not a retelling. A marker (`⚠️`, bold, `**Tell:**`) belongs only when the risk is silent or irreversible. These files ship publicly, so examples must generalize to the mechanism's layer, not name exact paths users can't run. Per 📖 **`../_shared/references/consumer-portability.md`**.
- **A rule moved out of a reference and inlined** — place it where that skill acts, not where it explains. A skill with both a rules list and numbered steps will have readers walk the steps and never return to the list.
- **Architecture decision** — append to `decisions/*.md` as `Decision | Rationale`, and make the rationale explain why.
- **New skill in the registries** — `README.md` and both of `CLAUDE.md`'s invocation tables. A wrong-table filing reads as registered and no sweep surfaces it.

## Step 6 — Before calling it done

Re-read what changed. Does the new text address what was missed? Count how many times the file and its references now assert the idea (is the concept redundant). Is it a pattern likely to recur, or a one-off not worth a permanent rule? For a file that was already dense, did the change replace something or is it pure addition? Does the fix embody the instinct it's trying to teach?

## What NOT to capture here

Project-specific gotchas belong in `update-claude-docs`, not here. Vague observations with no actionable pattern are worth skipping. Before adding a rule, check whether it's already there but just forgotten — if so, diagnose why it didn't fire (Step 1) rather than duplicating the row.

## Output

**Owner** — tell the user which files were patched and what changed, whether `plugin-maintenance/current.md` or `CHANGELOG.md` moved, and any signals found but skipped and why. A signal you skipped on a judgement call rather than a clear non-issue is theirs to overrule, so ask it as a question above this report rather than filing it in the list (`../_shared/references/decision-first-output.md`).

**Consumer** — no files touched; report per the upstreaming flow in Step 0.
