---
description: Capture patterns/gotchas from coding sessions into CLAUDE.md files. Use after implementing features, fixing bugs, or when session revealed reusable knowledge.
argument-hint: "[optional: focus area]"
---

# Capture Session Knowledge

Extract reusable patterns from this session into CLAUDE.md files.

## 0. Pre-Flight Reasoning

Before scanning, think through:

```
<thinking>
- What happened in this session? Any corrections, repeated attempts, or env surprises?
- For each signal: is it a new behavior (Gotcha/Pattern), a rule violation, or a wrong-tool choice?
- Which CLAUDE.md hierarchy exists in this project?
</thinking>
```

## 1. Scan Session for Signals

| Signal | Category | Example |
|--------|----------|---------|
| Claude struggled / repeated attempts | Gotcha | "500 error" → "add eager load" |
| User correction ("use X instead") | Gotcha or Guidance | Depends on scope |
| Same pattern used 2+ times | Pattern | Service method, helper |
| Environment surprise | Gotcha | MSYS2, PowerShell quirks |
| Claude ignored existing docs | **Refinement** (see 3d) | Rule exists but was violated — diagnose why |
| Claude used wrong tool for task | **Tool guidance** (see 3e) | Grep for symbol lookup → should be LSP `findReferences` |

**Key distinction:**
- **Gotcha**: Error/symptom → technical fix (project-specific)
- **Guidance**: Behavioral rule for Claude (global `~/.claude/CLAUDE.md`)
- **Pattern**: Reusable architectural solution with code example
- **Refinement**: Existing rule was violated — root cause is missing context, not missing rule (see Step 3d)

### 1b. Audit signals against existing rules (MANDATORY)

For **each** signal, extract 2-3 concrete keywords (tool names, error messages, env terms):

| Signal example | Keywords to grep |
|----------------|------------------|
| Tinker failed on Cloudways | `tinker`, `cloudways` |
| Used Grep instead of LSP | `grep`, `findReferences`, `LSP` |
| 500 from missing eager load | `eager`, `N+1`, model name |

**Grep keywords** against all CLAUDE.md files:

```
Grep: pattern="{keyword}", glob="**/CLAUDE.md"
Grep: pattern="{keyword}", path="~/.claude", glob="CLAUDE.md"
```

| Grep result | Classification | Action in Step 3 |
|-------------|---------------|------------------|
| No match anywhere | **New** | Normal flow (3b→3c→add entry) |
| Match in target CLAUDE.md | **Violation** | Skip to 3c with `Found=Yes, Followed=No` → 3d |
| Match in wrong CLAUDE.md | **Misplaced** | Move to correct scope + evaluate refinement |

⚠️ **"No new knowledge" is only valid for "New" signals with no actionable content.** Violations and Misplaced signals ALWAYS require action in Step 3d.

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

### 3b. Check for duplicates and confirm violations

**"New" signals (from 1b)**: Grep for the key symptom/keyword across ALL `**/CLAUDE.md` files:
- If found in correct file → reclassify as **Violation** (1b keywords were too narrow)
- If in wrong file → move, don't duplicate

**"Violation" signals (from 1b)**: Read the matched rule's line range. Extract exact rule text. Pass to 3c with `Found=Yes, Followed=No`.

**"Misplaced" signals (from 1b)**: Move rule to correct target (per Step 2), then evaluate if refinement also needed via 3d.

### 3c. Write the entry

**Constraints:**

| ❌ Never | ✅ Always |
|---------|---------|
| Add a rule that already exists in the target file | Confirm grep returned no match before writing |
| Write to root CLAUDE.md when a more specific one exists | Route to narrowest scope (per Step 2) |
| Tweak wording on a violated rule and call it fixed | Diagnose WHY it was violated first (Step 3d) |
| Add a "don't do X" rule without an actionable "do Y" | Pair every prohibition with a concrete alternative |

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

### 3e. Diagnose "wrong tool used"

When Claude used a suboptimal tool (e.g., Grep instead of LSP, Read instead of MCP Boost), check:

| Question | If yes → |
|----------|----------|
| Is there a tool preference rule in `~/.claude/CLAUDE.md` `{#tools}` section? | **Refinement** — rule exists but was too soft (see 3d) |
| Is the rule missing entirely? | Add ❌/✅ mapping to Tool Usage section with concrete task → tool pairs |
| Did Claude start with the right tool but fall back mid-task? | Add **chaining workflow** — numbered steps showing how to stay in the preferred tool |
| Is the preferred tool only useful for certain tasks? | Add a **fallback clause** so Claude knows when the old tool is still correct |

**Escalation**: If the same tool violation persists across 2+ sessions after adding rules, escalate from table entry → dedicated subsection with `⚠️ MANDATORY` framing and explicit ❌/✅ task-to-tool mapping.

## 3f. Validate Written Entry

After writing to any CLAUDE.md, verify:

1. Entry addresses all points in the original signal
2. No duplicate rule now exists (re-run grep for the key symptom)
3. Format matches section conventions (table for gotchas/guidance, prose+code for patterns)
4. If any check fails → revise before continuing to next signal

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
