# Source

Vendored from emilkowalski/skills by Emil Kowalski: https://github.com/emilkowalski/skills (folder `skills/pick-ui-library/`), commit `64eb3deb9a5fbfa041faf783e0bc3fd635872e9c` (15/11/2026), copied 21/11/2026. Licence: MIT, kept in `LICENSE` beside this file.

## Changes from upstream

- Folder and frontmatter `name` are `emil-pick-ui-library` (upstream `pick-ui-library`), so the eight copied skills sort together and don't collide with other plugins' generic names (`animate`, `gestures`).
- `description`: unchanged (it names no sibling skill).
- Body unchanged.
- Kept only because `emil-animate` and `emil-gestures` read it by path. Its upstream `disable-model-invocation: true` stays.
- Nothing else is changed: `diff -r` against the commit above shows only these lines and the added `LICENSE` and `SOURCE.md`.

## Updating

Re-copy `skills/pick-ui-library/` from a newer upstream commit, re-apply the changes above, update the commit and date here and in the other seven `emil-*/SOURCE.md` files, and note it in the plugin CHANGELOG. Upstream has twelve more skills (Swift, Expo, Sonner, audits, prototypes); add one the same way when a session needs it.
