# Changelog

## 1.35.0

- **agent-setup**: Templates and skill now seed two previously-missing high-value sections. The reviewer template gains a **"Known False Positives"** table (patterns that look wrong but are intentional — a reviewer needs them inline at zero-latency to *not* flag them) and the simplifier template gains **"Don't Simplify (Preserve These)"** (without it, a simplifier eventually collapses a deliberate guard). Also added multi-repo guidance for the sibling-repo case — when one session drives two repos whose agents don't both fire, the active agent carries a `⚠️ Two-repo session` banner, diffs both repos, and gets a second Bootstrap table + tagged sibling rules. Fixed a stale LSP step (`findReferences`/`goToDefinition` are often broken → use `hover` + `documentSymbol`). Steps 2/4/5 of the skill updated to cover all three. Caught while merging skill-depth into a project's agents and finding the templates couldn't express the false-positive list or the two-repo workflow.
- **update-claude-docs**: Step 6 (Agent Sync) rewritten from "agents read CLAUDE.md dynamically, no sync needed" to a **signal→agent routing table**. Default stays do-nothing (ordinary gotchas are picked up via Bootstrap — re-deriving agent tables would re-introduce the duplication the architecture avoids), but five agent-specific signals now route to a surgical agent edit: recurring false positive → reviewer's "Known False Positives"; wrongly-collapsed guard → "Don't Simplify"; new top-15 mistake → inline rules table; agent misbehavior → Process/Constraints; new sibling repo → two-repo banner. Structural changes still defer to `agent-setup`. Closes the gap where a false positive the reviewer kept flagging had no home but the agent file, which the skill never touched.

## 1.34.5

- **done**: Collapsed 5 steps to 4 (164→111 lines) — deleted the inline conversation-analysis procedure (old Step 3, sub-steps 3a–3d) that fully duplicated the `update-claude-docs` skill. Capture is now a single delegated Skill call, removing the "don't double-write" hedge that only existed to reconcile the two copies. `done` is now a pure orchestrator. Also wired the Output's User Instructions table to an explicit producer in the preamble (the slot previously had no step writing it). Caught when the workflow was flagged as bloated and an audit found the same capture logic written twice.
- **task-summary**: Added a top-level Density rules section to stop the #1 doc-bloat failure — the same fact restated across LLM-CONTEXT, Quick Start, Key Decisions, Gotchas, and Last Session. Rules: one-fact-one-home (sections point, don't restate), Gotcha/Decision rows ≤2 sentences, LLM-CONTEXT is a pointer index, Quick Start ≤15 lines. Strengthened `## Last Session` to enforce EXACTLY ONE such heading (it was being appended, producing duplicate dated copies). Fixes the generator so future docs stay dense rather than hand-trimming each one.

## 1.34.4

- **task-summary**: Read `references/templates.md` on every run, not just creation — the template (canonical section structure + gold-standard format) was only linked from the Create branch in §2/§3, so the Update path never loaded it and edits could drift from the template's conventions. §2 now reads both the resolved path and the template before the Create/Update fork. Caught when a "condense existing doc" request skipped the reference entirely because Update mode had no instruction to open it.

## 1.34.3

- **task-summary**: Reconcile back-references on update — index/roadmap/hub docs only *mirror* a feature's status and own no code, so the work-driven §1 scan never reaches them and their status drifts silently (a roadmap row reading "uncommitted" weeks after ship). New §6 step greps for docs that link back to the one just updated and status-syncs the mirrored row; §5 validation gains a check for it. Caught when a roadmap row still said "Implemented (uncommitted)" after the feature shipped to prod and only a manual "check all related" surfaced it.

## 1.34.2

- **read-summary**: Strengthen enforcement — add mandatory-first-action warning that blocks any query/edit/answer before the full Read Order completes; add explicit "Investigation / diagnostic" intent type (read-only questions like "is X paid by card?" or "why did Y fail?") to prevent premature answers

## 1.34.1

- **read-summary / update-claude-docs / task-summary**: Discover task docs by content, not folder name — folder slugs are engineer-domain-named and rarely match the request (`upload-redesign` owns "QC", `payout` owns "refund"). All three now `Glob`+`Grep` for the concept's vocabulary + synonyms across doc body + header, follow `Merged into`/`Supersedes` redirects, and verify a pointer's target exists before writing it. Prevents wrong-doc reads and duplicate docs.

## 1.34.0

- **pull-db**: New skill — transfer a MySQL/MariaDB database from a remote server to local dev environment; handles mysqldump on server, binary-safe scp transfer, MariaDB→MySQL FK compatibility fixes, password reset, and cleanup

## 1.33.0

- **done**: Enforce multi-domain task doc scan — removes single-path shortcut; task-summary always scans full conversation to avoid missed updates to related docs

## 1.32.0

- **done**: Multi-domain task doc updates — now scans all domains touched in session, not just the primary one; catches bug reports and feature requests mentioned across chat/email/WhatsApp
- **task-summary**: Multi-domain scan — when no explicit path given, scans full conversation (code changes, external inputs, verbal requests) and creates/updates a task doc per domain
- **gitnexus skills**: Add 6 new GitNexus skills — `gitnexus-cli`, `gitnexus-debugging`, `gitnexus-exploring`, `gitnexus-guide`, `gitnexus-impact-analysis`, `gitnexus-refactoring`

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
