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

⚠️ **`Status` is a state, not a narrative.** It's the first thing a cold-start read (human or LLM) sees, so its whole job is a fast triage signal — not a compressed history of how the feature got here. When you catch yourself writing "and then... which also..." in a Status line, that content belongs in Quick Start's "Where we are" instead, stated there once. A Status line that needs its own sub-clauses for deploy state, a specific bug ID, and E2E results has stopped being a status.

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

⚠️ **A Gotcha row can also fail the opposite way — too much, not too little.** A row that packs a full incident report into one cell (what every affected file does, every edge case considered, the reviewer who caught it, a cross-reference to three other CLAUDE.md files) stops being a scannable table and becomes a wall of text with pipe characters in it — a reader has to parse a whole paragraph to extract the one rule. If a Gotcha needs more than ~3 sentences to state the rule + its reason, that's a sign it wants its own subsection (or belongs in Key Technical Decisions instead, if it's really explaining a choice rather than warning about a trap) — not a wider table cell.

## One Fact, One Home

The same status/decision/bug ID showing up in LLM-CONTEXT Status, LLM-CONTEXT Gotchas, Quick Start "Where we are", Quick Start "Immediate next actions", a Task Status row, AND a Bugs Fixed row is not thoroughness — it's the same fact restated 5+ times with slightly different wording each time. That's harder to parse than stating it once, because a reader (human or LLM) can't tell whether the restatements agree until they've read all of them, and a future update that touches one restatement but misses the others creates silent drift between them.

Pick ONE section that owns a given fact and cross-reference from the others instead of duplicating:
- A bug's full story (what broke, why, the fix) lives in **Bugs Fixed** — other sections reference it by ID (`see Bugs B13`), they don't re-explain it.
- Current overall state lives in **Quick Start "Where we are"** — LLM-CONTEXT `Status` is a one-line pointer to that, not a second copy of it.
- A decision's rationale lives in **Key Technical Decisions** — Quick Start can note THAT a decision was made, not re-argue WHY.

This mirrors the CLAUDE.md capture rule from `update-claude-docs`: one fact, one home, cross-referenced — not because it's a stylistic preference, but because duplicated facts are what make a cold-start LLM read a doc twice to be sure it isn't missing a discrepancy between two copies of the "same" fact.

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

⚠️ **Measured cost — a MADR block is not free, even as the default.** An MADR block runs roughly 18-20 lines vs the ~1 line the escape-hatch table row takes (measured directly against two real conversions in this codebase). That's the entire size budget for several other facts — it's the reason the escape hatch exists at all. Apply the escape-hatch test honestly (would Rejected actually come up empty?) rather than defaulting to MADR out of habit for a decision that never had a real second option.

**Size ceiling**: a MADR block should not exceed ~20 lines. If Problem + Decision + Rejected + Consequences run longer, the block is doing Overview's job — trim Consequences to the one fact not recorded elsewhere (cross-reference Gotchas/Bugs instead of restating them; see One Fact, One Home above).

**Demotion rule**: a MADR block demotes back to a plain table row (`Decision | Rationale`, WHY in ≤1 sentence) once its Rejected alternatives haven't been asked about ("why not X?") in 3+ sessions AND its Status is `committed`/`shipped` (not `planned`/`debating`) — a settled, unrevisited decision's rejected-alternatives detail has stopped being load-bearing for a cold-start read. Fold the single strongest rejection reason into the table row's Rationale cell before deleting the block; don't drop it silently. Demotion is a deliberate condensation step, not something `condense-task-doc` does automatically — see that skill's own rule for what it's allowed to touch in a MADR block versus what it must leave alone.

**Edit-in-place vs append, as the decision evolves over sessions**: `task-summary/SKILL.md`'s "MADR Blocks — Edit-in-Place vs Append" section owns this rule — the short version: the record getting more accurate about an unchanged decision is an edit to the existing block; the decision itself changing direction is a new block with `Supersedes D-N`.

### Whole-doc MADR (decision-log) — the default once a doc has any real decisions

Since MADR is now the default per-decision structure, a task doc's `## Key Technical Decisions` naturally becomes a decision-log the moment it records its first real (non-escape-hatch) decision — every architectural choice an ADR block, gotchas/bugs folded into each block's Consequences, tasks/state kept as thin sections around it. There's no separate ask-gate anymore: writing decisions the default way IS writing a whole-doc MADR, one block at a time.

A doc with ZERO real decisions (every choice hit the escape hatch, e.g. a pure bug-fix doc) has no ADRs to log — it stays on flat Gotchas tables + Task Status, since there's nothing decision-shaped to structure as a log.

⚠️ **Whole-doc MADR is NOT priced like per-block MADR.** The "+18-20 lines each" cost above measures ADDING a block ALONGSIDE the existing Decisions + Gotchas tables. A whole-doc rewrite REPLACES those tables — each gotcha moves into the Consequences of the ADR that created it, which **removes** the cross-section duplication of a fact that was both a Decision (why) and a Gotcha (what-breaks). Measured on a real 13-decision/27-gotcha integration doc: full-MADR came out **shorter** (307→284 lines), not +200. So a decision-heavy doc where most gotchas trace to a specific decision is a GOOD whole-MADR candidate; a gotcha-heavy doc whose traps are environment/deploy noise (not consequences of a choice) is a BAD one — those gotchas have no ADR to live under and end up in a catch-all section anyway.

⚠️ **Line count can still RISE even when the rewrite is a good fit — judge by bytes, not lines.** A second measurement, on a denser 13-decision/62-gotcha doc, went 275→470 lines but 54.3KB→49.0KB (`wc -c`). The mechanism: a wide table cell that wrapped 400+ characters of prose behind one pipe character becomes several short bullet lines inside an ADR's Consequences — MORE newlines, FEWER total characters. Line count and byte count can diverge in either direction depending on how densely the source doc's tables were packed before conversion. **Report both deltas to the user after a whole-doc MADR rewrite**, and judge success by bytes (or a qualitative "no fact restated, no fact lost" check), not by whether lines crossed 300 — the 300-line budget is calibrated for standard-structure docs, not decision logs where structural overhead (Problem/Decision/Rejected/Status headers, ~6-8 fixed lines per ADR) is paid once per decision regardless of content density.

**When you do convert a whole doc**: keep Quick Start (MADR doesn't forbid an operational header — it's the cold-start entry), give each ADR its own Consequences (route every gotcha/bug to its owning ADR; env-only traps go to one "Cross-Cutting Operational Notes" section), and reconcile back-refs — sibling docs that cite the old section names ("Key Decisions", "Phase Roadmap") must be re-pointed to the ADR ids.

### Splitting a whole-doc MADR further: index + grouped decision files

A whole-doc MADR can itself outgrow one file (10+ ADRs, several hundred lines). This is a DIFFERENT decision from condensing — condensing removes bloat from a doc that has too many words for its facts; splitting addresses a doc that has too many *facts*, correctly stated, for one file to stay a fast cold-start read. Don't run `condense-task-doc` on a doc in this state — row-existence pruning has nothing to cut when every ADR earns its place; the fix is structural, not a word-count reduction.

⚠️ **Default rule (no user ask required)**: once a whole-doc MADR is still >300 lines after legitimate ADR growth (bytes flat/grew from genuine new ADRs, not restructure artifacts — see `condense-task-doc` Step 2), split it into an index + `decisions/<theme>.md` files as part of the normal create/update flow — don't wait to be asked. The user can still explicitly request a split below the threshold.

**Structure**: keep the original `current.md` as a thin index — Quick Start, any doc-wide operational tables (e.g. a skills/files registry), and a **routing table grouping ADRs by theme**, each row framed as "read `decisions/<theme>.md` if you're asking: *[the question that decision answers]*" rather than a bare decision-title list — a title alone doesn't tell a cold-start reader which file answers their actual question. Move full ADR content into `decisions/<theme>.md` files, 3-5 files typical (matches the "3-5 sub-pages, cluster don't fragment" convention for splitting any long reference doc). Each `decisions/*.md` file is self-contained: its own LLM-CONTEXT block, `Related:` pointing back to the index and sibling theme files.

**Group by theme (the question a reader is asking), not by chronology or ADR number** — a decision-log convention like `adr-tools`' flat one-file-per-decision optimizes for a human `git blame`-ing one commit; an LLM cold-starting a session optimizes for "answer my question in the fewest file-opens," which favors clustering related decisions together over one-file-per-decision. If a decision doesn't cleanly fit an existing theme file, check whether it's actually closer to a different theme already present before creating a 4th file for one ADR.

⚠️ **Verify no fact duplicated across the split** — the LLM-CONTEXT `Gotchas:` teaser in the index is the most common place a decision's content gets silently re-explained instead of pointed-to (the field's whole job is a 1-line pointer, and a rewrite is tempted to restate the finding since it's fresh in context). Grep the finished set of files for the 2-3 most load-bearing phrases across all of them — a phrase surviving in the index AND its owning decision file (beyond a one-line teaser) is the same violation flat single-doc duplication is.

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
