---
name: skill-manager
description: Create or update global Claude Code skills. Use when user wants to create a new skill, update an existing skill, or manage their personal skills library.
argument-hint: [create|update|refine|list|show] [skill-name]
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Skill Manager

Manage global Claude Code skills in `~/.claude/skills/`.

## Arguments

| Command | Action |
|---------|--------|
| `create <name>` | Create new skill |
| `update <name>` | Update existing (user specifies changes) |
| `refine <name>` | Auto-improve against best practices |
| `list` | List all skills with descriptions |
| `show <name>` | Show skill content |
| (none) | Interactive mode |

## Skill Structure

```
~/.claude/skills/<skill-name>/
├── SKILL.md       # Required
├── template.md    # Optional
└── examples/      # Optional
```

## SKILL.md Format

```yaml
---
name: skill-name
description: What/when (include keywords users say)
argument-hint: [optional] [arguments]
user-invocable: true
disable-model-invocation: false  # true for side-effects
allowed-tools: Read, Grep, Glob  # Optional
context: fork                    # Optional: subagent
agent: Explore                   # Optional: subagent type
---

Instructions...
Use $ARGUMENTS for user input.
```

## Frontmatter Reference

| Field | Default | Purpose |
|-------|---------|---------|
| `name` | dir name | Display name |
| `description` | required | What/when for auto-invoke |
| `argument-hint` | - | Autocomplete hint |
| `user-invocable` | true | Show in `/` menu |
| `disable-model-invocation` | false | Prevent auto-trigger |
| `allowed-tools` | all | Tool restrictions |
| `context` | - | `fork` for isolation |
| `agent` | - | Explore, Plan, general-purpose |

## Workflows

### Create
1. Ask for name and purpose
2. Determine settings (side effects → `disable-model-invocation: true`)
3. Create `~/.claude/skills/<name>/SKILL.md`
4. Confirm and show invocation

### Update
1. Read current SKILL.md
2. Ask what to change
3. Apply updates, confirm

### Refine
Checklist:
- [ ] Description includes user keywords
- [ ] Explains WHEN to use
- [ ] Appropriate flags
- [ ] Under 500 lines
- [ ] Uses `$ARGUMENTS` if needed

### List
Glob `~/.claude/skills/*/SKILL.md`, display as table.

## Examples

```yaml
# Reference (auto-invoke)
---
name: code-style
description: Code style guidelines. Use when writing/reviewing code.
---

# Task (user invoke)
---
name: deploy-prod
description: Deploy to production
disable-model-invocation: true
---

# Research (isolated)
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---
```

---

$ARGUMENTS
