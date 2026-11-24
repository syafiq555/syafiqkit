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
