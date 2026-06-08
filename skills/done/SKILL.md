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

## Steps 3 + 4: Capture Knowledge + Update Task Docs (parallel)

Run both **in parallel** (single message, two Skill tool calls) — they are independent. **Do NOT use `run_in_background`.**

**Step 3 — Capture Session Knowledge → CLAUDE.md:**

```
Skill: syafiqkit:update-claude-docs
```

This is the **single** writer of CLAUDE.md / `CLAUDE.local.md` entries. It scans the FULL conversation for **both** conversational signals (user corrections, convention preferences, team/strategy context, things Claude got wrong) **and** code-level patterns (debugging root causes, env surprises, tool misuse), then handles dedup + routing to the narrowest scope. Do NOT pre-write CLAUDE.md entries in `/done` — delegate the whole capture to the skill, otherwise you force a "don't double-write" reconciliation.

**Step 4 — Update Task Docs:**

Invoke `syafiqkit:task-summary` **with no args** — always let the skill do a multi-domain scan. Never pass a single path.

⚠️ **Why no single-domain shortcut**: Passing an explicit path skips the scan, causing missed updates to related docs (e.g., roadmap when you started from roadmap but only coded in one domain, or bug reports mentioned in chat that need their own stubs). The multi-domain scan is fast and catches everything.

The skill auto-detects create vs update. Handles: path resolution, status updates, completed work, cross-references.

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
