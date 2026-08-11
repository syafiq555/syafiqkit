# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Claude Code plugin providing personal workflow automation: commit messages, task summaries, documentation capture, invoice generation, PDF export, Google Chat formatting, remote DB sync, and end-to-end ship workflow.

## Plugin Structure

| Type | Location | Trigger |
|------|----------|---------|
| Command | `commands/*.md` | `/syafiqkit:<name>` |
| Skill | `skills/<name>/SKILL.md` | `/syafiqkit:<name>` or proactive |

## Commands & Skills

### Commands

| Command | Purpose |
|---------|---------|
| `read-notes` | Read a personal session journal |
| `update-notes` | Create/update a personal session journal |

### Skills

| Skill | Purpose | Used By |
|-------|---------|---------|
| `agent-setup` | Create/update project agents using Bootstrap pattern | `/agent-setup` or `/update-claude-docs` |
| `commit` | Create git commits from staged changes; single-repo and multi-repo | User invokes directly |
| `read-summary` | Discover + read task docs/CLAUDE.md before answering, investigating, or implementing; Plan-Mode-aware (judges Explore/Plan subagent delegation vs continuing inline) | User invokes, or model-invoked proactively before project-context-dependent work |
| `tackle` | Vague multi-item doc continuation ("let's continue") → `read-summary`, judge what's buildable vs blocked, build, `done`. A specific ask is `read-summary`'s job, not this | User invokes only for genuinely vague "let's continue" on a doc |
| `plan-worklist` | A pre-scoped list of items (findings, backlog, ClickUp paste) → dispatch `product-reviewer` to size/sequence each against product intent → present the plan and stop, don't build | User invokes ("let's do these", "use product reviewer to see it first", "scope this list") |
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
| `sweep-doc-overlaps` | Fleet-wide parallel scan across ALL `tasks/` domains for CROSS-domain merge candidates a single-domain `merge-task-docs` call would never see; hands confirmed groups to `merge-task-docs` for execution | User invokes when no domain/keyword is named |
| `update-plugin` | Scan the session for plugin learnings (misfired triggers, missing rules, wrong workflow steps, new skills), then patch the actual SKILL.md files. The plugin equivalent of update-claude-docs | User invokes explicitly after skill-creator work |
| `update-claude-docs` | Create / rewrite-to-best-practice / condense / capture-into CLAUDE.md files. The CLAUDE.md analog of `task-summary` (SKILL.md workflow + `references/structure.md` canonical template). Capture mode is `/done` Step 3's single CLAUDE.md writer | `done` skill Step 3, or user directly |
| `notes-summary` | Create, update, or read a personal session journal outside the repo (non-code conversations: boss/team/career/strategy) | User invokes directly |
| `condense-task-doc` | Aggressively condense a bloated task doc; SPLITS a whole-doc MADR >300 lines into index + `decisions/<theme>.md` | User invokes, or `task-summary` when a doc is >300 lines |
| `condense-claude-md` | Aggressively condense a bloated CLAUDE.md (removes excess — not the analog that adds content) | User invokes, or `update-claude-docs` Condense mode |
| `ci-ssh-deploy-timeout` | Diagnose CI/CD deploys that intermittently can't SSH the target; convert to a connect-retry pattern instead of allowlisting runner IPs | User invokes or proactive on "deploy keeps timing out" |
| `setup-playwright` | Scaffold a Playwright E2E suite, or harden an untrusted one — per-worker fixture partitioning (not a lockfile) for cross-file races, a seeder so the suite survives a DB reset, throttle-safe API auth. Judges whether CI wiring is even the right next step | User invokes ("set up e2e", "our e2e tests are flaky", "specs pass alone but fail together") |
| `haiku` | Run a task or a named skill on one or more haiku agents instead of this session, then verify the result before reporting — snapshot, identifier/number survival, and the reworded-claim check a grep can't catch | User names haiku, or asks for parallel agents on disjoint work |
| `unhobble-instructions` | Audit + rewrite a SKILL.md/agent/CLAUDE.md/command for overconstraint (rigid imperatives, "Tell:" trip-wires, mechanical thresholds) vs. genuine fact, per Anthropic's "Unhobbling Claude" framing. Narrower and stricter than a plain density pass — the lens is judgement-vs-constraint, not byte count | User invokes explicitly ("apply unhobbling to X", "is this overconstrained") |
| `skill-creator` | Create a NEW skill — judge whether it should be one at all, place it (plugin vs project vs personal), draft the SKILL.md, register it in both tables, pressure-test the trigger. Creates; `update-plugin` maintains | User invokes ("create a skill for X", "turn this into a skill"), or a session reveals a repeated procedure no skill covers |
| `self-organize-agent-memory` | A project agent's own `.md` definition has a bloated inline reference table crowding out its procedural steps — dispatch THAT SAME agent onto its own file to decide what stays inline vs. what moves to its own `.claude/agent-memory/<agent>/`, in whatever format it judges serves the content. Verify with an identifier sweep afterward, never trust the migration summary alone | User invokes ("this agent file is too long, move some to memory", "let the agent organize its own memory") |
| `uiux` | Design judgement for UI work at any scope — polish, rethink, redesign, from one element to a whole module. Reads the app's existing conventions before proposing, names the AI-default looks so a choice stays distinct from a default, and covers the states a happy-path screenshot hides (loading, empty, error, overflow). Also fires when a screenshot arrives or someone reports what they *saw* without naming UI | User invokes ("polish the uiux for this module"), or proactively when a UI screenshot lands |
| `quick-done` | The cheap sibling of `/done` for a session already known to be small — an `update-claude-docs` pass, one `task-summary` pass, the plugin gate. Docs-only by design: it spawns no reviewer, so nothing reads the code for defects | User invokes explicitly ("quick done", "small change, just quick-done it") |

### Typical invocation sequence

These skills compose but are usually invoked as SEPARATE commands in sequence, not one chained instruction:

1. `/commit` + `/ship` — usually given together as one instruction; `ship`'s own commit step already covers it.
2. `/update-summary` (task-summary) then `/update-claude-docs` — run back-to-back as individual invocations after a ship, not combined.
3. `/update-plugin` — invoked standalone afterward, sometimes much later in the session. Frequently followed by mid-skill "improvise/extend this too" instructions — treat those as widening the CURRENT run's scope (e.g. patch sibling skills sharing the same mechanism, per its own Step 2 rule), not as a cue to re-invoke.
4. `/quick-done` is an ALTERNATIVE to `/done`, never a step after it — a session the user knows was small and low-risk runs one or the other, not both. It runs `update-claude-docs` and `task-summary` and nothing else, so it skips every review lens including the code review; `/done` stays the default whenever the size isn't already settled, and is the only one of the two that satisfies `/ship`'s reviewed-code precondition.

## Project-Specific Agents

`/agent-setup` creates project-local agents in `.claude/agents/` using the **Bootstrap pattern** — agents read CLAUDE.md at runtime instead of having content injected. See `skills/agent-setup/templates/` for agent templates. `/done` uses these project agents (with fallback to external plugins).

**Agent file parity**: Editing a generated `.claude/agents/<name>.md` requires patching its source `skills/agent-setup/templates/<name>.template.md` in the same change. Otherwise the next `/agent-setup` regenerates the old behavior. Before fixing an agent file, grep the literal line across both `.claude/agents/` **and** `templates/`; fix every hit. Drift often happens silently — a spawn failing with `effort 'xhigh'/'max' not supported` is worth diffing against its template before treating it as an environment fault; one instance was the generated file alone drifting to `model: opus` while its template read `sonnet`.

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

The `allowed-tools:` field is a fixed enum, not an appendable allowlist — there is no way to add `Agent` to an existing list. A skill that needs to spawn agents omits the `tools:`/`allowed-tools:` line entirely instead — see `done`, `ship`, `agent-setup`, none of which declare it. Appending `Agent` to an existing list silently fails to grant the permission.

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

## Core Conventions

| Principle | Rationale |
|-----------|-----------|
| Keep commands focused | Single workflow per command; easier to compose and debug |
| Include examples in markdown | Helps Claude execute correctly |
| Use tables for structured guidance | More scannable than prose |
| Agents use Bootstrap pattern | Read CLAUDE.md at runtime; only essential rules kept inline |
| Plugin is self-contained | Never reference user's global `~/.claude/CLAUDE.md` — other users won't have it |
| User preferences → skill changes, not memory | Plugin `memory/` is shared repo — personal prefs go in project-local memory or skill defaults |
| Skills that need agents → instruct Claude to spawn | Commands are prompts; Claude reads and makes Agent calls. Same pattern as `/done` |
| Scope outgrows name → rename in same change | A name misdescribing scope is a trigger bug: description drives model invocation. Example: `continue-task` gained greenfield path and became `tackle` immediately. Renaming is cheap; a stale name under-fires forever |
| Command outgrows single workflow → migrate to skill | A command can only invoke, never point. Once its body is "go run skill X," it belongs in `skills/`. Precedent: `write-summary`/`update-summary` became skills; when name matched target skill, convert outright |
| Shared rule/table across 3+ skills → extract to reference | One-place edits; example: `writing-style.md` (no filler, one idea per sentence) is referenced by six skills. For a rule canonical in ONE skill, point to that skill directly instead |
| References in `_shared/` use literal relative paths | `_shared/references/X.md` resolves against citing file's directory; from `skills/<name>/SKILL.md` it needs `../`; from `skills/<name>/references/*.md` it needs `../../`. Verify a new pointer resolves before landing it |
| Never add `disable-model-invocation` without user request | User dislikes it — kills auto-suggestion. Default to proactive invocation |
| Size policy lives in condense skills only | CLAUDE.md → `condense-claude-md`; task doc → `condense-task-doc`. They own thresholds and split decisions. Callers may name a number as a trigger to delegate, never as a policy to enforce |
| `claude-md-pruner` scope is intentionally wider than its name | It prunes task docs too. Do not "fix" the name — renaming breaks silent gates (`update-claude-docs` Step 4 Globs the literal filename, and `agent-setup` checks templates→agents only). The name is inert for spawn; `description:` carries the real trigger surface |
| Every change = version bump | Bump both files (below). A fan-out of parallel edits means re-read immediately before writing; expect to bump again if it moved |
| Release notes state the reader's action | Consumers install via marketplace without repo access. Required: (1) `claude plugin update syafiqkit@syafiqkit`; (2) what prior output is now invalid (re-run? regenerate?); (3) any edge case the reader would wonder about. Skills get re-read every invocation, so skill-only changes need no regeneration — say that only if agents/templates were touched |

## Version Bumping {#version-bumping}

The version lives in two files and must match:

| File | Field |
|------|-------|
| `.claude-plugin/plugin.json` | `"version"` |
| `.claude-plugin/marketplace.json` | `plugins[0].version` |

When editing, re-read both files immediately before writing your own bump — working copies may disagree from a prior uncommitted bump. Take the highest value anyone has claimed (working copies, unreleased CHANGELOG headings), not just the committed baseline.

The bump and its CHANGELOG entry are one change. When the entry can't be written — the file is contested, the work isn't finished — don't land the bump alone and note the entry as owed: a tree advertising a version with no heading behind it is worse than either half, because a concurrent session re-reading the version files takes its next number from a string nobody has published, and the two of you collide on it. Leave the version at the committed baseline and let whoever writes the entry take the number then. When multiple agents edit in parallel, each re-reads before bumping to avoid racing to a stale value. Running `claude plugin update syafiqkit@syafiqkit` reloads the installed copy once, after all changes land — don't run it mid-batch, or you reload a partial version.

## Prompting Techniques for Skills and Commands

Commands and skills are prompts — apply these patterns when authoring:

| Technique | When to use | How |
|-----------|-------------|-----|
| **Constitutional (❌ constraints)** | Routing/write decisions | Add `❌ Never / ✅ Always` table before the action step |
| **Validation Loop** | File writes/modifications | Add numbered self-check after write: all points addressed? no deletions? format correct? revise if needed |

A skill that writes formatted output under its own style rule should re-read its own new text against that rule — a fix for "don't write flat imperatives" can itself land as bolded imperatives, and nothing else catches that gap.

The `<thinking>` block pattern was retired 2026-07-16 after zero uptake — reasoning scaffolds belong to the harness, not skill files. A skill that hardcodes them fights the active output style.

## Prompting for Skill Maintenance

When modifying skills or commands, reference the detailed checklist in `skills/_shared/references/editing-skills-checklist.md`. That guide covers: tool-parameter validation, reachability analysis, registry sync, path portability, and the specific failure modes that each class of edit can introduce.

Critical structural checks remain inline:

- **Skill registry sync**: The registry lives in two places — this file's Skills table and `README.md`. Both must stay in sync. Never trust them by eye; diff against disk (`ls -d skills/*/`).
- **Plugin-internal paths**: `tasks/**` is not shipped in marketplace installs. A skill cannot read or write there; route writes through `update-plugin` (the only skill with an ownership gate).
- **Git probes in plugin code**: `git -C <plugin-dir>` walks up to an enclosing repo, so an ownership probe can answer about `~/.claude` itself and report a confident, wrong remote — it succeeds and misattributes rather than erroring, which is what makes it worth avoiding. Ask the CWD instead (`git rev-parse --show-toplevel`): that's the tree you'd actually edit, and it has no path to go stale.

## Design Principles

| Principle | Application |
|-----------|-------------|
| Autonomous over interactive | Skills should complete without asking; use smart defaults |
| Auto-create over abort | Missing docs → create minimal template, don't block workflow |
| Explicit criteria | "2+ files OR business logic" not "significant changes" |
| Graceful degradation | PRIMARY missing → auto-create; SECONDARY missing → skip + suggest |
