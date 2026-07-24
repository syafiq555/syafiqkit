<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log, single decisions file
Domain: plugin-maintenance/madr-structure
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../agent-architecture/current.md (sibling feature)
  - ../doc-condensation/current.md (sibling feature — fighting duplication/bloat across docs, CLAUDE.md, skills)
  - ../../../skills/task-summary/references/templates.md
Last updated: 2026-07-24
-->

# Plugin Maintenance — MADR Structure

## Quick Start (read this first in next session)

**Where we are**: Decisions about the MADR (decision-record) format itself — when to use it, how it's priced, and how the doc-editing skills must handle it as a structure distinct from a plain table. 5 committed decisions, no open work.

**Immediate next actions (in order)**:
1. None currently open — this feature is stable reference material, consulted by `task-summary`/`condense-task-doc` when they touch MADR blocks.

**Gotchas that will trip you**:
- MADR is now the DEFAULT `Key Technical Decisions` structure for every task doc — not gated behind decision count or an explicit ask; escape hatch only when Rejected would be empty — see D16 (decisions/core.md)
- Whole-doc MADR replaces (not adds to) the Decisions + Gotchas tables — priced differently than per-block MADR — see D8 (decisions/core.md)
- A doc-format upgrade ships its condensation rule in the same change that introduces the format — see D13 (decisions/core.md)

---

## Overview

Decisions about the MADR (decision-record) format itself: when to use it, how it's priced, and how the doc-editing skills must handle it as a structure distinct from a plain table. Split out of the plugin-maintenance whole-doc MADR (2026-07-24) as its own feature — previously a single flat `decisions/madr-structure.md` file, now nested one level as `madr-structure/decisions/core.md`. Sibling features: [agent-architecture](../agent-architecture/current.md), [doc-condensation](../doc-condensation/current.md).

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Whole-doc MADR pricing model (D8) | ✅ |
| 2 | Multi-mode knowledge-capture skills split canonical structure into `references/` (D9) | ✅ |
| 3 | Skill/command name-sharing needs no wrapper command (D10) | ✅ |
| 4 | Doc-format upgrade ships its condensation rule atomically (D13) | ✅ |
| 5 | MADR made the default structure, not opt-in (D16) | ✅ |

---

## Key Technical Decisions

Full ADR content lives in [decisions/core.md](decisions/core.md) — single file, 5 decisions, well under split threshold.

| # | Decision |
|---|----------|
| D8 | Whole-doc MADR is priced differently from per-decision MADR |
| D9 | Multi-mode knowledge-capture skills split canonical structure into `references/` |
| D10 | A skill/command sharing a name needs no wrapper command |
| D13 | A doc-format upgrade ships its condensation rule in the same change |
| D16 | MADR is the default `Key Technical Decisions` structure, not an opt-in upgrade (supersedes D8's "never default" clause) |

---

## Next Steps

- [ ] None currently open.

---

## Last Session (2026-07-24)

- Split out of the plugin-maintenance whole-doc MADR into its own feature folder (`tasks/plugin-maintenance/madr-structure/`) — the prior flat `decisions/madr-structure.md` moved to `madr-structure/decisions/core.md`; this `current.md` is new, authored from the prior single doc's routing table for this theme.
- No domain-level registry doc exists — `plugin-maintenance` is just a folder holding 3 sibling feature docs, cross-linked via `Related:` like any other related task docs.
