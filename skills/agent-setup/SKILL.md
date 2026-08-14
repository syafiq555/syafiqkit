---
name: agent-setup
description: This skill should be used when the user asks to "setup project agents", "create code reviewer", "update agent prompts", or when starting a new project — AND whenever a project's `.claude/agents/*.md` files are missing, out of date against `templates/*.template.md`, or the user reports an agent misfiring/under-triggering (wrong dispatch behavior traces back to a stale or absent agent file, not the calling skill). Also trigger when a NEW agent template is added upstream and an existing project's agents need to pick it up. Creates project-specific agents with the Bootstrap pattern. Do NOT use for a one-off tweak to a single agent's wording (edit that agent file directly) or for fixing a SKILL.md's own trigger description (that's update-plugin).
---

# Project Agent Setup

Create or update project-specific agents that discover project conventions at runtime by reading CLAUDE.md files.

## Core Concept

Project agents bootstrap themselves by reading CLAUDE.md files at runtime, so only critical rules (those whose absence crashes or corrupts data) live inline. This avoids duplicating CLAUDE.md content into agent files.

**Architecture**:
```
CLAUDE.md files (source of truth) ──Read at runtime──> Agent behavior
Agent file = role definition + Bootstrap directive + ~15 critical rules
```

## When to Use

- When setting up a new project for the first time
- When project conventions change significantly (agent behavior needs updating)
- Directly via `/agent-setup`

Adding gotchas to CLAUDE.md does not by itself require updating agents — they read CLAUDE.md dynamically. Only touch the agent files when their behavioral instructions or inline critical rules need change.

## Agents

Eight agents with distinct responsibilities:

| Agent | Purpose | Writes | Must NOT | Model |
|-------|---------|--------|----------|-------|
| **Explore** | Locate files/symbols/callers. Project-aware built-in agent. Answers location questions; findings are its text response. | Scratchpad only (`~temp/`) | Edit application source; append to caller's plan | haiku |
| **Plan** | Design approach, identify critical files, trade-offs, blast radius. Project-aware built-in agent. | `~/.claude/plans/` only | Edit application source or task docs | sonnet |
| **task-builder** | Implements one file-partitioned slice of already-triaged work. The only agent writing new feature code. Spawned in parallel when a task splits by file. | Owned files only (from partition spec) | Files outside the partition; files shared with other spawned agents | sonnet |
| **code-reviewer** | Hunts bugs, security issues, convention violations. Reads task doc and gathers all changes before reviewing. | None (read-only) | Make changes; assume task intent without reading the doc | sonnet |
| **code-simplifier** | DRY, clarity, consistency, dead code cleanup. Applies Rule of Three. | Application files only | Venture beyond three instances; edit if only one use exists | sonnet |
| **product-reviewer** | Product/PM lens — catches missing user journeys, dead-end flows, UX/business-value gaps. Reads task doc (intent) + built code; recommends, never implements. | None (read-only) | Make changes; assume intent without reading the task doc | sonnet |
| **browser-verifier** | Drives running app in real browser — clicks real flows, asserts DB changed, catches layout/console breakage a diff misses. | None (read-only; reports bugs, never fixes) | Make changes; fabricate user approval; run without explicit user trigger | sonnet |
| **claude-md-pruner** | Prunes CLAUDE.md + `tasks/**` task docs for staleness. Preserves reference tables, mappings, required headings, MADR blocks. Delegates sizing decisions to `condense-claude-md`/`condense-task-doc`. | CLAUDE.md + task docs only | Size-policy decisions; deletion of documented rows; removal of NEVER-remove content | sonnet |

**Why eight**: The design partitions agents by the question each answers and when they're read:
- **Before code exists**: `Explore` finds what's there, `Plan` designs the approach — both read CLAUDE.md/task docs to get context.
- **Writes feature code**: `task-builder` only. `code-simplifier` refines, `Plan` designs without building, rest are read-only.
- **After code exists**: `code-reviewer` asks "correct?", `code-simplifier` asks "clean?" — both read the diff. `product-reviewer` asks "complete?" (catches missing journeys no diff shows). `browser-verifier` asks "works?" on the running system (catches UI breakage static analysis can't). Both report evidence; the user decides on fixes. `claude-md-pruner` prunes living docs without applying a size policy — sizing decisions belong to `condense-claude-md`/`condense-task-doc`.

**Explore and Plan shadow the built-in agents** via `name:` frontmatter (capitalized, no hyphen) → `subagent_type`, so they override the built-in project-wide. This partial shadow means tools in the frontmatter's `tools:` line grant access, but `tools: []` doesn't block a tool entirely — the harness still grants it (a quirk of partial shadowing). To truly block a tool, use `disallowedTools: [X]`. Both agents are granted `Write` (Explore uses it for scratchpad temp files, Plan for `~/.claude/plans/<slug>.md`), and their body text is the only guard restricting where writes go. This scoping is instructional, not enforced — the agent reads the constraint and respects it; it's not a harness rule.

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

Write agents from the templates in `templates/`, tailoring only the project-specific sections (Bootstrap paths, inline critical rules, domain-specific guidance). Use facts and reasoning — state why a rule matters, not trip-wires for each failure mode. Frontmatter and the stated role (who each agent is) don't soften — those define what the agent *is*.

**Each agent file contains:**

1. **Frontmatter** — name, description, tools, model, color, `memory: project`
   - Fixed colors per agent name (all projects): `Explore` green, `Plan` blue, `task-builder` pink, `code-reviewer` red, `code-simplifier` cyan, `claude-md-pruner` yellow, `product-reviewer` purple, `browser-verifier` orange.
   - `mcp__ide__getDiagnostics` for `code-reviewer`/`code-simplifier` only (not `product-reviewer` — it judges completeness, not correctness).
   - `task-builder` omits `tools:` entirely (grants full set including `Agent`; adding a `tools:` list would silently revoke `Agent`).
   - `product-reviewer` and `browser-verifier` are read-only (no `Write`/`Edit`); `browser-verifier` also sets `disallowedTools: [Write, Edit]` to prevent accidental fixes.

2. **Bootstrap section** — reads project CLAUDE.md files and task docs
   - Table of CLAUDE.md files with what each contains (one row per file or layer).
   - Agents consuming task docs call `/read-summary` as canonical discovery, with only a short Glob+Grep fallback (prevent drift across agents).
   - `Explore`/`Plan` run `/read-summary` on **every** call, no exceptions — they take open-ended prompts with no natural "changed files" gate, and missing context is the failure worth preventing. Banner: `⚠️ MANDATORY, no exceptions`.
   - Multi-repo: second table for sibling repo's task-doc root; no hardcoded absolute paths (use `$SIBLING` placeholder; have agent resolve it at runtime).

3. **Process section** — numbered steps for the agent's workflow
   - Varies by agent (gather changes → review → report for reviewers; plan stages for Plan; etc.). Read existing templates for the shape.

4. **Domain-specific sections** (optional, project-specific)
   - Search strategy (Explore), planning lenses (Plan), review categories (reviewer), simplification patterns (simplifier), etc.

5. **High-Frequency Mistakes table** — ~15 critical rules, inline only
   - Facts the agent must know to avoid crashes or data corruption. Derivable facts, one-time setup, and symptom-indexed gotchas stay in CLAUDE.md (read at runtime).
   - Multi-repo sessions: tag sibling-only rules so they apply only to that repo's files.

6. **Agent-specific tables** (reviewer / simplifier / product-reviewer / browser-verifier):
   - `code-reviewer`: Known False Positives table (patterns that look wrong but are intentional).
   - `code-simplifier`: Don't Simplify (Preserve These) table (code that looks repetitive but should stay).
   - `product-reviewer`: Don't Flag These table (expected gaps, polish items, business trade-offs); 3-tier severity model (blocking / expected-missing / polish); product-context table naming audiences.
   - `browser-verifier`: 
     - `## Target` slot table (app URL, auth accounts, mobile breakpoint, never-run commands, off-limits envs) — fill all `<...>` placeholders from `CLAUDE.md`/`CLAUDE.local.md`. Empty slots block the agent. Use pointers (not plaintext secrets) if the file is committed.
     - Assert-the-Effect table (names tools that report success while doing nothing).
     - Never-Fabricate-User-Approval constraint (the agent cannot invent approval; it must be explicitly triggered by the user).
     - Mobile viewport recipe (gates on `matchMedia(...).matches === true`, not width alone).

7. **Output Format section** — markdown template for findings/changes (reviewers/simplifier/product-reviewer).

8. **Constraints section** (reviewer only) — scope, confidence thresholds, severity order, off-limits files.

**Key principles when extracting rules:**

- Extract only rules that cause repeated mistakes at runtime (bad column names, polymorphic gotchas, dual-write requirements, framework version API changes). Everything else is discovered from CLAUDE.md.
- No `<!-- INJECTED -->` markers — that pattern is deprecated.
- Task-doc discovery: every task-doc-consuming agent (`Explore`, `Plan`, `task-builder`, `code-reviewer`, `code-simplifier`, `product-reviewer`, `claude-md-pruner`) calls `/read-summary`, not reimplementing its logic.

### Step 5: Verify

Verification clusters into four concerns. Read the relevant section below, then run the checks listed. A comprehensive verification requires checking all four.

📖 `references/agent-setup-verification.md` — detailed checklist for each concern, with grep/diff commands to run and how to interpret results. Read it before verification; don't replace this summary with grep-only spot-checks.

**1. Content Validity**
- No duplicated CLAUDE.md content (only critical, runtime-crash rules inline; everything else discovered at runtime).
- Bootstrap section references correct CLAUDE.md paths and their layout (single root, root + layers, root + sub-projects, or multi-repo).
- Inline rules table holds only facts that prevent repeated crashes or corruption — not derivable, not one-time setup, not symptom-indexed gotchas (those stay in CLAUDE.md).

**2. Frontmatter Invariants**
- All agents have `memory: project` in frontmatter AND read it back (⚠️ `Read your own memory first` line in Bootstrap, pointing to `.claude/agent-memory/<agent-name>/*.md`).
- All agents have `color:` matching their fixed per-agent-name value (Explore green, Plan blue, etc.).
- Model tiers correct for role: `Explore` haiku, all others sonnet.
- Tools grants match role: `code-reviewer`/`code-simplifier` have `getDiagnostics`, `product-reviewer`/`browser-verifier` are read-only, `task-builder` omits `tools:` entirely (full set).

**3. Agent-Specific Behavior**
- `code-reviewer`: Has Known False Positives table. Uses LSP `hover`/`documentSymbol`, not `goToDefinition`/`findReferences`.
- `code-simplifier`: Has Don't Simplify (Preserve These) table. Uses LSP `hover`/`documentSymbol`.
- `product-reviewer`: Is read-only (no Write/Edit), has Don't Flag These table, uses 3-tier severity (blocking/expected-missing/polish), names audiences.
- `browser-verifier`: Is read-only with `disallowedTools: [Write, Edit]`. Carries assert-the-effect table, never-fabricate-user-approval constraint, USER-TRIGGERED ONLY clause in description. Mobile recipe gates on `matchMedia(...).matches === true`. Target slot table filled (no `<...>` placeholders).
- `Explore`/`Plan`: Shadow built-in agents (name: Explore/Plan). Body text restricts writes (Explore → scratchpad, Plan → `~/.claude/plans/`). Both run `/read-summary` on every call (⚠️ MANDATORY).
- `claude-md-pruner`: Delegates size policy to `condense-claude-md`, not owning a threshold. Has NEVER-remove lists customized for the project.
- Task-doc-consuming agents: Have `Skill` in tools, call `/read-summary` as canonical discovery (prevent per-agent reimplementation drift).
- Multi-repo agents: Name both repos' task-doc roots, no hardcoded absolute paths (use `$SIBLING` placeholder).

**4. Drift Detection**
- Template drift: Each generated `.claude/agents/<name>.md` tracks its `templates/<name>.template.md`. Diff the whole frontmatter and every table's row labels (not just headings).
- Missing agents: Enumerate `basename templates/*.template.md` vs `.claude/agents/*.md` — any template without a generated copy is missing, not drift.
- Pruner migrations: Projects with pre-task-doc pruners or hardcoded size thresholds need backporting from the current template — detect and fix.
- Model overrides: Only preserve in-file model overrides if justified by a comment; unjustified deviations from the template are drift. The mirror image is invisible to every drift check above, because it happens at dispatch rather than in a file — passing `model:` to a registered `subagent_type` silently overrides the tier that agent's frontmatter sets, with no error. A registered agent's tier is a property of the agent, so supply `model:` only for `general-purpose`, or when the user asked for a tier explicitly; then say which tier is being overridden, since an agent inheriting the session model may make the "override" change nothing.

## Output

The skill generates or updates `.claude/agents/*.md` files for each agent. Each file contains:
- Frontmatter (role, tools, model, color, memory settings)
- Bootstrap section (reads CLAUDE.md + task docs at runtime)
- Process steps (numbered workflow for the agent's job)
- Domain-specific sections (project-tailored guidance)
- ~15 critical inline rules (facts the agent must know to avoid crashes)
- Agent-specific tables (false positives, preservation rules, severity models, etc.)

Changes are reported per agent: which were created, which updated, what critical rules were added/modified. A full report names which CLAUDE.md files are now bootstrapped and whether task docs are included in the agent's discovery process.

No manual syncing needed — agents read CLAUDE.md at runtime, so updating the docs automatically updates agent knowledge on the next run.
