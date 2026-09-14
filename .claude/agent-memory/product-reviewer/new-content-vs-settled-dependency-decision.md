---
name: new-content-vs-settled-dependency-decision
description: any authoring pass adding a "load/use plugin X" pointer can reintroduce a hard-dependency decision already rejected in decisions/*.md — check the Dependencies table and the decision record, not just whether X is a real skill
metadata:
  type: project
---

**On the 2026-09-15 `uiux` SKILL.md session (issue #28 fix), a new line ("load `frontend-design` alongside it for calibration and its restraint pass") reintroduced a dependency `D-fork-the-gap-not-the-source` (`tasks/plugin-maintenance/external-guidance/decisions/applying-verdicts.md`, committed 2026-08-11) had explicitly rejected**, with reasoning still valid: "colleagues install syafiqkit from its marketplace and may not have `frontend-design`; the plugin's own self-contained convention forbids a hard dependency."

This wasn't an `unhobble-instructions` pass (see [[unhobble-vs-settled-decisions]] for that shape) — it was ordinary skill-editing, adapting content from an external source (`superdesign`) into an existing skill. The regression mechanism is different: the session was reasoning carefully about a *nearby* risk (credit-line vs. pointer-line conflation, called out in its own CHANGELOG draft) and never checked whether the pointer it was adding matched a `Fallback`-style convention this plugin already enforces (`CLAUDE.md` `## Dependencies` table: every optional external plugin has a stated fallback; `frontend-design` has none and isn't even in the table).

**Why this matters**: a routing pointer to a named external skill reads as harmless prose — it's not a rigid imperative, not a mechanical threshold, nothing `unhobble-instructions`' own checks would flag. The only way to catch it is to check the *dependency* itself against (a) whether the named plugin is actually registered/installed in the reviewing session's own environment, and (b) `tasks/**/decisions/*.md` for whether depending on it was already litigated and rejected.

**How to apply**: whenever a diff adds language like "load X", "use X for this", "X handles the restraint pass" where X is an external plugin/skill name — grep `CLAUDE.md`'s `## Dependencies` table for a matching row, and grep `tasks/**/decisions/*.md` for the plugin's name to check for a prior Rejected verdict. Absence from the Dependencies table plus presence of a prior rejection is a 🔴, not a style nit — it's the same class of finding as an absolutism regression, just on a different kind of settled decision (architecture/dependency posture, not enforcement strictness).
