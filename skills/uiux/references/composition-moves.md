# Composition moves for a flat or default screen {#composition-moves}

Moves for a screen that is correct and still draws a complaint about how it looks: a product page, a profile, a hero, an onboarding or empty-state screen, a booking or event detail, a landing page section. People name the symptom, never the technique, so start from what they said:

| They say | Move |
|---|---|
| "boring", "default", "templated", "looks like every other app" | [Break the layout](#break-layout) |
| "doesn't stand out", "nothing pops", "too safe" | [Exaggerate the scale](#size-extremes) |
| "plain", "empty", "bare", "lacks character" | [Add detail from the subject](#add-detail) |
| "no focal point", "where do I look", "everything shouts", "busy" | [One odd element](#odd-one-out) |
| "can't tell what to tap" | [One signal colour](#signal-colour) |
| "flat", "stacked boxes", "no depth" | [Three planes](#three-planes) |

**When the user names the symptom, the move this table maps to it leads the answer, by name**, in a fix and in a critique alike: apply or recommend it first, and add other moves after it. If the screen shows another move fits better, still name the mapped one and say in one line why it loses here; silently swapping in a different move leaves the user's complaint unanswered in their own words. A vague complaint ("it's meh", "make it nicer") is diagnosed before it is fixed: run the blur check below on the before capture and name the symptom it shows, since each fix answers a different failure and the wrong one adds noise.

Each move is a judgement, not a rule: it spends the screen's one moment of distinctiveness (see The Tension in `../SKILL.md`), so it belongs where the screen's job is to make one thing land, never on screens people work in all day. Use one move per screen, two at most; "if everything is contrasted, then nothing stands out" (NN/g, visual hierarchy). Inside a named `impeccable` run, its `bolder` and `delight` commands are the equivalents for "doesn't stand out" and "plain".

Sources: two short videos showing each move before and after: @ayoships (21/11/2026: three planes, signal colour, skip the middle sizes, on phone screens) and @createwithalena (24/11/2026: layout, scale, detail, contrast, on posters). The videos carry no data; the limits and figures below come from NN/g, MDN, Axess Lab and `taste`'s measured references. Both videos are posters or showcase screens, so every move carries the screens it would harm.

## Break the layout {#break-layout}

**The symptom:** "boring". Everything is centred, stacked and the same width, so the eye has nothing to travel across.

**The move:** let the subject and the headline use the whole frame instead of a centred column: place the subject off-centre, let it cross an edge or the boundary between sections, run the headline across two lines at different indents, or set the text beside the subject rather than above it. The video's poster spread its tomatoes across the frame and staggered the word down it as TO / MA / TO; on a poster that is fine, but on a web page stagger whole lines of one heading instead, as below.

**Keep it readable:** keep the source order the reading order and move things with grid placement only; MDN: "Authors must use `order` and the grid-placement properties only for visual, not logical, reordering of content." Never split a word into separate letters or elements: screen readers then read it letter by letter, and "it's more important to get the whole sentence read" (Axess Lab, text splitting). Stagger whole lines of one heading element instead. At 320px wide the layout must still work without sideways scrolling (WCAG 1.4.10), so on a phone the break is usually one offset or one crossing edge, not the desktop composition squeezed.

**Not for:** lists, tables, forms, settings and dashboards, where alignment is what makes scanning work; text people read for more than a few lines.

## Exaggerate the scale, skip the middle sizes {#size-extremes}

**The symptom:** "doesn't stand out" or "still looks default". Five close sizes (12, 14, 16, 18, 20) give no hierarchy a glance can read.

**The move:** make one thing huge and everything else small, with nothing in between. Choose the one element the screen is about (the name, the price, the date, the product), set it very large, and bring every other label down to the body size or one step under it, separated by weight, colour and space instead of size. NN/g's working limit: no more than three sizes, and make the most important element the biggest. For a showcase moment, go further than feels safe: let the display word or the subject run off the edge and be cropped, as the video's poster title ran off the frame and its record was cut in half. A cropped subject reads as bigger than the frame.

**Keep it readable:** crop with `overflow: hidden` on the element's own wrapper, never on the page body, which can clip text at zoom. A cropped word must still read whole (cut only part of the last letter, or crop the subject, not the word). Size display type with `clamp()` on a `rem` base so the reader's font setting still applies; "setting a font-size in pixels or other absolute units (and even viewport-relative units) overrides the user entirely" (web.dev, fluid type). 📖 `../../taste/references/system.md` § Type (one size per kind of element, body 16px, nothing under 13px).

**Not for:** working screens where many items carry equal weight (tables, forms, settings, dense dashboards), where the middle sizes are what lets people scan; follow the app's type scale there. A screen with no single subject has nothing to make huge: fix the content first.

## Add detail from the subject {#add-detail}

**The symptom:** "plain" or "empty". The layout and hierarchy are fine, and there is nothing to look at beyond them.

**The move:** add one device that belongs to the subject: a frame or border that suits it, rule lines, real step numbers, an edition or date mark, a pattern or texture drawn from the product itself (the fabric, the map, the label). The video's poster put its plain label inside an ornamented frame. One device per section, used the same way each time it appears.

**The line between detail and noise:** "Avoid design pollution that decorates the UI with noncommunicative elements" (NN/g, communication not decoration). A detail earns its place when it says something about the subject (a menu's paper texture, a property listing's floor-plan line) or gives order (a numbered sequence that really is a sequence). A generic flourish is the stock look `ai-look-tells.md` lists (an edge stripe on every card, a label above every heading). Purely decorative images carry `alt=""` and stay out of focusable areas. Text over a frame, pattern or texture keeps 4.5:1 against the busiest part behind it (3:1 for large text); where it can't, give the text its own plain ground or keep the detail at the edges.

**Not for:** working screens (tables, forms, dashboards), where every added rule and frame competes with the data; a screen whose real problem is hierarchy, where detail only adds a layer to the confusion.

## One odd element {#odd-one-out}

**The symptom:** "no focal point" or "busy". Everything has the same weight, or everything is emphasised, so nothing is.

**The move:** keep the set uniform and change one thing: one item in a different colour, size or treatment while the rest stay alike, as the video's grid of blue dots gained a few red ones. A difference is only seen against sameness, so the work is usually removing emphasis from everything else (the bold, the badges, the coloured icons) before adding it to the one. Give the focal element space as well; NN/g: "An element that has more space around it will be perceived as one group and thus will receive more attention."

**Keep it readable:** never carry the focus on colour alone; pair the colour with weight, size or position so a colour-blind reader sees it too. The focal colour is not the tap colour: if it marks content, choose a different hue from the signal colour below, or the reader tries to tap it.

**Not for:** data visualisation, where colour encodes series (that is `dataviz`); a list where several items genuinely need equal attention.

## One signal colour, only for "tap this" {#signal-colour}

**The symptom:** "can't tell what to tap". Colour is spent on decoration (headings, icons, borders, badges), so the action no longer stands out.

**The move:** pick one colour that only ever means "you can tap this": the main button, the active option, a link. Everything else is ink and paper: text in one or two neutrals on a neutral ground.

**How to apply it:** audit where the accent appears and remove it from everything that is not interactive; status colours (error, success) stay, since they mean something else, but never borrow the signal colour. Check the signal colour at 4.5:1 for text on it and 3:1 against its ground. In an existing app, the signal colour is the app's primary token; this move is about where it is used, not a new colour.

**Not for:** data visualisation, where colour encodes series (that is `dataviz`); a brand that already uses colour as a field on purpose (a colour field the brand owns). 📖 `../../taste/references/system.md` § Colour (one accent at most, under 3% of a screen outside the primary button, focus ring and links).

## Three planes, overlapping {#three-planes}

**The symptom:** "flat", or the screen reads as stacked boxes.

**The move:** build the screen in three layers. At the back, one large word set as display type (the product name, the person's name, the day); in the middle, the subject (the product cut-out, the portrait, the building); on top, the actions (price, the main button, the options). Let the layers overlap a little: the subject rises into the back word, the action bar sits over the subject's lower edge. The overlap makes the screen read deep instead of as stacked boxes.

**Keep the back word readable.** The subject may stand behind the letters, touch the word's edge, or cover a small part of it, never so much that the word stops reading: `../app-kit/scripts/inspect.mjs` fails large text a fifth or more hidden, and the same line holds here. The actions stay on the top layer, on their own ground at full contrast.

**How to build it:** z-order and position (`position: relative` with a stacking order, negative margins or transforms), not shadows or glows; depth comes from overlap and size, and a drop shadow on the cut-out would be a second depth cue competing with the overlap. On a phone, keep the overlap and check the word still reads at the screen's width (size the display type to the phone's width, not the desktop's).

**Not for:** lists, tables, forms, settings, dashboards and anything read repeatedly; text-heavy screens; a subject photographed on a busy background (it needs a clean cut-out or a flat field first). 📖 `../../taste/references/backgrounds.md` ("Lit studio sweep") for the ground behind a cut-out.

## Checking the result {#checking}

Open the blurred captures `../scripts/check-render.mjs` writes (`w375-light-blur8.png`, `w375-light-blur20.png`, the same at 1280 and for the dark scheme when it runs, listed under "Blur check") before and after the move. NN/g's test: at 5 to 10px of blur the groups and the main element should still separate; 20px shows any hierarchy you did not intend. The after capture should show one thing first, and the only coloured thing you can tap should be what you tap. Then run the screen's normal verification (`../SKILL.md` § Verify by Looking); `../app-kit/scripts/inspect.mjs --app` catches a covered headline or a contrast failure the blur misses.
