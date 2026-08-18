# Task Summary Templates

## LLM-CONTEXT Block

Place at the very top of `current.md`:

```markdown
<!--LLM-CONTEXT
Status: 🔨 In Progress
Domain: [domain name]
Gotchas (critical — full list in ## Gotchas below):
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

Ground gotchas in concrete symptoms — a reader holding an error string or a failing test should be able to find the matching row. Always include error messages/symptoms for searchability:

```markdown
## Gotchas

| Symptom | Cause | Fix |
|---------|-------|-----|
| `500 on POST /invoices` | Timezone mismatch in Carbon | `->setTimezone('UTC')` before save |
| `Undefined index: user_id` | Middleware order | Move `auth` before `tenant` |
| Tests pass locally, fail CI | PHP version drift | Sync `composer.lock` from prod |
```

An `ID | Symptom | Cause | Fix` variant (`G1`, `G2`, ...) is the same table with one column added — use it when rows need to cross-reference each other (`see G3`) because one gotcha caused another or repeated the same mistake at a different level. A doc with no cross-row relationships doesn't need the ID column.

### Concrete vs Abstract Gotchas

A gotcha earns a table row only when it grounds in something a reader can check or measure — an error message they might see, a test they might run, a state they might reach. A row that's abstract ("watch out for X", "be careful with Y") trains no judgment and won't match when the reader actually hits the problem in a different form.

| Vague | Concrete |
|-------|----------|
| "Date handling can be tricky" | "`InvalidArgumentException: month overflow` → use `parse($m . '-01')` not `createFromFormat('Y-m', $m)`" |
| "Watch out for eager loading" | "`N+1 on /participants` → add `->with('enrollments')` to query" |

A Gotcha row can also fail by being *too detailed* — a cell packing a full incident report (every affected file, every edge case, the reviewer, cross-refs) stops being scannable. If a Gotcha needs more than ~3 sentences, it wants its own subsection or belongs in Key Technical Decisions if it's really explaining a choice rather than naming a trap.

## Minimal Template (Auto-Create)

Use when PRIMARY doc is missing (short session, single bug fix):

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

### [Split axis — whatever actually separates this doc's gotchas]
| Issue | Rule |
|-------|------|
| [the gotcha] | [what to do about it] |

## Next Steps

- [ ] [Pending work item]
```

Emit only sections that have content. A heading over an empty table is worse than its absence — it reads as "nothing here to know" rather than "nobody has hit this yet", and a reader trusts it.

The split axis is whatever genuinely separates this doc's gotchas: Backend/Frontend suits most application docs, an infra doc separates better on Hosting/Build-Pipeline, and a doc with one stack needs no split at all. Columns follow the same judgement — `| Issue | Rule |` when the fix is a rule to apply, `| Symptom | Cause | Fix |` when a reader arrives holding an error string and needs to match it. Use the gotcha-format guidance above; the choice between columns is about what a reader is holding when they reach for the table.

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

Rename a heading to fit the domain (`Blocking the deploy`, `Blocking go-live`, `Blocked on the vendor API`) — the principle is fixed (group by kind of work), the wording isn't. Order groups most-urgent-first, and order items within a group by severity marker. A good test for any heading you invent: will it still be true in three sessions? "This session's findings" fails; "Missing failure signals" passes.

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

[Brief explanation if the section is complex, e.g., "Decisions are recorded as ADRs (below) when they involved rejecting alternatives or resolving tradeoffs. Simple choices that had only one sane path use a quick table row."]

### D-[slug] — [Decision title] [committed | planned | debating] — [YYYY-MM-DD]

A well-formed decision record captures what problem prompted a choice, what was chosen, what alternatives were considered and rejected, what follows from the choice, and its current status. This structure isn't ornament — it's how decisions stay replicable and how tradeoffs survive being revisited.

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

---

**Simple decisions** (no meaningful alternatives) use a quick table instead:

| Decision | Rationale |
|----------|-----------|
| [What] | [Why, ≤1 sentence] |

Upgrade to a full ADR block the moment you're uncertain whether Rejected would come up empty — the block forces you to consider alternatives, and even if you can't name a real one, the reasoning becomes clearer. Conversely, a decision that genuinely had only one sane option (you're using the established pattern because every sibling does, or a stdlib function because that's what's built-in) doesn't need Rejected to be honest.

**ADR IDs use slug form** — `D-<kebab-slug>` (e.g. `D-gateway-fee-cap`, `D-quota-invoice-fix`), derived from the decision's topic. This replaces the old chronological `D-N` convention: a slug is self-describing at citation (`D-gateway-fee-cap` announces what it's about without opening the file), and it avoids the numbering overhead. Existing `D-N` blocks from before this convention stay as-is; both forms are valid ADR IDs going forward.

Check the whole `decisions/` directory for a slug collision before writing a new one — namespace is per-domain, so a collision means two decisions independently named `D-refund-window` in sibling files. If the exact topic is taken, sharpen the slug with a distinguishing detail (`D-gateway-fee-cap-fpx` vs `D-gateway-fee-cap-ewallet`) rather than appending a counter.

**When a doc has grown into multiple decisions**, it naturally becomes a decision log — one ADR per major choice. This isn't a format upgrade, it's just the honest shape: architectural choices ARE the story, so the decision records are the structure. Move gotchas/bugs into each ADR's Consequences section (eliminating the cross-section duplication), and keep `## Key Technical Decisions` as the section header. When a single `current.md` reaches several hundred lines with many decisions, read 📖 `decision-splits.md` before splitting it.

---

## Critical Gotchas

Split axis and columns follow the same judgement as Gotchas above (symptom/cause/fix if a reader arrives holding an error; issue/rule if the fix is a principle to apply).

### [Split axis]
| Issue | Rule |
|-------|------|
| [the gotcha] | [what to do about it] |

---

## Bugs Fixed

| ID | Severity | Issue | Fix |
|----|----------|-------|-----|
| B1 | [Critical/High/…] | [what broke] | [what fixed it] |

---

## Last Session

- [≤5 bullets, ≤2 lines each, ONE session only — overwritten each session, never appended]

---

## Next Steps

Grouped by KIND of work. Emit only groups that have items. (See Next Steps vocabulary in Minimal Template above.)

### Blocking [the next milestone]
- [ ] 🔴 [Pending work item]

### Missing failure signals
- [ ] 🟠 [Pending work item]

### Deferred / accepted
- [ ] 🟡 [Pending work item + the reason it's deferred]
```

## One Fact, One Home

The same status/decision/bug ID appearing in LLM-CONTEXT Status, LLM-CONTEXT Gotchas, Quick Start's two subsections, a Task Status row, AND a Bugs Fixed row isn't thoroughness — it's the same fact restated 5+ times with drifting wording, and a future edit that touches one copy but misses the others creates silent disagreement.

Pick ONE section that owns a fact, cross-reference from the rest:
- A bug's full story lives in **Bugs Fixed** — other sections reference it by ID (`see Bugs B13`).
- Current overall state lives in **Quick Start "Where we are"** — LLM-CONTEXT `Status` is a one-line pointer to it.
- A decision's rationale lives in **Key Technical Decisions** — Quick Start notes THAT a decision was made, not WHY.

This mirrors `update-claude-docs`'s capture rule: one fact, one home, cross-referenced — a duplicated fact forces a cold-start read twice to rule out discrepancy.

## Sentence Style (Bad vs Good)

Rows hold the rule + the single strongest reason. No metrics, hashes, verification narratives, or filler words ("basically", "essentially", "in order to", "please note that", "this means that", "it is important to", "as mentioned").

| Bad (bloated) | Good (condensed) |
|---------------|------------------|
| "Restructured serving (slim fetch `id`/`weight`, `serving.candidate_cap` 500) → `Cache::remember` per surface (TTL 15s, env `X_TTL`, 0 disables) → sampling in PHP → hydrate winners. Verified: chi-sq 3.12/1.24, Gini 0.236, k6 p95 718ms (was 1.6s), EXPLAIN no filesort (commit a1b2c3d)." | "Serving samples in PHP over a 15s-cached slim candidate pool — the old per-request `ORDER BY RAND()` forced a filesort and hydrated losers. Only the pool is cached; the lottery stays per-request. Verified by fairness probe + k6." |
| "Fixed gate (9e611d3 + da438a9; team: NO fixed package — CPC-only via `ADS_FLAT_ENABLED` default false) + UX round 2 committed (f1c2134) + harness (bc4d241)..." | "Flat mode is config-gated off (`ADS_FLAT_ENABLED`, default false) — team decided CPC-only. Commits listed in Last Session." |
| "Please note that in order to use this feature, you basically need to ensure that the tenant has an active contract, as this means that the subscription check will pass." | "Requires an active tenant contract — the subscription check reads this directly." |

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
