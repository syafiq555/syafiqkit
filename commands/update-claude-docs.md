---
description: Auto-capture patterns/gotchas/architectural insights from coding sessions. Use after implementing features, fixing bugs, or when session revealed reusable knowledge.
argument-hint: "[optional: specific focus area]"
---

Extract reusable knowledge from the entire session into CLAUDE.md files.

## 1. Session Scan

Review session for these signals:

| Signal | Category | Capture | Target |
|--------|----------|---------|--------|
| Claude struggled / repeated attempts | **Gotcha** | Working approach | `app/CLAUDE.md` or domain |
| User correction (any form) | **Restriction** | Convention revealed | Root `CLAUDE.md` if cross-cutting |
| Friction → Fix | **Gotcha** | Error + root cause + fix | Relevant `CLAUDE.md` |
| Explicit decision / veto | **Decision** | Choice + rejected alternatives | Task doc |
| Pattern used 2+ times | **Pattern** | Reusable structure | `CLAUDE.md` (promote from task) |
| Environment surprise (MSYS2, paths) | **Gotcha** | Platform-specific fix | Global `~/.claude/CLAUDE.md` |
| Tool mismatch (wrong tool choice) | **Workflow** | Correct tool for context | Root `CLAUDE.md#{scaffolding}` |
| Code review finding (security/perf) | **Gotcha** | Reusable fix pattern | `app/CLAUDE.md` |
| User points to existing file/doc | **Reference** | "Check X before Y" pattern | Root `CLAUDE.md#{docs}` |

**User correction examples** (capture ALL of these):
- "u dont need to..." / "you don't have to..." → User workflow preference
- "it's actually X" / "no, use Y instead" → Correct value/approach
- "i already have X running" → Environment state assumption
- "that's wrong" / "not like that" → Approach correction
- Short dismissive replies after Claude's action → Implicit correction
- "dont we have X?" / "why not use X?" → **Existing component/pattern ignored**
- "we already have..." / "there's already a..." → Reinventing existing solution
- "@file" or "take a look at X" → **Reference to existing doc/pattern Claude should have checked**
- "u created X without using Y" / "why didnt u use Y" → **Wrong tooling/approach**
- Informal shorthand corrections ("u", "hv", "dont") → Treat same as formal corrections

**Capture threshold**: Would removing this cause Claude to make the same mistake again? If yes, capture it.

**Mandatory scan checklist** (MUST execute with Grep tool before proceeding):
```
# Run these searches on conversation - if ANY match, investigate and capture
1. User corrections: "u ", "dont", "why not", "take a look", "already", "without using"
2. File references: "@" followed by path, or user sharing file contents
3. Approach corrections: "wrong", "not like that", "instead", "should have"
```

**After scan, list findings in this format before capturing:**
```
## Session Scan Results
| Message | Signal Type | Action |
|---------|-------------|--------|
| "u created X without using artisan" | Wrong tooling | Add to scaffolding rules |
| "@tasks/ui/email-templates" | Reference ignored | Add doc-check pattern |
| Code reviewer: auth bypass | Security gotcha | Add to multi-tenancy |
```
**If table is empty, state "No signals found" with reason. Never skip this step.**

**Common misclassifications** (avoid these mistakes):
| Wrongly Classified As | Actually Is | Why |
|----------------------|-------------|-----|
| "Feature-specific" | Reusable component rule | Components in `composed/` are app-wide |
| "Refactoring opportunity" | Missing knowledge of existing code | Claude didn't know component existed |
| "One-off suggestion" | Pattern for all similar cases | "Use DataTable" applies to ALL tables |

## 2. Route to Target

| Scope | Target |
|-------|--------|
| Cross-cutting (frontend + backend) | Root `CLAUDE.md` |
| Backend-only, all domains | `app/CLAUDE.md` |
| Frontend-only | `resources/js/CLAUDE.md` |
| Domain-specific | `app/Domains/{Domain}/CLAUDE.md` |
| Feature-specific (not reusable) | `tasks/{domain}/{feature}/current.md` |

**Litmus test**: "Does another domain need this?" → No = task docs, not CLAUDE.md

**Reusable by default** (always CLAUDE.md, never task docs):
- Components in `components/composed/` → used app-wide
- Components in `components/ui/` → shadcn primitives
- Hooks in `shared/` → cross-domain utilities
- Patterns about "use X instead of Y" → applies everywhere

## 3. DRY Check

Before adding, search target file + parent CLAUDE.md files for duplicates.

| Found In | Action |
|----------|--------|
| Same file | Enhance existing entry |
| Higher-level | Add cross-ref only: `> 📖 See CLAUDE.md#{anchor}` |
| Lower-level | Promote if truly shared |

## 4. Format Rules

| ❌ Avoid | ✅ Use |
|----------|--------|
| Prose paragraphs | Table rows |
| Verbose code blocks | `❌/✅` pairs (3 lines max) |
| Gotcha without symptom | `Error/Symptom | Issue | Fix` format |
| Section without anchor | Add `{#anchor-name}` |

**Gotcha format** (required columns):
```markdown
| Error/Symptom | Issue | Fix |
|---------------|-------|-----|
| `500 on save` | Missing eager load | `->with('relation')` |
```

## 5. Execute

1. Read target file(s)
2. Add entries to appropriate `{#section}` tables
3. Use Edit tool for updates, Write for new files
4. Verify anchors exist for cross-references

## Output

```
Updated: [file-path]
- [N] entries to {#section}

Key additions:
- [Most important pattern/gotcha]

DRY check: [files verified]
```

Or if nothing to capture:
```
No updates needed.
Reason: [Already documented / Feature-specific only / No reusable patterns]
```