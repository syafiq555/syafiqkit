---
name: motion-clip
description: >
  Make a short designed video for any product or brand (a launch clip, promo reel, feature teaser or walkthrough, release announcement, app store preview, explainer, client demo, website or SaaS promo, product showcase from photos, brand intro or social reel) by having Claude write the film as code, render it frame by frame, and ship MP4s in vertical, square and widescreen with an original music bed. Fires on "make a launch clip", "promo video", "product video", "explainer video", "motion graphics", "reel for Instagram/TikTok", "animate the new feature", "video for the release", "demo video for the client", "video for our website", "product ad", "teaser", "trailer", "animate my logo", "logo animation", "video from these photos", "showcase video", "brand video", "add music to the video". Shows real pixels (screens captured from the product itself, real photos, the real logo), never redrawn UI. NOT for screen recordings of test runs or "record the e2e flows" (that is `setup-playwright`), NOT for still marketing pages (`uiux`), and NOT for a user guide with screenshots (`user-manual`).
---

# Motion clip

A clip is a program, not a recording: one function draws the exact frame for any time `t`, a headless browser photographs each frame, and ffmpeg joins them. That shape makes the work inspectable: render any single moment, look at it, fix it, re-render. Quality comes from the harness and the review loop, not the prompt.

It works for any product, because the engine only needs pictures and a story. Three frames cover most of what gets filmed:

| Frame | For | Pictures |
|---|---|---|
| `phone` | iOS, Android, mobile web | Screens at 1170x2532 (390x844 at 3x) |
| `browser` | Web apps, SaaS, websites | Screens at 2880x1800 (1440x900 at 2x) |
| `none` | Physical products, places, brand imagery, slides | Photos or images; each is cropped to fill the story's `shot` size |

A film with no pictures at all (a logo animation, a type-only teaser) leaves out `screens` and runs on the hook, a stat and the lockup.

What it does not do: voiceover, character animation, scrolling through a long page (capture several viewport shots at different scroll offsets and push between them instead), or long-form teaching videos. An app that isn't built yet is filmed from the team's own design exports, labelled as a preview in the brief, never from UI Claude draws. Where the request needs something outside this, say which part is missing rather than improvising.

## 0. Check the tools

Confirm before writing anything: `node -v`, `ffmpeg -version`, `python3 -c "import numpy"`, and a folder where `playwright` resolves with Chromium installed. Where none exists, make one: `npm i playwright && npx playwright install chromium` in a scratch folder (the first install downloads Chromium), then point `PLAYWRIGHT_DIR` at it. A tool missing halfway through a render costs more than this check.

## 1. Brief before pixels

Make a folder for the clip outside any product repo, and write `docs/brief.md` there: the one idea a viewer should leave with, the feeling, the visual rules (brand colours, fonts, what's banned), a timed story table, and an "open" list. Twenty seconds is about five beats: a hook in a few large words, the product appearing, two or three things it does shown as real actions or real images, one number, then the logo and call to action.

Every claim on screen has to be true. The number beat is the trap: a session wants a metric and invents one. Use a fact you can cite (a limit in the code, a figure on the product's own site, a number someone gives you) and write its source in the brief. A launch date or offer the team hasn't fixed goes in as a marked placeholder.

## 2. Gather the real pictures

Collect the pictures into `assets/screens/<name>.png` (or give any path as a screen's `file`), with demo data rather than a real customer's account.

- **Flutter app**: a throwaway widget test with goldens. Tests draw every font as boxes until you load them, the debug ribbon shows unless you turn it off, and the icon font lives in the pub cache. 📖 `references/capture-real-ui.md` has the working test. With no network stubs to lean on, simulator screenshots signed in as a demo account the team provides work too.
- **Web app or website**: Playwright screenshots at the frame's viewport and `deviceScaleFactor` (table above), signed in through the suite's existing storageState and seeded demo user where there is one (`setup-playwright` covers both).
- **Products, places, brands**: photos and logos from the brand kit, shop listing or the user. Ask for them rather than generating them.

Where capturing means adding a file to the product repo, check its `git status` first and afterwards remove only what you added; keep a copy of the capture script in the clip folder so the pictures can be re-taken after the product changes. Look at a sheet of every picture before going on; demo data that reads as fake (`INV-1`) is fixed at the source, not in the video.

## 3. Write the story

Copy `templates/film.html`, `templates/story.js`, `scripts/render.mjs` and `scripts/score.py` into the clip folder, with `assets/` beside them. Every path the renderer reads or writes is relative to the folder `render.mjs` sits in, not the shell's.

`film.html` is the engine and is not edited per film. Everything about one film lives in `story.js`: frame, colours, fonts (a `file` per font to load the brand's own, or none for a system font), logo, picture size, which picture shows when and how it enters (`via: 'push'` slides, `'fade'` dissolves), taps or clicks, camera keyframes, captions, an optional number scene and the closing lockup. The starter `story.js` is a 15-second browser film with placeholder words; `templates/examples/autorentic.story.js` is a finished 20-second phone film to read for timing and camera work. A picture that hasn't been captured yet draws as a "missing" card, so the story can be blocked out before the pictures exist.

The engine already holds what took iteration to get right:

- **Time is the only input.** Every value comes from `t`; no timers, no state carried between frames, no unseeded random. Frame 300 renders the same alone as in sequence.
- **Springs, not easing curves.** Closed-form springs (`snappy`, `smooth`, `playful`) give motion weight. Text enters by sliding up inside a mask, never by fading in.
- **A camera that pushes into the picture.** A whole screen shown at two-thirds of a 9:16 frame leaves its UI unreadable on a real phone, and a desktop screenshot in a vertical frame is smaller still; zoom to the part the caption is about.
- **One timeline, three layouts.** The layout is computed from the frame size, so 9:16, 1:1 and 16:9 are re-composed, not cropped. Side-by-side layouts use smaller captions and less camera zoom (a quarter for `phone`, 60% for the wider frames), or the text runs into the picture; a browser shot in widescreen still needs a strong push-in for its UI text to read. Text too long for its space shrinks to fit rather than running off the frame. A 4:5 frame falls on the side-by-side side of the split; check it with a still before promising one.

Two scenes carry the number beat. `stat` counts up to a figure with a label and an optional source line (`{ at, out, value, prefix, suffix, label, source }`), for "99.9%" or "3x faster". `number` drops cards that merge into one pill, for a "many become one" fact: twenty bills into one payment, twelve tools into one app. With no citable number, drop the beat rather than inventing one. `screens`, `number`, `stat`, `success`, `taps`, `music` and `lockup` are all optional; a film without `lockup` ends with no logo, which the brief should mean on purpose. The logo is blended with `multiply`, which suits a logo on white; on a dark page set `logoBlend: 'source-over'` and use a transparent PNG.

Run one stills render straight after copying, to catch a missing file before anything else. The renderer serves the folder over local HTTP (fonts loaded from `file://` are unreliable) and logs any file it could not load. The fourth argument is the output path, which stills ignore, hence the `x`; the times are examples, so take them from your own story's beats, and clear `out/stills` between rounds or old frames mix into the sheet. Set `STORY=<path>` to render a story file other than `story.js`. To watch the film while writing it, serve the clip folder (`python3 -m http.server` in it) and open `film.html?story=story.js&w=1080&h=1920`: in an ordinary browser it plays on a loop, and when the story or a font can't load it says why on the page (a missing picture shows as a "missing" card instead). Opened straight from disk, brand fonts may not load, so serve the folder.

```
node render.mjs stills 1080 1920 x 1.4 4.5 8.5 12.5 16.6 19.9
```

| Format | Size | Command |
|---|---|---|
| Vertical (Reels, TikTok, Shorts) | 1080x1920 | `node render.mjs video 1080 1920 out/clip_9x16.mp4` |
| Square (feed) | 1080x1080 | `node render.mjs video 1080 1080 out/clip_1x1.mp4` |
| Widescreen (YouTube, decks, websites) | 1920x1080 | `node render.mjs video 1920 1080 out/clip_16x9.mp4` |

The video length comes from the story's `duration`. Pass the still times literally: in zsh a `$TIMES` variable is not split into words, and every still comes out as `NaN`.

## 4. Review your own frames

Before any full render, render one still per beat and tile them into a contact sheet:

```
ffmpeg -pattern_type glob -i 'out/stills/1080x1920_*.png' -vf "scale=270:-1,tile=6x2:padding=8" -frames:v 1 out/contact_9x16.png
```

Make one sheet per size (change `1080x1920` in the glob), since frames of different shapes distort when tiled together, and because each layout fails in its own way: a clean vertical cut says nothing about the square one. Judge it like a harsh motion director: is the hook readable in the first two seconds, is text inside the pictures legible at the size viewers will watch, does something new happen every two to four seconds, do captions and pictures collide, is the brand right. Fix the worst three problems and re-render the sheet.
Then render the videos (about a minute each for 20 seconds at 30 fps; run them in the background). A background run tells you only that it exited, not that the video is right, so before calling one done, `ffprobe` it for the right size and frame count, and pull a 12-frame strip around the fastest action to check for jumps.

## 5. Music and sound

`score.py` composes an original bed in numpy (pad, bass, plucks, kick, hats) and places taps, whooshes and chimes on the film's cues, so nothing needs licensing. The cues come from the story itself (`window.cues`), so retiming a scene moves its sound with it:

```
node render.mjs cues 1080 1920 cues.json
python3 score.py cues.json score_raw.wav
ffmpeg -i score_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -y score.wav
for f in 9x16 1x1 16x9; do ffmpeg -i out/clip_$f.mp4 -i score.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest out/clip_${f}_music.mp4; done
```

Run it with plain `python3`, not `python3 -I`: isolated mode drops the user site-packages where numpy usually lives. The bed runs at the story's `music.bpm` (120 by default, so 0.5 s per beat), and `music.mood` picks its character: `bright` (default, upbeat), `calm` (half-time kick, no clap) or `dark` (minor chords), matched to the feeling in the brief. A bought track at the same tempo can replace `score.wav` later.

You cannot hear the result. Check what you can (a waveform image showing the beat starting where the film says, the loudness figure, no clipping) and say plainly that the sound itself still needs a human ear.

## 6. Deliver

Send the MP4s and the contact sheet, keep the silent versions beside the ones with music, and write a README in the clip folder with the capture and render commands. Close by listing what needs a person: the call to action, the music if the generated one isn't good enough, voiceover, and any demo names marketing wants changed.
