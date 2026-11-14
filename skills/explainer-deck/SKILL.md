---
name: explainer-deck
description: >
  Build a slide deck (Google Slides or .pptx) that explains how a system, process, product, contract or long document works to people in a live meeting, with every mechanism drawn as a picture beside a worked example, each one a person goes through preceded by that person's user journey, and all of it checked against its source. Fires on "make a deck to explain X", "show the user journey", "who does what, step by step", "slides for the team on how it works", "present this to the boss/client", "walkthrough deck", "turn this into Google Slides", "a presentation of the flow", "they can't understand it from words, make it visual", or a deck whose slides read as walls of text or step lists. NOT for a page one slow reader studies alone (that is `understanding-guide`), a promo or explainer video (`motion-clip`), a designed still image (`product-still`), an end-user guide (`user-manual`), or editing an existing .pptx someone else made (the generic pptx skill).
---

# Explainer deck

The audience is in the room, hearing you talk, and has never read the source. A deck that lists steps fails them twice: they read instead of listening, and a step name says nothing about the rule behind it. So every rule they must grasp gets **the thing itself drawn** (how a fee is cut, how a cart splits, what happens when parcels combine) beside **one worked example in real figures**, with your talking points in the speaker notes rather than on the slide. One running example (one order, one customer, one case) threads through every slide, so the figures stay comparable and the audience follows a story rather than a catalogue.

## 1. Research and outline before building

Look at how strong teams present this kind of thing before the first draft. The rules this skill already carries came from that research: one story, then the others (GOV.UK service demos); titles that state the point (assertion-evidence); narration in the notes, not on the slide (Mayer's redundancy principle, Duarte); things compared side by side (Tufte); a progress strip; open points shown where they arise, then gathered once.

Then write the slide-by-slide outline in the reply and get it approved: per slide, its type, its short heading, the one claim, and for a mechanism, which picture and which example. Ask the presenter how they want speaker notes (talking prompts or full script) and whether the audience gets the deck afterwards. A deck read later needs more on the slide.

## 2. Write the deck as data

The deck is one JSON spec. `scripts/build.js` checks it and draws it, so you write content and never layout. Read 📖 `references/spec.md` before writing one: it holds the slide types, the 10 picture kinds with their limits, and the source-checking fields. `example/deck.json` is a small complete spec to copy from.

The source checks run only when the spec lists `sources` (and `facts` or `workings` for figures); without them the build prints `UNCHECKED` and verifies nothing. Sources are text files cited by line, so convert a PDF, .docx or .xlsx with `doc-to-md` first and cite the converted file's lines. Vendor docs hosted on ReadMe usually serve each page as markdown when `.md` is added to its URL, and the site's `/llms.txt` lists every page, so `curl` them into the deck's sources folder instead of summarising them through a fetch.

What matters when choosing the content:

- **Pick the picture that shows the mechanism**, not the one easiest to fill. The kinds table in `references/spec.md` says what each shows; `flow` only when the order itself is the point.
- **Each mechanism a person goes through also gets a `journey` slide before it, never instead of it.** The mechanism slide shows the rule; the journey shows ONE named person's moments (a picture, what they do, where it happens), with everyone else's work under an "out of their sight" line, the shape journey maps and service blueprints use (NN/g: "Provide one point of view per map"). A swimlane of every actor's steps reads as "all I see is a bunch of boxes", and swapping the mechanism pictures out for journeys loses the logic the audience asked for. Alternative paths go on the second row (`under`), so two outcomes never read as one sequence. Two options the client has not chosen between are one journey for what gets built and an "If ... instead" slide for the other, not "Option A" and "Option B", which reads as a menu.
- **Headings are 3 to 5 words**, with the claim as the smaller line beneath (`sub`). A full-sentence heading reads as a paragraph and wraps to two lines.
- **Every label says what it is.** "In the source" and "Waiting on", not "The rule". Set `strip_label`, `waits_label` and `example_labels` to the audience's own words (e.g. "In the quotation", "Decision tracker").
- **Each example says where its figures come from**: `quoted` (from the source or the running case), `worked` (we calculated it from the source's rates; put the working in a `workings` file), or `made_up` (shows the mechanism, invents nothing the source leaves open). A figure we derived must never wear the "from the source" badge. The checker enforces this, and it was the defect review kept finding.
- **Never state a default, rate or day count the source does not set.** Where the source leaves it to someone, the slide says so and names it in `waits_on`.

Parallel writers (one agent per section) work well because the spec is data. Give each one `references/spec.md`, its section's sources, the running example's fixed facts, and a sanctioned empty answer for every field it might be tempted to fill with a guess. Then read every figure and `waits_on` it returns against the source. The quote check proves the quote exists, not that the claim beside it is right.

## 3. Build

```sh
npm install --prefix ~/.cache/explainer-deck pptxgenjs lucide-static @resvg/resvg-js     # once; keep all three in that package.json, or a later install removes the rest
NODE_PATH=~/.cache/explainer-deck/node_modules node <skill>/scripts/build.js deck.json out.pptx
```

`--check` validates without drawing. The build refuses anything over a limit in `references/spec.md` (word counts, flow length, parts that don't add up), an undeclared party, an em dash, a quote or figure the cited sources don't support, and a journey screen, tool, condition or icon that breaks its rules there. Fix the spec, never loosen the check. Each refusal stands for a slide that once broke on screen or misled someone.

A deck needing a slide type the script lacks (a custom end summary, an agenda per session) gets it added to the script as a new type or kind. Every slide built from the same code stays consistent, and a layout fix reaches every slide of that kind.

## 4. Check what Google drew

Google Slides lays a converted .pptx out itself (it ignores shrink-to-fit, substitutes fonts and breaks lines differently). The script sizes text itself for that reason, but only Google's render is evidence. 📖 `references/google-slides.md` covers upload, re-upload at the same link, export and what to look for. Open every slide image you changed, not a sample. Overflow, overlaps and words broken mid-way pass every check above and show only there.

## 5. Hand it over

Give the link (Google Slides) or the file, and check the link opens for the audience before it goes out: a deck uploaded with a sign-in is private to that account until shared, so ask who should see it (the team's domain, named people, or anyone with the link), then set it with the gsheets MCP's `drive_file_share` on the deck's id (it covers files that sign-in uploaded) and, for anyone-with-the-link, check it opens signed out (`curl -sL -o /dev/null -w '%{http_code} %{url_effective}'` stays on the deck, not a sign-in page). Without that server, hand the user the audience to set in Drive's Share dialog. Anyone-with-link reaches whoever the link is forwarded to, which matters when the deck carries internal notes. Speaker notes travel inside the file, so a deck going to a client is rebuilt with `"notes_for": "client"` (📖 `references/spec.md`), and the built notes are grepped for the team's cue words before it goes out. Write cues as a prefix before the fact ("Raise row 7: a refund after payout comes off the next payout"), since the client build cuts the cue and keeps the fact; dropping whole cue lines instead once lost the facts they carried. Internal session agenda slides and lines like "the page runs on my laptop" are removed from the spec, not filtered. Say which slides use made-up numbers, and list the open points the deck raises. Keep the spec and sources together in the project so the next revision is an edit and a rebuild, not a redraw.
