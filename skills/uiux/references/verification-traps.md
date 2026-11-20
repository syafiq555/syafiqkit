# Verification traps: when a screenshot lies

A screenshot of your changes should prove the change works. Common traps where it silently doesn't.

## Stale bundle: the change didn't deploy

A dead dev server serves its last built bundle plausibly wrong, so a vanished control reads as broken conditional, a shifted layout reads as bad spacing, a failed selector reads as regression. Checking the server *process* fails here — it outlives its source file.

Instead, verify the bundle is present, fetchable and newer than your edits.

Measured 2026-09-10: live processes with the hot-reload gone, a three-week-old bundle served, an hour spent explaining a blank page with its own recent edits. If you are explaining something you SAW with something you WROTE and the two are not connected, suspect the bundle first.

## Full-page capture: fixed elements land in the wrong place

A full-page screenshot stitches the whole document into one image, but a `position: fixed` or `sticky` element (a bottom action bar, a pinned header, a sidebar) is drawn once at its viewport offset. In the composite it sits mid-page over whatever content happens to be there, so a correct sticky bar looks like it covers a form field, and a broken one looks the same. The composite can neither prove nor clear the defect.

Judge any fixed or sticky element from viewport-sized shots at the scroll positions a user actually sees (top and bottom at minimum), plus a measured overlap check: `getBoundingClientRect()` of the fixed element against the content it might cover, after scrolling to the end. Never call a composite defect "just a capture artefact" without that check, because the dismissal and the real defect produce the same picture. Measured 2026-10-12: a sticky order bar was waved off as a full-page artefact, the user flagged it, and only a viewport capture at both scroll ends settled it.

## Phone browser chrome: Playwright draws no Safari toolbar

A bottom bar, a safe-area padding or a `100dvh` sheet can pass every Playwright phone viewport and still sit wrong on an iPhone, because Playwright's WebKit renders no Safari toolbar and no home indicator. Two facts decide it:
- `env(safe-area-inset-*)` is 0 on iOS unless the viewport meta includes `viewport-fit=cover`. Padding written with it does nothing on the default `width=device-width, initial-scale=1`, and the CSS still reads correct.
- iOS 26 Safari's toolbar floats; while it is expanded the page stops above it, so a fixed bottom bar looks fine. The risky state is after a scroll collapses the toolbar, when the page reaches the home-indicator strip. Adding `viewport-fit=cover` makes the page edge to edge, so landscape then needs left/right insets on the notch side.

On a Mac with Xcode, `scripts/ios-safari-capture.sh open <url>` boots an iPhone simulator and opens the page in real Safari (Herd's `http://*.test` sites resolve inside it; for `https://*.test`, first `xcrun simctl keychain booted add-root-cert` Herd's `LaravelValetCASelfSigned.pem`); `scripts/ios-safari-capture.sh shot <file.png>` captures it. A session can drive Safari with macOS `CGEvent`s once the terminal has Accessibility and Simulator is brought to the front: a click taps, System Events `keystroke` types into the focused field, scroll-wheel events scroll the page but leave the toolbar expanded, and a drag collapses the toolbar (a drag right after a tap reads as a double tap and zooms; reload resets). Safari also zooms the page when a field under 16px takes focus and keeps the zoom afterwards, so a capture taken after typing looks cut off on the left: that zoom is a defect to report, not a capture artefact. The simulator is one per machine and shared with every session, so check `ListAgents` for a peer driving it before typing into it (20/11/2026: a peer's tap and login typing landed on another session's page). Capture each fixed element with the toolbar expanded and collapsed.

## E2E vs screenshot

Screenshots verify static state: spacing, alignment, readability, contrast. Where a browser-driving agent exists, verify flows with it — test that a click does what's intended.
