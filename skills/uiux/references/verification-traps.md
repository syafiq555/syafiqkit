# Verification traps: when a screenshot lies

A screenshot of your changes should prove the change works. Common traps where it silently doesn't.

## Stale bundle: the change didn't deploy

A dead dev server serves its last built bundle plausibly wrong, so a vanished control reads as broken conditional, a shifted layout reads as bad spacing, a failed selector reads as regression. Checking the server *process* fails here — it outlives its source file.

Instead, verify the bundle is present, fetchable and newer than your edits.

Measured 2026-09-10: live processes with the hot-reload gone, a three-week-old bundle served, an hour spent explaining a blank page with its own recent edits. If you are explaining something you SAW with something you WROTE and the two are not connected, suspect the bundle first.

## Full-page capture: fixed elements land in the wrong place

A full-page screenshot stitches the whole document into one image, but a `position: fixed` or `sticky` element (a bottom action bar, a pinned header, a sidebar) is drawn once at its viewport offset. In the composite it sits mid-page over whatever content happens to be there, so a correct sticky bar looks like it covers a form field, and a broken one looks the same. The composite can neither prove nor clear the defect.

Judge any fixed or sticky element from viewport-sized shots at the scroll positions a user actually sees (top and bottom at minimum), plus a measured overlap check: `getBoundingClientRect()` of the fixed element against the content it might cover, after scrolling to the end. Never call a composite defect "just a capture artefact" without that check, because the dismissal and the real defect produce the same picture. Measured 2026-10-12: a sticky order bar was waved off as a full-page artefact, the user flagged it, and only a viewport capture at both scroll ends settled it.

## E2E vs screenshot

Screenshots verify static state: spacing, alignment, readability, contrast. Where a browser-driving agent exists, verify flows with it — test that a click does what's intended.
