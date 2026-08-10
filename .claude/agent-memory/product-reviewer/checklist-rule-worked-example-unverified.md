---
name: checklist-rule-worked-example-unverified
description: A new checklist rule in editing-skills-checklist.md cited sibling skills as an already-compliant "Model" without grepping them — the claim was false for all three named skills
metadata:
  type: project
---

`editing-skills-checklist.md`'s "Pointer citations" rule (added alongside the `read-summary`/`explore-delegation.md` worked example) names `merge-task-docs`/`haiku`/`task-summary` as skills whose citations of `explore-delegation.md` already "state the constraint inline first, then point for depth." Grepping all three (2026-08-11) showed none do — every citation is a bare mechanics pointer ("Delegation rules: `../_shared/references/explore-delegation.md`", "delegation mechanics are in...") with no inline restatement of the shadowing fact (don't re-read/re-grep while an Explore agent runs). A fourth citer, `sweep-doc-overlaps`, wasn't checked at all and also lacks the restatement (it has a different, unrelated inline deviation note).

**Why:** the new rule shipped with a factual claim about the codebase's own compliance state, presented as the model to imitate, that was never verified with a grep before landing — the same "claim that ships" pattern the user's global CLAUDE.md `#comment-claims` principle warns about, but happening inside a rule ABOUT catching exactly that kind of gap.

**How to apply:** when a checklist/instruction-file edit names specific sibling files as already conforming to a new rule ("Model: X/Y/Z already do this"), grep those exact files before accepting the claim — don't take the worked example's own self-description at face value. This is a good general pattern for reviewing any new rule that cites siblings as precedent: the citation is a testable claim, not evidence.

Related: also found in the same session that `read-summary/SKILL.md`'s own restatement (added as the worked example) landed at the pre-existing "Agents" section near the file's END, not at "Finding the Right Doc" near the TOP where the Explore agent is actually dispatched — so the fix satisfies the rule's letter (restate inline) but not its own stated rationale (state it at the point it applies, before the risk window). See [[unhobble-vs-settled-decisions]] for a related pattern of a self-referential fix not verified against its own stated purpose.
