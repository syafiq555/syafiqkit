# Source

Vendored from emilkowalski/skills by Emil Kowalski: https://github.com/emilkowalski/skills (folder `skills/animate/`), commit `64eb3deb9a5fbfa041faf783e0bc3fd635872e9c` (15/11/2026), copied 21/11/2026. Licence: MIT, kept in `LICENSE` beside this file.

## Changes from upstream

- Folder and frontmatter `name` are `emil-animate` (upstream `animate`), so the eight copied skills sort together and don't collide with other plugins' generic names (`animate`, `gestures`).
- `description`: sibling skill names are re-pointed to the `emil-` names, and one sentence is appended routing a general design request (polish, redesign, critique, "use design skills") to `uiux` first and a public page build to `taste`.
- In the body, mentions of the other bundled skills (`animate`, `review-animations`, `remove-animations`, `../choreograph/`, `../pick-ui-library/`) point at the `emil-` folders. Mentions of upstream skills not bundled here (`improve-animations`, `find-animation-opportunities`, `animate-expo`, `animation-performance`) carry "(not bundled)".
- 27/11/2026, local addition from syafiqkit source #15, not upstream: `RECIPES.md` § Accordion / collapse gains the CSS route (`interpolate-size: allow-keywords`, `calc-size(auto, size)`) behind `@supports`, with MDN browser-compat-data support as read that day and a JS `scrollHeight` fallback snippet for browsers without it (panels that start open, child transitions and reduced motion handled), a reduced-motion rule for the CSS route, and the theme-switch selector widened to `*, *::before, *::after` as next-themes uses.
- 27/11/2026, local addition from syafiqkit source #15, not upstream: `RECIPES.md` gains § Shake on a refused submit (keyframes, reduced-motion handling, NN/g and WCAG 2.3.3 sources, numbers marked craft judgement).
- 27/11/2026, local addition from syafiqkit source #15, not upstream: `RECIPES.md` gains § Theme switch without a colour flash (next-themes `disableTransitionOnChange`, or a style element flushed with `getComputedStyle`).
- 27/11/2026, local addition from syafiqkit source #15, not upstream: `SKILL.md` gets a `height` note beside the accordion exception in "Pick the properties" (`interpolate-size` animates to `auto` in Chrome and Edge 129+; Firefox and Safari need the JS fallback in RECIPES.md), the two new recipes in the Recipes list, and two "Never Ship" rows (refusal shake, theme switch).
- 27/11/2026, local edit of upstream lines (to keep added text free of em dashes): in `RECIPES.md` the dash after "Keep it short" became a colon, with its sentence on measuring height in JS reworded; in `SKILL.md` the dash in "sanctioned fourth ... see RECIPES.md" became "sanctioned fourth, see RECIPES.md", and the Recipes sentence's opening dash became a parenthesised list closed by a comma.
- Beyond the lines above, none were edited by hand; no `diff -r` against the upstream commit was run for these 27/11/2026 changes.

## Updating

Re-copy `skills/animate/` from a newer upstream commit, re-apply the changes above, update the commit and date here and in the other seven `emil-*/SOURCE.md` files, and note it in the plugin CHANGELOG. Upstream has twelve more skills (Swift, Expo, Sonner, audits, prototypes); add one the same way when a session needs it.
