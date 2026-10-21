<!--LLM-CONTEXT
Status: 🔄 approval gates, local voice, word captions, depth backdrops, then reading-time/first-seconds/store checks and a four-lens review, all built 2026-10-21, uncommitted (no version or CHANGELOG yet); OpenFilm rework dropped
Domain: plugin-maintenance / motion-clip skill
Gotchas (critical; full list in ## Critical Gotchas below):
  - A trigger test only means something in a session started after the skill was written
  - film.html is the engine and is never edited per film; each film is a story.js
  - SKILL.md is at 4,994 of the 5,000 tokens kept after compaction: cut or move to references/ before adding
  - The ElevenLabs/OpenAI voices have never run with a real key
Related: tasks/plugin-maintenance/skill-authoring/current.md, decisions/media-and-approvals.md
Last updated: 2026-10-21
-->

# syafiqkit: motion-clip skill

## Quick Start (read this first in next session)

**Where we are**: `/motion-clip` makes 15 to 30 second promo videos for any product (app, website, physical product, brand) from real pictures, as code, in three formats, with an original music bed and an optional voice-over. Built from one real run (the Autorentic tenant-app launch clip). Every `~/herd/...` folder named in this doc exists only on Syafiq's machine; another reader has the facts recorded here, not the folders. On 2026-10-21 four upgrades were built and verified but not committed: storyboard and sound-draft approvals, a free local Kokoro voice, captions timed to the spoken words, and full-frame backgrounds (stock or Cloudflare-generated) that move in depth (decisions/media-and-approvals.md). The user dropped the OpenFilm move the same day; our engine is the only path. A second research round the same day added, also uncommitted: `check` warnings for text on screen too briefly to read, a fast voice and a product first seen after 3 s; App Store and Google Play presets (`PRESET`); a four-lens contact-sheet review (decisions/media-and-approvals.md D-text-store-checks).

**Immediate next actions (in order)**:
1. Ship everything uncommitted with `/ship` (as of 2026-10-21: 35 files at `37797cb`, nothing unpushed; other sessions' entries 1.406.10 to 1.406.16 already in CHANGELOG with the version staged at 1.406.16). Check `ListAgents` first for a live session still editing this checkout. Today's motion-clip work has no entry yet: add it as 1.406.17 (approval gates, Kokoro voice, word captions, depth backdrops and Cloudflare images, reading-time and first-seconds checks, App Store and Google Play presets, four-lens review, the voice timing and lone-word caption fixes), telling colleagues to run `sh scripts/setup-local.sh <parts>` for the local voice, captions or depth.
2. The Autorentic re-cut is in `~/herd/autorentic-launch-clips-1406` (Syafiq's machine; the 19/10 version kept in `v1/`, details in its `docs/brief.md`). Its App Store cut is not upload-ready: the captured screens show "RM 1,649.91" and due dates, so recapture with demo data that has neither.
3. In a new session, run the trigger test ("make a promo video for <product>" without the skill name).

**Key facts for cold start**:
- Files: `skills/motion-clip/` with `SKILL.md`, `scripts/render.mjs`, `scripts/score.py`, `templates/film.html` (engine), `templates/story.js` (starter), `templates/examples/autorentic.story.js`, `references/capture-real-ui.md`.
- Regression test (Syafiq's machine only): copy `~/herd/autorentic-launch-clips-1406` twice into scratch folders, put the skill's `templates/film.html` and `scripts/render.mjs` into one, render the same stills in both (`PLAYWRIGHT_DIR=~/herd/autorentic node render.mjs stills <w> <h> x <times>`) and compare sha256, plus `render.mjs cues` output with `cmp`. Byte-identical at 12 timestamps across three sizes on 2026-10-21.
- Local tools on Syafiq's machine: venv at `~/.local/share/motion-clip/venv` (Homebrew Python 3.12), Whisper and Kokoro models in the Hugging Face cache.

**Gotchas that will trip you**:
- Every path `render.mjs` reads or writes resolves against the script's own folder, not the shell's.
- `python3 -I` hides numpy (it lives in user site-packages); run `score.py` with plain `python3`.

---

## Overview

Came from a third-party PDF playbook ("the prompt is 10%, the harness is 90%": a renderer drawn from time `t`, contact-sheet self-critique, springs, sound on a beat grid, three aspect ratios). The session applied it to the Autorentic tenant app, packaged it as a skill, and on the user's instruction ("it's to be meant for anything, not Autorentic only") generalised it: three frames (`phone`, `browser`, `none`) and a per-film story file. Not covered: character animation, long teaching videos, and UI Claude would have to draw. Voice-over became optional in 1.406.0.

---

## Files

- `skills/motion-clip/SKILL.md`: steps 0 to 6 (tools check, brief, gather pictures, write the story, self-review, music, deliver) and what it does not cover.
- `skills/motion-clip/templates/film.html`: the engine. Loads `story.js` (or `?story=`), defaults every optional field and fails fast with a named error on a bad story, springs, masked text reveals that shrink to fit, phone / browser / frameless frames, pictures cropped to fill, camera, layouts per aspect ratio, a "missing" card for uncaptured pictures, `number` and `stat` scenes, `window.cues`. A film with no `screens` runs on hook, stat and lockup alone.
- `skills/motion-clip/templates/story.js`: starter, a 15-second browser film with placeholder words and system fonts.
- `skills/motion-clip/templates/examples/autorentic.story.js`: the finished 20-second phone film.
- `skills/motion-clip/scripts/render.mjs`: serves the folder over HTTP, drives Chromium; modes `stills`, `video` (PNG frames into ffmpeg, H.264 yuv420p CRF 16, tagged BT.709), `cues` and `check` (D-openfilm-borrow); `STORY` env picks the story file, `AUDIO` the sound `check` measures (default `score.wav`), `PRESET` the App Store or Google Play rules.
- `skills/motion-clip/scripts/score.py`: numpy music bed plus taps, whooshes, chimes from a cues JSON; `mood` picks `bright` (Fmaj7, Am7, Bbmaj7, C6, the original), `calm` (half-time kick, no clap) or `dark` (Dm7, Bbmaj7, Gm7, A7sus). With `cues.voice`, ducks the whole mix to 0.35 under each line (0.12 s in, 0.3 s out), adds the voice at peak 0.85, renormalises to 0.89; stops if a voice file is missing.
- `skills/motion-clip/scripts/voice.mjs`: text to `assets/voice/NN.wav` (48 kHz mono s16) for each `cues.voice` line; Kokoro by default when installed, through `kokoro_tts.py`; D-voice-over, D-local-voice-captions.
- `skills/motion-clip/scripts/words.py`, `depth.py`, `image.mjs`, `setup-local.sh`: word timing, depth maps, Cloudflare images, the local-tools installer (decisions/media-and-approvals.md). `render.mjs` also has `draft` and `board` modes, and `film.html` `backdrops`, `subtitles` and the `?draft=1` stamp.
- `skills/motion-clip/references/voice-captions-backgrounds.md`: setup, voices, subtitles, images and backdrops in detail, moved out of SKILL.md for the token budget.
- `skills/motion-clip/references/capture-real-ui.md`: the Flutter golden-test capture.
- `skills/motion-clip/references/review-lenses.md`, `store-presets.md`, `real-track.md`: the four review lenses, the App Store and Google Play rules behind `PRESET`, and cutting a licensed track to the film (D-text-store-checks).
- `skills/setup-playwright/SKILL.md`: recording section points promo-video requests here.

---

## Key Technical Decisions

Approval gates, local voice and word captions, backdrops and Cloudflare images, with the 2026-10-21 research behind them: decisions/media-and-approvals.md.

### D-real-pixels: show only pictures the product itself produced [committed] · 2026-10-15

**Problem**
The playbook's rule is "never redraw product UI". Signing into staging from a simulator would enter credentials into a non-local host, and a device run needs a real account.

**Decision**
Chosen: screens from the product's own tests (Flutter goldens) or Playwright at a fixed viewport with the suite's demo fixtures; photos and logos from the brand kit or the user; an unbuilt app from the team's design exports, labelled a preview.
- No account, no network, any size, repeatable after UI changes.

**Rejected**
- Simulator screenshots signed into staging. Why not: credentials for a remote host and a demo account.
- UI or product images Claude draws. Why not: breaks the credibility rule.

**Consequences**
Fixture data shows on screen, so fake-looking values (`INV-1`) are fixed in the capture. A Flutter app with no network stubs falls back to simulator screenshots with a team-provided demo account.

**Status**: committed · **Reversible**: yes

### D-engine-and-story: one engine, one story file per film [committed] · 2026-10-15

**Problem**
The first template was the Autorentic film with its values spread across ten functions, then a `STORY` block inside the same file; either way every new film edited the engine, and the user wanted the skill for any product.

**Decision**
Chosen: `film.html` is never edited per film; it loads a `story.js` holding frame, colours, fonts, pictures, timings, captions, number scene and lockup. Frames: `phone`, `browser` (window chrome with an address bar), `none` (rounded card).

**Rejected**
- `STORY` block inside `film.html`. Why not: still invites edits to the engine and leaves Autorentic as the default.
- A separate template per frame. Why not: three copies of the springs, layout and camera to keep in step.

**Consequences**
The Autorentic film renders byte-identical stills on the new engine. Colours are semantic (`accent`, `accentSoft`, `highlight`, `surface`) with neutral defaults. Browser and frameless modes were checked on real 2880x1800 screenshots in all three sizes.

**Status**: committed · **Reversible**: yes

### D-cues-from-film: derive music cues from the story [committed] · 2026-10-15

**Problem**
A hand-written `cues.json` duplicated the film's timings; retiming a scene silently desynced the sound.

**Decision**
Chosen: the engine builds `window.cues` from the story; `node render.mjs cues ... cues.json` writes it for `score.py`.

**Rejected**
- Hand-kept `templates/cues.json`. Why not: drifts on every retime with nothing to catch it.

**Consequences**
Verified equal to the old hand-written file. Sound for a new kind of scene needs a line in `buildCues`.

**Status**: committed · **Reversible**: yes

### D-openfilm-borrow: take OpenFilm's checks, keep our engine [committed] · 2026-10-19

**Problem**
The skill said "time is the only input" and left every check to the agent's eye on a contact sheet. OpenFilm (github.com/openfilm/openfilm, v0.2.0, first commit 2026-10-04, MIT) has the same core (a page draws any `t`, headless Chromium, ffmpeg) and spends its effort on checking: its `look` draws each sheet frame twice in two shuffled orders and names any that changed, plus failed fonts, text cut off by the frame or its box (DOM walk), flat-colour clips, per-sound peak and mix LUFS, overlapping clips. Its film is a `film.html` of `<section>` tracks holding `<iframe>` pages, `<video>`, `<img>` and `<audio>` clips (`#t=in,out`, `at`, `speed`, `volume`), one shot per page, edited by hand in a local Studio; voice, music and images come from the user's own provider keys (`openfilm get`). Its renderer tags BT.709 and offers motion blur (sub-frames plus `tmix`), 4K and alpha. Its per-kind skills are short "what has to be true" lists, e.g. motion-graphics "nothing in it could be moved into another company's film" and screen-demo "nothing private in any frame".

**Decision**
Chosen: port the checks that fit a canvas engine into `render.mjs check` (two seeded shuffled passes compared by sha256, every 0.5 s plus the last frame; fonts; flat frames on a 24x24 downscale after 0.5 s; missing pictures and voice files; `score.wav` loudness via `ebur128`, warn off -14 LUFS by more than 1.5 or true peak above -1 dBTP; exit 1 on error), tag BT.709, and add the two review questions to the brief and capture steps.
- The determinism control was run both ways: an injected `Math.random()` in `draw` failed 11 of 41 frames; the unchanged film passed.
- Font check compares canvas text widths against monospace and serif fallbacks, because `document.fonts.check` answers true for a system family that isn't installed. Generic family names are skipped.

**Rejected**
- Switching to OpenFilm. Why not (superseded the same day by D-openfilm-default): two weeks old; the paid-keys point was wrong, since the trial ran on a free track and the `say` voice.
- Its cut-text check. Why not: it walks DOM text, and our text is drawn on a canvas (our engine already shrinks over-wide text).
- Motion blur and a hand editor. Why not: 30 fps without sub-frames was already chosen for UI motion; an editor is a product, not a skill.

**Consequences**
The flat-frame warning can fire on a sparse frame (a small logo on a plain page); it is a warning only. The starter story warns at 12 to 12.5 s, the gap between device exit and lockup.

**Status**: committed · **Reversible**: yes

### D-voice-over: optional, paid voice only by explicit VOICE_PROVIDER, `say` as a wiring draft [committed] · 2026-10-19

**Problem**
The user asked for voice-over as an optional feature. No TTS key exists on this machine.

**Decision**
Chosen: `voice: [{ at, text }]` in the story; `buildCues` emits `cues.voice` (`at`, `text`, `file` default `assets/voice/NN.wav`, `captionOut` = the `out` of the caption whose window holds `at`) only when lines exist, so voiceless cues are unchanged. `voice.mjs` uses macOS `say` unless `VOICE_PROVIDER=elevenlabs|openai` is set with its key (user decision 2026-10-19: a key alone never spends, and Claude warns before unreleased copy goes to the service); overrides `VOICE`, `VOICE_MODEL`, `VOICE_STYLE`; `VOICE_LINES=1,3` makes only those lines; files are remade only when a stamp (provider, voice, model, style, text) changes. It warns when a line runs into the next, outlasts its caption, or ends within 0.3 s of the film's end. The voice is made right after the story's first draft so captions are timed to it.
- Defaults: ElevenLabs voice `21m00Tcm4TlvDq8ikWAM` with `eleven_multilingual_v2`; OpenAI `gpt-4o-mini-tts`, voice `alloy`, `response_format: wav`. Both routes answered 401 without a key (a made-up route answered 404).

**Rejected**
- Subtitles from the voice. Why not: on-screen captions already carry the words, kept matching by hand.
- `say` as a timing reference. Why not: a real voice speaks at another pace; `say` proves the wiring and the duck only.

**Consequences**
`say` text starting with `-` needs `--` before it (fixed).

**Status**: committed · **Reversible**: yes

### D-openfilm-default: make films as OpenFilm projects, our engine as fallback [superseded 2026-10-21] · 2026-10-19

**Problem**
After 1.406.0 the user asked "but i thought alot the link i gave u can do?": the comparison had offered only things to copy. OpenFilm adds what ours lacks: a hand editor (Studio: retype and drag elements, trim clips on a timeline, named versions), any kind of shot (each shot is its own page, so 3D, WebGL, charts), real footage clips with trim and speed, exports (4K, motion blur, GIF, transparent, subtitles, Premiere/Final Cut/DaVinci timeline), ready film types (keynote, screen demo, lyric video and others), and media from the user's own keys. It is free (MIT, no account; only generated media is billed by the user's own service).

**Decision**
Chosen by the user: the skill keeps its brief, real-screens, true-number and review rules and makes each film an OpenFilm project the user edits in Studio; our engine stays as the fallback (offline, three aspect ratios from one timeline).
- Trial, verified: the Autorentic clip rebuilt as an OpenFilm project (on Syafiq's machine at `~/herd/openfilm-trial/autorentic`; 6 pages: hook, home, pay, paid, number, lockup, sharing `shared.css`/`shared.js` with the spring, masked reveal and camera; track 1 the pages, track 2 four voice clips, track 3 music). `npx -y openfilm@latest look` passes (12 frames drawn twice). Its check caught two real bugs on first run: swapped camera and tap arguments, and descenders clipped by the reveal masks (fixed with `padding: 0.2em 0; margin: -0.2em 0` on `.mask`). Studio opens at `127.0.0.1:4747` (Chromium browser; Brave works). Node 22.22 meets its 22.2 floor; the first run downloads a headless Chromium.
- Music in the trial: Mixkit "Motivating Mornings" (`https://assets.mixkit.co/music/33/33.mp3`, 96 s), cut from 9.2 s so its beat lands at 2.5 s, faded over the last 1.5 s, pre-ducked to 0.4 under the voice spans with an ffmpeg `volume` expression, loudnorm -16. Mixkit's licence wording sits in a page pop-up that neither curl nor WebFetch returns; it is unverified.

**Consequences**
Superseded on 2026-10-21 by the user ("Keep own engine, drop OpenFilm"), after the approval gates, local voice, word captions and depth backdrops were built into our engine (decisions/media-and-approvals.md). What a move would have cost, if it is ever reopened: timing lived in three places in the trial (`film.html` `at`, each page's duration, each `<audio at>`); pages hardcoded 1080x1920; no automatic dip under voice and the mix came out -20.2 LUFS; Studio caches media by file name; one OpenFilm project per aspect ratio.

**Status**: superseded · **Reversible**: yes

| Decision | Rationale |
|----------|-----------|
| Original music synthesized in numpy | Nothing to license; Claude can't hear it, so loudness, waveform timing and clipping are checked and the sound itself goes to a human ear |
| A missing picture draws a "missing" card instead of failing | Lets a story be blocked out before capture; the card is loud on a contact sheet and the renderer logs the 404 |
| Pictures whose shape differs from `shot` are cropped to fill, with a warning | Product photos arrive in mixed shapes; stretching distorted them silently |
| Text that would overflow shrinks to fit; text that fits is untouched | A longer hook ran off a vertical frame; the shrink only fires on overflow, so the Autorentic frames stayed byte-identical |
| `stat` count-up scene beside the `number` merge scene; no citable number means no number beat | The common promo figure ("99.9%", "3x faster") isn't a many-into-one fact |
| Side-layout camera zoom 60% for `browser` and `none`, 25% for `phone` | Desktop UI text in a widescreen frame was too small at a quarter of the zoom |
| 30 fps, no motion-blur subframes | 20 s renders in about a minute per format; the playbook's 60 fps with 4 subframes was not needed for UI motion |

---

## Critical Gotchas

### Rendering
| Issue | Rule |
|-------|------|
| zsh does not word-split `$TIMES`, so every still renders as `NaN` | Pass still times literally; `render.mjs` refuses non-numeric times |
| Whole phone at two-thirds of a 9:16 frame leaves UI unreadable; a desktop screenshot in 9:16 is smaller still | Camera keyframes push in to the part the caption is about |
| Captions ran into the picture only in 1:1 and 16:9 | Review a contact sheet per aspect ratio; side layouts use smaller captions and a quarter of the camera zoom |
| A 4:5 frame takes the side-by-side layout (`W/H < 0.8` is the vertical test) | Check with a still before promising 4:5 |
| Tiling stills of different sizes into one sheet distorts them | One contact sheet per aspect ratio |
| `-color_primaries`/`-color_trc` flags left the video tagged `unknown` once a `scale` filter ran (the filter's frame properties win) | Set them in the chain: `setparams=colorspace=bt709:color_primaries=bt709:color_trc=bt709:range=tv`. Untagged, `#2D6EE9` played back as `#256DEE`; tagged, `#2C6CE7` |

### Capture (Flutter)
| Issue | Rule |
|-------|------|
| Every glyph renders as a box in goldens | Load each font with `FontLoader` before the first pump |
| Icon font missing | Family is `packages/<package>/<family>`, file in the pub cache |
| DEBUG ribbon in every capture | `WidgetsApp.debugAllowBannerOverride = false` |

---

## Last Session

- Second research round (four haiku research agents, three haiku claim-checkers on the source pages): ranked five improvements, the user chose four and they were built (decisions/media-and-approvals.md#research-round-two, D-text-store-checks).
- Verified: Autorentic passes every new check and its stills and cues are byte-identical to the previous engine; a deliberately bad story (phone at 5.5 s, a 0.4 s caption, "Best deal: RM 30/mo from March 2027.") fires every new warning; a logo-only story gets the information line; backdrops error under the App Store preset; an 886x1920 App Store encode probes as High 4.0, 30 fps, BT.709; a hidden ffprobe warns rather than passing.
- `/done` reviews: the product reviewer moved the store rules into the brief step, set the music mux to 256k stereo, made logo-only films informational, measured voice pace without subtitles, and found App Review 2.3.4 (screen captures only). The code reviewers tightened the price and date patterns, skipped captions with no `out`, matched the board's threshold to the preset, and surfaced a missing ffprobe.
- Autorentic re-cut with every feature, approved at both gates by the user: generated KL skyline with depth behind hook and lockup, Kokoro voice at `VOICE_SPEED=0.8` with lines that differ from the headlines, five-word subtitles, lockup "Tenant app on iOS and Android" (user: the app is live), four cuts including App Store. The reading check drove three rounds (slower voice, five words, one word cut from line 3), and the review swapped voice line 4 to "Settle them all at once." because it repeated the on-screen number. It exposed three skill defects, fixed: `voice.mjs` timed lines by file length, so trailing silence (0.8 s on Kokoro) raised false "still speaking" warnings; a lone last word got its own 0.79 s caption; the reference gave no starting `VOICE_SPEED` for subtitled films.

---

## Next Steps

### Blocking release to colleagues
- [ ] 🔴 Commit and ship the 2026-10-21 upgrades after the other session's staged version/CHANGELOG work lands; changelog tells colleagues to run `setup-local.sh <parts>`
- [ ] 🔴 Trigger test in a session started after the upgrades ship ("make a launch clip for X" without the skill name)

### Next build
- [ ] 🟡 Read the Neuron cost of one Klein 4B still in the Cloudflare dashboard (first `image.mjs` run worked 2026-10-21)
- [ ] 🟡 Read Mixkit's music licence in a browser before any Mixkit track goes into a published film
- [ ] 🟡 Data-driven batch mode (one story template, one record per clip), from the GitHub Unwrapped and Spotify Wrapped cases
- [ ] 🟡 Platform presets: a 4:5 size and caption margins clear of the Reels/TikTok buttons (published figures disagree, so make them settings). App Store and Google Play are done (`PRESET`); subtitles sit at 0.8 H in vertical, which may fall under the Reels buttons
- [ ] 🟡 Flash check (WCAG 2.3.1, three flashes a second): ranked fifth and not chosen; needs a pass over every frame, not every 0.5 s
- [ ] 🟡 Ask Apple's rule before the first App Store upload: 2.3.4 allows "video screen captures of the app itself", and the engine animates stills inside a device frame; nothing on Apple's pages settles whether that passes
- [ ] 🟡 A probe of the final muxed MP4 for store uploads (size, fps, audio codec and bitrate, length); `check` sees only the story and `score.wav`
- [ ] 🟡 Voice pace mixes sources: when some lines have word timings and others don't, the untimed lines go unmeasured

### Deferred / accepted
- [ ] 🟡 First real ElevenLabs or OpenAI voice run: request shapes and default voice id unconfirmed until then
- [ ] 🟡 `setup-local.sh` on Linux: the CPU torch and faster-whisper branches have never run
- [ ] 🟡 The final music mux (SKILL.md §5) uses `-shortest` with `-c:v copy`, so a `score.wav` shorter than the clip would cut it; safe while loudnorm keeps the score at film length
- [ ] 🟡 A brief skeleton beside the starter story: the Autorentic `docs/brief.md` is the working example until then
- [ ] 🟡 A first real `browser` or `none` film: both modes are tested on screenshots only, never shipped as a clip
- [ ] 🟡 Scrolling through a long page: not built; the skill says to push between viewport captures at different scroll offsets
- [ ] 🟡 Stills of two stories in one folder overwrite each other (`out/stills/<w>x<h>_<t>.png` carries no story name)
