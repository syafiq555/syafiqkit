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
| **product-reviewer** | Product lead doing business analysis and design review — catches missing journeys and dead ends, the rules a *working* journey gets wrong (an action live against a state that forbids it, rows a user can't tell apart before a merge, a request a stranger can spam, a capability one party has and its counterpart doesn't), and what the screen leads with. Reads task doc (intent) + built code; recommends, never implements. | None (read-only) | Make changes; assume intent without reading the task doc; report clean because the journeys traced | sonnet |
| **browser-verifier** | Drives running app in real browser — clicks real flows, asserts DB changed, catches layout/console breakage a diff misses. | None (read-only; reports bugs, never fixes) | Make changes; fabricate user approval; run without explicit user trigger | sonnet |
| **claude-md-pruner** | Prunes CLAUDE.md + `tasks/**` task docs for staleness. Preserves reference tables, mappings, required headings, MADR blocks. Delegates sizing decisions to `condense-claude-md`/`condense-task-doc`. | CLAUDE.md + task docs only | Size-policy decisions; deletion of documented rows; removal of NEVER-remove content | sonnet |

**Why eight**: each answers a different question, and the split is by *when* it can be asked. Before code exists, `Explore` asks what's there and `Plan` asks how to build it. `task-builder` is the only one that writes feature code. Afterwards, `code-reviewer` asks "correct?", `code-simplifier` asks "clean?", `product-reviewer` asks "complete?" against intent no diff shows, and `browser-verifier` asks "works?" against the running system. The last four report evidence and the user decides — a reviewer that fixes what it found has destroyed its own witness.

**Explore and Plan shadow the built-in agents** via `name:` frontmatter (capitalized, no hyphen) → `subagent_type`, so they override the built-in project-wide. Blocking a tool takes `disallowedTools: [X]`. The resolution order matters: `disallowedTools` is applied first, then `tools` is narrowed against what remains. An empty or absent `tools:` line inherits the full set rather than granting nothing, so a tool left off that line is still callable. Both agents are granted `Write` (Explore for scratchpad temp files, Plan for `~/.claude/plans/<slug>.md`), with scoping left to body prose alone — the harness enforces field values, not commentary.

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

If agents already exist, run Step 5 in full against every one of them regardless of how established they look, and read each against its `templates/<name>.template.md` asking what the template's agent can do that this one can't — a structurally sound agent can still lack a capability the template gained since it was generated. Run a full `diff` against the template first (Step 5's reference file explains why: a prose read-through anchors on the reworded lines and reads past what's actually missing), then triage the output into "reworded, ignore" versus "capability absent, real finding" — the two files wording the same rule differently is expected and not itself a finding. Also enumerate the template names against the generated ones: a template with no counterpart is a missing agent rather than drift, and gets created in the same pass. What a check flags is a finding to judge, not a defect to fix — decide which side is right before changing either.

Start by sorting the existing agents into three cases, because two of them are not drift problems:

Pair each file with `templates/<name>.template.md` and ask which side of the pairing is missing:

| What you find | What it is | How to read it |
|---|---|---|
| Agent + matching template | The expected case. Drift in either direction is a finding. | Read for capability gaps (Step 5 below). |
| Template, no agent | A missing agent. | Generate it this pass. |
| Agent, no template | A hand-written or inherited agent from outside this plugin, another plugin, or an older setup. The shape it's in is somebody's decision, not a lapse. | Judge whether it can still do its job here: paths resolve, description still accurate, tool grants match the claimed role. Reshape it only if its own owner asks for it. |

The third case is often mishandled, because every check in this skill is phrased against a template and this agent has none — so it reads as unaffected while actually being unexamined. A project running agents you didn't write is the normal case outside this repo. The questions that apply are specific and already appear in Step 5 (§**Can this agent still do its job here?**) — read that section for how to assess. What does not apply is anything that would reshape it: don't re-section it, don't restate its rules in this plugin's voice, and don't generate a same-named agent on top of it. If an agent genuinely needs to become template-managed, that's the owner's decision to make explicitly by creating the template first.

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

1. **Frontmatter** — name, description, tools, model, color, `memory: project`. These are fixed values, and several fail silently when wrong: tool grants resolve in field order (disallowedTools first, then tools), so `product-reviewer` and `browser-verifier` need `disallowedTools: [Write, Edit]` in camelCase; `task-builder` needs no `tools:` line at all to preserve its `Agent` grant; and `memory: project` does nothing unless the body reads it back. Consult `${CLAUDE_SKILL_DIR}/references/agent-setup-verification.md` — it lists the correct frontmatter per agent, which beats guessing and missing an enforcement line.

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
- The re-delegation rule is stated inline in every `Agent`-holding template's body — spawn only `Explore`, only for retrieval, never a same-typed child — rather than relying on a `📖` pointer. Carry that principle into the generated agent in its own voice, naming the retrieval agent this project actually has. A relative path (`📖 ../../_shared/references/agent-may-not-redelegate.md`) only resolves from inside the templates tree, not in a project checkout, so copying it is dead on arrival; a plugin-absolute path adds machine-specific paths to committed files. `Explore` is the design exception — nested `Explore` is its intended behaviour, so it carries no ban.
- Task-doc discovery: every task-doc-consuming agent (`Explore`, `Plan`, `task-builder`, `code-reviewer`, `code-simplifier`, `product-reviewer`, `claude-md-pruner`) calls `/read-summary`, not reimplementing its logic.

### Step 5: Verify

📖 `references/agent-setup-verification.md` — read it before verifying. It is the owner of what follows; this summary only says what kind of thing you are checking.

Three questions, and knowing which one you are asking matters more than the order you ask them in.

**Can this agent still do its job here?** This is a read, not a search. Walk each agent's process as the agent would execute it, watching for a step whose command contradicts the guideline above it, for anything stated below the step that depends on it, and for cited paths that no longer resolve. These are the findings, and they are shape-correct — the right words in the wrong place — so nothing that measures presence will ever see them.

A Bootstrap row citing a *section* of a doc can go stale when that doc is restructured. The file itself still exists and the row still reads as live, but the section it points to may be gone or renamed. Verify section citations against the doc's actual headings rather than only against file existence, and re-read any row that characterises what a doc contains. 📖 `references/agent-setup-verification.md` § A Bootstrap row can cite a section that no longer exists.

**Are the fixed values right?** Colour per agent name, model tier per role, `memory: project` with a line that actually reads it back, diagnostics only on the two agents that judge correctness, `task-builder` with no `tools:` line at all, and `disallowedTools: [Write, Edit]` on `product-reviewer` and `browser-verifier` — that line is the enforcement, since the harness grants a tool merely left off `tools:`. Only those two agents need it. `code-reviewer` omits it deliberately (its read-only-ness is role prose, not frontmatter), as do `code-simplifier`, `Explore`, `claude-md-pruner` and `task-builder`. A generated agent and its template agreeing is evidence — the strongest signal available — so when both omit a line, that pairing survives intact rather than being overridden by inference. Consult `references/agent-setup-verification.md` for the definitive list per agent.

**Does each agent carry its own project's content?** A generated agent restates every rule in this project's vocabulary, so what you are looking for is whether its tables name things that exist here — not whether they match the template's wording. The failure this catches is a correct heading over the template's own `<!-- e.g. ... -->` examples, which every phrase-match passes and which means the section will never fire.

Which side is stale is a finding rather than an assumption, and a difference in wording is not staleness. What counts is a missing capability: a step, a grant, a guard or a subject the template's agent has and this one lacks.

For an agent with **no template** (Step 1's third case), only the first question applies — can it still do its job here. The second and third are comparisons with nothing to compare against, and running them would produce false findings instead. Report what's broken and leave the shape alone.

**Newly created agents register on session start, not mid-session.** The harness reads `.claude/agents/` when a session starts, so `Agent(subagent_type: "code-reviewer")` right after writing the file fails with "Agent type not found" — not because the frontmatter is malformed, but because the agent will register on the next session start. `/reload-plugins` does not fix this (it reloads plugins, not project agents). Where setup and delegation adjoin — such as `/done` immediately after this skill — the fallback is to dispatch `general-purpose` with the agent file handed over as its brief, rather than waiting for the next session to use the new agent.

A confirmed gap is your signal to repair, not merely to report. Verification that ends in a verdict has diagnosed the problem but fixed nothing. Repair it the way Step 4 would have written it the first time: carry the missing capability into this agent's own voice, naming what exists in this project, rather than copying the template's wording across. Where the generated side turned out to be the right one, patch the template instead, minus anything project-specific that must not travel upstream. A missing agent is created outright. Report per agent what happened (created, updated, verified unchanged, or verified and repaired) since those are different outcomes.

## Output

Report per agent what happened to it — created, updated, verified unchanged, or verified and repaired — since those are different claims and a bare "verified" hides which. Name what changed for each repair, and say which CLAUDE.md files the fleet now bootstraps from.

The generated file's own shape is whatever the templates produce; read one rather than a description of one. Agents re-read CLAUDE.md at runtime, so a docs change needs no agent edit to reach them — that is the point of the Bootstrap pattern, and re-deriving agent tables from CLAUDE.md rebuilds the duplication it exists to avoid.
