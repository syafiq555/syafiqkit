# External Guidance: the four-symptoms poster video (source #14)

## Current state {#current}

24/11/2026: shipped as 1.468.0 after a 5-round score loop (18, 19, 19, 19, 20 of 20), then 1.468.2 from the `/done` review and 1.468.3 (`taste` bends for a move on a section marked `data-move`). `uiux/references/composition-moves.md` holds the moves, indexed by the complaint a user makes; `uiux`, `taste`, `uiux`'s critique mode and `done`'s design review point at it; check-render writes `-blur8`/`-blur20` captures on every run. Open: the `three-planes` allowance is untested on a page where `overlap-text` fires; each trigger test ran once.

## The source {#sources}

**The video** (20 s, Instagram creator @createwithalena, from Syafiq's Photos library, 24/11/2026; transcribed with `mlx_whisper` large-v3-turbo), verbatim: "It looks boring? Adjust the layout. It doesn't stand out? Exaggerate the scale. It feels plain? Add more details. No focal point? Use contrast. Happy designing!" Its frames show each as a before and after poster:

| Symptom | Before | After |
|---|---|---|
| Boring | small tomato centred, small "TOMATO" title | tomatoes spread across the frame, the word split TO / MA / TO and staggered down it |
| Doesn't stand out | small "Elisa Bakker" title above a small record | the title huge and running off the edge, the record cropped |
| Plain | a plain "Nora & Elias" label on stripes | the same label inside a frame with a border and ornaments |
| No focal point | a grid of identical blue dots | the same grid with a few dots turned red |

No data behind any claim; graded as judgement. It is a poster lesson, so each move needs its product-screen boundary written beside it.

**What existed before** (source #12, 21/11/2026): `composition-moves.md` held three moves from a similar video, indexed by technique (three planes, signal colour, skip the middle sizes). "Exaggerate the scale" overlaps "skip the middle sizes" without the crop and bleed; "use contrast" overlaps "signal colour", which covers only what can be tapped. Breaking the layout and adding detail were absent. `uiux`'s description named none of the complaint words, and `taste` lost its three-planes section when upstream 2.5 deleted `references/layout.md` (`taste/SOURCE.md`), so a public page that "looks boring" reached no move.

## Key Technical Decisions {#decisions}

### 2026-11-24: index the moves by the complaint, keep one home {#symptom-index}

Users describe the symptom ("boring", "plain", "doesn't stand out", "no focal point", "flat"), never the technique, and both videos are written as symptom then fix. So the reference's headings become the complaints, the existing anchors stay (citations resolve), and `taste` points at the `uiux` copy rather than holding a second one.

### 2026-11-24: `taste` bends for a move, one marked section at a time {#taste-rules-win}

The `/done` product review found three moves `taste` banned: `layout-v4.md` said nothing is staggered, cut off, crossing a section edge or overlapping, and its checker failed `stagger`, `cut-text`, `overlap-text` and `one-section`, so a session told to apply them would fail its own finish gate or drop the move silently. 1.468.2 shipped the safe default (`taste`'s rules win); Syafiq then chose "Let taste bend" (24/11/2026). Built in 1.468.3: a section carrying a move is marked `data-move="break-layout" | "scale-crop" | "three-planes"`, and `consistency.mjs`'s `add()` reports that move's findings there as WARNs naming it; a crop or overlap that hides more than a fifth of the text stays a FAIL (the same line `uiux`'s inspector draws). A marker rather than a blanket loosening, so every other section keeps the rules and a reviewer sees which section asked for the exception. Tested: staggered heading lines FAIL plain and WARN marked; a word cropped 10% WARNs, 40% FAILs. Not tested on a firing case: `three-planes` (the overlap fixture raised no `overlap-text` either way).

### 2026-11-24: working screens get the moves that fit them {#working-screens}

"Boring" maps to break the layout, which is "Not for" dashboards, lists, tables, forms and settings, so the same complaint there had no positive answer. There it gets one odd element (the figure or action the screen is for), one tap colour, and spacing, weight and grouping through the app's tokens.

### 2026-11-24: the h-overflow fallback names only what it can measure {#overflow-fallback}

The first 1.468.0 fallback flagged any element within 40px of the edge carrying a positioned pseudo-element, counted right margins and read a scroll box's `scrollWidth`, so a carousel could be blamed. Narrowed in 1.468.2: skip clipped and scrolling boxes, count only content reach; the hint says "its content or a positioned ::before/::after" when a pseudo-element is present, since Chrome does not return a pseudo-element's resolved width for every case.

## Score loop {#score-loop}

Stop rule (Syafiq, 24/11/2026): 20/20, no round cap.

Also built (Syafiq picked all three from the research pass): blurred captures in check-render (NN/g's squint test, 5 to 10px and 20px), the direction critique as commands, and a named widest element where check-render printed "Widest: unknown".

Rubric, frozen, ten criteria scored 0/1/2 (2 fully meets, 1 visible gap, 0 missing or broken; "cannot assess" scores 0 and is named):

1. Symptom index: `composition-moves.md` opens with a table mapping complaint words to moves, covering the reel's four (boring, doesn't stand out, plain, no focal point) plus flat and can't-tell-what-to-tap.
2. Fidelity: each of the four reel moves matches its frames (layout broken across the frame; huge scale with crop or bleed; detail drawn from the subject; one odd element in a uniform set).
3. Boundaries: every move has a "Not for" line and a readability limit; every quoted source resolves (`curl` the URL and find the quote).
4. Citations: the anchors `#three-planes`, `#signal-colour`, `#size-extremes` survive; every relative path in each edited file resolves from that file's folder (`ls`).
5. `uiux` routing: complaint words in the description's first sentence; description at most 1,536 characters (count the folded text); `design-handoff` and `brainstorming` boundaries still present; the body pointer names the complaints.
6. `taste` routing: complaint words in its description; a body paragraph inside the first 5,000 tokens sends a complained-about page to the moves before step 3; `SOURCE.md` lists the patch.
7. Verifier: `critique-mode.md` hands the design reviewer the blur captures and the moves file, and a look finding names symptom and move.
8. Blur check: `check-render.mjs` writes `-blur8`/`-blur20` on light runs, lists them under "Blur check", records them in `report.json`, and leaves the `-top` capture unblurred (run it on a test page and open the images); the Look step tells the reader to open `-blur8`.
9. Extras: the direction critique is given as commands whose flags exist (`impeccable detect --help`) in both `SKILL.md` and `direction-approval.md`, with a Tell; the h-overflow finding names an element for a `::after` overflow and for a plain wide box (run check-render on both test pages).
10. Fresh-session triggers (headless Sonnet, read from the tool-call stream): "this screen looks boring" makes `uiux` read `composition-moves.md`; "our landing page doesn't stand out" makes `taste` read it; "critique this, no focal point" produces a finding naming the odd-element (contrast) move. 2 = all three, 1 = two, 0 = fewer.

Conventions (not defects): upstream wording and em dashes inside vendored `taste`/`impeccable` files; `uiux` and `taste` already over 5,000 tokens before this change; the unused `i` in `defects.mjs`'s `named` filter (pre-existing); `product-still` unchanged (the research found nothing specific to stills); each trigger test is one run (n=1).

Rounds:
- Round 1 (24/11/2026): 18/20, fresh judge (product-reviewer, Sonnet) for 1 to 9 (17/18) plus the headless triggers (1/2). Lost: 9 (`direction-approval.md` had no Tell); 10 (the "no focal point" critique read `composition-moves.md` but led with scale and the tap colour and never named the odd-element move; "boring" and "doesn't stand out" passed, `taste` reading the moves at its fourth call). Fixed: a Tell in `direction-approval.md`; the moves file and `critique-mode.md` now say a symptom the user names gets its mapped move named first.
- Round 2 (24/11/2026): 19/20, fresh judge (product-reviewer, Sonnet) for 1 to 9 (17/18) plus triggers (2/2; the critique rerun named "one odd element" for "no focal point" and said why scale lost). Lost: 3 (the add-detail move had no contrast limit for text over a pattern). Fixed: 4.5:1 against the busiest part behind the text; nits also fixed (the TO / MA / TO split named with its web limit, `taste`'s path written relative to its folder, blur captures on a dark-only run).
- Round 3 (24/11/2026): 19/20, fresh judge (product-reviewer, Sonnet) for 1 to 9 (17/18) plus triggers (2/2; `taste` rerun after its path change still read the moves). Lost: 8 (with `--scheme both` only the light run was blurred). The frozen check asked only for light runs, so this was strictly a nit; fixed anyway (every run is blurred) and re-judged rather than scored up.
- Round 4 (24/11/2026): 19/20, fresh judge (product-reviewer, Sonnet) for 1 to 9 (17/18) plus triggers (2/2, unchanged files). Lost: 7 (a no-edit critique never ran check-render, so the blur captures it hands the reviewer did not exist). Fixed: critique step 1 runs check-render or writes "blur: not captured". Nits fixed: `--viewport` needs a URL or `file://` path; the pass's step 2 critique became commands (it still said Skill, against the headless finding); `taste`'s "step 3" named as run step 3.
- Round 5 (24/11/2026): 20/20, fresh judge (product-reviewer, Sonnet) for 1 to 9 (18/18) plus triggers (2/2). **Stop rule met.** Nits fixed after: `taste`'s move list gained the tap colour; the TO / MA / TO sentence says to stagger whole lines of one heading. Left as nits: the pseudo-element fallback in `defects.mjs` could name an element with a positioned pseudo near the right edge when nothing else crosses it (no false-positive case built); the Look step names only `-blur8`. Each trigger check is one run (n=1).

### Score loop for 1.468.3 (`taste` bends) {#score-loop-bend}

Stop rule (Syafiq, 24/11/2026, carried over): 20/20, no round cap. Rubric, frozen, ten criteria 0/1/2 ("cannot assess" scores 0, named):

1. Marking rule: `taste/SKILL.md` names the three `data-move` values, when to mark (one section, only where the plan names the user's complaint), and that other moves need no marker.
2. Downgrade: on `stagger-plain.html` vs `stagger-marked.html` the `stagger` findings are FAIL then WARN naming the move (run `taste/scripts/consistency.mjs <page> --profile <dir> --quick`).
3. Crop limit: `crop10.html` WARNs and `crop40.html` FAILs at 1440 for `cut-text`, the FAIL text naming the hidden share.
4. Containment: the unmarked second section of `stagger-marked.html` and every unmarked page keep their FAILs; nothing outside `MOVE_ALLOWS[move]` is downgraded (read `add()`).
5. Honesty: every check id the docs say is allowed is raised through `add()` (grep its callers); docs say section crossing still FAILs.
6. Consistency: `taste/SKILL.md`, `layout-v4.md`, `uiux/references/composition-moves.md`, `taste/SOURCE.md` and the CHANGELOG say the same thing.
7. Gate: `taste/scripts/gate.mjs` blocks on FAIL and not on these WARNs (read its blocking condition).
8. Re-apply: `taste/SOURCE.md` lists every patched file and what to re-apply on an upstream update.
9. Release note: the 1.468.3 entry tells a colleague what changed, what to do and what still fails.
10. Fresh session (headless Sonnet, read from the tool-call stream): "the landing page looks boring and doesn't stand out, fix it" on `t-boring/index.html` reads `composition-moves.md`, and any staggered, cropped or overlapping section it builds carries `data-move`; a run that uses only non-bending moves scores 2 if it names the mapped move.

Conventions (not defects): pre-existing editor warnings in `consistency.mjs`; `three-planes` has no firing fixture (judge it from code); a FAIL at a phone width where a word is cut beyond a fifth is the rule working; n=1 for 10.

Rounds:
- Round 1 (24/11/2026): 15/20, fresh judge (product-reviewer, Sonnet) 15/18 on 1 to 9 plus 0/2 on 10. Lost: 5 (docs promised "nothing crosses into the next section" and no check enforces it), 6 (`composition-moves.md` still let a subject cross "the boundary between sections"; `taste`'s eyes check had no exception), 8 (`SOURCE.md` missed `MOVE_ALLOWS`, `visibleShare` and the run step 1 clause), 10 (the fresh session never read `composition-moves.md`: the paragraph pointer was skipped, as prose hand-offs were in source #13). Fixed: crossing named as kept by the plan and checked by eye; the marker is ignored on `html`, `body` and `main`; both contradictions removed; `SOURCE.md` lists all five patch sites; run step 1 now `cat`s the moves file (rerun: it read the file, named the symptom and built a `scale-crop` section with its marker).
- Round 2 (24/11/2026): 18/20, fresh judge (product-reviewer, Sonnet; resumed once after a network error) 16/18 plus 2/2 on 10 (the rerun read the moves file, named the symptom, built a `scale-crop` section with its marker). Lost: 5 and 9: a marked crop still FAILed `container-edges`, `row-lines` and the phone-width `off-viewport`, which are raised outside `add()`, so in practice a crop could not pass the gate, and the release note did not say so. Fixed in 1.468.5: the downgrade moved from `add()` to one pass over every finding (`applyMoves`), placing each by element id or selector, run in the per-width pass and on a fresh tab after each page-level pass; `container-edges` joined break-layout and scale-crop, `row-lines` scale-crop. Measured: on the 10% crop every move finding WARNs except the phone width where 38% is hidden; the unmarked section keeps its FAILs; a marker on `main` is ignored.
- Round 3 (24/11/2026): 17/20, fresh judge (product-reviewer, Sonnet) 15/18 plus 2/2 on 10 (unchanged routing). Lost: 5, 7 and 9: the gate's second checker (`assets/layout/check.mjs`, via `layout-check.js`) still failed a marked crop on `bleed-one-side` with no `data-move` handling, so "can now pass the finish check" overclaimed; the release note carried a "cut carousel" term. Fixed: `layout-check.js` skips a block inside a `break-layout` or `scale-crop` section in its edge loop and leaves its headings out of the `lines` count (measured: the judge's wrapped crop page gave `[]` marked, two `bleed-one-side` unmarked); `SOURCE.md` lists the file; the note reworded.
- Round 4 (24/11/2026): 16/20, fresh judge (product-reviewer, Sonnet) 14/18 plus 2/2 on 10. Lost: 4 (`movedEdge` skipped every block in a marked section, so a stray card passed), 5 (`overlap-text`'s fifth limit measured the covering box, not the text), 6 (`SKILL.md`'s "every `check.mjs` finding fails", `gate.md` and `layout-v4.md`'s bleed bullet had no exception), 9 (jargon; the 1.468.5 note never named the marker). One claim was wrong: `composition-moves.md` does mention `data-move`. Fixed: `movedEdge` covers only the section's heading and subject; `overlap-text` passes `coveredId` and the limit is the share of the covered text under the box (measured: a 60px cover WARNs, a cover hiding 86% FAILs, the first firing `three-planes` fixture); the three lines qualified; the note rewritten.
- Judge change (24/11/2026, Syafiq): from round 5, a retained judge (the round-4 judge, resumed, told to rescore every check from scratch then name which of its earlier items closed, never told what was fixed) plus a fresh judge each round, scores reported separately. New baseline.
- Round 5 (24/11/2026): retained 17/20 (16/18 as scored, 1 closed item found again: it said `SOURCE.md` listed the bleed, `gate.md` and step 6 sites, and the file has none of them, so 8 reopened at 1) · fresh 15/20 (13/18, 4 new). Both scored 2/2 on 10 by carry-over. Lost: 4 (a card holding a heading escaped `check.mjs`; `consistency.mjs` downgraded any allowed finding anywhere in the section), 5 (`three-planes` still failed `container-edges` on its own subject), 6/9 (the 1.468.5 note claimed cards keep the rules, and named no marker value), 8 (three patch sites missing). Fixed in 1.468.6: both checkers let through only the move's parts (the section itself, its `h1` to `h3`, its subject or `[data-move-subject]`); `three-planes` allows `container-edges` and `spill` and `check.mjs` skips for it too; `SOURCE.md` lists five files; the note names the three values. Measured: cards with and without a title flagged `spill` in a marked section; a small cover over an `h1` WARNs, a large one FAILs; crop and stagger unchanged.
- Round 6 (24/11/2026): retained 19/20 (17/18, round-5 items all closed, no drift case) · fresh 17/20 (15/18, 2 new). Lost: retained 4 (a marked section's `container-edges` downgrade hid the structure rule "needs exactly one `.wrap`"); fresh 5/7 (`narrowPass`, the 320 walk, and by inspection `sweepWidth`, raised `off-viewport` and `cut-text` without `applyMoves`, so a marked subject past the edge still blocked the gate), 6 (`gate.md` and the 1.468.6 note left out the section itself). Fixed in 1.468.7: `STRUCTURE_MSG` keeps structure messages FAIL; `applyMoves` at the end of `narrowPass` and `sweepWidth`; `movedEdge` also passes descendants of a heading or `[data-move-subject]`; docs aligned. Measured: the judge's svg subject WARNs at every width and at 320 marked, FAILs unmarked; the structure messages stay FAIL on marked pages; cards still flagged.
