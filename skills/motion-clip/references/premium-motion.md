# Richer motion: spotlights, cursor, tilt, photos {#premium-motion}

Every field here is optional, and a story that sets none of them renders exactly as before. Reach for them when a plain device beside captions reads as basic, which on a training or launch film it usually does.

## Which move does what {#which-move}

The moves split by whether they help a viewer follow the screen or only dress the film. A training clip leans on the first group; a hype clip can use more of the second. Research basis (2026-10-22): signalling cues have meta-analytic support for learning (d = .38 over 29 studies; g = .53 for retention over 103), and "if two things move at once, the viewer watches neither", so order each beat as caption, then camera, then tap.

| Field | Helps the viewer follow | What it does |
|---|---|---|
| `spotlights: [{ from, to, rect: [x, y, w, h], dim, lift, ease }]` | yes, the strongest | Dims the screen except `rect` (fractions of the screenshot), lifts the target slightly with a shadow and an accent ring. Keep each spotlight clear of the camera move and tap around it. `dim` defaults to 0.55, 0.4 on `browser` |
| `cursor: true` | yes, on `browser` | Taps draw an arrow travelling on a curve that arrives just before `at`, then presses with a ripple, instead of the finger dot |
| `softText: true` | neutral | Captions, hook and lockup enter and leave with a blur-to-sharp beside the rise |
| `motionBlur: { samples, shutter, threshold }` | neutral | Averages `samples` (8) draws across half a frame, only on frames where the camera, a screen push, the device or a photo is moving. A render takes about four times as long |
| `tilt: { enter, leave, x }` | no, decoration | The device swings in and out in 3D (WebGL perspective; radians, default 0.55 / -0.45 / 0.18). Entry and exit only, because a tilted screen is unreadable mid-step |
| `ambient: { alpha, colors }` | no, decoration | Slow brand-colour gradients drift behind everything instead of a flat page |
| `photos: [{ file, from, to, rows, focus, zoom, origin, drift, scrim, accent }]` | context | A full-frame photo opens from a card at `origin`, drifts (`zoom` from-to, `focus` point), and with `rows` carries white captions over a dark scrim. One spanning 0 to `device.enter` replaces the hook |
| `products: { from, to, files, y, every }` | context | Packshots on white cards pop in one by one, usually under the lockup |

## Getting the rectangles {#rectangles}

A spotlight `rect` is in fractions of the screenshot. Overlay a grid on the shot (`ffmpeg -i shot.png -vf "scale=390:844,drawgrid=w=39:h=84.4:t=1:c=red@0.5"`, ten cells each way) and read the target off it, or record the element's box in the capture spec as `taps.json` already does. Check every spotlight on a still: a rect a row off lights up the wrong control and reads as confident.

## Pictures and sound for these films {#pictures-sound}

- **Product photos**: a Shopify store publishes `/products.json` with each product's image URLs; the client's own packshots are the honest product shot.
- **Stock**: Pexels serves photo files to scripts at `https://images.pexels.com/photos/<id>/pexels-photo-<id>.jpeg?auto=compress&cs=tinysrgb&w=2400`; find ids through search. Mood only, never presented as the client's customers or staff, and listed in the README.
- **Voice**: `VOICE_SPEED=0.85` read about 3 words a second with `af_heart`. Spell a product code the way it is said ("C.R.P. forty-five"). Nobody in the session can hear the mix, so transcribe `score.wav` with the local Whisper (`mlx_whisper`) and check every line comes back right at its time.
- **A licensed track**: 📖 `real-track.md`; `score.py --track` mixes it.

## Camera size and layouts {#camera-size}

A whole screen shown at two-thirds of a 9:16 frame leaves its UI unreadable on a real phone, and a desktop screenshot in a vertical frame is smaller still, so zoom to the part the caption is about. Side-by-side layouts use smaller captions and less camera zoom (a quarter for `phone`, 60% for the wider frames), or the text runs into the picture. A browser shot in widescreen still needs a strong push-in for its UI text to read. One camera rarely frames both shapes well, since the vertical cut uses the full zoom and pan while side-by-side damps them: the renderer sizes the page to the output, so a story wrapped in its IIFE can read `const V = window.innerHeight > window.innerWidth` and give 9:16 its own keyframes (or its own picture files) per beat. Text too long for its space shrinks to fit, and `check` warns when a caption shrinks below 80%: split that row into shorter ones. A 4:5 frame falls on the side-by-side side of the split; check it with a still before promising one.

## Room presentations {#room-presentation}

A film played in a room while someone presents (a pitch, tender or keynote) reads best as full-frame `photos` with a `focus` and `zoom` push-in per screen and short labels. Side by side in 16:9, the screen takes half the frame and the camera zoom is damped, so UI text is unreadable from the back of a room. Keep a `rows` subject above the caption band: a strong `scrim`, and a `focus` that puts the subject in the upper 60% of the frame.

## Personal photo films {#photo-film}

An anniversary, birthday or family film is a run of full-frame `photos` with `frame: 'none'`, no screens and an optional `stat` ("3 / tahun kita") before the `lockup`. The brief's "could it belong to someone else" answer is the captions: each names a real moment of theirs, from the person's own words.

- **Overlap the photos.** With each `to` equal to the next `from`, the old photo fades while the new card is still opening, and the page colour flashes at the edges for a few frames. Set each `to` about 0.6 s past the next `from`: the next card is drawn on top, so the old caption never shows through.
- **Landscape photos in 9:16 keep one face.** A 3:2 photo cropped to 9:16 keeps about a third of its width. Pre-composite each one whole on a blurred, darkened copy of itself (ImageMagick: clone resized to fill and blurred, then the photo resized to the frame width and centred) and use that file.
- **Choosing from a phone library** is the slow part. On macOS the Photos library's own index (`Photos.sqlite`, read from a copy) already tags people and scores each photo, so pick a person's photos per month by score, export them by id through Photos' AppleScript, and show the user a numbered contact sheet to choose from. Never pick from albums by name alone: they mix in receipts and screenshots.

## Number beat examples {#number-examples}

`stat` takes `{ at, out, value, prefix, suffix, label, source }` and counts up to a figure with a label and optional source. `number` merges dropped cards into one pill for a "many become one" fact.

`stat` examples: "99.9%", "3x faster". `number` examples: twenty bills merged into one payment, twelve tools merged into one app.

## Opening logo, studio credit and end card {#studio-credit}

`opening: { logo, out }` draws the client's logo above the hook from frame 0 (it shrinks to fit the space above the hook; without `out` it stays). A film made for a client by a studio that signs its work takes `credit: { file, label: 'Prepared by', windows: [[0, 2.6], [lockupAt + 1, null]] }`: the studio's logo bottom-centre, at least 35 px tall (`minHeight`), in each window (`null` holds to the end). The studio's own end card after the client's lockup is `outro: { at, bg, ink, logo, font: { family, file, weight }, tagline, lines: [['Label:', 'value'], ...] }`: a full-frame panel in the studio's colour slides up, then its logo, tagline and contact groups rise in, with a whoosh and chime added to the cues. Extend `duration` by about 4 s for it, end the `credit`'s last window before `at`, and take colour, font and logo from the studio's brand guide: a logo whose accent mark is the panel's colour vanishes, so use an all-white version on a coloured panel.

## Counters for before and after {#counters}

A before/after or app-versus-app film counts effort with `counters: [{ from, to, label, color }]`: a pill under the captions showing how many `taps` have landed between `from` and `to`, so each side's count comes from the same taps the viewer sees. Give both sides the same seconds per tap, or the edit, not the product, decides which looks slower.
## Logo blend {#logo-blend}

The logo blends with `multiply`, which suits white; on a dark page set `logoBlend: 'source-over'` and use a transparent PNG. A logo whose PNG has an off-white box shows as a pale rectangle on a tinted page even under `multiply`: turn its whiteness into alpha and draw it `source-over`.

## Client walkthroughs on a phone {#walkthrough}

Each beat is a composed still from `product-still`: the claim, a tight desktop crop and, on customer beats, the real phone screen, phone-first in 9:16, with a voice-over and word-timed subtitles.

A client walkthrough of a web app that people will watch on a phone uses full-frame `photos`, not a device beside captions, as the room-presentation films do. Capture desktop at a real laptop width (1440x900) and phone at 390, never an in-between viewport the client would not recognise as either. A browser-frame walkthrough scoring 16/20 (20/11/2026) was replaced by this format at the user's ask.

## News-style explainer screens {#explainer}

For a teaching film shaped like a news explainer (one fact per screen, no device), `explainer` replaces hook, captions and device. Start by copying `templates/examples/einvoice-explainer.story.js`; voice-led screens need `voice.mjs` then `words.py` before `atWord` or `headWord` resolve (📖 `voice-captions-backgrounds.md#voice-over`).

**9:16 safe zone, before the first draft:** text and diagrams stay within x 120 to 780 wherever they sit below y 840, where TikTok's buttons cover x 780 to 960; a `flow` or `dots` label that runs right gets `lift`, subtitles take `{ x: 0.41, width: 0.6 }`, `lockup.cy` lifts the end logo, and `PRESET=tiktok node render.mjs check` after the first draft names any line that slipped. Each screen is a small spaced-caps kicker over a big headline that types in word by word, an underline bar that grows under its last line, and an optional diagram building below. Learned from a Malay emergency-alert explainer that held 105 s on one fact per screen (28/11/2026); the first film is the Autorentic e-Invoice explainer (`examples/einvoice-explainer.story.js`).

| Field | What it does |
|---|---|
| `explainer: [{ at, out, kicker, headline, mark, size, step, accent, build, source }]` | One screen each. `mark` lists words drawn in `highlight`; `step` is seconds per word (0.11); `size` scales the headline; `source` prints a muted line under the diagram. Give the first screen `at: -1` so frame 0 is complete |
| `build: { kind: 'icon', icon, align, size }` | A line icon (`doc`, `receipt`, `house`, `share`, `alert`, `check`, `cross`, `bell`, `phone`, `person`, `gov`, `calendar`, `money`) draws itself inside a pulsing ring |
| `build: { kind: 'checklist', items, mark, every }` | Rows that tick (`check`) or cross out and strike through (`cross`) one by one; crosses use the `danger` colour |
| `build: { kind: 'cards', items: [{ text, sub }], every }` | Stacked cards with an accent edge, like a spec list |
| `build: { kind: 'bar', max, value, maxLabel, maxValue, valueLabel, valueText, delay, alert }` | A threshold bar, then the example value grows against it; label an invented value as an example, in the film's language |
| `build: { kind: 'picture', file, crop: [x, y, w], ratio, wide, bottom, push }` | A real screenshot in a card, cropped to the part being talked about (`crop` in fractions of the picture), with a slow push |
| `build: { kind: 'flow', nodes: [{ icon, label }], cross, crossAt, bypass: { label, color }, bypassAt, light, lightAt, lightEvery, wide, width, radius, maxR, labelSize, lift, dot }` | Icons joined by arrows that draw in turn: a process (rent day, invoice, payment, receipt) that can light step by step, or a route with one step crossed out and a curved bypass arrow ("You, LHDN, Tenant": LHDN crossed, "Receipt" goes direct). `lift` raises it when a right-hand label would dip into TikTok's buttons column. `dot: { at, period }` sends a dot along the route, blocked at the crossed node, then along the bypass; `dot: { loop: true, segment, back }` loops a process with a dashed return arc (`loopDrop`). `radius` is a fraction of each node's cell: keep every arrow at least about 60 px, so 3 nodes across 660 px stay at or under 0.33 (0.45 left 2 px arrows, 29/11/2026); the flow cannot simply widen, since labels below y 840 must stay left of x 780. A bypass label on a tinted page wants `color: 'ink'` for contrast |
| `build: { kind: 'dots', count, cols, icon, wide, every, highlight, highlightColor, bare, lines: [{ text, color, size, heading, delay }] }` | Two uses. A grid of icons popping in one by one (ten tenants), or a scale picture: highlight the first N icons (one red house among 42 shows "the limit is 42 of you"), `bare` drops the circles so a dense grid stays readable, and `lines` add the labels under it |
| `build: { kind: 'stamp', label, value, size, stamp, stampSub, stampAt \| stampWord, stampX, stampY, stampTilt, countFrom, countTo }` | A big figure ("RM3,000,000") under a small label, then a rubber stamp ("EXEMPT", "for now") slams onto it with a ring. Put the payoff on screen from frame 0 (`stampAt` before 0) when the hook asks a question viewers decide on within 3 s |
| `build: { kind: 'share', value, max, percent, bigSize, bigLabel, barH, maxText, maxTextColor, valueText, valueColor, countAt }` | "How small is mine": a limit bar fills, the example's sliver pops at its true share, then the percentage counts up big beside a two-line label. Text on the bar's tint wants `ink` (teal on mint measured 3.4:1) |
| `build: { kind: 'quote', title, text, mark, markWord, size, width }` | The source's own words as a document card: a spaced-caps title ("LHDN guideline v4.8, 1.6.1(e)"), the quoted text, and a highlighter sweeping across `mark` on a spoken word. Quote verbatim with `...` for cuts, trimmed to the clause that carries the claim so the card clears the subtitle pill |
| `then: { ...build, atWord }` with `build.untilWord` | A second build on the same screen: the first ends on `untilWord` and the second starts (an invoice, then its receipt) |
| `build.atWord`, `atOffset` | Starts the diagram on a spoken word from `words.json` instead of after the headline, so it lands with the voice |
| `build.crossed`, `crossAt`, `label`, `labelColor` (icon) | Crosses the icon out at `crossAt` seconds and prints a label under it ("Required?") |
| `build.chip`, `chipColor` (picture) | A labelled tag on the screenshot card's top-right corner ("Receipt", "Invoice") |
| `headWord`, `headOffset` | Starts the headline on a spoken word |
| `typeSync: true`, `typePace`, `headLead`, per screen `sync`, `pace` | With `type`, each headline word types when the voice says it or on a `typePace` beat (0.32 s), whichever comes first. Pure voice-matching left headlines blank 2 s or more, since headline words rarely match the spoken ones. `headLead` (0.18 by default) is the gap after the kicker; 0.06 starts typing at the cut. Set `sync: false` on a hook that must be typed complete in frame 0 |
| `explainerMotion: 'calm' \| 'punch' \| 'type'` | `calm` slides words up; `punch` pops words with a spring, zooms each screen in and out, and slams crosses on like a stamp; `type` types letter by letter with a blinking cursor, typing clicks and hard cuts. With `type`, start the first screen around `at: -2.2` so frame 0 is fully typed |
| `mascot: { file, x, bottom, height, spans: [{ from, to, x, height, hopWords }] }` | A brand character that pops in and sways during the given spans (Bucky on a share screen and end card); `hopWords` makes it hop on a spoken word (reacting to the hook's stamp) |
| `explainerCard: { fill, alpha, stroke, strokeAlpha }` | Card colours for checklist and cards builds, for a light page where white cards vanish |
| `explainerLogo: { size, y, alpha }` | A small logo top-left while any explainer screen shows |
| `explainerLayout: { row, bottom }` | Diagram text size (fraction of width, 0.056) and where the diagram area ends (fraction of height, 0.56) |

Sound comes with it: `cues` gets a click per headline word and per checklist row, a whoosh per screen, and `build.alert: true` lays a two-tone alert sting on the diagram's key moment (`stampWord` and `alertWord` put one on a spoken word) (`clicks` and `alerts` in `score.py`).

In 9:16 everything left-aligns to x 124, and diagram text stays inside the left 60%, because TikTok's buttons cover x 780 to 960 below y 840; subtitles then take `{ x: 0.41, width: 0.6 }` to clear the same column, and `lockup.cy` lifts the end logo above it. A voice-led explainer retimes faster from the recorded lines than by hand: lay the lines back to back, start each screen 0.1 s before its line, and end it 0.1 s before the next.
