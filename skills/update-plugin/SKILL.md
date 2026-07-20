---
name: update-plugin
description: >
  Scan the current session for learnings about the syafiqkit plugin itself, then patch the affected skill files (SKILL.md trigger descriptions, workflow steps, gotcha tables, rule tables) based on what was discovered. Use when the user says "update the plugin", "capture this for the skill", "improve the skill based on this session", "fix the skill trigger", or after any session where a skill misfired, a workflow step was wrong, or a new rule/pattern emerged from skill-creator work. This is the plugin equivalent of update-claude-docs — it writes to skill files, not to project CLAUDE.md.
---

# Update Plugin — Capture Session Learnings into Skill Files

After a session that involved creating, using, or debugging syafiqkit skills, this workflow extracts what was learned and patches the actual skill files so future sessions benefit automatically.

The key difference from `update-claude-docs`: that skill writes to CLAUDE.md (project knowledge). This skill writes to SKILL.md files (executable skill artifacts). The bar is higher — only changes that would alter how a skill behaves or triggers belong here.

Can be invoked directly, or as `/done`'s conditional Step 5.

## Step 0 — Ownership gate (run FIRST, before scanning)

Patching only makes sense on the **source checkout**. Verify — never assume:

```bash
git -C ~/.claude/plugins/syafiqkit remote get-url origin 2>/dev/null | grep -q 'syafiq555/syafiqkit' && echo OWNER || echo CONSUMER
```

`CONSUMER` (or a non-git dir) → **do not patch, and skip the version bump.** An installed copy is overwritten by `claude plugin update`, so the edit silently vanishes (and diverges the copy from upstream meanwhile). Write-permission is not the test — whether the edit *survives and belongs* is.

**Still run Step 1's scan** — a defect hit by a real user is the most valuable kind. Then route it upstream (see **Step 5 — Upstream a consumer finding** below) instead of patching.

## Step 1 — Scan: What happened involving the plugin?

⚠️ **"The session" means the WHOLE transcript back to its start, not the turn(s) immediately before this invocation — and stating that isn't enough, a mental "re-scan" still defaults to whatever's freshest.** A substantial recent action (a big merge, a long agent run) reads as "the session," and a mistake corrected in turn 3 feels closed just because it was fixed in the moment — it isn't, since fixing the instance doesn't patch the skill. **Before writing anything, list every distinct user message in the conversation as a numbered line** (one per message, in order, starting from message 1) — not a summary, an actual enumerated list — then mark which lines carry a correction/signal. Re-reading "the recent part again" instead of walking this list is the failure this artifact exists to prevent. If you cannot produce the list (context compacted, transcript unavailable), say so explicitly rather than silently scanning what's left.

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
| A skill (or its `references/*.md`) reads as bloated/dense — the user says "this feels bloated", or bytes/line is noticeably high | **Density pass** — see Step 3a |

⚠️ **Step 3a is unconditional, not gated on the bloat signal above** — every file Step 3 patches gets a density pass in the same edit, bloat-triggered or not. This is how files stay lean: fixed one small edit at a time, not left to drift. The signal row above still matters for a file that isn't otherwise being touched this run.

Skip signals that are project-specific OR a durable working-style/communication preference (both go to `update-claude-docs` instead — a style pref lands in global `~/.claude/CLAUDE.md`, never a SKILL file). The test: would this change alter how a *skill* triggers or behaves? If yes, it belongs here; if it's about how *Claude* should communicate generally, it doesn't.

## Step 2 — Route: Which file needs patching?

For each signal, identify the target:

| Target | When |
|--------|------|
| `skills/<name>/SKILL.md` → `description:` frontmatter | Trigger was wrong or missed |
| `skills/<name>/SKILL.md` → body section | Workflow step, rule, or gotcha was wrong/missing |
| `tasks/plugin-maintenance/current.md` | Architecture decision, new skill added, composition pattern changed |
| `syafiqkit/CLAUDE.md` → Skills table | New skill added to the registry |
| `CHANGELOG.md` | A skill was meaningfully changed (not just minor wording) |
| `skills/agent-setup/templates/<agent>.template.md` (the SOURCE) **+ every generated copy** | A behavioral fix to an AGENT (`.claude/agents/<agent>.md`) that has a template |

Read the target file before writing. Check whether the fix already exists — if a rule is present but Claude ignored it, the fix is to strengthen the wording, not duplicate the rule.

⚠️ **A fix to one skill's handling of a shared mechanism (a field, table, convention several skills read/write) is a fix to all of them.** Step 1's scan is session-scoped, not plugin-wide — but once a signal IS captured, `grep -l` the field/table/convention name across `skills/*/SKILL.md` and patch every skill that touches it the same way. Example: fixing `task-summary`'s LLM-CONTEXT `Last updated` handling also means checking `condense-task-doc` and `merge-task-docs`, which read/write the same field.

⚠️ **An agent (`.claude/agents/<name>.md`) is a GENERATED instance — a durable fix belongs in its TEMPLATE (the source), not only the copy you edited.** If a session (this one included) improves a project's `.claude/agents/<name>.md`, that edit is lost on the next `agent-setup` regeneration and never reaches other projects. Route the fix to `skills/agent-setup/templates/<name>.template.md` FIRST, then port it to every existing copy that should carry it: the plugin's own `.claude/agents/<name>.md` (often a specialized variant — port the PRINCIPLE, keep its domain-specific examples) and the originating project's copy. `find ~/.claude -name '<name>.md' -path '*agents*'` (+ the template) to enumerate all copies before declaring parity. **Tell you missed this: you patched a `.claude/agents/*.md` this session and never opened its `.template.md`.**

## Step 3 — Write: Patch the skill files

For each change, apply the most targeted edit possible, AND run the Step 3a density pass on every file you touch (see below — this is not optional):

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

### Step 3a — Density pass

SKILL.md files are not CLAUDE.md files — `condense-claude-md`/`condense-task-doc` don't apply. Line count alone is a poor signal (most bloated skills in this plugin still sat under 250 lines); run `wc -lc` and flag anything above ~80-90 bytes/line for a closer read.

Execution model (draft/verify split): `_shared/references/two-tier-condense.md`. Checklist below is this skill's own — what to cut, specific to SKILL.md files:

| Pattern | Fix |
|---------|-----|
| Two or more ⚠️ callouts re-justifying the same rule (a later one defends or re-explains the first) | Collapse to one — state the rule once, keep only the sharpest reason |
| A worked incident/anecdote embedded in instruction text ("a session judged...", specific numbers from one past run) | Strip to the bare rule; git history/CHANGELOG owns the incident, not the skill body |
| Illustrative `<example>` blocks that restate a rule already stated plainly nearby | Compress to a one-line parenthetical or cut if the rule reads clearly alone |
| A skill that preaches density/conciseness while itself running long, self-justifying paragraphs | Highest-priority fix — the self-contradiction undermines the skill's own credibility |
| A duplicate rule copied from a sibling skill instead of pointed to (e.g. a numeric threshold restated in two files) | Replace with a pointer to the canonical skill — divergence risk if only one gets updated later |
| A clear hot-path default plus a distinct, infrequently-invoked mode/branch fully inlined in SKILL.md (15+ lines) | Extract to `references/<mode>.md`, leave a short pointer summary — SKILL.md stays lean for the path used every invocation |

After verifying clean (per the shared reference's Verify step): bump the plugin version + CHANGELOG per `CLAUDE.md`'s Version Bumping convention.

## Step 4 — Validate

After writing:
- Re-read each changed file. Confirm the new content doesn't duplicate an existing row.
- For trigger description changes: read the new description and ask "would this have caught what was missed in this session?" If no, revise.
- For rule additions: ask "is this a one-time project quirk, or will this pattern recur across projects?" If one-time, skip it.
- Confirm Step 3a's draft+verify ran on every file touched this session — `wc -lc` each, ratio dropped or held flat, and the diff-verify sub-step actually happened (not skipped because the draft "looked fine").

## What NOT to capture here

- Project-specific gotchas (schema column names, API keys, specific service behavior) → `update-claude-docs` instead
- Vague process notes ("remember to check X") with no actionable rule → skip
- Decisions that are already documented but were just forgotten → strengthen the wording, don't add a duplicate

## Step 5 — Upstream a consumer finding (CONSUMER only)

A consumer can't patch, but they can **file** — and a GitHub issue notifies the maintainer instantly, with no secret shipped and no server to run. Authentication runs on *their* identity, not an embedded token.

⚠️ **ASK FIRST — never file silently.** An unprompted outbound post under the user's own GitHub name is a surprise action with their name on it. Show the drafted report, then ask.

1. Check the channel is available: `gh auth status` (any authenticated account works — the repo is public).
2. Show the drafted report (skill · version · what went wrong · the rule that would fix it) and ask: *"File this as an issue to `syafiq555/syafiqkit`? You'd post as @<their-login>; nothing else is sent."*
3. On **yes**:
   ```bash
   gh issue create --repo syafiq555/syafiqkit --label skill-feedback \
     --title "<skill>: <one-line defect>" --body "<the report>"
   ```
   Return the issue URL — the maintainer is notified by GitHub.
4. On **no**, or if `gh` is unauthenticated/absent → print the same report as copy-pasteable text and point them at `github.com/syafiq555/syafiqkit/issues`.

⚠️ `gh label list --search` **lies** (returns empty for a label that exists). If you must verify a label, read `gh api repos/OWNER/REPO/labels/<name>` — never conclude "missing" from the search.

## Output

**Owner** — tell the user:
- Which skill files were patched and what changed (one line per change)
- Whether `plugin-maintenance/current.md` or `CHANGELOG.md` was updated
- Any signals found but skipped, and why

**Consumer** (Step 0 said `CONSUMER`) — no files were touched. Report:
- **Skill** (+ version), **what happened** (reproducibly), **suggested fix** (the actual rule/wording).
- Then Step 5: offer to file it as a GitHub issue. If filed, give the issue URL; if declined or `gh` is unavailable, leave the report copy-pasteable and point at `github.com/syafiq555/syafiqkit/issues`.
