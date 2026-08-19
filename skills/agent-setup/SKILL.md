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

**Why eight**: each answers a different question, and the split is by *when* it can be asked. Before code exists, `Explore` asks what's there and `Plan` asks how to build it. `task-builder` is the only one that writes feature code. Afterwards, `code-reviewer` asks "correct?", `code-simplifier` asks "clean?", `product-reviewer` asks "complete?" against intent no diff shows, and `browser-verifier` asks "works?" against the running system. The last four report evidence and the user decides — a reviewer that fixes what it found has destroyed its own witness.

**Explore and Plan shadow the built-in agents** via `name:` frontmatter (capitalized, no hyphen) → `subagent_type`, so they override the built-in project-wide. Blocking a tool takes `disallowedTools: [X]`, and the reason is the order the two fields resolve in rather than anything about shadowing: `disallowedTools` is applied first, then `tools` is narrowed against whatever survives. An empty or absent `tools:` line therefore inherits the full set rather than granting nothing, so a tool left off that line is still callable — the omission reads like a restriction and isn't one. Both agents are granted `Write` (Explore for scratchpad temp files, Plan for `~/.claude/plans/<slug>.md`), and where those writes may land is scoped by body prose alone — instructional, not enforced by the harness.

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

**Sort the existing agents into three cases before doing any of that, because two of them are not drift.** Pair each file with `templates/<name>.template.md` and ask which side of the pairing is missing:

| What you find | What it is | What to do |
|---|---|---|
| Agent + matching template | Drift, possibly in either direction | The capability read above |
| Template, no agent | A missing agent | Generate it this pass |
| **Agent, no template** | **Someone else's agent** | Judge it in place; never generate over it |

The third case is the one that gets mishandled, because every check in this skill is phrased against a template and this agent has none — so it reads as unaffected while actually being unexamined. It arrives from a hand-written definition, another plugin, or a project that predates this skill, and the shape it's in is somebody's decision rather than a lapse. Ask only whether it can still do its job here: do its cited paths resolve, does its `description` still describe when it should fire, do its tool grants match what it claims to be. Those questions need no template. What does not apply is anything that would reshape it — do not re-section it, do not restate its rules in this plugin's voice, and do not generate a same-named agent on top of it. A project running agents you didn't write is the normal case outside this repo, and the value you add there is telling the owner what is broken, not converting their fleet.

If one genuinely needs to become a managed agent, that is the owner's call to make explicitly, and it means writing a template first so the pair has something to drift against.

### Step 2: Identify CLAUDE.md Hierarchy

Map the project's CLAUDE.md files to determine what the Bootstrap section should reference:

| Pattern | Bootstrap entries |
|---------|-------------------|
| Single `CLAUDE.md` | Just root file |
| Root + sub-projects | Root + conditional reads per sub-project |
| Root + layer files (`app/`, `resources/js/`) | Root + conditional reads per layer |
| **Sibling repo driven from same session** | Add a `⚠️ Two-repo session` note + a SECOND Bootstrap table for the sibling's CLAUDE.md files, and have the agent `git diff` BOTH repos (see below) |

**Multi-repo (sibling) sessions**: when two repos are driven from one working dir, only the active repo's agents fire — the sibling's never do. So the active agent has to cover both, which means a `⚠️ Two-repo session` banner, a second Bootstrap table for the sibling's CLAUDE.md files, sibling-only rules tagged so they apply to that repo's files alone, and `git status --short` run in *each* repo (never `git diff --name-only`, which hides staged and untracked files and reads empty once work is staged).

Never hardcode the sibling's absolute path. These agent files are committed and shared across machines, so a literal path baked in at setup collides for everyone else — have the banner resolve `../<sibling-name>` at runtime and carry the result in a placeholder like `$SIBLING`.

### Step 3: Extract Critical-Only Rules

Read CLAUDE.md files and extract the roughly 15 rules that cause the most frequent mistakes — the ones where getting it wrong crashes or corrupts something repeatedly at runtime, not the ones an agent can look up once and move on from. Broken models or dead columns, wrong column names in eager loads, framework version API changes, theme token violations, dual-write/data-integrity rules, polymorphic relationship gotchas, and base-class requirements are the recurring shapes worth inlining. Environment setup, dev commands, one-time gotchas, tool preferences, and schema details stay in CLAUDE.md — the agent reads them at runtime instead. A wrong webhook field path that silently misroutes data earns an inline rule; a Docker host setting doesn't.

### Step 4: Write Agent Files

Write agents from the templates in `templates/`, carrying every rule the template teaches into the project's own voice. The rules survive; the vocabulary is replaced — a template example about eager-loading columns becomes an example about whatever this project actually has, and an agent already expressing a rule in its own words needs no edit to match the template's phrasing. What must be tailored rather than restated: Bootstrap paths, the inline critical rules, and domain-specific guidance, all of which name things that exist here. Use facts and reasoning — state why a rule matters, not trip-wires for each failure mode. Frontmatter and the stated role (who each agent is) don't soften — those define what the agent *is*.

**Each agent file contains:**

1. **Frontmatter** — name, description, tools, model, color, `memory: project`. These are fixed values rather than judgement calls, and three of them fail silently when wrong: a read-only agent needs `disallowedTools: [Write, Edit]` because omitting a tool from `tools:` does not block it (camelCase here — a skill spells the same idea `disallowed-tools`, and the wrong spelling is inert rather than invalid, so it fails as a silently-granted write), `task-builder` needs no `tools:` line at all because any list revokes its `Agent` grant, and `memory: project` does nothing unless something in the body reads it back. Copy them from `${CLAUDE_SKILL_DIR}/references/agent-setup-verification.md`, which lists every one per agent — guessing produces a file that looks right and is missing an enforcement line.

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

6. **Agent-specific tables.** Each judging agent carries a table of what NOT to act on — `code-reviewer`'s known false positives, `code-simplifier`'s preserve-these, `product-reviewer`'s expected gaps plus its severity tiers. These are what stop a reviewer reporting deliberate design as a defect, so they get filled with this project's real cases rather than copied placeholders. Take the shape from each agent's own template.

   `browser-verifier` is the exception worth naming: its `## Target` table (app URL, auth accounts, breakpoint, never-run commands, off-limits environments) has placeholders that **block the agent until filled** from `CLAUDE.md`/`CLAUDE.local.md`, and a committed file takes a pointer rather than a plaintext secret.

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

For an agent with **no template** (Step 1's third case), only the first question above applies — can it still do its job here. The second and third are comparisons with nothing to compare against, and running them anyway turns "this isn't one of ours" into a list of false findings. Report what's broken and leave the shape alone.

**A confirmed gap gets written back before you leave this step** — verification that ends in a verdict has diagnosed the problem and fixed nothing. Repair it the way Step 4 would have written it the first time: carry the missing capability into this agent's own voice, naming what exists in this project, rather than copying the template's wording across. Where the generated side turned out to be the right one, the template is what gets patched, minus anything project-specific that must not travel upstream. A missing agent is created outright. Then say per agent what changed, since "verified" and "verified and repaired" are different reports.

## Output

Report per agent what happened to it — created, updated, verified unchanged, or verified and repaired — since those are different claims and a bare "verified" hides which. Name what changed for each repair, and say which CLAUDE.md files the fleet now bootstraps from.

The generated file's own shape is whatever the templates produce; read one rather than a description of one. Agents re-read CLAUDE.md at runtime, so a docs change needs no agent edit to reach them — that is the point of the Bootstrap pattern, and re-deriving agent tables from CLAUDE.md rebuilds the duplication it exists to avoid.
