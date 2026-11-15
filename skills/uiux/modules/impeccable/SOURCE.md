# Source

Vendored from Impeccable by Paul Bakaus: https://github.com/pbakaus/impeccable (folder `.agent/skills/impeccable/`), commit `035c8f319edd019936525a062fe99e83ca8d12c6` (tag `skill-v4.8.2`, skill version 4.8.2, engine 0.1.21), copied 2026-11-10 (first vendored 2026-10-20 at 4.7.0). Licence: Apache-2.0, kept in `LICENSE` beside this file; the upstream third-party notices are in `NOTICE.md`.

## Changes from upstream

- Moved on 15/11/2026 from a standalone skill into `skills/uiux/modules/impeccable/`, and `SKILL.md` was renamed `MODULE.md`. It is reached through `uiux`'s router, not as a skill of its own.
- `MODULE.md` frontmatter: replaced by a one-paragraph module header. The rewritten upstream `description` (fire on the name impeccable or one of its commands, route new public-facing pages to `taste` and work inside an existing app to `uiux`) now lives in `uiux`'s router, and `allowed-tools` moved to `uiux`'s frontmatter. This and the changes below are the only modifications, stated here as Apache-2.0 section 4(b) asks.
- `MODULE.md`, Setup step 1: the sentence naming "the directory that contains this SKILL.md" now says MODULE.md (the module folder).
- `MODULE.md`, module header: PRODUCT.md and DESIGN.md are read and written as the project's doc set per `uiux`'s router (§ Project design docs, the setup-project-docs doc set), not as standalone files this module manages.
- `reference/critique.md`, sub-agent gate: one added bullet routes Assessment A to the project's `product-reviewer` agent when one exists (syafiqkit's `agent-setup` generates it), with the rubric's return shape overriding its own report format; Assessment B stays general-purpose. Added 2026-10-20 after a critique had to hand-feed a general-purpose agent the project context that agent already loads.
- `reference/critique.md` (Assessment B exit-code bullet and the "Deterministic scan" report line) and `reference/new-work.md` (the pre-review detect step): a note that on component source the detector runs regex rules only and `--json` drops the warning saying so, so an empty result is partial. Added 2026-10-21 after a critique's `[]` on `.tsx` pages read as clean until the scan was re-run in text mode.
- `MODULE.md` (was `SKILL.md`), before "Launcher unavailable": a paragraph saying an `UPDATE_AVAILABLE` notice is answered by re-copying per § Updating, not by `npx impeccable update`, which writes into the current project. Added 2026-11-08 after the notice's own instruction would have dropped a second copy into a client repo.
- `MODULE.md`, wording pass on 15/11/2026 (the owner allowed local edits to module entry files; merge these by hand on an update): the opening line's "earns the name out-of-distribution craft" now reads "is genuinely crafted, beyond what the category expects"; the launcher-unavailable message is an example wording rather than a fixed script (timing and fallback reads unchanged); the Modes paragraph's "persist it only in that surface brief" reads "record it only in that surface's brief". The module header also says "SKILL.md" in the references means `MODULE.md` and `.agent/skills/impeccable/` means this module's folder.
- Everything else (scripts, the other references, data) is byte-identical to the commit above.

## The launcher

`scripts/impeccable` runs a platform binary that is not stored in this repo. On first use it looks for `$IMPECCABLE_BIN`, a sibling `bin/` folder, `~/.impeccable/bin/impeccable`, a version-pinned cache or `impeccable` on PATH, and otherwise downloads the binary from impeccable's GitHub releases. Where the launcher cannot run, `MODULE.md`'s "Launcher unavailable" path reads the project's PRODUCT.md and DESIGN.md directly, so the skill still works without the binary.

`allowed-tools` (now in `uiux`'s frontmatter) pre-approves the launcher at this plugin's path (`*/uiux/modules/impeccable/scripts/impeccable *`) and `npx impeccable *`. The launcher finds `docs/DESIGN.md` but only a root `PRODUCT.md` (checked 15/11/2026 in a scratch project: `NO_PRODUCT_MD` with `docs/PRD.md` present), so `uiux`'s router tells a session to read the PRD on that notice rather than write a root `PRODUCT.md`.

## Updating

Re-copy `.agent/skills/impeccable/` from a newer upstream commit into `skills/uiux/modules/impeccable/`, rename its `SKILL.md` to `MODULE.md`, re-apply the module header (replacing the upstream frontmatter, with the description's routing kept in `uiux`'s router and `allowed-tools` in `uiux`'s frontmatter), the MODULE.md base-dir sentence and the critique changes above (unless upstream now covers them), update the commit, version and date here, and note it in the plugin CHANGELOG.
