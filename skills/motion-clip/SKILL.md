---
name: motion-clip
description: >
  Make a short designed video for any product or brand (a launch clip, promo reel, feature teaser or walkthrough, release announcement, app store preview, explainer, client demo, website or SaaS promo, product showcase from photos, brand intro or social reel) by having Claude write the film as code, render it frame by frame, and ship MP4s in vertical, square and widescreen with an original music bed. Fires on "make a launch clip", "promo video", "product video", "explainer video", "motion graphics", "reel for Instagram/TikTok", "animate the new feature", "video for the release", "demo video for the client", "video for our website", "product ad", "teaser", "trailer", "animate my logo", "logo animation", "video from these photos", "showcase video", "brand video", "add music to the video". Shows real pixels (screens captured from the product itself, real photos, the real logo), never redrawn UI. NOT for screen recordings of test runs or "record the e2e flows" (that is `setup-playwright`), NOT for a still image made from the screens (`product-still`), NOT for a photo carousel or slide post (`carousel-builder`), NOT for still marketing pages (`uiux`), and NOT for a user guide with screenshots (`user-manual`).
---

# Motion clip

A clip is a program, not a recording: one function draws the exact frame for any time `t`, a headless browser photographs each frame, and ffmpeg joins them. Render any single moment, look at it, fix it, re-render. Quality comes from the harness and the review loop, not the prompt.

The engine needs only pictures and a story. Three frames cover most films:

| Frame | For | Pictures |
|---|---|---|
| `phone` | iOS, Android, mobile web | Screens at 1170x2532 (390x844 at 3x) |
| `browser` | Web apps, SaaS, websites | Screens at 2880x1800 (1440x900 at 2x) |
| `none` | Physical products, places, brand imagery, slides | Photos or images; each is cropped to fill the story's `shot` size |

A personal film (anniversary, birthday, family) is `none` with full-frame `photos`: 📖 `references/premium-motion.md#photo-film` before writing the story, for overlapping the photos and fitting landscape ones into 9:16. A film with no pictures at all (a logo animation, a type-only teaser) leaves out `screens` and runs on the hook, a stat and the lockup.

What it does not do: character animation, scrolling a long page (capture viewport shots at several offsets and push between them), or long-form teaching videos. An app not yet built is filmed from the team's design exports, labelled as a preview in the brief, never from UI Claude draws. Name the missing part rather than improvising.

## 0. Check the tools

Confirm `node -v`, `ffmpeg -version`, `python3 -c "import numpy"`, and a folder where `playwright` resolves with Chromium. If none, run `npm i playwright && npx playwright install chromium` in a scratch folder (downloads Chromium), then point `PLAYWRIGHT_DIR` at it.

A voice-over, spoken captions or a depth background need the local tools: `sh scripts/setup-local.sh voice captions depth`, naming only the parts the brief needs (about 1.5 GB plus models: check free disk). It prints the Python path, `PY` below. 📖 `references/voice-captions-backgrounds.md`.

## 1. Brief before pixels

Make a clip folder outside any product repo with `docs/brief.md`: who is watching, the one idea to leave with, the feeling, visual rules (brand colours, fonts, what's banned, and any opening or closing card the user's own instructions require on files sent outside the team, which then go in the story table as beats rather than as options), a timed story table, and an "open" list. Twenty seconds is about five beats: a hook in a few large words, the product by 3 s, two or three real actions or images of what it does, one number, then logo and call to action.

Every claim on screen must be true. The number beat is the trap: a session wants a metric and invents one. Use a citable fact (a limit in the code, a figure on the product's site, a number someone gives you) and write its source in the brief. Never invent a metric: drop the number beat without one. A claim must stay true while the clip circulates: "coming soon" or a date forces a re-render once it passes. Write the call to action as it will read after launch ("on iOS and Android"); a dated line needs a stale-date note in the brief.

The five beats are a starting shape; followed blindly they make every film look the same. Ask whether the film could belong to another company with the logo swapped; a hook, caption or number that fits any product is filler, to be replaced with something only this product can say or show. Write the answer as one line in the brief, so the next session can see it was asked. Who is watching sets the voice: a showcase speaks from its user's side, even when the client paid for it; lines addressing the client as approver ("as you asked") read as a sign-off checklist (📖 `references/review-lenses.md#brand`). That holds for family films too: the owner's name stays off screen. Captions in a local language use the words its people post, not its formal register (📖 `references/review-lenses.md#brand`).

**Research before the story.** An agent fetches a URL per claim on how strong teams make this kind of film; without web access, it uses examples it knows and says so. The brief notes what it borrowed. A room-presented film (pitch, tender, keynote) uses full-frame `photos`, not a device beside captions: 📖 `references/premium-motion.md#room-presentation`. So does a client walkthrough of a web app watched on a phone, with its capture widths (📖 `references/premium-motion.md#walkthrough`).

**A store listing clip** follows the store's rules from the brief on, not a social clip's (📖 `references/store-presets.md`): check and render it with `PRESET=app-store` or `google-play` on `check` and `video`.

## 2. Write the story

Copy `templates/film.html`, `templates/story.js`, `scripts/render.mjs`, `scripts/score.py`, `../_shared/scripts/review-page.mjs` (and whichever of `voice.mjs`, `kokoro_tts.py`, `words.py`, `image.mjs`, `depth.py` the brief needs) into the clip folder, with `assets/` beside them. Copy pictures in (📖 `references/review-lenses.md#render-pitfalls`: the server serves only the clip folder).

`film.html` is the engine and is not edited per film. Everything about one film lives in `story.js`: frame, colours, fonts (a `file` per brand font, or none for a system font), logo, picture size, when each picture shows and how it enters (`via: 'push'` or `'fade'`), taps, camera keyframes, captions, an optional number scene and the closing lockup. The starter is a 15-second browser film with placeholder words; `templates/examples/autorentic.story.js` is a finished 20-second phone film for timing and camera work. An uncaptured picture draws as a "missing" card, so the story can be blocked out first. A story built by code wraps itself in `(() => { ... })()`, or its top-level `const` clashes with the engine's (📖 `references/review-lenses.md#render-pitfalls`).

The engine already holds what took iteration to get right:

- **Time is the only input.** Every value comes from `t`; no timers, no state carried between frames, no unseeded random. Frame 300 renders the same alone as in sequence.
- **Springs, not easing curves.** Closed-form springs (`snappy`, `smooth`, `playful`) give weight. Text slides up inside a mask, never fades in.
- **A camera that pushes into the picture.** Zoom to the part the caption is about; a whole screen shown small leaves its UI unreadable on a phone (📖 `references/premium-motion.md#camera-size`).
- **One timeline, three layouts.** The layout is computed from the frame size, so 9:16, 1:1 and 16:9 are re-composed, not cropped; side-by-side layouts take smaller captions and less zoom, or the text runs into the picture (📖 `references/premium-motion.md#camera-size`). `check` warns when a caption shrinks below 80%: split that row into shorter ones (📖 `references/premium-motion.md#camera-size`).

Two scenes carry the number beat, `stat` and `number`; their shapes and examples are in 📖 `references/premium-motion.md#number-examples`.

`backdrops` fill the frame behind everything with a slow push-in; `depth: true` needs a map from `$PY depth.py <picture>`. Keys in 📖 `references/voice-captions-backgrounds.md#backdrops`.

When a device beside captions reads as basic, the engine has more: `spotlights`, `cursor`, `tilt`, `motionBlur`, `ambient`, `softText`, `photos`, `products`. 📖 `references/premium-motion.md` before using them: which help a viewer follow the screen and which only decorate.

`screens`, `number`, `stat`, `success`, `taps`, `music`, `voice`, `subtitles`, `backdrops` and `lockup` are optional; a film without `lockup` ends with no logo, which the brief should mean on purpose. Before/after films count effort with `counters: [{ from, to, label, color }]` (📖 `references/premium-motion.md#counters`), and the logo blend is set per page colour (📖 `references/premium-motion.md#logo-blend`, with `logoBlend: 'source-over'` for a dark page).

**Frame 0 is the thumbnail.** WhatsApp, Chat and most feeds show the first frame before anyone presses play, so a hook that reveals from a blank page shares as an empty square (18/11/2026: a client's launch clip went round WhatsApp looking blank). Give the first hook line an `in` below 0 so it is complete at t = 0. `check` warns when frame 0 is one flat colour. A client's logo above the hook, a studio's credit and its end card are in 📖 `references/premium-motion.md#studio-credit`.

Run one stills render after copying to catch a missing logo, font or backdrop (📖 `references/review-lenses.md#render-pitfalls`). Take the times from your own beats, and clear `out/stills` between rounds or old frames mix into the sheet. The `x` argument, `STORY=<path>` and watching while writing: 📖 `references/review-lenses.md#render-pitfalls`.

```
node render.mjs stills 1080 1920 x 1.4 4.5 8.5 12.5 16.6 19.9
```

Pass the still times literally: in zsh a `$TIMES` variable is not split into words, and every still comes out as `NaN`.

With a voice-over, make it right after the first story draft (steps in §4, Voice-over), and time captions and scenes to the spoken lines before the contact sheet (📖 `references/voice-captions-backgrounds.md#voice-timing`).

Block the story out before capturing: run `node render.mjs board 1080 1920` (a timed table of every beat, caption, voice line and sourced number, in `out/storyboard.md`), paste it into your reply and get the user's yes. Each change costs a full re-render, so settle the story here.

## 3. Gather the real pictures

Collect the pictures into `assets/screens/<name>.png` (or give any path as a screen's `file`), with demo data rather than a real customer's account.

- **Flutter app**: a throwaway widget test with goldens; boxed fonts, a DEBUG ribbon or a missing icon font all pass silently (📖 `references/capture-real-ui.md`). Simulator screenshots signed in as a team demo account also work.
- **Web app or website**: Playwright screenshots at the frame's viewport and `deviceScaleFactor` (table above), signed in via the suite's storageState and seeded demo user (`setup-playwright`). Fix an old build, dev overlays or fake-reading fixture names before shooting: 📖 `references/capture-web-ui.md` has the checks and how to record tap points from real buttons.
- **A screen recording** (a phone or desktop capture of the real flow): crop the device's status bar off before use, since it carries a recording pill and the real clock (📖 `references/capture-real-ui.md#screen-recording`).
- **Products, places, brands**: photos and logos from the brand kit, shop listing or the user. Ask for them rather than generating them.
- **Mood backgrounds** (a city at night) behind the hook or lockup, never the product, its UI, or people shown as its customers: free stock (Pexels), or `node image.mjs` (📖 `references/voice-captions-backgrounds.md#images`, with its allowance and fallback). The prompt goes to Cloudflare; ask before sending unreleased product names. For depth motion, run `$PY depth.py` on the picture now.

Capturing into the product repo: check `git status` first and remove only what you added afterwards (📖 `references/capture-web-ui.md`). Look at a sheet of every picture: fake-reading demo data (`INV-1`) is fixed at the source. Check the same sheet for private data (real emails and phone numbers, keys and tokens, notifications, other tabs and bookmarks) and hide it or reshoot; a video gets shared further than a screenshot.

## 4. Music and sound

`score.py` composes an original numpy bed (pad, bass, plucks, kick, hats) and places taps, whooshes and chimes on the story's cues (`window.cues`), so nothing needs licensing and retiming a scene moves its sound with it:

```
node render.mjs cues 1080 1920 cues.json
node voice.mjs cues.json        # only for a story with voice lines, see below
python3 score.py cues.json score_raw.wav
ffmpeg -i score_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -y score.wav
node render.mjs check 1080 1920
```

This `check` also measures `score.wav`'s loudness; a `score.wav` left from an earlier round is measured as if current, so regenerate it each time.

Run it with plain `python3`, not `python3 -I`: isolated mode drops the user site-packages where numpy lives. `music.mood` (`bright`, `calm` or `dark`) matches the brief's feeling (📖 `references/real-track.md#generated-bed`).
**A real track** gives a genuinely different sound. Check licence and Content ID before the user downloads it (📖 `references/real-track.md`, which also covers the drop cut and the README entry).

You cannot hear the result. Check what you can (a waveform showing the beat starting where the film says, the loudness figure, no clipping) and say the sound still needs a human ear.

**Voice-over (only when the brief asks).** The story's `voice` lines, their `say` spellings, the three commands and the provider rules are in 📖 `references/voice-captions-backgrounds.md#voice-over`. Pass the same `VOICE_SPEED` on every run, since one run without it silently re-records every line at speed 1. A paid voice runs only with `VOICE_PROVIDER` set, never from a key alone, and only after the user agrees to send the script there. With subtitles on, headline captions differ from the spoken words (📖 `#subtitles` there).
`check` fails while a voice line has no file, and `score.py` stops on one, so a skipped step can't ship a silent film.

## 5. Review and render

Start with the automatic check, once per size you will deliver:

```
node render.mjs check 1080 1920
```

It fails, with the times named, on any frame that depends on more than `t`, and on 2 s or more where nothing moves; its other warnings and the exit code are in 📖 `references/review-lenses.md#check-warnings`. A pass says the film is consistent, not good; the sheet judges that.

**A film for TikTok, Reels or Shorts is checked with that platform's preset** (`PRESET=tiktok`, `instagram-reels` or `youtube-shorts` on `check` and `review`), which fails any text under the app's own caption, tabs or buttons, naming the line, time and band. Fix it in the story (`subtitles: { y }`, a caption's position), never by dropping the preset. The starter fails `PRESET=tiktok` as shipped, so its hook, captions and subtitles move inside the bands from the first draft (📖 `references/review-lenses.md#check-warnings`, which also says what the freed bottom third holds).

Then render one still per beat and tile them into a contact sheet:

```
ffmpeg -pattern_type glob -i 'out/stills/1080x1920_*.png' -vf "scale=270:-1,tile=6x2:padding=8" -frames:v 1 out/contact_9x16.png
```

One sheet per size (change `1080x1920` in the glob): frames of different shapes distort when tiled, and a clean vertical cut says nothing about the square one. Review the sheets four times, one lens per pass (parallel agents where you can spawn them): design, readability, pacing, brand (📖 `references/review-lenses.md` has each lens's questions). Merge, fix the worst three problems and re-render the sheet. A builder agent cannot spawn the lens agents, so its own look at the sheet is not this review: it reports the sheet paths, and the dispatching session runs the four lenses (with `impeccable` critique and `emil-review-animations` on the story; 📖 `references/review-lenses.md` intro). **Tell: you are about to show a film whose only review was the agent that made it.**

Once pictures, voice and a first `score.wav` exist (§4), send the draft and the review page together, and get a yes before the full renders.

```
node render.mjs draft 1080 1920                     # half size, with sound and a time stamp per frame
PRESET=tiktok node render.mjs review 1080 1920      # after check; same PRESET as check, or none
```

The review page (`out/review_1080x1920.html`) is what the user or client sees, separate from the four lenses, which are your own review. Its contents are in 📖 `references/review-lenses.md#check-warnings`; its "Copy change list" button turns the reviewer's notes into a numbered list to paste back. Why it helps an approver: `references/review-lenses.md#approval-gates`.

Then render the videos (1.5 to 3 minutes each for 20 s; run them in the background, plugged in, each command prefixed with `caffeinate -dims` so neither the display nor the system idles mid-render):

| Format | Size | Command |
|---|---|---|
| Vertical (Reels, TikTok, Shorts) | 1080x1920 | `node render.mjs video 1080 1920 out/clip_9x16.mp4` |
| Square (feed) | 1080x1080 | `node render.mjs video 1080 1080 out/clip_1x1.mp4` |
| Widescreen (YouTube, decks, websites) | 1920x1080 | `node render.mjs video 1920 1080 out/clip_16x9.mp4` |
| App Store preview | 886x1920 | `PRESET=app-store node render.mjs video 886 1920 out/clip_appstore.mp4` |

Length comes from the story's `duration`. A render dying on a negative `locator.screenshot` timeout or 30-second canvas timeouts was laptop sleep or Low Power Mode (📖 `references/review-lenses.md#render-pitfalls`). Chain a mux after a render with `&&`, never `;` or a pipe into `tail`: either hides the failure and muxes a half-second file. A background run only reports that it exited, so `ffprobe` it for size and frame count, and pull the 12-frame motion strip around the fastest action for jumps (📖 `references/review-lenses.md#render-pitfalls`).

Mux the score into each finished video, using the `score.wav` from §4:

```
for f in 9x16 1x1 16x9; do ffmpeg -i out/clip_$f.mp4 -i score.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ac 2 -ar 48000 -shortest out/clip_${f}_music.mp4; done
```

Then run `node render.mjs verify 1080 1920 out/clip_9x16_music.mp4` on each muxed file. It reads the finished video, not the story, so what fails and what warns is in 📖 `references/review-lenses.md#check-warnings`. It measures; a person still has to listen.

## 6. Deliver

Send the MP4s and the contact sheet, keep the silent versions beside the ones with music, and make a share copy of each one under 30 MB, since the file-send tool refuses anything over 30 MiB (📖 `references/deliver.md#share-copy` for the encode command). Then write a clip-folder README with the capture and render commands (with a voice: provider, voice and model, never the key). List what needs a person: the call to action, the music if the generated one isn't good enough, a listen to the voice, any generated background, and any demo names marketing wants changed.
