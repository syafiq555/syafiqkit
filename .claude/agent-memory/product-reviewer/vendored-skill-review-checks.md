---
name: vendored-skill-review-checks
description: Checks that caught real gaps when reviewing a vendored third-party skill or module added to this plugin (the taste and impeccable modules of uiux, 2026-10-20)
metadata:
  type: feedback
---

When a vendored skill lands, check four things the diff will not show:
1. Frontmatter description+when_to_use length of the routing-edited neighbour (uiux went 1318 to ~1613 chars, past the 1,536 cap, so its tail clause was truncated in the live skill listing).
2. Vendored entry file size vs the 5,000-token post-compaction re-attach (`skills/uiux/modules/taste/MODULE.md`, formerly taste's SKILL.md, is about 38 KB; gates and fallbacks sit past the cut).
3. CHANGELOG heading order vs the already-published version (a new entry numbered below a pushed version is skipped by ship's "entries since last-deployed" scoping).
4. Rules in the neighbour's reference that still instruct building after the build was handed off (uiux marketing-pages Material section vs the licence rules in `skills/uiux/modules/taste/`).

**Why:** all four were real in the taste/impeccable review (now modules of `uiux`). **How to apply:** run them on any import or routing handoff.
