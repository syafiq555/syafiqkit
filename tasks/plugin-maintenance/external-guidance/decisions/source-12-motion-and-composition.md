# External Guidance: Emil Kowalski's skills and the three-planes video (source #12)

## Current state {#current}

21/11/2026: built as 1.464.0 (uncommitted at time of writing). Eight skills vendored from emilkowalski/skills at `64eb3deb9a5fbfa041faf783e0bc3fd635872e9c` as `emil-*`; `uiux` routes motion to them; `done`'s Design row runs `emil-review-animations` on a diff that adds motion; the video's three moves are in `uiux/references/composition-moves.md`, and the three-planes move in `taste/references/layout.md` § 5. Score loop below.

## Key Technical Decisions {#decisions}

### 2026-11-21: vendor whole, wire into the doors Syafiq uses {#vendor-and-wire}

Asked "check how i prompt, and which one is the best with no less quality", the transcripts of the last 60 days (4,476 sessions) showed design requests as "use design skills", "polish", "uiux", "nicer", "u dont use the taste one?", and none asking to "animate" UI or "review animations". So copying the skills alone would leave them untriggered, and folding their rules into `uiux` repeats the 09/10/2026 absorption that lost quality (`source-11-design-skills.md#vendored`). Chosen: copy whole for quality, and call them from `uiux` and `done` for use.

- Six chosen skills plus two they read by path (`choreograph`, `pick-ui-library`), so no relative link breaks. Twelve upstream skills skipped (Swift, Expo, Sonner, router, audits, prototypes); their names carry "(not bundled)" where a copied body mentions them.
- `emil-review-animations` had `disable-model-invocation: true` upstream; removed locally so `uiux` and `done` can invoke it.
- `done` decides motion from the diff's added lines, not recall, since `taste` was dropped from reviews five times when it depended on recall.
- `taste`'s inspector fails a headline a fifth or more hidden, and its imagery reference already rejects an object over the letters, so the video's subject-in-front-of-type look was written as "may cover only a small part of the word" in both skills.

## Score loop {#score-loop}

Stop rule (Syafiq, 21/11/2026): 18/20 or more, at most 4 rounds; a plateau or round 4 below 18 is reported and asked about.

Rubric, frozen, ten checks scored 0/1/2 (2 fully meets, 1 visible gap, 0 missing or broken; "cannot assess" scores 0 and is named):

1. No loss: each `emil-*` folder differs from upstream at the pinned commit only by patches its `SOURCE.md` lists (`diff -r`).
2. Provenance: `LICENSE` and `SOURCE.md` (commit, date, changes, update steps) in each copied folder.
3. Internal references work: every sibling-skill mention and relative path inside the eight resolves from the citing file's folder; no mention of a skipped skill reads as an instruction to use it.
4. `uiux` routes motion: its job section sends motion, press/hover feel, drawer and gesture work to the right `emil-*` skill, in words Syafiq uses ("polish", "design skills"), not only "animate".
5. `done` runs the reviewer from the diff: a diff-based condition (not recall) triggers `emil-review-animations`, and its findings fold into the one merged design score and the Output row.
6. Video tips in `uiux`: all three moves present, each with when to use, when not to (dense dashboards, tables, forms), and the source credited.
7. Three planes in `taste`: in `references/layout.md`, action kept on the top layer with contrast, consistent with the inspector, and listed in `taste/SOURCE.md`.
8. Fresh-session trigger, polish: a new headless Sonnet session asked to polish a button and drawer's feel "using design skills" in a real app worktree calls `uiux` then an `emil-*` skill (read from the tool-call stream).
9. Fresh-session trigger, `/done`: `/done` on a diff adding a CSS transition calls `emil-review-animations`.
10. Fresh-session trigger, flat screen: "this screen feels flat" makes `uiux` open `composition-moves.md`.

Conventions (not defects): the twelve skipped upstream skills; upstream's em dashes and wording inside vendored files; `emil-design-eng`'s fixed bare-invocation reply; a vendored `SKILL.md` over 5,000 tokens that carries a re-read pointer (the owner's choice for `taste`); `uiux` and `done` were already over 5,000 tokens before this change (5,112 and 5,165), now 5,380 and 5,243; the peer-modified files in the tree (`taste/scripts/inspect.mjs`, `taste/scripts/lib/cdp.mjs`, `tasks/plugin-maintenance/mod/current.md`).

Rounds:
- Round 1: 17/20, fresh judge (product-reviewer, Sonnet). Lost: check 3 (1, two descriptions kept bare upstream names), check 9 (0, `/done` skipped the motion review because the CSS rendered nowhere). Fixed: motion review made its own `/done` step and Output row, independent of Design; descriptions re-pointed.
- Round 2: 20/20, fresh judge (product-reviewer, Sonnet). Stop rule met. Its zero-point notes, fixed after: `done`'s motion search words narrowed (`layoutId`, `drag=`) and widened (Tailwind `transition-`/`animate-`/`duration-`, Chakra `transition=`); two `SOURCE.md` files trimmed to what `diff -r` shows. Left open: each trigger check is one run (n=1); `uiux` 5,380 and `done` 5,386 tokens past the re-attach point.
