# Creating and Updating Task Docs

## When Creating

Use the Full Template from `references/templates.md` as the gold standard; scale down to Minimal only for single bug fixes or short sessions.

Copy section headings, table columns, and field names verbatim from the template — renaming a column, reordering a field, or swapping in free-form bullets where a table is specified breaks the structure every other rule in SKILL.md assumes exists.

LLM-CONTEXT required fields: `Status`, `Domain`, `Related`, `Last updated`.

Mermaid diagrams are fine in any section where a visual helps — architecture, data flow, layout, feature hierarchy, state transitions — not limited to one section.

Strip tool-output wrapper artifacts before writing, whether creating fresh or rewriting the whole doc. A `Read` result wraps file content in `<content>` tags, so a rewrite that echoes it back — directly, or via a drafting agent that saw the same `Read` — can carry the wrapper into the `Write` payload as a literal trailing line.

## When Updating

Docs describe current state, not session history. A fact that changed gets edited into its existing row rather than added beside it; a finished work stream collapses to one summary row ("Phase 2 built + reviewed + committed ✅") rather than staying itemized. Don't wait for every row to tick ✅ first — summarize as you go.

Two sections break this rule when §1's ownership guard fires (contested doc): **Quick Start and Last Session rewrite wholly** rather than append, and both become additive-only, facts routed to typed sections instead. See `../../_shared/references/contested-doc-sections.md`.

When rewriting Quick Start or Last Session on a normal (uncontested) update, **route facts before overwriting**. Read what's there and ask whether each fact describes the session (a thing that happened this turn) or the system (a behaviour that shipped, a state a reader needs, an action pending). Move system facts into their owning typed sections (Next Steps, architecture table, Gotchas); discard session narration. Only then rewrite. Skipping the routing feels correct because the rewrite is mandated, so the deletion reads as compliance — the loss surfaces sessions later as a fact nobody can find. Confirm by grepping after rewriting; a fact already covered elsewhere needs no home.

### Gap-Check and Structure-Check

Start with a gap-check and structure-check against the template:

1. List the doc's `## ` headers; add any missing from the template's required set.
2. Verify each existing section's internal structure matches the template — table columns, field names, order — and fix non-conformant structure in place. What counts as drift is a section going missing, not a shape that differs — a split axis fitting the domain (Hosting/Build-Pipeline) or columns carrying actual gotchas are correct as-is. Reshape only when the current shape loses something. See `../../_shared/references/adopt-vs-impose.md` — the same judgement stated for every skill that rewrites an existing file, including the one-line statement of which reading you took.
3. `## Next Steps` is grouped by kind of work, not by when items were found — regroup an ungrouped or date-grouped list whenever you touch the doc. In a SPLIT doc set, every open actionable belongs in the index's `## Next Steps`, not scattered across `decisions/*.md` files — splitting is about where explanation lives, not where work lives. Each index item is one line (what to do + pointer to detail); decisions files point back. Exception: a checklist meant to be ticked while doing something belongs beside the procedure, with the index carrying a single line pointing to it.

### Composing New Rows

New rows in Bugs Fixed and Critical Gotchas get composed already-condensed: paraphrase root cause and fix directly, rather than transcribing session detail (timestamps, assertion counts) and trimming after. A Critical Gotchas row instructs a reader rather than recording a decision, so it applies the mechanism-not-trip-wire rule.

### Maintenance

Three sections require regular pruning to stay clear. `## Bugs Fixed` past 10 rows keeps the last 5 and summarizes the rest; `## Files` stays a living map of ~15 key files (per-phase subsections collapse into it); `## Next Steps` deletes done items rather than checking them off. A `## Completed (date)` section shouldn't exist — merge its content into the sections that own it.

## MADR Blocks — Edit-in-Place vs Append

`references/templates.md` defines when a Decision becomes an MADR block instead of a table row. Did the underlying decision change, or did the record get more accurate?

| Signal | Action |
|--------|--------|
| Record of an already-recorded decision got more accurate (status `planned`→`shipped`, Consequence changed, implementation evolved) | Edit the existing block's fields in place — same principle as Quick Start and all other sections. Update Status/date. |
| The decision itself changed — genuinely new, or a Rejected option got reconsidered | Append a new block with `Supersedes D-[id]` in its Status line (slug ID like `D-gateway-fee-cap`). Don't rewrite the old block — that D-[id] was later reversed is itself worth keeping. |
