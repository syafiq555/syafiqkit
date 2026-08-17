---
name: multi-entry-point-trigger-placement
description: A skill with distinct entry-point sections (scaffold vs harden, new vs existing) can add a new trigger phrase to description whose content lands in the wrong section — check placement against the section the trigger's own wording implies, not just that the content exists somewhere in the file
metadata:
  type: project
---

**On the 2026-08-17 `setup-playwright` mobile-viewport addition**, three new trigger phrases were added to `description:` — "the e2e never tests mobile", "add a mobile viewport project", "our tests only run at desktop width" — all describing an *existing* suite discovered to lack coverage. The content landed as `### One browser project covers one viewport` under `## Scaffolding a new suite`, not under `## Hardening an existing suite`. The file's own opener tells readers to pick one section ("Two entry points, same file... Read the section you need"), so a session following that routing on the new trigger phrases lands in Hardening's six subsections and never reaches the mobile content four sections upstream.

**Why this matters**: this isn't a missing feature — the content is correct and complete — it's a shelf-placement mismatch between where a trigger phrase implies a reader will look and where the skill's own dispatch logic sends them. A skill structured as "read the section you need" makes section placement part of the contract, not cosmetic; content that answers a hardening-shaped trigger has to live in the hardening section regardless of how it was authored (here, likely appended near related build-time content out of authoring convenience rather than checked against the trigger).

**How to apply**: When a skill has multiple named entry-point sections (scaffold/harden, new/existing, light/full) and a session's diff adds a new trigger phrase to `description:`, don't just confirm the corresponding content exists in the file — read the section-routing sentence near the top, classify which section the trigger phrase's own wording implies ("our tests only run at X" describes discovering a gap in something that already exists = hardening, not scaffolding), and check the content sits there. A content search that only confirms presence passes this even when the reader's actual path never crosses it.
