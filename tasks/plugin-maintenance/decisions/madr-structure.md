<!--LLM-CONTEXT
Status: Reference
Domain: plugin-maintenance/madr-structure
Gotchas (critical — full list in each ADR's Consequences):
  - MADR is now the DEFAULT per-decision structure, not an opt-in for decision-heavy docs — escape hatch only when Rejected would be empty (D16, supersedes D8's "never default" clause).
  - Whole-doc MADR replaces (not adds to) the Decisions + Gotchas tables — priced differently than per-block MADR (D8, pricing model still holds).
  - A doc-format upgrade must ship its condensation-rule update in the same change (D13)
Related: ../current.md (index), ../doc-condensation.md (router), ../agent-architecture.md (router), ../../../skills/task-summary/references/templates.md
Last updated: 2026-07-10
-->

# Plugin Maintenance — MADR Structure Decisions

Decisions about the MADR (decision-record) format itself: when to use it, how it's priced, and how the doc-editing skills must handle it as a structure distinct from a plain table.

---

### D8 — Whole-Doc MADR Is Priced Differently From Per-Decision MADR — committed

**Problem**
The per-block MADR rule ("+18-20 lines, use sparingly") measures ADDING a block beside existing Decisions + Gotchas tables. Applying that same cost model to a whole-doc rewrite would wrongly predict runaway growth.

**Decision**
Chosen: a whole-doc MADR rewrite REPLACES the Decisions + Gotchas tables — folding each gotcha into its owning ADR's Consequences removes the decision-vs-gotcha cross-section duplication. `task-summary` branches whole-doc structure on the doc's primary value: decision-traceability → full MADR log; operational cold-start → standard structure. Only on explicit user request, never default.

**Rejected**
- Treating whole-doc conversion as N× the per-block cost. Why not: measured directly — a 13-decision/27-gotcha doc converted 307→284 lines (shorter), not +200, because gotchas stopped being duplicated.

**Consequences**
- A decision-heavy doc where most gotchas trace to a specific decision is a GOOD whole-MADR candidate (this doc: 15 decisions, most gotchas traced to one).
- A gotcha-heavy doc whose traps are environment/deploy noise (not consequences of a choice) is a BAD candidate — those gotchas have no ADR to live under.
- Line count can still RISE on a denser doc even when the fit is good (measured 275→470 lines but 54.3KB→49.0KB on one doc) — judge by bytes/qualitative dedup, not the 300-line budget, which is calibrated for standard-structure docs.
- This doc itself (`plugin-maintenance/current.md`) later split further — index + grouped-by-theme decision files (see index) — once total size crossed a threshold where per-theme discoverability outweighed single-file searchability.

**Status**: committed · **Reversible**: yes

---

### D9 — Knowledge-Capture Skills With Multiple Modes Split Canonical Structure Into `references/` — committed

**Problem**
`update-claude-docs` grew from pure session-capture into the CLAUDE.md analog of `task-summary` (create / rewrite-to-best-practice / condense / capture) — a single SKILL.md couldn't hold both the workflow and the canonical template without bloating.

**Decision**
Chosen: SKILL.md holds the workflow; `references/structure.md` holds the canonical CLAUDE.md template + hierarchy + capture-filter + 200-line budget. Mirrors the split `task-summary`/`templates.md` already uses.

**Consequences**
Create/rewrite modes conform to one source of truth; capture mode inlines only the routing + filter it needs, not the whole template.

**Status**: committed · **Reversible**: yes

---

### D10 — A Skill/Command Sharing a Name Needs No Wrapper Command — committed

**Problem**
`update-claude-docs` was a command; converting it to a skill of the same name would seem to leave the command wrapper redundant, but it wasn't obvious this was actually safe.

**Decision**
Chosen: delete the wrapper. A skill's `name:` frontmatter already registers `/update-claude-docs`, and direct invocation forwards the user's trailing text as args — mode-detection works without a `$ARGUMENTS`-forwarding wrapper.

**Rejected**
- Keeping a thin command wrapper "just in case." Why not: it was pure duplication once the skill name matched — a wrapper only earns its place when the command and skill names differ (see `write-summary`/`update-summary`, which stay as thin aliases into `task-summary`).

**Consequences**
Applied the same logic to `read-summary`: a 71-line command with a real workflow (discovery algorithm, staleness-audit handoff, exit-gate) converted to a skill outright — command deleted, no backward-compat pointer, since it had no sibling skill to alias into.

**Status**: committed · **Reversible**: yes

---

### D16 — MADR Is the Default `Key Technical Decisions` Structure, Not an Opt-In Upgrade — committed — 2026-07-10

**Problem**
D8 gated whole-doc MADR conversion behind an explicit user ask, and the per-block rule in `templates.md` treated MADR as reserved for decision-heavy docs. A user who'd just seen a whole-doc MADR split (index + `decisions/*.md`) on a real task doc found the structure clearly better and asked to make it the default for ALL task docs — first with a size/decision-count threshold, then explicitly dropping the threshold entirely mid-session ("i want the madr also to be the default one, not the traditional one anymore").

**Decision**
Chosen: MADR (Problem/Decision/Rejected/Consequences/Status) is now the default shape for every entry in `## Key Technical Decisions`, per-decision — not gated behind a doc-level decision count or an explicit ask. Escape hatch to the plain `| Decision | Rationale |` table row survives for ONE case only: a decision that genuinely had no alternative considered, where Rejected would come up empty. A doc's `## Key Technical Decisions` section is therefore a whole-doc MADR the moment it holds its first non-escape-hatch decision — there's no separate doc-level "is this decision-heavy enough" gate anymore; that judgment collapsed into the per-block escape-hatch test alone.
- `templates.md`'s per-block section rewritten: MADR default, escape hatch documented, "measured cost" reframed from "reach for MADR sparingly" to "apply the escape hatch honestly."
- `templates.md`'s whole-doc section rewritten: no longer a separate ask-gated choice — it's now a description of what the per-decision default produces once a doc has any real decisions.
- `task-summary/SKILL.md` Density rules + Step 4 validation both updated to check MADR compliance on every create/update, not just when a doc "feels" decision-heavy.
- `condense-task-doc/SKILL.md`'s split-trigger reworded from "propose a split" (ask) to "split" (default action) once a whole-doc MADR crosses 300 lines post-conversion — this default was already user-approved in the prior session (the split-threshold rule), only the MADR-adoption gate itself changed here.

**Rejected**
- A 2+ decision-count threshold before converting a doc to whole-doc MADR (the FIRST answer given this session, before the user clarified further). Why not: superseded within the same session — the user explicitly rejected any threshold, wanting MADR as the unconditional default modulo the escape hatch.
- Dropping the escape hatch entirely (MADR from decision #1, zero floor, no plain-table option ever). Why not: user explicitly chose to keep it for decisions that never had a real alternative — forcing Problem/Rejected on a non-decision is empty ceremony the escape hatch exists to prevent.
- Leaving D8's "only on explicit user request, never default" stance untouched and treating this as a one-off doc-specific choice. Why not: the user's request was explicitly about the PLUGIN'S default behavior across all task docs, not just the doc being worked on — this belongs in `update-plugin` territory (SKILL.md behavior), not a single task doc's content.

**Consequences**
- Every NEW task doc decision costs ~18-20 lines by default now (previously ~1 line unless a doc had already earned MADR). This trades doc size for decision-traceability as the house style — accepted tradeoff, not a side effect to work around.
- `condense-task-doc` still must never flatten an MADR block back to a table row as a generic condensation step (D13 still holds) — the only demotion path remains templates.md's settled-and-unrevisited rule.
- A cold-start agent reading ANY task doc's Key Technical Decisions section should now expect MADR blocks as the norm; a plain table row is the exception and signals "no real alternative existed," not "this decision wasn't important enough for MADR."
- Supersedes D8's "never default" stance specifically; D8's OTHER content (whole-doc pricing model, decision-vs-gotcha dedup mechanics) is unaffected and still holds.

**Status**: committed · **Reversible**: yes (a house-style default, not a technical constraint) · Supersedes D8 (the "never default" clause only)

---

### D13 — A Doc-Format Upgrade Ships Its Condensation Rule in the Same Change — committed

**Problem**
Prototyping the MADR-style `Key Technical Decisions` block for `task-summary` surfaced that `condense-task-doc`'s only applicable rule ("one row, WHY in ≤1 sentence") would silently flatten a new MADR block back to a table row on its first condensation pass — destroying the "why we rejected X" content the block exists to hold.

**Decision**
Chosen: ship the block format AND every skill that edits/compresses that section's handling of it, in the same change. Fixed together: `templates.md` (block format + 20-line size ceiling + demotion rule), `task-summary/SKILL.md` (edit-in-place-vs-append classification as a decision evolves), `condense-task-doc/SKILL.md` (field-priority compression order, Rejected never touched).

**Rejected**
- Shipping the block format first, teaching downstream skills to handle it "as a follow-up." Why not: the gap between the two ships is exactly when the flattening bug fires — any doc condensed in that window loses its Rejected content permanently.

**Consequences**
A structured multi-field block is a genuinely different content shape than a table row; any skill that adds one must teach every skill that edits/compresses that section how to handle the new shape, not just the skill that creates it. This doc's own MADR conversion (D8) is downstream of this fix existing.

**Status**: committed · **Reversible**: no (retroactive — the fix must ship atomically with any future new block-shape)
