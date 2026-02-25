# syafiqkit

Personal workflow toolkit for Claude Code - commits, summaries, docs, invoicing.

## Prerequisites

`/syafiqkit:done` uses project agents if available, otherwise requires:
```bash
claude plugin install code-simplifier@claude-plugins-official
claude plugin install feature-dev@claude-plugins-official
```

## Installation

```bash
claude plugin marketplace add https://github.com/syafiq555/syafiqkit
claude plugin install syafiqkit@syafiqkit
```

## Commands

| Command | Description |
|---------|-------------|
| `/commit` | Generate commit message from staged changes |
| `/read-summary` | Load existing task summary for context |
| `/write-summary` | Create new task documentation |
| `/update-summary` | Append findings to existing summary |
| `/update-claude-docs` | Capture patterns/gotchas to CLAUDE.md |

## Skills

| Skill | Description |
|-------|-------------|
| `/done` | Post-task cleanup - simplify, review, update docs |
| `/commit-invoice-generator` | Generate invoice line items from git commits |
| `/agent-setup` | Create/update project agents using Bootstrap pattern (read CLAUDE.md at runtime) |

## Usage

```bash
# After completing a feature
/done

# Starting a session
/read-summary auth/login

# Generate invoice
/commit-invoice-generator --since="2025-01-01" --until="2025-01-31"
```

## Updating / Uninstalling

```bash
claude plugin update syafiqkit@syafiqkit
claude plugin uninstall syafiqkit@syafiqkit
```
