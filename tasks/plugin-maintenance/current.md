<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - decisions/agent-architecture.md — how generated agents inherit conventions + invoke sibling skills
  - decisions/doc-condensation.md — fighting duplication/bloat across docs, CLAUDE.md, skills
  - decisions/madr-structure.md — the MADR format itself: when to use it (now default, D16), pricing, how editing skills handle it
Last updated: 2026-07-15 — see Quick Start / Last Session
-->

# Plugin Maintenance

**Status**: Reference (ongoing) — index for a whole-doc MADR decision log split by theme into `decisions/*.md`.

## Quick Start (read this first in next session)

**Where we are**: Plugin is a mature skill/command system (18 skills, 6 commands) with an established design philosophy (autonomous, self-contained, delegate-don't-duplicate). Active maintenance is condensation/de-duplication passes, not new capability.

**Immediate next actions (in order)**:
1. Re-sync the Current Skills registry table (stale since before `task-summary` etc. existed — see Cross-Cutting Operational Notes)
2. `decisions/doc-condensation.md` is now 262 lines after gaining D27 — still under the 300-line split threshold, keep watching

**Gotchas that will trip you**:
- Agents don't inherit CLAUDE.md — see D1 (decisions/agent-architecture.md)
- Orchestrator skills must delegate to sibling skills, never inline their procedure — see D4 (decisions/agent-architecture.md)
- A MADR block needs its own condensation rule shipped in the same change that introduces it — see D13 (decisions/madr-structure.md)
- MADR is now the DEFAULT `Key Technical Decisions` structure for every task doc — not gated behind decision count or an explicit ask; escape hatch only when Rejected would be empty — see D16 (decisions/madr-structure.md)
- A Step-N "verify" checklist is not satisfied by having read the files earlier in-session — each item needs its own command run against current content — see D21 (decisions/agent-architecture.md)
- Skill-file bloat (SKILL.md density) is a distinct class from CLAUDE.md/task-doc bloat; `update-plugin` Step 3a owns the checklist, executed via the shared two-tier draft(Haiku)/verify model (`_shared/references/two-tier-condense.md`), also adopted by `condense-task-doc`/`condense-claude-md` — see D23 (decisions/doc-condensation.md)
- A self-caught deviation from a skill's own instructions is a reportable signal, not a silent win — see D24 (decisions/agent-architecture.md)
- Delegating a skill's heavy step to a cheaper agent only works when the mechanical (retrieval) half is split from the judgment half first — the judgment half stays on the calling session's own model — see D30 (decisions/agent-architecture.md)
- `/ship` Step 3 no longer assumes the current branch IS the deploy branch — establish it from CLAUDE.md/CLAUDE.local.md first, recognize forward-merge chains as merges not pushes
- A scan's "zero results = done" exit condition needs a must-hit control, not just a correct command — a fixed `rg -rn`→`grep -rn` command with no control still silently passes on an unrelated empty result — see D25 (decisions/agent-architecture.md)
- Pre-existing plan/spec docs sitting next to a split `current.md`/`decisions/` set are a different document type, never move them into `decisions/` — but their routing table must still enumerate them, or they go invisible — see D27 (decisions/doc-condensation.md)
- A large doc rewrite's "no rows deleted" check only covers the change's intended content — it misses collateral cuts to unrelated sections; `merge-task-docs`/`condense-task-doc` now require a full before/after section diff, not just a targeted row check — see D27 (decisions/doc-condensation.md)
- `merge-task-docs` Step 2 defaults to executing the recommended scope/structure/naming inline, asking only on genuine ambiguity — no longer requires the caller to say "don't ask" every invocation — see D28 (decisions/agent-architecture.md)
- Every generated agent template now carries `Skill` in `tools:` — `claude-md-pruner` was the last one missing it and independently duplicated `condense-claude-md`'s seam-test logic inline instead of delegating — see D29 (decisions/agent-architecture.md)

---

## Overview

syafiqkit is a Claude Code plugin providing skills/commands for task documentation, CLAUDE.md maintenance, git workflow, and project agent scaffolding. This doc is the decision log for the plugin's own architecture and maintenance practices — not a specific feature build.

---

## Skill Architecture (2026)

| Concept | Description |
|---------|-------------|
| Progressive disclosure | Descriptions load (~100 tokens), full content only on invoke (~5k tokens) |
| Reference vs Task | Reference = inline context; Task = `disable-model-invocation: true` |
| Skill composition | Skills don't call each other programmatically; orchestrate via instructions |
| Skill + commands pattern | Skill provides guidance/discovery, commands invoke skill then execute action |

### Current Skills

⚠️ **Registry drift** — see Cross-Cutting Operational Notes.

| Skill | Purpose | Invoked By |
|-------|---------|------------|
| `agent-setup` | Create/update project agents with CLAUDE.md rules | `update-claude-docs` skill |
| `task-summary` | Create/update task doc `current.md` — path resolution, templates, cross-references | `done` skill Step 4, or user directly |
| `condense-task-doc` | Aggressively condense a bloated task doc — row-existence pruning + sentence compression | User directly, or `task-summary` when a doc is >300 lines |
| `update-claude-docs` | Create/rewrite/condense/capture-into CLAUDE.md (4 modes); SKILL.md workflow + `references/structure.md` template. CLAUDE.md analog of `task-summary` | `done` skill Step 3, or user directly |
| `condense-claude-md` | Aggressively condense a bloated CLAUDE.md file | User directly, or `update-claude-docs` Condense mode |
| `done` | Post-task cleanup orchestrator + task doc templates | User directly |
| `commit-invoice-generator` | Generate invoice from git commits | User directly |
| `merge-task-docs` | Find + merge payment/domain task docs by subsystem boundary; delete sources; reconcile back-refs | User directly |
| `update-plugin` | Scan session → patch SKILL.md files with learned rules/triggers/gotchas; owns the density-pass checklist (Step 3a) for skill-file bloat | User directly after skill work |
| `read-summary` | Discover + read task docs before investigating/implementing; Plan-Mode-aware subagent delegation | User directly, or model-invoked before any project-context-dependent task |

### Invocation Control

| Scenario | Frontmatter |
|----------|-------------|
| Both user & Claude invoke | (default — `user-invocable` is `true` since 2.1.0) |
| Only user invokes | `disable-model-invocation: true` |
| Only Claude invokes | `user-invocable: false` |

### Frontmatter Fields (2026)

| Field | Where | Description |
|-------|-------|-------------|
| `context: fork` | Skills | Run in isolated subagent context |
| `agent` | Skills | Subagent type when `context: fork` |
| `model` | Skills, Agents | Override model (`sonnet`, `opus`, `haiku`, `inherit`) |
| `memory` | Agents | Persistent memory scope: `user`, `project`, `local` |
| `permissionMode` | Agents | `default`, `acceptEdits`, `plan` |
| `hooks` | Skills, Agents | Scoped hooks (PreToolUse, PostToolUse, Stop) |
| `skills` | Agents | Preload skill content into agent context |
| `disallowedTools` | Agents | Deny specific tools from inherited list |

### Composition Patterns

1. **Via subagent**: `context: fork` runs in isolated subagent
2. **Dynamic context**: `` !`command` `` injects output before Claude sees skill
3. **Explicit instructions**: Tell Claude to invoke `/other-skill` by name

### External Plugin Integration

| Plugin | Used by | Required? |
|--------|---------|-----------|
| `code-simplifier@claude-plugins-official` | `/done` Step 1 | Fallback only |
| `feature-dev@claude-plugins-official` | `/done` Step 2 | Fallback only |
| `claude-md-management@claude-plugins-official` | `/update-claude-docs` | Optional (fallback exists) |

**Pattern**: Check for project agent first → use if exists → fallback to external plugin.

---

## Design Principles

| Principle | Application |
|-----------|-------------|
| Autonomous over interactive | Skills complete without asking; use smart defaults |
| Auto-create over abort | Missing docs → create minimal template, don't block workflow |
| Graceful degradation | Use better external tool if available, fallback to self-contained |
| Explicit criteria | "2+ files OR business logic" not "significant changes" |
| Self-contained | Never reference user's global CLAUDE.md — other users won't have it |

---

## Architecture Decisions Index

Full ADR content lives in `decisions/*.md`, grouped by theme. Find your question below, open only that file.

### Read [decisions/agent-architecture.md](decisions/agent-architecture.md) if you're asking: *how do generated project agents inherit conventions, delegate to skills, and invoke them?*

| # | Decision |
|---|----------|
| D1 | Project-specific agents via prompt injection |
| D4 | Orchestrator skills delegate, never inline a sibling's procedure |
| D14 | Generated agents invoke `/read-summary`, don't reimplement it |
| D15 | Correct wiring ≠ the model reliably calling a sibling skill |
| D21 | A Step-N verify checklist needs a command per item — a prior skim isn't a check |
| D24 | A self-caught deviation from a skill's own instructions is a reportable signal, not a silent win |
| D25 | A scan's "zero results = done" exit condition needs a must-hit control, not just a correct command |
| D28 | A confirmation gate that defaults ON forces the caller to pre-empt it every invocation — `merge-task-docs` now defaults to executing the recommendation, asks only on genuine ambiguity |
| D29 | `claude-md-pruner` delegates restructuring to `condense-claude-md` instead of reimplementing the seam-test — the last template missing `Skill` per D14 |
| D30 | Splitting a skill step's mechanical retrieval from its judgment half before delegating to a cheaper agent (`Explore`) — the judgment half never leaves the calling session's own model |

### Read [decisions/doc-condensation.md](decisions/doc-condensation.md) if you're asking: *how do we fight duplication/bloat across task docs, CLAUDE.md, and skills?*

| # | Decision |
|---|----------|
| D2 | Apply LLM prompting techniques selectively, not universally |
| D3 | Fix doc bloat at the generator, not by hand-trimming |
| D5 | A skill's happy path defers to a project's documented alternative |
| D6 | A CLAUDE.md line is dead weight once a skill enforces it at action-time |
| D7 | A read-only command must still route what it notices |
| D11 | Extract only true verbatim cross-skill duplication to `_shared/references/` |
| D12 | Full duplication survey fixed two cases, explicitly left the rest |
| D17 | `.claude/rules/*.md` path-scoping frontmatter doesn't actually scope — removed as a routing recommendation |
| D18 | `/read-summary` discovery in `Explore`/`Plan` made unconditional — reverses D17's "gate is correct design" call per user's explicit precision-over-efficiency preference |
| D19 | Task-doc index + pointer added as a second structural lever for over-budget CLAUDE.md files (when the subdirectory seam-test fails but the block is feature-specific) |
| D20 | Seam-test must check EVERY real sibling subdirectory (grep-count based), not just the intuitively-obvious one — corrects D19's own stale "Multi-Agency has no seam" conclusion |
| D22 | `condense-claude-md`'s diff-based verification needs a false-positive filter, and completion needs a byte threshold alongside the line threshold |
| D23 | Skill-file density is a distinct bloat class from CLAUDE.md/task-doc bloat (no condense-* delegate exists) — fixed by hand across 7+ skills, captured as a permanent `update-plugin` checklist |
| D26 | Companion-file split (Restructuring #7) widened from global-CLAUDE.md-only to any file whose oversized section is genuinely cross-cutting — no subdirectory AND no feature owner |
| D27 | Pre-existing plan/spec docs are a distinct type from `decisions/<theme>.md` (verified against external ADR/Diátaxis convention) — split-doc guidance gained a parent-directory routing audit + an anti-silent-drop verification check |

### Read [decisions/madr-structure.md](decisions/madr-structure.md) if you're asking: *how does the MADR decision-record format itself work — when to use it, what it costs, how do editing skills handle it?*

| # | Decision |
|---|----------|
| D8 | Whole-doc MADR is priced differently from per-decision MADR |
| D9 | Multi-mode knowledge-capture skills split canonical structure into `references/` |
| D10 | A skill/command sharing a name needs no wrapper command |
| D13 | A doc-format upgrade ships its condensation rule in the same change |
| D16 | MADR is the default `Key Technical Decisions` structure, not an opt-in upgrade (supersedes D8's "never default" clause) |

---

## Cross-Cutting Operational Notes

| Issue | Fix |
|-------|-----|
| Current Skills registry table lists 7 of 18 skill directories that actually exist under `skills/` — predates `task-summary`, `condense-task-doc`, `condense-claude-md`, `brainstorming`, `ci-ssh-deploy-timeout`, `function-parameter-limits`, `gchat-format`, `hobby-review`, `md-to-pdf`, `notes-summary`, `pull-db`, `ship`; still names a `consolidate-docs` skill that no longer exists (superseded by `merge-task-docs`) | Needs a full re-sync pass — flagged, not yet done |
| Keep SKILL.md <500 lines | Move detailed reference to supporting files |
| Description quality matters for skill triggering | Action verbs, specific file types, clear use cases |
| Use `allowed-tools` for restrictions | Scope permissions per-skill |
| CLAUDE.md <150 lines | Domain knowledge → skills, not CLAUDE.md |

---

## Sources

- [Skills Documentation](https://code.claude.com/docs/en/skills.md)
- [Best Practices Guide](https://code.claude.com/docs/en/best-practices.md)
- [Sub-agents Documentation](https://code.claude.com/docs/en/sub-agents.md)

---

## Last Session (2026-07-15)

- **D30 added** (decisions/agent-architecture.md): user asked for "multi-level Haiku" delegation across all agents to cut token cost; separated the real problem (main-loop context bloat) from the stated one (model cost) before acting, and rejected a blanket cheap-model policy since most skills' work is judgment (staleness, subsystem-boundary reasoning, disambiguation) that degrades on a weaker model. Split three skills' flagged steps into mechanical-retrieval (delegated to `Explore`) vs judgment (stays inline): `read-summary` doc-discovery, `merge-task-docs` Step 1 + Step 3, `task-summary` multi-domain candidate-gathering. Extracted the repeated pattern to `skills/_shared/references/explore-delegation.md`.
- Product review caught the delegation's own "off the main loop's context" framing was false for main-loop-invoked skills (the Agent result still returns to the caller) — corrected in the shared reference before shipping, plus added missing `run_in_background: false` to all three example calls.
- Plugin version bumped 1.81.0→1.82.0; CHANGELOG entry added.

---

## Next Steps

- [ ] Monitor whether `<thinking>` blocks reduce domain inference errors in practice (D2)
- [ ] Re-sync Current Skills registry table (see Cross-Cutting Operational Notes)
- [ ] Audit existing task docs' `## Key Technical Decisions` sections against D16's new MADR-default — any plain-table row that had a real rejected alternative should convert (not yet swept)
- [ ] `decisions/doc-condensation.md` is at 249 lines (post-condensation) — watch for the 300-line MADR-split threshold on the next addition
- [ ] Confirm no other skill has the same "self-caught deviation" blind spot as `done` Step 5 pre-D24 — not yet audited beyond `done`/`ship`
