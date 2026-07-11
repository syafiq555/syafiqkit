<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - decisions/agent-architecture.md — how generated agents inherit conventions + invoke sibling skills
  - decisions/doc-condensation.md — fighting duplication/bloat across docs, CLAUDE.md, skills
  - decisions/madr-structure.md — the MADR format itself: when to use it (now default, D16), pricing, how editing skills handle it
Last updated: 2026-07-12
-->

# Plugin Maintenance

**Status**: Reference (ongoing) — index for a whole-doc MADR decision log split by theme into `decisions/*.md`.

## Quick Start (read this first in next session)

**Where we are**: Plugin is a mature skill/command system (18 skills, 6 commands) with an established design philosophy (autonomous, self-contained, delegate-don't-duplicate). Active maintenance is condensation/de-duplication passes, not new capability.

**Immediate next actions (in order)**:
1. Commit this session's MADR-default change (all staged, see `git status`) — plugin.json bumped to 1.59.0, CHANGELOG entry written
2. Re-sync the Current Skills registry table (stale since before `task-summary` etc. existed — see Cross-Cutting Operational Notes)

**Gotchas that will trip you**:
- Agents don't inherit CLAUDE.md — see D1 (decisions/agent-architecture.md)
- Orchestrator skills must delegate to sibling skills, never inline their procedure — see D4 (decisions/agent-architecture.md)
- A MADR block needs its own condensation rule shipped in the same change that introduces it — see D13 (decisions/madr-structure.md)
- MADR is now the DEFAULT `Key Technical Decisions` structure for every task doc — not gated behind decision count or an explicit ask; escape hatch only when Rejected would be empty — see D16 (decisions/madr-structure.md)
- A Step-N "verify" checklist is not satisfied by having read the files earlier in-session — each item needs its own command run against current content — see D21 (decisions/agent-architecture.md)

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
| `update-plugin` | Scan session → patch SKILL.md files with learned rules/triggers/gotchas | User directly after skill work |
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

## Last Session (2026-07-12, later)

- **D21 added** (decisions/agent-architecture.md): a live `/agent-setup` run on Dourr (6 existing agents) skimmed all six files, judged them "well-established," and reported Step 5's checklist satisfied. User pushed back ("check properly"); a literal grep on the same files found 2 failing items (`Skill`/`read-summary` wiring per D14, `disallowedTools` per the naming-exception note) the skim missed. Patched `agent-setup/SKILL.md` Step 5 with an explicit "each item is a command to run, not a memory to consult" preface, and Step 1's "Agents exist" row to require the full checklist even when agents look established.
- Live fix applied directly to Dourr's `.claude/agents/*.md` in the same session: added `Skill` to tools + `/read-summary` wiring to `Explore`, `Plan`, `code-reviewer`, `code-simplifier`, `product-reviewer`; added `disallowedTools: [Write, Edit]` to `Explore`/`Plan`.

## Last Session (2026-07-12)

- **D17 added** (decisions/doc-condensation.md): `.claude/rules/*.md` `paths:`/`globs:` frontmatter does NOT scope context loading — confirmed via negative-control canary test (a fresh session on a non-matching path still had the "scoped" content verbatim in context). Only a real subdirectory `CLAUDE.md` genuinely scopes (loads only when Claude reads a file in that subdirectory — also negative-control verified).
- **D18 added** (decisions/doc-condensation.md): a follow-up live test (`Explore` agent, feature-named prompt) showed `📖 See <file>` pointers DO work when the request names the feature — but a generic symptom-only prompt slips past the gate. Asked to choose, user picked precision over efficiency ("burn tokens over missing a gotcha") — `/read-summary` discovery in `Explore`/`Plan` is now UNCONDITIONAL (every call, including trivial single-symbol lookups), reversing D17's earlier conclusion that the gate was correct design.
- Trigger: user asked (in the `autorentic` project) how to shrink a bloated `app/CLAUDE.md` with real token savings, not just fewer lines. Investigation ruled out `.claude/rules/` (broken), confirmed subdirectory `CLAUDE.md` and index+pointer (`📖 See <file>`) as the two real mechanisms; a live re-test with a planted canary in a real task doc (`tasks/agency/multi-admin/current.md`) confirmed the pointer mechanism works end-to-end when the discovery gate fires — and incidentally surfaced a genuine unfixed bug (Spatie permission cache never invalidated on role change).
- Patched `update-claude-docs/references/structure.md`, `condense-claude-md/SKILL.md` (D17), and `agent-setup/SKILL.md` + `Explore.template.md` + `Plan.template.md` + live `autorentic/.claude/agents/Explore.md`/`Plan.md` (D18) — Bootstrap sections now open with a `⚠️ MANDATORY, no exceptions` line, no feature-name gate.
- Global `~/.claude/CLAUDE.md` gained two Platform Gotchas rows (frontmatter-doesn't-scope; pointer-reliability-depends-on-discovery-gate-firing) and one hardened CLAUDE.md-Maintenance row (splitting a layer file needs the seam-test AND a real subdirectory target).
- **D19 added**: with D18 making `/read-summary` unconditional, `update-claude-docs/references/structure.md` §6 gained a SECOND structural lever for over-budget CLAUDE.md files (task-doc index + `📖` pointer, for feature-specific blocks that fail the subdirectory seam-test) — `SKILL.md` Create/Rewrite modes and `condense-claude-md`'s seam-test-fails warning updated to reference it. Checked against the session's original trigger (`app/CLAUDE.md` bloat): concluded it doesn't apply there since Multi-Agency/Cast Gotchas are cross-cutting layer conventions — **this conclusion turned out wrong for Multi-Agency, corrected by D20**.
- **D20 added**: pushed further on `app/CLAUDE.md` bloat (user: "24kb can say quite a lot... imagine I can save so much with much more efficient one") — re-ran the seam-test against EVERY real `app/` subdirectory instead of just `Domain/*`, found Multi-Agency Gotchas concentrates 5-10x in `app/Http/` (Controllers/Requests/Middleware/Resources). Created `app/Http/CLAUDE.md` (new, 86 lines), moved Multi-Agency + Controller/Resource Patterns there. `app/CLAUDE.md`: 295→241 lines (24.5KB→19.5KB, -20.5%), verified live with negative/positive control (Domain-only session doesn't load it; touching `app/Http/` does). Cast Gotchas + Media/PDF re-checked the same way — genuinely no dominant seam, correctly stay inline. Seam-test methodology itself patched in `references/structure.md` §1 + both SKILL.md files: check grep counts against every candidate, not the intuitively-obvious one.

---

## Next Steps

- [ ] Monitor whether `<thinking>` blocks reduce domain inference errors in practice (D2)
- [ ] Re-sync Current Skills registry table (see Cross-Cutting Operational Notes)
- [ ] Audit existing task docs' `## Key Technical Decisions` sections against D16's new MADR-default — any plain-table row that had a real rejected alternative should convert (not yet swept)
