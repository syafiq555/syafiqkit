# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Claude Code plugin providing personal workflow automation: commit messages, task summaries, documentation capture, and invoice generation from git history.

## Plugin Structure

```
.claude-plugin/
├── plugin.json          # Plugin metadata
└── marketplace.json     # Marketplace listing
commands/                # User-invocable slash commands
skills/                  # Multi-step workflows (SKILL.md files)
  ├── done/              # Post-task cleanup orchestrator
  └── task-summary/      # Discovery logic for task docs (used by write/update-summary)
```

| Type | Location | Trigger |
|------|----------|---------|
| Command | `commands/*.md` | `/syafiqkit:<name>` |
| Skill | `skills/<name>/SKILL.md` | `/syafiqkit:<name>` or proactive |

## Commands & Skills

### Commands

| Command | Purpose |
|---------|---------|
| `commit` | Generate commit messages from staged changes |
| `read-summary` | Load existing task summary context |
| `write-summary` | Create new task summary (or update if exists) |
| `update-summary` | Append session findings to existing task summary |
| `update-claude-docs` | Capture patterns/gotchas into CLAUDE.md files |

### Skills

| Skill | Purpose | Used By |
|-------|---------|---------|
| `task-summary` | Smart discovery of related task docs, cross-reference management | `write-summary`, `update-summary` commands |
| `agent-setup` | Create/update project agents using Bootstrap pattern | `/agent-setup` or `/update-claude-docs` |
| `done` | Post-task cleanup orchestrator | User invokes directly |
| `team-build` | Spawn coordinated agent team for multi-workstream features | User invokes directly |
| `commit-invoice-generator` | Generate invoice line items from git commits | User invokes directly |

## Project-Specific Agents

`/agent-setup` creates project-local agents in `.claude/agents/` using the **Bootstrap pattern** — agents read CLAUDE.md at runtime instead of having content injected. `/done` uses these project agents (with fallback to external plugins).

```
Project/
├── CLAUDE.md                    # Source of truth (read by agents at runtime)
└── .claude/
    └── agents/
        ├── code-reviewer.md     # Bootstrap + ~15 inline critical rules
        └── code-simplifier.md   # Bootstrap + ~12 inline critical rules
```

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
user-invocable: false                   # Default is true; set false to hide from /menu
context: fork                           # Optional: run in isolated subagent
model: sonnet                           # Optional: override model
---
```

**Agent templates** (`skills/agent-setup/templates/*.template.md`):
```yaml
---
name: agent-name
description: When to invoke
tools: Read, Grep, Glob, Edit
model: sonnet
color: red
memory: project                         # Persistent memory scoped to project
---
```

## Dependencies

`/done` skill uses project agents if available, otherwise falls back to external plugins:
```bash
claude plugin install code-simplifier@claude-plugins-official
claude plugin install feature-dev@claude-plugins-official
```

`/update-claude-docs` optionally uses (falls back to manual if unavailable):
```bash
claude plugin install claude-md-management@claude-plugins-official
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
| Agents use Bootstrap pattern | Agents read CLAUDE.md at runtime; only ~15 critical rules kept inline for zero-latency access |
| Plugin must be self-contained | Never reference user's global `~/.claude/CLAUDE.md` - other users won't have it |
| **Every change = version bump** | Bump both version files (see [Version Bumping](#version-bumping)) |
| No build step | Markdown files interpreted directly; just bump version + `claude plugin update` |

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

### Version Bumping {#version-bumping}

**⚠️ Update BOTH files** — missing one causes silent version mismatch:

| File | Field |
|------|-------|
| `.claude-plugin/plugin.json` | `"version"` |
| `.claude-plugin/marketplace.json` | `plugins[0].version` |

Then run:
```bash
claude plugin update syafiqkit@syafiqkit
```
