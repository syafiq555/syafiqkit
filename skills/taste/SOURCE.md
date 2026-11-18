# Source

Vendored from tasteskill v2 by Leonxlnx: https://github.com/Leonxlnx/taste-skill (folder `skills/taste-skill/`), commit `63aba5f43b5056758b15bbe7d683da8c86a7a7ad`, copied 2026-10-20. Licence: MIT, kept in `LICENSE` beside this file.

## Changes from upstream

- `SKILL.md` frontmatter: `name` is `taste` (upstream `design-taste-frontend`) so it matches this folder, and the `description` is rewritten to route within syafiqkit: public-facing page builds come here, screens inside an existing app and scored critiques go to `uiux`, and requests naming impeccable go to `impeccable`.
- `SKILL.md` body: rewritten locally on 06/11/2026 to fit the 5,000-token re-attach limit (9,398 tokens upstream, 4,948 here). The house rules, the laws, and a new `## Gate and fallbacks` section (the gate rules from step 7 plus the no-Chrome and no-network fallbacks from Special cases) now come before `## The run`; each step keeps its number and commands, and its detail moved to the new `references/run.md`, one heading per step. Prose is tightened throughout; every rule, figure and command line is kept. The quoted line under the title now asks a session to re-read the current step in `references/run.md` after a compaction. A re-sync from upstream has to redo this split.
- `library/heroes.json`, "Waterline headline" blueprint: builds the two-ink headline as one `h1` with a `::after` echo of the cut line, instead of two stacked copies. Upstream's two-copy build fails its own `inspect.mjs` covered-text check, which hit-tests through `clip-path` (found 2026-10-20 on a real build).
- `references/imagery.md`, "What makes a good find": rejects found pictures where another business's name, logo or phone number is legible (2026-10-20: a CC BY-SA shopfront of a rival driving school read as the client's own institute).
- `references/run.md` is new (the step detail split out of `SKILL.md`, above).
- `assets/web-scenes/` is new (16/11/2026): the scroll-scene library, object renders, the `effects/` and `ui/` folders the object demos import, `system.css`, `LICENSE` and scene manual (as `README.md`) from tasteskill 2.5.1 (commit `f6b76575f949707b4e3c37cd86cb44b0b98643e8`), copied byte for byte apart from a header on the README mapping its paths; `references/scenes.md`'s opening points a page at it before building a scene by hand. The owner asked for the scenes after 2.5.1, kept for a day as the `taste-web` module of `uiux`, was removed with that merge.
- Nothing else is changed. Scripts, the rest of the library, the other references and assets are byte-identical to the commit above.
- `scripts/lib/cdp.mjs`, `scripts/inspect.mjs`, `scripts/scenes.mjs`: every page emulates `prefers-color-scheme` (light by default, `--scheme dark` on both scripts), and the MEASURED line names it. Upstream's headless Chrome followed the OS appearance, so on a dark-mode Mac a light pass measured the dark theme (17/11/2026).
- `scripts/lib/cdp.mjs`, `findChrome`: with no system Chrome, Edge or Chromium, falls back to the newest Chromium in Playwright's cache (`PLAYWRIGHT_BROWSERS_PATH`, else `~/Library/Caches/ms-playwright`, `~/.cache/ms-playwright` or `%LOCALAPPDATA%\ms-playwright`), and the no-browser error names that and `CHROME_PATH`. `SKILL.md`'s requirements line and no-browser fallback say a Playwright Chromium counts. Upstream stopped before measuring on a Mac whose only browser was Playwright's (issue #34, 18/11/2026).

## Updating

Re-copy `skills/taste-skill/` from a newer upstream commit, re-apply the frontmatter changes and the local patches above (unless upstream has fixed them), update the commit and date here, and note it in the plugin CHANGELOG.

## Requirements

The scripts need Node 22 or newer and an installed Chrome, Edge or Chromium (Playwright's own Chromium counts); `scripts/assets.mjs` also needs network access. They install nothing and use no API keys. Run them from the project's root so working files land in `.taste-skill/` there.
