# Source

Vendored from emilkowalski/skills by Emil Kowalski: https://github.com/emilkowalski/skills (folder `skills/animate/`), commit `64eb3deb9a5fbfa041faf783e0bc3fd635872e9c` (15/11/2026), copied 21/11/2026. Licence: MIT, kept in `LICENSE` beside this file.

## Changes from upstream

- Folder and frontmatter `name` are `emil-animate` (upstream `animate`), so the eight copied skills sort together and don't collide with other plugins' generic names (`animate`, `gestures`).
- `description`: sibling skill names are re-pointed to the `emil-` names, and one sentence is appended routing a general design request (polish, redesign, critique, "use design skills") to `uiux` first and a public page build to `taste`.
- In the body, mentions of the other bundled skills (`animate`, `review-animations`, `remove-animations`, `../choreograph/`, `../pick-ui-library/`) point at the `emil-` folders. Mentions of upstream skills not bundled here (`improve-animations`, `find-animation-opportunities`, `animate-expo`, `animation-performance`) carry "(not bundled)".
- Nothing else is changed: `diff -r` against the commit above shows only these lines and the added `LICENSE` and `SOURCE.md`.

## Updating

Re-copy `skills/animate/` from a newer upstream commit, re-apply the changes above, update the commit and date here and in the other seven `emil-*/SOURCE.md` files, and note it in the plugin CHANGELOG. Upstream has twelve more skills (Swift, Expo, Sonner, audits, prototypes); add one the same way when a session needs it.
