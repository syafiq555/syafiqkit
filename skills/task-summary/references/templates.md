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
| `Status` | Emoji + ONE short sentence, ≤15 words. Never a changelog. | `🚀 Local E2E verified, prod pending` |
| `Domain` | Project domain name | `risk-analysis`, `invoice`, `payment` |
| `Gotchas` | Bullet list of critical non-obvious gotchas, pointer to full table | See example above |
| `Related` | Other task docs with connections | `tasks/training/jd14/current.md, tasks/shared/gotchas-registry.md` |
| `Last updated` | ISO date of last edit | `2026-02-25` |

⚠️ **`Status` is a state, not a narrative.** It's a fast triage signal, not a compressed history. "and then... which also..." belongs in Quick Start's "Where we are" instead.

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

### Bad vs Good Gotchas

| Bad (abstract) | Good (concrete) |
|----------------|-----------------|
| "Date handling can be tricky" | "`InvalidArgumentException: month overflow` → use `parse($m . '-01')` not `createFromFormat('Y-m', $m)`" |
| "Watch out for eager loading" | "`N+1 on /participants` → add `->with('enrollments')` to query" |

⚠️ **A Gotcha row can also fail the opposite way — too much, not too little.** A cell packing a full incident report (every affected file, every edge case, the reviewer, cross-refs) stops being scannable. If a Gotcha needs more than ~3 sentences, it wants its own subsection (or belongs in Key Technical Decisions if it's really explaining a choice) — not a wider cell.

## One Fact, One Home

The same status/decision/bug ID appearing in LLM-CONTEXT Status, LLM-CONTEXT Gotchas, Quick Start's two subsections, a Task Status row, AND a Bugs Fixed row isn't thoroughness — it's the same fact restated 5+ times with drifting wording, and a future edit that touches one copy but misses the others creates silent disagreement.

Pick ONE section that owns a fact, cross-reference from the rest:
- A bug's full story lives in **Bugs Fixed** — other sections reference it by ID (`see Bugs B13`).
- Current overall state lives in **Quick Start "Where we are"** — LLM-CONTEXT `Status` is a one-line pointer to it.
- A decision's rationale lives in **Key Technical Decisions** — Quick Start notes THAT a decision was made, not WHY.

Mirrors `update-claude-docs`'s capture rule: one fact, one home, cross-referenced — a duplicated fact forces a cold-start read twice to rule out discrepancy.

## MADR-Style Decisions (default structure)

`Key Technical Decisions` defaults to an MADR-style block (Problem/Decision/Rejected/Consequences/Status) — write every decision this way unless it fails the escape-hatch test below. This is the DEFAULT, not an upgrade reserved for decision-heavy docs.

**Escape hatch — plain 2-column table row** (`| Decision | Rationale |`): use ONLY when the decision genuinely had no alternative considered (obvious/only-sane-option choices — "used the existing X pattern because that's what every sibling does"). Don't manufacture a "Rejected" section for a non-decision just to force MADR shape. But default to MADR first; reach for the table row only when Rejected would come up empty.

```markdown
### D[N] — [Decision title] [committed | planned | debating] — [YYYY-MM-DD]

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

**Status**: committed | planned | debating · **Reversible**: yes/no · [Supersedes D-N if replacing a prior decision]
```

⚠️ **Measured cost**: a MADR block runs ~18-20 lines vs ~1 line for an escape-hatch row — that's the size budget for several other facts. Apply the test honestly (would Rejected actually come up empty?) rather than defaulting out of habit.

**Size ceiling**: ~20 lines. If Problem + Decision + Rejected + Consequences run longer, the block is doing Overview's job — trim Consequences to the one fact not recorded elsewhere (cross-reference Gotchas/Bugs; see One Fact, One Home).

**Demotion rule**: a MADR block demotes back to a plain table row (`Decision | Rationale`, WHY in ≤1 sentence) once Rejected alternatives haven't been asked about in 3+ sessions AND Status is `committed`/`shipped` — fold the strongest rejection reason into Rationale before deleting the block. `condense-task-doc` does not do this automatically; see that skill's rule for what it may touch in a MADR block.

**Edit-in-place vs append, as the decision evolves over sessions**: `task-summary/SKILL.md`'s "MADR Blocks — Edit-in-Place vs Append" section owns this rule — the short version: the record getting more accurate about an unchanged decision is an edit to the existing block; the decision itself changing direction is a new block with `Supersedes D-N`.

### Whole-doc MADR (decision-log) — the default once a doc has any real decisions

MADR being the default per-decision structure means `## Key Technical Decisions` naturally becomes a decision-log the moment a doc records its first real (non-escape-hatch) decision — every architectural choice an ADR block, gotchas/bugs folded into each block's Consequences. No separate ask-gate: writing decisions the default way IS writing a whole-doc MADR, one block at a time.

A doc with ZERO real decisions (pure bug-fix doc, every choice hit the escape hatch) has no ADRs to log — stays on flat Gotchas tables + Task Status.

⚠️ **Whole-doc MADR is NOT priced like per-block MADR — judge the rewrite by bytes, not lines.** The "+18-20 lines each" cost measures ADDING a block alongside existing tables; a whole-doc rewrite REPLACES those tables — each gotcha moves into the Consequences of the ADR that created it, removing cross-section duplication. Measured: a 13-decision/27-gotcha doc went 307→284 lines; a denser 13-decision/62-gotcha doc went 275→470 lines but 54.3KB→49.0KB (`wc -c`) — a 400-char table cell becomes several short bullets, more newlines but fewer total characters. Report both deltas after a rewrite; judge by bytes (or "no fact restated, no fact lost"), not by whether lines crossed 300 — that budget doesn't fit decision logs where ~6-8 lines of structural overhead is paid per ADR regardless of density. Good candidate: a decision-heavy doc where gotchas trace to specific decisions. Bad candidate: a gotcha-heavy doc whose traps are environment/deploy noise with no owning ADR.

**Converting a whole doc**: keep Quick Start, give each ADR its own Consequences (route every gotcha/bug to its owning ADR; env-only traps go to one "Cross-Cutting Operational Notes" section), and reconcile back-refs — sibling docs citing old section names must be re-pointed to the ADR ids.

### Splitting a whole-doc MADR further: index + grouped decision files

A whole-doc MADR can itself outgrow one file (10+ ADRs, several hundred lines). This is DIFFERENT from condensing — condensing removes bloat from too many words per fact; splitting addresses too many *facts*, correctly stated, for one file to stay a fast cold-start read. Don't run `condense-task-doc` here — row-pruning has nothing to cut when every ADR earns its place; the fix is structural.

⚠️ **Default rule (no user ask required)**: once a whole-doc MADR is still >300 lines after legitimate ADR growth (not restructure artifacts — see `condense-task-doc` Step 2), split into an index + `decisions/<theme>.md` files as part of the normal flow. The user can still request a split below the threshold.

**Structure**: keep `current.md` as a thin index — Quick Start, doc-wide operational tables, and a **routing table grouping ADRs by theme**, each row framed "read `decisions/<theme>.md` if you're asking: *[the question]*" rather than a bare title list. Move full ADR content into `decisions/<theme>.md`, 3-5 files typical (matches the "cluster don't fragment" convention). Each file is self-contained: own LLM-CONTEXT block, `Related:` pointing back to the index and sibling files.

**Group by theme (the question a reader is asking), not chronology or ADR number** — an LLM cold-starting optimizes for fewest file-opens, favoring clustered related decisions over one-file-per-decision. If a decision doesn't cleanly fit an existing theme, check whether it belongs to one already present before creating a 4th file for one ADR.

⚠️ **Verify no fact duplicated across the split** — the LLM-CONTEXT `Gotchas:` teaser in the index is the most common place a decision gets silently re-explained instead of pointed-to. Grep the finished files for the 2-3 most load-bearing phrases — a phrase surviving in both the index and its owning file (beyond a one-line teaser) is duplication.

⚠️ **A split invalidates every pointer INTO the split file — grep its filename and re-aim them in the same write.** This is invisible from inside the split: nothing 404s, the emptied file still resolves as a **router**, so any `📖 <file>` promising a fact now lands the reader where the fact isn't. Worst hit: LLM-CONTEXT `Gotchas:` teasers and `Next Steps` items. `grep -rn "<split-file>.md" tasks/`, repoint each hit at the **leaf** that now owns the fact, keep only pointers aimed at what stayed behind. Label the emptied file a router in its own Sub-Files table and the parent index. Splitting a file that is already a leaf of another index rots the grandparent too — check every level above.

⚠️ **`ls` the PARENT directory before finalizing the split.** Task folders often hold sibling files predating the split — design/plan docs, hand-off sheets, audit trails. These aren't decision records, but the routing table must still surface them or they become invisible dead weight once `current.md` stops being the one file opened. After building the index + `decisions/<theme>.md` set, `ls` the parent and account for every remaining file — give it a routing-table row, or fold stale content into a theme file if superseded.

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

- [ ] [Pending work item]
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
