# Task Summary Templates

## LLM-CONTEXT Block

Place at the very top of `current.md`:

```markdown
<!--LLM-CONTEXT
Status: 🔨 In Progress
Domain: [domain name]
Gotchas (critical — full list in ## Critical Gotchas below):
  - [Most important gotcha in one line]
  - [Second most important]
Related: [Links to related task docs or "None"]
Last updated: [YYYY-MM-DD]
-->
```

> **Note**: Omit `Key files:` from LLM-CONTEXT when the doc has a `## Files` section in the body — it's redundant. Only add `Key files:` for short docs without a Files section.

### Field Guidelines

| Field | Content | Example |
|-------|---------|---------|
| `Status` | Emoji + ONE short sentence, ≤15 words. A state, not a narrative — "and then... which also..." belongs in Quick Start's "Where we are" instead. | `🚀 Local E2E verified, prod pending` |
| `Domain` | Project domain name | `risk-analysis`, `invoice`, `payment` |
| `Gotchas` | Bullet list of critical non-obvious gotchas, pointer to full table | See example above |
| `Related` | Other task docs with connections | `tasks/training/jd14/current.md, tasks/shared/gotchas-registry.md` |
| `Last updated` | ISO date of last edit | `2026-02-25` |

### Related Field Syntax

```markdown
Related: tasks/training/participant/current.md, tasks/billing/invoice/current.md
Related: None (standalone feature)
Related: tasks/shared/patterns.md (for shared utilities)
```

## Status Values

| Emoji | Status | Meaning | When to Use |
|-------|--------|---------|-------------|
| 🔨 | In Progress | Currently being worked on | Default for new/resumed work |
| ✅ | Complete | Feature complete, no active work | When shipping/closing |
| 🚀 | Testing/Staging | Verified locally, prod pending | After local E2E passes |
| ⏸️ | Blocked | Waiting on external dependency | Document what's blocking |
| 📋 | Planning | Not yet started | Pre-implementation planning |

## Gotcha Table Format

Always include error messages/symptoms for searchability:

```markdown
## Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| `500 on POST /invoices` | Timezone mismatch in Carbon | `->setTimezone('UTC')` before save |
| `Undefined index: user_id` | Middleware order | Move `auth` before `tenant` |
| Tests pass locally, fail CI | PHP version drift | Sync `composer.lock` from prod |
```

An `ID | Symptom | Cause | Fix` variant (`G1`, `G2`, ...) is the same table with one column added — reach for it once a row needs `see G3`-style cross-referencing (below); a doc with no cross-row relationships doesn't need the column.

### Bad vs Good Gotchas

| Bad (abstract) | Good (concrete) |
|----------------|-----------------|
| "Date handling can be tricky" | "`InvalidArgumentException: month overflow` → use `parse($m . '-01')` not `createFromFormat('Y-m', $m)`" |
| "Watch out for eager loading" | "`N+1 on /participants` → add `->with('enrollments')` to query" |

A Gotcha row can also fail the opposite way — too much rather than too little. A cell packing a full incident report (every affected file, every edge case, the reviewer, cross-refs) stops being scannable; if a Gotcha needs more than ~3 sentences, it wants its own subsection, or belongs in Key Technical Decisions if it's really explaining a choice.

A relationship between two rows is itself a fact worth a home. Two Gotchas are sometimes the same mistake at different depths, or one caused the other — writing that link as a sentence inside one row's Fix cell only helps a reader who scans both rows in the original order, and goes stale silently the moment the table is re-sorted or split. An ID column (`G1`, `G2`, ... — the same pattern Bugs Fixed already uses for `B1`/`B13`) with a `see G3`-style reference survives reordering where a narrative aside doesn't; add the column once a real cross-row relationship exists, not as scaffolding for a table that has none yet.

## One Fact, One Home

The same status/decision/bug ID appearing in LLM-CONTEXT Status, LLM-CONTEXT Gotchas, Quick Start's two subsections, a Task Status row, AND a Bugs Fixed row isn't thoroughness — it's the same fact restated 5+ times with drifting wording, and a future edit that touches one copy but misses the others creates silent disagreement.

Pick ONE section that owns a fact, cross-reference from the rest:
- A bug's full story lives in **Bugs Fixed** — other sections reference it by ID (`see Bugs B13`).
- Current overall state lives in **Quick Start "Where we are"** — LLM-CONTEXT `Status` is a one-line pointer to it.
- A decision's rationale lives in **Key Technical Decisions** — Quick Start notes THAT a decision was made, not WHY.

Mirrors `update-claude-docs`'s capture rule: one fact, one home, cross-referenced — a duplicated fact forces a cold-start read twice to rule out discrepancy.

## MADR-Style Decisions (default structure)

`Key Technical Decisions` defaults to an MADR-style block (Problem/Decision/Rejected/Consequences/Status) for every decision — this is the default shape, not an upgrade reserved for decision-heavy docs. The only escape is a plain 2-column table row (`| Decision | Rationale |`), and it applies only when the decision genuinely had no alternative considered (obvious/only-sane-option choices — "used the existing X pattern because that's what every sibling does"). Don't manufacture a "Rejected" section for a non-decision just to force MADR shape, but don't reach for the table row out of habit either — the honest test is whether Rejected would actually come up empty.

```markdown
### D-[slug] — [Decision title] [committed | planned | debating] — [YYYY-MM-DD]

**Problem**
[What was broken/suboptimal that prompted this?]

**Decision**
Chosen: [the option picked, one line]
- [reason 1]
- [reason 2]

**Rejected**
- Option B: [name]. Why not: [one line]
- Option C: [name]. Why not: [one line]

**Consequences**
[What follows — gotchas, tradeoffs, what it does NOT do]

**Status**: committed | planned | debating · **Reversible**: yes/no · [Supersedes D-[slug] if replacing a prior decision]
```

**New decisions get a slug ID, not a number** — `D-<kebab-slug>` (e.g. `D-gateway-fee-cap`, `D-quota-invoice-fix`), derived from the decision's own topic. This replaces the old chronological `D-N` convention going forward: a slug is self-describing at the point of citation (no need to open the file to know what `D-gateway-fee-cap` is about, the way `D-13` requires), and it sidesteps the numbering ritual entirely — there's no "grep the whole domain and take max+1" step, because a topic-derived slug isn't competing for the next integer in a shared counter. Existing `D-N` blocks from before this convention stay as-is; don't renumber or re-slug them retroactively, and both forms are valid ADR IDs going forward within the same doc set.

A slug still needs to be unique per **domain**, not per file — check the whole `decisions/` dir for a collision before writing a new one, since two decisions independently named `D-refund-window` in sibling theme files is exactly as ambiguous as a duplicate number was:

```bash
grep -rln "D-<slug>" tasks/<domain>/*/decisions/ tasks/<domain>/*/current.md   # any hit means pick a more specific slug
```

If the exact topic is already taken, sharpen the slug rather than appending a counter (`D-gateway-fee-cap-v2` defeats the point) — fold in the distinguishing detail instead (`D-gateway-fee-cap-fpx` vs `D-gateway-fee-cap-ewallet`). Because the namespace is per-domain, the same slug could in principle exist in two different domains with different meanings — a reference crossing domains always carries the domain prefix (`backend D-gateway-fee-cap`), never a bare slug, same as the numeric form.

A MADR block runs ~18-20 lines against ~1 for an escape-hatch row — that's the size budget for several other facts, which is the practical reason to apply the escape-hatch test honestly rather than defaulting out of habit. Size ceiling is ~20 lines: if Problem + Decision + Rejected + Consequences run longer, the block is doing Overview's job — trim Consequences to the one fact not recorded elsewhere and cross-reference Gotchas/Bugs instead (see One Fact, One Home).

A MADR block demotes back to a plain table row (`Decision | Rationale`, WHY in ≤1 sentence) once Rejected alternatives haven't been asked about in 3+ sessions AND Status is `committed`/`shipped` — fold the strongest rejection reason into Rationale before deleting the block. `condense-task-doc` does not do this automatically; see that skill's rule for what it may touch in a MADR block.

Edit-in-place vs append as the decision evolves over sessions: `task-summary/SKILL.md`'s "MADR Blocks — Edit-in-Place vs Append" section owns this rule — short version, the record getting more accurate about an unchanged decision is an edit to the existing block, and the decision itself changing direction is a new block with `Supersedes D-[slug]`.

### Whole-doc MADR (decision-log) — the default once a doc has any real decisions

MADR being the default per-decision structure means `## Key Technical Decisions` naturally becomes a decision-log the moment a doc records its first real (non-escape-hatch) decision — every architectural choice an ADR block, gotchas/bugs folded into each block's Consequences. There's no separate ask-gate: writing decisions the default way already is writing a whole-doc MADR, one block at a time. A doc with zero real decisions (pure bug-fix doc, every choice hit the escape hatch) has no ADRs to log and stays on flat Gotchas tables + Task Status.

Whole-doc MADR isn't priced like per-block MADR, so judge a conversion by bytes, not lines — the "+18-20 lines each" cost measures adding one block alongside existing tables, while a whole-doc rewrite *replaces* those tables (each gotcha moves into the Consequences of the ADR that created it, removing the cross-section duplication that used to exist between them). Measured examples: a 13-decision/27-gotcha doc went 307→284 lines; a denser 13-decision/62-gotcha doc went 275→470 lines but 54.3KB→49.0KB (`wc -c`) — a 400-char table cell becomes several short bullets, more newlines but fewer total characters. Report both deltas after a rewrite and judge by bytes (or "no fact restated, no fact lost"), not by whether lines crossed 300 — the ~6-8 lines of structural overhead per ADR doesn't fit that budget regardless of density. A decision-heavy doc where gotchas trace to specific decisions is a good candidate; a gotcha-heavy doc whose traps are environment/deploy noise with no owning ADR is not.

**Converting a whole doc**: keep Quick Start, give each ADR its own Consequences (route every gotcha/bug to its owning ADR; env-only traps go to one "Cross-Cutting Operational Notes" section), and reconcile back-refs — sibling docs citing old section names must be re-pointed to the ADR ids.

### Splitting a whole-doc MADR further: index + grouped decision files

A whole-doc MADR can itself outgrow one file (10+ ADRs, several hundred lines). This is different from condensing: condensing removes bloat from too many words per fact, while splitting addresses too many *facts*, correctly stated, for one file to stay a fast cold-start read — `condense-task-doc`'s row-pruning has nothing to cut when every ADR earns its place, so the fix here is structural.

Once a whole-doc MADR is still >300 lines after legitimate ADR growth (not restructure artifacts — see `condense-task-doc` Step 2), split into an index + `decisions/<theme>.md` files as part of the normal flow, without waiting for the user to ask. The one exception: if the doc's own Quick Start/Next Steps already deferred this exact split 2+ times as "disproportionate for this session's scope," treat that as a real scope signal and confirm with the user before proceeding — that history usually means several files need splitting at once, not the routine single-file case the default assumes.

**Structure**: keep `current.md` as a thin index — Quick Start, doc-wide operational tables, and a routing table grouping ADRs by theme, each row framed "read `decisions/<theme>.md` if you're asking: *[the question]*" rather than a bare title list. Move full ADR content into `decisions/<theme>.md`, 3-5 files typical (matches the "cluster don't fragment" convention). Each file is self-contained: own LLM-CONTEXT block, `Related:` pointing back to the index and sibling files.

"Operational tables stay in the index" holds only while they're small, because they're append-only — a bug/gotcha/ops table gains a row per session and loses none, so an index can end up mostly archive while every ADR sits correctly filed below it. Once those tables outgrow the ADR detail they front, route each row to the theme file that owns its mechanism (the entry's own "see ADR-N" column usually already names it), and leave a routing table plus the still-open items in the index. Rows belonging to no theme (environment, fixtures, deploy mechanics) get their own descriptively named sibling file, never a generic `bugs.md`/`misc.md` catch-all — a filename that names a grab-bag is a second index waiting to bloat the same way.

Group by theme (the question a reader is asking), not chronology or ADR number — an LLM cold-starting optimizes for fewest file-opens, favoring clustered related decisions over one-file-per-decision. If a decision doesn't cleanly fit an existing theme, check whether it belongs to one already present before creating a 4th file for one ADR.

Every split needs two follow-through checks, and they're easy to skip because nothing fails visibly if you do: **duplication** — grep the finished files for the 2-3 most load-bearing phrases; a phrase surviving in both the index and its owning file beyond a one-line teaser means it got re-explained instead of pointed-to, and the LLM-CONTEXT `Gotchas:` teaser is the most common place this happens. **Stale pointers** — a split invalidates every pointer *into* the file that got split, and this is invisible from inside the split itself: nothing 404s, the emptied file still resolves as a router, so any `📖 <file>` that used to promise a fact now just lands the reader somewhere the fact isn't. `grep -rn "<split-file>.md" tasks/`, repoint each hit at the leaf that now owns the fact (LLM-CONTEXT `Gotchas:` teasers and `Next Steps` items are the worst hit, since their whole contract is "one-line fact + the file with detail"), and label the emptied file a router in its own Sub-Files table and the parent index. If the file you just split was itself a leaf of another index, that grandparent needs the same check — routers nest, and re-aiming stops at the first level only if you stop looking.

`ls` the parent directory before finalizing any split — task folders often hold sibling files predating it (design/plan docs, hand-off sheets, audit trails) that aren't decision records but still need a routing-table row or they become invisible dead weight once `current.md` stops being the one file anyone opens. Account for every remaining file: give it a row, or fold stale content into a theme file if it's been superseded.

### Multi-domain fan-out: no surviving parent index

The pattern above assumes `current.md` survives as the router. A different shape: a whole-doc MADR whose ADRs cluster into genuinely separate *features* (not themes within one feature), each promoted to its own sibling folder (`tasks/<domain>/<feature-a>/current.md`, `tasks/<domain>/<feature-b>/current.md`, …) — with no single file left to be the parent index. This happened splitting `tasks/plugin-maintenance/current.md` into `agent-architecture/`, `doc-condensation/`, `madr-structure/`.

The router-preservation rule still applies, just with no router left to hold it, so before deleting the source doc, account for content that belonged to the *whole domain* rather than any one resulting feature:

- **Doc-wide operational tables** (a skills/tools registry, a cross-cutting decisions index spanning all themes) have no home in any single sibling — fold into the most relevant sibling's own operational tables only if genuinely feature-scoped despite living in the shared doc, otherwise flag it to the user as domain-level content with no folder to land in. Don't let it drop silently because no sibling "owns" it.
- Cross-link every sibling via `Related:` to its former siblings, the same way a single-domain split's index and decisions files point back to each other.
- Grep the deleted path (`grep -rn "<domain>/current.md" tasks/` and the plugin's own skill/CLAUDE.md files) and repoint every hit at whichever sibling now owns that fact — there's no single router left to catch strays here, so a missed pointer 404s silently instead of resolving to a thin index.
- This is exactly the shape `/done`'s referential-integrity pass exists to catch when the split step itself has no built-in check, but don't rely on that pass as the primary mechanism — do the fold-or-flag call during the split itself.

### When a single `decisions/<theme>.md` itself outgrows budget

A theme file earns its size the same way a whole-doc MADR does — one epic/ADR per non-duplicated chunk, nothing left to prune. `condense-task-doc` deletes real facts on a file like this, since row-existence pruning has nothing to cut; the fix is another structural split, not denser prose. Signal: the file is >500-600 lines, every section is a distinct shipped item rather than narrative bloat, and a `condense-task-doc` pass on it would be fighting the density rule instead of removing bloat.

Split the theme file itself into `decisions/<theme>/<sub-range>.md` — the same index-router pattern one level deeper. Group sub-files by natural chronological/thematic clusters within the theme (e.g. `decisions/lifecycle-epics/epics-1-9.md`, `epics-10-19.md`), not one file per item — this codebase has no precedent for one-file-per-epic-number, and every existing split clusters multiple items per file. The original theme file becomes a thin router with the same "read `<sub-file>.md` if you're asking: *[question]*" table, and the parent index's routing-table row for this theme needs updating to note it now routes through a second router rather than a leaf, so a cold-start reader doesn't stop one level too early. The same re-aiming duty from the first-level split applies here too — grep the theme file's old path across `tasks/` and repoint every hit at the new sub-file that owns the fact.

## Sentence Style (bad vs good)

Rows hold the rule + the single strongest reason. No metrics, hashes, verification narratives, or filler words ("basically", "essentially", "in order to", "please note that", "this means that", "it is important to", "as mentioned").

| Bad (bloated) | Good (condensed) |
|---------------|------------------|
| "Restructured serving (slim fetch `id`/`weight`, `serving.candidate_cap` 500) → `Cache::remember` per surface (TTL 15s, env `X_TTL`, 0 disables) → sampling in PHP → hydrate winners. Verified: chi-sq 3.12/1.24, Gini 0.236, k6 p95 718ms (was 1.6s), EXPLAIN no filesort (commit a1b2c3d)." | "Serving samples in PHP over a 15s-cached slim candidate pool — the old per-request `ORDER BY RAND()` forced a filesort and hydrated losers. Only the pool is cached; the lottery stays per-request. Verified by fairness probe + k6." |
| "Fixed gate (9e611d3 + da438a9; team: NO fixed package — CPC-only via `ADS_FLAT_ENABLED` default false) + UX round 2 committed (f1c2134) + harness (bc4d241)..." | "Flat mode is config-gated off (`ADS_FLAT_ENABLED`, default false) — team decided CPC-only. Commits listed in Last Session." |
| "Please note that in order to use this feature, you basically need to ensure that the tenant has an active contract, as this means that the subscription check will pass." | "Requires an active tenant contract — the subscription check reads this directly." |

## Minimal Template (Auto-Create)

Used when PRIMARY doc is missing (short session / single bug fix):

```markdown
<!--LLM-CONTEXT
Status: 🔨 In Progress
Domain: [domain]
Gotchas: [One critical gotcha if any — omit line if none]
Related: None
Last updated: [today]
-->

# [Domain] — [Feature]

## Quick Start (read this first in next session)

**Next action**: [What to do immediately + exact command]
**Current state**: [One line — committed? pushed? what's in the DB?]
**Success looks like**: [Expected outcome in one sentence]

## Overview
[One sentence on what this feature does]

## Gotchas

Split axis is domain-appropriate — Backend/Frontend is the default for application docs, not a fixed requirement. An infra/deploy doc with no back/frontend (hosting, CI pipeline, build config) uses whatever axis actually separates its gotchas (e.g. Hosting/Build-Pipeline) — the `| Issue | Rule |` columns stay fixed regardless of which axis is used.

### Backend
| Issue | Rule |
|-------|------|
| | |

### Frontend
| Issue | Rule |
|-------|------|
| | |

## Next Steps

- [ ] [Pending work item]
```

Next Steps is grouped by kind of work, not by when items were found — fix an ungrouped or date-grouped list the moment you touch the doc, regardless of length. Canonical headings (use only the ones that have items — never emit an empty group):

```markdown
## Next Steps

### Blocking <the next milestone>
- [ ] 🔴 [Item that stops the release/deploy/handoff]

### Broken or absent recovery paths
- [ ] 🟠 [A failure state the user cannot get out of unaided]

### Missing failure signals
- [ ] 🟠 [Something fails silently — no toast, badge, or aggregate view]

### Blocked on <external dependency>
- [ ] 🟠 [Not buildable here yet; name what must land first]

### Navigation & discoverability gaps
- [ ] 🟠 [The capability exists but the user can't find or reach it]

### Copy & polish
- [ ] 🟡 [Wording, a11y label, hover-vs-click, minor UX]

### Deferred / accepted
- [ ] 🟡 [Decided not-now, with the reason — never silently dropped]
```

Rename a heading to fit the domain (`Blocking the deploy`, `Blocking go-live`, `Blocked on the vendor API`) — the axis is fixed, the wording isn't. Order groups most-urgent-first, and order items within a group by severity marker. A good test for any heading you invent: will it still be true in three sessions? "This session's findings" fails; "Missing failure signals" passes.

## Full Template

For significant features (use the subscription doc as the gold standard). Use Mermaid diagrams freely in any section where a visual helps — not limited to architecture:

```markdown
<!--LLM-CONTEXT
Status: 🔨 In Progress
Domain: [domain]
Gotchas (critical — full list in ## Critical Gotchas below):
  - [Most critical gotcha]
  - [Second most critical]
Related: [Related docs or None]
Last updated: [today]
-->

# [Project] — [Feature] Summary

## Quick Start (read this first in next session)

**Where we are**: [One sentence — current state of the feature]

**Immediate next actions (in order)**:
1. [First thing to do — include exact command if applicable]
2. [Second thing]

**Key facts for cold start**:
- [Current code state: committed/uncommitted, pushed/local]
- [Exact command to run / file to edit]
- [What "success" looks like — concrete numbers or expected output]

**Gotchas that will trip you**:
- [Most critical non-obvious constraint]
- [Second most critical]

---

## Overview
[What this feature does, why it exists, current status in one paragraph]

---

## Architecture / Data Model

| Field | Value | Notes |
|-------|-------|-------|

---

## Files

**Backend**
- `app/Services/XService.php` — [what it does]
- `app/Models/X.php` — [what it does]

**Frontend**
- `src/pages/XPage.vue` — [what it does]
- `src/api/x.ts` — [what it does]

---

## Task Status

| # | Task | Status |
|---|------|--------|
| 1 | [task] | ✅ |

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| [What] | [Why] |

---

## Critical Gotchas

Split axis is domain-appropriate (see `## Gotchas` above) — Backend/Frontend for application docs, e.g. Hosting/Build-Pipeline for infra/deploy docs. Columns stay `| Issue | Rule |` either way.

### Backend
| Issue | Rule |
|-------|------|
| | |

### Frontend
| Issue | Rule |
|-------|------|
| | |

---

## Bugs Fixed

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| B1 | Critical | | |

---

## Last Session

- [≤5 bullets, ≤2 lines each, ONE session only — overwritten each session, never appended]

---

## Next Steps

Grouped by KIND of work — see the group vocabulary above. Emit only groups that have items.

### Blocking [the next milestone]
- [ ] 🔴 [Pending work item]

### Missing failure signals
- [ ] 🟠 [Pending work item]

### Deferred / accepted
- [ ] 🟡 [Pending work item + the reason it's deferred]
```

## Cross-Reference Examples

### Adding to Related Field

When doc A relates to doc B:

**In A's current.md:**
```markdown
Related: tasks/training/participant/current.md
```

**In B's current.md (bidirectional):**
```markdown
Related: tasks/billing/invoice/current.md
```

### Inline Cross-References

Within document body:

```markdown
See [participant enrollment](../participant/current.md) for enrollment flow details.

This uses the [shared timezone helper](../../shared/patterns.md#timezone-helper).
```
