---
description: Capture patterns/gotchas from coding sessions into CLAUDE.md files. Use after implementing features, fixing bugs, or when session revealed reusable knowledge.
argument-hint: "[optional: focus area]"
---

# Capture Session Knowledge

Extract reusable patterns from this session into CLAUDE.md files.

## 1. Scan Session

Look for these signals in the conversation:

| Signal | Category | Example |
|--------|----------|---------|
| Claude struggled / repeated attempts | Gotcha | "500 error" → "add eager load" |
| User correction ("u dont need to...", "use X instead") | Gotcha or Guidance | Depends on scope |
| Same pattern used 2+ times | Pattern | Service method, helper, table structure |
| Environment surprise (paths, tools) | Gotcha | MSYS2, PowerShell requirements |
| Claude ignored existing docs | Refinement needed | Rule exists but wasn't followed |

**Key distinction:**
- **Gotcha**: Error/symptom → technical fix (project-specific)
- **Guidance**: Behavioral rule for Claude (goes to `~/.claude/CLAUDE.md`)
- **Pattern**: Reusable architectural solution with code example

## 2. Check If Already Documented

Before adding, search target CLAUDE.md for existing entries.

| Found? | Claude followed it? | Action |
|--------|---------------------|--------|
| No | — | Add new entry |
| Yes | Yes | No change needed |
| Yes | No | **Refine existing entry** (make it stronger/more visible) |

**Refinement strategies** (when docs were ignored):
- Move to `## Constraints` section
- Convert prose → table with ❌/✅ examples
- Strengthen wording: "prefer X" → "Always X"
- Add concrete error symptom as trigger

## 3. Route to Target (Hierarchy)

Claude reads CLAUDE.md files hierarchically: home → parent dirs → project root → child dirs (on-demand).

| Scope | Target | Loaded |
|-------|--------|--------|
| Global personal defaults | `~/.claude/CLAUDE.md` | Always |
| Cross-project/team conventions | Root `CLAUDE.md` | Always |
| Personal overrides (gitignored) | `CLAUDE.local.md` | Always |
| Monorepo shared context | `parent/CLAUDE.md` | Always |
| Backend-specific | `app/CLAUDE.md` | On-demand |
| Frontend-specific | `resources/js/CLAUDE.md` | On-demand |
| Domain-specific | `app/Domains/{Domain}/CLAUDE.md` | On-demand |

**`@` imports** (use sparingly): Reference external files with `@path/to/file.md` syntax.
- Imports are loaded when CLAUDE.md is read, NOT on-demand
- Can recurse up to 5 levels deep — bloats context fast
- Only use for content that MUST be in every session (e.g., `@tasks/architecture/current.md` for project overview)
- Prefer subdirectory CLAUDE.md files (truly on-demand) over imports

## 4. Format Entry

**Keep entries SHORT** — if CLAUDE.md is too long, Claude ignores half. Every line must earn its place.

**Litmus test**: "Would removing this cause Claude to make mistakes?" If not, delete it.

| ✅ Include | ❌ Exclude |
|-----------|-----------|
| Commands Claude can't guess | Things Claude infers from code |
| Code style differing from defaults | Standard language conventions |
| Common gotchas / non-obvious behaviors | Long explanations or tutorials |
| Dev environment quirks | File-by-file codebase descriptions |

**Gotchas** (table format, symptom required):
```markdown
| Symptom | Cause | Fix |
|---------|-------|-----|
| `500 on POST /invoices` | Timezone mismatch | `->setTimezone('UTC')` |
```

**Patterns** (only when reusable, use anchors):
```markdown
### Pattern Name {#anchor}

**Problem**: What recurring problem this solves

**Solution**:
```php
// Key code showing the pattern
```

**When to use**: Bullet points of scenarios
```

**Guidance** (for ~/.claude/CLAUDE.md):
```markdown
| ❌ NEVER | ✅ ALWAYS |
|----------|----------|
| `grep`, `find` | Grep tool, Glob tool |
```

## 5. Prune & Maintain

- **Prune monthly** — Remove rules that haven't prevented mistakes recently
- **Test changes** — Observe if Claude's behavior actually shifts after edits
- **Use hooks for guarantees** — CLAUDE.md is advisory; hooks are deterministic
- **Use skills for workflows** — CLAUDE.md = constraints; Skills = multi-step processes