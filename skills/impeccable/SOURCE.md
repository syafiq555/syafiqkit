# Source

Vendored from Impeccable by Paul Bakaus: https://github.com/pbakaus/impeccable (folder `.agent/skills/impeccable/`), commit `035c8f319edd019936525a062fe99e83ca8d12c6` (tag `skill-v4.8.2`, skill version 4.8.2, engine 0.1.21), copied 2026-11-10 (first vendored 2026-10-20 at 4.7.0). Licence: Apache-2.0, kept in `LICENSE` beside this file; the upstream third-party notices are in `NOTICE.md`.

## Changes from upstream

- `SKILL.md` frontmatter: the `description` is rewritten so the skill fires when the user names impeccable or one of its commands, and otherwise routes new public-facing pages to `taste` and work inside an existing app to `uiux`. This and the changes below are the only modifications, stated here as Apache-2.0 section 4(b) asks.
- `reference/critique.md`, sub-agent gate: one added bullet routes Assessment A to the project's `product-reviewer` agent when one exists (syafiqkit's `agent-setup` generates it), with the rubric's return shape overriding its own report format; Assessment B stays general-purpose. Added 2026-10-20 after a critique had to hand-feed a general-purpose agent the project context that agent already loads.
- `reference/critique.md` (Assessment B exit-code bullet and the "Deterministic scan" report line) and `reference/new-work.md` (the pre-review detect step): a note that on component source the detector runs regex rules only and `--json` drops the warning saying so, so an empty result is partial. Added 2026-10-21 after a critique's `[]` on `.tsx` pages read as clean until the scan was re-run in text mode.
- `SKILL.md`, before "Launcher unavailable": a paragraph saying an `UPDATE_AVAILABLE` notice is answered by re-copying per § Updating, not by `npx impeccable update`, which writes into the current project. Added 2026-11-08 after the notice's own instruction would have dropped a second copy into a client repo.
- Everything else (scripts, the other references, data) is byte-identical to the commit above.

## The launcher

`scripts/impeccable` runs a platform binary that is not stored in this repo. On first use it looks for `$IMPECCABLE_BIN`, a sibling `bin/` folder, `~/.impeccable/bin/impeccable`, a version-pinned cache or `impeccable` on PATH, and otherwise downloads the binary from impeccable's GitHub releases. Where the launcher cannot run, `SKILL.md`'s "Launcher unavailable" path reads the project's PRODUCT.md and DESIGN.md directly, so the skill still works without the binary.

`allowed-tools` still names upstream's `.agent/skills/impeccable/scripts/impeccable` path. That only pre-approves a command; running the launcher from this plugin's path asks for permission once.

## Updating

Re-copy `.agent/skills/impeccable/` from a newer upstream commit, re-apply the description and critique changes above (unless upstream now covers them), update the commit, version and date here, and note it in the plugin CHANGELOG.
