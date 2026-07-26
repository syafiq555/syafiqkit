<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log split by theme into decisions/*.md
Domain: plugin-maintenance/doc-condensation
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../agent-architecture/current.md (sibling feature — how generated agents inherit conventions + invoke sibling skills)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
Last updated: 2026-07-26 — D51: pruner-spawn floor for undersized files (issue #10, D44's successor), gated on a ratio of the hard ceiling so `_shared/` gains no threshold of its own. A gate needs its measurement named at the deciding step — 3rd recurrence, caught by the product reviewer
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation

## Quick Start (read this first in next session)

**Where we are**: How the plugin fights duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage. 20 committed decisions across 3 themed sub-files (counted, not incremented — `grep -h '^### D' decisions/*.md | wc -l`).

**Immediate next actions (in order)**: see `## Next Steps` — three open items are missing automated gates (version-file drift, ADR-id uniqueness, `references/*.md` size policy); one is a queued extraction (`read-summary` Read Order steps 5-6).

**Gotchas that will trip you**:
- A MADR block needs its own condensation rule shipped in the same change that introduces it — see D13 (../madr-structure/decisions/core.md)
- **A skill condensed BEFORE is an arrival-rate problem, not a density one — re-condensing is a treadmill.** Extract cold paths to `references/` + Step 3a's replace-or-route gate; a B/L ratio barely moving after extraction means the rules are irreducible. Every density pass also needs a shared-mechanism grep (a stale-tool prescription is invisible to byte counts) — see D23, D50 (decisions/structural-splits.md)
- Condensing an ENUMERATED set can drop an item's visibility while every pointer still resolves — verify the count the surrounding prose claims — see D50
- **A gate is only real if some step computes its inputs, named at the DECIDING step** — an unmeasured condition resolves to its permissive default, so the gate passes by doing nothing; a sibling step that measures later is not cover. 3rd recurrence — see D51 (decisions/bloat-generator-fixes.md)
- **Byte-neutrality is not content-preservation** — the cheapest offset for a new rule is often deleting the clause that carries an existing rule's *motivation*, and moving it to a file self-declared as a cold path is how the original failure recurs. Cut genuine duplication instead — see D51
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
| 1b | Size authority defers to the file — declared budget (D44) + undersized floor (D51) | ✅ |
| 2 | Structural splits — byte thresholds, companion files, plan-doc typing (D22, D26, D27, D33, D45, D46) | ✅ |
| 2b | Skill-file density (D23, D50) — D23's hand-condense regressed; D50 replaced it with extraction + an arrival-rate gate | ✅ (watch) |
| 3 | Duplication detection + leak-guard integrity (D37, D40, D12) | ✅ |
| 4 | Version-drift automated gate (plugin.json/marketplace.json) | ⏳ Pending — 3rd recurrence |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/bloat-generator-fixes.md](decisions/bloat-generator-fixes.md) | *Where does the plugin fix doc bloat — at the generator (task-summary rules) or by hand-trimming? What structural levers exist for over-budget CLAUDE.md? What if the file declares its own budget, or is far UNDER it?* (D3, D6, D17, D18, D19, D20, D44, D51) |
| [decisions/structural-splits.md](decisions/structural-splits.md) | *When does a doc/CLAUDE.md/skill need a structural split (byte thresholds, companion files, plan-doc typing) instead of denser prose? Why does re-condensing the same skill keep failing?* (D22, D23, D26, D27, D33, D45, D46, D50) |
| [decisions/duplication-and-integrity.md](decisions/duplication-and-integrity.md) | *How does the plugin catch duplicated facts (within/across docs) and verify a fix actually landed everywhere?* (D37, D40, D12, demoted D2/D5/D7/D11) |

---

## Next Steps

**Automated gates**
- [ ] `plugin.json`/`marketplace.json` version drift — 3rd occurrence (D26 2026-07-15, then 2026-07-17, 2026-07-22). A bump to one file without the other passes silently; a pre-commit check or single-source-of-truth version file is the open fix.
- [ ] ADR-id uniqueness has no post-write gate — the same "silently passes" shape as the row above. Mechanism + fix owned by [../agent-architecture/current.md](../agent-architecture/current.md) Next Steps. This feature's D40/D44 were the older ids and kept their numbers; nothing further is owed here.

**Arrival-rate gate — open half (D50)**
- [ ] The gate only fires inside `update-plugin`, but rules most often arrive as **direct hand-edits mid-session** (how D50's own rules were captured), and `/done` Step 5 is conditional-by-default. So the dominant arrival path reaches no checkpoint. Candidate fix: `update-claude-docs` notes any session that hand-edited a `skills/*/SKILL.md` body and routes it to Step 3a before session end.
- [ ] `references/*.md` files carry no size policy — `declared-budget.md` is CLAUDE.md-scoped and Step 3a's ~90 B/L gate names SKILL.md only. Same failure mode one hop down; 5-6KB each today, so decide rather than defer indefinitely: extend the gate to a skill's own `references/` siblings, or declare them out of scope. Now demonstrated live: D51 edited `_shared/references/declared-budget.md` twice in one pass (79.0 → 94.0 → 81.0 B/L), the overshoot caught only by measuring on purpose. Nothing would have flagged it.

**Queued extraction (`read-summary`, 199.8 B/L — 2.2× the gate)**
- [ ] Extract Read Order steps 5-6's **path taxonomy only** (Layer/Subdir/Domain bullets — mechanical lookup, ~4.9KB / 28% of the file) to `references/`, projected to land near ~130 B/L. ⚠️ Leave both companion `⚠️` warnings on the hot path: L61 self-describes the sibling-repo step as "the one most often skipped" and L62 warns a two-repo session never reaches step 5's Companion bullet, so routing those behind a pointer is the same trap D51 avoided (see the byte-neutrality gotcha). Per D50 this is the only remaining lever — re-condensing has regressed twice.

---

## Last Session (2026-07-26)

- **All four open GitHub issues closed; 2 of 4 needed no code.** #12 was already fixed in the working tree with 1.126.0 bumped in both version files; #9 shipped as D44 in `3179e68` and was only left unclosed. Reading tree state first (`git status -s` + the diff, hashed to prove non-interference) is what stopped a re-implementation over another session's unshipped work. Triage the whole set before writing anything — now a global CLAUDE.md rule.
- **D51** (#10): the pruner-spawn floor, D44's successor. Ratio of the hard ceiling rather than a fourth absolute number, so `_shared/` gains no threshold of its own and one row covers a declared 460 and the 350 default. Verified `condense-claude-md` L48 already gates its own split levers on over-budget, so no sibling patch was owed.
- **#11**: `read-summary`'s doc-drift routing and its investigation exit gate contradicted each other 37 lines apart. Split by finding kind (doc drift = maintenance, routes now; code defect = `AskUserQuestion`). The reconciling branch already existed in `references/doc-authority.md` L11 — the condensed hot-path copy had dropped it, so the fix restored a distinction rather than inventing one.
- **`/done` with all three agents caught three defects in the same pass's work.** Product reviewer 🔴: D51's gate named two inputs nothing computed before Step 4 read them, so it passed by spawning anyway — the 3rd recurrence of D50's unenforced-gate shape, now a § Maintenance rule. Reviewer: the ratio was ambiguous against a soft/hard pair (100 vs 175), and a conjunction fallthrough left under-ratio-but-grown files matching no row. All six boundary cases re-traced after fixing.
- Simplifier: 4 line-neutral cuts (−338 bytes) and one recommendation now queued in Next Steps — extract `read-summary`'s path taxonomy only, leaving the two most-skipped warnings on the hot path.
