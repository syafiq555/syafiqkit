---
description: Capture patterns/gotchas from coding sessions into CLAUDE.md files. Use after implementing features, fixing bugs, or when session revealed reusable knowledge.
argument-hint: "[optional: focus area]"
---

# Capture Session Knowledge

Extract reusable patterns from this session into CLAUDE.md files.

⚠️ **CLAUDE.md only — NEVER auto-memory**: All knowledge from this skill goes to CLAUDE.md, CLAUDE.local.md, or task docs. Do NOT write to auto-memory files (`~/.claude/projects/*/memory/`) — not for feedback, not for project context, not for investigation lessons. Memory is invisible to team members and agents; CLAUDE.md is the single source of truth.

⚠️ **Inline critical facts**: When adding a `> 📖 See task doc` pointer, also inline the 1-2 most critical facts. A fresh session won't follow pointers unprompted — the CLAUDE.md entry itself must contain enough to avoid repeating mistakes.

⚠️ **Find the pointer's target by content, not folder name**: Before writing `> 📖 See tasks/.../current.md`, confirm the path exists and is the *right* doc — folder names are engineer-domain-named and rarely match the topic (`upload-redesign` owns "QC", `payout` owns "refund"). `Glob tasks/**/*.md` + `Grep` for the concept's vocabulary + synonyms across doc body + header; never guess the folder slug. A pointer to a non-existent or wrong doc is worse than no pointer.

## 1. Scan — What happened?

Look for these signals in the conversation:

| Signal | Category |
|--------|----------|
| User correction ("not X, it's Y") | Gotcha or Convention |
| Claude struggled / repeated attempts | Gotcha |
| Claude ignored existing rule | **Violation** |
| Claude concluded wrong (checked wrong source, premature narrative, user had to correct) | **Behavioral rule** — add `❌/✅` row capturing what Claude should have done differently |
| Same pattern used 2+ times | Pattern |
| Environment surprise | Gotcha |
| Convention preference | Convention |
| Debugging root cause discovered | Gotcha |
| Team/strategy context | Context → `CLAUDE.local.md` |
| Credentials/tokens/API headers used from config files | Env pattern → `CLAUDE.local.md` |
| CLI pattern reused 3+ times (curl, scp, remote) | Env pattern → `CLAUDE.local.md` |
| External API auth that required trial-and-error | Env pattern → `CLAUDE.local.md` |

For each signal, extract 2-3 keywords and **grep all CLAUDE.md files**:

| Grep result | Classification |
|-------------|---------------|
| No match | **New** — add entry |
| Match in correct file | **Violation** — must refine (see Step 3) |
| Match in wrong file | **Misplaced** — move to correct scope + refine |

## 2. Route — Where does it go?

Find the **most specific** CLAUDE.md (`Glob: **/CLAUDE.md` + check `CLAUDE.local.md`):

1. Personal/team context → `./CLAUDE.local.md` (project root)
2. Same domain as modified files → that domain's CLAUDE.md
3. Layer-level (`app/CLAUDE.md`, `resources/js/CLAUDE.md`)
4. Project root `CLAUDE.md`
5. Global `~/.claude/CLAUDE.md`

**Read target first** — check structure, existing entries, where new entry fits.

### CLAUDE.local.md checklist

Before finishing, actively scan the session for these — they're easy to miss because they feel "obvious" in the moment:

- [ ] **Credentials/tokens** read from config files (`secrets.json`, `.env`, DB) — save the extraction pattern (e.g., `jq -r '.["key"]' path`)
- [ ] **API headers** that required trial-and-error (auth headers, required headers that caused 401/403)
- [ ] **CLI one-liners** used 3+ times (curl templates, scp with password, remote + mysql combos)
- [ ] **External service URLs** discovered during the session (settings pages, portal URLs, API endpoints)
- [ ] **Account mappings** (which token → which account → which subdomain)

These belong in `CLAUDE.local.md` because they contain env-specific context (server passwords, account names, API tokens) that shouldn't be in team-visible `CLAUDE.md`.

| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| Save ANY knowledge to auto-memory files | Write to CLAUDE.md, CLAUDE.local.md, or task doc — memory is invisible to team and agents |
| Write feedback memory for investigation lessons | Add as `⚠️ MANDATORY` workflow section in CLAUDE.md — memory won't prevent next session's mistake |
| `> 📖 See X` pointer without inline summary | Pointer + inline 1-2 critical facts |
| Skip writing because "task doc has it" | CLAUDE.md must be self-sufficient for fresh sessions |
| Skip CLAUDE.local.md because "it's just env stuff" | Save reusable env patterns — next session will waste 10 min rediscovering them |
| Conclude from one data source without cross-checking | Add `❌/✅` behavioral rule to the relevant CLAUDE.md section |

## 3. Write — Hard rules

### New signals → Add entry

- Gotchas: `Symptom | Cause | Fix` table row
- Guidance: `❌ NEVER | ✅ ALWAYS` table row
- Behavioral corrections: `❌ NEVER | ✅ ALWAYS` row capturing what Claude did wrong and what it should do instead. Use when Claude concluded incorrectly, checked wrong source first, or user had to push back ("are you sure?")
- Patterns: Prose + code (reusable only)
- Pair every prohibition with an alternative ("don't X" needs "do Y instead")

### Violations → The rule needs more emphasis, not just clarity

A violated rule **always** needs an update — "the rule is clear" is not a valid reason to skip. Clear but violated = not prominent enough.

| Check | Action |
|-------|--------|
| Buried in a table? | Promote to `⚠️ MANDATORY` callout above the table |
| Not in active workflow? | Add as a numbered step in the workflow sequence |
| Too vague / too long? | Rewrite: one hard constraint beats five soft guidelines |
| Missing the "do Y" half? | Add the alternative action |

**Never** conclude "rule is clear, no update needed" for a violation.

### Constraints

- No duplicates across CLAUDE.md files
- Route to narrowest scope
- One refinement round per signal, then move on
- Use `Edit` tool (not `Write`)

## 4. Prune — Delegate to project agent

After Steps 1–3, check for a project-level pruning agent and delegate:

```
Glob: .claude/agents/claude-md-pruner.md
```

| Agent found? | Action |
|-------------|--------|
| Yes | Launch `subagent_type: "claude-md-pruner"` with file paths to scan |
| No | Skip pruning — do not inline a pruning prompt |

**Agent prompt**: `Prune these CLAUDE.md files: [list paths]. Run in background.`

The agent has its own classification rules, litmus tests, and NEVER-delete safeguards. Do not override its instructions.

## 5. Validate

After writing each entry (in Step 3):
1. Re-grep keyword — confirm no duplicate created
2. Count `|` separators — must match table header
3. "Would removing this cause Claude to repeat the mistake?" — if no, delete it

**Task docs ≠ CLAUDE.md**: Feature-specific patterns stay in `tasks/**/current.md`. Only patterns that apply broadly go in CLAUDE.md.

## 6. Agent Sync

Agents read CLAUDE.md dynamically — no sync needed for gotchas. Only run `syafiqkit:agent-setup` if agent behavioral instructions change.
