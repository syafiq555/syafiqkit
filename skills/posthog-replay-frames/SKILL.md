---
name: posthog-replay-frames
description: Find out what one real user actually did and saw in a PostHog session, from their raw events and screenshots of the replay at the moments that matter. Use when someone asks "what did this user see", "check the replay", "why did this user drop off", "where did they get stuck", forwards a PostHog AI session summary or a shared replay link (us.posthog.com/shared/...), or a sign-up or customer is reported stuck. Works for any product sending events to PostHog. NOT for a product-wide audit across many users (funnels, rage clicks across the app): in Autorentic that is the project skill posthog-uiux-intelligence. NOT for screenshots of your own app's pages (a Playwright spec or uiux does that).
---

# PostHog Replay Frames

One person's session answers "what happened to them" better than any summary of it, and the answer lives in two places: the event stream says what they did, the replay says what they saw. Read both before relaying anything.

## A summary is a reading, not the record

PostHog AI's session summary, a teammate's paraphrase, or your own first impression all compress the session, and compression drops events. Measured 18/11/2026 (Autorentic): the AI summary said a new user "never created a property" and spent seven minutes stuck on the form; the raw events held `property_created` at 20:04, and the real exit was a tap on an upsell button two steps later. A fix built on the summary would have redesigned the wrong screen. So the events come first, and the summary is a claim to check against them.

## 1. Pull the person's events

Through the PostHog MCP's `execute-sql`, all events for the person in the window, oldest first:

```sql
SELECT toTimeZone(timestamp, '<project tz>') AS t, event,
       properties.$pathname AS path, properties.$el_text AS el_text,
       properties.$current_url AS url, properties.$session_id AS sid
FROM events
WHERE person.properties.email = '<email>'   -- or distinct_id = '<id>'
  AND timestamp > now() - INTERVAL 2 DAY
ORDER BY timestamp
LIMIT 500
```

Read it as a story: pages in order, what was tapped (`$autocapture` with `$el_text`), the product's own events (created, submitted, paid), and `$dead_click` / `$dead_swipe` / `$rageclick`. Dead taps on a phone are weak alone (a scroll that started on text counts); they matter when they cluster on one control. The last few events before the session ends are usually the answer.

Two traps. Switching the MCP to another project answers "Switch not applied" with a `conversation_id` the first time; repeat the call passing it, and keep passing it, or later calls land back on the default project. `$elements_chain` may not exist in a project's taxonomy, so lean on `$el_text` and the path.

## 2. Turn moments into replay offsets

`session-recording-get` with the session id gives `start_time`, duration and counts, never frames. Each moment's offset is its event time minus `start_time`, in seconds. Pick the moments the events point at: just before the exit, any cluster of dead taps, the step where time went.

## 3. Screenshot the replay at those offsets

The MCP cannot render frames. A shared replay link can (`https://us.posthog.com/shared/<token>`, made from the replay's Share menu; a teammate often forwards one), and it accepts `?t=<seconds>`. Run the bundled script with a project's Playwright:

```bash
node <skill-dir>/scripts/capture.mjs --url "<shared link>" --t 272,842,852 \
  --out /tmp/replay-frames --playwright <project>/node_modules/playwright \
  --clip 300,60,500,940
```

It loads each offset, waits for the player to stop buffering, shoots, and packs frames into `sheet-NN.png` with ImageMagick's `montage` when present. Behaviour worth knowing: the page never reaches `networkidle`, so it waits on `load`; the player starts playing from `t`, so the shot lands a second or two after it (ask for a moment slightly early); typed inputs show masked; `--clip` crops to the phone frame when the session was on mobile (open one full shot first to find it). No shared link and no way to make one: say so, and work from events alone rather than guessing the screen.

PostHog's own MP4/GIF export lives in the replay UI only, with a monthly quota, so it suits a clip a person will watch, not an agent checking moments. The snapshots API (`session_recording:read`) plus `rrweb` / `rrvideo` can render offline when no share link is allowed; it is heavier and PostHog marks that API as internal.

## 4. Look, then report

Open every frame. Then report in this order: what the user did (the event story with times), what they saw at the moments that decided it (the frames), and where that differs from the summary or report you were handed, quoting the line it gets wrong. A finding about the product (a button that strands people, a step that eats minutes) goes to whoever owns the fix; the evidence is the times and frames, not the summary.

The Autorentic run that produced this skill is recorded in that repo's `.claude-companions/local/references/local-integrations-detail.md#posthog-replay-frames`.
