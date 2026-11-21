# Source

Vendored from emilkowalski/skills by Emil Kowalski: https://github.com/emilkowalski/skills (folder `skills/emil-design-eng/`), commit `64eb3deb9a5fbfa041faf783e0bc3fd635872e9c` (15/11/2026), copied 21/11/2026. Licence: MIT, kept in `LICENSE` beside this file.

## Changes from upstream

- Folder and `name` unchanged: upstream already calls it `emil-design-eng`, which the seven others now match.
- `description`: one sentence is appended routing a general design request (polish, redesign, critique, "use design skills") to `uiux` first and a public page build to `taste`.
- In the body, the two links to `../choreograph/SKILL.md` point at `../emil-choreograph/SKILL.md`.
- A one-line note under the title asks a session to re-read the section it is working on after a compaction (the file is about 6,400 `cl100k_base` tokens, past the 5,000-token re-attach point).
- The bare-invocation reply ("I'm ready to help...") is kept as upstream wrote it; `uiux` always invokes this skill with the motion task as its argument.
- Nothing else is changed: `diff -r` against the commit above shows only these lines and the added `LICENSE` and `SOURCE.md`.

## Updating

Re-copy `skills/emil-design-eng/` from a newer upstream commit, re-apply the changes above, update the commit and date here and in the other seven `emil-*/SOURCE.md` files, and note it in the plugin CHANGELOG. Upstream has twelve more skills (Swift, Expo, Sonner, audits, prototypes); add one the same way when a session needs it.
