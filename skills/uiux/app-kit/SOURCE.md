# Source

The app-screen pipeline from tasteskill v2.1 by Leonxlnx (https://github.com/Leonxlnx/taste-skill, folder `skills/taste-skill/`, commit `63aba5f43b5056758b15bbe7d683da8c86a7a7ad`), MIT, licence in `LICENSE` beside this file.

It was copied here on 22/11/2026, byte for byte from syafiqkit's `taste` skill as it stood then, including that skill's local patches (colour-scheme emulation and the Playwright Chromium fallback in `scripts/lib/cdp.mjs`, `scripts/inspect.mjs` and `scripts/scenes.mjs`; the Waterline headline fix in `library/heroes.json`). The `taste` skill moved to upstream 2.5.1 the same day, which rebuilt it around company websites and dropped this pipeline. `uiux` depends on it to deal app directions and inspect app screens, so it lives here now.

## What is used

- `scripts/draw.mjs --app` (with `scripts/lib/app-draw.mjs` and `library/app.json`): deals two or three directions for screens inside an app. `references/app-screens.md` explains the sheet; where it says `<skill>`, read this `app-kit` folder.
- `scripts/inspect.mjs --app` and `scripts/lint.mjs --app`: the app-screen inspector and source lint.
- `scripts/lib/cdp.mjs`, `probe.mjs`, `rules.mjs`: also imported by `uiux/scripts/check-render.mjs`.
- `assets/app.css`, `base.css`, `base.js`, `charts.js`: the neutral start set `app-screens.md` names.

The public-page parts that came along in `scripts/` and `library/` (`assets.mjs`, `scenes.mjs`, the website directions) are unused here; `taste` owns public pages.

## Updating

Upstream no longer ships this pipeline, so there is nothing to re-vendor: edit these files in place, and a future `taste` release does not apply here. `uiux/scripts/check-render.mjs` imports `scripts/lib/cdp.mjs` and `scripts/lib/defects.mjs` (added here, not from upstream), so keep their exports stable.

## Requirements

Node 22 or newer and Chrome, Edge, Chromium or Playwright's Chromium for `inspect.mjs`; `draw.mjs` and `lint.mjs` run on Node 18+. Nothing is installed and no API key is used.
