<!--LLM-CONTEXT
Status: Reference (ROUTER — this file holds no ADR content, see Sub-Files below)
Domain: plugin-maintenance/agent-architecture
Gotchas: see each sub-file's own Gotchas block
Related: ../current.md (index), ../doc-condensation.md
Last updated: 2026-07-20 — split into 3 theme sub-files (was 332 lines / 34.6KB, over budget from D39's addition)
-->

# Plugin Maintenance — Agent Architecture Decisions (Router)

Decisions about how generated project agents (`.claude/agents/*.md`) inherit conventions, delegate to sibling skills, reliably invoke them, and how the plugin delegates work to cheaper/parallel agents.

This file is a router — full ADR content lives in the sub-files below, grouped by theme.

## Sub-Files

| File | Read if you're asking |
|------|------------------------|
| [agent-architecture/injection-and-delegation.md](agent-architecture/injection-and-delegation.md) | *How do generated agents inherit CLAUDE.md conventions and call sibling skills instead of reimplementing them?* (D1, D4, D14, D29, D15) |
| [agent-architecture/verification-rigor.md](agent-architecture/verification-rigor.md) | *How do skills verify their own checklists actually ran, and catch self-caught deviations or silent-pass exit conditions?* (D21, D24, D25, D28, D38, D39) |
| [agent-architecture/concurrency-and-delegation.md](agent-architecture/concurrency-and-delegation.md) | *How does the plugin delegate to cheaper/parallel agents, what does `run_in_background` actually guarantee, and what happened to the transcript-scan mechanism?* (D30, D31, D32, D34, D35, D36) |

**Status**: Reference (router) · Split 2026-07-20 from a single 332-line file after D39's addition pushed it over the 300-line threshold.
