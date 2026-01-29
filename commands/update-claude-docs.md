---
description: Auto-capture patterns/gotchas/architectural insights from coding sessions. Use after implementing features, fixing bugs, or when session revealed reusable knowledge.
argument-hint: "[optional: specific focus area]"
---

Extract reusable knowledge from the session into CLAUDE.md files.

## 1. Session Scan

| Signal | Category | Target |
|--------|----------|--------|
| Claude struggled / repeated attempts | Gotcha | `app/CLAUDE.md` |
| User correction (workflow/behavior) | **Guidance** | `~/.claude/CLAUDE.md` |
| User correction (technical fix) | Gotcha | Relevant `CLAUDE.md` |
| Friction → Fix | Gotcha | Relevant `CLAUDE.md` |
| Pattern used 2+ times | Pattern | `CLAUDE.md` |
| Environment surprise (MSYS2, paths) | Gotcha | `~/.claude/CLAUDE.md` |
| Tool mismatch | Workflow | Root `CLAUDE.md` |
| **Claude ignored existing docs** | **Doc Refinement** | Where it was documented |

**Gotcha vs Guidance:**
- **Gotcha**: Error/symptom → technical fix (e.g., "500 error" → "add eager load")
- **Guidance**: Behavioral rule for future sessions (e.g., "update related docs means search all domains")

**User corrections to capture:**
- "u dont need to..." / "you don't have to..."
- "it's actually X" / "no, use Y instead"
- "dont we have X?" / "why not use X?"
- "we already have..." / "@file" / "take a look at X"
- "u created X without using Y"
- **"i already told u..." / "this is documented in..." / "check the CLAUDE.md again"**

**Threshold**: Would removing this cause Claude to repeat the mistake? If yes, capture it.

**Scan results format:**
```
| Message | Signal Type | Action |
|---------|-------------|--------|
| "u created X without using artisan" | Wrong tooling | Add to scaffolding |
| "i already said use Valet paths" | Ignored docs | Refine existing entry |
```

## 2. Route to Target

| Scope | Target |
|-------|--------|
| Cross-cutting | Root `CLAUDE.md` |
| Backend-only | `app/CLAUDE.md` |
| Frontend-only | `resources/js/CLAUDE.md` |
| Domain-specific | `app/Domains/{Domain}/CLAUDE.md` |
| **Cross-domain gotcha** | `tasks/shared/gotchas-registry.md` |

**What goes where:**

| Content Type | Target | Example |
|--------------|--------|---------|
| Gotcha (error → fix) | `CLAUDE.md` files | "Migration FK fails" → `app/CLAUDE.md` |
| Gotcha in 3+ domains | `tasks/shared/gotchas-registry.md` | "BackedEnum cast error" |
| Guidance (future behavior) | `~/.claude/CLAUDE.md` | "Task doc behavior rules" |
| Implementation details | Task docs | API endpoints, files created |
| User workflow preferences | `~/.claude/CLAUDE.md` | "Update related docs means..." |

**Litmus test**:
- "Will this prevent Claude from repeating a mistake?" → CLAUDE.md
- "Does this gotcha appear in multiple domains?" → `tasks/shared/gotchas-registry.md`
- "Is this session-specific implementation detail?" → Task docs

## 3. DRY Check + Effectiveness Audit

Search target + parent CLAUDE.md files for duplicates AND check if documented but ignored.

| Found In | Claude Followed? | Action |
|----------|------------------|--------|
| Same file | ✅ Yes | Enhance existing |
| Same file | ❌ No | **REFINE: Make more prominent/explicit** |
| Higher-level | ✅ Yes | Cross-ref only |
| Higher-level | ❌ No | **REFINE: Add concrete example/move to constraints** |
| Lower-level | N/A | Promote if shared |
| Not found | N/A | Add new entry |

**Documentation Effectiveness Signals:**

| Symptom | Root Cause | Fix Strategy |
|---------|------------|--------------|
| Claude read section but missed rule | Buried in prose | → Convert to table/❌✅ format |
| Claude skipped section | Wrong section name | → Move to ## Constraints or ## Critical |
| Claude forgot mid-session | Not in constraints | → Duplicate in ## Constraints {#constraints} |
| User said "i already told u" | Missing from docs entirely | → Add with **CRITICAL:** prefix |
| Repeated across sessions | Weak wording ("prefer X") | → Strengthen ("Always X", "Never Y") |

**Refinement Checklist (if docs exist but ignored):**

- [ ] Is it in a scannable format? (table > prose)
- [ ] Is it in ## Constraints section? (Claude checks constraints more)
- [ ] Does it have ❌/✅ examples? (concrete > abstract)
- [ ] Is the rule explicit? ("Always X" > "Prefer X")
- [ ] Would Claude see it in first 20 lines? (visibility matters)

## 4. Format Rules

| Avoid | Use |
|-------|-----|
| Prose paragraphs | Table rows |
| Verbose code blocks | `❌/✅` pairs |
| Gotcha without symptom | `Error | Issue | Fix` |
| Section without anchor | Add `{#anchor}` |
| Abstract rules | Concrete bad/good examples |
| "Include context" (vague) | `"Read tasks/x/current.md first. Then..."` (specific) |
| **Weak verbs ("prefer", "consider")** | **Strong verbs ("Always", "Never", "Must")** |
| **Rules buried in prose** | **Rules in ## Constraints table** |

**For agent-related rules**: Include WHY, not just WHAT. Agents don't inherit CLAUDE.md context - rules for spawning agents need explanation so the spawning Claude understands the constraint.

**Refinement Patterns:**

| Weak Documentation | Strong Documentation |
|--------------------|---------------------|
| "Prefer using artisan commands" | **❌ `php scaffold.php`**<br>**✅ `php artisan make:*`**<br>*Ensures autoloading + conventions* |
| "Context should include relevant files" | Read `@tasks/current.md` first. Then read files mentioned in Implementation section. |
| "Follow existing patterns" | Match `app/Domains/User/Actions` structure:<br>- Single responsibility<br>- Return DTO<br>- No DB in constructor |

## 5. Execute

1. Read target file(s)
2. **Search for existing related entries**
3. **If found + Claude ignored:** Refine existing entry using checklist
4. **If not found:** Add new entry to `{#section}` tables
5. Verify anchors exist

**Refinement Actions:**
```php
// Example refinement workflow
if (documented_but_ignored) {
    actions = [
        'Move to ## Constraints',
        'Add ❌/✅ examples', 
        'Strengthen wording (Always/Never)',
        'Convert prose → table',
        'Add visibility (move up in file)'
    ];
}
```

## Output
```
Updated: [file-path]
- [N] new entries to {#section}
- [N] entries refined (was ignored previously)

Refinements made:
- [Section]: [Weak rule] → [Strong rule with examples]

Key additions: [Most important pattern]
```

Or:
```
Updated: [file-path]
- REFINED existing entry in {#section} (Claude ignored 2x this session)
- Changed: [Prose explanation] → [Table with ❌/✅ examples]
- Moved to: ## Constraints for visibility
```

Or: `No updates needed. Reason: [Already documented AND followed / Feature-specific only]`

---

## Meta: When This Command Fails

If you run `/capture` and Claude STILL ignores the docs next session:

1. The rule might need to move to `~/.claude/CLAUDE.md` (global behavior)
2. The section name is wrong (Claude scans certain sections more)
3. Token budget issue (file too long, Claude skips middle sections)
4. The rule conflicts with Claude's training (need stronger override language)

**Escalation path:** If 3+ refinements don't work, consider:
- Adding to pre-task checklist (force manual acknowledgment)
- Moving to few-shot examples (more tokens but higher retention)
- Splitting CLAUDE.md into focused sub-files (@subtask.md pattern)