---
name: unhobble-vs-settled-decisions
description: unhobble-instructions can regress a rule the task doc already settled as deliberate absolutism — verify against decisions/*.md before accepting a "MANDATORY → judgment prose" rewrite
metadata:
  type: project
---

**On 2026-08-01's unhobble-instructions pass over `skills/commit/SKILL.md`, the task-doc staleness gate's rewrite silently reintroduced a rejected alternative from D37/D57** (`tasks/plugin-maintenance/doc-condensation/decisions/bloat-generator-fixes.md`).

Original: "**Any hit → run `task-summary`... no judgment about whether the hit is 'real' staleness is permitted**" — this absolutism exists specifically because every pre-commit doc line describing "uncommitted" state is momentarily, locally true, which is what makes "is this real staleness?" an unreliable question to let a reader answer in the moment. D57 (2026-07-27, v1.132.0) already patched the one legitimate false-positive class (identifiers/UI-labels like `pendingStep`) via a lexical carve-out, and explicitly rejected the alternative of "relaxing the absolutism to use judgment" — quote: "reopens exactly the rationalization door D37 closed."

The unhobble rewrite changed the trigger to "**A real hit** means..." — reopening precisely that door, months after it was closed and shipped.

**Why this matters**: `unhobble-instructions`' own Process step 5 ("verify against the fact list") is scoped to the target file in isolation — it has no step that checks whether a rule being "de-constrained" was previously the subject of a deliberate, documented, already-tested tradeoff in `decisions/*.md`. A rule that reads as "just re-stating obvious judgment" to a cold read can actually be encoding a hard-won fix for a specific failure mode (rationalization under momentary-truth pressure) that isn't visible from the rule's text alone — only from its decision history.

**How to apply**: Before accepting/reviewing an unhobble pass on a MANDATORY/absolutist rule, grep `tasks/**/decisions/*.md` for the rule's own keywords (e.g. "staleness", "no judgment", the exact grep pattern) to check whether a **Rejected** alternative in some prior ADR matches what the rewrite just produced. If it does, that's a 🔴, not a style call — the rewrite silently overturned a decision the doc still calls settled. See [[product-reviewer-process]] for how this fits the general review flow.

Confirmed via direct diff comparison + `bloat-generator-fixes.md` D37 (absolutism origin) and D57 (the lexical carve-out that already fixed the one real false-positive, and explicitly rejected "relax to judgment").
