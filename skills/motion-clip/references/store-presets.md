# App Store and Google Play videos {#store-presets}

A store listing clip has rules a social clip doesn't. `PRESET=app-store` or `PRESET=google-play` on `render.mjs check` adds them to the check, and `PRESET=app-store` on `video` also encodes to Apple's spec. Every figure here was read on the store's own page on 2026-10-21; re-read the page before promising one to a client, since the stores change them.

## App Store app preview {#app-store}

From App Store Connect's app preview specifications (developer.apple.com/help/app-store-connect/reference/app-information/app-preview-specifications) and Apple's app preview guidance (developer.apple.com/app-store/app-previews/):

- **Length**: 15 to 30 s ("Minimum length 15 Seconds", "Maximum length 30 Seconds"). Up to three previews per language. `check` errors outside it.
- **Size**: one of the accepted resolutions. Current iPhones take 886x1920 portrait (1920x886 landscape); 5.5-inch iPhones 1080x1920; the iPhone SE (2nd and 3rd generation) and 6 to 8 750x1334; iPad 1200x1600 (or 900x1200 for the 12.9-inch 2nd generation); Mac 1920x1080. Each also comes turned landscape. `video` refuses any other size under the preset and `check` warns on one. The layout at 886x1920 was checked on the Autorentic film (2026-10-21): captions, phone and lockup fit as at 1080x1920.
- **Encoding**: H.264 High Profile up to Level 4.0, at most 30 fps, target bit rate 10 to 12 Mbps, file at most 500 MB. The preset encodes at 11 Mbps with a 12 Mbps ceiling. A film of mostly still frames comes out well under that; this is not a fault.
- **Audio**: 256 kbps AAC, stereo, 44.1 or 48 kHz. SKILL.md's mux line already uses `-c:a aac -b:a 256k -ac 2 -ar 48000`.
- **Cover frame**: "Default poster frame setting 5 Seconds". The frame at 5 s shows before the preview plays, so the product must be on screen then; `check` warns when it isn't.
- **Content**: "Don't include specific prices", "Avoid any seasonal or timely references that will age your video, such as 'new for spring' or dates", "Don't film people interacting with a device, such as an over-the-shoulder angle or fingers tapping the screen". The engine's tap rings are touch hotspots, which the same page allows, along with dissolves and fades. Text must remain "on the screen long enough for people to read". `check` warns on a price or a date in the story's words; it can't see text inside a captured screen, so read the sheet for those (the Autorentic screens show "RM 1,649.91" and due dates: recapture with demo data that has neither, or crop past it with the camera).
- **App Review 2.3.4** (developer.apple.com/app-store/review/guidelines/): "previews may only use video screen captures of the app itself... You can add narration and video or textual overlays to help explain anything that isn't clear from the video alone." So `check` errors on `backdrops` under the preset. Two things it can't settle, so tell the user before they upload: the engine animates still screenshots rather than recording the app, and draws a phone or browser frame around them. Neither is named on Apple's pages; a reviewer may still read either as something other than a screen capture. Where the user wants no risk, use `frame: 'none'` and a real screen recording edited elsewhere.

```
PRESET=app-store node render.mjs check 886 1920
PRESET=app-store node render.mjs video 886 1920 out/clip_appstore.mp4
```

## Google Play preview video {#google-play}

From Play Console help (support.google.com/googleplay/android-developer/answer/9866151):

- **Delivery**: a YouTube URL in the "preview video" field, not a file. The video must be public or unlisted, embeddable, not age-restricted, with ads turned off (monetisation off). Upload the normal 16:9 or 9:16 render; the encode doesn't change. A real track with a monetisation claim can bring ads back ("turning off monetisation for your video may not be enough to prevent ads"), so use the generated score or a track that is not "Content ID registered".
- **Playback**: it "may auto-play inline with muted audio for up to 30 seconds", so captions carry the message and the first 30 s are what most people see. `check` warns past 30 s.
- **Content**: show the app "as early as possible within the first 10 seconds" and aim for "at least 80% of the video to be representative of the user experience". Under this preset `check` uses 10 s instead of 3 s for the product, and warns on "Best" or "Download now". "Do not leave black bars on either side of a portrait video": the engine's layouts fill the frame, so this only bites a hand-made export.

```
PRESET=google-play node render.mjs check 1920 1080
```
