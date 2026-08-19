---
name: agent-setup
description: This skill should be used when the user asks to "setup project agents", "create code reviewer", "update agent prompts", or when starting a new project — AND whenever a project's `.claude/agents/*.md` files are missing, have fallen behind what `templates/*.template.md` can now do — a step, a tool grant, a guard or a whole subject the template covers and the agent has no counterpart for, which is different from the two files merely wording the same rule differently — or the user reports an agent misfiring/under-triggering (wrong dispatch behavior traces back to a stale or absent agent file, not the calling skill). Also trigger when a NEW agent template is added upstream and an existing project's agents need to pick it up. Creates project-specific agents with the Bootstrap pattern. Do NOT use for a one-off tweak to a single agent's wording (edit that agent file directly) or for fixing a SKILL.md's own trigger description (that's update-plugin).
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

Find what already exists: the agent files under `.claude/agents/`, and every `CLAUDE.md` in the project at any depth.

If no agents exist, create `.claude/agents/` and generate all eight from templates. If no CLAUDE.md exists, generate with the base template only (no project-specific inline rules to extract yet).

If agents already exist, run Step 5 in full against every one of them regardless of how established they look, and read each against its `templates/<name>.template.md` asking what the template's agent can do that this one can't — a structurally sound agent can still lack a capability the template gained since it was generated. Read for that gap rather than diffing for difference: the two files word the same rules differently on purpose, so a textual comparison buries the one real finding under a wall of correct tailoring. Also enumerate the template names against the generated ones: a template with no counterpart is a missing agent rather than drift, and gets created in the same pass. What a check flags is a finding to judge, not a defect to fix — decide which side is right before changing either.

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

Write agents from the templates in `templates/`, carrying every rule the template teaches into the project's own voice. The rules survive; the vocabulary is replaced — a template example about eager-loading columns becomes an example about whatever this project actually has, and an agent already expressing a rule in its own words needs no edit to match the template's phrasing. What must be tailored rather than restated: Bootstrap paths, the inline critical rules, and domain-specific guidance, all of which name things that exist here. Use facts and reasoning — state why a rule matters, not trip-wires for each failure mode. Frontmatter and the stated role (who each agent is) don't soften — those define what the agent *is*.

**Each agent file contains:**

1. **Frontmatter** — name, description, tools, model, color, `memory: project`
   - Fixed colors per agent name (all projects): `Explore` green, `Plan` blue, `task-builder` pink, `code-reviewer` red, `code-simplifier` cyan, `claude-md-pruner` yellow, `product-reviewer` purple, `browser-verifier` orange.
   - `mcp__ide__getDiagnostics` for `code-reviewer`/`code-simplifier` only (not `product-reviewer` — it judges completeness, not correctness).
   - `task-builder` omits `tools:` entirely (grants full set including `Agent`; adding a `tools:` list would silently revoke `Agent`).
   - `product-reviewer` and `browser-verifier` are read-only: both omit `Write`/`Edit` from `tools:` AND set `disallowedTools: [Write, Edit]`. The omission alone does NOT block them — the harness still grants a tool left off the `tools:` line (the same partial-shadow quirk noted for Explore/Plan), so `disallowedTools` is the only thing that actually enforces read-only.

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
- **The re-delegation rule ships as inline prose; its `📖` pointer does not.** Every `Agent`-holding template states the operative rule in its body — spawn only `Explore`, only for retrieval, never a same-typed child and never your own assignment — and follows it with `📖 ../../_shared/references/agent-may-not-redelegate.md`. Carry that principle into the generated agent in its own voice, naming the retrieval agent this project actually has, and drop the pointer: that relative path resolves only from inside the templates tree, and a project checkout need not have the plugin installed at all, so a copied pointer is dead on arrival. Rewriting it as a plugin-absolute path fails the same way and adds a machine-specific path to a committed file. `Explore` is the exception the rule is written around — nested `Explore` is its designed behaviour, so it carries no ban. Two subagents on one run independently reported the reference file missing when it exists; if a generated copy's pointer looks broken, that is the expected state and not a defect to repair.
- Task-doc discovery: every task-doc-consuming agent (`Explore`, `Plan`, `task-builder`, `code-reviewer`, `code-simplifier`, `product-reviewer`, `claude-md-pruner`) calls `/read-summary`, not reimplementing its logic.

### Step 5: Verify

📖 `references/agent-setup-verification.md` — read it before verifying. It is the owner of what follows; this summary only says what kind of thing you are checking.

Three questions, and knowing which one you are asking matters more than the order you ask them in.

**Can this agent still do its job here?** This is a read, not a search. Walk each agent's process as the agent would execute it, watching for a step whose command contradicts the warning above it, for anything stated below the step that depends on it, and for cited paths that no longer resolve. These are the findings, and they are shape-correct — the right words in the wrong place — so nothing that measures presence will ever see them.

**Are the fixed values right?** Colour per agent name, model tier per role, `memory: project` with a line that actually reads it back, diagnostics only on the two agents that judge correctness, `task-builder` with no `tools:` line at all, and `disallowedTools: [Write, Edit]` on the two read-only agents — that line *is* the enforcement, since the harness grants a tool merely left off `tools:`. These genuinely are exact values; check them however you like.

**Does each agent carry its own project's content?** A generated agent restates every rule in this project's vocabulary, so what you are looking for is whether its tables name things that exist here — not whether they match the template's wording. The failure this catches is a correct heading over the template's own `<!-- e.g. ... -->` examples, which every phrase-match passes and which means the section will never fire.

Which side is stale is a finding rather than an assumption, and a difference in wording is not staleness. What counts is a missing capability: a step, a grant, a guard or a subject the template's agent has and this one lacks.

**A confirmed gap gets written back before you leave this step** — verification that ends in a verdict has diagnosed the problem and fixed nothing. Repair it the way Step 4 would have written it the first time: carry the missing capability into this agent's own voice, naming what exists in this project, rather than copying the template's wording across. Where the generated side turned out to be the right one, the template is what gets patched, minus anything project-specific that must not travel upstream. A missing agent is created outright. Then say per agent what changed, since "verified" and "verified and repaired" are different reports.

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
