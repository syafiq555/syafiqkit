# Reviewing the contact sheet through four lenses {#lenses}

One read of a contact sheet catches whatever strikes the reader first and misses the rest. Four passes, each asking only its own questions, catch more. The split follows Every's product-launch-video skill, whose README describes "4 parallel critics check design, readability, pacing, and brand consistency" (github.com/everyinc/product-launch-video, read 2026-10-21; an author's claim, with no measured outcome).

Give each pass the sheets for every size, the brief, and one lens below. Where the session can spawn agents, run the four in parallel and have each report its three worst problems with the frame time. Otherwise make four passes yourself and write down each pass's findings before starting the next. Then merge the lists, fix the worst three overall and re-render the sheet.

## Design {#design}
- Do captions, pictures and subtitles collide or crowd each other, in each size? A clean vertical sheet says nothing about the square one.
- Is there one clear focal point per frame, or do the text and the picture compete?
- Does the camera push in far enough that the UI the caption talks about is the biggest thing on screen?
- Could this film belong to another company with the logo swapped? (the brief's one line on this)

## Readability {#readability}
- Is the hook readable in the first two seconds, at the size someone sees it on a phone?
- Is text inside the pictures legible at that size, not just the captions?
- Does every caption stand out against what's behind it, including a moving or generated background?
- Does `render.mjs check` list text that is on screen too briefly, or a caption shrinking to clear the picture? Fix those first; the sheet can't show time.
- Does the camera hold still while a caption or a screen is being read? A push or slide during the read makes both the caption and the UI hard to follow; move between beats, not inside one. A client who calls the clip hard to read usually means this (2026-10-27: a storefront clip was redone with a voice-over and 3.5 to 5 s still holds per screen).

## Pacing {#pacing}
- Does something new happen every two to four seconds?
- Is the product on screen by 3 s (10 s for Google Play)? `render.mjs check` reports the time for the story as it stands now.
- Does the voice, where there is one, leave each caption up long enough, and does the music hit where the picture changes?
- Is the ending short: a logo and a call to action, not a recap?

## Brand {#brand}
- Are the colours, fonts and logo the brand's own, with nothing the brief bans?
- Is every claim on screen true, and does the number carry its source?
- Does each line speak from the user's side ("Shop by product, or by what you need"), not to the client as the approver ("your brief", "as you asked")? A showcase of a client's own site still speaks as their shopper; proof of what the brief asked for belongs in the handover notes. Measured 2026-10-27: a storefront script written as a checklist to the client read as "weird" and was rewritten after research into agency case studies, Shopify theme pages and brands' own launch posts, which narrate from the shopper's side.
- Is the call to action written as it will read after launch, with no date that will go stale?
- Does any frame show something private (real emails, phone numbers, notifications, other tabs)?
