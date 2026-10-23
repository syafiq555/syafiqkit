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

What it does not do: character animation, scrolling through a long page (capture several viewport shots at different scroll offsets and push between them instead), or long-form teaching videos. An app that isn't built yet is filmed from the team's own design exports, labelled as a preview in the brief, never from UI Claude draws. Where the request needs something outside this, say which part is missing rather than improvising.

## 0. Check the tools

Confirm before writing anything: `node -v`, `ffmpeg -version`, `python3 -c "import numpy"`, and a folder where `playwright` resolves with Chromium installed. Where none exists, make one: `npm i playwright && npx playwright install chromium` in a scratch folder (the first install downloads Chromium), then point `PLAYWRIGHT_DIR` at it.

A voice-over, spoken-word captions or a depth background need the free local tools: `sh scripts/setup-local.sh voice captions depth`, naming only the parts the brief needs (about 1.5 GB plus models: check free disk). It prints the Python path, `PY` below. 📖 `references/voice-captions-backgrounds.md`.

## 1. Brief before pixels

Make a folder for the clip outside any product repo, and write `docs/brief.md` there: the one idea a viewer should leave with, the feeling, the visual rules (brand colours, fonts, what's banned), a timed story table, and an "open" list. Twenty seconds is about five beats: a hook in a few large words, the product appearing by 3 s, two or three things it does shown as real actions or real images, one number, then the logo and call to action.

Every claim on screen has to be true. The number beat is the trap: a session wants a metric and invents one. Use a fact you can cite (a limit in the code, a figure on the product's own site, a number someone gives you) and write its source in the brief. A claim must stay true while the clip circulates, not just on render day: "coming soon", a date or a time-limited offer forces a re-render once it passes. Write the call to action as it will read after launch ("on iOS and Android", the product's address); if the team wants a dated line, note in the brief when it goes stale.

The five beats are a starting shape; followed blindly they make every film look the same. Before writing the story, ask whether this film could belong to another company with the logo swapped. A hook, caption or number that would fit any product is filler: replace it with something only this product can say or show. Write the answer as one line in the brief, so the next session can see it was asked.

**Two approvals before the expensive render.** Each change to a finished film costs a full re-render; these two gates took Lago from about twelve feedback rounds to one. Block the story out before capturing (§3; uncaptured pictures draw as "missing" cards), run `node render.mjs board 1080 1920` (a timed table of every beat, caption, voice line and sourced number, in `out/storyboard.md`), paste it into your reply and get the user's yes. Once pictures, voice and a first `score.wav` exist (§5), send `node render.mjs draft 1080 1920` (half size, with sound and a time stamp per frame) and get a yes before §4's full renders.

**A store listing clip** follows the store's rules from the brief on (Apple: 15 to 30 s of the app's own screens, no backdrops, prices or dates, the product on screen at 5 s; Google Play: the app inside 10 s): set `PRESET=app-store` or `google-play` on `check` and `video`. 📖 `references/store-presets.md`.

## 2. Gather the real pictures

Collect the pictures into `assets/screens/<name>.png` (or give any path as a screen's `file`), with demo data rather than a real customer's account.

- **Flutter app**: a throwaway widget test with goldens. Tests draw every font as boxes until you load them, the debug ribbon shows unless you turn it off, and the icon font lives in the pub cache. 📖 `references/capture-real-ui.md` has the working test. With no network stubs to lean on, simulator screenshots signed in as a demo account the team provides work too.
- **Web app or website**: Playwright screenshots at the frame's viewport and `deviceScaleFactor` (table above), signed in through the suite's existing storageState and seeded demo user where there is one (`setup-playwright` covers both). A local site with no dev server running can serve an old build, dev-only overlays show in every shot, and fixture names read as fake. 📖 `references/capture-web-ui.md` has the checks, and how to record tap points from the real buttons.
- **Products, places, brands**: photos and logos from the brand kit, shop listing or the user. Ask for them rather than generating them.
- **Mood backgrounds** (a city at night) behind the hook or lockup, never the product, its UI, or people shown as its customers: free stock (Pexels) or `node image.mjs assets/screens/bg_city.png "<prompt>" 1080 1920` on Cloudflare's free daily allowance (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`; without them, or with the day's allowance spent, use stock and say so). The prompt goes to Cloudflare, so ask before sending unreleased product names. For depth motion, run `$PY depth.py` on the picture now. Say in the README which pictures are generated.

Where capturing means adding a file to the product repo, check its `git status` first and afterwards remove only what you added; keep a copy of the capture script in the clip folder so the pictures can be re-taken after the product changes. Look at a sheet of every picture before going on; demo data that reads as fake (`INV-1`) is fixed at the source, not in the video. Check the same sheet for anything private: real emails and phone numbers, keys and tokens, notifications, other browser tabs and bookmarks. Hide it or take the shot again; a video gets shared further than a screenshot.

## 3. Write the story

Copy `templates/film.html`, `templates/story.js`, `scripts/render.mjs`, `scripts/score.py` (and whichever of `voice.mjs`, `kokoro_tts.py`, `words.py`, `image.mjs`, `depth.py` the brief needs) into the clip folder, with `assets/` beside them. Every path the renderer reads or writes is relative to the folder `render.mjs` sits in, not the shell's.

`film.html` is the engine and is not edited per film. Everything about one film lives in `story.js`: frame, colours, fonts (a `file` per font to load the brand's own, or none for a system font), logo, picture size, which picture shows when and how it enters (`via: 'push'` slides, `'fade'` dissolves), taps or clicks, camera keyframes, captions, an optional number scene and the closing lockup. The starter `story.js` is a 15-second browser film with placeholder words; `templates/examples/autorentic.story.js` is a finished 20-second phone film to read for timing and camera work. A picture that hasn't been captured yet draws as a "missing" card, so the story can be blocked out before the pictures exist.

The engine already holds what took iteration to get right:

- **Time is the only input.** Every value comes from `t`; no timers, no state carried between frames, no unseeded random. Frame 300 renders the same alone as in sequence.
- **Springs, not easing curves.** Closed-form springs (`snappy`, `smooth`, `playful`) give motion weight. Text enters by sliding up inside a mask, never by fading in.
- **A camera that pushes into the picture.** A whole screen shown at two-thirds of a 9:16 frame leaves its UI unreadable on a real phone, and a desktop screenshot in a vertical frame is smaller still; zoom to the part the caption is about.
- **One timeline, three layouts.** The layout is computed from the frame size, so 9:16, 1:1 and 16:9 are re-composed, not cropped. Side-by-side layouts use smaller captions and less camera zoom (a quarter for `phone`, 60% for the wider frames), or the text runs into the picture; a browser shot in widescreen still needs a strong push-in for its UI text to read. Text too long for its space shrinks to fit rather than running off the frame. A 4:5 frame falls on the side-by-side side of the split; check it with a still before promising one.

Two scenes carry the number beat. `stat` counts up to a figure with a label and an optional source line (`{ at, out, value, prefix, suffix, label, source }`), for "99.9%" or "3x faster". `number` drops cards that merge into one pill, for a "many become one" fact: twenty bills into one payment, twelve tools into one app. With no citable number, drop the beat rather than inventing one.

`backdrops` (`{ name, from, to, depth: true, dim }`) fill the frame behind everything with a slow push-in; `depth: true` with a map from `$PY depth.py <picture>` slides near things against far ones.

When a device beside captions reads as basic, the engine also has `spotlights`, a browser `cursor`, `tilt`, `motionBlur`, `ambient`, `softText`, full-frame `photos` and a `products` row. 📖 `references/premium-motion.md` before using them: which help a viewer follow the screen and which only decorate.

`screens`, `number`, `stat`, `success`, `taps`, `music`, `voice`, `subtitles`, `backdrops` and `lockup` are all optional; a film without `lockup` ends with no logo, which the brief should mean on purpose. The logo is blended with `multiply`, which suits a logo on white; on a dark page set `logoBlend: 'source-over'` and use a transparent PNG.

Run one stills render straight after copying, to catch a missing file before anything else. The renderer serves the folder over local HTTP (fonts loaded from `file://` are unreliable) and logs any file it could not load. The fourth argument is the output path, which stills ignore, hence the `x`; the times are examples, so take them from your own story's beats, and clear `out/stills` between rounds or old frames mix into the sheet. Set `STORY=<path>` to render a story file other than `story.js`. To watch the film while writing it, serve the clip folder (`python3 -m http.server` in it) and open `film.html?story=story.js&w=1080&h=1920`: in an ordinary browser it plays on a loop, and when the story or a font can't load it says why on the page. Opened straight from disk, brand fonts may not load.

With a voice-over, make it now, straight after the first draft of the story (the voice part of §5), and time the captions and scenes to the spoken lines before the contact sheet. The voice sets the pace. Any retime afterwards means writing the cues again and re-rendering what it touched, since the music hits come from the same cues.

```
node render.mjs stills 1080 1920 x 1.4 4.5 8.5 12.5 16.6 19.9
```

| Format | Size | Command |
|---|---|---|
| Vertical (Reels, TikTok, Shorts) | 1080x1920 | `node render.mjs video 1080 1920 out/clip_9x16.mp4` |
| Square (feed) | 1080x1080 | `node render.mjs video 1080 1080 out/clip_1x1.mp4` |
| Widescreen (YouTube, decks, websites) | 1920x1080 | `node render.mjs video 1920 1080 out/clip_16x9.mp4` |
| App Store preview | 886x1920 | `PRESET=app-store node render.mjs video 886 1920 out/clip_appstore.mp4` |
The video length comes from the story's `duration`. Pass the still times literally: in zsh a `$TIMES` variable is not split into words, and every still comes out as `NaN`.

## 4. Review your own frames

Start with the automatic check, once per size you will deliver:

```
node render.mjs check 1080 1920
```

It draws a frame every half second twice, in two shuffled orders, and compares them: anything that depends on more than `t` (a random number, a clock, state kept between frames) fails with the times named. It warns about a font that isn't on the machine and has no file (the browser silently draws a fallback), flat-colour frames, missing pictures, text on screen too briefly to read (under 5/6 s or 0.3 s a word, over 20 characters a second: Netflix's and the BBC's subtitle rules), a voice over 3 words a second, a product first seen after 3 s, and, once `score.wav` exists, loudness off -14 LUFS or a true peak above -1 dBTP. It exits 1 on an error, so a background run reports the failure. A pass says the film is consistent, not good; the sheet judges that.

Then render one still per beat and tile them into a contact sheet:

```
ffmpeg -pattern_type glob -i 'out/stills/1080x1920_*.png' -vf "scale=270:-1,tile=6x2:padding=8" -frames:v 1 out/contact_9x16.png
```

Make one sheet per size (change `1080x1920` in the glob), since frames of different shapes distort when tiled together, and because each layout fails in its own way: a clean vertical cut says nothing about the square one. Review the sheets four times, one lens per pass (parallel agents where you can spawn them): design (collisions, one focal point), readability (the hook in two seconds, UI text at phone size), pacing (something new every two to four seconds, a short ending), brand (colours, true claims, nothing private). 📖 `references/review-lenses.md` has each lens's questions. Merge, fix the worst three problems and re-render the sheet.

Then render the videos (1.5 to 3 minutes each for 20 s; run them in the background). A background run tells you only that it exited, not that the video is right, so before calling one done, `ffprobe` it for the right size and frame count, and pull a 12-frame strip around the fastest action to check for jumps: `ffmpeg -ss <start> -t 0.8 -i out/clip_9x16.mp4 -vf "select='not(mod(n\,2))',scale=180:-1,tile=12x1" -frames:v 1 -update 1 out/strip.png` (the `-frames:v 1` counts tiled images, not source frames; set it to 12 and ffmpeg errors after writing one).

## 5. Music and sound

`score.py` composes an original bed in numpy (pad, bass, plucks, kick, hats) and places taps, whooshes and chimes on the film's cues, so nothing needs licensing. The cues come from the story itself (`window.cues`), so retiming a scene moves its sound with it:

```
node render.mjs cues 1080 1920 cues.json
node voice.mjs cues.json        # only for a story with voice lines, see below
python3 score.py cues.json score_raw.wav
ffmpeg -i score_raw.wav -af loudnorm=I=-14:TP=-1.5:LRA=11 -ar 48000 -y score.wav
node render.mjs check 1080 1920
for f in 9x16 1x1 16x9; do ffmpeg -i out/clip_$f.mp4 -i score.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -ac 2 -ar 48000 -shortest out/clip_${f}_music.mp4; done
```

The `check` here is the one that measures `score.wav`'s loudness, which the first check in §4 could not. A `score.wav` left from an earlier round gets measured as if it were current, so make it fresh each time. `ffprobe` each muxed file for an audio stream and the full length.

Run it with plain `python3`, not `python3 -I`: isolated mode drops the user site-packages where numpy usually lives. The bed runs at the story's `music.bpm` (120 by default, so 0.5 s per beat), and `music.mood` picks its character: `bright` (default, upbeat), `calm` (half-time kick, no clap) or `dark` (minor chords), matched to the feeling in the brief. The three moods share their instruments and rhythm, so they sound alike: offer them as one generated option, not three.

**A real track** is the route when someone wants a genuinely different sound:
- **Licence**: Pixabay Music's Content License allows commercial use with no credit and allows editing; its own summary page says so, and the YouTube Audio Library does not cover ads off YouTube. On each track page, look for "Content ID registered": such a track can be flagged or muted on Facebook, Instagram and YouTube, which matters for paid ads and Google Play but not WhatsApp status. Pixabay answers scripted downloads with 403, so the user downloads the file.
- **Cut and mix**: start the cut so the track's drop lands on `device.enter`, keep the sound effects, and record the track in the README. 📖 `references/real-track.md`.

You cannot hear the result. Check what you can (a waveform image showing the beat starting where the film says, the loudness figure, no clipping) and say plainly that the sound itself still needs a human ear.

**Voice-over (optional).** Only when the brief asks for one. Add `voice: [{ at: 2.6, text: '...' }]` to the story, then generate the lines between `cues` and `score.py`:

```
node render.mjs cues 1080 1920 cues.json
node voice.mjs cues.json
$PY words.py cues.json          # only with subtitles: true
```

- **Provider**: Kokoro, a free natural voice on the machine (nothing leaves the laptop), once installed; otherwise the macOS `say` voice, a wiring draft never to release. A paid voice (ElevenLabs, OpenAI) runs only with `VOICE_PROVIDER` set, never from a key alone, and only after the user agrees the script may go to that service. 📖 `references/voice-captions-backgrounds.md#{voice}` for voices, overrides and the untested paid paths.
- **Files**: `assets/voice/`, remade only when a line's text or voice changes, so a re-run doesn't pay twice.
- **Timing**: it prints each line's start and end and warns when one runs into the next, outlasts the caption it starts under, or runs past the end. Move the line or shorten the words; the voice sets the pace and the picture follows. `score.py` lowers the music under each line and puts the voice on top.
**Spoken-word captions.** Most feeds autoplay muted, so a voice-over film carries its words on screen: `subtitles: true` in the story, then `$PY words.py cues.json` after every voice change, which times each word to the recording. With subtitles on, keep the headline `captions` short and different from the spoken words; without them, each caption's text matches what its line says. 📖 `references/voice-captions-backgrounds.md#{subtitles}`.

`check` fails while a voice line has no file, and `score.py` stops on one, so a skipped step can't ship a silent film.

## 6. Deliver

Send the MP4s and the contact sheet, keep the silent versions beside the ones with music, and write a README in the clip folder with the capture and render commands (and, with a voice, the provider, voice and model used, never the key). Close by listing what needs a person: the call to action, the music if the generated one isn't good enough, a listen to the voice, any generated background, and any demo names marketing wants changed.
