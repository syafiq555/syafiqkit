<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/doc-condensation
Gotchas (critical — full list in each ADR's Consequences):
  - Fix doc bloat at the generator (task-summary rules), not by hand-trimming individual docs (D3)
  - Shared *shape* applied to disjoint *content* is not duplication — only true text/logic overlap is (D12)
Related: ../current.md (index), ../decisions/madr-structure.md, ../decisions/agent-architecture.md
Last updated: 2026-07-09
-->

# Plugin Maintenance — Doc & CLAUDE.md Condensation Decisions

Decisions about fighting duplication and bloat across task docs, CLAUDE.md files, and skills themselves — the "one fact, one home" lineage.

---

### D2 — Apply LLM Prompting Techniques Selectively, Not Universally — committed — 2026-02-21

**Problem**
Command reliability varied — some commands mis-routed on multi-branch inference, others were fine.

**Decision**
Chosen: apply Constitutional constraints (❌ rules), Chain-of-Thought (`<thinking>` pre-flight), and Validation Loops (re-read after write) only to commands with multi-branch inference or file writes.
- `write-summary`: Constitutional (Steps 3+4) + CoT (Step 0) + Validation (Step 5)
- `update-summary`: Constitutional (Step 2) + Validation (Step 3)
- `update-claude-docs`: Constitutional (Step 3c) + CoT (Step 0) + Validation (Step 3f)

**Rejected**
- Applying all three techniques to every command uniformly. Why not: simple commands (`read-summary`, `commit`) don't benefit — overhead reduces clarity without a reliability gain.

**Consequences**
- `<thinking>` as Step 0 (pre-flight, not inline) externalizes routing decisions before action, preventing silent mid-step errors and easing review.
- Validation loop re-reading the file after write catches silent truncation bugs Edit confirmation alone misses.
- Version bumped 1.6.3 → 1.6.4. `read-summary` was later converted from command to skill (2026-07) — see index Current Skills table.

**Status**: committed · **Reversible**: yes

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

### D5 — A Skill's Happy Path Must Defer to a Project's Documented Alternative — committed

**Problem**
`ship`'s CI-verify step assumed `gh run list` polling always applies. Some projects define a faster non-CI deploy path (e.g. rsync hotfix) in their own `CLAUDE.local.md` for a subset of changes.

**Decision**
Chosen: the skill checks for a project-documented alternative convention first, rather than hardcoding one project's specifics into the plugin.

**Rejected**
- Hardcoding the rsync-hotfix exception into `ship` itself. Why not: plugin must stay self-contained and project-agnostic.

**Consequences**
Keeps `ship` generic across projects while still respecting a specific project's faster path when documented.

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

### D7 — A Read-Only Command Must Still Route What It Notices — committed

**Problem**
`read-summary` reads/audits docs constantly and is uniquely placed to catch a doc contradicting the code (stale `Status:`, swapped provider, moved files, expired caveat) — but narrating the drift in passing dropped the fix; nothing acted on it.

**Decision**
Chosen: add a "doc-staleness handoff" rule — name the drift as a finding, then route to `/update-summary` (project fact) or `/update-plugin` (skill defect). The command itself stays read-only; the handoff is the deliverable.

**Consequences**
Read-only commands can surface fixes without becoming write commands themselves — the routing is the contribution, not a direct edit.

**Status**: committed · **Reversible**: yes

---

### D11 — Extract Only True Verbatim Cross-Skill Duplication to `_shared/references/` — committed

**Problem**
Research surfaced conflicting guidance: generic LLM-instruction research says inline repetition is more reliable than pointers (indirection risks non-compliance), while Anthropic's Skills docs recommend `references/*.md` extraction because Skills load references on demand (a documented mechanism, not a bare in-prompt pointer).

**Decision**
Chosen: scope extraction narrowly — only pull byte-identical tables repeated across many skills. Pulled the "no filler words" table (identical across `task-summary`, `notes-summary`, `update-claude-docs`, `condense-task-doc`, `condense-claude-md`) into `skills/_shared/references/writing-style.md`. Left skill-specific rules, rationale, and edge cases inline everywhere else.

**Rejected**
- Broad pointer-extraction of anything resembling shared guidance. Why not: risks the indirection-reliability tradeoff the research flagged, for content that isn't actually byte-identical.

**Consequences**
`merge-task-docs` mentions "no filler words" only as a one-word inline nod (not the duplicated table) — left as-is rather than pointed at the shared file, since there was nothing to extract.

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
- `Explore`/`Plan` now pay a `/read-summary` discovery cost on every invocation, including calls that would previously skip it as trivial. Accepted cost, per user's explicit choice.
- `agent-setup/SKILL.md` Step 4 rule and Step 5 checklist item rewritten to state the unconditional requirement, replacing the "detailed prompt is not a signal to skip" framing (now a redundant sub-case, not the rule itself).
- Any FUTURE project's `Explore.md`/`Plan.md`, scaffolded via `agent-setup` from this point forward, inherits the unconditional gate by default — this is a plugin-wide behavior change, not scoped to Autorentic alone.

**Status**: committed · **Reversible**: yes (a future session preferring efficiency over precision could reintroduce a gate — this decision is a stated user preference, not a discovered technical fact)

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
- `update-claude-docs/references/structure.md` §6 gained the second-lever section + boundary table; Create mode step 5 and Rewrite mode step 6 both reference it as an alternative to dropping content.
- `update-claude-docs/SKILL.md`'s "inline critical facts" rule scoped to CLAUDE.md-level pointers only — no longer blanket-applies to task-doc-internal pointers.
- `condense-claude-md/SKILL.md` step 6's seam-test-fails warning updated: no longer declares the layer file as the terminal outcome — checks feature-specificity first.
- This directly reopens `app/CLAUDE.md`'s original bloat problem from earlier in this session (Multi-Agency/Cast/Media Gotchas, ~200 lines combined) as a CANDIDATE for this lever — none of those sections are single-feature-scoped though (Cast Gotchas applies to every model; Multi-Agency spans the whole authz layer), so applying the boundary table's own criteria, they likely still fail this lever too and stay inline. The lever is proven and available; it doesn't retroactively make that specific file's bloat solvable — a future session should re-evaluate per-block, not assume the lever automatically applies there.

⚠️ **Correction (see D20)**: "Multi-Agency spans the whole authz layer" turned out to be true but irrelevant to whether it has a real seam — it's concentrated in `app/Http/*` (Controllers/Requests/Middleware/Resources: 11-26 grep hits per symbol) vs. near-zero in `app/Domain/*` (0-4 hits). The section DID pass the seam-test, just against a subdirectory this decision never checked. The Cast Gotchas conclusion (46+20 hits in `Domain`/`Models`, ~0 in `Http`) held up under the same check — it's genuinely cross-cutting model code, no dominant seam.

**Status**: committed · **Reversible**: yes

---

### D20 — Seam-Test Must Check EVERY Real Sibling Subdirectory, Not Just the Intuitively-Obvious One — committed — 2026-07-12

**Problem**
D17 concluded `app/CLAUDE.md`'s Multi-Agency Gotchas section "fails the seam-test" and stays in the layer file — checked only against `app/Domain/*` (the subdirectory tree the section's NAME suggests). A later re-examination, prompted by the user pushing back on accepting 24KB of density as final, grepped the section's core symbols (`getActiveAgency`, `hasAccessTo`, `isAdminOf`, `X-Agency-Id`) against every top-level `app/` subdirectory and found 5-10x concentration in `app/Http/` (Controllers/Requests/Middleware/Resources) vs. near-zero in `Domain/*` — a real seam the original check never looked for, because `app/Http/CLAUDE.md` didn't exist yet and the section's subject matter ("Multi-Agency") reads as domain-owned by name, not Http-owned.

**Decision**
Chosen: the seam-test methodology itself was under-specified — "check the seam-test" implicitly meant "check against the subdirectory the content is intuitively about," which is a naming-convention guess, not a systematic check. Added an explicit instruction to `references/structure.md` §1 (canonical definition) and both `condense-claude-md`/`update-claude-docs` SKILL.md (where the seam-test is invoked as a workflow step): grep the section's 3-5 core symbols against EVERY plausible candidate subdirectory with `rg -l "<symbol>" <dir> --type=<lang> | wc -l`, and let usage counts decide — never eyeball which directory "sounds right." Result applied live: created `app/Http/CLAUDE.md` (new file, 86 lines), moved Multi-Agency Gotchas + Controller/Resource Patterns there, `app/CLAUDE.md` shrank 295→241 lines (24.5KB→19.5KB, -20.5%) — verified end-to-end with a negative/positive control pair (a Domain-only session does NOT load the content; reading a file under `app/Http/` does).

**Rejected**
- Treating this as a one-off correction to D17 alone, not a methodology fix. Why not: the same "check only the obvious candidate" gap exists in every place the seam-test is invoked (`condense-claude-md` step 6, `update-claude-docs` §2/Rewrite step 6) — fixing D17's specific conclusion without fixing the underlying check means the next session hits the identical miss on a different section/project.
- Re-checking Cast Gotchas and Media/PDF against the same broadened methodology and finding they ALSO have a hidden seam. Why not: actually checked (grep counts run) — Cast Gotchas stays genuinely cross-cutting (`$casts` concentrates in `Domain`+`Models`, both real content-generating layers, no single dominant seam), Media/PDF splits evenly between `Http`/`Domain` with no dominant candidate either. Not every miss is the same miss; verified rather than assumed the fix generalized to all three sections.

**Consequences**
- `references/structure.md` §1, `condense-claude-md/SKILL.md` step 6, `update-claude-docs/SKILL.md` §2 all patched with the "check every real sibling, not just the obvious one" instruction + the `rg -l ... | wc -l` concrete methodology.
- D19's own text (written the same session, before this correction) has a correction note added rather than being rewritten — the MADR log preserves what was actually concluded at each point, including the miss, not just the final corrected state.
- `app/CLAUDE.md` bloat, which D19 predicted was NOT solvable by the task-doc-pointer lever, WAS solvable — by the ordinary subdirectory-split lever (§6's FIRST lever, not the second), once checked against the right candidate. The two levers (subdirectory split vs. task-doc pointer) remain correctly scoped to their own use cases; this decision only fixes how the FIRST lever's applicability gets checked.

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
