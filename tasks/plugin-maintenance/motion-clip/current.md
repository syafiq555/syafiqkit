<!--LLM-CONTEXT
Status: 🚀 Shipping in 1.399.0; trigger test still pending
Domain: plugin-maintenance / motion-clip skill
Gotchas (critical; full list in ## Critical Gotchas below):
  - A trigger test only means something in a session started after 1.399.0 was written
  - film.html is the engine and is never edited per film; each film is a story.js
Related: tasks/plugin-maintenance/skill-authoring/current.md
Last updated: 2026-10-15
-->

# syafiqkit: motion-clip skill

## Quick Start (read this first in next session)

**Where we are**: `/motion-clip` (1.399.0) makes 15 to 30 second promo videos for any product (app, website, physical product, brand) from real pictures, as code, in three formats, with an original music bed. Built from one real run (the Autorentic tenant-app launch clip at `~/herd/autorentic-launch-clips`), reviewed twice, generalised on the user's ask, not yet committed.

**Immediate next actions (in order)**:
1. In a new session, ask "make a promo video for <product>" without naming the skill and confirm it loads.
2. Make a first real `browser` or `none` film (Next Steps).

**Key facts for cold start**:
- Files: `skills/motion-clip/` with `SKILL.md`, `scripts/render.mjs`, `scripts/score.py`, `templates/film.html` (engine), `templates/story.js` (starter), `templates/examples/autorentic.story.js`, `references/capture-real-ui.md`.
- Regression test: in `~/herd/autorentic-launch-clips` (still on the original single-file engine) run `PLAYWRIGHT_DIR=~/herd/autorentic node render.mjs stills 1080 1920 x 4.5` for the baseline; then copy the skill's `templates/` and `scripts/render.mjs` beside that clip's `assets/` in a scratch folder and run the same with `STORY=examples/autorentic.story.js`. The two PNGs must be byte-identical (they were at 20 timestamps across three sizes on 2026-10-15).

**Gotchas that will trip you**:
- Every path `render.mjs` reads or writes resolves against the script's own folder, not the shell's.
- `python3 -I` hides numpy (it lives in user site-packages); run `score.py` with plain `python3`.

---

## Overview

Came from a third-party PDF playbook ("the prompt is 10%, the harness is 90%": a renderer drawn from time `t`, contact-sheet self-critique, springs, sound on a beat grid, three aspect ratios). The session applied it to the Autorentic tenant app, packaged it as a skill, and on the user's instruction ("it's to be meant for anything, not Autorentic only") generalised it: three frames (`phone`, `browser`, `none`) and a per-film story file. Not covered: voiceover, character animation, long teaching videos, and UI Claude would have to draw.

---

## Files

- `skills/motion-clip/SKILL.md`: steps 0 to 6 (tools check, brief, gather pictures, write the story, self-review, music, deliver) and what it does not cover.
- `skills/motion-clip/templates/film.html`: the engine. Loads `story.js` (or `?story=`), defaults every optional field and fails fast with a named error on a bad story, springs, masked text reveals that shrink to fit, phone / browser / frameless frames, pictures cropped to fill, camera, layouts per aspect ratio, a "missing" card for uncaptured pictures, `number` and `stat` scenes, `window.cues`. A film with no `screens` runs on hook, stat and lockup alone.
- `skills/motion-clip/templates/story.js`: starter, a 15-second browser film with placeholder words and system fonts.
- `skills/motion-clip/templates/examples/autorentic.story.js`: the finished 20-second phone film.
- `skills/motion-clip/scripts/render.mjs`: serves the folder over HTTP, drives Chromium; modes `stills`, `video` (PNG frames into ffmpeg, H.264 yuv420p CRF 16) and `cues`; `STORY` env picks the story file.
- `skills/motion-clip/scripts/score.py`: numpy music bed plus taps, whooshes, chimes from a cues JSON; `mood` picks `bright` (Fmaj7, Am7, Bbmaj7, C6, the original), `calm` (half-time kick, no clap) or `dark` (Dm7, Bbmaj7, Gm7, A7sus).
- `skills/motion-clip/references/capture-real-ui.md`: the Flutter golden-test capture.
- `skills/setup-playwright/SKILL.md`: recording section points promo-video requests here.

---

## Key Technical Decisions

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

### Capture (Flutter)
| Issue | Rule |
|-------|------|
| Every glyph renders as a box in goldens | Load each font with `FontLoader` before the first pump |
| Icon font missing | Family is `packages/<package>/<family>`, file in the pub cache |
| DEBUG ribbon in every capture | `WidgetsApp.debugAllowBannerOverride = false` |

---

## Last Session

- Read the playbook PDF, built the Autorentic launch clip (three formats, then music), packaged it as `/motion-clip` and registered it (1.399.0).
- `/done`: two review rounds fixed 17 script and engine bugs; a product review added the tools check, three-format commands and cues derived from the film.
- Generalised for any product on the user's correction: engine plus `story.js`, `browser` and `none` frames, neutral starter story, Autorentic kept as an example.
- Third `/done` (whole-tree release review): the §3 preview line was wrong on two counts and is corrected. A story opened from disk does load in Chromium; only brand fonts are unreliable. A missing picture draws the "missing" card and no on-page error, which only a story or font failure shows.
- Second `/done`: 8 engine fixes (hangs on a bad story, missing `shot`, non-hex colours); then logo-only films, `stat` scene, photo cropping, text fit, wider-frame zoom and music moods, from a product review that walked five kinds of film.

---

## Next Steps

### Blocking release to colleagues
- [ ] 🔴 Trigger test in a session started after 1.399.0 ("make a launch clip for X" without the skill name)

### Deferred / accepted
- [ ] 🟡 Voiceover: deferred, no TTS dependency anywhere in the plugin yet
- [ ] 🟡 A brief skeleton beside the starter story: the Autorentic `docs/brief.md` is the working example until then
- [ ] 🟡 A first real `browser` or `none` film: both modes are tested on screenshots only, never shipped as a clip
- [ ] 🟡 Scrolling through a long page: not built; the skill says to push between viewport captures at different scroll offsets
- [ ] 🟡 Stills of two stories in one folder overwrite each other (`out/stills/<w>x<h>_<t>.png` carries no story name)
