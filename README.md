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

## Skills

| Skill | Description |
|-------|-------------|
| `/read-summary` | Load existing task summary for context |
| `/tackle` | Take work to done from a task doc **or** a brand-new idea — writes the doc if missing, triages what's actually buildable, builds it, wraps up |
| `/write-summary` | Create new task documentation (thin pointer → `task-summary`) |
| `/update-summary` | Append findings to existing summary (thin pointer → `task-summary`) |
| `/task-summary` | Create/update task summary docs with path resolution, templates, cross-refs |
| `/done` | Post-task cleanup — simplify, review, update docs |
| `/update-claude-docs` | Create / rewrite-to-best-practice / condense / capture-into CLAUDE.md files — the CLAUDE.md analog of task-summary |
| `/update-plugin` | Scan the session for plugin learnings and patch the affected skill files — the plugin equivalent of update-claude-docs |
| `/ship` | End-to-end ship: commit → changelog → push → CI verify → GitNexus re-index → release note |
| `/pull-db` | Transfer MySQL/MariaDB DB from remote server to local dev |
| `/commit-invoice-generator` | Generate invoice line items from git commits |
| `/gchat-format` | Convert Markdown to Google Chat syntax |
| `/md-to-pdf` | Convert Markdown to PDF with rendered Mermaid diagrams |
| `/brainstorming` | Design exploration before creative/architectural work |
| `/agent-setup` | Create/update project agents using Bootstrap pattern |
| `/ci-ssh-deploy-timeout` | Diagnose + fix flaky CI deploys that SSH-timeout to a server (rules out firewall, applies connect-only retry) |
| `/function-parameter-limits` | Apply + enforce the 0/2/3+ function-parameter rule — advises parameter-object/DTO refactors and sets up the right linter (ESLint/PHPMD/Pylint) with DI-constructor carve-outs |
| `/hobby-review` | Socratic debrief of a hobby item against the taste rubric in the matching task doc |
| `/merge-task-docs` | Find related task docs in a domain and merge them, reconciling all back-references |
| `/notes-summary` | Create, update, or read a personal session journal outside the repo |
| `/condense-task-doc` | Aggressively condense a bloated task doc in place |
| `/condense-claude-md` | Aggressively condense a bloated CLAUDE.md file in place |

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
