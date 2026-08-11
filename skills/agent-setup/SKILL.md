---
name: agent-setup
description: This skill should be used when the user asks to "setup project agents", "create code reviewer", "update agent prompts", or when starting a new project — AND whenever a project's `.claude/agents/*.md` files are missing, out of date against `templates/*.template.md`, or the user reports an agent misfiring/under-triggering (wrong dispatch behavior traces back to a stale or absent agent file, not the calling skill). Also trigger when a NEW agent template is added upstream and an existing project's agents need to pick it up. Creates project-specific agents with the Bootstrap pattern. Do NOT use for a one-off tweak to a single agent's wording (edit that agent file directly) or for fixing a SKILL.md's own trigger description (that's update-plugin).
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

Adding gotchas to CLAUDE.md does not by itself require updating agents — they read CLAUDE.md dynamically at runtime. Only touch the agent files when their behavioral instructions or inline critical rules need to change.

## Agents

Eight agents, each with a distinct responsibility:

| Agent | Purpose | Model | Key tools |
|-------|---------|-------|-----------|
| `Explore` | Fast search — locate files/symbols/callers. Project-aware version of the built-in `Explore` agent. Read-only by *role*: it reports locations, and its findings are its text response. | `haiku` | Read + LSP + Bash + Write/Edit (scratchpad only) |
| `Plan` | Design an implementation approach — critical files, trade-offs, blast radius. Project-aware version of the built-in `Plan` agent. | `sonnet` | Read-only + LSP |
| `task-builder` | Implements one file-partitioned slice of already-triaged work. The only agent that writes NEW feature code. Typically spawned in parallel when a task splits into file-partitioned build units. | `sonnet` | **ALL** (no `tools:` line) |
| `code-reviewer` | Bugs, security, convention violations. Session-aware — reads task docs, gathers changes holistically. | `sonnet` | Read-only + LSP + diagnostics |
| `code-simplifier` | DRY, clarity, consistency, dead code. Edits files directly. Applies Rule of Three. | `sonnet` | Read + Edit + Write + LSP |
| `product-reviewer` | Product/PM lens — missing user journeys, dead-end flows, UX/business-value gaps the engineer forgot to build. Reads the task doc (intent) + built code; recommends, never edits. | `sonnet` | Read-only + LSP |
| `browser-verifier` | Drives the running app in a real browser — clicks the real flow, asserts the DB actually changed, catches layout/console breakage a diff cannot show. Owns the mobile-viewport recipe. Reports; never edits. | `sonnet` | Read-only + Chrome MCP |
| `claude-md-pruner` | Prunes living docs for staleness — CLAUDE.md files **and** `tasks/**` task docs (name is legacy, scope is both). Conservative — preserves reference tables, cross-reference mappings, required task-doc headings and MADR blocks. Sizing verdicts delegate to `condense-claude-md`/`condense-task-doc`. | `sonnet` | Read + Edit + Grep + Glob + Skill |

**Why eight**: two lenses look *before* code exists (`Explore` finds what's there, `Plan` designs the approach — both reading project CLAUDE.md/task docs). One *writes* it: `task-builder` is the only agent that produces new feature code — `code-simplifier` refines what exists, `Plan` designs without building, and the rest are read-only. Four look *after*: `code-reviewer` (correct?) and `code-simplifier` (clean?) look down at the diff; `product-reviewer` looks up at user/business value, catching what a line-level diff can't (a CRUD with no "create" button); `browser-verifier` is the only lens reading the running system, catching what static review can't (a control that renders but can't be tapped at 390px). Both `product-reviewer` and `browser-verifier` are read-only — they report evidence, a fix is the user's call. `claude-md-pruner` is kept separate to avoid over-aggressive deletion bleeding into review — it's the only agent that prunes living docs, and it branches on artifact rather than owning a size policy for either.

**Naming exception**: `Explore`/`Plan` intentionally reuse the built-in agent type names (capitalized, no hyphen), not `lowercase-hyphenated` — since `name:` frontmatter becomes `subagent_type`, this makes them **shadow the built-ins** project-wide, including Plan Mode's own phases. The shadow is **partial**: the built-in's `Write`/`Edit` grant leaks through even when `tools:` omits them, so a tool the template merely leaves out is not thereby blocked — only an explicit `disallowedTools` entry blocks it (`Plan` uses this for `Edit`). Both agents therefore keep `Write` as a granted, scoped tool rather than a withheld one, and the scoping is **instructional**: each body text names where its writes may go (`Plan` → the plans directory; `Explore` → its own scratchpad, never the lead's in-flight plan file). See the full breakdown at Step 4's `Explore`/`Plan` row.

```
Project/
├── CLAUDE.md
├── subproject/CLAUDE.md
└── .claude/
    └── agents/
        ├── Explore.md
        ├── Plan.md
        ├── task-builder.md
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

If no agents exist, create `.claude/agents/` and generate all eight from templates. If no CLAUDE.md exists, generate with the base template only (no project-specific inline rules to extract yet).

If agents already exist, run Step 5 in full against every one of them regardless of how established they look, and diff each against its `templates/<name>.template.md` — a structurally sound agent can still be missing a feature the template gained since it was generated. Also enumerate `basename templates/*.template.md` against `.claude/agents/*.md`: any template with no matching generated agent is a missing agent, not drift, and gets created in the same pass. Update whatever any check flags.

### Step 2: Identify CLAUDE.md Hierarchy

Map the project's CLAUDE.md files to determine what the Bootstrap section should reference:

| Pattern | Bootstrap entries |
|---------|-------------------|
| Single `CLAUDE.md` | Just root file |
| Root + sub-projects | Root + conditional reads per sub-project |
| Root + layer files (`app/`, `resources/js/`) | Root + conditional reads per layer |
| **Sibling repo driven from same session** | Add a `⚠️ Two-repo session` note + a SECOND Bootstrap table for the sibling's CLAUDE.md files, and have the agent `git diff` BOTH repos (see below) |

**Multi-repo (sibling) sessions**: when the user drives two repos from one working dir (e.g. an integration where both sides are edited together), the *sibling* repo's own agents do not fire — only the active repo's agent runs. So the active agent must cover both:
- Add a `⚠️ Two-repo session` banner stating the sibling's agent is not used here — refer to the active repo as "this repo" (no path needed, agents already run with cwd inside it).
- Process step 1 (gather changes) runs `git status --short` in EACH repo, not `git diff --name-only` — that hides staged and untracked files and returns empty once work is staged. Bootstrap each repo only if it has changes.
- Add a second Bootstrap table for the sibling repo (note any layout quirks, e.g. Laravel root in `backend/`).
- Tag sibling-only inline rules so they're applied only to that repo's files (e.g. a separate "Sibling" rules table).

Never hardcode the sibling repo's absolute path — `.claude/agents/*.md` is normally committed and shared across machines/OSes, so a literal path baked in during setup collides for anyone else. Have each agent's banner check `../<sibling-name>` relative to this repo's parent first; if absent, glob likely siblings or ask the user; reference the result via a placeholder variable (e.g. `$SIBLING`), never a literal path.

### Step 3: Extract Critical-Only Rules

Read CLAUDE.md files and extract the roughly 15 rules that cause the most frequent mistakes — the ones where getting it wrong crashes or corrupts something repeatedly at runtime, not the ones an agent can look up once and move on from. Broken models or dead columns, wrong column names in eager loads, framework version API changes, theme token violations, dual-write/data-integrity rules, polymorphic relationship gotchas, and base-class requirements are the recurring shapes worth inlining. Environment setup, dev commands, one-time gotchas, tool preferences, and schema details stay in CLAUDE.md — the agent reads them at runtime instead. A wrong webhook field path that silently misroutes data earns an inline rule; a Docker host setting doesn't.

### Step 4: Write Agent Files

The rules you inline are read by an agent that can reason, so write them the way `unhobble-instructions` audits for: the fact plus why it bites, not a trip-wire for each way it could be missed. The `tools:` frontmatter and the stated mandate are the exception — those are the boundary of what the agent *is*, not prose to soften, and an agent that can edit when it was meant to only read is a different agent.

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

**Frontmatter and per-agent specifics**:
- `memory: project` on every agent — they maintain project-level memory.
- `color:` is fixed per agent name across every project, so the same agent reads as the same color everywhere: `Explore` green, `Plan` blue, `task-builder` pink, `code-reviewer` red, `code-simplifier` cyan, `claude-md-pruner` yellow, `product-reviewer` purple, `browser-verifier` orange. Purely cosmetic — nothing behavioral depends on it — but nothing else surfaces a gap either, so the templates already set it; keep it that way.
- `mcp__ide__getDiagnostics` belongs to `code-reviewer` and `code-simplifier` only. Omit it for `product-reviewer` — it judges product completeness, not type correctness. `task-builder` has it implicitly since it has no `tools:` line at all.
- `task-builder` omits `tools:` entirely — the one agent with no allowlist, so it gets `Agent` plus everything else. The tools enum is fixed and can't be appended to, so writing a `tools:` list back onto it would silently revoke `Agent`. Its file-partition discipline lives in the body's Scope Rules instead, which is why those rules are load-bearing rather than advisory.
- `product-reviewer` is read-only — no `Write`/`Edit`. It recommends; the main session decides whether a missing journey is in scope. It judges the whole feature's journey rather than a file slice, so `/done` passes it a feature name and task-doc path, not a partition.
- `browser-verifier` is read-only — no `Write`/`Edit`, with `disallowedTools: [Write, Edit]` set explicitly so it can't quietly "fix" its way to a green run instead of reporting the bug. It gets Chrome MCP tools, not `getDiagnostics`. Its three load-bearing behavioral rules — assert-the-effect, never-fabricate-user-approval, USER-TRIGGERED ONLY dispatch — are Step 5's job to verify; see that checklist item for what each one guards against.
- `browser-verifier` carries a `## Target — fill at setup` slot table (app URL, auth, test accounts, mobile breakpoint, never-run commands, off-limits envs). Fill every `<...>` from `CLAUDE.md`/`CLAUDE.local.md` — an empty slot makes the agent report `BLOCKED` on first run. Only put secrets directly in the slot table if `.claude/agents/` is gitignored (check with `git check-ignore -v .claude/agents/browser-verifier.md`); if the file is committed, use a pointer instead (`see CLAUDE.local.md #{local-env}`) and let the agent read credentials at runtime.
- `Explore` is read-only by *role*, not by *tools* — it reports locations, not opinions, and its findings are its final text response. It nonetheless holds `Bash`, plus `Write`/`Edit` for a scratchpad on sweeps too large to hold in context; its body text is what keeps those off the lead session's in-flight plan file, since a `haiku` agent appending there clobbers work it cannot see. `Plan` recommends without implementing and is granted `Write` narrowly, restricted by its own body text to `~/.claude/plans/<slug>.md`, with `disallowedTools: [Edit]` as a second guard against code changes. Don't read either agent's role as evidence of its grants — see the naming-exception callout above.
- Bootstrap lists CLAUDE.md files with brief descriptions of what each contains. Process includes a "read task docs" step to reduce false positives from missing intent.
- **Task-doc discovery means invoking `/read-summary`, not reimplementing its logic.** Every task-doc-consuming agent — `Explore`, `Plan`, `task-builder`, `code-reviewer`, `code-simplifier`, `product-reviewer`, and `claude-md-pruner` (which prunes task docs too, since that branch was added after it started out CLAUDE.md-only) — carries `Skill` in `tools:` and names `/read-summary` in Bootstrap/Process as the canonical discovery method, with only a short inline Glob+Grep fallback. Hand-copying read-summary's logic drifts independently per agent, so watch for a `description:` that claims "reads task docs" while its Bootstrap never mentions them.
- **`Explore` and `Plan` run `/read-summary` discovery on every call, with no exemption for a bare single-symbol lookup.** This was tightened deliberately: both take open-ended free-text prompts (unlike the diff-triggered reviewer/simplifier/product-reviewer), so there's no natural "N changed files" gate to hang a skip on, and a live test showed a symptom-only prompt legitimately skipping straight to code search and missing a documented fix. Given `Explore` runs on haiku and `Plan` is called far less often per session, the token cost of an unconditional check was judged worth it over the risk of silently missing context — so Bootstrap opens with a `⚠️ MANDATORY, no exceptions` line before the file table, not a buried caveat.
- Multi-repo agents name both repos' task-doc roots — the active repo's `tasks/<domain>/<feature>/current.md` and the sibling's (at the sibling repo's root, not nested under something like `backend/`). The active repo's cross-system doc's `Related:` field links the sibling docs; tell the agent to follow it.
- The inline table holds only the rules that prevent the most common mistakes; everything else is discovered by reading CLAUDE.md at runtime.
- No `<!-- INJECTED -->` markers — that injection pattern is deprecated.

### Step 5: Verify

Each item below names a command or grep to run against the current file content — a memory of having read the file earlier this session isn't a substitute, since a skim for "does this look right" reliably passes items it actually fails.

- [ ] No duplicated CLAUDE.md content (only critical rules inline)
- [ ] Bootstrap section references correct CLAUDE.md paths
- [ ] Agent-specific behavior preserved (confidence scoring, simplification principles, pruning safeguards)
- [ ] All agents have `memory: project` in frontmatter
- [ ] Every agent granted `memory: project` also reads it back — a `⚠️ Read your own memory first` line naming `.claude/agent-memory/<agent-name>/*.md` as the first item under `## Bootstrap`. Without it the grant is write-only: notes accumulate that nothing ever reads, and nothing fails visibly to flag it. Detect with `grep -L 'agent-memory' .claude/agents/*.md` (`task-builder` is the expected exception, by design). The `<agent-name>` in the path is copy-paste-prone across agents, so grep the pair against the file's own `name:`, not just the line's presence. **Run the same check against `templates/*.template.md`, not only the generated copies** — a template that's mid-restructure when this requirement lands can ship without the line, and every project regenerated from it inherits the gap silently; a generated-copy-only grep can pass by coincidence (a prior hand-fix survives regeneration) without the template defect ever surfacing.
- [ ] All agents have `color:` in frontmatter, matching the fixed per-agent-name colors (see Step 4)
- [ ] Reviewer/simplifier tools list includes `mcp__ide__getDiagnostics`
- [ ] Every task-doc-consuming agent — `claude-md-pruner` included — has `Skill` in tools and names `/read-summary` as the canonical discovery method; no agent's `description:` claims "reads task docs" while its Bootstrap omits them
- [ ] `Explore`/`Plan` Bootstrap opens with a `⚠️ MANDATORY, no exceptions` line stating `/read-summary` discovery runs on every call, including a bare single-symbol/trivial lookup
- [ ] Multi-repo: agents name both repos' task-doc roots (active + sibling at its own repo root), not just the active repo's
- [ ] Reviewer has a "Known False Positives" table; simplifier has a "Don't Simplify (Preserve These)" table, even if seeded from just a couple of CLAUDE.md exceptions
- [ ] `product-reviewer` is read-only (no `Write`/`Edit`, no `getDiagnostics`), has a "Don't Flag These" non-findings table, a 3-tier severity model (blocking / expected-missing / polish), and a product-context table naming the audiences
- [ ] `browser-verifier` is read-only (no `Write`/`Edit`, plus `disallowedTools: [Write, Edit]`, no `getDiagnostics`), carries the Chrome MCP tools, and its body still contains all three load-bearing rules: the assert-the-effect table (`resize_window`/`save_to_disk` report success while doing nothing), the never-fabricate-user-approval constraint, and the `description:`'s USER-TRIGGERED ONLY clause (`grep -c 'USER-TRIGGERED' .claude/agents/browser-verifier.md` should be ≥1). Its mobile recipe gates on `matchMedia(...).matches === true`, not width alone
- [ ] `browser-verifier`'s `## Target` slot table has zero remaining `<...>` placeholders (`grep -n '<[a-z]' .claude/agents/browser-verifier.md` → no slot rows). If the file is committed (`git check-ignore` says not ignored), confirm no plaintext password sits in it — slots hold pointers to `CLAUDE.local.md`, not secrets
- [ ] `Explore`/`Plan` have `name:` frontmatter exactly `Explore`/`Plan`; `Explore` is `model: haiku`, `Plan` is `model: sonnet`
- [ ] `task-builder` is `model: sonnet` and omits `tools:` entirely (deliberate — full set incl. `Agent`; the enum can't be appended to, so adding a list back would silently revoke `Agent`). Since it's the only agent without an allowlist, its body's Scope Rules are the sole guard — verify the file-partition rule and the "pass your owned-file list to any sub-agent you spawn" row are both present. Several instances run in parallel when a task splits by file, and two agents writing one file clobber each other with no error
- [ ] `Explore` carries `Write`/`Edit` in `tools:` (scratchpad use — omitting them wouldn't block them anyway under the partial name-shadow), and its body still states that its findings ARE the deliverable and that a scratchpad goes to a temp path, never the spawning session's plan file. That sentence is the only thing scoping the grant, so its absence is a real finding, not a wording nit
- [ ] `Plan` carries `Write` in `tools:` (for `~/.claude/plans/<slug>.md` only) and `disallowedTools: [Edit]`; its body restricts Write's use to the plans directory and never application source/task docs/CLAUDE.md
- [ ] LSP step uses `hover` + `documentSymbol` (not `goToDefinition`/`findReferences` — these are often broken)
- [ ] Multi-repo: if a sibling repo is driven from the same session, agents carry the `⚠️ Two-repo session` banner, diff both repos, and have a second Bootstrap table + tagged sibling rules
- [ ] Multi-repo: no agent file contains a hardcoded absolute machine path for either repo — `grep -rn '~/[A-Za-z]\|/home/\|/Users/' .claude/agents/*.md` should return nothing (aside from generic fixed harness paths like `~/.claude/plans/<slug>.md`, which isn't a repo checkout). The active repo is "this repo" (no path); the sibling resolves at runtime via a placeholder variable, never a literal path — see Step 2
- [ ] Pruner has a NEVER-remove list customized for the project (reference tables, gotcha rows, etc.)
- [ ] **Pruner size-policy migration.** Most existing projects still carry the superseded `### 0. Target length` step, which hardcodes its own ceiling (`~200 lines`, `350`, or a repo-specific number). This is template drift, not a project-specific fill, even though the hardcoded number looks locally tuned enough to seem like one — a prior audit shipped exactly this false pass. Replace the whole step with the template's `### 0. Size policy is NOT this agent's — delegate it`, and patch the Philosophy paragraph's stale "distinct jobs / distinct lanes" sentence in the same edit. Detect with `grep -n "Target length\|outer ceiling" .claude/agents/claude-md-pruner.md` — any hit means unmigrated. `condense-claude-md` is the single source of truth for every size/split decision; the pruner agent exists for `memory: project` and background spawning, not for owning a threshold.
- [ ] **Pruner artifact-branch migration**, same class as the row above. Projects generated before the task-doc branch landed carry a CLAUDE.md-only pruner: no `### 0.5 Detect the artifact` step, one classify table, a NEVER-remove list with no task-doc invariants — also template drift, not a project-specific fill. Port the whole template: widened `description:`, artifact-conditional Bootstrap (task-doc row invokes `Skill(read-summary)`), step 0's artifact-dependent delegate target, step 0.5, classify §2a/§2b, branched step 3 greps, and both NEVER-remove lists. Detect with `grep -c "0.5 Detect the artifact" .claude/agents/claude-md-pruner.md` — 0 means unmigrated. Verify any detector you add in both directions before trusting it (must hit an unmigrated fixture and return 0 on a migrated file) — a detector that fires on correctly-migrated files churns every project it touches.
- [ ] **Template-drift check**: `diff` each `.claude/agents/<name>.md` against `templates/<name>.template.md`. Every checklist item above verifies internal structure, but none of them catch a template feature added after this project's agents were generated (a tool grant, a process step, a new section) that never got backported — a generated file can pass every other item and still be stale. Backport genuine feature gaps; project-specific fills (rules tables) are not drift. An in-file model override is preserved only if a justification comment accompanies it — an unjustified deviation from the template's `model:` is drift, align it to the template. The mirror image is invisible to any drift check: passing `model:` at dispatch time to a registered `subagent_type` silently overrides the tier its frontmatter sets, with no error. A registered agent's tier is a property of the agent, so a caller supplies `model:` only for `general-purpose`, or when the user explicitly asks for a tier — in which case say which tier is being overridden, since an agent that already inherits the session model means the "override" may change nothing.
- [ ] **Sub-heading drift — compare table rows, not just headings and sections.** A generated file can be missing only the tail of a table and still pass a heading- or section-level check, since the heading and the table both still exist — only its last rows are gone. This is the most likely drift shape and the least visible one, confirmed by a real audit where three agents each lost the last row of their last table (the self-referential guards stopping a shadowed `Explore`/`Plan` from recommending dispatch of the agent already running), and it passed every prior check that stopped at the heading level. Diff the row labels of every table, per file — `diff <(grep -o '^| \*\*[^|]*\*\*\|^| [A-Za-z][^|]*|' <template>) <(... <agent>)` — and treat every template-only row as a gap. Frontmatter gets the same treatment: diff the whole block (`awk 'NR==1&&/^---$/{f=1;next} f&&/^---$/{exit} f'`), never a `grep -A1` on a multi-line YAML list, which truncates the list and invents a gap that isn't there. Rows present only in the generated file are project fill, not drift. Run this directly rather than delegating it — a delegated "diff all N files" summary tends to report whole missing sections and silently drop everything finer. This applies just as much to a clean report as a dirty one: "no drift found" from a background agent is the result most likely to go unchecked, precisely because there's nothing that looks worth double-checking — a real session reported a full 8-file sweep clean off three parallel agents' word alone, and only caught two genuinely missing rows after being asked "are you sure?" and re-reading the highest-risk pair itself. Treat a delegated pass as a first draft to spot-check, not a verdict — at minimum, personally re-open the file(s) carrying the least redundancy (the shortest generated copy relative to its template, or the one whose report read thinnest) before repeating its conclusion as your own.
- [ ] **Missing-agent check**: enumerate `basename templates/*.template.md` vs `.claude/agents/*.md` (`comm -23` on sorted basenames — first-file-only entries are templates with no generated agent). Any hit is a missing agent, distinct from drift above — create it in the same pass, don't defer.

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
| claude-md-pruner | Created/Updated | Both classification tables (CLAUDE.md + task-doc branch) + NEVER-remove lists | Root + global CLAUDE.md |

Agents use Bootstrap pattern — they read CLAUDE.md at runtime.
No manual syncing needed when CLAUDE.md is updated.
```
