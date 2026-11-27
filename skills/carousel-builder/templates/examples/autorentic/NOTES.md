# Autorentic series (worked example)

Where it came from: the week 2 TikTok previews (Nov 2026), built in `~/Autorentic TikTok/week2/` with `base.mjs` and `TT-W2-02/build.mjs`. This port renders TT-W2-02 pixel-identical to those JPEGs (ImageMagick `compare -metric AE`: 0 on all 7 slides, 27/11/2026).

It fails one check, kept so the port matches what was previewed and missed by the score loop's hand measurement: the slide counter (`--brand-700` on `--brand-100`) is 4.40:1 against the 4.5:1 its size needs; `color:var(--brand-800)` on `.count` fixes it.

The pixel match was against the old `tiktok` bands (top 150, bottom 350). Under TikTok's own template, adopted 27/11/2026, the base layout moves the body in from the edges, so a build today no longer matches the previewed JPEGs, and slide 7's "Link di profil" pill sits in the bottom 660 px. The week 2 posts themselves, built with the older `base.mjs`, fail on every slide (text at x 60, under the left 120 px, and lines below y 1260).

The folder ships without `logo.png` and the screenshots each post's `build.mjs` names, so a build here reports "image did not load" until you copy them in from the week 2 folder (the same before and after the preset change).

- `brand.css`: tokens copied from the app's `resources/js/constants/themes` (palette and typography) on 27/11/2026. The app palette has moved since; re-copy before a new series rather than trusting these.
- `rules.json`: banned on screen: "wajib" (the website says an agreement "should have" items, so "wajib" reads as a legal requirement; use "penting"), "setiap 1hb" (real billing day is each tenancy's start day; say "setiap bulan"), "recorded by" (payment slides say "how it was paid", never "recorded by DuitNow, FPX or card").
- Copy rules that a word list can't hold: "free" always appears with "up to 10 tenants" (except "free calculator"); no demo count shows more than 10 tenants; demo figures carry "Data demo"; viewers are "korang"; CTA "Link di profil"; Malaysian Malay, never Indonesian words.
- Voice: the builder makes no audio. For the films beside these slides the voice is English Kokoro `af_heart` with Malay on-screen text (task doc, 27/11/2026). The week 2 `SCORE-LOOP.md` settled list still names Microsoft's ms-MY-YasminNeural; that line is out of date.
- Screens come from the repo's `MarketingDemoSeeder` (Rimba Homes), captured at 390 px wide, `deviceScaleFactor: 3`, with the What's New modal dismissed and the dev pill hidden (see the week 1 `capture/capture.mjs`).
