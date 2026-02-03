---
description: Capture patterns/gotchas from coding sessions into CLAUDE.md files. Use after implementing features, fixing bugs, or when session revealed reusable knowledge.
argument-hint: "[optional: focus area]"
---

# Capture Session Knowledge

Extract reusable patterns from this session into CLAUDE.md files.

## 1. Scan Session for Signals

| Signal | Category | Example |
|--------|----------|---------|
| Claude struggled / repeated attempts | Gotcha | "500 error" → "add eager load" |
| User correction ("use X instead") | Gotcha or Guidance | Depends on scope |
| Same pattern used 2+ times | Pattern | Service method, helper |
| Environment surprise | Gotcha | MSYS2, PowerShell quirks |
| Claude ignored existing docs | Refinement needed | Rule exists but wasn't followed |

**Key distinction:**
- **Gotcha**: Error/symptom → technical fix (project-specific)
- **Guidance**: Behavioral rule for Claude (global `~/.claude/CLAUDE.md`)
- **Pattern**: Reusable architectural solution with code example

## 2. Route to Target

| Scope | Target |
|-------|--------|
| Global personal defaults | `~/.claude/CLAUDE.md` |
| Cross-project conventions | Root `CLAUDE.md` |
| Backend-specific | `app/CLAUDE.md` |
| Frontend-specific | `resources/js/CLAUDE.md` |
| Domain-specific | `app/Domains/{Domain}/CLAUDE.md` |

## 3. Execute

**Primary path** — Invoke `claude-md-management:revise-claude-md`:

1. Check if skill is available (installed plugin) if available MANDATORY to use
2. Invoke with session context:
   - Identified signals from Step 1
   - Proposed additions/refinements
   - Target files from Step 2
3. Let the skill handle formatting, deduplication, and structure

**Fallback path** — if skill unavailable:

1. Check if entry already exists in target CLAUDE.md
2. Apply formatting rules:

| Found? | Claude followed it? | Action |
|--------|---------------------|--------|
| No | — | Add new entry |
| Yes | Yes | No change needed |
| Yes | No | Refine existing entry (strengthen wording, add example) |

3. Use Edit tool to make changes
4. Output summary of what was added/refined

## 4. Formatting Guidelines

**Keep entries SHORT** — every line must earn its place.

**Gotchas** (table format, symptom required):
```markdown
| Symptom | Cause | Fix |
|---------|-------|-----|
| `500 on POST /invoices` | Timezone mismatch | `->setTimezone('UTC')` |
```

**Guidance** (for ~/.claude/CLAUDE.md):
```markdown
| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| `grep`, `find` | Grep tool, Glob tool |
```

**Patterns** (only when reusable):
```markdown
### Pattern Name {#anchor}

**Problem**: What recurring problem this solves

**Solution**:
```code
// Key code showing the pattern
```
```

## 5. Litmus Test

Before adding, ask: "Would removing this cause Claude to make mistakes?"

| ✅ Include | ❌ Exclude |
|-----------|-----------|
| Commands Claude can't guess | Things Claude infers from code |
| Code style differing from defaults | Standard language conventions |
| Common gotchas / non-obvious behaviors | Long explanations or tutorials |

## 6. Sync Project Agents

After updating CLAUDE.md, invoke `syafiqkit:agent-setup` to sync project agents.

This bakes the new patterns/gotchas into the agents' system prompts so they don't need to read CLAUDE.md at runtime.
