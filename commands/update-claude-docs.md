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
| Claude ignored existing docs | **Refinement** (see 3d) | Rule exists but was violated — diagnose why |

**Key distinction:**
- **Gotcha**: Error/symptom → technical fix (project-specific)
- **Guidance**: Behavioral rule for Claude (global `~/.claude/CLAUDE.md`)
- **Pattern**: Reusable architectural solution with code example
- **Refinement**: Existing rule was violated — root cause is missing context, not missing rule (see Step 3d)

## 2. Route to Target

Determine target by finding the **most specific CLAUDE.md** that covers the session's modified files.

### 2a. Discover CLAUDE.md hierarchy

```
Glob: **/CLAUDE.md
```

This reveals the project's structure. Common patterns:

| Structure | Example |
|-----------|---------|
| Single root only | `CLAUDE.md` |
| Root + layers | `CLAUDE.md`, `app/CLAUDE.md`, `resources/js/CLAUDE.md` |
| Root + domains | `CLAUDE.md`, `app/Domain/Payment/CLAUDE.md`, `app/Domain/Invoice/CLAUDE.md` |
| Multi-repo workspace | `CLAUDE.md`, `backend/CLAUDE.md`, `mobile/CLAUDE.md` |

### 2b. Route to the most specific match

Walk session files **from most specific to least specific**:

1. Is there a `CLAUDE.md` in the **same domain/folder** as the modified files? → Use it
2. Is there a **layer-level** `CLAUDE.md` (e.g., `app/CLAUDE.md` for backend, `resources/js/CLAUDE.md` for frontend)? → Use it
3. Is there a **sub-project** `CLAUDE.md` (multi-repo)? → Use it
4. Otherwise → Root `CLAUDE.md`

For global tool/env issues → `~/.claude/CLAUDE.md`

### 2c. Anti-pattern guard

Before writing to ANY `CLAUDE.md`, ask: "Is there a more specific one that covers this?"

| ❌ Don't write to... | ✅ When there's a more specific... |
|---------------------|----------------------------------|
| Root `CLAUDE.md` | `app/CLAUDE.md` or `{sub-project}/CLAUDE.md` exists |
| `app/CLAUDE.md` | `app/Domain/{Name}/CLAUDE.md` exists |
| `resources/js/CLAUDE.md` | Domain-specific frontend doc exists |

**Rule**: Always target the **narrowest scope** that fully covers the gotcha/pattern.

## 3. Execute

### 3a. Read target first

Before adding anything, read the target CLAUDE.md to understand:
- Existing sections and structure
- Whether the entry already exists (avoid duplicates)
- Where the entry fits best (which section/table)

### 3b. Check for duplicates across files

Grep for the key symptom/keyword across ALL `**/CLAUDE.md` files:
- If already in the correct file → skip or refine
- If in the wrong file (e.g., sub-project gotcha in root) → move it, don't duplicate

### 3c. Write the entry

1. Check if entry already exists in target CLAUDE.md
2. Apply formatting rules:

| Found? | Claude followed it? | Action |
|--------|---------------------|--------|
| No | — | Add new entry |
| Yes | Yes | No change needed |
| Yes | No | **Diagnose why** (see 3d), then refine |

3. Use Edit tool to make changes
4. Output summary of what was added/refined

### 3d. Diagnose "rule exists but was violated"

When a rule exists but Claude still broke it, **don't just skip or tweak wording**. Ask:

| Question | If yes → |
|----------|----------|
| Does the rule say "don't do X" but lack a concrete "do Y instead" mapping? | Add a **reference table** mapping old pattern → replacement |
| Was the violation caused by copying from existing code that predates the rule? | Add a gotcha: "Legacy code may use X — always convert to Y" |
| Is the rule buried too deep (wrong section, far from related context)? | Move or cross-reference closer to where the violation occurs |
| Does the supporting reference section (e.g., token table) have gaps? | Fill the gaps — incomplete references cause violations |

**Key insight**: A "don't do X" rule without actionable "do Y" alternatives is half a rule. The fix is often not strengthening the prohibition but **completing the guidance**.

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

## 5. Litmus Test

Before adding, ask: "Would removing this cause Claude to make mistakes?"

| ✅ Include | ❌ Exclude |
|-----------|-----------|
| Commands Claude can't guess | Things Claude infers from code |
| Code style differing from defaults | Standard language conventions |
| Common gotchas / non-obvious behaviors | Long explanations or tutorials |

**Task docs ≠ CLAUDE.md**: A pattern documented in `tasks/**/current.md` still belongs in CLAUDE.md if it applies broadly to a domain. Task docs are feature-scoped and not always read. CLAUDE.md is always loaded — put reusable patterns in both.

## 6. Sync Project Agents (MANDATORY if CLAUDE.md changed)

**Condition**: Did you modify ANY `CLAUDE.md` file in steps 3-5?

| Modified? | Action |
|-----------|--------|
| Yes | **MUST** invoke `syafiqkit:agent-setup` skill |
| No | Skip this step |

**Why**: Project agents have inline critical rules that may need updating when CLAUDE.md high-frequency mistakes change.

**Execute**: Use Skill tool with `skill: "syafiqkit:agent-setup"`
