---
name: done
description: Post-task cleanup - simplify code, review changes, update docs, capture session knowledge. Use when finished implementing or when user says "done", "wrap up", "finalize".
---

# Post-Task Workflow

Execute all steps in sequence without pausing for confirmation.

| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| `run_in_background: true` on any Agent call | Run agents in **foreground** (no `run_in_background`) |
| Run agents one at a time when independent | Two Agent calls in **same message** for parallel foreground execution |

**User args**: If the user passed instructions with `/done` (e.g., "make sure this works for X"), address those FIRST before proceeding with the standard steps. The user's instructions override defaults. Record what you did about them in the **User Instructions** table of the Output. If no args were passed, omit that table.

## Mode selection (decide first)

**Light mode** when the session touched **<5 files in a single domain** AND no new feature/architecture was introduced (bug fix, small tweak, config change):
- Step 1: ONE reviewer agent only (skip the separate simplifier — tell the reviewer to also flag obvious duplication).
- Step 4: invoke `syafiqkit:task-summary` WITH the known doc path (skip the multi-domain scan — you already know the one affected doc).
- Output: the compact single-table form (see Output).

**Full mode** (default) for everything else — multi-file features, multi-domain sessions, anything with external inputs (WhatsApp/ClickUp pastes) that may need new doc stubs. When in doubt, full.

## Step 1: Simplify + Review (parallel)

Run both agents **in parallel** (single message, two Agent tool calls). **Do NOT use `run_in_background`** — run in foreground so results are available immediately.

**Check for project agents first:**
```
Glob: .claude/agents/code-simplifier.md
Glob: .claude/agents/code-reviewer.md
```

| Agent | Project agent found? | Fallback subagent_type |
|-------|---------------------|------------------------|
| Simplifier | `subagent_type: "code-simplifier"` | `"code-simplifier:code-simplifier"` |
| Reviewer | `subagent_type: "code-reviewer"` | `"feature-dev:code-reviewer"` |

<example>
`Glob: .claude/agents/code-reviewer.md` returns a hit → spawn `subagent_type: "code-reviewer"`.
Same Glob returns nothing → spawn `subagent_type: "feature-dev:code-reviewer"`.
Run the Glob first every time — don't assume the project agent exists or doesn't.
</example>

**Agent count — auto-scale by changed-file count, user arg overrides.** Count changed files first (`git diff --name-only` + `git diff --staged --name-only`, unioned), then pick agents-per-role:

| Changed files | Agents per role (reviewer + simplifier) |
|---------------|------------------------------------------|
| ≤15 | 1 |
| 16–40 | 2 |
| 41+ | 3 (hard cap) |

A user arg always wins: "2 agents each" / "4 each" sets the count explicitly (ignore the table); a count is also implied by "split it up". Light mode (`<5` files) already means 1 reviewer + 0 simplifier — it takes precedence over the table's bottom bucket.

When count >1 per role, **partition the file list** across the same-role agents by domain/directory — each agent gets a disjoint slice (file count sets *how many*; domain sets *which files each gets*, so coupled files stay together). NEVER hand every same-role agent the full list: duplicated review + conflicting edits on the same file. All agents run in ONE message (foreground, parallel).

**Prompt for both must include:**
- The file slice this agent owns (full paths) — its partition, not the whole list when split
- For simplifier: focus on duplication removal, readability, pattern consistency
- For reviewer: focus on bugs, security, logic errors, project convention violations

> Project agents have a Bootstrap section — they read relevant CLAUDE.md files themselves. Do NOT paste project conventions into the prompt.

**After both complete:**
- If reviewer found issues → **confirm each against the actual code before fixing** (grep the call site / re-read the line — a finding is a claim, not a verdict), then fix and continue. Don't blind-apply; don't dismiss either — a real bug a blanket `replace_all` left behind looks identical to a false positive until you check.
- If simplifier made changes → verify they were applied (linter may have auto-formatted) AND that nothing was over-collapsed (an intentional guard/workaround removed). Re-run `php -l`/`tsc` on touched files — "declared but not used" = a half-done refactor.

## Step 2: Clean up temp code

Scan session for temporary artifacts that should be removed:

| Artifact | How to detect | Action |
|----------|--------------|--------|
| Test buttons / debug UI | `TEMP:`, `TODO: REMOVE`, `test buttons` in modified files | Ask user: "Remove temp test code from {file}?" |
| `console.log` debugging | `console.log` added this session | Remove unless intentional |
| Commented-out old code | Large commented blocks from migration | Remove if replaced |

**Skip if**: No temp artifacts found.

## Steps 3 + 4: Capture Knowledge + Update Task Docs (parallel)

Run both **in parallel** (single message, two Skill tool calls) — they are independent. **Do NOT use `run_in_background`.**

**Step 3 — Capture Session Knowledge → CLAUDE.md:**

```
Skill: syafiqkit:update-claude-docs
```

This is the **single** writer of CLAUDE.md / `CLAUDE.local.md` entries. It scans the FULL conversation for **both** conversational signals (user corrections, convention preferences, team/strategy context, things Claude got wrong) **and** code-level patterns (debugging root causes, env surprises, tool misuse), then handles dedup + routing to the narrowest scope. Do NOT pre-write CLAUDE.md entries in `/done` — delegate the whole capture to the skill, otherwise you force a "don't double-write" reconciliation.

**Step 4 — Update Task Docs:**

Invoke `syafiqkit:task-summary` **with no args** in full mode — let the skill do a multi-domain scan. In **light mode**, pass the known doc path instead.

⚠️ **Why full mode scans**: Passing an explicit path skips the scan, causing missed updates to related docs (roadmaps, bug reports mentioned in chat that need stubs). Light mode is exempt because its trigger condition (single domain, no external inputs) rules those out.

The skill auto-detects create vs update. Handles: path resolution, status updates, completed work, cross-references.

> Agent files no longer contain injected CLAUDE.md content — they read it dynamically. No agent syncing needed.

## Output

One combined table. Detail only what was actually WRITTEN or FIXED — never enumerate skipped signals or "nothing to do" rows beyond the status icon.

```
## /done Summary

| Step | Result |
|------|--------|
| Simplify | [changes made, or ✅ none needed] (full mode only) |
| Review | [issues found + fixed, or ✅ clean] |
| Cleanup | [removed, or ➖] |
| Knowledge | [N entries → target files, one line each; "0 new" if none] |
| Task docs | [doc path → one-line summary of the update] |
| User args | [what was done about them] (only if args passed) |
```
