# syafiqkit

Personal workflow toolkit for Claude Code - commits, summaries, docs, invoicing.

## Installation

```bash
# Add marketplace
claude plugin marketplace add git@github-personal:syafiq555/syafiqkit.git

# Install plugin
claude plugin install syafiqkit@syafiqkit
```

## Commands

| Command | Description |
|---------|-------------|
| `/syafiqkit:commit` | Generate commit message from staged changes |
| `/syafiqkit:read-summary` | Load existing task summary for context |
| `/syafiqkit:write-summary` | Create new task documentation |
| `/syafiqkit:update-summary` | Append findings to existing summary |
| `/syafiqkit:update-claude-docs` | Capture patterns/gotchas to CLAUDE.md |

## Skills

| Skill | Description |
|-------|-------------|
| `/syafiqkit:done` | Post-task cleanup - simplify code, review, update docs |
| `/syafiqkit:commit-invoice-generator` | Generate invoice line items from git commits |
| `/syafiqkit:skill-manager` | Create/update/list global skills |

## Usage Examples

### After completing a feature
```
/syafiqkit:done
```
Runs code simplifier, updates summary, reviews code, fixes issues, updates CLAUDE.md.

### Starting a session
```
/syafiqkit:read-summary auth/login
```
Loads `tasks/auth/login/current.md` for context.

### Generate invoice from commits
```
/syafiqkit:commit-invoice-generator --since="2025-01-01" --until="2025-01-31"
```

## File Structure

```
syafiqkit/
├── .claude-plugin/
│   ├── plugin.json
│   └── marketplace.json
├── commands/
│   ├── commit.md
│   ├── read-summary.md
│   ├── write-summary.md
│   ├── update-summary.md
│   └── update-claude-docs.md
└── skills/
    ├── done/
    ├── commit-invoice-generator/
    └── skill-manager/
```

## Updating

```bash
claude plugin update syafiqkit@syafiqkit
```

## Uninstalling

```bash
claude plugin uninstall syafiqkit@syafiqkit
claude plugin marketplace remove syafiqkit
```
