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

Read the whole session, not just the recent turns — a correction that landed three turns ago and was fixed in the moment still hasn't patched the skill, and it's easy to miss because the fix already feels done. If invoked with no defect at all (a session hand-edited a skill/command/agent file and nothing misfired — `/done`'s Gate B), skip straight to Step 4: the deliverable is naming what happened to each touched file, not hunting for a bug that isn't there.

Capture gaps, not presence of working code. A skill that triggered wrongly, a step that was wrong, a missing rule that caused a mistake, or a session that found and worked around a problem — these all ask for a fix. A session that invoked a skill and it worked adds nothing to the file. Specifically:

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

When you find a rule present in the codebase and the session still broke it, the rule failed at one of distinct points. Each has a different fix.

**First: check whether it has failed before.** Search the CHANGELOG for the rule's mechanism — `grep -i` over two or three keywords costs one command. The pattern of prior failures tells you more than this one incident. Where the search returns prior entries, the recurrence *is* the finding, and re-wording is no longer the remedy. Count how many times the idea is already stated across the skill and its references. Past two or three, the repetition has become the defect in its own right: the next reader skims it as settled, and each fix grew the count while trying to cure the symptom. Cut back to one statement in the place it actually fires, and change the *kind* of instrument rather than its wording. A cost the reader must pay before their claim is admissible — or a step whose output *is* the evidence — fails differently than restating it again. **Tell: you are writing a rule whose CHANGELOG shows prior fixes, and your fix is that it should be stated better.**

Then, for a first-time failure (or if the pattern doesn't help), ask which of the four points it was *this* time:

**It was never reached.** The rule sits in a `references/` file behind a pointer the session had no reason to open, below the 5,000-token re-attach boundary, or in a skill that never invoked on the path that failed. Fix the route: make the pointer imperative at the moment the act happens, or move the check into the step that performs it. Adding a duplicate copy of an unreached rule creates two unread copies.

**It was reached and read as satisfied.** The rule says "don't act on a count without reading" and the session had just run four counts — the work already done *feels* like compliance. Wording is already maximal (bolded, `⚠️`, with a tell), so strengthening it further does nothing. What helps is a gate at the irreversible act rather than a statement of principle earlier.

**It was read at invocation and the decision came many turns later.** Distinct from never-reached, which is spatial — this rule was in context, near the top, and the session acted on the parts that applied immediately. But a skill body enters context once and is never re-read (Step 3), so for any skill shaped dispatch-then-verify, the rules governing the *verdict* are consulted from memory rather than from the file: the background agent returns after an arbitrary number of turns, and nothing re-attaches the text. Recency is what fails, not routing or wording, which is why relocating a rule *within* the same file changes nothing — both positions are equally unread at decision time. The remedy is to make the file get re-consulted, or to make the step produce an artifact the next turn must read: a written prompt, a named list, a snapshot path. **Tell: the rule that failed governs a verdict reached after a background agent returned, and your fix is to move it to a different paragraph of the same skill.**

**It was contradicted by another skill.** Two files give opposite instructions and the session followed the other one. Neither is "missing"; re-wording either leaves the conflict unresolved. Find the frame each is right in and scope them, or the next session picks the wrong one just as reasonably.

**The remedy was mandated but unfalsifiable.** The rule required a check performed inside a delegated agent's context, leaving the orchestrator with a claim rather than evidence. Move the check to whoever can still verify it after the agent returns.

⚠️ **Verify your diagnosis against the file.** A plausible story about why a rule didn't fire is the same failure the session is reporting — count-without-reading in disguise. If the story says the rule was unreachable, measure the file's size and position; if it says another skill contradicted it, open the sibling. **Tell: you can state why the rule didn't fire but have not opened the file to confirm it.**

## Step 2 — Route: Which file needs patching?

| Target | When |
|--------|------|
| `skills/<name>/SKILL.md` → `description:` | Trigger was wrong or missed |
| `skills/<name>/SKILL.md` → body | Workflow step, rule, or gotcha was wrong/missing |
| `tasks/plugin-maintenance/{agent-architecture,doc-condensation,external-guidance,madr-structure}/current.md` | Architecture or composition decision; `external-guidance` owns verdicts on outside advice |
| `CLAUDE.md` + `README.md` skill tables | A skill was added to the registry — both hand-maintained; `CLAUDE.md` splits by how a skill fires, so one that auto-fires needs its proactive row too |
| `CHANGELOG.md` | A skill changed meaningfully |
| `skills/agent-setup/templates/<agent>.template.md` + every generated copy | A behavioral fix to an agent that has a template |

Read the target before writing, and check whether the fix already exists — the diagnosis in Step 1a decides the remedy, and re-wording is rarely the answer.

The right target is whichever file actually owns the fact, not the skill where the session happened to discover the gap — that skill revealed the problem but isn't automatically where the fix belongs. **Grep the other skills for the mechanism before writing** — 📖 **`references/grep-for-sharing.md`** covers search strategy, blind spots, and when to route a fix to `_shared/references/` instead of one skill.

⚠️ **Routing is not "find the one owner and stop" — one signal usually lands in several skills, and the patched-one-and-reported failure is the most persistent thing this skill has.** A defect surfaces in whichever skill happened to be running, but the same mechanism is typically *created* in one skill, *consumed* by another, and *maintained* by a third, so fixing the discovery site leaves the other two intact and the next session repeats the failure through a different door. Ask it as a lifecycle rather than a lookup: which skill **writes** this artifact, which **reads** it before acting, which **prunes or maintains** it, and which **verifies** it — then check each, because a skill that never mentions the artifact is the likeliest gap rather than evidence of irrelevance. Measured 2026-09-01: a session patched `setup-project-docs` for a manifest-vs-reality error, reported done, and only under repeated prompting found that `read-summary` named an installed package as valid confirmation (the exact wrong instrument, in the skill that runs *first*), that `update-claude-docs` listed tech stack as derivable-from-manifests (the reasoning that produced the error), and that no skill maintained the doc set the pass had just created. One signal, four files, and the first report claimed one.

**A user prompting you toward another skill means the sweep was too narrow, not that this one file was missed.** Treat it as evidence to widen the whole pass rather than a request to check that single name — the skills they did not name are still unchecked, and they should not have to enumerate them. **Tell: you are writing an output that names one patched skill and the signal was about an artifact more than one skill touches.**

📖 **`references/routing-gotchas.md`** — contested file detection and when an agent file is a generated copy (fix the template first).

## Step 3 — Harness Constraints

**A patch is scheduled, not just filed — pick the mechanism by WHEN the rule must fire.** Each row below loads at a different moment, and a rule in the wrong one is correct, present and inert (verified against `code.claude.com/docs`, 2026-09-10):

| Must fire | Mechanism | Loads |
|---|---|---|
| Every turn | `UserPromptSubmit` hook stdout | Once per turn, harness-injected |
| Every session, past compaction | `hooks/RULESET.md` (SessionStart), project-root `CLAUDE.md` | Start + re-fires on `compact` |
| On touching matching files | `.claude/rules/*.md` with `paths:` | On read of a match |
| When a task starts | Skill body, first **5,000 tokens** (25,000 shared, most-recent first) | On invoke |
| Only if chosen | A `📖` reference | Never, unless opened |

⚠️ **Where Step 1a's diagnosis was "read at invocation, decision came many turns later", the remedy is a different ROW, not a different paragraph.** Both positions in one file are equally unread at decision time, which is why eight prior fixes that moved or reworded a rule all recurred. A rule that must survive recall belongs on something the harness executes rather than something the model chooses to consult.

Two more facts with silent failures: `allowed-tools:` **pre-approves and never restricts** — every tool stays callable whether listed or not, so omitting `Agent` only charges a permission prompt (the most commonly misread field). And an operation whose output must be identical across contexts (checksums, flag combinations) needs exact specification; a heuristic loses that property and a judgement rule loses it faster.

📖 **`references/harness-constraints.md`** — the full reference for token ceilings and re-attachment windows.

## Step 4 — Before writing: Is the file dense already?

Whether a file needs tightening is a read, not a formula — if a SKILL.md feels like it's accumulated more constraint than it's earning, that's the signal, not a computed ratio against a fixed number. `references/*.md` files are a different case: they're cold-path lookups meant to be dense, so the same instinct doesn't apply there — what matters for a reference is staying on one topic and being reachable from a pointer that names the actual symptom, not its byte count.

When a SKILL.md is genuinely dense already, adding a new rule is a moment to ask what it could replace or where it could move, rather than only appending — a file that gains rules every session and retires none regrows no matter how tightly each one is worded. Candidates for tightening:

- Two callouts making the same point from different angles — say it once, keep the sharper version.
- A worked incident embedded in the instructions themselves — the incident belongs in git history/CHANGELOG; the skill body keeps only the rule it produced.
- A rule that's dead because its trap can't fire anymore (the tool's gone, the format changed) — delete it, don't compress it. Check the tool's actually gone before assuming so.

⚠️ **Retracting a rule reaches every file that prescribed the practice, which is more than the files you edit — and the CHANGELOG entry you write will certify the wrong scope.** Every other site still instructs the reader to do the retracted thing, and reads as correct because it *was* correct until now. **Tell: you are writing an entry that says a step was removed and then enumerates the files it was removed from.** 📖 `references/retracting-a-rule.md` for how to grep the practice rather than the file list, and the 1.225.0 case where four files were patched and two more kept prescribing it.
- A clear default plus a rare branch, both inlined — the rare branch can usually move to `references/` with a short pointer left behind, keeping the common path lean.

If tightening lands during this session, bump the plugin version + CHANGELOG per `CLAUDE.md`'s Version Bumping convention. The invocation might ask to skip one; treat "skip the changelog" as covering the version bump too — they're one convention.

## Step 5 — Write: Patch the skill files

Apply the most targeted edit for the kind of change:

- **Trigger description** — the frontmatter is matched by keyword against what users actually say, so it should name the words they use, the artifacts they mention, and whatever edge case caused the miss this session. It carries routing vocabulary, not enforcement: a boundary belongs there as the one clause that sends a near-miss to the right skill, while the reasoning behind it lives in the body.
- **Workflow rule** — goes into the most relevant existing section; don't spin up a new section for one rule. State the general principle the incident revealed, not a retelling of the incident itself. Write it with enough reasoning that a reader can apply it to cases the session didn't encounter. A marker (`⚠️`, bold, `**Tell:**`) belongs only when the risk is silent or irreversible — when the reader could walk past without noticing the cost. A fact the reader can't derive (a harness quirk, an exact command, a real binary) is worth stating plainly. These files ship publicly, so examples naming commands, paths or tools must be ones a stranger can run — generalise to the layer the mechanism actually lives in per 📖 **`../_shared/references/consumer-portability.md`**.
- **A rule moved out of a reference and inlined** — place it where that skill acts, not where it explains the principle. A skill with both a "Hard rules" list and its own numbered steps will have readers walk the steps and never return to the list, so a check that lands in the list is present but still never fires. Ask which step a reader would be executing when the rule needs to apply, and put it there. If it's a standing constraint rather than a step-specific check, the list is right.
- **Architecture decision** — append to the relevant `decisions/*.md` theme file as `Decision | Rationale`, and make the rationale actually explain why.
- **New skill in the registries** — `README.md` and both of `CLAUDE.md`'s invocation tables (Step 2's row). A sync check only asks whether a skill appears somewhere, so a wrong-table filing reads as registered and no sweep surfaces it.

## Step 6 — Before calling it done

Re-read what changed. Does the new text actually address what was missed this session? Count how many times the file and its references now assert the idea (not whether your sentence appears twice, but whether the concept is redundant). Is it a pattern likely to recur, or a one-off not worth a permanent rule? For a file that was already dense, did the change replace or relocate something, or is it pure addition? Read your own new prose against the same judgment this skill applies to the plugin — does the fix embody the instinct it's trying to teach?

## What NOT to capture here

Project-specific gotchas belong in `update-claude-docs`, not here. Vague observations with no actionable pattern are worth skipping. Before adding a rule, check whether it's already there but just forgotten — if so, diagnose why it didn't fire (Step 1) rather than duplicating the row.

## Output

**Owner** — tell the user which files were patched and what changed, whether `plugin-maintenance/current.md` or `CHANGELOG.md` moved, and any signals found but skipped and why. A signal you skipped on a judgement call rather than a clear non-issue is theirs to overrule, so ask it as a question above this report rather than filing it in the list (`../_shared/references/decision-first-output.md`).

**Consumer** — no files touched; report per the upstreaming flow in Step 0.
