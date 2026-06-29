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
| `Status` | Emoji + short state description | `🚀 Local E2E verified, prod pending` |
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

### Bad vs Good Gotchas

| Bad (abstract) | Good (concrete) |
|----------------|-----------------|
| "Date handling can be tricky" | "`InvalidArgumentException: month overflow` → use `parse($m . '-01')` not `createFromFormat('Y-m', $m)`" |
| "Watch out for eager loading" | "`N+1 on /participants` → add `->with('enrollments')` to query" |

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
