<!--LLM-CONTEXT
Purpose: Best practices for maintaining syafiqkit plugin commands/skills
Key files: commands/*.md, skills/*/SKILL.md, CLAUDE.md
Related: None (standalone plugin)
-->

# Plugin Maintenance

**Status**: Reference (ongoing)

## Claude Code Skills Best Practices (2026)

Research from `claude-code-guide` agent, January 2026.

### Architecture

| Concept | Description |
|---------|-------------|
| Progressive disclosure | Descriptions load (~100 tokens), full content only on invoke (~5k tokens) |
| Reference vs Task | Reference = inline context; Task = `disable-model-invocation: true` |
| Skill composition | Skills don't call each other programmatically; orchestrate via instructions |

### Design Guidelines

| Guideline | Rationale |
|-----------|-----------|
| Keep SKILL.md <500 lines | Move detailed reference to supporting files |
| Description quality matters | Action verbs, specific file types, clear use cases |
| Use `allowed-tools` for restrictions | Scope permissions per-skill |
| Supporting files for templates | Don't bloat main SKILL.md |

### Skill Invocation Control

| Scenario | Frontmatter |
|----------|-------------|
| Both user & Claude invoke | (default) |
| Only user invokes | `disable-model-invocation: true` |
| Only Claude invokes | `user-invocable: false` |

### Multi-Domain Handling

- Skills work alongside CLAUDE.md (loaded every session)
- CLAUDE.md <150 lines, domain-agnostic rules
- Domain knowledge → skills, not CLAUDE.md
- Monorepos: auto-discovers nested `.claude/skills/`

### Skill Composition Patterns

1. **Via subagent**: `context: fork` runs in isolated subagent
2. **Dynamic context**: `!`command`` injects output before Claude sees skill
3. **Explicit instructions**: Tell Claude to invoke `/other-skill` by name

### Sources

- [Skills Documentation](https://code.claude.com/docs/en/skills.md)
- [Best Practices Guide](https://code.claude.com/docs/en/best-practices.md)
- [Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents.md)

---

## Session Log

### 2026-01-30: Auto-create missing docs

**Problem**: `update-summary` aborted when PRIMARY domain doc missing, breaking `/done` autonomy.

**Solution**:
- PRIMARY missing → auto-create minimal template
- SECONDARY missing → skip + suggest
- `shared/*` → skip silently

**Files changed**: `commands/update-summary.md`

**Design principle captured**: "Auto-create over abort" - skills should complete without blocking.

### 2026-01-30: Agent context injection

**Problem**: `/done` spawns external agents (`code-simplifier`, `code-reviewer`) that don't inherit CLAUDE.md context - they only see their prompt.

**Solution**:
- Added "Agent prompts" instruction to SKILL.md telling orchestrator to include context
- Documented pattern in CLAUDE.md Conventions table
- Pattern: include relevant CLAUDE.md files (root + subdomain) + task docs in agent prompts

**Files changed**: `skills/done/SKILL.md`, `CLAUDE.md`

**Gotcha**: Don't reference global CLAUDE.md (`{#agent-bootstrap}`) - plugin must be self-contained for other users.
