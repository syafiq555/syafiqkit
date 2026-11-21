<!--LLM-CONTEXT
Status: built 22/11/2026; score loop stopped after round 2 (both judges 20/20)
Domain: plugin-maintenance/external-guidance (source #13: Syafiq's own UI sessions plus a 2026-11 design-skill survey)
Related: `../current.md`, `source-11-design-skills.md` (`#vendored` routing, the reverted merge), `source-12-motion-and-composition.md`
-->

# Source #13: UI handling, from the user's own sessions

## Evidence {#evidence}

Session mining, 22/11/2026: 691 main sessions over 60 days, 71 with a design skill (32 beacon-mart, 19 autorentic). Five failure patterns, ranked:

| # | Pattern | Quote |
|---|---|---|
| 1 | Redesign delivered as polish | "what i expect is design revamp", "not polish" (beacon-mart, 18/11) |
| 2 | Design skills skipped, late, or audit-only | "Why doesnall other design skills only audit like that ?, is uiux alone enough ?" (autorentic, 15/11) |
| 3 | Visible defects found by the user's eye after Claude had looked | "this teal color text, makes it hard to read", "why is it aligned like this", "even buttons also dont have cursor pointer" |
| 4 | Generic or hard-to-read result | "seems like her's one is much more better than ours one" |
| 5 | Slow, heavy process | "16minutes already", "is there a need ... to keep running full test again and again ?" |

In 41 of 106 frontend sessions (39%) no image was read after the last frontend edit. Praise followed sourced case studies, rendered options to pick from, and a fixed screen shown to the user.

Survey gaps found, all four addressed below: no token-governance lint (Tinte's `lint` exits 1 on an untokened colour, github.com/Railly/tinte); vendored `impeccable` 4.8.2 and `taste` 2.1 behind upstream (github.com/pbakaus/impeccable/releases/tag/skill-v4.10.0; github.com/Leonxlnx/taste-skill, 2.5.1); no deterministic project-design probe (shadcn's `info --json`, ui.shadcn.com/docs/skills); render, score, revise not wired to UI (StyleSeed's gate, github.com/bitjaru/styleseed, self-reported: rules alone -3.7, rules plus gate +5.3).

## Decisions {#decisions}

| Decision | Rationale |
|---|---|
| New `uiux/scripts/check-render.mjs`: measured checks (contrast on the painted background, clipped and truncated text, overlap, tap size, pointer cursor, sibling size and alignment, card-in-card, sideways scroll, em dash) at 320 to 1280 in each scheme, exit 1 on FAIL | Pattern 3: the model's reading of screenshots is the weak instrument; the defects the user found are all measurable. On a real autorentic screen it found the teal 12px text at 3.92:1 and 21px tap buttons |
| New `uiux/scripts/probe-design-system.mjs`: stack, token sources, shared components with use counts, raw-value counts, whether a token lint exists | Survey gap 3 and pattern 4; replaces "grep for the mechanism" with one deterministic read |
| Token lint: show counts and ask once per repo, record the answer in its frontend `CLAUDE.md` | Owner chose "Offer, then add" |
| `uiux` and `done`: a design pass fixes what it finds and shows before and after; only access, customer wording or an unpicked direction goes back as a question | Pattern 2 |
| No look-hook | Owner chose "No hook"; the score loop's headless sessions measure whether the prose holds |
| `impeccable` to 4.10.0 and `taste` to 2.5.1, wholesale | Owner chose "Full upgrade both"; taste's finish-gate Stop hook kept (owner: "Keep taste's gate") |
| taste 2.1's app-screen pipeline copied to `uiux/app-kit/` before the swap | 2.5.1 drops it, and `uiux`'s direction deal (`draw.mjs --app`) and app inspector depend on it |
| `taste/assets/web-scenes/` deleted | 2.5.1 ships the same material at `assets/scenes`, `effects`, `ui`, `objects` |

## Score loop {#score-loop}

Stop rule (owner): both judges 18/20 or more in the same round; ask at round 5. Judges: one retained plus one fresh each round, reported separately. Each round includes headless `claude -p --model sonnet` sessions given the owner's own words, judged from their tool calls.

### Rubric, frozen before round 1 (20 yes/no checks) {#rubric}

1. **Revamp, not polish**: (a) `uiux` requires two or three rendered directions dealt by a script before token or atom work on a redesign, and forbids a tiebreak pick; (b) a headless "redesign, i want revamp not polish" session deals directions (`draw.mjs --app` or `taste`'s deal) before building.
2. **Improve, not audit**: (a) `uiux` and `done` say findings are fixed in the same pass, with only access, customer wording or an unpicked direction asked; (b) a headless "use design skills to polish" session edits frontend files.
3. **Measured looking**: (a) `check-render.mjs` fails every seeded defect and passes a clean page (control both ways, rerun by the judge); (b) the headless polish session runs check-render after its last edit.
4. **Shown to the user**: (a) `uiux` and `done` require before and after captures shown through the gallery tool; (b) the headless polish session produces before and after captures and names or shows them.
5. **Design probe**: (a) `probe-design-system.mjs` runs on a real repo and two of its counts match a grep; (b) the headless polish session runs the probe (or reads the app's tokens and atoms) before styling.
6. **Token lint offer**: (a) `uiux` asks once per repo and records the answer where the next session reads it; (b) the probe reports `tokenLint` correctly on a repo with one and a repo without.
7. **taste 2.5.1**: (a) no file outside `skills/taste/` (except `tasks/` and CHANGELOG history) points at a taste file that no longer exists; (b) `taste`'s scripts load and its gate hook exits 0 with no armed build and with no `node` on PATH.
8. **impeccable 4.10.0**: (a) no dangling paths into or inside `skills/impeccable/`; (b) its detector flags a seeded generic-look page and is quieter on a clean one.
9. **App pipeline kept**: (a) `uiux/app-kit/scripts/draw.mjs --app` deals directions; (b) every former caller of taste's `draw.mjs --app`, `inspect.mjs --app` and `lint.mjs` now points at `app-kit` or `check-render`.
10. **Lean and reachable**: (a) builder briefs say parallel builders and re-running only touched specs; (b) the new "design pass ends in a better screen, shown" rule sits within `uiux`'s first 5,000 tokens.

**Conventions (not defects):** the owner's choices above (no look-hook, full upgrades, taste's gate kept, token lint asked not added); `uiux/SKILL.md` and `taste/SKILL.md` past 5,000 tokens as a whole (pre-existing; only 10b is scored); a headless session that cannot reach a dev server judged on whether it tried the right step; `AskUserQuestion` unavailable headless (a session that stops to present options counts as asking).

### Rounds {#rounds}

Retained judge: judge A (general-purpose, Sonnet), from round 1.

- **Round 1** (22/11/2026): retained 17/20 · fresh 18/20. Retained missed 2a (customer wording absent from `uiux`'s list), 7a and 9b (`composition-moves.md` still naming taste's retired inspector). Fresh missed 3a (card-in-card, truncation and uneven cards only WARN, so "PASS: 0 FAIL") and 6b (probe blind to beacon-mart's oxlint `no-raw-values` in `vite.config.ts`; the retained judge scored 6b yes on the same evidence). Both noted, unscored: the polish session ran only `uiux` on "use the design skills", skipped the probe, and never opened its own captures. Fixes: `uiux` top section became a six-step pass (probe, find with `impeccable` and `taste` when "design skills" is said, fix, measure, look, show); WARNs fixed or named; check-render prints the WARN count and writes to the temp folder; probe reads oxlint, biome and `vite.config` lint blocks; `Token lint:` marker; pointers re-aimed at `app-kit` and check-render.
- **Round 2** (22/11/2026): retained 20/20 (all round-1 items closed; it withdrew its own round-1 6b "yes") · fresh 20/20. **Stop rule met.** Unscored and still open in both judges' notes: on "use the design skills" the polish session again ran only `uiux` ("I did not run impeccable or taste, so say if you want those passes"), the revamp session skipped the `impeccable` critique before offering directions, polish showed only the desktop pair, and check-render's sideways-scroll finding said "Widest: unknown". Post-round fixes: step 2 now runs `impeccable detect` and `taste`'s review path as commands (commands held in every run; Skill calls to sibling skills did not, as in the five `taste` drops of `source-11-design-skills.md`), step 6 names the four pictures, step 1 says probe even after reading the token file, h-overflow names an escaping `position:absolute` element, the probe ignores fetch-ban `no-restricted-*` rules, `taste/SOURCE.md` loses the deleted `web-scenes`.
- **Refresh after shipping** (22/11/2026, 1.465.1): `uiux/SKILL.md` went through restructure, condense and unhobble. The design pass and everything through § Verify by Looking now fit the 5,000-token re-attach window (about 4,800 of 6,000 tokens); go-live, motion routing, port, greenfield, research dispatch, direction approval and builder grading sit behind pointers. Six of eight moved paragraphs duplicated their destination and were deleted, which became a `refresh-instructions` prompt rule.
