<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation
Gotchas (critical — full list in each ADR's Consequences):
  - Fix doc bloat at the generator (task-summary rules), not by hand-trimming individual docs (D3)
  - Shared *shape* applied to disjoint *content* is not duplication — only true text/logic overlap is (D12)
  - The companion-file split (Restructuring #7) applies to ANY oversized cross-cutting section, not just the global CLAUDE.md (D26)
Related: ../current.md (index), ../decisions/madr-structure.md, ../decisions/agent-architecture.md
Last updated: 2026-07-15
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation Decisions

Decisions about fighting duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage.

---

### D26 — Companion-File Split Widened From Global-Only to Any Oversized Cross-Cutting Section — committed — 2026-07-15

**Problem**
`condense-claude-md` Restructuring #7 documented the manually-referenced companion file as a lever for the **global** `~/.claude/CLAUDE.md` only (no subdirectory seam-test target exists for it at all). A layer file (`resources/js/CLAUDE.md`) sat at 42kb with a ~130-row gotchas block that failed the subdir seam-test — genuinely cross-cutting, no single subdirectory owned it. Wording-compression alone got it to 28kb; the model concluded "it's dense, not bloated" and stopped, since the only documented lever for a seam-test failure not caused by feature-specificity was "stays inline" (D19/D20's own conclusion). The user pushed back twice before the companion split was tried — it cut the file to 18kb (56%).

**Decision**
Chosen: widen Restructuring #7 to any file whose oversized section is genuinely cross-cutting (fails the subdir seam-test per #6, isn't feature-owned per the second lever in `update-claude-docs/references/structure.md` §6) — not just the global file. Three coordinated patches: `condense-claude-md` (Restructuring #7 + step-5 completion check) now treats a failed seam-test as the split's *trigger*, not a dead end; `update-claude-docs/references/structure.md` gained a **Third structural lever** section documenting the write-time twin; `read-summary` step 5's CLAUDE.md tree-walk gained a **Companion** bullet, since a `📖 CLAUDE-<topic>.md` pointer does not auto-load and the tree-walk alone misses it. All three now require a **per-category symptom index** when the moved block had multiple sub-categories (a single trigger phrase proved insufficient — the user had to ask for it twice), plus a grep-and-repoint pass for the moved block's `{#anchor}` sub-anchors (3 task-doc cross-refs broke silently this session).

**Rejected**
- Leaving the lever global-only and treating every cross-cutting layer-file overflow as a permanent "stays inline" case. Why not: D19/D20 already established the pointer lever's boundary (needs a real feature owner); this left a real third case — no subdirectory AND no feature owner — with no lever at all, and "dense, not bloated" is not actually a resolution to a 42kb auto-loading file.
- A single generic trigger phrase on the companion pointer, matching the original global-file wording. Why not: a multi-category source block (React/Chakra/Data gotchas) collapsed under one phrase gives a reader no way to match their specific symptom without opening the file — defeats the pointer's purpose. Confirmed insufficient live; the user asked for a per-category index twice before it landed.

**Consequences**
- `condense-claude-md/SKILL.md` Restructuring #7 rewritten (see this file's own commit) — was previously miscited internally as `#49` after a rewrite typo; caught and fixed same session (2026-07-15) during `/done`'s docs-only referential-integrity check.
- Plugin version bumped 1.75.0→1.76.0; also caught and fixed a pre-existing `plugin.json` (1.75.0) vs `marketplace.json` (1.74.0) drift, unrelated to this decision — same recurring drift class as D23's catch.
- Sibling sweep confirmed OUT of scope: `condense-task-doc`/`merge-task-docs` operate on `tasks/**` via `decisions/<theme>.md`, not CLAUDE.md companions; the pruner template deletes rows, not pointer lines — none needed a matching change.

**Status**: committed · **Reversible**: yes

---

### Demoted Decisions

Settled, `committed`, uncontested for 3+ sessions, not cited by ID elsewhere in this doc — demoted per `templates.md`'s demotion rule (full history in git blame if needed).

| Decision | Rationale |
|----------|-----------|
| D2 — Apply LLM prompting techniques (Constitutional/CoT/Validation) selectively, only to commands with multi-branch inference or file writes | Uniform application to simple commands (`read-summary`, `commit`) adds overhead without a reliability gain |
| D5 — A skill's happy path defers to a project's own documented alternative convention (e.g. `ship`'s CI-verify vs a project's rsync hotfix) rather than hardcoding the exception | Keeps the plugin generic/project-agnostic while still respecting a specific project's faster path when documented |
| D7 — A read-only command (`read-summary`) that notices a doc contradicting code must name the drift and route it (to `/update-summary` or `/update-plugin`), not just narrate it in passing | Narrating without routing drops the fix — the handoff is the deliverable, the command itself stays read-only |
| D11 — Extract to `_shared/references/` only true byte-identical duplication (e.g. the "no filler words" table), not broad pointer-extraction of similar-but-not-identical guidance | Generic research shows indirection risks non-compliance; extraction is only worth that risk for genuinely identical content |

---

### D3 — Fix Doc Bloat at the Generator, Not by Hand-Trimming — committed — 2026-06-09

**Problem**
User flagged the `done`/`task-summary` workflow as "bloated." Repeated facts came from each template section "wanting" to restate the critical thing.

**Decision**
Chosen: add anti-bloat governance rules to `task-summary` itself (one-fact-one-home, rows-≤2-sentences, LLM-CONTEXT-is-pointer-index, Quick-Start-≤15-lines) rather than manually trimming individual docs.
- `done` cut 164→111 lines: deleted the inline conversation-analysis procedure (old Step 3, sub-steps 3a–3d) duplicating `update-claude-docs`; capture is now one delegated Skill call. `done` is now Steps 1–2 sequential, 3+4 parallel.
- `## Last Session` strengthened to enforce exactly one heading (was being appended, causing duplicate dated copies).
- CLAUDE.md cleanup (global + skormy project): removed lines duplicating/contradicting skills (stale `/update-summary` row, changelog-gate "STOP and ask" row).

**Rejected**
- Hand-trimming each bloated doc as found. Why not: doesn't fix the generator — every future doc re-bloats the same way.

**Consequences**
A cross-section dedup rule in `task-summary` shrinks every future doc; this is the seed of the "one fact, one home" principle later applied to CLAUDE.md itself (D6) and to the whole-doc MADR conversion of this doc (D12).

**Status**: committed · **Reversible**: yes

---

### D6 — A CLAUDE.md Line Is Dead Weight Once a Skill Enforces It at Action-Time — committed

**Problem**
CLAUDE.md is read at session start (ambient); a skill is read at the moment of action. When both state the same rule, the copies can drift out of sync (seen with `/commit`'s changelog gate).

**Decision**
Chosen: when a skill enforces a rule at action-time, delete the CLAUDE.md copy — the skill wins.

**Consequences**
Prevents a class of stale-CLAUDE.md-vs-skill contradiction; part of the same "one fact, one home" lineage as D3.

**Status**: committed · **Reversible**: yes

---

### D17 — `.claude/rules/*.md` Path-Scoping Frontmatter Does Not Actually Scope; Removed as a Routing Recommendation — committed — 2026-07-12

**Problem**
`update-claude-docs/references/structure.md`'s capture-filter table recommended routing a file-type-specific rule to a "path-scoped rule" (`.claude/rules/*.md` with `paths:`/`globs:` YAML frontmatter), on the assumption this only loads content into context when Claude touches a matching file — the same token-saving property verified for subdirectory `CLAUDE.md`.

**Decision**
Chosen: empirically test the claim with a negative-control canary (a secret string in a path-scoped rule file, probed from a fresh session working on a non-matching path) before trusting it. Result: the file's content loaded into context regardless of whether the task matched the frontmatter's `paths`/`globs` — the model just self-suppresses acting on it if the path doesn't match, which is model judgment, not context filtering. Removed `.claude/rules/` as the recommended routing target; replaced with "a real subdirectory CLAUDE.md," which the same negative-control method confirmed genuinely does scope (absent from context in an unrelated session, present only once a file in that subdirectory is read).

**Rejected**
- Trusting the vendor-docs-sourced claim (a fetched official doc page did describe `.claude/rules/` frontmatter as reducing loaded context) without a live test. Why not: official docs describe intended/designed behavior; a live bug (this exact gap is tracked upstream, e.g. path-scoped rules failing to apply as documented) can silently break the part that matters. "The docs say X" and "X is true in this install" are different facts on a fast-moving CLI tool.
- Leaving the recommendation in place with a caveat. Why not: a routing table is read at the moment of a real decision — a caveat gets skipped under time pressure; the wrong destination needed to be replaced, not annotated.

**Consequences**
- Fixed `update-claude-docs/references/structure.md` (capture-filter table + `@import` row clarified as also not scoping — launch-time load, DRY-only) and `condense-claude-md/SKILL.md` (step 6, added explicit anti-pattern warning) — the two skill files a future CLAUDE.md split decision would actually read.
- Global `~/.claude/CLAUDE.md` Platform Gotchas gained the frontmatter-doesn't-scope row, plus a corrected row on `📖 See <file>` pointer reliability: a follow-up test showed `read-summary`/the project `Explore`/`Plan` agents already do the correct thing (mandatory CLAUDE.md tree-walk + `/read-summary` call) — but that walk is gated on "does this look like a documented feature/flow," same gate as task-doc discovery, not on "does the search touch a directory with a CLAUDE.md." A generic symptom-only investigation prompt naming no specific flow can slip past that gate straight to code search. Initial framing ("investigation tasks skip docs") was imprecise; corrected after tracing the actual gate in `Explore.template.md`/live `Explore.md`.
- Establishes a general lesson for this decision log's "verify before documenting" lineage: a context-management mechanism's own official docs are a claim to test empirically (negative control: plant a distinguishable fact, probe from a session that should NOT have it, confirm absence), not evidence to route on directly — same standard as any other unverified project claim. Also: when a negative-control test finds a "reliability gap," trace it to the actual gating logic in the responsible skill/template before generalizing — the first plausible explanation (task-type) was wrong; the real one (feature-name-matching) was one file-read away.

**Status**: committed · **Reversible**: yes (revisit if Anthropic ships a fix — GitHub issues describing path-scoped rules failing to apply are open as of this writing)

---

### D18 — `/read-summary` Discovery in `Explore`/`Plan` Made Unconditional, Reversing D17's "Gate Is Correct Design" Call — committed — 2026-07-12

**Problem**
D17 traced the `📖 See <file>` pointer-reliability gap to `Explore`/`Plan`'s Bootstrap gate: task-doc/CLAUDE.md discovery only ran when the prompt "named a feature/flow," and D17 concluded this gate was intentional, correct design (matching `read-summary`'s own "don't reflexively spawn for trivial lookups" principle) — not a defect. Asked directly whether to make discovery unconditional anyway, the user chose precision over efficiency: **"burn tokens on unnecessary lookups over risk missing a real gotcha."**

**Decision**
Chosen: remove the feature/flow-name gate from `Explore.template.md` and `Plan.template.md` (plus the live `autorentic/.claude/agents/Explore.md`/`Plan.md`) — `/read-summary` discovery (or its inline Glob+Grep fallback) now runs on every single call, including a bare single-symbol lookup ("where is `formatMoney` defined?") or an obviously-rote implementation. Bootstrap sections now open with a `⚠️ MANDATORY, no exceptions` line before the file table, rather than a caveat about "detailed prompts" buried after it.

**Rejected**
- Leaving `Explore` gated but making `Plan` unconditional (or vice versa). Why not: user's stated preference was general ("I don't mind, Explore is haiku anyway") — applied to both since `Plan`'s lower call-frequency per session offsets its higher per-call model cost (sonnet) similarly to `Explore`'s low per-call cost at higher frequency.
- Only strengthening wording in the existing caveat rather than restructuring Bootstrap's opening. Why not: the caveat already existed (D17's own text) and still didn't prevent the original miss — a rule stated as an exception-to-a-default reads weaker than one stated as the default itself; matches this doc's own D3/D6 "escalate by position and sharpness" lineage.
- Reverting D17's underlying finding (that the old gate was well-designed). Why not: D17's finding was correct as a description of the code's PRE-existing intent — this decision is a values call by the user overriding that intent going forward, not new evidence that the old design was flawed.

**Consequences**
- `Explore`/`Plan` pay a `/read-summary` discovery cost on every invocation now, including previously-skipped trivial calls — accepted cost, per user's explicit choice.
- `agent-setup/SKILL.md` Step 4/5 rewritten to state the unconditional requirement as the rule itself, not an exception.
- Plugin-wide: every future project's `Explore.md`/`Plan.md` scaffolded via `agent-setup` inherits the unconditional gate by default.

**Status**: committed · **Reversible**: yes (stated user preference, not a discovered technical fact — could be regated later)

---

### D19 — Task-Doc Index + Pointer Added as a Second Structural Lever for Over-Budget CLAUDE.md Files — committed — 2026-07-12

**Problem**
`update-claude-docs/references/structure.md` §6 offered exactly ONE structural lever for a CLAUDE.md file over the 200-line budget: push a section down to a subdirectory CLAUDE.md, gated on the seam-test. A horizontal-layer file (`app/CLAUDE.md`) commonly fails that seam-test — its gotchas are about shared primitives (Eloquent casts, multi-agency scoping) used across many `Domain/*` dirs, not confined to one. D18 confirmed `Explore`/`Plan` now run `/read-summary` discovery unconditionally and reliably follow a task doc's own `📖 See <file>` pointer rows — a mechanism that didn't exist as "reliable" when §6 was originally written.

**Decision**
Chosen: add a second lever to `references/structure.md` §6 — when a block is too big to inline, fails the subdirectory seam-test, but IS scoped to one documented feature/flow (not a cross-cutting layer convention), route it to that feature's task doc `## Gotchas` table with a bare `📖 See <file>` pointer row, no inline duplication required. Explicit boundary table added distinguishing this from the subdir lever: needs a real FEATURE identity (confirmed via the same content-based `/read-summary` discovery, never a guessed folder slug), not a real directory. Also relaxed the Capture-mode "always inline 1-2 critical facts alongside a pointer" rule — that rule's rationale ("a fresh session won't follow pointers unprompted") is now only true for a top-level session reading CLAUDE.md directly; it does NOT apply to a task doc's own Gotchas-table pointer, which `Explore`/`Plan` follow reliably post-D18.

**Rejected**
- Applying this lever to ANY over-budget block, including cross-cutting layer conventions. Why not: `code-reviewer`/`code-simplifier` don't run `/read-summary` on every trivial edit the way `Explore`/`Plan` now do (D18 only changed those two) — a write-time convention a fresh session needs BEFORE editing would silently vanish for those agents if moved out of CLAUDE.md. Restricted to debugging/investigation-shaped content (`Symptom \| Cause \| Fix`), which is what a task doc's Gotchas table already holds and what `Explore`/`Plan` actually consume.
- Treating "seam-test fails" as terminal (per D17's own then-correct conclusion, later reaffirmed in `condense-claude-md`'s step 6 warning: "the section stays in the layer file — that's the correct outcome"). Why not: that conclusion predates D18's mandatory-discovery change; a lever that didn't reliably work when D17 was written now does, verified live.
- Auto-creating a new task doc slug just to hold a relocated section. Why not: an orphaned single-purpose doc invented to house one block is worse than leaving the block inline — the lever only applies when a real feature doc exists or genuinely should via content-based discovery, never a guessed folder name.

**Consequences**
- `update-claude-docs/references/structure.md` §6 gained the second-lever section + boundary table (Create step 5, Rewrite step 6 reference it).
- `update-claude-docs/SKILL.md`'s "inline critical facts" rule scoped to CLAUDE.md-level pointers only — no longer applies to task-doc-internal pointers.
- `condense-claude-md/SKILL.md` step 6's seam-test-fails warning updated: checks feature-specificity before declaring the layer file terminal.
- Reopened `app/CLAUDE.md`'s Multi-Agency/Cast/Media Gotchas bloat as a candidate — initially assessed as still failing this lever (not single-feature-scoped). ⚠️ See correction below.

⚠️ **Correction (see D20)**: "spans the whole authz layer" was true but irrelevant to seam — Multi-Agency concentrates 11-26x in `app/Http/*` vs 0-4 in `app/Domain/*`, so it DID pass the seam-test against a subdirectory this decision never checked. Cast Gotchas held up as genuinely cross-cutting under the same check (46+20 hits in `Domain`/`Models`, ~0 in `Http`).

**Status**: committed · **Reversible**: yes

---

### D20 — Seam-Test Must Check EVERY Real Sibling Subdirectory, Not Just the Intuitively-Obvious One — committed — 2026-07-12

**Problem**
D17 concluded Multi-Agency Gotchas "fails the seam-test," checked only against `app/Domain/*` (the subdirectory its NAME suggests). Re-examination grepped its core symbols against every top-level `app/` subdirectory and found 5-10x concentration in `app/Http/` vs near-zero in `Domain/*` — a real seam the original check never looked for.

**Decision**
The seam-test itself was under-specified — "check the seam-test" meant "check the intuitively-named subdirectory," a naming guess, not a systematic check. Added an explicit instruction to `references/structure.md` §1 and both `condense-claude-md`/`update-claude-docs` SKILL.md: grep the section's 3-5 core symbols against EVERY plausible candidate subdirectory with `rg -l "<symbol>" <dir> --type=<lang> | wc -l`, let counts decide. Applied live: created `app/Http/CLAUDE.md` (86 lines), moved Multi-Agency Gotchas + Controller/Resource Patterns there, `app/CLAUDE.md` shrank 295→241 lines (24.5KB→19.5KB, -20.5%), verified with a negative/positive control pair.

**Rejected**
- Treating this as a one-off correction to D17 alone, not a methodology fix. Why not: the same "check only the obvious candidate" gap exists in every place the seam-test is invoked (`condense-claude-md` step 6, `update-claude-docs` §2/Rewrite step 6) — fixing D17's specific conclusion without fixing the underlying check means the next session hits the identical miss on a different section/project.
- Re-checking Cast Gotchas and Media/PDF against the same broadened methodology and finding they ALSO have a hidden seam. Why not: actually checked (grep counts run) — Cast Gotchas stays genuinely cross-cutting (`$casts` concentrates in `Domain`+`Models`, both real content-generating layers, no single dominant seam), Media/PDF splits evenly between `Http`/`Domain` with no dominant candidate either. Not every miss is the same miss; verified rather than assumed the fix generalized to all three sections.

**Consequences**
- `references/structure.md` §1, `condense-claude-md/SKILL.md` step 6, `update-claude-docs/SKILL.md` §2 patched with the "check every real sibling" instruction + `rg -l ... | wc -l` methodology.
- D19's text kept as-written, correction note added rather than rewritten — MADR log preserves what was concluded at each point, including the miss.
- `app/CLAUDE.md` bloat (D19 predicted unsolvable by the pointer lever) WAS solvable by the ordinary subdirectory-split lever, once checked against the right candidate. Both levers remain correctly scoped; this only fixes how the first lever's applicability gets checked.

**Status**: committed · **Reversible**: yes

---

### D22 — `condense-claude-md`'s Verification Diff Needed a Second-Pass Filter, and Completion Needed a Byte Threshold Alongside the Line Threshold — committed — 2026-07-12

**Problem**
Two gaps in a live Dourr `CLAUDE.md` condensation run. (1) The prescribed `diff`/`comm -23` verification flagged ~30 lines as possibly-dropped; all were false positives (reworded labels, table-header artifacts), requiring manual `grep -c` triage the skill never mentioned. (2) The pass hit the ≤200-line target (257→221) and was reported complete, but the file was still 20.4KB — a `Symptom | Fix` table's rows don't merge under compression, so line count hit target while bytes stayed high.

**Decision**
Two patches to `condense-claude-md/SKILL.md`. (1) Verification rule now warns `diff`/`comm` output is a *candidate list, not a verdict* — each flag needs `grep -c '<substring>'` confirmation before escalating. (2) Added Process step 6: hitting the line target isn't automatically done — also check a byte target (~15KB for a root CLAUDE.md); if still high, proactively offer a seam-test split via `AskUserQuestion` in the same turn as the compression report.

**Rejected**
- Leaving the diff/comm check as-is, treating the manual `grep -c` triage as implicit good practice. Why not: the same false-positive noise will recur on every future run of this exact command shape (rewording is the norm, not the exception, in a condensation pass) — worth naming as a known step, not left to be independently re-discovered each time, matching this doc's own D20/D6 lineage of promoting a repeated ad hoc fix into a stated rule.
- Raising the line-count target itself (e.g. ≤150) instead of adding a parallel byte check. Why not: line count and byte density are orthogonal axes for a one-row-per-item table — a lower line target doesn't fix a table whose rows are already irreducibly long; the existing ⚠️ note under Process already identifies this shape as line-count-deceptive, so the real fix is checking the metric that shape actually hides (bytes), not tightening the metric that was never diagnostic for it.
- Making the seam-test split offer mandatory/automatic without asking. Why not: splitting creates a new file and changes what loads when — a structural change with real tradeoffs (the seam-test can fail, or the user may prefer to accept more lines over more files), consistent with this skill already gating splits behind `AskUserQuestion` rather than executing them unprompted.

**Consequences**
- `condense-claude-md/SKILL.md`: verification bullet gained the false-positive-filter note; Process gained step 6.
- Dourr `CLAUDE.md` further split: root `CLAUDE.md` (181 lines/12.7KB) + new `docker/CLAUDE.md` (53 lines/8.5KB, passes seam-test) — root kept app-code gotchas plus a `📖` pointer.

**Status**: committed · **Reversible**: yes

---

### D23 — Skill-File Density Is a Distinct Bloat Class From CLAUDE.md/Task-Doc Bloat, and `update-plugin` Now Owns Its Checklist — committed — 2026-07-12

**Problem**
User flagged the plugin's own skills (SKILL.md files) as "bloated," specifically naming `update-claude-docs` and `task-summary`. Both sat under their line budgets (~230 lines each) — line count, the metric D22 already patched for CLAUDE.md, didn't explain the complaint. A full-plugin audit found the real signal was bytes/line: `condense-claude-md` and `condense-task-doc` — the two skills whose JOB is fixing this pattern in other files — were themselves the densest files in the plugin (147 and 140 bytes/line), each preaching conciseness while stacking multiple ⚠️ callouts that re-justified the same rule and embedding worked-incident anecdotes as instruction text.

**Decision**
Two-round hand-edit pass (SKILL.md files aren't CLAUDE.md files, so `condense-claude-md`/`condense-task-doc` don't apply — no delegation target existed). Round 1 (v1.62.0): collapsed stacked warnings and stripped anecdotes across 7 skills (`condense-claude-md`, `condense-task-doc`, `agent-setup`, `task-summary`, `update-claude-docs`, `notes-summary`, `done`); `update-claude-docs` additionally got its cold-path CREATE/REWRITE/CONDENSE modes extracted to `references/other-modes.md` (239→205 lines, 27% smaller hot path) since Capture is the only mode `/done` depends on. Round 2 (v1.63.0), after a re-audit specifically checking for the same structural lever plugin-wide: `read-summary`'s "high ratio is structural, not redundant" verdict from round 1 was revised — two worked-anecdote examples and one self-justifying warning were real cuts (82→71 lines); `task-summary`'s rare merge/rename branch (§2a) extracted to `references/merge-rename.md` (223→202 lines). The plugin-wide structural-lever scan found no other candidates — everything else is single-purpose or has only small/frequent branches. Captured the whole pattern into `update-plugin/SKILL.md` (v1.63.1) as a new Step 1 signal ("skill reads as bloated/dense") + Step 3a checklist, so a future density ask routes through a documented list of 6 named patterns instead of a from-scratch audit.

**Rejected**
- Delegating skill-density fixes to `condense-claude-md`/`condense-task-doc`. Why not: those skills' entire density-rule vocabulary (WHY-column stripping, `Symptom|Cause|Fix` table shape, `{#anchor}` preservation) is CLAUDE.md/task-doc specific; SKILL.md files have different structure (frontmatter, mode sections, `references/` split) and no equivalent skill existed to point to.
- Treating this as one-time manual cleanup with no reusable capture. Why not: the same shape (stacked warnings, worked anecdotes, self-contradiction, cold-path-in-hot-path) is exactly the kind of recurring, nameable pattern this doc's own D3/D6/D13 lineage says belongs in the generator/checklist, not re-discovered by inspection each time a skill grows dense again.
- Extracting cold-path content from every skill preemptively, not just the two found. Why not: the round-2 plugin-wide scan explicitly checked all 12 remaining skills for this lever and found only `task-summary` §2a qualified — most skills are single-purpose with no hot/cold split; forcing an extraction where none is warranted adds indirection without a token-budget payoff.

**Consequences**
- 9 skill files edited across two rounds; 2 new `references/*.md` files created (`update-claude-docs/references/other-modes.md`, `task-summary/references/merge-rename.md`); `update-plugin/SKILL.md` gained a permanent density-pass capability (Step 1 signal + Step 3a checklist, 80→96 lines).
- Plugin version bumped 1.61.2→1.63.1 across three CHANGELOG entries; `plugin.json`/`marketplace.json` kept in sync (also caught `marketplace.json` silently stale at 1.61.0 against `plugin.json`'s 1.61.2 from an earlier session — unrelated pre-existing drift, not touched beyond the sync).
- The byte-density signal (`wc -lc`, flag >80-90 bytes/line) is now the standard first check for a density complaint on ANY plugin file — SKILL.md, CLAUDE.md, or task doc — even though the fix mechanism differs per file type (delegate to condense-* for CLAUDE.md/task docs; hand-edit + Step 3a checklist for SKILL.md).

**Status**: committed · **Reversible**: yes

---

### D12 — Full Duplication Survey Fixed Two Cases, Explicitly Left the Rest — committed

**Problem**
User's "everything feels condensable" ask required a full survey of all 6 commands + 18 skills, not spot-fixes.

**Decision**
Chosen: fixed two real near-duplications, left three shared-shape-but-not-duplicated cases alone.
- Fixed: `ship`'s Step 2 staleness-gate bullets (paraphrased `commit.md`'s Step 3 gate almost word-for-word) → collapsed to a one-line pointer at `commit.md` as sole canonical source.
- Fixed: `task-summary`'s §2a merge rules table (redundant with `merge-task-docs`' fuller version) → trimmed to just the rename-only row (not delegated) + a pointer for the rest.

**Rejected**
- Merging `update-claude-docs` and `update-plugin` (share a Scan→Route→Write→Validate skeleton). Why not: they apply that skeleton to disjoint content (CLAUDE.md sections vs SKILL.md files) — shared shape, not duplicated text.
- Merging thin command aliases (`write-summary`/`update-summary`). Why not: intentional dual triggers, not duplication.
- Merging the `task-summary`/`condense-task-doc`/`merge-task-docs` three-way split. Why not: already properly decomposed by operation, not overlapping.

**Consequences**
Establishes the litmus test for future condensation passes: shared *shape* applied to disjoint *content* is not duplication; only true text/logic overlap is. This same litmus test justified keeping this doc's own agent-architecture/doc-condensation/skill-lifecycle split by theme rather than merging into one bucket.

**Status**: committed · **Reversible**: yes
</content>
