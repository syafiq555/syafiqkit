# Design pass details

Detail behind the design-pass steps in `SKILL.md`. Each section is read at the moment its pointer in SKILL.md names, not before. Paths are relative to this file's folder (`references/`), as in the other reference files.

## Saved login (step 0)

Make one per account with `LOGIN_PASSWORD=… node ../scripts/save-login.mjs --url <login page> --email <login> --out <file>`, right before each batch (or take the file from the project's e2e setup). `check-render` then takes `--storage-state <file>`.

`impeccable detect` takes no saved login: behind one it reads the page through `--cdp` from a Chromium signed in with that file (steps: `../../impeccable/reference/critique.md` § Assessment B, the paragraph ending "close that browser afterwards"), because a source-file scan runs regex rules only.

## Laptop widths and clickthrough (step 4)

Why a shared header or nav also runs `--widths 1024,1366`: the default widths (320 to 1280) and `taste`'s gate (1440, 390) both skip laptop widths, where a desktop menu runs out of room. Every language's labels get their own run, since a longer one collides first. 25/11/2026: a shop menu overlapped its header button at 1024 to 1439 px in English while every default check passed.

Clickthrough: `node ../scripts/record-clickthrough.mjs <url> --steps steps.json` at a phone and a desktop width. Read its frame sheets for a control that greys, a label that flashes or a card that jumps after a click; no still capture shows those. The steps format is in `../scripts/README.md`.

## Showing on a phone (step 6)

A path or Markdown image sent to a user on a phone (Remote Control, the mobile app) renders as "Load Image", and tapping it asks to open a Mac path as a web link. The gallery pane is desktop-only. Send the pictures with `SendUserFile` (`display: render`). 22/11/2026: the user asked twice to see the shots.

## Reading an app's language (before the first edit)

- Read `frontend/CLAUDE.md` or a similar conventions doc. Docs name tokens and rules, but the answer is often a component already built for this job. If none exists, infer the language from sibling pages and shared components.
- A component reused in a new place brings its old audience: judge reuse by who reads it and what contains it, not by shared fields. Reuse the logic, rebuild the surface when either differs, and say so in the builder's brief (`design-incidents.md`, the staff-modal form).
- A new section must read as its siblings do on that page (same card, label and value pattern), so name the sibling in the brief.
- With no `Token lint:` line in any listed frontend `CLAUDE.md`: show the probe's raw-value counts, then ask once through `AskUserQuestion` whether to add a build-failing lint rule for raw values (ESLint, stylelint or oxlint, per the stack). Record the answer in that `CLAUDE.md` as `Token lint: added <date>` or `Token lint: declined <date>`, so the next session doesn't ask.

## Reading an app's language: the probe

`node scripts/probe-design-system.mjs <repo root>` lists the token sources, the shared components with how often each is used, the files carrying raw colours, arbitrary values and inline styles, and whether a token lint exists. The brief names the atoms it found that this surface must reuse.

## Finding the page (step 0)

Measuring needs a URL a browser can open: the project's served URL (its `CLAUDE.md`, a `Run locally:` line, `.env` `APP_URL`, a Herd `*.test` host), started if it isn't running. A signed-in screen needs a saved login (`--storage-state`), made per account right before each batch; `check-render` exits 2 on a sign-in page, and `impeccable detect` needs a `--cdp` route behind one. Record `Run locally:` and `Signed-in state:` lines in the frontend `CLAUDE.md`, beside `Token lint:`, so the next session doesn't rediscover them. An email or static page renders from its `.html` file.

## Detector commands (step 2)

Run on the before page: `../impeccable/scripts/impeccable detect <page>`, and `taste`'s review path. Inside an app that is `app-kit/scripts/inspect.mjs --app <page>` and `app-kit/scripts/lint.mjs --app <changed source files or folders>` (both live under `uiux`, not `../taste`; lint reads source, so a URL returns "Not found"). On a public page, `../taste/scripts/consistency.mjs <page> --profile <temp dir> --quick` and `../taste/scripts/copy-lint.mjs`. When the user said "design skills" (or "use all"), `impeccable`'s critique joins in the same pass: its `detect` output plus `Read` `../impeccable/reference/critique-rubric.md`, scored against the before page.

## Captures (step 4)

`scripts/check-render.mjs` captures 320, 375, 768 and 1280 px in each colour scheme and measures what a model reading a screenshot keeps missing; its check table, with each level, is in `scripts/README.md`. Captures go to a temp folder unless `--out` names one.

## Shop storefront home (step routing)

A shop's own storefront home (a marketplace or grocery home of product rails, deals and grids) is a shop screen, not a marketing page. `taste`'s page rules (one section per screen, the hero alone on the first screen) would strip what makes it a shop. Deal its directions as rendered prototypes from captured live shops, borrowing `taste`'s `photos.mjs` (licensed stand-ins) and `shoot.mjs` (captures).

## Rendering tools over text mockups

Claude Design's tools (`mcp__claude-design__*`), artifacts or a dev-server page show type, weight, spacing and colour; box-drawing shows none of it, and the ASCII fallback happens silently. Use one where stakes are highest (page redesign, new visual direction, brand or palette), usually one `ToolSearch` away. Reserve text mockups for layout order and hierarchy.

## New look: the deal

Palette, type and layout language come from a script: `app-kit/scripts/draw.mjs --app` for screens inside an app (sheet: `app-kit/references/app-screens.md`), `taste`'s own deal for a public page. A deal that returns the style the app already uses is redealt (`draw.mjs` with another `--kind`). It is shown as two or three real screens beside today's, for the user to pick or reject.
