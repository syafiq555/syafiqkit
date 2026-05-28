# syafiqkit

Personal workflow toolkit for Claude Code — commits, task docs, invoicing, PDF export, Google Chat formatting, remote DB sync, and end-to-end shipping.

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
| `/consolidate-docs` | Merge related task documents into one |

## Skills

| Skill | Description |
|-------|-------------|
| `/done` | Post-task cleanup — simplify, review, update docs |
| `/ship` | End-to-end ship: commit → changelog → push → CI verify → GitNexus re-index → release note |
| `/pull-db` | Transfer MySQL/MariaDB DB from remote server to local dev |
| `/commit-invoice-generator` | Generate invoice line items from git commits |
| `/gchat-format` | Convert Markdown to Google Chat syntax |
| `/md-to-pdf` | Convert Markdown to PDF with rendered Mermaid diagrams |
| `/brainstorming` | Design exploration before creative/architectural work |
| `/agent-setup` | Create/update project agents using Bootstrap pattern |

## Usage

```bash
# After completing a feature
/done

# Ship to production
/ship

# Start a session with context
/read-summary auth/login

# Sync production database locally
/pull-db

# Generate invoice from commits
/commit-invoice-generator --since="2025-01-01" --until="2025-01-31"

# Format a release note for Google Chat
/gchat-format
```

## Updating / Uninstalling

```bash
claude plugin update syafiqkit@syafiqkit
claude plugin uninstall syafiqkit@syafiqkit
```
