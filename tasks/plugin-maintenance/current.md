<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - decisions/agent-architecture.md — how generated agents inherit conventions + invoke sibling skills
  - decisions/doc-condensation.md — fighting duplication/bloat across docs, CLAUDE.md, skills
  - decisions/madr-structure.md — the MADR format itself: when to use it (now default, D16), pricing, how editing skills handle it
Last updated: 2026-07-16 — see Quick Start / Last Session
-->

# Plugin Maintenance

**Status**: Reference (ongoing) — index for a whole-doc MADR decision log split by theme into `decisions/*.md`.

## Quick Start (read this first in next session)

**Where we are**: Plugin is a mature skill/command system (22 skills, 3 commands, 8 agent templates) with an established design philosophy (autonomous, self-contained, delegate-don't-duplicate). Mostly condensation/de-duplication passes; `tackle` (1.97.0) is the first new capability in a while.

**Immediate next actions (in order)**:
1. **Test `/tackle` against a doc with mixed blocker types** — never dry-run. Its triage must split human/env-blocked items without asking; a doc where everything is buildable proves nothing (a primitive validated against one shape is validated against one shape, not its contract). Also exercise the greenfield path (Step 1b) with both a clear and a vague request.
2. `decisions/doc-condensation.md` is at 289 lines — the next decision added crosses the 300-line split threshold.

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
- Editing a generated `.claude/agents/*.md` requires porting the same edit into its source `skills/agent-setup/templates/*.template.md` in the same change, or the next `/agent-setup` regen reintroduces the old behavior — now a root CLAUDE.md `⚠️ MANDATORY` callout, 3rd recurrence — see D31 (decisions/agent-architecture.md)
- A diff adding a `<content>`-leak guard is not proof the leak is gone — grep the diff's own touched files AND sweep the whole repo for the literal tag, every `/done` review pass — see D32 (decisions/doc-condensation.md)

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

22 skills + 3 commands (`commit`, `read-notes`, `update-notes`). Re-synced 2026-07-16 from `ls skills/`.

| Skill | Purpose | Invoked By |
|-------|---------|------------|
| `agent-setup` | Create/update the 8 project agents (Bootstrap pattern) from `templates/` | `update-claude-docs`, or user directly |
| `brainstorming` | Design exploration before creative/architectural work | User, or proactive |
| `ci-ssh-deploy-timeout` | Diagnose flaky CI deploys that can't SSH the target; convert to connect-retry | User, or proactive |
| `commit-invoice-generator` | Generate invoice line items from git commits | User directly |
| `condense-claude-md` | Aggressively condense a bloated CLAUDE.md | User, or `update-claude-docs` Condense mode |
| `condense-task-doc` | Condense a bloated task doc; SPLITS whole-doc MADR >300 lines into index + `decisions/*.md` | User, or `task-summary` when a doc is >300 lines |
| `done` | Post-task cleanup orchestrator. Step 5 owns the D24 deviation gate for EVERY skill | User directly |
| `function-parameter-limits` | Advise/enforce the 0/2/3+ param rule; lint setup with DI carve-outs | User, or proactive |
| `gchat-format` | Convert Markdown → Google Chat syntax; owns the bounded-fence rule | User, or `ship` Step 5 |
| `hobby-review` | Socratic hobby debrief against the taste rubric in a `current.md` | User, or proactive |
| `md-to-pdf` | Markdown → PDF with rendered Mermaid | User directly |
| `merge-task-docs` | Merge docs by subsystem boundary; delete sources; reconcile back-refs. Defaults to executing its recommendation (D28) | User, or proactive |
| `notes-summary` | Personal session journal outside the repo (non-code conversations) | User directly |
| `pull-db` | Remote MySQL/MariaDB → local dev (dump, scp, import, password reset) | User, or proactive |
| `read-summary` | Discover + read task docs before investigating/implementing; Plan-Mode-aware | User, or model-invoked before context-dependent work |
| `ship` | Commit → changelog → push → CI verify → release note. Fence bounded (Step 5.8) | User directly |
| `tackle` | Take work to done from a doc **or** a new idea: context (or brainstorm+write) → **triage by blocker type** → explore → build → wrap. Replaces the enumerate-and-let-user-sweep step | User directly (task-doc path + vague "let's continue", or a new feature request) |
| `task-summary` | Create/update `current.md` — path resolution, templates, cross-refs | `done` Step 4, `write-summary`, `update-summary` |
| `update-claude-docs` | Create/rewrite/condense/capture-into CLAUDE.md (4 modes) | `done` Step 3, or user directly |
| `update-plugin` | Scan session → patch SKILL.md files; owns the Step 3a density checklist | User directly after skill work |
| `update-summary` | Thin pointer → `task-summary` (update mode) | User directly |
| `write-summary` | Thin pointer → `task-summary` (create mode) | User directly |

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
| D31 | Explore agent gains the `Agent` tool for self-nested multi-doc sweeps (depth-5 cap); generated-agent/template parity is now a `⚠️ MANDATORY` root CLAUDE.md callout after its 3rd recurrence |

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
| D32 | A session adding a `<content>`-leak guard must grep its own diff for that exact leak, then sweep the whole repo — the guard doesn't retroactively fix leaks already sitting in files, including ones the same diff touches |
| D33 | `<thinking>` recommendation retired (supersedes D2's CoT half) — zero adopters across 18 skills; reasoning scaffolds belong to the output-style layer, not skill files |

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
| Registry drift: the skill list is hand-maintained in **three** places (this doc, `CLAUDE.md`, `README.md`) and each rots independently — this doc sat at 7-of-18 naming a deleted `consolidate-docs`; `CLAUDE.md` was separately missing 3 skills that were in `README.md` all along | ✅ All three synced 2026-07-16 (22 skills). Never eyeball them — `comm -13` each table against `ls skills/` (recipe in `CLAUDE.md#maintenance`). An add-time rule can't catch rot that already happened, so diff against disk |
| An `Explore` agent returns a confident VERDICT it inferred rather than read (claimed `ship` has "no sequential workflow"; it has 25 numbered steps) | Its raw hits stay trustworthy — strip the verdict, keep the finding, confirm in code. Both `Explore.md` + its template now carry a `No verdicts — quote, don't characterize` Constraints row |
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

## Last Session (2026-07-16)

- **1.97.0 — `tackle` (new)**: the session's main build. User described automating an arc they run by hand (task-doc path + "lets continue" → read → ask → build → `/done`), but two screenshots showed the ask step producing a menu they swept ("all of them"), with the real work being the feasibility split that followed. Built it to **triage instead of enumerate** — classify by blocker type, recommend a sequence, ask only on a genuine tie. Automating the arc faithfully would have automated the step that violates the user's own rules. Then the user asked what happens with no doc yet (a real gap — triage reads *from* a doc): added the greenfield branch (`brainstorming` only if genuinely unclear → `task-summary` Create → rejoin triage) and renamed `continue-task` → `tackle`, since "continue" is false for new work.
- **`task-builder` agent (8th)**: the only agent writing new feature code, and — at the user's explicit direction, against an initial recommendation to keep an allowlist — the only one with **no `tools:` line** (full set incl. `Agent`). The file partition is now guarded by its body's Scope Rules alone. Also per the user: "i want all of our agents can spawn agent" — audited, already true for all 13 (only `browser-verifier` was ever a question).
- **D33 — `<thinking>` retired**: zero adopters across 18 skills; the monitoring item never fired. The user's `<thinking>` blocks came from their **output style**, not this plugin — the plugin only documented the pattern. Layer boundary now explicit: skills own procedure, the style layer owns reasoning display.
- **Drift, both directions**: an `Agent`-tool comment claiming its host was `Explore` sat in 11 files (6 agents + 5 templates) — noticed as a one-file typo, found by grepping past it (D32). The MANDATORY agent-file callout in `CLAUDE.md` now covers parity **and** blast-radius. Registry rot found in a third place (`CLAUDE.md`'s own table, missing 3 skills) — see Cross-Cutting rows.
- **Stale claims corrected**: `gchat-format`'s fence gap was recorded "Open" in two sections; `c3b132b` had closed it. Audits closed as no-ops, not work: D24 is already covered centrally by `done` Step 5 (runs after every implementation); D16 has nothing to audit here (only task doc is already split MADR).

---

## Next Steps

- [ ] D16 MADR-default audit — **not actionable in this repo** (swept 2026-07-16: `tasks/` holds only `plugin-maintenance`, already split MADR; zero literal `## Key Technical Decisions` sections exist here). The plain-table rows D16 targets live in the *consuming* projects' task docs — run this sweep from a project repo, not from the plugin
- [ ] ⚠️ `decisions/doc-condensation.md` is at **289 lines / 31,070 bytes** (D33 added 20) — the next decision added to this theme crosses the 300-line MADR-split threshold. Split it (index + sub-files) rather than condensing; the ADRs' Rejected fields are the content that must survive
- [ ] Confirm no other skill has the same "self-caught deviation" blind spot as `done` Step 5 pre-D24 — not yet audited beyond `done`/`ship`
- [ ] `update-plugin` Step 5's consumer report is copy-pasteable but **unfenced**, and the skill tells you to point at the issues URL *after* it — same boundary class as `ship` 5.8 / `gchat-format`, but needs a fence before a boundary rule can apply. Not patched (different shape; a thin patch is worse than none). `agent-setup`/`md-to-pdf`/`commit-invoice-generator` checked — do not apply
