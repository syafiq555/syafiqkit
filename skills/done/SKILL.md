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

**User args**: If the user passed instructions with `/done` (e.g., "make sure this works for X"), address those FIRST before proceeding with the standard steps. The user's instructions override defaults.

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

**Prompt for both must include:**
- List of modified files this session (full paths)
- For simplifier: focus on duplication removal, readability, pattern consistency
- For reviewer: focus on bugs, security, logic errors, project convention violations

> Project agents have a Bootstrap section — they read relevant CLAUDE.md files themselves. Do NOT paste project conventions into the prompt.

**After both complete:**
- If reviewer found issues → fix them immediately, then continue
- If simplifier made changes → verify they were applied (linter may have auto-formatted)

## Step 2: Clean up temp code

Scan session for temporary artifacts that should be removed:

| Artifact | How to detect | Action |
|----------|--------------|--------|
| Test buttons / debug UI | `TEMP:`, `TODO: REMOVE`, `test buttons` in modified files | Ask user: "Remove temp test code from {file}?" |
| `console.log` debugging | `console.log` added this session | Remove unless intentional |
| Commented-out old code | Large commented blocks from migration | Remove if replaced |

**Skip if**: No temp artifacts found.

## Step 3: Conversation Analysis

**This step is critical.** Scan the FULL conversation for signals that go beyond code changes. Do NOT skip or rush this step.

### 3a. Extract signals from conversation

Re-read the conversation and extract every instance of:

| Signal type | What to look for | Route to |
|-------------|-----------------|----------|
| **User corrections** | "not X, it's Y", "that's wrong", "actually..." | CLAUDE.md (gotcha or ❌/✅ rule) |
| **Convention preferences** | "use X not Y", "why are we using X", "isn't it better to..." | CLAUDE.md (convention) or `CLAUDE.local.md` |
| **Team context** | Team member names, who works on what, PRs in flight | `CLAUDE.local.md` |
| **Environment context** | "we use Herd", "team uses Windows", dev setup details | `CLAUDE.local.md` or root CLAUDE.md |
| **Strategic decisions** | "before production we will...", "our plan is...", migration strategy | `CLAUDE.local.md` |
| **Things Claude got wrong** | Wrong assumptions, false positives, bad advice given | CLAUDE.md (gotcha) if reusable, else skip |
| **Active work context** | Current PRs, branches, what's being reviewed, blockers | `CLAUDE.local.md` |
| **Debugging discoveries** | Root causes found, non-obvious fixes, env-specific behaviors | CLAUDE.md (gotcha table) |

**Output a table** of every signal found before writing anything:

```
| # | Signal | Source (quote user) | Route to | New or existing? |
|---|--------|--------------------|---------|--------------------|
```

### 3b. Dedup check

For each signal, grep all CLAUDE.md files + `CLAUDE.local.md` for existing entries:
- **Already captured** → skip
- **Partially captured** → update existing entry
- **Not captured** → write new entry

### 3c. Write entries

Route each signal to the correct file:

| Target | Location | What goes here |
|--------|----------|---------------|
| `CLAUDE.local.md` | Project root (`./CLAUDE.local.md`) | Personal/team context, active work, env preferences, strategic decisions |
| Project CLAUDE.md | `./CLAUDE.md` | Team-shared project rules, architecture decisions |
| Sub-project CLAUDE.md | `backend/CLAUDE.md`, `frontend/CLAUDE.md` | Layer-specific gotchas, patterns |

**Important**: `CLAUDE.local.md` is at **project root**, NOT inside `.claude/`.

### 3d. Validate

Re-read each modified file and verify entries were written correctly.

## Steps 4 + 5: Update Task Docs + Capture Code Patterns (parallel)

Run both **in parallel** (single message, two Skill tool calls) — they are independent. **Do NOT use `run_in_background`.**

**Step 4 — Update Task Docs:**

Invoke `syafiqkit:task-summary` for the primary domain/feature.

If the path is obvious from session context, pass it directly to avoid discovery overhead:
```
Skill: syafiqkit:task-summary
Args: tasks/{domain}/{feature}/current.md
```

The skill auto-detects create vs update. Handles: path resolution, status updates, completed work, cross-references.

**Step 5 — Capture Code-Level Patterns:**

```
Skill: syafiqkit:update-claude-docs
```

The skill handles: routing to correct CLAUDE.md (sub-project vs root), dedup check across files.

**Important**: Step 3 (conversation analysis) may have already written some CLAUDE.md entries. The `update-claude-docs` skill in Step 5 focuses on **code-level** patterns (errors, env surprises, tool misuse). Step 3 focuses on **conversational** signals. They complement each other — Step 5 should not duplicate what Step 3 already wrote.

> Agent files no longer contain injected CLAUDE.md content — they read it dynamically. No agent syncing needed.

## Output

Provide a detailed summary — not just status icons. Show what was actually captured.

```
## /done Summary

### Code Quality
| Step | Status | Details |
|------|--------|---------|
| Simplify | ✅/⚠️ | [specific changes made, or "no simplifications needed"] |
| Review | ✅/⚠️ | [specific issues found and fixed, or "no issues"] |
| Cleanup | ✅/➖ | [what was removed, or "nothing to clean"] |

### Knowledge Captured

**Conversation signals found: [N]**

| # | Signal | Written to | Entry |
|---|--------|-----------|-------|
| 1 | [quote from user] | [target file] | [what was written] |
| 2 | ... | ... | ... |

**Signals skipped (already captured): [N]**

### Docs Updated
| File | What changed |
|------|-------------|
| [file path] | [specific update] |

### User Instructions
| Instruction | Status | Action taken |
|-------------|--------|-------------|
| [what user asked for] | ✅/⚠️ | [what was done about it] |
```
