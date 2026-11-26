# Source

Vendored from emilkowalski/skills by Emil Kowalski: https://github.com/emilkowalski/skills (folder `skills/review-animations/`), commit `64eb3deb9a5fbfa041faf783e0bc3fd635872e9c` (15/11/2026), copied 21/11/2026. Licence: MIT, kept in `LICENSE` beside this file.

## Changes from upstream

- Folder and frontmatter `name` are `emil-review-animations` (upstream `review-animations`), so the eight copied skills sort together and don't collide with other plugins' generic names (`animate`, `gestures`).
- `description`: sibling skill names are re-pointed to the `emil-` names, and one sentence is appended routing a general design request (polish, redesign, critique, "use design skills") to `uiux` first and a public page build to `taste`.
- In the body, mentions of the other bundled skills (`animate`, `review-animations`, `remove-animations`, `../choreograph/`, `../pick-ui-library/`) point at the `emil-` folders. Mentions of upstream skills not bundled here (`improve-animations`, `find-animation-opportunities`, `animate-expo`, `animation-performance`) carry "(not bundled)".
- `disable-model-invocation: true` is removed from the frontmatter, so `uiux` and `done` can invoke the reviewer through the Skill tool when a diff adds motion. Upstream keeps it user-only.
- 27/11/2026, local addition from syafiqkit source #15, not upstream: `STANDARDS.md` gains § Refusal shake and theme switch (shake pairing and reduced motion, theme-switch transition suppression, `interpolate-size` fallback).
- 27/11/2026, local addition from syafiqkit source #15, not upstream: `SKILL.md` "Aggressive Escalation Triggers" gains two bullets after the `prefers-reduced-motion` one: (1) a shake that is the only error signal, repeats on every invalid keystroke or still plays under reduced motion; (2) a light/dark switch with colour transitions and no suppression for the switch frame, or `interpolate-size` with no fallback. Both point at the new `STANDARDS.md` section.
- Beyond the lines above, none were edited by hand; no `diff -r` against the upstream commit was run for these 27/11/2026 changes.

## Updating

Re-copy `skills/review-animations/` from a newer upstream commit, re-apply the changes above, update the commit and date here and in the other seven `emil-*/SOURCE.md` files, and note it in the plugin CHANGELOG. Upstream has twelve more skills (Swift, Expo, Sonner, audits, prototypes); add one the same way when a session needs it.
