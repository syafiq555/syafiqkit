---
name: agent-setup
description: This skill should be used when the user asks to "setup project agents", "create code reviewer", "update agent prompts", "sync agents with CLAUDE.md", or when /update-claude-docs needs to sync project agents. Creates and maintains project-specific agents with conventions baked in.
---

# Project Agent Setup

Create or update project-specific agents that have project conventions baked into their system prompts, eliminating runtime CLAUDE.md parsing.

## Core Concept

Instead of agents reading CLAUDE.md at runtime, inject relevant rules directly into agent system prompts. Agents become project-aware without extra context loading.

## When to Use

- After `/update-claude-docs` captures new patterns/gotchas
- When setting up a new project for the first time
- When project conventions change significantly
- Directly via `/agent-setup`

## Agent Location

Agents live in the project's `.claude/agents/` directory:

```
Project/
├── CLAUDE.md
└── .claude/
    └── agents/
        ├── code-reviewer.md
        └── code-simplifier.md
```

## Setup Process

### Step 1: Check Project Structure

```
Glob: .claude/agents/*.md
```

| Found? | Action |
|--------|--------|
| No | Create `.claude/agents/` directory + agents |
| Yes | Update existing agents |

### Step 2: Create Directory (if missing)

Create `.claude/agents/` directory if it doesn't exist.

### Step 3: Extract Rules from CLAUDE.md

Read project's CLAUDE.md and extract:

| Section Type | What to Extract |
|--------------|-----------------|
| Gotchas tables | `Symptom \| Cause \| Fix` rows |
| ❌/✅ tables | Pattern enforcement rules |
| Constraints sections | Hard rules to enforce |
| Code style rules | Formatting/naming conventions |

**Transform to agent rules:**

CLAUDE.md gotcha:
```markdown
| `N+1 on /participants` | Missing eager load | Add `->with('enrollments')` |
```

→ Agent rule:
```markdown
- Flag queries that could cause N+1 (especially on participant-related endpoints)
- Check for missing `->with()` on relationship queries
```

### Step 4: Generate/Update Agents

Use templates from `templates/` directory:
- `code-reviewer.template.md`
- `code-simplifier.template.md`

Find the injection section in each template:
```markdown
<!-- INJECTED FROM CLAUDE.md -->
[Replace this section]
<!-- END INJECTED -->
```

Replace with extracted rules.

### Step 5: Write Agent Files

Write to `.claude/agents/`:
- `code-reviewer.md`
- `code-simplifier.md`

## Update Process

When CLAUDE.md changes:

1. Re-read CLAUDE.md
2. Re-extract rules (Step 3)
3. Find existing agents
4. Replace content between `<!-- INJECTED -->` markers
5. Preserve any manual customizations outside markers

## Fallback Behavior

| Scenario | Behavior |
|----------|----------|
| CLAUDE.md empty/minimal | Create agents with base template only (no injected rules) |
| CLAUDE.md not found | Skip injection, use base templates |
| Agents already exist | Update injected section only |

## Output

```
## Agent Setup Summary

| Agent | Status | Rules Injected |
|-------|--------|----------------|
| code-reviewer | Created/Updated | 5 gotchas, 3 patterns |
| code-simplifier | Created/Updated | 2 style rules |

Project agents synced with CLAUDE.md conventions.
```

## Templates

See `templates/` for base agent files:
- `code-reviewer.template.md` - Based on feature-dev:code-reviewer
- `code-simplifier.template.md` - Based on code-simplifier:code-simplifier
