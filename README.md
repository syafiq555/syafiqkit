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

## Output style

Installing syafiqkit changes how Claude writes its answers. A `SessionStart` hook injects an ADHD-oriented ruleset when a session starts, resumes, is cleared, or compacts — responses lead with the thing to do, multi-step work arrives numbered, estimates use real units, and stock openers and closers are dropped. It applies whether or not you invoke a syafiqkit skill (a *forked* session is the one exception — it gets no ruleset), and **there is no setting to turn it off** — the only way off it today is `claude plugin uninstall syafiqkit@syafiqkit`, which takes the skills with it. If the style gets in your way, say so and it can be made optional. The ruleset is `hooks/RULESET.md` if you want to read what it asks for. On Windows without Git Bash the hook silently does nothing and every skill still works.

## Menu and task-doc browser (terminal and Desktop app)

On Claude Code 2.1.287 or later (Desktop app 2.1.286), a line above your prompt reads `▤ syafiqkit  [ Menu ] [ Docs ] │ [ Commit ] [ Done ] [ Hand off ]`. Commit sends straight away; Hand off opens a one-line form where Enter saves (the message is optional); Done shows what it will do and asks first. It is a plugin module, so it needs no setup.

- **`/sk` (or Menu)** — one-key menu: commit, commit and push, done, read a task doc, ship, shrink a doc (condense runs on haiku), refresh a doc, merge docs, hand off. Anything that pushes, deploys, runs done or rewrites a doc shows what it does and the exact message first, and asks again. Those confirms offer an optional "also hand off to the next session when this finishes", with a message.
- **`/task-docs` (or Docs)** — a filterable list of task docs (each shown once under its folder, recently changed first, size warnings beside the doc), `CLAUDE.md` files, rules and project docs. Only `current.md` is listed; open one to read it rendered, list its `decisions/` files by name and open the one you click on its own page (with Prev and Next), pick its open checklist items and send them to Claude (after `/syafiqkit:read-summary`). It refreshes while the doc changes, and after you send items the Docs button returns to that doc. Mermaid diagrams show as pictures in terminals that can draw them (in iTerm2, start Claude Code with `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1`).
- **`/changes` (or Changes)** — review what changed without opening an editor: a file tree (staged first) with a toolbar to stage, unstage or discard the selected file or folder, and stacked diffs with line numbers, red and green rows and the changed words marked. It opens on your unstaged files when there are any. Discard asks first and only applies to working-tree changes; there is no commit button here (the band's Commit stays).
- **Images (N)** — appears in the band once Claude shows you PNG screenshots through its `show_image` tool (an e2e run's screenshots, for example). The pane does not open by itself. In iTerm2 pictures need `CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1`; Open in viewer uses your system's image viewer.
- **Hand off** — saves a short summary of the session (one haiku call), the files touched and the git state under `~/.claude/handoffs/`. The next session, or the one after `/clear`, shows `↪ Handoff … [ Resume ]`; Resume always starts with `/syafiqkit:read-summary`.

It draws nothing in the VS Code panel or `claude -p`. It runs with your permissions: it runs `git`, `chmod` (best effort, to keep handoffs private) and, for diagrams, `npx @mermaid-js/mermaid-cli@12.0.0`. The mod itself writes only to `~/.claude/handoffs/` and `~/.claude/doc-pane-cache`; the first diagram also makes `npx` fill its own package cache and download a browser, which can take minutes. Set `SYAFIQKIT_MOD=0` in your shell before starting Claude Code (setting it in `settings.json` is untested) to turn the mod off and keep the skills; `claude --safe-mode` or disabling the plugin turns off everything.

## Commands

| Command | Description |
|---------|-------------|
| `/read-notes` | Read a personal session journal |
| `/update-notes` | Create/update a personal session journal |

## I want to…

| I want to | Run |
|-----------|-----|
| Commit what's staged | `/commit` |
| Commit and push | `/commit push` |
| Release to production (commit, changelog, push, check CI) | `/ship` |
| Wrap up after a task (review, tidy, update docs) | `/done` — or `/quick-done` for a small session |
| Read a task doc before answering or building | `/read-summary <path>` |
| Carry on from a doc, picking what is buildable | `/tackle` |
| Hand work off to a new or parallel session | `/continue-session` |
| Shrink a task doc, or split one over 300 lines or with a decisions file over 40 KB | `/condense-task-doc` |
| Shrink a CLAUDE.md | `/condense-claude-md` |
| Tidy any living doc in one go (restructure, shorten, drop over-strict rules) | `/refresh-instructions` |
| Merge overlapping task docs | `/merge-task-docs` — `/sweep-doc-overlaps` to look across every domain |
| Write or update a task doc | `/task-summary` — `/write-summary` and `/update-summary` are the same skill under other names |

Four skills can rewrite a CLAUDE.md, so pick by what you want: `/condense-claude-md` to make it shorter, `/update-claude-docs` to add a lesson or rebuild it to the house layout, `/refresh-instructions` for the full tidy, `/unhobble-instructions` when the rules read like commands and should read like judgement.

## Skills

| Skill | Description |
|-------|-------------|
| `/commit` | Create git commits from staged changes; single-repo and multi-repo. Add `push` (`/commit push`) to push as well |
| `/read-summary` | Load existing task summary for context |
| `/tackle` | Vague multi-item doc continuation only — reads the doc, judges what's buildable, builds it (use `/read-summary` for a specific ask) |
| `/plan-worklist` | Turn a pre-scoped list of items (findings, backlog, ClickUp paste) into a build plan — dispatches `product-reviewer` to size/sequence them, then stops before writing code |
| `/judgement` | Something came up mid-task that may not be yours to decide — measure who the change newly affects, then decide it yourself or escalate with the number attached |
| `/write-summary` | Create new task documentation (thin pointer → `task-summary`) |
| `/update-summary` | Append findings to existing summary (thin pointer → `task-summary`) |
| `/task-summary` | Create/update task summary docs with path resolution, templates, cross-refs |
| `/done` | Post-task cleanup — simplify, review, update docs |
| `/setup-project-docs` | Establish a project's core doc set (PRD, ARCHITECTURE, ARCHITECTURE-ESSENTIALS, CLAUDE.md/AGENTS.md) — for a greenfield project or an existing codebase adopting docs for the first time |
| `/extract-shared-package` | Extract a module shared by two or more apps into a Composer or npm package: boundary, one package with an entry per capability, hosting and auth where installs really run, exact pins, CI matrix, strangler rollout |
| `/update-claude-docs` | Create / rewrite-to-best-practice / condense / capture-into CLAUDE.md files — the CLAUDE.md analog of task-summary |
| `/update-plugin` | Scan the session for plugin learnings and patch the affected skill files — the plugin equivalent of update-claude-docs |
| `/ship` | End-to-end ship: commit → changelog → push → CI verify → release note |
| `/pull-db` | Transfer MySQL/MariaDB DB from remote server to local dev |
| `/commit-invoice-generator` | Generate invoice line items from git commits |
| `/design-handoff` | Write a brief for someone ELSE to design a screen (external designer, Claude Design, contractor) — purpose, audience, business and legal rules, measured failures; layout, components and step count stay theirs. Designing it yourself is `/uiux` |
| `/gchat-format` | Convert Markdown to Google Chat syntax — for a document posted to a thread (release note, status update, announcement) |
| `/casual-message` | Write a casual 1:1 message in your own voice — a WhatsApp reply, a colleague DM, "tell X that…"; short, unfenced, matches how you actually talk (including casual Malay/Manglish) |
| `/continue-session` | Produce the copy-paste prompt that starts a fresh session where this one stopped — doc path, next goal, uncommitted state; next session asks open decisions |
| `/md-to-pdf` | Convert Markdown to PDF with rendered Mermaid diagrams |
| `/excalidraw-board` | Draw a task doc or worklist as a black-and-white Excalidraw discussion board (gates, waiting-on, parked-with-revive-trigger, live decisions strip), pasted into the user's excalidraw.com tab |
| `/user-manual` | Write an end-user manual — scope, tutorials, E2E screenshots, Word/PDF editions |
| `/brainstorming` | Design exploration before creative/architectural work |
| `/agent-setup` | Create/update project agents using Bootstrap pattern |
| `/ci-ssh-deploy-timeout` | Diagnose + fix flaky CI deploys that SSH-timeout to a server (rules out firewall, applies connect-only retry) |
| `/setup-playwright` | Set up a Playwright E2E suite, or harden a flaky one (per-worker fixtures, seeded test data, throttle-safe auth) |
| `/function-parameter-limits` | Apply + enforce the 0/2/3+ function-parameter rule — advises parameter-object/DTO refactors and sets up the right linter (ESLint/PHPMD/Pylint) with DI-constructor carve-outs |
| `/hobby-review` | Socratic debrief of a hobby item against the taste rubric in the matching task doc |
| `/haiku` | Run a task or a named skill on haiku agents instead of the current session, with a verification pass over what comes back |
| `/merge-task-docs` | Find related task docs in a domain and merge them, reconciling all back-references |
| `/sweep-doc-overlaps` | Fleet-wide scan across ALL `tasks/` domains for CROSS-domain merge candidates; hands confirmed groups to `merge-task-docs` |
| `/notes-summary` | Create, update, or read a personal session journal outside the repo |
| `/condense-task-doc` | Aggressively condense a bloated task doc in place; a doc over 300 lines, or a decisions file over 40 KB, is split into a routing index plus smaller `decisions/` files |
| `/condense-claude-md` | Aggressively condense a bloated CLAUDE.md file in place |
| `/unhobble-instructions` | Audit + rewrite a SKILL.md/agent/CLAUDE.md/command for overconstraint vs. genuine fact, per Anthropic's "Unhobbling Claude" framing |
| `/refresh-instructions` | Full three-pass refresh on any living doc — CLAUDE.md, task doc, `docs/` set file, README or runbook — restructure, condense, then unhobble, each on haiku and verified in sequence |
| `/skill-creator` | Create a new skill — place it, draft it, register it, and verify its trigger actually fires |
| `/self-organize-agent-memory` | Dispatch a project agent onto its own bloated `.md` file to decide what stays inline vs. what moves to its own agent-memory |
| `/uiux` | Design judgement for UI work at any scope — polish, rethink, or redesign from one element to a whole module, greenfield or existing app; mobile-first by default, judges whether an existing design language or stack is dated, designs for people who scan rather than read; critiques an existing screen with a scored review before touching it; also covers landing pages; also fires on a UI screenshot or a "looks wrong" report that never names UI, or when asked how real products solve a pattern (case studies, researched and verified) |
| `/quick-done` | Cheap docs-only wrap-up for a small session — CLAUDE.md capture + task-doc update, and no review of any kind (no code review, simplifier, or product lens) |

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

# Reply to a colleague in your own voice
/casual-message

# Brief someone else to design a screen
/design-handoff

# Running low on context — get the prompt for a fresh session
/continue-session
```

## Updating / Uninstalling

```bash
claude plugin update syafiqkit@syafiqkit
claude plugin uninstall syafiqkit@syafiqkit
```
