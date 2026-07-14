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

> **Why 7**: Two lenses look **before** the code exists, four look **after**. `Explore` finds what's already there; `Plan` designs the approach — both read this project's CLAUDE.md and task docs so research/design respect project conventions instead of generic search/planning. `code-reviewer` asks *is the code correct?*, `code-simplifier` asks *is the code clean?* — both look down at code just written. `product-reviewer` asks *is the feature complete and valuable?* — it looks up from the code to the user and business, catching the class of miss a line-level diff structurally cannot (a CRUD with no "create" button, a funnel with no conversion view). `browser-verifier` asks *does it actually work when a human uses it?* — the only lens that reads the running system rather than source, catching what all four static lenses structurally cannot: a control that renders but can't be tapped at 390px, a submit that toasts success while writing nothing. It's read-only for the same reason `product-reviewer` is — it reports evidence, and a fix is a decision the user owns. `claude-md-pruner` is a separate maintenance concern (what's valuable to keep vs stale) — mixing it into review risks over-aggressive deletion.

> **Naming exception**: `Explore`/`Plan` intentionally reuse the built-in agent type names (capitalized, no hyphen) instead of the `lowercase-hyphenated` convention. A project agent's `name:` frontmatter becomes its `subagent_type`, so this makes them **shadow the built-ins** project-wide — any future `Agent({subagent_type: "Explore"|"Plan"})` call, including Plan Mode's own phases, resolves to the project-aware version. The shadow is **partial**: the built-in `Explore`/`Plan` carry `Write`/`Edit` (for Plan Mode's document editing), and that grant has leaked into the override's live tool list even when `tools:` never lists them — set `disallowedTools: [Write, Edit]` explicitly (Step 4) rather than relying on `tools:` omission.

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
- Add a `⚠️ Two-repo session` banner naming both repo roots and stating the sibling's agent is not used here
- Process step 1 (gather changes) runs `git status --short` in EACH repo (NOT `git diff --name-only` — it hides staged + untracked files and returns empty once work is staged); bootstrap each only if it has changes
- Add a second Bootstrap table for the sibling repo (note any layout quirks, e.g. Laravel root in `backend/`)
- Tag sibling-only inline rules so they're applied only to that repo's files (e.g. a separate "Sibling" rules table)

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

<example>
Inline: "TikTok webhook `shop_id` is top-level `$data['shop_id']`, not `$data['data']['shop_id']`" — wrong path silently routes to the wrong store, a recurring runtime bug.
Skip: "MySQL host is `127.0.0.1` not `localhost` for Docker" — one-time env setup the agent reads from CLAUDE.md when it matters, not a repeated coding mistake.
The test: does getting it wrong crash or corrupt at runtime, repeatedly? Inline. Is it onboarding/setup the agent looks up once? Leave it in CLAUDE.md.
</example>

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
- `color:` in frontmatter — every agent gets one, fixed per agent name across all projects/repos (so the same agent reads as the same color everywhere): `Explore` green, `Plan` blue, `code-reviewer` red, `code-simplifier` cyan, `claude-md-pruner` yellow, `product-reviewer` purple, `browser-verifier` orange. Purely a UI/transcript-distinguishing hint — no behavioral effect — but a skipped `color:` is easy to miss since nothing else surfaces the gap; the seven templates already set it, so copying a template forward is enough
- `mcp__ide__getDiagnostics` in tools — for `code-reviewer` + `code-simplifier` (catches lint/type errors). **Omit for `product-reviewer`** — it judges product completeness, not type correctness; diagnostics are out of its lane
- `product-reviewer` is **read-only** — NO `Write`/`Edit` in its tools. It recommends product changes; the main session decides what to build (a missing journey is a scope call the user owns). It also has no file slice — it judges the whole feature's journey, so `/done` passes it the feature name + task-doc path, not a partition
- `browser-verifier` is **read-only** — NO `Write`/`Edit` (set `disallowedTools: [Write, Edit]`). It drives the running app and reports; a browser agent that can also patch source will "fix" its way to a green run instead of reporting the bug. Two rules are load-bearing and must survive any edit to its template: (a) **assert the effect, never trust the tool's success message** — `resize_window` and screenshot `save_to_disk` both report success while doing nothing, so a claim is only as good as the measured `innerWidth`/`ls`'d path behind it; (b) **never fabricate user approval** — report a product decision as an open question, never as a consent you invent; cite approval ONLY when the user actually said it *to you* in this run (they may steer you mid-run — that is real instruction, and worth naming as such so the main loop can tell it apart from an invention). It gets Chrome MCP tools but NOT `getDiagnostics` (type-correctness is the reviewer's lane)
- **`browser-verifier` has a `## Target — fill at setup` slot table** (app URL, auth mechanism, test accounts, mobile breakpoint, never-run commands, off-limits envs). Fill every `<...>` from the project's `CLAUDE.md`/`CLAUDE.local.md` — an agent shipped with empty slots reports `BLOCKED` on its first run. ⚠️ **Secrets go in the slot table ONLY if `.claude/agents/` is gitignored** — verify with `git check-ignore -v .claude/agents/browser-verifier.md`. If it's committed (the usual case), leave the pointer form (`see CLAUDE.local.md #{local-env}`) and let the agent read credentials at runtime; never commit passwords into an agent file, and never put them in the shared plugin template
- `Explore` is **read-only** — NO `Write`/`Edit`. It reports locations, not opinions. `Plan` recommends an approach and doesn't implement it, but IS granted `Write` narrowly — confirmed via session-transcript evidence that the built-in Plan agent calls `Write` directly against `~/.claude/plans/<slug>.md` (no path-scoped tool restriction exists in Claude Code's permission model to enforce this technically — the built-in's restraint is instructional, not tool-enforced). This template mirrors that: `Write` is granted, `Edit` stays disallowed, and the agent body explicitly restricts Write's use to the plans directory only — never application source, task docs, or CLAUDE.md. Both agents' `name:` frontmatter must be exactly `Explore`/`Plan` (capitalized, no hyphen) so they shadow the built-in agent types — see the naming exception note above. `Explore` additionally needs `disallowedTools: [Write, Edit]` since the shadow only partially overrides the built-in — `tools:` omission alone doesn't reliably strip the built-in's grant. `Plan` needs `disallowedTools: [Edit]` only (Write is intentionally kept)
- Bootstrap section lists CLAUDE.md files with brief descriptions of what each contains
- Process includes "Read task docs" step — reduces false positives by understanding intent
- **Task-doc discovery = invoke `/read-summary`, don't reimplement it.** Every task-doc-consuming agent (`Explore`, `Plan`, `code-reviewer`, `code-simplifier`, `product-reviewer` — NOT `claude-md-pruner`, which is CLAUDE.md-only) must (a) carry `Skill` in its `tools:` frontmatter, and (b) have its Bootstrap/Process name the `/read-summary` skill as the canonical way to find the doc (with a short inline Glob+Grep fallback for when the skill can't be invoked). Hand-copying read-summary's Glob-`tasks/**/*.md`-plus-Grep logic into each agent drifts — the sibling-repo path and synonym rule go stale independently. An agent whose `description:` claims it "reads task docs" but whose Bootstrap never mentions them is the drift to catch.
- **`Explore`/`Plan` run `/read-summary` discovery UNCONDITIONALLY — no prompt shape exempts it, not even a bare single-symbol lookup.** Both receive open-ended free-text prompts (unlike `code-reviewer`/`code-simplifier`/`product-reviewer`, which trigger off a `git diff`), so there's no natural gate like "this touches N changed files" to hang a skip-condition on. Gating on "does the prompt name a feature/flow" fails: a generic symptom-only prompt ("permissions look stale, investigate") can legitimately skip straight to code search and miss a documented gotcha with a real fix. `Explore` is haiku (cheap) and `Plan` runs less often, so the token cost of unconditional discovery is low relative to silently missing project context. `Explore.md`/`Plan.md`'s Bootstrap section must open with a `⚠️ MANDATORY, no exceptions` line before the file table, not a caveat buried after it.
- **Multi-repo agents name BOTH repos' task-doc roots** — the active repo's `tasks/<domain>/<feature>/current.md` AND the sibling's (e.g. `~/herd/dourr/tasks/<domain>/<feature>/current.md`, at the sibling repo ROOT, not under `backend/`). The active repo's cross-system task doc's `Related:` field links the sibling docs — say to follow it.
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
