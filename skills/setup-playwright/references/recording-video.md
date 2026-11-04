# Recording a Playwright run as video

Detail behind the "Recording the run as video" section of `../SKILL.md`. The rules stay in SKILL.md; this file holds the reasoning, the measured failure modes and the literal commands.

## Why record {#why-record}

A recorded pass is the cheapest way to see the product. A reviewer watching the flows catches spacing, truncation, clipped modals and copy problems that no assertion encodes, because a spec asserts only what someone thought to assert. The flows already exist once a suite covers real user journeys, so the marginal cost is a flag. A designed launch or promo video is a different job, handled by `motion-clip`.

## Context creation {#context-creation}

`use.video` reaches only the contexts the runner builds for its own `page` fixture, and files them under the per-test output dir. Specs that build contexts by hand, such as any multi-party flow holding two sessions open at once, need the context-level `recordVideo` option instead.

Set one and half the suite silently records nothing while the config reads as done. Set both and the halves land in two directories, so gather them afterwards, or the missing half reads as "that spec didn't record."

## Verify a frame {#verify-frame}

Extract a frame near the end and view it:

    ffmpeg -sseof -0.6 -i video.webm -frames:v 1 out.png

A green suite masks these invisible failures, and a still frame shows each one:

- the dev server serving stale code;
- an app that serves built assets (no Vite dev server running) serving the last `build` rather than your edit. This is the trap `uiux`'s "Verify by Looking" covers. Rebuild before grading either a recording or a spec's screenshots;
- encoding stopping when a context closes before the subject lands on screen;
- a recording capturing the wrong half of the page, because assertions resolve below the fold while locators stay off-camera.

A pass count catches none of these. Do the frame check before the file reaches the user, not after: the moment of sending is where a green count makes an unwatched file look verified.

## Encoding and naming {#encoding-naming}

Encoding stops the moment a context closes, and a spec ends on its last assertion, so a fast test records its loading state and nothing else. Hold each context open briefly before closing, behind the same flag that turns recording on, so a normal run pays nothing.

A hand-built context's video lands under a content hash the runner reports nowhere, so number-by-creation-time makes every video anonymous. The mapping is recoverable only from inside the test while the page is still open, where the video handle resolves to its path. Record it there, keyed to the test title, and rename during collection. Route every context through one close helper so naming and the tail wait have a single home. A context closing by itself skips both, and the missing name is the visible symptom of a truncated recording.

## Placement of launchOptions {#placement}

Slowing the run down and widening the viewport are per-worker settings, so `test.use({launchOptions: {slowMo}})` cannot sit inside a `describe` block. Playwright rejects it with:

    Cannot use({ launchOptions }) in a describe group, because it forces a new worker

General shape: anything the worker is launched with is file-scoped; anything about how a test executes can be block-scoped.

## Viewport framing {#viewport-framing}

A recording is a viewport, not the page: content below the fold is absent, and a modal taller than the viewport looks cropped. The framing (scrolling the subject into shot, and any interaction the spec skips) sits behind the recording flag and is a no-op otherwise. Scrolling alone still films an empty element when the subject only populates after an interaction.
