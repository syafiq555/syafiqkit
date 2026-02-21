<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance
Purpose: Best practices for maintaining syafiqkit plugin commands/skills
Key files: commands/write-summary.md, commands/update-summary.md, commands/update-claude-docs.md, CLAUDE.md, .claude-plugin/plugin.json
Related: None
Last updated: 2026-02-21
-->

# Plugin Maintenance

**Status**: Reference (ongoing)

## Design Principles

| Principle | Application |
|-----------|-------------|
| Autonomous over interactive | Skills complete without asking; use smart defaults |
| Auto-create over abort | Missing docs → create minimal template, don't block workflow |
| Graceful degradation | Use better external tool if available, fallback to self-contained |
| Explicit criteria | "2+ files OR business logic" not "significant changes" |
| Self-contained | Never reference user's global CLAUDE.md - other users won't have it |

## Skill Architecture (2026)

| Concept | Description |
|---------|-------------|
| Progressive disclosure | Descriptions load (~100 tokens), full content only on invoke (~5k tokens) |
| Reference vs Task | Reference = inline context; Task = `disable-model-invocation: true` |
| Skill composition | Skills don't call each other programmatically; orchestrate via instructions |
| Skill + commands pattern | Skill provides guidance/discovery, commands invoke skill then execute action |

### Current Skills

| Skill | Purpose | Invoked By |
|-------|---------|------------|
| `task-summary` | Smart discovery of related task docs | `write-summary`, `update-summary` commands |
| `agent-setup` | Create/update project agents with CLAUDE.md rules | `update-claude-docs` command |
| `done` | Post-task cleanup orchestrator | User directly |
| `commit-invoice-generator` | Generate invoice from git commits | User directly |
| `consolidate-docs` | Merge related task docs into one | User directly (command) |

### Invocation Control

| Scenario | Frontmatter |
|----------|-------------|
| Both user & Claude invoke | (default — `user-invocable` is `true` since 2.1.0) |
| Only user invokes | `disable-model-invocation: true` |
| Only Claude invokes | `user-invocable: false` |

### Frontmatter Fields (2026)

| Field | Where | Description |
|-------|-------|-------------|
| `context: fork` | Skills | Run in isolated subagent context |
| `agent` | Skills | Subagent type when `context: fork` |
| `model` | Skills, Agents | Override model (`sonnet`, `opus`, `haiku`, `inherit`) |
| `memory` | Agents | Persistent memory scope: `user`, `project`, `local` |
| `permissionMode` | Agents | `default`, `acceptEdits`, `plan` |
| `hooks` | Skills, Agents | Scoped hooks (PreToolUse, PostToolUse, Stop) |
| `skills` | Agents | Preload skill content into agent context |
| `disallowedTools` | Agents | Deny specific tools from inherited list |

### Composition Patterns

1. **Via subagent**: `context: fork` runs in isolated subagent
2. **Dynamic context**: `` !`command` `` injects output before Claude sees skill
3. **Explicit instructions**: Tell Claude to invoke `/other-skill` by name

## External Plugin Integration

| Plugin | Used by | Required? |
|--------|---------|-----------|
| `code-simplifier@claude-plugins-official` | `/done` Step 1 | Fallback only |
| `feature-dev@claude-plugins-official` | `/done` Step 2 | Fallback only |
| `claude-md-management@claude-plugins-official` | `/update-claude-docs` | Optional (fallback exists) |

**Pattern**: Check for project agent first → use if exists → fallback to external plugin.

## Project-Specific Agents (2026-02)

**Problem**: Agents don't inherit CLAUDE.md, so project conventions aren't applied.

**Solution**: Bake conventions into agent system prompts via injection markers.

```
/update-claude-docs
    ├─► Updates CLAUDE.md
    └─► Invokes agent-setup skill
          └─► Creates/updates .claude/agents/
                ├─► code-reviewer.md (with injected rules)
                └─► code-simplifier.md (with injected rules)

/done
    ├─► Check .claude/agents/code-simplifier.md
    │     └─► Use project agent OR fallback to external
    └─► Check .claude/agents/code-reviewer.md
          └─► Use project agent OR fallback to external
```

**Injection markers** in agent templates:
```markdown
<!-- INJECTED FROM CLAUDE.md -->
[Project-specific rules extracted from CLAUDE.md]
<!-- END INJECTED -->
```

**Benefits**:
- No runtime CLAUDE.md parsing
- Agents become project-aware
- Cumulative learning as gotchas accumulate
- Portable with the repo

## Completed (2026-02-21) — Prompting Techniques Applied

Applied 3 LLM prompting best practices to command files to improve reliability:

| Command | Constitutional (❌ constraints) | Chain-of-Thought (`<thinking>`) | Validation Loop |
|---------|-------------------------------|-------------------------------|-----------------|
| `write-summary` | ✅ Steps 3 + 4 | ✅ Step 0 pre-flight | ✅ Step 5 |
| `update-summary` | ✅ Step 2 | ➖ | ✅ Step 3 |
| `update-claude-docs` | ✅ Step 3c | ✅ Step 0 pre-flight | ✅ Step 3f |

**Commands left unchanged**: `read-summary`, `commit`, `consolidate-docs` (too simple / already has safety check)

**Version bumped**: 1.6.3 → 1.6.4

**Pattern captured in CLAUDE.md**: New `### Prompting Techniques for Commands {#prompting-techniques}` section added under Maintenance.

## Gotchas

| Issue | Cause | Fix |
|-------|-------|-----|
| Agent ignores project conventions | Agents don't inherit CLAUDE.md | Use `agent-setup` skill to inject rules into agent prompts |
| `/done` blocks on missing docs | `update-summary` aborted on missing PRIMARY | Auto-create minimal template instead |
| Plugin breaks for other users | References to `~/.claude/CLAUDE.md` | Keep plugin self-contained |
| Agent template missing tools for git | `code-reviewer` needs `git diff` | Add `Bash(git:*)` to tools list |

## Guidelines

| Guideline | Rationale |
|-----------|-----------|
| Keep SKILL.md <500 lines | Move detailed reference to supporting files |
| Description quality matters | Action verbs, specific file types, clear use cases |
| Use `allowed-tools` for restrictions | Scope permissions per-skill |
| CLAUDE.md <150 lines | Domain knowledge → skills, not CLAUDE.md |

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| Apply prompting techniques selectively, not universally | Simple commands (`read-summary`, `commit`) don't benefit — overhead reduces clarity. Only commands with multi-branch inference or file writes gain reliability improvements. |
| `<thinking>` block as Step 0 (pre-flight), not inline | Externalizing routing decisions before action prevents silent errors mid-step and is easier to review/debug. |
| Validation loop re-reads the file after writing | Write + verify pattern catches silent truncation bugs that Edit confirmation alone doesn't surface. |

## Sources

- [Skills Documentation](https://code.claude.com/docs/en/skills.md)
- [Best Practices Guide](https://code.claude.com/docs/en/best-practices.md)
- [Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents.md)

## Next Steps

- Monitor whether `<thinking>` blocks reduce domain inference errors in practice
- Consider adding validation loop to `consolidate-docs` if merge errors occur in future sessions
