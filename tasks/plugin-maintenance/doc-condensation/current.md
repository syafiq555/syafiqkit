<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log split by theme into decisions/*.md
Domain: plugin-maintenance/doc-condensation
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../agent-architecture/current.md (sibling feature — how generated agents inherit conventions + invoke sibling skills)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
Last updated: 2026-07-26 — D50: skill-file bloat rediagnosed as arrival-rate, not density (D23's hand-condense had regressed past its own starting point). Cold paths extracted to references/, replace-or-route gate added to update-plugin Step 3a; Quick Start re-trimmed to budget
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation

## Quick Start (read this first in next session)

**Where we are**: How the plugin fights duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage. 19 committed decisions across 3 themed sub-files (counted, not incremented — `grep -h '^### D' decisions/*.md | wc -l`).

**Immediate next actions (in order)**: see `## Next Steps` — both open items are missing automated gates (version-file drift, ADR-id uniqueness).

**Gotchas that will trip you**:
- A MADR block needs its own condensation rule shipped in the same change that introduces it — see D13 (../madr-structure/decisions/core.md)
- **A skill condensed BEFORE is an arrival-rate problem, not a density one — re-condensing is a treadmill.** Extract cold paths to `references/` + Step 3a's replace-or-route gate; a B/L ratio barely moving after extraction means the rules are irreducible. Every density pass also needs a shared-mechanism grep (a stale-tool prescription is invisible to byte counts) — see D23, D50 (decisions/structural-splits.md)
- Condensing an ENUMERATED set can drop an item's visibility while every pointer still resolves — verify the count the surrounding prose claims — see D50
- **`D<n>` ids are one sequence shared by all three sibling features, and renumbering to fix a collision has itself caused one.** Re-run `uniq -d` across all three `*/decisions/*.md` AFTER writing — testing by output, not exit code (`uniq -d` exits 0 either way) — see ../agent-architecture/current.md Next Steps
- Every scan/sweep here needs a must-hit control before "zero results" means done — see ../agent-architecture/decisions/verification-rigor.md D25
- The condensation unit is the doc SET (`current.md` + `decisions/*.md`), never the named file — a member holding 2× the index's bytes goes untouched if the pass scopes to args. A split index keeps THREE things: Quick Start, doc-wide tables, routing — canonical in `task-summary/references/templates.md` L136 (D41 is a retired id, cited in prose only)
- Structural-split traps, all in decisions/structural-splits.md: plan/spec docs never move into `decisions/` but must be routed (D27) · a rewrite's "no rows deleted" check misses collateral cuts (D27) · one companion file per topic cluster, not a grab-bag (D45) · "split by category" is a shape, not a location — the lever needs an over-budget source (D46)
- A required section may lose every row but never its heading — leave a pointer row instead of deleting it
- A CLAUDE.md delegating to companion files makes a 0-hit `grep` unreliable for classifying a rule "New" — grep the `> 📖` targets first
- `plugin.json`/`marketplace.json` version drift recurs and passes silently — see D26 and `## Next Steps`

---

## Overview

Decisions about fighting duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage. Split out of the plugin-maintenance whole-doc MADR (2026-07-24) as its own feature, one level up from the prior `decisions/doc-condensation.md` router. Sibling features: [agent-architecture](../agent-architecture/current.md), [madr-structure](../madr-structure/current.md).

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Fix bloat at the generator, not by hand-trimming (D3, D6, D17, D18, D19, D20) | ✅ |
| 2 | Structural splits — byte thresholds, companion files, plan-doc typing (D22, D26, D27, D33, D45, D46) | ✅ |
| 2b | Skill-file density (D23, D50) — D23's hand-condense regressed; D50 replaced it with extraction + an arrival-rate gate | ✅ (watch) |
| 3 | Duplication detection + leak-guard integrity (D37, D40, D12) | ✅ |
| 4 | Version-drift automated gate (plugin.json/marketplace.json) | ⏳ Pending — 3rd recurrence |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/bloat-generator-fixes.md](decisions/bloat-generator-fixes.md) | *Where does the plugin fix doc bloat — at the generator (task-summary rules) or by hand-trimming? What structural levers exist for over-budget CLAUDE.md? What if the file declares its own budget?* (D3, D6, D17, D18, D19, D20, D44) |
| [decisions/structural-splits.md](decisions/structural-splits.md) | *When does a doc/CLAUDE.md/skill need a structural split (byte thresholds, companion files, plan-doc typing) instead of denser prose? Why does re-condensing the same skill keep failing?* (D22, D23, D26, D27, D33, D45, D46, D50) |
| [decisions/duplication-and-integrity.md](decisions/duplication-and-integrity.md) | *How does the plugin catch duplicated facts (within/across docs) and verify a fix actually landed everywhere?* (D37, D40, D12, demoted D2/D5/D7/D11) |

---

## Next Steps

**Automated gates**
- [ ] `plugin.json`/`marketplace.json` version drift — 3rd occurrence (D26 2026-07-15, then 2026-07-17, 2026-07-22). A bump to one file without the other passes silently; a pre-commit check or single-source-of-truth version file is the open fix.
- [ ] ADR-id uniqueness has no post-write gate — the same "silently passes" shape as the row above. Mechanism + fix owned by [../agent-architecture/current.md](../agent-architecture/current.md) Next Steps. This feature's D40/D44 were the older ids and kept their numbers; nothing further is owed here.

**Arrival-rate gate — open half (D50)**
- [ ] The gate only fires inside `update-plugin`, but rules most often arrive as **direct hand-edits mid-session** (how D50's own rules were captured), and `/done` Step 5 is conditional-by-default. So the dominant arrival path reaches no checkpoint. Candidate fix: `update-claude-docs` notes any session that hand-edited a `skills/*/SKILL.md` body and routes it to Step 3a before session end.
- [ ] `references/*.md` files carry no size policy — `declared-budget.md` is CLAUDE.md-scoped and Step 3a's ~90 B/L gate names SKILL.md only. Same failure mode one hop down; 5-6KB each today, so decide rather than defer indefinitely: extend the gate to a skill's own `references/` siblings, or declare them out of scope.

---

## Last Session (2026-07-26)

- Full-plugin density sweep → **D50**. Three skills sat 2.3× over the ~80-90 B/L threshold, two of them the same files D23 hand-condensed in v1.62/1.63 — they had regrown past their pre-fix state, so the diagnosis moved from density to arrival rate. Cold paths extracted to `references/` (`condense-claude-md` −37%, `read-summary` −21%, `condense-task-doc` −7%); `update-plugin` Step 3a gained a replace-or-route gate + a retirement rule. Shipped as 1.124.0.
- Shared-mechanism grep found a live bug the byte scan could not see: **four skill files still prescribed `rg`**, abandoned globally 2026-07-13 — including `read-summary`, which prescribed it 62 lines below its own warning against it. All four now `grep -rl`.
- The write-mode rule was found in three homes (Process step + Hard rules + `_shared/reference`) across two skills; collapsed to the shared reference alone. Two integrity defects this pass introduced were caught and fixed: a three-levers claim left stale by the condensed Restructuring list, and a decision count *incremented* rather than recounted (a pre-existing wrong figure, now counted with the command written beside it).
- **`/done` with all three agents (user asked explicitly, despite an all-markdown diff).** Reviewer: 0 findings across 6 checks. Simplifier: 1 cut (worked-incident figures out of `update-plugin`'s callout — the CHANGELOG owns them). Product reviewer found the one that mattered: **D50's gate shipped unenforced** — Step 3a stated it, Step 4 never checked it, i.e. the same prose-only weakness that let D23 regress. Fixed in-session; Step 3a also gained the ratio one-liner it had been missing.
- Open half of D50 recorded in Next Steps: the gate is reachable only from `update-plugin` while rules mostly arrive as hand-edits, and `references/*.md` files inherit no budget of their own.
