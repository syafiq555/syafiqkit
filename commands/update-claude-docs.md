---
description: Capture patterns/gotchas from coding sessions into CLAUDE.md files. Use after implementing features, fixing bugs, or when session revealed reusable knowledge.
argument-hint: "[optional: focus area]"
---

# Capture Session Knowledge

Extract reusable patterns from this session into CLAUDE.md files.

## 0. Pre-Flight Reasoning

```
<thinking>
- What happened? Corrections, repeated attempts, env surprises?
- For each signal: new behavior (Gotcha/Pattern), rule violation, or wrong-tool choice?
- Which CLAUDE.md hierarchy exists in this project?
</thinking>
```

## 1. Scan Session for Signals

### Code-level signals

| Signal | Category | Example |
|--------|----------|---------|
| Claude struggled / repeated attempts | Gotcha | "500 error" → "add eager load" |
| Same pattern used 2+ times | Pattern | Service method, helper |
| Environment surprise | Gotcha | MSYS2, PowerShell quirks |
| Claude ignored existing docs | **Refinement** (see 3d) | Rule exists but was violated — diagnose why |
| Claude used wrong tool for task | **Tool guidance** (see 3e) | Grep for symbol lookup → should be LSP `findReferences` |

### Conversational signals

| Signal | Category | Route to |
|--------|----------|----------|
| User correction ("not X, it's Y") | Gotcha or Convention | CLAUDE.md or `CLAUDE.local.md` |
| Convention preference ("use X not Y") | Convention | CLAUDE.md (if team-wide) or `CLAUDE.local.md` |
| Team/environment context (members, tools, setups) | Context | `CLAUDE.local.md` |
| Strategic decisions ("before prod we will...") | Decision | `CLAUDE.local.md` |
| Active work context (PRs, branches, blockers) | Context | `CLAUDE.local.md` |
| Debugging root cause discovered | Gotcha | CLAUDE.md (gotcha table) |

**Categories**: Gotcha = error/symptom → fix | Guidance = behavioral rule (global) | Pattern = reusable with code | Context = session/team knowledge → `CLAUDE.local.md` | Refinement = violated rule (diagnose in 3d)

### 1b. Audit signals against existing rules (MANDATORY)

Extract 2-3 keywords per signal (tool names, error messages, env terms), then grep all CLAUDE.md files:

| Grep result | Classification | Action |
|-------------|---------------|--------|
| No match anywhere | **New** | Add entry (Step 3b→3c) |
| Match in target CLAUDE.md | **Violation** | Diagnose why violated (Step 3d), then refine |
| Match in wrong CLAUDE.md | **Misplaced** | Move to correct scope + evaluate refinement |

⚠️ Violations and Misplaced signals ALWAYS require action in Step 3d — "no new knowledge" only valid for New signals.

## 2. Route to Target

Find the **most specific file** covering the signal (via `Glob: **/CLAUDE.md` + check for `CLAUDE.local.md`):

1. **Personal/team context** (team members, active PRs, env preferences, strategy) → `./CLAUDE.local.md` (project root)
2. Same domain/folder as modified files? → Use that CLAUDE.md
3. Layer-level (e.g., `backend/CLAUDE.md`, `frontend/CLAUDE.md`)? → Use it
4. Sub-project (multi-repo)? → Use it
5. Root `CLAUDE.md` (team-shared project rules)
6. `~/.claude/CLAUDE.md` (global tool/env issues)

**Important**: `CLAUDE.local.md` lives at **project root** (`./CLAUDE.local.md`), NOT inside `.claude/`.

**Always ask**: "Is there a more specific one?" before writing — don't duplicate across scopes.

## 3. Execute

### 3a. Read target first

Before adding anything, read the target CLAUDE.md to understand:
- Existing sections and structure
- Whether the entry already exists (avoid duplicates)
- Where the entry fits best (which section/table)

### 3b. Check for duplicates and confirm violations

- **New signals**: Grep key symptom across all CLAUDE.md files — if found → reclassify as Violation; if wrong file → move, don't duplicate
- **Violation signals**: Read matched rule's line range; extract exact text; pass to 3c with `Found=Yes, Followed=No`
- **Misplaced signals**: Move to correct target (Step 2), then evaluate if refinement needed (3d)

### 3c. Write the entry

| Entry exists? | Claude followed? | Action |
|---------------|------------------|--------|
| No | — | Add new entry |
| Yes | Yes | No change needed |
| Yes | No | Diagnose why (3d), then refine |

**Constraints**: No duplicates | Route to narrowest scope | Never tweak without diagnosing (3d) | Pair prohibition + alternative | Use Edit tool

### 3d. Diagnose "rule exists but was violated"

**Don't just skip or tweak wording**. Ask:

- Missing "do Y instead" mapping? → Add reference table (old pattern → replacement)
- Legacy code predates rule? → Add gotcha: "Legacy code may use X — convert to Y"
- Rule buried in wrong section? → Move or cross-reference to context
- Supporting reference gaps? → Fill gaps (incomplete references cause violations)

**Key insight**: "don't do X" without actionable "do Y" is half a rule — complete the guidance, don't just strengthen prohibition.

**Stopping condition**: After one round of refinement per signal, mark it resolved and move to the next. Do not re-diagnose the same signal in the same session.

### 3e. Diagnose "wrong tool used"

- Rule exists but too soft? → Refinement (see 3d)
- Rule missing? → Add ❌/✅ mapping with concrete task → tool pairs
- Falls back mid-task? → Add chaining workflow (numbered steps to stay in preferred tool)
- Tool only useful for some tasks? → Add fallback clause

**Escalation**: Persists 2+ sessions → upgrade from table entry to dedicated subsection with `⚠️ MANDATORY` + explicit ❌/✅ task-to-tool mapping.

## 3f. Validate Written Entry

After writing, verify:
1. Addresses all points in original signal
2. No duplicate (re-grep key symptom)
3. Format matches section (table for gotchas/guidance; prose+code for patterns)
4. If fails → revise before next signal

## 4. Formatting Guidelines

| Type | Format |
|------|--------|
| Gotchas | Table: Symptom \| Cause \| Fix (project-specific) |
| Guidance | ❌/✅ table for global `~/.claude/CLAUDE.md` rules |
| Patterns | Prose + code (reusable only) |

## 4b. Condensation Rules

When CLAUDE.md accumulates too many gotcha rows:

| Entry type | Action |
|------------|--------|
| Gotcha with actionable ❌/✅ | Promote to Critical Rules (drop Symptom/Cause) |
| "Fixed:" or strikethrough | Delete (one-time fix in codebase) |
| Duplicate of Critical Rule | Delete |
| IDE/tool hint | Delete (not a code rule) |
| API contract blob | Replace with pointer + one-sentence shape |
| Metadata column | Drop |

**Litmus test**: Is this fix already permanent in codebase with no regression risk? → Yes = delete.

## 5. Litmus Test

Before adding: "Would removing this cause Claude to make mistakes?"

| ✅ Include | ❌ Exclude |
|-----------|-----------|
| Commands Claude can't guess | Standard conventions |
| Non-obvious gotchas | Tutorials/explanations |

**Task docs ≠ CLAUDE.md**: Patterns in `tasks/**/current.md` that apply broadly still go in CLAUDE.md (task docs feature-scoped, CLAUDE.md always loads).

## 6. Agent Sync

Agents read CLAUDE.md dynamically — no sync needed after adding gotchas. Only invoke `syafiqkit:agent-setup` if agent behavioral instructions need changing (not for new gotchas).
