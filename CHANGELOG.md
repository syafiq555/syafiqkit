# Changelog

## 1.31.0

- **read-summary**: Auto-detect argument type — doc paths trigger read-and-wait, task descriptions trigger read-and-implement

## 1.30.0

- **read-summary**: Fix GitNexus queries for indexed repos
- **update-claude-docs**: Strengthen anti-memory rules — enforce CLAUDE.md/task docs over auto-memory for session learnings

## 1.29.0

- **commit**: Add GitNexus re-index step — automatically re-indexes knowledge graph in background after non-docs commits

## 1.28.0

- **commit**: Changelog gate is now fully autonomous — auto-updates and stages CHANGELOG.md instead of blocking and asking
- **update-claude-docs**: Add CLAUDE.local.md checklist — actively scans session for credentials, API headers, CLI one-liners, service URLs, and account mappings that belong in local (non-team) context

## 1.27.0

- **gchat-format**: New skill — convert Markdown content to Google Chat syntax (bold, code, bullets)
- **md-to-pdf**: New skill — convert Markdown documents to professional PDFs with rendered Mermaid diagrams
- **ship**: New skill — end-to-end shipping workflow: commit → changelog → push → verify CI/CD → GitNexus re-index → release note

## 1.26.0

- **read-summary**: Add domain CLAUDE.md loading — infers domain from task path, reads domain-scoped gotchas/patterns alongside task docs

## 1.25.0

- **task-summary**: Add mandatory Quick Start section — 5-question cold-start framework, rewritten on every update, added to both templates
- **write-summary/update-summary**: Clarify descriptions as aliases for task-summary skill

## 1.24.0

- **consolidate-docs**: Rewrite as conversational workflow — staleness audit, AskUserQuestion options, archive mode via `git mv` to flat `_archive/`, pattern migration to CLAUDE.md before archiving

## 1.23.1

- **read-summary**: Add mandatory GitNexus integration — queries execution flows and symbol context in indexed repos alongside file reads

## 1.23.0

- **agent-setup**: Add GitNexus tool guidance to agent templates

## 1.22.0

- Bump version

## 1.21.0

- **update-claude-docs**: Enforce CLAUDE.md over memory, require inline facts with pointers

## 1.20.0

- **code-simplifier**: Add component-vs-utility guidance

## 1.19.0

- **plugin**: Add claude-md-pruner agent, changelog gate
