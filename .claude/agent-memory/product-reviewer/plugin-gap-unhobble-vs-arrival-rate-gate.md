---
name: plugin-gap-unhobble-vs-arrival-rate-gate
description: syafiqkit has an arrival-rate/regression gate for bloat (D50/D54) but no equivalent for unhobble-instructions regressing a settled absolutism back to judgment prose
metadata:
  type: project
---

**Zoom-out finding (not tied to one session's diff)**: syafiqkit's doc-condensation lineage built a real gate against a specific regression shape — a condensed skill re-bloating over time (D50: "arrival-rate problem, not a density one"), with D54 closing the gate's measurement half. That gate exists because the plugin learned condensing alone doesn't stick without a trigger that fires on re-arrival.

`unhobble-instructions` (shipped 2026-08-01, same day) is structurally the same shape of risk from the opposite direction: a rule gets de-constrained from "MANDATORY absolutism" to "judgment prose," and nothing currently checks whether that specific rule was previously the subject of a deliberate, tested, documented tradeoff (a `decisions/*.md` ADR with a **Rejected** alternative matching what the rewrite just produced). See [[unhobble-vs-settled-decisions]] for the concrete instance this surfaced (D37/D57 vs. the 2026-08-01 commit-gate rewrite).

**Build-or-skip recommendation**: `unhobble-instructions`' own Process (step 3, "list genuine facts explicitly" before rewriting) could gain one line: before treating a MANDATORY/absolutist rule as a constraint to soften, grep `tasks/**/decisions/*.md` for that rule's vocabulary and check any hit's **Rejected** section against the rewrite about to be made. This is cheap (one grep) relative to the cost of silently re-opening a door a prior session spent a real incident (issue #14) closing. Not urgent enough to block anything — the plugin has caught worse via `product-reviewer` before shipping — but worth raising to the user as a standing gap, since `unhobble-instructions` will keep running on this codebase's absolutist rules (`done`, `read-summary`, `update-claude-docs`, `update-plugin` already done; more will follow) and each pass carries the same undetected risk.
