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
