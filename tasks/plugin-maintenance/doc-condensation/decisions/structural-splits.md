<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation/structural-splits
Gotchas (critical — full list in each ADR's Consequences):
  - `condense-claude-md` verification diff needs a false-positive filter; completion needs a byte threshold alongside the line threshold (D22)
  - Skill-file density is a distinct bloat class from CLAUDE.md/task-doc bloat (D23)
  - Companion-file split applies to ANY oversized cross-cutting section, not just global CLAUDE.md (D26)
  - Pre-existing plan/spec docs are NOT decisions/<theme>.md candidates (D27)
  - `<thinking>` recommendation retired — reasoning scaffolds belong to the output-style layer (D33)
Related: ../current.md (feature index), ../../agent-architecture/current.md, ../../madr-structure/current.md
Last updated: 2026-07-20
-->

# Doc Condensation — Byte Thresholds, Skill Density & Structural Splits

Decisions about WHEN a doc/CLAUDE.md/skill needs a structural split (byte thresholds, companion files, plan-doc typing) rather than denser prose.

---

### D22 — `condense-claude-md`'s Verification Diff Needed a Second-Pass Filter, and Completion Needed a Byte Threshold Alongside the Line Threshold — committed — 2026-07-12

**Problem**
Two gaps in a live Dourr `CLAUDE.md` condensation run. (1) Prescribed `diff`/`comm -23` verification flagged ~30 lines as possibly-dropped; all were false positives (reworded labels, table-header artifacts). (2) The pass hit the ≤200-line target (257→221) but was still 20.4KB — line count doesn't catch table-row byte density.

**Decision**
Two patches to `condense-claude-md/SKILL.md`. (1) Verification rule now warns `diff`/`comm` output is a *candidate list, not a verdict* — each flag needs `grep -c '<substring>'` confirmation. (2) Added Process step 6: hitting the line target isn't done if bytes are still high (originally set at ~15KB for a root CLAUDE.md, corrected to the actual 40KB ceiling on 2026-07-19 after a real condense run showed the old target was ~2.5x too tight); proactively offer a seam-test split via `AskUserQuestion`.

**Rejected**
- Leaving the diff/comm check as-is, treating the manual `grep -c` triage as implicit good practice. Why not: the same false-positive noise will recur on every future run of this exact command shape (rewording is the norm, not the exception, in a condensation pass) — worth naming as a known step, not left to be independently re-discovered each time, matching this doc's own D20/D6 lineage of promoting a repeated ad hoc fix into a stated rule.
- Raising the line-count target itself (e.g. ≤150) instead of adding a parallel byte check. Why not: line count and byte density are orthogonal axes for a one-row-per-item table — a lower line target doesn't fix a table whose rows are already irreducibly long; the existing ⚠️ note under Process already identifies this shape as line-count-deceptive, so the real fix is checking the metric that shape actually hides (bytes), not tightening the metric that was never diagnostic for it.
- Making the seam-test split offer mandatory/automatic without asking. Why not: splitting creates a new file and changes what loads when — a structural change with real tradeoffs (the seam-test can fail, or the user may prefer to accept more lines over more files), consistent with this skill already gating splits behind `AskUserQuestion` rather than executing them unprompted.

**Consequences**
- `condense-claude-md/SKILL.md`: verification bullet gained the false-positive-filter note; Process gained step 6.
- Dourr `CLAUDE.md` further split: root (181 lines/12.7KB) + new `docker/CLAUDE.md` (53 lines/8.5KB, passes seam-test).

**Status**: committed · **Reversible**: yes

---

### D23 — Skill-File Density Is a Distinct Bloat Class From CLAUDE.md/Task-Doc Bloat, and `update-plugin` Now Owns Its Checklist — committed — 2026-07-12

**Problem**
User flagged plugin skills as "bloated," naming `update-claude-docs` and `task-summary`. Both sat under their line budgets — line count didn't explain the complaint. A full-plugin audit found the real signal was bytes/line: `condense-claude-md` and `condense-task-doc` — whose JOB is fixing this pattern — were themselves the densest files (147 and 140 bytes/line), stacking multiple ⚠️ callouts and embedding worked-incident anecdotes as instruction text.

**Decision**
Two-round hand-edit pass. Round 1 (v1.62.0): collapsed stacked warnings and stripped anecdotes across 7 skills; `update-claude-docs` extracted its cold-path CREATE/REWRITE/CONDENSE modes to `references/other-modes.md` (239→205 lines, 27% smaller hot path). Round 2 (v1.63.0): `read-summary` revised (82→71 lines), `task-summary`'s rare merge/rename branch extracted to `references/merge-rename.md` (223→202 lines). Captured the pattern into `update-plugin/SKILL.md` (v1.63.1) as Step 1 signal + Step 3a checklist for future density passes.

**Rejected**
- Delegating skill-density fixes to `condense-claude-md`/`condense-task-doc`. Why not: those skills' entire density-rule vocabulary (WHY-column stripping, `Symptom|Cause|Fix` table shape, `{#anchor}` preservation) is CLAUDE.md/task-doc specific; SKILL.md files have different structure (frontmatter, mode sections, `references/` split) and no equivalent skill existed to point to.
- Treating this as one-time manual cleanup with no reusable capture. Why not: the same shape (stacked warnings, worked anecdotes, self-contradiction, cold-path-in-hot-path) is exactly the kind of recurring, nameable pattern this doc's own D3/D6/D13 lineage says belongs in the generator/checklist, not re-discovered by inspection each time a skill grows dense again.
- Extracting cold-path content from every skill preemptively, not just the two found. Why not: the round-2 plugin-wide scan explicitly checked all 12 remaining skills for this lever and found only `task-summary` §2a qualified — most skills are single-purpose with no hot/cold split; forcing an extraction where none is warranted adds indirection without a token-budget payoff.

**Consequences**
- 9 skill files edited across two rounds; 2 new `references/*.md` files created; `update-plugin/SKILL.md` gained permanent density-pass capability.
- Plugin version bumped 1.61.2→1.63.1 across three CHANGELOG entries; kept `plugin.json`/`marketplace.json` in sync.

**Status**: committed · **Reversible**: yes

---

### D26 — Companion-File Split Widened From Global-Only to Any Oversized Cross-Cutting Section — committed — 2026-07-15

**Problem**
`condense-claude-md` Restructuring #7 documented companion files as global-only. A layer file sat at 42kb with a ~130-row gotchas block that failed the subdir seam-test — genuinely cross-cutting, no single subdirectory owned it. Wording-compression alone got it to 28kb; the model concluded "dense, not bloated" and stopped, since the only documented lever was "stays inline." The user pushed back twice before the companion split was tried — it cut the file to 18kb (56%).

**Decision**
Chosen: widen Restructuring #7 to any file whose oversized section is cross-cutting (fails seam-test per #6, isn't feature-owned). Three coordinated patches: `condense-claude-md` (Restructuring #7 + step-5 completion check) now treats failed seam-test as the split's *trigger*, not a dead end; `update-claude-docs/references/structure.md` gained a **Third structural lever** section; `read-summary` step 5 gained a **Companion** bullet. All three now require a **per-category symptom index** for moved blocks with multiple sub-categories, plus a grep-and-repoint pass for sub-anchors (3 task-doc cross-refs broke silently this session).

**Rejected**
- Leaving the lever global-only and treating every cross-cutting layer-file overflow as a permanent "stays inline" case. Why not: D19/D20 already established the pointer lever's boundary (needs a real feature owner); this left a real third case — no subdirectory AND no feature owner — with no lever at all, and "dense, not bloated" is not actually a resolution to a 42kb auto-loading file.
- A single generic trigger phrase on the companion pointer, matching the original global-file wording. Why not: a multi-category source block (React/Chakra/Data gotchas) collapsed under one phrase gives a reader no way to match their specific symptom without opening the file — defeats the pointer's purpose. Confirmed insufficient live; the user asked for a per-category index twice before it landed.

**Consequences**
- `condense-claude-md/SKILL.md` Restructuring #7 rewritten; caught internal miscitation (`#49` → `#7`, fixed same session).
- Plugin version bumped 1.75.0→1.76.0; also fixed pre-existing `plugin.json` (1.75.0) vs `marketplace.json` (1.74.0) drift.

**Status**: committed · **Reversible**: yes

---

### D27 — Pre-Existing Plan/Spec Docs Are a Distinct Type From `decisions/<theme>.md`, and Split-Doc Guidance Needed a Parent-Directory Audit Step — committed — 2026-07-15

**Problem**
A Dourr `tasks/trust-engine/` merge left 5 pre-existing plan files (`phase2-plan.md`, etc.) untouched in the parent folder, cited by 13+ PHPDoc comments. The user asked whether they should move into `decisions/` for consistency. Two independent research passes concluded they shouldn't: `decisions/<theme>.md` is specifically for ADR blocks split out of budget-overrun `current.md`; these files were pre-build engineering PLANS that never originated that way. Real-world convention (adr-tools, MADR, Diátaxis) confirmed teams keep plan/spec docs and decision logs separate. The actual gap wasn't folder layout — it was that `current.md`'s routing table only listed the 3 `decisions/*.md` files, silently omitting the 5 siblings.

**Decision**
Chosen: (1) leave plan/spec docs as siblings of `current.md`, never move them into `decisions/`; (2) when retiring siblings, absorb still-load-bearing content into a NEW themed `decisions/<theme>.md` grouped by reader question, not source file; (3) patch `templates.md`'s split-doc section + `merge-task-docs` Step 3 with an explicit "`ls` the PARENT directory" audit — the existing sibling-file rule only scanned folders being deleted, never the folder the split lands in.

**Rejected**
- Converting the plan docs into ADR blocks to fit `decisions/` uniformly. Why not: their content (schemas, edge-case tables, build-order checklists) doesn't fit Problem/Decision/Rejected/Consequences without stripping real engineering detail to force a shape — information loss dressed as tidiness, the exact failure `condense-task-doc`/`merge-task-docs` warn against.
- Folding the plan docs' content directly into `current.md`'s body once retiring them. Why not: `current.md` must stay a thin index (Quick Start + routing only) per `templates.md`'s own split-doc rule — pulling ~1,100 lines of schemas/edge-cases back in would recreate the exact bloat the split existed to fix.
- Accepting a single research pass (internal skill re-read) as sufficient before making the call. Why not: the user explicitly asked for external verification (real-world ADR/Diátaxis convention) before trusting the internal skill's own guidance on itself — a second, independent source corroborating the same conclusion is what actually earned confidence here, not the first pass alone.

**Consequences**
- `templates.md`'s "Splitting" section gained a parent-directory audit paragraph; `merge-task-docs/SKILL.md` Step 3 gained matching "also `ls` the DESTINATION folder" note.
- Establishes durable rule: `decisions/<theme>.md` routing table must enumerate EVERY file in its parent folder, even when siblings correctly stay outside `decisions/` — routing completeness and folder placement are separate concerns.

**Status**: committed · **Reversible**: yes

---

### D33 — Retire the `<thinking>` Recommendation: Reasoning Scaffolds Belong to the Style Layer, Not Skill Files — committed — 2026-07-16

**Problem**
D2 kept Chain-of-Thought (`<thinking>`) as a recommended technique for "commands with multi-branch inference", and a `## Next Steps` item had been monitoring whether it reduced domain-inference errors. A `grep -rn` across every skill and command found **zero** adopters — the row had sat purely aspirational since it was written. Separately, the user asked where `<thinking>` blocks in their sessions came from: not the plugin at all, but their active output style (`~/.claude/output-styles/deliberate-explanatory.md` §1), which mandates them unconditionally.

**Decision**
Chosen: retire the CoT row from CLAUDE.md's prompting-techniques table and close the monitoring item, recording zero-uptake-over-many-sessions as the verdict. The two layers are now explicit: reasoning scaffolds are the **harness/output-style** layer's job (global, user-switchable), and a skill file hardcoding one fights whatever style is active. D2's Constitutional/Validation halves stand unchanged.

**Rejected**
- Leaving the row as a dormant option "in case someone wants it". Why not: an unused recommendation still costs every skill author a decision, and a plugin must be self-contained — it cannot know which output style a *different* user runs, so prescribing a scaffold at the skill layer is unsound in principle, not just unused in practice.
- Reading zero adopters as "not tried hard enough" and adding a CoT block to a skill to test it. Why not: inverts the evidence. An 18-skill sample over many sessions choosing not to reach for a documented tool *is* the signal.

**Consequences**
- Establishes a layer boundary: skills own *procedure*, the output style owns *how reasoning is surfaced*. A future "should this skill think out loud?" question is answered at the style layer.
- Absence of uptake is admissible evidence for retiring a recommendation — a monitoring item that never fires has reported its result.

**Status**: committed · **Reversible**: yes
