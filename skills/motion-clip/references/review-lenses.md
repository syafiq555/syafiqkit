# Reviewing the contact sheet through four lenses {#lenses}

One read of a contact sheet catches whatever strikes the reader first and misses the rest. Four passes, each asking only its own questions, catch more. The split follows Every's product-launch-video skill, whose README describes "4 parallel critics check design, readability, pacing, and brand consistency" (github.com/everyinc/product-launch-video, read 2026-10-21; an author's claim, with no measured outcome).

Give each pass the sheets for every size, the brief, and one lens below. Where the session can spawn agents, run the four in parallel and have each report its three worst problems with the frame time. Otherwise make four passes yourself and write down each pass's findings before starting the next. Then merge the lists, fix the worst three overall and re-render the sheet.

A builder agent running this skill cannot spawn the lens agents, so its own look at the sheet is not this review: it reports the sheet paths, and the session that dispatched it runs the four lenses (with `impeccable` critique and `emil-review-animations` on the story) before the film is shown to anyone.

## Design {#design}
- Do captions, pictures and subtitles collide or crowd each other, in each size? A clean vertical sheet says nothing about the square one.
- Is there one clear focal point per frame, or do the text and the picture compete?
- Does the camera push in far enough that the UI the caption talks about is the biggest thing on screen?
- Could this film belong to another company with the logo swapped? (the brief's one line on this)

## Readability {#readability}
- Is the hook readable in the first two seconds, at the size someone sees it on a phone?
- Is text inside the pictures legible at that size, not just the captions?
- Does every caption stand out against what's behind it, including a moving or generated background?
- Does `render.mjs check` list text that is on screen too briefly, or a caption shrinking to clear the picture? Fix those first; the sheet can't show time.
- Does the camera hold still while a caption or a screen is being read? A push or slide during the read makes both the caption and the UI hard to follow; move between beats, not inside one. A client who calls the clip hard to read usually means this (2026-10-27: a storefront clip was redone with a voice-over and 3.5 to 5 s still holds per screen).

## Pacing {#pacing}
- Does something new happen every two to four seconds?
- Is the product on screen by 3 s (10 s for Google Play)? `render.mjs check` reports the time for the story as it stands now.
- Does the voice, where there is one, leave each caption up long enough, and does the music hit where the picture changes?
- Is the ending short: a logo and a call to action, not a recap?

## Brand {#brand}
- Are the colours, fonts and logo the brand's own, with nothing the brief bans?
- Is every claim on screen true, and does the number carry its source?
- Does each line speak from the user's side ("Shop by product, or by what you need"), not to the client as the approver ("your brief", "as you asked")? A showcase of a client's own site still speaks as their shopper; proof of what the brief asked for belongs in the handover notes. Measured 2026-10-27: a storefront script written as a checklist to the client read as "weird" and was rewritten after research into agency case studies, Shopify theme pages and brands' own launch posts, which narrate from the shopper's side.
- Is the call to action written as it will read after launch, with no date that will go stale?
- Does any frame show something private (real emails, phone numbers, notifications, other tabs)?
- Captions in a local language use the words its people post, not its formal register (a Malaysian shop: catchy BM-English mix, not "kini dalam talian"); read each line aloud and ask whether the brand would post it as is.

## Approval gates {#approval-gates}

Each change to a finished film costs a full re-render. Two gates before the expensive render (the storyboard, then the draft with sound) took Lago from about twelve feedback rounds to one.

The review page is the approver's tool: an approver who would otherwise answer "looks good" or a vague "change the middle bit" can point at beat 4.

## Check warnings {#check-warnings}

`check` draws a frame every half second in two shuffled orders and compares them: anything depending on more than `t` (a random number, a clock, state kept between frames) fails with the times named, and so does any stretch of 2 s or more where nothing moves. It exits 1 on error. A pass says the film is consistent, not good; the sheet judges that.

`node render.mjs check` warns about: a font that isn't on the machine and has no file (the browser silently draws a fallback), flat-colour frames, missing pictures, text on screen too briefly to read (under 5/6 s or 0.3 s a word, over 20 characters a second: Netflix's and the BBC's subtitle rules), a voice over 3 words a second, a product first seen after 3 s, and, once `score.wav` exists, loudness off -14 LUFS or a true peak above -1 dBTP.

It fails (exit 1) on:
- **Nothing moving for 2 s or more**, judged from the half-second frames it already draws (`STATIC_MAX=<seconds>` changes the limit, `0` turns it off). Feeds read a held frame as a stalled video. The idea and the 2 s default come from HyperFrames' motion audit (`packages/cli/src/utils/motionAudit.ts`, Apache-2.0).
- **Text under the platform's UI**, with `PRESET=tiktok`, `instagram-reels` or `youtube-shorts` at a 9:16 size. It records every text run the film draws (any engine copy, since it watches the canvas's `fillText`), keeps the ones that stay put across two samples (so a line sliding in is not judged mid-slide), and names each line, its time and its band. Bands and sources are in `../carousel-builder/references/presets.md`; the two scripts must carry the same numbers. The phone frame's own clock and URL bar are exempt as product pixels. Text under 12 px tall is ignored. Text drawn onto a canvas of another size and pasted in as a picture (`drawImage`) is not seen, nor is text inside a screenshot: an engine that pre-renders its captions needs its own zone check. The per-platform idea follows ghost-editor's `scripts/lib/safezone.mjs` (MIT), but the numbers are the platforms' own.

The bands are the platforms' published ones and leave a tall middle strip: in 9:16 that rules out subtitles low in the frame.

The starter story's vertical layout predates these bands and fails `PRESET=tiktok` as shipped, so a TikTok film moves its hook, captions and subtitles inside x 120 to 780 (960 above y 840) and y 240 to 1260 from the first draft, and gives the freed bottom third to a picture (the phone running off the bottom edge, a photo), never to text.

`check` also writes `out/check_<w>x<h>.json`, which `review` reads.

`node render.mjs verify <w> <h> <file.mp4>` checks the finished file, after the mux, without a browser. It fails on a wrong size, a length more than 0.15 s off `cues.json` (a render or mux that stopped early), a single-frame flash (one frame's brightness more than 30 levels from both neighbours, which are within 12 of each other), and an audio dropout: digital silence under -80 dBFS with sound on both sides, for 20 ms to 1 s when the folder has a `score.wav` (a music bed never stops, so any such hole is a clipped sound). For a voice-only mix (`VOICE_ONLY=1`, or no `score.wav`) only 20 to 120 ms fails and 0.12 to 1 s warns, because Kokoro leaves 0.15 to 0.4 s of exact digital silence inside its lines. It also warns on black stretches, a picture frozen 2 s or more, silences over 1 s and the finished loudness, and stops with ffmpeg's own message when ffmpeg cannot scan the file at all, rather than passing a file it never read. The detectors follow ffmpeg-skill's `scripts/check.py` (MIT), built on ffmpeg's `blackdetect`, `freezedetect`, `signalstats` and `silencedetect`. A flash in the background's own colour (white on a near-white page) changes too little brightness to detect, and the viewer barely sees it either.

`node render.mjs review <w> <h>` writes `out/review_<w>x<h>.html`: one still per beat (hook, each caption, cut, voice line, number, lockup), each with its words and voice line, the zone hits from the last `check` under the frame they belong to, the other check results at the top, the platform's bands shaded (with the same `PRESET`), a note box per beat and a "Copy change list" button. The idea follows ghost-editor's `scripts/approval_sheet.py` and ffmpeg-skill's `scripts/_review.py` (both MIT). It needs `review-page.mjs` beside `render.mjs`.

## Render pitfalls {#render-pitfalls}

- **Stills**: the fourth argument is the output path, which stills ignore, hence the `x`. The times are examples, so take them from your own story's beats. `STORY=<path>` renders a story file other than `story.js`.
- **Watching while writing**: serve the clip folder (`python3 -m http.server` in it) and open `film.html?story=story.js&w=1080&h=1920`. In an ordinary browser it plays on a loop; when the story or a font can't load it says why on the page. Opened straight from disk, brand fonts may not load, because the renderer serves over local HTTP (fonts from `file://` are unreliable).
- **Laptop sleep**: a sleep mid-render shows as `locator.screenshot: Timeout -<N>ms` (a negative timeout), and Low Power Mode or a closed lid as 30-second canvas timeouts. The canvas timeout also hit on power with the lid open and Low Power Mode off, about 10 minutes in (the display-sleep setting); the same renders passed under `caffeinate -dims` (2026-11-10). `caffeinate -i` does not stop lid-close sleep; `WORKERS=1` eases a throttled CPU.
- **Stills on a fixed grid catch transitions mid-way.** A `fade` lasts 0.18 s and a push about 0.6 s, so a reviewer handed one still every 0.5 s sees two screens overlapping whenever a `from` falls just before a sample, and scores a defect the video never shows long enough to read. Put each `from` at least 0.2 s before the next grid time (5.8 rather than 6.0). The camera is a spring too: a keyframe that frames a beat's subject lands about 0.5 s after it is set, so start the move on the screen change itself, not 0.3 s later (25/11/2026: three beats opened with their button just off-frame for half a second).
- **Motion check strip**: `ffmpeg -ss <start> -t 0.8 -i out/clip_9x16.mp4 -vf "select='not(mod(n\,2))',scale=180:-1,tile=12x1" -frames:v 1 -update 1 out/strip.png` (the `-frames:v 1` counts tiled images, not source frames; set it to 12 and ffmpeg errors after writing one).
- **Story built by code.** A story generated from a list (screens and taps in a loop) wraps itself in `(() => { ... })()`: it shares the page's global scope with the engine, so a top-level `const camera` or `screens` fails to load with "already been declared".
- **Stills and missing files.** The renderer logs any file it cannot load; screens draw as "missing" until they are captured.
- **Picture paths.** Renderer paths are relative to the folder `render.mjs` sits in, not the shell's, and the render server serves only that folder: a `../` picture 404s and draws as "missing", so copy pictures in.
- **A background run** only reports that it exited, so `ffprobe` it for size and frame count before trusting it.
