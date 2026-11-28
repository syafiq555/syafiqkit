# Source

Vendored from emilkowalski/skills by Emil Kowalski: https://github.com/emilkowalski/skills (folder `skills/emil-design-eng/`), commit `64eb3deb9a5fbfa041faf783e0bc3fd635872e9c` (15/11/2026), copied 21/11/2026. Licence: MIT, kept in `LICENSE` beside this file.

## Changes from upstream

- Folder and `name` unchanged: upstream already calls it `emil-design-eng`, which the seven others now match.
- `description`: one sentence is appended routing a general design request (polish, redesign, critique, "use design skills") to `uiux` first and a public page build to `taste`.
- In the body, the two links to `../choreograph/SKILL.md` point at `../emil-choreograph/SKILL.md`.
- The one-line re-read note under the title (added 21/11/2026 because the file was about 6,400 `cl100k_base` tokens) was removed on 28/11/2026: the body is now about 4,100 tokens, under the 5,000-token re-attach point.
- The body was restructured and condensed on 28/11/2026 to fit the 5,000-token re-attach point. Every H2 stays in `SKILL.md` with a pointer and its headline rule; the bodies moved to `references/`: Spring Animations to `spring-animations.md`; CSS Transform Mastery to `css-transform-mastery.md`; clip-path for Animation to `clip-path.md`; Gesture and Drag Interactions to `gestures-and-drag.md`; Performance Rules to `performance-rules.md`; Accessibility to `accessibility.md`; Debugging Animations to `debugging-animations.md`. Moved text is verbatim except light wording tightening; no rule or value was dropped (code blocks identical). Everything else (Initial Response, Core Philosophy, Review Format, Animation Decision Framework, Component Building Principles, Sonner Principles, Stagger Animations, Review Checklist) stays in `SKILL.md`, wording tightened. Em dashes in newly written lines are avoided, so a few upstream ones were replaced.
- The bare-invocation reply ("I'm ready to help...") is kept as upstream wrote it; `uiux` always invokes this skill with the motion task as its argument.
- Apart from the 28/11/2026 restructure above, nothing else is changed. `upstream/SKILL.upstream.md` is the pristine upstream file at the commit above, never edited.

## Updating

Three-way update of `SKILL.md`: diff `upstream/SKILL.upstream.md` against the new upstream `SKILL.md`, and apply each upstream change to the matching passage in our `SKILL.md` or the `references/` file the move list above names (the heading says where it went); re-apply the description sentence and the `../emil-choreograph/SKILL.md` link patches. Then overwrite `upstream/SKILL.upstream.md` with the new upstream file. For the other files (`LICENSE`), re-copy. Update the commit and date here and in the other seven `emil-*/SOURCE.md` files, and note it in the plugin CHANGELOG. Upstream has twelve more skills (Swift, Expo, Sonner, audits, prototypes); add one the same way when a session needs it.
