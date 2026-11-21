# Source

Vendored from tasteskill 2.5.1 by Leonxlnx: https://github.com/Leonxlnx/taste-skill (folder `skills/taste-skill/`, tag `v2.5.1`), commit `f6b76575f949707b4e3c37cd86cb44b0b98643e8`, copied 22/11/2026. Licence: MIT, kept in `LICENSE` beside this file.

## Changes from upstream

- `SKILL.md` frontmatter: `name` is `taste` (upstream `design-taste-frontend`), and `description` is rewritten to route within syafiqkit: public-facing page builds come here, screens inside an app go to `uiux` (which owns `skills/uiux/app-kit/`), scored critiques go to `uiux`, requests naming impeccable go to `impeccable`, and an image composed from the product's screens is `product-still`.
- `SKILL.md` frontmatter `hooks:` Stop hook: upstream's command, with `taste` as the folder name and the Claude Code project and `~/.claude` lookups pointed at it, plus a first step that finds `node`: the PATH's, else `/opt/homebrew/bin/node`, `/usr/local/bin/node`, Herd's nvm or `~/.nvm` (first found), else exit 0. A hook gets no shell profile (Claude processes measured 22/11/2026 carried only `PATH=/usr/bin:/bin:/usr/sbin:/sbin`), so a version-managed `node` is not on its PATH, and upstream's `exec node` would fail on every Stop; with no `node` anywhere the hook exits 0 silently and the finish gate does not run. `gate.mjs` itself exits 0 when no build is armed.
- `SKILL.md` body: a quoted note under the title telling a session to re-read the current step after a compaction (the file is about 8,100 tokens against the 5,000 that re-attach), and one line routing screens inside an app to `uiux`. Upstream's body is otherwise unchanged; the 2.1-era local split into `references/run.md` is gone.
- `scripts/consistency.mjs`, `findChrome`, and `assets/layout/check.mjs`: with no system Chrome, Edge or Chromium, fall back to the newest Chromium in Playwright's cache (`PLAYWRIGHT_BROWSERS_PATH`, else `~/Library/Caches/ms-playwright`, `~/.cache/ms-playwright` or `%LOCALAPPDATA%\ms-playwright`). These two are what the gate runs. `shoot.mjs`, `perf.mjs`, `moments.mjs` and `effects.mjs` keep upstream's own lookup and still need `CHROME_PATH` on such a machine.
- `scripts/consistency.mjs`: every page the checker opens emulates `prefers-color-scheme: light` (in the main pass and in both reduced-motion/no-JS passes), because headless Chrome otherwise follows the OS appearance and measures the dark theme on a dark-mode Mac (found 17/11/2026 against the 2.1 inspector). Upstream's `shoot.mjs` has its own `--dark` and is unchanged.
- `assets/web-scenes/` (a local copy of 2.5.1's scroll scenes, added 16/11/2026) was deleted on 22/11/2026: upstream ships the same material at `assets/scenes/`, `assets/effects/`, `assets/ui/` and `assets/objects/`.
- Nothing else is changed.

## Dropped from the 2.1 vendoring

- The app-screen pipeline (`scripts/draw.mjs --app`, `scripts/lib/app-draw.mjs`, `inspect.mjs --app`, `library/app.json`, `references/app-screens.md`, `assets/app.css`, `assets/charts.js`) lives in `skills/uiux/app-kit/` now. Upstream 2.5.1 no longer has it.
- Patches to files upstream 2.5 deleted, so they cannot apply: `library/heroes.json` (the "Waterline headline" one-`h1` build), `references/imagery.md` (reject a find with another business's name, logo or phone number legible; upstream's `references/photos.md` already rejects a readable name, sign or logo of another business), `references/layout.md` (the "Three planes on a subject screen" paragraph, kept in `skills/uiux/references/composition-moves.md`), and `scripts/lib/cdp.mjs`, `scripts/inspect.mjs`, `scripts/scenes.mjs` (the scheme emulation and Chrome fallback, re-applied above to the 2.5 scripts that replace them).

## Updating

Re-copy `skills/taste-skill/` from a newer upstream commit into this folder (keep `LICENSE` and `SOURCE.md`), delete files upstream no longer has, re-apply the changes above (unless upstream has fixed them), update the commit and date here, and note it in the plugin CHANGELOG. Check `SKILL.md`'s token count again (`tiktoken`, `cl100k_base`); keep the re-read note under the title while it is over 5,000. Test the Stop hook with `env -i PATH=/usr/bin:/bin sh -c '<command>'`.

## Requirements

The scripts need Node 22 or newer and an installed Chrome, Edge or Chromium (Playwright's own Chromium counts for the gate's checkers); some scripts also need network access (photographs, icons). ffmpeg is optional. Run them from the project's root so working files land in `.taste-skill/` there.
