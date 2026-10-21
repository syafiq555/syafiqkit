<!--LLM-CONTEXT
Status: shipped in 1.406.17 (2026-10-21); Cloudflare image path verified with a real token
Domain: plugin-maintenance / motion-clip (free media sources, approval gates)
Gotchas (critical):
  - SKILL.md sits at 4,994 of the 5,000 tokens re-attached after compaction; any addition needs a matching cut or a move to references/
  - Depth Anything V2 Base/Large/Giant and FLUX.2 Klein 9B are non-commercial; only Small and Klein 4B are Apache-2.0
Related: `../current.md` (index)
Last updated: 2026-10-21 (approval gates, local voice, word captions, backdrops, Cloudflare images; OpenFilm dropped; round two: text, first-seconds and store checks)
-->

# motion-clip: free media and approval gates

Came from a study of Open Generative AI (github.com/anil-matcha/open-generative-ai, MIT, 31k stars, read 2026-10-21): a front end for MuAPI, a paid generation gateway. Every cloud generation needs a MuAPI key; the README sells white-label plans from $49/mo. "No content filters" is a marketing claim (the underlying Veo/Sora/Kling moderate), and prompts and uploads go to MuAPI. Its "Cinema Studio" joins camera, lens and aperture menu picks into a prompt sentence for Nano Banana Pro (`CinemaStudio.jsx` `buildNanoBananaPrompt`). The genuinely free part is its desktop app's bundled stable-diffusion.cpp. Nothing in it fits our engine directly; the user asked instead how motion-clip could improve and what is free, and chose all four upgrades below.

## Research findings (2026-10-21, verified where marked)

**Case studies.** Lago's launch films (getlago.com/blog/we-killed-our-motion-design-job, verified on the page): a coding agent with a skill makes storyboard, animatic and film; a human approves the first two before the render; masters checked for resolution, frame rate, duration, audio; a seven-category scorecard, shipping at 92/100; outputs 16:9, silent master, 1:1, 4:5, 9:16; feedback fell from about twelve rounds to one over six films. GitHub Unwrapped (Remotion + Lambda, one template per user) and Spotify Wrapped 2025 (moments picked by heuristics in code, stats computed in code and passed in, never generated) are the case for a data-driven batch mode. Platform safe-zone figures (Reels, Shorts, TikTok) disagree across third-party sources; only LinkedIn's ad spec page is official (9:16 720x1280 recommended, 1080x1920 max).

**Free AI footage on an M4 Mac, 24 GB, no NVIDIA.** Local video models are impractical: a 2-second Wan 2.2 GGUF clip took 82 minutes on an M1 Max 64 GB, and LTX-2 gave NaN output on Metal (lilting.ch, verified). Hugging Face ZeroGPU gives a free account 5 GPU-minutes a day (verified on its docs). The Gemini API lists no free tier for any image model (verified). Google Flow's free Veo credits are known only from secondary sites. Pollinations is free but stamps a logo and allows one request per 45 s.

**Free images.** Cloudflare Workers AI: 10,000 Neurons a day free, all limits reset 00:00 UTC (verified on its pricing page). Per 1024x1024: FLUX.1 schnell about 58 Neurons at 4 steps (4.80 per 512 tile plus 9.60 per step; a research agent counted tiles only and overstated the allowance threefold), FLUX.2 Klein 4B about 104 (26.05 per output tile), FLUX.2 Klein 9B 1,364 (so about 7 a day; Partner model, BFL terms). Klein 4B weights are Apache-2.0 on Hugging Face (verified); 9B is "other" (non-commercial). Locally, FLUX.1 schnell bf16 is about 34 GB of non-duplicate files, too big for this Mac's free disk; 8-bit quantisation is judged "nearly identical" by eye in community comparisons with no published metric.

**Free local tools.** Kokoro-82M (Apache-licensed weights, verified on its README). F5-TTS and MusicGen weights are CC-BY-NC; Orpheus needs a GPU. ACE-Step renders a minute of music in about 26 s on an M2 Max (verified on its README); weights licence unconfirmed. Depth Anything V2: Small Apache-2.0, Base/Large/Giant CC-BY-NC-4.0 (verified). RIFE and FILM are archived with no macOS path.

## Research round two: text, openings, stores (2026-10-21) {#research-round-two}

Four haiku research agents (explainers, platform ad guidance, code-made launch videos plus store specs, brand motion plus accessibility), then three haiku claim-checkers that opened every page, plus spot checks by the main session (TikTok, Netflix, Every: figures found on the page). Only page-verified claims below.

| Source | What the page says | Used for |
|---|---|---|
| Netflix Timed Text Style Guide (partnerhelp.netflixstudios.com articles 217350977, 215758617, 360051554394) | "Adult programs: Up to 20 characters per second", "42 characters per line", "Maximum two lines"; "Minimum duration: 5/6 (five-sixths) of a second per subtitle event", "Maximum duration: 7 seconds"; gaps "either be 2 frames or half a second or more" | Readable-text check |
| BBC subtitle guidelines (bbc.co.uk/accessibility/forproducts/guides/subtitles/) | "160-180 words-per-minute (WPM) or 0.33 to 0.375 second per word"; "minimum period of around 0.3 seconds per word"; never "more than 2 seconds after the words were spoken" | Readable-text and voice-pace checks |
| TikTok creative best practices (ads.tiktok.com/help/article/creative-best-practices) | "Introduce your content proposition in the first 3 seconds"; "hook in the first 6 seconds"; "displaying 5-10 words per second when using text" | First-3-seconds check |
| Every, product-launch-video (github.com/everyinc/product-launch-video, 65 stars) | "product on screen within 3 seconds"; "captions burned in for muted viewers"; "4 parallel critics check design, readability, pacing, and brand consistency" (author's claim, no outcome data) | First-3-seconds check, four-lens review |
| Apple app preview specifications (developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications) | 15 to 30 s; at most 30 fps; H.264 High Profile up to Level 4.0, target 10-12 Mbps; 256 kbps AAC stereo; max 500 MB; "Default poster frame setting 5 Seconds"; accepted sizes 886x1920 (current iPhones), 1080x1920, 750x1334, 1200x1600, 900x1200, each also landscape, Mac 1920x1080 | App Store preset |
| Apple app previews page (developer.apple.com/app-store/app-previews/) | up to three per language; "Don't include specific prices"; no "seasonal or timely references... or dates"; "Don't film people interacting with a device"; touch hotspots, dissolves and fades allowed; text on screen "long enough for people to read" | App Store preset |
| App Review Guidelines 2.3.4 (developer.apple.com/app-store/review/guidelines/) | "previews may only use video screen captures of the app itself... You can add narration and video or textual overlays" | `check` errors on backdrops under the preset |
| Google Play preview video (support.google.com/googleplay/android-developer/answer/9866151) | a YouTube URL, public or unlisted, embeddable, not age-restricted, monetisation off ("turning off monetisation... may not be enough" with copyrighted content); "may auto-play inline with muted audio for up to 30 seconds"; app "within the first 10 seconds"; "at least 80%" representative; avoid "Best" and "Download now" ("Free" is on the feature-graphic list only) | Google Play preset |
| Google Ads Shorts ABCD (support.google.com/google-ads/answer/14783551) and Google's ABCD article (business.google.com/.../youtube-video-ad-creative/) | "Announce yourself with audio", "Use tight framing for ease of viewing", a clear CTA; ABCDs "30% lift in short-term sales likelihood and a 17% lift in long-term brand contribution" (Google/Kantar 2021, no month); no seconds figure for branding | Not built |
| Meta Reels ads page (facebook.com/business/ads/facebook-instagram-reels-ads, en_GB) | 9:16 with audio: "2X higher delivery to the Reels placement" (no baseline), "34.5% lower cost per result compared to image ads" (15 split tests) | Not built: supports the existing sound-on default |
| LinkedIn video ads (business.linkedin.com/advertise/ads/sponsored-content/video-ads) | captions "strongly recommended" because "videos autoplay without sound" | Supports subtitles |
| WCAG 2.2 Understanding 2.3.1 (w3.org) | no more than three general or red flashes in any one second; general flash = opposing luminance changes of 10% or more where the darker is below 0.80; 341 x 256 px area at 1024 x 768 | Flash check: not chosen, Next Step |
| Wistia (wistia.com/blog/optimal-video-length, /understanding-audience-retention) | "Videos under a minute average a 52% engagement rate"; most viewers "drop off around the halfway point"; first-2% drop "4.9% for videos 1 - 2 minutes"; end with "a short logo", avoid "in summary" and music that signals the end | Short ending in the pacing lens |
| VideoScribe (blog.videoscribe.co, vendor) | voice-over "130–150 words per minute"; "30 seconds: 65–75 words" | Context only |

Not verified, so not used: Kurzgesagt's staged QA and "two experts" (Medium page 403; its site says only "about a dozen drafts"), Wistia 2025 PDF length table (too large to fetch), Carbon motion "no bounce" (not on the page; its micro-interaction range is 90–120 ms in its checklist), Google's "brand in the first five seconds" (not on the page).

## Key Technical Decisions {#decisions}

### D-text-store-checks: reading time, first seconds and store presets in `check`, four-lens review [committed] · 2026-10-21

**Problem**
The second research round found rules every short clip breaks silently: text shown too briefly for a muted viewer, the product arriving after viewers scroll on, and store listings with their own length, cover-frame and content rules. `check` measured none of them, and the contact-sheet review was one pass.

**Decision**
Chosen by the user from a ranked list of five (flash check left out):
- `check` warns on hook and caption text shown under max(5/6 s, 0.3 s a word) or over 20 characters a second; subtitle groups on 5/6 s and 20 characters a second only (the word floor scales with group size, so more words per group cannot fix fast speech); a voice line over 3 words a second, from `words.json`, or from the file's ffprobe length when subtitles are off (padding silence makes that read low).
- `productMoment()`/`productLine()` give when the product first shows (device entry, logo, or the product's name in the hook), printed at the top of `board` and checked in `check` against 3 s (10 s under Google Play). A film with no screens gets an information line, never a warning, so a logo reveal is not told to move its logo.
- `PRESET=app-store|google-play`: app-store `video` refuses sizes outside Apple's list and FPS over 30 and encodes `-b:v 11M -maxrate 12M -bufsize 24M -profile:v high -level 4.0`; `check` errors outside 15 to 30 s or with backdrops (2.3.4), warns when the product is off screen at 5 s, on a price or date in the story's words, and on a size outside the list. google-play: product by 10 s, over 30 s, "Best"/"Download now". SKILL.md §5's music mux moved to 256k stereo 48 kHz for everyone.
- Contact-sheet review in four passes (design, readability, pacing, brand), parallel agents where the session can spawn them (`references/review-lenses.md`).
- Measured: the subtitle test film (Kokoro) speaks 3.9 to 4.2 words a second and its three-word groups show 0.44 to 0.88 s; the Autorentic `say` draft line 2 is 6 words in 1.35 s. Autorentic stills byte-identical to the previous engine; its 886x1920 layout fits.

**Rejected**
- A hard error for reading time. Why not: the thresholds come from subtitle guides for long-form TV; a short promo may break them on purpose.
- Checking text inside captured screens for prices and dates. Why not: no OCR; the reference tells the session to read the sheet (the Autorentic screens show "RM 1,649.91" and due dates).

**Consequences**
Two App Store questions stay open for the user per film: the engine animates still screenshots rather than recording the app, and draws a device frame; Apple's pages name neither. Nothing checks the muxed MP4 (size, audio bitrate) for a store upload.

**Status**: committed · **Reversible**: yes

### D-approval-gates: storyboard and sound draft approved before the full render [committed] · 2026-10-21

**Problem**
Feedback on a finished film arrived as story changes, each costing a full render at three sizes.

**Decision**
Chosen: `render.mjs board` writes `out/storyboard.md` from the story (backdrops, hook, device span, cuts, taps, captions, voice lines, number with source, lockup, sorted by time); `render.mjs draft` renders at half size (rounded even), 15 fps, `?draft=1` stamp of the time per frame, and muxes `score.wav` (or `AUDIO`) with `apad` so a short score cannot cut the video. SKILL.md §1: block the story out before capture, board approved, then draft approved once pictures, voice and a first score exist.
- Measured: a 15 s draft renders in 14 s.

**Rejected**
- Grey-placeholder animatic (Lago's). Why not: the engine already draws uncaptured pictures as "missing" cards, so the draft is the animatic.
- Stills in the board. Why not: the board approves words, numbers and timing; the contact sheet in §4 covers pictures.

**Consequences**
`board` is text only. The user's yes is asked in conversation; nothing records it in the clip folder.

**Status**: committed · **Reversible**: yes

### D-local-voice-captions: Kokoro as the default voice, spoken-word captions from Whisper [committed] · 2026-10-21

**Problem**
The only free voice was macOS `say`, never releasable; captions were hand-timed, and most feeds autoplay muted.

**Decision**
Chosen: `setup-local.sh` makes one venv at `${MOTION_CLIP_HOME:-~/.local/share/motion-clip}/venv` (Python 3.10 to 3.12; parts `voice`, `captions`, `depth`; CPU torch wheel off macOS; MLX Whisper on Apple Silicon, faster-whisper elsewhere). `voice.mjs` defaults to Kokoro when importable (voice `af_heart`, `VOICE_SPEED`), batching all pending lines into one `kokoro_tts.py` call; `say` is the fallback. `words.py` transcribes each voice file with word timestamps, aligns heard words to script words with difflib, spreads unheard runs evenly between neighbours, writes `assets/voice/words.json` with absolute times. `subtitles: true` draws three words at a time in a pill (vertical: centred at 0.8 H; square and wide: under the text column at 0.72 H), each word turning `highlight` when spoken.
- Measured on the M4: install 1.5 GB in about 6 min; Whisper large-v3-turbo download 1.6 GB on first use; Kokoro made two lines in about 40 s; all 19 test words were heard.
- `check` errors when subtitles are on and `words.json` is missing, older than a voice wav, or written for other voice text; the film itself only warns, so `cues` and `board` run before the voice exists.
- `VOICE_SPEED` enters the regeneration stamp for Kokoro only, so lines made earlier by `say` or a paid voice are not re-made (or re-billed).
- Kokoro at speed 1 speaks about 4 words a second; 0.8 brought the Autorentic lines to about 3, so the reference starts subtitled films there.
- `voice.mjs` times each line to its last sample louder than 650 (of 32,767), not the file's end: Kokoro leaves about 0.8 s of trailing silence, which raised false "still speaking after its caption" warnings. Ends now land 0.1 to 0.25 s after Whisper's last-word end.
- `subtitleGroups(words, per)` in `film.html` folds a single trailing word into the group before it (only when `per` is over 1); `render.mjs check` calls the same function, so the drawn and checked captions cannot drift.

**Rejected**
- Kokoro's own token timestamps. Why not: Whisper alignment works for every provider, paid ones included.
- A hard error on a missing `words.json` in the film. Why not: circular, since `cues` loads the film and `words.py` needs the cues.

**Consequences**
Kokoro can stress brand names oddly; the user listens before release. The Linux branch of `setup-local.sh` has never run.

**Status**: committed · **Reversible**: yes

### D-backdrops-and-images: full-frame backdrops with depth, generated through Cloudflare's free tier [committed] · 2026-10-21

**Problem**
The user wanted AI footage free and without filling a 20 GB-free disk; local video generation is impractical on the Mac, and D-real-pixels forbids generated product imagery.

**Decision**
Chosen: `backdrops: [{ name|file, from, to, depth, dim, dimColor, zoom, drift, strength, fade }]` drawn full-frame before everything else, slow push-in (zoom 1.04 to 1.14), no fade at the film's own start or end. With `depth: true` and `<name>.depth.png` (made by `depth.py`, Depth Anything V2 Small, percentile-normalised, blurred 0.4%), a WebGL shader displaces by depth over eight fixed-point steps (offset up to `strength` 0.05); no WebGL draws flat. `image.mjs` calls Cloudflare: FLUX.2 Klein 4B by multipart form (prompt, width, height 256 to 1920 snapped to 16, seed; the fields are in Cloudflare's launch changelog, not the model page), FLUX.1 schnell by JSON (no size, 8 steps); output converted to PNG, a stamp skips a re-run with the same prompt, size and seed. Mood only: never the product, its UI, or people shown as customers.
- Verified: depth vs flat stills differ (near tower moves against the skyline); `check` passes determinism with a WebGL backdrop; error paths (no args, no keys, bad account 404 code 7003).

**Rejected**
- Local FLUX (Draw Things, mflux). Why not: 6 to 16 GB of the 20 GB free disk, 40 to 90 s per image estimated.
- MuAPI / Open Generative AI. Why not: paid per generation.
- Google Gemini image models. Why not: no free API tier.

**Consequences**
First real run 2026-10-21: a 1088x1920 Klein 4B still in 16 s, `result.image` base64 as documented, quality good enough for a hero background (Kuala Lumpur blue-hour test). A token from the Workers AI template cannot list accounts (`/accounts` returns empty, `/memberships` and `/user` refuse), so the account ID comes from the dashboard address bar. Neuron use per still is not yet read from the dashboard.

**Status**: committed · **Reversible**: yes
