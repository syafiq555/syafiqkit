# Source

Vendored from tasteskill v2 by Leonxlnx: https://github.com/Leonxlnx/taste-skill (folder `skills/taste-skill/`), commit `63aba5f43b5056758b15bbe7d683da8c86a7a7ad`, copied 2026-10-20. Licence: MIT, kept in `LICENSE` beside this file.

## Changes from upstream

- `SKILL.md` frontmatter: `name` is `taste` (upstream `design-taste-frontend`) so it matches this folder, and the `description` is rewritten to route within syafiqkit: public-facing page builds come here, screens inside an existing app and scored critiques go to `uiux`, and requests naming impeccable go to `impeccable`.
- `SKILL.md` body: one quoted line under the title telling a session to re-read from `## House rules` after a compaction, because the file is past the 5,000-token re-attach point and its gate and fallbacks sit after it.
- `library/heroes.json`, "Waterline headline" blueprint: builds the two-ink headline as one `h1` with a `::after` echo of the cut line, instead of two stacked copies. Upstream's two-copy build fails its own `inspect.mjs` covered-text check, which hit-tests through `clip-path` (found 2026-10-20 on a real build).
- `references/imagery.md`, "What makes a good find": rejects found pictures where another business's name, logo or phone number is legible (2026-10-20: a CC BY-SA shopfront of a rival driving school read as the client's own institute).
- Nothing else is changed. Scripts, the rest of the library, references and assets are byte-identical to the commit above.

## Updating

Re-copy `skills/taste-skill/` from a newer upstream commit, re-apply the frontmatter changes and the two local patches above (unless upstream has fixed them), update the commit and date here, and note it in the plugin CHANGELOG.

## Requirements

The scripts need Node 22 or newer and an installed Chrome, Edge or Chromium; `scripts/assets.mjs` also needs network access. They install nothing and use no API keys. Run them from the project's root so working files land in `.taste-skill/` there.
