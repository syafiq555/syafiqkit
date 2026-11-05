---
name: product-still
description: >
  Make a designed STILL image from a product's real screens: a "how it works" step picture, a feature illustration,
  a landing-page or hero composite, a social or Open Graph card, a device-style mockup, a marketing image replacing an
  outdated screenshot. Real captured UI goes into floating, cropped cards with numbered steps, connector lines and an
  icon badge, rendered from HTML by a headless browser to PNG, with a desktop image, a separate phone image and
  transparent-background variants. Fires on "update the images on our website", "the screenshots on the page are
  outdated", "make an image like this one", "feature image", "how it works image", "marketing screenshot", "hero image
  from the app", "mockup of our screens", "put our app in a picture", "social card", "OG image", "image with the UI
  floating", "transparent background version", "phone version of the image", and on a URL or screenshot of an
  existing composite to redo in the current UI. Any product: web app, mobile app, SaaS, website. NOT for video or
  animation (`motion-clip`), NOT for building or polishing the web page itself (`taste`, or `uiux` inside an app),
  NOT for plain screenshots inside a user guide (`user-manual`); a designed composite for that guide's landing page
  is this skill.
---

# Product still

A product still is a program, the same way a `motion-clip` film is: one HTML page places real screenshots, a headless browser photographs it at 2x, and any change is an edit plus a re-render. That keeps the pictures true (real pixels, never redrawn UI) and makes a whole series cheap to keep current when the product changes.

## 1. Decide the slot, the claim and the brand

**The slot** is the size the image fills and the width it is really shown at, since every legibility judgement depends on it. With an existing image, its pixel size is the canvas, and the page's column width (read it from the live page's CSS or DevTools) is the display width. With no page to measure, ask; failing an answer, use a common default and say so: a feature or step image at 4:3 (1448x1086) shown in a ~700 px column, a hero at 16:9, a social card at 1200x630, a phone image at about 780 px wide shown at 390. Store screenshots follow the store's sizes and rules (`motion-clip`'s 📖 `../motion-clip/references/store-presets.md` lists them).

**The claim** is the one sentence the caption makes. The image shows that claim and nothing else, and every number and state on screen must be one the product really reaches.

**The brand** comes from the product's own theme: its CSS variables or design tokens, a Flutter `ThemeData`, a brand page. Set `accent`, `ink`, `inkDeep` and `font` from it; a web font also needs an `@font-face` rule in the template's style block, or the render quietly falls back to the system font. The template's blue defaults are placeholders; shipping them for another brand reads as the wrong company.

For a series (six step images on one page), plan them together first: list each image's claim and the screen that shows it, and put the shared look (colours, font, glows, badge) in one `series.js` (`window.SERIES = { ... }`) that every image loads with a script tag above its `STILL` block, and delete those keys from each `STILL`, since keys left there override the series. A change to the look is then one edit.

## 2. Capture the real screens

Shoot at `deviceScaleFactor: 2`, with demo data, never a real customer's account. Pick the route by what the product has:

- **A Playwright suite with a demo seed or signed-in storage state**: a throwaway spec that reuses them, deleted afterwards (check `git status` before and after). The web traps (an old build served, dev overlays, fixture names that look fake) are in 📖 `../motion-clip/references/capture-web-ui.md`.
- **A web app with no suite**: a short Playwright script in the work folder (`npm i playwright && npx playwright install chromium`), signed in with a demo account the team provides.
- **A mobile app**: the golden-test or simulator routes in 📖 `../motion-clip/references/capture-real-ui.md`.
- **No demo data and no demo login**: stop and ask. Inventing data in the UI, or shooting a real account, is the one thing this skill must not do.

**Capture each card at the narrowest viewport its layout still reads well at.** The product's responsive layout packs a card tighter at 900 px than at 1440 px, so the same card fills the image with text about 1.7 times larger and nothing is redrawn. Phone images come from phone-width captures (about 430 px), where cards stack.

In the capture script, log each element you will crop with `locator.boundingBox()` multiplied by the scale factor: that is the card's `crop` rectangle in source pixels, and it saves guessing. The box is relative to the viewport, so take it with the page scrolled to the top (or add `window.scrollY`) when the shot is a full-page one, and check the first render against the shot. Look at every capture before composing: private data, half-faded toasts and placeholder names are fixed at the source.

## 3. Compose

Copy `templates/still.html` and `scripts/render.cjs` into a work folder outside the product repo, with the captures in `shots/`. Everything about one image lives in the `STILL` config at the top of `still.html`: canvas, colours, cards (source, crop, position, width, or `slices` to stack parts of one screen), numbered markers, connectors and the badge (`null` to drop it, or any SVG path as its icon). `templates/examples/how-it-works-step.html` and `how-it-works-step-phone.html` are a finished desktop and phone pair to read for spacing.

The composition rules come from published screenshot guidance (sources and the arithmetic in 📖 `references/composition.md`):

- **One idea per image, shown big.** Crop to the part the claim names. A whole window shrunk to fit is unreadable; a faded slice of it is fine as context behind the subject.
- **Lift the focal element instead of pointing at it.** Enlarge the one control or row that matters, with a shadow and a soft ring, breaking out of its frame. Arrows have to be followed; a lifted element is simply seen.
- **Number a sequence, connect it lightly.** Markers sit on a card's corner, outside its text. Connectors are short and end on a card's edge.
- **Judge text at the size it will be shown.** Shown px = CSS px in the app x canvas px per CSS px x (display width / canvas width). Aim for about 10 px for anything the claim is about.
- **The phone image is its own layout, not a shrunk desktop.** A portrait canvas, cards stacked full width from phone-width captures, markers on each card's top-left corner, at most one short connector between cards. Drop the faded context screen; there is no room for it. Use `slices` to skip a mobile layout's repeated buttons.

## 4. Render and look

```
node render.cjs still.html out/step@2x.png 1448 1086        # background from the config
node render.cjs still.html out/step-t@2x.png 1448 1086 1    # transparent
```

`PLAYWRIGHT_DIR` is any project root with Playwright installed (the work folder after `npm i playwright`, or the product repo). The script fails on a config error, a missing picture or a page that never finished building, warns on a card with no picture and on a canvas size that differs from the config, and waits for fonts.

Open every render. A transparent PNG shows its empty areas as black in many viewers, so judge it flattened onto white and onto a dark colour (`magick in.png -background white -flatten out.png`). Transparent renders drop the glows, so they look plainer than the white version by design. Keep every card's shadow inside the canvas, since a cut shadow reads as a hard line on the page. The template draws the badge's arc and arrowhead from one centre; reuse it rather than hand-placing an arrow.

## 5. Deliver

Put the finished files in one folder the user can open (on most setups `~/Downloads/<name>`), and open it: each image at the slot's size (JPG for an opaque background, PNG for transparent), a 2x copy, the old image for comparison, and the HTML with its `shots/` so the next change is a re-render. Say plainly that a phone image needs the page to serve a different picture on small screens (a page-builder mobile image or a `<picture>` element), which someone with site access sets up.
