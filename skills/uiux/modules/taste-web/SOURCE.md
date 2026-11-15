# Source

Vendored from tasteskill by Leonxlnx: https://github.com/Leonxlnx/taste-skill (folder `skills/taste-skill/`), commit `f6b76575f949707b4e3c37cd86cb44b0b98643e8` (tasteskill 2.5.1, 07/11/2026), copied 15/11/2026. Licence: MIT, the repository's root `LICENSE` copied beside this file.

Upstream's 2.5.0 changelog calls it "a complete rebuild ... around professional company websites", replacing the 2.1 direction-sheet and app-screen pipeline. It does not say why the app-screen path, the direction deal and the juror critique were removed. The owner chose to keep both versions (15/11/2026): `../taste/` (2.1) keeps those three jobs, and this module handles company websites and brings the scroll scenes, product UI fragments, icons, components, diagrams, effects and the browser checker.

## Changes from upstream

- `SKILL.md` is renamed `MODULE.md`, and its frontmatter (name `design-taste-frontend`, the description, and a `hooks: Stop` entry) is replaced by a one-paragraph module header. The description's routing now lives in `uiux`'s router.
- The Stop hook that ran the finish gate (`scripts/gate.mjs --hook claude`) now lives in `uiux/SKILL.md`'s frontmatter, pointed at this module's `scripts/gate.mjs`, It searches the skill folder, the plugin root, the install path and the plugin cache for `modules/taste-web/scripts/gate.mjs`, and when it cannot run while a build is open it prints a `systemMessage` the user sees rather than skipping silently.
- `MODULE.md`, wording pass on 15/11/2026 (merge by hand on an update): step 3's "three object lines at most" reads "at most three object sections, the hero included, as section 2 allows"; section 2's "then count" reads "then count them"; house rule 9 and section 2's "Variety without effects" paragraph reflowed with wording unchanged. Sections, steps and house rules keep their numbers, since `gate.mjs`, `moments.mjs`, `start.mjs` and `consistency.mjs` cite them. Also local, after the requirements line: a no-Node-or-browser fallback (build from the plan and copy, screenshot with any browser tool, report "GATE: not run" first), and a line that "SKILL.md" in this module's scripts and references means `MODULE.md`.
- Everything else (1,631 files: scripts, references, library, assets) is byte-identical to the commit above.

## Updating

Re-copy `skills/taste-skill/` from a newer upstream commit into `skills/uiux/modules/taste-web/`, rename `SKILL.md` to `MODULE.md`, re-apply the module header in place of the upstream frontmatter, move any change to upstream's Stop hook into `uiux/SKILL.md`'s frontmatter, copy the root `LICENSE`, and update the commit, version and date here and in the plugin CHANGELOG. Before re-copying, compare upstream's file list with this folder: a release that removes a mechanism the plugin relies on is kept as a separate module rather than replacing this one, as 2.5.1 was kept beside 2.1.
