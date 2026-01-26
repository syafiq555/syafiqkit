---
name: skill-manager
description: Create or update global Claude Code skills. Use when user wants to create a new skill, update an existing skill, or manage their personal skills library.
argument-hint: [create|update|refine|list|show] [skill-name]
user-invocable: true
disable-model-invocation: true
allowed-tools: Read, Write, Bash, Glob, Grep
---

# Skill Manager

Create, update, or list global Claude Code skills in `~/.claude/skills/`.

## Arguments

- `create <skill-name>` - Create a new skill
- `update <skill-name>` - Update an existing skill (user specifies changes)
- `refine <skill-name>` - Auto-improve skill against best practices
- `list` - List all global skills with descriptions
- `show <skill-name>` - Show skill content
- No args - Interactive mode (ask what to do)

## Skill Structure

```
~/.claude/skills/<skill-name>/
├── SKILL.md           # Required: Main instructions
├── template.md        # Optional: Output template
├── examples/          # Optional: Example files
└── scripts/           # Optional: Helper scripts
```

## SKILL.md Format

```yaml
---
name: skill-name
description: What it does and when Claude should use it (include keywords users say)
argument-hint: [optional] [arguments]
user-invocable: true
disable-model-invocation: false  # true = only user can invoke (for side-effects)
allowed-tools: Read, Grep, Glob  # Optional: restrict tools
model: inherit                   # Optional: sonnet, opus, haiku, inherit
context: fork                    # Optional: run in subagent
agent: Explore                   # Optional: subagent type when context: fork
---

# Skill Title

Instructions for Claude...

Use $ARGUMENTS to reference user input.
Dynamic shell: exclamation + backtick + command + backtick (injects output)
```

## Frontmatter Reference

| Field | Type | Default | Purpose |
|-------|------|---------|---------|
| `name` | string | dir name | Display name (lowercase, hyphens, max 64) |
| `description` | string | required | What/when - Claude uses for auto-invoke |
| `argument-hint` | string | - | Autocomplete hint: `[issue-number]` |
| `user-invocable` | bool | true | Show in `/` menu |
| `disable-model-invocation` | bool | false | Prevent Claude auto-trigger |
| `allowed-tools` | string | all | Comma-separated tool restrictions |
| `model` | string | inherit | Model override |
| `context` | string | - | `fork` for subagent isolation |
| `agent` | string | - | Subagent type: Explore, Plan, general-purpose |

## Workflow

### Create New Skill

1. Ask for skill name and purpose
2. Determine appropriate settings:
   - Side effects (deploy, commit, send)? → `disable-model-invocation: true`
   - Background knowledge only? → `user-invocable: false`
   - Need isolation? → `context: fork`
3. Create directory: `~/.claude/skills/<skill-name>/`
4. Write `SKILL.md` with frontmatter and instructions
5. Confirm creation and show how to invoke

### Update Existing Skill

1. Read current `SKILL.md`
2. Ask what to change or show current content
3. Apply updates preserving existing structure
4. Confirm changes

### Refine Existing Skill

1. Read current `SKILL.md`
2. Analyze against best practices checklist:
   - [ ] Description includes natural keywords users would say
   - [ ] Description explains WHEN to use, not just WHAT it does
   - [ ] Frontmatter uses appropriate flags (disable-model-invocation for side-effects)
   - [ ] Instructions are clear and actionable
   - [ ] Under 500 lines (reference supporting files if longer)
   - [ ] Uses `$ARGUMENTS` if accepting input
   - [ ] Examples provided where helpful
   - [ ] No redundant or verbose sections
3. Suggest improvements with before/after comparison
4. Ask user to confirm before applying changes
5. Apply approved refinements

### List Skills

1. Glob `~/.claude/skills/*/SKILL.md`
2. Extract name and description from each
3. Display as table

## Best Practices to Follow

1. **Descriptions**: Include natural keywords users say
2. **Keep lean**: Under 500 lines, reference supporting files
3. **Side effects**: Always use `disable-model-invocation: true` for actions that modify external state
4. **Arguments**: Use `$ARGUMENTS` for dynamic input
5. **Dynamic content**: Use exclamation-backtick-command-backtick pattern for shell injection

## Examples

### Reference Skill (Claude auto-invokes)
```yaml
---
name: code-style
description: Code style guidelines for this project. Use when writing or reviewing code.
---
Follow these conventions...
```

### Task Skill (User invokes)
```yaml
---
name: deploy-prod
description: Deploy to production
disable-model-invocation: true
---
Deploy steps...
```

### Research Skill (Isolated)
```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---
Research $ARGUMENTS...
```

---

$ARGUMENTS
