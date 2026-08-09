<!--LLM-CONTEXT
Status: Reference (ongoing) — whole-doc MADR log split by theme into decisions/*.md
Domain: plugin-maintenance/doc-condensation
Gotchas: see "Gotchas that will trip you" in Quick Start below — this line is a pointer, not a copy
Related:
  - ../agent-architecture/current.md (sibling feature — how generated agents inherit conventions + invoke sibling skills)
  - ../madr-structure/current.md (sibling feature — the MADR format itself)
  - ../external-guidance/current.md (D55/D56/D59/D61 — how outside guidance, prose or tool-generated, gets graded against this plugin's measurements; owns the Claude-5 article verdicts D54 only summarizes, the `/doctor` report verdicts, D59's inward pass over this plugin's own skills + CLAUDE.md corpus, and D61's consumer-run findings — including the arrival-rate measurement counting an in-window CREATION as growth, which any ranking built on D50's gate must disqualify)
Last updated: 2026-08-09 — a five-agent `unhobble-instructions` batch inverted two passages by deleting their stated limitations as if hedging ("`ListAgents` cannot tell you which project a peer is in" → "checking prevents contested edits"); the fact-vs-constraint test now names that shape, and the identifier-survival sweep is recorded as blind to it, since both defects kept every identifier and changed only the claim (D-limitation-reads-as-hedging). Prior (2026-08-07): reversed the "no spawned agent" condensation-drafting rule — a new `haiku` skill now owns dispatch + mandatory verification, `two-tier-condense.md` permits delegating Draft (not Verify) to it, measured at 35% byte cut with rules intact on a real run (D-haiku-condense-delegation). Prior (2026-08-02): `/done`'s own review pass caught a real D66 collision (two unrelated decisions independently minted the same id; renumbered one to D67) and a false-0 in `read-summary`'s router-detection grep, verified only against an external project's ID convention at 1.137.0.
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation

## Quick Start (read this first in next session)

**Where we are**: How the plugin fights duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage. 31 committed decisions across 3 themed sub-files (counted, not incremented — `grep -h '^### D' decisions/*.md | wc -l`). A distinct lever shipped 2026-08-01: `skills/unhobble-instructions/SKILL.md` targets overconstraint (rigid `⚠️`/`Tell:`/bolded imperatives vs. genuine fact) rather than bloat/byte-count — the two levers are not substitutes for each other (D50). Its 2nd real run (same day) caught the skill softening a rule that D57 had deliberately hardened (D64). 2026-08-02: `condense-task-doc`'s own aggregate line/byte target passed on a real Dourr run while several sentences stayed 500+ characters — fixed with a direct per-line length check run after row-existence (D67). 2026-08-07: the "no spawned agent" condensation-draft rule reversed — a new `haiku` skill now owns dispatch + mandatory verification, drafting may delegate to it while verifying may not (D-haiku-condense-delegation).

**Immediate next actions (in order)**: see `## Next Steps` — two open items are missing automated gates (version-file drift, ADR-id uniqueness); the rest is watching whether Gate B actually moves the 2.6:1 add/remove ratio, plus one over-budget doc set (this doc set itself — see below).

**Gotchas that will trip you**:
- A MADR block needs its own condensation rule shipped in the same change that introduces it — see D13 (../madr-structure/decisions/core.md)
- **A skill condensed BEFORE is an arrival-rate problem, not a density one — re-condensing is a treadmill.** Extract cold paths to `references/` + Step 3a's replace-or-route gate; a B/L ratio barely moving after extraction means the rules are irreducible. Every density pass also needs a shared-mechanism grep (a stale-tool prescription is invisible to byte counts) — see D23, D50 (decisions/structural-splits.md)
- Condensing an ENUMERATED set can drop an item's visibility while every pointer still resolves — verify the count the surrounding prose claims — see D50
- **A `references/*.md` file is OUT of the ~90 B/L gate — that ratio measures a hot path, a reference is a cold-path lookup whose correct shape is a dense table.** It owes single-topic + a symptom-naming pointer + ~6KB *for prose*; a CATALOG is exempt and grows with what it catalogs. The test is how the file is READ — see D54
- **A marker downgrade is presentation, not condensation — it escapes D50's treadmill because the stock of rules is unchanged.** Verify it by diffing sorted word SETS, never `wc -w`: a stripped marker counts as a word, so a formatting-only edit reports a deficit that reads as deleted rules — see D54
- **A stated limitation is the fact an unhobbling pass deletes first** — text saying what a tool can't do or what a check doesn't prove reads as hedging, and cutting it leaves the confident half asserting what the original withheld. No token check sees this: the identifiers all survive and only the claim changes, so verification is reading the passage against its original and asking what a reader would now *do* differently — see D-limitation-reads-as-hedging (decisions/structural-splits.md)
- **A gate is only real if some step computes its inputs, named at the DECIDING step** — an unmeasured condition resolves to its permissive default, so the gate passes by doing nothing; a sibling step that measures later is not cover. 3rd recurrence — see D51 (decisions/bloat-generator-fixes.md)
- **Byte-neutrality is not content-preservation** — the cheapest offset for a new rule is often deleting the clause that carries an existing rule's *motivation*, and moving it to a file self-declared as a cold path is how the original failure recurs. Cut genuine duplication instead — see D51
- **`D<n>` ids are one sequence shared by all three sibling features, and renumbering to fix a collision has itself caused one.** Re-run `uniq -d` across all three `*/decisions/*.md` AFTER writing — testing by output, not exit code (`uniq -d` exits 0 either way) — see ../agent-architecture/current.md Next Steps
- Every scan/sweep here needs a must-hit control before "zero results" means done — see ../agent-architecture/decisions/verification-rigor.md D25
- The condensation unit is the doc SET (`current.md` + `decisions/*.md`), never the named file — a member holding 2× the index's bytes goes untouched if the pass scopes to args. A split index keeps THREE things: Quick Start, doc-wide tables, routing — canonical in `task-summary/references/templates.md`'s "Splitting a whole-doc MADR further" section (D41 is a retired id, cited in prose only)
- Structural-split traps, all in decisions/structural-splits.md: plan/spec docs never move into `decisions/` but must be routed (D27) · a rewrite's "no rows deleted" check misses collateral cuts (D27) · one companion file per topic cluster, not a grab-bag (D45) · "split by category" is a shape, not a location — the lever needs an over-budget source (D46)
- A required section may lose every row but never its heading — leave a pointer row instead of deleting it
- A CLAUDE.md delegating to companion files makes a 0-hit `grep` unreliable for classifying a rule "New" — grep the `> 📖` targets first
- `plugin.json`/`marketplace.json` version drift recurs and passes silently — see D26 and `## Next Steps`
- **A pointer's OWN line can be the only grep hit for its topic — that reads as "not covered," not as "descend into the companion."** The stale content sits one hop away, undetected precisely because the grep succeeded — see D62
- **A judgement-vs-value test now governs CLAUDE.md entry format, not "table is always the default."** Prose for "it depends, reason about it," a table row for "the answer is this specific string," prose+companion-pointer for a signal mixing both. Applies to `update-claude-docs`'s Create-mode SCAFFOLDING TEMPLATES too, not just its live capture rule — the two are separate code paths and fixing one without the other leaves a freshly created file inconsistent with one that grew through normal capture — see D63
- **An absolutist-looking rule ("no exceptions," "no judgment permitted") can be the surviving fix to a documented incident, not unexamined scaffolding — `unhobble-instructions` had no check for this before softening one.** Grep `decisions/*.md` for the rule's keywords before loosening; a Rejected-alternatives entry naming the exact softening about to happen means don't. Caught 2nd-hand by a product reviewer, not by the pass's own verification step, which only checks that facts survived — never that a survived fact's original STRENGTH did too — see D64. Same gap recurred one layer down (2026-08-02): the skill's decoration-vs-content check existed in prose but wasn't wired into the numbered Process steps that actually execute, so running the skill on itself still mis-stripped a genuine Tell — full record in ../agent-architecture/current.md Last Session, no new numbered decision here.
- **A companion file is a CLAUDE.md for condense purposes the moment it exists, not just a split destination — running a different skill (`unhobble-instructions`) across it first does not substitute for condense's own pass.** Fixed at `declared-budget.md`, the shared root all three size-judging consumers already point to — see D65
- **A doc can clear `condense-task-doc`'s line/byte target while individual sentences are still 500+ characters of stacked parentheticals — the aggregate metric averages over a few giant lines.** Fixed with a direct `awk`-sorted length check run after row-existence, same family as D50/D54 (a surface metric passing isn't proof the defect is gone) — see D67

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
| 2c | Overconstraint as a distinct axis from density — `skills/unhobble-instructions/SKILL.md`, applied across `update-plugin`, `done`, `read-summary`, `update-claude-docs`, `task-summary`, `condense-task-doc`, `merge-task-docs`, `sweep-doc-overlaps` (2026-08-01) and CLAUDE.md itself (2026-08-09, 33.4KB→17.6KB + `_shared/references/editing-skills-checklist.md`) | ✅ shipped — each real run has found a defect in the skill itself: D64 (softened a deliberately absolutist rule), D-limitation-reads-as-hedging (deleted stated limitations as hedging) |
| 3 | Duplication detection + leak-guard integrity (D37, D40, D12) | ✅ |
| 4 | Version-drift automated gate (plugin.json/marketplace.json) | ⏳ Pending — 4th recurrence |
| 5 | Companion file scope gap — `condense-claude-md`/`update-claude-docs` never treated a pre-existing companion as a condense target itself (D65) | ✅ |
| 6 | Sentence-length blind spot — `condense-task-doc`'s aggregate line/byte target passed with individual sentences still 500+ chars (D67) | ✅ |

---

## Key Technical Decisions

Full ADR content lives in `decisions/*.md` — find your question below, open only that file.

| File | Read if you're asking |
|------|------------------------|
| [decisions/bloat-generator-fixes.md](decisions/bloat-generator-fixes.md) | *Where does the plugin fix doc bloat — at the generator (task-summary rules) or by hand-trimming? What structural levers exist for over-budget CLAUDE.md? What if the file declares its own budget, or is far UNDER it? How does the `/commit` staleness gate avoid lexical false positives? Can an aggregate line/byte target pass while individual sentences stay bloated?* (D3, D6, D17, D18, D19, D20, D44, D51, D57, D67) |
| [decisions/structural-splits.md](decisions/structural-splits.md) | *When does a doc/CLAUDE.md/skill need a structural split (byte thresholds, companion files, plan-doc typing) instead of denser prose? Why does re-condensing the same skill keep failing? What checkpoint catches a rule that arrives with no defect, what size policy applies to `references/*.md`, why does a stale pointer pass the same grep a missing rule fails, when should a CLAUDE.md entry be prose vs. a table row, once a companion file exists is it ever a condense target itself, may condensation drafting be delegated to an agent, and which kind of fact does an unhobbling pass mistake for hedging?* (D22, D23, D26, D27, D33, D45, D46, D50, D54, D62, D63, D64, D65, D-haiku-condense-delegation, D-limitation-reads-as-hedging) |
| [decisions/duplication-and-integrity.md](decisions/duplication-and-integrity.md) | *How does the plugin catch duplicated facts (within/across docs) and verify a fix actually landed everywhere?* (D37, D40, D12, demoted D2/D5/D7/D11) |

---

## Next Steps

**Automated gates**
- [ ] `plugin.json`/`marketplace.json` version drift — 4th occurrence (D26 2026-07-15, then 2026-07-17, 2026-07-22, 2026-08-01). A bump to one file without the other passes silently; a pre-commit check or single-source-of-truth version file is the open fix.
- [ ] ADR-id uniqueness has no post-write gate — the same "silently passes" shape as the row above. **2026-08-02: this collided for real** — two unrelated decisions both minted `### D66` (fixed this session, renumbered to D67), the exact failure this item predicted before the gate existed. Mechanism + fix owned by [../agent-architecture/current.md](../agent-architecture/current.md) Next Steps.

**Reciprocal note (D65)**
- [ ] `unhobble-instructions/SKILL.md` line 53's unhobble-vs-condense boundary is real but generic — it doesn't name the specific trap that caused D65 (sweeping every file under `.claude-companions/` for overconstraint feels exhaustive enough to skip condense's own pass, which is a different check). Add a line naming this specific companion-plurality shape so the same reasoning error doesn't recur in this direction next time.

**Arrival-rate gate — watch, now that both halves are closed (D54)**
- [ ] Re-measure the add/remove ratio after a few sessions run under Gate B — `git log --since=... --numstat -- 'skills/**/*.md'`. The gate's purpose is moving 2.6:1 toward 1:1; a one-time byte drop is not the success criterion. If the ratio has not moved, the remaining leak is sessions that never run `/done` at all — an accepted limit to state here rather than re-engineer.
- [ ] `condense-claude-md/references/structural-splits.md` is 6,515 bytes against the new ~6KB prose-reference ceiling — prose, not a catalog (6 table rows across 3 prose sections). First live edge case of that rule. Check it on the next density pass through `condense-claude-md`; do not split a 53-line file, which would make it harder to use.

**Agent templates vs the Bootstrap pattern (deferred from v1.131.0's plan, Phase 4)**
- [ ] `skills/agent-setup/templates/*.template.md` total **77KB — 12.5% of the corpus**, with `browser-verifier.template.md` alone at 15KB, larger than most skills. The Bootstrap pattern's premise is that agents read CLAUDE.md *at runtime* rather than carry injected content, so templates this size suggest it is leaking. Audit for content an agent would read anyway; **preserve** `browser-verifier`'s `USER-TRIGGERED ONLY` gate, which guards real unauthorised spend. Lower priority than the gates above — templates are read once at generation, not per invocation.

**Doc size**
- [ ] This doc SET is 692 lines / 96KB against a 300-line budget — pre-existing, grew further with D65's addition this session. The index reads healthy at ~110 lines, which is what hides it. Route to `condense-task-doc`; don't hand-condense.

---

## Last Session (2026-08-09)

- Ran `unhobble-instructions` on five staged docs via parallel haiku agents. CLAUDE.md 33.4KB→17.6KB, its Maintenance section extracted to `_shared/references/editing-skills-checklist.md`; six behaviour-changing defects found and fixed across the batch (D-limitation-reads-as-hedging).
- The user's framing settled the verification bar mid-pass: structure and wording are free to change, behaviour is not — "does a reader still do the same thing?" That reclassified four of my findings as false alarms (a dropped pointer whose fan-out no longer existed) and kept three as real.
- Two defects were invisible to every token check and surfaced only by reading passages against their snapshots. All four delegated agents reported "zero facts lost."
- Corrected mid-session after a user challenge: verifying rewrites by grep measures shape, not content. The global `~/.claude/CLAUDE.md` antipattern was rewritten from "don't use grep to read files" to name presence-vs-meaning, since grep-as-search stays correct and only grep-as-evidence-of-meaning is the trap.
- A first draft of the `unhobble-instructions` capture was itself hobbling — a patch for one observed failure carrying its worked incident, which the skill's own line 44 lists as a constraint tell. Cut to the mechanism alone after the user asked whether the entry hobbled the skill.
