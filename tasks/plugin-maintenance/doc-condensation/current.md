<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log split by theme into decisions/*.md
Domain: plugin-maintenance/doc-condensation
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../agent-architecture/current.md (sibling feature — how generated agents inherit conventions + invoke sibling skills)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
  - ../external-guidance/current.md (D55/D56/D59/D61 — how outside guidance, prose or tool-generated, gets graded against this plugin's measurements; owns the Claude-5 article verdicts D54 only summarizes, the `/doctor` report verdicts, D59's inward pass over this plugin's own skills + CLAUDE.md corpus, and D61's consumer-run findings — including the arrival-rate measurement counting an in-window CREATION as growth, which any ranking built on D50's gate must disqualify)
Last updated: 2026-07-30 — D62 shipped in v1.136.11: a stale pointer passing its own staleness grep (the direction D-classification's rule didn't name) closed via `pointer-discipline.md`; the three-owner empty-diff rule consolidated into `verifying-a-write-landed.md`
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation

## Quick Start (read this first in next session)

**Where we are**: How the plugin fights duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage. 23 committed decisions across 3 themed sub-files (counted, not incremented — `grep -h '^### D' decisions/*.md | wc -l`).

**Immediate next actions (in order)**: see `## Next Steps` — two open items are missing automated gates (version-file drift, ADR-id uniqueness); the rest is watching whether Gate B actually moves the 2.6:1 add/remove ratio, plus one over-budget doc set (this doc set itself — see below).

**Gotchas that will trip you**:
- A MADR block needs its own condensation rule shipped in the same change that introduces it — see D13 (../madr-structure/decisions/core.md)
- **A skill condensed BEFORE is an arrival-rate problem, not a density one — re-condensing is a treadmill.** Extract cold paths to `references/` + Step 3a's replace-or-route gate; a B/L ratio barely moving after extraction means the rules are irreducible. Every density pass also needs a shared-mechanism grep (a stale-tool prescription is invisible to byte counts) — see D23, D50 (decisions/structural-splits.md)
- Condensing an ENUMERATED set can drop an item's visibility while every pointer still resolves — verify the count the surrounding prose claims — see D50
- **A `references/*.md` file is OUT of the ~90 B/L gate — that ratio measures a hot path, a reference is a cold-path lookup whose correct shape is a dense table.** It owes single-topic + a symptom-naming pointer + ~6KB *for prose*; a CATALOG is exempt and grows with what it catalogs. The test is how the file is READ — see D54
- **A marker downgrade is presentation, not condensation — it escapes D50's treadmill because the stock of rules is unchanged.** Verify it by diffing sorted word SETS, never `wc -w`: a stripped marker counts as a word, so a formatting-only edit reports a deficit that reads as deleted rules — see D54
- **A gate is only real if some step computes its inputs, named at the DECIDING step** — an unmeasured condition resolves to its permissive default, so the gate passes by doing nothing; a sibling step that measures later is not cover. 3rd recurrence — see D51 (decisions/bloat-generator-fixes.md)
- **Byte-neutrality is not content-preservation** — the cheapest offset for a new rule is often deleting the clause that carries an existing rule's *motivation*, and moving it to a file self-declared as a cold path is how the original failure recurs. Cut genuine duplication instead — see D51
- **`D<n>` ids are one sequence shared by all three sibling features, and renumbering to fix a collision has itself caused one.** Re-run `uniq -d` across all three `*/decisions/*.md` AFTER writing — testing by output, not exit code (`uniq -d` exits 0 either way) — see ../agent-architecture/current.md Next Steps
- Every scan/sweep here needs a must-hit control before "zero results" means done — see ../agent-architecture/decisions/verification-rigor.md D25
- The condensation unit is the doc SET (`current.md` + `decisions/*.md`), never the named file — a member holding 2× the index's bytes goes untouched if the pass scopes to args. A split index keeps THREE things: Quick Start, doc-wide tables, routing — canonical in `task-summary/references/templates.md` L136 (D41 is a retired id, cited in prose only)
- Structural-split traps, all in decisions/structural-splits.md: plan/spec docs never move into `decisions/` but must be routed (D27) · a rewrite's "no rows deleted" check misses collateral cuts (D27) · one companion file per topic cluster, not a grab-bag (D45) · "split by category" is a shape, not a location — the lever needs an over-budget source (D46)
- A required section may lose every row but never its heading — leave a pointer row instead of deleting it
- A CLAUDE.md delegating to companion files makes a 0-hit `grep` unreliable for classifying a rule "New" — grep the `> 📖` targets first
- `plugin.json`/`marketplace.json` version drift recurs and passes silently — see D26 and `## Next Steps`
- **A pointer's OWN line can be the only grep hit for its topic — that reads as "not covered," not as "descend into the companion."** The stale content sits one hop away, undetected precisely because the grep succeeded — see D62

---

## Overview

Decisions about fighting duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage. Split out of the plugin-maintenance whole-doc MADR (2026-07-24) as its own feature, one level up from the prior `decisions/doc-condensation.md` router. Sibling features: [agent-architecture](../agent-architecture/current.md), [madr-structure](../madr-structure/current.md).

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | Fix bloat at the generator, not by hand-trimming (D3, D6, D17, D18, D19, D20) | ✅ |
| 1b | Size authority defers to the file — declared budget (D44) + undersized floor (D51) | ✅ |
| 2 | Structural splits — byte thresholds, companion files, plan-doc typing (D22, D26, D27, D33, D45, D46, D62) | ✅ |
| 2b | Skill-file density (D23, D50, D54) — D23's hand-condense regressed; D50 replaced it with extraction + an arrival-rate gate; D54 closed the gate's open half (Gate B) and scoped `references/*.md` out of it | ✅ (watch the ratio) |
| 3 | Duplication detection + leak-guard integrity (D37, D40, D12) | ✅ |
| 4 | Version-drift automated gate (plugin.json/marketplace.json) | ⏳ Pending — 3rd recurrence |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/bloat-generator-fixes.md](decisions/bloat-generator-fixes.md) | *Where does the plugin fix doc bloat — at the generator (task-summary rules) or by hand-trimming? What structural levers exist for over-budget CLAUDE.md? What if the file declares its own budget, or is far UNDER it? How does the `/commit` staleness gate avoid lexical false positives?* (D3, D6, D17, D18, D19, D20, D44, D51, D57) |
| [decisions/structural-splits.md](decisions/structural-splits.md) | *When does a doc/CLAUDE.md/skill need a structural split (byte thresholds, companion files, plan-doc typing) instead of denser prose? Why does re-condensing the same skill keep failing? What checkpoint catches a rule that arrives with no defect, what size policy applies to `references/*.md`, and why does a stale pointer pass the same grep a missing rule fails?* (D22, D23, D26, D27, D33, D45, D46, D50, D54, D62) |
| [decisions/duplication-and-integrity.md](decisions/duplication-and-integrity.md) | *How does the plugin catch duplicated facts (within/across docs) and verify a fix actually landed everywhere?* (D37, D40, D12, demoted D2/D5/D7/D11) |

---

## Next Steps

**Automated gates**
- [ ] `plugin.json`/`marketplace.json` version drift — 3rd occurrence (D26 2026-07-15, then 2026-07-17, 2026-07-22). A bump to one file without the other passes silently; a pre-commit check or single-source-of-truth version file is the open fix.
- [ ] ADR-id uniqueness has no post-write gate — the same "silently passes" shape as the row above. Mechanism + fix owned by [../agent-architecture/current.md](../agent-architecture/current.md) Next Steps. This feature's D40/D44 were the older ids and kept their numbers; nothing further is owed here.

**Arrival-rate gate — watch, now that both halves are closed (D54)**
- [ ] Re-measure the add/remove ratio after a few sessions run under Gate B — `git log --since=... --numstat -- 'skills/**/*.md'`. The gate's purpose is moving 2.6:1 toward 1:1; a one-time byte drop is not the success criterion. If the ratio has not moved, the remaining leak is sessions that never run `/done` at all — an accepted limit to state here rather than re-engineer.
- [ ] `condense-claude-md/references/structural-splits.md` is 6,515 bytes against the new ~6KB prose-reference ceiling — prose, not a catalog (6 table rows across 3 prose sections). First live edge case of that rule. Check it on the next density pass through `condense-claude-md`; do not split a 53-line file, which would make it harder to use.

**Agent templates vs the Bootstrap pattern (deferred from v1.131.0's plan, Phase 4)**
- [ ] `skills/agent-setup/templates/*.template.md` total **77KB — 12.5% of the corpus**, with `browser-verifier.template.md` alone at 15KB, larger than most skills. The Bootstrap pattern's premise is that agents read CLAUDE.md *at runtime* rather than carry injected content, so templates this size suggest it is leaking. Audit for content an agent would read anyway; **preserve** `browser-verifier`'s `USER-TRIGGERED ONLY` gate, which guards real unauthorised spend. Lower priority than the gates above — templates are read once at generation, not per invocation.

**Doc size**
- [ ] This doc SET is 544 lines / 63KB against a 300-line budget — pre-existing, not this session's growth. The index reads healthy at 87 lines, which is what hides it. Route to `condense-task-doc`; don't hand-condense.

---

## Last Session (2026-07-30)

- **D62 — a stale pointer passes the exact grep that a missing rule fails.** A remote-cli session's routing grep hit only the global CLAUDE.md's own `> 📖` pointer line, read as "not covered," and left the companion's stale content unfixed. `pointer-discipline.md` (new, 2.5KB) closes it: a match inside a pointer line must trigger a descend-and-reclassify, not a "new" verdict.
- **Same fix pass, second gap: the empty-`git diff`-is-inconclusive rule had 3 owners with the same missing case.** `done`, `two-tier-condense`, and `update-claude-docs`'s Validate step each independently warned about a staged target and a CWD-relative pathspec, but none named a gitignored/untracked target as the one cause no git command can ever resolve. Consolidated into `verifying-a-write-landed.md` (new, 2.0KB); all three now point to it.
- **Third, smaller extraction**: `done`'s Step-1 re-run rule (don't race a second copy of a long mutating verification command) moved to `long-running-commands.md` (new).
- **Related but distinct rule landed in `task-summary`**: `D-N` inside one feature's *split* `decisions/*.md` sub-files is unique per domain, not per file — doesn't change this doc's own cross-feature global-uniqueness convention.
- Full trio review (reviewer/simplifier/product-reviewer) on the diff: 0 real findings; 2 minor product-reviewer clarity notes applied inline.
