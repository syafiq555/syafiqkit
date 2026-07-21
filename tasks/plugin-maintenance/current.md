<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - decisions/agent-architecture.md (ROUTER) — how generated agents inherit conventions + invoke sibling skills; see its 3 sub-files
  - decisions/doc-condensation.md (ROUTER) — fighting duplication/bloat across docs, CLAUDE.md, skills; see its 3 sub-files
  - decisions/madr-structure.md — the MADR format itself: when to use it (now default, D16), pricing, how editing skills handle it
Last updated: 2026-07-21 — see Quick Start / Last Session
-->

# Plugin Maintenance

**Status**: Reference (ongoing) — index for a whole-doc MADR decision log split by theme into `decisions/*.md`. Current version: v1.119.2.

## Quick Start (read this first in next session)

**Where we are**: Plugin is a mature skill/command system (23 skills, 2 commands, 8 agent templates), v1.119.2. Latest change: `read-summary/SKILL.md` Read Order step 6 (SIBLING REPO) now tells you to follow the sibling's `> 📖` companion pointers too — step 5 had a Companion bullet for the current repo all along, step 6 was its sibling-repo twin and lacked it, so a two-repo session queried prod believing it was staging with no error surfaced. Same change added the discovery gotcha: `grep -rl` reaches neither `.claude/` nor gitignored files, so settle a companion's existence with `ls <path>`, never grep. Since 1.117.1: `code-simplifier.template.md` gained a stateful-logic-extraction callout (1.119.1); `condense-task-doc`/`task-summary` fixed to condense the doc SET not just the named file, plus set-wide (not per-file) duplication scanning (1.119.0); `read-summary`'s investigation exit gate now also covers scope escalation, not just wrong-question substitution, and the git-state deletion rule got an MADR `Status: committed` carve-out (1.118.0).

**Immediate next actions (in order)**:
1. Periodically re-run `gh issue list --state open` on `syafiq555/syafiqkit` — consumer-filed issues are the highest-signal bug source and don't surface any other way. Issue #7 actioned this session; re-check for new ones next pass.
2. This repo's own agents have a backfill gap reproducing issue #7 — see Next Steps.

**Gotchas that will trip you**:
- Agents don't inherit CLAUDE.md — see D1 (decisions/agent-architecture/injection-and-delegation.md)
- Orchestrator skills must delegate to sibling skills, never inline their procedure — see D4 (decisions/agent-architecture/injection-and-delegation.md)
- A MADR block needs its own condensation rule shipped in the same change that introduces it — see D13 (decisions/madr-structure.md)
- MADR is now the DEFAULT `Key Technical Decisions` structure for every task doc — not gated behind decision count or an explicit ask; escape hatch only when Rejected would be empty — see D16 (decisions/madr-structure.md)
- A Step-N "verify" checklist is not satisfied by having read the files earlier in-session — each item needs its own command run against current content — see D21 (decisions/agent-architecture/verification-rigor.md)
- Skill-file bloat (SKILL.md density) is a distinct class from CLAUDE.md/task-doc bloat; `update-plugin` Step 3a owns the checklist, executed via the shared draft/verify model (`_shared/references/two-tier-condense.md`, now agent-free — see 2026-07-20 in Last Session), also adopted by `condense-task-doc`/`condense-claude-md` — see D23 (decisions/doc-condensation/structural-splits.md)
- A self-caught deviation from a skill's own instructions is a reportable signal, not a silent win — see D24 (decisions/agent-architecture/verification-rigor.md)
- Delegating a skill's heavy step to a cheaper agent only works when the mechanical (retrieval) half is split from the judgment half first — the judgment half stays on the calling session's own model — see D30 (decisions/agent-architecture/concurrency-and-delegation.md)
- `/ship` Step 3 no longer assumes the current branch IS the deploy branch — establish it from CLAUDE.md/CLAUDE.local.md first, recognize forward-merge chains as merges not pushes
- A scan's "zero results = done" exit condition needs a must-hit control, not just a correct command — a fixed `rg -rn`→`grep -rn` command with no control still silently passes on an unrelated empty result — see D25 (decisions/agent-architecture/verification-rigor.md)
- Pre-existing plan/spec docs sitting next to a split `current.md`/`decisions/` set are a different document type, never move them into `decisions/` — but their routing table must still enumerate them, or they go invisible — see D27 (decisions/doc-condensation/structural-splits.md)
- A large doc rewrite's "no rows deleted" check only covers the change's intended content — it misses collateral cuts to unrelated sections; `merge-task-docs`/`condense-task-doc` now require a full before/after section diff, not just a targeted row check — see D27 (decisions/doc-condensation/structural-splits.md)
- `merge-task-docs` Step 2 defaults to executing the recommended scope/structure/naming inline, asking only on genuine ambiguity — no longer requires the caller to say "don't ask" every invocation — see D28 (decisions/agent-architecture/verification-rigor.md)
- Every generated agent template now carries `Skill` in `tools:` — `claude-md-pruner` was the last one missing it and independently duplicated `condense-claude-md`'s seam-test logic inline instead of delegating — see D29 (decisions/agent-architecture/injection-and-delegation.md)
- Editing a generated `.claude/agents/*.md` requires porting the same edit into its source `skills/agent-setup/templates/*.template.md` in the same change, or the next `/agent-setup` regen reintroduces the old behavior — now a root CLAUDE.md `⚠️ MANDATORY` callout, 3rd recurrence — see D31 (decisions/agent-architecture/concurrency-and-delegation.md)
- A diff adding a `<content>`-leak guard is not proof the leak is gone — grep the diff's own touched files AND sweep the whole repo for the literal tag, every `/done` review pass — see D40 (decisions/doc-condensation/duplication-and-integrity.md)
- `plugin.json`/`marketplace.json` version drift recurs (2nd occurrence, 2026-07-15 D26 → 2026-07-17): a version bump to one file without the other passes silently, no gate catches it except a manual diff read during `/done`'s docs-only integrity check
- Widening a threshold table (agent-count tiers, byte budgets) needs every downstream decision point checked, not just the table itself — a stale carve-out referencing the old bounds can survive in 3-4 other places — see D39 (decisions/agent-architecture/verification-rigor.md)
- A step covering "the sibling repo's main file" is not the same rule as "the sibling repo's companion pointers" — a bullet added for the current repo (step 5) doesn't retroactively cover its sibling-repo twin (step 6) until stated there too, even though both read the same source file
- `grep -rl` existence checks silently return 0 for `.claude/` and gitignored files even when the target exists — settle existence with `ls <path>`, and a control that merely hits (e.g. `README.md`) proves recursion works, not that the target is in scope
- Condensation/duplication-scan units are the doc SET (`current.md` + `decisions/*.md`), never the single named file — a set member holding 2× the index's bytes goes untouched if the pass scopes to args only

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

23 skills + 2 commands (`read-notes`, `update-notes`). Re-synced 2026-07-17 from `ls skills/`.

| Skill | Purpose | Invoked By |
|-------|---------|------------|
| `agent-setup` | Create/update the 8 project agents (Bootstrap pattern) from `templates/` | `update-claude-docs`, or user directly |
| `brainstorming` | Design exploration before creative/architectural work | User, or proactive |
| `ci-ssh-deploy-timeout` | Diagnose flaky CI deploys that can't SSH the target; convert to connect-retry | User, or proactive |
| `commit` | Create git commits from staged changes; single-repo and multi-repo, changelog gate, task-doc staleness gate | User directly |
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
| `tackle` | Vague multi-item doc continuation → `read-summary`, judge buildable vs blocked, build, `done`. No prescribed procedure — trusts Claude's judgment. Specific asks defer to `read-summary` directly | User directly, only for genuinely vague "let's continue" on a doc |
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

Full ADR content lives in `decisions/*.md` (or one level deeper, `decisions/<theme>/*.md`, where a theme itself split). Find your question below, open only that file — **`agent-architecture.md` and `doc-condensation.md` are now ROUTERS** (split 2026-07-20, each was over the 300-line threshold): open them for the sub-file table, not for ADR content directly.

### `decisions/agent-architecture.md` (router) — *how do generated project agents inherit conventions, delegate to skills, invoke them, and how does the plugin delegate to cheaper/parallel agents?*

| # | Decision | Sub-file |
|---|----------|----------|
| D1 | Project-specific agents via prompt injection | `agent-architecture/injection-and-delegation.md` |
| D4 | Orchestrator skills delegate, never inline a sibling's procedure | `agent-architecture/injection-and-delegation.md` |
| D14 | Generated agents invoke `/read-summary`, don't reimplement it | `agent-architecture/injection-and-delegation.md` |
| D29 | `claude-md-pruner` delegates restructuring to `condense-claude-md` instead of reimplementing the seam-test — the last template missing `Skill` per D14 | `agent-architecture/injection-and-delegation.md` |
| D15 | Correct wiring ≠ the model reliably calling a sibling skill | `agent-architecture/injection-and-delegation.md` |
| D21 | A Step-N verify checklist needs a command per item — a prior skim isn't a check | `agent-architecture/verification-rigor.md` |
| D24 | A self-caught deviation from a skill's own instructions is a reportable signal, not a silent win | `agent-architecture/verification-rigor.md` |
| D25 | A scan's "zero results = done" exit condition needs a must-hit control, not just a correct command | `agent-architecture/verification-rigor.md` |
| D28 | A confirmation gate that defaults ON forces the caller to pre-empt it every invocation — `merge-task-docs` now defaults to executing the recommendation, asks only on genuine ambiguity | `agent-architecture/verification-rigor.md` |
| D38 | `agent-setup`'s drift check only covered modification (existing agent vs. template), never addition (template with no generated agent) — added a distinct Missing-agent check (`comm -23`) and sharpened the model-override exemption to require an in-file justification | `agent-architecture/verification-rigor.md` |
| D39 | `/done`'s file-count tiers raised ≤15/16–40/41+ → ≤30/31–80/81+ (agent counts unchanged); light mode removed entirely rather than rescaled — every diff now routes through docs-only/infra-only/full mode only | `agent-architecture/verification-rigor.md` |
| D30 | Splitting a skill step's mechanical retrieval from its judgment half before delegating to a cheaper agent (`Explore`) — the judgment half never leaves the calling session's own model | `agent-architecture/concurrency-and-delegation.md` |
| D31 | Explore agent gains the `Agent` tool for self-nested multi-doc sweeps (depth-5 cap); generated-agent/template parity is now a `⚠️ MANDATORY` root CLAUDE.md callout after its 3rd recurrence | `agent-architecture/concurrency-and-delegation.md` |
| D32 | Parallelism is the single-message block, not `run_in_background: false` — that flag is a hint, not a contract | `agent-architecture/concurrency-and-delegation.md` |
| D34 | ⚠️ transcript-scan half SUPERSEDED by D36 (removed). Still live: an agent's sub-spawn grant must name its allowed type in the runtime-visible body, not a `tools:` comment (fixes `browser-verifier` self-nesting) | `agent-architecture/concurrency-and-delegation.md` |
| D35 | ⚠️ SUPERSEDED by D36 — transcript scan Mode B removed (never had its own ADR block) | `agent-architecture/concurrency-and-delegation.md` |
| D36 | Transcript-scan `Explore` agent REMOVED from `/done` (reverses D34/D35). It cost an agent slot + ~47k tokens per run yet, in the session that removed it, returned a full record while the doc-update still failed — the failure was a false "done" report (reported invoked = done), not the recency miss the scan defends against. The real fix went into the exit gate instead: Task-docs/Knowledge rows now require confirming the artifact CHANGED, not just that the skill was invoked. `_shared/references/transcript-scan.md` deleted. | `agent-architecture/concurrency-and-delegation.md` |

### `decisions/doc-condensation.md` (router) — *how do we fight duplication/bloat across task docs, CLAUDE.md, and skills?*

| # | Decision | Sub-file |
|---|----------|----------|
| D3 | Fix doc bloat at the generator, not by hand-trimming | `doc-condensation/bloat-generator-fixes.md` |
| D6 | A CLAUDE.md line is dead weight once a skill enforces it at action-time | `doc-condensation/bloat-generator-fixes.md` |
| D17 | `.claude/rules/*.md` path-scoping frontmatter doesn't actually scope — removed as a routing recommendation | `doc-condensation/bloat-generator-fixes.md` |
| D18 | `/read-summary` discovery in `Explore`/`Plan` made unconditional — reverses D17's "gate is correct design" call per user's explicit precision-over-efficiency preference | `doc-condensation/bloat-generator-fixes.md` |
| D19 | Task-doc index + pointer added as a second structural lever for over-budget CLAUDE.md files (when the subdirectory seam-test fails but the block is feature-specific) | `doc-condensation/bloat-generator-fixes.md` |
| D20 | Seam-test must check EVERY real sibling subdirectory (grep-count based), not just the intuitively-obvious one — corrects D19's own stale "Multi-Agency has no seam" conclusion | `doc-condensation/bloat-generator-fixes.md` |
| D22 | `condense-claude-md`'s diff-based verification needs a false-positive filter, and completion needs a byte threshold alongside the line threshold | `doc-condensation/structural-splits.md` |
| D23 | Skill-file density is a distinct bloat class from CLAUDE.md/task-doc bloat (no condense-* delegate exists) — fixed by hand across 7+ skills, captured as a permanent `update-plugin` checklist | `doc-condensation/structural-splits.md` |
| D26 | Companion-file split (Restructuring #7) widened from global-CLAUDE.md-only to any file whose oversized section is genuinely cross-cutting — no subdirectory AND no feature owner | `doc-condensation/structural-splits.md` |
| D27 | Pre-existing plan/spec docs are a distinct type from `decisions/<theme>.md` (verified against external ADR/Diátaxis convention) — split-doc guidance gained a parent-directory routing audit + an anti-silent-drop verification check | `doc-condensation/structural-splits.md` |
| D33 | `<thinking>` recommendation retired (supersedes D2's CoT half) — zero adopters across 18 skills; reasoning scaffolds belong to the output-style layer, not skill files | `doc-condensation/structural-splits.md` |
| D37 | `task-summary`'s cross-section-duplication litmus test now names the commit/deploy status word explicitly, not left as an implicit "critical phrase" judgment call | `doc-condensation/duplication-and-integrity.md` |
| D40 | A session adding a `<content>`-leak guard must grep its own diff for that exact leak, then sweep the whole repo — the guard doesn't retroactively fix leaks already sitting in files, including ones the same diff touches. **Renamed from D32** 2026-07-20 (collided with agent-architecture's D32, parallelism) | `doc-condensation/duplication-and-integrity.md` |
| D12 | Full duplication survey fixed two cases, explicitly left the rest | `doc-condensation/duplication-and-integrity.md` |
| D2, D5, D7, D11 | Demoted (settled, uncontested 3+ sessions) — see the sub-file's Demoted Decisions table | `doc-condensation/duplication-and-integrity.md` |

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

## Last Session (2026-07-21)

- **v1.119.2 — `read-summary/SKILL.md` step 6 (SIBLING REPO) gained a companion-pointer follow rule + an `ls`-not-`grep` existence-check gotcha.** A two-repo session stopped at the sibling's main CLAUDE.md, missed its `> 📖` companion holding the actual staging DB/container facts, and queried prod believing it was staging — no error surfaced. Step 5 already had this rule for the current repo; step 6 lacked the sibling-repo twin. The companion was also nearly declared "doesn't exist" because `grep -rl` returns 0 hits for `.claude/`/gitignored files even when the target is present — `claude-md-pruner` caught it; rule is now `ls <path>` to settle existence.
- **`plugin-maintenance/current.md` reconciled from 1.117.1 → 1.119.2** — Quick Start, version header, and Gotchas were 4 releases stale (missed 1.118.0's read-summary exit-gate widening + MADR `committed` carve-out, 1.119.0's doc-SET condensation fix, 1.119.1's stateful-logic simplifier callout). Caught during `/done`'s docs-only mode on an already-committed patch — see CHANGELOG for full entries.

---

## Next Steps

- [ ] D16 MADR-default audit — **not actionable in this repo** (swept 2026-07-16: `tasks/` holds only `plugin-maintenance`, already split MADR; zero literal `## Key Technical Decisions` sections exist here). The plain-table rows D16 targets live in the *consuming* projects' task docs — run this sweep from a project repo, not from the plugin
- [ ] `plugin.json`/`marketplace.json` version drift has now recurred twice (D26 2026-07-15, again 2026-07-17) with no automated gate — consider a pre-commit check or a single-source-of-truth version file if it recurs a 3rd time
- [ ] Confirm no other skill has the same "self-caught deviation" blind spot as `done` Step 5 pre-D24 — not yet audited beyond `done`/`ship`
- [ ] `update-plugin` Step 5's consumer report is copy-pasteable but **unfenced**, and the skill tells you to point at the issues URL *after* it — same boundary class as `ship` 5.8 / `gchat-format`, but needs a fence before a boundary rule can apply. Not patched (different shape; a thin patch is worse than none). `agent-setup`/`md-to-pdf`/`commit-invoice-generator` checked — do not apply
- [ ] This repo's own `.claude/agents/` is missing `task-builder.md` and `browser-verifier.md` (templates exist, never generated) — run `/agent-setup` to backfill; would also exercise the new Missing-agent check (D38) end-to-end
