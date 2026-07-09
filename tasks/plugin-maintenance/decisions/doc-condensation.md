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
