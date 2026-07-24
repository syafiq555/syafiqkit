<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log split by theme into decisions/*.md
Domain: plugin-maintenance/doc-condensation
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../agent-architecture/current.md (sibling feature — how generated agents inherit conventions + invoke sibling skills)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
Last updated: 2026-07-24 — both Next Steps items patched (update-plugin Step 5 fencing; condense-task-doc/templates.md multi-domain fan-out case)
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation

## Quick Start (read this first in next session)

**Where we are**: How the plugin fights duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage. 15 committed decisions across 3 themed sub-files.

**Immediate next actions (in order)**:
1. `plugin.json`/`marketplace.json` version drift hit its 3rd occurrence (D26 2026-07-15, 2026-07-17, 2026-07-22) — a pre-commit check or single-source-of-truth version file is still the only open item.

**Gotchas that will trip you**:
- A MADR block needs its own condensation rule shipped in the same change that introduces it — see D13 (../madr-structure/decisions/core.md)
- Skill-file bloat (SKILL.md density) is a distinct class from CLAUDE.md/task-doc bloat; `update-plugin` Step 3a owns the checklist — see D23 (decisions/structural-splits.md)
- A scan's "zero results = done" needs a must-hit control (see ../agent-architecture/decisions/verification-rigor.md D25) — same shape recurs in doc-condensation's own duplication sweeps
- Pre-existing plan/spec docs sitting next to a split `current.md`/`decisions/` set are a different document type, never move them into `decisions/` — but their routing table must still enumerate them — see D27 (decisions/structural-splits.md)
- A large doc rewrite's "no rows deleted" check only covers the change's intended content — it misses collateral cuts to unrelated sections; requires a full before/after section diff — see D27 (decisions/structural-splits.md)
- A diff adding a `<content>`-leak guard is not proof the leak is gone — grep the diff's own touched files AND sweep the whole repo for the literal tag — see D40 (decisions/duplication-and-integrity.md)
- `plugin.json`/`marketplace.json` version drift recurs (3rd occurrence, 2026-07-15 D26 → 2026-07-17 → 2026-07-22): a version bump to one file without the other passes silently, no automated gate exists
- Condensation/duplication-scan units are the doc SET (`current.md` + `decisions/*.md`), never the single named file — a set member holding 2× the index's bytes goes untouched if the pass scopes to args only
- A split index (`current.md` + `decisions/<theme>.md`) keeps THREE things, not two — Quick Start, doc-wide operational tables, and a routing table. Only per-theme detail moves down — see D41 (decisions/structural-splits.md)
- A multi-domain fan-out (one whole-doc MADR → several sibling feature folders, no surviving parent index) has NO home for doc-wide content that isn't any one theme's — a skill registry table or cross-domain decision index gets silently dropped instead of migrated. `condense-task-doc`'s split rule only covers the single-domain case (index + its own `decisions/`); this session's `plugin-maintenance/current.md` → 3 sibling folders split had no index tier, so its `### Current Skills` and `## Architecture Decisions Index` tables had nowhere to go and were caught only by `/done`'s referential-integrity pass, not by the split itself
- A required section (`Task Status`, `Bugs Fixed`, `Critical Gotchas`, `Next Steps`) may lose every row but never its heading — leave a pointer row rather than deleting the section
- A CLAUDE.md that delegates detail to companion files (`> 📖` pointers) makes a 0-hit `grep` unreliable for classifying a rule as "New" — `update-claude-docs` Step 1 now greps companion targets before classifying
- Inserting a new warning/callout BETWEEN two existing Markdown table rows splits one GFM table into two — move the callout to a table boundary instead

---

## Overview

Decisions about fighting duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage. Split out of the plugin-maintenance whole-doc MADR (2026-07-24) as its own feature, one level up from the prior `decisions/doc-condensation.md` router. Sibling features: [agent-architecture](../agent-architecture/current.md), [madr-structure](../madr-structure/current.md).

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Fix bloat at the generator, not by hand-trimming (D3, D6, D17, D18, D19, D20) | ✅ |
| 2 | Structural splits — byte thresholds, skill density, companion files, plan-doc typing (D22, D23, D26, D27, D33) | ✅ |
| 3 | Duplication detection + leak-guard integrity (D37, D40, D12) | ✅ |
| 4 | Version-drift automated gate (plugin.json/marketplace.json) | ⏳ Pending — 3rd recurrence |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/bloat-generator-fixes.md](decisions/bloat-generator-fixes.md) | *Where does the plugin fix doc bloat — at the generator (task-summary rules) or by hand-trimming? What structural levers exist for over-budget CLAUDE.md?* (D3, D6, D17, D18, D19, D20) |
| [decisions/structural-splits.md](decisions/structural-splits.md) | *When does a doc/CLAUDE.md/skill need a structural split (byte thresholds, companion files, plan-doc typing) instead of denser prose?* (D22, D23, D26, D27, D33) |
| [decisions/duplication-and-integrity.md](decisions/duplication-and-integrity.md) | *How does the plugin catch duplicated facts (within/across docs) and verify a fix actually landed everywhere?* (D37, D40, D12, demoted D2/D5/D7/D11) |

---

## Next Steps

_(none open)_

---

## Last Session (2026-07-24)

- Split out of the plugin-maintenance whole-doc MADR into its own feature folder (`tasks/plugin-maintenance/doc-condensation/`) — `decisions/*.md` sub-files moved as-is from the prior `decisions/doc-condensation/` router path; this `current.md` is new, authored from the prior single doc's Quick Start/Gotchas/Next Steps slices covering this theme.
- No domain-level registry doc exists — `plugin-maintenance` is just a folder holding 3 sibling feature docs, cross-linked via `Related:` like any other related task docs.
- `/done`'s referential-integrity pass found the split dropped 2 doc-wide tables with no new home (`### Current Skills`, `## Architecture Decisions Index`) and 7 files still pointing at the deleted `tasks/plugin-maintenance/current.md` path. Fixed: pointers repointed at `{agent-architecture,doc-condensation,madr-structure}/current.md`; the Skills-registry pointer removed outright (CLAUDE.md + README.md are the 2 canonical copies now, user declined recreating a 3rd); the Architecture-Decisions-append instruction repointed at the relevant theme's `decisions/*.md`.
- Patched both open Next Steps items: `update-plugin` Step 5.4 + Output section now fence the consumer report (pointer text above, report inside its own labelled fence, nothing after — matching `ship` 5.8/`gchat-format`'s established pattern). `task-summary/references/templates.md` gained a "Multi-domain fan-out: no surviving parent index" subsection covering the case this session's own `plugin-maintenance` split hit; `condense-task-doc` Step 2 now points to it.
