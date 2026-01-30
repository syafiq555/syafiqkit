# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Claude Code plugin providing personal workflow automation: commit messages, task summaries, documentation capture, and invoice generation from git history.

## Plugin Structure

```
.claude-plugin/
├── plugin.json          # Plugin metadata
└── marketplace.json     # Marketplace listing
commands/                # User-invocable slash commands (frontmatter-driven)
skills/                  # Multi-step workflows (SKILL.md files)
```

| Type | Location | Trigger |
|------|----------|---------|
| Command | `commands/*.md` | `/syafiqkit:<name>` |
| Skill | `skills/<name>/SKILL.md` | `/syafiqkit:<name>` or proactive |

## Command/Skill Anatomy

**Commands** (`commands/*.md`):
```yaml
---
description: Short description for skill list
argument-hint: "[optional hint]"        # Shows in autocomplete
disable-model-invocation: true          # Prevents auto-trigger
---
```

**Skills** (`skills/<name>/SKILL.md`):
```yaml
---
name: skill-name
description: Description for matching
allowed-tools: Bash(git:*), Read, Grep  # Tool restrictions
user-invocable: true                    # Appears in slash commands
---
```

## Dependencies

`/done` skill requires external plugins:
```bash
claude plugin install code-simplifier@claude-plugins-official
claude plugin install feature-dev@claude-plugins-official
```

## Testing Changes

After modifying commands/skills:
```bash
claude plugin update syafiqkit@syafiqkit
```

No build step — markdown files are interpreted directly.

## Conventions

| Rule | Rationale |
|------|-----------|
| Keep commands focused (single workflow) | Easier to compose, debug |
| Use `disable-model-invocation: true` for commands that shouldn't auto-trigger | Prevents unwanted activation |
| Include examples in markdown | Helps Claude execute correctly |
| Use tables for structured guidance | More scannable than prose |
| Inject context into agent prompts | Agents don't inherit CLAUDE.md; include relevant CLAUDE.md files (root + subdomain) + task docs |
| Plugin must be self-contained | Never reference user's global `~/.claude/CLAUDE.md` - other users won't have it |

## Maintenance {#maintenance}

### When Modifying Commands/Skills

1. **Run code-simplifier**: Target <100 lines per command; 47%+ reduction signals bloat
2. **Review checklist**:
   - Missing `path` param on Glob/Grep instructions
   - Inconsistent behavior vs related commands (e.g., `update-summary` vs `write-summary`)
   - Ambiguous criteria (define what "related" or "connection" means)
   - Missing edge cases (archived docs, Status: Done)
3. **Reference**: `tasks/plugin-maintenance/current.md` for 2026 best practices research

### Design Principles

| Principle | Application |
|-----------|-------------|
| Autonomous over interactive | Skills should complete without asking; use smart defaults |
| Auto-create over abort | Missing docs → create minimal template, don't block workflow |
| Explicit criteria | "2+ files OR business logic" not "significant changes" |
| Graceful degradation | PRIMARY missing → auto-create; SECONDARY missing → skip + suggest |

### Version Bumping

After changes, update `.claude-plugin/plugin.json` version and run:
```bash
claude plugin update syafiqkit@syafiqkit
```
