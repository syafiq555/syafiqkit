<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log, single decisions file; 2 deferred items open
Domain: plugin-maintenance/madr-structure
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../agent-architecture/current.md (sibling feature)
  - ../doc-condensation/current.md (sibling feature — fighting duplication/bloat across docs, CLAUDE.md, skills)
  - ../../../skills/task-summary/references/templates.md
Last updated: 2026-08-23
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
- A task doc's section set comes from `templates.md` alone — a sibling doc is never a shape source, and a poorly-fitting section is dropped rather than swapped for a borrowed one; the axes *inside* a section stay domain-chosen — see D-template-is-sole-shape-source (decisions/core.md)
- "Emit only sections that have content" lived inside the Minimal Template's fenced block while being cited as template-wide — a pointer resolving says nothing about the scope of what it points at — see the same decision

---

## Overview

Decisions about the MADR (decision-record) format itself: when to use it, how it's priced, and how the doc-editing skills must handle it as a structure distinct from a plain table. Split out of the plugin-maintenance whole-doc MADR (2026-07-24) as its own feature — previously a single flat `decisions/madr-structure.md` file, now nested one level as `madr-structure/decisions/core.md`. Sibling features: [agent-architecture](../agent-architecture/current.md), [doc-condensation](../doc-condensation/current.md).

---

## Task Status

All tasks completed. See Key Technical Decisions for details.

---

## Key Technical Decisions

Full ADR content lives in [decisions/core.md](decisions/core.md) — single file, 6 decisions, well under split threshold.

| # | Decision |
|---|----------|
| D8 | Whole-doc MADR is priced differently from per-decision MADR |
| D9 | Multi-mode knowledge-capture skills split canonical structure into `references/` |
| D10 | A skill/command sharing a name needs no wrapper command |
| D13 | A doc-format upgrade ships its condensation rule in the same change |
| D16 | MADR is the default `Key Technical Decisions` structure, not an opt-in upgrade (supersedes D8's "never default" clause) |
| D-template-is-sole-shape-source | The template owns a task doc's section set and headings; a sibling doc is never a shape source, while per-domain axes inside a section stay domain-chosen |

---

## Next Steps

### Deferred / accepted

- [ ] 🟡 No positive shape for a non-code task doc. A session writing the next proposal or bid knows to drop sections that carry no meaning, but has no worked example of what a legitimately-thinned Full Template looks like. Deferred because a third template was explicitly declined — the open question is whether one worked example belongs in `templates.md` without becoming a template.
- [ ] 🟡 Off-template docs are only ever found reactively, when a session opens one. Nothing sweeps `tasks/**` for structural drift, so a doc nobody revisits stays off-template forever. Accepted: no data is lost, only consistency.

---

## Last Session (2026-08-23)

- Added D-template-is-sole-shape-source after a session derived a new task doc's section set from one sibling bid doc instead of `templates.md`. Root cause was an existing sentence, not an absent one: `creating-and-updating.md` pitched drift at the level of "shape", which licensed the substitution.
- Edited `task-summary/SKILL.md` §2, `task-summary/references/creating-and-updating.md`, `task-summary/references/templates.md` and `_shared/references/adopt-vs-impose.md`. The `templates.md` edit widened "emit only sections that have content" to both templates — it had been scoped to the Minimal Template's fenced block while being cited as general.
- No domain-level registry doc exists — `plugin-maintenance` is just a folder holding sibling feature docs, cross-linked via `Related:` like any other related task docs.
