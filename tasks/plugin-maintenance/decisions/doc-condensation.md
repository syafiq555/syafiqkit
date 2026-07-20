<!--LLM-CONTEXT
Status: Reference (ROUTER — this file holds no ADR content, see Sub-Files below)
Domain: plugin-maintenance/doc-condensation
Gotchas: see each sub-file's own Gotchas block
Related: ../current.md (index), ../agent-architecture.md, ../madr-structure.md
Last updated: 2026-07-20 — split into 3 theme sub-files (was 310 lines / 34.2KB, over budget)
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation Decisions (Router)

Decisions about fighting duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage.

This file is a router — full ADR content lives in the sub-files below, grouped by theme.

## Sub-Files

| File | Read if you're asking |
|------|------------------------|
| [doc-condensation/bloat-generator-fixes.md](doc-condensation/bloat-generator-fixes.md) | *Where does the plugin fix doc bloat — at the generator (task-summary rules) or by hand-trimming? What structural levers exist for over-budget CLAUDE.md?* (D3, D6, D17, D18, D19, D20) |
| [doc-condensation/structural-splits.md](doc-condensation/structural-splits.md) | *When does a doc/CLAUDE.md/skill need a structural split (byte thresholds, companion files, plan-doc typing) instead of denser prose?* (D22, D23, D26, D27, D33) |
| [doc-condensation/duplication-and-integrity.md](doc-condensation/duplication-and-integrity.md) | *How does the plugin catch duplicated facts (within/across docs) and verify a fix actually landed everywhere?* (D37, D40, D12, demoted D2/D5/D7/D11) |

⚠️ **D32 renamed to D40** during this split (duplication-and-integrity.md) — the pre-split doc had two unrelated decisions both numbered D32 (this file's leak-guard rule, and agent-architecture.md's parallelism rule). agent-architecture's D32 (parallelism/`run_in_background`) is unaffected and unchanged.

**Status**: Reference (router) · Split 2026-07-20 from a single 310-line file, over the 300-line threshold with no room left to condense (every ADR earns its place per D3/D13's own rule).
