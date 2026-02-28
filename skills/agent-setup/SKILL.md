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

Two agents, each covering both review and refinement:

| Agent | Purpose | Model | Key tools |
|-------|---------|-------|-----------|
| `code-reviewer` | Bugs, security, convention violations. Session-aware — reads task docs, gathers changes holistically. | `sonnet` | Read-only + LSP + diagnostics |
| `code-simplifier` | DRY, clarity, consistency, dead code. Edits files directly. Applies Rule of Three. | `opus` | Read + Edit + Write + LSP |

> **Why 2, not 4**: We tested 4 agents (code-reviewer, session-code-reviewer, code-simplifier, code-refiner) and found the session-aware reviewer outperformed the basic reviewer, and the refiner outperformed the simplifier. Merged the best of each pair into 2 agents.

```
Project/
├── CLAUDE.md
├── subproject/CLAUDE.md
└── .claude/
    └── agents/
        ├── code-reviewer.md
        └── code-simplifier.md
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
| Agents exist | Update if behavioral changes needed |
| No CLAUDE.md | Create agents with base template only |

### Step 2: Identify CLAUDE.md Hierarchy

Map the project's CLAUDE.md files to determine what the Bootstrap section should reference:

| Pattern | Bootstrap entries |
|---------|-------------------|
| Single `CLAUDE.md` | Just root file |
| Root + sub-projects | Root + conditional reads per sub-project |
| Root + layer files (`app/`, `resources/js/`) | Root + conditional reads per layer |

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

### Step 4: Write Agent Files

Use the templates in `templates/` as a starting point. Each agent file follows this structure:

```markdown
---
frontmatter (name, description, tools, model, memory: project)
---

## Bootstrap (Do This First)
[Table of CLAUDE.md files with what each contains]

## Process
[Numbered steps: gather changes → read task docs → review/refine → filter/apply → report]

## [Domain sections]
[Review categories OR refinement criteria — project-specific]

## High-Frequency Mistakes OR High-Impact Simplifications
[Top ~15 inline rules table — the most common mistakes for THIS codebase]

## [Tech Stack Specifics] (simplifier only)
[Stack → pattern mappings]

## Output Format
[Markdown template for findings/changes]

## Constraints (reviewer only)
[Scope, confidence threshold, severity order, off-limits]
```

**Key rules for agent files**:
- `memory: project` in frontmatter — agents maintain project-level memory
- `mcp__ide__getDiagnostics` in tools — catches lint/type errors the agent would miss
- Bootstrap section lists CLAUDE.md files with brief descriptions of what each contains
- Process includes "Read task docs" step — reduces false positives by understanding intent
- Inline table has only rules that prevent the most common mistakes
- All other conventions discovered by reading CLAUDE.md at runtime
- No `<!-- INJECTED -->` markers — the old injection pattern is deprecated

### Step 5: Verify

After writing agents, verify:
- [ ] No duplicated CLAUDE.md content (only critical rules inline)
- [ ] Bootstrap section references correct CLAUDE.md paths
- [ ] Agent-specific behavior preserved (confidence scoring, simplification principles, etc.)
- [ ] Both agents have `memory: project` in frontmatter
- [ ] Tools list includes `mcp__ide__getDiagnostics`

## Output

```
## Agent Setup Summary

| Agent | Status | Inline Rules | Bootstrap Refs |
|-------|--------|-------------|----------------|
| code-reviewer | Created/Updated | ~15 critical rules | N CLAUDE.md files |
| code-simplifier | Created/Updated | ~12 simplification patterns | N CLAUDE.md files |

Agents use Bootstrap pattern — they read CLAUDE.md at runtime.
No manual syncing needed when CLAUDE.md is updated.
```
