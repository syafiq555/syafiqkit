<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation
Gotchas (critical — full list in each ADR's Consequences):
  - Fix doc bloat at the generator (task-summary rules), not by hand-trimming individual docs (D3)
  - Shared *shape* applied to disjoint *content* is not duplication — only true text/logic overlap is (D12)
  - The companion-file split (Restructuring #7) applies to ANY oversized cross-cutting section, not just the global CLAUDE.md (D26)
  - Pre-existing plan/spec docs sitting next to a split doc are NOT decisions/<theme>.md candidates — a different document type, verified against external ADR/Diátaxis convention (D27)
Related: ../current.md (index), ../decisions/madr-structure.md, ../decisions/agent-architecture.md
Last updated: 2026-07-19
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation Decisions

Decisions about fighting duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage.

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

### Demoted Decisions

Settled, `committed`, uncontested for 3+ sessions, not cited by ID elsewhere in this doc — demoted per `templates.md`'s demotion rule (full history in git blame if needed).

| Decision | Rationale |
|----------|-----------|
| D2 — Apply LLM prompting techniques (Constitutional/CoT/Validation) selectively, only to commands with multi-branch inference or file writes | Uniform application to simple commands (`read-summary`, `commit`) adds overhead without a reliability gain. ⚠️ **CoT half superseded by D33** — retired outright; Constitutional/Validation stand |
| D5 — A skill's happy path defers to a project's own documented alternative convention (e.g. `ship`'s CI-verify vs a project's rsync hotfix) rather than hardcoding the exception | Keeps the plugin generic/project-agnostic while still respecting a specific project's faster path when documented |
| D7 — A read-only command (`read-summary`) that notices a doc contradicting code must name the drift and route it (to `/update-summary` or `/update-plugin`), not just narrate it in passing | Narrating without routing drops the fix — the handoff is the deliverable, the command itself stays read-only |
| D11 — Extract to `_shared/references/` only true byte-identical duplication (e.g. the "no filler words" table), not broad pointer-extraction of similar-but-not-identical guidance | Generic research shows indirection risks non-compliance; extraction is only worth that risk for genuinely identical content |

---

### D3 — Fix Doc Bloat at the Generator, Not by Hand-Trimming — committed — 2026-06-09

**Problem**
User flagged the `done`/`task-summary` workflow as "bloated." Repeated facts came from each template section restating the critical thing.

**Decision**
Chosen: add anti-bloat governance rules to `task-summary` itself (one-fact-one-home, rows-≤2-sentences, LLM-CONTEXT-is-pointer-index, Quick-Start-≤15-lines) rather than manually trimming individual docs. `done` cut 164→111 lines: deleted the inline conversation-analysis procedure duplicating `update-claude-docs`; capture is now one delegated Skill call. `## Last Session` strengthened to enforce exactly one heading.

**Rejected**
- Hand-trimming each bloated doc as found. Why not: doesn't fix the generator — every future doc re-bloats the same way.

**Consequences**
A cross-section dedup rule in `task-summary` shrinks every future doc; this is the seed of "one fact, one home" later applied to CLAUDE.md itself (D6) and this doc's full MADR conversion (D12).

**Status**: committed · **Reversible**: yes

---

### D6 — A CLAUDE.md Line Is Dead Weight Once a Skill Enforces It at Action-Time — committed

**Problem**
CLAUDE.md is read at session start (ambient); a skill is read at the moment of action. When both state the same rule, copies drift out of sync (seen with `/commit`'s changelog gate).

**Decision**
Chosen: when a skill enforces a rule at action-time, delete the CLAUDE.md copy — the skill wins.

**Consequences**
Prevents stale-CLAUDE.md-vs-skill contradiction; part of the "one fact, one home" lineage as D3.

**Status**: committed · **Reversible**: yes

---

### D17 — `.claude/rules/*.md` Path-Scoping Frontmatter Does Not Actually Scope; Removed as a Routing Recommendation — committed — 2026-07-12

**Problem**
`update-claude-docs/references/structure.md`'s capture-filter table recommended routing file-type-specific rules to `.claude/rules/*.md` with `paths:`/`globs:` YAML frontmatter, assuming this only loads content when Claude touches a matching file — same property verified for subdirectory `CLAUDE.md`.

**Decision**
Chosen: empirically test the claim with a canary (a secret string in a path-scoped rule file, probed from a fresh session on a non-matching path). Result: the file loaded regardless — the model just self-suppresses acting on it, which is model judgment, not context filtering. Removed `.claude/rules/` as the recommended target; replaced with "real subdirectory CLAUDE.md," verified to genuinely scope.

**Rejected**
- Trusting the vendor-docs-sourced claim (a fetched official doc page did describe `.claude/rules/` frontmatter as reducing loaded context) without a live test. Why not: official docs describe intended/designed behavior; a live bug (this exact gap is tracked upstream, e.g. path-scoped rules failing to apply as documented) can silently break the part that matters. "The docs say X" and "X is true in this install" are different facts on a fast-moving CLI tool.
- Leaving the recommendation in place with a caveat. Why not: a routing table is read at the moment of a real decision — a caveat gets skipped under time pressure; the wrong destination needed to be replaced, not annotated.

**Consequences**
- Fixed `update-claude-docs/references/structure.md` (capture-filter table + `@import` row clarified as also not scoping — launch-time load, DRY-only) and `condense-claude-md/SKILL.md` (step 6, added explicit anti-pattern warning) — the two skill files a future CLAUDE.md split decision would actually read.
- Global `~/.claude/CLAUDE.md` Platform Gotchas gained the frontmatter-doesn't-scope row, plus a corrected row on `📖 See <file>` pointer reliability: a follow-up test showed `read-summary`/the project `Explore`/`Plan` agents already do the correct thing (mandatory CLAUDE.md tree-walk + `/read-summary` call) — but that walk is gated on "does this look like a documented feature/flow," same gate as task-doc discovery, not on "does the search touch a directory with a CLAUDE.md." A generic symptom-only investigation prompt naming no specific flow can slip past that gate straight to code search. Initial framing ("investigation tasks skip docs") was imprecise; corrected after tracing the actual gate in `Explore.template.md`/live `Explore.md`.
- Establishes a general lesson for this decision log's "verify before documenting" lineage: a context-management mechanism's own official docs are a claim to test empirically (negative control: plant a distinguishable fact, probe from a session that should NOT have it, confirm absence), not evidence to route on directly — same standard as any other unverified project claim. Also: when a negative-control test finds a "reliability gap," trace it to the actual gating logic in the responsible skill/template before generalizing — the first plausible explanation (task-type) was wrong; the real one (feature-name-matching) was one file-read away.

**Status**: committed · **Reversible**: yes (revisit if Anthropic ships a fix)

---

### D18 — `/read-summary` Discovery in `Explore`/`Plan` Made Unconditional, Reversing D17's "Gate Is Correct Design" Call — committed — 2026-07-12

**Problem**
D17 concluded the `Explore`/`Plan` Bootstrap gate (task-doc/CLAUDE.md discovery only ran when prompt named a feature/flow) was intentional, correct design. The user chose precision over efficiency: **"burn tokens on unnecessary lookups over risk missing a real gotcha."**

**Decision**
Chosen: remove the feature/flow-name gate from `Explore.template.md` and `Plan.template.md` — `/read-summary` discovery now runs on every call. Bootstrap sections now open with a `⚠️ MANDATORY, no exceptions` line rather than a caveat buried after it.

**Rejected**
- Leaving `Explore` gated but making `Plan` unconditional (or vice versa). Why not: user's stated preference was general ("I don't mind, Explore is haiku anyway") — applied to both since `Plan`'s lower call-frequency per session offsets its higher per-call model cost (sonnet) similarly to `Explore`'s low per-call cost at higher frequency.
- Only strengthening wording in the existing caveat rather than restructuring Bootstrap's opening. Why not: the caveat already existed (D17's own text) and still didn't prevent the original miss — a rule stated as an exception-to-a-default reads weaker than one stated as the default itself; matches this doc's own D3/D6 "escalate by position and sharpness" lineage.
- Reverting D17's underlying finding (that the old gate was well-designed). Why not: D17's finding was correct as a description of the code's PRE-existing intent — this decision is a values call by the user overriding that intent going forward, not new evidence that the old design was flawed.

**Consequences**
- `Explore`/`Plan` pay a `/read-summary` discovery cost on every invocation now, including trivial calls — accepted cost per user choice.
- Plugin-wide: every project's scaffolded `Explore.md`/`Plan.md` inherits the unconditional gate by default.

**Status**: committed · **Reversible**: yes (stated user preference, not a discovered technical fact)

---

### D19 — Task-Doc Index + Pointer Added as a Second Structural Lever for Over-Budget CLAUDE.md Files — committed — 2026-07-12

**Problem**
`update-claude-docs/references/structure.md` §6 offered ONE structural lever for over-budget CLAUDE.md: push a section down to subdirectory CLAUDE.md, gated on seam-test. Horizontal-layer files commonly fail that seam-test — their gotchas are about shared primitives used across many dirs, not confined to one. D18 confirmed `Explore`/`Plan` follow a task doc's own `📖 See <file>` pointer rows reliably.

**Decision**
Chosen: add a second lever to `references/structure.md` §6 — when a block is too big, fails seam-test, but IS scoped to one documented feature/flow, route it to that feature's task doc `## Gotchas` table with a bare `📖 See <file>` pointer row. Explicit boundary table added distinguishing this from the subdir lever: needs a FEATURE identity (confirmed via content-based `/read-summary` discovery), not a directory.

**Rejected**
- Applying this lever to ANY over-budget block, including cross-cutting layer conventions. Why not: `code-reviewer`/`code-simplifier` don't run `/read-summary` on every trivial edit the way `Explore`/`Plan` now do (D18 only changed those two) — a write-time convention a fresh session needs BEFORE editing would silently vanish for those agents if moved out of CLAUDE.md. Restricted to debugging/investigation-shaped content (`Symptom | Cause | Fix`), which is what a task doc's Gotchas table already holds and what `Explore`/`Plan` actually consume.
- Treating "seam-test fails" as terminal (per D17's own then-correct conclusion, later reaffirmed in `condense-claude-md`'s step 6 warning: "the section stays in the layer file — that's the correct outcome"). Why not: that conclusion predates D18's mandatory-discovery change; a lever that didn't reliably work when D17 was written now does, verified live.
- Auto-creating a new task doc slug just to hold a relocated section. Why not: an orphaned single-purpose doc invented to house one block is worse than leaving the block inline — the lever only applies when a real feature doc exists or genuinely should via content-based discovery, never a guessed folder name.

**Consequences**
- `update-claude-docs/references/structure.md` §6 gained the second-lever section + boundary table.
- `condense-claude-md/SKILL.md` step 6 warning updated: checks feature-specificity before declaring the layer file terminal.

⚠️ **Correction (see D20)**: "spans the whole authz layer" was true but irrelevant — Multi-Agency concentrates 11-26x in `app/Http/*` vs 0-4 in `app/Domain/*`, so it DID pass seam-test against a subdirectory this decision never checked.

**Status**: committed · **Reversible**: yes

---

### D20 — Seam-Test Must Check EVERY Real Sibling Subdirectory, Not Just the Intuitively-Obvious One — committed — 2026-07-12

**Problem**
D17 concluded Multi-Agency Gotchas "fails the seam-test," checked only against `app/Domain/*`. Re-examination grepped its core symbols against every top-level `app/` subdirectory and found 5-10x concentration in `app/Http/*` — a real seam the original check never looked for.

**Decision**
The seam-test itself was under-specified — "check the seam-test" meant "check the intuitively-named subdirectory," not systematic. Added explicit instruction to `references/structure.md` §1 and both skill SKILL.md files: grep core symbols against EVERY candidate subdirectory with `grep -rl "<symbol>" <dir> | wc -l`, let counts decide. Applied live: created `app/Http/CLAUDE.md` (86 lines), moved Multi-Agency Gotchas + Controller Patterns there, `app/CLAUDE.md` shrank 295→241 lines (20.5% reduction).

**Rejected**
- Treating this as a one-off correction to D17 alone, not a methodology fix. Why not: the same "check only the obvious candidate" gap exists in every place the seam-test is invoked (`condense-claude-md` step 6, `update-claude-docs` §2/Rewrite step 6) — fixing D17's specific conclusion without fixing the underlying check means the next session hits the identical miss on a different section/project.
- Re-checking Cast Gotchas and Media/PDF against the same broadened methodology and finding they ALSO have a hidden seam. Why not: actually checked (grep counts run) — Cast Gotchas stays genuinely cross-cutting (`$casts` concentrates in `Domain`+`Models`, both real content-generating layers, no single dominant seam), Media/PDF splits evenly between `Http`/`Domain` with no dominant candidate either. Not every miss is the same miss; verified rather than assumed the fix generalized to all three sections.

**Consequences**
- `references/structure.md` §1, `condense-claude-md/SKILL.md` step 6, `update-claude-docs/SKILL.md` §2 patched with the "check every real sibling" instruction + methodology.
- D19's text kept as-written, correction note added rather than rewritten — MADR log preserves what was concluded at each point.

**Status**: committed · **Reversible**: yes

---

### D22 — `condense-claude-md`'s Verification Diff Needed a Second-Pass Filter, and Completion Needed a Byte Threshold Alongside the Line Threshold — committed — 2026-07-12

**Problem**
Two gaps in a live Dourr `CLAUDE.md` condensation run. (1) Prescribed `diff`/`comm -23` verification flagged ~30 lines as possibly-dropped; all were false positives (reworded labels, table-header artifacts). (2) The pass hit the ≤200-line target (257→221) but was still 20.4KB — line count doesn't catch table-row byte density.

**Decision**
Two patches to `condense-claude-md/SKILL.md`. (1) Verification rule now warns `diff`/`comm` output is a *candidate list, not a verdict* — each flag needs `grep -c '<substring>'` confirmation. (2) Added Process step 6: hitting the line target isn't done if bytes are still high (~15KB for a root CLAUDE.md); proactively offer a seam-test split via `AskUserQuestion`.

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

### D32 — A Session Adding a Leak Guard Must Grep Its Own Diff for the Leak, Repo-Wide — committed — 2026-07-16

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
