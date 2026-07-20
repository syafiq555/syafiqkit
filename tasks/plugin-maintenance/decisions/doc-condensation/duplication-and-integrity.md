<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation/duplication-and-integrity
Gotchas (critical — full list in each ADR's Consequences):
  - Cross-section AND cross-file OPEN-item duplication, plus `⚠️` density, are both mechanical litmus checks now (D37)
  - A diff adding a `<content>`-leak guard is not proof the leak is gone repo-wide (D40, renamed from a duplicate D32 — see Note)
  - Full duplication survey fixed two real cases, explicitly left shared-shape-not-duplication cases alone (D12)
Related: ../../current.md (index), ../doc-condensation.md (router), ../agent-architecture.md
Last updated: 2026-07-20
Note: This file's D40 was originally numbered D32 in the pre-split doc, colliding with agent-architecture's D32 (parallelism/run_in_background). Renumbered during the 2026-07-20 split — see D39's split note in current.md Last Session.
-->

# Doc Condensation — Duplication Detection & Leak-Guard Integrity

How the plugin catches duplicated facts (within a doc, across a doc, across files) and verifies a fix actually landed everywhere it needed to.

---

### D37 — `task-summary`'s Cross-Section-Duplication Litmus Test Now Names the Status Word Explicitly, Then Split Git-State from Deploy-State, Then Extended to Cross-File OPEN Items + `⚠️` Density — committed (v1.116.1 → v1.116.3) — 2026-07-19

**Problem**
Layer 1 already had a rule that commit/deploy status is one fact belonging only in Quick Start's state line, but the litmus test and Validate §8 only said "grep the doc's 2-3 most critical phrases" — leaving it to the agent's judgment each run whether the status word counted. A real doc had "UNCOMMITTED" in 5 places; only a downstream `/commit` staleness gate caught it (v1.116.1). Next session's objection wasn't "grep harder" — it was that `committed`/`uncommitted`/`pushed` adds nothing even said once, since `git log`/`git status` already answers it; only deploy/environment state (staging/prod) is a genuine non-git-tracked fact (v1.116.2). A third pass (v1.116.3) found the same "one fact, one home" violation recurring ACROSS files (an OPEN item's mechanism restated in an index + a `decisions/<theme>.md` file + Next Steps) and `⚠️` diluted by overuse (~every 8-10 lines in a real doc) until it stopped signaling danger.

**Decision**
Chosen, cumulative: (1) name the status word explicitly in the litmus test + Validate §8, doc-wide grep required on any commit/deploy-state write; (2) split that grep in two — `committed`/`uncommitted`/`pushed` is a delete-on-sight, not a dedupe; `deployed`/`staging`/`prod` still collapses to Quick Start; (3) extend "one fact, one home" to span an index + its `decisions/<theme>.md` files (canonical home = the item's `## Next Steps` row, everywhere else a bare pointer), and cap `⚠️` to irreversible/destructive consequences only (data loss, broken audit trail, silent prod regression, unrecoverable action) — condense passes now grep-count it as a density signal.

**Rejected**
- Leaving status-word detection as an implicit case of "2-3 most critical phrases" (v1.116.1) — not self-enforcing, proven by the 5-copy real-doc counter-example.
- Keeping git-state and deploy-state as one bundled rule (v1.116.1) — conflated "answered by git" with "a genuine environment fact," so git-state kept surviving single mentions that added no value.

**Consequences**
- The status vocabulary is now split across two grep passes (delete vs. collapse) rather than one — future edits to either word list must keep both in sync across `task-summary` AND `condense-task-doc`.
- "One fact, one home" no longer terminates at a single doc's section boundary — a condense pass must now also check sibling `decisions/*.md` files for the same OPEN item before calling a doc clean.
- `⚠️` density is now a mechanical litmus check (grep-count vs. line count), not a stylistic judgment call — a doc that reads "everything is dangerous" is itself the defect Validate should catch.

**Status**: committed · **Reversible**: yes

---

### D40 — A Session Adding a Leak Guard Must Grep Its Own Diff for the Leak, Repo-Wide — committed — 2026-07-16

*(Originally numbered D32 — renamed 2026-07-20 during the doc split to resolve a collision with agent-architecture's D32, parallelism/`run_in_background`. Content unchanged.)*

**Problem**
A prior session added a `<content>`/`</content>` tool-output-wrapper-tag guard to `task-summary`/`update-claude-docs`/`merge-task-docs` (mirroring the one `condense-task-doc`/`condense-claude-md` already had), motivated by a leak caught in a rewritten `current.md`. Before the change was committed, `/done`'s own review pass found the exact bug — a literal trailing `</content>` — sitting in two of the very files the session had just edited (`skills/agent-setup/templates/Explore.template.md`, `tasks/plugin-maintenance/decisions/agent-architecture.md`), unrelated to the new guard's own edits but landed in the same diff. A repo-wide sweep then found two more pre-existing leaks in untouched files (`Plan.template.md`, `madr-structure.md`).

**Decision**
Chosen: run a literal `</content>` grep across every file the diff touches, then a second repo-wide sweep, as a standard part of `/done`'s review step whenever a diff's own content shows it originated from `Read`-sourced full-file rewrites — not just when the diff is specifically about the leak guard. Fixed all 4 occurrences found (2 in-diff, 2 pre-existing) in the same `/done` pass rather than filing them as follow-ups.

**Rejected**
- Trusting the new guard's own presence as proof the bug class was handled. Why not: a guard is instructions for the *next* write; it does nothing for leaks already sitting in files from *before* the guard existed, and doesn't stop the session writing the guard from making the same mistake in an unrelated file in the same sitting.
- Scoping the grep to only the files the guard's CHANGELOG entry named. Why not: the two pre-existing leaks were in files with no connection to this session's diff — a scope-limited grep would have missed them entirely.

**Consequences**
- `/done` review should default to a literal-tag grep (`</content>`, `<content>`) whenever the touched files include SKILL.md/agent-template/task-doc rewrites, independent of whether the diff's subject is the leak guard itself.
- Establishes that a bug-fixing diff is not evidence the bug is fixed elsewhere in the repo — always sweep past the diff's own boundary for the same defect shape.

**Status**: committed · **Reversible**: yes

---

### D12 — Full Duplication Survey Fixed Two Cases, Explicitly Left the Rest — committed

**Problem**
User's "everything feels condensable" ask required a full survey of all 6 commands + 18 skills, not spot-fixes.

**Decision**
Chosen: fixed two real near-duplications, left three shared-shape-but-not-duplicated cases alone. Fixed: `ship`'s Step 2 staleness-gate bullets (paraphrased `commit.md`'s gate word-for-word) → collapsed to one-line pointer. Fixed: `task-summary`'s §2a merge rules table (redundant with `merge-task-docs`) → trimmed to rename-only row + pointer.

**Rejected**
- Merging `update-claude-docs` and `update-plugin` (share skeleton). Why not: they apply it to disjoint content (CLAUDE.md sections vs SKILL.md files) — shared shape, not duplication.
- Merging thin command aliases (`write-summary`/`update-summary`). Why not: intentional dual triggers, not duplication.
- Merging the `task-summary`/`condense-task-doc`/`merge-task-docs` three-way split. Why not: already properly decomposed by operation, not overlapping.

**Consequences**
Establishes the litmus test for future passes: shared *shape* applied to disjoint *content* is not duplication; only true text/logic overlap is.

**Status**: committed · **Reversible**: yes

---

### Demoted Decisions

Settled, `committed`, uncontested for 3+ sessions, not cited by ID elsewhere in this doc — demoted per `templates.md`'s demotion rule (full history in git blame if needed).

| Decision | Rationale |
|----------|-----------|
| D2 — Apply LLM prompting techniques (Constitutional/CoT/Validation) selectively, only to commands with multi-branch inference or file writes | Uniform application to simple commands (`read-summary`, `commit`) adds overhead without a reliability gain. ⚠️ **CoT half superseded by D33** — retired outright; Constitutional/Validation stand |
| D5 — A skill's happy path defers to a project's own documented alternative convention (e.g. `ship`'s CI-verify vs a project's rsync hotfix) rather than hardcoding the exception | Keeps the plugin generic/project-agnostic while still respecting a specific project's faster path when documented |
| D7 — A read-only command (`read-summary`) that notices a doc contradicting code must name the drift and route it (to `/update-summary` or `/update-plugin`), not just narrate it in passing | Narrating without routing drops the fix — the handoff is the deliverable, the command itself stays read-only |
| D11 — Extract to `_shared/references/` only true byte-identical duplication (e.g. the "no filler words" table), not broad pointer-extraction of similar-but-not-identical guidance | Generic research shows indirection risks non-compliance; extraction is only worth that risk for genuinely identical content |
