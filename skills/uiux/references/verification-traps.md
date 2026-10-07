# Verification traps: when a screenshot lies

A screenshot of your changes should prove the change works. Common traps where it silently doesn't.

## Stale bundle: the change didn't deploy

A dead dev server serves its last built bundle plausibly wrong, so a vanished control reads as broken conditional, a shifted layout reads as bad spacing, a failed selector reads as regression. Checking the server *process* fails here — it outlives its source file.

Instead, verify the bundle is present, fetchable and newer than your edits.

Measured 2026-09-10: live processes with the hot-reload gone, a three-week-old bundle served, an hour spent explaining a blank page with its own recent edits. If you are explaining something you SAW with something you WROTE and the two are not connected, suspect the bundle first.

## E2E vs screenshot

Screenshots verify static state: spacing, alignment, readability, contrast. Where a browser-driving agent exists, verify flows with it — test that a click does what's intended.
