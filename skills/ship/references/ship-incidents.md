# Ship incidents behind the rules in SKILL.md

Read when a rule's reason is needed, not on every ship. Each section names the rule it supports.

## Review gate for code written after /done (2026-11-10)

Three rounds of 2C2P fixes and a new customer page shipped to staging with "no review agent read them" in the summary. The review run afterwards found an order-existence leak in the new redirect, a rate cap any visitor could exhaust, a stale outcome that could send a customer to pay twice, and wrong customer copy.

## Peer commits riding along (2026-10-10)

Four peer sessions' commits shipped with only a caveat in the Ship Summary. The review run afterwards found that a unit-detach fix had become a silent loss of rent, and a wrong changelog line, so the fixes went out as a second production release the same day.

## Version drift (more than ten recorded drifts)

The version-bump instruction has existed in some form through more than ten recorded drifts. Each was caught by a person opening both files. Every file is independently valid JSON and the plugin installs, so the mismatch surfaces only when someone later reads the pair. A printed list makes the comparison the deliverable.

## Clean report over a manual step (Step 4a)

A ship once reported clean over a standing manual step that a task doc recorded and the diff did not touch. A breached obligation sits in production looking like nothing happened.

## Release note missing a live change (2026-10-23)

A production push was switched on by an `.env` change. The ship reported "no user-facing change", and the user asked why no release note had been added. Docs-only commits in the range hid the real release, which happened on the server.

## Stale tracker format (Step 5 item 5)

A search for the documented tracker name returned a card weeks old, and the draft matched a retired format. Titles drift, so list the newest few by date and read the top one.

## Hand-written note skipped the skill (13/11/2026)

A hand-written release note in its remembered syntax skipped the formatting skill's first step. It came out shaped unlike the sender's other release posts that day.

## Release note without images (15/11/2026)

A release note describing a new screen in words only was posted, though the session had already rendered it in a design-review capture. The user had to ask "along with some images" afterwards.

## Captures withheld wholesale (15/11/2026)

Every capture was withheld on the reasoning that local data is real, so no images went. The user had to ask how to send some, and four of them showed the seeded demo agency. Judge each capture by its own content.

## Release note only on the clipboard (15/11/2026)

A ship ended on "copied to your clipboard" with the team's Chat space left unposted. The user asked "U didnt post to the geoup ?" afterwards.

## CI failure left at "suggest a rerun"

A staging deploy failed because the server lacked a PHP extension the new code used. The failure surfaced only when the user asked why the deploy was taking so long; a rerun would have failed the same way. Reading the failed log names the cause in one call.

## Live webhook missing after a go-live

A store switched its card gateway from test to live mode. The live keys went in, but the live-mode webhook endpoint was never created, because the test-mode one had worked all through UAT. The client found it missing. Live and test mode are separate in the provider's dashboard; the fix was creating the live endpoint and confirming it listed and enabled.
