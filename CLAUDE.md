# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Claude Code plugin providing personal workflow automation: commit messages, task summaries, documentation capture, invoice generation, PDF export, Google Chat formatting, remote DB sync, and end-to-end ship workflow.

## Plugin Structure

```
.claude-plugin/
├── plugin.json          # Plugin metadata
└── marketplace.json     # Marketplace listing
commands/                # User-invocable slash commands
skills/                  # Multi-step workflows (SKILL.md files)
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

### Skills

| Skill | Purpose | Used By |
|-------|---------|---------|
| `agent-setup` | Create/update project agents using Bootstrap pattern | `/agent-setup` or `/update-claude-docs` |
| `read-summary` | Discover + read task docs/CLAUDE.md before answering, investigating, or implementing; Plan-Mode-aware (judges Explore/Plan subagent delegation vs continuing inline) | User invokes, or model-invoked proactively before project-context-dependent work |
| `tackle` | Take work to done from either entry: doc exists → `read-summary`; no doc → `brainstorming` (only if genuinely unclear) + `task-summary` Create. Then **triage open items by blocker type** (actionable / human-blocked / env-blocked / dependent) → parallel `Explore` (haiku) → `Plan` + `task-builder` (sonnet) → `done`. Recommends a sequence instead of offering a sweepable menu | User invokes (task-doc path + vague "let's continue", or a new feature request) |
| `done` | Post-task cleanup orchestrator | User invokes directly |
| `task-summary` | Create/update task summary docs with path resolution, templates, cross-refs | `write-summary` skill, `update-summary` skill, `done` skill |
| `write-summary` | Create task summary (thin pointer → `task-summary` skill) | User invokes directly |
| `update-summary` | Update task summary (thin pointer → `task-summary` skill) | User invokes directly |
| `brainstorming` | Design exploration before creative/architectural work | User invokes or proactive |
| `commit-invoice-generator` | Generate invoice line items from git commits | User invokes directly |
| `md-to-pdf` | Convert Markdown to PDF with rendered Mermaid diagrams | User invokes directly |
| `gchat-format` | Convert Markdown to Google Chat syntax | User invokes or `/gchat-format` |
| `ship` | End-to-end ship: commit → changelog → push → CI verify → release note | User invokes directly |
| `pull-db` | Transfer MySQL/MariaDB DB from remote server to local dev (dump, scp, import, password reset) | User invokes or proactive |
| `hobby-review` | Socratic debrief of a hobby item (anime, book, game, etc.) against the taste rubric in the matching current.md | User invokes or proactive after "I watched/finished X" |
| `function-parameter-limits` | Advise + enforce the 0/2/3+ function-param rule (parameter-object/DTO refactors; ESLint/PHPMD/Pylint setup with DI-constructor carve-outs) | User invokes or proactive on "too many params" |
| `merge-task-docs` | Find related task docs in a domain, classify by subsystem boundary (not keyword), merge into fewer docs, delete sources, reconcile all back-references | User invokes or proactive when docs overlap |
| `update-plugin` | Scan the session for plugin learnings (misfired triggers, missing rules, wrong workflow steps, new skills), then patch the actual SKILL.md files. The plugin equivalent of update-claude-docs | User invokes explicitly after skill-creator work |
| `update-claude-docs` | Create / rewrite-to-best-practice / condense / capture-into CLAUDE.md files. The CLAUDE.md analog of `task-summary` (SKILL.md workflow + `references/structure.md` canonical template). Capture mode is `/done` Step 3's single CLAUDE.md writer | `done` skill Step 3, or user directly |
| `notes-summary` | Create, update, or read a personal session journal outside the repo (non-code conversations: boss/team/career/strategy) | User invokes directly |
| `condense-task-doc` | Aggressively condense a bloated task doc; SPLITS a whole-doc MADR >300 lines into index + `decisions/<theme>.md` | User invokes, or `task-summary` when a doc is >300 lines |
| `condense-claude-md` | Aggressively condense a bloated CLAUDE.md (removes excess — not the analog that adds content) | User invokes, or `update-claude-docs` Condense mode |
| `ci-ssh-deploy-timeout` | Diagnose CI/CD deploys that intermittently can't SSH the target; convert to a connect-retry pattern instead of allowlisting runner IPs | User invokes or proactive on "deploy keeps timing out" |

### Typical invocation sequence

These skills compose but are usually invoked as SEPARATE commands in sequence, not one chained instruction:

1. `/commit` + `/ship` — usually given together as one instruction; `ship`'s own commit step already covers it.
2. `/update-summary` (task-summary) then `/update-claude-docs` — run back-to-back as individual invocations after a ship, not combined.
3. `/update-plugin` — invoked standalone afterward, sometimes much later in the session. Frequently followed by mid-skill "improvise/extend this too" instructions — treat those as widening the CURRENT run's scope (e.g. patch sibling skills sharing the same mechanism, per its own Step 2 rule), not as a cue to re-invoke.

## Project-Specific Agents

`/agent-setup` creates project-local agents in `.claude/agents/` using the **Bootstrap pattern** — agents read CLAUDE.md at runtime instead of having content injected. See `skills/agent-setup/templates/` for agent templates. `/done` uses these project agents (with fallback to external plugins).

⚠️ **MANDATORY — a fix to any agent file is a fix to BOTH copies AND every sibling sharing that line.** Two directions, one grep:

1. **Parity**: editing a generated `.claude/agents/<name>.md` requires patching its source `skills/agent-setup/templates/<name>.template.md` in the same change (and vice versa) — otherwise the next `/agent-setup` regenerates the old behavior. Recurred 4+ times.
2. **Blast radius**: agent files are written by copy-paste, so a wrong line is almost never in one file. Before fixing, `grep -rn` the literal line across `.claude/agents/` **and** `templates/`; fix every hit. A single `Agent`-tool comment claiming its host was `Explore` sat in **11 files** — found only by grepping past the one file the typo was noticed in.

## Command/Skill Anatomy

**Commands** (`commands/*.md`):
```yaml
---
description: Short description for skill list
argument-hint: "[optional hint]"        # Shows in autocomplete
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

⚠️ **`allowed-tools:`/`tools:` is a fixed enum, not an appendable allowlist — there is no way to add `Agent` to an existing list.** A skill that needs to spawn agents (background Haiku drafts, sub-delegation) omits the `tools:`/`allowed-tools:` line entirely instead — see `done`, `ship`, `agent-setup`, none of which declare it. Appending `Agent` to an existing list silently fails to grant it.

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
| Include examples in markdown | Helps Claude execute correctly |
| Use tables for structured guidance | More scannable than prose |
| Agents use Bootstrap pattern | Agents read CLAUDE.md at runtime; only ~15 critical rules kept inline for zero-latency access |
| Plugin must be self-contained | Never reference user's global `~/.claude/CLAUDE.md` - other users won't have it |
| User preferences → skill/command changes, not memory | Plugin `memory/` dir is shared repo — personal prefs go in user's project memory or baked into skill defaults |
| Commands/skills that need agents → instruct Claude to spawn, not "spawn" directly | Commands are prompts — Claude (the executor) reads and makes Agent tool calls. Same pattern as `/done` |
| A skill's SCOPE outgrows its NAME → rename it in the same change that widens it | A name that misdescribes scope is a trigger bug, not cosmetics: the description drives model invocation, so a skill named for half its job fires for half its cases. `continue-task` gained a greenfield path and became `tackle` immediately. Renaming is cheap (`git mv` + grep every reference); a stale name silently under-fires forever |
| Command outgrows "single workflow"? → Migrate to skill; if it's a pure alias into another skill, convert the wrapper itself to a skill (not a command) | A command can only invoke, never reference/point — once its whole body is "go run skill X," it belongs in `skills/`, registering `/name` via its own `name:` frontmatter. Precedent: `write-summary`/`update-summary` → `skills/write-summary`, `skills/update-summary` (thin pointers to `task-summary`); `read-summary`, `update-claude-docs` converted outright when their name matched the target skill (see `tasks/plugin-maintenance/decisions/madr-structure.md` D10) |
| Same rule/table duplicated verbatim across 3+ SKILL.md files → extract to `skills/_shared/references/<topic>.md`, replace each copy with a one-line pointer | One-place edits; e.g. `writing-style.md` (no-filler-words, one-idea-per-sentence) is referenced by `task-summary`, `notes-summary`, `update-claude-docs`, `condense-task-doc`, `condense-claude-md`. For a rule that's canonical in ONE skill but referenced elsewhere (not truly shared), point to that skill directly instead (e.g. `task-summary`'s merge rules point to `merge-task-docs`) — don't create a `_shared/` file for a single owner |
| Never add `disable-model-invocation` unless user explicitly asks | User dislikes it — it drops the skill/command from Claude's context, killing auto-suggestion. Default to proactive invocation |
| **Every change = version bump** | Bump both version files (see [Version Bumping](#version-bumping)) |

## Maintenance {#maintenance}

### When Modifying Commands/Skills

1. **Run code-simplifier**: Target <100 lines per command; 47%+ reduction signals bloat
2. **Review checklist**:
   - Missing `path` param on Glob/Grep instructions
   - Inconsistent behavior vs related commands/skills
   - Ambiguous criteria (define what "related" or "connection" means)
   - Missing edge cases (archived docs, Status: Done)
   - Skill references a non-existent terminal skill (e.g. `writing-plans`) — always verify referenced skills exist in `skills/*/SKILL.md` before shipping
   - Same flow described in 4 places (checklist + diagram + prose + after-section) — one `## Steps` section is enough; redundancy causes section drift
   - Judging bloat by line count alone — a dense one-row-per-item table can sit at target line count while individual cells run 800+ characters; use `wc -c` alongside `wc -l` before ranking files by size. Compute the bytes/line ratio with a tool (`echo "scale=1; $(wc -c < f)/$(wc -l < f)" | bc`), never mentally — an eyeballed ratio that lands the wrong side of the ~80-90 threshold inverts the diagnosis (extract vs tighten) and reads as measured
   - A skill "feels bloated" → run `syafiqkit:update-plugin`'s Step 3a density-pass checklist (stacked warnings, worked anecdotes, cold-path extraction) rather than a from-scratch audit — see `tasks/plugin-maintenance/decisions/doc-condensation.md` D23
   - Touching ANY skill: the registry lives in **three** hand-maintained places — this file's `## Skills` table, `README.md`'s, and `tasks/plugin-maintenance/current.md`'s. Adding to one is the common miss; the worse failure is silent rot in tables nobody edited (3 skills were absent from this file's table for months while present in README). Never trust them by eye — diff against disk, which is the only source of truth:
     ```bash
     sed -n '/^### Skills/,/^### Typical/p' CLAUDE.md | grep -oE '^\| `[a-z-]+`' | tr -d '|` ' | sort > /tmp/c.txt
     ls -d skills/*/ | grep -v _shared | sed 's|skills/||;s|/||' | sort > /tmp/d.txt
     comm -13 /tmp/c.txt /tmp/d.txt   # any output = rows missing from CLAUDE.md
     ```
   - Inconsistent edits — when changing a concept (e.g., model name), verify all references (headings, body, comments) match
3. **Reference**: `tasks/plugin-maintenance/current.md` for plugin patterns and research

### Design Principles

| Principle | Application |
|-----------|-------------|
| Autonomous over interactive | Skills should complete without asking; use smart defaults |
| Auto-create over abort | Missing docs → create minimal template, don't block workflow |
| Explicit criteria | "2+ files OR business logic" not "significant changes" |
| Graceful degradation | PRIMARY missing → auto-create; SECONDARY missing → skip + suggest |

### Prompting Techniques for Commands {#prompting-techniques}

Commands/skills are prompts — apply these patterns when authoring or refactoring them:

| Technique | When to use | How |
|-----------|-------------|-----|
| **Constitutional (❌ constraints)** | Commands that make routing/write decisions | Add `❌ Never / ✅ Always` table before the action step |
| **Validation Loop** | Commands that write or modify files | Add numbered self-check after write step: addresses all points? no deletions? format correct? revise if fails |

⚠️ **Don't prescribe visible `<thinking>` blocks in a skill.** Retired 2026-07-16 after zero uptake across 18 skills — reasoning scaffolds belong to the harness/output-style layer, not to skill files, and a skill that hardcodes one fights whatever style is active. See D33 (`tasks/plugin-maintenance/decisions/doc-condensation.md`).

**Skip for**: Simple commands (<3 decision branches), read-only commands (no files written). Adding these to trivial commands adds noise without benefit.

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
