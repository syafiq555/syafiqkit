---
name: agent-setup
description: This skill should be used when the user asks to "setup project agents", "create code reviewer", "update agent prompts", or when starting a new project. Creates project-specific agents with Bootstrap pattern.
---

# Project Agent Setup

Create or update project-specific agents that discover project conventions at runtime by reading CLAUDE.md files.

## Core Concept

Agents have a **Bootstrap section** that tells them to read relevant CLAUDE.md files before starting work. Only the highest-frequency mistakes are kept inline for zero-latency access. This avoids duplicating CLAUDE.md content into agent files.

**Architecture**:
```
CLAUDE.md files (source of truth) ──Read──> Agent at runtime
Agent file = behavior instructions + Bootstrap directive + top-15 critical rules
```

## When to Use

- When setting up a new project for the first time
- When project conventions change significantly (agent behavior needs updating)
- Directly via `/agent-setup`

> **Note**: Adding gotchas to CLAUDE.md does NOT require updating agents. Agents read CLAUDE.md dynamically. Only update agents when their behavioral instructions or inline critical rules need changing.

## Agents

Seven agents, each with a distinct responsibility:

| Agent | Purpose | Model | Key tools |
|-------|---------|-------|-----------|
| `Explore` | Fast read-only search — locate files/symbols/callers. Project-aware version of the built-in `Explore` agent. | `haiku` | Read-only + LSP |
| `Plan` | Design an implementation approach — critical files, trade-offs, blast radius. Project-aware version of the built-in `Plan` agent. | `sonnet` | Read-only + LSP |
| `code-reviewer` | Bugs, security, convention violations. Session-aware — reads task docs, gathers changes holistically. | `sonnet` | Read-only + LSP + diagnostics |
| `code-simplifier` | DRY, clarity, consistency, dead code. Edits files directly. Applies Rule of Three. | `opus` | Read + Edit + Write + LSP |
| `product-reviewer` | Product/PM lens — missing user journeys, dead-end flows, UX/business-value gaps the engineer forgot to build. Reads the task doc (intent) + built code; recommends, never edits. | `sonnet` | Read-only + LSP |
| `browser-verifier` | Drives the running app in a real browser — clicks the real flow, asserts the DB actually changed, catches layout/console breakage a diff cannot show. Owns the mobile-viewport recipe. Reports; never edits. | `sonnet` | Read-only + Chrome MCP |
| `claude-md-pruner` | Prunes CLAUDE.md files for staleness/bloat. Conservative — preserves reference tables and cross-reference mappings. | `sonnet` | Read + Edit + Grep + Glob |

> **Why 7**: Two lenses look **before** code exists (`Explore` finds what's there, `Plan` designs the approach — both reading project CLAUDE.md/task docs), four look **after**: `code-reviewer` (correct?) and `code-simplifier` (clean?) look down at the diff; `product-reviewer` looks up at user/business value, catching what a line-level diff can't (a CRUD with no "create" button); `browser-verifier` is the only lens reading the running system, catching what static review can't (a control that renders but can't be tapped at 390px). Both `product-reviewer` and `browser-verifier` are read-only — they report evidence, a fix is the user's call. `claude-md-pruner` is kept separate to avoid over-aggressive deletion bleeding into review.

> **Naming exception**: `Explore`/`Plan` intentionally reuse the built-in agent type names (capitalized, no hyphen), not `lowercase-hyphenated` — since `name:` frontmatter becomes `subagent_type`, this makes them **shadow the built-ins** project-wide, including Plan Mode's own phases. The shadow is **partial**: the built-in's `Write`/`Edit` grant leaks through even when `tools:` omits them, so set `disallowedTools: [Write, Edit]` explicitly (Step 4) — see the full breakdown at Step 4's `Explore`/`Plan` row.

```
Project/
├── CLAUDE.md
├── subproject/CLAUDE.md
└── .claude/
    └── agents/
        ├── Explore.md
        ├── Plan.md
        ├── code-reviewer.md
        ├── code-simplifier.md
        ├── product-reviewer.md
        ├── browser-verifier.md
        └── claude-md-pruner.md
```

## Setup Process

### Step 1: Check Project Structure

```
Glob: .claude/agents/*.md
Glob: **/CLAUDE.md
```

| Found? | Action |
|--------|--------|
| No agents | Create `.claude/agents/` directory + agents |
| Agents exist | Still run Step 5 in full against every existing agent file — "they look established" is not a substitute for the checklist. Update whatever it flags |
| No CLAUDE.md | Create agents with base template only |

### Step 2: Identify CLAUDE.md Hierarchy

Map the project's CLAUDE.md files to determine what the Bootstrap section should reference:

| Pattern | Bootstrap entries |
|---------|-------------------|
| Single `CLAUDE.md` | Just root file |
| Root + sub-projects | Root + conditional reads per sub-project |
| Root + layer files (`app/`, `resources/js/`) | Root + conditional reads per layer |
| **Sibling repo driven from same session** | Add a `⚠️ Two-repo session` note + a SECOND Bootstrap table for the sibling's CLAUDE.md files, and have the agent `git diff` BOTH repos (see below) |

**Multi-repo (sibling) sessions**: When the user drives two repos from one working dir (e.g. an integration where both sides are edited together), the *sibling* repo's own agents do NOT fire — only the active repo's agent runs. So the active agent must cover both:
- Add a `⚠️ Two-repo session` banner stating the sibling's agent is not used here — refer to the active repo as "this repo" (no path needed, agents already run with cwd inside it)
- Process step 1 (gather changes) runs `git status --short` in EACH repo (NOT `git diff --name-only` — it hides staged + untracked files and returns empty once work is staged); bootstrap each only if it has changes
- Add a second Bootstrap table for the sibling repo (note any layout quirks, e.g. Laravel root in `backend/`)
- Tag sibling-only inline rules so they're applied only to that repo's files (e.g. a separate "Sibling" rules table)

⚠️ **Never hardcode the sibling repo's absolute path — resolve it at runtime.** `.claude/agents/*.md` is normally committed and shared across machines/OSes, so a literal path baked in during setup collides for anyone else. Have each agent's banner check `../<sibling-name>` relative to this repo's parent first; if absent, glob likely siblings or ask the user; reference the result via a placeholder variable (e.g. `$SIBLING`), never a literal path.

### Step 3: Extract Critical-Only Rules

Read CLAUDE.md files and extract only the **top ~15 rules that cause the most frequent mistakes**:

| What to extract | Why inline |
|-----------------|-----------|
| Broken models / dead columns | Causes immediate crashes |
| Wrong column names in eager loads | Silent bugs, hard to debug |
| Framework version API changes | Common copy-paste mistakes |
| Theme token violations | Every frontend change risks this |
| Dual-write / data integrity rules | Data corruption if missed |
| Polymorphic relationship gotchas | Wrong morph type = silent data bugs |
| Base class requirements | Wrong parent class = missing behavior |

**Do NOT inline**: Environment setup, dev commands, one-time gotchas, tool usage preferences, schema details.

(Test: does getting it wrong crash/corrupt repeatedly at runtime → inline. Is it one-time onboarding the agent can look up → leave in CLAUDE.md. E.g. a wrong webhook field path that silently misroutes data: inline. A Docker host setting: skip.)

### Step 4: Write Agent Files

Use the templates in `templates/` as a starting point. Each agent file follows this structure:

```markdown
---
frontmatter (name, description, tools, model, color, memory: project)
---

## Bootstrap (Do This First)
[Table of CLAUDE.md files with what each contains]

## Process
[Numbered steps: gather changes → read task docs → review/refine → filter/apply → report]

## [Domain sections]
[Review categories OR refinement criteria OR search strategy OR planning process — project-specific]

## High-Frequency Mistakes OR High-Impact Simplifications
[Top ~15 inline rules table — the most common mistakes for THIS codebase]

## Known False Positives (reviewer) OR Don't Simplify — Preserve These (simplifier)
[Patterns that look wrong but are intentional — prevents recurring noise / accidental un-fixing.
 Fill from CLAUDE.md "intentional"/exception/gotcha notes. Group per repo in multi-repo sessions.]

## [Tech Stack Specifics] (simplifier only)
[Stack → pattern mappings]

## Output Format
[Markdown template for findings/changes]

## Constraints (reviewer only)
[Scope, confidence threshold, severity order, off-limits]
```

**Key rules for agent files**:
- `memory: project` in frontmatter — agents maintain project-level memory
- `color:` in frontmatter — fixed per agent name across all projects (same agent = same color everywhere): `Explore` green, `Plan` blue, `code-reviewer` red, `code-simplifier` cyan, `claude-md-pruner` yellow, `product-reviewer` purple, `browser-verifier` orange. UI-only, no behavioral effect, but easy to miss since nothing else surfaces a gap — templates already set it
- `mcp__ide__getDiagnostics` in tools — for `code-reviewer` + `code-simplifier`. **Omit for `product-reviewer`** — it judges product completeness, not type correctness
- `product-reviewer` is **read-only** — NO `Write`/`Edit`. It recommends; the main session decides (a missing journey is the user's scope call). No file slice — judges the whole feature's journey, so `/done` passes it feature name + task-doc path, not a partition
- `browser-verifier` is **read-only** — NO `Write`/`Edit` (`disallowedTools: [Write, Edit]`), else it "fixes" its way to a green run instead of reporting the bug. Two load-bearing rules must survive any template edit: (a) **assert the effect, never trust the tool's success message** — `resize_window`/`save_to_disk` both report success while doing nothing, so back every claim with a measured `innerWidth`/`ls`'d path; (b) **never attribute a claim to the user they didn't type** — report inferences as the agent's own, attribute to the user only a message quoted verbatim. Gets Chrome MCP tools, NOT `getDiagnostics`
- **`browser-verifier` has a `## Target — fill at setup` slot table** (app URL, auth, test accounts, mobile breakpoint, never-run commands, off-limits envs). Fill every `<...>` from `CLAUDE.md`/`CLAUDE.local.md` — empty slots report `BLOCKED` on first run. ⚠️ **Secrets go in the slot table only if `.claude/agents/` is gitignored** (`git check-ignore -v .claude/agents/browser-verifier.md`); if committed, use the pointer form (`see CLAUDE.local.md #{local-env}`) and let the agent read credentials at runtime
- `Explore` is **read-only** — NO `Write`/`Edit`; it reports locations, not opinions. `Plan` recommends without implementing, but IS granted `Write` narrowly — the built-in Plan agent writes directly to `~/.claude/plans/<slug>.md` (instructional restraint, not tool-enforced), and this template mirrors that: `Write` granted, `Edit` disallowed, body restricts Write to the plans directory only. Both need `name:` exactly `Explore`/`Plan` to shadow the built-ins (see naming exception above). `Explore` also needs `disallowedTools: [Write, Edit]` (shadow is partial — `tools:` omission alone doesn't strip the built-in's grant); `Plan` needs `disallowedTools: [Edit]` only
- Bootstrap section lists CLAUDE.md files with brief descriptions of what each contains
- Process includes "Read task docs" step — reduces false positives by understanding intent
- **Task-doc discovery = invoke `/read-summary`, don't reimplement it.** Every task-doc-consuming agent (`Explore`, `Plan`, `code-reviewer`, `code-simplifier`, `product-reviewer` — not `claude-md-pruner`) must carry `Skill` in `tools:` and name `/read-summary` in Bootstrap/Process as the canonical discovery method (short inline Glob+Grep fallback only). Hand-copying read-summary's logic drifts independently per agent — watch for a `description:` claiming "reads task docs" whose Bootstrap never mentions them
- **`Explore`/`Plan` run `/read-summary` discovery UNCONDITIONALLY — no prompt shape exempts it, not even a bare single-symbol lookup.** Both take open-ended free-text prompts (unlike the diff-triggered reviewer/simplifier/product-reviewer), so there's no natural "N changed files" gate to hang a skip on — a symptom-only prompt can legitimately skip straight to code search and miss a documented fix. Cost is low (`Explore` is haiku) relative to silently missing context. Bootstrap must open with a `⚠️ MANDATORY, no exceptions` line before the file table, not a buried caveat
- **Multi-repo agents name BOTH repos' task-doc roots** — active repo's `tasks/<domain>/<feature>/current.md` and the sibling's (at the sibling repo ROOT, e.g. not under `backend/`). The active repo's cross-system doc's `Related:` field links the sibling docs — say to follow it
- Inline table has only rules that prevent the most common mistakes
- All other conventions discovered by reading CLAUDE.md at runtime
- No `<!-- INJECTED -->` markers — the old injection pattern is deprecated

### Step 5: Verify

⚠️ **Each checklist item below is a command to run, not a memory to consult.** Having read an agent file earlier in this session is not verification — a file skimmed for "does this look right" reliably passes items it actually fails. For every item, run the literal `grep`/count it implies against the actual current file content before checking it off.

After writing agents, verify:
- [ ] No duplicated CLAUDE.md content (only critical rules inline)
- [ ] Bootstrap section references correct CLAUDE.md paths
- [ ] Agent-specific behavior preserved (confidence scoring, simplification principles, pruning safeguards)
- [ ] All agents have `memory: project` in frontmatter
- [ ] All agents have `color:` in frontmatter, matching the fixed per-agent-name colors (see Step 4 key rules)
- [ ] Reviewer/simplifier tools list includes `mcp__ide__getDiagnostics`
- [ ] Every task-doc-consuming agent (all but `claude-md-pruner`) has `Skill` in tools AND names `/read-summary` as the canonical task-doc discovery method — no agent's `description:` claims "reads task docs" while its Bootstrap omits them
- [ ] `Explore`/`Plan` Bootstrap opens with a `⚠️ MANDATORY, no exceptions` line stating `/read-summary` discovery runs on EVERY call — including a bare single-symbol/trivial lookup, not just a detailed code-specific prompt naming a flow
- [ ] Multi-repo: agents name BOTH repos' task-doc roots (active + sibling at its repo root), not just the active repo's
- [ ] Reviewer has a "Known False Positives" table; simplifier has a "Don't Simplify (Preserve These)" table (even if seeded from a couple of CLAUDE.md exceptions)
- [ ] `product-reviewer` is read-only (NO `Write`/`Edit`, NO `getDiagnostics`), has a "Don't Flag These" non-findings table, a 3-tier severity model (blocking / expected-missing / polish), and a product-context table (who the audiences are)
- [ ] `browser-verifier` is read-only (NO `Write`/`Edit`, plus `disallowedTools: [Write, Edit]`, NO `getDiagnostics`), carries the Chrome MCP tools, and its body still contains BOTH load-bearing rules: the assert-the-effect table (`resize_window`/`save_to_disk` report success while doing nothing) and the never-fabricate-user-approval constraint. Its mobile recipe must gate on `matchMedia(...).matches === true`, not width alone
- [ ] `browser-verifier`'s `## Target` slot table has **zero remaining `<...>` placeholders** (`grep -n '<[a-z]' .claude/agents/browser-verifier.md` → no slot rows). If the agent file is committed (`git check-ignore` says NOT ignored), assert no plaintext password sits in it — the slots must hold pointers to `CLAUDE.local.md`, not the secrets themselves
- [ ] `Explore`/`Plan` have `name:` frontmatter exactly `Explore`/`Plan`, `Explore` is `model: haiku` and `Plan` is `model: sonnet`
- [ ] `Explore` is fully read-only: NO `Write`/`Edit`, `disallowedTools: [Write, Edit]` explicit (not just omission) — guards against the built-in's grant leaking through the partial name-shadow
- [ ] `Plan` carries `Write` in `tools:` (for `~/.claude/plans/<slug>.md` only) and `disallowedTools: [Edit]`; its body explicitly restricts Write's use to the plans directory and never application source/task docs/CLAUDE.md
- [ ] LSP step uses `hover` + `documentSymbol` (NOT `goToDefinition`/`findReferences` — often broken)
- [ ] Multi-repo: if a sibling repo is driven from the same session, agents carry the `⚠️ Two-repo session` banner, diff both repos, and have a second Bootstrap table + tagged sibling rules
- [ ] Multi-repo: no agent file contains a hardcoded absolute machine path for either repo — `grep -rn '~/[A-Za-z]\|/home/\|/Users/' .claude/agents/*.md` must return nothing (aside from generic examples like `~/.claude/plans/<slug>.md`, which is a fixed harness path, not a repo checkout). The active repo is "this repo" (no path); the sibling is resolved at runtime and referenced via a placeholder variable, never a literal path — see Step 2's runtime-resolution rule
- [ ] Pruner has NEVER-remove list customized for project (reference tables, gotcha rows, etc.)

## Output

```
## Agent Setup Summary

| Agent | Status | Inline Rules | Bootstrap Refs |
|-------|--------|-------------|----------------|
| Explore | Created/Updated | Search strategy (LSP priority) | N CLAUDE.md files |
| Plan | Created/Updated | Planning process + reuse-first rule | N CLAUDE.md files + task doc |
| code-reviewer | Created/Updated | ~15 critical rules | N CLAUDE.md files |
| code-simplifier | Created/Updated | ~12 simplification patterns | N CLAUDE.md files |
| product-reviewer | Created/Updated | Review lenses + 3-tier severity + don't-flag table | N CLAUDE.md files + task doc |
| browser-verifier | Created/Updated | Assert-the-effect table + mobile iframe recipe + no-fabricated-approval | N CLAUDE.md files + task doc |
| claude-md-pruner | Created/Updated | Classification table + NEVER-remove list | Root + global CLAUDE.md |

Agents use Bootstrap pattern — they read CLAUDE.md at runtime.
No manual syncing needed when CLAUDE.md is updated.
```
