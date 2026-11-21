# Composition moves for a flat or default screen {#composition-moves}

Three moves for a screen that is correct and still reads flat or "default": a product page, a profile, a hero, an onboarding or empty-state screen, a booking or event detail. Each is a judgement, not a rule: it spends the screen's one moment of distinctiveness (see The Tension in `../SKILL.md`), so it belongs where the screen's job is to make one thing land, never on screens people work in all day.

Source: a short video by @ayoships (21/11/2026 intake), showing each move before and after on phone screens (a headphone product page, a church service page, a coach profile). The numbers below are not from the video; they point to `taste`'s measured references.

## 1. Three planes, overlapping {#three-planes}

**The move:** build the screen in three layers. At the back, one large word set as display type (the product name, the person's name, the day); in the middle, the subject (the product cut-out, the portrait, the building); on top, the actions (price, the main button, the options). Let the layers overlap a little: the subject rises into the back word, the action bar sits over the subject's lower edge. The overlap makes the screen read deep instead of as stacked boxes.

**Keep the back word readable.** The subject may stand behind the letters, touch the word's edge, or cover a small part of it, never so much that the word stops reading: `app-kit/scripts/inspect.mjs` fails large text a fifth or more hidden, and the same line holds here. The actions stay on the top layer, on their own ground at full contrast.

**How to build it:** z-order and position (`position: relative` with a stacking order, negative margins or transforms), not shadows or glows; depth comes from overlap and size, so no drop shadow is added to a cut-out. On a phone, keep the overlap and check the word still reads at the screen's width (size the display type to the phone's width, not the desktop's).

**Not for:** lists, tables, forms, settings, dashboards and anything read repeatedly; text-heavy screens; a subject photographed on a busy background (it needs a clean cut-out or a flat field first). 📖 `../../taste/references/backgrounds.md` ("Lit studio sweep") for the ground behind a cut-out.

## 2. One signal colour, only for "tap this" {#signal-colour}

**The move:** pick one colour that only ever means "you can tap this": the main button, the active option, a link. Everything else is ink and paper: text in one or two neutrals on a neutral ground. When people can't tell what to tap, the cause is usually colour spent on decoration (headings, icons, borders, badges) so the action no longer stands out.

**How to apply it:** audit where the accent appears and remove it from everything that is not interactive; status colours (error, success) stay, since they mean something else, but never borrow the signal colour. Check the signal colour at 4.5:1 for text on it and 3:1 against its ground. In an existing app, the signal colour is the app's primary token; this move is about where it is used, not a new colour.

**Not for:** data visualisation, where colour encodes series (that is `dataviz`); a brand that already uses colour as a field on purpose (a colour field the brand owns). 📖 `../../taste/references/system.md` § Colour (one accent at most, under 3% of a screen outside the primary button, focus ring and links).

## 3. Skip the middle sizes {#size-extremes}

**The move:** make one thing huge and everything else small, with nothing in between. A screen that uses five close sizes (12, 14, 16, 18, 20) has no hierarchy a glance can read; one display size and one text size, far apart, reads as designed.

**How to apply it:** choose the one element the screen is about (the name, the price, the date), set it very large, and bring every other label down to the body size or one step under it, separated by weight, colour and space instead of size. 📖 `../../taste/references/system.md` § Type (one size per kind of element, body 16px, nothing under 13px).

**Not for:** working screens where many items carry equal weight (tables, forms, settings, dense dashboards), where the middle sizes are what lets people scan; follow the app's type scale there. A screen with no single subject has nothing to make huge: fix the content first.

## Checking the result

Squint at the screen at 375px: the back word, the subject and the button should separate into three planes, and the only coloured thing should be what you tap. Then run the screen's normal verification (`../SKILL.md` § Verify by Looking); on a customer-facing screen, `../scripts/check-render.mjs` and `../app-kit/scripts/inspect.mjs --app` catch a covered headline or a contrast failure the squint misses.
