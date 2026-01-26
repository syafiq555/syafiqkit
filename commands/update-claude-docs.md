---
description: Auto-capture patterns/gotchas/architectural insights from coding sessions. Use after implementing features, fixing bugs, or when session revealed reusable knowledge.
argument-hint: "[optional: specific focus area]"
---

Extract reusable knowledge from the session into CLAUDE.md files.

## 1. Session Scan

| Signal | Category | Target |
|--------|----------|--------|
| Claude struggled / repeated attempts | Gotcha | `app/CLAUDE.md` |
| User correction | Restriction | Root `CLAUDE.md` |
| Friction → Fix | Gotcha | Relevant `CLAUDE.md` |
| Pattern used 2+ times | Pattern | `CLAUDE.md` |
| Environment surprise (MSYS2, paths) | Gotcha | Global `~/.claude/CLAUDE.md` |
| Tool mismatch | Workflow | Root `CLAUDE.md` |

**User corrections to capture:**
- "u dont need to..." / "you don't have to..."
- "it's actually X" / "no, use Y instead"
- "dont we have X?" / "why not use X?"
- "we already have..." / "@file" / "take a look at X"
- "u created X without using Y"

**Threshold**: Would removing this cause Claude to repeat the mistake? If yes, capture it.

**Scan results format:**
```
| Message | Signal Type | Action |
|---------|-------------|--------|
| "u created X without using artisan" | Wrong tooling | Add to scaffolding |
```

## 2. Route to Target

| Scope | Target |
|-------|--------|
| Cross-cutting | Root `CLAUDE.md` |
| Backend-only | `app/CLAUDE.md` |
| Frontend-only | `resources/js/CLAUDE.md` |
| Domain-specific | `app/Domains/{Domain}/CLAUDE.md` |
| Feature-specific | `tasks/{domain}/{feature}/current.md` |

**Litmus test**: "Does another domain need this?" No = task docs

## 3. DRY Check

Search target + parent CLAUDE.md files for duplicates.

| Found In | Action |
|----------|--------|
| Same file | Enhance existing |
| Higher-level | Cross-ref only |
| Lower-level | Promote if shared |

## 4. Format Rules

| Avoid | Use |
|-------|-----|
| Prose paragraphs | Table rows |
| Verbose code blocks | `❌/✅` pairs |
| Gotcha without symptom | `Error | Issue | Fix` |
| Section without anchor | Add `{#anchor}` |

## 5. Execute

1. Read target file(s)
2. Add entries to `{#section}` tables
3. Verify anchors exist

## Output

```
Updated: [file-path]
- [N] entries to {#section}
Key additions: [Most important pattern]
```

Or: `No updates needed. Reason: [Already documented / Feature-specific only]`