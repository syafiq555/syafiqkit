---
name: carousel-builder
description: >
  Build a swipeable photo post (a TikTok photo carousel, Instagram carousel, Reels or Stories slide set) as HTML slides
  rendered by a headless browser to 1080x1920 or 1080x1350 JPEGs, with the brand's own fonts and colour tokens and real
  screenshots of the product, then MEASURE every slide: text inside the platform's UI bands (top, caption area, action
  buttons), capital letters smaller than the readable minimum, low contrast, clipped or spilling text, a web font or
  weight that silently fell back, a missing image, dashes, emoji and the project's banned words all fail the build with
  a boxed overlay; the caption file gets the same copy check. Fires on "make a carousel", "carousel post", "photo
  slides", "TikTok slides", "slide post", "swipe post", "7-slide set", "Instagram carousel", "rebuild the slides",
  "check the safe zone", "is the text big enough", "lift the carousel builder", and on a post's slides.html or
  build.mjs. Any product or brand. NOT for one designed image or social card (`product-still`), NOT for video, reels
  with motion or voice-over (`motion-clip`), NOT for a meeting deck (`explainer-deck`); a LinkedIn PDF carousel has no preset yet.
---

# Carousel builder

A carousel is a program: one `build.mjs` per post writes HTML slides, a headless browser photographs each `.slide` at the platform's exact size, and the same page is then measured. A copy change is an edit plus a re-run, and a slide that breaks a platform rule cannot leave the folder looking finished, because the run exits 1 and writes `check-NN.png` with the bands tinted red and every offender boxed.

## 1. Set up the series folder

Copy `scripts/carousel.mjs`, `templates/brand.css`, `templates/rules.json` and `templates/build.mjs` into a folder that holds the posts, one sub-folder per post:

```
<series>/carousel.mjs   <series>/brand.css   <series>/rules.json
<series>/<post>/build.mjs  + its logo and screenshots
```

The script is copied, not imported from the plugin, so a series keeps rendering the same after a plugin update; to take a later fix, copy `carousel.mjs` over again and re-run every post. Playwright comes from any repo that has it: point `PLAYWRIGHT_DIR` there, or `npm i playwright && npx playwright install chromium` in the series folder.

**The brand sheet is the only place raw values live.** Fill `brand.css` from the product's own theme file or design tokens; with none, read the live site's computed colours and fonts. It holds the `@import` for the web fonts (every weight the slides use, since a missing weight is faked and fails the font check), `--font-display`, `--font-body`, the `--brand-25..900` ramp, `--ink-*` neutrals, `--solid` (badges and the CTA pill) and `--shadow-rgb`. The placeholder blue reads as another company.

`rules.json` holds `banned` (words or phrases the project's copy rules forbid: claims the product can't make, legal words its site doesn't use) and two switches, `dashes` and `emoji`, both on by default; turn one off only when the project's style allows it.

`templates/examples/autorentic/` is a worked series: a real brand sheet, its rules, and TT-W2-02 (7 slides, Malay copy, a real app screenshot on the last slide). Read its `NOTES.md` first: its copy rules belong to that product, and the post fails one contrast check, kept so it matches what was previewed.

## 2. Write the slides

`build.mjs` imports `build` (and optionally `slide`) from `../carousel.mjs` and passes a list of `<section class="slide">` strings. The base classes (`.bar .logo .logo-tile .count .body h1 h2 .lead .accent .num .card .row .k .v .chip .note .hint .cta .shot`) read only brand tokens and place the bar and body inside the preset's safe area, so a slide built from them starts inside the bands. Per-post size tweaks go in the `css` string; colours in inline styles use `var(--...)`, never a hex. On the 4:5 preset the body is shorter (about 1100 px), so cut a slide's content rather than shrink type below the minimum.

One idea per slide, the hook on slide 1 in large type, the offer and CTA on the last. A screenshot goes in `.shot` and must be captured from the real product with demo data: the capture routes are in `../product-still/SKILL.md` §2 and 📖 `../motion-clip/references/capture-web-ui.md`. Screenshots are exempt from the text checks (they are screen, not caption); mark one `data-message` when its text is the point of the slide, and it is held to the safe zones too. Text inside `.logo`, `.logo-tile` or `[data-logo]` is exempt from contrast, as logotypes are; `data-check-skip` exempts an element from every check, for decoration that is not meant to be read.

```
PLAYWRIGHT_DIR=<a repo with playwright installed> node <post>/build.mjs [preset]
node carousel.mjs copy <post>/post.txt --rules rules.json
```

## 3. Read the checks, then look

`checks passed` is the floor, not the review. Open every JPEG: the checks can't tell a weak hook, a wrong claim, a cramped card or two slides saying one thing, and the rules a word list can't hold (a price shown with its condition, demo figures labelled as demo) belong in the series' own notes and a read-through. When a check fails, `check-NN.png` shows where; fix the slide, not the threshold. The presets and their sources are in 📖 `references/presets.md`; a new platform is one more entry there and in `PRESETS`, with its source.

To check slides built elsewhere: `node carousel.mjs check <slides.html> [preset] [--rules rules.json]` (writes `check-NN.png` beside the html).

How it measures: on each text run's line box, a little taller than the ink, so a line touching a band edge fails slightly early. Cap height uses the loaded font's real `H` height times any CSS scale. Contrast is WCAG (4.5:1, or 3:1 at a cap height of 40 px or more) against the nearest solid background; text over a background image or gradient is not judged, so look at it yourself.
