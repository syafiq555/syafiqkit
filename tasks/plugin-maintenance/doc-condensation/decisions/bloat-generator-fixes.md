<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation/bloat-generator-fixes
Gotchas (critical — full list in each ADR's Consequences):
  - Fix doc bloat at the generator (task-summary rules), not by hand-trimming individual docs (D3)
  - A CLAUDE.md line is dead weight once a skill enforces it at action-time (D6)
  - `.claude/rules/*.md` path-scoping frontmatter doesn't actually scope (D17)
  - `/read-summary` discovery in Explore/Plan is now unconditional, not gated on prompt specificity (D18)
  - Task-doc index + pointer is a second structural lever for over-budget CLAUDE.md (D19)
  - Seam-test must check EVERY real sibling subdirectory, not just the obvious one (D20)
Related: ../current.md (feature index), ../../agent-architecture/current.md, ../../madr-structure/current.md
Last updated: 2026-07-20
-->

# Doc Condensation — Fix Bloat at the Generator, Not by Hand-Trimming

The seed lineage: doc bloat gets fixed in `task-summary`'s rules and CLAUDE.md's structural levers, not by manually trimming individual docs after the fact.

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
