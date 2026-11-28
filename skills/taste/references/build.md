# Build

The build detail of run step 5 in `SKILL.md`, after the head block and nav class are set in `starter.html`; `SKILL.md` points here. Open it before writing the first section.

- Copy only the `<section class="hero …" data-enter>` of `assets/layout/hero-<id>.html` (never its nav, other sections, footer or credit line; every word and picture becomes the client's). Move the dealt close and footer out of their `<template>`s and delete the rest.
- Every section is `main > section` with one `.wrap`, its h2 first, `--h: 1` or `2`. Build each to its recipe with the system's classes and tokens; page CSS only where a reference says so (inside a visual, `--p-h`, `.wall`, `.rail`, `.device`).
- Paste UI from `assets/ui/<name>/fragment.html`, rewriting every name, number and logo to the client's (kit icons become `data-icon`, `cards.md`). A diagram card is `data-diagram="<preset>"` with the client's labels.
- Run `icons.mjs scan index.html --out assets/icons --colour` last, so every icon the page names is a local file.
- Mount an effect, object, moment or scene exactly as its reference says, never from your own script. A moment's section is copied from `assets/moments/_demo/in-page.html` (place: photo-chapters, word-highlight) or `in-page-service.html` (pinned-chapters, picture-develops film); a moment's own `demo.html` is not a page model.
- A form is the starter's `booking-form` (`system.md`, Forms).
- Credits: the one footer line from `photos.mjs credits`, once the markup uses the photographs (it reads the page). Copy the hero's tile from `shoot.mjs` beside the page as `share.jpg`.
